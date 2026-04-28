import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'

export default function ProtectedRoute({ children, roles }) {
  const router = useRouter()
  const { isAuthenticated, user } = useSelector(s => s.auth)
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null

  useEffect(() => {
    if (!isAuthenticated && !token) {
      router.replace('/login')
    } else if (roles && user && !roles.includes(user.role)) {
      router.replace('/')
    }
  }, [isAuthenticated, user, token, roles, router])

  if (!isAuthenticated && !token) return null
  if (roles && user && !roles.includes(user.role)) return null
  
  return children
}
