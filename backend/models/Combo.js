const mongoose = require('mongoose');



const comboSchema = new mongoose.Schema({

    comboName: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ''
    },

    products: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: {
                type: Number,
                default: 1,
            },
        },
    ],
    comboPrice: {
        type: Number,
        required: true,
    },
    actualPrice: {
        type: Number, // auto calculated (sum of product prices)
    },
    discountAmount: {
        type: Number,
        default: 0,
    },

    comboImage: {
        type: String,
    },
    status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
    },
    
    totalOrders: {
        type: Number,
        default: 0,
    },

    offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "offers",
        default: null,
    },

    preparationTime: {
        type: Number, // in minutes
        default: 15,
    },
}, { timestamps: true })


module.exports = mongoose.model('Combo', comboSchema);
