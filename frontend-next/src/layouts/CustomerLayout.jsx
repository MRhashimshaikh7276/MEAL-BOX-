import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import Navbar from '../components/common/Navbar'
import BottomNav from '../components/common/BottomNav'
import CartDrawer from '../components/customer/CartDrawer'
import FloatingCartBtn from '../components/customer/FloatingCartBtn'
import { fetchProfile } from '../redux/slices/authSlice'
import { fetchCart } from '../redux/slices/cartSlice'
import { fetchCategories } from '../redux/slices/categorySlice'

export default function CustomerLayout({ children }) {
  const dispatch = useDispatch()
  const { isAuthenticated } = useSelector(s => s.auth)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      dispatch(fetchProfile())
      dispatch(fetchCart())
    }
    dispatch(fetchCategories())
  }, [dispatch])

  // Prevent hydration mismatch by rendering a loading state until mounted 
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-16 bg-white shadow-sm" />
        <main className="pb-20 md:pb-0">
          {children}
        </main>
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 md:hidden" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      {isAuthenticated && <CartDrawer />}
      {isAuthenticated && <FloatingCartBtn />}
    </div>
  )
}
