import { IconExternal } from '../lib/icons'

/**
 * One-line data-source citation rendered under a chart or KPI group.
 *
 * Every Canada Economics visual carries one of these so the audience always
 * knows exactly where a number comes from — and, where relevant, that a series
 * is all-aquaculture rather than seaweed-specific.
 *
 * Props:
 *   source  – the citation text (e.g. "Statistics Canada, Table 32-10-0107")
 *   href    – optional link to the source
 *   caveat  – optional italic caveat line (e.g. "all aquaculture, not seaweed-only")
 */
export default function SourceNote({ source, href, caveat }) {
  return (
    <p data-export-source className="mt-2 text-[11px] text-slate-400 leading-snug">
      <span className="font-medium text-slate-500">Source: </span>
      {source}
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 ml-1 text-brand-600 hover:text-brand-700"
        >
          link
          <IconExternal className="w-3 h-3" />
        </a>
      )}
      {caveat && (
        <span className="block italic text-amber-600 mt-0.5">{caveat}</span>
      )}
    </p>
  )
}
