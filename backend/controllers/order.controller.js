const mongoose = require('mongoose');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Combo = require('../models/Combo');
const Offer = require('../models/Offer');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const QRCode = require('qrcode');

const DELIVERY_FEE = 40;
const FREE_DELIVERY_THRESHOLD = 299;

// @desc    Place order
// @route   POST /api/orders
// @access  Private Customer
const placeOrder = async (req, res, next) => {
  const { addressId, deliveryAddress, paymentMethod, notes, couponCode, totalAmount, items: orderItems } = req.body;

  // Get address from addressId or use provided deliveryAddress
  let finalDeliveryAddress = deliveryAddress;
  if (addressId) {
    const Address = require('../models/Address');
    const address = await Address.findById(addressId);
    if (!address) return next(new AppError('Address not found', 404));
    finalDeliveryAddress = {
      fullName: address.fullName,
      phone: address.phone,
      fullAddress: address.fullAddress,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      lat: address.location?.lat,
      lng: address.location?.lng,
    };
  }

  // If items provided directly (from frontend), use them; otherwise get from cart
  let cart;
  let subtotal, discount;
  
  if (orderItems && orderItems.length > 0) {
    // Calculate from provided items
    subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    discount = 0;
    
    // Validate coupon if provided
    if (couponCode) {
      const Offer = require('../models/Offer');
      const offer = await Offer.findOne({ couponCode: couponCode.toUpperCase(), isActive: true });
      if (offer) {
        if (offer.discountType === 'percentage') {
          discount = (subtotal * offer.discountValue) / 100;
        } else {
          discount = offer.discountValue;
        }
        await Offer.findByIdAndUpdate(offer._id, { $inc: { usedCount: 1 } });
      }
    }
  } else {
    // Get from cart - populate both product and combo
    cart = await Cart.findOne({ user: req.user.id })
      .populate('items.product')
      .populate('items.comboId');
    if (!cart || cart.items.length === 0) return next(new AppError('Cart is empty', 400));

    // Validate all products and combos are available
    for (const item of cart.items) {
      if (item.product && !item.product.isAvailable) {
        return next(new AppError(`${item.product.name} is currently unavailable. Remove it from cart.`, 400));
      }
      if (item.comboId && item.comboId.status !== 'active') {
        return next(new AppError(`${item.comboId.comboName} is currently unavailable. Remove it from cart.`, 400));
      }
    }

    subtotal = cart.totalAmount;
    discount = cart.discountAmount || 0;
  }

  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const finalTotalAmount = subtotal - discount + deliveryFee;

  // Calculate preparation time based on order items (maximum of all items)
  let preparationTime = 15; // default
  let items = [];
  
  if (orderItems && orderItems.length > 0) {
    // Items provided directly - calculate max prep time from items
    const maxPrepTime = Math.max(...orderItems.map(item => item.preparationTime || 15), 15);
    preparationTime = maxPrepTime;
    
    items = orderItems.map(item => ({
      product: item.productId,
      comboId: item.comboId,
      name: item.name || 'Item',
      price: item.price,
      quantity: item.quantity,
      image: item.image || '',
    }));
  } else {
    // Get from cart - calculate max prep time from cart items
    const cartWithItems = await Cart.findOne({ user: req.user.id })
      .populate('items.product', 'name images preparationTime')
      .populate('items.comboId', 'comboName comboImage preparationTime');
    
    let maxPrepTime = 15;
    for (const item of cartWithItems.items) {
      if (item.product && item.product.preparationTime) {
        maxPrepTime = Math.max(maxPrepTime, item.product.preparationTime);
      }
      if (item.comboId && item.comboId.preparationTime) {
        maxPrepTime = Math.max(maxPrepTime, item.comboId.preparationTime);
      }
    }
    preparationTime = maxPrepTime;
    
    items = cartWithItems.items.map(item => {
      if (item.product) {
        return {
          product: item.product._id,
          name: item.product.name,
          price: item.price,
          quantity: item.quantity,
          image: item.product.images[0]?.url || '',
        };
      } else if (item.comboId) {
        return {
          comboId: item.comboId._id,
          name: item.comboId.comboName,
          price: item.price,
          quantity: item.quantity,
          image: item.comboId.comboImage || '',
        };
      }
    });
  }

  const order = await Order.create({
    user: req.user.id,
    items: items,
    deliveryAddress: finalDeliveryAddress,
    paymentMethod,
    subtotal,
    discount,
    referralDiscount: req.body.referralDiscount || 0,
    deliveryFee,
    totalAmount: totalAmount || finalTotalAmount,
    coupon: cart?.couponApplied || null,
    notes,
    preparationTime,
    statusTimeline: [{ status: 'pending', message: 'Order placed successfully' }],
  });

  // Update user's referral rewards used
  if (req.body.referralDiscount && req.body.referralDiscount > 0) {
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { referralRewardsUsed: req.body.referralDiscount }
    });
  }

  // Update product and combo total orders
  if (cart) {
    for (const item of cart.items) {
      if (item.product) {
        await Product.findByIdAndUpdate(item.product._id, { $inc: { totalOrders: item.quantity } });
      }
      if (item.comboId) {
        const Combo = require('../models/Combo');
        await Combo.findByIdAndUpdate(item.comboId._id, { $inc: { totalOrders: item.quantity } });
      }
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user.id }, { items: [], totalAmount: 0, couponApplied: null, discountAmount: 0 });
  }

  // Create payment record for COD
  if (paymentMethod === 'cod') {
    await Payment.create({ order: order._id, user: req.user.id, amount: totalAmount || finalTotalAmount, method: 'cod', status: 'pending' });
  }

  // Send confirmation email
  try {
    const template = emailTemplates.orderConfirmation(req.user.name, order.orderNumber, totalAmount || finalTotalAmount);
    await sendEmail({ to: req.user.email, ...template });
  } catch (err) {
    console.error('Order email failed:', err.message);
  }

  const populatedOrder = await Order.findById(order._id)
    .populate('items.product', 'name images preparationTime')
    .populate('items.comboId', 'comboName comboImage preparationTime');
  
  // Emit new order notification to admin
  const io = req.app.get('io');
  if (io) {
    io.to('admin-room').emit('new-order', {
      order: populatedOrder,
      message: 'New order received!',
      timestamp: new Date(),
    });
    
    // Also notify delivery person if assigned
    if (order.assignedDeliveryBoy) {
      io.to('delivery-room').emit('new-order', {
        order: populatedOrder,
        message: 'New order assigned to you!',
        timestamp: new Date(),
      });
    }
  }
  
  sendResponse(res, 201, 'Order placed successfully! 🎉', { order: populatedOrder });
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const orders = await Order.find({ user: req.user.id })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate('assignedDeliveryBoy', 'name phone');

  const total = await Order.countDocuments({ user: req.user.id });

  // Resolve product/combo images for each order item
  const Product = require('../models/Product');
  const Combo = require('../models/Combo');

  for (const order of orders) {
    for (const item of order.items) {
      // Check if image is missing or is a short ID
      const isShortId = item.image && item.image.length === 24;
      if (!item.image || isShortId) {
        // Try to get image from product reference
        if (item.product) {
          try {
            const productId = item.product instanceof mongoose.Types.ObjectId
              ? item.product
              : new mongoose.Types.ObjectId(item.product);
            const product = await Product.findById(productId).select('images');
            if (product && product.images && product.images[0] && product.images[0].url) {
              item.image = product.images[0].url;
            }
          } catch (err) {
            console.log('Error fetching product image:', err.message);
          }
        }
        // Try to get image from combo reference
        if (!item.image || !item.image.startsWith('http')) {
          if (item.comboId) {
            try {
              const comboId = item.comboId instanceof mongoose.Types.ObjectId
                ? item.comboId
                : new mongoose.Types.ObjectId(item.comboId);
              const combo = await Combo.findById(comboId).select('comboImage');
              if (combo && combo.comboImage) {
                item.image = combo.comboImage;
              }
            } catch (err) {
              console.log('Error fetching combo image:', err.message);
            }
          }
        }
      }
    }
  }

  sendResponse(res, 200, 'Orders fetched', {
    total, page, limit,
    totalPages: Math.ceil(total / limit),
    orders,
  });
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res, next) => {
  let order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('assignedDeliveryBoy', 'name phone');

  if (!order) return next(new AppError('Order not found', 404));

  // Customers can only see their own orders
  if (req.user.role === 'customer' && order.user._id.toString() !== req.user.id) {
    return next(new AppError('Not authorized to view this order', 403));
  }

  // Manually fetch images for each order item that doesn't have an image stored
  const Product = require('../models/Product');
  const Combo = require('../models/Combo');
  
  for (const item of order.items) {
    // Check if image is missing, or if it's a short ID (24 chars - looks like a product ID)
    const isShortId = item.image && item.image.length === 24;
    if (!item.image || isShortId) {
      // Try to get image from product reference
      if (item.product) {
        try {
          const productId = item.product instanceof mongoose.Types.ObjectId 
            ? item.product 
            : new mongoose.Types.ObjectId(item.product);
          const product = await Product.findById(productId).select('images');
          if (product && product.images && product.images[0] && product.images[0].url) {
            item.image = product.images[0].url;
          }
        } catch (err) {
          console.log('Error fetching product image:', err.message);
        }
      }
      // Try to get image from combo reference
      if (!item.image || !item.image.startsWith('http')) {
        if (item.comboId) {
          try {
            const comboId = item.comboId instanceof mongoose.Types.ObjectId 
              ? item.comboId 
              : new mongoose.Types.ObjectId(item.comboId);
            const combo = await Combo.findById(comboId).select('comboImage');
            if (combo && combo.comboImage) {
              item.image = combo.comboImage;
            }
          } catch (err) {
            console.log('Error fetching combo image:', err.message);
          }
        }
      }
    }
  }

  sendResponse(res, 200, 'Order fetched', { order });
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private Customer
const cancelOrder = async (req, res, next) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
  if (!order) return next(new AppError('Order not found', 404));

  const cancellableStatuses = ['pending',];
  if (!cancellableStatuses.includes(order.orderStatus)) {
    return next(new AppError('Order cannot be cancelled at this stage', 400));
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.cancelReason = req.body.reason || 'Cancelled by customer';
  order.statusTimeline.push({ status: 'cancelled', message: order.cancelReason });
  await order.save();

  sendResponse(res, 200, 'Order cancelled', { order });
};

// @desc    Admin - Get all orders
// @route   GET /api/orders/admin/all
// @access  Admin
const getAllOrders = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.orderStatus = req.query.status;
  if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
  if (req.query.date) {
    const startOfDay = new Date(req.query.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(req.query.date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }

  const orders = await Order.find(filter)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email phone')
    .populate('assignedDeliveryBoy', 'name phone');

  const total = await Order.countDocuments(filter);

  // Resolve product/combo images for each order item
  const Product = require('../models/Product');
  const Combo = require('../models/Combo');

  for (const order of orders) {
    for (const item of order.items) {
      // Check if image is missing or is a short ID
      const isShortId = item.image && item.image.length === 24;
      if (!item.image || isShortId) {
        // Try to get image from product reference
        if (item.product) {
          try {
            const productId = item.product instanceof mongoose.Types.ObjectId
              ? item.product
              : new mongoose.Types.ObjectId(item.product);
            const product = await Product.findById(productId).select('images');
            if (product && product.images && product.images[0] && product.images[0].url) {
              item.image = product.images[0].url;
            }
          } catch (err) {
            console.log('Error fetching product image:', err.message);
          }
        }
        // Try to get image from combo reference
        if (!item.image || !item.image.startsWith('http')) {
          if (item.comboId) {
            try {
              const comboId = item.comboId instanceof mongoose.Types.ObjectId
                ? item.comboId
                : new mongoose.Types.ObjectId(item.comboId);
              const combo = await Combo.findById(comboId).select('comboImage');
              if (combo && combo.comboImage) {
                item.image = combo.comboImage;
              }
            } catch (err) {
              console.log('Error fetching combo image:', err.message);
            }
          }
        }
      }
    }
  }

  sendResponse(res, 200, 'All orders', {
    total, page, limit,
    totalPages: Math.ceil(total / limit),
    orders,
  });
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
const updateOrderStatus = async (req, res, next) => {
  const { status, message, deliveryBoyId, preparationTime, deliveryTime } = req.body;

  const validStatuses = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) return next(new AppError('Invalid status', 400));

  const order = await Order.findById(req.params.id).populate('user', 'name email phone fcmToken');
  if (!order) return next(new AppError('Order not found', 404));

  const previousStatus = order.orderStatus;
  order.orderStatus = status;
  order.statusTimeline.push({ status, message: message || `Order ${status}` });

  if (status === 'preparing') {
    order.preparingStartedAt = new Date();
    if (preparationTime) {
      order.preparationTime = preparationTime;
    }
  } else if (status === 'preparing' && order.preparingCompletedAt) {
    order.preparingCompletedAt = new Date();
  } else if (status === 'out_for_delivery') {
    order.outForDeliveryAt = new Date();
    order.preparingCompletedAt = new Date();
    if (deliveryTime) {
      order.deliveryBoyEstimatedTime = deliveryTime;
    }
    const totalPrepTime = order.preparationTime || 15;
    const totalDeliveryTime = order.deliveryBoyEstimatedTime || 0;
    order.estimatedDeliveryTime = totalPrepTime + totalDeliveryTime;
  } else if (status === 'delivered') {
    order.deliveredAt = new Date();
    if (order.paymentMethod !== 'cod') {
      order.paymentStatus = 'paid';
    }
  }

  if (deliveryBoyId) order.assignedDeliveryBoy = deliveryBoyId;

  if (preparationTime) order.preparationTime = preparationTime;

  await order.save();

  // Send notifications
  const io = req.app.get('io');
  const { sendPushNotification, getOrderStatusMessage } = require('../utils/sendNotification');

  // 1. Socket.io real-time notification to customer room
  if (io && order.user) {
    const userRoom = `user-${order.user._id}`;
    io.to(userRoom).emit('order-status-update', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status,
      message: message || getOrderStatusMessage(status, order).body,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      preparationTime: order.preparationTime,
      deliveryBoyEstimatedTime: order.deliveryBoyEstimatedTime,
      timestamp: new Date(),
    });
  }

  // 2. Push notification (FCM) if user has FCM token
  if (order.user?.fcmToken && previousStatus !== status) {
    const notification = getOrderStatusMessage(status, order);
    sendPushNotification(
      order.user.fcmToken,
      notification.title,
      notification.body,
      {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status,
        estimatedDeliveryTime: order.estimatedDeliveryTime?.toString() || '',
      }
    );
  }

  sendResponse(res, 200, 'Order status updated', { order });
};

// @desc    Generate payment QR for COD orders
// @route   GET /api/orders/:id/payment-qr
// @access  Private (Delivery Boy)
const generatePaymentQR = async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) return next(new AppError('Order not found', 404));
  
  // Only allow for COD orders
  if (order.paymentMethod !== 'cod') {
    return next(new AppError('QR code is only available for COD orders', 400));
  }
  
  // Only allow if order is out for delivery or delivered
  if (!['out_for_delivery', 'delivered'].includes(order.orderStatus)) {
    return next(new AppError('Order must be out for delivery or delivered', 400));
  }
  
  // Generate QR data with order details
  const qrData = JSON.stringify({
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    amount: order.totalAmount,
    currency: 'INR',
    method: 'COD_QR',
    timestamp: new Date().toISOString()
  });
  
  // Generate QR code as data URL
  const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
  
  sendResponse(res, 200, 'QR code generated', {
    qrCode: qrCodeDataURL,
    orderId: order._id,
    orderNumber: order.orderNumber,
    amount: order.totalAmount,
    paymentStatus: order.paymentStatus
  });
};

