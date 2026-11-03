
import { useCallback, useEffect, useState } from 'react'
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Play,
  CheckCheck,
  X,
} from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../layouts/DashboardLayout'

const initialForm = {
  asset_id: '',
  problem: '',
  description: '',
  priority: 'MEDIUM',
}

const statusLabels = {
  PENDING: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  IN_PROGRESS: 'Sedang Dikerjakan',
  COMPLETED: 'Selesai',
}

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-violet-100 text-violet-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
}

const priorityLabels = {
  LOW: 'Rendah',
  MEDIUM: 'Sedang',
  HIGH: 'Tinggi',
  URGENT: 'Darurat',
}

function formatDate(value) {
  if (!value) return '-'

  return new Date(value).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function getErrorMessage(error) {
  const body = error.response?.data

  if (Array.isArray(body?.errors)) {
    return body.errors
      .map((item) =>
        typeof item === 'string'
          ? item
          : item.message || JSON.stringify(item),
      )
      .join(' ')
  }

  return body?.message || error.message || 'Terjadi kesalahan.'
}

export default function MaintenanceTicketsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  const [tickets, setTickets] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [assetsLoading, setAssetsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
  })
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
  })

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [formError, setFormError] = useState('')
  const [pageError, setPageError] = useState('')
  const [success, setSuccess] = useState('')

  // Modal untuk alasan penolakan atau catatan penyelesaian.
  const [actionModal, setActionModal] = useState(null)
  const [actionNote, setActionNote] = useState('')

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setPageError('')

    try {
      const params = {
        page,
        limit: 10,
      }

      if (filters.status) params.status = filters.status
      if (filters.priority) params.priority = filters.priority

      const response = await api.get('/maintenance/tickets', { params })
      const body = response.data

      setTickets(Array.isArray(body.data) ? body.data : [])
      setPagination({
        total: body.pagination?.total ?? body.count ?? 0,
        totalPages: body.pagination?.totalPages ?? 1,
      })
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [page, filters.status, filters.priority])

  const fetchAssets = useCallback(async () => {
    setAssetsLoading(true)

    try {
      const response = await api.get('/assets', {
        params: {
          page: 1,
          limit: 100,
        },
      })

      const body = response.data
      setAssets(Array.isArray(body.data) ? body.data : [])
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setAssetsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  function changeFilter(name, value) {
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
    setPage(1)
  }

  function openCreateForm() {
    setForm(initialForm)
    setFormError('')
    setSuccess('')
    setFormOpen(true)
  }

  async function handleCreateTicket(event) {
    event.preventDefault()
    setFormError('')
    setSuccess('')

    if (!form.asset_id) {
      setFormError('Silakan pilih aset terlebih dahulu.')
      return
    }

    if (!form.problem.trim()) {
      setFormError('Judul atau masalah wajib diisi.')
      return
    }

    setSubmitting(true)

    try {
      await api.post('/maintenance/tickets', {
        asset_id: form.asset_id,
        problem: form.problem.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
      })

      setFormOpen(false)
      setForm(initialForm)
      setSuccess(
        isAdmin
          ? 'Tiket berhasil dibuat dan langsung berstatus disetujui.'
          : 'Tiket berhasil diajukan dan menunggu persetujuan Admin.',
      )
      setPage(1)

      // Ambil ulang data setelah tiket berhasil dibuat.
      if (page === 1) {
        await fetchTickets()
      }
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  async function runAdminAction(ticket, action, payload = {}) {
    setPageError('')
    setSuccess('')

    try {
      await api.patch(
        `/maintenance/tickets/${ticket.id}/${action}`,
        payload,
      )

      const messages = {
        approve: 'Tiket berhasil disetujui.',
        reject: 'Tiket berhasil ditolak.',
        start: 'Pengerjaan dimulai. Status aset diperbarui menjadi Maintenance.',
        complete: 'Maintenance selesai dan masuk ke riwayat.',
      }

      setSuccess(messages[action] || 'Tindakan berhasil dilakukan.')
      setActionModal(null)
      setActionNote('')
      await fetchTickets()
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }

  function handleAdminAction(ticket, action) {
    if (!isAdmin) return

    if (action === 'approve' || action === 'start') {
      const confirmation =
        action === 'approve'
          ? `Setujui tiket ${ticket.ticket_code}?`
          : `Mulai pengerjaan tiket ${ticket.ticket_code}?`

      if (window.confirm(confirmation)) {
        runAdminAction(ticket, action)
      }

      return
    }

    setActionNote('')
    setActionModal({ ticket, action })
  }

  async function submitActionNote(event) {
    event.preventDefault()

    if (!actionModal) return

    const { ticket, action } = actionModal
    const fieldName =
      action === 'reject' ? 'rejection_reason' : 'completion_notes'

    if (!actionNote.trim()) {
      setPageError(
        action === 'reject'
          ? 'Alasan penolakan wajib diisi.'
          : 'Catatan penyelesaian wajib diisi.',
      )
      return
    }

    await runAdminAction(ticket, action, {
      [fieldName]: actionNote.trim(),
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Maintenance Tickets
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? 'Tinjau pengajuan dan kelola proses pemeliharaan aset.'
                : 'Ajukan perbaikan aset dan pantau status tiketmu.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchTickets}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={17} />
              Buat Tiket
            </button>
          </div>
        </div>

        {success && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {success}
          </div>
        )}

        {pageError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {pageError}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              aria-label="Filter status tiket"
              value={filters.status}
              onChange={(event) =>
                changeFilter('status', event.target.value)
              }
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu Persetujuan</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
              <option value="IN_PROGRESS">Sedang Dikerjakan</option>
              <option value="COMPLETED">Selesai</option>
            </select>
          </div>

          <select
            aria-label="Filter prioritas tiket"
            value={filters.priority}
            onChange={(event) =>
              changeFilter('priority', event.target.value)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Semua Prioritas</option>
            <option value="LOW">Rendah</option>
            <option value="MEDIUM">Sedang</option>
            <option value="HIGH">Tinggi</option>
            <option value="URGENT">Darurat</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <ClipboardList className="text-blue-600" size={21} />
            <div>
              <h2 className="font-semibold text-slate-900">
                Daftar Tiket
              </h2>
              <p className="text-sm text-slate-500">
                Total {pagination.total} tiket
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Memuat tiket maintenance...
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardList
                size={35}
                className="mx-auto mb-3 text-slate-300"
              />
              <p className="font-medium text-slate-700">
                Belum ada tiket maintenance
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Coba ubah filter atau buat tiket baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tiket</th>
                    <th className="px-5 py-3 font-semibold">Aset</th>
                    <th className="px-5 py-3 font-semibold">Prioritas</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Diajukan</th>
                    <th className="px-5 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {tickets.map((ticket) => {
                    const asset = ticket.assets

                    return (
                      <tr key={ticket.id} className="align-top hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {ticket.ticket_code}
                          </p>
                          <p className="mt-1 max-w-[220px] truncate text-slate-500">
                            {ticket.problem}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {asset?.name || 'Aset tidak ditemukan'}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {asset?.asset_code || '-'}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="font-medium text-slate-700">
                            {priorityLabels[ticket.priority] || ticket.priority}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                              statusStyles[ticket.status] ||
                              'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {statusLabels[ticket.status] || ticket.status}
                          </span>

                          {ticket.status === 'REJECTED' &&
                            ticket.rejection_reason && (
                              <p className="mt-2 max-w-[180px] text-xs text-red-700">
                                Alasan: {ticket.rejection_reason}
                              </p>
                            )}

                          {ticket.status === 'COMPLETED' &&
                            ticket.completion_notes && (
                              <p className="mt-2 max-w-[180px] text-xs text-slate-500">
                                Hasil: {ticket.completion_notes}
                              </p>
                            )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                          {formatDate(ticket.created_at)}
                        </td>

                        <td className="px-5 py-4">
                          {isAdmin ? (
                            <div className="flex min-w-[150px] flex-wrap gap-2">
                              {ticket.status === 'PENDING' && (
                                <>
                                  <button
                                    type="button"
                                    title="Setujui tiket"
                                    onClick={() =>
                                      handleAdminAction(ticket, 'approve')
                                    }
                                    className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100"
                                  >
                                    <CheckCircle size={17} />
                                  </button>

                                  <button
                                    type="button"
                                    title="Tolak tiket"
                                    onClick={() =>
                                      handleAdminAction(ticket, 'reject')
                                    }
                                    className="rounded-lg bg-red-50 p-2 text-red-700 hover:bg-red-100"
                                  >
                                    <XCircle size={17} />
                                  </button>
                                </>
                              )}

                              {ticket.status === 'APPROVED' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdminAction(ticket, 'start')
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                >
                                  <Play size={14} />
                                  Mulai
                                </button>
                              )}

                              {ticket.status === 'IN_PROGRESS' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAdminAction(ticket, 'complete')
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                                >
                                  <CheckCheck size={14} />
                                  Selesaikan
                                </button>
                              )}

                              {['REJECTED', 'COMPLETED'].includes(ticket.status) && (
                                <span className="text-xs text-slate-400">
                                  Tidak ada aksi
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Hanya lihat
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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

      {/* Modal pengajuan tiket */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-ticket-title"
            className="my-auto w-full max-w-xl rounded-2xl bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2
                  id="create-ticket-title"
                  className="text-xl font-bold text-slate-900"
                >
                  Buat Tiket Maintenance
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Isi detail aset dan masalah yang ditemukan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFormOpen(false)}
                disabled={submitting}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Tutup form"
              >
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleCreateTicket}>
              <div className="space-y-5 p-6">
                <div>
                  <label
                    htmlFor="ticket-asset"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Aset <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="ticket-asset"
                    value={form.asset_id}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        asset_id: event.target.value,
                      }))
                    }
                    required
                    disabled={assetsLoading || assets.length === 0}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">
                      {assetsLoading
                        ? 'Memuat daftar aset...'
                        : assets.length === 0
                          ? 'Aset tidak tersedia'
                          : 'Pilih nama aset'}
                    </option>

                    {assets
                      .filter((asset) => asset.status !== 'RETIRED')
                      .map((asset) => (
                        <option
                          key={asset.id}
                          value={String(asset.id)}
                        >
                          {asset.name} — {asset.asset_code}
                        </option>
                      ))}
                  </select>

                  <p className="mt-1.5 text-xs text-slate-500">
                    Pilih berdasarkan nama dan kode aset, bukan ID.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="ticket-problem"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Masalah <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="ticket-problem"
                    value={form.problem}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        problem: event.target.value,
                      }))
                    }
                    maxLength={200}
                    required
                    placeholder="Contoh: Laptop tidak dapat dinyalakan"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {form.problem.length}/200 karakter
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="ticket-description"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Deskripsi tambahan
                  </label>

                  <textarea
                    id="ticket-description"
                    value={form.description}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        description: event.target.value,
                      }))
                    }
                    maxLength={5000}
                    rows={4}
                    placeholder="Jelaskan gejala kerusakan atau kondisi aset..."
                    className="w-full resize-y rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ticket-priority"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Prioritas
                  </label>

                  <select
                    id="ticket-priority"
                    value={form.priority}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        priority: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="LOW">Rendah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HIGH">Tinggi</option>
                    <option value="URGENT">Darurat</option>
                  </select>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {formError}
                  </div>
                )}
              </div>

              <footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    assetsLoading ||
                    assets.filter((asset) => asset.status !== 'RETIRED').length === 0
                  }
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Tiket'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* Modal alasan penolakan / catatan penyelesaian */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-action-title"
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <header className="border-b border-slate-200 px-6 py-5">
              <h2
                id="ticket-action-title"
                className="text-lg font-bold text-slate-900"
              >
                {actionModal.action === 'reject'
                  ? 'Tolak Tiket Maintenance'
                  : 'Selesaikan Maintenance'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {actionModal.ticket.ticket_code} — {actionModal.ticket.problem}
              </p>
            </header>

            <form onSubmit={submitActionNote}>
              <div className="space-y-2 p-6">
                <label
                  htmlFor="ticket-action-note"
                  className="block text-sm font-medium text-slate-700"
                >
                  {actionModal.action === 'reject'
                    ? 'Alasan penolakan'
                    : 'Catatan penyelesaian'}
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <textarea
                  id="ticket-action-note"
                  value={actionNote}
                  onChange={(event) => setActionNote(event.target.value)}
                  required
                  maxLength={
                    actionModal.action === 'reject' ? 2000 : 5000
                  }
                  rows={5}
                  placeholder={
                    actionModal.action === 'reject'
                      ? 'Jelaskan alasan tiket ditolak...'
                      : 'Jelaskan tindakan perbaikan dan hasilnya...'
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${
                    actionModal.action === 'reject'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {actionModal.action === 'reject'
                    ? 'Tolak Tiket'
                    : 'Selesaikan Tiket'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}
