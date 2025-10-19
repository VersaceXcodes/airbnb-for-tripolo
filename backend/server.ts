import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';

// Import Zod schemas
import {
  userSchema, createUserInputSchema, updateUserInputSchema, searchUserInputSchema,
  propertySchema, createPropertyInputSchema, updatePropertyInputSchema, searchPropertyInputSchema,
  propertyImageSchema, createPropertyImageInputSchema, updatePropertyImageInputSchema, searchPropertyImageInputSchema,
  availabilityDateSchema, createAvailabilityDateInputSchema, updateAvailabilityDateInputSchema, searchAvailabilityDateInputSchema,
  bookingSchema, createBookingInputSchema, updateBookingInputSchema, searchBookingInputSchema,
  reviewSchema, createReviewInputSchema, updateReviewInputSchema, searchReviewInputSchema,
  messageSchema, createMessageInputSchema, updateMessageInputSchema, searchMessageInputSchema,
  messageThreadSchema, createMessageThreadInputSchema, updateMessageThreadInputSchema, searchMessageThreadInputSchema,
  wishlistSchema, createWishlistInputSchema, updateWishlistInputSchema, searchWishlistInputSchema,
  compareListSchema, createCompareListInputSchema, updateCompareListInputSchema, searchCompareListInputSchema
} from './schema.js';

dotenv.config();

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Error response utility
interface ErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  details?: any;
  timestamp: string;
}

function createErrorResponse(
  message: string,
  error?: any,
  errorCode?: string
): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errorCode) {
    response.error_code = errorCode;
  }

  if (error) {
    response.details = {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return response;
}

// Environment variables
const { 
  DATABASE_URL, 
  PGHOST, 
  PGDATABASE, 
  PGUSER, 
  PGPASSWORD, 
  PGPORT = 5432, 
  JWT_SECRET = 'tripostay-secret-key-dev',
  PORT = 3000
} = process.env;

// PostgreSQL connection
const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST,
        database: PGDATABASE,
        user: PGUSER,
        password: PGPASSWORD,
        port: Number(PGPORT),
        ssl: { require: true },
      }
);

const app = express();

// Middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(morgan('combined'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Create storage directory if it doesn't exist
const storageDir = path.join(__dirname, 'storage');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

/*
Authentication middleware for protected routes
Validates JWT tokens and attaches user information to request
*/
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json(createErrorResponse('Access token required', null, 'AUTH_TOKEN_MISSING'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE user_id = $1', [decoded.user_id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid token - user not found', null, 'AUTH_USER_NOT_FOUND'));
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json(createErrorResponse('Invalid or expired token', error, 'AUTH_TOKEN_INVALID'));
  }
};

/*
AUTHENTICATION ENDPOINTS
Handle user registration, login, and profile management
*/

// Register new user account
app.post('/api/auth/register', async (req, res) => {
  try {
    // Validate input using Zod schema
    const validatedData = createUserInputSchema.parse({
      user_id: `usr_${uuidv4()}`,
      ...req.body,
      created_at: new Date(),
      updated_at: new Date()
    });

    const client = await pool.connect();
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT user_id FROM users WHERE email = $1 OR username = $2', 
      [validatedData.email, validatedData.username]
    );
    
    if (existingUser.rows.length > 0) {
      client.release();
      return res.status(409).json(createErrorResponse('User already exists', null, 'USER_ALREADY_EXISTS'));
    }

    // Create new user - NO PASSWORD HASHING for development
    const result = await client.query(
      `INSERT INTO users (
        user_id, email, username, password_hash, full_name, phone_number, 
        bio, profile_image_url, language_preference, is_host, is_verified, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [
        validatedData.user_id,
        validatedData.email,
        validatedData.username,
        validatedData.password_hash, // Store password directly
        validatedData.full_name,
        validatedData.phone_number,
        validatedData.bio,
        validatedData.profile_image_url,
        validatedData.language_preference || 'ar',
        validatedData.is_host || false,
        validatedData.is_verified || false,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    
    client.release();
    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        user_id: user.user_id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        phone_number: user.phone_number,
        bio: user.bio,
        profile_image_url: user.profile_image_url,
        language_preference: user.language_preference,
        is_host: user.is_host,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json(createErrorResponse('Registration failed', error, 'REGISTRATION_ERROR'));
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username_or_email, password } = req.body;

    if (!username_or_email || !password) {
      return res.status(400).json(createErrorResponse('Username/email and password required', null, 'MISSING_CREDENTIALS'));
    }

    const client = await pool.connect();
    
    // Find user by email or username
    const result = await client.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1', 
      [username_or_email]
    );
    
    client.release();

    if (result.rows.length === 0) {
      return res.status(401).json(createErrorResponse('Invalid credentials', null, 'INVALID_CREDENTIALS'));
    }

    const user = result.rows[0];

    // Direct password comparison (no hashing for development)
    if (password !== user.password_hash) {
      return res.status(401).json(createErrorResponse('Invalid credentials', null, 'INVALID_CREDENTIALS'));
    }

    // Generate JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        phone_number: user.phone_number,
        bio: user.bio,
        profile_image_url: user.profile_image_url,
        language_preference: user.language_preference,
        is_host: user.is_host,
        is_verified: user.is_verified,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(createErrorResponse('Login failed', error, 'LOGIN_ERROR'));
  }
});

/*
USER PROFILE ENDPOINTS
Handle user profile retrieval and updates
*/

// Get current user profile
app.get('/api/users/profile', authenticateToken, (req, res) => {
  res.json({
    user_id: req.user.user_id,
    email: req.user.email,
    username: req.user.username,
    full_name: req.user.full_name,
    phone_number: req.user.phone_number,
    bio: req.user.bio,
    profile_image_url: req.user.profile_image_url,
    language_preference: req.user.language_preference,
    is_host: req.user.is_host,
    is_verified: req.user.is_verified,
    created_at: req.user.created_at,
    updated_at: req.user.updated_at
  });
});

// Update current user profile
app.patch('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const validatedData = updateUserInputSchema.parse({
      user_id: req.user.user_id,
      ...req.body
    });

    const client = await pool.connect();
    
    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    if (validatedData.email) {
      updateFields.push(`email = $${valueIndex++}`);
      values.push(validatedData.email);
    }
    if (validatedData.username) {
      updateFields.push(`username = $${valueIndex++}`);
      values.push(validatedData.username);
    }
    if (validatedData.full_name !== undefined) {
      updateFields.push(`full_name = $${valueIndex++}`);
      values.push(validatedData.full_name);
    }
    if (validatedData.phone_number !== undefined) {
      updateFields.push(`phone_number = $${valueIndex++}`);
      values.push(validatedData.phone_number);
    }
    if (validatedData.bio !== undefined) {
      updateFields.push(`bio = $${valueIndex++}`);
      values.push(validatedData.bio);
    }
    if (validatedData.profile_image_url !== undefined) {
      updateFields.push(`profile_image_url = $${valueIndex++}`);
      values.push(validatedData.profile_image_url);
    }
    if (validatedData.language_preference !== undefined) {
      updateFields.push(`language_preference = $${valueIndex++}`);
      values.push(validatedData.language_preference);
    }
    if (validatedData.is_host !== undefined) {
      updateFields.push(`is_host = $${valueIndex++}`);
      values.push(validatedData.is_host);
    }

    updateFields.push(`updated_at = $${valueIndex++}`);
    values.push(new Date().toISOString());
    values.push(req.user.user_id);

    const result = await client.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = $${valueIndex} RETURNING *`,
      values
    );
    
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    const user = result.rows[0];
    res.json({
      user_id: user.user_id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      phone_number: user.phone_number,
      bio: user.bio,
      profile_image_url: user.profile_image_url,
      language_preference: user.language_preference,
      is_host: user.is_host,
      is_verified: user.is_verified,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(400).json(createErrorResponse('Profile update failed', error, 'PROFILE_UPDATE_ERROR'));
  }
});

// Get public user profile
app.get('/api/users/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const client = await pool.connect();
    const result = await client.query(
      'SELECT user_id, username, full_name, bio, profile_image_url, is_verified, created_at FROM users WHERE user_id = $1',
      [user_id]
    );
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('User not found', null, 'USER_NOT_FOUND'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch user profile', error, 'USER_FETCH_ERROR'));
  }
});

