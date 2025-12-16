const mongoose = require('mongoose');

/**
 * MongoDB Connection Handler
 * - Uses connection pooling by default (mongoose handles this)
 * - Handles connection errors gracefully
 * - Logs connection status for debugging
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // These options ensure stable connections in production
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure
    process.exit(1);
  }
};

// Handle connection events for better debugging
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB error: ${err}`);
});

module.exports = connectDB;
