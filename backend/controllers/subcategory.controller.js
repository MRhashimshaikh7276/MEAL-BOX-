const Subcategory = require('../models/Subcategory');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

const getSubcategories = async (req, res, next) => {
  const filter = {};
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  const subcategories = await Subcategory.find(filter).populate('categoryId', 'name');
  sendResponse(res, 200, 'Subcategories fetched', { count: subcategories.length, subcategories });
};

const createSubcategory = async (req, res, next) => {

  const { name, categoryId } = req.body;

  const category = await Category.findById(categoryId);

  if (!category)
    return next(new AppError('Category not found', 404));

  const imageData = req.file
    ? {
      image: `/uploads/subCategory/${req.file.filename}`,
      imagePublicId: req.file.filename
    }
    : {};

  // Convert status string to 'active' or 'inactive' if provided
  let status = 'active';
  if (req.body.status !== undefined) {
    const s = req.body.status;
    if (typeof s === 'string') {
      status = (s.toLowerCase() === 'true' || s.toLowerCase() === 'active') ? 'active' : 'inactive';
    } else {
      status = s ? 'active' : 'inactive';
    }
  }

  const subcategory = await Subcategory.create({
    name,
    categoryId,
    status,
    ...imageData
  });

  sendResponse(res, 201, 'Subcategory created', { subcategory });
};

const updateSubcategory = async (req, res, next) => {
  if (req.file) { req.body.image = `/uploads/subCategory/${req.file.filename}`; req.body.imagePublicId = req.file.filename; }
  
  // Convert status string to 'active' or 'inactive' if provided
  if (req.body.status !== undefined) {
    const s = req.body.status;
    if (typeof s === 'string') {
      req.body.status = (s.toLowerCase() === 'true' || s.toLowerCase() === 'active') ? 'active' : 'inactive';
    } else {
      req.body.status = s ? 'active' : 'inactive';
    }
  }
  
  const subcategory = await Subcategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!subcategory) return next(new AppError('Subcategory not found', 404));
  sendResponse(res, 200, 'Subcategory updated', { subcategory });
};

const deleteSubcategory = async (req, res, next) => {
  const subcategory = await Subcategory.findById(req.params.id);
  if (!subcategory) return next(new AppError('Subcategory not found', 404));
  await subcategory.deleteOne();
  sendResponse(res, 200, 'Subcategory deleted');
};

module.exports = { getSubcategories, createSubcategory, updateSubcategory, deleteSubcategory };
