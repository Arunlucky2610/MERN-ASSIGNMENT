const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { 
  createEvent, 
  getEvents, 
  getEvent, 
  updateEvent, 
  deleteEvent,
  getMyEvents,
  getEventAttendees
} = require('../controllers/eventController');
const { auth, optionalAuth } = require('../middleware/auth');

// Validation rules for creating/updating events
const eventValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),
  body('capacity')
    .notEmpty().withMessage('Capacity is required')
    .isInt({ min: 1, max: 100000 }).withMessage('Capacity must be between 1 and 100,000'),
  body('imageUrl')
    .optional({ nullable: true })
    .isURL().withMessage('Image URL must be a valid URL')
];

// Update validation (all fields optional)
const updateEventValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Location cannot exceed 200 characters'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 100000 }).withMessage('Capacity must be between 1 and 100,000'),
  body('imageUrl')
    .optional({ nullable: true })
    .isURL().withMessage('Image URL must be a valid URL')
];

// Routes

// Get user's created events (must be before /:id to avoid conflict)
router.get('/my-events', auth, getMyEvents);

// Public routes with optional auth (to check RSVP status)
router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEvent);

// Protected routes
router.post('/', auth, eventValidation, createEvent);
router.put('/:id', auth, updateEventValidation, updateEvent);
router.delete('/:id', auth, deleteEvent);
router.get('/:id/attendees', auth, getEventAttendees);

module.exports = router;
