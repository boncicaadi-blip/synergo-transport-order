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

  // Referinta = numar comanda din document (DID2167 etc.)
  if (pairs['numar comanda']) order.referinta = pairs['numar comanda']

  // Data comenzii
  if (pairs['data']) order.data = parseDate(pairs['data'])

  // Client = ORDONATORUL cursei (cel care emite comanda)
  // In documentul DID: pairs['transportator'] = DIDI TRANS (ordonatorul)
  // pairs['client'] = VALENTIN VLAD (transportatorul care executa)
  if (pairs['transportator'] && pairs['client']) {
    // Avem ambele campuri -> ordonatorul e in 'transportator', executantul in 'client'
    order.client = pairs['transportator']
  } else if (pairs['client']) {
    order.client = pairs['client']
  } else if (pairs['transportator']) {
    order.client = pairs['transportator']
  }

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

  // Date incarcare din rawText
  const incDataMatch = rawText.match(/1\s*[Ii]ncarcare\s+Data:\s*(\d{2}[./]\d{2}[./]\d{4})\s+ora:\s*(\d{2}:\d{2})/i)
  const incAdresaMatch = rawText.match(/[Ii]ncarcare[\s\S]*?Adresa:([^\n]+)/i)

  // Date descarcare din rawText
  const decDataMatch = rawText.match(/2\s*[Dd]escarcare\s+Data:\s*(\d{2}[./]\d{2}[./]\d{4})\s+ora:\s*(\d{2}:\d{2})/i)
  const decAdresaMatch = rawText.match(/[Dd]escarcare[\s\S]*?Adresa:([^\n]+)/i)

  // Incarcare - partener si localitate
  const incAdresaFull = incAdresaMatch ? incAdresaMatch[1].trim() : ''
  const incParts = incAdresaFull.split('-')
  const incPartener = pairs['expeditor'] || incParts[0]?.trim() || ''
  const incLocalitate = shortAddress(incParts.slice(1).join('-').trim() || incAdresaFull)

  // Descarcare - partener si localitate
  const decAdresaFull = decAdresaMatch ? decAdresaMatch[1].trim() : ''
  const decParts = decAdresaFull.split('-')
  const decPartener = pairs['destinatar'] || decParts[0]?.trim() || ''
  const decLocalitate = shortAddress(decParts.slice(1).join('-').trim() || decAdresaFull)

  order.detalii = [
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
    } as RouteDetail,
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
    } as RouteDetail,
  ]

  // Planificare Transport Terti
  // Executantul transportului = pairs['client'] (VALENTIN VLAD)
  const executant = pairs['client'] || ''
  const nrInmatriculare = pairs['numar inmatriculare'] || ''
  const sofer = pairs['sofer'] || ''
  const semiremorca = pairs['semiremorca'] || ''

  if (executant) {
    order.tipPlanificare = 'Transport terti'
    order.planificare = {
      tip: 'Transport terti',
      nrComanda: '',
      beneficiar: '',
      transportator: executant,
      termenPlata: order.termen || '30',
      tva: '21',
      tarifTransport: order.tarifFaraTVA || '',
      tarifCuTVA: '',
      moneda: order.moneda || 'EUR',
      nrInmatriculare,
      semiremorca,
      sofer,
    } as unknown as TransportOrder['planificare']
  }

  return order
}
