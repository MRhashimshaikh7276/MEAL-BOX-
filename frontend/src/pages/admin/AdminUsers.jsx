import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchAllUsers } from '../../redux/slices/adminSlice'
import { adminAPI } from '../../services/api'
import { Search, ShieldOff, Shield, Plus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../../components/common/Modal'

export default function AdminUsers() {
  const dispatch = useDispatch()
  const { users, loading } = useSelector(s => s.admin)
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  // Create user modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer'
  })

  useEffect(() => { dispatch(fetchAllUsers()) }, [])

  const handleBlock = async (user) => {
    setUpdatingId(user._id)
    try {
      if (user.isBlocked) { await adminAPI.unblockUser(user._id); toast.success('User unblocked!') }
      else { await adminAPI.blockUser(user._id); toast.success('User blocked!') }
      dispatch(fetchAllUsers())
    } catch { toast.error('Failed') }
    finally { setUpdatingId(null) }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await adminAPI.createUser(formData)
      toast.success('User created successfully!')
      setShowCreateModal(false)
      setFormData({ name: '', email: '', phone: '', password: '', role: 'customer' })
      dispatch(fetchAllUsers())
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const ROLE_BADGE = {
    customer: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
    delivery: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500">{users.length} registered users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          Create User
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="input pl-9 py-2.5 text-sm" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {['User', 'Phone', 'Role', 'Status', 'Joined', 'Action'].map(h => (
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
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400">No users found</td></tr>
              ) : filtered.map(user => (
                <tr key={user._id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 dark:bg-primary-500/20 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-primary-600 font-bold text-sm">{user.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${ROLE_BADGE[user.role] || ROLE_BADGE.customer}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.isBlocked ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'}`}>
                      {user.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {user.role !== 'admin' && (
                      <button onClick={() => handleBlock(user)} disabled={updatingId === user._id}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50 ${user.isBlocked ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'}`}>
                        {user.isBlocked ? <><Shield size={14} />Unblock</> : <><ShieldOff size={14} />Block</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New User" size="md">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="input w-full"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="input w-full"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              className="input w-full"
              placeholder="Enter password (min 6 characters)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              className="input w-full"
            >
              <option value="customer">Customer</option>
              <option value="delivery">Delivery Boy</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
