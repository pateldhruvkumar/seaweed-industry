import { useState, useEffect } from 'react'

const cache = {}

export function useData(filename) {
  const [data, setData] = useState(cache[filename] ?? null)
  const [loading, setLoading] = useState(!cache[filename])
  const [error, setError] = useState(null)

  useEffect(() => {
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