/*
PROPERTY MANAGEMENT ENDPOINTS
Handle property CRUD operations, search, and image management
*/

// Search properties with filters
app.get('/api/properties/search', async (req, res) => {
  try {
    const {
      query = '',
      location = '',
      check_in,
      check_out,
      guests,
      price_min,
      price_max,
      property_type,
      is_active = true,
      min_rating,
      max_rating,
      sort_by = 'created_at',
      sort_order = 'desc',
      limit = 10,
      offset = 0
    } = req.query;

    const client = await pool.connect();
    
    // Build complex search query with filters
    let searchQuery = `
      SELECT DISTINCT p.*, 
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.review_id) as review_count,
             ARRAY_AGG(pi.image_url ORDER BY pi.display_order) FILTER (WHERE pi.image_url IS NOT NULL) as images
      FROM properties p
      LEFT JOIN reviews r ON p.property_id = r.property_id
      LEFT JOIN property_images pi ON p.property_id = pi.property_id
      WHERE p.is_active = $1
    `;
    
    const queryParams = [is_active];
    let paramIndex = 2;

    // Add filters dynamically
    if (query) {
      searchQuery += ` AND (p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      queryParams.push(`%${query}%`);
      paramIndex++;
    }

    if (location) {
      searchQuery += ` AND p.address ILIKE $${paramIndex}`;
      queryParams.push(`%${location}%`);
      paramIndex++;
    }

    if (property_type) {
      searchQuery += ` AND p.property_type = $${paramIndex}`;
      queryParams.push(property_type);
      paramIndex++;
    }

    if (price_min) {
      searchQuery += ` AND p.daily_price >= $${paramIndex}`;
      queryParams.push(parseFloat(price_min));
      paramIndex++;
    }

    if (price_max) {
      searchQuery += ` AND p.daily_price <= $${paramIndex}`;
      queryParams.push(parseFloat(price_max));
      paramIndex++;
    }

    // Check availability for specific dates
    if (check_in && check_out) {
      searchQuery += ` AND NOT EXISTS (
        SELECT 1 FROM availability_dates ad 
        WHERE ad.property_id = p.property_id 
        AND ad.date BETWEEN $${paramIndex} AND $${paramIndex + 1}
        AND ad.is_available = false
      )`;
      queryParams.push(check_in, check_out);
      paramIndex += 2;
    }

    searchQuery += ` GROUP BY p.property_id`;

    // Add rating filter after GROUP BY
    if (min_rating) {
      searchQuery += ` HAVING COALESCE(AVG(r.rating), 0) >= ${min_rating}`;
    }

    if (max_rating) {
      searchQuery += ` ${min_rating ? 'AND' : 'HAVING'} COALESCE(AVG(r.rating), 0) <= ${max_rating}`;
    }

    // Add sorting
    const validSortFields = ['property_id', 'title', 'daily_price', 'created_at', 'average_rating'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';
    
    searchQuery += ` ORDER BY ${sortField} ${sortDirection}`;
    
    // Add pagination
    searchQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await client.query(searchQuery, queryParams);
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(DISTINCT p.property_id) as total FROM properties p WHERE p.is_active = $1`;
    const countParams = [is_active];
    let countParamIndex = 2;

    if (query) {
      countQuery += ` AND (p.title ILIKE $${countParamIndex} OR p.description ILIKE $${countParamIndex})`;
      countParams.push(`%${query}%`);
      countParamIndex++;
    }

    if (location) {
      countQuery += ` AND p.address ILIKE $${countParamIndex}`;
      countParams.push(`%${location}%`);
      countParamIndex++;
    }

    if (property_type) {
      countQuery += ` AND p.property_type = $${countParamIndex}`;
      countParams.push(property_type);
      countParamIndex++;
    }

    if (price_min) {
      countQuery += ` AND p.daily_price >= $${countParamIndex}`;
      countParams.push(parseFloat(price_min));
      countParamIndex++;
    }

    if (price_max) {
      countQuery += ` AND p.daily_price <= $${countParamIndex}`;
      countParams.push(parseFloat(price_max));
      countParamIndex++;
    }

    const countResult = await client.query(countQuery, countParams);
    client.release();

    res.json({
      properties: result.rows,
      total: parseInt(countResult.rows[0].total),
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Property search error:', error);
    res.status(500).json(createErrorResponse('Property search failed', error, 'PROPERTY_SEARCH_ERROR'));
  }
});

// Create new property listing
app.post('/api/properties', authenticateToken, async (req, res) => {
  try {
    const validatedData = createPropertyInputSchema.parse({
      property_id: `prop_${uuidv4()}`,
      host_id: req.user.user_id,
      ...req.body
    });

    // Verify user is a host
    if (!req.user.is_host) {
      return res.status(403).json(createErrorResponse('Only hosts can create properties', null, 'HOST_REQUIRED'));
    }

    const client = await pool.connect();
    
    const result = await client.query(
      `INSERT INTO properties (
        property_id, host_id, title, description, property_type, daily_price,
        address, latitude, longitude, check_in_instructions, amenities,
        is_instant_book, cancellation_policy, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        validatedData.property_id,
        validatedData.host_id,
        validatedData.title,
        validatedData.description,
        validatedData.property_type,
        validatedData.daily_price,
        validatedData.address,
        validatedData.latitude,
        validatedData.longitude,
        validatedData.check_in_instructions,
        validatedData.amenities,
        validatedData.is_instant_book || false,
        validatedData.cancellation_policy,
        validatedData.is_active !== false,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Property creation error:', error);
    res.status(400).json(createErrorResponse('Property creation failed', error, 'PROPERTY_CREATE_ERROR'));
  }
});

// Get property details
app.get('/api/properties/:property_id', async (req, res) => {
  try {
    const { property_id } = req.params;
    
    const client = await pool.connect();
    
    // Get property with images, reviews, and host info
    const result = await client.query(`
      SELECT p.*,
             u.username as host_username,
             u.full_name as host_name,
             u.profile_image_url as host_image,
             u.bio as host_bio,
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.review_id) as review_count,
             ARRAY_AGG(DISTINCT jsonb_build_object(
               'image_id', pi.image_id,
               'image_url', pi.image_url,
               'is_primary', pi.is_primary,
               'display_order', pi.display_order
             ) ORDER BY pi.display_order) FILTER (WHERE pi.image_id IS NOT NULL) as images
      FROM properties p
      LEFT JOIN users u ON p.host_id = u.user_id
      LEFT JOIN reviews r ON p.property_id = r.property_id
      LEFT JOIN property_images pi ON p.property_id = pi.property_id
      WHERE p.property_id = $1
      GROUP BY p.property_id, u.user_id
    `, [property_id]);
    
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Property not found', null, 'PROPERTY_NOT_FOUND'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch property', error, 'PROPERTY_FETCH_ERROR'));
  }
});

// Update property
app.patch('/api/properties/:property_id', authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.params;
    
    const client = await pool.connect();
    
    // Verify ownership
    const ownerCheck = await client.query(
      'SELECT host_id FROM properties WHERE property_id = $1',
      [property_id]
    );
    
    if (ownerCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Property not found', null, 'PROPERTY_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].host_id !== req.user.user_id) {
      client.release();
      return res.status(403).json(createErrorResponse('Not authorized to update this property', null, 'NOT_PROPERTY_OWNER'));
    }

    const validatedData = updatePropertyInputSchema.parse({
      property_id,
      ...req.body
    });

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    if (validatedData.title) {
      updateFields.push(`title = $${valueIndex++}`);
      values.push(validatedData.title);
    }
    if (validatedData.description !== undefined) {
      updateFields.push(`description = $${valueIndex++}`);
      values.push(validatedData.description);
    }
    if (validatedData.property_type) {
      updateFields.push(`property_type = $${valueIndex++}`);
      values.push(validatedData.property_type);
    }
    if (validatedData.daily_price) {
      updateFields.push(`daily_price = $${valueIndex++}`);
      values.push(validatedData.daily_price);
    }
    if (validatedData.address !== undefined) {
      updateFields.push(`address = $${valueIndex++}`);
      values.push(validatedData.address);
    }
    if (validatedData.latitude !== undefined) {
      updateFields.push(`latitude = $${valueIndex++}`);
      values.push(validatedData.latitude);
    }
    if (validatedData.longitude !== undefined) {
      updateFields.push(`longitude = $${valueIndex++}`);
      values.push(validatedData.longitude);
    }
    if (validatedData.check_in_instructions !== undefined) {
      updateFields.push(`check_in_instructions = $${valueIndex++}`);
      values.push(validatedData.check_in_instructions);
    }
    if (validatedData.amenities !== undefined) {
      updateFields.push(`amenities = $${valueIndex++}`);
      values.push(validatedData.amenities);
    }
    if (validatedData.is_instant_book !== undefined) {
      updateFields.push(`is_instant_book = $${valueIndex++}`);
      values.push(validatedData.is_instant_book);
    }
    if (validatedData.cancellation_policy !== undefined) {
      updateFields.push(`cancellation_policy = $${valueIndex++}`);
      values.push(validatedData.cancellation_policy);
    }
    if (validatedData.is_active !== undefined) {
      updateFields.push(`is_active = $${valueIndex++}`);
      values.push(validatedData.is_active);
    }

    updateFields.push(`updated_at = $${valueIndex++}`);
    values.push(new Date().toISOString());
    values.push(property_id);

    const result = await client.query(
      `UPDATE properties SET ${updateFields.join(', ')} WHERE property_id = $${valueIndex} RETURNING *`,
      values
    );
    
    client.release();

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Property update error:', error);
    res.status(400).json(createErrorResponse('Property update failed', error, 'PROPERTY_UPDATE_ERROR'));
  }
});

// Delete property
app.delete('/api/properties/:property_id', authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.params;
    
    const client = await pool.connect();
    
    // Verify ownership
    const ownerCheck = await client.query(
      'SELECT host_id FROM properties WHERE property_id = $1',
      [property_id]
    );
    
    if (ownerCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Property not found', null, 'PROPERTY_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].host_id !== req.user.user_id) {
      client.release();
      return res.status(403).json(createErrorResponse('Not authorized to delete this property', null, 'NOT_PROPERTY_OWNER'));
    }

    // Delete property (cascade will handle related records)
    await client.query('DELETE FROM properties WHERE property_id = $1', [property_id]);
    client.release();

    res.status(204).send();
  } catch (error) {
    console.error('Property deletion error:', error);
    res.status(500).json(createErrorResponse('Property deletion failed', error, 'PROPERTY_DELETE_ERROR'));
  }
});

/*
PROPERTY IMAGE MANAGEMENT ENDPOINTS
Handle property image uploads, reordering, and deletion
*/

// Upload property images
app.post('/api/properties/:property_id/images', authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.params;
    const { image_urls, is_primary = false } = req.body;

    if (!image_urls || !Array.isArray(image_urls) || image_urls.length === 0) {
      return res.status(400).json(createErrorResponse('image_urls array is required', null, 'MISSING_IMAGE_URLS'));
    }

    const client = await pool.connect();
    
    // Verify property ownership
    const ownerCheck = await client.query(
      'SELECT host_id FROM properties WHERE property_id = $1',
      [property_id]
    );
    
    if (ownerCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Property not found', null, 'PROPERTY_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].host_id !== req.user.user_id) {
      client.release();
      return res.status(403).json(createErrorResponse('Not authorized to add images to this property', null, 'NOT_PROPERTY_OWNER'));
    }

    // Get current max display order
    const maxOrderResult = await client.query(
      'SELECT COALESCE(MAX(display_order), -1) as max_order FROM property_images WHERE property_id = $1',
      [property_id]
    );
    let currentMaxOrder = maxOrderResult.rows[0].max_order;

    const insertedImages = [];
    
    for (const imageUrl of image_urls) {
      currentMaxOrder++;
      const imageId = `img_${uuidv4()}`;
      
      const result = await client.query(
        `INSERT INTO property_images (
          image_id, property_id, image_url, is_primary, display_order, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [
          imageId,
          property_id,
          imageUrl,
          is_primary && insertedImages.length === 0, // Only first image can be primary
          currentMaxOrder,
          new Date().toISOString()
        ]
      );
      
      insertedImages.push(result.rows[0]);
    }
    
    client.release();

    res.status(201).json(insertedImages);
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(400).json(createErrorResponse('Image upload failed', error, 'IMAGE_UPLOAD_ERROR'));
  }
});

// Get property images
app.get('/api/properties/:property_id/images', async (req, res) => {
  try {
    const { property_id } = req.params;
    
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM property_images WHERE property_id = $1 ORDER BY display_order ASC',
      [property_id]
    );
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch images', error, 'IMAGE_FETCH_ERROR'));
  }
});

// Reorder property images
app.patch('/api/properties/:property_id/images', authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.params;
    const { image_order_pairs } = req.body;

    if (!image_order_pairs || !Array.isArray(image_order_pairs)) {
      return res.status(400).json(createErrorResponse('image_order_pairs array is required', null, 'MISSING_ORDER_PAIRS'));
    }

    const client = await pool.connect();
    
    // Verify property ownership
    const ownerCheck = await client.query(
      'SELECT host_id FROM properties WHERE property_id = $1',
      [property_id]
    );
    
    if (ownerCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Property not found', null, 'PROPERTY_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].host_id !== req.user.user_id) {
      client.release();
      return res.status(403).json(createErrorResponse('Not authorized to reorder images for this property', null, 'NOT_PROPERTY_OWNER'));
    }

    // Update display orders
    for (const { image_id, display_order } of image_order_pairs) {
      await client.query(
        'UPDATE property_images SET display_order = $1 WHERE image_id = $2 AND property_id = $3',
        [display_order, image_id, property_id]
      );
    }
    
    client.release();

    res.json({ message: 'Images reordered successfully' });
  } catch (error) {
    console.error('Image reorder error:', error);
    res.status(400).json(createErrorResponse('Image reorder failed', error, 'IMAGE_REORDER_ERROR'));
  }
});

