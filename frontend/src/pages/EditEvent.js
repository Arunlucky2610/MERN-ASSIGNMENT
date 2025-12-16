import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import EventForm from '../components/EventForm';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await api.get(`/events/${id}`);
        setEvent(response.data.event);
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Event not found or you do not have permission to edit');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);
      await api.put(`/events/${id}`, formData);
      toast.success('Event updated successfully!');
      navigate(`/events/${id}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update event';
      toast.error(message);
    } finally {
      setSaving(false);
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

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <Link to={`/events/${id}`} style={{ color: '#4f46e5', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Event
      </Link>

      <div className="card">
        <div className="card-body">
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Edit Event</h2>
          
          <EventForm 
            initialData={event}
            onSubmit={handleSubmit}
            loading={saving}
            submitText="Update Event"
          />
        </div>
      </div>
    </div>
  );
};

export default EditEvent;
