const express = require('express');
const router = express.Router();
const { placeOrder, getMyOrders, getOrder, cancelOrder, getAllOrders, updateOrderStatus, generatePaymentQR, markOrderPaid, updatePreparationTime, getCODCollections } = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.post('/', placeOrder);
router.get('/', getMyOrders);
router.get('/admin/all', authorize('admin'), getAllOrders);
router.get('/admin/cod-collections', authorize('admin'), getCODCollections);
// Specific routes must come before :id parameter routes
router.get('/:id/payment-qr', generatePaymentQR);
router.put('/:id/mark-paid', markOrderPaid);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.patch('/:id/preparation-time', authorize('admin'), updatePreparationTime);
router.get('/:id', getOrder);

module.exports = router;
