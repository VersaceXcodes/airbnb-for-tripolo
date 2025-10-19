import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app, pool } from '../server';
import { 
  userSchema,
  propertySchema,
  bookingSchema,
  reviewSchema,
  messageThreadSchema,
  wishlistSchema
} from '../zodschemas';

// Test utilities
const TEST_SECRET = 'test-secret-key';
const createTestToken = (userId) => {
  return jwt.sign({ userId }, TEST_SECRET, { expiresIn: '1h' });
};

const TEST_USERS = {
  host: {
    user_id: 'usr_test_host',
    email: 'host@example.com',
    username: 'testhost',
    password_hash: 'password123',
    full_name: 'Test Host',
    is_host: true,
    is_verified: true
  },
  guest: {
    user_id: 'usr_test_guest',
    email: 'guest@example.com',
    username: 'testguest',
    password_hash: 'password123',
    full_name: 'Test Guest',
    is_host: false,
    is_verified: true
  }
};

const TEST_PROPERTY = {
  property_id: 'prop_test_001',
  host_id: 'usr_test_host',
  title: 'Test Property',
  description: 'A beautiful test property',
  property_type: 'Apartment',
  daily_price: 100.00,
  address: 'Test Street, Tripoli',
  latitude: 34.4376,
  longitude: 35.8412,
  check_in_instructions: 'Check in after 3 PM',
  amenities: '["wifi", "ac", "kitchen"]',
  is_instant_book: true,
  cancellation_policy: 'Flexible',
  is_active: true
};

