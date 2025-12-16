const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const { validationResult } = require('express-validator');

/**
 * @desc    Create a new event
 * @route   POST /api/events
 * @access  Private
 */
exports.createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { title, description, date, location, capacity, imageUrl } = req.body;

    // Validate that event date is in the future
    if (new Date(date) < new Date()) {
      return res.status(400).json({ 
        message: 'Event date must be in the future' 
      });
    }

    const event = await Event.create({
      title,
      description,
      date,
      location,
      capacity,
      imageUrl: imageUrl || null,
      creator: req.user._id,
      attendeeCount: 0
    });

    // Populate creator info for response
    await event.populate('creator', 'name email');

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Error creating event' });
  }
};

/**
 * @desc    Get all upcoming events
 * @route   GET /api/events
 * @access  Public
 */
exports.getEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, myEvents } = req.query;

    // Build query
    const query = {
      date: { $gte: new Date() } // Only upcoming events
    };

    // Filter by creator if myEvents is true and user is authenticated
    if (myEvents === 'true' && req.user) {
      query.creator = req.user._id;
    }

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query)
      .populate('creator', 'name email')
      .sort({ date: 1 }) // Sort by date ascending (earliest first)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(query);

    // If user is authenticated, check their RSVP status for each event
    let eventsWithRsvpStatus = events;
    if (req.user) {
      const eventIds = events.map(e => e._id);
      const userRsvps = await RSVP.find({
        event: { $in: eventIds },
        user: req.user._id,
        status: 'confirmed'
      });

      const rsvpMap = new Set(userRsvps.map(r => r.event.toString()));

      eventsWithRsvpStatus = events.map(event => ({
        ...event.toObject(),
        hasRsvped: rsvpMap.has(event._id.toString())
      }));
    }

    res.status(200).json({
      events: eventsWithRsvpStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasMore: page * limit < total
      }
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('creator', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user has RSVPed (if authenticated)
    let hasRsvped = false;
    if (req.user) {
      const rsvp = await RSVP.findOne({
        event: event._id,
        user: req.user._id,
        status: 'confirmed'
      });
      hasRsvped = !!rsvp;
    }

    res.status(200).json({
      event: {
        ...event.toObject(),
        hasRsvped
      }
    });
  } catch (error) {
    console.error('Get event error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    res.status(500).json({ message: 'Error fetching event' });
  }
};

/**
 * @desc    Update event
 * @route   PUT /api/events/:id
 * @access  Private (Creator only)
 */
exports.updateEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the creator
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized. Only the event creator can update this event.' 
      });
    }

    const { title, description, date, location, capacity, imageUrl } = req.body;

    // If capacity is being reduced, check if it's not less than current attendees
    if (capacity && capacity < event.attendeeCount) {
      return res.status(400).json({
        message: `Cannot reduce capacity below current attendee count (${event.attendeeCount})`
      });
    }

    // Update fields
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (date) updateData.date = date;
    if (location) updateData.location = location;
    if (capacity) updateData.capacity = capacity;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('creator', 'name email');

    res.status(200).json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Update event error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    res.status(500).json({ message: 'Error updating event' });
  }
};

/**
 * @desc    Delete event
 * @route   DELETE /api/events/:id
 * @access  Private (Creator only)
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the creator
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized. Only the event creator can delete this event.' 
      });
    }

    // Delete all RSVPs for this event
    await RSVP.deleteMany({ event: event._id });

    // Delete the event
    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid event ID' });
    }
    
    res.status(500).json({ message: 'Error deleting event' });
  }
};

/**
 * @desc    Get events created by current user
 * @route   GET /api/events/my-events
 * @access  Private
 */
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ creator: req.user._id })
      .populate('creator', 'name email')
      .sort({ date: 1 });

    res.status(200).json({ events });
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ message: 'Error fetching your events' });
  }
};

/**
 * @desc    Get attendees for an event
 * @route   GET /api/events/:id/attendees
 * @access  Private (Creator only)
 */
exports.getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the creator
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Not authorized. Only the event creator can view attendees.' 
      });
    }

    const rsvps = await RSVP.find({ 
      event: event._id, 
      status: 'confirmed' 
    }).populate('user', 'name email');

    res.status(200).json({
      event: {
        id: event._id,
        title: event.title,
        attendeeCount: event.attendeeCount,
        capacity: event.capacity
      },
      attendees: rsvps.map(r => ({
        id: r.user._id,
        name: r.user.name,
        email: r.user.email,
        rsvpDate: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({ message: 'Error fetching attendees' });
  }
};
