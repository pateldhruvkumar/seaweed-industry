import { useState, Suspense, lazy } from 'react'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import ChatPanel from './components/chat/ChatPanel'
import ExportMenu from './components/export/ExportMenu'
import { IconMenu } from './lib/icons'
import { setActiveTab as setExportActiveTab } from './hooks/useData'
import psiaLogo from './assets/psia-logo-white-green.png'

const OverviewTab       = lazy(() => import('./tabs/OverviewTab'))
const CountriesTab      = lazy(() => import('./tabs/CountriesTab'))
const RegionsTab        = lazy(() => import('./tabs/RegionsTab'))
const SpeciesTab        = lazy(() => import('./tabs/SpeciesTab'))
const EconomicsTab      = lazy(() => import('./tabs/EconomicsTab'))
const PsiaPricingTab    = lazy(() => import('./tabs/PsiaPricingTab'))
const PsiaDemandTab     = lazy(() => import('./tabs/PsiaDemandTab'))
const KpiGrossOutputTab = lazy(() => import('./tabs/KpiGrossOutputTab'))
const KpiValuePerLbTab  = lazy(() => import('./tabs/KpiValuePerLbTab'))
const KpiExportValueTab = lazy(() => import('./tabs/KpiExportValueTab'))
const EdaTab            = lazy(() => import('./tabs/EdaTab'))
const CanadaEconomicsTab = lazy(() => import('./tabs/CanadaEconomicsTab'))
const CanadaLicensingTab = lazy(() => import('./tabs/CanadaLicensingTab'))

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
  eda: {
    Component: EdaTab,
    title: 'Exploratory Data Analysis',
    subtitle: 'Summary statistics, distributions, and structural views across the four FAO datasets.',
  },
  'canada-economics': {
    Component: CanadaEconomicsTab,
    title: 'Canada · Economics',
    subtitle: 'Canadian Economic KPIs from StatCan, DFO and UN Comtrade: seaweed exports plus all-aquaculture context.',
  },
  'canada-licensing': {
    Component: CanadaLicensingTab,
    title: 'Canada · Licensing & Sites',
    subtitle: 'Cultivation & Harvesting KPIs: licensed sites, permitted area, farm size and operating-cost ratio.',
  },
  'kpi-export-value': {
    Component: KpiExportValueTab,
    title: 'Export Value of Seaweed Products ($/year)',
    subtitle: 'Total value of seaweed products entering the market each year (FAO production-value proxy).',
  },
  'kpi-price-wet-tonne': {
    Component: PsiaPricingTab,
    title: 'Price per Wet Tonne by Species and End Use ($/tonne)',
    subtitle: 'Market price by species and application: global benchmarks 2010–2022 plus BC context.',
  },
  'kpi-value-per-lb': {
    Component: KpiValuePerLbTab,
    title: 'Value of Seaweed ($/lb)',
    subtitle: 'Volume-weighted aquaculture price in $/lb, $/kg, or $/tonne: toggle the unit on the global chart.',
  },
  'kpi-wet-vs-processed': {
    Component: PsiaDemandTab,
    title: 'Wet vs. Processed Kelp Demand',
    subtitle: 'Demand by product form: wet, dried, processed, hydrocolloid, biostimulant.',
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Side-by-side chat only has room on wide screens; on phones/tablets it
  // renders as a full-screen overlay, so start it closed there.
  const [chatOpen, setChatOpen] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 1280px)').matches
  )
  const tab = TABS[activeTab]
  // Attribute useData() loads to the current tab (read during export). Calling
  // the module setter during render runs before child tabs mount, so a freshly
  // mounted tab's dataset loads are recorded under the correct id.
  setExportActiveTab(activeTab)
  const TabComponent = tab.Component

  function handleTabChange(id) {
    setActiveTab(id)
    setSidebarOpen(false)
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        active={activeTab}
        onChange={handleTabChange}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Backdrop behind the nav drawer on small screens */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header — hamburger + brand. Hidden once the sidebar docks at lg. */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 shadow-chrome">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
            className="w-9 h-9 grid place-items-center rounded-lg hover:bg-slate-800/60"
          >
            <IconMenu className="w-5 h-5" />
          </button>
          <img
            src={psiaLogo}
            alt="Pacific Seaweed Industry Association"
            className="h-7 w-auto"
          />
        </header>

        <main className="flex-1 w-full">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
            <Topbar
              title={tab.title}
              subtitle={tab.subtitle}
              actions={
                <ExportMenu
                  tabId={activeTab}
                  tabTitle={tab.title}
                  tabSubtitle={tab.subtitle}
                />
              }
            />
            <div id="tab-content">
              <Suspense fallback={<Loading />}>
                <TabComponent />
              </Suspense>
            </div>
          </div>
        </main>
      </div>

      {/* Chat panel — full-screen overlay on small screens, docked column on lg+ */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white lg:sticky lg:inset-auto lg:top-0 lg:z-auto lg:h-screen lg:w-80 xl:w-96 lg:shrink-0 lg:bg-transparent lg:border-l lg:border-slate-200/70">
          <ChatPanel onClose={() => setChatOpen(false)} />
        </div>
      )}

      {/* Floating toggle button when chat is closed */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-lg transition-colors"
        >
          <span>💬</span> Ask AI
        </button>
      )}
    </div>
  )
}
