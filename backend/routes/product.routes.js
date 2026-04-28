const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getPopularProducts, toggleAvailability } = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const createUploader = require('../middleware/upload.middleware');
const upload = createUploader('product'); // uploads/product
router.get('/popular', getPopularProducts);
router.get('/', getProducts);
router.get('/:id', getProduct);

router.use(protect, authorize('admin'));
router.post('/', upload.array('images', 5), createProduct);
router.put('/:id', upload.array('images', 5), updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/availability', toggleAvailability);

module.exports = router;
