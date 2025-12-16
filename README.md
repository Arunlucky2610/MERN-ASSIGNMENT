# 🎉 Mini Event Platform

A production-ready MERN stack event management platform with secure authentication, event CRUD operations, and a race-condition-proof RSVP system.

![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [RSVP Concurrency Logic](#rsvp-concurrency-logic)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)

## 🎯 Overview

This Mini Event Platform allows users to create events, browse upcoming events, and RSVP to attend. The system is designed with a focus on:

- **Security**: JWT authentication, password hashing, protected routes
- **Data Integrity**: Atomic operations to prevent race conditions
- **Scalability**: Clean architecture, proper indexing, connection pooling
- **User Experience**: Clean UI, real-time feedback, error handling

## ✨ Features

### Authentication
- ✅ User signup with email and password
- ✅ Secure login with JWT tokens
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Protected API routes with middleware
- ✅ Token stored securely in localStorage

### Event Management
- ✅ Create events with title, description, date, location, capacity, and optional image
- ✅ View all upcoming events with search functionality
- ✅ Edit/Delete events (creator only)
- ✅ View event details with attendee count
- ✅ Pagination support

### RSVP System (Critical Feature)
- ✅ Join events with capacity enforcement
- ✅ Cancel RSVP with proper count management
- ✅ **Race condition prevention** using MongoDB atomic operations
- ✅ Duplicate RSVP prevention with unique compound index
- ✅ Transaction support for data consistency

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React.js, React Router, Axios, React Toastify |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JWT (jsonwebtoken), bcryptjs |
| **Validation** | express-validator |

## 📁 Project Structure

```
MERN-ASSIGNMENT/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Login/Signup logic
│   │   ├── eventController.js    # Event CRUD operations
│   │   └── rsvpController.js     # RSVP with concurrency control
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── User.js               # User schema with password hashing
│   │   ├── Event.js              # Event schema with capacity tracking
│   │   └── RSVP.js               # RSVP schema with unique index
│   ├── routes/
│   │   ├── auth.js               # Auth routes
│   │   ├── events.js             # Event routes
│   │   └── rsvp.js               # RSVP routes
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── server.js                 # Express app entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js         # Navigation component
│   │   │   ├── EventCard.js      # Event display card
│   │   │   └── EventForm.js      # Reusable event form
│   │   ├── context/
│   │   │   └── AuthContext.js    # Authentication state management
│   │   ├── pages/
│   │   │   ├── Login.js          # Login page
│   │   │   ├── Signup.js         # Signup page
│   │   │   ├── Events.js         # Event listing page
│   │   │   ├── EventDetails.js   # Single event view
│   │   │   ├── CreateEvent.js    # Create event form
│   │   │   ├── EditEvent.js      # Edit event form
│   │   │   ├── MyEvents.js       # User's created events
│   │   │   └── MyRsvps.js        # User's RSVPs
│   │   ├── services/
│   │   │   └── api.js            # Axios configuration
│   │   ├── App.js                # Main app with routing
│   │   ├── index.js              # React entry point
│   │   └── index.css             # Global styles
│   ├── .env
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/Arunlucky2610/MERN-ASSIGNMENT.git
cd MERN-ASSIGNMENT
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start development server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env if needed

# Start development server
npm start
```

The frontend will run on `http://localhost:3000`

### 4. Using MongoDB Atlas (Recommended for Production)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist your IP address (or 0.0.0.0/0 for all IPs)
4. Get your connection string and update `MONGODB_URI` in backend `.env`

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

#### Signup Request
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login Request
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Events

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/events` | Get all upcoming events | Optional |
| GET | `/api/events/:id` | Get single event | Optional |
| POST | `/api/events` | Create new event | Yes |
| PUT | `/api/events/:id` | Update event (creator only) | Yes |
| DELETE | `/api/events/:id` | Delete event (creator only) | Yes |
| GET | `/api/events/my-events` | Get user's events | Yes |

#### Create Event Request
```json
{
  "title": "Tech Meetup",
  "description": "A meetup for tech enthusiasts",
  "date": "2024-12-25T18:00:00.000Z",
  "location": "San Francisco, CA",
  "capacity": 50,
  "imageUrl": "https://example.com/image.jpg"
}
```

### RSVP

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/rsvp/:eventId` | RSVP to event | Yes |
| DELETE | `/api/rsvp/:eventId` | Cancel RSVP | Yes |
| GET | `/api/rsvp/my-rsvps` | Get user's RSVPs | Yes |
| GET | `/api/rsvp/:eventId/status` | Check RSVP status | Yes |

## 🔒 RSVP Concurrency Logic

### The Problem: Race Conditions

When multiple users try to RSVP for the last spot simultaneously, a naive implementation might:
1. Read `attendeeCount = 49` (capacity = 50)
2. Both users see 1 spot available
3. Both users RSVP
4. Result: `attendeeCount = 51` (OVERBOOKING!)

### The Solution: Atomic Operations

We use MongoDB's `findOneAndUpdate` with conditional checks in a **single atomic operation**:

```javascript
const updatedEvent = await Event.findOneAndUpdate(
  {
    _id: eventId,
    // CRITICAL: This condition is checked ATOMICALLY with the update
    $expr: { $lt: ['$attendeeCount', '$capacity'] }
  },
  {
    $inc: { attendeeCount: 1 }
  },
  { new: true, session }
);
```

### How It Works

1. **Atomic Check + Update**: The condition `attendeeCount < capacity` is verified at the exact moment of the update, not before.

2. **MongoDB Document Locking**: During `findOneAndUpdate`, MongoDB locks the document, preventing other operations from modifying it.

3. **No Race Window**: There's no gap between checking capacity and incrementing the count.

### Example Scenario

- Event has `capacity = 50`, `attendeeCount = 49`
- Two users (A and B) request RSVP simultaneously

**With Atomic Operations:**
1. Request A acquires lock, finds `49 < 50 = true`, increments to 50
2. Request B waits, then finds `50 < 50 = false`, gets rejected

**Result**: Only one user gets the last spot. No overbooking.

### Additional Safeguards

1. **Unique Compound Index**: Prevents duplicate RSVPs at database level
   ```javascript
   rsvpSchema.index({ event: 1, user: 1 }, { unique: true });
   ```

2. **MongoDB Transactions**: Ensures RSVP record creation and attendee count increment succeed or fail together

3. **Decrement Protection**: When cancelling, we ensure count doesn't go below 0
   ```javascript
   { attendeeCount: { $gt: 0 } }
   ```

## 🌐 Deployment

### Backend Deployment (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all from `.env`

### Frontend Deployment (Vercel)

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to frontend folder: `cd frontend`
3. Run: `vercel`
4. Configure environment variable `REACT_APP_API_URL` to your backend URL

### MongoDB Atlas

1. Create cluster at [MongoDB Atlas](https://mongodb.com/atlas)
2. Update `MONGODB_URI` in backend environment variables
3. Whitelist `0.0.0.0/0` for production access

## ⚙️ Environment Variables

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT signing | `your-secret-key` |
| `JWT_EXPIRE` | Token expiration time | `7d` |
| `PORT` | Server port | `5000` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API URL | `http://localhost:5000/api` |

## 📝 License

MIT License - feel free to use this project for learning and development.

---

Built with ❤️ using the MERN Stack
