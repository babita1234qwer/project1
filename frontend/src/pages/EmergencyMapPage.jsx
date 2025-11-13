import { useState, useEffect } from 'react';
import EmergencyMap from './EmergencyMap';
import {
Card,
CardBody,
CardHeader,
Divider,
Spinner,
Button
} from "@heroui/react";
import axiosClient from '../utils/axiosclient';
const API_URL = import.meta.env.VITE_API_URL;


// Helper function to get an icon for each emergency type
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

function EmergencyMapPage() {
const [emergencies, setEmergencies] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [filter, setFilter] = useState('all');

useEffect(() => {
const fetchEmergencies = async () => {
try {
setLoading(true);
const response = await axiosClient.get('/emergencies/all');
setEmergencies(response.data.data || []);
} catch (err) {
setError(err.message || 'Error connecting to server');
console.error('Error:', err);
} finally {
setLoading(false);
}
};

fetchEmergencies();
}, []);

const filteredEmergencies = filter === 'all'
? emergencies
: emergencies.filter(e => e.emergencyType === filter);


const getEmergencyCardGradient = (type) => {
const gradients = {
medical: 'bg-gradient-to-br from-rose-900/40 to-pink-900/40 border-rose-700/50',
fire: 'bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-700/50',
accident: 'bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-amber-700/50',
crime: 'bg-gradient-to-br from-slate-900/50 to-zinc-900/50 border-slate-700/60',
natural: 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-emerald-700/50',
other: 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-700/50',
};
return gradients[type] || 'bg-gradient-to-br from-gray-800/40 to-gray-900/40 border-gray-700/50';
};

return (
<div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
<div className="container mx-auto px-4 py-8">
{/* Main Map Card with Enhanced Background */}
<Card className="w-full mb-8 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm border border-indigo-400/30 shadow-2xl">
<CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-gray-200 bg-gradient-to-r from-indigo-800/50 to-purple-800/50">
<div>
<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Emergency Map</h1>
<p className="text-purple-200">View active emergencies on the map</p>
</div>
<div className="flex flex-wrap gap-2">
<Button
size="sm"
variant={filter === 'all' ? 'solid' : 'flat'}
onClick={() => setFilter('all')}
className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
>
All
</Button>
<Button
size="sm"
variant={filter === 'medical' ? 'solid' : 'flat'}
onClick={() => setFilter('medical')}
className="bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
>
Medical
</Button>
<Button
size="sm"
variant={filter === 'fire' ? 'solid' : 'flat'}
onClick={() => setFilter('fire')}
className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
>
Fire
</Button>
<Button
size="sm"
variant={filter === 'accident' ? 'solid' : 'flat'}
onClick={() => setFilter('accident')}
className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
>
Accident
</Button>
<Button
size="sm"
variant={filter === 'crime' ? 'solid' : 'flat'}
onClick={() => setFilter('crime')}
className="bg-gradient-to-r from-slate-600 to-zinc-600 hover:from-slate-700 hover:to-zinc-700"
>
Crime
</Button>
</div>
</CardHeader>
<Divider className="bg-indigo-400/30" />
<CardBody className="bg-gradient-to-br from-indigo-800/30 to-purple-800/30">
{loading ? (
<div className="flex justify-center items-center h-96">
<Spinner size="lg" color="secondary" />
</div>
) : error ? (
<div className="bg-gradient-to-r from-red-600/30 to-rose-600/30 text-red-300 p-4 rounded-lg border border-red-400/50">
<p>{error}</p>
<p className="text-sm mt-2">Please check your internet connection and try again.</p>
</div>
) : (
<div>
<div className="mb-4">
<p className="text-purple-200">Showing {filteredEmergencies.length} emergencies</p>
</div>
<EmergencyMap emergencies={filteredEmergencies} />
</div>
)}
</CardBody>
</Card>

{filteredEmergencies.length > 0 && (
<Card className="w-full bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm border border-indigo-400/30 shadow-2xl">
<CardHeader className="bg-gradient-to-r from-indigo-800/50 to-purple-800/50">
<h2 className="text-xl font-semibold text-white">Emergency List</h2>
</CardHeader>
<Divider className="bg-indigo-400/30" />
<CardBody className="bg-gradient-to-br from-indigo-800/30 to-purple-800/30">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
{filteredEmergencies.map(emergency => (
<Card
key={emergency._id}
isPressable
shadow="md"
// Enhanced background with gradient based on emergency type
className={`${getEmergencyCardGradient(emergency.emergencyType)} backdrop-blur-sm hover:scale-105 hover:shadow-xl transition-all duration-300 border`}
href={`/emergency/${emergency._id}`}
>
<CardBody className="p-4">
{/* Header with Icon, Type, and Status */}
<div className="flex justify-between items-start mb-3">
<div className="flex items-center gap-2">
<span className="text-2xl">{getEmergencyIcon(emergency.emergencyType)}</span>
<h3 className="font-bold text-lg capitalize text-white">{emergency.emergencyType}</h3>
</div>
<span className={`px-2 py-1 rounded-full text-xs font-semibold ${
emergency.status === 'active'
? 'bg-gradient-to-r from-red-600 to-rose-600 text-white'
: emergency.status === 'responding'
? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white'
: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
}`}>
{emergency.status}
</span>
</div>

{/* Description */}
<p className="text-sm text-purple-100 mb-3 line-clamp-2">
{emergency.description}
</p>

{/* Location */}
<div className="flex items-start gap-2 text-xs text-purple-200 mb-4">
<svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
<path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
</svg>
<span>{emergency.location?.address || 'Location not specified'}</span>
</div>

{/* Footer with "View Details" link */}
<div className="flex justify-end pt-2 border-t border-purple-600/50">
<a href={`/emergency/${emergency._id}`} className="text-cyan-400 hover:text-cyan-300">
<span className="font-semibold text-sm flex items-center gap-1 group">
View Details
<svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
</svg>
</span>
</a>
</div>
</CardBody>
</Card>
))}
</div>
</CardBody>
</Card>
)}
</div>
</div>
);
};

export default EmergencyMapPage; 