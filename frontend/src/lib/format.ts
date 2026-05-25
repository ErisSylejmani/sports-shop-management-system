export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('sq-AL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('sq-AL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}
