import type { TransportOrder, RouteDetail } from '../types/TransportOrder'
import { emptyOrder } from '../types/TransportOrder'

function parseDate(dateStr: string): string {
  if (!dateStr) return ''
  const m = dateStr.match(/(\d{2})[./](\d{2})[./](\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return dateStr
}

function shortAddress(addr: string, maxLen = 50): string {
  if (!addr) return ''
  return addr.trim().substring(0, maxLen)
}

export function mapTextractToOrder(
  pairs: Record<string, string>,
  rawText: string
): Partial<TransportOrder> {
  const order = emptyOrder()

  // Referinta = numar comanda din document
  if (pairs['numar comanda']) order.referinta = pairs['numar comanda']

  // Data comenzii
  if (pairs['data']) order.data = parseDate(pairs['data'])

  // Client = transportatorul (cel care primeste comanda)
  if (pairs['client']) order.client = pairs['client']

  // Moneda
  if (pairs['moneda']) order.moneda = pairs['moneda']

  // Tarif
  if (pairs['tarif']) {
    order.tarifFaraTVA = pairs['tarif'].replace(',', '.')
  }

  // Termen plata
  if (pairs['termen plata']) {
    const days = pairs['termen plata'].match(/\d+/)?.[0]
    if (days) order.termen = days
  }

  // Observatii = textul complet din document
  order.observatii = rawText.substring(0, 2000)

  // Fallback data din rawText
  if (!order.data) {
    const m = rawText.match(/din\s+(\d{2}[./]\d{2}[./]\d{4})/)
    if (m) order.data = parseDate(m[1])
  }

  // Fallback referinta
  if (!order.referinta) {
    const m = rawText.match(/NR\.\s*([\w\d]+)\s+din/i)
    if (m) order.referinta = m[1]
  }

  // Tarif fallback
  if (!order.tarifFaraTVA) {
    const m = rawText.match(/Pret[:\s]+([\d.,]+)\s*(EUR|RON|USD)/i)
    if (m) {
      order.tarifFaraTVA = m[1].replace(',', '.')
      order.moneda = m[2].toUpperCase()
    }
  }

  // Date incarcare
  const incDataMatch = rawText.match(/1\s*[Ii]ncarcare\s+Data:\s*(\d{2}[./]\d{2}[./]\d{4})\s+ora:\s*(\d{2}:\d{2})/i)
  const incAdresaMatch = rawText.match(/[Ii]ncarcare[\s\S]*?Adresa:([^\n]+)/i)

  // Date descarcare
  const decDataMatch = rawText.match(/2\s*[Dd]escarcare\s+Data:\s*(\d{2}[./]\d{2}[./]\d{4})\s+ora:\s*(\d{2}:\d{2})/i)
  const decAdresaMatch = rawText.match(/[Dd]escarcare[\s\S]*?Adresa:([^\n]+)/i)

  // Partener incarcare = expeditor sau prima parte din adresa
  const incAdresaFull = incAdresaMatch ? incAdresaMatch[1].trim() : ''
  const incParts = incAdresaFull.split('-')
  const incPartener = pairs['expeditor'] || (incParts[0]?.trim()) || ''
  const incLocalitate = shortAddress(incParts.slice(1).join('-').trim() || incAdresaFull)

  // Partener descarcare = destinatar sau prima parte din adresa
  const decAdresaFull = decAdresaMatch ? decAdresaMatch[1].trim() : ''
  const decParts = decAdresaFull.split('-')
  const decPartener = pairs['destinatar'] || (decParts[0]?.trim()) || ''
  const decLocalitate = shortAddress(decParts.slice(1).join('-').trim() || decAdresaFull)

  const details: RouteDetail[] = [
    {
      id: '1',
      ord: 1,
      tip: 'I',
      regim: 'Tur',
      asociere: '',
      data: incDataMatch ? parseDate(incDataMatch[1]) : '',
      ora: incDataMatch ? `${incDataMatch[2]}:00` : '12:00:00',
      status: '',
      partener: incPartener,
      localitate: incLocalitate,
      firma: incPartener,
      referinta: order.referinta || '',
      articolMarfa: pairs['marfa'] || '',
    },
    {
      id: '2',
      ord: 2,
      tip: 'D',
      regim: 'Tur',
      asociere: '',
      data: decDataMatch ? parseDate(decDataMatch[1]) : '',
      ora: decDataMatch ? `${decDataMatch[2]}:00` : '12:00:00',
      status: '',
      partener: decPartener,
      localitate: decLocalitate,
      firma: decPartener,
      referinta: order.referinta || '',
      articolMarfa: pairs['marfa'] || '',
    },
  ]

  order.detalii = details

  // Planificare Transport Terti
  const transportator = pairs['transportator'] || ''
  if (transportator) {
    order.tipPlanificare = 'Transport terti'
    order.planificare = {
      tip: 'Transport terti',
      nrComanda: '',
      beneficiar: '',
      transportator,
      termenPlata: order.termen || '30',
      tva: '21',
      tarifTransport: order.tarifFaraTVA || '',
      tarifCuTVA: '',
      moneda: order.moneda || 'EUR',
      nrInmatriculare: pairs['numar inmatriculare'] || '',
      semiremorca: pairs['semiremorca'] || '',
      sofer: pairs['sofer'] || '',
    } as unknown as TransportOrder['planificare']
  }

  return order
}
