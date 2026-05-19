import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState('Duke u lidhur...')

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_URL
    if (!baseUrl) {
      setHealth('Gabim: mungon VITE_API_URL në .env')
      return
    }

    fetch(`${baseUrl}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => setHealth(JSON.stringify(data)))
      .catch(() => setHealth('Gabim: backend i fikur, URL gabim, ose CORS'))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600">Sports Shop</h1>
      <p className="mt-4 text-sm font-mono">{health}</p>
    </div>
  )
}

export default App