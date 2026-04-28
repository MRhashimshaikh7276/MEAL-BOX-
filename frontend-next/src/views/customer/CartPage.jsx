import Link from 'next/link'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package } from 'lucide-react'
import { removeFromCart, updateCartItem } from '../../redux/slices/cartSlice'
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

export default function CartPage() {
  const dispatch = useDispatch()
  const router = useRouter()
  const { items, totalAmount } = useSelector(s => s.cart)

  const handleUpdate = (productId, comboId, qty) => {
    if (qty < 1) {
      if (comboId) dispatch(removeFromCart({ comboId }))
      else dispatch(removeFromCart({ productId }))
    } else {
      if (comboId) dispatch(updateCartItem({ comboId, quantity: qty }))
      else dispatch(updateCartItem({ productId, quantity: qty }))
    }
  }

  const handleRemove = (productId, comboId) => {
    if (comboId) dispatch(removeFromCart({ comboId }))
    else dispatch(removeFromCart({ productId }))
  }

  if (items.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingCart size={40} className="text-gray-300" />
      </div>
      <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
      <p className="text-gray-400 mb-8">Add delicious items from our menu to get started!</p>
      <Link href="/menu" className="btn-primary">Explore Menu</Link>
    </div>
  )

  const tax = totalAmount * 0.05

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-6">Your Cart</h1>
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-2 space-y-3 mb-6 md:mb-0">
          {items.map((item, idx) => {
            const isCombo = !!item.comboId;
            const product = item.product || {};
            const combo = item.comboId || {};
            const id = isCombo ? (combo._id || combo) : product._id;
            if (!id) return null;
            
            let imageUrl = null;
            let name = '';
            let isVeg = false;
            
            if (isCombo) {
              imageUrl = combo.comboImage ? `${baseUrl}${combo.comboImage}` : null;
              name = combo.comboName || 'Combo';
            } else {
              imageUrl = product.images?.[0]?.url ? `${baseUrl}${product.images[0].url}` : null;
              name = product.name || 'Product';
              isVeg = product.isVeg || false;
            }
            
            const key = isCombo ? `combo-${id}` : `product-${id}`;
            
            return (
              <div key={key} className="card p-4 flex gap-4">
                {imageUrl ? (
                  <img src={imageUrl} alt={name}
                    className="w-20 h-20 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                    <Package size={24} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    {isCombo ? (
                      <span className="bg-primary-100 dark:bg-primary-500/20 text-primary-600 text-xs px-1.5 py-0.5 rounded shrink-0">
                        <Package size={10} className="inline" /> COMBO
                      </span>
                    ) : (
                      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${isVeg ? 'border-green-500' : 'border-red-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      </span>
                    )}
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                  </div>
                  <p className="text-primary-500 font-bold mt-1">₹{item.price}</p>
                  
                  {/* AddOnes Display */}
                  {item.addOnes && item.addOnes.length > 0 && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Add Extras:</p>
                      <div className="space-y-1">
                        {item.addOnes.map((addOn, addIdx) => (
                          <div key={addIdx} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">+ {addOn.name}</span>
                            <span className="font-semibold text-primary-600">₹{addOn.price * addOn.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleUpdate(isCombo ? undefined : id, isCombo ? id : undefined, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="font-bold w-5 text-center">{item.quantity}</span>
                      <button onClick={() => handleUpdate(isCombo ? undefined : id, isCombo ? id : undefined, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => handleRemove(isCombo ? undefined : id, isCombo ? id : undefined)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                    <span className="ml-auto font-bold text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card p-5 h-fit sticky top-24">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Items Total</span><span className="font-semibold">₹{totalAmount}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Delivery Fee</span><span className="text-green-500 font-semibold">FREE</span></div>
            <div className="flex justify-between"><span className="text-gray-500">GST (5%)</span><span className="font-semibold">₹{tax.toFixed(0)}</span></div>
            <hr className="border-gray-100 dark:border-gray-800" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary-500">₹{(totalAmount + tax).toFixed(0)}</span>
            </div>
          </div>
          <button onClick={() => router.push('/checkout')} className="btn-primary w-full mt-5 flex items-center justify-center gap-2">
            Proceed to Checkout <ArrowRight size={18} />
          </button>
          <Link href="/menu" className="block text-center text-primary-500 text-sm font-semibold mt-3 hover:text-primary-600">
            Add more items
          </Link>
        </div>
      </div>
    </div>
  )
}