// Delete property images
app.delete('/api/properties/:property_id/images', authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.params;
    const { image_ids } = req.body;

    if (!image_ids || !Array.isArray(image_ids)) {
      return res.status(400).json(createErrorResponse('image_ids array is required', null, 'MISSING_IMAGE_IDS'));
    }

    const client = await pool.connect();
    
    // Verify property ownership
    const ownerCheck = await client.query(
      'SELECT host_id FROM properties WHERE property_id = $1',
      [property_id]
    );
    
    if (ownerCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Property not found', null, 'PROPERTY_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].host_id !== req.user.user_id) {
      client.release();
      return res.status(403).json(createErrorResponse('Not authorized to delete images from this property', null, 'NOT_PROPERTY_OWNER'));
    }

    // Delete images
    for (const imageId of image_ids) {
      await client.query(
        'DELETE FROM property_images WHERE image_id = $1 AND property_id = $2',
        [imageId, property_id]
      );
    }
    
    client.release();

    res.status(204).send();
  } catch (error) {
    console.error('Image deletion error:', error);
    res.status(500).json(createErrorResponse('Image deletion failed', error, 'IMAGE_DELETE_ERROR'));
  }
});

/*
PROPERTY AVAILABILITY ENDPOINTS
Handle property availability calendar management
*/

