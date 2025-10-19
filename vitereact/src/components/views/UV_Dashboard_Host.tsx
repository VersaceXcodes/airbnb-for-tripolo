import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

const UV_Dashboard_Host: React.FC = () => {
  // Global state access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Local state for dashboard data
  const [listingsCount, setListingsCount] = useState<number>(0);
  const [upcomingBookingsCount, setUpcomingBookingsCount] = useState<number>(0);
  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [earningsData, setEarningsData] = useState<Array<{label: string, value: number}>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    if (!currentUser?.user_id || !authToken) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all properties for this host
      const propertiesResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/search?host_id=${currentUser.user_id}&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      const properties = propertiesResponse.data.properties || [];
      setListingsCount(properties.length);
      
      // Fetch bookings for all properties
      const propertyIds = properties.map((p: any) => p.property_id);
      const bookingPromises = propertyIds.map((id: string) => 
        axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/search?property_id=${id}&status=confirmed`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        )
      );
      
      const bookingResponses = await Promise.all(bookingPromises);
      const totalBookings = bookingResponses.reduce((acc, bookingRes) => 
        acc + (bookingRes.data.bookings?.length || 0), 0
      );
      
      // Calculate earnings (simplified)
      const totalEarnings = bookingResponses.reduce((acc, bookingRes) => 
        acc + (bookingRes.data.bookings?.reduce((sum: number, booking: any) => 
          sum + (Number(booking.total_amount) || 0), 0) || 0), 0
      );
      
      setUpcomingBookingsCount(totalBookings);
      
      // Fetch reviews count
      const reviewPromises = propertyIds.map((id: string) => 
        axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/reviews/search?property_id=${id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        )
      );
      
      const reviewResponses = await Promise.all(reviewPromises);
      const totalReviews = reviewResponses.reduce((acc, reviewRes) => 
        acc + (reviewRes.data.reviews?.length || 0), 0
      );
      
      setReviewsCount(totalReviews);
      
      // Set earnings data for visualization
      setEarningsData([
        { label: 'Listings', value: properties.length },
        { label: 'Bookings', value: totalBookings },
        { label: 'Reviews', value: totalReviews },
        { label: 'Earnings', value: totalEarnings }
      ]);
      
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to listing creation
  const navigateToListingCreate = () => {
    navigate('/listings/create');
  };
  
  // Navigate to host listings
  const navigateToHostListings = () => {
    navigate('/listings');
  };
  
  // Navigate to messages
  const navigateToMessages = () => {
    navigate('/messages');
  };
  
  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardStats();
  }, [currentUser?.user_id, authToken]);
  
  // Render loading state
  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="animate-pulse h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
            
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="animate-pulse h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="animate-pulse h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={fetchDashboardStats}
                    className="mt-2 text-sm text-red-700 hover:text-red-600 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Banner */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Welcome back, {currentUser?.full_name || currentUser?.username}!
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your listings, bookings, and reviews all in one place.
            </p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {/* Listings Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Listings</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{listingsCount}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/listings" className="font-medium text-blue-600 hover:text-blue-500">
                    View all
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Bookings Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Upcoming Bookings</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{upcomingBookingsCount}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/bookings/host" className="font-medium text-blue-600 hover:text-blue-500">
                    Manage bookings
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Reviews Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Reviews</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{reviewsCount}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <Link to="/reviews/host" className="font-medium text-blue-600 hover:text-blue-500">
                    View reviews
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Earnings Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Earnings</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {earningsData.find(d => d.label === 'Earnings')?.value.toLocaleString() || '0'} LBP
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm text-gray-500">Total earnings</div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
              <p className="mt-1 text-sm text-gray-500">Manage your listings and bookings efficiently</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Add Listing */}
                <button
                  onClick={navigateToListingCreate}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-all"
                >
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true"></span>
                    <p className="text-sm font-medium text-gray-900">Add Listing</p>
                    <p className="text-sm text-gray-500 truncate">Create a new property listing</p>
                  </div>
                </button>
                
                {/* Manage Listings */}
                <button
                  onClick={navigateToHostListings}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-all"
                >
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true"></span>
                    <p className="text-sm font-medium text-gray-900">Manage Listings</p>
                    <p className="text-sm text-gray-500 truncate">Edit or remove your listings</p>
                  </div>
                </button>
                
                {/* Messages */}
                <button
                  onClick={navigateToMessages}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-all"
                >
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true"></span>
                    <p className="text-sm font-medium text-gray-900">Messages</p>
                    <p className="text-sm text-gray-500 truncate">Communicate with guests</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
          
          {/* Earnings Preview */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Earnings Overview</h3>
              <p className="mt-1 text-sm text-gray-500">Your performance metrics at a glance</p>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Earnings Visualization</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Earnings chart will be displayed here in a future update.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Dashboard_Host;