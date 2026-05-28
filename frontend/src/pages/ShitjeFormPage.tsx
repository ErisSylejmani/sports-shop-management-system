import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { createShitje, type CreateShitjePayload } from '../api/shitje'
import { listKlientet } from '../api/klientet'
import { listProdukte } from '../api/catalog'
import { listPunetoret } from '../api/punetoret'
import type { KlientDto, ProduktDto, PunetorDto } from '../api/types'
import { ApiError } from '../api/client'
import {
  canCreateShitje,
  canPickPunetorForShitje,
} from '../auth/permissions'
import { PageHeader } from '../components/layout/PageHeader'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../lib/format'

const METODA_PAGES_OPTIONS = ['Para', 'Kartë', 'Transfer', 'Tjetër'] as const

type LineForm = {
  produktId: string
  sasia: string
}

const initialForm = {
  klientId: '',
  punetorId: '',
  zbritja: '0',
  metodaPageses: 'Para',
  detajet: [{ produktId: '', sasia: '1' }] as LineForm[],
}

export function ShitjeFormPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const canCreate = canCreateShitje(user?.roles)
  const pickPunetor = canPickPunetorForShitje(user?.roles)
  const isStaff = user?.isStaff ?? false

  const [klientet, setKlientet] = useState<KlientDto[]>([])
  const [punetoret, setPunetoret] = useState<PunetorDto[]>([])
  const [produkte, setProdukte] = useState<ProduktDto[]>([])
  const [loadingRefs, setLoadingRefs] = useState(true)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void Promise.all([listKlientet(), listPunetoret(), listProdukte()])
      .then(([k, p, pr]) => {
        setKlientet(k)
        setPunetoret(p)
        setProdukte(pr)
      })
      .catch(() => setError('Ngarkimi i të dhënave referuese dështoi.'))
      .finally(() => setLoadingRefs(false))
  }, [])

  useEffect(() => {
    if (!pickPunetor && user?.punetorId) {
      setForm((f) => ({ ...f, punetorId: user.punetorId! }))
    }
  }, [pickPunetor, user?.punetorId])

  const produktById = useMemo(
    () => new Map(produkte.map((p) => [p.produktId, p])),
    [produkte],
  )

  const shumaParaZbritjes = useMemo(() => {
    return form.detajet.reduce((sum, line) => {
      const p = produktById.get(line.produktId)
      const sasia = Number(line.sasia)
      if (!p || Number.isNaN(sasia) || sasia <= 0) return sum
      return sum + p.cmimiShitjes * sasia
    }, 0)
  }, [form.detajet, produktById])

  const zbritjaNum = Number(form.zbritja) || 0
  const shumaTotale = Math.max(0, shumaParaZbritjes - zbritjaNum)

  function addLine() {
    setForm((f) => ({ ...f, detajet: [...f.detajet, { produktId: '', sasia: '1' }] }))
  }

  function removeLine(index: number) {
    setForm((f) => ({
      ...f,
      detajet: f.detajet.filter((_, i) => i !== index),
    }))
  }

  function updateLine(index: number, patch: Partial<LineForm>) {
    setForm((f) => ({
      ...f,
      detajet: f.detajet.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canCreate) return

    if (!form.klientId) {
      setError('Zgjidhni një klient.')
      return
    }

    const punetorId = pickPunetor ? form.punetorId : user?.punetorId
    if (!punetorId) {
      setError(
        isStaff
          ? 'Llogaria juaj nuk është e lidhur me një punëtor. Kontaktoni administratorin.'
          : 'Zgjidhni punëtorin.',
      )
      return
    }

    const detajet = form.detajet
      .filter((x) => x.produktId)
      .map((x) => ({
        produktId: x.produktId,
        sasia: Number(x.sasia),
      }))

    if (detajet.length === 0) {
      setError('Shtoni të paktën një produkt.')
      return
    }

    if (detajet.some((d) => !Number.isFinite(d.sasia) || d.sasia <= 0)) {
      setError('Sasia duhet të jetë më e madhe se zero për çdo rresht.')
      return
    }

    if (Number.isNaN(zbritjaNum) || zbritjaNum < 0) {
      setError('Zbritja nuk mund të jetë negative.')
      return
    }

    if (!form.metodaPageses.trim()) {
      setError('Zgjidhni metodën e pagesës.')
      return
    }

    const payload: CreateShitjePayload = {
      klientId: form.klientId,
      punetorId,
      zbritja: zbritjaNum,
      metodaPageses: form.metodaPageses.trim(),
      detajet,
    }

    setSaving(true)
    setError(null)
    try {
      const created = await createShitje(payload)
      navigate(`/shitjet/${created.shitjeId}`, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Regjistrimi i shitjes dështoi.')
    } finally {
      setSaving(false)
    }
  }

  if (!canCreate) {
    return (
      <div className="space-y-4">
        <PageHeader title="Shitje e re" icon={ShoppingCart} />
        <Alert variant="warning">Nuk keni leje për të regjistruar shitje.</Alert>
        <Button type="button" variant="ghost" onClick={() => navigate('/shitjet')}>
          <ArrowLeft className="h-4 w-4" />
          Kthehu te lista
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shitje e re"
        subtitle="Regjistroni shitjen me rreshta produktesh; stoku përditësohet automatikisht."
        icon={ShoppingCart}
        actions={
          <Button type="button" variant="ghost" onClick={() => navigate('/shitjet')}>
            <ArrowLeft className="h-4 w-4" />
            Lista
          </Button>
        }
      />

      {error && <Alert variant="error">{error}</Alert>}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-800">Të dhënat kryesore</h2>
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Klienti"
              required
              disabled={loadingRefs}
              value={form.klientId}
              onChange={(e) => setForm((f) => ({ ...f, klientId: e.target.value }))}
            >
              <option value="">— Zgjidh klientin —</option>
              {klientet.map((k) => (
                <option key={k.klientId} value={k.klientId}>
                  {k.emri} {k.mbiemri}
                </option>
              ))}
            </Select>

            {pickPunetor ? (
              <Select
                label="Punëtori"
                required
                disabled={loadingRefs}
                value={form.punetorId}
                onChange={(e) => setForm((f) => ({ ...f, punetorId: e.target.value }))}
              >
                <option value="">— Zgjidh punëtorin —</option>
                {punetoret.map((p) => (
                  <option key={p.punetorId} value={p.punetorId}>
                    {p.emri} {p.mbiemri} ({p.pozita})
                  </option>
                ))}
              </Select>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-sm font-medium text-slate-600">Punëtori</p>
                <p className="mt-1 text-sm text-slate-900">
                  {user?.punetorEmri ?? '—'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Caktohet automatikisht nga llogaria juaj.
                </p>
              </div>
            )}

            <Input
              label="Zbritja (€)"
              type="number"
              min={0}
              step="0.01"
              value={form.zbritja}
              onChange={(e) => setForm((f) => ({ ...f, zbritja: e.target.value }))}
            />

            <Select
              label="Metoda e pagesës"
              required
              value={form.metodaPageses}
              onChange={(e) => setForm((f) => ({ ...f, metodaPageses: e.target.value }))}
            >
              {METODA_PAGES_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-800">Produktet</h2>
            <Button type="button" variant="ghost" onClick={addLine}>
              <Plus className="h-4 w-4" />
              Shto rresht
            </Button>
          </CardHeader>
          <CardBody className="space-y-4">
            {form.detajet.map((line, index) => {
              const produkt = produktById.get(line.produktId)
              const sasia = Number(line.sasia)
              const lineTotal =
                produkt && !Number.isNaN(sasia) && sasia > 0
                  ? produkt.cmimiShitjes * sasia
                  : null
              return (
                <div
                  key={index}
                  className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_120px_120px_auto]"
                >
                  <Select
                    label={index === 0 ? 'Produkti' : undefined}
                    value={line.produktId}
                    disabled={loadingRefs}
                    onChange={(e) => updateLine(index, { produktId: e.target.value })}
                  >
                    <option value="">— Zgjidh produktin —</option>
                    {produkte.map((p) => (
                      <option key={p.produktId} value={p.produktId}>
                        {p.emri} — stok {p.sasiaStok} — {formatCurrency(p.cmimiShitjes)}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label={index === 0 ? 'Sasia' : undefined}
                    type="number"
                    min={1}
                    value={line.sasia}
                    onChange={(e) => updateLine(index, { sasia: e.target.value })}
                  />
                  <div className="flex items-end pb-3 text-sm text-slate-600">
                    {lineTotal !== null ? formatCurrency(lineTotal) : '—'}
                  </div>
                  <div className="flex items-end justify-end pb-1">
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={form.detajet.length <= 1}
                      onClick={() => removeLine(index)}
                      aria-label="Hiq rreshtin"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              )
            })}

            <div className="border-t border-slate-200 pt-4 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Nëntotali</span>
                <span>{formatCurrency(shumaParaZbritjes)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span>Zbritja</span>
                <span>− {formatCurrency(zbritjaNum)}</span>
              </div>
              <div className="mt-2 flex justify-between text-base font-semibold text-slate-900">
                <span>Totali</span>
                <span>{formatCurrency(shumaTotale)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || loadingRefs}>
            {saving ? 'Duke ruajtur…' : 'Regjistro shitjen'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/shitjet')}>
            Anulo
          </Button>
        </div>
      </form>
    </div>
  )
}
