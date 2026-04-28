const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customerName: {
        type: String,
        required: true,
    },
    customerPhone: {
        type: String,
        required: true,
    },
    customerEmail: {
        type: String,
        default: '',
    },
    date: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    guests: {
        type: Number,
        required: true,
        min: 1,
        max: 20,
    },
    specialRequest: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending',
    },
    tableNumber: {
        type: Number,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);