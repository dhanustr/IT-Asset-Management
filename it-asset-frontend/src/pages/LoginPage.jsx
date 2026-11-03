
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Boxes, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Memeriksa sesi...
      </div>
    )
  }

  if (user) {
    return (
      <Navigate
        to={user.role === 'ADMIN' ? '/admin' : '/user'}
        replace
      />
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const profile = await login(email.trim(), password)

      const defaultPath =
        profile.role === 'ADMIN' ? '/admin' : '/user'

      const requestedPath = location.state?.from?.pathname

      // Halaman tujuan harus sesuai role pengguna.
      const roleHome =
        profile.role === 'ADMIN' ? '/admin' : '/user'

      const destination =
        requestedPath &&
        requestedPath !== '/login' &&
        (
          profile.role === 'ADMIN'
            ? requestedPath.startsWith('/admin')
            : requestedPath.startsWith('/user')
        )
          ? requestedPath
          : defaultPath || roleHome

      navigate(destination, { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Login gagal. Periksa email dan password.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-slate-950 p-10 text-white md:flex">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-3">
              <Boxes size={26} />
            </div>
            <div>
              <h1 className="font-bold">IT Asset</h1>
              <p className="text-sm text-slate-400">
                Management System
              </p>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              IT Operations
            </p>
            <h2 className="text-4xl font-bold leading-tight">
              Manage your assets.
              <br />
              Simplify maintenance.
            </h2>
            <p className="mt-5 max-w-sm leading-7 text-slate-400">
              Pantau inventaris perangkat IT dan proses
              maintenance melalui satu dashboard.
            </p>
          </div>

          <p className="text-xs text-slate-500">
            IT Asset & Maintenance Management System
          </p>
        </section>

        <section className="p-7 sm:p-10">
          <div className="mb-8 md:hidden">
            <div className="mb-4 inline-flex rounded-xl bg-blue-600 p-3 text-white">
              <Boxes size={26} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              IT Asset Management
            </h1>
          </div>

          <p className="text-sm font-semibold text-blue-600">
            WELCOME BACK
          </p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Sign in
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Masuk menggunakan akun yang sudah terdaftar.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <Mail size={18} className="text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full bg-transparent py-3.5 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <LockKeyhole size={18} className="text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full bg-transparent py-3.5 text-sm outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Memproses login...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Akses hanya untuk pengguna yang terdaftar.
          </p>
        </section>
      </div>
    </main>
  )
}
