import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { Plus, Pencil, Trash2, Search, Star, Eye } from 'lucide-react'
import { productAPI, categoryAPI, subcategoryAPI, subsubcategoryAPI } from '../../services/api'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'
export const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL
export default function AdminProducts() {
  const router = useRouter()
  const navigate = router.push
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [subsubcategories, setSubsubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, data: null })
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({
    name: '', description: '', price: '', discountPrice: '', categoryId: '',
    subcategoryId: '', subSubcategoryId: '', preparationTime: 15,
    isVeg: true, isAvailable: true, images: []
  })

  const load = async () => {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([productAPI.getAll({ limit: 100 }), categoryAPI.getAll()])
      setProducts(p.data.products || [])
      setCategories(c.data.categories || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const loadSubcategories = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([])
      setSubsubcategories([])
      return
    }
    try {
      const r = await subcategoryAPI.getAll(categoryId)
      setSubcategories(r.data.subcategories || [])
      setSubsubcategories([])
    } catch {
      toast.error('Failed to load subcategories')
    }
  }

  const loadSubsubcategories = async (subcategoryId) => {
    if (!subcategoryId) {
      setSubsubcategories([])
      return
    }
    try {
      const r = await subsubcategoryAPI.getAll({ subcategoryId })
      setSubsubcategories(r.data.subsubcategories || [])
    } catch {
      toast.error('Failed to load sub-subcategories')
    }
  }

  useEffect(() => { load() }, [])

  const openModal = (prod = null) => {
    if (prod) {
      const catId = prod.categoryId?._id || prod.categoryId || ''
      const subId = prod.subcategoryId?._id || prod.subcategoryId || ''
      setForm({
        name: prod.name,
        description: prod.description,
        price: prod.price,
        discountPrice: prod.discountPrice || '',
        categoryId: catId,
        subcategoryId: subId,
        subSubcategoryId: prod.subSubcategoryId?._id || prod.subSubcategoryId || '',
        preparationTime: prod.preparationTime || 15,
        isVeg: prod.isVeg,
        isAvailable: prod.isAvailable,
        images: [] // do not load old images; user must re-select if they want to replace
      })
      if (catId) loadSubcategories(catId)
      if (subId) loadSubsubcategories(subId)
    } else {
      setForm({
        name: '', description: '', price: '', discountPrice: '', categoryId: '',
        subcategoryId: '', subSubcategoryId: '', preparationTime: 15,
        isVeg: true, isAvailable: true, images: []
      })
      setSubcategories([])
      setSubsubcategories([])
    }
    // clear the file input's internal state so previous selections don't persist
    if (fileInputRef.current) fileInputRef.current.value = ''
    setModal({ open: true, data: prod })
  }

  const handleSave = async () => {

    if (!form.name || !form.price || !form.categoryId) { toast.error('Fill all required fields'); return }
    setSaving(true)
    try {
      // build a proper FormData instance so multer can pick up the files
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('description', form.description)
      formData.append('price', form.price)
      if (form.discountPrice) formData.append('discountPrice', form.discountPrice)
      formData.append('categoryId', form.categoryId)
      if (form.subcategoryId) formData.append('subcategoryId', form.subcategoryId)
      if (form.subSubcategoryId) formData.append('subSubcategoryId', form.subSubcategoryId)
      formData.append('isVeg', form.isVeg)
      formData.append('isAvailable', form.isAvailable)
      if (form.preparationTime) formData.append('preparationTime', form.preparationTime)

      // append each file under the exact field name expected by upload.array()
      // only append actual File objects, never backend image objects (which are strings)
      form.images.forEach(file => {
        if (file instanceof File) formData.append('images', file)
      })

      if (modal.data) {
        await productAPI.update(modal.data._id, formData)
        toast.success('Updated!')
      } else {
        await productAPI.create(formData)
        toast.success('Product created!')
      }

      setModal({ open: false, data: null })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return
    try { await productAPI.delete(id); toast.success('Deleted!'); load() }
    catch { toast.error('Failed to delete') }
  }

  const filtered = products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500">{products.length} total</p>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input pl-9 py-2.5 text-sm" />
          </div>
        </div>
        <button onClick={() => openModal()} className="btn-primary text-sm py-2.5 ml-auto flex items-center gap-2">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['Product', 'Category', 'Sub-Category', 'Sub-Sub-Category', 'Price', 'Rating', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                    {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td>)}
                  </tr>
                ))
              ) : filtered.map(prod => (
                <tr key={prod._id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={`${baseUrl}${prod.images?.[0]?.url}`}
                        alt={prod.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3 h-3 rounded border flex items-center justify-center ${prod.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${prod.isVeg ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          </span>
                          <p className="font-semibold text-gray-900 dark:text-white line-clamp-1">{prod.name}</p>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1">{prod.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{prod.categoryId?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{prod.subcategoryId?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{prod.subSubcategoryId?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">₹{prod.discountPrice || prod.price}</span>
                     
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star size={13} fill="currentColor" />
                      <span className="text-sm font-semibold">{prod.rating?.toFixed(1) || '0'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${prod.isAvailable ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                      {prod.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => navigate(`/admin/products/${prod._id}`)} className="p-2 text-green-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Eye size={15} />
                      </button>

                      <button onClick={() => openModal(prod)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(prod._id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Edit Product' : 'Add Product'} size="lg">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Product Name *</label>
            <input className="input" placeholder="e.g., Chicken Burger" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Product description..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Price (₹) *</label>
            <input type="number" className="input" placeholder="299" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount Price (₹)</label>
            <input type="number" className="input" placeholder="249" value={form.discountPrice} onChange={e => setForm(p => ({ ...p, discountPrice: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category *</label>
            <select className="input" value={form.categoryId} onChange={e => {
              const val = e.target.value
              setForm(p => ({ ...p, categoryId: val, subcategoryId: '', subSubcategoryId: '' }))
              loadSubcategories(val)
            }}> 
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5"> Sub Category *</label>
            <select className="input" value={form.subcategoryId} onChange={e => {
              const val = e.target.value
              setForm(p => ({ ...p, subcategoryId: val, subSubcategoryId: '' }))
              loadSubsubcategories(val)
            }}>
              <option value="">Select Sub Category</option>
              {subcategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sub Sub Category *</label>
            <select className="input" value={form.subSubcategoryId} onChange={e => setForm(p => ({ ...p, subSubcategoryId: e.target.value }))}>
              <option value="">Select Sub Sub Category</option>
              {subsubcategories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
            <select className="input" value={form.isVeg} onChange={e => setForm(p => ({ ...p, isVeg: e.target.value === 'true' }))}>
              <option value="true">🟢 Veg</option>
              <option value="false">🔴 Non-Veg</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Preparation Time (minutes)</label>
            <input type="number" className="input" placeholder="e.g., 15-30" value={form.preparationTime} onChange={e => setForm(p => ({ ...p, preparationTime: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold mb-1.5">
                Upload Images
              </label>

              <input
                ref={fileInputRef}
                type="file"
                name="images"
                multiple
                accept="image/*"
                className="input"
                onChange={(e) =>
                  setForm(p => ({
                    ...p,
                    images: Array.from(e.target.files)
                  }))
                }
              />
            </div>
            {/* <button onClick={() => setForm(p => ({ ...p, images: [...p.images, ''] }))}
              className="text-sm text-primary-500 font-semibold flex items-center gap-1 hover:text-primary-600">
              <Plus size={14} /> Add Image URL
            </button> */}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="avail" checked={form.isAvailable} onChange={e => setForm(p => ({ ...p, isAvailable: e.target.checked }))} className="w-4 h-4 accent-primary-500" />
            <label htmlFor="avail" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Available for order</label>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={() => setModal({ open: false, data: null })} className="btn-outline flex-1 text-sm py-2.5">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm py-2.5">
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
