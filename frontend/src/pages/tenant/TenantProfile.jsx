import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../lib/api'
import { PageLoader, EmptyState, ErrorState } from '../../components/ui/States'
import toast from 'react-hot-toast'

const LIFESTYLE_OPTIONS = {
  smokingAllowed: ['YES', 'NO', 'OUTSIDE_ONLY'],
  petsAllowed: ['YES', 'NO'],
  genderPreference: ['ANY', 'MALE', 'FEMALE'],
  occupationType: ['EMPLOYED', 'STUDENT', 'ANY'],
}

export default function TenantProfile() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    preferredLocation: '',
    budgetMin: '',
    budgetMax: '',
    moveInDate: '',
    smokingAllowed: 'NO',
    petsAllowed: 'NO',
    genderPreference: 'ANY',
    occupationType: 'ANY',
  })

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/tenant-profile')
        setProfile(data)
        setForm({
          preferredLocation: data.preferredLocation || '',
          budgetMin: data.budgetMin || '',
          budgetMax: data.budgetMax || '',
          moveInDate: data.moveInDate ? data.moveInDate.split('T')[0] : '',
          smokingAllowed: data.smokingAllowed || 'NO',
          petsAllowed: data.petsAllowed || 'NO',
          genderPreference: data.genderPreference || 'ANY',
          occupationType: data.occupationType || 'ANY',
        })
      } catch (e) {
        if (e.response?.status !== 404) setError(e.response?.data?.error?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        moveInDate: form.moveInDate ? new Date(form.moveInDate).toISOString() : undefined,
      }
      let data
      if (profile) {
        ;({ data } = await api.put('/tenant-profile', payload))
      } else {
        ;({ data } = await api.post('/tenant-profile', payload))
      }
      setProfile(data)
      toast.success('Profile saved!')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-margin-desktop"><PageLoader /></div>
  if (error) return <div className="p-margin-desktop"><ErrorState message={error} /></div>

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-2xl mx-auto">
      <header className="mb-stack-lg">
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background">My Profile</h1>
        <p className="text-body-md text-on-surface-variant mt-unit">
          Your preferences power the AI compatibility scoring.
        </p>
      </header>

      {/* User info card */}
      <div className="card p-6 mb-gutter flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[32px] text-primary">person</span>
        </div>
        <div>
          <h2 className="text-title-md font-semibold text-on-surface">{user?.name}</h2>
          <p className="text-body-sm text-on-surface-variant">{user?.email}</p>
          <span className="inline-flex px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-label-caps font-mono text-[10px] mt-1">
            TENANT
          </span>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="card p-6 space-y-6">
        <h2 className="text-title-md font-semibold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          Preferences
        </h2>

        {/* Location */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Preferred Location</label>
          <input
            className="input-base"
            type="text"
            placeholder="e.g. Koramangala, Bangalore"
            value={form.preferredLocation}
            onChange={(e) => setForm({ ...form, preferredLocation: e.target.value })}
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Monthly Budget (₹)</label>
          <div className="flex gap-3 items-center">
            <input
              className="input-base"
              type="number"
              placeholder="Min"
              value={form.budgetMin}
              onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
            />
            <span className="text-on-surface-variant">–</span>
            <input
              className="input-base"
              type="number"
              placeholder="Max"
              value={form.budgetMax}
              onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
            />
          </div>
        </div>

        {/* Move-in date */}
        <div>
          <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Preferred Move-in Date</label>
          <input
            className="input-base"
            type="date"
            value={form.moveInDate}
            onChange={(e) => setForm({ ...form, moveInDate: e.target.value })}
          />
        </div>

        {/* Lifestyle selects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'smokingAllowed', label: 'Smoking' },
            { key: 'petsAllowed', label: 'Pets' },
            { key: 'genderPreference', label: 'Gender Preference' },
            { key: 'occupationType', label: 'Occupation' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">{label}</label>
              <select
                className="input-base"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              >
                {LIFESTYLE_OPTIONS[key].map((v) => (
                  <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              Saving…
            </span>
          ) : profile ? 'Update Profile' : 'Create Profile'}
        </button>
      </form>
    </div>
  )
}
