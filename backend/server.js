// Load environment variables FIRST - critical for Render deployment
// In production (Render), env vars are set in dashboard, not .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const rsvpRoutes = require('./routes/rsvp');

// Log startup info
console.log('========================================');
console.log('🚀 Starting Event Platform Backend...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔧 Port: ${process.env.PORT || 5000}`);
console.log('========================================');

const app = express();

// Connect to MongoDB
connectDB();

// ======================
// MIDDLEWARE
// ======================

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://mern-assignment-plum.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean); // Remove undefined/null values

console.log('🔧 Allowed CORS origins:', allowedOrigins);

// CORS Configuration - Production-ready with multiple origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // Cache preflight for 24 hours
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Parse JSON request bodies
app.use(express.json());

// ======================
// ROUTES
// ======================

// Health check endpoint (useful for deployment)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/rsvp', rsvpRoutes);

// ======================
// ERROR HANDLING
// ======================

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation Error', 
      errors: Object.values(err.errors).map(e => e.message) 
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate field value' });
  }
  
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ======================
// START SERVER
// ======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