// Get property availability dates
app.get('/api/properties/:property_id/availability', async (req, res) => {
  try {
    const { property_id } = req.params;
    const { start_date, end_date } = req.query;
    
    const client = await pool.connect();
    
    let query = 'SELECT * FROM availability_dates WHERE property_id = $1';
    const params = [property_id];

    if (start_date) {
      query += ' AND date >= $2';
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(end_date);
    }

    query += ' ORDER BY date ASC';

    const result = await client.query(query, params);
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch availability', error, 'AVAILABILITY_FETCH_ERROR'));
  }
});

// Set property availability dates
app.post('/api/properties/:property_id/availability', authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.params;
    const { dates } = req.body;

    if (!dates || !Array.isArray(dates)) {
      return res.status(400).json(createErrorResponse('dates array is required', null, 'MISSING_DATES'));
    }

    const client = await pool.connect();
    
    // Verify property ownership
    const ownerCheck = await client.query(
      'SELECT host_id FROM properties WHERE property_id = $1',
      [property_id]
    );
    
    if (ownerCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Property not found', null, 'PROPERTY_NOT_FOUND'));
    }
    
    if (ownerCheck.rows[0].host_id !== req.user.user_id) {
      client.release();
      return res.status(403).json(createErrorResponse('Not authorized to set availability for this property', null, 'NOT_PROPERTY_OWNER'));
    }

    const insertedDates = [];

    for (const { date, is_available } of dates) {
      const availabilityId = `avail_${uuidv4()}`;
      
      // Use UPSERT to handle existing dates
      const result = await client.query(
        `INSERT INTO availability_dates (availability_id, property_id, date, is_available, created_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (property_id, date) 
         DO UPDATE SET is_available = EXCLUDED.is_available
         RETURNING *`,
        [
          availabilityId,
          property_id,
          date,
          is_available,
          new Date().toISOString()
        ]
      );
      
      insertedDates.push(result.rows[0]);
    }
    
    client.release();

    res.status(201).json(insertedDates);
  } catch (error) {
    console.error('Set availability error:', error);
    res.status(400).json(createErrorResponse('Set availability failed', error, 'AVAILABILITY_SET_ERROR'));
  }
});

/*
BOOKING MANAGEMENT ENDPOINTS
Handle booking creation, updates, and search functionality
*/

