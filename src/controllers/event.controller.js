'use strict';
const { validationResult } = require('express-validator');
const EventModel = require('../models/event.model');

const createEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { organizer_id, category_id, title, description, location, date, capacity, price } = req.body;
    const event = await EventModel.create({
      organizer_id, category_id, title, description, location, date, capacity, price: price || 0,
    });

    return res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

const getAllEvents = async (req, res, next) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '20'), 100);
    const offset = parseInt(req.query.offset || '0');
    const events = await EventModel.findAll({ limit, offset });
    return res.status(200).json({ success: true, count: events.length, data: events });
  } catch (err) {
    next(err);
  }
};

const getEventById = async (req, res, next) => {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const booked = await EventModel.getBookedSeats(event.event_id);
    event.available_seats = event.capacity - booked;

    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

module.exports = { createEvent, getAllEvents, getEventById };
