import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/router'
import { X, Trash2, Plus, Minus, ShoppingCart, Package } from 'lucide-react'
import { closeCart, updateCartItem, removeFromCart } from '../../redux/slices/cartSlice'
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
export default function CartDrawer() {
  const router = useRouter()
  const dispatch = useDispatch()
  const navigate = router.push
  const { items, totalAmount, isOpen } = useSelector(s => s.cart)

  // Check if item is a combo or product
  const isComboItem = (item) => !!item.comboId;

  // Get ID for update function - product or combo
  const getItemId = (item) => {
    if (item.comboId) return item.comboId._id || item.comboId;
    if (item.product) return item.product._id || item.product;
    return undefined;
  };



  const handleUpdate = (productId, comboId, quantity) => {
    if (!productId && !comboId) return console.warn('missing productId or comboId for update')
    if (quantity < 0) {
      if (productId) dispatch(removeFromCart({ productId }))
      else if (comboId) dispatch(removeFromCart({ comboId }))
    } else {
      if (productId) dispatch(updateCartItem({ productId, quantity }))
      else if (comboId) dispatch(updateCartItem({ comboId, quantity }))
    }
  }

  const handleCheckout = () => { dispatch(closeCart()); navigate('/checkout') }

  return (
    <>
      {/* Overlay */}
      <div onClick={() => dispatch(closeCart())}
        className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white dark:bg-gray-900 shadow-2xl flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
          <ShoppingCart size={22} className="text-primary-500" />
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white flex-1">Your Cart</h2>
          <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{items.length} items</span>
          <button onClick={() => dispatch(closeCart())} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <ShoppingCart size={36} className="text-gray-300" />
              </div>
              <div>
                <p className="font-semibold text-gray-700 dark:text-gray-300">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Add items from the menu to get started</p>
              </div>
              <button onClick={() => { dispatch(closeCart()); navigate('/menu') }} className="btn-primary text-sm py-2.5">
                Browse Menu
              </button>
            </div>
          ) : (
            items.map((item, idx) => {
              const id = getItemId(item);
              const combo = isComboItem(item);
              // if id is undefined or duplicates, fall back to index
              const key = id ? `${id}` : `item-${idx}`;

              // Debug: Log item structure
              console.log('CartDrawer item:', item);

              // Handle both populated object or raw ObjectId
              let imageUrl = null;
              let name = '';

              if (combo) {
                // Combo item - comboId can be object (populated) or ObjectId
                const comboData = item.comboId;
                if (comboData && typeof comboData === 'object') {
                  // Populated with data
                  imageUrl = comboData.comboImage ? `${baseUrl}${comboData.comboImage}` : null;
                  name = comboData.comboName || 'Combo';
                } else {
                  // Just ObjectId - show placeholder
                  name = 'Combo';
                }
              } else {
                // Product item
                imageUrl = item.product?.images?.[0]?.url ? `${baseUrl}${item.product.images[0].url}` : null;
                name = item.product?.name || 'Product';
              }

              return (
                <div key={key} className="flex gap-3 p-3 card border border-gray-100 dark:border-gray-800">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      <Package size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1 mb-1">
                      {combo && (
                        <span className="bg-primary-100 dark:bg-primary-500/20 text-primary-600 text-xs px-1.5 py-0.5 rounded shrink-0">
                          <Package size={10} className="inline" />
                        </span>
                      )}
                      {!combo && (
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${item.product?.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                          <span className={`w-2 h-2 rounded-full ${item.product?.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                      )}
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                    </div>
                    <p className="text-primary-500 font-bold text-sm">₹{(item.price * item.quantity).toFixed(0)}</p>
                    
                    {/* AddOnes Display */}
                    {item.addOnes && item.addOnes.length > 0 && (
                      <div className="mt-1">
                        {item.addOnes.map((addOn, idx) => (
                          <p key={idx} className="text-xs text-gray-500">+ {addOn.name} ₹{addOn.price * addOn.quantity}</p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400">₹{item.price} each</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => handleUpdate(combo ? undefined : id, combo ? id : undefined, 0)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleUpdate(combo ? undefined : id, combo ? id : undefined, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => handleUpdate(combo ? undefined : id, combo ? id : undefined, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">₹{totalAmount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Delivery Fee</span>
              <span className="text-green-500 font-semibold">FREE</span>
            </div>
            <div className="flex items-center justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary-500">₹{totalAmount}</span>
            </div>
            <button onClick={handleCheckout} className="btn-primary w-full text-center">
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
