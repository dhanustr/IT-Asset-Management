
import { useCallback, useEffect, useState } from 'react'
import {
  Boxes,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  Wrench,
  XCircle,
} from 'lucide-react'
import api from '../lib/api'
import StatCard from './StatCard'

// Mendukung angka yang dikembalikan sebagai number atau string.
function toCount(...values) {
  const value = values.find(
    (item) => item !== undefined && item !== null,
  )

  const number = Number(value)

  return Number.isFinite(number) ? number : 0
}

function normalizeSummary(responseData) {
  const data = responseData?.data ?? responseData

  const assets = data?.assets ?? data?.assetSummary ?? {}
  const tickets = data?.tickets ?? data?.ticketSummary ?? {}

  return {
    totalAssets: toCount(
      assets.total,
      assets.totalAssets,
      data.totalAssets,
      data.total_assets,
    ),

    activeAssets: toCount(
      assets.active,
      assets.activeAssets,
      data.activeAssets,
      data.active_assets,
    ),

    maintenanceAssets: toCount(
      assets.maintenance,
      assets.maintenanceAssets,
      data.maintenanceAssets,
      data.maintenance_assets,
    ),

    retiredAssets: toCount(
      assets.retired,
      assets.retiredAssets,
      data.retiredAssets,
      data.retired_assets,
    ),

    pending: toCount(
      tickets.pending,
      tickets.pendingTickets,
      data.pendingTickets,
      data.pending_tickets,
    ),

    approved: toCount(
      tickets.approved,
      tickets.approvedTickets,
      data.approvedTickets,
      data.approved_tickets,
    ),

    inProgress: toCount(
      tickets.inProgress,
      tickets.in_progress,
      tickets.inProgressTickets,
      data.inProgressTickets,
      data.in_progress_tickets,
    ),

    completed: toCount(
      tickets.completed,
      tickets.completedTickets,
      data.completedTickets,
      data.completed_tickets,
    ),

    rejected: toCount(
      tickets.rejected,
      tickets.rejectedTickets,
      data.rejectedTickets,
      data.rejected_tickets,
    ),
  }
}

export default function DashboardSummary({ role }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSummary = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/dashboard/summary')
      setSummary(normalizeSummary(response.data))
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Gagal mengambil statistik dashboard. Periksa koneksi backend dan token login.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const assetCards = [
    {
      title: 'Total Assets',
      key: 'totalAssets',
      description: 'Seluruh aset yang tercatat',
      icon: Boxes,
      iconColor: 'text-blue-600',
      iconBackground: 'bg-blue-50',
    },
    {
      title: 'Active Assets',
      key: 'activeAssets',
      description: 'Aset dengan status aktif',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBackground: 'bg-emerald-50',
    },
    {
      title: 'Under Maintenance',
      key: 'maintenanceAssets',
      description: 'Aset yang sedang diperbaiki',
      icon: Wrench,
      iconColor: 'text-amber-600',
      iconBackground: 'bg-amber-50',
    },
    {
      title: 'Retired Assets',
      key: 'retiredAssets',
      description: 'Aset yang tidak lagi digunakan',
      icon: ShieldAlert,
      iconColor: 'text-slate-600',
      iconBackground: 'bg-slate-100',
    },
  ]

  const ticketCards = [
    {
      title: 'Pending',
      key: 'pending',
      icon: Clock3,
      iconColor: 'text-amber-600',
      iconBackground: 'bg-amber-50',
    },
    {
      title: 'Approved',
      key: 'approved',
      icon: CheckCircle2,
      iconColor: 'text-blue-600',
      iconBackground: 'bg-blue-50',
    },
    {
      title: 'In Progress',
      key: 'inProgress',
      icon: Wrench,
      iconColor: 'text-violet-600',
      iconBackground: 'bg-violet-50',
    },
    {
      title: 'Completed',
      key: 'completed',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      iconBackground: 'bg-emerald-50',
    },
    {
      title: 'Rejected',
      key: 'rejected',
      icon: XCircle,
      iconColor: 'text-red-600',
      iconBackground: 'bg-red-50',
    },
  ]

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>

        <p className="text-sm text-slate-500">
          Memuat statistik dashboard...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 text-red-600" size={22} />

          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">
              Statistik gagal dimuat
            </h3>

            <p className="mt-2 text-sm leading-6 text-red-600">
              {error}
            </p>

            <button
              onClick={fetchSummary}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <RefreshCw size={16} />
              Coba Lagi
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Asset Overview
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Ringkasan kondisi inventaris IT.
            </p>
          </div>

          <button
            onClick={fetchSummary}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {assetCards.map((card) => (
            <StatCard
              key={card.key}
              {...card}
              value={summary[card.key]}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Maintenance Tickets
        </h3>

        <p className="mb-4 mt-1 text-sm text-slate-500">
          {role === 'ADMIN'
            ? 'Ringkasan tiket maintenance seluruh pengguna.'
            : 'Ringkasan tiket maintenance yang kamu ajukan.'}
        </p>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {ticketCards.map((card) => (
            <StatCard
              key={card.key}
              {...card}
              value={summary[card.key]}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
