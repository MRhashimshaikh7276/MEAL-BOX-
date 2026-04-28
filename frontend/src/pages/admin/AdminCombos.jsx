import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { comboAPI, productAPI } from '../../services/api'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'

const baseUrl = import.meta.env.VITE_SERVER_URL

export default function AdminCombos() {
  const [combos, setCombos] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, data: null })
  const [form, setForm] = useState({ 
    name: '', 
    description: '',
    comboPrice: '',
    discountAmount: 0,
    image: '', 
    status: true,
    products: [],
    preparationTime: 15
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await comboAPI.getAll()
      const combosData = (r.data.combos || []).map(c => ({
        ...c,
        products: c.products?.map(p => ({
          product: p.productId,
          quantity: p.quantity
        })) || [],
        status: c.status === 'active' || c.status === true,
      }))
      setCombos(combosData)
    } catch {
      toast.error('Failed to load combos')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const r = await productAPI.getAll({ isAvailable: true })
      setProducts(r.data.products || [])
    } catch {
      toast.error('Failed to load products')
    }
  }

  useEffect(() => { 
    load() 
    loadProducts()
  }, [])

  const openModal = (combo = null) => {
    if (combo) {
      // Handle both productId (from schema) and product (from old format)
      const productsList = combo.products?.map(p => ({
        product: p.product?._id || p.productId || p.product || '',
        quantity: p.quantity || 1
      })) || []
      
      setForm({
        name: combo.comboName || combo.name || '',
        description: combo.description || '',
        comboPrice: combo.comboPrice || '',
        discountAmount: combo.discountAmount || 0,
        image: combo.comboImage || combo.image || '',
        status: combo.status === 'active' || combo.status === true,
        products: productsList,
        preparationTime: combo.preparationTime || 15
      })
    } else {
      setForm({
        name: '',
        description: '',
        comboPrice: '',
        discountAmount: 0,
        image: '',
        status: true,
        products: [],
        preparationTime: 15
      })
    }
    setModal({ open: true, data: combo })
  }

  const addProduct = () => {
    setForm(p => ({
      ...p,
      products: [...p.products, { product: '', quantity: 1 }]
    }))
  }

  const removeProduct = (index) => {
    setForm(p => ({
      ...p,
      products: p.products.filter((_, i) => i !== index)
    }))
  }

  const updateProduct = (index, field, value) => {
    setForm(p => ({
      ...p,
      products: p.products.map((pr, i) => 
        i === index ? { ...pr, [field]: value } : pr
      )
    }))
  }

  const handleSave = async () => {
    if (!form.name) {
      toast.error('Combo name required')
      return
    }
    if (form.products.length === 0) {
      toast.error('At least one product is required')
      return
    }
    if (!form.comboPrice) {
      toast.error('Combo price is required')
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()

      formData.append("name", form.name)
      formData.append("description", form.description)
      formData.append("comboPrice", form.comboPrice)
      formData.append("discountAmount", form.discountAmount)
      formData.append("status", form.status)
      formData.append("preparationTime", form.preparationTime || 15)

      // Append products as JSON string
      formData.append("products", JSON.stringify(form.products))

      if (form.image instanceof File) {
        formData.append("image", form.image)
      }

      if (modal.data) {
        await comboAPI.update(modal.data._id, formData)
        toast.success('Updated!')
      } else {
        await comboAPI.create(formData)
        toast.success('Created!')
      }

      setModal({ open: false, data: null })
      load()

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    }
    finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this combo?')) return
    try { 
      await comboAPI.delete(id) 
      toast.success('Deleted!')
      load() 
    }
    catch { 
      toast.error('Failed to delete') 
    }
  }

  const filtered = combos.filter(c => 
    (c.comboName || c.name || '')?.toLowerCase().includes(search.toLowerCase())
  )

  const getProductName = (productId) => {
    const product = products.find(p => p._id === productId)
    return product?.name || 'Unknown Product'
  }

  const getProductPrice = (productId) => {
    const product = products.find(p => p._id === productId)
    return product?.discountPrice > 0 ? product.discountPrice : product?.price || 0
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Combos</h1>
          <p className="text-sm text-gray-500">{combos.length} total</p>
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
          <Plus size={16} /> Add Combo
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)
        ) : filtered.map(combo => (
          <div key={combo._id} className="card p-4 group hover:shadow-md transition-all">
            <div className="relative mb-3 rounded-xl overflow-hidden h-32">
              <img 
                src={`${baseUrl}${combo.comboImage}`} 
                alt={combo.comboName || combo.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{combo.comboName || combo.name}</h3>
                <p className="text-sm text-gray-500">
                  {combo.products?.length || 0} products • ₹{combo.comboPrice}
                </p>
                {(() => {
                  const isActive = combo.status === 'active' || combo.status === true;
                  return (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  )
                })()}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => openModal(combo)} 
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button 
                  onClick={() => handleDelete(combo._id)} 
                  className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={modal.open} 
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Edit Combo' : 'Add Combo'} 
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Combo Name</label>
            <input 
              className="input" 
              placeholder="e.g., Family Pack" 
              value={form.name} 
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} 
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea 
              className="input" 
              placeholder="e.g., A perfect combo for family"
              rows={2}
              value={form.description} 
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Combo Price (₹)</label>
              <input 
                type="number"
                className="input" 
                placeholder="e.g., 499" 
                value={form.comboPrice} 
                onChange={e => setForm(p => ({ ...p, comboPrice: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount Amount (₹)</label>
              <input 
                type="number"
                className="input" 
                placeholder="e.g., 50" 
                value={form.discountAmount} 
                onChange={e => setForm(p => ({ ...p, discountAmount: e.target.value }))} 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Preparation Time (min)</label>
              <input 
                type="number"
                className="input" 
                placeholder="e.g., 30" 
                value={form.preparationTime} 
                onChange={e => setForm(p => ({ ...p, preparationTime: e.target.value }))} 
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Products</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {form.products.map((p, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    className="input flex-1"
                    value={p.product}
                    onChange={e => updateProduct(index, 'product', e.target.value)}
                  >
                    <option value="">Select Product</option>
                    {products.map(prod => (
                      <option key={prod._id} value={prod._id}>
                        {prod.name} - ₹{prod.discountPrice > 0 ? prod.discountPrice : prod.price}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="input w-20"
                    placeholder="Qty"
                    value={p.quantity}
                    onChange={e => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                  />
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addProduct}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
            >
              <Plus size={14} /> Add Product
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Combo Image</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={e =>
                setForm(p => ({
                  ...p,
                  image: e.target.files[0]
                }))
              }
            />
            {form.image && (
              <img
                src={
                  typeof form.image === "string"
                    ? `${baseUrl}${form.image}`
                    : URL.createObjectURL(form.image)
                }
                alt="preview"
                className="mt-2 h-24 w-full object-cover rounded-xl"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select 
              className="input" 
              value={form.status ? 'true' : 'false'} 
              onChange={e => setForm(p => ({ ...p, status: e.target.value === 'true' }))}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
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
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
