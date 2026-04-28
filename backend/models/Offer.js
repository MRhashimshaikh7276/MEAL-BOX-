const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Offer title is required'],
    trim: true,
  },
  description: String,
  couponCode: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative'],
  },
  maxDiscount: {
    type: Number,
    default: null, // max cap for percentage discount
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  usageLimit: {
    type: Number,
    default: null, // null = unlimited
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  userUsageLimit: {
    type: Number,
    default: 1, // per user limit
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  banner: String,
}, { timestamps: true });

// Note: couponCode has unique: true which auto-creates index
offerSchema.index({ isActive: 1, expiryDate: 1 });

// Virtual to check if offer is valid
offerSchema.virtual('isValid').get(function () {
  return this.isActive && this.expiryDate > new Date() &&
    (this.usageLimit === null || this.usedCount < this.usageLimit);
});

module.exports = mongoose.model('Offer', offerSchema);
