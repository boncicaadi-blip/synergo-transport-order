import type { TransportOrder } from '../types/TransportOrder'
import { emptyOrder } from '../types/TransportOrder'
import type { RouteDetail } from '../types/TransportOrder'

const FIELD_MAP: Record<string, keyof TransportOrder> = {
  'expeditor': 'client',
  'sender': 'client',
  'client': 'client',
  'nr comanda': 'numar',
  'order number': 'numar',
  'numar comanda': 'numar',
  'data': 'data',
  'date': 'data',
  'referinta': 'referinta',
  'reference': 'referinta',
  'moneda': 'moneda',
  'currency': 'moneda',
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
    const m = rawText.match(/\b(NVS-[PTIS]-\d+|C\d{6,}|CMD[-\s]?\d+)\b/i)
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

  // Extrage detalii rută din text
  const detail: RouteDetail = {
    id: '1',
    ord: 1,
    tip: 'I',
    regim: 'Tur',
    asociere: '',
    data: order.data,
    ora: '12:00:00',
    status: '',
    partener: '',
    localitate: '',
    firma: order.client,
    referinta: order.referinta,
    articolMarfa: '',
  }

  // Încearcă să extragă nr. înmatriculare
  const nrAuto = rawText.match(/\b([A-Z]{1,2}\s?\d{2,3}\s?[A-Z]{2,3})\b/)
  
  order.detalii = [detail]

  // Dacă găsim nr. auto, îl punem în planificare
  if (nrAuto && order.tipPlanificare === 'Transport terti') {
    order.planificare = {
      tip: 'Transport terti',
      nrComanda: '',
      beneficiar: '',
      transportator: '',
      termenPlata: '30',
      tva: '21',
      tarifTransport: order.tarifFaraTVA || '',
      moneda: order.moneda || 'EUR',
      nrInmatriculare: nrAuto[1],
      semiremorca: '',
      sofer: '',
    }
  }

  return order
}