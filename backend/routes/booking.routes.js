const express = require('express');
const router = express.Router();
const { createBooking, getAllBookings, getMyBookings, updateBookingStatus, deleteBooking } = require('../controllers/booking.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Customer routes
router.post('/', protect, createBooking);
router.get('/my-bookings', protect, getMyBookings);

// Admin routes
router.get('/', protect, authorize('admin'), getAllBookings);
router.put('/:id', protect, authorize('admin'), updateBookingStatus);
router.delete('/:id', protect, authorize('admin'), deleteBooking);

module.exports = router;