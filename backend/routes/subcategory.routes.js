const express = require('express');
const router = express.Router();
const { getSubcategories, createSubcategory, updateSubcategory, deleteSubcategory } = require('../controllers/subcategory.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const createUploader = require('../middleware/upload.middleware');
const upload = createUploader('subCategory');
router.get('/', getSubcategories);
router.use(protect, authorize('admin'));
router.post('/', upload.single('image'), createSubcategory);
router.put('/:id', upload.single('image'), updateSubcategory);
router.delete('/:id', deleteSubcategory);

module.exports = router;
