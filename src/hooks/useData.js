import { useState, useEffect } from 'react'

const cache = {}
let activeTab = null
const tabDatasets = {} // { [tabId]: Set<filename> }

/** App calls this as the active tab changes so loads are attributed correctly. */
export function setActiveTab(id) {
  activeTab = id
}

function recordLoad(filename) {
  if (!activeTab) return
  if (!tabDatasets[activeTab]) tabDatasets[activeTab] = new Set()
  tabDatasets[activeTab].add(filename)
}

/** Filenames the given tab has loaded (in load order). */
export function getTabDatasetFilenames(id) {
  return tabDatasets[id] ? Array.from(tabDatasets[id]) : []
}

/** The cached JSON for a filename, or null. */
export function getCachedData(filename) {
  return cache[filename] ?? null
}

export function useData(filename) {
  const [data, setData] = useState(cache[filename] ?? null)
  const [loading, setLoading] = useState(!cache[filename])
  const [error, setError] = useState(null)

  useEffect(() => {
    recordLoad(filename)
    if (cache[filename]) {
      setData(cache[filename])
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/data/${filename}`)
      .then(r => r.json())
      .then(d => {
        cache[filename] = d
        setData(d)
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [filename])

  return { data, loading, error }
}
