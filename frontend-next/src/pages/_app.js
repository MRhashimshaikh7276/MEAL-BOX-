import { Provider, useSelector, useDispatch } from 'react-redux'
import { store } from '../redux/store'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import '../index.css'
import { Toaster } from 'react-hot-toast'
import InstallPopup from '../components/InstallPopup'

// Layouts
import CustomerLayout from '../layouts/CustomerLayout'
import AdminLayout from '../layouts/AdminLayout'
import DeliveryLayout from '../layouts/DeliveryLayout'
import AuthLayout from '../layouts/AuthLayout'

// Auth actions
import { fetchProfile } from '../redux/slices/authSlice'
import { initializeTheme } from '../redux/slices/uiSlice'

function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <AppLayout Component={Component} pageProps={pageProps} />
    </Provider>
  )
}

function AppLayout({ Component, pageProps }) {
  const router = useRouter()
  const dispatch = useDispatch()
  const { theme } = useSelector(s => s.ui)
  const [mounted, setMounted] = useState(false)

  // PWA Service Worker Setup
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV === 'production') {
      const onLoad = () => {
        navigator.serviceWorker.register('/sw.js').catch(err => console.error(err))
      }
      if (document.readyState === 'loading') window.addEventListener('load', onLoad)
      else onLoad()
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    dispatch(initializeTheme())
    const token = localStorage.getItem('accessToken')
    if (token) dispatch(fetchProfile())
  }, [dispatch])

  useEffect(() => {
    if (mounted) {
      if (theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
  }, [theme, mounted])

  const isAdminRoute = router.pathname.startsWith('/admin')
  const isDeliveryRoute = router.pathname.startsWith('/delivery')
  const isAuthRoute = router.pathname.startsWith('/login') || router.pathname.startsWith('/register') ||
    router.pathname.includes('forgot') || router.pathname.includes('reset')

  let LayoutComponent = CustomerLayout
  if (isAuthRoute) LayoutComponent = AuthLayout
  else if (isAdminRoute) LayoutComponent = AdminLayout
  else if (isDeliveryRoute) LayoutComponent = DeliveryLayout

  return (
    <>
      <Toaster position="top-center" toastOptions={{
        duration: 3000,
        style: { background: '#1C1C1C', color: '#fff', borderRadius: '12px' },
        success: { iconTheme: { primary: '#FF6B00', secondary: '#fff' } },
      }} />

      {/* PWA Install Popup - Shows to customers and delivery only */}
      {mounted && !isAuthRoute && !isAdminRoute && <InstallPopup />}

      <LayoutComponent>
        <Component {...pageProps} />
      </LayoutComponent>
    </>
  )
}

export default MyApp
