
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import UserDashboard from './pages/UserDashboard'
import AssetManagementPage from './pages/AssetManagementPage'
import AssetDetailPage from './pages/AssetDetailPage'
import MaintenanceTicketsPage from './pages/MaintenanceTicketsPage'
import MaintenanceHistoryPage from './pages/MaintenanceHistoryPage'

function HomeRedirect() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <Navigate
      to={user.role === 'ADMIN' ? '/admin' : '/user'}
      replace
    />
  )
}

function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-900">
        403 — Access Denied
      </h1>
      <p className="mt-3 text-slate-500">
        Akun ini tidak memiliki izin untuk membuka halaman tersebut.
      </p>
      <a
        href="/"
        className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
      >
        Kembali ke Dashboard
      </a>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['USER']} />}>
        <Route path="/user" element={<UserDashboard />} />
      </Route>
<Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER']} />}>
  <Route path="/assets" element={<AssetManagementPage />} />
  <Route path="/assets/:id" element={<AssetDetailPage />} />
</Route>
<Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER']} />}>
  <Route path="/maintenance/tickets" element={<MaintenanceTicketsPage />}/>
  <Route path="/maintenance/history" element={<MaintenanceHistoryPage />}/>
</Route>
<Route element={<ProtectedRoute allowedRoles={['ADMIN', 'USER']} />}>
  <Route path="/assets" element={<AssetManagementPage />} />
  <Route path="/assets/:id" element={<AssetDetailPage />} />
</Route>
      <Route path="/" element={<HomeRedirect />} />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
