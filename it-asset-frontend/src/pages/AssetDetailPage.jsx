
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, LoaderCircle, MonitorCog, RefreshCw } from 'lucide-react'

import api from '../lib/api'
import DashboardLayout from '../layouts/DashboardLayout'
import { useAuth } from '../context/AuthContext'

function DetailField({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-4 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-slate-800">
        {value ?? '-'}
      </p>
    </div>
  )
}

export default function AssetDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [asset, setAsset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function fetchAsset() {
      setLoading(true)
      setError('')

      try {
        const response = await api.get(`/assets/${id}`)
        const result = response.data?.data ?? response.data

        if (!result?.id) {
          throw new Error('Data aset tidak ditemukan dalam respons API.')
        }

        if (active) setAsset(result)
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            err.message ||
            'Gagal mengambil detail aset.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchAsset()

    return () => {
      active = false
    }
  }, [id])

  return (
    <DashboardLayout>
      <Link
        to="/assets"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-700"
      >
        <ArrowLeft size={17} />
        Kembali ke daftar aset
      </Link>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <LoaderCircle
            size={28}
            className="mx-auto mb-3 animate-spin text-blue-600"
          />
          <p className="text-sm text-slate-500">
            Memuat detail aset...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">
            Detail aset gagal dimuat
          </h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Muat Ulang
          </button>
        </div>
      ) : (
        <>
          <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-600">
                ASSET DETAILS
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                {asset.name}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Kode aset: {asset.asset_code}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                asset.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700'
                  : asset.status === 'MAINTENANCE'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
              }`}
            >
              {asset.status}
            </span>
          </header>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 p-5">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <MonitorCog size={23} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">
                  Informasi Aset
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Detail berdasarkan data inventaris.
                </p>
              </div>
            </div>

            <div className="grid gap-x-8 px-5 py-2 md:grid-cols-2">
              <DetailField label="Kode Aset" value={asset.asset_code} />
              <DetailField label="Nama Aset" value={asset.name} />
              <DetailField label="Kategori" value={asset.category} />
              <DetailField label="Merek" value={asset.brand} />
              <DetailField label="Nomor Seri" value={asset.serial_number} />
              <DetailField label="Lokasi" value={asset.location} />
              <DetailField
                label="Departemen"
                value={
                  asset.departments?.name ??
                  `Department ID: ${asset.department_id ?? '-'}`
                }
              />
              <DetailField
                label="PIC / Assigned User"
                value={
                  asset.users?.name ??
                  (asset.assigned_to
                    ? `User ID: ${asset.assigned_to}`
                    : 'Belum ditugaskan')
                }
              />
              <DetailField label="Status" value={asset.status} />
              <DetailField
                label="Dibuat pada"
                value={
                  asset.created_at
                    ? new Date(asset.created_at).toLocaleString('id-ID')
                    : '-'
                }
              />
              <DetailField
                label="Terakhir diperbarui"
                value={
                  asset.updated_at
                    ? new Date(asset.updated_at).toLocaleString('id-ID')
                    : '-'
                }
              />
            </div>
          </section>

          {user?.role === 'ADMIN' && (
            <p className="mt-4 text-xs text-slate-400">
              Admin dapat mengubah informasi aset melalui tombol Edit pada daftar inventaris.
            </p>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
