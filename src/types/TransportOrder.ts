export type TipPlanificare = 'Transport propriu' | 'Transport terti' | 'Intercompany' | 'Subcontractor' | ''

export interface PlanificarePropriu {
  tip: 'Transport propriu'
  nrComanda: string
  beneficiar: string
  nrInmatriculare: string
  semiremorca: string
  sofer: string
  echipaj: string
}

export interface PlanificareTerti {
  tip: 'Transport terti'
  nrComanda: string
  beneficiar: string
  transportator: string
  termenPlata: string
  tva: string
  tarifTransport: string
  moneda: string
  nrInmatriculare: string
  semiremorca: string
  sofer: string
}

export interface PlanificareIntercompany {
  tip: 'Intercompany'
  nrComanda: string
  beneficiar: string
  transportator: string
  tarifTransport: string
  nrInmatriculare: string
  semiremorca: string
  sofer: string
}

export interface PlanificareSubcontractor {
  tip: 'Subcontractor'
  nrComanda: string
  beneficiar: string
  transportator: string
  termenPlata: string
  tarifTransport: string
  moneda: string
  nrInmatriculare: string
  semiremorca: string
  sofer: string
}

export type Planificare = PlanificarePropriu | PlanificareTerti | PlanificareIntercompany | PlanificareSubcontractor | null

export interface RouteDetail {
  id: string
  ord: number
  tip: 'I' | 'D'
  regim: string
  asociere: string
  data: string
  ora: string
  status: string
  partener: string
  localitate: string
  firma: string
  referinta: string
  articolMarfa: string
}

export interface StatusEntry {
  id: string
  status: string
  dataStatus: string
  motiv: string
  observatii: string
  utilizatorIntroducere: string
  dataIntroducere: string
}

export interface FinanciarEntry {
  id: string
  tipTarifare: string
  um: string
  cantitate: string
  pretUnitar: string
  valoare: string
  moneda: string
  client: string
  nrFactura: string
  dataFactura: string
  validatFacturare: boolean
}

export interface TransportOrder {
  data: string
  numar: string
  client: string
  contact: string
  referinta: string
  contract: string
  responsabil: string
  observatii: string
  tipTransport: 'FTL' | 'LTL' | ''
  regimTransport: string
  cotaTVA: string
  moneda: string
  termen: string
  cantitate: string
  tarifFaraTVA: string
  tarifCuTVA: string
  parcursKm: string
  tipPlanificare: TipPlanificare
  planificare: Planificare
  detalii: RouteDetail[]
  statusuri: StatusEntry[]
  financiar: FinanciarEntry[]
}

export function generateNrComanda(tip: TipPlanificare): string {
  const now = new Date()
  const ts = now.getFullYear().toString().slice(2) +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  switch (tip) {
    case 'Transport propriu': return `NVS-P-${ts}`
    case 'Transport terti': return `NVS-T-${ts}`
    case 'Intercompany': return `NVS-I-${ts}`
    case 'Subcontractor': return `NVS-S-${ts}`
    default: return ''
  }
}

export const emptyOrder = (): TransportOrder => ({
  data: '',
  numar: '',
  client: '',
  contact: '',
  referinta: '',
  contract: '',
  responsabil: '',
  observatii: '',
  tipTransport: '',
  regimTransport: '',
  cotaTVA: '21',
  moneda: 'EUR',
  termen: '30',
  cantitate: '1',
  tarifFaraTVA: '',
  tarifCuTVA: '',
  parcursKm: '',
  tipPlanificare: '',
  planificare: null,
  detalii: [],
  statusuri: [],
  financiar: [],
})