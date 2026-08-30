import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
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
    <div className="antialiased min-h-screen flex flex-col bg-background text-foreground font-sans relative">
      {/* Background subtle mesh */}
      <div 
        className="absolute inset-0 z-0 opacity-40"
        style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      {/* BEGIN: Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <BrandLogo className="h-8 w-auto text-foreground" />
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {token ? (
              <Link 
                to="/dashboard" 
                className="btn-solid"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn-solid"
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
            <BrandLogo className="h-9 w-auto text-foreground" />
          </div>

          {/* Password Card */}
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-8 shadow-xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 border border-primary/20">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground mb-1.5">Password Required</h1>
              <p className="text-sm text-muted-foreground">This link is protected. Enter the password to continue.</p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-foreground text-left">Password</label>
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
                    className="w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground bg-background border-input placeholder:text-muted-foreground transition-colors text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-rose-500 text-xs text-center font-medium pt-1">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || !password.trim()}
                className="w-full btn-solid mt-4 text-center flex justify-center py-2 disabled:opacity-50"
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
