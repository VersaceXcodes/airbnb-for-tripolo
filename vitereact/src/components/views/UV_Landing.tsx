import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const UV_Landing: React.FC = () => {
  // Global state from store
  const searchFilters = useAppStore(state => state.search_filters);
  const updateSearchFilters = useAppStore(state => state.update_search_filters);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  
  // Local state for form fields
  const [searchQuery, setSearchQuery] = useState<string>(searchFilters.location || '');
  const [checkInDate, setCheckInDate] = useState<string>(searchFilters.check_in || '');
  const [checkOutDate, setCheckOutDate] = useState<string>(searchFilters.check_out || '');
  const [guestsCount, setGuestsCount] = useState<number>(searchFilters.guests || 1);
  const [errors, setErrors] = useState<{checkIn?: string; checkOut?: string}>({});
  
  const navigate = useNavigate();

  // Update local state when global state changes
  useEffect(() => {
    setSearchQuery(searchFilters.location || '');
    setCheckInDate(searchFilters.check_in || '');
    setCheckOutDate(searchFilters.check_out || '');
    setGuestsCount(searchFilters.guests || 1);
  }, [searchFilters]);

  // Validate date inputs
  const validateDates = () => {
    const newErrors: {checkIn?: string; checkOut?: string} = {};
    
    if (checkInDate && checkOutDate && new Date(checkInDate) >= new Date(checkOutDate)) {
      newErrors.checkOut = 'تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDates()) return;
    
    // Update global search filters
    updateSearchFilters({
      location: searchQuery || null,
      check_in: checkInDate || null,
      check_out: checkOutDate || null,
      guests: guestsCount || null
    });
    
    // Navigate to search results
    navigate('/search');
  };

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-white focus:text-blue-600 z-50"
      >
        التخطي إلى المحتوى الرئيسي
      </a>

      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564228519879-3e287a1c4a14?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-20"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                اكتشف أماكن الإقامة في طرابلس
              </h1>
              <p className="mt-6 text-xl text-gray-700 max-w-3xl mx-auto">
                ابحث عن أماكن الإقامة المثالية لرحلاتك القادمة في مدينة طرابلس الجميلة
              </p>
            </div>
            
            {/* Search Form */}
            <div className="mt-12 max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Location Input */}
                  <div className="lg:col-span-2">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      الموقع
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="location"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="طرابلس، لبنان"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none"
                        aria-describedby="location-help"
                      />
                    </div>
                    <p id="location-help" className="mt-1 text-xs text-gray-500">
                      محدود بمنطقة طرابلس الكبرى
                    </p>
                  </div>
                  
                  {/* Check-in Date */}
                  <div>
                    <label htmlFor="check-in" className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ الوصول
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        id="check-in"
                        value={checkInDate}
                        onChange={(e) => {
                          setCheckInDate(e.target.value);
                          if (errors.checkIn) {
                            setErrors(prev => ({ ...prev, checkIn: undefined }));
                          }
                        }}
                        className={`block w-full pl-10 pr-3 py-3 border ${errors.checkIn ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none`}
                        aria-describedby={errors.checkIn ? "checkin-error" : undefined}
                      />
                    </div>
                    {errors.checkIn && (
                      <p id="checkin-error" className="mt-1 text-xs text-red-600">
                        {errors.checkIn}
                      </p>
                    )}
                  </div>
                  
                  {/* Check-out Date */}
                  <div>
                    <label htmlFor="check-out" className="block text-sm font-medium text-gray-700 mb-1">
                      تاريخ المغادرة
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        id="check-out"
                        value={checkOutDate}
                        onChange={(e) => {
                          setCheckOutDate(e.target.value);
                          if (errors.checkOut) {
                            setErrors(prev => ({ ...prev, checkOut: undefined }));
                          }
                        }}
                        className={`block w-full pl-10 pr-3 py-3 border ${errors.checkOut ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none`}
                        aria-describedby={errors.checkOut ? "checkout-error" : undefined}
                      />
                    </div>
                    {errors.checkOut && (
                      <p id="checkout-error" className="mt-1 text-xs text-red-600">
                        {errors.checkOut}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Guest Selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
                      عدد الضيوف
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                      <select
                        id="guests"
                        value={guestsCount}
                        onChange={(e) => setGuestsCount(parseInt(e.target.value))}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? 'ضيف' : 'ضيوف'}
                          </option>
                        ))}
                        <option value="9">9+ ضيوف</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="lg:col-span-3 flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    >
                      اكتشف أماكن الإقامة
                    </button>
                  </div>
                </div>
              </form>
            </div>
            
            {/* CTA Buttons */}
            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/search" 
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-blue-100 hover:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 text-center"
              >
                تصفح أماكن الإقامة
              </Link>
              
              {!isAuthenticated ? (
                <Link 
                  to="/login" 
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 text-center"
                >
                  تسجيل الدخول / إنشاء حساب
                </Link>
              ) : (
                <Link 
                  to="/dashboard/guest" 
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 text-center"
                >
                  لوحة التحكم الخاصة بي
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                لماذا تختار TripoStay؟
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                تجربة إقامة فريدة في قلب مدينة طرابلس التاريخية
              </p>
            </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
                  <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  أماكن إقامة متنوعة
                </h3>
                <p className="mt-2 text-gray-600">
                  اختر من بين مجموعة متنوعة من الشقق والبيوت الخاصة والمزارع في مختلف أحياء طرابلس
                </p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
                  <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  حجز فوري
                </h3>
                <p className="mt-2 text-gray-600">
                  احجز مكانك على الفور دون انتظار الموافقة مع خيار الإلغاء المجاني في معظم الأماكن
                </p>
              </div>
              
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100">
                  <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  تواصل مباشر
                </h3>
                <p className="mt-2 text-gray-600">
                  تواصل مع المضيفين مباشرة من خلال منصتنا الآمنة لطرح أي أسئلة قبل الحجز
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Popular Destinations Preview */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                اكتشف أحياء طرابلس
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                مناطق شهيرة للإقامة والزيارة في قلب المدينة
              </p>
            </div>
            
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: 'السوق', description: 'القلب التجاري للعمارة العثمانية التاريخية' },
                { name: 'الميناء', description: 'واجهة بحرية خلابة مع منافذ الطعام المحلية' },
                { name: 'جبلة', description: 'منطقة سكنية هادئة مع إطلالات رائعة' },
                { name: 'الصالحية', description: 'أحياء حديثة مع وسائل راحة معاصرة' }
              ].map((district) => (
                <div key={district.name} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900">{district.name}</h3>
                    <p className="mt-2 text-gray-600">{district.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Landing;