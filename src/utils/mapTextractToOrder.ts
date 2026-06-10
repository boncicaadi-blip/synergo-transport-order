import type { TransportOrder, RouteDetail } from '../types/TransportOrder'
import { emptyOrder } from '../types/TransportOrder'

const FIELD_MAP: Record<string, keyof TransportOrder> = {
  'expeditor': 'client',
  'sender': 'client',
  'client': 'client',
  'nr comanda': 'numar',
  'order number': 'numar',
  'numar comanda': 'numar',
  'data': 'data',
  'date': 'data',
  'transportator': 'transportator',
  'carrier': 'transportator',
  'numar inmatriculare': 'nrInmatriculare',
  'vehicle registration': 'nrInmatriculare',
  'semiremorca': 'semiremorca',
  'trailer': 'semiremorca',
  'sofer': 'sofer',
  'driver': 'sofer',
  'tarif': 'tarifFaraTVA',
  'freight': 'tarifFaraTVA',
  'moneda': 'moneda',
  'currency': 'moneda',
  'referinta': 'referinta',
  'reference': 'referinta',
}

export function mapTextractToOrder(
  pairs: Record<string, string>,
  rawText: string
): Partial<TransportOrder> {
  const order = emptyOrder()

  for (const [rawKey, value] of Object.entries(pairs)) {
    const normalizedKey = rawKey.toLowerCase().trim()
    const field = FIELD_MAP[normalizedKey]
    if (field && value) {
      ;(order as unknown as Record<string, string>)[field as string] = value
    }
  }

  if (!order.numar) {
    const m = rawText.match(/\b(C\d{6,}|CMD[-\s]?\d+|NR\.?\s*\d+)\b/i)
    if (m) order.numar = m[1]
  }

  if (!order.data) {
    const m = rawText.match(/\b(\d{2}[./]\d{2}[./]\d{4})\b/)
    if (m) order.data = m[1].replace(/\//g, '.')
  }

  if (!order.tarifFaraTVA) {
    const m = rawText.match(/([\d.,]+)\s*(EUR|RON|USD)/i)
    if (m) {
      order.tarifFaraTVA = m[1]
      order.moneda = m[2].toUpperCase()
    }
  }

  if (!order.nrInmatriculare) {
    const m = rawText.match(/\b([A-Z]{1,2}\s?\d{2,3}\s?[A-Z]{2,3})\b/)
    if (m) order.nrInmatriculare = m[1]
  }

  const detail: RouteDetail = {
    id: '1',
    ord: 1,
    tip: 'I',
    regim: 'Tur',
    asociere: '',
    data: order.data,
    ora: '12:00:00',
    status: '',
    partener: order.client,
    localitate: '',
    firma: order.client,
    referinta: order.referinta,
    articolMarfa: '',
  }

  order.detalii = [detail]

  return order
}
