import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Booking } from '@/DB/zodschemas';

// API service functions
const fetchGuestBookings = async (guestId: string) => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/search`, {
    params: { guest_id: guestId },
    headers: {
      Authorization: `Bearer ${useAppStore.getState().authentication_state.auth_token}`
    }
  });
  
  return response.data.bookings as Booking[];
};

const fetchPropertyDetails = async (propertyId: string) => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${propertyId}`, {
    headers: {
      Authorization: `Bearer ${useAppStore.getState().authentication_state.auth_token}`
    }
  });
  
  return response.data;
};

const UV_GuestBookings: React.FC = () => {
  // Access authentication state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  
  // State for refresh functionality
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Fetch bookings data
  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ['guestBookings', currentUser?.user_id, refreshKey],
    queryFn: () => fetchGuestBookings(currentUser!.user_id),
    enabled: isAuthenticated && !!currentUser?.user_id,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <div className="flex space-x-3">
                <div className="animate-pulse h-10 w-10 rounded-full bg-gray-200"></div>
              </div>
            </div>
            
            <div className="space-y-6">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row">
                      <div className="bg-gray-200 rounded-lg h-48 md:w-64 md:h-48 mb-4 md:mb-0 md:mr-6"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-10 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading bookings</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleRefresh}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Group bookings by status
  const upcomingBookings = bookings.filter(booking => 
    booking.status === 'confirmed' && new Date(booking.check_in_date) > new Date()
  );
  
  const pastBookings = bookings.filter(booking => 
    booking.status === 'completed' || 
    booking.status === 'confirmed' && new Date(booking.check_out_date) < new Date() ||
    booking.status === 'canceled'
  ).sort((a, b) => new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime());
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="mt-2 text-gray-600">
                Manage your accommodation arrangements and trip history
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          {/* Upcoming Bookings Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Stays</h2>
            
            {upcomingBookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No upcoming bookings</h3>
                <p className="mt-1 text-gray-500">When you book a stay, it will appear here</p>
                <div className="mt-6">
                  <Link
                    to="/search"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Browse Properties
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {upcomingBookings.map((booking) => (
                  <div key={booking.booking_id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row">
                        <div className="mb-4 md:mb-0 md:mr-6">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-64 h-48" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:justify-between">
                            <div>
                              <div className="flex items-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                  Confirmed
                                </span>
                                <span className="ml-3 text-sm text-gray-500">
                                  Booking ID: {booking.booking_id}
                                </span>
                              </div>
                              <h3 className="mt-2 text-xl font-bold text-gray-900">Beautiful Apartment in Tripoli</h3>
                              <p className="text-gray-600 mt-1">Tripoli, Lebanon</p>
                            </div>
                            <div className="mt-4 md:mt-0">
                              <p className="text-2xl font-bold text-gray-900">
                                {booking.total_amount.toLocaleString()} LBP
                              </p>
                              <p className="text-gray-500 text-sm">Total</p>
                            </div>
                          </div>
                          
                          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Check-in</p>
                              <p className="font-medium">
                                {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Check-out</p>
                              <p className="font-medium">
                                {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Guests</p>
                              <p className="font-medium">{booking.guests_count} guests</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Duration</p>
                              <p className="font-medium">
                                {Math.ceil(
                                  (new Date(booking.check_out_date).getTime() - 
                                   new Date(booking.check_in_date).getTime()) / 
                                  (1000 * 60 * 60 * 24)
                                )} nights
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-6 flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              View Details
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                              </svg>
                              Contact Host
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Past Bookings Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Past Stays</h2>
            
            {pastBookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No past bookings</h3>
                <p className="mt-1 text-gray-500">Your completed stays will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pastBookings.map((booking) => (
                  <div key={booking.booking_id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row">
                        <div className="mb-4 md:mb-0 md:mr-6">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-64 h-48" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:justify-between">
                            <div>
                              <div className="flex items-center">
                                {booking.status === 'completed' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                    Completed
                                  </span>
                                ) : booking.status === 'canceled' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    Canceled
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                    Past Stay
                                  </span>
                                )}
                                <span className="ml-3 text-sm text-gray-500">
                                  Booking ID: {booking.booking_id}
                                </span>
                              </div>
                              <h3 className="mt-2 text-xl font-bold text-gray-900">Beautiful Apartment in Tripoli</h3>
                              <p className="text-gray-600 mt-1">Tripoli, Lebanon</p>
                            </div>
                            <div className="mt-4 md:mt-0">
                              <p className="text-2xl font-bold text-gray-900">
                                {booking.total_amount.toLocaleString()} LBP
                              </p>
                              <p className="text-gray-500 text-sm">Total</p>
                            </div>
                          </div>
                          
                          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Check-in</p>
                              <p className="font-medium">
                                {new Date(booking.check_in_date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Check-out</p>
                              <p className="font-medium">
                                {new Date(booking.check_out_date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Guests</p>
                              <p className="font-medium">{booking.guests_count} guests</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Duration</p>
                              <p className="font-medium">
                                {Math.ceil(
                                  (new Date(booking.check_out_date).getTime() - 
                                   new Date(booking.check_in_date).getTime()) / 
                                  (1000 * 60 * 60 * 24)
                                )} nights
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-6 flex flex-col sm:flex-row sm:space-x-3 space-y-3 sm:space-y-0">
                            {booking.status === 'completed' && (
                              <Link
                                to={`/reviews/write?booking_id=${booking.booking_id}`}
                                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Leave a Review
                              </Link>
                            )}
                            <button
                              type="button"
                              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_GuestBookings;