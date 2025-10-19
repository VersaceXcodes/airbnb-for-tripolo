import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

interface PropertyListing {
  property_id: string;
  title: string;
  description: string | null;
  property_type: string;
  daily_price: number;
  is_active: boolean;
  average_rating: number;
  total_reviews: number;
}

const UV_Host_Listings: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Get authenticated user from global store
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const userId = currentUser?.user_id || '';
  
  const queryClient = useQueryClient();
  
  // Fetch host listings
  const fetchHostListings = async (): Promise<PropertyListing[]> => {
    const params: Record<string, string | boolean> = {
      host_id: userId
    };
    
    if (filterStatus === 'active') {
      params.is_active = true;
    } else if (filterStatus === 'inactive') {
      params.is_active = false;
    }
    
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/search`,
      { params }
    );
    
    return response.data.properties.map((property: any) => ({
      property_id: property.property_id,
      title: property.title,
      description: property.description,
      property_type: property.property_type,
      daily_price: property.daily_price,
      is_active: property.is_active,
      average_rating: property.average_review_score || 0,
      total_reviews: property.total_review_count || 0
    }));
  };
  
  const { data: listings = [], isLoading, error } = useQuery({
    queryKey: ['hostListings', userId, filterStatus],
    queryFn: fetchHostListings,
    enabled: !!userId,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1
  });
  
  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${propertyId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostListings', userId, filterStatus] });
    }
  });
  
  // Toggle listing status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ propertyId, newStatus }: { propertyId: string; newStatus: boolean }) => {
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${propertyId}`,
        { is_active: newStatus }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostListings', userId, filterStatus] });
    }
  });
  
  const handleDelete = (propertyId: string) => {
    if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      deletePropertyMutation.mutate(propertyId);
    }
  };
  
  const handleToggleStatus = (propertyId: string, currentStatus: boolean) => {
    toggleStatusMutation.mutate({ 
      propertyId, 
      newStatus: !currentStatus 
    });
  };
  
  // Filter listings based on status
  const filteredListings = listings.filter(listing => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return listing.is_active;
    if (filterStatus === 'inactive') return !listing.is_active;
    return true;
  });
  
  // Property type labels
  const getPropertyTypeLabel = (type: string) => {
    switch (type) {
      case 'entire_place': return 'Entire Place';
      case 'private_room': return 'Private Room';
      case 'shared_room': return 'Shared Room';
      default: return type;
    }
  };
  
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LB', {
      style: 'currency',
      currency: 'LBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
              <Link 
                to="/listings/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add New Listing
              </Link>
            </div>
            
            <div className="flex space-x-4 mb-6">
              <button 
                className="px-4 py-2 rounded-md bg-blue-100 text-blue-700 font-medium"
              >
                All Listings
              </button>
              <button 
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-medium"
              >
                Active
              </button>
              <button 
                className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-medium"
              >
                Inactive
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 animate-pulse">
                  <div className="bg-gray-200 h-48 w-full"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-800">Error loading listings</h3>
              <p className="mt-2 text-red-700">Failed to load your property listings. Please try again later.</p>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">My Listings</h1>
            <Link 
              to="/listings/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Listing
            </Link>
          </div>
          
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-md font-medium ${
                filterStatus === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Listings
            </button>
            <button 
              onClick={() => setFilterStatus('active')}
              className={`px-4 py-2 rounded-md font-medium ${
                filterStatus === 'active' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button 
              onClick={() => setFilterStatus('inactive')}
              className={`px-4 py-2 rounded-md font-medium ${
                filterStatus === 'inactive' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
          </div>
          
          {/* Listings Grid */}
          {filteredListings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first property listing.</p>
              <Link 
                to="/listings/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <div key={listing.property_id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
                  {/* Thumbnail */}
                  <div className="bg-gray-200 border-b border-gray-200 h-48 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{listing.title}</h3>
                        <p className="text-sm text-gray-500 mb-2">{getPropertyTypeLabel(listing.property_type)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        listing.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {listing.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="mt-4 flex items-center">
                      <span className="text-2xl font-bold text-gray-900">{formatPrice(listing.daily_price)}</span>
                      <span className="text-gray-600 ml-1">/ night</span>
                    </div>
                    
                    <div className="mt-4 flex items-center">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="ml-1 text-gray-900 font-medium">{listing.average_rating.toFixed(1)}</span>
                        <span className="mx-1 text-gray-400">•</span>
                        <span className="text-gray-600">{listing.total_reviews} review{listing.total_reviews !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="mt-6 flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleStatus(listing.property_id, listing.is_active)}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            listing.is_active
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {listing.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Link 
                          to={`/listings/${listing.property_id}/edit`}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                          aria-label="Edit listing"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(listing.property_id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full"
                          aria-label="Delete listing"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
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

export default UV_Host_Listings;