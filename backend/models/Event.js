const mongoose = require('mongoose');

/**
 * Event Schema
 * - Stores event details including capacity tracking
 * - attendeeCount is maintained atomically to prevent race conditions
 * 
 * IMPORTANT: attendeeCount should ONLY be modified using atomic operations
 * (findOneAndUpdate with $inc) to prevent race conditions
 */
const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(value) {
        // Allow dates in the past for existing events, but new events should be future
        return true; // Validation is done in controller for more flexibility
      }
    }
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  capacity: {
    type: Number,
    required: [true, 'Event capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [100000, 'Capacity cannot exceed 100,000']
  },
  /**
   * CRITICAL: Attendee count for concurrency control
   * 
   * This field tracks how many users have RSVPed to the event.
   * It MUST be updated atomically using MongoDB's $inc operator
   * to prevent race conditions when multiple users RSVP simultaneously.
   * 
   * DO NOT: Read this value, add 1, then save - this causes race conditions
   * DO: Use findOneAndUpdate with $inc and conditions in a single atomic operation
   */
  attendeeCount: {
    type: Number,
    default: 0,
    min: [0, 'Attendee count cannot be negative']
  },
  imageUrl: {
    type: String,
    default: null,
    trim: true
  },
  // Reference to the user who created this event
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
eventSchema.index({ date: 1 }); // For fetching upcoming events
eventSchema.index({ creator: 1 }); // For fetching user's events

/**
 * Virtual to check if event is full
 * Note: For critical operations, use atomic checks instead
 */
eventSchema.virtual('isFull').get(function() {
  return this.attendeeCount >= this.capacity;
});

/**
 * Virtual to get available spots
 */
eventSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.capacity - this.attendeeCount);
});

// Include virtuals in JSON output
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
