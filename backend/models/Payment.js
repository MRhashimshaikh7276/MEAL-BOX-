const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paymentId: String, // from gateway
  orderId: String,   // from gateway
  signature: String, // razorpay signature
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending',
  },
  method: {
    type: String,
    enum: ['cod', 'razorpay', 'stripe', 'wallet'],
    required: true,
  },
  gatewayResponse: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

paymentSchema.index({ order: 1 });
paymentSchema.index({ paymentId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
