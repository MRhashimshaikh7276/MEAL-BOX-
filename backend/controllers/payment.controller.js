const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
const createPaymentOrder = async (req, res, next) => {
  const { orderId } = req.body;
  const order = await Order.findOne({ _id: orderId, user: req.user.id });
  if (!order) return next(new AppError('Order not found', 404));

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.totalAmount * 100), // in paise
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order._id.toString() },
  });

  await Payment.create({
    order: order._id,
    user: req.user.id,
    orderId: razorpayOrder.id,
    amount: order.totalAmount,
    method: 'razorpay',
  });

  sendResponse(res, 200, 'Payment order created', {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
  });
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return next(new AppError('Payment verification failed', 400));
  }

  // Update order payment status
  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'paid',
    paymentId: razorpay_payment_id,
  });

  await Payment.findOneAndUpdate(
    { orderId: razorpay_order_id },
    { status: 'success', paymentId: razorpay_payment_id, signature: razorpay_signature }
  );

  sendResponse(res, 200, 'Payment verified successfully ✅');
};

module.exports = { createPaymentOrder, verifyPayment };
