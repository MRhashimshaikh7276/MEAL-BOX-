const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  paymentId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  transactions: [walletTransactionSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Wallet', walletSchema);