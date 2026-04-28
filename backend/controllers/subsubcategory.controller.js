const SubSubcategory = require('../models/SubSubcategory');
const AppError = require('../utils/AppError');

const sendResponse = require('../utils/sendResponse');

const getSubSubcategories = async (req, res, next) => {
  const filter = {};
  if (req.query.subcategoryId) filter.subcategoryId = req.query.subcategoryId;
  // populate the immediate parent subcategory and also its category so that
  // the front end can easily determine which category a sub‑subcategory belongs
  // to (useful when editing and for display purposes).
  const data = await SubSubcategory.find(filter).populate({
    path: 'subcategoryId',
    select: 'name categoryId',
    populate: { path: 'categoryId', select: 'name' }
  });
  
  sendResponse(res, 200, 'Fetched', { count: data.length, subsubcategories: data });
};

const path = require('path');

const createSubSubcategory = async (req, res, next) => {

  let imagePath = '';

  if (req.file) {
    imagePath = `/uploads/subSubCategory/${req.file.filename}`;
  }

  // Convert status string to 'active' or 'inactive' if provided
  let status = req.body.status;
  if (status !== undefined) {
    if (typeof status === 'string') {
      status = (status.toLowerCase() === 'true' || status.toLowerCase() === 'active') ? 'active' : 'inactive';
    } else {
      status = status ? 'active' : 'inactive';
    }
  } else {
    status = 'active';
  }

  const sub = await SubSubcategory.create({

    name: req.body.name,
    subcategoryId: req.body.subcategoryId,
    status: status,
    image: imagePath

  });
  sendResponse(res, 201, 'Created', { subsubcategory: sub });
};

const updateSubSubcategory = async (req, res, next) => {

  // Convert status string to 'active' or 'inactive' if provided
  let status = req.body.status;
  if (status !== undefined) {
    if (typeof status === 'string') {
      status = (status.toLowerCase() === 'true' || status.toLowerCase() === 'active') ? 'active' : 'inactive';
    } else {
      status = status ? 'active' : 'inactive';
    }
  }

  const updateData = {

    name: req.body.name,
    subcategoryId: req.body.subcategoryId,
    status: status,

  };
  if (req.file) {
    updateData.image = `/uploads/subSubCategory/${req.file.filename}`;
  }
  const sub = await SubSubcategory.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  if (!sub) return next(new AppError('Not found', 404));

  sendResponse(res, 200, 'Updated', { subsubcategory: sub });
};

const deleteSubSubcategory = async (req, res, next) => {
  const sub = await SubSubcategory.findById(req.params.id);
  if (!sub) return next(new AppError('Not found', 404));
  await sub.deleteOne();
  sendResponse(res, 200, 'Deleted');
};

module.exports = { getSubSubcategories, createSubSubcategory, updateSubSubcategory, deleteSubSubcategory };
