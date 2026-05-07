import { useState, Suspense, lazy } from 'react'
import { YearProvider } from './context/YearContext'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Footer from './components/layout/Footer'

const OverviewTab    = lazy(() => import('./tabs/OverviewTab'))
const CountriesTab   = lazy(() => import('./tabs/CountriesTab'))
const RegionsTab     = lazy(() => import('./tabs/RegionsTab'))
const SpeciesTab     = lazy(() => import('./tabs/SpeciesTab'))
const EconomicsTab   = lazy(() => import('./tabs/EconomicsTab'))
const DataQualityTab = lazy(() => import('./tabs/DataQualityTab'))

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
  const tab = TABS[activeTab]
  const TabComponent = tab.Component

  return (
    <YearProvider>
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
      </div>
    </YearProvider>
  )
}
