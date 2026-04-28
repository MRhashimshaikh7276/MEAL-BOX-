const express = require('express');
const router = express.Router();
const { getOffers, getAllOffers, createOffer, updateOffer, deleteOffer, validateCoupon } = require('../controllers/offer.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', getOffers);
router.post('/validate', protect, validateCoupon);

router.use(protect, authorize('admin'));
router.get('/admin/all', getAllOffers);
router.post('/', createOffer);
router.put('/:id', updateOffer);
router.delete('/:id', deleteOffer);

module.exports = router;
