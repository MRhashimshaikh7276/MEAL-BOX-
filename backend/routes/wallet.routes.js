const express = require('express');
const router = express.Router();
const { getWallet, addMoney, createAddMoneyOrder, verifyAddMoney, deductMoney, getTransactionHistory } = require('../controllers/wallet.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getWallet);
router.post('/create-order', createAddMoneyOrder);
router.post('/verify-payment', verifyAddMoney);
router.post('/add-money', addMoney);
router.post('/deduct', deductMoney);
router.get('/transactions', getTransactionHistory);

module.exports = router;