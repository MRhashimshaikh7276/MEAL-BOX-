import { useDispatch, useSelector } from 'react-redux'
import { ShoppingCart } from 'lucide-react'
import { openCart } from '../../redux/slices/cartSlice'

export default function FloatingCartBtn() {
  const dispatch = useDispatch()
  const { items, totalAmount } = useSelector(s => s.cart)
  if (items.length === 0) return null

  return (
    <button onClick={() => dispatch(openCart())}
      className="fixed bottom-20 md:bottom-6 right-4 z-40 flex items-center gap-3 bg-primary-500 text-white px-4 py-3 rounded-2xl shadow-xl shadow-primary-500/40 hover:bg-primary-600 active:scale-95 transition-all duration-200 animate-slide-up">
      <div className="relative">
        <ShoppingCart size={20} />
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-primary-500 text-xs font-bold rounded-full flex items-center justify-center">
          {items.length}
        </span>
      </div>
      <div className="text-left">
        <p className="text-xs font-medium opacity-80">{items.length} item{items.length > 1 ? 's' : ''}</p>
        <p className="text-sm font-bold">₹{totalAmount}</p>
      </div>
      <span className="text-sm font-semibold pl-2 border-l border-white/30">View Cart</span>
    </button>
  )
}
