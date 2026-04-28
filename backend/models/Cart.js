const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  comboId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Combo',
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  addOnes: [{
    addOnesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AddOnes',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    }
  }],
}, { validate: {
  validator: function() {
    return this.product || this.comboId;
  },
  message: 'Either product or combo is required'
} });

cartItemSchema.pre('save', function(next) {
  if (!this.product && !this.comboId) {
    return next(new Error('Either product or combo is required'));
  }
  next();
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0,
  },
  couponApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    default: null,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

cartSchema.methods.calculateTotal = function () {
  this.totalAmount = this.items.reduce((acc, item) => {
    const itemTotal = item.price * item.quantity;
    const addOnesTotal = (item.addOnes || []).reduce((sum, addOn) => sum + (addOn.price * addOn.quantity), 0);
    return acc + itemTotal + addOnesTotal;
  }, 0);
  return this.totalAmount;
};

module.exports = mongoose.model('Cart', cartSchema);