// @desc    Mark COD order as paid
// @route   PUT /api/orders/:id/mark-paid
// @access  Private (Delivery Boy)
const markOrderPaid = async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) return next(new AppError('Order not found', 404));
  
  // Only allow for COD orders
  if (order.paymentMethod !== 'cod') {
    return next(new AppError('This function is only for COD orders', 400));
  }
  
  // Update payment status with collection info
  order.paymentStatus = 'paid';
  order.codCollectedAt = new Date();
  order.codCollectedBy = req.user.id;
  order.codCollectionNote = req.body.note || 'Payment received via QR';
  order.statusTimeline.push({ 
    status: order.orderStatus, 
    message: `COD Payment collected by delivery partner (${req.user.name || 'Delivery Boy'})` 
  });
  
  await order.save();
  
  // Update payment record
  await Payment.findOneAndUpdate(
    { order: order._id },
    { status: 'paid' }
  );
  
  sendResponse(res, 200, 'Payment marked as paid', { order });
};

// @desc    Update preparation time for an order
// @route   PATCH /api/orders/:id/preparation-time
// @access  Admin
const updatePreparationTime = async (req, res, next) => {
  const { preparationTime } = req.body;
  
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError('Order not found', 404));
  }
  
  order.preparationTime = preparationTime;
  await order.save();
  
  sendResponse(res, 200, 'Preparation time updated', { order });
};

