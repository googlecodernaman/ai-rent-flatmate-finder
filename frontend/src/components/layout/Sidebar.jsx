import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import clsx from 'clsx'

const TENANT_NAV = [
  { to: '/dashboard', icon: 'auto_awesome', label: 'Matches' },
  { to: '/listings', icon: 'domain', label: 'Browse' },
  { to: '/interests', icon: 'favorite', label: 'My Interests' },
  { to: '/chat', icon: 'forum', label: 'Messages' },
  { to: '/profile', icon: 'person', label: 'My Profile' },
]

const OWNER_NAV = [
  { to: '/my-listings', icon: 'dashboard', label: 'Overview' },
  { to: '/interests/received', icon: 'mail', label: 'Interest Requests' },
  { to: '/chat', icon: 'forum', label: 'Messages' },
]

const ADMIN_NAV = [
  { to: '/admin', icon: 'analytics', label: 'Dashboard' },
  { to: '/admin/users', icon: 'people', label: 'Manage Users' },
  { to: '/admin/listings', icon: 'domain', label: 'Manage Listings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems =
    user?.role === 'TENANT'
      ? TENANT_NAV
      : user?.role === 'OWNER'
      ? OWNER_NAV
      : ADMIN_NAV

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 py-8 px-4 border-r border-outline-variant/20 bg-surface shadow-soft z-40">
      {/* Brand */}
      <div className="mb-8 px-4">
        <h1 className="text-headline-lg font-bold text-primary tracking-tight">NivasAI</h1>
      </div>

      {/* User info */}
      <div className="flex items-center gap-stack-md px-4 mb-8">
        <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-primary text-[20px]">person</span>
        </div>
        <div className="min-w-0">
          <p className="text-title-md font-semibold leading-tight truncate">{user?.name}</p>
          <p className="text-body-sm text-on-surface-variant capitalize">{user?.role?.toLowerCase()}</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-stack-md px-4 py-3 rounded-xl transition-all',
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-variant/50'
              )
            }
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="text-body-md">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="mt-auto border-t border-outline-variant/30 pt-4 space-y-1">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-stack-md px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-variant/50 transition-all"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-body-md">Logout</span>
        </button>
      </div>
    </aside>
  )
}
