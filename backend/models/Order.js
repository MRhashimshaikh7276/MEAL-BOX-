const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  comboId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Combo',
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: String,
});

const orderStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  message: String,
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    default: () => `MB-${Date.now().toString(36).toUpperCase()}`,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [orderItemSchema],
  deliveryAddress: {
    fullName: String,
    phone: String,
    fullAddress: String,
    landmark: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number,
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'razorpay', 'stripe', 'wallet'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  paymentId: String,
  orderStatus: {
    type: String,
    enum: ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
  },
  statusTimeline: [orderStatusSchema],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  referralDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
  },
  assignedDeliveryBoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  estimatedDeliveryTime: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancelReason: String,
  notes: String,
  preparationTime: {
    type: Number,
    default: 15,
  },
  preparingStartedAt: Date,
  preparingCompletedAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  deliveryBoyEstimatedTime: {
    type: Number,
    default: null,
  },
  estimatedDeliveryTime: {
    type: Number,
    default: null,
  },
  codCollectedAt: Date,
  codCollectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  codCollectionNote: String,
}, { timestamps: true });

// Note: orderNumber has unique: true which auto-creates index
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ assignedDeliveryBoy: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
