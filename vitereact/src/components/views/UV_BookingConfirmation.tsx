import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

const UV_BookingConfirmation: React.FC = () => {
  const { booking_id } = useParams<{ booking_id: string }>();
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Booking state
  const [bookingData, setBookingData] = useState({
    booking_id: '',
    property_id: '',
    check_in_date: '',
    check_out_date: '',
    guests_count: 0,
    total_amount: 0,
    status: '',
    property_title: '',
    host_name: '',
    property_image_url: '',
    cancellation_policy: ''
  });

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (!booking_id || !authToken) {
        setError('Booking ID or authentication missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch booking details
        const bookingResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/${booking_id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        const booking = bookingResponse.data;
        
        // Fetch property details
        const propertyResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${booking.property_id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        const property = propertyResponse.data;
        
        // Fetch host details
        const hostResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/${property.host_id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        const host = hostResponse.data;
        
        // Fetch property images
        const imagesResponse = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${booking.property_id}/images`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        const images = imagesResponse.data;
        const primaryImage = images.find((img: any) => img.is_primary) || images[0];
        
        // Update state with all collected data
        setBookingData({
          booking_id: booking.booking_id,
          property_id: booking.property_id,
          check_in_date: booking.check_in_date,
          check_out_date: booking.check_out_date,
          guests_count: booking.guests_count,
          total_amount: booking.total_amount,
          status: booking.status,
          property_title: property.title,
          host_name: host.full_name || host.username,
          property_image_url: primaryImage ? primaryImage.image_url : '',
          cancellation_policy: property.cancellation_policy || 'Standard cancellation policy applies'
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking confirmation details. Please try again.');
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [booking_id, authToken]);

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl w-full space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-center mt-4 text-gray-600">Loading your booking confirmation...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl w-full space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">Error Loading Confirmation</h2>
                <p className="mt-2 text-gray-600">{error}</p>
                <div className="mt-6">
                  <Link 
                    to="/dashboard/guest" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Format dates for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Calculate number of nights
  const checkInDate = new Date(bookingData.check_in_date);
  const checkOutDate = new Date(bookingData.check_out_date);
  const nightsCount = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Booking Confirmed!
            </h1>
            <p className="mt-3 text-xl text-gray-500">
              Thank you for your reservation. Your stay is confirmed.
            </p>
          </div>

          {/* Confirmation Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Booking Reference */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">Booking Confirmation</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  Confirmed
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">Reference: {bookingData.booking_id}</p>
            </div>

            {/* Property Information */}
            <div className="px-6 py-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 mb-4 md:mb-0">
                  {bookingData.property_image_url ? (
                    <img 
                      src={bookingData.property_image_url} 
                      alt={bookingData.property_title} 
                      className="rounded-lg object-cover w-full h-40"
                    />
                  ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-40 flex items-center justify-center">
                      <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="md:w-2/3 md:pl-6">
                  <h3 className="text-xl font-bold text-gray-900">{bookingData.property_title}</h3>
                  <p className="mt-1 text-gray-600">Hosted by {bookingData.host_name}</p>
                  <div className="mt-4 flex items-center text-gray-500">
                    <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="ml-2">Tripoli, Lebanon</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stay Details */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stay Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Check-in</p>
                  <p className="mt-1 font-medium">{formatDate(bookingData.check_in_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-out</p>
                  <p className="mt-1 font-medium">{formatDate(bookingData.check_out_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Guests</p>
                  <p className="mt-1 font-medium">{bookingData.guests_count} guests</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Duration</p>
                <p className="mt-1 font-medium">{nightsCount} night{nightsCount > 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {bookingData.total_amount.toLocaleString('en-US')} LBP × {nightsCount} night{nightsCount > 1 ? 's' : ''}
                  </span>
                  <span className="font-medium">{(bookingData.total_amount * nightsCount).toLocaleString('en-US')} LBP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cleaning fee</span>
                  <span className="font-medium">0 LBP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service fee</span>
                  <span className="font-medium">0 LBP</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{(bookingData.total_amount * nightsCount).toLocaleString('en-US')} LBP</span>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="px-6 py-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cancellation Policy</h3>
              <p className="text-gray-600">{bookingData.cancellation_policy}</p>
            </div>

            {/* Download Receipt */}
            <div className="px-6 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Booking Receipt</h3>
                  <p className="text-gray-600">Download your confirmation receipt</p>
                </div>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg className="mr-2 -ml-1 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
              </div>
            </div>

            {/* Continue Button */}
            <div className="px-6 py-6">
              <Link 
                to="/dashboard/guest"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue Browsing
              </Link>
              <p className="mt-3 text-center text-sm text-gray-500">
                Need help? <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Contact support</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_BookingConfirmation;