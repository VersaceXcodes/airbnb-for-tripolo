import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const GV_TopNav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // Get authentication state from global store
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const logoutUser = useAppStore(state => state.logout_user);
  
  // Close mobile menu when resizing to larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Close menu when pressing ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    
    if (isMenuOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isMenuOpen]);
  
  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    logoutUser();
    setIsMenuOpen(false);
    navigate('/login');
  };
  
  // Determine dashboard link based on user role
  const dashboardLink = currentUser?.is_host ? '/dashboard/host' : '/dashboard/guest';
  
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md" role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                TripoStay
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:flex md:items-center md:space-x-8">
              {isAuthenticated ? (
                <>
                  <Link 
                    to={dashboardLink} 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Home
                  </Link>
                  <Link 
                    to="/search" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Explore
                  </Link>
                  <Link 
                    to="/messages" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Messages
                  </Link>
                  {currentUser?.is_host ? (
                    <Link 
                      to="/listings" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      My Listings
                    </Link>
                  ) : (
                    <Link 
                      to="/bookings/guest" 
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      My Stays
                    </Link>
                  )}
                </>
              ) : null}
            </div>
            
            {/* Authentication section */}
            <div className="flex items-center">
              {!isAuthenticated ? (
                <div className="hidden md:flex md:items-center space-x-4">
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="hidden md:flex md:items-center">
                  {/* Profile dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      aria-expanded={isMenuOpen}
                      aria-haspopup="true"
                    >
                      {currentUser?.profile_image_url ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={currentUser.profile_image_url}
                          alt={`${currentUser.username} profile`}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-800 text-sm font-medium">
                            {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <span className="ml-2 text-gray-700 hidden lg:block">
                        {currentUser?.username}
                      </span>
                      <svg 
                        className="ml-1 h-5 w-5 text-gray-400 hidden lg:block" 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </button>
                    
                    {/* Dropdown menu */}
                    {isMenuOpen && (
                      <div 
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu-button"
                      >
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Your Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-expanded={isMenuOpen}
                  aria-label={isMenuOpen ? "Close main menu" : "Open main menu"}
                >
                  <svg
                    className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg
                    className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden" role="dialog" aria-modal="true">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to={dashboardLink}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/search"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Explore
                  </Link>
                  <Link
                    to="/messages"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                  {currentUser?.is_host ? (
                    <Link
                      to="/listings"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-blue-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Listings
                    </Link>
                  ) : (
                    <Link
                      to="/bookings/guest"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-blue-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Stays
                    </Link>
                  )}
                  <div className="border-t border-gray-200 pt-4 pb-3">
                    <div className="flex items-center px-5">
                      {currentUser?.profile_image_url ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={currentUser.profile_image_url}
                          alt={`${currentUser.username} profile`}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-800 text-lg font-medium">
                            {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">{currentUser?.username}</div>
                        <div className="text-sm font-medium text-gray-500">{currentUser?.email}</div>
                      </div>
                    </div>
                    <div className="mt-3 px-2 space-y-1">
                      <Link
                        to="/profile"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-blue-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-blue-600"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="px-5 py-4 space-y-3">
                  <Link
                    to="/login"
                    className="block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block w-full text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      {/* Spacer to account for fixed navbar */}
      <div className="h-16"></div>
    </>
  );
};

export default GV_TopNav;