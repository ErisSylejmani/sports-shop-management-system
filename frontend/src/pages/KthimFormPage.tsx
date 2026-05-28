import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { createKthim, listKthimet, type CreateKthimPayload } from '../api/kthimet'
import { getShitje, listShitjet } from '../api/shitje'
import type { KthimDto, ShitjeDetailDto, ShitjeSummaryDto } from '../api/types'
import { ApiError } from '../api/client'
import { canCreateKthim } from '../auth/permissions'
import { PageHeader } from '../components/layout/PageHeader'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateTime } from '../lib/format'

const STATUS_OPTIONS = ['Në pritje', 'Aprovuar', 'Refuzuar', 'Anuluar'] as const

const initialForm = {
  shitjeId: '',
  produktId: '',
  sasia: '1',
  arsyeja: '',
  statusi: STATUS_OPTIONS[0] as string,
}

export function KthimFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const canCreate = canCreateKthim(user?.roles)

  const [shitjet, setShitjet] = useState<ShitjeSummaryDto[]>([])
  const [shitjeDetail, setShitjeDetail] = useState<ShitjeDetailDto | null>(null)
  const [existingKthimet, setExistingKthimet] = useState<KthimDto[]>([])
  const [loadingRefs, setLoadingRefs] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [form, setForm] = useState(() => ({
    ...initialForm,
    shitjeId: searchParams.get('shitjeId') ?? '',
    produktId: searchParams.get('produktId') ?? '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void listShitjet()
      .then(setShitjet)
      .catch(() => setError('Ngarkimi i shitjeve dështoi.'))
      .finally(() => setLoadingRefs(false))
  }, [])

  useEffect(() => {
    if (!form.shitjeId) {
      setShitjeDetail(null)
      setExistingKthimet([])
      setForm((f) => ({ ...f, produktId: '' }))
      return
    }

    let cancelled = false
    setLoadingDetail(true)
    setError(null)

    void Promise.all([getShitje(form.shitjeId), listKthimet({ shitjeId: form.shitjeId })])
      .then(([detail, kthimet]) => {
        if (cancelled) return
        setShitjeDetail(detail)
        setExistingKthimet(kthimet)
        setForm((f) => {
          const validProdukt =
            f.produktId && detail.detajet.some((d) => d.produktId === f.produktId)
          return { ...f, produktId: validProdukt ? f.produktId : '' }
        })
      })
      .catch(() => {
        if (!cancelled) setError('Leximi i detajeve të shitjes dështoi.')
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false)
      })

    return () => {
      cancelled = true
    }
  }, [form.shitjeId])

  const shitjeOptions = useMemo(
    () =>
      shitjet.map((s) => ({
        value: s.shitjeId,
        label: `${formatDateTime(s.dataShitjes)} — ${s.klientEmri} (${formatCurrency(s.shumaTotale)})`,
      })),
    [shitjet],
  )

  const produktOptions = useMemo(() => {
    if (!shitjeDetail) return []
    return shitjeDetail.detajet.map((d) => {
      const returned = existingKthimet
        .filter((k) => k.produktId === d.produktId)
        .reduce((sum, k) => sum + k.sasia, 0)
      const remaining = d.sasia - returned
      return {
        value: d.produktId,
        label: `${d.produktEmri} — shitur ${d.sasia}, mbetur ${remaining}`,
        remaining,
        sold: d.sasia,
      }
    })
  }, [shitjeDetail, existingKthimet])

  const selectedProdukt = useMemo(
    () => produktOptions.find((p) => p.value === form.produktId),
    [produktOptions, form.produktId],
  )

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canCreate) return

    if (!form.shitjeId) {
      setError('Zgjidhni shitjen.')
      return
    }

    if (!form.produktId) {
      setError('Zgjidhni produktin nga shitja.')
      return
    }

    const sasia = Number(form.sasia)
    if (!Number.isFinite(sasia) || sasia <= 0) {
      setError('Sasia duhet të jetë më e madhe se zero.')
      return
    }

    if (selectedProdukt && sasia > selectedProdukt.remaining) {
      setError(
        `Sasia tejkalon sasinë e mbetur të kthyer (${selectedProdukt.remaining}).`,
      )
      return
    }

    const arsyeja = form.arsyeja.trim()
    if (!arsyeja) {
      setError('Arsyeja është e detyrueshme.')
      return
    }

    const statusi = form.statusi.trim()
    if (!statusi) {
      setError('Zgjidhni statusin.')
      return
    }

    const payload: CreateKthimPayload = {
      shitjeId: form.shitjeId,
      produktId: form.produktId,
      sasia,
      arsyeja,
      statusi,
    }

    setSaving(true)
    setError(null)
    try {
      await createKthim(payload)
      navigate('/kthimet', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Regjistrimi i kthimit dështoi.')
    } finally {
      setSaving(false)
    }
  }

  if (!canCreate) {
    return (
      <div className="space-y-4">
        <PageHeader title="Kthim i ri" icon={RotateCcw} />
        <Alert variant="warning">Nuk keni leje për të regjistruar kthime.</Alert>
        <Button type="button" variant="ghost" onClick={() => navigate('/kthimet')}>
          <ArrowLeft className="h-4 w-4" />
          Kthehu te lista
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kthim i ri"
        subtitle="Regjistroni kthimin e mallit; stoku rritet automatikisht pas ruajtjes."
        icon={RotateCcw}
        actions={
          <Button type="button" variant="ghost" onClick={() => navigate('/kthimet')}>
            <ArrowLeft className="h-4 w-4" />
            Lista
          </Button>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Të dhënat e kthimit</h2>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Shitja"
              required
              disabled={loadingRefs}
              value={form.shitjeId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  shitjeId: e.target.value,
                  produktId: '',
                }))
              }
            >
              <option value="">— Zgjidh shitjen —</option>
              {shitjeOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>

            <Select
              label="Produkti (nga shitja)"
              required
              disabled={!form.shitjeId || loadingDetail}
              value={form.produktId}
              onChange={(e) => setForm((f) => ({ ...f, produktId: e.target.value }))}
            >
              <option value="">
                {loadingDetail
                  ? 'Duke ngarkuar produktet…'
                  : form.shitjeId
                    ? '— Zgjidh produktin —'
                    : 'Zgjidhni fillimisht shitjen'}
              </option>
              {produktOptions.map((o) => (
                <option key={o.value} value={o.value} disabled={o.remaining <= 0}>
                  {o.label}
                  {o.remaining <= 0 ? ' (i kthyer plotësisht)' : ''}
                </option>
              ))}
            </Select>

            <div>
              <Input
                label="Sasia"
                type="number"
                min={1}
                max={selectedProdukt?.remaining ?? undefined}
                required
                value={form.sasia}
                onChange={(e) => setForm((f) => ({ ...f, sasia: e.target.value }))}
              />
              {selectedProdukt && (
                <p className="mt-1 text-xs text-slate-500">
                  Maksimumi i kthimit: {selectedProdukt.remaining} (shitur:{' '}
                  {selectedProdukt.sold})
                </p>
              )}
            </div>

            <Select
              label="Statusi"
              required
              value={form.statusi}
              onChange={(e) => setForm((f) => ({ ...f, statusi: e.target.value }))}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            <div className="sm:col-span-2">
              <Textarea
                label="Arsyeja"
                required
                rows={3}
                placeholder="P.sh. produkt i dëmtuar, madhësi e gabuar…"
                value={form.arsyeja}
                onChange={(e) => setForm((f) => ({ ...f, arsyeja: e.target.value }))}
              />
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || loadingRefs || loadingDetail}>
            {saving ? 'Duke ruajtur…' : 'Regjistro kthimin'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/kthimet')}>
            Anulo
          </Button>
        </div>
      </form>
    </div>
  )
}
