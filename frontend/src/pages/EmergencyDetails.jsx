import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axiosClient from '../utils/axiosclient';
import { useSelector } from 'react-redux';
import {
  Card,
  CardHeader,
  CardBody,
  Divider,
  Spinner,
  Button,
} from '@heroui/react';

// --- Map Imports ---
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { decodePolyline } from '../utils/polyline';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- NEW: Import the ChatBox component ---
import ChatBox from '../components/ChatBox';

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

const EmergencyDetails = () => {
  const { emergencyId } = useParams();
  const currentUserId = useSelector((state) => state.auth.user?._id);

  // --- State ---
  const [emergency, setEmergency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [responding, setResponding] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [directionsError, setDirectionsError] = useState('');
  
  const watchIdRef = useRef(null);

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

  // --- useEffect to handle starting/stopping tracking ---
  useEffect(() => {
    if (isTracking) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newUserLocation = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newUserLocation);
          setDirectionsError('');
        },
        (err) => {
          console.error("Error watching user location:", err);
          setDirectionsError("Could not get your location. Please enable location services.");
          setIsTracking(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isTracking]);

  // --- UPDATED useEffect to fetch directions from OSRM ---
  useEffect(() => {
    if (isTracking && userLocation && emergency?.location?.coordinates) {
      const fetchDirections = async () => {
        try {
          const [userLat, userLng] = userLocation; // Browser gives [lat, lng]
          // --- Assume API gives [lng, lat] ---
          const [emLng, emLat] = emergency.location.coordinates;

          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${emLng},${emLat}?overview=full&geometries=polyline`;
          
          const response = await axios.get(osrmUrl);
          
          if (response.data.code !== 'Ok') {
            throw new Error(`OSRM Error: ${response.data.message || 'Could not fetch directions'}`);
          }
          
          const decodedPoints = decodePolyline(response.data.routes[0].geometry);
          setRoutePoints(decodedPoints);

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

  if (loading) return <Spinner />;

  // --- FIX IS HERE: Correctly format coordinates for the map ---
  // Assume API gives [lng, lat], so we swap it for react-leaflet which needs [lat, lng]
  const emergencyLatLng = emergency?.location?.coordinates 
    ? [emergency.location.coordinates[1], emergency.location.coordinates[0]] 
    : null;

  // Create bounds to fit both markers on the map
  const bounds = (userLocation && emergencyLatLng) 
    ? [userLocation, emergencyLatLng] 
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <h1>{emergency?.emergencyType}</h1>
        </CardHeader>
        <Divider />
        <CardBody>
          {/* ... (Your existing responders list) ... */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Responders</h3>
            {emergency.responders && emergency.responders.length > 0 ? (
              <ul className="space-y-4">
                {emergency.responders.map((responder, idx) => (
                  <li key={idx} className="p-4 bg-gray-100 rounded-md">
                    <div className="font-medium text-gray-800">{responder.userId?.name || 'Unknown Responder'}</div>
                    <div className="text-sm capitalize text-gray-600">{responder.status}</div>
                    {responder.respondedAt && (
                      <div className="text-sm text-gray-500 mt-1">
                        🕒 Responded At: {new Date(responder.respondedAt).toLocaleString()}
                      </div>
                    )}
                    {responder.arrivedAt && (
                      <div className="text-sm text-gray-500">
                        ✅ Arrived At: {new Date(responder.arrivedAt).toLocaleString()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No responders yet.</p>
            )}

            {!hasResponded && (
              <div className="mt-6">
                <Button onClick={handleRespond} isLoading={responding}>
                  Respond to Emergency
                </Button>
              </div>
            )}

            {hasResponded && (
              <p className="mt-4 text-green-600 font-semibold">You have responded to this emergency.</p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* --- NEW: Chat Section --- */}
      {/* Show chat only if the user is the creator or a responder */}
      {(emergency?.reporter?._id === currentUserId || hasResponded) && (
          <Card className="mt-8">
              <CardHeader>
                  <h2>Coordinate with Responders</h2>
              </CardHeader>
              <Divider />
              <CardBody>
                  <p className="text-sm text-gray-600 mb-4">
                      Use this chat to communicate important details with the responders.
                  </p>
                  <ChatBox emergencyId={emergencyId} />
              </CardBody>
          </Card>
      )}

      {/* --- Map Section --- */}
      <Card className="mt-8">
        <CardHeader>
          <h2>Live Directions to Emergency (Powered by OpenStreetMap)</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <Button 
            color={isTracking ? "danger" : "primary"}
            onClick={() => setIsTracking(!isTracking)}
            className="mb-4"
          >
            {isTracking ? 'Stop Live Tracking' : 'Start Live Tracking'}
          </Button>

          {directionsError && <p className="text-red-600 mb-4">{directionsError}</p>}
          {!isTracking && <p className="text-gray-500 mb-4">Click "Start Live Tracking" to begin.</p>}

          {emergencyLatLng ? (
            <MapContainer 
              center={userLocation || emergencyLatLng} // Center on user if tracking, else emergency
              zoom={13} 
              style={{ height: '500px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* --- FIX IS HERE: Use the corrected coordinates --- */}
              <Marker position={emergencyLatLng}>
                <Popup>Emergency Location: {emergency?.emergencyType}</Popup>
              </Marker>

              {userLocation && (
                <Marker position={userLocation}>
                  <Popup>Your Current Location</Popup>
                </Marker>
              )}

              {routePoints.length > 0 && (
                <Polyline
                  positions={routePoints}
                  color="blue"
                  weight={4}
                  opacity={0.7}
                />
              )}

              {/* Fit map to show both markers when available */}
              <FitBounds bounds={bounds} />
            </MapContainer>
          ) : (
            <p className="text-gray-500">Emergency location not available.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default EmergencyDetails;