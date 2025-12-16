import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${id}`);
        setEvent(response.data.event);
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Event not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle RSVP
  const handleRsvp = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/rsvp/${id}`);
      toast.success('Successfully joined the event!');
      // Refresh event data
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.event);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to RSVP';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel RSVP
  const handleCancelRsvp = async () => {
    try {
      setActionLoading(true);
      await api.delete(`/rsvp/${id}`);
      toast.success('RSVP cancelled');
      // Refresh event data
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.event);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel RSVP';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Event
  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await api.delete(`/events/${id}`);
      toast.success('Event deleted');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete event';
      toast.error(message);
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Event not found</h3>
          <Link to="/" className="btn btn-primary">Back to Events</Link>
        </div>
      </div>
    );
  }

  const isCreator = user && event.creator && 
    (event.creator._id === user.id || event.creator === user.id);
  const isFull = event.attendeeCount >= event.capacity;
  const isPast = new Date(event.date) < new Date();
  const availableSpots = event.capacity - event.attendeeCount;

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <Link to="/" style={{ color: '#4f46e5', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Events
      </Link>

      <div className="card">
        {/* Event Image */}
        {event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            style={{ width: '100%', height: '300px', objectFit: 'cover' }}
          />
        ) : (
          <div 
            style={{ 
              width: '100%', 
              height: '300px', 
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '5rem'
            }}
          >
            📅
          </div>
        )}

        <div className="card-body">
          {/* Title and Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>{event.title}</h1>
            
            {isCreator && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Link to={`/edit-event/${event._id}`} className="btn btn-secondary">
                  Edit
                </Link>
                <button 
                  onClick={() => setShowDeleteModal(true)} 
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Event Meta */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div>
                <strong>📅 Date & Time</strong>
                <p style={{ color: '#6b7280' }}>{formatDate(event.date)}</p>
              </div>
              <div>
                <strong>📍 Location</strong>
                <p style={{ color: '#6b7280' }}>{event.location}</p>
              </div>
              <div>
                <strong>👤 Organizer</strong>
                <p style={{ color: '#6b7280' }}>{event.creator?.name || 'Unknown'}</p>
              </div>
            </div>

            {/* Capacity */}
            <div style={{ 
              background: isFull ? '#fee2e2' : '#d1fae5', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <strong>👥 Capacity</strong>
              <p style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0.25rem 0' }}>
                {event.attendeeCount} / {event.capacity} attendees
              </p>
              <p style={{ color: isFull ? '#991b1b' : '#065f46', margin: 0 }}>
                {isFull ? 'Event is full' : `${availableSpots} spot${availableSpots !== 1 ? 's' : ''} available`}
              </p>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>About this event</h3>
            <p style={{ color: '#4b5563', whiteSpace: 'pre-wrap' }}>{event.description}</p>
          </div>

          {/* Action Buttons */}
          {!isPast && (
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
              {!user ? (
                <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                  Login to RSVP
                </Link>
              ) : isCreator ? (
                <p style={{ textAlign: 'center', color: '#6b7280' }}>
                  You are the organizer of this event
                </p>
              ) : event.hasRsvped ? (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#10b981', fontWeight: '600', marginBottom: '1rem' }}>
                    ✓ You're registered for this event
                  </p>
                  <button
                    onClick={handleCancelRsvp}
                    disabled={actionLoading}
                    className="btn btn-danger"
                  >
                    {actionLoading ? 'Processing...' : 'Cancel RSVP'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleRsvp}
                  disabled={actionLoading || isFull}
                  className="btn btn-success"
                  style={{ width: '100%', padding: '1rem' }}
                >
                  {actionLoading ? 'Processing...' : isFull ? 'Event is Full' : 'Join This Event'}
                </button>
              )}
            </div>
          )}

          {isPast && (
            <div style={{ 
              background: '#f3f4f6', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              textAlign: 'center' 
            }}>
              <p style={{ color: '#6b7280' }}>This event has already passed</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Delete Event</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this event? This action cannot be undone.</p>
              <p style={{ color: '#ef4444', marginTop: '0.5rem' }}>
                All RSVPs will be cancelled.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
