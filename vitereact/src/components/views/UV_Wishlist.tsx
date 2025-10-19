import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { Property } from '@/db/zodschemas';

// Define the wishlist item type
interface WishlistItem {
  wishlist_id: string;
  user_id: string;
  property_id: string;
  added_at: string;
  property: Property;
}

const UV_Wishlist: React.FC = () => {
  // Get authentication state from global store
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  const queryClient = useQueryClient();

  // Fetch wishlist items
  const fetchWishlist = async (): Promise<WishlistItem[]> => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user/wishlist`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    return response.data;
  };

  const { data: wishlistItems, isLoading, error } = useQuery({
    queryKey: ['wishlist', currentUser?.user_id],
    queryFn: fetchWishlist,
    enabled: !!currentUser && !!authToken,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Remove item from wishlist
  const removeItem = async (propertyId: string) => {
    await axios.delete(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user/wishlist`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        params: {
          property_id: propertyId
        }
      }
    );
  };

  const removeMutation = useMutation({
    mutationFn: removeItem,
    onSuccess: (_, propertyId) => {
      // Update the cache after successful removal
      queryClient.setQueryData<WishlistItem[]>(['wishlist', currentUser?.user_id], 
        oldData => oldData?.filter(item => item.property_id !== propertyId) || []
      );
    }
  });

  // Property card component
  const PropertyCard: React.FC<{ item: WishlistItem }> = ({ item }) => {
    const property = item.property;
    
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-xl">
        <div className="relative">
          {property.property_images && property.property_images.length > 0 ? (
            <img 
              src={property.property_images[0].image_url} 
              alt={property.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-48 flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
          <button
            onClick={() => removeMutation.mutate(property.property_id)}
            disabled={removeMutation.isPending}
            className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors disabled:opacity-50"
            aria-label="Remove from wishlist"
          >
            {removeMutation.isPending && removeMutation.variables === property.property_id ? (
              <svg className="animate-spin h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 5.293a1 1 0 011.414 0L10 8.586l3.293-3.293a1 1 0 111.414 1.414L11.414 10l3.293 3.293a1 1 0 01-1.414 1.414L10 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 10 5.293 6.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                <Link to={`/properties/${property.property_id}`} className="hover:text-blue-600 transition-colors">
                  {property.title}
                </Link>
              </h3>
              <p className="text-gray-600 text-sm mt-1">{property.address || 'Location not specified'}</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-gray-900">
                {property.daily_price.toLocaleString('en-US')} LBP
              </span>
              <span className="text-gray-600 text-sm"> / night</span>
            </div>
            
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 text-gray-900 font-medium">
                {property.average_rating ? property.average_rating.toFixed(1) : 'N/A'}
              </span>
              <span className="text-gray-600 text-sm ml-1">
                ({property.review_count || 0} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="mt-2 text-gray-600">Your saved properties for future stays</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-red-800">Error loading wishlist</h3>
              <p className="mt-2 text-red-700">
                There was a problem loading your wishlist. Please try again.
              </p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['wishlist', currentUser?.user_id] })}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : wishlistItems && wishlistItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map(item => (
                <PropertyCard key={item.wishlist_id} item={item} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h3 className="mt-6 text-xl font-medium text-gray-900">Your wishlist is empty</h3>
              <p className="mt-2 text-gray-600 max-w-md mx-auto">
                Save properties that interest you by clicking the heart icon on property pages.
              </p>
              <div className="mt-6">
                <Link 
                  to="/search" 
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Start Exploring
                  <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_Wishlist;