const express = require('express');
const router = express.Router();
const { 
  createRsvp, 
  cancelRsvp, 
  getMyRsvps,
  getRsvpStatus
} = require('../controllers/rsvpController');
const { auth } = require('../middleware/auth');

/**
 * RSVP Routes
 * All routes require authentication
 */

// Get current user's RSVPs
router.get('/my-rsvps', auth, getMyRsvps);

// Check RSVP status for a specific event
router.get('/:eventId/status', auth, getRsvpStatus);

// Create RSVP (Join event)
router.post('/:eventId', auth, createRsvp);

// Cancel RSVP (Leave event)
router.delete('/:eventId', auth, cancelRsvp);

module.exports = router;
