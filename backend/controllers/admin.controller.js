const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboard = async (req, res, next) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalOrders, totalRevenue, totalUsers, totalProducts,
    todayOrders, monthlyRevenue, recentOrders, popularProducts,
    orderStatusBreakdown,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.find().sort('-createdAt').limit(10).populate('user', 'name email'),
    Product.find({ isAvailable: true }).sort('-totalOrders').limit(5),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  ]);

  sendResponse(res, 200, 'Dashboard data', {
    stats: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalUsers,
      totalProducts,
      todayOrders,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
    },
    recentOrders,
    popularProducts,
    orderStatusBreakdown,
  });
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isBlocked !== undefined) filter.isBlocked = req.query.isBlocked === 'true';
  if (req.query.search) filter.name = new RegExp(req.query.search, 'i');

  const users = await User.find(filter).sort('-createdAt').skip(skip).limit(limit);
  const total = await User.countDocuments(filter);

  sendResponse(res, 200, 'Users fetched', {
    total, page, limit, totalPages: Math.ceil(total / limit), users,
  });
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Admin
const blockUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new AppError('User not found', 404));
  if (user.role === 'admin') return next(new AppError('Cannot block admin users', 400));

  user.isBlocked = !user.isBlocked;
  await user.save();

  sendResponse(res, 200, `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, { user });
};

// @desc    Get delivery boys
// @route   GET /api/admin/delivery-boys
// @access  Admin
const getDeliveryBoys = async (req, res, next) => {
  const deliveryBoys = await User.find({ role: 'delivery' }).select('-password -refreshToken');
  sendResponse(res, 200, 'Delivery boys fetched', { deliveryBoys });
};

// @desc    Assign delivery boy to order
// @route   PUT /api/admin/orders/:orderId/assign
// @access  Admin
const assignDeliveryBoy = async (req, res, next) => {
  const { deliveryBoyId } = req.body;
  const Order = require('../models/Order');

  const order = await Order.findByIdAndUpdate(
    req.params.orderId,
    { assignedDeliveryBoy: deliveryBoyId },
    { new: true }
  ).populate('assignedDeliveryBoy', 'name phone');

  if (!order) return next(new AppError('Order not found', 404));

  // Notify delivery person about new assignment
  const io = req.app.get('io');
  if (io && order.assignedDeliveryBoy) {
    io.to('delivery-room').emit('new-order', {
      order: order,
      message: 'New order assigned to you!',
      timestamp: new Date(),
    });
  }

  sendResponse(res, 200, 'Delivery boy assigned', { order });
};

// @desc    Get revenue analytics
// @route   GET /api/admin/analytics
// @access  Admin
const getAnalytics = async (req, res, next) => {
  const days = parseInt(req.query.days) || 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Daily revenue and orders
  const dailyRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 },
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Category-wise revenue
  const categoryRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $unwind: '$items' },
    { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
    { $unwind: '$category' },
    { $group: { _id: '$category.name', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]);

  sendResponse(res, 200, 'Analytics', { dailyRevenue, categoryRevenue });
};

// @desc    Get comprehensive reports
// @route   GET /api/admin/reports
// @access  Admin
const getReports = async (req, res, next) => {
  const { startDate, endDate, type } = req.query;
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();

  try {
    // User reports
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          customers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
          deliveryBoys: { $sum: { $cond: [{ $eq: ['$role', 'delivery'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
        }
      }
    ]);

    // New users in date range
    const newUsers = await User.countDocuments({
      createdAt: { $gte: start, $lte: end }
    });

    // Order reports
    const orderStats = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalDeliveryFee: { $sum: '$deliveryFee' },
        }
      }
    ]);

    // Order status breakdown
    const orderStatusBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Payment method breakdown
    const paymentMethodBreakdown = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    // Top selling products
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 }
    ]);

    // Top categories by revenue
    const topCategories = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $lookup: { from: 'categories', localField: 'product.categoryId', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          orders: { $sum: 1 },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Daily orders trend
    const dailyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Delivery boy performance
    const deliveryPerformance = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, assignedDeliveryBoy: { $ne: null } } },
      {
        $group: {
          _id: '$assignedDeliveryBoy',
          totalDeliveries: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { totalDeliveries: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'deliveryBoy'
        }
      },
      { $unwind: '$deliveryBoy' },
      {
        $project: {
          name: '$deliveryBoy.name',
          phone: '$deliveryBoy.phone',
          totalDeliveries: 1,
          revenue: 1
        }
      }
    ]);

    // Product-wise sales
    const productSales = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product._id',
          productName: { $first: '$product.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 20 }
    ]);

    // Combo sales
    const comboSales = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $match: { 'items.comboId': { $ne: null } } },
      { $lookup: { from: 'combos', localField: 'items.comboId', foreignField: '_id', as: 'combo' } },
      { $unwind: '$combo' },
      {
        $group: {
          _id: '$combo._id',
          comboName: { $first: '$combo.comboName' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 10 }
    ]);

    // Hourly orders (for peak hours analysis)
    const hourlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Cancel reason analysis
    const cancelReasons = await Order.aggregate([
      { $match: { orderStatus: 'cancelled', createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$cancelReason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    sendResponse(res, 200, 'Reports', {
      userStats: userStats[0] || { totalUsers: 0, customers: 0, deliveryBoys: 0, admins: 0 },
      newUsers,
      orderStats: orderStats[0] || { totalOrders: 0, totalRevenue: 0, totalDiscount: 0, totalDeliveryFee: 0 },
      orderStatusBreakdown,
      paymentMethodBreakdown,
      topProducts,
      topCategories,
      dailyOrders,
      deliveryPerformance,
      productSales,
      comboSales,
      hourlyOrders,
      cancelReasons,
      dateRange: { start, end }
    });
  } catch (error) {
    console.error('Reports error:', error);
    sendResponse(res, 200, 'Reports', {
      userStats: { totalUsers: 0, customers: 0, deliveryBoys: 0, admins: 0 },
      newUsers: 0,
      orderStats: { totalOrders: 0, totalRevenue: 0, totalDiscount: 0, totalDeliveryFee: 0 },
      orderStatusBreakdown: [],
      paymentMethodBreakdown: [],
      topProducts: [],
      topCategories: [],
      dailyOrders: [],
      deliveryPerformance: [],
      productSales: [],
      comboSales: [],
      hourlyOrders: [],
      cancelReasons: []
    });
  }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Admin
const createUser = async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Name, email and password are required', 400));
  }

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    return next(new AppError('User with this email or phone already exists', 400));
  }

  // Don't hash password here - let User model's pre-save hook handle it
  const user = await User.create({
    name,
    email,
    phone,
    password, // Pass raw password - model will hash it automatically
    role: role || 'customer',
  });

  sendResponse(res, 201, 'User created successfully', { user: { ...user._doc, password: undefined } });
};

module.exports = { getDashboard, getUsers, blockUser, getDeliveryBoys, assignDeliveryBoy, getAnalytics, createUser, getReports };
