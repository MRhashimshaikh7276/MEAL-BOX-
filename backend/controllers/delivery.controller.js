const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

const getAssignedOrders = async (req, res, next) => {
  const orders = await Order.find({ assignedDeliveryBoy: req.user.id })
    .sort('-createdAt')
    .populate('user', 'name phone');
  sendResponse(res, 200, 'Assigned orders', { orders });
};

const updateDeliveryStatus = async (req, res, next) => {
  const { status } = req.body;
  const allowedStatuses = ['out_for_delivery', 'delivered'];

  if (!allowedStatuses.includes(status)) {
    return next(new AppError('Delivery boy can only update to out_for_delivery or delivered', 400));
  }

  const order = await Order.findOne({ _id: req.params.id, assignedDeliveryBoy: req.user.id });
  if (!order) return next(new AppError('Order not found or not assigned to you', 404));

  order.orderStatus = status;
  order.statusTimeline.push({ status, message: `Order ${status.replace('_', ' ')} by delivery partner` });

  // Only mark as paid if NOT COD payment method
  // For COD orders, payment is collected via QR code after delivery
  if (status === 'delivered' && order.paymentMethod !== 'cod') {
    order.deliveredAt = new Date();
    order.paymentStatus = 'paid';
  } else if (status === 'delivered' && order.paymentMethod === 'cod') {
    order.deliveredAt = new Date();
  }

  await order.save();

  // Give referral reward when first order is delivered
  if (status === 'delivered' && order.user) {
    const referredUser = await User.findById(order.user);
    if (referredUser && referredUser.referredBy) {
      const referrer = await User.findById(referredUser.referredBy);
      if (referrer) {
        const hasAlreadyReceived = await Order.countDocuments({
          user: referredUser._id,
          orderStatus: 'delivered'
        }) > 1;

        if (!hasAlreadyReceived) {
          referrer.referralRewardsEarned += 50;
          referrer.referralRewardsUsed += 50;
          await referrer.save();
        }
      }
    }
  }
  sendResponse(res, 200, 'Order status updated', { order });
};

// @desc    Update delivery boy's current location
// @route   PUT /api/delivery/location
// @access  Private Delivery
const updateLocation = async (req, res, next) => {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    return next(new AppError('Latitude and longitude are required', 400));
  }

  await User.findByIdAndUpdate(req.user.id, {
    currentLocation: {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      updatedAt: new Date()
    }
  });

  sendResponse(res, 200, 'Location updated', {});
};

// @desc    Get delivery boy's current location for an order
// @route   GET /api/delivery/:orderId/location
// @access  Private Customer (order owner)
const getDeliveryLocation = async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  
  if (!order) {
    return next(new AppError('Order not found', 404));
  }

  // Only order owner or admin can see delivery location
  if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized', 403));
  }

  if (!order.assignedDeliveryBoy) {
    return next(new AppError('No delivery boy assigned', 404));
  }

  const deliveryBoy = await User.findById(order.assignedDeliveryBoy).select('name phone currentLocation');
  
  if (!deliveryBoy || !deliveryBoy.currentLocation || !deliveryBoy.currentLocation.lat) {
    return next(new AppError('Delivery boy location not available', 404));
  }

  sendResponse(res, 200, 'Delivery location', {
    deliveryBoy: {
      name: deliveryBoy.name,
      phone: deliveryBoy.phone,
      location: deliveryBoy.currentLocation
    },
    deliveryAddress: order.deliveryAddress
  });
};

module.exports = { getAssignedOrders, updateDeliveryStatus, updateLocation, getDeliveryLocation };
