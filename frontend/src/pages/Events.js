import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import EventCard from '../components/EventCard';
import { useAuth } from '../context/AuthContext';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/events', {
        params: { search: searchTerm }
      });
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle RSVP
  const handleRsvp = async (eventId) => {
    if (!user) {
      toast.info('Please login to RSVP');
      return;
    }

    try {
      setRsvpLoading(eventId);
      await api.post(`/rsvp/${eventId}`);
      toast.success('Successfully joined the event!');
      fetchEvents(); // Refresh events
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to RSVP';
      toast.error(message);
    } finally {
      setRsvpLoading(null);
    }
  };

  // Handle Cancel RSVP
  const handleCancelRsvp = async (eventId) => {
    try {
      setRsvpLoading(eventId);
      await api.delete(`/rsvp/${eventId}`);
      toast.success('RSVP cancelled');
      fetchEvents(); // Refresh events
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel RSVP';
      toast.error(message);
    } finally {
      setRsvpLoading(null);
    }
  };

  // Search handler with debounce
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Upcoming Events</h1>
        {user && (
          <Link to="/create-event" className="btn btn-primary">
            + Create Event
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search events by title, description, or location..."
          value={searchTerm}
          onChange={handleSearch}
          className="form-control"
          style={{ maxWidth: '400px' }}
        />
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3 className="empty-state-title">No upcoming events</h3>
          <p>
            {searchTerm 
              ? 'No events match your search. Try different keywords.'
              : 'Be the first to create an event!'}
          </p>
          {user && !searchTerm && (
            <Link to="/create-event" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create Event
            </Link>
          )}
        </div>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <EventCard
              key={event._id}
              event={event}
              onRsvp={handleRsvp}
              onCancelRsvp={handleCancelRsvp}
              loading={rsvpLoading === event._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;
