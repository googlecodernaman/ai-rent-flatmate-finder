import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const defaultRole = location.state?.role || 'TENANT'

  const [form, setForm] = useState({ name: '', email: '', password: '', role: defaultRole })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (form.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const user = await register(form.name, form.email, form.password, form.role)
      toast.success(`Account created! Welcome, ${user.name}.`)
      if (user.role === 'TENANT') navigate('/profile')
      else navigate('/my-listings')
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed'
      const code = err.response?.data?.error?.code
      if (code === 'DUPLICATE_EMAIL') setErrors({ email: 'Email already in use' })
      else setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="text-display-lg font-bold text-primary tracking-tighter">NivasAI</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-headline-lg-mobile font-bold text-on-surface mb-2">Create an account</h1>
          <p className="text-body-sm text-on-surface-variant mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
          </p>

          {errors.general && (
            <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Full Name</label>
              <input
                type="text"
                className={`input-base ${errors.name ? 'border-error focus:ring-error/10' : ''}`}
                placeholder="John Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoComplete="name"
              />
              {errors.name && <p className="mt-1 text-[12px] text-error">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Email</label>
              <input
                type="email"
                className={`input-base ${errors.email ? 'border-error focus:ring-error/10' : ''}`}
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-[12px] text-error">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Password</label>
              <input
                type="password"
                className={`input-base ${errors.password ? 'border-error focus:ring-error/10' : ''}`}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
              />
              {errors.password && <p className="mt-1 text-[12px] text-error">{errors.password}</p>}
            </div>

            <div className="pt-2">
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`
                  border rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-colors
                  ${form.role === 'TENANT' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:bg-surface-container text-on-surface-variant'}
                `}>
                  <input
                    type="radio"
                    name="role"
                    value="TENANT"
                    checked={form.role === 'TENANT'}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-[24px]">person_search</span>
                  <span className="text-body-sm font-semibold">Find a Place</span>
                </label>
                <label className={`
                  border rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-colors
                  ${form.role === 'OWNER' ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant hover:bg-surface-container text-on-surface-variant'}
                `}>
                  <input
                    type="radio"
                    name="role"
                    value="OWNER"
                    checked={form.role === 'OWNER'}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-[24px]">real_estate_agent</span>
                  <span className="text-body-sm font-semibold">List a Place</span>
                </label>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-6">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
