import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAuth, RequireGuest } from './components/guards/RouteGuards'
import AppLayout from './components/layout/AppLayout'

// Pages
import Landing from './pages/Landing'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import TenantDashboard from './pages/tenant/TenantDashboard'
import BrowseListings from './pages/tenant/BrowseListings'
import ListingDetail from './pages/tenant/ListingDetail'
import TenantProfile from './pages/tenant/TenantProfile'
import MyInterests from './pages/tenant/MyInterests'
import Chat from './pages/Chat'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import MyListings from './pages/owner/MyListings'
import ListingForm from './pages/owner/ListingForm'
import InterestRequests from './pages/owner/InterestRequests'
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import ManageListings from './pages/admin/ManageListings'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#191c1e',
              border: '1px solid #c7c4d8',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.08)',
            },
            success: { iconTheme: { primary: '#3525cd', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ba1a1a', secondary: '#fff' } },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
          <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />

          {/* Public listing browse (anyone can view) */}
          <Route path="/listings" element={<BrowseListings />} />
          <Route path="/listings/:id" element={<ListingDetail />} />

          {/* Authenticated app layout */}
          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            {/* Tenant routes */}
            <Route path="/dashboard" element={<RequireAuth role="TENANT"><TenantDashboard /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth role="TENANT"><TenantProfile /></RequireAuth>} />
            <Route path="/interests" element={<RequireAuth role="TENANT"><MyInterests /></RequireAuth>} />

            {/* Owner routes */}
            <Route path="/my-listings" element={<RequireAuth role="OWNER"><OwnerDashboard /></RequireAuth>} />
            <Route path="/my-listings/new" element={<RequireAuth role="OWNER"><ListingForm /></RequireAuth>} />
            <Route path="/my-listings/:id/edit" element={<RequireAuth role="OWNER"><ListingForm /></RequireAuth>} />
            <Route path="/interests/received" element={<RequireAuth role="OWNER"><InterestRequests /></RequireAuth>} />

            {/* Shared */}
            <Route path="/chat" element={<Chat />} />

            {/* Admin routes */}
            <Route path="/admin" element={<RequireAuth role="ADMIN"><AdminDashboard /></RequireAuth>} />
            <Route path="/admin/users" element={<RequireAuth role="ADMIN"><ManageUsers /></RequireAuth>} />
            <Route path="/admin/listings" element={<RequireAuth role="ADMIN"><ManageListings /></RequireAuth>} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
