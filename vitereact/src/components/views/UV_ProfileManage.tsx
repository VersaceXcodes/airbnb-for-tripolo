import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { User, updateUserInputSchema } from '@/DB/zodschemas';

const UV_ProfileManage: React.FC = () => {
  // Global state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const updateGlobalUserProfile = useAppStore(state => state.update_user_profile);
  
  // Local state
  const [profileFormData, setProfileFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    phone_number: '',
    bio: '',
    profile_image_url: '',
    language_preference: 'ar'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    const token = useAppStore.getState().authentication_state.auth_token;
    if (!token) throw new Error('No authentication token');
    
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  }, []);
  
  const { data: userProfile, isLoading, isError } = useQuery<User, Error>({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    select: (data) => ({
      ...data,
      profile_image_url: data.profile_image_url || '',
      full_name: data.full_name || '',
      phone_number: data.phone_number || '',
      bio: data.bio || '',
      language_preference: data.language_preference || 'ar'
    })
  });
  
  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setProfileFormData({
        email: userProfile.email,
        username: userProfile.username,
        full_name: userProfile.full_name || '',
        phone_number: userProfile.phone_number || '',
        bio: userProfile.bio || '',
        profile_image_url: userProfile.profile_image_url || '',
        language_preference: userProfile.language_preference || 'ar'
      });
    }
  }, [userProfile]);
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileFormData) => {
      const token = useAppStore.getState().authentication_state.auth_token;
      if (!token) throw new Error('No authentication token');
      
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/profile`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (updatedUser) => {
      // Update global state
      updateGlobalUserProfile(updatedUser);
      
      // Update query cache
      queryClient.setQueryData(['userProfile'], updatedUser);
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setError(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (error: any) => {
      setError(error.response?.data?.error || 'Failed to update profile');
    }
  });
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate using Zod schema
    const validationResult = updateUserInputSchema.safeParse(profileFormData);
    if (!validationResult.success) {
      setError('Please check your input values');
      return;
    }
    
    updateProfileMutation.mutate(profileFormData);
  };
  
  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please upload an image file (JPEG, PNG)');
      return;
    }
    
    // Validate file size (4MB max)
    if (file.size > 4 * 1024 * 1024) {
      setError('File size must be less than 4MB');
      return;
    }
    
    // TODO: Implement actual image upload when endpoint is available
    // For now, we'll just show a placeholder
    setError('Image upload functionality not implemented yet');
    /*
    try {
      const token = useAppStore.getState().authentication_state.auth_token;
      if (!token) throw new Error('No authentication token');
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/images/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setProfileFormData(prev => ({
        ...prev,
        profile_image_url: response.data.url
      }));
      
      setSuccess('Profile image updated!');
    } catch (err) {
      setError('Failed to upload image');
    }
    */
  };
  
  // Cancel editing
  const handleCancel = () => {
    if (userProfile) {
      setProfileFormData({
        email: userProfile.email,
        username: userProfile.username,
        full_name: userProfile.full_name || '',
        phone_number: userProfile.phone_number || '',
        bio: userProfile.bio || '',
        profile_image_url: userProfile.profile_image_url || '',
        language_preference: userProfile.language_preference || 'ar'
      });
    }
    setIsEditing(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="text-center mt-4 text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (isError || !userProfile) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Profile</h2>
                <p className="text-gray-600">There was an issue loading your profile information. Please try again later.</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <div className="flex flex-col md:flex-row items-center mb-8">
                <div className="relative mb-6 md:mb-0 md:mr-8">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 flex items-center justify-center">
                    {profileFormData.profile_image_url ? (
                      <img 
                        src={profileFormData.profile_image_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span className="text-gray-500 text-4xl">👤</span>
                    )}
                  </div>
                  
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>
                
                <div className="text-center md:text-left">
                  <h1 className="text-2xl font-bold text-gray-900">{profileFormData.full_name || profileFormData.username}</h1>
                  <p className="text-gray-600 mt-1">{profileFormData.email}</p>
                  
                  {userProfile.is_host && (
                    <div className="mt-3 flex items-center justify-center md:justify-start">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {userProfile.is_verified ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Verified Host
                          </>
                        ) : (
                          'Host'
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <p>{error}</p>
                </div>
              )}
              
              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  <p>{success}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        id="full_name"
                        name="full_name"
                        value={profileFormData.full_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your full name"
                      />
                    ) : (
                      <p className="text-gray-900">{profileFormData.full_name || 'Not provided'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={profileFormData.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your username"
                        required
                      />
                    ) : (
                      <p className="text-gray-900">{profileFormData.username}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={profileFormData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="your.email@example.com"
                        required
                      />
                    ) : (
                      <p className="text-gray-900">{profileFormData.email}</p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        id="phone_number"
                        name="phone_number"
                        value={profileFormData.phone_number}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="+961 12 345 678"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profileFormData.phone_number || 'Not provided'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        id="bio"
                        name="bio"
                        value={profileFormData.bio}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-900">
                        {profileFormData.bio || 'No bio provided'}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label htmlFor="language_preference" className="block text-sm font-medium text-gray-700 mb-1">
                      Language Preference
                    </label>
                    {isEditing ? (
                      <select
                        id="language_preference"
                        name="language_preference"
                        value={profileFormData.language_preference}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="ar">Arabic</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {profileFormData.language_preference === 'ar' ? 'Arabic' : 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                  {isEditing ? (
                    <>
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {updateProfileMutation.isPending ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ProfileManage;