const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  label: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    default: 'Home',
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
  },
  fullAddress: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  landmark: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  pincode: {
    type: String,
    required: [true, 'Pincode is required'],
    match: [/^[1-9][0-9]{5}$/, 'Invalid pincode'],
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  location: {
    lat: { type: Number },
    lng: { type: Number },
  },
}, { timestamps: true });

addressSchema.index({ user: 1 });

module.exports = mongoose.model('Address', addressSchema);
