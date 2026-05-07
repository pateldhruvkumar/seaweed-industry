export default function ChartCard({ title, controls, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug max-w-lg">{title}</h3>
        {controls && <div className="flex flex-wrap gap-3 items-center">{controls}</div>}
      </div>
      {children}
    </div>
  )
}
