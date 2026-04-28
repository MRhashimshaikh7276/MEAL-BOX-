require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');
const Offer = require('../models/Offer');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Subcategory.deleteMany(),
      Product.deleteMany(),
      Offer.deleteMany(),
    ]);

    console.log('🗑️  Existing data cleared');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@mealbox.com',
      password: 'admin123',
      phone: '9876543210',
      role: 'admin',
    });

    // Create customer
    const customer = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'customer123',
      phone: '9876543211',
      role: 'customer',
    });

    // Create delivery boy
    const delivery = await User.create({
      name: 'Rahul Delivery',
      email: 'delivery@mealbox.com',
      password: 'delivery123',
      phone: '9876543212',
      role: 'delivery',
    });

    console.log('👥 Users created');

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Starters', image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400' },
      { name: 'Main Course', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400' },
      { name: 'Desserts', image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400' },
      { name: 'Beverages', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400' },
      { name: 'Pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' },
      { name: 'Biryani', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400' },
    ]);

    console.log('📁 Categories created');

    // Create subcategories
    const subcats = await Subcategory.insertMany([
      { name: 'Veg Starters', categoryId: categories[0]._id },
      { name: 'Non-Veg Starters', categoryId: categories[0]._id },
      { name: 'Indian Main Course', categoryId: categories[1]._id },
      { name: 'Chinese Main Course', categoryId: categories[1]._id },
    ]);

    // Create products
    await Product.insertMany([
      {
        name: 'Paneer Tikka',
        description: 'Soft paneer cubes marinated in spices and grilled to perfection. Served with mint chutney.',
        images: [{ url: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d6?w=600' }],
        price: 220,
        discountPrice: 180,
        categoryId: categories[0]._id,
        subcategoryId: subcats[0]._id,
        isVeg: true,
        isFeatured: true,
        rating: 4.5,
        totalReviews: 120,
        totalOrders: 500,
        preparationTime: 20,
        tags: ['starter', 'veg', 'paneer', 'grilled'],
      },
      {
        name: 'Chicken Wings',
        description: 'Crispy chicken wings tossed in tangy buffalo sauce. Served with dipping sauce.',
        images: [{ url: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=600' }],
        price: 320,
        discountPrice: 280,
        categoryId: categories[0]._id,
        subcategoryId: subcats[1]._id,
        isVeg: false,
        isFeatured: true,
        rating: 4.7,
        totalReviews: 89,
        totalOrders: 380,
        preparationTime: 25,
        tags: ['starter', 'chicken', 'non-veg'],
      },
      {
        name: 'Butter Chicken',
        description: 'Rich and creamy butter chicken in aromatic tomato-based gravy. Best with naan.',
        images: [{ url: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600' }],
        price: 380,
        discountPrice: 340,
        categoryId: categories[1]._id,
        subcategoryId: subcats[2]._id,
        isVeg: false,
        isFeatured: true,
        rating: 4.8,
        totalReviews: 250,
        totalOrders: 850,
        preparationTime: 30,
        tags: ['main course', 'chicken', 'gravy'],
      },
      {
        name: 'Dal Makhani',
        description: 'Slow cooked black lentils with cream and butter. A classic North Indian favorite.',
        images: [{ url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600' }],
        price: 280,
        categoryId: categories[1]._id,
        subcategoryId: subcats[2]._id,
        isVeg: true,
        rating: 4.4,
        totalReviews: 95,
        totalOrders: 420,
        preparationTime: 25,
        tags: ['main course', 'veg', 'dal'],
      },
      {
        name: 'Chicken Biryani',
        description: 'Fragrant basmati rice cooked with tender chicken, saffron, and whole spices.',
        images: [{ url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600' }],
        price: 320,
        discountPrice: 280,
        categoryId: categories[5]._id,
        isVeg: false,
        isFeatured: true,
        rating: 4.9,
        totalReviews: 450,
        totalOrders: 1200,
        preparationTime: 35,
        tags: ['biryani', 'chicken', 'rice'],
      },
      {
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza with fresh mozzarella, tomato sauce, and fresh basil.',
        images: [{ url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600' }],
        price: 350,
        discountPrice: 299,
        categoryId: categories[4]._id,
        isVeg: true,
        isFeatured: true,
        rating: 4.6,
        totalReviews: 180,
        totalOrders: 720,
        preparationTime: 20,
        tags: ['pizza', 'veg', 'italian'],
      },
      {
        name: 'Gulab Jamun',
        description: 'Soft milk-solid based dumplings soaked in rose-scented sugar syrup. Served warm.',
        images: [{ url: 'https://images.unsplash.com/photo-1601303516534-0b5cd81e6beb?w=600' }],
        price: 120,
        categoryId: categories[2]._id,
        isVeg: true,
        rating: 4.5,
        totalReviews: 75,
        totalOrders: 300,
        preparationTime: 10,
        tags: ['dessert', 'sweet', 'indian'],
      },
      {
        name: 'Mango Lassi',
        description: 'Refreshing blend of yogurt, fresh mangoes, and a hint of cardamom.',
        images: [{ url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600' }],
        price: 120,
        discountPrice: 99,
        categoryId: categories[3]._id,
        isVeg: true,
        rating: 4.7,
        totalReviews: 140,
        totalOrders: 560,
        preparationTime: 5,
        tags: ['beverage', 'mango', 'lassi', 'drink'],
      },
    ]);

    console.log('🍕 Products created');

    // Create offers
    await Offer.insertMany([
      {
        title: 'Welcome Offer',
        description: '20% off on your first order',
        couponCode: 'WELCOME20',
        discountType: 'percentage',
        discountValue: 20,
        maxDiscount: 100,
        minOrderAmount: 200,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        title: 'Flat 50 Off',
        description: 'Get flat ₹50 off on orders above ₹299',
        couponCode: 'FLAT50',
        discountType: 'flat',
        discountValue: 50,
        minOrderAmount: 299,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ]);

    console.log('🎟️  Offers created');
    console.log('\n✅ Seed data inserted successfully!');
    console.log('\n📧 Admin: admin@mealbox.com | 🔑 Password: admin123');
    console.log('📧 Customer: john@example.com | 🔑 Password: customer123');
    console.log('📧 Delivery: delivery@mealbox.com | 🔑 Password: delivery123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder error:', error);
    process.exit(1);
  }
};

seedData();
