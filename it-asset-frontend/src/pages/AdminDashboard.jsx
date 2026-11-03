
import { ShieldCheck } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import DashboardSummary from '../components/DashboardSummary'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <header className="mb-8">
        <p className="mb-2 text-sm font-medium text-blue-600">
          ADMIN PANEL
        </p>

        <h2 className="text-3xl font-bold text-slate-900">
          Admin Dashboard
        </h2>

        <p className="mt-2 text-slate-500">
          Selamat datang, {user?.name}. Berikut ringkasan
          inventaris dan maintenance.
        </p>
      </header>

      <DashboardSummary role="ADMIN" />

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 inline-flex rounded-xl bg-blue-50 p-3 text-blue-600">
          <ShieldCheck size={24} />
        </div>

        <h3 className="text-lg font-semibold text-slate-900">
          Administrator Access
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Gunakan menu navigasi untuk mengelola aset dan
          menangani tiket maintenance. Statistik di atas
          diambil dari backend.
        </p>
      </section>
    </DashboardLayout>
  )
}
