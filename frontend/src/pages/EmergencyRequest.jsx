import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import axiosClient from '../utils/axiosclient';
import { useState, useEffect } from 'react';

const emergencySchema = z.object({
  emergencyType: z.string().min(1, 'Type is required'),
  emergencySubtype: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  address: z.string().min(1, 'Address is required'),
  latitude: z.string().min(1, 'Latitude is required'),
  longitude: z.string().min(1, 'Longitude is required'),
});

function EmergencyRequest() {
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(emergencySchema) });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ latitude, longitude });
          
          // Auto-fill the form with current location
          setValue('latitude', latitude.toString());
          setValue('longitude', longitude.toString());
          
          // Get address from coordinates
          getAddressFromCoordinates(latitude, longitude);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError(error.message);
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  }, []);

  // Get address from coordinates
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'HelpNet/1.0 (contact@helpnet.com)'
          }
        }
      );
      
      const data = await response.json();
      if (data.display_name) {
        setValue('address', data.display_name);
      }
    } catch (error) {
      console.error('Error getting address:', error);
    }
  };

  // Use setValue from useForm
  const { setValue } = useForm();

  const submitteddata = async (data) => {
    try {
      const payload = {
        emergencyType: data.emergencyType,
        emergencySubtype: data.emergencySubtype,
        description: data.description,
        address: data.address,
        longitude: parseFloat(data.longitude),
        latitude: parseFloat(data.latitude),
        location: {
          type: 'Point',
          coordinates: [parseFloat(data.longitude), parseFloat(data.latitude)],
          address: data.address,
        },
      };
      
      console.log("📦 Payload being sent:", payload);
      await axiosClient.post('/emergencies/create', payload);
      alert('Emergency submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Submission failed");
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center px-4 relative">
      {/* Background Video - Full Screen */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error("Video error:", e);
            e.target.parentElement.style.background = "url('/fallback-image.jpg') center/cover no-repeat";
          }}
        >
          <source src="/Stars.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* Semi-transparent overlay for better readability */}
      <div className="absolute inset-0 bg-black/30 z-10"></div>

      {/* Transparent Form Container */}
      <div className="bg-white/5 backdrop-blur-lg shadow-2xl rounded-2xl p-10 w-full max-w-md border border-white/10 z-20">
        <h1 className="text-4xl font-bold text-white text-center mb-2">
          <span className="inline-block animate-bounce">🚨</span> Report
        </h1>
        <h2 className="text-lg text-gray-200 mb-6 font-semibold text-center">
          Please fill out the emergency details below.
        </h2>

        {/* Location Status */}
        <div className="mb-4 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-200">Location</h3>
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      setCurrentLocation({ latitude, longitude });
                      setValue('latitude', latitude.toString());
                      setValue('longitude', longitude.toString());
                      getAddressFromCoordinates(latitude, longitude);
                    },
                    (error) => {
                      console.error('Error getting location:', error);
                      setLocationError(error.message);
                    },
                    {
                      enableHighAccuracy: true,
                      timeout: 15000,
                      maximumAge: 0
                    }
                  );
                } else {
                  setLocationError('Geolocation is not supported by your browser');
                }
              }}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors"
            >
              {locationLoading ? 'Getting Location...' : 'Use Current Location'}
            </button>
          </div>
          
          {locationLoading && (
            <p className="text-blue-400 text-sm">Getting your location...</p>
          )}
          {locationError && (
            <p className="text-yellow-400 text-sm">Error: {locationError}</p>
          )}
          {currentLocation && (
            <div>
              <p className="text-green-400 text-sm">
                Location: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <form className="w-full" onSubmit={handleSubmit(submitteddata)}>
          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-1" htmlFor="emergencyType">Type</label>
            <select 
              {...register('emergencyType')} 
              id="emergencyType" 
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
            >
              <option value="">Select</option>
              <option value="fire">Fire</option>
              <option value="medical">Medical</option>
              <option value="security">Security</option>
              <option value="natural_disaster">Natural Disaster</option>
              <option value="other">Other</option>
            </select>
            {errors.emergencyType && <span className="text-red-400 text-sm">{errors.emergencyType.message}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-1" htmlFor="emergencySubtype">Subtype</label>
            <input 
              {...register('emergencySubtype')} 
              id="emergencySubtype" 
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
              placeholder="Optional details"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-1" htmlFor="description">Description</label>
            <textarea 
              {...register('description')} 
              id="description" 
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
              rows={3}
              placeholder="Describe the emergency situation..."
            />
            {errors.description && <span className="text-red-400 text-sm">{errors.description.message}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-1" htmlFor="address">Address</label>
            <input 
              {...register('address')} 
              id="address" 
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
              placeholder="Enter the emergency address"
            />
            {errors.address && <span className="text-red-400 text-sm">{errors.address.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-200 mb-1" htmlFor="longitude">Longitude</label>
              <input 
                {...register('longitude')} 
                id="longitude" 
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
                placeholder="Longitude"
              />
              {errors.longitude && <span className="text-red-400 text-sm">{errors.longitude.message}</span>}
            </div>
            <div>
              <label className="block text-sm text-gray-200 mb-1" htmlFor="latitude">Latitude</label>
              <input 
                {...register('latitude')} 
                id="latitude" 
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
                placeholder="Latitude"
              />
              {errors.latitude && <span className="text-red-400 text-sm">{errors.latitude.message}</span>}
            </div>
          </div>

          <div className="mb-4 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
            <h3 className="text-sm font-semibold text-gray-200 mb-2">Emergency Information</h3>
            <p className="text-xs text-gray-300">
              Your location will be shared with nearby volunteers and emergency services.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 rounded-md font-semibold transition duration-150"
          >
            Report Emergency
          </button>
        </form>
      </div>
    </div>
  );
}

export default EmergencyRequest;