import { supabase } from './supabase'
import type { LotMarfa } from '../types/LotMarfa'

export async function saveLot(lot: LotMarfa & { id?: string }): Promise<{ id: string } | null> {
  const payload = {
    pozitie_r2: lot.pozitieR2,
    data: lot.data,
    valuta: lot.valuta,
    regim: lot.regim,
    tsd_crn: lot.tsdCrn,
    data_r2: lot.dataR2,
    ddt: lot.ddt,
    vama: lot.vama,
    tranzit_suplimentar: lot.tranzitSuplimentar,
    mrn: lot.mrn,
    lrn: lot.lrn,
    urn: lot.urn,
    total_itemuri: lot.totalItemuri,
    total_greutate_bruta: lot.totalGreutateBruta,
    observatii: lot.observatii,
    articole: lot.articole,
    entitati: lot.entitati,
    transport: lot.transport,
    updated_at: new Date().toISOString(),
  }

  if (lot.id) {
    const { data, error } = await supabase
      .from('lot_marfa')
      .update(payload)
      .eq('id', lot.id)
      .select('id')
      .single()
    if (error) { console.error('Update error:', error); return null }
    return data
  } else {
    const { data, error } = await supabase
      .from('lot_marfa')
      .insert(payload)
      .select('id')
      .single()
    if (error) { console.error('Insert error:', error); return null }
    return data
  }
}

export async function loadLoturi() {
  const { data, error } = await supabase
    .from('lot_marfa')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('Load error:', error); return [] }
  return data
}

export async function deleteLot(id: string) {
  const { error } = await supabase
    .from('lot_marfa')
    .delete()
    .eq('id', id)
  if (error) { console.error('Delete error:', error); return false }
  return true
}

export function dbToLot(row: Record<string, unknown>): LotMarfa & { id: string } {
  return {
    id: row.id as string,
    pozitieR2: (row.pozitie_r2 as string) || '',
    data: (row.data as string) || '',
    valuta: (row.valuta as string) || 'TRY',
    regim: (row.regim as string) || 'T1',
    tsdCrn: (row.tsd_crn as string) || '',
    dataR2: (row.data_r2 as string) || '',
    ddt: (row.ddt as string) || '',
    vama: (row.vama as string) || '',
    tranzitSuplimentar: (row.tranzit_suplimentar as string) || '',
    mrn: (row.mrn as string) || '',
    lrn: (row.lrn as string) || '',
    urn: (row.urn as string) || '',
    totalItemuri: (row.total_itemuri as string) || '',
    totalGreutateBruta: (row.total_greutate_bruta as string) || '',
    observatii: (row.observatii as string) || '',
    articole: (row.articole as []) || [],
    entitati: (row.entitati as []) || [],
    transport: (row.transport as []) || [],
  }
}
