import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const MyRsvps = () => {
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(null);

  // Fetch user's RSVPs
  const fetchRsvps = async () => {
    try {
      const response = await api.get('/rsvp/my-rsvps');
      setRsvps(response.data.rsvps);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
      toast.error('Failed to load your RSVPs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRsvps();
  }, []);

  // Handle cancel RSVP
  const handleCancelRsvp = async (eventId) => {
    try {
      setCancelLoading(eventId);
      await api.delete(`/rsvp/${eventId}`);
      toast.success('RSVP cancelled');
      fetchRsvps(); // Refresh list
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel RSVP';
      toast.error(message);
    } finally {
      setCancelLoading(null);
    }
  };

  // Format date
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">My RSVPs</h1>
      </div>

      {rsvps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎫</div>
          <h3 className="empty-state-title">No RSVPs yet</h3>
          <p>Browse events and join some!</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="events-grid">
          {rsvps.map(rsvp => (
            <div key={rsvp.rsvpId} className="card event-card">
              {rsvp.event.imageUrl ? (
                <img src={rsvp.event.imageUrl} alt={rsvp.event.title} className="event-image" />
              ) : (
                <div className="event-image-placeholder">📅</div>
              )}
              
              <div className="card-body">
                <div style={{ 
                  display: 'inline-block', 
                  background: '#d1fae5', 
                  color: '#065f46',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  ✓ Registered
                </div>

                <h3 className="card-title">{rsvp.event.title}</h3>
                
                <div className="event-meta">
                  <span className="event-meta-item">
                    📅 {formatDate(rsvp.event.date)}
                  </span>
                  <span className="event-meta-item">
                    📍 {rsvp.event.location}
                  </span>
                </div>

                <p className="card-text">
                  {rsvp.event.description.length > 100 
                    ? `${rsvp.event.description.substring(0, 100)}...` 
                    : rsvp.event.description}
                </p>

                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
                  RSVP'd on {new Date(rsvp.rsvpDate).toLocaleDateString()}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/events/${rsvp.event.id}`} className="btn btn-outline">
                    View Details
                  </Link>
                  <button
                    onClick={() => handleCancelRsvp(rsvp.event.id)}
                    disabled={cancelLoading === rsvp.event.id}
                    className="btn btn-danger"
                  >
                    {cancelLoading === rsvp.event.id ? 'Cancelling...' : 'Cancel RSVP'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRsvps;
