-- Create tables
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    phone_number TEXT,
    bio TEXT,
    profile_image_url TEXT,
    language_preference TEXT DEFAULT 'ar',
    is_host BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE properties (
    property_id TEXT PRIMARY KEY,
    host_id TEXT NOT NULL REFERENCES users(user_id),
    title TEXT NOT NULL,
    description TEXT,
    property_type TEXT NOT NULL,
    daily_price NUMERIC NOT NULL,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    check_in_instructions TEXT,
    amenities TEXT,
    is_instant_book BOOLEAN NOT NULL DEFAULT FALSE,
    cancellation_policy TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE property_images (
    image_id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES properties(property_id),
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE availability_dates (
    availability_id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES properties(property_id),
    date TEXT NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TEXT NOT NULL
);

CREATE TABLE bookings (
    booking_id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES properties(property_id),
    guest_id TEXT NOT NULL REFERENCES users(user_id),
    check_in_date TEXT NOT NULL,
    check_out_date TEXT NOT NULL,
    guests_count INTEGER NOT NULL,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL,
    cancellation_reason TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE reviews (
    review_id TEXT PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES properties(property_id),
    booking_id TEXT NOT NULL REFERENCES bookings(booking_id),
    reviewer_id TEXT NOT NULL REFERENCES users(user_id),
    rating INTEGER NOT NULL,
    comment TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE messages (
    message_id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL,
    sender_id TEXT NOT NULL REFERENCES users(user_id),
    recipient_id TEXT NOT NULL REFERENCES users(user_id),
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL
);

CREATE TABLE message_threads (
    thread_id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(property_id),
    guest_id TEXT NOT NULL REFERENCES users(user_id),
    host_id TEXT NOT NULL REFERENCES users(user_id),
    last_message_at TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE wishlists (
    wishlist_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    property_id TEXT NOT NULL REFERENCES properties(property_id),
    added_at TEXT NOT NULL
);

CREATE TABLE compare_lists (
    compare_list_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(user_id),
    property_id TEXT NOT NULL REFERENCES properties(property_id),
    added_at TEXT NOT NULL
);

-- Seed data
-- Users
INSERT INTO users (user_id, email, username, password_hash, full_name, phone_number, bio, profile_image_url, language_preference, is_host, is_verified, created_at, updated_at) VALUES
('user_001', 'ahmed.ali@example.com', 'ahmedali', 'password123', 'Ahmed Ali', '+966501234567', 'Experienced host in Riyadh', 'https://picsum.photos/200/300?random=1', 'ar', true, true, '2023-01-15T10:30:00Z', '2023-01-15T10:30:00Z'),
('user_002', 'fatima.khalid@example.com', 'fatimak', 'user123', 'Fatima Khalid', '+966551234567', 'Travel enthusiast', 'https://picsum.photos/200/300?random=2', 'ar', false, true, '2023-02-20T14:45:00Z', '2023-02-20T14:45:00Z'),
('user_003', 'mohammed.saud@example.com', 'mohammeds', 'host123', 'Mohammed Saud', '+966561234567', 'Property manager with multiple listings', 'https://picsum.photos/200/300?random=3', 'ar', true, true, '2023-03-10T09:15:00Z', '2023-03-10T09:15:00Z'),
('user_004', 'noura.ahmed@example.com', 'nouraahmed', 'guest123', 'Noura Ahmed', '+966541234567', 'Frequent traveler', 'https://picsum.photos/200/300?random=4', 'ar', false, false, '2023-04-05T16:20:00Z', '2023-04-05T16:20:00Z'),
('user_005', 'khalid.faisal@example.com', 'khalidf', 'admin123', 'Khalid Faisal', '+966531234567', 'Luxury property host', 'https://picsum.photos/200/300?random=5', 'en', true, true, '2023-05-12T11:30:00Z', '2023-05-12T11:30:00Z');

-- Properties
INSERT INTO properties (property_id, host_id, title, description, property_type, daily_price, address, latitude, longitude, check_in_instructions, amenities, is_instant_book, cancellation_policy, is_active, created_at, updated_at) VALUES
('prop_001', 'user_001', 'Modern Apartment in Riyadh', 'Beautiful modern apartment in the heart of Riyadh with all amenities', 'Apartment', 150.00, 'King Fahd Road, Riyadh', 24.7136, 46.6753, 'Check in after 3 PM. Key is in the lockbox with code 1234.', 'WiFi, Air Conditioning, Kitchen, Parking', true, 'Flexible', true, '2023-01-20T12:00:00Z', '2023-01-20T12:00:00Z'),
('prop_002', 'user_003', 'Luxury Villa in Jeddah', 'Spacious villa with private pool and sea view', 'Villa', 350.00, 'Corniche Road, Jeddah', 21.5435, 39.1989, 'Check in after 4 PM. The villa manager will meet you at the gate.', 'Pool, WiFi, Air Conditioning, Kitchen, Garden', false, 'Moderate', true, '2023-03-15T09:30:00Z', '2023-03-15T09:30:00Z'),
('prop_003', 'user_005', 'Traditional House in Al Ula', 'Authentic traditional Saudi house in the historic area of Al Ula', 'House', 120.00, 'Heritage Area, Al Ula', 26.6025, 37.9250, 'Check in after 2 PM. Key is with the caretaker next to the entrance.', 'WiFi, Heating, Traditional Decor, Courtyard', true, 'Strict', true, '2023-05-18T14:15:00Z', '2023-05-18T14:15:00Z'),
('prop_004', 'user_001', 'Studio Apartment Near King Saud University', 'Cozy studio perfect for students or business travelers', 'Studio', 80.00, 'King Saud University Area, Riyadh', 24.7233, 46.6213, 'Check in after 1 PM. Code for the door is 5678.', 'WiFi, Air Conditioning, Mini Kitchen', true, 'Flexible', true, '2023-02-10T11:45:00Z', '2023-02-10T11:45:00Z'),
('prop_005', 'user_003', 'Beachfront Apartment in Dammam', 'Modern apartment with direct beach access', 'Apartment', 200.00, 'Beach Road, Dammam', 26.4207, 50.0883, 'Check in after 3 PM. The building manager will give you the keys.', 'Beach Access, WiFi, Air Conditioning, Kitchen, Gym', false, 'Moderate', true, '2023-04-01T13:20:00Z', '2023-04-01T13:20:00Z');

-- Property Images
INSERT INTO property_images (image_id, property_id, image_url, is_primary, display_order, created_at) VALUES
('img_001', 'prop_001', 'https://picsum.photos/600/400?random=10', true, 0, '2023-01-20T12:05:00Z'),
('img_002', 'prop_001', 'https://picsum.photos/600/400?random=11', false, 1, '2023-01-20T12:05:00Z'),
('img_003', 'prop_001', 'https://picsum.photos/600/400?random=12', false, 2, '2023-01-20T12:05:00Z'),
('img_004', 'prop_002', 'https://picsum.photos/600/400?random=20', true, 0, '2023-03-15T09:35:00Z'),
('img_005', 'prop_002', 'https://picsum.photos/600/400?random=21', false, 1, '2023-03-15T09:35:00Z'),
('img_006', 'prop_002', 'https://picsum.photos/600/400?random=22', false, 2, '2023-03-15T09:35:00Z'),
('img_007', 'prop_003', 'https://picsum.photos/600/400?random=30', true, 0, '2023-05-18T14:20:00Z'),
('img_008', 'prop_003', 'https://picsum.photos/600/400?random=31', false, 1, '2023-05-18T14:20:00Z'),
('img_009', 'prop_004', 'https://picsum.photos/600/400?random=40', true, 0, '2023-02-10T11:50:00Z'),
('img_010', 'prop_005', 'https://picsum.photos/600/400?random=50', true, 0, '2023-04-01T13:25:00Z');

-- Availability Dates
INSERT INTO availability_dates (availability_id, property_id, date, is_available, created_at) VALUES
('avail_001', 'prop_001', '2023-06-01', true, '2023-01-20T12:10:00Z'),
('avail_002', 'prop_001', '2023-06-02', true, '2023-01-20T12:10:00Z'),
('avail_003', 'prop_001', '2023-06-03', false, '2023-01-20T12:10:00Z'),
('avail_004', 'prop_002', '2023-06-01', true, '2023-03-15T09:40:00Z'),
('avail_005', 'prop_002', '2023-06-02', true, '2023-03-15T09:40:00Z'),
('avail_006', 'prop_003', '2023-06-01', true, '2023-05-18T14:25:00Z'),
('avail_007', 'prop_003', '2023-06-02', true, '2023-05-18T14:25:00Z'),
('avail_008', 'prop_004', '2023-06-01', true, '2023-02-10T11:55:00Z'),
('avail_009', 'prop_004', '2023-06-02', true, '2023-02-10T11:55:00Z'),
('avail_010', 'prop_005', '2023-06-01', true, '2023-04-01T13:30:00Z');

-- Bookings
INSERT INTO bookings (booking_id, property_id, guest_id, check_in_date, check_out_date, guests_count, total_amount, status, cancellation_reason, created_at, updated_at) VALUES
('book_001', 'prop_001', 'user_002', '2023-06-01', '2023-06-03', 2, 300.00, 'confirmed', NULL, '2023-05-01T10:00:00Z', '2023-05-01T10:00:00Z'),
('book_002', 'prop_002', 'user_004', '2023-06-05', '2023-06-10', 4, 1750.00, 'confirmed', NULL, '2023-05-10T14:30:00Z', '2023-05-10T14:30:00Z'),
('book_003', 'prop_004', 'user_002', '2023-06-15', '2023-06-17', 1, 160.00, 'pending', NULL, '2023-05-20T09:15:00Z', '2023-05-20T09:15:00Z'),
('book_004', 'prop_001', 'user_004', '2023-06-20', '2023-06-22', 2, 300.00, 'cancelled', 'Changed travel plans', '2023-05-25T16:45:00Z', '2023-05-26T11:20:00Z'),
('book_005', 'prop_005', 'user_002', '2023-06-10', '2023-06-15', 3, 1000.00, 'confirmed', NULL, '2023-05-15T13:30:00Z', '2023-05-15T13:30:00Z');

-- Reviews
INSERT INTO reviews (review_id, property_id, booking_id, reviewer_id, rating, comment, is_anonymous, is_flagged, created_at, updated_at) VALUES
('rev_001', 'prop_001', 'book_001', 'user_002', 5, 'Amazing place! Clean, comfortable and great location.', false, false, '2023-06-05T12:00:00Z', '2023-06-05T12:00:00Z'),
('rev_002', 'prop_002', 'book_002', 'user_004', 4, 'Beautiful villa with great amenities. The pool was perfect.', false, false, '2023-06-12T15:30:00Z', '2023-06-12T15:30:00Z'),
('rev_003', 'prop_004', 'book_003', 'user_002', 3, 'Nice and clean studio, but a bit smaller than expected.', true, false, '2023-06-18T10:45:00Z', '2023-06-18T10:45:00Z'),
('rev_004', 'prop_005', 'book_005', 'user_002', 5, 'Perfect beachfront location. The apartment was exactly as described.', false, false, '2023-06-16T11:20:00Z', '2023-06-16T11:20:00Z'),
('rev_005', 'prop_001', 'book_004', 'user_004', 2, 'The place was not as clean as shown in the pictures.', true, true, '2023-06-23T14:10:00Z', '2023-06-23T14:10:00Z');

-- Message Threads
INSERT INTO message_threads (thread_id, property_id, guest_id, host_id, last_message_at, created_at) VALUES
('thread_001', 'prop_001', 'user_002', 'user_001', '2023-05-01T09:30:00Z', '2023-04-28T11:00:00Z'),
('thread_002', 'prop_002', 'user_004', 'user_003', '2023-05-09T16:45:00Z', '2023-05-05T10:15:00Z'),
('thread_003', 'prop_004', 'user_002', 'user_001', '2023-05-19T13:20:00Z', '2023-05-18T09:30:00Z'),
('thread_004', 'prop_005', 'user_002', 'user_003', '2023-05-14T15:00:00Z', '2023-05-12T14:20:00Z'),
('thread_005', NULL, 'user_001', 'user_003', '2023-05-20T11:10:00Z', '2023-05-20T10:00:00Z');

-- Messages
INSERT INTO messages (message_id, thread_id, sender_id, recipient_id, content, is_read, created_at) VALUES
('msg_001', 'thread_001', 'user_002', 'user_001', 'Hi, I''m interested in booking your apartment for June 1-3. Is it still available?', false, '2023-04-28T11:00:00Z'),
('msg_002', 'thread_001', 'user_001', 'user_002', 'Yes, it''s still available! The price is 150 SAR per night.', true, '2023-04-28T12:30:00Z'),
('msg_003', 'thread_001', 'user_002', 'user_001', 'Great! I''d like to proceed with the booking.', true, '2023-04-28T13:15:00Z'),
('msg_004', 'thread_002', 'user_004', 'user_003', 'Could you provide more details about the pool facilities?', false, '2023-05-05T10:15:00Z'),
('msg_005', 'thread_002', 'user_003', 'user_004', 'Certainly! The pool is 10x5 meters, heated, and maintained daily.', true, '2023-05-05T11:45:00Z'),
('msg_006', 'thread_003', 'user_002', 'user_001', 'I have a question about the check-in process.', false, '2023-05-18T09:30:00Z'),
('msg_007', 'thread_003', 'user_001', 'user_002', 'Sure, what would you like to know?', true, '2023-05-18T10:20:00Z'),
('msg_008', 'thread_004', 'user_002', 'user_003', 'Is the beach access private or shared?', false, '2023-05-12T14:20:00Z'),
('msg_009', 'thread_004', 'user_003', 'user_002', 'It''s shared with other residents, but there''s plenty of space.', true, '2023-05-12T15:30:00Z'),
('msg_010', 'thread_005', 'user_001', 'user_003', 'Let''s discuss the new property management partnership.', false, '2023-05-20T10:00:00Z');

-- Wishlists
INSERT INTO wishlists (wishlist_id, user_id, property_id, added_at) VALUES
('wish_001', 'user_002', 'prop_001', '2023-04-15T09:00:00Z'),
('wish_002', 'user_002', 'prop_002', '2023-04-16T14:30:00Z'),
('wish_003', 'user_004', 'prop_005', '2023-05-01T11:20:00Z'),
('wish_004', 'user_004', 'prop_003', '2023-05-02T16:45:00Z'),
('wish_005', 'user_002', 'prop_005', '2023-05-10T10:15:00Z');

-- Compare Lists
INSERT INTO compare_lists (compare_list_id, user_id, property_id, added_at) VALUES
('comp_001', 'user_002', 'prop_001', '2023-04-20T13:00:00Z'),
('comp_002', 'user_002', 'prop_004', '2023-04-20T13:05:00Z'),
('comp_003', 'user_004', 'prop_002', '2023-05-05T09:30:00Z'),
('comp_004', 'user_004', 'prop_005', '2023-05-05T09:32:00Z'),
('comp_005', 'user_002', 'prop_003', '2023-05-12T14:00:00Z');