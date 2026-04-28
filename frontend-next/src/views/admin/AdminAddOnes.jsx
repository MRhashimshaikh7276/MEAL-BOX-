import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { addOnesAPI, productAPI } from '../../services/api'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

export const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL

export default function AdminAddOnes() {
  const [addOnes, setAddOnes] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, data: null })
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    name: '',
    price: '',
    discountPrice: '',
    image: null,
    isAvailable: true,
    products: []
  })

  const load = async () => {
    setLoading(true)
    try {
      const [addOnesRes, productsRes] = await Promise.all([
        addOnesAPI.getAll(),
        productAPI.getAll()
      ])
      setAddOnes(addOnesRes.data.addOnes || [])
      setProducts(productsRes.data.products || [])
    } catch {
      toast.error('Failed to load add-ones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openModal = (item = null) => {
    if (item) {
      setForm({
        name: item.name,
        price: item.price,
        discountPrice: item.discountPrice || '',
        image: null,
        isAvailable: item.isAvailable,
        products: item.products || []
      })
    } else {
      setForm({
        name: '',
        price: '',
        discountPrice: '',
        image: null,
        isAvailable: true,
        products: []
      })
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
    setModal({ open: true, data: item })
  }

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Fill all required fields')
      return
    }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('price', form.price)
      if (form.discountPrice) formData.append('discountPrice', form.discountPrice)
      formData.append('isAvailable', form.isAvailable)
      formData.append('status', form.isAvailable ? 'true' : 'false')
      
      if (form.products.length > 0) {
        formData.append('products', form.products.join(','))
      }

      if (form.image instanceof File) {
        formData.append('image', form.image)
      }

      if (modal.data) {
        await addOnesAPI.update(modal.data._id, formData)
        toast.success('Updated!')
      } else {
        await addOnesAPI.create(formData)
        toast.success('Add-one created!')
      }

      setModal({ open: false, data: null })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this add-one?')) return
    try {
      await addOnesAPI.delete(id)
      toast.success('Deleted!')
      load()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = addOnes.filter(item =>
    item.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Add Ones</h1>
          <p className="text-sm text-gray-500">{addOnes.length} total</p>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="input pl-9 py-2.5 text-sm"
            />
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary text-sm py-2.5 ml-auto flex items-center gap-2"
        >
          <Plus size={16} /> Add Add-One
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Add-One', 'Price', 'Discount Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="skeleton h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.map(item => (
                <tr
                  key={item._id}
                  className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.images?.[0] ? (
                        <img
                          src={`${baseUrl}${item.images[0]}`}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No img</span>
                        </div>
                      )}
                      <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                        {item.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900 dark:text-white">
                      ₹{item.price}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.discountPrice ? (
                      <span className="font-bold text-green-600">₹{item.discountPrice}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-full ${item.isAvailable
                        ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500'
                        }`}
                    >
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    No add-ones found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Edit Add-One' : 'Add Add-One'}
        size="lg"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Name *
            </label>
            <input
              className="input"
              placeholder="e.g., Extra Cheese"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Price (₹) *
            </label>
            <input
              type="number"
              className="input"
              placeholder="50"
              value={form.price}
              onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Discount Price (₹)
            </label>
            <input
              type="number"
              className="input"
              placeholder="40"
              value={form.discountPrice}
              onChange={e => setForm(p => ({ ...p, discountPrice: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Available for Products
            </label>
            <p className="text-xs text-gray-500 mb-2">Leave empty to show for all products</p>
            <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 space-y-1">
              {products.map(prod => (
                <label key={prod._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={form.products.includes(prod._id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setForm(p => ({ ...p, products: [...p.products, prod._id] }))
                      } else {
                        setForm(p => ({ ...p, products: p.products.filter(id => id !== prod._id) }))
                      }
                    }}
                    className="w-4 h-4 accent-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{prod.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="input"
              onChange={e =>
                setForm(p => ({
                  ...p,
                  image: e.target.files[0] || null
                }))
              }
            />
            {modal.data?.images?.[0] && (
              <p className="text-xs text-gray-500 mt-1">
                Current: {modal.data.images[0]}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="avail"
              checked={form.isAvailable}
              onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))}
              className="w-4 h-4 accent-primary-500"
            />
            <label htmlFor="avail" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Available for order
            </label>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => setModal({ open: false, data: null })}
            className="btn-outline flex-1 text-sm py-2.5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 text-sm py-2.5"
          >
            {saving ? 'Saving...' : 'Save Add-One'}
          </button>
        </div>
      </Modal>
    </div>
  )
}