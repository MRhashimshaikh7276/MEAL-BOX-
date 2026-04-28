const Offer = require('../models/Offer');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

const getOffers = async (req, res, next) => {
  const offers = await Offer.find({ isActive: true, expiryDate: { $gt: new Date() } });
  sendResponse(res, 200, 'Offers fetched', { offers });
};

const getAllOffers = async (req, res, next) => {
  const offers = await Offer.find().sort('-createdAt');
  sendResponse(res, 200, 'All offers', { offers });
};

const createOffer = async (req, res, next) => {
  const offer = await Offer.create(req.body);
  sendResponse(res, 201, 'Offer created', { offer });
};

const updateOffer = async (req, res, next) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!offer) return next(new AppError('Offer not found', 404));
  sendResponse(res, 200, 'Offer updated', { offer });
};

const deleteOffer = async (req, res, next) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) return next(new AppError('Offer not found', 404));
  await offer.deleteOne();
  sendResponse(res, 200, 'Offer deleted');
};

const validateCoupon = async (req, res, next) => {
  const { code, amount } = req.body;
  const offer = await Offer.findOne({ couponCode: code.toUpperCase(), isActive: true });

  if (!offer || offer.expiryDate < new Date()) return next(new AppError('Invalid or expired coupon', 400));
  if (amount < offer.minOrderAmount) return next(new AppError(`Minimum order ₹${offer.minOrderAmount} required`, 400));

  let discount = 0;
  if (offer.discountType === 'percentage') {
    discount = (amount * offer.discountValue) / 100;
    if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
  } else {
    discount = offer.discountValue;
  }

  sendResponse(res, 200, 'Coupon valid!', { offer, discount: Math.round(discount) });
};

module.exports = { getOffers, getAllOffers, createOffer, updateOffer, deleteOffer, validateCoupon };
