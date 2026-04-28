# Meal-Box Frontend

Production-grade Food Delivery Web App built with React + Vite + Tailwind CSS.

## Tech Stack
- **React 18** + **Vite**
- **Redux Toolkit** (state management)
- **React Router v6** (routing)
- **Tailwind CSS** (styling)
- **Axios** (API client with interceptors)
- **React Hook Form** (form handling)
- **Recharts** (admin charts)
- **React Hot Toast** (notifications)
- **Lucide React** (icons)

## Project Structure
```
src/
├── components/
│   ├── common/         # Navbar, BottomNav, Modal, Skeleton, ProtectedRoute
│   └── customer/       # ProductCard, CartDrawer, FloatingCartBtn
├── pages/
│   ├── auth/           # Login, Register, ForgotPassword, ResetPassword
│   ├── customer/       # Home, ProductListing, ProductDetail, Cart, Checkout, OrderSuccess, MyOrders, Profile
│   ├── admin/          # Dashboard, Categories, Products, Orders, Users, Offers
│   └── delivery/       # Dashboard, Orders
├── redux/
│   └── slices/         # auth, cart, products, orders, categories, ui, admin
├── services/
│   └── api.js          # All API calls with axios interceptors
├── layouts/            # CustomerLayout, AdminLayout, AuthLayout, DeliveryLayout
├── hooks/              # useDebounce
└── utils/              # helpers
```

## Quick Start
```bash
npm install
cp .env.example .env
# Update VITE_API_URL to your backend URL
npm run dev
```

## Features
- **3 User Roles**: Customer, Admin, Delivery Boy
- **Dark Mode** support
- **Mobile-first** responsive design
- **JWT** auth with auto refresh token
- **Cart Drawer** with slide animation
- **Floating Cart Button**
- **Order Tracking** progress bar
- **Admin Dashboard** with Recharts
- **Skeleton Loaders** throughout
- **Toast Notifications**
- **Coupon System**
- **Reviews & Ratings**
