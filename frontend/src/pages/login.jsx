import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../authslice';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const submitteddata = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="min-h-screen flex justify-center items-center px-4 relative">
      {/* Background Video */}
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
      
      {/* Login Form with Maximum Transparency */}
      <div className="bg-white/[0.02] backdrop-blur-xs shadow-lg rounded-2xl p-10 w-full max-w-md border border-white/[0.05] relative z-10">
        <h1 className="text-4xl font-bold text-white text-center mb-2" style={{ textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
          <span className="inline-block animate-bounce">🚀</span> CodeCrack
        </h1>
        <h2 className="text-lg text-gray-200 text-center mb-6" style={{ textShadow: '0 0 8px rgba(0,0,0,0.8)' }}>
          Welcome back! Please login to continue.
        </h2>
        <form className="w-full" onSubmit={handleSubmit(submitteddata)}>
          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-1" htmlFor="email" style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}>Email</label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-3 py-2 bg-white/[0.02] text-white border border-white/[0.05] rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-white/30"
              autoComplete="email"
              style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}
            />
            {errors.email && <span className="text-red-400 text-sm" style={{ textShadow: '0 0 5px rgba(0,0,0,0.9)' }}>{errors.email.message}</span>}
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-200 mb-1" htmlFor="password" style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}>Password</label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="w-full px-3 py-2 bg-white/[0.02] text-white border border-white/[0.05] rounded focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-white/30"
              autoComplete="current-password"
              style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}
            />
            {errors.password && <span className="text-red-400 text-sm" style={{ textShadow: '0 0 5px rgba(0,0,0,0.9)' }}>{errors.password.message}</span>}
          </div>
          {error && <div className="mb-4 text-red-500 text-sm text-center" style={{ textShadow: '0 0 5px rgba(0,0,0,0.9)' }}>{error}</div>}
          <button
            type="submit"
            className="w-full bg-orange-500/70 hover:bg-orange-400/70 text-white py-2 rounded-md font-semibold transition duration-150"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-200 text-center" style={{ textShadow: '0 0 5px rgba(0,0,0,0.8)' }}>
          Don&apos;t have an account?{' '}
          <span
            className="text-orange-400 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate('/user/register')}
          >
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
}

export default Login;