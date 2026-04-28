const express = require('express');
const router = express.Router();
const { getSubSubcategories, createSubSubcategory, updateSubSubcategory, deleteSubSubcategory } = require('../controllers/subsubcategory.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const createUploader = require('../middleware/upload.middleware');
const upload = createUploader('subSubCategory');
router.get('/', getSubSubcategories);
router.use(protect, authorize('admin'));
router.post('/',  upload.single('image'), createSubSubcategory);
router.put('/:id', upload.single('image'), updateSubSubcategory);
router.delete('/:id', deleteSubSubcategory);

module.exports = router;
