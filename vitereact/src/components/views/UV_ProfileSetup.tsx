import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import axios from 'axios';

const UV_ProfileSetup: React.FC = () => {
  // Local state for form fields
  const [bio, setBio] = useState<string>('');
  const [contactInfo, setContactInfo] = useState<string>('');
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Global state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const updateUserProfile = useAppStore(state => state.update_user_profile);
  
  const navigate = useNavigate();

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setBio(currentUser.bio || '');
      setContactInfo(currentUser.phone_number || '');
      setLanguagesSpoken(currentUser.language_preference 
        ? currentUser.language_preference.split(',').map(lang => lang.trim()) 
        : []);
      setProfileImageUrl(currentUser.profile_image_url || '');
    }
  }, [currentUser]);

  // Handle language selection
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      option => option.value
    );
    setLanguagesSpoken(selectedOptions);
  };

  // Handle profile image upload (simulated)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload to a server
      // For now, we'll just simulate with a placeholder URL
      setProfileImageUrl(URL.createObjectURL(file));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (!authToken || !currentUser) {
        throw new Error('Not authenticated');
      }
      
      // Prepare data for API call
      const profileData = {
        bio: bio || undefined,
        phone_number: contactInfo || undefined,
        language_preference: languagesSpoken.join(','),
        profile_image_url: profileImageUrl || undefined
      };
      
      // Make API call
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/users/profile`,
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update global store with new user data
      updateUserProfile(response.data);
      
      // Navigate based on user role
      if (currentUser.is_host) {
        navigate('/dashboard/host');
      } else {
        navigate('/dashboard/guest');
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Available languages for multi-select
  const availableLanguages = [
    { value: 'ar', label: 'العربية (Arabic)' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français (French)' }
  ];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-8 sm:px-10">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
                <p className="text-gray-600">
                  Add some information to help others get to know you better
                </p>
              </div>
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Profile Image
                  </label>
                  <div className="flex items-center space-x-6">
                    {profileImageUrl ? (
                      <img 
                        src={profileImageUrl} 
                        alt="Profile preview" 
                        className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                        <span className="text-gray-500 text-2xl">👤</span>
                      </div>
                    )}
                    <label className="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                      Upload Image
                      <input 
                        type="file" 
                        className="sr-only" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
                
                {/* Bio */}
                <div className="space-y-2">
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    value={bio}
                    onChange={(e) => {
                      setError(null);
                      setBio(e.target.value);
                    }}
                    placeholder="Tell us about yourself..."
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition-all"
                  />
                  <p className="text-xs text-gray-500">Share a brief introduction about yourself</p>
                </div>
                
                {/* Contact Info */}
                <div className="space-y-2">
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                    Contact Information
                  </label>
                  <input
                    type="text"
                    id="contact"
                    value={contactInfo}
                    onChange={(e) => {
                      setError(null);
                      setContactInfo(e.target.value);
                    }}
                    placeholder="Phone number"
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition-all"
                  />
                  <p className="text-xs text-gray-500">Your contact information (optional)</p>
                </div>
                
                {/* Languages Spoken */}
                <div className="space-y-2">
                  <label htmlFor="languages" className="block text-sm font-medium text-gray-700">
                    Languages Spoken
                  </label>
                  <select
                    id="languages"
                    multiple
                    value={languagesSpoken}
                    onChange={handleLanguageChange}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition-all h-32"
                  >
                    {availableLanguages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">Hold Ctrl (or Cmd on Mac) to select multiple languages</p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentUser?.is_host) {
                        navigate('/dashboard/host');
                      } else {
                        navigate('/dashboard/guest');
                      }
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Skip for Now
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save & Proceed'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>You can always update your profile later in your account settings</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ProfileSetup;