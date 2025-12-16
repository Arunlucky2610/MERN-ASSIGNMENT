import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's created events
  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const response = await api.get('/events/my-events');
        setEvents(response.data.events);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load your events');
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, []);

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
        <h1 className="page-title">My Events</h1>
        <Link to="/create-event" className="btn btn-primary">
          + Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <h3 className="empty-state-title">No events created yet</h3>
          <p>Start by creating your first event!</p>
          <Link to="/create-event" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Create Event
          </Link>
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <div key={event._id} className="card event-card">
              {event.imageUrl ? (
                <img src={event.imageUrl} alt={event.title} className="event-image" />
              ) : (
                <div className="event-image-placeholder">📅</div>
              )}
              
              <div className="card-body">
                <h3 className="card-title">{event.title}</h3>
                
                <div className="event-meta">
                  <span className="event-meta-item">
                    📅 {new Date(event.date).toLocaleDateString()}
                  </span>
                  <span className="event-meta-item">
                    📍 {event.location}
                  </span>
                </div>

                <p className="card-text">
                  {event.description.length > 100 
                    ? `${event.description.substring(0, 100)}...` 
                    : event.description}
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <span className={`capacity-badge ${
                    event.attendeeCount >= event.capacity 
                      ? 'capacity-full' 
                      : event.attendeeCount >= event.capacity * 0.8 
                        ? 'capacity-limited' 
                        : 'capacity-available'
                  }`}>
                    👥 {event.attendeeCount}/{event.capacity}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to={`/events/${event._id}`} className="btn btn-outline">
                    View Details
                  </Link>
                  <Link to={`/edit-event/${event._id}`} className="btn btn-secondary">
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;
