const Review = require('../models/Review');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

const getProductReviews = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name avatar')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ product: req.params.productId });
  sendResponse(res, 200, 'Reviews fetched', { total, reviews });
};

const addReview = async (req, res, next) => {
  const { productId, orderId, rating, comment } = req.body;

  // If orderId not provided, find the most recent delivered order containing this product
  let order;
  if (orderId) {
    order = await Order.findOne({ _id: orderId, user: req.user.id, orderStatus: 'delivered' });
  } else {
    order = await Order.findOne({ user: req.user.id, orderStatus: 'delivered', 'items.product': productId }).sort('-deliveredAt');
  }
  if (!order) return next(new AppError('You can only review products from delivered orders', 400));

  // Check product was in that order
  const orderHasProduct = order.items.some(item => item.product.toString() === productId);
  if (!orderHasProduct) return next(new AppError('This product was not in your order', 400));

  // Check if review already exists for this product in this order
  const existingReview = await Review.findOne({ user: req.user.id, product: productId, order: order._id });
  if (existingReview) return next(new AppError('You have already reviewed this product in this order', 400));

  const review = await Review.create({
    user: req.user.id,
    product: productId,
    order: order._id,
    rating,
    comment,
    isVerified: true,
  });

  await review.populate('user', 'name avatar');
  sendResponse(res, 201, 'Review added', { review });
};

const deleteReview = async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) return next(new AppError('Review not found', 404));

  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to delete this review', 403));
  }

  await review.deleteOne();
  sendResponse(res, 200, 'Review deleted');
};

module.exports = { getProductReviews, addReview, deleteReview };
