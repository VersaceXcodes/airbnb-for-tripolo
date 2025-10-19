import { z } from 'zod';

// USERS SCHEMAS
export const userSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  username: z.string(),
  password_hash: z.string(),
  full_name: z.string().nullable(),
  phone_number: z.string().nullable(),
  bio: z.string().nullable(),
  profile_image_url: z.string().nullable(),
  language_preference: z.string().nullable().default('ar'),
  is_host: z.boolean().default(false),
  is_verified: z.boolean().default(false),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export const createUserInputSchema = z.object({
  user_id: z.string().min(1).max(255),
  email: z.string().email().min(1).max(255),
  username: z.string().min(1).max(255),
  password_hash: z.string().min(1).max(255),
  full_name: z.string().max(255).nullable().optional(),
  phone_number: z.string().max(20).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  profile_image_url: z.string().url().nullable().optional(),
  language_preference: z.string().max(10).nullable().optional(),
  is_host: z.boolean().optional(),
  is_verified: z.boolean().optional()
});

export const updateUserInputSchema = z.object({
  user_id: z.string(),
  email: z.string().email().optional(),
  username: z.string().min(1).max(255).optional(),
  password_hash: z.string().min(1).max(255).optional(),
  full_name: z.string().max(255).nullable().optional(),
  phone_number: z.string().max(20).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  profile_image_url: z.string().url().nullable().optional(),
  language_preference: z.string().max(10).nullable().optional(),
  is_host: z.boolean().optional(),
  is_verified: z.boolean().optional()
});

