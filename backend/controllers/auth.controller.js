const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const sendResponse = require('../utils/sendResponse');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');

// Generate tokens and send response
const sendTokenResponse = async (user, statusCode, res, message = 'Success') => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpire;

  res.status(statusCode).json({
    success: true,
    message,
    accessToken,
    refreshToken,
    user: userObj,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  const { name, email, password, phone, referralCode } = req.body;

  if (!name || !email || !password) {
    return next(new AppError('Name, email and password are required', 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  let referredByUser = null;
  if (referralCode) {
    referredByUser = await User.findOne({ referralCode: referralCode.toUpperCase() });
    
    // Can't find user with that referral code - just skip
    // Don't error out - maybe they're not using referral
  }

  const userData = { name, email, password, phone };
  
  // Only set referredBy if we found a valid referrer
  if (referredByUser) {
    userData.referredBy = referredByUser._id;
  }

  const user = await User.create(userData);

  // Give reward to referrer at registration time
  if (referredByUser) {
    referredByUser.referralCount += 1;
    referredByUser.referralRewardsEarned += 50;
    await referredByUser.save();
    console.log(`Referral reward given! Referrer: ${referredByUser.email}, Code: ${referralCode}`);
  }

  await sendTokenResponse(user, 201, res, referredByUser ? 'Registration successful! You got ₹50 discount on your first order!' : 'Registration successful! Welcome to Meal-Box 🍱');
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  if (user.isBlocked) {
    return next(new AppError('Your account has been blocked. Contact support.', 403));
  }

  await sendTokenResponse(user, 200, res, 'Login successful');
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(new AppError('Refresh token is required', 400));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return next(new AppError('Invalid refresh token', 401));
    }

    const accessToken = user.generateAccessToken();
    sendRespo2nse(res, 200, 'Token refreshed', { accessToken });
  } catch (err) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }
};

// @desc    Logout
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
  sendResponse(res, 200, 'Logged out successfully');
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  sendResponse(res, 200, 'Profile fetched', { user });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone, avatar },
    { new: true, runValidators: true }
  );
  sendResponse(res, 200, 'Profile updated', { user });
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 400));
  }

  user.password = newPassword;
  await user.save();
  sendResponse(res, 200, 'Password changed successfully');
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('No account found with this email', 404));
  }

  const resetToken = user.generateResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const template = emailTemplates.passwordReset(user.name, resetUrl);

  try {
    await sendEmail({ to: user.email, ...template });
    sendResponse(res, 200, 'Password reset email sent');
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Email could not be sent', 500));
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  await sendTokenResponse(user, 200, res, 'Password reset successful');
};

// @desc    Update FCM token for push notifications
// @route   PUT /api/auth/fcm-token
// @access  Private
const updateFcmToken = async (req, res, next) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return next(new AppError('FCM token is required', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { fcmToken },
    { new: true, runValidators: true }
  );

  sendResponse(res, 200, 'FCM token updated', { fcmToken: user.fcmToken });
};

// @desc    Get my referral info
// @route   GET /api/auth/referral
// @access  Private
const getMyReferral = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  const availableRewards = user.referralRewardsEarned - user.referralRewardsUsed;
  
  sendResponse(res, 200, 'Referral info', {
    referralCode: user.referralCode,
    referralCount: user.referralCount,
    referralRewardsEarned: user.referralRewardsEarned,
    referralRewardsUsed: user.referralRewardsUsed,
    availableRewards,
  });
};

// @desc    Validate referral code
// @route   POST /api/auth/validate-referral
// @access  Public
const validateReferralCode = async (req, res, next) => {
  const { referralCode } = req.body;
  
  if (!referralCode) {
    return next(new AppError('Referral code is required', 400));
  }
  
  const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
  
  if (!referrer) {
    return next(new AppError('Invalid referral code', 400));
  }
  
  sendResponse(res, 200, 'Valid referral code', {
    referrerName: referrer.name,
    reward: 50,
  });
};

module.exports = {
  register, login, refreshToken, logout,
  getProfile, updateProfile, changePassword,
  forgotPassword, resetPassword, updateFcmToken,
  getMyReferral, validateReferralCode,
};
