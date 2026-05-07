import { useYear } from '../../context/YearContext'
import YearRangeSlider from '../controls/YearRangeSlider'

export default function Header() {
  const { yearRange, setYearRange } = useYear()
  return (
    <header className="bg-teal-800 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
      <div>
        <h1 className="text-lg font-bold tracking-tight">Global Seaweed Industry</h1>
        <p className="text-teal-300 text-xs mt-0.5">FAO FishStat — Aquatic algae statistics (1950–2024)</p>
      </div>
      <YearRangeSlider min={1950} max={2024} value={yearRange} onChange={setYearRange} />
    </header>
  )
}
