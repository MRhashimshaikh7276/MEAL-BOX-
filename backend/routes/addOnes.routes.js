const express = require('express');

const { getAddOnes, getAddOnesByProduct, createAddOne, updateAddOne, deleteAddOne } = require('../controllers/addOnes.controller');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

const createUploader = require('../middleware/upload.middleware');
const upload = createUploader('addOnes');

// Public routes - customers can view add-ons
router.get('/', getAddOnes);
router.get('/by-product', getAddOnesByProduct);

// Admin protected routes
router.use(protect, authorize('admin'))
router.post('/', upload.single('image'), createAddOne);
router.put('/:id', upload.single('image'), updateAddOne);
router.delete('/:id', deleteAddOne);

module.exports = router;