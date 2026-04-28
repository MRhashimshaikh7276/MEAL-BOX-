const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Combo = require('../models/Combo');
const AddOnes = require('../models/addOnes');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');

// @desc    Get cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id })
    .populate('items.product', 'name images price discountPrice isAvailable isVeg')
    .populate('items.comboId', 'comboName comboPrice comboImage')
    .populate('items.addOnes.addOnesId', 'name price images isAvailable');

  if (!cart) {
    return sendResponse(res, 200, 'Cart is empty', { cart: { items: [], totalAmount: 0 } });
  }
  sendResponse(res, 200, 'Cart fetched', { cart });
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res, next) => {
  const { productId, comboId, quantity = 1, addOnes = [] } = req.body;

  // Validate addOnes if provided
  if (addOnes && addOnes.length > 0) {
    for (const addOn of addOnes) {
      const addOnesItem = await AddOnes.findById(addOn.addOnesId);
      if (!addOnesItem) return next(new AppError(`Add-on not found: ${addOn.addOnesId}`, 404));
      if (!addOnesItem.isAvailable) return next(new AppError(`${addOnesItem.name} is currently unavailable`, 400));
    }
  }

  // Handle product add
  if (productId) {
    const product = await Product.findById(productId);
    if (!product) return next(new AppError('Product not found', 404));
    if (!product.isAvailable) return next(new AppError('Product is currently unavailable', 400));

    const price = product.discountPrice > 0 ? product.discountPrice : product.price;

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity, price, addOnes }],
      });
    } else {
      const productIdStr = String(productId);
      const itemIndex = cart.items.findIndex(item => item.product && item.product.toString() === productIdStr);

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].price = price;
        // Merge addOnes
        const existingAddOnes = cart.items[itemIndex].addOnes || [];
        for (const newAddOn of addOnes) {
          const existingIndex = existingAddOnes.findIndex(a => a.addOnesId.toString() === newAddOn.addOnesId);
          if (existingIndex > -1) {
            existingAddOnes[existingIndex].quantity += newAddOn.quantity || 1;
          } else {
            existingAddOnes.push(newAddOn);
          }
        }
        cart.items[itemIndex].addOnes = existingAddOnes;
      } else {
        cart.items.push({ product: productId, quantity, price, addOnes });
      }
    }

    cart.calculateTotal();
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.product', 'name images price discountPrice isVeg');
    return sendResponse(res, 200, 'Item added to cart', { cart: populatedCart });
  }

  // Handle combo add
  if (comboId) {
    const combo = await Combo.findById(comboId);
    if (!combo) return next(new AppError('Combo not found', 404));
    if (combo.status !== 'active') return next(new AppError('Combo is currently unavailable', 400));

    const price = combo.comboPrice;

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ comboId: comboId, quantity, price }],
      });
    } else {
      const comboIdStr = String(comboId);
      const itemIndex = cart.items.findIndex(item => item.comboId && item.comboId.toString() === comboIdStr);

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
        cart.items[itemIndex].price = price;
      } else {
        cart.items.push({ comboId: comboId, quantity, price });
      }
    }

    cart.calculateTotal();
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate('items.comboId', 'comboName comboPrice comboImage');
    return sendResponse(res, 200, 'Combo added to cart', { cart: populatedCart });
  }

  return next(new AppError('Product ID or Combo ID is required', 400));
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update
// @access  Private
const updateCartItem = async (req, res, next) => {
  const { productId, comboId, quantity, addOnes } = req.body;

  if (!productId && !comboId) return next(new AppError('Product ID or Combo ID is required', 400));

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart not found', 404));

  let itemIndex = -1;
  if (productId) {
    const productIdStr = String(productId);
    itemIndex = cart.items.findIndex(item => item.product && item.product.toString() === productIdStr);
  } else if (comboId) {
    const comboIdStr = String(comboId);
    itemIndex = cart.items.findIndex(item => item.comboId && item.comboId.toString() === comboIdStr);
  }

  if (itemIndex === -1) return next(new AppError('Item not found in cart', 404));

  if (quantity <= 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
    // Update addOnes if provided
    if (addOnes) {
      cart.items[itemIndex].addOnes = addOnes;
    }
  }

  cart.calculateTotal();
  await cart.save();

  const populatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name images price discountPrice isVeg')
    .populate('items.comboId', 'comboName comboPrice comboImage');
  sendResponse(res, 200, 'Cart updated', { cart: populatedCart });
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:productId or DELETE /api/cart/remove-item?productId=xxx&comboId=xxx
// @access  Private
const removeFromCart = async (req, res, next) => {
  const productId = req.params.productId || req.query.productId;
  const comboId = req.query.comboId;
  
  if (!productId && !comboId) return next(new AppError('Product ID or Combo ID is required', 400));

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart not found', 404));

  if (productId) {
    const productIdStr = String(productId);
    cart.items = cart.items.filter(item => !item.product || item.product.toString() !== productIdStr);
  }
  
  if (comboId) {
    const comboIdStr = String(comboId);
    cart.items = cart.items.filter(item => !item.comboId || item.comboId.toString() !== comboIdStr);
  }
  
  cart.calculateTotal();
  await cart.save();

  const populatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name images price discountPrice isVeg')
    .populate('items.comboId', 'comboName comboPrice comboImage');
  sendResponse(res, 200, 'Item removed', { cart: populatedCart });
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = async (req, res, next) => {
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    { items: [], totalAmount: 0, couponApplied: null, discountAmount: 0 }
  );
  sendResponse(res, 200, 'Cart cleared');
};

// @desc    Apply coupon
// @route   POST /api/cart/apply-coupon
// @access  Private
const applyCoupon = async (req, res, next) => {
  const { couponCode } = req.body;
  const Offer = require('../models/Offer');

  const offer = await Offer.findOne({ couponCode: couponCode.toUpperCase(), isActive: true });

  if (!offer) return next(new AppError('Invalid or expired coupon code', 400));
  if (offer.expiryDate < new Date()) return next(new AppError('Coupon has expired', 400));

  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart) return next(new AppError('Cart is empty', 400));

  if (cart.totalAmount < offer.minOrderAmount) {
    return next(new AppError(`Minimum order amount of ₹${offer.minOrderAmount} required`, 400));
  }

  let discount = 0;
  if (offer.discountType === 'percentage') {
    discount = (cart.totalAmount * offer.discountValue) / 100;
    if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
  } else {
    discount = offer.discountValue;
  }

  cart.couponApplied = offer._id;
  cart.discountAmount = Math.round(discount);
  await cart.save();

  sendResponse(res, 200, `Coupon applied! You save ₹${cart.discountAmount}`, {
    cart,
    discount: cart.discountAmount,
    finalAmount: cart.totalAmount - cart.discountAmount,
  });
};

// @desc    Remove coupon
// @route   DELETE /api/cart/remove-coupon
// @access  Private
const removeCoupon = async (req, res, next) => {
  await Cart.findOneAndUpdate({ user: req.user.id }, { couponApplied: null, discountAmount: 0 });
  sendResponse(res, 200, 'Coupon removed');
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon };