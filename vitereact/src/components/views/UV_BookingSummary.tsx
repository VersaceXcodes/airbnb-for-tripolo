import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Property } from '@/DB/zodschemas';

const UV_BookingSummary: React.FC = () => {
  // Global state
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const updateBookingState = useAppStore(state => state.update_booking_state);
  
  // Routing
  const navigate = useNavigate();
  const location = useLocation();
  
  // Local state
  const [acceptCancellationPolicy, setAcceptCancellationPolicy] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Extract URL parameters
  const searchParams = new URLSearchParams(location.search);
  const propertyId = searchParams.get('property_id') || '';
  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const guests = parseInt(searchParams.get('guests') || '1', 10);
  
  // Validate required parameters
  const isValid = propertyId && checkIn && checkOut && guests > 0;
  
  // Fetch property details
  const { data: property, isLoading: isPropertyLoading, error: propertyError } = useQuery<Property>({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${propertyId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    enabled: !!propertyId && !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
  
  // Calculate booking duration
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate total amount
  const baseAmount = property?.daily_price ? property.daily_price * nights : 0;
  const serviceFee = baseAmount * 0.1; // 10% service fee
  const cleaningFee = 25000; // Fixed cleaning fee in LBP
  const totalAmount = baseAmount + serviceFee + cleaningFee;
  
  // Handle booking creation
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptCancellationPolicy) {
      setError('يجب الموافقة على سياسة الإلغاء لإكمال الحجز');
      return;
    }
    
    if (!property) {
      setError('حدث خطأ في تحميل تفاصيل العقار');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings`,
        {
          property_id: propertyId,
          check_in_date: checkIn,
          check_out_date: checkOut,
          guests_count: guests,
          total_amount: totalAmount
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      const bookingId = response.data.booking.booking_id;
      
      // Update global booking state
      updateBookingState({
        selected_property_id: propertyId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        total_amount: totalAmount,
        is_booking_confirmed: true
      });
      
      // Navigate to payment page
      navigate(`/payments?booking_id=${bookingId}`);
    } catch (err) {
      setError('فشل في إنشاء الحجز. يرجى المحاولة مرة أخرى.');
      console.error('Booking creation error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Redirect if missing required parameters
  useEffect(() => {
    if (!isValid) {
      navigate('/search');
    }
  }, [isValid, navigate]);
  
  // Reset error when inputs change
  useEffect(() => {
    setError(null);
  }, [acceptCancellationPolicy, specialRequests]);
  
  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">معلومات الحجز غير مكتملة</h2>
          <p className="text-gray-600 mb-6">جاري إعادة توجيهك إلى البحث...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">ملخص الحجز</h1>
            <p className="mt-2 text-gray-600">يرجى مراجعة تفاصيل الحجز قبل الدفع</p>
          </div>
          
          {propertyError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              <p>حدث خطأ أثناء تحميل تفاصيل العقار. يرجى المحاولة مرة أخرى.</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              <p>{error}</p>
            </div>
          )}
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Property Details */}
              <div className="lg:col-span-2 p-6 border-l border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{property?.title || 'جاري تحميل العقار...'}</h2>
                    <p className="text-gray-600">{property?.address || ''}</p>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">تفاصيل الحجز</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">تسجيل الوصول</p>
                      <p className="font-medium">{checkIn}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">تسجيل المغادرة</p>
                      <p className="font-medium">{checkOut}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">عدد الليالي</p>
                      <p className="font-medium">{nights} ليالي</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">الضيوف</p>
                      <p className="font-medium">{guests} ضيوف</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">سياسة الإلغاء</h3>
                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700">
                      {property?.cancellation_policy || 'يمكن الإلغاء مجاناً قبل 48 ساعة من تسجيل الوصول.'}
                    </p>
                  </div>
                  
                  <div className="mt-4 flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="accept-policy"
                        name="accept-policy"
                        type="checkbox"
                        checked={acceptCancellationPolicy}
                        onChange={(e) => setAcceptCancellationPolicy(e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="accept-policy" className="font-medium text-gray-700">
                        أوافق على سياسة الإلغاء
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">طلبات خاصة</h3>
                  <textarea
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="هل لديك أي طلبات خاصة؟ (اختياري)"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                  />
                </div>
              </div>
              
              {/* Price Breakdown */}
              <div className="bg-gray-50 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">تفاصيل السعر</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {property?.daily_price?.toLocaleString('ar-LB')} ل.ل × {nights} ليالي
                    </span>
                    <span className="font-medium">{baseAmount.toLocaleString('ar-LB')} ل.ل</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">رسوم الخدمة</span>
                    <span className="font-medium">{serviceFee.toLocaleString('ar-LB')} ل.ل</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">رسوم التنظيف</span>
                    <span className="font-medium">{cleaningFee.toLocaleString('ar-LB')} ل.ل</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">المجموع</span>
                      <span className="text-lg font-bold text-gray-900">{totalAmount.toLocaleString('ar-LB')} ل.ل</span>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleCreateBooking} className="mt-8">
                  <button
                    type="submit"
                    disabled={loading || !acceptCancellationPolicy || isPropertyLoading}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loading || !acceptCancellationPolicy || isPropertyLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري المعالجة...
                      </>
                    ) : (
                      'تأكيد ودفع'
                    )}
                  </button>
                </form>
                
                <div className="mt-4 text-xs text-gray-500 text-center">
                  <p>بالنقر على "تأكيد ودفع" فإنك توافق على</p>
                  <p className="mt-1">شروط الخدمة وسياسة الخصوصية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_BookingSummary;