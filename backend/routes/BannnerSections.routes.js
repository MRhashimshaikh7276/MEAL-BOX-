const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const bannerSectionController = require('../controllers/BannnerSections.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const createUploader = require('../middleware/upload.middleware');

const upload = createUploader('BannerSection', 50 * 1024 * 1024); // allow up to 50MB for banner videos

// Public routes
router.get('/', bannerSectionController.getAllBannerSections);
router.get('/:id', bannerSectionController.getBannerSectionById);

// Protected admin routes
router.use(protect, authorize('admin'));
router.post('/', upload.fields([{ name: 'bannerImage', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), bannerSectionController.createBannerSection);
router.put('/:id', upload.fields([{ name: 'bannerImage', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), bannerSectionController.updateBannerSection);
router.delete('/:id', bannerSectionController.deleteBannerSection);

module.exports = router;