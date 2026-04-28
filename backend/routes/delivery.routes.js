const express = require('express');
const router = express.Router();
const { getAssignedOrders, updateDeliveryStatus, updateLocation, getDeliveryLocation } = require('../controllers/delivery.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// Public route for customers to track delivery - needs to be before protect middleware
router.get('/:orderId/location', protect, getDeliveryLocation);

// Protected routes for delivery boys
router.use(protect, authorize('delivery', 'admin'));
router.get('/orders', getAssignedOrders);
router.put('/orders/:id/status', updateDeliveryStatus);
router.put('/location', updateLocation);

module.exports = router;
