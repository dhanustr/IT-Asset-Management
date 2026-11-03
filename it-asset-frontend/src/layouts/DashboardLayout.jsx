
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MonitorCog,
  Wrench,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isAdmin = user?.role === 'ADMIN'

  const navigation = [
    {
      label: 'Dashboard',
      path: isAdmin ? '/admin' : '/user',
      icon: LayoutDashboard,
    },
    {
      label: 'Assets',
      path: '/assets',
      icon: MonitorCog,
    },
    {
      label: 'Maintenance Tickets',
      path: '/maintenance/tickets',
      icon: ClipboardList,
    },
    {
      label: 'Maintenance History',
      path: '/maintenance/history',
      icon: Wrench,
    },
  ]

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="flex w-full flex-col border-b border-slate-200 bg-white md:fixed md:inset-y-0 md:w-64 md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5">
          <div className="rounded-xl bg-blue-600 p-2.5 text-white">
            <Boxes size={23} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900">IT Asset</h1>
            <p className="text-xs text-slate-500">
              Management System
            </p>
          </div>
        </div>

        <div className="flex-1 p-4">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <nav className="space-y-1">
            {navigation.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/admin' || path === '/user'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon size={19} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 rounded-xl bg-slate-50 p-3">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user?.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {user?.email}
            </p>
            <span className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {user?.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 sm:p-8 md:ml-64">
        {children}
      </main>
    </div>
  )
}