export const searchUserInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['user_id', 'email', 'username', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUserInput = z.infer<typeof searchUserInputSchema>;

// PROPERTIES SCHEMAS
export const propertySchema = z.object({
  property_id: z.string(),
  host_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  property_type: z.string(),
  daily_price: z.number(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  check_in_instructions: z.string().nullable(),
  amenities: z.string().nullable(),
  is_instant_book: z.boolean().default(false),
  cancellation_policy: z.string().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export const createPropertyInputSchema = z.object({
  property_id: z.string().min(1).max(255),
  host_id: z.string().min(1).max(255),
  title: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
  property_type: z.string().min(1).max(100),
  daily_price: z.number().positive(),
  address: z.string().max(500).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  check_in_instructions: z.string().max(1000).nullable().optional(),
  amenities: z.string().max(1000).nullable().optional(),
  is_instant_book: z.boolean().optional(),
  cancellation_policy: z.string().max(100).nullable().optional(),
  is_active: z.boolean().optional()
});

export const updatePropertyInputSchema = z.object({
  property_id: z.string(),
  host_id: z.string().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  property_type: z.string().min(1).max(100).optional(),
  daily_price: z.number().positive().optional(),
  address: z.string().max(500).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  check_in_instructions: z.string().max(1000).nullable().optional(),
  amenities: z.string().max(1000).nullable().optional(),
  is_instant_book: z.boolean().optional(),
  cancellation_policy: z.string().max(100).nullable().optional(),
  is_active: z.boolean().optional()
});

export const searchPropertyInputSchema = z.object({
  query: z.string().optional(),
  host_id: z.string().optional(),
  property_type: z.string().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  is_active: z.boolean().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['property_id', 'title', 'daily_price', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Property = z.infer<typeof propertySchema>;
export type CreatePropertyInput = z.infer<typeof createPropertyInputSchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertyInputSchema>;
export type SearchPropertyInput = z.infer<typeof searchPropertyInputSchema>;

// PROPERTY IMAGES SCHEMAS
export const propertyImageSchema = z.object({
  image_id: z.string(),
  property_id: z.string(),
  image_url: z.string(),
  is_primary: z.boolean().default(false),
  display_order: z.number().int().default(0),
  created_at: z.coerce.date()
});

export const createPropertyImageInputSchema = z.object({
  image_id: z.string().min(1).max(255),
  property_id: z.string().min(1).max(255),
  image_url: z.string().url().min(1).max(500),
  is_primary: z.boolean().optional(),
  display_order: z.number().int().nonnegative().optional()
});

export const updatePropertyImageInputSchema = z.object({
  image_id: z.string(),
  property_id: z.string().optional(),
  image_url: z.string().url().min(1).max(500).optional(),
  is_primary: z.boolean().optional(),
  display_order: z.number().int().nonnegative().optional()
});

export const searchPropertyImageInputSchema = z.object({
  property_id: z.string().optional(),
  is_primary: z.boolean().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['image_id', 'property_id', 'display_order', 'created_at']).default('display_order'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

export type PropertyImage = z.infer<typeof propertyImageSchema>;
export type CreatePropertyImageInput = z.infer<typeof createPropertyImageInputSchema>;
export type UpdatePropertyImageInput = z.infer<typeof updatePropertyImageInputSchema>;
export type SearchPropertyImageInput = z.infer<typeof searchPropertyImageInputSchema>;

// AVAILABILITY DATES SCHEMAS
export const availabilityDateSchema = z.object({
  availability_id: z.string(),
  property_id: z.string(),
  date: z.coerce.date(),
  is_available: z.boolean().default(true),
  created_at: z.coerce.date()
});

export const createAvailabilityDateInputSchema = z.object({
  availability_id: z.string().min(1).max(255),
  property_id: z.string().min(1).max(255),
  date: z.coerce.date(),
  is_available: z.boolean().optional()
});

export const updateAvailabilityDateInputSchema = z.object({
  availability_id: z.string(),
  property_id: z.string().optional(),
  date: z.coerce.date().optional(),
  is_available: z.boolean().optional()
});

export const searchAvailabilityDateInputSchema = z.object({
  property_id: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  is_available: z.boolean().optional(),
  limit: z.number().int().positive().default(30),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['availability_id', 'property_id', 'date', 'created_at']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

export type AvailabilityDate = z.infer<typeof availabilityDateSchema>;
export type CreateAvailabilityDateInput = z.infer<typeof createAvailabilityDateInputSchema>;
export type UpdateAvailabilityDateInput = z.infer<typeof updateAvailabilityDateInputSchema>;
export type SearchAvailabilityDateInput = z.infer<typeof searchAvailabilityDateInputSchema>;

// BOOKINGS SCHEMAS
export const bookingSchema = z.object({
  booking_id: z.string(),
  property_id: z.string(),
  guest_id: z.string(),
  check_in_date: z.coerce.date(),
  check_out_date: z.coerce.date(),
  guests_count: z.number().int(),
  total_amount: z.number(),
  status: z.string(),
  cancellation_reason: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export const createBookingInputSchema = z.object({
  booking_id: z.string().min(1).max(255),
  property_id: z.string().min(1).max(255),
  guest_id: z.string().min(1).max(255),
  check_in_date: z.coerce.date(),
  check_out_date: z.coerce.date(),
  guests_count: z.number().int().positive(),
  total_amount: z.number().positive(),
  status: z.string().min(1).max(50),
  cancellation_reason: z.string().max(500).nullable().optional()
});

export const updateBookingInputSchema = z.object({
  booking_id: z.string(),
  property_id: z.string().optional(),
  guest_id: z.string().optional(),
  check_in_date: z.coerce.date().optional(),
  check_out_date: z.coerce.date().optional(),
  guests_count: z.number().int().positive().optional(),
  total_amount: z.number().positive().optional(),
  status: z.string().min(1).max(50).optional(),
  cancellation_reason: z.string().max(500).nullable().optional()
});

export const searchBookingInputSchema = z.object({
  property_id: z.string().optional(),
  guest_id: z.string().optional(),
  host_id: z.string().optional(),
  status: z.string().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['booking_id', 'check_in_date', 'check_out_date', 'total_amount', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Booking = z.infer<typeof bookingSchema>;
export type CreateBookingInput = z.infer<typeof createBookingInputSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingInputSchema>;
export type SearchBookingInput = z.infer<typeof searchBookingInputSchema>;

// REVIEWS SCHEMAS
export const reviewSchema = z.object({
  review_id: z.string(),
  property_id: z.string(),
  booking_id: z.string(),
  reviewer_id: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  is_anonymous: z.boolean().default(false),
  is_flagged: z.boolean().default(false),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export const createReviewInputSchema = z.object({
  review_id: z.string().min(1).max(255),
  property_id: z.string().min(1).max(255),
  booking_id: z.string().min(1).max(255),
  reviewer_id: z.string().min(1).max(255),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).nullable().optional(),
  is_anonymous: z.boolean().optional(),
  is_flagged: z.boolean().optional()
});

export const updateReviewInputSchema = z.object({
  review_id: z.string(),
  property_id: z.string().optional(),
  booking_id: z.string().optional(),
  reviewer_id: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).nullable().optional(),
  is_anonymous: z.boolean().optional(),
  is_flagged: z.boolean().optional()
});

export const searchReviewInputSchema = z.object({
  property_id: z.string().optional(),
  reviewer_id: z.string().optional(),
  is_flagged: z.boolean().optional(),
  min_rating: z.number().int().min(1).max(5).optional(),
  max_rating: z.number().int().min(1).max(5).optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['review_id', 'rating', 'created_at', 'updated_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Review = z.infer<typeof reviewSchema>;
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;
export type SearchReviewInput = z.infer<typeof searchReviewInputSchema>;

// MESSAGES SCHEMAS
export const messageSchema = z.object({
  message_id: z.string(),
  thread_id: z.string(),
  sender_id: z.string(),
  recipient_id: z.string(),
  content: z.string(),
  is_read: z.boolean().default(false),
  created_at: z.coerce.date()
});

export const createMessageInputSchema = z.object({
  message_id: z.string().min(1).max(255),
  thread_id: z.string().min(1).max(255),
  sender_id: z.string().min(1).max(255),
  recipient_id: z.string().min(1).max(255),
  content: z.string().min(1).max(5000),
  is_read: z.boolean().optional()
});

export const updateMessageInputSchema = z.object({
  message_id: z.string(),
  thread_id: z.string().optional(),
  sender_id: z.string().optional(),
  recipient_id: z.string().optional(),
  content: z.string().min(1).max(5000).optional(),
  is_read: z.boolean().optional()
});

export const searchMessageInputSchema = z.object({
  thread_id: z.string().optional(),
  sender_id: z.string().optional(),
  recipient_id: z.string().optional(),
  is_read: z.boolean().optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['message_id', 'thread_id', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Message = z.infer<typeof messageSchema>;
export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageInputSchema>;
export type SearchMessageInput = z.infer<typeof searchMessageInputSchema>;

// MESSAGE THREADS SCHEMAS
export const messageThreadSchema = z.object({
  thread_id: z.string(),
  property_id: z.string().nullable(),
  guest_id: z.string(),
  host_id: z.string(),
  last_message_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export const createMessageThreadInputSchema = z.object({
  thread_id: z.string().min(1).max(255),
  property_id: z.string().max(255).nullable().optional(),
  guest_id: z.string().min(1).max(255),
  host_id: z.string().min(1).max(255),
  last_message_at: z.coerce.date().nullable().optional()
});

export const updateMessageThreadInputSchema = z.object({
  thread_id: z.string(),
  property_id: z.string().max(255).nullable().optional(),
  guest_id: z.string().optional(),
  host_id: z.string().optional(),
  last_message_at: z.coerce.date().nullable().optional()
});

export const searchMessageThreadInputSchema = z.object({
  property_id: z.string().optional(),
  guest_id: z.string().optional(),
  host_id: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['thread_id', 'property_id', 'last_message_at', 'created_at']).default('last_message_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type MessageThread = z.infer<typeof messageThreadSchema>;
export type CreateMessageThreadInput = z.infer<typeof createMessageThreadInputSchema>;
export type UpdateMessageThreadInput = z.infer<typeof updateMessageThreadInputSchema>;
export type SearchMessageThreadInput = z.infer<typeof searchMessageThreadInputSchema>;

// WISHLISTS SCHEMAS
export const wishlistSchema = z.object({
  wishlist_id: z.string(),
  user_id: z.string(),
  property_id: z.string(),
  added_at: z.coerce.date()
});

export const createWishlistInputSchema = z.object({
  wishlist_id: z.string().min(1).max(255),
  user_id: z.string().min(1).max(255),
  property_id: z.string().min(1).max(255),
  added_at: z.coerce.date().optional()
});

export const updateWishlistInputSchema = z.object({
  wishlist_id: z.string(),
  user_id: z.string().optional(),
  property_id: z.string().optional(),
  added_at: z.coerce.date().optional()
});

export const searchWishlistInputSchema = z.object({
  user_id: z.string().optional(),
  property_id: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['wishlist_id', 'user_id', 'property_id', 'added_at']).default('added_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type Wishlist = z.infer<typeof wishlistSchema>;
export type CreateWishlistInput = z.infer<typeof createWishlistInputSchema>;
export type UpdateWishlistInput = z.infer<typeof updateWishlistInputSchema>;
export type SearchWishlistInput = z.infer<typeof searchWishlistInputSchema>;

// COMPARE LISTS SCHEMAS
export const compareListSchema = z.object({
  compare_list_id: z.string(),
  user_id: z.string(),
  property_id: z.string(),
  added_at: z.coerce.date()
});

export const createCompareListInputSchema = z.object({
  compare_list_id: z.string().min(1).max(255),
  user_id: z.string().min(1).max(255),
  property_id: z.string().min(1).max(255),
  added_at: z.coerce.date().optional()
});

export const updateCompareListInputSchema = z.object({
  compare_list_id: z.string(),
  user_id: z.string().optional(),
  property_id: z.string().optional(),
  added_at: z.coerce.date().optional()
});

export const searchCompareListInputSchema = z.object({
  user_id: z.string().optional(),
  property_id: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['compare_list_id', 'user_id', 'property_id', 'added_at']).default('added_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

export type CompareList = z.infer<typeof compareListSchema>;
export type CreateCompareListInput = z.infer<typeof createCompareListInputSchema>;
export type UpdateCompareListInput = z.infer<typeof updateCompareListInputSchema>;
export type SearchCompareListInput = z.infer<typeof searchCompareListInputSchema>;