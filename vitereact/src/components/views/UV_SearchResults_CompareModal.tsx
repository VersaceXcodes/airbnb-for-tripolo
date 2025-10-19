import React, { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/main';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CompareProperty {
  property_id: string;
  title: string;
  daily_price: number;
  amenities: string[];
  is_instant_book: boolean;
  average_rating: number;
  review_count: number;
}

const UV_SearchResults_CompareModal: React.FC = () => {
  const navigate = useNavigate();
  const selectedPropertyIds = useAppStore(state => state.compare_listings.selected_property_ids);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Close modal function
  const closeModal = useCallback(() => {
    navigate(-1); // Go back to previous page
  }, [navigate]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeModal]);

  // Fetch property details
  const fetchPropertyDetails = async (propertyId: string): Promise<CompareProperty> => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${propertyId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    
    const data = response.data;
    
    return {
      property_id: data.property_id,
      title: data.title,
      daily_price: data.daily_price,
      amenities: data.amenities ? data.amenities.split(',') : [],
      is_instant_book: data.is_instant_book,
      average_rating: data.average_rating || 0,
      review_count: data.review_count || 0
    };
  };

  // Use react-query to fetch all property details
  const { data: propertyDetails, isLoading, error } = useQuery({
    queryKey: ['compare-properties', selectedPropertyIds],
    queryFn: async () => {
      const results = await Promise.all(
        selectedPropertyIds.map(id => fetchPropertyDetails(id))
      );
      return results;
    },
    enabled: selectedPropertyIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Render star ratings
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Render amenities with checkmarks
  const renderAmenities = (amenities: string[], allAmenities: string[]) => {
    return allAmenities.map((amenity, index) => (
      <div key={index} className="flex items-center py-1">
        {amenities.includes(amenity) ? (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
        <span className="ml-2 text-sm capitalize">{amenity}</span>
      </div>
    ));
  };

  // Get all unique amenities across properties
  const getAllAmenities = (): string[] => {
    if (!propertyDetails) return [];
    
    const allAmenities = new Set<string>();
    propertyDetails.forEach(property => {
      property.amenities.forEach(amenity => {
        allAmenities.add(amenity.trim());
      });
    });
    
    return Array.from(allAmenities).sort();
  };

  const allAmenities = getAllAmenities();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={closeModal}
      ></div>
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-gray-900">Compare Listings</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="py-8 text-center">
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <p className="font-medium">Error loading property details</p>
                    <p className="text-sm mt-1">Please try again later</p>
                  </div>
                </div>
              ) : propertyDetails && propertyDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    {/* Property columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {propertyDetails.map((property) => (
                        <div 
                          key={property.property_id} 
                          className="border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                        >
                          {/* Property header */}
                          <div className="bg-gray-50 px-4 py-3 border-b">
                            <h4 className="font-semibold text-gray-900 line-clamp-2">
                              {property.title}
                            </h4>
                            <div className="mt-1 flex items-center">
                              {renderRating(property.average_rating)}
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-sm text-gray-600">
                                {property.review_count} review{property.review_count !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                          
                          {/* Property details */}
                          <div className="p-4">
                            {/* Price */}
                            <div className="mb-4">
                              <p className="text-2xl font-bold text-gray-900">
                                {property.daily_price.toLocaleString('en-US')} LBP
                                <span className="text-sm font-normal text-gray-600"> / night</span>
                              </p>
                            </div>
                            
                            {/* Instant book */}
                            <div className="mb-4">
                              {property.is_instant_book ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Instant Book
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Request to Book
                                </span>
                              )}
                            </div>
                            
                            {/* Amenities */}
                            <div className="border-t border-gray-200 pt-4">
                              <h5 className="font-medium text-gray-900 mb-2">Amenities</h5>
                              <div className="space-y-1">
                                {renderAmenities(property.amenities, allAmenities)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-500">No properties selected for comparison</p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_SearchResults_CompareModal;