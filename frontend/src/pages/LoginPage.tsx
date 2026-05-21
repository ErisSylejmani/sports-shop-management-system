import { Link } from 'react-router-dom'
import { Dumbbell, Lock, Mail } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

/** Faqe hyrje — stil Sportix (blu e errët); login funksional në F1. */
export function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-40 w-40 rounded-full border border-white/5 opacity-30" />

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

          <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <Input
              label="Email"
              type="email"
              placeholder="email@shembull.com"
              icon={<Mail className="h-4 w-4" />}
              className="border-slate-700 bg-slate-800/80 text-white"
            />
            <Input
              label="Fjalëkalimi"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              className="border-slate-700 bg-slate-800/80 text-white"
            />

            <div className="flex justify-end">
              <button type="button" className="text-sm text-blue-400 hover:text-blue-300">
                Keni harruar fjalëkalimin?
              </button>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500" variant="primary">
              Hyr
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            <Link to="/" className="font-medium text-blue-400 hover:text-blue-300">
              Vazhdo te dashboard (preview F0)
            </Link>
          </p>
        </div>

        <p className="mt-8 text-xs text-slate-500">© Sports Shop. Të gjitha të drejtat e rezervuara.</p>
      </div>
    </div>
  )
}
