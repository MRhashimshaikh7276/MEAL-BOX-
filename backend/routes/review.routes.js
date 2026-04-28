const express = require('express');
const router = express.Router();
const { getProductReviews, addReview, deleteReview } = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');
const sendResponse = require('../utils/sendResponse');
const Review = require('../models/Review');

router.get('/product/:productId', getProductReviews);

// Get restaurant overall stats
router.get('/stats', async (req, res) => {
  try {
    const reviews = await Review.find();
    console.log('Reviews found:', reviews.length);
    
    if (reviews.length === 0) {
      return sendResponse(res, 200, 'Stats fetched', { rating: 0, reviewsCount: 0 });
    }
    
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;
    console.log('Average rating:', averageRating);
    
    sendResponse(res, 200, 'Stats fetched', {
      rating: averageRating,
      reviewsCount: reviews.length
    });
  } catch (error) {
    console.log('Stats error:', error);
    sendResponse(res, 500, error.message);
  }
});

router.use(protect);
router.post('/', addReview);
router.delete('/:id', deleteReview);

module.exports = router;
