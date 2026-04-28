const mongoose = require('mongoose');

const addOnesSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    price:{ 
        type:Number,
        required:true,
    },
    discountPrice:{
        type:Number,
        default:0
    },
    images:[
        {
            type:String,
            required:true
        }
    ],
    isAvailable:{
        type:Boolean,
        default:true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, { timestamps: true });

module.exports = mongoose.model('AddOnes', addOnesSchema);