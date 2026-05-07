import { createContext, useContext, useState } from 'react'

const YearContext = createContext()

export function YearProvider({ children }) {
  const [yearRange, setYearRange] = useState([1950, 2024])
  return (
    <YearContext.Provider value={{ yearRange, setYearRange }}>
      {children}
    </YearContext.Provider>
  )
}

export const useYear = () => useContext(YearContext)
