const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon } = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId', removeFromCart);
router.delete('/remove-item', removeFromCart);
router.delete('/clear', clearCart);
router.post('/apply-coupon', applyCoupon);
router.delete('/remove-coupon', removeCoupon);

module.exports = router;
