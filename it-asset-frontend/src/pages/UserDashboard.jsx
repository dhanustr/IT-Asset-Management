
import { UserRound } from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import DashboardSummary from '../components/DashboardSummary'
import { useAuth } from '../context/AuthContext'

export default function UserDashboard() {
  const { user } = useAuth()

  return (
    <DashboardLayout>
      <header className="mb-8">
        <p className="mb-2 text-sm font-medium text-emerald-600">
          USER PORTAL
        </p>

        <h2 className="text-3xl font-bold text-slate-900">
          User Dashboard
        </h2>

        <p className="mt-2 text-slate-500">
          Selamat datang, {user?.name}. Pantau aset dan tiket
          maintenance di sini.
        </p>
      </header>

      <DashboardSummary role="USER" />

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-600">
          <UserRound size={24} />
        </div>

        <h3 className="text-lg font-semibold text-slate-900">
          User Portal
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Gunakan menu Assets untuk melihat inventaris,
          dan Maintenance Tickets untuk mengajukan atau
          memantau tiket yang dibuat.
        </p>
      </section>
    </DashboardLayout>
  )
}
