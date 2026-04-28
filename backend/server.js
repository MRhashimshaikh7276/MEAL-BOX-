require('dotenv').config();
require('express-async-errors');

(async () => {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const http = require('http');
  const { Server } = require('socket.io');
  const fs = require('fs');

  const path = require('path');



 

  const connectDB = require('./config/db');
  const errorHandler = require('./middleware/errorHandler');

  // Route imports
  const authRoutes = require('./routes/auth.routes');
  const categoryRoutes = require('./routes/category.routes');
  const subcategoryRoutes = require('./routes/subcategory.routes');
  const subsubcategoryRoutes = require('./routes/subsubcategory.routes');
  const productRoutes = require('./routes/product.routes');
  const cartRoutes = require('./routes/cart.routes');
  const orderRoutes = require('./routes/order.routes');
  const addressRoutes = require('./routes/address.routes');
  const offerRoutes = require('./routes/offer.routes');
  const reviewRoutes = require('./routes/review.routes');
  const adminRoutes = require('./routes/admin.routes');
  const deliveryRoutes = require('./routes/delivery.routes');
  const paymentRoutes = require('./routes/payment.routes');
  const generalSettingsRoutes = require('./routes/generalSettings.routes');
  const comboRoutes = require('./routes/combo.routes');
  const bannerSectionRoutes = require('./routes/BannnerSections.routes');
  const addOnesRoutes = require('./routes/addOnes.routes');
  const bookingRoutes = require('./routes/booking.routes');
  const walletRoutes = require('./routes/wallet.routes');
  const app = express();

  // Connect to database
  connectDB();



  // Security middlewares
  // helmet adds several headers including Cross-Origin-Resource-Policy, which
  // defaults to 'same-origin' and blocks our static image uploads when the
  // frontend runs on a different port.  Relax that to `cross-origin` so the
  // category/product images are accessible during development (and production
  // if the CDN serves from a different domain).
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));
  // CORS configuration - allow both React (5173) and Next.js (3000) frontends
  const allowedOrigins = [
    
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'https://mealfront.magnusideas.com',
  ].filter(Boolean);

  app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  }));

  app.use('/uploads', express.static('uploads'));
  // Rate limiting
  // skip limiter entirely in development to make local testing easier
  // and also ignore safe GET requests so listing endpoints like /categories
  // can't trigger a 429 during normal browsing


  // previously there was a stricter limiter for auth routes, but it was
  // blocking legitimate login/logout attempts. we remove it entirely so
  // administrators (and anyone else) can attempt auth as often as needed.
  //
  // if you ever want to reinstate a limiter later, re-add a rateLimit call
  // here and mount it on the auth route below.

  // const authLimiter = rateLimit({
  //   windowMs: 15 * 60 * 1000,
  //   max: 10,
  //   message: { success: false, message: 'Too many auth attempts, please try again later.' },
  //   skip: (req) => {
  //     const email = req.body?.email;
  //     if (email && process.env.ADMIN_EMAIL) {
  //       return email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();
  //     }
  //     return false;
  //   }
  //});
  // Body parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  // Static files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Meal-Box API is running 🍱', timestamp: new Date() });
  });

  // Routes
  // auth limiter removed to allow unlimited login/logout attempts
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/subcategories', subcategoryRoutes);
  app.use('/api/subsubcategories', subsubcategoryRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/addresses', addressRoutes);
  app.use('/api/offers', offerRoutes);
  app.use('/api/reviews', reviewRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/delivery', deliveryRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/general-settings', generalSettingsRoutes);
  app.use('/api/combos', comboRoutes);
  app.use('/api/banner-sections', bannerSectionRoutes);
  app.use('/api/add-ones', addOnesRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/wallet', walletRoutes);
  // 404 handler for API routes
  app.use('/api/*', (req, res) => {
    res.status(404).json({ success: false, message: `API Route ${req.originalUrl} not found` });
  });

  

  // Global error handler
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Make io accessible to controllers
  app.set('io', io);

  // Socket.io connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-admin', () => {
      socket.join('admin-room');
      console.log('Admin joined admin-room');
    });

    socket.on('join-delivery', () => {
      socket.join('delivery-room');
      console.log('Delivery person joined delivery-room');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`🍱 Meal-Box Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });

  module.exports = app;
})();
