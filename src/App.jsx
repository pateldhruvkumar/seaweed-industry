import { useState, Suspense, lazy } from 'react'
import { YearProvider } from './context/YearContext'
import Header from './components/layout/Header'
import TabNav from './components/layout/TabNav'

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
  return <div className="p-12 text-center text-gray-400 text-sm">Loading…</div>
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const TabComponent = TAB_MAP[activeTab]
  return (
    <YearProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <TabNav active={activeTab} onChange={setActiveTab} />
        <main className="flex-1 p-6 max-w-screen-xl mx-auto w-full">
          <Suspense fallback={<Loading />}>
            <TabComponent />
          </Suspense>
        </main>
      </div>
    </YearProvider>
  )
}
