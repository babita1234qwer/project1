import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../authslice';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .regex(/^[A-Z]/, 'Password must start with a capital letter')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must include uppercase, lowercase, number, and special character'
    ),
  phone: z.string().optional(),
  skills: z.array(z.string()).optional(),
  notificationPreferences: z.object({
    push: z.boolean().default(true),
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    emergencyAlerts: z.boolean().default(true),
    responseUpdates: z.boolean().default(true),
    systemNotifications: z.boolean().default(true),
  }).optional(),
});

const skillOptions = [
  "first_aid",
  "cpr",
  "fire_safety",
  "search_rescue",
  "medical",
  "emergency_response",
  "other",
];

function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [notificationPrefs, setNotificationPrefs] = useState({
    push: true,
    email: true,
    sms: false,
    emergencyAlerts: true,
    responseUpdates: true,
    systemNotifications: true,
  });
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm({ 
    resolver: zodResolver(signupSchema),
    defaultValues: {
      notificationPreferences: notificationPrefs,
      skills: selectedSkills,
    }
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

 
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('Geolocation success:', position.coords);
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationLoading(false);
        },
        (error) => {
          console.log('Geolocation error:', error);
          setLocationError(error.message);
          setLocationLoading(false);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser');
    }
  }, []);

  const handleSkillToggle = (skill) => {
    const updatedSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    
    setSelectedSkills(updatedSkills);
    setValue('skills', updatedSkills);
  };

  const handleNotificationPrefChange = (pref) => {
    const updatedPrefs = {
      ...notificationPrefs,
      [pref]: !notificationPrefs[pref]
    };
    
    setNotificationPrefs(updatedPrefs);
    setValue('notificationPreferences', updatedPrefs);
  };

  const submitteddata = async (data) => {
    try {
      console.log('Location in registration:', location);
      
      
      const formattedData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || '',
        skills: data.skills || [],
        notificationPreferences: data.notificationPreferences,

        ...(location && 
           location.latitude !== 0 && 
           location.longitude !== 0 && {
          currentLocation: {
            type: "Point",
            coordinates: [location.longitude, location.latitude]
          }
        }),
        // Set default values for other fields
        isAuthenticated: false,
        lastUpdated: new Date(),
        availabilityStatus: true,
        trustScore: 3,
        responseHistory: [],
        certifications: [],
        deviceTokens: [],
      };

      console.log('Sending registration data:', formattedData);

      const resultAction = await dispatch(registerUser(formattedData));
      if (registerUser.rejected.match(resultAction)) {
        setError('root', {
          type: 'manual',
          message: resultAction.payload || 'Signup failed',
        });
      } else {
      
        navigate('/');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('root', {
        type: 'manual',
        message: 'Something went wrong. Try again later.',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative">
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
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 text-center">
          <span className="inline-block animate-bounce"></span>  Account
        </h1>
        <h2 className="text-lg text-gray-200 mb-6 font-semibold text-center">
          Create your account
        </h2>

        {errors.root && (
          <div className="text-red-400 text-sm mb-4 p-3 bg-red-500/10 backdrop-blur-sm rounded-lg text-center">
            {typeof errors.root.message === 'string' ? errors.root.message : 'An error occurred'}
          </div>
        )}

        {/* Location status */}
        <div className="mb-4 p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
          <h3 className="text-sm font-semibold text-gray-200 mb-2">Location Access</h3>
          {locationLoading && (
            <p className="text-blue-400 text-sm">Getting your location...</p>
          )}
          {locationError && (
            <p className="text-yellow-400 text-sm">Location access denied: {locationError}</p>
          )}
          {location && (
            <p className="text-green-400 text-sm">
              Location detected: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          )}
          {!location && !locationLoading && !locationError && (
            <p className="text-gray-300 text-sm">Location not available</p>
          )}
        </div>

        <form className="w-full" onSubmit={handleSubmit(submitteddata)}>
          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-1" htmlFor="name">Full Name</label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
              placeholder="Enter your full name"
            />
            {errors.name && <span className="text-red-400 text-sm">{errors.name.message}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-1" htmlFor="email">Email</label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
              placeholder="your.email@example.com"
            />
            {errors.email && <span className="text-red-400 text-sm">{errors.email.message}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-1" htmlFor="phone">Phone (Optional)</label>
            <input
              {...register('phone')}
              type="tel"
              id="phone"
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && <span className="text-red-400 text-sm">{errors.phone.message}</span>}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-1" htmlFor="password">Password</label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-gray-300"
              placeholder="••••••••••"
            />
            {errors.password && <span className="text-red-400 text-sm">{errors.password.message}</span>}

            <p className="text-xs text-gray-300 mt-1">
              Must start with a capital letter and include lowercase, number, and special character.
            </p>
          </div>

         
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-2 rounded-md font-semibold transition duration-150 disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-sm text-gray-200 text-center">
          Already have an account?{' '}
          <span
            className="text-orange-400 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate('/user/login')}
          >
            Login
          </span>
        </div>
      </div>
    </div>
  );
}

export default Signup;