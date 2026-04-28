const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters'],
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
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
}, { timestamps: true });

// Note: name has unique: true which auto-creates index, so no need for additional index
categorySchema.index({ status: 1 });

categorySchema.pre('save', function (next) {
  this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  next();
});

module.exports = mongoose.model('Category', categorySchema);
