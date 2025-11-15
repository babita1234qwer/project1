
import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import axiosClient from '../utils/axiosclient';
import { useSelector } from 'react-redux';
import {
Card,
CardHeader,
CardBody,
Divider,
Spinner,
Button,
Chip,
Avatar,
Progress,
} from '@heroui/react';


import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { decodePolyline } from '../utils/polyline';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


import ChatBox from '../components/ChatBox';
const API_URL = import.meta.env.VITE_API_URL;


// --- Fix for default markers ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Component to fit map bounds to show both markers
const FitBounds = ({ bounds }) => {
const map = useMap();
if (bounds) {
map.fitBounds(bounds, { padding: [50, 50] });
}
return null;
};

// Component to update map center when user location changes
const UpdateMapCenter = ({ center }) => {
const map = useMap();
if (center) {
map.setView(center, 16); // Higher zoom for better tracking
}
return null;
};

const EmergencyDetails = () => {
const { emergencyId } = useParams();
const currentUserId = useSelector((state) => state.auth.user?._id);

const [emergency, setEmergency] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [responding, setResponding] = useState(false);
const [userLocation, setUserLocation] = useState(null);
const [routePoints, setRoutePoints] = useState([]);
const [isTracking, setIsTracking] = useState(false);
const [directionsError, setDirectionsError] = useState('');
const [locationPermission, setLocationPermission] = useState('prompt');
const [locationLoading, setLocationLoading] = useState(false);
const [locationDebug, setLocationDebug] = useState('');
const [trackingStats, setTrackingStats] = useState({ updates: 0, lastUpdate: null });

const watchIdRef = useRef(null);
const mapRef = useRef(null);

// --- useEffect to fetch emergency details ---
useEffect(() => {
const fetchEmergencyDetails = async () => {
try {
const res = await axiosClient.get(`/emergencies/${emergencyId}`);
setEmergency(res.data.data);
} catch (err) {
setError(err?.response?.data?.message || 'Error fetching emergency');
} finally {
setLoading(false);
}
};
fetchEmergencyDetails();
}, [emergencyId]);

// --- Function to get current position with better error handling ---
const getCurrentPosition = useCallback(() => {
return new Promise((resolve, reject) => {
if (!navigator.geolocation) {
reject(new Error('Geolocation is not supported by your browser'));
return;
}

console.log('Getting current position...');
setLocationDebug('Requesting location access...');

navigator.geolocation.getCurrentPosition(
(position) => {
console.log('Position received:', position);
const location = [position.coords.latitude, position.coords.longitude];
setLocationDebug(`Location received: ${location[0].toFixed(6)}, ${location[1].toFixed(6)}`);
resolve(location);
},
(error) => {
console.error('Geolocation error:', error);
let errorMessage = 'Location error: ';

switch(error.code) {
case error.PERMISSION_DENIED:
errorMessage += 'Permission denied. Please allow location access.';
setLocationPermission('denied');
break;
case error.POSITION_UNAVAILABLE:
errorMessage += 'Location unavailable.';
break;
case error.TIMEOUT:
errorMessage += 'Location request timed out.';
break;
default:
errorMessage += error.message;
break;
}

setLocationDebug(errorMessage);
reject(new Error(errorMessage));
},
{
enableHighAccuracy: true,
timeout: 15000, // Increased timeout
maximumAge: 0
}
);
});
}, []);

// --- Function to start tracking ---
const startTracking = useCallback(async () => {
try {
setLocationLoading(true);
setLocationDebug('Initializing tracking...');

// Check if geolocation is supported
if (!navigator.geolocation) {
throw new Error('Geolocation is not supported by your browser');
}

// Get initial position
const initialPosition = await getCurrentPosition();
setUserLocation(initialPosition);
setDirectionsError('');
setTrackingStats({ updates: 1, lastUpdate: new Date() });

// Start watching position
setLocationDebug('Starting position watch...');
watchIdRef.current = navigator.geolocation.watchPosition(
(position) => {
console.log('Position update:', position);
const newUserLocation = [position.coords.latitude, position.coords.longitude];
setUserLocation(newUserLocation);
setDirectionsError('');
setTrackingStats(prev => ({
updates: prev.updates + 1,
lastUpdate: new Date()
}));
setLocationDebug(`Update #${trackingStats.updates + 1}: ${newUserLocation[0].toFixed(6)}, ${newUserLocation[1].toFixed(6)}`);
},
(err) => {
console.error("Error watching user location:", err);
let errorMessage = "Location tracking error: ";

if (err.code === 1) { 
errorMessage = "Location permission denied. Please allow location access in your browser settings.";
setLocationPermission('denied');
} else if (err.code === 2) { 
errorMessage = "Location information is unavailable.";
} else if (err.code === 3) { 
errorMessage = "Location request timed out.";
}

setLocationDebug(errorMessage);
setDirectionsError(errorMessage);
setIsTracking(false);
},
{
enableHighAccuracy: true,
timeout: 10000,
maximumAge: 0,
distanceFilter: 5 
}
);

setIsTracking(true);
setLocationPermission('granted');
setLocationDebug('Tracking started successfully');
} catch (err) {
console.error("Error starting tracking:", err);
const errorMessage = err.message || 'Failed to get your location';
setLocationDebug(`Tracking failed: ${errorMessage}`);
setDirectionsError(errorMessage);
setLocationPermission('denied');
} finally {
setLocationLoading(false);
}
}, [getCurrentPosition, trackingStats.updates]);


const stopTracking = useCallback(() => {
if (watchIdRef.current) {
navigator.geolocation.clearWatch(watchIdRef.current);
watchIdRef.current = null;
}
setIsTracking(false);
setLocationDebug('Tracking stopped');
}, []);


useEffect(() => {
return () => {
if (watchIdRef.current) {
navigator.geolocation.clearWatch(watchIdRef.current);
}
};
}, []);

// --- useEffect to fetch directions from OSRM ---
useEffect(() => {
if (isTracking && userLocation && emergency?.location?.coordinates) {
const fetchDirections = async () => {
try {
const [userLat, userLng] = userLocation;
const [emLng, emLat] = emergency.location.coordinates;

const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${emLng},${emLat}?overview=full&geometries=polyline`;

const response = await axios.get(osrmUrl);

if (response.data.code !== 'Ok') {
throw new Error(`OSRM Error: ${response.data.message || 'Could not fetch directions'}`);
}

const decodedPoints = decodePolyline(response.data.routes[0].geometry);
setRoutePoints(decodedPoints);
setLocationDebug(`Route updated with ${decodedPoints.length} points`);

} catch (err) {
console.error("Failed to fetch directions:", err);
setDirectionsError(err.message || 'An unknown error occurred while fetching directions.');
}
};

fetchDirections();
}
}, [userLocation, isTracking, emergency]);


const hasResponded = emergency?.responders?.some((responder) =>
responder.userId?._id?.toString() === currentUserId?.toString()
);

const handleRespond = async () => {
try {
setResponding(true);
await axiosClient.post(`/emergencies/${emergencyId}/respond`);
const res = await axiosClient.get(`/emergencies/${emergencyId}`);
setEmergency(res.data.data);
} catch (err) {
setError(err?.response?.data?.message || 'Failed to respond');
} finally {
setResponding(false);
}
};

if (loading) return (
<div className="flex justify-center items-center h-screen">
<Spinner size="lg" color="secondary" />
</div>
);

// --- Correctly format coordinates for the map ---
const emergencyLatLng = emergency?.location?.coordinates
? [emergency.location.coordinates[1], emergency.location.coordinates[0]]
: null;


const bounds = (userLocation && emergencyLatLng)
? [userLocation, emergencyLatLng]
: null;


const getEmergencyIcon = (type) => {
const icons = {
medical: '🚑',
fire: '🚒',
accident: '🚗',
crime: '👮',
natural: '🌪️',
other: '⚠️',
};
return icons[type] || '🚨';
};

// Get status color
const getStatusColor = (status) => {
switch (status) {
case 'active': return 'danger';
case 'responding': return 'warning';
case 'resolved': return 'success';
default: return 'default';
}
};

return (
<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
<div className="container mx-auto px-4 py-8">
{/* Emergency Details Card */}
<Card className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-md border border-purple-400/50 mb-8 shadow-2xl">
<CardHeader className="pb-0 pt-6 px-6 flex-col items-start">
<div className="flex items-center gap-3 w-full justify-between">
<div className="flex items-center gap-3">
<div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-2xl shadow-lg">
{getEmergencyIcon(emergency?.emergencyType)}
</div>
<div>
<h1 className="text-3xl font-bold text-white">{emergency?.emergencyType?.toUpperCase()}</h1>
<div className="flex items-center gap-2 mt-1">
<Chip color={getStatusColor(emergency?.status)} size="sm" variant="flat">
{emergency?.status}
</Chip>
<span className="text-purple-200 text-sm">
Reported: {new Date(emergency?.createdAt).toLocaleString()}
</span>
</div>
</div>
</div>
<Avatar src="https://i.pravatar.cc/150?u=emergency" size="lg" />
</div>
</CardHeader>
<Divider className="bg-purple-400/30" />
<CardBody className="px-6 py-4">
<p className="text-white text-lg mb-4">{emergency?.description}</p>

<div className="flex items-center gap-2 text-purple-200 mb-4">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>
<span>{emergency?.location?.address || 'Location not specified'}</span>
</div>

<div className="flex items-center gap-2 text-purple-200">
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
</svg>
<span>Reported by: {emergency?.createdBy?.name || 'Anonymous'}</span>
</div>
</CardBody>
</Card>

{/* Responders Card */}
<Card className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-md border border-indigo-400/30 shadow-2xl mb-8">
<CardHeader className="pb-0 pt-6 px-6">
<h2 className="text-2xl font-bold text-white">Responders</h2>
</CardHeader>
<Divider className="bg-indigo-400/30" />
<CardBody className="px-6 py-4">
{emergency.responders && emergency.responders.length > 0 ? (
<div className="space-y-4">
{emergency.responders.map((responder, idx) => (
<div key={idx} className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 rounded-lg p-4 border border-indigo-400/20">
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<Avatar src={`https://i.pravatar.cc/150?u=${responder.userId?._id}`} size="md" />
<div>
<div className="font-medium text-white">{responder.userId?.name || 'Unknown Responder'}</div>
<div className="text-sm capitalize text-purple-200">{responder.status}</div>
</div>
</div>
<Chip color={getStatusColor(responder.status)} size="sm" variant="flat">
{responder.status}
</Chip>
</div>
<div className="mt-3 space-y-1">
{responder.respondedAt && (
<div className="text-sm text-purple-300 flex items-center gap-2">
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
Responded: {new Date(responder.respondedAt).toLocaleString()}
</div>
)}
{responder.arrivedAt && (
<div className="text-sm text-purple-300 flex items-center gap-2">
<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
Arrived: {new Date(responder.arrivedAt).toLocaleString()}
</div>
)}
</div>
</div>
))}
</div>
) : (
<div className="text-center py-8">
<div className="text-purple-300 mb-4">No responders yet.</div>
<Progress
value={(emergency.responders?.length || 0) / 5 * 100}
color="secondary"
className="max-w-md mx-auto"
/>
<p className="text-purple-400 text-sm mt-2">Help is needed</p>
</div>
)}

{!hasResponded && (
<div className="mt-6 flex justify-center">
<Button
onClick={handleRespond}
isLoading={responding}
color="secondary"
size="lg"
className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600"
>
Respond to Emergency
</Button>
</div>
)}

{hasResponded && (
<div className="mt-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/50 rounded-lg p-4 text-center">
<p className="text-green-400 font-semibold">You have responded to this emergency.</p>
</div>
)}
</CardBody>
</Card>

{/* Map Section */}
<Card className="bg-gradient-to-r from-teal-600/20 to-cyan-600/20 backdrop-blur-md border border-teal-400/30 shadow-2xl">
<CardHeader className="pb-0 pt-6 px-6">
<h2 className="text-2xl font-bold text-white">Live Directions to Emergency</h2>
<p className="text-teal-300 text-sm">Powered by OpenStreetMap</p>
</CardHeader>
<Divider className="bg-teal-400/30" />
<CardBody className="px-6 py-4">
<div className="mb-4 flex justify-between items-center">
<Button
color={isTracking ? "danger" : "secondary"}
onClick={isTracking ? stopTracking : startTracking}
isLoading={locationLoading}
className="font-semibold bg-gradient-to-r from-teal-600 to-cyan-600"
>
{isTracking ? 'Stop Live Tracking' : 'Start Live Tracking'}
</Button>

{isTracking && (
<div className="flex items-center gap-2">
<div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse"></div>
<span className="text-teal-300 text-sm">
Tracking Active ({trackingStats.updates} updates)
</span>
</div>
)}
</div>

{/* Debug Information */}
{locationDebug && (
<div className="bg-gradient-to-r from-yellow-600/20 to-amber-600/20 border border-yellow-400/50 rounded-lg p-3 mb-4">
<p className="text-yellow-400 text-sm">{locationDebug}</p>
{trackingStats.lastUpdate && (
<p className="text-yellow-300 text-xs mt-1">
Last update: {trackingStats.lastUpdate.toLocaleTimeString()}
</p>
)}
</div>
)}

{directionsError && (
<div className="bg-gradient-to-r from-red-600/20 to-rose-600/20 border border-red-400/50 rounded-lg p-3 mb-4">
<p className="text-red-400">{directionsError}</p>
</div>
)}

{!isTracking && !directionsError && !locationDebug && (
<div className="bg-gradient-to-r from-teal-600/20 to-cyan-600/20 border border-teal-400/50 rounded-lg p-3 mb-4">
<p className="text-teal-400">Click "Start Live Tracking" to begin navigation from your current device location.</p>
<p className="text-teal-300 text-xs mt-1">Make sure to allow location access when prompted.</p>
</div>
)}

{/* Current Location Display */}
{userLocation && (
<div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-400/50 rounded-lg p-3 mb-4">
<p className="text-green-400 text-sm">
Your Location: {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
</p>
</div>
)}

{emergencyLatLng ? (
<div className="rounded-lg overflow-hidden border border-teal-400/30">
<MapContainer
center={userLocation || emergencyLatLng}
zoom={16}
style={{ height: '500px', width: '100%' }}
ref={mapRef}
>
<TileLayer
attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
/>

<Marker position={emergencyLatLng}>
<Popup>
<div className="text-center">
<div className="font-bold">{emergency?.emergencyType?.toUpperCase()}</div>
<div>{emergency?.description}</div>
</div>
</Popup>
</Marker>

{userLocation && (
<Marker position={userLocation}>
<Popup>
<div className="text-center">
<div className="font-bold">Your Location</div>
<div className="text-xs">
{userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
</div>
</div>
</Popup>
</Marker>
)}

{routePoints.length > 0 && (
<Polyline
positions={routePoints}
color="#14b8a6" // Teal color
weight={4}
opacity={0.7}
/>
)}

<FitBounds bounds={bounds} />
<UpdateMapCenter center={userLocation} />
</MapContainer>
</div>
) : (
<div className="text-center py-8">
<p className="text-teal-300">Emergency location not available.</p>
</div>
)}
</CardBody>
</Card>
</div>

{/* ChatBox - Always visible for all users */}
<ChatBox emergencyId={emergencyId} />
</div>
);
};

export default EmergencyDetails; 