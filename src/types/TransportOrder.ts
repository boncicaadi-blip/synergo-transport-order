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
  tipPlanificare: string
  codInternTert: string
  beneficiar: string
  transportator: string
  termenPlata: string
  tarifTransport: string
  monedaTransport: string
  nrInmatriculare: string
  semiremorca: string
  sofer: string
  detalii: RouteDetail[]
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
  tipPlanificare: 'Transport terti',
  codInternTert: '',
  beneficiar: '',
  transportator: '',
  termenPlata: '30',
  tarifTransport: '',
  monedaTransport: 'EUR',
  nrInmatriculare: '',
  semiremorca: '',
  sofer: '',
  detalii: [],
})