// @desc    Get COD Collections summary for Admin
// @route   GET /api/orders/admin/cod-collections
// @access  Admin
const getCODCollections = async (req, res, next) => {
  const { date, deliveryBoyId } = req.query;
  
  // Build filter for COD orders
  const filter = { paymentMethod: 'cod' };
  
  // Filter by specific date
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
  }
  
  // Filter by delivery boy
  if (deliveryBoyId) {
    filter.assignedDeliveryBoy = deliveryBoyId;
  }
  
  // Get all COD orders with this filter
  const codOrders = await Order.find(filter)
    .populate('assignedDeliveryBoy', 'name phone')
    .populate('user', 'name phone')
    .sort('-createdAt');
  
  // Calculate totals
  const totalCODAmount = codOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const collectedAmount = codOrders
    .filter(order => order.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingAmount = codOrders
    .filter(order => order.paymentStatus === 'pending')
    .reduce((sum, order) => sum + order.totalAmount, 0);
  
  // Group by delivery boy
  const byDeliveryBoy = {};
  for (const order of codOrders) {
    if (order.assignedDeliveryBoy) {
      const boyId = order.assignedDeliveryBoy._id.toString();
      if (!byDeliveryBoy[boyId]) {
        byDeliveryBoy[boyId] = {
          deliveryBoy: order.assignedDeliveryBoy,
          totalOrders: 0,
          totalAmount: 0,
          collected: 0,
          pending: 0,
        };
      }
      byDeliveryBoy[boyId].totalOrders += 1;
      byDeliveryBoy[boyId].totalAmount += order.totalAmount;
      if (order.paymentStatus === 'paid') {
        byDeliveryBoy[boyId].collected += order.totalAmount;
      } else {
        byDeliveryBoy[boyId].pending += order.totalAmount;
      }
    }
  }
  
  // Group by status
  const byStatus = {
    pending: codOrders.filter(o => o.paymentStatus === 'pending').length,
    paid: codOrders.filter(o => o.paymentStatus === 'paid').length,
  };
  
  sendResponse(res, 200, 'COD Collections', {
    totalOrders: codOrders.length,
    totalCODAmount,
    collectedAmount,
    pendingAmount,
    byDeliveryBoy: Object.values(byDeliveryBoy),
    byStatus,
    orders: codOrders,
  });
};

module.exports = { 
  placeOrder, getMyOrders, getOrder, cancelOrder, getAllOrders, 
  updateOrderStatus, generatePaymentQR, markOrderPaid, updatePreparationTime,
  getCODCollections 
};
