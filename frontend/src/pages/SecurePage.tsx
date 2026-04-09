import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

const SecurePage: React.FC = () => {
  const { hash } = useParams<{ hash: string }>();
  const { token } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post(`/unlock/${hash}`, { password: password.trim() });
      if (response.data && response.data.longUrl) {
        window.location.href = response.data.longUrl;
      }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        setError('Incorrect password. Please try again.');
      } else if (err.response?.status === 404) {
        setError('Link not found or no longer active.');
      } else {
        setError('An error occurred while unlocking the link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-[#111113] text-black dark:text-[#EDEDED] font-sans relative">
      {/* Background Dot Mesh */}
      <div 
        className="absolute inset-0 z-0 dark:hidden"
        style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      <div 
        className="absolute inset-0 z-0 hidden dark:block"
        style={{ backgroundImage: 'radial-gradient(#2B2B30 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      {/* BEGIN: Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#111113]/90 backdrop-blur-sm border-b border-gray-100 dark:border-[#2B2B30]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <BrandLogo className="h-9 w-auto text-[#12141D] dark:text-white" />
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {token ? (
              <Link 
                to="/dashboard" 
                className="px-4 py-2 bg-[#12141D] dark:bg-white text-white dark:text-black text-sm font-semibold rounded-xl hover:bg-[#201F22] dark:hover:bg-gray-200 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-sm font-medium text-gray-600 dark:text-[#A1A1AA] hover:text-[#12141D] dark:hover:text-white transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="px-4 py-2 bg-[#12141D] dark:bg-white text-white dark:text-black text-sm font-semibold rounded-xl hover:bg-[#201F22] dark:hover:bg-gray-200 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      {/* END: Navigation Bar */}

      {/* BEGIN: Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center pt-12 pb-16 px-4 z-10 relative">
        <div className="w-full max-w-md mx-auto">
          {/* Brand Logo Outside Card */}
          <div className="mb-8 flex justify-center">
            <BrandLogo className="h-10 w-auto text-gray-900 dark:text-white" />
          </div>

          {/* Password Card */}
          <div className="w-full max-w-md bg-white dark:bg-[#1E1E21] border border-gray-200 dark:border-[#2B2B30] rounded-2xl p-8 shadow-xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-[#EDEDED] mb-2">Password Required</h1>
              <p className="text-sm text-gray-500 dark:text-[#A1A1AA]">This link is protected. Enter the password to continue.</p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900 dark:text-[#EDEDED] text-left">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••" 
                    className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-gray-900 dark:text-[#EDEDED] bg-white dark:bg-[#111113] border-gray-200 dark:border-[#2B2B30] dark:placeholder-gray-500"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center font-medium pt-1">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || !password.trim()}
                className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg py-2.5 font-medium transition-colors disabled:opacity-50 mt-4"
              >
                {loading ? 'Unlocking...' : 'Unlock Link'}
              </button>
            </form>
          </div>
        </div>
      </main>
      {/* END: Main Content */}
    </div>
  );
};

export default SecurePage;
