import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { categoryAPI } from '../../services/api'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'
const baseUrl = import.meta.env.VITE_SERVER_URL
export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, data: null })
  // status will be a boolean in the form (true = active, false = inactive)
  const [form, setForm] = useState({ name: '', image: '', status: 'active' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await categoryAPI.getAll()
      const cats = (r.data.categories || []).map(c => ({
        ...c,
        status: c.status === 'active' || c.status === true,
      }))
      setCategories(cats)
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openModal = (cat = null) => {
    setForm(cat ? {
      name: cat.name,
      image: cat.image || '',
      // accommodate both boolean and legacy string values coming from the API
      status: typeof cat.status === 'string' ? cat.status === 'active' : !!cat.status,
    } : { name: '', image: '', status: true })
    setModal({ open: true, data: cat })
  }

  // const handleSave = async () => {
  //   if (!form.name) { toast.error('Name required'); return }
  //   setSaving(true)
  //   try {

  //     if (modal.data) { await categoryAPI.update(modal.data._id, form); toast.success('Updated!') }
  //     else { await categoryAPI.create(form); toast.success('Created!') }
  //     setModal({ open: false, data: null })
  //     load()
  //   } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  //   finally { setSaving(false) }
  // }
  const handleSave = async () => {
    if (!form.name) {
      toast.error('Name required')
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()

      formData.append("name", form.name)
      formData.append("status", form.status)

      if (form.image instanceof File) {
        formData.append("image", form.image)
      }

      if (modal.data) {
        await categoryAPI.update(modal.data._id, formData)
        toast.success('Updated!')
      } else {
        await categoryAPI.create(formData)
        toast.success('Created!')
      }

      setModal({ open: false, data: null })
      load()

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
    finally {
      setSaving(false)
    }
  }
  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return
    try { await categoryAPI.delete(id); toast.success('Deleted!'); load() }
    catch { toast.error('Failed to delete') }
  }

  const filtered = categories.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} total</p>
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
        ) : filtered.map(cat => (
          <div key={cat._id} className="card p-4 group hover:shadow-md transition-all">
            <div className="relative mb-3 rounded-xl overflow-hidden h-32">
              <img src={`${baseUrl}${cat.image}`} alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{cat.name}</h3>
                {/* determine active state regardless of whether the status is a boolean or a string */}
                {(() => {
                  const isActive = cat.status === 'active' || cat.status === true;
                  return (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  )
                })()}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(cat)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => handleDelete(cat._id)} className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? 'Edit Category' : 'Add Category'} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category Name</label>
            <input className="input" placeholder="e.g., Burgers" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Image URL</label>
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
                    ? `${baseUrl}${form.image}`   // server image
                    : URL.createObjectURL(form.image) // local preview
                }
                alt="preview"
                className="mt-2 h-24 w-full object-cover rounded-xl"
              />
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
