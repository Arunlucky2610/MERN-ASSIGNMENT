import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand">
          🎉 Event Platform
        </Link>
        
        <div className="navbar-nav">
          <Link to="/" className="nav-link">
            Events
          </Link>
          
          {user ? (
            <>
              <Link to="/create-event" className="nav-link">
                Create Event
              </Link>
              <Link to="/my-events" className="nav-link">
                My Events
              </Link>
              <Link to="/my-rsvps" className="nav-link">
                My RSVPs
              </Link>
              <span className="nav-link" style={{ opacity: 0.8 }}>
                Hi, {user.name}
              </span>
              <button 
                onClick={handleLogout} 
                className="btn btn-outline"
                style={{ color: 'white', borderColor: 'white' }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/signup" className="btn btn-outline" style={{ color: 'white', borderColor: 'white' }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
