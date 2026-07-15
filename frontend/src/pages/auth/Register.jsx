import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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

  const Field = ({ name, label, type = 'text', placeholder, autocomplete }) => (
    <div>
      <label className="block text-body-sm font-semibold text-on-surface mb-1.5">{label}</label>
      <input
        type={type}
        className={`input-base ${errors[name] ? 'border-error focus:ring-error/10' : ''}`}
        placeholder={placeholder}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        autoComplete={autocomplete}
      />
      {errors[name] && <p className="mt-1 text-[12px] text-error">{errors[name]}</p>}
    </div>
  )

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="text-display-lg font-bold text-primary tracking-tighter">NivasAI</span>
        </Link>

        <div className="card p-8">
          <h1 className="text-headline-lg-mobile font-bold text-on-surface mb-2">Create account</h1>
          <p className="text-body-sm text-on-surface-variant mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">Sign in</Link>
          </p>

          {errors.general && (
            <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
              {errors.general}
            </div>
          )}

          {/* Role selector */}
          <div className="mb-5">
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">I am a…</label>
            <div className="grid grid-cols-2 gap-2">
              {['TENANT', 'OWNER'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`py-2.5 rounded-lg border text-body-sm font-semibold transition-all ${
                    form.role === r
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface border-outline-variant text-on-surface-variant hover:border-primary/50'
                  }`}
                >
                  {r === 'TENANT' ? '🏠 Tenant' : '🔑 Owner'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field name="name" label="Full Name" placeholder="Sneha Patel" autocomplete="name" />
            <Field name="email" label="Email" type="email" placeholder="you@example.com" autocomplete="email" />
            <Field name="password" label="Password" type="password" placeholder="Min 8 characters" autocomplete="new-password" />

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-title-md mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
