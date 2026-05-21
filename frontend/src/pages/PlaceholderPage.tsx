import { Construction } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { Card, CardBody } from '../components/ui/Card'

type Props = {
  title: string
  description?: string
}

export function PlaceholderPage({ title, description }: Props) {
  return (
    <>
      <PageHeader title={title} subtitle={description ?? 'Moduli implementohet në fazën e ardhshme (F1+).'} />
      <Card>
        <CardBody className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Construction className="h-12 w-12 text-slate-300" />
          <p className="text-slate-500">Faqja në ndërtim e përputhet me API-n e backend-it.</p>
        </CardBody>
      </Card>
    </>
  )
}
