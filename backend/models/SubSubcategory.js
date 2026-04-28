const mongoose = require('mongoose');

const subsubcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sub-subcategory name is required'],
    trim: true,
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    required: [true, 'Subcategory is required'],
  },
  image: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, { timestamps: true });

subsubcategorySchema.index({ subcategoryId: 1 });

module.exports = mongoose.model('SubSubcategory', subsubcategorySchema);
