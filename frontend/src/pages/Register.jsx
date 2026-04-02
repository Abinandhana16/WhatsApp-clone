import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, ShieldCheck, Globe, Star, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsAnimating(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }

    const result = await register(username, email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-wa-bg-light dark:bg-wa-bg-dark flex items-center justify-center p-6 transition-colors duration-500">
      <div className={`bg-white dark:bg-wa-sidebar-dark rounded-2xl shadow-2xl overflow-hidden w-full max-w-[900px] flex transition-all duration-700 transform ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Left Side: Branding (Visible on Desktop) - Purple Gradient Theme */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-wa-dark-teal to-wa-teal p-12 flex-col justify-between text-white relative overflow-hidden">
          <div className="z-10">
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                <MessageSquare size={28} />
              </div>
              <span className="text-xl font-bold tracking-tight">WhatsApp Pro</span>
            </div>
            <h1 className="text-4xl font-bold leading-tight mb-4">Start your journey with us today.</h1>
            <p className="text-white/80 font-light leading-relaxed">Join a community of millions and experience the next generation of real-time messaging.</p>
          </div>
          
          <div className="space-y-4 z-10">
            <div className="flex items-center gap-3 text-sm text-white/90">
              <Globe size={18} className="text-wa-light-green" />
              <span>Worldwide Connectivity</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-white/90">
              <Star size={18} className="text-wa-light-green" />
              <span>Premium User Experience</span>
            </div>
          </div>

          {/* Decorative Circles */}
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-wa-green/20 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-30"></div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-10 md:p-14 bg-white dark:bg-wa-sidebar-dark">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-wa-text-primary-dark mb-2">Create Account</h2>
            <p className="text-gray-500 dark:text-wa-text-secondary-dark">Join the professional circle</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-500 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 border border-red-100 dark:border-red-900/30 animate-shake">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-gray-600 dark:text-wa-text-secondary-dark mb-1.5 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3 bg-gray-50 dark:bg-wa-header-dark border border-gray-200 dark:border-wa-border-dark rounded-xl focus:ring-2 focus:ring-wa-teal focus:border-transparent focus:outline-none transition-all dark:text-white"
                placeholder="johndoe"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-600 dark:text-wa-text-secondary-dark mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 bg-gray-50 dark:bg-wa-header-dark border border-gray-200 dark:border-wa-border-dark rounded-xl focus:ring-2 focus:ring-wa-teal focus:border-transparent focus:outline-none transition-all dark:text-white"
                placeholder="name@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-600 dark:text-wa-text-secondary-dark mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3 pr-12 bg-gray-50 dark:bg-wa-header-dark border border-gray-200 dark:border-wa-border-dark rounded-xl focus:ring-2 focus:ring-wa-teal focus:border-transparent focus:outline-none transition-all dark:text-white"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-wa-teal transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                <ShieldCheck size={14} className="text-wa-teal" />
                <span>Your data is encrypted and secure.</span>
            </div>

            <button
              type="submit"
              className="w-full bg-wa-teal hover:bg-wa-dark-teal text-white font-bold py-3.5 rounded-xl shadow-lg shadow-wa-teal/20 transition-all transform hover:-translate-y-0.5"
            >
              CREATE ACCOUNT
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600 dark:text-wa-text-secondary-dark">
            Already have an account?{' '}
            <Link to="/login" className="text-wa-teal font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
