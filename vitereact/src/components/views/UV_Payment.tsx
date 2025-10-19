import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

const UV_Payment: React.FC = () => {
  // Extract booking_id from URL search params
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id') || '';
  
  // Global state
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Local state
  const [paymentDetails, setPaymentDetails] = useState({
    card_number: '',
    expiry_date: '',
    cvv: '',
    cardholder_name: ''
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  // Redirect if no booking ID
  useEffect(() => {
    if (!bookingId) {
      navigate('/dashboard/guest');
    }
  }, [bookingId, navigate]);
  
  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setError(null);
    
    // Format card number (#### #### #### ####)
    if (name === 'card_number') {
      const formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim()
        .slice(0, 19);
      setPaymentDetails(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    // Format expiry date (MM/YY)
    if (name === 'expiry_date') {
      const formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d{0,2})/, '$1/$2')
        .slice(0, 5);
      setPaymentDetails(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    // Format CVV (3-4 digits)
    if (name === 'cvv') {
      const formattedValue = value.replace(/\D/g, '').slice(0, 4);
      setPaymentDetails(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    setPaymentDetails(prev => ({ ...prev, [name]: value }));
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authToken) {
      setError('Authentication required. Please log in again.');
      return;
    }
    
    // Basic validation
    if (!paymentDetails.card_number || !paymentDetails.expiry_date || 
        !paymentDetails.cvv || !paymentDetails.cardholder_name) {
      setError('Please fill in all payment details.');
      return;
    }
    
    // Additional validation
    const cardNumber = paymentDetails.card_number.replace(/\s/g, '');
    if (cardNumber.length < 16) {
      setError('Please enter a valid card number.');
      return;
    }
    
    if (!/^\d{2}\/\d{2}$/.test(paymentDetails.expiry_date)) {
      setError('Please enter a valid expiration date (MM/YY).');
      return;
    }
    
    if (paymentDetails.cvv.length < 3) {
      setError('Please enter a valid CVV.');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // Format expiry date for API (YYYY-MM)
      const [month, year] = paymentDetails.expiry_date.split('/');
      const fullYear = `20${year}`;
      const formattedExpiry = `${fullYear}-${month.padStart(2, '0')}`;
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/${bookingId}/payment`,
        {
          card_number: cardNumber,
          expiry_date: formattedExpiry,
          cvv: paymentDetails.cvv,
          cardholder_name: paymentDetails.cardholder_name
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      if (response.data.success) {
        navigate(`/bookings/confirmation?booking_id=${response.data.booking_id}`);
      } else {
        // Simulate a failure for demonstration
        navigate(`/payments/retry?booking_id=${bookingId}`);
      }
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError(err.response?.data?.error_message || 'An error occurred during payment processing. Please try again.');
      setProcessing(false);
    }
  }, [paymentDetails, authToken, bookingId, navigate]);
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Secure Payment</h1>
            <p className="mt-2 text-gray-600">Complete your booking with a secure payment</p>
          </div>
          
          <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Booking ID: {bookingId}</h2>
              <p className="text-gray-600 mt-1">Please enter your payment details below</p>
            </div>
            
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="cardholder_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  id="cardholder_name"
                  name="cardholder_name"
                  type="text"
                  required
                  value={paymentDetails.cardholder_name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={processing}
                />
              </div>
              
              <div>
                <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  id="card_number"
                  name="card_number"
                  type="text"
                  required
                  value={paymentDetails.card_number}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={processing}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    id="expiry_date"
                    name="expiry_date"
                    type="text"
                    required
                    value={paymentDetails.expiry_date}
                    onChange={handleInputChange}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    disabled={processing}
                  />
                </div>
                
                <div>
                  <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    id="cvv"
                    name="cvv"
                    type="text"
                    required
                    value={paymentDetails.cvv}
                    onChange={handleInputChange}
                    placeholder="123"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    disabled={processing}
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={processing}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Payment...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs">Your payment details are securely processed</span>
              </div>
              <p className="mt-2 text-center text-xs text-gray-500">
                This is a mock payment gateway for demonstration purposes only
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Payment;