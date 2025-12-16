const Event = require('../models/Event');
const RSVP = require('../models/RSVP');
const mongoose = require('mongoose');

/**
 * ============================================================
 * RSVP CONTROLLER - CRITICAL CONCURRENCY HANDLING
 * ============================================================
 * 
 * This controller handles RSVPs with proper concurrency control
 * to prevent overbooking even when multiple users RSVP simultaneously.
 * 
 * KEY CONCEPTS FOR INTERVIEW:
 * 
 * 1. RACE CONDITION PROBLEM:
 *    - Without atomic operations, two users could read attendeeCount=9
 *      (with capacity=10), both think there's room, both RSVP, 
 *      resulting in 11 attendees (overbooking).
 * 
 * 2. SOLUTION: ATOMIC OPERATIONS
 *    - We use MongoDB's findOneAndUpdate with conditions in a SINGLE operation
 *    - The condition checks capacity DURING the update, not before
 *    - MongoDB guarantees this operation is atomic (all-or-nothing)
 * 
 * 3. WHY NOT read-then-write?
 *    - Reading attendeeCount, checking capacity, then incrementing
 *      creates a window where race conditions can occur
 *    - Another request could modify the count between read and write
 * 
 * 4. COMPOUND UNIQUE INDEX:
 *    - The RSVP model has a unique index on (event, user)
 *    - This prevents duplicate RSVPs at the database level
 *    - Even if two identical requests arrive simultaneously,
 *      only one will succeed; the other gets a duplicate key error
 */

/**
 * @desc    RSVP to an event (Join)
 * @route   POST /api/rsvp/:eventId
 * @access  Private
 * 
 * CONCURRENCY STRATEGY:
 * We use a two-step atomic approach:
 * 1. Atomically increment attendeeCount ONLY if under capacity
 * 2. Create RSVP record (protected by unique index)
 * 3. If RSVP creation fails, rollback the increment
 */
