import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function DeliveryIndex() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/delivery/dashboard')
  }, [router])
  
  return null
}