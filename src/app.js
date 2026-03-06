'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const userRoutes = require('./routes/user.routes');
const organizerRoutes = require('./routes/organizer.routes');
const eventRoutes = require('./routes/event.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const categoryRoutes = require('./routes/category.routes');

const { getBookingsByUser } = require('./controllers/booking.controller');
const auth = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'EventScale API is running 🚀' });
});

app.use('/users', userRoutes);
app.use('/organizers', organizerRoutes);
app.use('/events', eventRoutes);
app.use('/bookings', bookingRoutes);
app.use('/payments', paymentRoutes);
app.use('/categories', categoryRoutes);

app.get('/users/:id/bookings', auth, getBookingsByUser);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use(errorHandler);

module.exports = app;
