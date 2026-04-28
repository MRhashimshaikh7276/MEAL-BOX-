import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Navbar from '../components/common/Navbar'
import BottomNav from '../components/common/BottomNav'
import CartDrawer from '../components/customer/CartDrawer'
import FloatingCartBtn from '../components/customer/FloatingCartBtn'
import { fetchProfile } from '../redux/slices/authSlice'
import { fetchCart } from '../redux/slices/cartSlice'
import { fetchCategories } from '../redux/slices/categorySlice'

export default function CustomerLayout() {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector(s => s.auth)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      dispatch(fetchProfile())
      dispatch(fetchCart())
    }
    dispatch(fetchCategories())
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
      {isAuthenticated && <CartDrawer />}
      {isAuthenticated && <FloatingCartBtn />}
    </div>
  )
}
