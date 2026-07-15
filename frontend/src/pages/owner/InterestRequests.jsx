import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { StatusBadge, ScoreBadge } from '../../components/ui/Badges'
import { PageLoader, EmptyState, ErrorState } from '../../components/ui/States'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function InterestRequests() {
  const [interests, setInterests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('PENDING')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/interests/received')
        setInterests(data.data || [])
      } catch (e) {
        setError(e.response?.data?.error?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleAction = async (interestId, action) => {
    setActionLoading(interestId)
    try {
      const status = action === 'accept' ? 'ACCEPTED' : 'DECLINED'
      await api.patch(`/interests/${interestId}/status`, { status })
      setInterests((prev) =>
        prev.map((i) => (i.id === interestId ? { ...i, status } : i))
      )
      toast.success(action === 'accept' ? 'Interest accepted!' : 'Interest declined')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to update')
    } finally {
      setActionLoading(null)
    }
  }

  const counts = {
    PENDING: interests.filter((i) => i.status === 'PENDING').length,
    ACCEPTED: interests.filter((i) => i.status === 'ACCEPTED').length,
    DECLINED: interests.filter((i) => i.status === 'DECLINED').length,
  }

  const filtered = interests.filter((i) => i.status === tab)

  if (loading) return <div className="p-margin-desktop"><PageLoader /></div>
  if (error) return <div className="p-margin-desktop"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background">Interest Requests</h1>
        <p className="text-body-md text-on-surface-variant mt-unit">Manage tenant interest requests for your listings.</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-stack-lg overflow-x-auto no-scrollbar">
        {Object.entries(counts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setTab(status)}
            className={`shrink-0 px-4 py-2 rounded-full text-body-sm font-semibold transition-all border ${
              tab === status
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface border-outline-variant text-on-surface-variant hover:border-primary/50'
            }`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
            <span className="ml-1 opacity-70 text-[11px]">({count})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={tab === 'PENDING' ? 'hourglass_empty' : tab === 'ACCEPTED' ? 'check_circle' : 'cancel'}
          title={`No ${tab.toLowerCase()} requests`}
          description={tab === 'PENDING' ? 'New interest requests will appear here.' : ''}
        />
      ) : (
        <div className="space-y-stack-md">
          {filtered.map((interest) => {
            const tenant = interest.tenant
            const listing = interest.listing
            return (
              <div key={interest.id} className="card p-4 flex flex-col md:flex-row gap-4">
                {/* Tenant info */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[22px]">person</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-body-md font-semibold text-on-surface">{tenant?.name}</h3>
                      <StatusBadge status={interest.status} />
                      {interest.compatibilityScore !== null && (
                        <ScoreBadge score={interest.compatibilityScore} />
                      )}
                    </div>
                    <p className="text-body-sm text-on-surface-variant mb-1">{tenant?.email}</p>
                    <p className="text-body-sm text-on-surface-variant flex items-center gap-1 text-[12px]">
                      <span className="material-symbols-outlined text-[12px]">domain</span>
                      {listing?.title}
                    </p>
                    <p className="text-body-sm text-on-surface-variant text-[12px] mt-1">
                      Sent {format(new Date(interest.createdAt), 'dd MMM yyyy, HH:mm')}
                    </p>

                    {/* Tenant profile snippet */}
                    {interest.tenant?.tenantProfile && (
                      <div className="mt-2 p-2 rounded-lg bg-surface-container-low border border-outline-variant/20 text-[12px] text-on-surface-variant">
                        <span className="font-semibold">Prefers:</span>{' '}
                        {interest.tenant.tenantProfile.preferredLocation} •{' '}
                        ₹{interest.tenant.tenantProfile.budgetMin}–₹{interest.tenant.tenantProfile.budgetMax}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end items-start md:items-end">
                  {interest.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAction(interest.id, 'accept')}
                        disabled={actionLoading === interest.id}
                        className="btn-primary text-body-sm py-2 px-4"
                      >
                        {actionLoading === interest.id ? '…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleAction(interest.id, 'decline')}
                        disabled={actionLoading === interest.id}
                        className="btn-danger text-body-sm py-2 px-4"
                      >
                        {actionLoading === interest.id ? '…' : 'Decline'}
                      </button>
                    </>
                  )}
                  {interest.status === 'ACCEPTED' && (
                    <Link to="/chat" className="btn-secondary text-body-sm py-2 px-4 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">forum</span>
                      Chat
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
