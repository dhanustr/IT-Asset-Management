
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import api from '../lib/api'

const emptyForm = {
  asset_code: '',
  name: '',
  category: '',
  brand: '',
  serial_number: '',
  location: '',
  assigned_to: '',
  department_id: '',
  status: 'ACTIVE',
}

export default function AssetFormModal({
  initialAsset,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(initialAsset)

  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...initialAsset,
    assigned_to: initialAsset?.assigned_to?.toString() ?? '',
    department_id: initialAsset?.department_id?.toString() ?? '',
  }))

  const [departments, setDepartments] = useState([])
  const [departmentLoading, setDepartmentLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Mengambil daftar departemen dari backend
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await api.get('/departments')
        setDepartments(response.data.data)
      } catch (err) {
        console.error('Gagal mengambil departemen:', err)
        setError(
          err.response?.data?.message ||
            'Gagal memuat departemen. Periksa endpoint backend.',
        )
      } finally {
        setDepartmentLoading(false)
      }
    }

    fetchDepartments()
  }, [])
  useEffect(() => {
  async function fetchUsers() {
    try {
      const response = await api.get('/users')
      setUsers(response.data.data)
    } catch (err) {
      console.error('Gagal mengambil daftar pengguna:', err)
      setError(
        err.response?.data?.message ||
        'Gagal mengambil daftar pengguna.'
      )
    } finally {
      setUsersLoading(false)
    }
  }

  fetchUsers()
}, [])

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!form.department_id) {
      setError('Silakan pilih departemen.')
      return
    }

    if (
      form.assigned_to &&
      !/^[1-9]\d*$/.test(String(form.assigned_to).trim())
    ) {
      setError('Assigned User ID harus berupa bilangan bulat positif.')
      return
    }

    const payload = {
      asset_code: form.asset_code.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      brand: form.brand.trim() || null,
      serial_number: form.serial_number.trim() || null,
      location: form.location.trim(),
      department_id: form.department_id,
      status: form.status,
     assigned_to: form.assigned_to || null
    }

    setSubmitting(true)

    try {
      if (isEditing) {
        await api.patch(`/assets/${initialAsset.id}`, payload)
      } else {
        await api.post('/assets', payload)
      }

      await onSaved()
    } catch (err) {
      const responseData = err.response?.data

      const validationMessage = Array.isArray(responseData?.errors)
        ? responseData.errors
            .map((item) =>
              typeof item === 'string'
                ? item
                : item.message || JSON.stringify(item),
            )
            .join(' ')
        : ''

      setError(
        validationMessage ||
          responseData?.message ||
          err.message ||
          'Gagal menyimpan aset.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const fields = [
    {
      name: 'asset_code',
      label: 'Kode Aset',
      required: true,
      placeholder: 'AST-001',
    },
    {
      name: 'name',
      label: 'Nama Aset',
      required: true,
      placeholder: 'Laptop Dell Latitude',
    },
    {
      name: 'category',
      label: 'Kategori',
      required: true,
      placeholder: 'Laptop, Komputer, Printer, Router',
    },
    {
      name: 'brand',
      label: 'Merek',
      placeholder: 'Dell, HP, Lenovo',
    },
    {
      name: 'serial_number',
      label: 'Nomor Seri',
      placeholder: 'Masukkan nomor seri',
    },
    {
      name: 'location',
      label: 'Lokasi',
      required: true,
      placeholder: 'Ruang IT',
    },
    
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-form-title"
        className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="asset-form-title"
              className="text-xl font-bold text-slate-900"
            >
              {isEditing ? 'Edit Aset' : 'Tambah Aset'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Isi informasi aset sesuai data inventaris.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Tutup form"
          >
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>

                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={form[field.name] ?? ''}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            ))}

            {/* Dropdown nama departemen */}
            <div>
              <label
                htmlFor="department_id"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Departemen
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                id="department_id"
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                required
                disabled={departmentLoading || departments.length === 0}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              >
                <option value="">
                  {departmentLoading
                    ? 'Memuat departemen...'
                    : departments.length === 0
                      ? 'Departemen tidak tersedia'
                      : 'Pilih departemen'}
                </option>

                {departments.map((department) => (
                  <option
                    key={department.id}
                    value={String(department.id)}
                  >
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
  <div>
  <label
    htmlFor="assigned_to"
    className="mb-1 block text-sm font-medium text-gray-700"
  >
    Pemegang Aset
  </label>

  <select
    id="assigned_to"
    name="assigned_to"
    value={form.assigned_to}
    onChange={handleChange}
    disabled={usersLoading}
    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
  >
    <option value="">
      {usersLoading
        ? 'Memuat pengguna...'
        : 'Tidak ada pemegang'}
    </option>

    {users.map((user) => (
      <option key={user.id} value={user.id}>
        {user.name} — {user.department}
      </option>
    ))}
  </select>

  <p className="mt-1 text-xs text-gray-500">
    Pilih pengguna yang bertanggung jawab atas aset.
  </p>
</div>
            

            {/* Dropdown status */}
            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETIRED">Retired</option>
              </select>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
              >
                {error}
              </div>
            )}
          </div>

          <footer className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={submitting || departmentLoading || departments.length === 0}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? 'Menyimpan...'
                : isEditing
                  ? 'Simpan Perubahan'
                  : 'Tambah Aset'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
