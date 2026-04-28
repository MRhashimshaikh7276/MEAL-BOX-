const Address = require('../models/Address');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

const getAddresses = async (req, res, next) => {
  const addresses = await Address.find({ user: req.user.id }).sort('-isDefault -createdAt');
  sendResponse(res, 200, 'Addresses fetched', { addresses });
};

const addAddress = async (req, res, next) => {
  const count = await Address.countDocuments({ user: req.user.id });

  // If first address, set as default
  if (count === 0) req.body.isDefault = true;

  // If setting as default, unset others
  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user.id }, { isDefault: false });
  }

  // Build address data
  const addressData = {
    user: req.user.id,
    label: req.body.label,
    fullName: req.body.fullName,
    phone: req.body.phone,
    fullAddress: req.body.fullAddress,
    landmark: req.body.landmark,
    city: req.body.city,
    state: req.body.state,
    pincode: req.body.pincode,
    isDefault: req.body.isDefault,
  };

  // Add location if provided
  if (req.body.location && req.body.location.lat && req.body.location.lng) {
    addressData.location = {
      lat: parseFloat(req.body.location.lat),
      lng: parseFloat(req.body.location.lng)
    };
  }

  const address = await Address.create(addressData);
  sendResponse(res, 201, 'Address added', { address });
};

const updateAddress = async (req, res, next) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
  if (!address) return next(new AppError('Address not found', 404));

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user.id }, { isDefault: false });
  }

  const updated = await Address.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  sendResponse(res, 200, 'Address updated', { address: updated });
};

const deleteAddress = async (req, res, next) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user.id });
  if (!address) return next(new AppError('Address not found', 404));
  await address.deleteOne();
  sendResponse(res, 200, 'Address deleted');
};

const setDefaultAddress = async (req, res, next) => {
  await Address.updateMany({ user: req.user.id }, { isDefault: false });
  const address = await Address.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { isDefault: true },
    { new: true }
  );
  if (!address) return next(new AppError('Address not found', 404));
  sendResponse(res, 200, 'Default address updated', { address });
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress };
