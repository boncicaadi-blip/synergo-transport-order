import type { TransportOrder, RouteDetail } from '../types/TransportOrder'
import { emptyOrder } from '../types/TransportOrder'

function parseDate(dateStr: string): string {
  if (!dateStr) return ''
  // DD.MM.YYYY → YYYY-MM-DD
  const m = dateStr.match(/(\d{2})[./](\d{2})[./](\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return dateStr
}

export function mapTextractToOrder(
  pairs: Record<string, string>,
  rawText: string
): Partial<TransportOrder> {
  const order = emptyOrder()

  // Referinta = numar comanda din document (DID2167 etc.)
  if (pairs['numar comanda']) order.referinta = pairs['numar comanda']

  // Data comenzii
  if (pairs['data']) order.data = parseDate(pairs['data'])

  // Client = TRANSPORTATORUL (cel care primeste comanda, din sectiunea DATE TRANSPORTATOR)
  // In documentul DID, transportatorul e VALENTIN VLAD FOREST S.R.L.
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

  // Observatii = detalii cursa din document
  const observatiiParts: string[] = []
  if (pairs['marfa']) observatiiParts.push(`Marfă: ${pairs['marfa']}`)
  if (pairs['expeditor']) observatiiParts.push(`Expeditor: ${pairs['expeditor']}`)
  if (pairs['destinatar']) observatiiParts.push(`Destinatar: ${pairs['destinatar']}`)
  if (observatiiParts.length > 0) order.observatii = rawText.substring(0, 2000)

  // Fallback din rawText pentru data
  if (!order.data) {
    const m = rawText.match(/din\s+(\d{2}[./]\d{2}[./]\d{4})/)
    if (m) order.data = parseDate(m[1])
  }

  // Fallback referinta din rawText (NR. DID2167)
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

  // Extrage date incarcare din rawText
  // "1 Incarcare Data: 11.06.2026 ora: 12:00"
  const incarcareDataMatch = rawText.match(/1\s*[Ii]ncarcare\s+Data:\s*(\d{2}[./]\d{2}[./]\d{4})\s+ora:\s*(\d{2}:\d{2})/i)
  const incarcareAdresaMatch = rawText.match(/[Ii]ncarcare[\s\S]*?Adresa:([^\n]+)/i)
  const incarcarePart = pairs['localitate incarcare'] || pairs['expeditor'] || ''

  // Extrage date descarcare din rawText  
  // "2 Descarcare Data: 14.06.2026 ora: 12:00"
  const descarcareDataMatch = rawText.match(/2\s*[Dd]escarcare\s+Data:\s*(\d{2}[./]\d{2}[./]\d{4})\s+ora:\s*(\d{2}:\d{2})/i)
  const descarcareAdresaMatch = rawText.match(/[Dd]escarcare[\s\S]*?Adresa:([^\n]+)/i)
  const descarcarePart = pairs['localitate descarcare'] || pairs['destinatar'] || ''

  const details: RouteDetail[] = []

  // Linie incarcare
  const incData = incarcareDataMatch ? parseDate(incarcareDataMatch[1]) : ''
  const incOra = incarcareDataMatch ? `${incarcareDataMatch[2]}:00` : '12:00:00'
  const incAdresa = incarcareAdresaMatch ? incarcareAdresaMatch[1].trim() : ''
  const incLocalitate = incarcarePart || incAdresa.split('-')[0]?.trim() || ''
  const incPartener = pairs['expeditor'] || incLocalitate

  details.push({
    id: '1',
    ord: 1,
    tip: 'I',
    regim: 'Tur',
    asociere: '',
    data: incData,
    ora: incOra,
    status: '',
    partener: incPartener,
    localitate: incAdresa || incLocalitate,
    firma: incPartener,
    referinta: order.referinta || '',
    articolMarfa: pairs['marfa'] || '',
  })

  // Linie descarcare
  const decData = descarcareDataMatch ? parseDate(descarcareDataMatch[1]) : ''
  const decOra = descarcareDataMatch ? `${descarcareDataMatch[2]}:00` : '12:00:00'
  const decAdresa = descarcareAdresaMatch ? descarcareAdresaMatch[1].trim() : ''
  const decLocalitate = descarcarePart || decAdresa.split('-')[0]?.trim() || ''
  const decPartener = pairs['destinatar'] || decLocalitate

  details.push({
    id: '2',
    ord: 2,
    tip: 'D',
    regim: 'Tur',
    asociere: '',
    data: decData,
    ora: decOra,
    status: '',
    partener: decPartener,
    localitate: decAdresa || decLocalitate,
    firma: decPartener,
    referinta: order.referinta || '',
    articolMarfa: pairs['marfa'] || '',
  })

  order.detalii = details

  // Planificare Transport Terti
  const transportator = pairs['transportator'] || ''
  const nrInmatriculare = pairs['numar inmatriculare'] || ''
  const sofer = pairs['sofer'] || ''
  const semiremorca = pairs['semiremorca'] || ''
  const tarifTransport = order.tarifFaraTVA || ''
  const termenPlata = order.termen || '30'
  const moneda = order.moneda || 'EUR'

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
      moneda,
      nrInmatriculare,
      semiremorca,
      sofer,
    } as unknown as TransportOrder['planificare']
  }

  return order
}
