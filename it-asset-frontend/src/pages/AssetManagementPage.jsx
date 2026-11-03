
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'

import api from '../lib/api'
import { useAuth } from '../context/AuthContext'
import DashboardLayout from '../layouts/DashboardLayout'
import AssetFormModal from '../components/AssetFormModal'

const initialFilters = {
  search: '',
  status: '',
  category: '',
  department_id: '',
}

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.message ||
    'Terjadi kesalahan saat mengambil data aset.'
  )
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function StatusBadge({ status }) {
  const styles = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    MAINTENANCE: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    RETIRED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  }

  const labels = {
    ACTIVE: 'Active',
    MAINTENANCE: 'Maintenance',
    RETIRED: 'Retired',
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || 'bg-slate-100 text-slate-600 ring-slate-500/20'
      }`}
    >
      {labels[status] || status || 'Unknown'}
    </span>
  )
}

export default function AssetManagementPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'ADMIN'

  const [assets, setAssets] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
const [departments, setDepartments] = useState([])
const [departmentLoading, setDepartmentLoading] = useState(true)

useEffect(() => {
  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments')
      setDepartments(response.data.data)
    } catch (error) {
      console.error('Gagal mengambil departemen:', error)
    } finally {
      setDepartmentLoading(false)
    }
  }

  fetchDepartments()
}, [])

  const [page, setPage] = useState(1)
  const [draftFilters, setDraftFilters] = useState(initialFilters)
  const [filters, setFilters] = useState(initialFilters)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = {
        page,
        limit: 10,
      }

      for (const [key, value] of Object.entries(filters)) {
        if (value.trim()) {
          params[key] = value.trim()
        }
      }

      const response = await api.get('/assets', { params })
      const body = response.data

      setAssets(Array.isArray(body.data) ? body.data : [])

      setPagination({
        page: body.pagination?.page ?? page,
        limit: body.pagination?.limit ?? 10,
        total: body.pagination?.total ?? body.count ?? 0,
        totalPages: body.pagination?.totalPages ?? 0,
      })
    } catch (err) {
      setError(getErrorMessage(err))
      setAssets([])
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  function handleDraftChange(event) {
    const { name, value } = event.target

    setDraftFilters((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function handleSearch(event) {
    event.preventDefault()
    setNotice('')
    setPage(1)
    setFilters({ ...draftFilters })
  }

  function handleResetFilters() {
    setDraftFilters(initialFilters)
    setFilters(initialFilters)
    setPage(1)
    setNotice('')
  }

  function openCreateForm() {
    setEditingAsset(null)
    setFormOpen(true)
  }

  function openEditForm(asset) {
    setEditingAsset(asset)
    setFormOpen(true)
  }

  async function handleSaved() {
    setFormOpen(false)
    setEditingAsset(null)
    setNotice('Data aset berhasil disimpan.')
    await fetchAssets()
  }

  async function handleDelete(asset) {
    const confirmed = window.confirm(
      `Hapus aset "${asset.name}" (${asset.asset_code})? Tindakan ini tidak dapat dibatalkan.`,
    )

    if (!confirmed) return

    setDeletingId(String(asset.id))
    setNotice('')
    setError('')

    try {
      await api.delete(`/assets/${asset.id}`)
      setNotice(`Aset ${asset.asset_code} berhasil dihapus.`)

      // Jika item terakhir pada halaman dihapus, mundur satu halaman.
      if (assets.length === 1 && page > 1) {
        setPage((previous) => previous - 1)
      } else {
        await fetchAssets()
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDeletingId(null)
    }
  }

  const firstItem =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1

  const lastItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  )

  return (
    <DashboardLayout>
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-blue-600">
            INVENTORY
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Asset Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Kelola dan pantau seluruh inventaris perangkat IT.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Tambah Aset
          </button>
        )}
      </header>

      {notice && (
        <div
          role="status"
          className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span>{notice}</span>
          <button
            onClick={() => setNotice('')}
            className="font-semibold"
          >
            Tutup
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            onClick={fetchAssets}
            className="inline-flex items-center gap-2 font-semibold"
          >
            <RefreshCw size={15} />
            Coba lagi
          </button>
        </div>
      )}

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSearch}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <label
                htmlFor="asset-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Cari aset
              </label>

              <div className="flex items-center gap-2 rounded-xl border border-slate-300 px-3.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                <Search size={18} className="shrink-0 text-slate-400" />
                <input
                  id="asset-search"
                  name="search"
                  value={draftFilters.search}
                  onChange={handleDraftChange}
                  placeholder="Kode, nama, merek, nomor seri..."
                  className="min-w-0 w-full py-3 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="filter-status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Status
              </label>

              <select
                id="filter-status"
                name="status"
                value={draftFilters.status}
                onChange={handleDraftChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Semua status</option>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filter-category"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Kategori
              </label>

              <input
                id="filter-category"
                name="category"
                value={draftFilters.category}
                onChange={handleDraftChange}
                placeholder="Contoh: Laptop"
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            
<div>
  <label
    htmlFor="filter-department"
    className="mb-1 block text-sm font-medium text-slate-700"
  >
    Departemen
  </label>

  <select
    id="filter-department"
    value={filters.department_id}
    onChange={(event) => {
      setFilters((previous) => ({
        ...previous,
        department_id: event.target.value,
      }))
      setPage(1)
    }}
    disabled={departmentLoading}
    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  >
    <option value="">
      {departmentLoading ? 'Memuat departemen...' : 'Semua Departemen'}
    </option>

    {departments.map((department) => (
      <option key={department.id} value={String(department.id)}>
        {department.name}
      </option>
    ))}
  </select>
</div>

  </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
            >
              <Search size={16} />
              Terapkan Filter
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={fetchAssets}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Muat Ulang
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Daftar Inventaris
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Data diambil langsung dari backend.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {pagination.total} aset
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Kode Aset</th>
                <th className="px-5 py-4 font-semibold">Nama Aset</th>
                <th className="px-5 py-4 font-semibold">Kategori</th>
                <th className="px-5 py-4 font-semibold">Merek</th>
                <th className="px-5 py-4 font-semibold">Lokasi</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <LoaderCircle
                      className="mx-auto mb-3 animate-spin text-blue-600"
                      size={26}
                    />
                    <p className="text-sm text-slate-500">
                      Memuat data aset...
                    </p>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-slate-500"
                  >
                    Tidak ada aset yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                      {asset.asset_code}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {asset.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        SN: {asset.serial_number || '-'}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {asset.category}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {asset.brand || '-'}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {asset.location}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={asset.status} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            navigate(`/assets/${asset.id}`)
                          }
                          title="Detail aset"
                          aria-label={`Detail ${asset.asset_code}`}
                          className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye size={17} />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => openEditForm(asset)}
                              title="Edit aset"
                              aria-label={`Edit ${asset.asset_code}`}
                              className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              onClick={() => handleDelete(asset)}
                              disabled={deletingId === String(asset.id)}
                              title="Hapus aset"
                              aria-label={`Hapus ${asset.asset_code}`}
                              className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            >
                              {deletingId === String(asset.id) ? (
                                <LoaderCircle
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={17} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">
            Menampilkan {firstItem}–{lastItem} dari {pagination.total} aset
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Sebelumnya
            </button>

            <span className="px-2 text-sm text-slate-600">
              {pagination.page}
              {' / '}
              {pagination.totalPages || 1}
            </span>

            <button
              onClick={() =>
                setPage((previous) =>
                  Math.min(
                    pagination.totalPages || 1,
                    previous + 1,
                  ),
                )
              }
              disabled={
                loading ||
                page >= (pagination.totalPages || 1)
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Berikutnya
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      </section>

      {formOpen && (
        <AssetFormModal
          key={editingAsset?.id ?? 'new-asset'}
          initialAsset={editingAsset}
          onClose={() => {
            setFormOpen(false)
            setEditingAsset(null)
          }}
          onSaved={handleSaved}
        />
      )}
    </DashboardLayout>
  )
}
