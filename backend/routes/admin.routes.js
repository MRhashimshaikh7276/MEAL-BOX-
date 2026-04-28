const express = require('express');
const router = express.Router();
const { getDashboard, getUsers, blockUser, getDeliveryBoys, assignDeliveryBoy, getAnalytics, createUser, getReports } = require('../controllers/admin.controller');
const { getAllOrders } = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.get('/reports', getReports);
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id/block', blockUser);
router.get('/delivery-boys', getDeliveryBoys);
router.put('/orders/:orderId/assign', assignDeliveryBoy);
// list all orders (mirrors /api/orders/admin/all)
router.get('/orders', getAllOrders);

module.exports = router;