// Create new booking
app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { property_id, check_in_date, check_out_date, guests_count, total_amount } = req.body;

    if (!property_id || !check_in_date || !check_out_date || !guests_count || !total_amount) {
      return res.status(400).json(createErrorResponse('All booking fields are required', null, 'MISSING_BOOKING_FIELDS'));
    }

    const client = await pool.connect();
    
    // Get property details
    const propertyResult = await client.query(
      'SELECT * FROM properties WHERE property_id = $1 AND is_active = true',
      [property_id]
    );
    
    if (propertyResult.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Property not found or inactive', null, 'PROPERTY_NOT_FOUND'));
    }

    const property = propertyResult.rows[0];

    // Check availability for requested dates
    const availabilityCheck = await client.query(
      `SELECT COUNT(*) as unavailable_days 
       FROM availability_dates 
       WHERE property_id = $1 
       AND date BETWEEN $2 AND $3 
       AND is_available = false`,
      [property_id, check_in_date, check_out_date]
    );

    if (parseInt(availabilityCheck.rows[0].unavailable_days) > 0) {
      client.release();
      return res.status(400).json(createErrorResponse('Property not available for selected dates', null, 'DATES_UNAVAILABLE'));
    }

    const bookingId = `book_${uuidv4()}`;
    const bookingStatus = property.is_instant_book ? 'confirmed' : 'pending';

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (
        booking_id, property_id, guest_id, check_in_date, check_out_date,
        guests_count, total_amount, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        bookingId,
        property_id,
        req.user.user_id,
        check_in_date,
        check_out_date,
        guests_count,
        total_amount,
        bookingStatus,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    const booking = bookingResult.rows[0];

    // Create message thread if booking requires approval
    let messageThread = null;
    if (!property.is_instant_book) {
      const threadId = `thr_${uuidv4()}`;
      const threadResult = await client.query(
        `INSERT INTO message_threads (
          thread_id, property_id, guest_id, host_id, created_at
        ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          threadId,
          property_id,
          req.user.user_id,
          property.host_id,
          new Date().toISOString()
        ]
      );
      messageThread = threadResult.rows[0];
    }

    // Block availability dates for confirmed bookings
    if (bookingStatus === 'confirmed') {
      // This would typically be done with a more sophisticated date range function
      // For now, we'll mark the dates as unavailable
      await client.query(
        `INSERT INTO availability_dates (availability_id, property_id, date, is_available, created_at)
         SELECT 
           'avail_' || generate_random_uuid(),
           $1,
           date_trunc('day', dd)::date,
           false,
           NOW()
         FROM generate_series($2::date, $3::date, '1 day'::interval) dd
         ON CONFLICT (property_id, date) 
         DO UPDATE SET is_available = false`,
        [property_id, check_in_date, check_out_date]
      );
    }
    
    client.release();

    res.status(201).json({
      booking,
      message_thread: messageThread
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(400).json(createErrorResponse('Booking creation failed', error, 'BOOKING_CREATE_ERROR'));
  }
});

// Search bookings
app.get('/api/bookings/search', authenticateToken, async (req, res) => {
  try {
    const {
      property_id,
      guest_id,
      host_id,
      status,
      start_date,
      end_date,
      limit = 10,
      offset = 0
    } = req.query;

    const client = await pool.connect();
    
    let query = `
      SELECT b.*, p.title as property_title, p.address as property_address,
             u_guest.username as guest_username, u_host.username as host_username
      FROM bookings b
      JOIN properties p ON b.property_id = p.property_id
      JOIN users u_guest ON b.guest_id = u_guest.user_id
      JOIN users u_host ON p.host_id = u_host.user_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    // Filter by user access rights - guests see their bookings, hosts see bookings for their properties
    if (!guest_id && !host_id) {
      query += ` AND (b.guest_id = $${paramIndex} OR p.host_id = $${paramIndex})`;
      params.push(req.user.user_id);
      paramIndex++;
    }

    if (property_id) {
      query += ` AND b.property_id = $${paramIndex}`;
      params.push(property_id);
      paramIndex++;
    }

    if (guest_id) {
      query += ` AND b.guest_id = $${paramIndex}`;
      params.push(guest_id);
      paramIndex++;
    }

    if (host_id) {
      query += ` AND p.host_id = $${paramIndex}`;
      params.push(host_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND b.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND b.check_in_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND b.check_out_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await client.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN properties p ON b.property_id = p.property_id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (!guest_id && !host_id) {
      countQuery += ` AND (b.guest_id = $${countParamIndex} OR p.host_id = $${countParamIndex})`;
      countParams.push(req.user.user_id);
      countParamIndex++;
    }

    if (property_id) {
      countQuery += ` AND b.property_id = $${countParamIndex}`;
      countParams.push(property_id);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND b.status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    const countResult = await client.query(countQuery, countParams);
    client.release();

    res.json({
      bookings: result.rows,
      total: parseInt(countResult.rows[0].total),
      offset: parseInt(offset),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Booking search error:', error);
    res.status(500).json(createErrorResponse('Booking search failed', error, 'BOOKING_SEARCH_ERROR'));
  }
});

// Get booking details
app.get('/api/bookings/:booking_id', authenticateToken, async (req, res) => {
  try {
    const { booking_id } = req.params;
    
    const client = await pool.connect();
    const result = await client.query(`
      SELECT b.*, p.title as property_title, p.address as property_address,
             u_guest.username as guest_username, u_host.username as host_username
      FROM bookings b
      JOIN properties p ON b.property_id = p.property_id
      JOIN users u_guest ON b.guest_id = u_guest.user_id
      JOIN users u_host ON p.host_id = u_host.user_id
      WHERE b.booking_id = $1
      AND (b.guest_id = $2 OR p.host_id = $2)
    `, [booking_id, req.user.user_id]);
    
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Booking not found', null, 'BOOKING_NOT_FOUND'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch booking', error, 'BOOKING_FETCH_ERROR'));
  }
});

// Update booking
app.patch('/api/bookings/:booking_id', authenticateToken, async (req, res) => {
  try {
    const { booking_id } = req.params;
    
    const client = await pool.connect();
    
    // Check if user has permission to update booking
    const bookingCheck = await client.query(`
      SELECT b.*, p.host_id
      FROM bookings b
      JOIN properties p ON b.property_id = p.property_id
      WHERE b.booking_id = $1
      AND (b.guest_id = $2 OR p.host_id = $2)
    `, [booking_id, req.user.user_id]);
    
    if (bookingCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Booking not found or access denied', null, 'BOOKING_NOT_FOUND'));
    }

    const validatedData = updateBookingInputSchema.parse({
      booking_id,
      ...req.body
    });

    // Build dynamic update query
    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    if (validatedData.check_in_date) {
      updateFields.push(`check_in_date = $${valueIndex++}`);
      values.push(validatedData.check_in_date);
    }
    if (validatedData.check_out_date) {
      updateFields.push(`check_out_date = $${valueIndex++}`);
      values.push(validatedData.check_out_date);
    }
    if (validatedData.guests_count) {
      updateFields.push(`guests_count = $${valueIndex++}`);
      values.push(validatedData.guests_count);
    }
    if (validatedData.total_amount) {
      updateFields.push(`total_amount = $${valueIndex++}`);
      values.push(validatedData.total_amount);
    }
    if (validatedData.status) {
      updateFields.push(`status = $${valueIndex++}`);
      values.push(validatedData.status);
    }
    if (validatedData.cancellation_reason !== undefined) {
      updateFields.push(`cancellation_reason = $${valueIndex++}`);
      values.push(validatedData.cancellation_reason);
    }

    updateFields.push(`updated_at = $${valueIndex++}`);
    values.push(new Date().toISOString());
    values.push(booking_id);

    const result = await client.query(
      `UPDATE bookings SET ${updateFields.join(', ')} WHERE booking_id = $${valueIndex} RETURNING *`,
      values
    );
    
    client.release();

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Booking update error:', error);
    res.status(400).json(createErrorResponse('Booking update failed', error, 'BOOKING_UPDATE_ERROR'));
  }
});

// Cancel booking
app.post('/api/bookings/:booking_id/cancel', authenticateToken, async (req, res) => {
  try {
    const { booking_id } = req.params;
    const { reason } = req.body;
    
    const client = await pool.connect();
    
    // Check if user has permission to cancel booking
    const bookingCheck = await client.query(`
      SELECT b.*, p.host_id
      FROM bookings b
      JOIN properties p ON b.property_id = p.property_id
      WHERE b.booking_id = $1
      AND (b.guest_id = $2 OR p.host_id = $2)
    `, [booking_id, req.user.user_id]);
    
    if (bookingCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Booking not found or access denied', null, 'BOOKING_NOT_FOUND'));
    }

    const booking = bookingCheck.rows[0];

    if (booking.status === 'cancelled') {
      client.release();
      return res.status(409).json(createErrorResponse('Booking is already cancelled', null, 'BOOKING_ALREADY_CANCELLED'));
    }

    // Update booking status to cancelled
    const result = await client.query(
      `UPDATE bookings 
       SET status = 'cancelled', cancellation_reason = $1, updated_at = $2 
       WHERE booking_id = $3 RETURNING *`,
      [reason || 'No reason provided', new Date().toISOString(), booking_id]
    );

    // Free up availability dates
    await client.query(
      `UPDATE availability_dates 
       SET is_available = true 
       WHERE property_id = $1 
       AND date BETWEEN $2 AND $3`,
      [booking.property_id, booking.check_in_date, booking.check_out_date]
    );
    
    client.release();

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json(createErrorResponse('Booking cancellation failed', error, 'BOOKING_CANCEL_ERROR'));
  }
});

/*
REVIEW SYSTEM ENDPOINTS
Handle review creation, search, and moderation
*/

// Submit new review
app.post('/api/reviews', authenticateToken, async (req, res) => {
  try {
    const validatedData = createReviewInputSchema.parse({
      review_id: `rev_${uuidv4()}`,
      reviewer_id: req.user.user_id,
      ...req.body
    });

    const client = await pool.connect();
    
    // Verify booking exists and belongs to user
    const bookingCheck = await client.query(
      `SELECT b.* FROM bookings b 
       WHERE b.booking_id = $1 
       AND b.guest_id = $2 
       AND b.status = 'confirmed'`,
      [validatedData.booking_id, req.user.user_id]
    );
    
    if (bookingCheck.rows.length === 0) {
      client.release();
      return res.status(400).json(createErrorResponse('Booking not found or not eligible for review', null, 'BOOKING_NOT_ELIGIBLE'));
    }

    // Check if review already exists
    const existingReview = await client.query(
      'SELECT review_id FROM reviews WHERE booking_id = $1',
      [validatedData.booking_id]
    );
    
    if (existingReview.rows.length > 0) {
      client.release();
      return res.status(409).json(createErrorResponse('Review already exists for this booking', null, 'REVIEW_ALREADY_EXISTS'));
    }

    const result = await client.query(
      `INSERT INTO reviews (
        review_id, property_id, booking_id, reviewer_id, rating, comment,
        is_anonymous, is_flagged, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        validatedData.review_id,
        validatedData.property_id,
        validatedData.booking_id,
        validatedData.reviewer_id,
        validatedData.rating,
        validatedData.comment,
        validatedData.is_anonymous || false,
        validatedData.is_flagged || false,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
    
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Review submission error:', error);
    res.status(400).json(createErrorResponse('Review submission failed', error, 'REVIEW_CREATE_ERROR'));
  }
});

// Search reviews
app.get('/api/reviews/search', async (req, res) => {
  try {
    const {
      property_id,
      limit = 10,
      offset = 0,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    if (!property_id) {
      return res.status(400).json(createErrorResponse('property_id is required', null, 'MISSING_PROPERTY_ID'));
    }

    const client = await pool.connect();
    
    const validSortFields = ['review_id', 'rating', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

    const result = await client.query(`
      SELECT r.*, 
             CASE WHEN r.is_anonymous THEN NULL ELSE u.username END as reviewer_username,
             CASE WHEN r.is_anonymous THEN NULL ELSE u.profile_image_url END as reviewer_image
      FROM reviews r
      LEFT JOIN users u ON r.reviewer_id = u.user_id
      WHERE r.property_id = $1 AND r.is_flagged = false
      ORDER BY ${sortField} ${sortDirection}
      LIMIT $2 OFFSET $3
    `, [property_id, parseInt(limit), parseInt(offset)]);
    
    client.release();

    res.json({
      reviews: result.rows
    });
  } catch (error) {
    console.error('Review search error:', error);
    res.status(500).json(createErrorResponse('Review search failed', error, 'REVIEW_SEARCH_ERROR'));
  }
});

// Flag review as abusive
app.post('/api/reviews/:review_id/flag', authenticateToken, async (req, res) => {
  try {
    const { review_id } = req.params;
    const { reason } = req.body;
    
    const client = await pool.connect();
    
    const result = await client.query(
      `UPDATE reviews 
       SET is_flagged = true, updated_at = $1 
       WHERE review_id = $2 RETURNING *`,
      [new Date().toISOString(), review_id]
    );
    
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json(createErrorResponse('Review not found', null, 'REVIEW_NOT_FOUND'));
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Review flag error:', error);
    res.status(500).json(createErrorResponse('Review flagging failed', error, 'REVIEW_FLAG_ERROR'));
  }
});

/*
MESSAGING SYSTEM ENDPOINTS
Handle message threads and communication between guests and hosts
*/

// Get user's active message threads
app.get('/api/messages/threads', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const client = await pool.connect();
    const result = await client.query(`
      SELECT mt.*,
             p.title as property_title,
             CASE WHEN mt.guest_id = $1 THEN u_host.username ELSE u_guest.username END as other_user_name,
             CASE WHEN mt.guest_id = $1 THEN u_host.profile_image_url ELSE u_guest.profile_image_url END as other_user_image
      FROM message_threads mt
      LEFT JOIN properties p ON mt.property_id = p.property_id
      LEFT JOIN users u_guest ON mt.guest_id = u_guest.user_id
      LEFT JOIN users u_host ON mt.host_id = u_host.user_id
      WHERE mt.guest_id = $1 OR mt.host_id = $1
      ORDER BY COALESCE(mt.last_message_at, mt.created_at) DESC
      LIMIT $2 OFFSET $3
    `, [req.user.user_id, parseInt(limit), parseInt(offset)]);
    
    client.release();

    res.json({
      threads: result.rows
    });
  } catch (error) {
    console.error('Get threads error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch message threads', error, 'THREADS_FETCH_ERROR'));
  }
});

// Create new message thread
app.post('/api/messages/threads', authenticateToken, async (req, res) => {
  try {
    const validatedData = createMessageThreadInputSchema.parse({
      thread_id: `thr_${uuidv4()}`,
      ...req.body
    });

    // Ensure user is either guest or host in the thread
    if (validatedData.guest_id !== req.user.user_id && validatedData.host_id !== req.user.user_id) {
      return res.status(403).json(createErrorResponse('User must be participant in thread', null, 'NOT_THREAD_PARTICIPANT'));
    }

    const client = await pool.connect();
    
    // Check if thread already exists for this property and participants
    const existingThread = await client.query(
      `SELECT thread_id FROM message_threads 
       WHERE property_id = $1 AND guest_id = $2 AND host_id = $3`,
      [validatedData.property_id, validatedData.guest_id, validatedData.host_id]
    );
    
    if (existingThread.rows.length > 0) {
      client.release();
      return res.status(409).json(createErrorResponse('Thread already exists', null, 'THREAD_ALREADY_EXISTS'));
    }

    const result = await client.query(
      `INSERT INTO message_threads (
        thread_id, property_id, guest_id, host_id, created_at
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        validatedData.thread_id,
        validatedData.property_id,
        validatedData.guest_id,
        validatedData.host_id,
        new Date().toISOString()
      ]
    );
    
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create thread error:', error);
    res.status(400).json(createErrorResponse('Thread creation failed', error, 'THREAD_CREATE_ERROR'));
  }
});

// Get messages from a thread
app.get('/api/messages/threads/:thread_id', authenticateToken, async (req, res) => {
  try {
    const { thread_id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const client = await pool.connect();
    
    // Verify user is participant in thread
    const threadCheck = await client.query(
      'SELECT * FROM message_threads WHERE thread_id = $1 AND (guest_id = $2 OR host_id = $2)',
      [thread_id, req.user.user_id]
    );
    
    if (threadCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Thread not found or access denied', null, 'THREAD_NOT_FOUND'));
    }

    const result = await client.query(`
      SELECT m.*,
             u.username as sender_username,
             u.profile_image_url as sender_image
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.thread_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [thread_id, parseInt(limit), parseInt(offset)]);
    
    client.release();

    res.json({
      messages: result.rows
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch messages', error, 'MESSAGES_FETCH_ERROR'));
  }
});

// Mark thread messages as read
app.patch('/api/messages/threads/:thread_id', authenticateToken, async (req, res) => {
  try {
    const { thread_id } = req.params;
    
    const client = await pool.connect();
    
    // Verify user is participant in thread
    const threadCheck = await client.query(
      'SELECT * FROM message_threads WHERE thread_id = $1 AND (guest_id = $2 OR host_id = $2)',
      [thread_id, req.user.user_id]
    );
    
    if (threadCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Thread not found or access denied', null, 'THREAD_NOT_FOUND'));
    }

    // Mark messages as read for the current user
    await client.query(
      'UPDATE messages SET is_read = true WHERE thread_id = $1 AND recipient_id = $2',
      [thread_id, req.user.user_id]
    );
    
    client.release();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json(createErrorResponse('Failed to mark messages as read', error, 'MARK_READ_ERROR'));
  }
});

// Send message in thread
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { thread_id, content } = req.body;

    if (!thread_id || !content) {
      return res.status(400).json(createErrorResponse('thread_id and content are required', null, 'MISSING_MESSAGE_FIELDS'));
    }

    const client = await pool.connect();
    
    // Verify user is participant in thread and get recipient
    const threadCheck = await client.query(
      'SELECT * FROM message_threads WHERE thread_id = $1 AND (guest_id = $2 OR host_id = $2)',
      [thread_id, req.user.user_id]
    );
    
    if (threadCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Thread not found or access denied', null, 'THREAD_NOT_FOUND'));
    }

    const thread = threadCheck.rows[0];
    const recipientId = thread.guest_id === req.user.user_id ? thread.host_id : thread.guest_id;

    const messageId = `msg_${uuidv4()}`;
    const now = new Date().toISOString();

    // Insert message
    const result = await client.query(
      `INSERT INTO messages (
        message_id, thread_id, sender_id, recipient_id, content, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [messageId, thread_id, req.user.user_id, recipientId, content, false, now]
    );

    // Update thread last message time
    await client.query(
      'UPDATE message_threads SET last_message_at = $1 WHERE thread_id = $2',
      [now, thread_id]
    );
    
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(400).json(createErrorResponse('Failed to send message', error, 'MESSAGE_SEND_ERROR'));
  }
});

/*
WISHLIST ENDPOINTS
Handle user favorites/wishlist functionality
*/

// Get user's wishlist
app.get('/api/user/wishlist', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const client = await pool.connect();
    const result = await client.query(`
      SELECT w.*, p.title, p.daily_price, p.address,
             COALESCE(AVG(r.rating), 0) as average_rating,
             pi.image_url as primary_image
      FROM wishlists w
      JOIN properties p ON w.property_id = p.property_id
      LEFT JOIN reviews r ON p.property_id = r.property_id
      LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = true
      WHERE w.user_id = $1
      GROUP BY w.wishlist_id, p.property_id, pi.image_url
      ORDER BY w.added_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.user_id, parseInt(limit), parseInt(offset)]);
    
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch wishlist', error, 'WISHLIST_FETCH_ERROR'));
  }
});

// Add to wishlist
app.post('/api/user/wishlist', authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.body;

    if (!property_id) {
      return res.status(400).json(createErrorResponse('property_id is required', null, 'MISSING_PROPERTY_ID'));
    }

    const client = await pool.connect();
    
    // Check if property exists
    const propertyCheck = await client.query(
      'SELECT property_id FROM properties WHERE property_id = $1',
      [property_id]
    );
    
    if (propertyCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Property not found', null, 'PROPERTY_NOT_FOUND'));
    }

    // Check if already in wishlist
    const existingWishlist = await client.query(
      'SELECT wishlist_id FROM wishlists WHERE user_id = $1 AND property_id = $2',
      [req.user.user_id, property_id]
    );
    
    if (existingWishlist.rows.length > 0) {
      client.release();
      return res.status(409).json(createErrorResponse('Property already in wishlist', null, 'ALREADY_IN_WISHLIST'));
    }

    const wishlistId = `wish_${uuidv4()}`;
    const result = await client.query(
      `INSERT INTO wishlists (wishlist_id, user_id, property_id, added_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [wishlistId, req.user.user_id, property_id, new Date().toISOString()]
    );
    
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(400).json(createErrorResponse('Failed to add to wishlist', error, 'WISHLIST_ADD_ERROR'));
  }
});

// Remove from wishlist
app.delete('/api/user/wishlist', authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.query;

    if (!property_id) {
      return res.status(400).json(createErrorResponse('property_id is required', null, 'MISSING_PROPERTY_ID'));
    }

    const client = await pool.connect();
    const result = await client.query(
      'DELETE FROM wishlists WHERE user_id = $1 AND property_id = $2',
      [req.user.user_id, property_id]
    );
    
    client.release();

    if (result.rowCount === 0) {
      return res.status(404).json(createErrorResponse('Property not found in wishlist', null, 'NOT_IN_WISHLIST'));
    }

    res.status(204).send();
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json(createErrorResponse('Failed to remove from wishlist', error, 'WISHLIST_REMOVE_ERROR'));
  }
});

/*
COMPARE LIST ENDPOINTS
Handle property comparison functionality
*/

// Get user's compare list
app.get('/api/compare_lists', authenticateToken, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const client = await pool.connect();
    const result = await client.query(`
      SELECT c.*, p.title, p.daily_price, p.address, p.property_type,
             p.amenities, p.is_instant_book,
             COALESCE(AVG(r.rating), 0) as average_rating,
             pi.image_url as primary_image
      FROM compare_lists c
      JOIN properties p ON c.property_id = p.property_id
      LEFT JOIN reviews r ON p.property_id = r.property_id
      LEFT JOIN property_images pi ON p.property_id = pi.property_id AND pi.is_primary = true
      WHERE c.user_id = $1
      GROUP BY c.compare_list_id, p.property_id, pi.image_url
      ORDER BY c.added_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.user_id, parseInt(limit), parseInt(offset)]);
    
    client.release();

    res.json(result.rows);
  } catch (error) {
    console.error('Get compare list error:', error);
    res.status(500).json(createErrorResponse('Failed to fetch compare list', error, 'COMPARE_LIST_FETCH_ERROR'));
  }
});

// Add to compare list
app.post('/api/compare_lists', authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.body;

    if (!property_id) {
      return res.status(400).json(createErrorResponse('property_id is required', null, 'MISSING_PROPERTY_ID'));
    }

    const client = await pool.connect();
    
    // Check if property exists
    const propertyCheck = await client.query(
      'SELECT property_id FROM properties WHERE property_id = $1',
      [property_id]
    );
    
    if (propertyCheck.rows.length === 0) {
      client.release();
      return res.status(404).json(createErrorResponse('Property not found', null, 'PROPERTY_NOT_FOUND'));
    }

    // Check if already in compare list
    const existingCompare = await client.query(
      'SELECT compare_list_id FROM compare_lists WHERE user_id = $1 AND property_id = $2',
      [req.user.user_id, property_id]
    );
    
    if (existingCompare.rows.length > 0) {
      client.release();
      return res.status(409).json(createErrorResponse('Property already in compare list', null, 'ALREADY_IN_COMPARE_LIST'));
    }

    // Check compare list limit (max 5 properties)
    const countResult = await client.query(
      'SELECT COUNT(*) as count FROM compare_lists WHERE user_id = $1',
      [req.user.user_id]
    );
    
    if (parseInt(countResult.rows[0].count) >= 5) {
      client.release();
      return res.status(400).json(createErrorResponse('Compare list is full (maximum 5 properties)', null, 'COMPARE_LIST_FULL'));
    }

    const compareListId = `comp_${uuidv4()}`;
    const result = await client.query(
      `INSERT INTO compare_lists (compare_list_id, user_id, property_id, added_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [compareListId, req.user.user_id, property_id, new Date().toISOString()]
    );
    
    client.release();

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add to compare list error:', error);
    res.status(400).json(createErrorResponse('Failed to add to compare list', error, 'COMPARE_LIST_ADD_ERROR'));
  }
});

// Remove from compare list
app.delete('/api/compare_lists', authenticateToken, async (req, res) => {
  try {
    const { property_id } = req.query;

    if (!property_id) {
      return res.status(400).json(createErrorResponse('property_id is required', null, 'MISSING_PROPERTY_ID'));
    }

    const client = await pool.connect();
    const result = await client.query(
      'DELETE FROM compare_lists WHERE user_id = $1 AND property_id = $2',
      [req.user.user_id, property_id]
    );
    
    client.release();

    if (result.rowCount === 0) {
      return res.status(404).json(createErrorResponse('Property not found in compare list', null, 'NOT_IN_COMPARE_LIST'));
    }

    res.status(204).send();
  } catch (error) {
    console.error('Remove from compare list error:', error);
    res.status(500).json(createErrorResponse('Failed to remove from compare list', error, 'COMPARE_LIST_REMOVE_ERROR'));
  }
});

/*
HEALTH CHECK AND UTILITY ENDPOINTS
*/

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'TripoStay API'
  });
});

// Catch-all route for SPA routing (MUST be last route)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for potential testing
export { app, pool };

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`TripoStay server running on port ${PORT} and listening on 0.0.0.0`);
  console.log(`Health check available at: http://localhost:${PORT}/api/health`);
});