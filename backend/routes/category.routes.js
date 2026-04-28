const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { getCategories, getCategory, createCategory, updateCategory, deleteCategory } = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const createUploader = require('../middleware/upload.middleware');

const upload = createUploader('Category');

router.get('/', getCategories);
router.get('/:id', getCategory);

router.use(protect, authorize('admin'));
router.post('/', upload.single('image'), createCategory);
router.put('/:id', upload.single('image'), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router;
