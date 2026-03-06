'use strict';
const { validationResult } = require('express-validator');
const BookingModel = require('../models/booking.model');
const EventModel = require('../models/event.model');
const UserModel = require('../models/user.model');

const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { user_id, event_id, tickets_count } = req.body;

    const event = await EventModel.findById(event_id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const user = await UserModel.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const booked = await EventModel.getBookedSeats(event_id);
    const available = event.capacity - booked;
    if (tickets_count > available) {
      return res.status(409).json({
        success: false,
        message: `Only ${available} seat(s) available`,
      });
    }

    const booking = await BookingModel.create({ user_id, event_id, tickets_count });
    return res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await BookingModel.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    return res.status(200).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

const getBookingsByUser = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const bookings = await BookingModel.findByUser(req.params.id);
    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, getBookingById, getBookingsByUser };
