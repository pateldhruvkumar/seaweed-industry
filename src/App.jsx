import { useState, Suspense, lazy } from 'react'
import { YearProvider } from './context/YearContext'
import Header from './components/layout/Header'
import TabNav from './components/layout/TabNav'
import Footer from './components/layout/Footer'

const OverviewTab    = lazy(() => import('./tabs/OverviewTab'))
const CountriesTab   = lazy(() => import('./tabs/CountriesTab'))
const RegionsTab     = lazy(() => import('./tabs/RegionsTab'))
const SpeciesTab     = lazy(() => import('./tabs/SpeciesTab'))
const EconomicsTab   = lazy(() => import('./tabs/EconomicsTab'))
const DataQualityTab = lazy(() => import('./tabs/DataQualityTab'))

const TAB_MAP = {
  overview:  OverviewTab,
  countries: CountriesTab,
  regions:   RegionsTab,
  species:   SpeciesTab,
  economics: EconomicsTab,
  quality:   DataQualityTab,
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
  const TabComponent = TAB_MAP[activeTab]

  return (
    <YearProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <TabNav active={activeTab} onChange={setActiveTab} />

        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Suspense fallback={<Loading />}>
              <TabComponent />
            </Suspense>
          </div>
        </main>

        <Footer />
      </div>
    </YearProvider>
  )
}
