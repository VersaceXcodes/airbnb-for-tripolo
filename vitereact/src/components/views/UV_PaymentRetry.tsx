import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_PaymentRetry: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Authentication state
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  
  // Local state
  const [bookingId, setBookingId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryAttempt, setRetryAttempt] = useState<number>(1);

  // Extract parameters from URL
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const bookingIdParam = searchParams.get('booking_id') || '';
    const errorParam = searchParams.get('error') || 'Payment processing failed. Please try again.';
    
    setBookingId(bookingIdParam);
    setErrorMessage(decodeURIComponent(errorParam));
    
    // Increment retry attempt if coming from a previous retry
    const attemptParam = searchParams.get('attempt');
    if (attemptParam) {
      const attempt = parseInt(attemptParam, 10);
      if (!isNaN(attempt) && attempt > 0) {
        setRetryAttempt(attempt + 1);
      }
    }
  }, [location, isAuthenticated, navigate]);

  const handleRetryPayment = () => {
    // Navigate back to payment page with preserved context
    navigate(`/payments?booking_id=${bookingId}`);
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-xl rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-red-600 px-6 py-8 sm:px-10">
              <div className="flex items-center justify-center">
                <div className="flex-shrink-0">
                  <svg className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h1 className="text-3xl font-bold text-white">Payment Failed</h1>
                  <p className="mt-1 text-red-100">Your payment could not be processed</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8 sm:px-10">
              <div className="space-y-6">
                {/* Error Details */}
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Booking Reference</p>
                      <p className="text-sm font-medium text-gray-900">{bookingId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Retry Attempt</p>
                      <p className="text-sm font-medium text-gray-900">#{retryAttempt}</p>
                    </div>
                  </div>
                </div>

                {/* Possible Reasons */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900">Possible Reasons</h3>
                  <ul className="mt-2 space-y-2">
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">Insufficient funds in your account</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">Incorrect card information</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">Card expired or blocked</span>
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-600">Network connectivity issues</span>
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                  <button
                    onClick={handleRetryPayment}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Retry Payment
                  </button>
                  <button
                    onClick={() => navigate('/dashboard/guest')}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg shadow-sm hover:bg-gray-50 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 sm:px-10">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="h-5 w-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Need help? Contact our support team at support@tripostay.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_PaymentRetry;