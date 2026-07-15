import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../lib/api'
import { PageLoader, ErrorState } from '../../components/ui/States'
import toast from 'react-hot-toast'

const ROOM_TYPES = ['SINGLE', 'SHARED', 'STUDIO']
const FURNISHING = ['FURNISHED', 'SEMI_FURNISHED', 'UNFURNISHED']
const GENDER_PREF = ['ANY', 'MALE', 'FEMALE']

const defaultForm = {
  title: '',
  description: '',
  location: '',
  rent: '',
  roomType: 'SINGLE',
  furnishingStatus: 'FURNISHED',
  availableFrom: '',
  occupantsAllowed: 1,
  preferredGender: 'ANY',
  amenities: '',
}

export default function ListingForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        const { data } = await api.get(`/listings/${id}`)
        const amenities = data.amenities ? JSON.parse(data.amenities).join(', ') : ''
        setForm({
          title: data.title,
          description: data.description || '',
          location: data.location,
          rent: data.rent,
          roomType: data.roomType,
          furnishingStatus: data.furnishingStatus,
          availableFrom: data.availableFrom ? data.availableFrom.split('T')[0] : '',
          occupantsAllowed: data.occupantsAllowed || 1,
          preferredGender: data.preferredGender || 'ANY',
          amenities,
        })
        setPhotos(data.photos || [])
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Failed to load listing')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isEdit])

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach((f) => fd.append('photos', f))
      const { data } = await api.post('/listings/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPhotos((prev) => [...prev, ...(data.urls || [])])
      toast.success('Photos uploaded')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const amenitiesArr = form.amenities
        ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean)
        : []
      const payload = {
        ...form,
        rent: Number(form.rent),
        occupantsAllowed: Number(form.occupantsAllowed),
        availableFrom: new Date(form.availableFrom).toISOString(),
        amenities: JSON.stringify(amenitiesArr),
        photos,
      }
      if (isEdit) {
        await api.put(`/listings/${id}`, payload)
        toast.success('Listing updated!')
      } else {
        await api.post('/listings', payload)
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
        {/* Basic info */}
        <div className="card p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-surface">Basic Information</h2>

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

        {/* Pricing & availability */}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Occupants Allowed</label>
              <input className="input-base" type="number" min="1" max="10" value={form.occupantsAllowed} onChange={f('occupantsAllowed')} />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-on-surface mb-1.5">Preferred Gender</label>
              <select className="input-base" value={form.preferredGender} onChange={f('preferredGender')}>
                {GENDER_PREF.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="card p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-surface">Amenities</h2>
          <div>
            <label className="block text-body-sm font-semibold text-on-surface mb-1.5">
              Amenities <span className="font-normal text-on-surface-variant">(comma-separated)</span>
            </label>
            <input
              className="input-base"
              placeholder="e.g. WiFi, AC, Parking, Gym"
              value={form.amenities}
              onChange={f('amenities')}
            />
          </div>
        </div>

        {/* Photos */}
        <div className="card p-6 space-y-4">
          <h2 className="text-title-md font-semibold text-on-surface">Photos</h2>

          {photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {photos.map((url, i) => (
                <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden bg-surface-container">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer border-2 border-dashed border-outline-variant rounded-xl p-4 hover:border-primary transition-colors">
            <span className="material-symbols-outlined text-primary text-[24px]">
              {uploading ? 'hourglass_empty' : 'upload'}
            </span>
            <div>
              <p className="text-body-sm font-semibold text-on-surface">{uploading ? 'Uploading…' : 'Upload Photos'}</p>
              <p className="text-body-sm text-on-surface-variant text-[12px]">JPG, PNG — up to 5 files</p>
            </div>
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*"
              disabled={uploading}
              onChange={handlePhotoUpload}
            />
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 py-3">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                {isEdit ? 'Updating…' : 'Creating…'}
              </span>
            ) : (
              isEdit ? 'Update Listing' : 'Create Listing'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
