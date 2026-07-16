import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import { PageLoader, EmptyState, ErrorState } from '../../components/ui/States'
import { RoomTypeBadge, FurnishingBadge } from '../../components/ui/Badges'
import toast from 'react-hot-toast'

export default function MyListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/listings/my')
        setListings(Array.isArray(data) ? data : [])
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    try {
      await api.delete(`/listings/${id}`)
      setListings((prev) => prev.filter((l) => l.id !== id))
      toast.success('Listing deleted')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to delete')
    }
  }

  const handleToggle = async (listing) => {
    try {
      await api.patch(`/listings/${listing.id}/fill`)
      setListings((prev) => prev.map((l) => l.id === listing.id ? { ...l, isFilled: !l.isFilled } : l))
      toast.success(listing.isFilled ? 'Listing reopened' : 'Marked as filled')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to update')
    }
  }

  if (loading) return <div className="p-margin-desktop"><PageLoader /></div>
  if (error) return <div className="p-margin-desktop"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      <header className="mb-stack-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background">My Listings</h1>
          <p className="text-body-md text-on-surface-variant mt-unit">{listings.length} total</p>
        </div>
        <Link to="/my-listings/new" className="btn-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Listing
        </Link>
      </header>

      {listings.length === 0 ? (
        <EmptyState
          icon="add_home"
          title="No listings yet"
          description="Add your first listing to start receiving interest from tenants."
          action={<Link to="/my-listings/new" className="btn-primary">Create Listing</Link>}
        />
      ) : (
        <div className="space-y-stack-md">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className={`card p-4 flex flex-col md:flex-row gap-4 ${listing.isFilled ? 'opacity-60' : ''}`}
            >
              {/* Photo */}
              <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-surface-container shrink-0">
                {listing.photos?.[0] ? (
                  <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-[40px] text-on-surface-variant/20">apartment</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-title-md font-semibold text-on-surface truncate">{listing.title}</h2>
                  <div className="flex gap-1 shrink-0">
                    <Link
                      to={`/my-listings/${listing.id}/edit`}
                      className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mb-2">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {listing.location}
                </p>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <RoomTypeBadge type={listing.roomType} />
                  <FurnishingBadge status={listing.furnishingStatus} />
                  {listing.isFilled && (
                    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">FILLED</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-headline-lg-mobile font-bold text-on-surface">
                    ₹{listing.rent.toLocaleString('en-IN')}
                    <span className="text-body-sm font-normal text-on-surface-variant">/mo</span>
                  </span>
                  <button
                    onClick={() => handleToggle(listing)}
                    className={`text-body-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${
                      listing.isFilled
                        ? 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-variant'
                        : 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                    }`}
                  >
                    Mark {listing.isFilled ? 'Available' : 'as Filled'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
