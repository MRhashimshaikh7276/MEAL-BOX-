const Product = require('../models/Product');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
// const { cloudinary } = require('../config/cloudinary');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  const features = new APIFeatures(Product.find(), req.query)
    .filter()
    .search(['name', 'description', 'tags'])
    .sort()
    .limitFields()
    .paginate();

  // Populate categories
  features.query = features.query
    .populate('categoryId', 'name')
    .populate('subcategoryId', 'name')
    .populate('subsubcategoryId', 'name');

  const products = await features.query;
  const total = await Product.countDocuments(features.query._conditions);

  sendResponse(res, 200, 'Products fetched', {
    total,
    page: features.page,
    limit: features.limit,
    totalPages: Math.ceil(total / features.limit),
    products,
  });
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('categoryId', 'name')
    .populate('subcategoryId', 'name')
    .populate('subsubcategoryId', 'name');

  if (!product) return next(new AppError('Product not found', 404));
  sendResponse(res, 200, 'Product fetched', { product });
};

// @desc    Create product
// @route   POST /api/products
// @access  Admin
const createProduct = async (req, res, next) => {

  const imageData = req.files
    ? req.files.map(file => ({
      url: `/uploads/product/${file.filename}`
    }))
    : [];
  const product = await Product.create({ ...req.body, images: imageData });
  sendResponse(res, 201, 'Product created', { product });
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res, next) => {

  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));

  if (req.files && req.files.length > 0) {

    // delete old local files
    const fs = require('fs');
    const path = require('path');

    for (const img of product.images) {
      const filePath = path.join(__dirname, '..', img.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    req.body.images = req.files.map(file => ({
      url: `/uploads/product/${file.filename}`
    }));
  }

  const updated = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  sendResponse(res, 200, 'Product updated', { product: updated });
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res, next) => {

  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));

  const fs = require('fs');
  const path = require('path');

  for (const img of product.images) {
    const filePath = path.join(__dirname, '..', img.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await product.deleteOne();

  sendResponse(res, 200, 'Product deleted');
};

// @desc    Get featured/popular products
// @route   GET /api/products/popular
// @access  Public
const getPopularProducts = async (req, res, next) => {
  const products = await Product.find({ isAvailable: true })
    .sort('-totalOrders -rating')
    .limit(10)
    .populate('categoryId', 'name');
  sendResponse(res, 200, 'Popular products', { products });
};

// @desc    Toggle product availability
// @route   PATCH /api/products/:id/availability
// @access  Admin
const toggleAvailability = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new AppError('Product not found', 404));
  product.isAvailable = !product.isAvailable;
  await product.save();
  sendResponse(res, 200, `Product ${product.isAvailable ? 'enabled' : 'disabled'}`, { product });
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getPopularProducts, toggleAvailability };
