import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import axios from 'axios';

// Types based on the Zod schemas
interface Booking {
  booking_id: string;
  property_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_amount: number;
  status: string;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface Property {
  property_id: string;
  host_id: string;
  title: string;
  description: string | null;
  property_type: string;
  daily_price: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  check_in_instructions: string | null;
  amenities: string | null;
  is_instant_book: boolean;
  cancellation_policy: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateReviewInput {
  review_id: string;
  property_id: string;
  booking_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  is_anonymous: boolean;
}

const UV_Reviews_Guest: React.FC = () => {
  // Extract booking_id from URL params
  const { booking_id } = useParams<{ booking_id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Global auth state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  // Local state for review form
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
    is_anonymous: false
  });
  const [commentWordCount, setCommentWordCount] = useState(0);
  const maxWords = 175;

  // Fetch booking details
  const { data: bookingInfo, isLoading: isBookingLoading, error: bookingError } = useQuery<Booking>({
    queryKey: ['booking', booking_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/bookings/${booking_id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    enabled: !!booking_id && !!authToken
  });

  // Fetch property details for title
  const { data: propertyInfo, isLoading: isPropertyLoading } = useQuery<Property>({
    queryKey: ['property', bookingInfo?.property_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${bookingInfo?.property_id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    enabled: !!bookingInfo?.property_id && !!authToken
  });

  // Handle comment change with word count
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const wordCount = words.length;
    
    if (wordCount <= maxWords) {
      setReviewData(prev => ({ ...prev, comment: text }));
      setCommentWordCount(wordCount);
    }
  };

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: CreateReviewInput) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/reviews`,
        reviewData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries and redirect
      queryClient.invalidateQueries({ queryKey: ['property', bookingInfo?.property_id] });
      navigate('/dashboard/guest');
    },
    onError: (error) => {
      console.error('Failed to submit review:', error);
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingInfo || !currentUser) return;
    
    const reviewPayload: CreateReviewInput = {
      review_id: `rev_${Date.now()}`, // Generate a unique ID
      property_id: bookingInfo.property_id,
      booking_id: bookingInfo.booking_id,
      reviewer_id: currentUser.user_id,
      rating: reviewData.rating,
      comment: reviewData.comment || null,
      is_anonymous: reviewData.is_anonymous
    };
    
    submitReviewMutation.mutate(reviewPayload);
  };

  // Handle star rating change
  const handleRatingChange = (rating: number) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  // Calculate stay dates
  const checkInDate = bookingInfo?.check_in_date 
    ? new Date(bookingInfo.check_in_date).toLocaleDateString('ar-EG', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) 
    : '';
    
  const checkOutDate = bookingInfo?.check_out_date 
    ? new Date(bookingInfo.check_out_date).toLocaleDateString('ar-EG', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) 
    : '';

  // Loading state
  if (isBookingLoading || isPropertyLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">جارٍ تحميل تفاصيل الحجز...</h1>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (bookingError) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">حدث خطأ</h1>
                <p className="text-gray-700 mb-6">لم نتمكن من تحميل تفاصيل الحجز الخاص بك. يرجى المحاولة مرة أخرى لاحقًا.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Main component render
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white">
              <h1 className="text-2xl font-bold mb-2">شارك تجربتك</h1>
              <p className="opacity-90">ساعد الآخرين في اتخاذ قرارهم من خلال مشاركة تجربتك في الإقامة</p>
            </div>
            
            {/* Property Info */}
            <div className="px-6 py-6 border-b border-gray-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                <div className="mr-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {propertyInfo?.title || 'جارٍ تحميل اسم العقار...'}
                  </h2>
                  <p className="text-gray-600">
                    {checkInDate} - {checkOutDate}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Review Form */}
            <form onSubmit={handleSubmit} className="px-6 py-6">
              {/* Rating Section */}
              <div className="mb-8">
                <label className="block text-lg font-medium text-gray-900 mb-4">
                  ما هي تقييمك للإقامة؟
                </label>
                <div className="flex justify-center space-x-reverse space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className="text-3xl focus:outline-none"
                      aria-label={`التقييم بـ ${star} نجوم`}
                    >
                      {star <= reviewData.rating ? (
                        <span className="text-yellow-400">★</span>
                      ) : (
                        <span className="text-gray-300">☆</span>
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-center text-sm text-gray-500">
                  {reviewData.rating} من 5 نجوم
                </div>
              </div>
              
              {/* Comment Section */}
              <div className="mb-6">
                <label htmlFor="comment" className="block text-lg font-medium text-gray-900 mb-2">
                  شارك تجربتك (اختياري)
                </label>
                <textarea
                  id="comment"
                  rows={5}
                  value={reviewData.comment}
                  onChange={handleCommentChange}
                  placeholder="ما الذي أعجبك أو لم يعجبك في الإقامة؟"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="mt-2 flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {commentWordCount} / {maxWords} كلمة
                  </div>
                  {commentWordCount > maxWords && (
                    <div className="text-sm text-red-600">
                      تجاوزت الحد الأقصى للكلمات
                    </div>
                  )}
                </div>
              </div>
              
              {/* Anonymous Toggle */}
              <div className="mb-8">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviewData.is_anonymous}
                    onChange={(e) => setReviewData(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="mr-3 text-gray-700">
                    نشر المراجعة بشكل مجهول
                  </span>
                </label>
                <p className="mt-2 text-sm text-gray-500 mr-8">
                  سيتم عرض مراجعتك دون اسمك الحقيقي إذا اخترت هذا الخيار
                </p>
              </div>
              
              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:space-x-reverse sm:space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/guest')}
                  className="mb-4 sm:mb-0 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitReviewMutation.isPending || commentWordCount > maxWords}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    submitReviewMutation.isPending || commentWordCount > maxWords
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {submitReviewMutation.isPending ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جارٍ الإرسال...
                    </span>
                  ) : (
                    'إرسال المراجعة'
                  )}
                </button>
              </div>
              
              {/* Error Message */}
              {submitReviewMutation.isError && (
                <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm">حدث خطأ أثناء إرسال المراجعة. يرجى المحاولة مرة أخرى.</p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Reviews_Guest;