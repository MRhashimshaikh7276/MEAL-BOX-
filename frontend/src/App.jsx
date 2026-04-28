import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'

// Layouts
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'
import DeliveryLayout from './layouts/DeliveryLayout'
import AuthLayout from './layouts/AuthLayout'

// Customer Pages
import HomePage from './pages/customer/HomePage'
import ProductListingPage from './pages/customer/ProductListingPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrderSuccessPage from './pages/customer/OrderSuccessPage'
import MyOrdersPage from './pages/customer/MyOrdersPage'
import ProfilePage from './pages/customer/ProfilePage'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCategories from './pages/admin/AdminCategories'
import AdminSubCategories from './pages/admin/AdminSubCategories';
import AdminSubSubCategories from './pages/admin/AdminSubSubCategories';
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminOrderDetails from './pages/admin/AdminOrderDetails'
import AdminUsers from './pages/admin/AdminUsers'
import AdminOffers from './pages/admin/AdminOffers'
import AdminGeneralSettings from './pages/admin/adminGeneralSettings';
import AdminCombos from './pages/admin/AdminCombos';
import AdminBannerSection from './pages/admin/AdminBannerSection';
import AdminProductsDetails from './pages/admin/AdminProductsDetails';
import AdminReports from './pages/admin/AdminReports';
import AdminAddOnes from './pages/admin/AdminAddOnes';
// auth actions
import { fetchProfile } from './redux/slices/authSlice'

// Delivery Pages
import DeliveryDashboard from './pages/delivery/DeliveryDashboard'
import DeliveryOrders from './pages/delivery/DeliveryOrders'

// Guards
import ProtectedRoute from './components/common/ProtectedRoute'


function App() {
  const { theme } = useSelector(s => s.ui)
  const dispatch = useDispatch()

  // persist login: if tokens exist on reload, fetch profile to restore user state
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) dispatch(fetchProfile())
  }, [dispatch])

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      {/* Customer Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<ProductListingPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/combo/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route element={<ProtectedRoute roles={['customer']} />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/sub-categories" element={<AdminSubCategories />} />
          <Route path="/admin/sub-sub-categories" element={<AdminSubSubCategories />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/:id" element={<AdminProductsDetails />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:orderId" element={<AdminOrderDetails />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/offers" element={<AdminOffers />} />
          <Route path="/admin/general-settings" element={<AdminGeneralSettings />} />
          <Route path="/admin/combos" element={<AdminCombos />} />
          <Route path="/admin/add-ones" element={<AdminAddOnes />} />
          <Route path="/admin/banner-sections" element={<AdminBannerSection />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
      </Route>

      {/* Delivery Routes */}
      <Route element={<ProtectedRoute roles={['delivery']} />}>
        <Route element={<DeliveryLayout />}>
          <Route path="/delivery" element={<Navigate to="/delivery/dashboard" replace />} />
          <Route path="/delivery/dashboard" element={<DeliveryDashboard />} />
          <Route path="/delivery/orders" element={<DeliveryOrders />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
