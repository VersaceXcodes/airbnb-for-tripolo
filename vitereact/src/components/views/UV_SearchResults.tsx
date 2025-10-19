import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { SearchPropertyInput, Property } from '@/db/zodschemas';

// Define amenities options
const AMENITIES_OPTIONS = [
  { id: 'wifi', label: 'WiFi' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'parking', label: 'Parking' },
  { id: 'pool', label: 'Swimming Pool' },
  { id: 'washer', label: 'Washer' },
  { id: 'dryer', label: 'Dryer' },
];

// Define sorting options
const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'newest', label: 'Newest' },
  { id: 'lowest_rate_first', label: 'Lowest Price' },
  { id: 'highest_rated', label: 'Highest Rated' },
];

const UV_SearchResults: React.FC = () => {
  // Global state
  const searchFilters = useAppStore(state => state.search_filters);
  const updateSearchFilters = useAppStore(state => state.update_search_filters);
  const compareListings = useAppStore(state => state.compare_listings);
  const addToCompare = useAppStore(state => state.add_to_compare);
  const removeFromCompare = useAppStore(state => state.remove_from_compare);
  
  // Local state for UI controls
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  
  // Initialize filters from URL params
  useEffect(() => {
    const filters: Partial<typeof searchFilters> = {};
    
    if (searchParams.get('location')) {
      filters.location = searchParams.get('location');
    }
    
    if (searchParams.get('check_in')) {
      filters.check_in = searchParams.get('check_in');
    }
    
    if (searchParams.get('check_out')) {
      filters.check_out = searchParams.get('check_out');
    }
    
    if (searchParams.get('guests')) {
      filters.guests = parseInt(searchParams.get('guests') || '1', 10);
    }
    
    if (searchParams.get('price_min')) {
      filters.price_min = parseFloat(searchParams.get('price_min') || '0');
    }
    
    if (searchParams.get('price_max')) {
      filters.price_max = parseFloat(searchParams.get('price_max') || '0');
    }
    
    if (searchParams.get('amenities')) {
      filters.amenities = searchParams.get('amenities')?.split(',') || [];
    }
    
    if (searchParams.get('rating_min')) {
      filters.rating_min = parseInt(searchParams.get('rating_min') || '0', 10);
    }
    
    if (searchParams.get('sort_by')) {
      filters.sort_by = searchParams.get('sort_by');
    }
    
    updateSearchFilters(filters);
  }, []);
  
  // Update URL params when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    
    if (searchFilters.location) {
      params.location = searchFilters.location;
    }
    
    if (searchFilters.check_in) {
      params.check_in = searchFilters.check_in;
    }
    
    if (searchFilters.check_out) {
      params.check_out = searchFilters.check_out;
    }
    
    if (searchFilters.guests) {
      params.guests = searchFilters.guests.toString();
    }
    
    if (searchFilters.price_min !== null) {
      params.price_min = searchFilters.price_min.toString();
    }
    
    if (searchFilters.price_max !== null) {
      params.price_max = searchFilters.price_max.toString();
    }
    
    if (searchFilters.amenities && searchFilters.amenities.length > 0) {
      params.amenities = searchFilters.amenities.join(',');
    }
    
    if (searchFilters.rating_min !== null) {
      params.rating_min = searchFilters.rating_min.toString();
    }
    
    if (searchFilters.sort_by) {
      params.sort_by = searchFilters.sort_by;
    }
    
    setSearchParams(params);
  }, [searchFilters]);
  
  // Fetch properties based on filters
  const {
    data: propertiesData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['properties', searchFilters],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        limit: 20,
        offset: 0
      };
      
      if (searchFilters.location) {
        params.query = searchFilters.location;
      }
      
      if (searchFilters.check_in) {
        params.check_in = searchFilters.check_in;
      }
      
      if (searchFilters.check_out) {
        params.check_out = searchFilters.check_out;
      }
      
      if (searchFilters.guests) {
        params.guests = searchFilters.guests;
      }
      
      if (searchFilters.price_min !== null) {
        params.price_min = searchFilters.price_min;
      }
      
      if (searchFilters.price_max !== null) {
        params.price_max = searchFilters.price_max;
      }
      
      if (searchFilters.amenities && searchFilters.amenities.length > 0) {
        params.amenities = searchFilters.amenities.join(',');
      }
      
      if (searchFilters.rating_min !== null) {
        params.min_rating = searchFilters.rating_min;
      }
      
      if (searchFilters.sort_by) {
        params.sort_by = searchFilters.sort_by;
      }
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/search`, {
        params
      });
      
      return {
        properties: response.data.properties,
        total: response.data.total
      };
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Handle filter changes
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearchFilters({ location: e.target.value || null });
  };
  
  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearchFilters({ check_in: e.target.value || null });
  };
  
  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSearchFilters({ check_out: e.target.value || null });
  };
  
  const handleGuestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    updateSearchFilters({ guests: isNaN(value) ? null : value });
  };
  
  const handlePriceMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateSearchFilters({ price_min: isNaN(value) ? null : value });
  };
  
  const handlePriceMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateSearchFilters({ price_max: isNaN(value) ? null : value });
  };
  
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const currentAmenities = searchFilters.amenities || [];
    let newAmenities;
    
    if (checked) {
      newAmenities = [...currentAmenities, amenity];
    } else {
      newAmenities = currentAmenities.filter(a => a !== amenity);
    }
    
    updateSearchFilters({ amenities: newAmenities });
  };
  
  const handleRatingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value, 10);
    updateSearchFilters({ rating_min: isNaN(value) ? null : value });
  };
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSearchFilters({ sort_by: e.target.value || null });
  };
  
  // Handle property selection for comparison
  const handlePropertySelect = (propertyId: string, checked: boolean) => {
    if (checked) {
      setSelectedProperties(prev => [...prev, propertyId]);
      addToCompare(propertyId);
    } else {
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
      removeFromCompare(propertyId);
    }
  };
  
  // Handle compare button click
  const handleCompareClick = () => {
    // In a real app, this would navigate to the compare modal
    // For now, we'll just show an alert
    alert(`Comparing ${selectedProperties.length} properties`);
  };
  
  // Format currency in LBP
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-LB', {
      style: 'currency',
      currency: 'LBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Render star ratings
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center">
        <div className="flex">
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
        </div>
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };
  
  // Check if property is selected for comparison
  const isPropertySelected = (propertyId: string) => {
    return selectedProperties.includes(propertyId) || 
           compareListings.selected_property_ids.includes(propertyId);
  };
  
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              
              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={searchFilters.location || ''}
                  onChange={handleLocationChange}
                  placeholder="Greater Tripoli"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Dates */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="date"
                      value={searchFilters.check_in || ''}
                      onChange={handleCheckInChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={searchFilters.check_out || ''}
                      onChange={handleCheckOutChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Guests */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Guests
                </label>
                <input
                  type="number"
                  min="1"
                  value={searchFilters.guests || ''}
                  onChange={handleGuestsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (LBP)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={searchFilters.price_min || ''}
                    onChange={handlePriceMinChange}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    value={searchFilters.price_max || ''}
                    onChange={handlePriceMaxChange}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Amenities */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amenities
                </label>
                <div className="space-y-2">
                  {AMENITIES_OPTIONS.map(amenity => (
                    <div key={amenity.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`amenity-${amenity.id}`}
                        checked={(searchFilters.amenities || []).includes(amenity.id)}
                        onChange={(e) => handleAmenityChange(amenity.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`amenity-${amenity.id}`}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {amenity.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Minimum Rating */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={searchFilters.rating_min || ''}
                  onChange={handleRatingChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any Rating</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="w-full md:w-3/4">
            {/* Header with Sort and Compare */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Properties in Tripoli</h1>
                {propertiesData && (
                  <p className="text-gray-600 mt-1">
                    {propertiesData.total} properties found
                  </p>
                )}
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                {selectedProperties.length > 0 && (
                  <button
                    onClick={handleCompareClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Compare ({selectedProperties.length})
                  </button>
                )}
                
                <div>
                  <label htmlFor="sort" className="sr-only">
                    Sort by
                  </label>
                  <select
                    id="sort"
                    value={searchFilters.sort_by || 'relevance'}
                    onChange={handleSortChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {/* Error State */}
            {isError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">
                  Failed to load properties: {(error as Error)?.message || 'Unknown error'}
                </p>
              </div>
            )}
            
            {/* Empty State */}
            {propertiesData && propertiesData.total === 0 && !isLoading && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No properties found</h3>
                <p className="mt-1 text-gray-500">
                  Try adjusting your search filters to find more properties.
                </p>
              </div>
            )}
            
            {/* Properties Grid */}
            {propertiesData && propertiesData.total > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {propertiesData.properties.map((property: any) => (
                  <div
                    key={property.property_id}
                    className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="relative">
                      {/* Property Image */}
                      <div className="bg-gray-200 border-2 border-dashed rounded-t-lg w-full h-48" />
                      
                      {/* Compare Checkbox */}
                      <div className="absolute top-2 right-2">
                        <input
                          type="checkbox"
                          checked={isPropertySelected(property.property_id)}
                          onChange={(e) => handlePropertySelect(property.property_id, e.target.checked)}
                          className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {/* Property Title */}
                      <Link
                        to={`/properties/${property.property_id}`}
                        className="block text-lg font-semibold text-gray-900 hover:text-blue-600 truncate"
                      >
                        {property.title}
                      </Link>
                      
                      {/* Property Location */}
                      <p className="text-sm text-gray-600 mt-1">
                        {property.address || 'Tripoli, Lebanon'}
                      </p>
                      
                      {/* Rating */}
                      <div className="mt-2">
                        {renderRating(property.average_review_score || 0)}
                        <span className="text-sm text-gray-600 ml-1">
                          ({property.total_review_count || 0} reviews)
                        </span>
                      </div>
                      
                      {/* Price */}
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(property.daily_price)}
                          </span>
                          <span className="text-sm text-gray-600"> / night</span>
                        </div>
                        
                        {/* Instant Book Badge */}
                        {property.is_instant_book && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Instant Book
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_SearchResults;