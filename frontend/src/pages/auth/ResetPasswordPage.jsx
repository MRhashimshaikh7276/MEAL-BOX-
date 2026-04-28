import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try { await authAPI.resetPassword(token, data.password); toast.success('Password reset!'); navigate('/login') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to reset password') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <Link to="/login" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Login
      </Link>
      <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Reset password</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter your new password below</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
              className={`input pl-10 pr-10 ${errors.password ? 'ring-2 ring-red-400' : ''}`}
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
              className={`input pl-10 pr-10 ${errors.confirmPassword ? 'ring-2 ring-red-400' : ''}`}
              {...register('confirmPassword', { validate: v => v === watch('password') || 'Passwords do not match' })} />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting...</span> : 'Reset Password'}
        </button>
      </form>
    </div>
  )
}