import React, { useState } from 'react';

/**
 * EventForm Component
 * 
 * Reusable form for creating and editing events.
 */
const EventForm = ({ initialData = {}, onSubmit, loading, submitText = 'Create Event' }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    date: initialData.date ? new Date(initialData.date).toISOString().slice(0, 16) : '',
    location: initialData.location || '',
    capacity: initialData.capacity || '',
    imageUrl: initialData.imageUrl || ''
  });
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (new Date(formData.date) < new Date()) {
      newErrors.date = 'Date must be in the future';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.capacity) {
      newErrors.capacity = 'Capacity is required';
    } else if (formData.capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      newErrors.imageUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // URL validation helper
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit({
        ...formData,
        capacity: parseInt(formData.capacity),
        imageUrl: formData.imageUrl || null
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="title" className="form-label">Event Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter event title"
          maxLength={100}
        />
        {errors.title && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{errors.title}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">Description *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-control"
          placeholder="Describe your event"
          maxLength={2000}
        />
        {errors.description && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{errors.description}</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label htmlFor="date" className="form-label">Date & Time *</label>
          <input
            type="datetime-local"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="form-control"
            min={new Date().toISOString().slice(0, 16)}
          />
          {errors.date && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{errors.date}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="capacity" className="form-label">Capacity *</label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            className="form-control"
            placeholder="Max attendees"
            min={1}
            max={100000}
          />
          {errors.capacity && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{errors.capacity}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="location" className="form-label">Location *</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter event location"
          maxLength={200}
        />
        {errors.location && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{errors.location}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="imageUrl" className="form-label">Image URL (optional)</label>
        <input
          type="url"
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          className="form-control"
          placeholder="https://example.com/image.jpg"
        />
        {errors.imageUrl && <span style={{ color: '#ef4444', fontSize: '0.875rem' }}>{errors.imageUrl}</span>}
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={loading}
        style={{ width: '100%', marginTop: '1rem' }}
      >
        {loading ? 'Saving...' : submitText}
      </button>
    </form>
  );
};

export default EventForm;