exports.createRsvp = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Validate event ID format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    // Check if event exists and is in the future
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (new Date(event.date) < new Date()) {
      return res.status(400).json({ message: 'Cannot RSVP to past events' });
    }

    // Check if user already has an RSVP
    const existingRsvp = await RSVP.findOne({
      event: eventId,
      user: userId,
      status: 'confirmed'
    });

    if (existingRsvp) {
      return res.status(400).json({ message: 'You have already RSVPed to this event' });
    }

    // Check if there was a cancelled RSVP (user can re-RSVP)
    const cancelledRsvp = await RSVP.findOne({
      event: eventId,
      user: userId,
      status: 'cancelled'
    });

    // Start transaction for atomic operation
    session.startTransaction();

    try {
      /**
       * ============================================================
       * ATOMIC CAPACITY CHECK AND INCREMENT
       * ============================================================
       * 
       * This is the CRITICAL operation that prevents overbooking.
       * 
       * HOW IT WORKS:
       * - findOneAndUpdate is an ATOMIC operation
       * - The query conditions are checked AT THE TIME of the update
       * - We use $expr to compare attendeeCount with capacity
       * - If attendeeCount >= capacity, NO document matches, update fails
       * - If attendeeCount < capacity, increment happens atomically
       * 
       * WHY THIS PREVENTS RACE CONDITIONS:
       * - MongoDB locks the document during findOneAndUpdate
       * - The condition check and increment happen as ONE operation
       * - No window exists for another request to sneak in
       * 
       * EXAMPLE:
       * - Event has capacity=10, attendeeCount=9
       * - Two users request RSVP simultaneously
       * - Request A: Finds document where attendeeCount(9) < capacity(10), increments to 10
       * - Request B: Finds document where attendeeCount(10) < capacity(10) = FALSE
       * - Request B returns null (no matching document), RSVP denied
       */
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          // CRITICAL: This condition is checked ATOMICALLY with the update
          // $expr allows comparison between two fields in the same document
          $expr: { $lt: ['$attendeeCount', '$capacity'] }
        },
        {
          // Atomically increment attendeeCount by 1
          $inc: { attendeeCount: 1 }
        },
        {
          new: true, // Return the updated document
          session // Use transaction session
        }
      );

      // If no document was returned, event is at capacity
      if (!updatedEvent) {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: 'Event is at full capacity. Cannot RSVP.' 
        });
      }

      // Create or update RSVP record
      let rsvp;
      if (cancelledRsvp) {
        // Reactivate cancelled RSVP
        cancelledRsvp.status = 'confirmed';
        cancelledRsvp.updatedAt = new Date();
        rsvp = await cancelledRsvp.save({ session });
      } else {
        // Create new RSVP
        rsvp = await RSVP.create([{
          event: eventId,
          user: userId,
          status: 'confirmed'
        }], { session });
        rsvp = rsvp[0];
      }

      // Commit transaction
      await session.commitTransaction();

      res.status(201).json({
        message: 'RSVP successful! You are registered for this event.',
        rsvp: {
          id: rsvp._id,
          event: eventId,
          status: rsvp.status,
          createdAt: rsvp.createdAt
        },
        event: {
          id: updatedEvent._id,
          title: updatedEvent.title,
          attendeeCount: updatedEvent.attendeeCount,
          capacity: updatedEvent.capacity,
          availableSpots: updatedEvent.capacity - updatedEvent.attendeeCount
        }
      });

    } catch (innerError) {
      // Rollback transaction on error
      await session.abortTransaction();
      
      // Handle duplicate key error (user already RSVPed)
      if (innerError.code === 11000) {
        return res.status(400).json({ 
          message: 'You have already RSVPed to this event' 
        });
      }
      
      throw innerError;
    }

  } catch (error) {
    console.error('Create RSVP error:', error);
    res.status(500).json({ message: 'Error processing RSVP' });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Cancel RSVP (Leave event)
 * @route   DELETE /api/rsvp/:eventId
 * @access  Private
 * 
 * CONCURRENCY STRATEGY:
 * 1. Find and update RSVP status to 'cancelled'
 * 2. Atomically decrement attendeeCount
 * Both operations are done in a transaction for consistency
 */
exports.cancelRsvp = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Validate event ID format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    // Check if RSVP exists
    const rsvp = await RSVP.findOne({
      event: eventId,
      user: userId,
      status: 'confirmed'
    });

    if (!rsvp) {
      return res.status(404).json({ 
        message: 'RSVP not found. You are not registered for this event.' 
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Start transaction
    session.startTransaction();

    try {
      // Update RSVP status to cancelled
      rsvp.status = 'cancelled';
      rsvp.updatedAt = new Date();
      await rsvp.save({ session });

      /**
       * ============================================================
       * ATOMIC DECREMENT OF ATTENDEE COUNT
       * ============================================================
       * 
       * We use findOneAndUpdate with $inc: -1 to atomically decrement
       * The condition ensures attendeeCount doesn't go below 0
       */
      const updatedEvent = await Event.findOneAndUpdate(
        {
          _id: eventId,
          attendeeCount: { $gt: 0 } // Ensure count doesn't go negative
        },
        {
          $inc: { attendeeCount: -1 }
        },
        {
          new: true,
          session
        }
      );

      if (!updatedEvent) {
        // This shouldn't happen if data is consistent, but handle gracefully
        await session.abortTransaction();
        return res.status(500).json({ 
          message: 'Error updating event. Please try again.' 
        });
      }

      // Commit transaction
      await session.commitTransaction();

      res.status(200).json({
        message: 'RSVP cancelled successfully.',
        event: {
          id: updatedEvent._id,
          title: updatedEvent.title,
          attendeeCount: updatedEvent.attendeeCount,
          capacity: updatedEvent.capacity,
          availableSpots: updatedEvent.capacity - updatedEvent.attendeeCount
        }
      });

    } catch (innerError) {
      await session.abortTransaction();
      throw innerError;
    }

  } catch (error) {
    console.error('Cancel RSVP error:', error);
    res.status(500).json({ message: 'Error cancelling RSVP' });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get user's RSVPs
 * @route   GET /api/rsvp/my-rsvps
 * @access  Private
 */
exports.getMyRsvps = async (req, res) => {
  try {
    const rsvps = await RSVP.find({
      user: req.user._id,
      status: 'confirmed'
    })
    .populate({
      path: 'event',
      select: 'title description date location capacity attendeeCount imageUrl creator',
      populate: {
        path: 'creator',
        select: 'name email'
      }
    })
    .sort({ createdAt: -1 });

    // Filter out past events and events that no longer exist
    const upcomingRsvps = rsvps.filter(rsvp => 
      rsvp.event && new Date(rsvp.event.date) >= new Date()
    );

    res.status(200).json({
      rsvps: upcomingRsvps.map(rsvp => ({
        rsvpId: rsvp._id,
        rsvpDate: rsvp.createdAt,
        event: {
          id: rsvp.event._id,
          title: rsvp.event.title,
          description: rsvp.event.description,
          date: rsvp.event.date,
          location: rsvp.event.location,
          capacity: rsvp.event.capacity,
          attendeeCount: rsvp.event.attendeeCount,
          imageUrl: rsvp.event.imageUrl,
          creator: rsvp.event.creator
        }
      }))
    });
  } catch (error) {
    console.error('Get my RSVPs error:', error);
    res.status(500).json({ message: 'Error fetching RSVPs' });
  }
};

/**
 * @desc    Check RSVP status for an event
 * @route   GET /api/rsvp/:eventId/status
 * @access  Private
 */
exports.getRsvpStatus = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const rsvp = await RSVP.findOne({
      event: eventId,
      user: req.user._id,
      status: 'confirmed'
    });

    res.status(200).json({
      hasRsvped: !!rsvp,
      rsvp: rsvp ? {
        id: rsvp._id,
        status: rsvp.status,
        createdAt: rsvp.createdAt
      } : null
    });
  } catch (error) {
    console.error('Get RSVP status error:', error);
    res.status(500).json({ message: 'Error checking RSVP status' });
  }
};
