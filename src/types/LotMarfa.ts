export interface ArticolLot {
  id: string
  nrCrt: number
  hsCod: string
  cal: string
  descriere: string
  expeditor: string
  adresaExpeditor: string
  orasExpeditor: string
  taraExpeditor: string
  codPostalExpeditor: string
  destinatar: string
  adresaDestinatar: string
  orasDestinatar: string
  taraDestinatar: string
  codPostalDestinatar: string
  greutateBruta: string
  greutateNeta: string
  val: string
  observatii: string
}

export interface EntitatelLot {
  id: string
  declarant: string
  taraExpeditor: string
  taraDestinatar: string
  observatii: string
}

export interface TransportLot {
  id: string
  nrAuto: string
  taraTransportator: string
  codVamaExpeditor: string
  codVamaDestinatar: string
  ruta: string
  nrSigiliu: string
  observatii: string
}

export interface LotMarfa {
  // Antet
  pozitieR2: string
  data: string
  valuta: string
  regim: string
  tsdCrn: string
  dataR2: string
  ddt: string
  vama: string
  tranzitSuplimentar: string
  mrn: string
  lrn: string
  urn: string
  totalItemuri: string
  totalGreutateBruta: string
  observatii: string

  // Tab-uri
  articole: ArticolLot[]
  entitati: EntitatelLot[]
  transport: TransportLot[]
}

export const emptyLot = (): LotMarfa => ({
  pozitieR2: '',
  data: '',
  valuta: 'TRY',
  regim: 'T1',
  tsdCrn: '',
  dataR2: '',
  ddt: '',
  vama: '',
  tranzitSuplimentar: '',
  mrn: '',
  lrn: '',
  urn: '',
  totalItemuri: '',
  totalGreutateBruta: '',
  observatii: '',
  articole: [],
  entitati: [],
  transport: [],
})
