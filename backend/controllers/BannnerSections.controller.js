const BannnerSection = require('../models/BannnerSections');
const sendResponse = require('../utils/sendResponse');

// Create a new banner section
exports.createBannerSection = async (req, res) => {
    try {
        const { startdatetTime, enddatetTime, type, status } = req.body;

        // Handle file uploads
        const bannerImage = req.files && req.files['bannerImage'] 
            ? `/uploads/BannerSection/${req.files['bannerImage'][0].filename}`
            : '';
        
        const thumbnail = req.files && req.files['thumbnail']
            ? `/uploads/BannerSection/${req.files['thumbnail'][0].filename}`
            : '';

        // Normalize status to string if it's a boolean
        let normalizedStatus = status;
        if (typeof status === 'boolean') {
            normalizedStatus = status ? 'active' : 'inactive';
        } else if (typeof status === 'string') {
            const s = status.toLowerCase();
            normalizedStatus = (s === 'true' || s === 'active') ? 'active' : 'inactive';
        } else {
            normalizedStatus = 'active';
        }

        const newBannerSection = new BannnerSection({
            startdatetTime,
            enddatetTime,
            bannerImage,
            thumbnail,
            type: type || 'image',
            status: normalizedStatus
        });

        const savedBannerSection = await newBannerSection.save();
        sendResponse(res, 201, 'Banner section created', { bannerSection: savedBannerSection });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create banner section' });
    }
};

// Get all banner sections
exports.getAllBannerSections = async (req, res) => {
    try {
        const bannerSections = await BannnerSection.find();
        sendResponse(res, 200, 'Banner sections fetched', { bannerSections });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch banner sections' });
    }
};

// Get banner section by ID
exports.getBannerSectionById = async (req, res) => {
    try {
        const bannerSection = await BannnerSection.findById(req.params.id);
        if (!bannerSection) {
            return res.status(404).json({ error: 'Banner section not found' });
        }
        sendResponse(res, 200, 'Banner section fetched', { bannerSection });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch banner section' });
    }
};

// Update a banner section
exports.updateBannerSection = async (req, res) => {
    try {
        const { id } = req.params;
        const { startdatetTime, enddatetTime, type, status } = req.body;

        const existingBanner = await BannnerSection.findById(id);
        if (!existingBanner) {
            return res.status(404).json({ error: 'Banner section not found' });
        }

        // Handle file uploads
        let bannerImage = existingBanner.bannerImage;
        let thumbnail = existingBanner.thumbnail;

        if (req.files) {
            if (req.files['bannerImage']) {
                bannerImage = `/uploads/BannerSection/${req.files['bannerImage'][0].filename}`;
            }
            if (req.files['thumbnail']) {
                thumbnail = `/uploads/BannerSection/${req.files['thumbnail'][0].filename}`;
            }
        }

        // Normalize status to string if it's a boolean
        let normalizedStatus = status;
        if (status !== undefined) {
            if (typeof status === 'boolean') {
                normalizedStatus = status ? 'active' : 'inactive';
            } else if (typeof status === 'string') {
                const s = status.toLowerCase();
                normalizedStatus = (s === 'true' || s === 'active') ? 'active' : 'inactive';
            }
        } else {
            normalizedStatus = existingBanner.status;
        }

        const updatedBannerSection = await BannnerSection.findByIdAndUpdate(
            id,
            { 
                startdatetTime, 
                enddatetTime, 
                bannerImage, 
                thumbnail, 
                type: type || existingBanner.type, 
                status: normalizedStatus 
            },
            { new: true }
        );

        sendResponse(res, 200, 'Banner section updated', { bannerSection: updatedBannerSection });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update banner section' });
    }
};

// Delete a banner section
exports.deleteBannerSection = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBannerSection = await BannnerSection.findByIdAndDelete(id);

        if (!deletedBannerSection) {
            return res.status(404).json({ error: 'Banner section not found' });
        }

        sendResponse(res, 200, 'Banner section deleted');
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete banner section' });
    }
};
