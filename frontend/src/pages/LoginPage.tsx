import { useState, type FormEvent } from 'react'
import { Dumbbell, Lock, Mail } from 'lucide-react'
import { ApiError } from '../api/client'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../context/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Nuk u arrit lidhja me serverin. Kontrolloni që API është aktiv.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-900/50">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold italic tracking-tight text-white">Sports Shop</h1>
            <p className="text-sm text-blue-200/80">Menaxhim dyqani sportiv</p>
          </div>
        </div>

        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
          <h2 className="text-center text-xl font-semibold text-white">Mirë se u ktheve!</h2>
          <p className="mt-1 text-center text-sm text-slate-400">
            Hyni në llogarinë tuaj për të vazhduar.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Email"
              labelClassName="text-slate-300"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@shembull.com"
              icon={<Mail className="h-4 w-4" />}
              className="border-slate-700 bg-slate-800/80 text-black placeholder:text-slate-500"
            />
            <Input
              label="Fjalëkalimi"
              labelClassName="text-slate-300"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              className="border-slate-700 bg-slate-800/80 text-black placeholder:text-slate-500"
            />

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60"
              variant="primary"
            >
              {loading ? 'Duke u futur...' : 'Hyr'}
            </Button>
          </form>
        </div>

        <p className="mt-8 text-xs text-slate-500">© Sports Shop. Të gjitha të drejtat e rezervuara.</p>
      </div>
    </div>
  )
}
