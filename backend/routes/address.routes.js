const express = require('express');
const router = express.Router();
const { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } = require('../controllers/address.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);
router.get('/', getAddresses);
router.post('/', addAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/set-default', setDefaultAddress);

module.exports = router;
