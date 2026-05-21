import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <h1 className="text-6xl font-bold text-slate-300">404</h1>
      <p className="mt-2 text-slate-600">Faqja nuk u gjet.</p>
      <Link to="/" className="mt-6">
        <Button variant="primary" className="bg-slate-800">
          Kthehu në fillim
        </Button>
      </Link>
    </div>
  )
}
