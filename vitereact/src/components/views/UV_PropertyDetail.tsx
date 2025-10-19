import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Zod schemas
import { propertySchema, propertyImageSchema, availabilityDateSchema, reviewSchema, userSchema } from '@/db/zodschemas';

// Type definitions based on Zod schemas
import type { Property } from '@/db/zodschemas';
import type { PropertyImage } from '@/db/zodschemas';
import type { AvailabilityDate } from '@/db/zodschemas';
import type { Review } from '@/db/zodschemas';
import type { User } from '@/db/zodschemas';

const UV_PropertyDetail: React.FC = () => {
  const { property_id } = useParams<{ property_id: string }>();
  const navigate = useNavigate();
  
  // Global state
  const bookingState = useAppStore(state => state.booking_state);
  const updateBookingState = useAppStore(state => state.update_booking_state);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  
  // Local state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [guests, setGuests] = useState<number>(1);
  const [nights, setNights] = useState<number>(1);
  
  // Fetch property details
  const { data: property, isLoading: propertyLoading, error: propertyError } = useQuery<Property>({
    queryKey: ['property', property_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${property_id}`
      );
      return propertySchema.parse(response.data);
    },
    enabled: !!property_id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch property images
  const { data: images, isLoading: imagesLoading, error: imagesError } = useQuery<PropertyImage[]>({
    queryKey: ['property-images', property_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${property_id}/images`
      );
      return response.data.map((img: any) => propertyImageSchema.parse(img));
    },
    enabled: !!property_id,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch availability dates
  const { data: availabilityDates, isLoading: availabilityLoading, error: availabilityError } = useQuery<AvailabilityDate[]>({
    queryKey: ['property-availability', property_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${property_id}/availability`
      );
      return response.data.map((date: any) => availabilityDateSchema.parse(date));
    },
    enabled: !!property_id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch reviews
  const { data: reviews, isLoading: reviewsLoading, error: reviewsError } = useQuery<Review[]>({
    queryKey: ['property-reviews', property_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/reviews/search?property_id=${property_id}`
      );
      return response.data.reviews.map((review: any) => reviewSchema.parse(review));
    },
    enabled: !!property_id,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Fetch host profile
  const { data: host, isLoading: hostLoading, error: hostError } = useQuery<User>({
    queryKey: ['host-profile', property?.host_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${property?.host_id}`
      );
      return userSchema.parse(response.data);
    },
    enabled: !!property?.host_id,
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  
  // Calculate average rating
  const averageRating = reviews?.length 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
  
  // Handle date changes
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setNights(diffDays);
    }
  }, [checkInDate, checkOutDate]);
  
  // Handle booking
  const handleBookNow = () => {
    if (!property) return;
    
    updateBookingState({
      selected_property_id: property.property_id,
      check_in: checkInDate,
      check_out: checkOutDate,
      guests: guests,
      total_amount: property.daily_price * nights,
      is_booking_confirmed: false,
    });
    
    navigate('/bookings/summary');
  };
  
  // Handle message host
  const handleMessageHost = () => {
    if (!property || !currentUser) return;
    
    // In a real app, this would create a new message thread
    // For now, we'll just navigate to a placeholder
    navigate(`/messages/new?property_id=${property.property_id}&host_id=${property.host_id}`);
  };
  
  // Render loading state
  if (propertyLoading || imagesLoading || availabilityLoading || reviewsLoading || hostLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  // Render error state
  if (propertyError || imagesError || availabilityError || reviewsError || hostError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md max-w-md">
          <p className="text-sm font-medium">Error loading property details</p>
          <p className="text-xs mt-1">Please try again later</p>
        </div>
      </div>
    );
  }
  
  // Render property details
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{property?.title}</h1>
          <div className="flex items-center mt-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-2 text-gray-600">{averageRating.toFixed(1)} ({reviews?.length || 0} reviews)</span>
            </div>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-gray-600">Hosted by {host?.full_name || host?.username}</span>
          </div>
        </div>
        
        {/* Image Gallery */}
        <div className="mb-8">
          {images && images.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="lg:col-span-2">
                <img
                  src={images[selectedImageIndex]?.image_url || '/placeholder.jpg'}
                  alt={property?.title}
                  className="w-full h-96 object-cover rounded-xl"
                />
              </div>
              <div className="lg:col-span-2">
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {images.map((image, index) => (
                    <button
                      key={image.image_id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-24 rounded-lg overflow-hidden ${selectedImageIndex === index ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <img
                        src={image.image_url}
                        alt={`${property?.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Property Info */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">Entire {property?.property_type} hosted by {host?.full_name || host?.username}</h2>
                  <p className="text-gray-600 mt-1">Tripoli, Lebanon</p>
                </div>
                {host?.profile_image_url ? (
                  <img
                    src={host.profile_image_url}
                    alt={host.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                )}
              </div>
              
              <div className="border-t border-gray-200 mt-6 pt-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <svg className="w-6 h-6 mx-auto text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">Entire place</p>
                  </div>
                  <div>
                    <svg className="w-6 h-6 mx-auto text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">4 guests</p>
                  </div>
                  <div>
                    <svg className="w-6 h-6 mx-auto text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">1 bedroom</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About this place</h3>
              <p className="text-gray-600">{property?.description}</p>
            </div>
            
            {/* Amenities */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What this place offers</h3>
              <div className="grid grid-cols-2 gap-4">
                {property?.amenities?.split(',').map((amenity, index) => (
                  <div key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{amenity.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Check-in Instructions */}
            {property?.check_in_instructions && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Check-in instructions</h3>
                <p className="text-gray-600">{property.check_in_instructions}</p>
              </div>
            )}
            
            {/* Reviews */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Reviews</h3>
                <div className="flex items-center">
                  <span className="text-lg font-medium text-gray-900 mr-2">{averageRating.toFixed(1)}</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              {reviews && reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.slice(0, 5).map((review) => (
                    <div key={review.review_id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center mb-2">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {review.is_anonymous ? 'Anonymous Guest' : `Guest ${review.reviewer_id.slice(0, 6)}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center mb-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No reviews yet</p>
              )}
            </div>
          </div>
          
          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 sticky top-8">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">
                      LBP {property?.daily_price?.toLocaleString() || 0}
                      <span className="text-base font-normal text-gray-600"> / night</span>
                    </p>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-gray-600">{averageRating.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="border border-gray-300 rounded-lg mb-4">
                  <div className="grid grid-cols-2 border-b border-gray-300">
                    <div className="p-3">
                      <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Check-in</label>
                      <input
                        type="date"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full mt-1 text-sm font-medium text-gray-900 focus:outline-none"
                      />
                    </div>
                    <div className="p-3 border-l border-gray-300">
                      <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Checkout</label>
                      <input
                        type="date"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full mt-1 text-sm font-medium text-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="p-3">
                    <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Guests</label>
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full mt-1 text-sm font-medium text-gray-900 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <option key={num} value={num}>
                          {num} guest{num > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={handleBookNow}
                  disabled={!checkInDate || !checkOutDate || !property?.is_instant_book}
                  className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                    property?.is_instant_book
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  } transition-colors`}
                >
                  {property?.is_instant_book ? 'Book now' : 'Request to book'}
                </button>
                
                {!property?.is_instant_book && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    You'll be able to confirm after the host responds
                  </p>
                )}
                
                {checkInDate && checkOutDate && property && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          LBP {property.daily_price?.toLocaleString()} x {nights} night{nights > 1 ? 's' : ''}
                        </span>
                        <span className="text-gray-900">
                          LBP {(property.daily_price * nights)?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Service fee</span>
                        <span className="text-gray-900">
                          LBP {Math.round(property.daily_price * nights * 0.1)?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between font-semibold text-lg mt-4 pt-4 border-t border-gray-200">
                      <span>Total</span>
                      <span>
                        LBP {Math.round(property.daily_price * nights * 1.1)?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleMessageHost}
                  className="w-full mt-4 py-3 px-4 rounded-lg font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Contact host
                </button>
              </div>
            </div>
            
            {/* Host Card */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <div className="flex items-center">
                {host?.profile_image_url ? (
                  <img
                    src={host.profile_image_url}
                    alt={host.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-12 h-12" />
                )}
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">Hosted by {host?.full_name || host?.username}</h3>
                  <p className="text-sm text-gray-500">Tripoli, Lebanon</p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">Verified</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-600">2 years hosting</span>
                </div>
              </div>
              
              {host?.bio && (
                <p className="mt-4 text-gray-600 text-sm">{host.bio}</p>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900">Languages spoken</h4>
                <p className="text-sm text-gray-600 mt-1">English, Arabic</p>
              </div>
            </div>
            
            {/* Map Placeholder */}
            <div className="bg-white rounded-xl shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Where you'll be</h3>
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48" />
              <p className="mt-2 text-gray-600">Tripoli, Lebanon</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_PropertyDetail;