
const express = require('express');
const router = express.Router();
const { getGeneralSettings, updateGeneralSettings, getRestaurantStatus, manageBlockedDate } = require('../controllers/generalSettings.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const createUploader = require('../middleware/upload.middleware');
const upload = createUploader('general');
router.get('/', getGeneralSettings);
router.get('/status', getRestaurantStatus);
router.put('/', upload.single('logo'), updateGeneralSettings);
router.post('/blocked-date', protect, authorize('admin'), manageBlockedDate);
module.exports = router;