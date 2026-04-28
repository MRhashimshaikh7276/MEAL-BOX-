import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { categoryAPI, subcategoryAPI, subsubcategoryAPI } from '../../services/api'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
export default function AdminSubSubCategories() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [subsubcategories, setSubsubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, data: null })
  // status will be a boolean in the form (true = active, false = inactive)
  const [form, setForm] = useState({ categoryId: '', subcategoryId: '', name: '', image: '', status: 'active' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [rCats, rSubs] = await Promise.all([categoryAPI.getAll(), subsubcategoryAPI.getAll()])
      const cats = (rCats.data.categories || []).map(c => ({
        ...c,
        status: c.status === 'active' || c.status === true,
      }))
      setCategories(cats)

      const subsu = (rSubs.data.subsubcategories || []).map(s => ({
        ...s,
        status: s.status === 'active' || s.status === true,
      }))
      setSubsubcategories(subsu)
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const loadSubcategories = async (catId) => {
    if (!catId) {
      setSubcategories([])
      return
    }
    try {
      const r = await subcategoryAPI.getAll(catId)
      setSubcategories((r.data.subcategories || []).map(s => ({
        ...s,
        status: s.status === 'active' || s.status === true,
      })))
    } catch {
      toast.error('Could not load subcategories')
    }
  }

  const openModal = (item = null) => {
    if (item) {
      // item is a sub‑sub‑category record; after backend update it will contain
      // a populated `subSubcategoryId` with its parent and category info.
      const categoryId = item.subcategoryId?.categoryId?._id || ''
      const subId = item.subcategoryId?._id || ''
      setForm({
        categoryId,
        subcategoryId: subId,
        name: item.name,
        image: item.image || '',
        status: typeof item.status === 'string' ? item.status === 'active' : !!item.status,
      })
      if (categoryId) loadSubcategories(categoryId)
    } else {
      setForm({ categoryId: '', subSubcategoryId: '', name: '', image: '', status: 'active' })
    }
    setModal({ open: true, data: item })
  }

  const handleSave = async () => {
    if (!form.name) { toast.error('Name required'); return }
    if (!form.subcategoryId) { toast.error('Please select a subcategory'); return }
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      formData.append('subcategoryId', form.subcategoryId)
      formData.append('status', form.status)
      if (form.image && form.image instanceof File) {
        formData.append('image', form.image)
      }

      if (modal.data) {
        await subsubcategoryAPI.update(modal.data._id, formData)
        toast.success('Updated!')
      } else {
        await subsubcategoryAPI.create(formData)
        toast.success('Created!')
      }
      setModal({ open: false, data: null })
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this sub‑subcategory?')) return
    try { await subsubcategoryAPI.delete(id); toast.success('Deleted!'); load() }
    catch { toast.error('Failed to delete') }
  }

  const filtered = subsubcategories.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Sub Sub Categories</h1>
          <p className="text-sm text-gray-500">{subsubcategories.length} total</p>
        </div>
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input pl-9 py-2.5 text-sm" />
          </div>
        </div>
        <button onClick={() => openModal()} className="btn-primary text-sm py-2.5 ml-auto flex items-center gap-2">
          <Plus size={16} /> Add Sub Sub Category
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)
        ) : filtered.map(item => (
          <div key={item._id} className="card p-4 group hover:shadow-md transition-all">
            <div className="relative mb-3 rounded-xl overflow-hidden h-32">
              <img src={`${baseUrl}${item.image}`} alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{item.name}</h3>
                <p className="text-xs text-gray-500">
                  {item.subcategoryId?.name || '—'}{' / '}
                  {item.subcategoryId?.categoryId?.name || '—'}
                </p>
                {(() => {
                  const isActive = item.status === 'active' || item.status === true;
                  return (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  )
                })()}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(item)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(item._id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Edit Sub Sub Category' : 'Add Sub Sub Category'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Category <span className='text-red-500'>*</span></label>
            <select
              className='w-full input p-3 border'
              name="categoryId"
              id="categoryId"
              value={form.categoryId || ''}
              onChange={e => {
                const val = e.target.value
                setForm(p => ({ ...p, categoryId: val, subSubcategoryId: '' }))
                loadSubcategories(val)
              }}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Select Subcategory <span className='text-red-500'>*</span></label>
            <select
              className='w-full input p-3 border'
              name="subcategoryId"
              id="subcategoryId"
              value={form.subcategoryId || ''}
              onChange={e => setForm(p => ({ ...p, subcategoryId: e.target.value }))}
            >
              <option value="">Select Subcategory</option>
              {subcategories.map(sub => (
                <option key={sub._id} value={sub._id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Sub‑Sub Category Name</label>
            <input className="input" placeholder="e.g., Burgers" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Image</label>
            <input
              type="file"
              accept="image/*"
              className="input file-input file-input-bordered w-full"
              onChange={e =>
                setForm(p => ({
                  ...p,
                  image: e.target.files[0]
                }))
              }
            />
            {form.image && (
              typeof form.image === "string" ? (
                <img
                  src={`${baseUrl}${form.image}`}
                  alt="preview"
                  className="mt-2 h-24 w-full object-cover rounded-xl"
                />
              ) : (
                <img
                  src={URL.createObjectURL(form.image)}
                  alt="preview"
                  className="mt-2 h-24 w-full object-cover rounded-xl"
                />
              )
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            {/* the select still uses string values but we convert to boolean on change */}
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