describe('TripoStay API', () => {
  let authTokenHost;
  let authTokenGuest;

  beforeAll(async () => {
    // Setup test database
    await pool.query('DELETE FROM users');
    await pool.query('DELETE FROM properties');
    await pool.query('DELETE FROM bookings');
    await pool.query('DELETE FROM reviews');
    await pool.query('DELETE FROM message_threads');
    await pool.query('DELETE FROM messages');
    await pool.query('DELETE FROM wishlists');
    await pool.query('DELETE FROM compare_lists');
    
    // Insert test users
    await pool.query(
      `INSERT INTO users (user_id, email, username, password_hash, full_name, is_host, is_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        TEST_USERS.host.user_id,
        TEST_USERS.host.email,
        TEST_USERS.host.username,
        TEST_USERS.host.password_hash,
        TEST_USERS.host.full_name,
        TEST_USERS.host.is_host,
        TEST_USERS.host.is_verified,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    await pool.query(
      `INSERT INTO users (user_id, email, username, password_hash, full_name, is_host, is_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        TEST_USERS.guest.user_id,
        TEST_USERS.guest.email,
        TEST_USERS.guest.username,
        TEST_USERS.guest.password_hash,
        TEST_USERS.guest.full_name,
        TEST_USERS.guest.is_host,
        TEST_USERS.guest.is_verified,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    // Generate auth tokens
    authTokenHost = `Bearer ${createTestToken(TEST_USERS.host.user_id)}`;
    authTokenGuest = `Bearer ${createTestToken(TEST_USERS.guest.user_id)}`;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user successfully', async () => {
        const newUser = {
          user_id: 'usr_new_test',
          email: 'newuser@example.com',
          username: 'newuser',
          password_hash: 'newpassword123',
          full_name: 'New User',
          is_host: false
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(newUser)
          .expect(201);

        expect(response.body.user).toMatchObject({
          user_id: newUser.user_id,
          email: newUser.email,
          username: newUser.username,
          full_name: newUser.full_name
        });
        expect(response.body.token).toBeDefined();
      });

      it('should fail to register with duplicate email', async () => {
        const duplicateUser = {
          user_id: 'usr_duplicate',
          email: 'host@example.com', // Already exists
          username: 'newuniqueuser',
          password_hash: 'password123',
          full_name: 'Duplicate User'
        };

        await request(app)
          .post('/api/auth/register')
          .send(duplicateUser)
          .expect(409);
      });

      it('should fail to register with missing required fields', async () => {
        const invalidUser = {
          email: 'incomplete@example.com'
          // Missing required fields
        };

        await request(app)
          .post('/api/auth/register')
          .send(invalidUser)
          .expect(400);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login successfully with email', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username_or_email: 'host@example.com',
            password: 'password123'
          })
          .expect(200);

        expect(response.body.user).toBeDefined();
        expect(response.body.token).toBeDefined();
      });

      it('should login successfully with username', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            username_or_email: 'testhost',
            password: 'password123'
          })
          .expect(200);

        expect(response.body.user).toBeDefined();
        expect(response.body.token).toBeDefined();
      });

      it('should fail login with incorrect password', async () => {
        await request(app)
          .post('/api/auth/login')
          .send({
            username_or_email: 'host@example.com',
            password: 'wrongpassword'
          })
          .expect(401);
      });

      it('should fail login with non-existent user', async () => {
        await request(app)
          .post('/api/auth/login')
          .send({
            username_or_email: 'nonexistent@example.com',
            password: 'password123'
          })
          .expect(401);
      });
    });
  });

  describe('User Profile', () => {
    describe('GET /api/users/profile', () => {
      it('should get current user profile', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', authTokenHost)
          .expect(200);

        expect(response.body).toMatchObject({
          user_id: TEST_USERS.host.user_id,
          email: TEST_USERS.host.email,
          username: TEST_USERS.host.username
        });
      });

      it('should fail without authentication', async () => {
        await request(app)
          .get('/api/users/profile')
          .expect(401);
      });
    });

    describe('PATCH /api/users/profile', () => {
      it('should update user profile', async () => {
        const updates = {
          full_name: 'Updated Host Name',
          bio: 'This is my updated bio'
        };

        const response = await request(app)
          .patch('/api/users/profile')
          .set('Authorization', authTokenHost)
          .send(updates)
          .expect(200);

        expect(response.body.full_name).toBe(updates.full_name);
        expect(response.body.bio).toBe(updates.bio);
      });

      it('should fail to update profile without authentication', async () => {
        await request(app)
          .patch('/api/users/profile')
          .send({ full_name: 'Hacker Attempt' })
          .expect(401);
      });
    });

    describe('GET /api/users/:user_id', () => {
      it('should get public user profile', async () => {
        const response = await request(app)
          .get(`/api/users/${TEST_USERS.host.user_id}`)
          .expect(200);

        expect(response.body).toMatchObject({
          user_id: TEST_USERS.host.user_id,
          full_name: 'Updated Host Name',
          is_host: true
        });
        // Should not include sensitive information
        expect(response.body.email).toBeUndefined();
        expect(response.body.password_hash).toBeUndefined();
      });

      it('should return 404 for non-existent user', async () => {
        await request(app)
          .get('/api/users/usr_nonexistent')
          .expect(404);
      });
    });
  });

  describe('Properties', () => {
    describe('POST /api/properties', () => {
      it('should create a new property', async () => {
        const response = await request(app)
          .post('/api/properties')
          .set('Authorization', authTokenHost)
          .send(TEST_PROPERTY)
          .expect(201);

        expect(response.body).toMatchObject({
          property_id: TEST_PROPERTY.property_id,
          title: TEST_PROPERTY.title,
          host_id: TEST_PROPERTY.host_id
        });
      });

      it('should fail to create property without authentication', async () => {
        await request(app)
          .post('/api/properties')
          .send(TEST_PROPERTY)
          .expect(401);
      });

      it('should fail to create property as non-host', async () => {
        await request(app)
          .post('/api/properties')
          .set('Authorization', authTokenGuest)
          .send({
            ...TEST_PROPERTY,
            property_id: 'prop_test_002'
          })
          .expect(403);
      });
    });

    describe('GET /api/properties/search', () => {
      it('should search properties with filters', async () => {
        const response = await request(app)
          .get('/api/properties/search')
          .query({
            query: 'Test',
            min_price: 50,
            max_price: 200,
            property_type: 'Apartment'
          })
          .expect(200);

        expect(response.body.properties).toHaveLength(1);
        expect(response.body.properties[0].title).toBe(TEST_PROPERTY.title);
        expect(response.body.total).toBe(1);
      });

      it('should return empty results for non-matching search', async () => {
        const response = await request(app)
          .get('/api/properties/search')
          .query({ query: 'NonExistentProperty' })
          .expect(200);

        expect(response.body.properties).toHaveLength(0);
        expect(response.body.total).toBe(0);
      });
    });

    describe('GET /api/properties/:property_id', () => {
      it('should get property details', async () => {
        const response = await request(app)
          .get(`/api/properties/${TEST_PROPERTY.property_id}`)
          .expect(200);

        expect(response.body).toMatchObject({
          property_id: TEST_PROPERTY.property_id,
          title: TEST_PROPERTY.title,
          host_id: TEST_PROPERTY.host_id
        });
      });

      it('should return 404 for non-existent property', async () => {
        await request(app)
          .get('/api/properties/prop_nonexistent')
          .expect(404);
      });
    });

    describe('PATCH /api/properties/:property_id', () => {
      it('should update property as host', async () => {
        const updates = {
          title: 'Updated Test Property',
          daily_price: 150.00
        };

        const response = await request(app)
          .patch(`/api/properties/${TEST_PROPERTY.property_id}`)
          .set('Authorization', authTokenHost)
          .send(updates)
          .expect(200);

        expect(response.body.title).toBe(updates.title);
        expect(response.body.daily_price).toBe(updates.daily_price);
      });

      it('should fail to update property as non-host', async () => {
        await request(app)
          .patch(`/api/properties/${TEST_PROPERTY.property_id}`)
          .set('Authorization', authTokenGuest)
          .send({ title: 'Hacker Attempt' })
          .expect(403);
      });
    });

    describe('DELETE /api/properties/:property_id', () => {
      it('should delete property as host', async () => {
        // First create a new property to delete
        const newProperty = {
          ...TEST_PROPERTY,
          property_id: 'prop_test_to_delete'
        };

        await request(app)
          .post('/api/properties')
          .set('Authorization', authTokenHost)
          .send(newProperty)
          .expect(201);

        await request(app)
          .delete(`/api/properties/${newProperty.property_id}`)
          .set('Authorization', authTokenHost)
          .expect(204);
      });

      it('should fail to delete property as non-host', async () => {
        await request(app)
          .delete(`/api/properties/${TEST_PROPERTY.property_id}`)
          .set('Authorization', authTokenGuest)
          .expect(403);
      });
    });
  });

  describe('Bookings', () => {
    let bookingId;

    describe('POST /api/bookings', () => {
      it('should create a new booking', async () => {
        const bookingData = {
          property_id: TEST_PROPERTY.property_id,
          check_in_date: '2024-06-01',
          check_out_date: '2024-06-03',
          guests_count: 2,
          total_amount: 200.00,
          status: 'confirmed'
        };

        const response = await request(app)
          .post('/api/bookings')
          .set('Authorization', authTokenGuest)
          .send(bookingData)
          .expect(201);

        expect(response.body.booking).toMatchObject({
          property_id: bookingData.property_id,
          guest_id: TEST_USERS.guest.user_id,
          status: bookingData.status
        });

        bookingId = response.body.booking.booking_id;
      });

      it('should fail to create booking without authentication', async () => {
        await request(app)
          .post('/api/bookings')
          .send({
            property_id: TEST_PROPERTY.property_id,
            check_in_date: '2024-07-01',
            check_out_date: '2024-07-03',
            guests_count: 2,
            total_amount: 200.00,
            status: 'confirmed'
          })
          .expect(401);
      });
    });

    describe('GET /api/bookings/search', () => {
      it('should search bookings for guest', async () => {
        const response = await request(app)
          .get('/api/bookings/search')
          .set('Authorization', authTokenGuest)
          .query({ guest_id: TEST_USERS.guest.user_id })
          .expect(200);

        expect(response.body.bookings).toHaveLength(1);
        expect(response.body.bookings[0].booking_id).toBe(bookingId);
      });

      it('should search bookings for host', async () => {
        const response = await request(app)
          .get('/api/bookings/search')
          .set('Authorization', authTokenHost)
          .query({ host_id: TEST_USERS.host.user_id })
          .expect(200);

        expect(response.body.bookings).toHaveLength(1);
        expect(response.body.bookings[0].booking_id).toBe(bookingId);
      });
    });

    describe('GET /api/bookings/:booking_id', () => {
      it('should get booking details', async () => {
        const response = await request(app)
          .get(`/api/bookings/${bookingId}`)
          .set('Authorization', authTokenGuest)
          .expect(200);

        expect(response.body).toMatchObject({
          booking_id: bookingId,
          property_id: TEST_PROPERTY.property_id,
          guest_id: TEST_USERS.guest.user_id
        });
      });

      it('should return 404 for non-existent booking', async () => {
        await request(app)
          .get('/api/bookings/book_nonexistent')
          .set('Authorization', authTokenGuest)
          .expect(404);
      });
    });

    describe('POST /api/bookings/:booking_id/cancel', () => {
      it('should cancel booking', async () => {
        const response = await request(app)
          .post(`/api/bookings/${bookingId}/cancel`)
          .set('Authorization', authTokenGuest)
          .send({ reason: 'Changed travel plans' })
          .expect(200);

        expect(response.body.status).toBe('cancelled');
        expect(response.body.cancellation_reason).toBe('Changed travel plans');
      });

      it('should fail to cancel already cancelled booking', async () => {
        await request(app)
          .post(`/api/bookings/${bookingId}/cancel`)
          .set('Authorization', authTokenGuest)
          .send({ reason: 'Another reason' })
          .expect(409);
      });
    });
  });

  describe('Reviews', () => {
    let reviewId;

    describe('POST /api/reviews', () => {
      it('should submit a new review', async () => {
        // First create a completed booking to review
        const bookingData = {
          booking_id: 'book_test_review',
          property_id: TEST_PROPERTY.property_id,
          guest_id: TEST_USERS.guest.user_id,
          check_in_date: '2024-05-01',
          check_out_date: '2024-05-03',
          guests_count: 2,
          total_amount: 200.00,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await pool.query(
          `INSERT INTO bookings (booking_id, property_id, guest_id, check_in_date, check_out_date, 
           guests_count, total_amount, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            bookingData.booking_id,
            bookingData.property_id,
            bookingData.guest_id,
            bookingData.check_in_date,
            bookingData.check_out_date,
            bookingData.guests_count,
            bookingData.total_amount,
            bookingData.status,
            bookingData.created_at,
            bookingData.updated_at
          ]
        );

        const reviewData = {
          review_id: 'rev_test_001',
          property_id: TEST_PROPERTY.property_id,
          booking_id: bookingData.booking_id,
          reviewer_id: TEST_USERS.guest.user_id,
          rating: 5,
          comment: 'Excellent stay! Highly recommended.',
          is_anonymous: false
        };

        const response = await request(app)
          .post('/api/reviews')
          .set('Authorization', authTokenGuest)
          .send(reviewData)
          .expect(201);

        expect(response.body).toMatchObject({
          review_id: reviewData.review_id,
          property_id: reviewData.property_id,
          rating: reviewData.rating,
          comment: reviewData.comment
        });

        reviewId = response.body.review_id;
      });
    });

    describe('GET /api/reviews/search', () => {
      it('should search reviews for property', async () => {
        const response = await request(app)
          .get('/api/reviews/search')
          .query({ property_id: TEST_PROPERTY.property_id })
          .expect(200);

        expect(response.body.reviews).toHaveLength(1);
        expect(response.body.reviews[0].review_id).toBe(reviewId);
      });
    });

    describe('POST /api/reviews/:review_id/flag', () => {
      it('should flag review as abusive', async () => {
        const response = await request(app)
          .post(`/api/reviews/${reviewId}/flag`)
          .set('Authorization', authTokenHost)
          .send({ reason: 'Inappropriate content' })
          .expect(200);

        expect(response.body.is_flagged).toBe(true);
      });
    });
  });

  describe('Messaging', () => {
    let threadId;

    describe('POST /api/messages/threads', () => {
      it('should create a new message thread', async () => {
        const threadData = {
          thread_id: 'thread_test_001',
          property_id: TEST_PROPERTY.property_id,
          guest_id: TEST_USERS.guest.user_id,
          host_id: TEST_USERS.host.user_id
        };

        const response = await request(app)
          .post('/api/messages/threads')
          .set('Authorization', authTokenGuest)
          .send(threadData)
          .expect(201);

        expect(response.body).toMatchObject({
          thread_id: threadData.thread_id,
          property_id: threadData.property_id,
          guest_id: threadData.guest_id,
          host_id: threadData.host_id
        });

        threadId = response.body.thread_id;
      });
    });

    describe('GET /api/messages/threads', () => {
      it('should get user message threads', async () => {
        const response = await request(app)
          .get('/api/messages/threads')
          .set('Authorization', authTokenGuest)
          .expect(200);

        expect(response.body.threads).toHaveLength(1);
        expect(response.body.threads[0].thread_id).toBe(threadId);
      });
    });

    describe('POST /api/messages', () => {
      it('should send a message in thread', async () => {
        const messageData = {
          thread_id: threadId,
          content: 'Hello, I am interested in your property!'
        };

        const response = await request(app)
          .post('/api/messages')
          .set('Authorization', authTokenGuest)
          .send(messageData)
          .expect(201);

        expect(response.body).toMatchObject({
          thread_id: messageData.thread_id,
          content: messageData.content,
          sender_id: TEST_USERS.guest.user_id
        });
      });
    });

    describe('GET /api/messages/threads/:thread_id', () => {
      it('should get messages from thread', async () => {
        const response = await request(app)
          .get(`/api/messages/threads/${threadId}`)
          .set('Authorization', authTokenGuest)
          .expect(200);

        expect(response.body.messages).toHaveLength(1);
        expect(response.body.messages[0].content).toBe('Hello, I am interested in your property!');
      });
    });
  });

  describe('Wishlist', () => {
    describe('POST /api/user/wishlist', () => {
      it('should add property to wishlist', async () => {
        const response = await request(app)
          .post('/api/user/wishlist')
          .set('Authorization', authTokenGuest)
          .send({ property_id: TEST_PROPERTY.property_id })
          .expect(201);

        expect(response.body).toMatchObject({
          user_id: TEST_USERS.guest.user_id,
          property_id: TEST_PROPERTY.property_id
        });
      });

      it('should fail to add duplicate property to wishlist', async () => {
        await request(app)
          .post('/api/user/wishlist')
          .set('Authorization', authTokenGuest)
          .send({ property_id: TEST_PROPERTY.property_id })
          .expect(409);
      });
    });

    describe('GET /api/user/wishlist', () => {
      it('should get user wishlist', async () => {
        const response = await request(app)
          .get('/api/user/wishlist')
          .set('Authorization', authTokenGuest)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].property_id).toBe(TEST_PROPERTY.property_id);
      });
    });

    describe('DELETE /api/user/wishlist', () => {
      it('should remove property from wishlist', async () => {
        await request(app)
          .delete('/api/user/wishlist')
          .set('Authorization', authTokenGuest)
          .query({ property_id: TEST_PROPERTY.property_id })
          .expect(204);

        const response = await request(app)
          .get('/api/user/wishlist')
          .set('Authorization', authTokenGuest)
          .expect(200);

        expect(response.body).toHaveLength(0);
      });
    });
  });

  describe('Compare Lists', () => {
    describe('POST /api/compare_lists', () => {
      it('should add property to compare list', async () => {
        const response = await request(app)
          .post('/api/compare_lists')
          .set('Authorization', authTokenGuest)
          .send({ property_id: TEST_PROPERTY.property_id })
          .expect(201);

        expect(response.body).toMatchObject({
          user_id: TEST_USERS.guest.user_id,
          property_id: TEST_PROPERTY.property_id
        });
      });
    });

    describe('GET /api/compare_lists', () => {
      it('should get user compare list', async () => {
        const response = await request(app)
          .get('/api/compare_lists')
          .set('Authorization', authTokenGuest)
          .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].property_id).toBe(TEST_PROPERTY.property_id);
      });
    });

    describe('DELETE /api/compare_lists', () => {
      it('should remove property from compare list', async () => {
        await request(app)
          .delete('/api/compare_lists')
          .set('Authorization', authTokenGuest)
          .query({ property_id: TEST_PROPERTY.property_id })
          .expect(204);

        const response = await request(app)
          .get('/api/compare_lists')
          .set('Authorization', authTokenGuest)
          .expect(200);

        expect(response.body).toHaveLength(0);
      });
    });
  });
});