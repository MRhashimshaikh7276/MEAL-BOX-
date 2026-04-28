
const mongoose = require('mongoose')

const bannerSectionSchema = new mongoose.Schema({

    startdatetTime: { type: Date, default: Date.now },
    enddatetTime: { type: Date },
    bannerImage: { type: String },
    thumbnail: { type: String },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },

}, { timestamps: true })

module.exports = mongoose.model('BannerSection', bannerSectionSchema)