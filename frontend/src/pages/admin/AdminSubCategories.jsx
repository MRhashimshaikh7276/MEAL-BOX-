import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { categoryAPI, subcategoryAPI } from '../../services/api'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'
const baseUrl = import.meta.env.VITE_SERVER_URL;
export default function AdminSubCategories() {
  const [categories, setCategories] = useState([]) // parent categories
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, data: null })
  const [form, setForm] = useState({ name: '', categoryId: '', image: '', status: 'active' })
  const [saving, setSaving] = useState(false)

  const loadParentCategories = async () => {
    try {
      const res = await categoryAPI.getAll()
      setCategories(res.data.categories || [])
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  const loadSubcategories = async () => {
    setLoading(true)
    try {
      const r = await subcategoryAPI.getAll()
      const subs = (r.data.subcategories || []).map(s => ({
        ...s,
        status: s.status === 'active' || s.status === true,
        categoryName: s.categoryId?.name || 'Unknown',
      }))
      setSubcategories(subs)
    } catch {
      toast.error('Failed to load subcategories')
    } finally {
      setLoading(false)
    }
  }

  const load = async () => {
    setLoading(true)
    await loadParentCategories()
    await loadSubcategories()
  }

  useEffect(() => { load() }, [])

  const openModal = (sub = null) => {
    setForm(sub ? {
      name: sub.name,
      categoryId: sub.categoryId?._id || sub.categoryId || '',
      image: sub.image || '',
      status: typeof sub.status === 'string' ? sub.status === 'active' : !!sub.status,
    } : { name: '', categoryId: '', image: '', status: true })
    setModal({ open: true, data: sub })
  }

  const handleSave = async () => {
    if (!form.name) { toast.error('Name required'); return }
    if (!form.categoryId) { toast.error('Please select a category'); return }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('categoryId', form.categoryId)
      formData.append('status', form.status)
      if (form.image instanceof File) {
        formData.append('image', form.image)
      } else if (form.image && !form.image.startsWith('http') && !form.image.startsWith('data:')) {
        // Only append if it's a file path, not a URL
        formData.append('image', form.image)
      }

      if (modal.data) {
        await subcategoryAPI.update(modal.data._id, formData)
        toast.success('Subcategory updated!')
      } else {
        await subcategoryAPI.create(formData)
        toast.success('Subcategory created!')
      }
      setModal({ open: false, data: null })
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subcategory?')) return
    try {
      await subcategoryAPI.delete(id)
      toast.success('Subcategory deleted!')
      load()
    } catch {
      toast.error('Failed to delete subcategory')
    }
  }

  const filtered = subcategories.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Sub Categories</h1>
          <p className="text-sm text-gray-500">{subcategories.length} total</p>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input pl-9 py-2.5 text-sm" />
          </div>
        </div>
        <button onClick={() => openModal()} className="btn-primary text-sm py-2.5 ml-auto flex items-center gap-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)
        ) : filtered.map(sub => (
          <div key={sub._id} className="card p-4 group hover:shadow-md transition-all">
            <div className="relative mb-3 rounded-xl overflow-hidden h-32">
              <img src={`${baseUrl}${sub.image}`} alt={sub.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{sub.name}</h3>
                <p className="text-xs text-gray-500">{sub.categoryName}</p>
                {(() => {
                  const isActive = sub.status === 'active' || sub.status === true;
                  return (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  )
                })()}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(sub)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(sub._id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Edit Sub Category' : 'Add Sub Category'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Category <span className='text-red-500'>*</span></label>
            <select className='w-full input p-3 border' name="categoryId" id="categoryId" value={form.categoryId || ''} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sub Category Name</label>
            <input className="input" placeholder="e.g., Burgers" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Image</label>
            <input type="file" accept="image/*" className="input file-input file-input-bordered w-full" onChange={e => setForm(p => ({ ...p, image: e.target.files[0] || '' }))} />
            {form.image && (
              typeof form.image === 'string'
                ? <img src={`${baseUrl}${form.image}`} alt="preview" className="mt-2 h-24 w-full object-cover rounded-xl" />
                : <p className="mt-2 text-sm text-gray-500">{form.image.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal({ open: false, data: null })} className="btn-outline flex-1 text-sm py-2.5">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm py-2.5">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
