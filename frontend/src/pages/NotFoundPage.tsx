import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

const NotFoundPage: React.FC = () => {
  const { token } = useAuth();

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
      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-16 px-4 z-10 relative">
        <section className="flex flex-col items-center text-center px-4 max-w-2xl">
          {/* Logo */}
          <BrandLogo className="mb-8 sm:mb-10 mx-auto w-14 h-auto block text-foreground" />
          
          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
            404 - Link Not Found
          </h1>
          
          {/* Subtext */}
          <p className="text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            The short link you are trying to visit does not exist or has been removed.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link 
              to="/register"
              className="btn-solid px-6 py-2.5 w-full sm:w-auto text-center"
            >
              Try Trim Today
            </Link>
            <Link 
              to="/"
              className="px-6 py-2 bg-background text-foreground border border-border rounded-lg font-medium hover:bg-secondary transition-colors w-full sm:w-auto text-center text-sm"
            >
              Back to Home
            </Link>
          </div>
        </section>
      </main>
      {/* END: Main Content */}
    </div>
  );
};

export default NotFoundPage;
