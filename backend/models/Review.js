const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Minimum rating is 1'],
    max: [5, 'Maximum rating is 5'],
  },
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
  },
  images: [String],
  isVerified: {
    type: Boolean,
    default: false, // verified purchase
  },
}, { timestamps: true });

// One review per user per product per order
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });
reviewSchema.index({ product: 1 });
reviewSchema.index({ rating: -1 });

// Update product rating after review save
reviewSchema.post('save', async function () {
  const Product = require('./Product');
  const stats = await this.constructor.aggregate([
    { $match: { product: this.product } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
