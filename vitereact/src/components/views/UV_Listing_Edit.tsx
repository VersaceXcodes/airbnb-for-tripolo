import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Zod schemas
import { 
  propertySchema, 
  updatePropertyInputSchema,
  propertyImageSchema,
  availabilityDateSchema
} from '@/db/zodschemas';

// Property type based on schema
type Property = z.infer<typeof propertySchema>;
type PropertyImage = z.infer<typeof propertyImageSchema>;
type AvailabilityDate = z.infer<typeof availabilityDateSchema>;

const UV_Listing_Edit: React.FC = () => {
  // URL params
  const { listing_id } = useParams<{ listing_id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Global state
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState('entire_place');
  const [dailyPrice, setDailyPrice] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [checkInInstructions, setCheckInInstructions] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [isInstantBook, setIsInstantBook] = useState(false);
  const [cancellationPolicy, setCancellationPolicy] = useState('standard');
  const [isActive, setIsActive] = useState(true);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [availabilityDates, setAvailabilityDates] = useState<AvailabilityDate[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch property details
  const { data: property, isLoading, isError } = useQuery<Property>({
    queryKey: ['property', listing_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    enabled: !!listing_id && !!authToken
  });

  // Populate form when property data loads
  useEffect(() => {
    if (property) {
      setTitle(property.title || '');
      setDescription(property.description || '');
      setPropertyType(property.property_type || 'entire_place');
      setDailyPrice(property.daily_price?.toString() || '');
      setAddress(property.address || '');
      setLatitude(property.latitude?.toString() || '');
      setLongitude(property.longitude?.toString() || '');
      setCheckInInstructions(property.check_in_instructions || '');
      setAmenities(property.amenities ? property.amenities.split(',') : []);
      setIsInstantBook(property.is_instant_book || false);
      setCancellationPolicy(property.cancellation_policy || 'standard');
      setIsActive(property.is_active !== undefined ? property.is_active : true);
    }
  }, [property]);

  // Fetch property images
  const { data: propertyImages } = useQuery<PropertyImage[]>({
    queryKey: ['propertyImages', listing_id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}/images`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    enabled: !!listing_id && !!authToken
  });

  // Update images state when images data loads
  useEffect(() => {
    if (propertyImages) {
      setImages(propertyImages);
    }
  }, [propertyImages]);

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async (updatedProperty: Partial<Property>) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}`,
        updatedProperty,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', listing_id] });
      navigate('/dashboard/listings');
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Failed to update property');
      setIsSaving(false);
    }
  });

  // Delete property mutation
  const deletePropertyMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/properties/${listing_id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostListings'] });
      navigate('/dashboard/listings');
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Failed to delete property');
      setIsDeleting(false);
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Validate required fields
    if (!title || !propertyType || !dailyPrice) {
      setError('Please fill in all required fields');
      setIsSaving(false);
      return;
    }

    // Prepare data for submission
    const propertyData = {
      property_id: listing_id,
      title,
      description: description || null,
      property_type: propertyType,
      daily_price: parseFloat(dailyPrice),
      address: address || null,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      check_in_instructions: checkInInstructions || null,
      amenities: amenities.join(','),
      is_instant_book: isInstantBook,
      cancellation_policy: cancellationPolicy,
      is_active: isActive
    };

    // Validate with Zod schema
    const validationResult = updatePropertyInputSchema.safeParse(propertyData);
    if (!validationResult.success) {
      setError('Invalid data provided');
      setIsSaving(false);
      return;
    }

    updatePropertyMutation.mutate(propertyData);
  };

  // Handle property deletion
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      setIsDeleting(true);
      deletePropertyMutation.mutate();
    }
  };

  // Handle amenity toggle
  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Listing</h1>
            <p className="text-gray-600 mb-4">We couldn't load the listing details. Please try again later.</p>
            <Link 
              to="/dashboard/listings"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Listings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link 
              to="/dashboard/listings"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Listings
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
              <p className="mt-1 text-sm text-gray-500">Update your property details below</p>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6">
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Basic Info Section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title *
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => {
                          setError(null);
                          setTitle(e.target.value);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                        placeholder="Beautiful apartment in downtown Tripoli"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                        placeholder="Describe your property in detail..."
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
                      Property Type *
                    </label>
                    <div className="mt-1">
                      <select
                        id="propertyType"
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                      >
                        <option value="entire_place">Entire Place</option>
                        <option value="private_room">Private Room</option>
                        <option value="shared_room">Shared Room</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="dailyPrice" className="block text-sm font-medium text-gray-700">
                      Daily Price (LBP) *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="number"
                        id="dailyPrice"
                        value={dailyPrice}
                        onChange={(e) => {
                          setError(null);
                          setDailyPrice(e.target.value);
                        }}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                        placeholder="150000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities Section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'wifi', 'ac', 'kitchen', 'parking', 'washer', 'dryer',
                    'tv', 'pool', 'gym', 'breakfast', 'pets_allowed'
                  ].map((amenity) => (
                    <div key={amenity} className="flex items-center">
                      <input
                        id={`amenity-${amenity}`}
                        name={`amenity-${amenity}`}
                        type="checkbox"
                        checked={amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={`amenity-${amenity}`} className="ml-3 text-sm text-gray-700 capitalize">
                        {amenity.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Section */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Location</h2>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                        placeholder="Enter property address"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                      Latitude
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="latitude"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                        placeholder="34.4333"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                      Longitude
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="longitude"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                        placeholder="35.8500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Check-in Instructions */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Check-in Instructions</h2>
                <div>
                  <label htmlFor="checkInInstructions" className="block text-sm font-medium text-gray-700">
                    Instructions for guests
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="checkInInstructions"
                      rows={3}
                      value={checkInInstructions}
                      onChange={(e) => setCheckInInstructions(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                      placeholder="How should guests check in to your property?"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Options */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Booking Options</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="isInstantBook"
                      name="isInstantBook"
                      type="checkbox"
                      checked={isInstantBook}
                      onChange={(e) => setIsInstantBook(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isInstantBook" className="ml-3 text-sm text-gray-700">
                      Enable instant booking
                    </label>
                  </div>

                  <div>
                    <label htmlFor="cancellationPolicy" className="block text-sm font-medium text-gray-700">
                      Cancellation Policy
                    </label>
                    <div className="mt-1">
                      <select
                        id="cancellationPolicy"
                        value={cancellationPolicy}
                        onChange={(e) => setCancellationPolicy(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                      >
                        <option value="standard">Standard (free cancellation 7 days prior)</option>
                        <option value="flexible">Flexible (free cancellation 24 hours prior)</option>
                        <option value="strict">Strict (no cancellations allowed)</option>
                        <option value="moderate">Moderate (partial refund before check-in)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="ml-3 text-sm text-gray-700">
                      Listing is active
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete Listing'
                  )}
                </button>

                <div className="flex space-x-3">
                  <Link
                    to="/dashboard/listings"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Listing_Edit;