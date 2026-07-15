import { useState, useEffect } from 'react'
import api from '../../lib/api'
import { PageLoader, EmptyState, ErrorState } from '../../components/ui/States'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const load = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/admin/users?page=${p}&limit=20`)
      setUsers(data.data || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1) }, [])

  const handleToggle = async (user) => {
    setActionLoading(user.id)
    try {
      await api.patch(`/admin/users/${user.id}/status`, { isActive: !user.isActive })
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      toast.success(user.isActive ? 'User deactivated' : 'User activated')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to update')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this user?')) return
    setActionLoading(id)
    try {
      await api.delete(`/admin/users/${id}`)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      toast.success('User deleted')
    } catch (e) {
      toast.error(e.response?.data?.error?.message || 'Failed to delete')
    } finally {
      setActionLoading(null)
    }
  }

  const roleColor = { TENANT: 'bg-blue-100 text-blue-800', OWNER: 'bg-purple-100 text-purple-800', ADMIN: 'bg-primary/10 text-primary' }

  if (loading && users.length === 0) return <div className="p-margin-desktop"><PageLoader /></div>
  if (error) return <div className="p-margin-desktop"><ErrorState message={error} onRetry={() => load(page)} /></div>

  return (
    <div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto">
      <header className="mb-stack-lg">
        <h1 className="text-headline-lg-mobile md:text-headline-lg text-on-background">Manage Users</h1>
        <p className="text-body-md text-on-surface-variant mt-unit">{pagination?.total ?? users.length} total users</p>
      </header>

      {users.length === 0 ? (
        <EmptyState icon="people" title="No users found" />
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                    {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-label-caps font-mono text-on-surface-variant px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={user.id} className={`border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors ${i % 2 === 0 ? '' : 'bg-surface-container/30'}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-body-md font-semibold text-on-surface">{user.name}</p>
                          <p className="text-body-sm text-on-surface-variant text-[12px]">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${roleColor[user.role] || ''}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                          {user.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                        {format(new Date(user.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleToggle(user)}
                            disabled={actionLoading === user.id || user.role === 'ADMIN'}
                            className="px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-outline-variant hover:bg-surface-container-high transition-colors disabled:opacity-40"
                          >
                            {user.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={actionLoading === user.id || user.role === 'ADMIN'}
                            className="px-3 py-1.5 text-[12px] font-semibold rounded-lg border border-error/30 text-error hover:bg-error-container transition-colors disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
