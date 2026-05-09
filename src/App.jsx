import { useState, Suspense, lazy } from 'react'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Footer from './components/layout/Footer'
import ChatPanel from './components/chat/ChatPanel'

const OverviewTab       = lazy(() => import('./tabs/OverviewTab'))
const CountriesTab      = lazy(() => import('./tabs/CountriesTab'))
const RegionsTab        = lazy(() => import('./tabs/RegionsTab'))
const SpeciesTab        = lazy(() => import('./tabs/SpeciesTab'))
const EconomicsTab      = lazy(() => import('./tabs/EconomicsTab'))
const DataQualityTab    = lazy(() => import('./tabs/DataQualityTab'))
const PsiaPricingTab    = lazy(() => import('./tabs/PsiaPricingTab'))
const PsiaDemandTab     = lazy(() => import('./tabs/PsiaDemandTab'))
const KpiGrossOutputTab = lazy(() => import('./tabs/KpiGrossOutputTab'))
const KpiValuePerLbTab  = lazy(() => import('./tabs/KpiValuePerLbTab'))
const KpiExportValueTab = lazy(() => import('./tabs/KpiExportValueTab'))
const EdaTab            = lazy(() => import('./tabs/EdaTab'))

// Single source of truth for tab metadata. Sidebar uses `id`/`Icon`/`label`,
// Topbar uses `title`/`subtitle` of the active tab.
const TABS = {
  overview: {
    Component: OverviewTab,
    title: 'Overview',
    subtitle: 'Headline metrics and the long-run shape of the seaweed industry.',
  },
  countries: {
    Component: CountriesTab,
    title: 'Countries',
    subtitle: 'Top producers and their production trajectories over time.',
  },
  regions: {
    Component: RegionsTab,
    title: 'Regions',
    subtitle: 'Production grouped by continent and World Bank income class.',
  },
  species: {
    Component: SpeciesTab,
    title: 'Species & Aquaculture',
    subtitle: 'Which seaweeds are farmed where, and in what environment.',
  },
  economics: {
    Component: EconomicsTab,
    title: 'Economics',
    subtitle: 'Prices, value-volume positioning, and species-level economics.',
  },
  quality: {
    Component: DataQualityTab,
    title: 'Data Quality',
    subtitle: 'Coverage, status flags, and structural integrity of the FAO data.',
  },
  eda: {
    Component: EdaTab,
    title: 'Exploratory Data Analysis',
    subtitle: 'Summary statistics, distributions, and structural views across the four FAO datasets.',
  },
  'kpi-export-value': {
    Component: KpiExportValueTab,
    title: 'Export Value of Seaweed Products ($/year)',
    subtitle: 'Total value of seaweed products entering the market each year (FAO production-value proxy).',
  },
  'kpi-price-wet-tonne': {
    Component: PsiaPricingTab,
    title: 'Price per Wet Tonne by Species and End Use ($/tonne)',
    subtitle: 'Market price by species and application — global benchmarks 2010–2022 plus BC context.',
  },
  'kpi-value-per-lb': {
    Component: KpiValuePerLbTab,
    title: 'Value of Seaweed ($/lb)',
    subtitle: 'Volume-weighted aquaculture price in $/lb, $/kg, or $/tonne — toggle the unit on the global chart.',
  },
  'kpi-wet-vs-processed': {
    Component: PsiaDemandTab,
    title: 'Wet vs. Processed Kelp Demand',
    subtitle: 'Demand by product form — wet, dried, processed, hydrocolloid, biostimulant.',
  },
  'kpi-gross-output': {
    Component: KpiGrossOutputTab,
    title: 'Gross Value of Seaweed Industry Output ($/year)',
    subtitle: 'Total economic output of global seaweed aquaculture, decomposed by environment and country.',
  },
}

function Loading() {
  return (
    <div className="py-20 text-center">
      <div className="inline-block w-8 h-8 border-2 border-slate-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="mt-3 text-sm text-slate-500">Loading…</p>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [chatOpen, setChatOpen] = useState(false)
  const tab = TABS[activeTab]
  const TabComponent = tab.Component

  return (
    <div className="min-h-screen flex">
      <Sidebar active={activeTab} onChange={setActiveTab} />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 w-full">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8">
            <Topbar title={tab.title} subtitle={tab.subtitle} />
            <Suspense fallback={<Loading />}>
              <TabComponent />
            </Suspense>
          </div>
        </main>
        <Footer />
      </div>

      {/* Chat panel — fixed right side */}
      {chatOpen && (
        <div className="w-80 flex-shrink-0 flex flex-col h-screen sticky top-0">
          <ChatPanel onClose={() => setChatOpen(false)} />
        </div>
      )}

      {/* Floating toggle button when chat is closed */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-colors"
        >
          <span>💬</span> Ask AI
        </button>
      )}
    </div>
  )
}
