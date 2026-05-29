import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw, ShoppingCart } from 'lucide-react'
import { getShitje, deleteShitje } from '../api/shitje'
import type { ShitjeDetailDto } from '../api/types'
import { canCreateKthim, canMutateShitje } from '../auth/permissions'
import { PageHeader } from '../components/layout/PageHeader'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { TableSkeleton } from '../components/ui/Skeleton'
import { Table, Td, Th, Tr } from '../components/ui/Table'
import { useAuth } from '../context/AuthContext'
import { resolveApiError } from '../lib/errors'
import { formatCurrency, formatDateTime } from '../lib/format'

export function ShitjeDetailPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreateKthimReturn = canCreateKthim(user?.roles)
  const canMutate = canMutateShitje(user?.roles)
  const { id } = useParams<{ id: string }>()
  const [detail, setDetail] = useState<ShitjeDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) {
      setError('ID e shitjes mungon.')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void getShitje(id)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((err) => {
        if (!cancelled) setError(resolveApiError(err, 'Leximi i shitjes dështoi.'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  async function onDelete() {
    if (!canMutate || !id) return
    if (!confirm('Fshi këtë shitje? Stoku do të rikthehet.')) return
    setDeleting(true)
    setError(null)
    try {
      await deleteShitje(id)
      navigate('/shitjet', { replace: true })
    } catch (err) {
      setError(resolveApiError(err, 'Fshirja e shitjes dështoi.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detaj shitjeje"
        subtitle={detail ? formatDateTime(detail.dataShitjes) : undefined}
        icon={ShoppingCart}
        actions={
          <div className="flex flex-wrap gap-2">
            {canMutate && id && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(`/shitjet/${id}/ndrysho`)}
                >
                  Ndrysho
                </Button>
                <Button type="button" variant="danger" disabled={deleting} onClick={() => void onDelete()}>
                  {deleting ? 'Duke fshirë…' : 'Fshi'}
                </Button>
              </>
            )}
            <Button type="button" variant="ghost" onClick={() => navigate('/shitjet')}>
              <ArrowLeft className="h-4 w-4" />
              Lista
            </Button>
          </div>
        }
      />

      {loading && <TableSkeleton rows={4} cols={4} />}

      {error && !loading && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {detail && !loading && (
        <>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">Përmbledhje</h2>
            </CardHeader>
            <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Klienti
                </p>
                <p className="mt-1 text-sm text-slate-900">{detail.klientEmri}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Punëtori
                </p>
                <p className="mt-1 text-sm text-slate-900">{detail.punetorEmri}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Metoda e pagesës
                </p>
                <p className="mt-1 text-sm text-slate-900">{detail.metodaPageses}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nëntotali
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {formatCurrency(detail.shumaParaZbritjes)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Zbritja
                </p>
                <p className="mt-1 text-sm text-slate-900">{formatCurrency(detail.zbritja)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Totali
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatCurrency(detail.shumaTotale)}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-slate-800">
                Rreshtat ({detail.detajet.length})
              </h2>
            </CardHeader>
            <CardBody>
              {detail.detajet.length === 0 ? (
                <p className="text-sm text-slate-500">Nuk ka rreshta produktesh.</p>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Produkti</Th>
                      <Th className="text-right">Sasia</Th>
                      <Th className="text-right">Çmimi/njësi</Th>
                      <Th className="text-right">Totali</Th>
                      {canCreateKthimReturn && <Th />}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.detajet.map((d) => (
                      <Tr key={d.detajShitjeId}>
                        <Td>{d.produktEmri}</Td>
                        <Td className="text-right">{d.sasia}</Td>
                        <Td className="text-right">{formatCurrency(d.cmimiNjesi)}</Td>
                        <Td className="text-right font-medium">
                          {formatCurrency(d.cmimiTotal)}
                        </Td>
                        {canCreateKthimReturn && (
                          <Td className="text-right">
                            <Link
                              to={`/kthimet/e-re?shitjeId=${detail.shitjeId}&produktId=${d.produktId}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Kthim
                            </Link>
                          </Td>
                        )}
                      </Tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}
