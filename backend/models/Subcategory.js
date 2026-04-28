const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subcategory name is required'],
    trim: true,
    maxlength: [50, 'Subcategory name cannot exceed 50 characters'],
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  image: {
    type: String,
    default: '',
  },
  imagePublicId: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, { timestamps: true });

subcategorySchema.index({ categoryId: 1 });

module.exports = mongoose.model('Subcategory', subcategorySchema);
