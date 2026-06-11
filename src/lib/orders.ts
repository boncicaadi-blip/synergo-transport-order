import { supabase } from './supabase'
import type { TransportOrder, TipPlanificare } from '../types/TransportOrder'

export async function saveOrder(order: TransportOrder & { id?: string }): Promise<{ id: string } | null> {
  const payload = {
    numar: order.numar,
    data: order.data,
    client: order.client,
    contact: order.contact,
    referinta: order.referinta,
    contract: order.contract,
    responsabil: order.responsabil,
    observatii: order.observatii,
    tip_transport: order.tipTransport,
    regim_transport: order.regimTransport,
    cota_tva: order.cotaTVA,
    moneda: order.moneda,
    termen: order.termen,
    cantitate: order.cantitate,
    tarif_fara_tva: order.tarifFaraTVA,
    tarif_cu_tva: order.tarifCuTVA,
    parcurs_km: order.parcursKm,
    tip_planificare: order.tipPlanificare,
    planificare: order.planificare,
    detalii: order.detalii,
    statusuri: order.statusuri,
    financiar: order.financiar,
    updated_at: new Date().toISOString(),
  }

  if (order.id) {
    const { data, error } = await supabase
      .from('transport_orders')
      .update(payload)
      .eq('id', order.id)
      .select('id')
      .single()
    if (error) { console.error('Update error:', error); return null }
    return data
  } else {
    const { data, error } = await supabase
      .from('transport_orders')
      .insert(payload)
      .select('id')
      .single()
    if (error) { console.error('Insert error:', error); return null }
    return data
  }
}

export async function loadOrders() {
  const { data, error } = await supabase
    .from('transport_orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) { console.error('Load error:', error); return [] }
  return data
}

export async function deleteOrder(id: string) {
  const { error } = await supabase
    .from('transport_orders')
    .delete()
    .eq('id', id)
  if (error) { console.error('Delete error:', error); return false }
  return true
}

export function dbToOrder(row: Record<string, unknown>): TransportOrder & { id: string } {
  return {
    id: row.id as string,
    numar: (row.numar as string) || '',
    data: (row.data as string) || '',
    client: (row.client as string) || '',
    contact: (row.contact as string) || '',
    referinta: (row.referinta as string) || '',
    contract: (row.contract as string) || '',
    responsabil: (row.responsabil as string) || '',
    observatii: (row.observatii as string) || '',
    tipTransport: (row.tip_transport as 'FTL' | 'LTL' | '') || '',
    regimTransport: (row.regim_transport as string) || '',
    cotaTVA: (row.cota_tva as string) || '21',
    moneda: (row.moneda as string) || 'EUR',
    termen: (row.termen as string) || '30',
    cantitate: (row.cantitate as string) || '1',
    tarifFaraTVA: (row.tarif_fara_tva as string) || '',
    tarifCuTVA: (row.tarif_cu_tva as string) || '',
    parcursKm: (row.parcurs_km as string) || '',
    tipPlanificare: ((row.tip_planificare as string) || '') as TipPlanificare,
    planificare: (row.planificare as never) || null,
    detalii: (row.detalii as []) || [],
    statusuri: (row.statusuri as []) || [],
    financiar: (row.financiar as []) || [],
  }
}