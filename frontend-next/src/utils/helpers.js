export const formatPrice = (price) => `₹${Number(price).toLocaleString('en-IN')}`
export const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
export const truncate = (str, n = 50) => str?.length > n ? str.slice(0, n) + '...' : str
export const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
export const calcDiscount = (price, discountPrice) => discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0
