const express = require('express');
const router = express.Router();
const {
  register, login, refreshToken, logout,
  getProfile, updateProfile, changePassword,
  forgotPassword, resetPassword, updateFcmToken,
  getMyReferral, validateReferralCode,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/validate-referral', validateReferralCode);

// Protected routes
router.use(protect);
router.post('/logout', logout);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.put('/fcm-token', updateFcmToken);
router.get('/referral', getMyReferral);

module.exports = router;
