const GeneralSettings = require('../models/generalSettings');

const sendResponse = require('../utils/sendResponse');

// Check if restaurant is open
exports.getRestaurantStatus = async (req, res) => {
    try {
        const settings = await GeneralSettings.findOne();
        
        // Default to open if no settings exist
        if (!settings) {
            return sendResponse(res, 200, 'Restaurant is open', { isOpen: true, openTime: null, closeTime: null });
        }
        
        // Check manual isOpen setting first
        if (settings.isOpen === false) {
            return sendResponse(res, 200, 'Restaurant is currently closed', { isOpen: false, openTime: null, closeTime: null });
        }
        
        let isOpen = true;
        let message = 'Restaurant is open';
        let openTime = settings.businessHours?.open || null;
        let closeTime = settings.businessHours?.close || null;
        
        // Check business hours if autoClose is enabled
        if (settings.businessHours?.autoClose && openTime && closeTime) {
            // Get IST time (India is UTC+5:30)
            const now = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes
            const istDate = new Date(now.getTime() + istOffset);
            const currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();
            
            const parseTime = (timeStr) => {
                if (!timeStr) return null;
                const [hours, minutes] = timeStr.split(':').map(Number);
                return hours * 60 + minutes;
            };
            
            const openMinutes = parseTime(openTime);
            const closeMinutes = parseTime(closeTime);
            
            if (openMinutes !== null && closeMinutes !== null) {
                if (openMinutes <= closeMinutes) {
                    isOpen = currentMinutes >= openMinutes && currentMinutes < closeMinutes;
                } else {
                    isOpen = currentMinutes >= openMinutes || currentMinutes < closeMinutes;
                }
                
                if (!isOpen) {
                    message = `Restaurant is closed. Opens at ${openTime}`;
                }
            }
        }
        
        sendResponse(res, 200, message, { isOpen, openTime, closeTime });
    } catch (error) {
        sendResponse(res, 200, 'Restaurant is open', { isOpen: true, openTime: null, closeTime: null });
    }
};

exports.getGeneralSettings = async (req, res) => {
    try {
        const settings = await GeneralSettings.findOne();
        sendResponse(res, 200, 'Settings fetched', { settings });
    } catch (error) {
        sendResponse(res, 500, { message: error.message });
    }
};

exports.updateGeneralSettings = async (req, res) => {
    try {

        let updateData = {
            companyName: req.body.companyName,
            companyEmail: req.body.companyEmail,
            companyPhone: req.body.companyPhone,
            companyAddress: req.body.companyAddress,
            facebookLink: req.body.facebookLink,
            instagramLink: req.body.instagramLink,
            // Restaurant Status - Admin Control
            isOpen: req.body.isOpen === 'true' || req.body.isOpen === true,
            businessHours: req.body.businessHours ? JSON.parse(req.body.businessHours) : undefined,
            minimumOrder: req.body.minimumOrder ? Number(req.body.minimumOrder) : 0,
            deliveryRadius: req.body.deliveryRadius ? Number(req.body.deliveryRadius) : 5,
            deliveryCharge: req.body.deliveryCharge ? Number(req.body.deliveryCharge) : 0,
        };

        //  if logo uploaded 
        if (req.file) {
            updateData.logo = `/uploads/general/${req.file.filename}`;
        }
        const settings = await GeneralSettings.findOneAndUpdate(
            {},
            updateData,
            {
                new: true,
                upsert: true
            }
        );
        sendResponse(res, 200, 'Settings updated', { settings });
    } catch (error) {
        sendResponse(res, 500, { message: error.message });
    }
};

// Block/Unblock date for private events
exports.manageBlockedDate = async (req, res) => {
    try {
        const { date, reason, action, startTime, endTime } = req.body;
        
        if (!date) {
            return sendResponse(res, 400, 'Date is required');
        }
        
        let settings = await GeneralSettings.findOne();
        
        if (!settings) {
            settings = new GeneralSettings({ blockedDates: [] });
        }
        
        if (!settings.blockedDates) {
            settings.blockedDates = [];
        }
        
        if (action === 'block') {
            // Check if same date and time range already exists
            const exists = settings.blockedDates.find(b => b.date === date && b.startTime === startTime && b.endTime === endTime);
            if (!exists) {
                settings.blockedDates.push({ 
                    date, 
                    reason: reason || 'Private Event',
                    startTime: startTime || '',
                    endTime: endTime || ''
                });
            }
        } else if (action === 'unblock') {
            settings.blockedDates = settings.blockedDates.filter(b => b.date !== date);
        }
        
        await settings.save();
        sendResponse(res, 200, 'Date updated', { blockedDates: settings.blockedDates });
    } catch (error) {
        sendResponse(res, 500, { message: error.message });
    }
};