import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Define the property type based on the schema
interface RecommendedProperty {
  property_id: string;
  title: string;
  daily_price: number;
  image_url: string;
}

const UV_HomeGuest: React.FC = () => {
  // Get authentication state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  
  // Fetch recommended properties
  const {
    data: recommendedProperties,
    isLoading,
    isError,
    error
  } = useQuery<RecommendedProperty[]>({
    queryKey: ['recommendedProperties'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/search`,
        {
          params: {
            query: 'recommended',
            limit: 6
          }
        }
      );
      
      // Map response to the format we need
      return response.data.properties.map((property: any) => ({
        property_id: property.property_id,
        title: property.title,
        daily_price: Number(property.daily_price || 0),
        image_url: property.images?.[0]?.image_url || 'https://picsum.photos/300/200'
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Loading state
  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
                  <div className="bg-gray-200 h-48 w-full"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (isError) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-medium text-red-800 mb-2">Error loading recommendations</h3>
                <p className="text-red-700 mb-4">
                  {error instanceof Error ? error.message : 'Failed to load recommended properties'}
                </p>
                <button 
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              أهلاً وسهلاً, {currentUser?.full_name || currentUser?.username || 'ضيفنا الكريم'}!
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              اكتشف أفضل أماكن الإقامة في طرابلس والمدينة القديمة
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Link 
              to="/search" 
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center text-center"
            >
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">تصفح الإقامات</h3>
              <p className="text-gray-600">اكتشف أماكن الإقامة المتاحة في طرابلس</p>
            </Link>
            
            <Link 
              to="/wishlist" 
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center text-center"
            >
              <div className="bg-pink-100 p-3 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">قائمة الأمنيات</h3>
              <p className="text-gray-600">عرض الإقامات المحفوظة لديك</p>
            </Link>
            
            <Link 
              to="/bookings/guest" 
              className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 flex flex-col items-center text-center"
            >
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">حجوزاتي</h3>
              <p className="text-gray-600">إدارة حجوزاتك الحالية والماضية</p>
            </Link>
          </div>

          {/* Recommended Properties Section */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">الإقامات الموصى بها</h2>
              <Link 
                to="/search" 
                className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
              >
                عرض الكل
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {recommendedProperties && recommendedProperties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedProperties.map((property) => (
                  <Link 
                    to={`/properties/${property.property_id}`} 
                    key={property.property_id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className="relative h-48">
                      <img 
                        src={property.image_url} 
                        alt={property.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://picsum.photos/300/200';
                        }}
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gray-900">
                          {property.daily_price.toLocaleString('ar-LB')} ل.ل
                        </span>
                        <span className="text-gray-600">لكل ليلة</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">لا توجد إقامات موصى بها</h3>
                <p className="text-gray-600 mb-6">جرب تصفح الإقامات للعثور على أماكن رائعة</p>
                <Link 
                  to="/search" 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block"
                >
                  تصفح الإقامات
                </Link>
              </div>
            )}
          </div>

          {/* Profile Completion Prompt */}
          {!currentUser?.full_name && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-100">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0 md:ml-4 text-center md:text-right">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">أكمل ملفك الشخصي</h3>
                  <p className="text-gray-600">أضف اسمك وصورتك الشخصية لتلقي توصيات أكثر تخصيصاً</p>
                </div>
                <Link 
                  to="/profile" 
                  className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium border border-blue-200 hover:bg-blue-50 transition-colors whitespace-nowrap"
                >
                  تحسين الملف الشخصي
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_HomeGuest;