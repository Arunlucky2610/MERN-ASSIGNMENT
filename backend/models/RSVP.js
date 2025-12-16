const mongoose = require('mongoose');

/**
 * RSVP Schema
 * - Tracks which users have RSVPed to which events
 * - Uses compound unique index to prevent duplicate RSVPs
 * 
 * The compound index on (event, user) ensures:
 * 1. A user can only RSVP once per event (enforced at database level)
 * 2. Efficient queries for checking existing RSVPs
 * 3. Fast lookups for user's RSVPs or event's attendees
 */
const rsvpSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  /**
   * Status field for potential future extensions:
   * - 'confirmed': User has RSVPed and spot is reserved
   * - 'cancelled': User cancelled their RSVP
   * - 'waitlist': Could be used for waitlist feature
   */
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'waitlist'],
    default: 'confirmed'
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

/**
 * COMPOUND UNIQUE INDEX
 * 
 * This is CRITICAL for preventing duplicate RSVPs:
 * - Ensures one user can only have one RSVP record per event
 * - Enforced at the database level (not application level)
 * - Even if two concurrent requests try to create duplicate RSVPs,
 *   MongoDB will reject one with a duplicate key error
 */
rsvpSchema.index({ event: 1, user: 1 }, { unique: true });

// Additional indexes for common queries
rsvpSchema.index({ user: 1 }); // For fetching user's RSVPs
rsvpSchema.index({ event: 1, status: 1 }); // For fetching event attendees

// Update timestamp before saving
rsvpSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('RSVP', rsvpSchema);
