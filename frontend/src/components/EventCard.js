import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * EventCard Component
 * 
 * Displays event information in a card format.
 * Shows RSVP status and capacity information.
 */
const EventCard = ({ event, onRsvp, onCancelRsvp, loading }) => {
  const { user } = useAuth();
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate capacity status
  const getCapacityStatus = () => {
    const available = event.capacity - event.attendeeCount;
    const percentFull = (event.attendeeCount / event.capacity) * 100;

    if (available === 0) {
      return { class: 'capacity-full', text: 'Full' };
    } else if (percentFull >= 80) {
      return { class: 'capacity-limited', text: `${available} spots left` };
    } else {
      return { class: 'capacity-available', text: `${available} spots available` };
    }
  };

  const capacityStatus = getCapacityStatus();
  const isCreator = user && event.creator && 
    (event.creator._id === user.id || event.creator === user.id);
  const isFull = event.attendeeCount >= event.capacity;
  const isPast = new Date(event.date) < new Date();

  return (
    <div className="card event-card">
      {/* Event Image or Placeholder */}
      {event.imageUrl ? (
        <img src={event.imageUrl} alt={event.title} className="event-image" />
      ) : (
        <div className="event-image-placeholder">
          📅
        </div>
      )}
      
      <div className="card-body">
        <h3 className="card-title">{event.title}</h3>
        
        {/* Event Meta Information */}
        <div className="event-meta">
          <span className="event-meta-item">
            📅 {formatDate(event.date)}
          </span>
          <span className="event-meta-item">
            📍 {event.location}
          </span>
        </div>
        
        {/* Description (truncated) */}
        <p className="card-text">
          {event.description.length > 100 
            ? `${event.description.substring(0, 100)}...` 
            : event.description}
        </p>
        
        {/* Capacity Badge */}
        <div style={{ marginBottom: '1rem' }}>
          <span className={`capacity-badge ${capacityStatus.class}`}>
            👥 {event.attendeeCount}/{event.capacity} - {capacityStatus.text}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to={`/events/${event._id}`} className="btn btn-outline">
            View Details
          </Link>
          
          {user && !isPast && (
            <>
              {isCreator ? (
                <Link to={`/edit-event/${event._id}`} className="btn btn-secondary">
                  Edit
                </Link>
              ) : event.hasRsvped ? (
                <button
                  onClick={() => onCancelRsvp(event._id)}
                  disabled={loading}
                  className="btn btn-danger"
                >
                  {loading ? 'Processing...' : 'Cancel RSVP'}
                </button>
              ) : (
                <button
                  onClick={() => onRsvp(event._id)}
                  disabled={loading || isFull}
                  className="btn btn-success"
                >
                  {loading ? 'Processing...' : isFull ? 'Event Full' : 'Join Event'}
                </button>
              )}
            </>
          )}
          
          {!user && !isPast && (
            <Link to="/login" className="btn btn-primary">
              Login to RSVP
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
