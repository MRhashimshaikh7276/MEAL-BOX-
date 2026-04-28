const mongoose = require('mongoose');

const BlockedDateSchema = new mongoose.Schema({
    date: { type: String, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    reason: { type: String, default: 'Private Event' },
    isActive: { type: Boolean, default: true }
}, { _id: false });

const GeneralSettingsSchema = new mongoose.Schema({
    logo: {
        type: String,
        default: '',
    },
    companyName: {
        type: String,
        default: '',
    },
    companyEmail: {
        type: String,
        default: '',
    },
    companyPhone: {
        type: String,
        default: '',
    },
    companyAddress: {
        type: String,
        default: '',
    },
    facebookLink: {
        type: String,
        default: '',
    },
    instagramLink: {
        type: String,
        default: '',
    },
    isOpen: {
        type: Boolean,
        default: true,
    },
    businessHours: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '22:00' },
        autoClose: { type: Boolean, default: true }
    },
    minimumOrder: { type: Number, default: 0 },
    deliveryRadius: { type: Number, default: 5 },
    deliveryCharge: { type: Number, default: 0 },
    blockedDates: [BlockedDateSchema],

}, { timestamps: true });

module.exports = mongoose.model('general-setting', GeneralSettingsSchema);