import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { PageLoader, EmptyState, ErrorState } from '../../components/ui/States'
import { RoomTypeBadge } from '../../components/ui/Badges'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ManageListings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/listings?page=${p}&limit=20`)
      setListings(data.data || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const handleDelete = async (id) => {
    if (!confirm('Delete this listing?')) return
    setActionLoading(id)
    try {
      await api.delete(`/admin/listings/${id}`)
      setListings((prev) => prev.filter((l) => l.id !== id))
      toast.success('Listing deleted')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to delete')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading && listings.length === 0) return <div className="p-margin-desktop"><PageLoader /></div>
  if (error) return <div className="p-margin-desktop"><ErrorState message={error} onRetry={() => load(page)} /></div>

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background">Manage Listings</h1>
        <p className="text-body-md text-on-surface-variant mt-unit">{pagination?.total ?? listings.length} total listings</p>
      </header>

      {listings.length === 0 ? (
        <EmptyState icon="domain" title="No listings found" />
      ) : (
        <>
          <div className="space-y-stack-md">
            {listings.map((listing) => (
              <div key={listing.id} className="card p-4 flex flex-col md:flex-row gap-4">
                <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden bg-surface-container shrink-0">
                  {listing.photos?.[0] ? (
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[28px] text-on-surface-variant/20">apartment</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="text-body-md font-semibold text-on-surface truncate">{listing.title}</h3>
                      <p className="text-body-sm text-on-surface-variant text-[12px]">{listing.location}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={actionLoading === listing.id}
                      className="p-2 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <RoomTypeBadge type={listing.roomType} />
                    <span className="text-body-sm font-semibold text-on-surface">₹{listing.rent.toLocaleString('en-IN')}/mo</span>
                    <span className="text-body-sm text-on-surface-variant text-[12px]">by {listing.owner?.name}</span>
                    <span className="text-body-sm text-on-surface-variant text-[12px]">
                      {format(new Date(listing.createdAt), 'dd MMM yyyy')}
                    </span>
                    {listing.isFilled && <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">FILLED</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button className="btn-secondary text-body-sm py-2 px-4" disabled={page === 1} onClick={() => { setPage(page - 1); load(page - 1) }}>Previous</button>
              <span className="text-body-sm text-on-surface-variant">Page {page} of {pagination.pages}</span>
              <button className="btn-secondary text-body-sm py-2 px-4" disabled={page >= pagination.pages} onClick={() => { setPage(page + 1); load(page + 1) }}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
