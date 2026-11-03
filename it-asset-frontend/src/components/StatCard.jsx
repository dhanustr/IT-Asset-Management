
export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBackground = 'bg-blue-50',
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          {description && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div
          className={`shrink-0 rounded-xl p-3 ${iconBackground} ${iconColor}`}
        >
          <Icon size={23} />
        </div>
      </div>
    </article>
  )
}
