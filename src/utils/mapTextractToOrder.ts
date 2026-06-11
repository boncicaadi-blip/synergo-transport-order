import type { TransportOrder, RouteDetail } from '../types/TransportOrder'
import { emptyOrder } from '../types/TransportOrder'

const FIELD_MAP: Record<string, keyof TransportOrder> = {
  'client': 'client', 'expeditor': 'client', 'sender': 'client',
  'numar comanda': 'numar', 'nr comanda': 'numar', 'order number': 'numar',
  'data': 'data', 'date': 'data',
  'referinta': 'referinta', 'reference': 'referinta',
  'moneda': 'moneda', 'currency': 'moneda',
  'marfa': 'observatii', 'goods': 'observatii',
}

export function mapTextractToOrder(
  pairs: Record<string, string>,
  rawText: string
): Partial<TransportOrder> {
  const order = emptyOrder()

  for (const [rawKey, value] of Object.entries(pairs)) {
    if (!value || value.trim() === '') continue
    const key = rawKey.toLowerCase().trim()
    const field = FIELD_MAP[key]
    if (field) {
      ;(order as unknown as Record<string, string>)[field as string] = value
    }
    if (key === 'tarif' || key === 'pret' || key === 'freight' || key === 'price') {
      const numVal = value.replace(/[^\d.,]/g, '').replace(',', '.')
      if (numVal) order.tarifFaraTVA = numVal
    }
    if (key === 'termen plata' || key === 'payment terms') {
      const days = value.match(/\d+/)?.[0]
      if (days) order.termen = days
    }
  }

  if (!order.numar) {
    const m = rawText.match(/\b(NVS-[PTIS]-\d+|DID\d+|C\d{6,})\b/i)
    if (m) order.numar = m[1]
  }

  if (!order.data) {
    const m = rawText.match(/\b(\d{2}[./]\d{2}[./]\d{4})\b/)
    if (m) {
      const parts = m[1].replace(/\//g, '.').split('.')
      order.data = `${parts[2]}-${parts[1]}-${parts[0]}`
    }
  }

  if (!order.tarifFaraTVA) {
    const m = rawText.match(/([\d.,]+)\s*(EUR|RON|USD)/i)
    if (m) {
      order.tarifFaraTVA = m[1].replace(',', '.')
      order.moneda = m[2].toUpperCase()
    }
  }

  const details: RouteDetail[] = []
  const locIncarcare = pairs['localitate incarcare'] || pairs['expeditor'] || ''
  const locDescarcare = pairs['localitate descarcare'] || pairs['destinatar'] || ''

  if (locIncarcare) {
    details.push({
      id: '1', ord: 1, tip: 'I', regim: 'Tur', asociere: '',
      data: order.data || '', ora: '12:00:00', status: '',
      partener: pairs['expeditor'] || locIncarcare,
      localitate: locIncarcare,
      firma: pairs['expeditor'] || '',
      referinta: order.referinta || '',
      articolMarfa: pairs['marfa'] || '',
    })
  }

  if (locDescarcare) {
    details.push({
      id: '2', ord: 2, tip: 'D', regim: 'Tur', asociere: '',
      data: order.data || '', ora: '12:00:00', status: '',
      partener: pairs['destinatar'] || locDescarcare,
      localitate: locDescarcare,
      firma: pairs['destinatar'] || '',
      referinta: order.referinta || '',
      articolMarfa: pairs['marfa'] || '',
    })
  }

  if (details.length > 0) order.detalii = details

  const transportator = pairs['transportator'] || ''
  const nrInmatriculare = pairs['numar inmatriculare'] || ''
  const sofer = pairs['sofer'] || ''
  const semiremorca = pairs['semiremorca'] || ''
  const tarifTransport = pairs['tarif'] || order.tarifFaraTVA || ''
  const termenPlata = pairs['termen plata'] || order.termen || '30'

  if (transportator) {
    order.tipPlanificare = 'Transport terti'
    order.planificare = {
      tip: 'Transport terti',
      nrComanda: '',
      beneficiar: '',
      transportator,
      termenPlata,
      tva: '21',
      tarifTransport,
      tarifCuTVA: '',
      moneda: order.moneda || 'EUR',
      nrInmatriculare,
      semiremorca,
      sofer,
    } as unknown as TransportOrder['planificare']
  }

  return order
}
