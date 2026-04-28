const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  const { status } = req.query;
  const filter = {};
  if (status !== undefined) {
    if (status === 'active' || status === 'inactive') {
      filter.status = status;
    } else if (status === 'true' || status.toLowerCase() === 'active') {
      filter.status = 'active';
    } else if (status === 'false' || status.toLowerCase() === 'inactive') {
      filter.status = 'inactive';
    }
  }

  const categories = await Category.find(filter).sort('name');
  sendResponse(res, 200, 'Categories fetched', { count: categories.length, categories });
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
const getCategory = async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));
  sendResponse(res, 200, 'Category fetched', { category });
};

// @desc    Create category
// @route   POST /api/categories
// @access  Admin
const createCategory = async (req, res, next) => {
  let { name, status } = req.body;

 const image = req.file
    ? `/uploads/Category/${req.file.filename}`
    : "";

  // normalize status value to 'active' or 'inactive'; accept strings like 'active','inactive','true','false'
  if (status !== undefined) {
    if (typeof status === 'string') {
      const s = status.toLowerCase();
      status = (s === 'true' || s === 'active') ? 'active' : 'inactive';
    } else {
      status = status ? 'active' : 'inactive';
    }
  }

  const category = await Category.create({ name, status,image });
  sendResponse(res, 201, 'Category created', { category });
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Admin
const updateCategory = async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));

  if (req.file) {
    if (category.imagePublicId) 
    req.body.image = `/uploads/Category/${req.file.filename}`;
    req.body.imagePublicId = req.file.filename;
  }

  // coerce status if provided
  if (req.body.status !== undefined) {
    let s = req.body.status;
    if (typeof s === 'string') {
      const sl = s.toLowerCase();
      req.body.status = (sl === 'true' || sl === 'active') ? 'active' : 'inactive';
    } else {
      req.body.status = s ? 'active' : 'inactive';
    }
  }

  const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  sendResponse(res, 200, 'Category updated', { category: updated });
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Admin
const deleteCategory = async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('Category not found', 404));

  // Check if subcategories exist
  const subcategoriesCount = await Subcategory.countDocuments({ categoryId: req.params.id });
  if (subcategoriesCount > 0) {
    return next(new AppError('Cannot delete category with subcategories. Delete subcategories first.', 400));
  }

  if (category.imagePublicId) 
  await category.deleteOne();
  sendResponse(res, 200, 'Category deleted');
};

module.exports = { getCategories, getCategory, createCategory, updateCategory, deleteCategory };
