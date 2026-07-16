import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import { PageLoader, ErrorState } from '../../components/ui/States'
import toast from 'react-hot-toast'

const ROOM_TYPES = ['SINGLE', 'SHARED', 'STUDIO']
const FURNISHING = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED']

export default function ListingForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    intent: 'ENTIRE_PROPERTY',
    title: '',
    description: '',
    location: '',
    rent: '',
    roomType: 'SINGLE',
    furnishingStatus: 'FURNISHED',
    availableFrom: '',
  })

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  const [existingPhotos, setExistingPhotos] = useState([])
  const [newPhotos, setNewPhotos] = useState([])

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const { data } = await api.get(`/listings/${id}`)
        setForm({
          intent: data.intent || 'ENTIRE_PROPERTY',
          title: data.title,
          description: data.description || '',
          location: data.location,
          rent: data.rent,
          roomType: data.roomType,
          furnishingStatus: data.furnishingStatus,
          availableFrom: data.availableFrom ? data.availableFrom.split('T')[0] : '',
        })
        setExistingPhotos(data.photos || [])
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Failed to load listing')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isEdit])

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setNewPhotos((prev) => [...prev, ...files])
  }

  const removeNewPhoto = (index) => {
    setNewPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('intent', form.intent)
      fd.append('title', form.title)
      if (form.description) fd.append('description', form.description)
      fd.append('location', form.location)
      fd.append('rent', Number(form.rent))
      fd.append('roomType', form.roomType)
      fd.append('furnishingStatus', form.furnishingStatus)
      fd.append('availableFrom', new Date(form.availableFrom).toISOString())
      
      newPhotos.forEach((file) => fd.append('photos', file))

      if (isEdit) {
        await api.put(`/listings/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Listing updated!')
      } else {
        await api.post('/listings', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        toast.success('Listing created!')
      }
      navigate('/my-listings')
    } catch (e) {
      const msg = e.response?.data?.error?.message || 'Failed to save'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  if (loading) return <div className="p-margin-desktop"><PageLoader /></div>
  if (error) return <div className="p-margin-desktop"><ErrorState message={error} /></div>

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-2xl mx-auto">
      <header className="mb-stack-lg">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-body-sm text-on-surface-variant hover:text-primary mb-4 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background">
          {isEdit ? 'Edit Listing' : 'Create Listing'}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-gutter">
        <div className="card p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-surface">Basic Information</h2>
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-3">What are you listing?</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, intent: 'ENTIRE_PROPERTY' }))}
                className={`p-4 rounded-xl border-2 text-left transition-colors flex items-start gap-3 ${
                  form.intent === 'ENTIRE_PROPERTY'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-outline-variant hover:border-outline text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">key</span>
                <div>
                  <p className="font-semibold text-body-md text-on-surface">Entire Property</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">Rent out a full apartment or house.</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, intent: 'ROOMMATE' }))}
                className={`p-4 rounded-xl border-2 text-left transition-colors flex items-start gap-3 ${
                  form.intent === 'ROOMMATE'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-outline-variant hover:border-outline text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[24px]">group</span>
                <div>
                  <p className="font-semibold text-body-md text-on-surface">Flatmate Vacancy</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">List a room in a shared property.</p>
                </div>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Title *</label>
            <input className="input-base" required placeholder="e.g. Cozy Studio in Koramangala" value={form.title} onChange={f('title')} />
          </div>
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Location *</label>
            <input className="input-base" required placeholder="e.g. Koramangala, Bangalore" value={form.location} onChange={f('location')} />
          </div>
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Description</label>
            <textarea className="input-base resize-none h-24" placeholder="Describe the room, neighbourhood, etc." value={form.description} onChange={f('description')} />
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-surface">Pricing & Availability</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Monthly Rent (₹) *</label>
              <input className="input-base" type="number" required min="0" placeholder="15000" value={form.rent} onChange={f('rent')} />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Available From *</label>
              <input className="input-base" type="date" required value={form.availableFrom} onChange={f('availableFrom')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Room Type</label>
              <select className="input-base" value={form.roomType} onChange={f('roomType')}>
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Furnishing</label>
              <select className="input-base" value={form.furnishingStatus} onChange={f('furnishingStatus')}>
                {FURNISHING.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-surface">Photos</h2>
          
          {existingPhotos.length > 0 && (
            <div>
              <p className="text-body-sm text-on-surface-variant mb-2">Existing Photos (Cannot be removed via API)</p>
              <div className="flex gap-2 flex-wrap">
                {existingPhotos.map((url, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden bg-surface-container opacity-70">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {newPhotos.length > 0 && (
            <div>
              <p className="text-body-sm text-on-surface-variant mb-2">New Photos to Upload</p>
              <div className="flex gap-2 flex-wrap">
                {newPhotos.map((file, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden bg-surface-container">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center hover:bg-error/90"
                    >
                      <span className="material-symbols-outlined text-[12px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-outline-variant rounded-xl p-4 hover:border-primary transition-colors">
            <span className="material-symbols-outlined text-primary text-[24px]">add_photo_alternate</span>
            <div>
              <p className="text-body-sm font-semibold text-on-surface">Select Photos</p>
              <p className="text-body-sm text-on-surface-variant text-[12px]">JPG, PNG — Max 5MB</p>
            </div>
            <input type="file" className="hidden" multiple accept="image/jpeg,image/png,image/webp" onChange={handlePhotoSelect} />
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary" disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Listing'}
          </button>
        </div>
      </form>
    </div>
  )
}
