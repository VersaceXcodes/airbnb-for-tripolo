import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { createPropertyInputSchema, createPropertyImageInputSchema, createAvailabilityDateInputSchema } from '@/db/zodschemas';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const UV_Listing_Create: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  
  // Global state
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Property data state
  const [formData, setFormData] = useState({
    property_id: uuidv4(),
    host_id: currentUser?.user_id || '',
    title: '',
    description: '',
    property_type: '',
    daily_price: 0,
    address: '',
    latitude: 34.4333,
    longitude: 35.8500,
    check_in_instructions: '',
    amenities: [] as string[],
    is_instant_book: false,
    cancellation_policy: '',
    is_active: true
  });
  
  // Images state
  const [images, setImages] = useState<Array<{
    id: string;
    file: File | null;
    previewUrl: string;
    isPrimary: boolean;
    displayOrder: number;
  }>>([]);
  
  // Availability state
  const [availabilityDates, setAvailabilityDates] = useState<Array<{
    date: string;
    isAvailable: boolean;
  }>>([]);
  
  // Current month for calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Property types
  const propertyTypes = [
    { value: 'entire_place', label: 'الغرفة بأكملها' },
    { value: 'private_room', label: 'غرفة خاصة' },
    { value: 'shared_room', label: 'غرفة مشتركة' }
  ];
  
  // Cancellation policies
  const cancellationPolicies = [
    { value: 'flexible', label: 'مرن - استرداد كامل حتى 24 ساعة قبل الوصول' },
    { value: 'moderate', label: 'متوسط - استرداد 50% حتى 7 أيام قبل الوصول' },
    { value: 'strict', label: 'صارم - لا يوجد استرداد' }
  ];
  
  // Amenities
  const amenitiesOptions = [
    { id: 'wifi', label: 'واي فاي' },
    { id: 'ac', label: 'تكييف هواء' },
    { id: 'kitchen', label: 'مطبخ' },
    { id: 'parking', label: 'موقف سيارات' },
    { id: 'tv', label: 'تلفاز' },
    { id: 'washer', label: 'غسالة ملابس' },
    { id: 'dryer', label: 'مجفف ملابس' },
    { id: 'pool', label: 'بركة سباحة' },
    { id: 'garden', label: 'حديقة' },
    { id: 'balcony', label: 'شرفة' }
  ];
  
  // Initialize host_id
  useEffect(() => {
    if (currentUser?.user_id) {
      setFormData(prev => ({
        ...prev,
        host_id: currentUser.user_id
      }));
    }
  }, [currentUser]);
  
  // Navigation functions
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      const checked = e.target.checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle number input changes
  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle amenities toggle
  const toggleAmenity = (amenityId: string) => {
    setFormData(prev => {
      const currentAmenities = [...prev.amenities];
      const index = currentAmenities.indexOf(amenityId);
      
      if (index > -1) {
        // Remove amenity
        currentAmenities.splice(index, 1);
      } else {
        // Add amenity
        currentAmenities.push(amenityId);
      }
      
      return {
        ...prev,
        amenities: currentAmenities
      };
    });
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      
      const newImages = files.map((file, index) => ({
        id: uuidv4(),
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: images.length === 0 && index === 0,
        displayOrder: images.length + index
      }));
      
      setImages(prev => [...prev, ...newImages]);
    }
  };
  
  // Remove image
  const removeImage = (id: string) => {
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id);
      
      // If we removed the primary image, make the first image primary
      if (prev.find(img => img.id === id)?.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      
      return newImages;
    });
  };
  
  // Set primary image
  const setPrimaryImage = (id: string) => {
    setImages(prev => prev.map(img => ({
      ...img,
      isPrimary: img.id === id
    })));
  };
  
  // Move image up in order
  const moveImageUp = (index: number) => {
    if (index <= 0) return;
    
    setImages(prev => {
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      
      // Update display order
      newImages.forEach((img, i) => {
        img.displayOrder = i;
      });
      
      return newImages;
    });
  };
  
  // Move image down in order
  const moveImageDown = (index: number) => {
    setImages(prev => {
      if (index >= prev.length - 1) return prev;
      
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      
      // Update display order
      newImages.forEach((img, i) => {
        img.displayOrder = i;
      });
      
      return newImages;
    });
  };
  
  // Generate calendar dates for current month
  const getCalendarDates = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    // Days from previous month to show
    const startDay = firstDay.getDay();
    // Total days to display (6 weeks)
    const totalDays = 42;
    
    const dates = [];
    const currentDate = new Date(firstDay);
    currentDate.setDate(currentDate.getDate() - startDay);
    
    for (let i = 0; i < totalDays; i++) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };
  
  // Toggle date availability
  const toggleDateAvailability = (dateStr: string) => {
    setAvailabilityDates(prev => {
      const existingIndex = prev.findIndex(d => d.date === dateStr);
      
      if (existingIndex > -1) {
        // Toggle availability
        const newDates = [...prev];
        newDates[existingIndex] = {
          ...newDates[existingIndex],
          isAvailable: !newDates[existingIndex].isAvailable
        };
        return newDates;
      } else {
        // Add new date as available
        return [...prev, { date: dateStr, isAvailable: true }];
      }
    });
  };
  
  // Check if date is available
  const isDateAvailable = (dateStr: string) => {
    const dateEntry = availabilityDates.find(d => d.date === dateStr);
    return dateEntry ? dateEntry.isAvailable : true; // Default to available
  };
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() - 1);
      return newMonth;
    });
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(newMonth.getMonth() + 1);
      return newMonth;
    });
  };
  
  // Validate current step
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1: // Basic Info
        if (!formData.title.trim()) {
          newErrors.title = 'العنوان مطلوب';
        }
        if (formData.title.length > 60) {
          newErrors.title = 'العنوان يجب أن يكون أقل من 60 حرفًا';
        }
        if (!formData.description.trim()) {
          newErrors.description = 'الوصف مطلوب';
        }
        if (!formData.property_type) {
          newErrors.property_type = 'نوع العقار مطلوب';
        }
        if (formData.daily_price <= 0) {
          newErrors.daily_price = 'السعر اليومي يجب أن يكون أكبر من صفر';
        }
        if (!formData.check_in_instructions.trim()) {
          newErrors.check_in_instructions = 'تعليمات تسجيل الوصول مطلوبة';
        }
        break;
        
      case 2: // Location
        if (!formData.address.trim()) {
          newErrors.address = 'العنوان مطلوب';
        }
        break;
        
      case 3: // Amenities
        // No required validation for amenities
        break;
        
      case 4: // Calendar
        // No required validation for calendar
        break;
        
      case 5: // Media
        if (images.length === 0) {
          newErrors.images = 'يرجى تحميل صورة واحدة على الأقل';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle step navigation
  const handleNext = () => {
    if (validateStep(currentStep)) {
      nextStep();
    }
  };
  
  // Handle property creation
  const createProperty = async () => {
    if (!authToken) {
      setSubmitError('غير مخول. يرجى تسجيل الدخول.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Validate all steps
      for (let i = 1; i <= 5; i++) {
        if (!validateStep(i)) {
          setCurrentStep(i);
          setIsSubmitting(false);
          return;
        }
      }
      
      // Validate with Zod schema
      const propertyData = {
        ...formData,
        daily_price: Number(formData.daily_price)
      };
      
      createPropertyInputSchema.parse(propertyData);
      
      // Create property
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties`,
        propertyData,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      if (response.data.property_id) {
        // Upload images if any
        if (images.length > 0) {
          const imageUploads = images.map(async (img) => {
            // In a real app, you would upload the file to a storage service
            // and get a URL. For now, we'll use the preview URL as a placeholder.
            const imageData = {
              image_id: img.id,
              property_id: response.data.property_id,
              image_url: img.previewUrl,
              is_primary: img.isPrimary,
              display_order: img.displayOrder
            };
            
            createPropertyImageInputSchema.parse(imageData);
            
            return axios.post(
              `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${response.data.property_id}/images`,
              { image_urls: [imageData.image_url], is_primary: imageData.is_primary },
              {
                headers: {
                  Authorization: `Bearer ${authToken}`
                }
              }
            );
          });
          
          await Promise.all(imageUploads);
        }
        
        // Set availability dates if any
        if (availabilityDates.length > 0) {
          const availabilityData = availabilityDates.map(dateObj => ({
            date: dateObj.date,
            is_available: dateObj.isAvailable
          }));
          
          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${response.data.property_id}/availability`,
            { dates: availabilityData },
            {
              headers: {
                Authorization: `Bearer ${authToken}`
              }
            }
          );
        }
        
        // Success - redirect to listings page
        navigate('/listings');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      setSubmitError('حدث خطأ أثناء إنشاء الإعلان. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calendar dates
  const calendarDates = getCalendarDates();
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
              <h1 className="text-3xl font-bold text-white text-center">إنشاء إعلان جديد</h1>
              <p className="text-blue-100 text-center mt-2">املأ المعلومات لتقديم عقارك للإيجار</p>
            </div>
            
            {/* Progress Bar */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep === step 
                        ? 'bg-blue-600 text-white' 
                        : step < currentStep 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 text-gray-700'
                    }`}>
                      {step}
                    </div>
                    {step < 5 && (
                      <div className={`w-16 h-1 mx-2 ${
                        step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-sm text-gray-600">
                <span>المعلومات الأساسية</span>
                <span>الموقع</span>
                <span>الوسائل</span>
                <span>التقويم</span>
                <span>الوسائط</span>
              </div>
            </div>
            
            {/* Form Content */}
            <div className="px-6 py-8">
              {submitError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {submitError}
                </div>
              )}
              
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">المعلومات الأساسية</h2>
                  <p className="text-gray-600">أخبرنا عن عقارك</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="property_type" className="block text-sm font-medium text-gray-700 mb-1">
                        نوع العقار *
                      </label>
                      <select
                        id="property_type"
                        name="property_type"
                        value={formData.property_type}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.property_type ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">اختر نوع العقار</option>
                        {propertyTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {errors.property_type && (
                        <p className="mt-1 text-sm text-red-600">{errors.property_type}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        عنوان الإعلان *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        maxLength={60}
                        placeholder="مثال: شقة فخمة في قلب طرابلس"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <div className="flex justify-between mt-1">
                        {errors.title && (
                          <p className="text-sm text-red-600">{errors.title}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {formData.title.length}/60
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        الوصف *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder="صف عقارك بتفصيل... ما الذي يجعله فريدًا؟ أين يقع؟ ما المرافق المتاحة؟"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                      ></textarea>
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="daily_price" className="block text-sm font-medium text-gray-700 mb-1">
                        السعر الليلي (ل.ل) *
                      </label>
                      <input
                        type="number"
                        id="daily_price"
                        name="daily_price"
                        value={formData.daily_price || ''}
                        onChange={(e) => handleNumberChange('daily_price', e.target.value)}
                        min="0"
                        placeholder="100000"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.daily_price ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.daily_price && (
                        <p className="mt-1 text-sm text-red-600">{errors.daily_price}</p>
                      )}
                    </div>
                    
                    <div>
                      <label htmlFor="check_in_instructions" className="block text-sm font-medium text-gray-700 mb-1">
                        تعليمات تسجيل الوصول *
                      </label>
                      <textarea
                        id="check_in_instructions"
                        name="check_in_instructions"
                        value={formData.check_in_instructions}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="كيف يمكن للضيوف تسجيل الوصول؟ ما رمز باب الدخول؟ من هو جهة الاتصال؟"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.check_in_instructions ? 'border-red-500' : 'border-gray-300'
                        }`}
                      ></textarea>
                      {errors.check_in_instructions && (
                        <p className="mt-1 text-sm text-red-600">{errors.check_in_instructions}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">الموقع</h2>
                  <p className="text-gray-600">أين يقع عقارك؟</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        العنوان *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="مثال: شارع لبنان، طرابلس"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.address && (
                        <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        خريطة الموقع
                      </label>
                      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                        <div className="text-center">
                          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto" />
                          <p className="mt-2 text-gray-500">عرض الخريطة (سيتم تفعيله لاحقًا)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1">
                          خط العرض
                        </label>
                        <input
                          type="number"
                          id="latitude"
                          name="latitude"
                          value={formData.latitude || ''}
                          onChange={(e) => handleNumberChange('latitude', e.target.value)}
                          step="0.0001"
                          placeholder="34.4333"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1">
                          خط الطول
                        </label>
                        <input
                          type="number"
                          id="longitude"
                          name="longitude"
                          value={formData.longitude || ''}
                          onChange={(e) => handleNumberChange('longitude', e.target.value)}
                          step="0.0001"
                          placeholder="35.8500"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 3: Amenities */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">الوسائل</h2>
                  <p className="text-gray-600">ما المرافق المتاحة في عقارك؟</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {amenitiesOptions.map((amenity) => (
                      <div 
                        key={amenity.id}
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.amenities.includes(amenity.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                            formData.amenities.includes(amenity.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {formData.amenities.includes(amenity.id) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                          <span className="text-gray-900">{amenity.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Step 4: Calendar */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">التقويم</h2>
                  <p className="text-gray-600">متى يتوفر عقارك للحجز؟</p>
                  
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                      <button
                        onClick={prevMonth}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                      </button>
                      
                      <h3 className="text-lg font-semibold text-gray-900">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                      </h3>
                      
                      <button
                        onClick={nextMonth}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </div>
                    
                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1 p-4">
                      {dayNames.map((day) => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                      
                      {calendarDates.map((date, index) => {
                        const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                        const dateStr = date.toISOString().split('T')[0];
                        const isAvailable = isDateAvailable(dateStr);
                        
                        return (
                          <div
                            key={index}
                            onClick={() => isCurrentMonth && toggleDateAvailability(dateStr)}
                            className={`p-2 text-center text-sm cursor-pointer rounded-lg transition-colors ${
                              !isCurrentMonth
                                ? 'text-gray-400 cursor-default'
                                : isAvailable
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {date.getDate()}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">متاح</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 rounded mr-2"></div>
                      <span className="text-sm text-gray-600">غير متاح</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 5: Media Upload */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">تحميل الوسائط</h2>
                  <p className="text-gray-600">أضف صورًا لعقارك</p>
                  
                  {errors.images && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {errors.images}
                    </div>
                  )}
                  
                  {/* Upload Area */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <div className="flex justify-center mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">قم بسحب الصور وإفلاتها هنا</h3>
                    <p className="text-gray-500 mb-4">أو</p>
                    <label className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                      اختر ملفات
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <p className="text-gray-500 text-sm mt-4">يمكنك تحميل ما يصل إلى 10 صور (JPG، PNG)</p>
                  </div>
                  
                  {/* Image Previews */}
                  {images.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">الصور المحملة</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {images.map((image, index) => (
                          <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="relative">
                              <img
                                src={image.previewUrl}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-40 object-cover"
                              />
                              {image.isPrimary && (
                                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                  رئيسية
                                </div>
                              )}
                              <button
                                onClick={() => removeImage(image.id)}
                                className="absolute top-2 left-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </div>
                            <div className="p-3">
                              <div className="flex justify-between items-center mb-2">
                                <button
                                  onClick={() => setPrimaryImage(image.id)}
                                  className={`text-xs px-2 py-1 rounded ${
                                    image.isPrimary
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                  }`}
                                >
                                  جعلها رئيسية
                                </button>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => moveImageUp(index)}
                                    disabled={index === 0}
                                    className={`p-1 rounded ${
                                      index === 0
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => moveImageDown(index)}
                                    disabled={index === images.length - 1}
                                    className={`p-1 rounded ${
                                      index === images.length - 1
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <p className="text-xs text-gray-500">الترتيب: {index + 1}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Cancellation Policy */}
                  <div>
                    <label htmlFor="cancellation_policy" className="block text-sm font-medium text-gray-700 mb-1">
                      سياسة الإلغاء
                    </label>
                    <select
                      id="cancellation_policy"
                      name="cancellation_policy"
                      value={formData.cancellation_policy}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">اختر سياسة الإلغاء</option>
                      {cancellationPolicies.map((policy) => (
                        <option key={policy.value} value={policy.value}>
                          {policy.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Instant Book Toggle */}
                  <div className="flex items-center">
                    <input
                      id="is_instant_book"
                      name="is_instant_book"
                      type="checkbox"
                      checked={formData.is_instant_book}
                      onChange={handleInputChange}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_instant_book" className="mr-3 text-sm font-medium text-gray-700">
                      تمكين الحجز الفوري
                    </label>
                    <p className="text-sm text-gray-500">
                      (عند التمكين، يمكن للضيوف الحجز مباشرة دون موافقة)
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation Buttons */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-lg font-medium ${
                    currentStep === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  السابق
                </button>
                
                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    التالي
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={createProperty}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري النشر...
                      </>
                    ) : (
                      'نشر الإعلان'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Listing_Create;