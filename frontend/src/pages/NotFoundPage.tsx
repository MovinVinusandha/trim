import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

const NotFoundPage: React.FC = () => {
  const { token } = useAuth();

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
      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-16 px-4 z-10 relative">
        <section className="flex flex-col items-center text-center px-4 max-w-2xl">
          {/* Logo */}
          <BrandLogo className="mb-8 sm:mb-10 mx-auto w-16 h-auto block text-gray-900 dark:text-white" />
          
          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-gray-900 dark:text-[#EDEDED] mb-4">
            404 - Link Not Found
          </h1>
          
          {/* Subtext */}
          <p className="text-lg md:text-xl text-gray-600 dark:text-[#A1A1AA] mb-10 max-w-lg mx-auto leading-relaxed">
            The short link you are trying to visit does not exist or has been removed.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link 
              to="/register"
              className="px-6 py-3 bg-black dark:bg-[#EDEDED] text-white dark:text-[#111113] rounded-lg font-medium hover:bg-gray-900 dark:hover:bg-white transition-colors w-full sm:w-auto text-center shadow-md"
            >
              Try Trim Today
            </Link>
            <Link 
              to="/"
              className="px-6 py-3 bg-white dark:bg-[#1E1E21] text-gray-800 dark:text-[#EDEDED] border border-gray-200 dark:border-[#2B2B30] rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-[#2B2B30] transition-colors w-full sm:w-auto text-center shadow-sm"
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
