import React from 'react';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, User, Calendar, Users } from 'lucide-react';

const UV_HostBookings: React.FC = () => {
  // Global state selectors
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();
  
  // Fetch host bookings
  const { data: bookings = [], isLoading, isError, error } = useQuery({
    queryKey: ['host-bookings', currentUser?.user_id],
    queryFn: async () => {
      if (!currentUser?.user_id || !authToken) return [];
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/search`,
        {
          params: { host_id: currentUser.user_id },
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      
      return response.data.bookings || [];
    },
    enabled: !!currentUser?.user_id && !!authToken,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ booking_id, status }: { booking_id: string; status: string }) => {
      if (!authToken) throw new Error('No auth token');
      
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/${booking_id}`,
        { status },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['host-bookings', currentUser?.user_id] });
    }
  });
  
  // Handle accept booking
  const handleAcceptBooking = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ booking_id: bookingId, status: 'confirmed' });
  };
  
  // Handle decline booking
  const handleDeclineBooking = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ booking_id: bookingId, status: 'declined' });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', { locale: ar });
  };
  
  // Get status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'declined':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };
  
  // Get status text in Arabic
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد الانتظار';
      case 'confirmed':
        return 'مؤكد';
      case 'declined':
        return 'مرفوض';
      case 'completed':
        return 'مكتمل';
      default:
        return status;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">طلبات الحجز</h1>
            <p className="mt-1 text-gray-600">إدارة طلبات الحجز للإقامات الخاصة بك</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium text-red-800">خطأ في تحميل الطلبات</h3>
              <p className="mt-2 text-red-700">
                {error instanceof Error ? error.message : 'حدث خطأ أثناء تحميل طلبات الحجز'}
              </p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['host-bookings', currentUser?.user_id] })}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">لا توجد طلبات حجز</h3>
              <p className="mt-1 text-gray-500">ليس لديك أي طلبات حجز في الوقت الحالي</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking: any) => (
                <div key={booking.booking_id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">طلب حجز</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          #{booking.booking_id.substring(0, 8)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{getStatusText(booking.status)}</span>
                      </span>
                    </div>
                    
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center">
                        <User className="flex-shrink-0 h-5 w-5 text-gray-400" />
                        <span className="mr-2 text-sm font-medium text-gray-700">الضيف:</span>
                        <span className="text-sm text-gray-900">ضيف {booking.guest_id.substring(0, 6)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="flex-shrink-0 h-5 w-5 text-gray-400" />
                        <span className="mr-2 text-sm font-medium text-gray-700">التواريخ:</span>
                        <div className="text-sm text-gray-900">
                          <p>{formatDate(booking.check_in_date)}</p>
                          <p>إلى {formatDate(booking.check_out_date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Users className="flex-shrink-0 h-5 w-5 text-gray-400" />
                        <span className="mr-2 text-sm font-medium text-gray-700">الضيوف:</span>
                        <span className="text-sm text-gray-900">{booking.guests_count} ضيوف</span>
                      </div>
                    </div>
                    
                    {booking.status === 'pending' && (
                      <div className="mt-6 flex space-x-3">
                        <button
                          onClick={() => handleAcceptBooking(booking.booking_id)}
                          disabled={updateBookingStatusMutation.isPending}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {updateBookingStatusMutation.isPending ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              جاري التأكيد...
                            </span>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 ml-1" />
                              تأكيد
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeclineBooking(booking.booking_id)}
                          disabled={updateBookingStatusMutation.isPending}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {updateBookingStatusMutation.isPending ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              جاري الرفض...
                            </span>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 ml-1" />
                              رفض
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_HostBookings;