const Booking = require('../models/Booking');
const GeneralSettings = require('../models/generalSettings');
const sendResponse = require('../utils/sendResponse');
const AppError = require('../utils/AppError');

exports.createBooking = async (req, res, next) => {
    try {
        const { customerName, customerPhone, customerEmail, date, time, guests, specialRequest } = req.body;
        
        // Check if date AND time is blocked
        const settings = await GeneralSettings.findOne();
        if (settings?.blockedDates) {
            const isBlocked = settings.blockedDates.some(b => {
                if (b.date !== date || !b.isActive) return false;
                
                // If no time range, block entire day
                if (!b.startTime && !b.endTime) return true;
                
                // Check if booking time falls in blocked range
                if (b.startTime && b.endTime) {
                    return time >= b.startTime && time <= b.endTime;
                }
                
                return false;
            });
            
            if (isBlocked) {
                const blockedInfo = settings.blockedDates.find(b => b.date === date && b.isActive);
                return next(new AppError(`Sorry! Table booking is not available at ${time} on ${date}. ${blockedInfo?.reason || 'Private Event'}`, 400));
            }
        }
            
        const booking = new Booking({
            customerId: req.user?._id,
            customerName,
            customerPhone,
            customerEmail,
            date,
            time,
            guests,
            specialRequest,
        });
        
        await booking.save();
        sendResponse(res, 201, 'Table booked successfully', { booking });
    } catch (error) {
        sendResponse(res, 500, error.message);
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const { status, date } = req.query;
        
        let filter = {};
        if (status) filter.status = status;
        if (date) filter.date = date;
        
        const bookings = await Booking.find(filter)
            .sort({ createdAt: -1 });
        
        sendResponse(res, 200, 'Bookings fetched', { bookings });
    } catch (error) {
        sendResponse(res, 500, error.message);
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ customerId: req.user?._id })
            .sort({ createdAt: -1 });
        
        sendResponse(res, 200, 'My bookings fetched', { bookings });
    } catch (error) {
        sendResponse(res, 500, error.message);
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, tableNumber } = req.body;
        
        const booking = await Booking.findByIdAndUpdate(
            id,
            { status, tableNumber },
            { new: true }
        );
        
        if (!booking) {
            return sendResponse(res, 404, 'Booking not found');
        }
        
        sendResponse(res, 200, 'Booking updated', { booking });
    } catch (error) {
        sendResponse(res, 500, error.message);
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        
        await Booking.findByIdAndDelete(id);
        
        sendResponse(res, 200, 'Booking cancelled');
    } catch (error) {
        sendResponse(res, 500, error.message);
    }
};