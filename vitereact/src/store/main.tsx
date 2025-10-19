import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types based on the architecture
interface User {
  user_id: string;
  email: string;
  username: string;
  password_hash: string;
  full_name: string | null;
  phone_number: string | null;
  bio: string | null;
  profile_image_url: string | null;
  language_preference: string | null;
  is_host: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface Property {
  property_id: string;
  host_id: string;
  title: string;
  description: string | null;
  property_type: string;
  daily_price: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  check_in_instructions: string | null;
  amenities: string | null;
  is_instant_book: boolean;
  cancellation_policy: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Booking {
  booking_id: string;
  property_id: string;
  guest_id: string;
  check_in_date: string;
  check_out_date: string;
  guests_count: number;
  total_amount: number;
  status: string;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface SearchFilters {
  location: string | null;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  price_min: number | null;
  price_max: number | null;
  amenities: string[] | null;
  rating_min: number | null;
  sort_by: string | null;
}

interface AuthenticationState {
  current_user: User | null;
  auth_token: string | null;
  authentication_status: {
    is_authenticated: boolean;
    is_loading: boolean;
  };
  error_message: string | null;
}

interface AppState {
  // Authentication state
  authentication_state: AuthenticationState;
  
  // Search filters
  search_filters: SearchFilters;
  
  // User wishlist
  user_wishlist: {
    property_ids: string[];
  };
  
  // Booking state
  booking_state: {
    selected_property_id: string | null;
    check_in: string | null;
    check_out: string | null;
    guests: number | null;
    total_amount: number | null;
    is_booking_confirmed: boolean;
  };
  
  // Messaging state
  messaging_state: {
    active_thread_id: string | null;
    unread_threads: string[];
  };
  
  // Compare listings
  compare_listings: {
    selected_property_ids: string[];
  };

  // Auth actions
  login_user: (email: string, password: string) => Promise<void>;
  logout_user: () => void;
  register_user: (email: string, password: string, name: string) => Promise<void>;
  initialize_auth: () => Promise<void>;
  clear_auth_error: () => void;
  update_user_profile: (userData: Partial<User>) => void;
  
  // Search filter actions
  update_search_filters: (filters: Partial<SearchFilters>) => void;
  reset_search_filters: () => void;
  
  // Wishlist actions
  add_to_wishlist: (property_id: string) => void;
  remove_from_wishlist: (property_id: string) => void;
  set_wishlist: (property_ids: string[]) => void;
  
  // Booking actions
  update_booking_state: (bookingData: Partial<AppState['booking_state']>) => void;
  confirm_booking: () => void;
  reset_booking_state: () => void;
  
  // Messaging actions
  set_active_thread: (thread_id: string | null) => void;
  add_unread_thread: (thread_id: string) => void;
  remove_unread_thread: (thread_id: string) => void;
  clear_unread_threads: () => void;
  
  // Compare listings actions
  add_to_compare: (property_id: string) => void;
  remove_from_compare: (property_id: string) => void;
  set_compare_listings: (property_ids: string[]) => void;
  clear_compare_listings: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      authentication_state: {
        current_user: null,
        auth_token: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: true,
        },
        error_message: null,
      },
      
      search_filters: {
        location: null,
        check_in: null,
        check_out: null,
        guests: null,
        price_min: null,
        price_max: null,
        amenities: null,
        rating_min: null,
        sort_by: "relevance",
      },
      
      user_wishlist: {
        property_ids: [],
      },
      
      booking_state: {
        selected_property_id: null,
        check_in: null,
        check_out: null,
        guests: null,
        total_amount: null,
        is_booking_confirmed: false,
      },
      
      messaging_state: {
        active_thread_id: null,
        unread_threads: [],
      },
      
      compare_listings: {
        selected_property_ids: [],
      },

      // Auth actions
      login_user: async (email: string, password: string) => {
        // In a real app, this would make an API call
        // For now, we'll simulate a successful login
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            authentication_status: {
              ...state.authentication_state.authentication_status,
              is_loading: true,
            },
            error_message: null,
          },
        }));
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simulate successful login
        const fakeUser: User = {
          user_id: "usr_123",
          email,
          username: email.split("@")[0],
          password_hash: "hashed_password",
          full_name: "Test User",
          phone_number: "+96112345678",
          bio: "I love traveling to Tripoli",
          profile_image_url: null,
          language_preference: "ar",
          is_host: false,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set((state) => ({
          authentication_state: {
            current_user: fakeUser,
            auth_token: "fake_jwt_token_12345",
            authentication_status: {
              is_authenticated: true,
              is_loading: false,
            },
            error_message: null,
          },
        }));
      },

      logout_user: () => {
        set((state) => ({
          authentication_state: {
            current_user: null,
            auth_token: null,
            authentication_status: {
              is_authenticated: false,
              is_loading: false,
            },
            error_message: null,
          },
        }));
      },

      register_user: async (email: string, password: string, name: string) => {
        // Simulate API call
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            authentication_status: {
              ...state.authentication_state.authentication_status,
              is_loading: true,
            },
            error_message: null,
          },
        }));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const fakeUser: User = {
          user_id: "usr_456",
          email,
          username: email.split("@")[0],
          password_hash: "hashed_password",
          full_name: name,
          phone_number: null,
          bio: null,
          profile_image_url: null,
          language_preference: "ar",
          is_host: false,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        set((state) => ({
          authentication_state: {
            current_user: fakeUser,
            auth_token: "fake_jwt_token_67890",
            authentication_status: {
              is_authenticated: true,
              is_loading: false,
            },
            error_message: null,
          },
        }));
      },

      initialize_auth: async () => {
        // Simulate checking if token is valid
        const { auth_token } = get().authentication_state;
        
        if (!auth_token) {
          set((state) => ({
            authentication_state: {
              ...state.authentication_state,
              authentication_status: {
                ...state.authentication_state.authentication_status,
                is_loading: false,
              },
            },
          }));
          return;
        }
        
        // Simulate API call to verify token
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // If we have a token, we're authenticated
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            authentication_status: {
              ...state.authentication_state.authentication_status,
              is_loading: false,
            },
          },
        }));
      },

      clear_auth_error: () => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            error_message: null,
          },
        }));
      },

      update_user_profile: (userData: Partial<User>) => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            current_user: state.authentication_state.current_user
              ? { ...state.authentication_state.current_user, ...userData }
              : null,
          },
        }));
      },

      // Search filter actions
      update_search_filters: (filters: Partial<SearchFilters>) => {
        set((state) => ({
          search_filters: {
            ...state.search_filters,
            ...filters,
          },
        }));
      },

      reset_search_filters: () => {
        set({
          search_filters: {
            location: null,
            check_in: null,
            check_out: null,
            guests: null,
            price_min: null,
            price_max: null,
            amenities: null,
            rating_min: null,
            sort_by: "relevance",
          },
        });
      },

      // Wishlist actions
      add_to_wishlist: (property_id: string) => {
        set((state) => ({
          user_wishlist: {
            property_ids: [...state.user_wishlist.property_ids, property_id],
          },
        }));
      },

      remove_from_wishlist: (property_id: string) => {
        set((state) => ({
          user_wishlist: {
            property_ids: state.user_wishlist.property_ids.filter(id => id !== property_id),
          },
        }));
      },

      set_wishlist: (property_ids: string[]) => {
        set({
          user_wishlist: {
            property_ids,
          },
        });
      },

      // Booking actions
      update_booking_state: (bookingData: Partial<AppState['booking_state']>) => {
        set((state) => ({
          booking_state: {
            ...state.booking_state,
            ...bookingData,
          },
        }));
      },

      confirm_booking: () => {
        set((state) => ({
          booking_state: {
            ...state.booking_state,
            is_booking_confirmed: true,
          },
        }));
      },

      reset_booking_state: () => {
        set({
          booking_state: {
            selected_property_id: null,
            check_in: null,
            check_out: null,
            guests: null,
            total_amount: null,
            is_booking_confirmed: false,
          },
        });
      },

      // Messaging actions
      set_active_thread: (thread_id: string | null) => {
        set((state) => ({
          messaging_state: {
            ...state.messaging_state,
            active_thread_id: thread_id,
          },
        }));
      },

      add_unread_thread: (thread_id: string) => {
        set((state) => ({
          messaging_state: {
            ...state.messaging_state,
            unread_threads: [...state.messaging_state.unread_threads, thread_id],
          },
        }));
      },

      remove_unread_thread: (thread_id: string) => {
        set((state) => ({
          messaging_state: {
            ...state.messaging_state,
            unread_threads: state.messaging_state.unread_threads.filter(id => id !== thread_id),
          },
        }));
      },

      clear_unread_threads: () => {
        set((state) => ({
          messaging_state: {
            ...state.messaging_state,
            unread_threads: [],
          },
        }));
      },

      // Compare listings actions
      add_to_compare: (property_id: string) => {
        set((state) => ({
          compare_listings: {
            selected_property_ids: [...state.compare_listings.selected_property_ids, property_id],
          },
        }));
      },

      remove_from_compare: (property_id: string) => {
        set((state) => ({
          compare_listings: {
            selected_property_ids: state.compare_listings.selected_property_ids.filter(id => id !== property_id),
          },
        }));
      },

      set_compare_listings: (property_ids: string[]) => {
        set({
          compare_listings: {
            selected_property_ids: property_ids,
          },
        });
      },

      clear_compare_listings: () => {
        set({
          compare_listings: {
            selected_property_ids: [],
          },
        });
      },
    }),
    {
      name: 'tripostay-storage',
      partialize: (state) => ({
        authentication_state: {
          current_user: state.authentication_state.current_user,
          auth_token: state.authentication_state.auth_token,
          authentication_status: {
            is_authenticated: state.authentication_state.authentication_status.is_authenticated,
            is_loading: false,
          },
          error_message: null,
        },
        search_filters: state.search_filters,
        user_wishlist: state.user_wishlist,
        booking_state: state.booking_state,
        messaging_state: state.messaging_state,
        compare_listings: state.compare_listings,
      }),
    }
  )
);