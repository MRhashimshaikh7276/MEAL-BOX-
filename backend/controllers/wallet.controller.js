const Wallet = require('../models/Wallet');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id })
      .sort({ createdAt: -1 });

    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        points: wallet.points,
        transactions: wallet.transactions.slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Razorpay order for adding money to wallet
const createAddMoneyOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `wallet_topup_${Date.now()}`,
      notes: { type: 'wallet_topup', userId: req.user._id.toString() },
    });

    res.json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify payment and add money to wallet
const verifyAddMoney = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }

    wallet.balance += amount;
    wallet.transactions.unshift({
      type: 'credit',
      amount,
      description: 'Money added via Razorpay',
      paymentId: razorpay_payment_id
    });

    await wallet.save();

    res.json({
      success: true,
      message: 'Money added successfully',
      data: {
        balance: wallet.balance,
        lastTransaction: wallet.transactions[0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addMoney = async (req, res) => {
  try {
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    let wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      wallet = await Wallet.create({ userId: req.user._id });
    }

    wallet.balance += amount;
    wallet.transactions.unshift({
      type: 'credit',
      amount,
      description: description || 'Money added to wallet'
    });

    await wallet.save();

    res.json({
      success: true,
      message: 'Money added successfully',
      data: {
        balance: wallet.balance,
        points: wallet.points,
        lastTransaction: wallet.transactions[0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deductMoney = async (req, res) => {
  try {
    const { amount, description, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    wallet.balance -= amount;
    wallet.transactions.unshift({
      type: 'debit',
      amount,
      description: description || 'Payment deducted',
      orderId
    });

    await wallet.save();

    res.json({
      success: true,
      message: 'Payment successful',
      data: {
        balance: wallet.balance,
        lastTransaction: wallet.transactions[0]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      return res.json({ success: true, data: [] });
    }

    res.json({
      success: true,
      data: wallet.transactions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getWallet,
  addMoney,
  createAddMoneyOrder,
  verifyAddMoney,
  deductMoney,
  getTransactionHistory
};