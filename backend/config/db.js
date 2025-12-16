const mongoose = require('mongoose');

/**
 * MongoDB Connection Handler
 * - Supports both MONGO_URI and MONGODB_URI environment variables
 * - Uses connection pooling by default (mongoose handles this)
 * - Handles connection errors gracefully
 * - Production-ready with proper logging
 */
const connectDB = async () => {
  // Support both MONGO_URI (Render convention) and MONGODB_URI
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  // Log environment info for debugging (without exposing credentials)
  console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔧 MONGO_URI defined:', !!process.env.MONGO_URI);
  console.log('🔧 MONGODB_URI defined:', !!process.env.MONGODB_URI);

  // Validate MongoDB URI exists
  if (!mongoUri) {
    console.error('❌ FATAL: MongoDB connection string is not defined!');
    console.error('   Please set MONGO_URI or MONGODB_URI environment variable.');
    console.error('   On Render: Add MONGO_URI in Environment tab');
    console.error('   Locally: Add to .env file');
    process.exit(1);
  }

  try {
    console.log('🔄 Connecting to MongoDB...');
    
    const conn = await mongoose.connect(mongoUri, {
      // Production-ready connection options
      maxPoolSize: 10,           // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Timeout after 10s if can't connect
      socketTimeoutMS: 45000,    // Close sockets after 45s of inactivity
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Ready State: ${conn.connection.readyState === 1 ? 'Connected' : 'Not Connected'}`);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:');
    console.error(`   Message: ${error.message}`);
    
    // Provide helpful error hints
    if (error.message.includes('ENOTFOUND')) {
      console.error('   Hint: Check if MongoDB Atlas cluster hostname is correct');
    } else if (error.message.includes('authentication failed')) {
      console.error('   Hint: Check your database username and password');
    } else if (error.message.includes('network')) {
      console.error('   Hint: Check if your IP is whitelisted in MongoDB Atlas');
      console.error('   Go to Atlas > Network Access > Add 0.0.0.0/0 for Render');
    }
    
    // Exit process with failure
    process.exit(1);
  }
};

// Handle connection events for better debugging
mongoose.connection.on('connected', () => {
  console.log('📗 Mongoose connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Mongoose connection error: ${err.message}`);
});

// Handle process termination gracefully
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔴 MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
