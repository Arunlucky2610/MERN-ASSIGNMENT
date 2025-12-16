import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import EventForm from '../components/EventForm';

const CreateEvent = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      const response = await api.post('/events', formData);
      toast.success('Event created successfully!');
      navigate(`/events/${response.data.event._id}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create event';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <Link to="/" style={{ color: '#4f46e5', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        ← Back to Events
      </Link>

      <div className="card">
        <div className="card-body">
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Create New Event</h2>
          
          <EventForm 
            onSubmit={handleSubmit}
            loading={loading}
            submitText="Create Event"
          />
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
