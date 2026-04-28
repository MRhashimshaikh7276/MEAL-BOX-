import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useDispatch, useSelector } from 'react-redux'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useState } from 'react'
import { loginUser } from '../../redux/slices/authSlice'

export default function LoginPage() {
  const dispatch = useDispatch()
  const { loading } = useSelector(s => s.auth)
  const [showPass, setShowPass] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = (data) => dispatch(loginUser(data))

  return (
    <>  
      <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Welcome back!</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Sign in to continue ordering</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" placeholder="you@example.com"
              className={`input pl-10 ${errors.email ? 'ring-2 ring-red-400' : ''}`}
              {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })} />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex justify-between mb-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
            <Link href="/forgot-password" className="text-xs text-primary-500 hover:text-primary-600 font-medium">Forgot password?</Link>
          </div>
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
    
        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span> : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
        Don't have an account? <Link href="/register" className="text-primary-500 font-semibold hover:text-primary-600">Sign up</Link>
      </p>
    </>
  )
}
