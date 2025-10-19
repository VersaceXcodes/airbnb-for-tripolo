import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/main';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Star, Flag } from 'lucide-react';

const UV_Reviews_Host: React.FC = () => {
  // Auth state from global store
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Local state for filtering
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Fetch reviews for host's properties
  const {
    data: reviewsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['host-reviews', currentUser?.user_id],
    queryFn: async () => {
      if (!currentUser?.user_id || !authToken) {
        throw new Error('User not authenticated');
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/reviews/search`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          },
          params: {
            host_id: currentUser.user_id
          }
        }
      );
      
      return response.data;
    },
    enabled: !!currentUser?.user_id && !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });
  
  // Filter and sort reviews
  const filteredReviews = useMemo(() => {
    if (!reviewsData?.reviews) return [];
    
    let result = [...reviewsData.reviews];
    
    // Apply rating filter
    if (ratingFilter !== null) {
      result = result.filter(review => review.rating === ratingFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  }, [reviewsData, ratingFilter, sortOrder]);
  
  // Calculate aggregate statistics
  const stats = useMemo(() => {
    if (!reviewsData?.reviews || reviewsData.reviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: [0, 0, 0, 0, 0]
      };
    }
    
    const reviews = reviewsData.reviews;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    // Calculate rating distribution (5 stars to 1 star)
    const ratingDistribution = [0, 0, 0, 0, 0];
    reviews.forEach(review => {
      ratingDistribution[5 - review.rating] += 1;
    });
    
    return {
      averageRating,
      totalReviews: reviews.length,
      ratingDistribution
    };
  }, [reviewsData]);
  
  // Handle flagging a review
  const handleFlagReview = async (reviewId: string) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/reviews/${reviewId}/flag`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      // Refresh the reviews data
      refetch();
    } catch (err) {
      console.error('Error flagging review:', err);
      // In a real app, we would show an error notification
    }
  };
  
  // Render star rating component
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">إدارة التقييمات</h1>
            <p className="mt-2 text-gray-600">عرض وتحليل تقييمات الضيوف لعقاراتك</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium text-red-800">حدث خطأ أثناء تحميل التقييمات</h3>
              <p className="mt-2 text-red-700">
                {(error as Error)?.message || 'الرجاء المحاولة مرة أخرى لاحقًا'}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {stats.averageRating.toFixed(1)} من 5
                    </h2>
                    <div className="flex items-center mt-1">
                      {renderStars(Math.round(stats.averageRating))}
                      <span className="mr-2 text-gray-600">
                        ({stats.totalReviews} تقييم)
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0">
                    <button
                      onClick={() => refetch()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      تحديث البيانات
                    </button>
                  </div>
                </div>
                
                {/* Rating Distribution */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">توزيع التقييمات</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center">
                        <span className="w-10 text-gray-600">{rating} نجوم</span>
                        <div className="flex-1 mx-4">
                          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: stats.totalReviews > 0 
                                  ? `${(stats.ratingDistribution[5 - rating] / stats.totalReviews) * 100}%` 
                                  : '0%'
                              }}
                            ></div>
                          </div>
                        </div>
                        <span className="w-12 text-gray-600 text-left">
                          {stats.ratingDistribution[5 - rating]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">التصفية</h3>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => setRatingFilter(null)}
                        className={`px-3 py-1 rounded-full text-sm ${
                          ratingFilter === null
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        الكل
                      </button>
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setRatingFilter(ratingFilter === rating ? null : rating)}
                          className={`px-3 py-1 rounded-full text-sm flex items-center ${
                            ratingFilter === rating
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {renderStars(rating)}
                          <span className="mr-1">{rating}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <label htmlFor="sort" className="mr-2 text-gray-700">الترتيب:</label>
                    <select
                      id="sort"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                      className="border border-gray-300 rounded-md px-3 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="newest">الأحدث أولاً</option>
                      <option value="oldest">الأقدم أولاً</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Reviews List */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                      <Star className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">لا توجد تقييمات</h3>
                    <p className="mt-1 text-gray-500">
                      {ratingFilter 
                        ? `لا توجد تقييمات بـ ${ratingFilter} نجوم` 
                        : 'لم يقم الضيوف بتقييم عقاراتك بعد'}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filteredReviews.map((review) => (
                      <li key={review.review_id} className="p-6">
                        <div className="flex flex-col sm:flex-row">
                          <div className="flex-shrink-0 mb-4 sm:mb-0 sm:ml-6">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between">
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">
                                  {review.is_anonymous ? 'ضيف مجهول' : 'ضيف معروف'}
                                </h4>
                                <div className="flex items-center mt-1">
                                  {renderStars(review.rating)}
                                  <span className="mr-2 text-gray-500 text-sm">
                                    {formatDate(review.created_at)}
                                  </span>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleFlagReview(review.review_id)}
                                className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
                                aria-label="الإبلاغ عن تقييم غير لائق"
                              >
                                <Flag className="w-5 h-5 ml-1" />
                                <span>إبلاغ</span>
                              </button>
                            </div>
                            
                            {review.comment && (
                              <div className="mt-4 text-gray-700">
                                <p>{review.comment}</p>
                              </div>
                            )}
                            
                            {review.is_flagged && (
                              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                <Flag className="w-4 h-4 ml-1" />
                                تم الإبلاغ
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_Reviews_Host;