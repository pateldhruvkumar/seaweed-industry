import { IconExternal } from '../../lib/icons'

/**
 * Page footer. Quiet by design — small attribution + a couple of links so
 * the dashboard's data lineage is always one click away.
 */
export default function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/50 mt-12">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          <p>
            <span className="font-semibold text-slate-700">
              Global Seaweed Industry Dashboard
            </span>
            {' · '}
            Built with React + Plotly. Data preprocessed from FAO FishStat
            CSVs to static JSON.
          </p>
          <p className="mt-1 text-slate-400">
            All figures are derived from public FAO data and are intended for
            exploratory analysis only.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://www.fao.org/fishery/en/statistics"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-700 font-medium transition-colors"
          >
            FAO FishStat <IconExternal className="w-3 h-3" />
          </a>
          <span className="text-slate-300">·</span>
          <span>1950 – 2024</span>
        </div>
      </div>
    </footer>
  )
}
