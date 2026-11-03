
import { useCallback, useEffect, useState } from 'react'
import { History, RefreshCw, Search } from 'lucide-react'
import api from '../lib/api'
import DashboardLayout from '../layouts/DashboardLayout'

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function MaintenanceHistoryPage() {
  const [history, setHistory] = useState([])
  const [assets, setAssets] = useState([])
  const [assetId, setAssetId] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = {
        page,
        limit: 10,
      }

      if (assetId) {
        params.asset_id = assetId
      }

      const response = await api.get('/maintenance/history', { params })
      const body = response.data

      setHistory(Array.isArray(body.data) ? body.data : [])
      setPagination({
        total: body.pagination?.total ?? body.count ?? 0,
        totalPages: body.pagination?.totalPages ?? 1,
      })
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal mengambil riwayat maintenance.',
      )
    } finally {
      setLoading(false)
    }
  }, [page, assetId])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await api.get('/assets', {
          params: { page: 1, limit: 100 },
        })

        setAssets(
          Array.isArray(response.data.data)
            ? response.data.data
            : [],
        )
      } catch (err) {
        console.error('Gagal mengambil daftar aset:', err)
      }
    }

    fetchAssets()
  }, [])

  function handleAssetChange(value) {
    setAssetId(value)
    setPage(1)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Riwayat Maintenance
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Daftar pemeliharaan aset yang sudah selesai.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label
            htmlFor="history-asset-filter"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Filter berdasarkan aset
          </label>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <select
              id="history-asset-filter"
              value={assetId}
              onChange={(event) => handleAssetChange(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 sm:max-w-lg"
            >
              <option value="">Semua Aset</option>

              {assets.map((asset) => (
                <option key={asset.id} value={String(asset.id)}>
                  {asset.name} — {asset.asset_code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <History size={21} className="text-blue-600" />
            <div>
              <h2 className="font-semibold text-slate-900">
                Riwayat Selesai
              </h2>
              <p className="text-sm text-slate-500">
                Total {pagination.total} catatan
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Memuat riwayat maintenance...
            </div>
          ) : history.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Belum ada riwayat maintenance yang selesai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Kode Tiket</th>
                    <th className="px-5 py-3 font-semibold">Aset</th>
                    <th className="px-5 py-3 font-semibold">Masalah</th>
                    <th className="px-5 py-3 font-semibold">Selesai</th>
                    <th className="px-5 py-3 font-semibold">Catatan Perbaikan</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {history.map((ticket) => (
                    <tr key={ticket.id} className="align-top hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                        {ticket.ticket_code}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {ticket.assets?.name || 'Aset tidak ditemukan'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {ticket.assets?.asset_code || '-'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        <p className="font-medium">{ticket.problem}</p>
                        {ticket.description && (
                          <p className="mt-1 max-w-xs whitespace-pre-wrap text-xs text-slate-500">
                            {ticket.description}
                          </p>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(ticket.completed_at)}
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-sm whitespace-pre-wrap text-slate-700">
                          {ticket.completion_notes || '-'}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col justify-between gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
            <p className="text-sm text-slate-500">
              Halaman {page} dari {pagination.totalPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((previous) => previous - 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sebelumnya
              </button>

              <button
                type="button"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((previous) => previous + 1)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
