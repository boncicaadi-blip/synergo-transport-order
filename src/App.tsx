import { useState, useEffect, useCallback, useRef } from 'react'
import PdfDropZone from './components/PdfDropZone'
import MapPicker from './components/MapPicker'
import type { MapLocation } from './components/MapPicker'
import { emptyOrder, generateNrComanda } from './types/TransportOrder'
import type {
  TransportOrder, RouteDetail, TipPlanificare,
  PlanificarePropriu, PlanificareTerti, PlanificareIntercompany,
  PlanificareSubcontractor, StatusEntry, FinanciarEntry
} from './types/TransportOrder'
import { mapTextractToOrder } from './utils/mapTextractToOrder'
import { saveOrder, loadOrders, deleteOrder, dbToOrder } from './lib/orders'
import { RefreshCw, Plus, Trash2, Save, ChevronDown, FileUp, List, ArrowLeft, CheckCircle, XCircle, Printer, Map } from 'lucide-react'

const INDIGO = '#0B178B'
const MAGENTA = '#DA387E'
const BLUE = '#2980DA'
const TVA_OPTIONS = ['0', '5', '9', '19', '21', '25']
const MONEDA_OPTIONS = ['RON', 'EUR', 'USD', 'GBP', 'CHF', 'HUF', 'BGN', 'PLN']
const STATUS_OPTIONS = ['Nou', 'Confirmat', 'In tranzit', 'Livrat', 'Anulat', 'Incident']

function Field({ label, value, onChange, readOnly = false, highlight = false }: {
  label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean; highlight?: boolean
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
      <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>{label}</label>
      <input
        style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', background: readOnly ? '#f3f4f6' : highlight ? '#fffbeb' : 'white', outline: 'none', color: readOnly ? '#9ca3af' : 'inherit', cursor: readOnly ? 'not-allowed' : 'text' }}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
      />
    </div>
  )
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
      <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>{label}</label>
      <input type="date" style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', background: 'white', outline: 'none', width: '100%' }}
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
      <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '3px 24px 3px 8px', fontSize: '12px', background: 'white', outline: 'none', appearance: 'none' }}
          value={value} onChange={e => onChange(e.target.value)}>
          <option value="">—</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', color: '#9ca3af', pointerEvents: 'none' }} />
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div style={{ background: INDIGO, color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</div>
      <div style={{ padding: '10px 16px' }}>{children}</div>
    </div>
  )
}

function PlanificarePanel({ tipPlanificare, planificare, onChange, onGenerate }: {
  tipPlanificare: TipPlanificare
  planificare: TransportOrder['planificare']
  onChange: (p: TransportOrder['planificare']) => void
  onGenerate: () => void
}) {
  if (!tipPlanificare) return null

  const nrComanda = (planificare as { nrComanda?: string })?.nrComanda || ''

  const setField = (field: string, value: string) => {
    onChange({ ...(planificare as unknown as Record<string, unknown>), [field]: value } as unknown as TransportOrder['planificare'])
  }

  const f = (label: string, field: string) => (
    <Field label={label} value={(planificare as unknown as Record<string, string>)?.[field] || ''} onChange={v => setField(field, v)} />
  )

  const fh = (label: string, field: string) => (
    <Field label={label} value={(planificare as unknown as Record<string, string>)?.[field] || ''} onChange={v => setField(field, v)} highlight />
  )

  const s = (label: string, field: string, options: string[]) => (
    <SelectField label={label} value={(planificare as unknown as Record<string, string>)?.[field] || ''} onChange={v => setField(field, v)} options={options} />
  )

  const handleTarifFaraTVA = (value: string) => {
    const tva = parseFloat((planificare as unknown as Record<string, string>)?.tva || '21') || 0
    const faraTVA = parseFloat(value.replace(',', '.')) || 0
    const cuTVA = faraTVA * (1 + tva / 100)
    setField('tarifTransport', value)
    setField('tarifCuTVA', value ? cuTVA.toFixed(2) : '')
  }

  const handleTarifCuTVA = (value: string) => {
    const tva = parseFloat((planificare as unknown as Record<string, string>)?.tva || '21') || 0
    const cuTVA = parseFloat(value.replace(',', '.')) || 0
    const faraTVA = tva > 0 ? cuTVA / (1 + tva / 100) : cuTVA
    setField('tarifCuTVA', value)
    setField('tarifTransport', value ? faraTVA.toFixed(2) : '')
  }

  return (
    <div style={{ background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div style={{ background: INDIGO, color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Planificare — {tipPlanificare}</span>
        {!nrComanda && (
          <button onClick={onGenerate}
            style={{ fontSize: '10px', background: MAGENTA, color: 'white', border: 'none', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer' }}>
            + Generează nr.
          </button>
        )}
      </div>
      <div style={{ padding: '10px 16px' }}>
        {nrComanda && (
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px', padding: '3px 0 6px', borderBottom: '1px solid #f3f4f6', marginBottom: '4px' }}>
            <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>Nr. planificare</label>
            <span style={{ fontWeight: 'bold', color: INDIGO, fontSize: '13px' }}>{nrComanda}</span>
          </div>
        )}

        {tipPlanificare === 'Transport propriu' && (
          <>{f('Beneficiar', 'beneficiar')}{f('Nr. înmatriculare', 'nrInmatriculare')}{f('Semiremorci', 'semiremorca')}{f('Șofer', 'sofer')}{f('Echipaj', 'echipaj')}</>
        )}

        {tipPlanificare === 'Transport terti' && (
          <>
            {f('Beneficiar', 'beneficiar')}
            {f('Transportator', 'transportator')}
            {f('Termen plată (zile)', 'termenPlata')}
            {s('TVA (%)', 'tva', TVA_OPTIONS)}
            {s('Monedă', 'moneda', MONEDA_OPTIONS)}
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
              <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>Tarif fără TVA</label>
              <input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', background: '#fffbeb', outline: 'none' }}
                value={(planificare as unknown as Record<string, string>)?.tarifTransport || ''}
                onChange={e => handleTarifFaraTVA(e.target.value)} placeholder="0.00" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', alignItems: 'center', gap: '8px', padding: '3px 0' }}>
              <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>Tarif cu TVA</label>
              <input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', background: '#fffbeb', outline: 'none' }}
                value={(planificare as unknown as Record<string, string>)?.tarifCuTVA || ''}
                onChange={e => handleTarifCuTVA(e.target.value)} placeholder="0.00" />
            </div>
            {f('Nr. înmatriculare', 'nrInmatriculare')}
            {f('Semiremorci', 'semiremorca')}
            {f('Șofer', 'sofer')}
          </>
        )}

        {tipPlanificare === 'Intercompany' && (
          <>{f('Beneficiar', 'beneficiar')}{f('Transportator', 'transportator')}{fh('Tarif transport', 'tarifTransport')}{f('Nr. înmatriculare', 'nrInmatriculare')}{f('Semiremorci', 'semiremorca')}{f('Șofer', 'sofer')}</>
        )}

        {tipPlanificare === 'Subcontractor' && (
          <>{f('Beneficiar', 'beneficiar')}{f('Transportator', 'transportator')}{f('Termen plată (zile)', 'termenPlata')}{fh('Tarif transport', 'tarifTransport')}{s('Monedă', 'moneda', MONEDA_OPTIONS)}{f('Nr. înmatriculare', 'nrInmatriculare')}{f('Semiremorci', 'semiremorca')}{f('Șofer', 'sofer')}</>
        )}
      </div>
    </div>
  )
}

function ListareTab({ order }: { order: TransportOrder }) {
  const printRef = useRef<HTMLDivElement>(null)
  const p = order.planificare as PlanificareTerti | null
  const incarcare = order.detalii.find(d => d.tip === 'I')
  const descarcare = order.detalii.find(d => d.tip === 'D')

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<html><head><title>Comanda ${p?.nrComanda || ''}</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px;color:#000}h2{text-align:center;font-size:14px}table{width:100%;border-collapse:collapse;margin-bottom:12px}td,th{border:1px solid #000;padding:5px 8px;font-size:11px}th{background:#eee;font-weight:bold;text-align:left}.section{font-weight:bold;font-size:12px;margin:12px 0 4px;text-transform:uppercase;border-bottom:2px solid #000;padding-bottom:2px}.footer-row{display:flex;justify-content:space-between;margin-top:40px}.sign-box{width:45%;border-top:1px solid #000;padding-top:8px;text-align:center}.highlight{background:#fef9c3;border:1px solid #fbbf24;padding:6px 10px;margin:8px 0;font-size:10px}</style>
    </head><body>${content.innerHTML}</body></html>`)
    win.document.close()
    win.print()
  }

  if (order.tipPlanificare !== 'Transport terti') {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Listarea este disponibilă doar pentru <strong>Transport Terți</strong>.</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0', marginBottom: '8px' }}>
        <button onClick={handlePrint}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: INDIGO, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
          <Printer style={{ width: '14px', height: '14px' }} /> Printează / PDF
        </button>
      </div>
      <div ref={printRef} style={{ background: 'white', padding: '24px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>DIDI TRANS INTERNATIONAL SRL</div>
            <div style={{ fontSize: '10px', color: '#555' }}>CUI: RO22396357 | J2007017045404</div>
            <div style={{ fontSize: '10px', color: '#555' }}>office@diditrans.ro</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase' }}>Comandă Transport</div>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: INDIGO }}>NR. {p?.nrComanda || '—'} din {order.data || '—'}</div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '10px' }}>
            <div style={{ fontWeight: 'bold' }}>Dispecer: {order.responsabil || '—'}</div>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
          <thead><tr>
            <th style={{ border: '1px solid #000', padding: '5px 8px', background: '#eee', width: '50%' }}>DATE TRANSPORTATOR</th>
            <th style={{ border: '1px solid #000', padding: '5px 8px', background: '#eee', width: '50%' }}>ORDONATOR CURSĂ / DATE FACTURARE</th>
          </tr></thead>
          <tbody><tr>
            <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
              <div><strong>Nume:</strong> {p?.transportator || '—'}</div>
            </td>
            <td style={{ border: '1px solid #000', padding: '8px', verticalAlign: 'top' }}>
              <div><strong>DIDI TRANS INTERNATIONAL SRL</strong></div>
              <div>RO22396357 | J2007017045404</div>
              <div>Str. Soldanului 7, București Sector 4</div>
            </td>
          </tr></tbody>
        </table>
        <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', borderBottom: '2px solid #000', paddingBottom: '2px', marginBottom: '8px' }}>Detalii Cursă</div>
        <div style={{ background: '#fef9c3', border: '1px solid #fbbf24', padding: '6px 10px', marginBottom: '8px', fontSize: '10px' }}>
          OBLIGAȚIA TRANSPORTATORULUI ESTE SĂ TRANSMITĂ POZE LA CMR + AVIZE IMEDIAT DUPĂ ÎNCĂRCARE PENTRU A FI GENERAT COD UIT
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #000', padding: '5px 8px', background: '#f0faf4', fontWeight: 'bold', width: '120px' }}>1. Încărcare</td>
              <td style={{ border: '1px solid #000', padding: '5px 8px' }}>
                <strong>Data:</strong> {incarcare?.data || '—'} ora: {incarcare?.ora || '—'}<br />
                <strong>Adresa:</strong> {incarcare?.partener || '—'} — {incarcare?.localitate || '—'}<br />
                <strong>Marfă:</strong> {incarcare?.articolMarfa || '—'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '5px 8px', background: '#f0f4ff', fontWeight: 'bold' }}>2. Descărcare</td>
              <td style={{ border: '1px solid #000', padding: '5px 8px' }}>
                <strong>Data:</strong> {descarcare?.data || '—'} ora: {descarcare?.ora || '—'}<br />
                <strong>Adresa:</strong> {descarcare?.partener || '—'} — {descarcare?.localitate || '—'}<br />
                <strong>Marfă:</strong> {descarcare?.articolMarfa || '—'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>Auto nr.</td>
              <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{p?.nrInmatriculare || '—'} / {p?.semiremorca || '—'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>Șofer</td>
              <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{p?.sofer || '—'}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', background: '#fffbeb' }}>Preț</td>
              <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold', background: '#fffbeb' }}>
                {p?.tarifTransport || order.tarifFaraTVA || '—'} {p?.moneda || order.moneda || 'EUR'} + TVA
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #000', padding: '5px 8px', fontWeight: 'bold' }}>Termen plată</td>
              <td style={{ border: '1px solid #000', padding: '5px 8px' }}>{p?.termenPlata || '30'} zile de la primirea documentelor în original.</td>
            </tr>
          </tbody>
        </table>
        <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', borderBottom: '2px solid #000', paddingBottom: '2px', marginBottom: '8px' }}>Prevederi Generale</div>
        <div style={{ fontSize: '10px', lineHeight: '1.6', marginBottom: '12px' }}>
          <p>1. Prezenta comandă ține loc de contract. Transportul se va efectua conform convenției CMR.</p>
          <p>2. Transbordarea mărfii și subcontractarea fără acordul prealabil scris este strict interzisă.</p>
          <p>3. Dacă într-o oră de la primirea comenzii nu se refuză în scris, se consideră acceptată.</p>
          <p>4. Transportatorul are obligația de a informa în scris privind orice întârziere.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
          <div style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>ORDONATOR CURSĂ</div>
            <div>DIDI TRANS INTERNATIONAL SRL</div>
          </div>
          <div style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>TRANSPORTATOR</div>
            <div>{p?.transportator || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusuriTab({ statusuri, onChange }: { statusuri: StatusEntry[]; onChange: (s: StatusEntry[]) => void }) {
  const addStatus = () => {
    const now = new Date()
    onChange([...statusuri, {
      id: Date.now().toString(), status: '', dataStatus: now.toISOString().slice(0, 10),
      motiv: '', observatii: '', utilizatorIntroducere: 'admin', dataIntroducere: now.toLocaleString('ro-RO'),
    }])
  }
  const updateStatus = (id: string, field: keyof StatusEntry, value: string) =>
    onChange(statusuri.map(s => s.id === id ? { ...s, [field]: value } : s))
  const removeStatus = (id: string) => onChange(statusuri.filter(s => s.id !== id))

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <button onClick={addStatus} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: INDIGO, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
          <Plus style={{ width: '12px', height: '12px' }} /> Adaugă status
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f5f6fa' }}>
            {['Status', 'Data status', 'Motiv', 'Observații', 'Utilizator', 'Data introducere', ''].map((h, i) => (
              <th key={i} style={{ textAlign: 'left', padding: '8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statusuri.length === 0 ? (
            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Niciun status înregistrat.</td></tr>
          ) : statusuri.map((s, i) => (
            <tr key={s.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '6px 8px' }}>
                <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', background: 'white' }}
                  value={s.status} onChange={e => updateStatus(s.id, 'status', e.target.value)}>
                  <option value="">—</option>
                  {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
              <td style={{ padding: '6px 8px' }}>
                <input type="date" style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', background: 'white' }}
                  value={s.dataStatus} onChange={e => updateStatus(s.id, 'dataStatus', e.target.value)} />
              </td>
              <td style={{ padding: '6px 8px' }}>
                <input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '120px', background: 'white' }}
                  value={s.motiv} onChange={e => updateStatus(s.id, 'motiv', e.target.value)} />
              </td>
              <td style={{ padding: '6px 8px' }}>
                <input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '160px', background: 'white' }}
                  value={s.observatii} onChange={e => updateStatus(s.id, 'observatii', e.target.value)} />
              </td>
              <td style={{ padding: '6px 8px', color: '#6b7280' }}>{s.utilizatorIntroducere}</td>
              <td style={{ padding: '6px 8px', color: '#6b7280', whiteSpace: 'nowrap' }}>{s.dataIntroducere}</td>
              <td style={{ padding: '6px 8px' }}>
                <button onClick={() => removeStatus(s.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Trash2 style={{ width: '14px', height: '14px' }} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FinanciarTab({ financiar, order, onChange }: { financiar: FinanciarEntry[]; order: TransportOrder; onChange: (f: FinanciarEntry[]) => void }) {
  const addRow = () => {
    onChange([...financiar, {
      id: Date.now().toString(), tipTarifare: 'Transport intracomunit.', um: 'Bucată',
      cantitate: order.cantitate || '1', pretUnitar: order.tarifFaraTVA || '', valoare: order.tarifFaraTVA || '',
      moneda: order.moneda || 'EUR', client: order.client || '', nrFactura: '',
      dataFactura: new Date().toISOString().slice(0, 10), validatFacturare: false,
    }])
  }
  const updateRow = (id: string, field: keyof FinanciarEntry, value: string | boolean) =>
    onChange(financiar.map(f => f.id === id ? { ...f, [field]: value } : f))
  const removeRow = (id: string) => onChange(financiar.filter(f => f.id !== id))

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <button onClick={addRow} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: INDIGO, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
          <Plus style={{ width: '12px', height: '12px' }} /> Adaugă linie financiară
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: '#f5f6fa' }}>
              {['Validat', 'Tip tarifare', 'UM', 'Cant.', 'Preț unitar', 'Valoare', 'Monedă', 'Client', 'Nr. factură', 'Data factură', ''].map((h, i) => (
                <th key={i} style={{ textAlign: 'left', padding: '8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {financiar.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Nicio linie financiară.</td></tr>
            ) : financiar.map((f, i) => (
              <tr key={f.id} style={{ background: i % 2 === 0 ? '#f0faf4' : 'white', borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                  <input type="checkbox" checked={f.validatFacturare} onChange={e => updateRow(f.id, 'validatFacturare', e.target.checked)} />
                </td>
                <td style={{ padding: '6px 8px' }}><input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '140px', background: 'white' }} value={f.tipTarifare} onChange={e => updateRow(f.id, 'tipTarifare', e.target.value)} /></td>
                <td style={{ padding: '6px 8px' }}><input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '70px', background: 'white' }} value={f.um} onChange={e => updateRow(f.id, 'um', e.target.value)} /></td>
                <td style={{ padding: '6px 8px' }}><input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '50px', background: 'white' }} value={f.cantitate} onChange={e => updateRow(f.id, 'cantitate', e.target.value)} /></td>
                <td style={{ padding: '6px 8px' }}><input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '80px', background: 'white' }} value={f.pretUnitar} onChange={e => updateRow(f.id, 'pretUnitar', e.target.value)} /></td>
                <td style={{ padding: '6px 8px', fontWeight: 'bold', color: MAGENTA }}>{f.valoare} {f.moneda}</td>
                <td style={{ padding: '6px 8px' }}>
                  <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', background: 'white' }} value={f.moneda} onChange={e => updateRow(f.id, 'moneda', e.target.value)}>
                    {MONEDA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </td>
                <td style={{ padding: '6px 8px' }}><input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '110px', background: 'white' }} value={f.client} onChange={e => updateRow(f.id, 'client', e.target.value)} /></td>
                <td style={{ padding: '6px 8px' }}><input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '90px', background: 'white' }} value={f.nrFactura} onChange={e => updateRow(f.id, 'nrFactura', e.target.value)} /></td>
                <td style={{ padding: '6px 8px' }}><input type="date" style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', background: 'white' }} value={f.dataFactura} onChange={e => updateRow(f.id, 'dataFactura', e.target.value)} /></td>
                <td style={{ padding: '6px 8px' }}><button onClick={() => removeRow(f.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 style={{ width: '14px', height: '14px' }} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function App() {
  const [order, setOrder] = useState<TransportOrder>(emptyOrder())
  const [orderId, setOrderId] = useState<string | null>(null)
  const [extracted, setExtracted] = useState(false)
  const [showImport, setShowImport] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [view, setView] = useState<'form' | 'list'>('form')
  const [orders, setOrders] = useState<(TransportOrder & { id: string })[]>([])
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [loadingList, setLoadingList] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const set = (field: keyof TransportOrder) => (value: string) =>
    setOrder(prev => ({ ...prev, [field]: value }))

  const handleTarifFaraTVA = (value: string) => {
    const tva = parseFloat(order.cotaTVA) || 0
    const faraTVA = parseFloat(value.replace(',', '.')) || 0
    const cuTVA = faraTVA * (1 + tva / 100)
    setOrder(prev => ({ ...prev, tarifFaraTVA: value, tarifCuTVA: value ? cuTVA.toFixed(2) : '' }))
  }

  const handleTarifCuTVA = (value: string) => {
    const tva = parseFloat(order.cotaTVA) || 0
    const cuTVA = parseFloat(value.replace(',', '.')) || 0
    const faraTVA = tva > 0 ? cuTVA / (1 + tva / 100) : cuTVA
    setOrder(prev => ({ ...prev, tarifCuTVA: value, tarifFaraTVA: value ? faraTVA.toFixed(2) : '' }))
  }

  const handleTipPlanificareChange = (tip: string) => {
    const tipP = tip as TipPlanificare
    let planificare: TransportOrder['planificare'] = null
    if (tipP === 'Transport propriu') planificare = { tip: 'Transport propriu', nrComanda: '', beneficiar: '', nrInmatriculare: '', semiremorca: '', sofer: '', echipaj: '' } as PlanificarePropriu
    else if (tipP === 'Transport terti') planificare = { tip: 'Transport terti', nrComanda: '', beneficiar: '', transportator: '', termenPlata: '30', tva: '21', tarifTransport: '', tarifCuTVA: '', moneda: 'EUR', nrInmatriculare: '', semiremorca: '', sofer: '' } as unknown as PlanificareTerti
    else if (tipP === 'Intercompany') planificare = { tip: 'Intercompany', nrComanda: '', beneficiar: '', transportator: '', tarifTransport: '', nrInmatriculare: '', semiremorca: '', sofer: '' } as PlanificareIntercompany
    else if (tipP === 'Subcontractor') planificare = { tip: 'Subcontractor', nrComanda: '', beneficiar: '', transportator: '', termenPlata: '30', tarifTransport: '', moneda: 'EUR', nrInmatriculare: '', semiremorca: '', sofer: '' } as PlanificareSubcontractor
    setOrder(prev => ({ ...prev, tipPlanificare: tipP, planificare }))
  }

  const handleGenerateNr = () => {
    if (!order.tipPlanificare) return
    const nr = generateNrComanda(order.tipPlanificare)
    setOrder(prev => ({ ...prev, planificare: { ...(prev.planificare as unknown as Record<string, unknown>), nrComanda: nr } as unknown as TransportOrder['planificare'] }))
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveStatus('idle')
    // Generează nr planificare dacă lipsește
    let orderToSave = { ...order }
    if (orderToSave.tipPlanificare && orderToSave.planificare && !(orderToSave.planificare as unknown as Record<string, string>).nrComanda) {
      const nr = generateNrComanda(orderToSave.tipPlanificare)
      orderToSave = { ...orderToSave, planificare: { ...(orderToSave.planificare as unknown as Record<string, unknown>), nrComanda: nr } as unknown as TransportOrder['planificare'] }
      setOrder(orderToSave)
    }
    const result = await saveOrder(orderId ? { ...orderToSave, id: orderId } : orderToSave)
    if (result) {
      setOrderId(result.id)
      // Setează numărul generat de Supabase
      if (result.numar && !orderToSave.numar) {
        setOrder(prev => ({ ...prev, numar: result.numar }))
      }
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } else {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
    setSaving(false)
  }, [order, orderId])

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        if (view === 'form') handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleSave, view])

  const handleExtracted = (pairs: Record<string, string>, rawText: string) => {
    const mapped = mapTextractToOrder(pairs, rawText)
    setOrder(prev => ({ ...prev, ...mapped }))
    setExtracted(true)
    setShowImport(false)
  }

  const handleMapConfirm = (locations: MapLocation[]) => {
    const newDetails = locations.map((loc, i) => ({
      id: Date.now().toString() + i,
      ord: order.detalii.length + i + 1,
      tip: loc.type === 'incarcare' ? 'I' as const : 'D' as const,
      regim: 'Tur',
      asociere: '',
      data: '',
      ora: '12:00:00',
      status: '',
      partener: loc.label,
      localitate: loc.address.split(',').slice(0, 2).join(',').trim(),
      firma: '',
      referinta: '',
      articolMarfa: '',
    }))
    setOrder(prev => ({ ...prev, detalii: [...prev.detalii, ...newDetails] }))
    setShowMap(false)
  }

  const handleLoadList = async () => {
    setLoadingList(true)
    const data = await loadOrders()
    setOrders(data.map(dbToOrder))
    setLoadingList(false)
    setView('list')
  }

  const handleOpenOrder = (o: TransportOrder & { id: string }) => {
    setOrder(o); setOrderId(o.id); setView('form'); setActiveTab('general')
  }

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Ștergi această comandă?')) return
    await deleteOrder(id)
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const handleNew = () => {
    setOrder(emptyOrder()); setOrderId(null); setExtracted(false); setShowImport(true); setView('form'); setActiveTab('general')
  }

  const addDetail = () => {
    setOrder(prev => ({ ...prev, detalii: [...prev.detalii, {
      id: Date.now().toString(), ord: prev.detalii.length + 1, tip: 'I' as const, regim: 'Tur',
      asociere: '', data: '', ora: '12:00:00', status: '', partener: '', localitate: '', firma: '', referinta: '', articolMarfa: '',
    }]}))
  }

  const removeDetail = (id: string) => setOrder(prev => ({ ...prev, detalii: prev.detalii.filter(d => d.id !== id) }))

  const updateDetail = (id: string, field: keyof RouteDetail, value: string) =>
    setOrder(prev => ({ ...prev, detalii: prev.detalii.map(d => d.id === id ? { ...d, [field]: value } : d) }))

  const tabs = [
    { id: 'general', label: 'Date generale' },
    { id: 'financiar', label: 'Financiar' },
    { id: 'observatii', label: 'Observații' },
    { id: 'listare', label: 'Listare' },
    { id: 'statusuri', label: 'Statusuri' },
  ]

  const incarcare = order.detalii.find(d => d.tip === 'I')
  const descarcare = order.detalii.find(d => d.tip === 'D')

  return (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: '"Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif', fontSize: '12px' }}>

      {showMap && <MapPicker onConfirm={handleMapConfirm} onClose={() => setShowMap(false)} />}

      {/* HEADER */}
      <header style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, #1a2fa0 100%)`, height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/synergo-logo.png" alt="Synergo" style={{ height: '32px', objectFit: 'contain' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>Rutier</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>
              {view === 'list' ? 'Listă Comenzi' : <>Comandă Rutieră {order.numar && <span style={{ marginLeft: '8px', color: MAGENTA, fontWeight: 'bold' }}>· {order.numar}</span>}</>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saveStatus === 'success' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#4ade80' }}><CheckCircle style={{ width: '14px', height: '14px' }} /> Salvat!</span>}
          {saveStatus === 'error' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f87171' }}><XCircle style={{ width: '14px', height: '14px' }} /> Eroare!</span>}
          {view === 'form' && <span style={{ fontSize: '10px', background: 'rgba(34,197,94,0.85)', color: 'white', padding: '4px 10px', borderRadius: '999px' }}>● {orderId ? 'Editare' : 'Înregistrare nouă'}</span>}
          {view === 'form' && (
            <button onClick={() => setShowImport(s => !s)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
              <FileUp style={{ width: '14px', height: '14px' }} /> Import PDF
            </button>
          )}
          {view === 'list' ? (
            <button onClick={() => setView('form')} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
              <ArrowLeft style={{ width: '14px', height: '14px' }} /> Înapoi
            </button>
          ) : (
            <button onClick={handleLoadList} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
              <List style={{ width: '14px', height: '14px' }} /> Listă comenzi
            </button>
          )}
          <button onClick={handleNew} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '14px', height: '14px' }} /> Nou
          </button>
          {view === 'form' && (
            <button onClick={handleSave} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: saving ? '#9ca3af' : MAGENTA, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '500' }}
              title="Ctrl+S">
              <Save style={{ width: '14px', height: '14px' }} /> {saving ? 'Se salvează...' : 'Salvează'}
            </button>
          )}
        </div>
      </header>

      {/* BREADCRUMB */}
      <div style={{ padding: '6px 20px', fontSize: '10px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>Rutier</span><span>›</span>
        <span style={{ cursor: 'pointer', color: BLUE }} onClick={handleLoadList}>Comenzi rutiere</span>
        {view === 'form' && <><span>›</span><span style={{ fontWeight: '500', color: INDIGO }}>{order.numar || 'Comandă nouă'}</span></>}
      </div>

      {/* LISTA */}
      {view === 'list' && (
        <div style={{ margin: '16px 20px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: INDIGO, color: 'white', padding: '10px 16px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Comenzi Rutiere</span>
            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '999px' }}>{orders.length} înregistrări</span>
          </div>
          {loadingList ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Se încarcă...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <div style={{ marginBottom: '8px' }}>Nicio comandă salvată</div>
              <button onClick={() => setView('form')} style={{ background: INDIGO, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Creează prima comandă</button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f5f6fa' }}>
                  {['Număr', 'Data', 'Client', 'Tip planificare', 'Rută', 'Tarif', 'Monedă', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => {
                  const inc = o.detalii?.find((d: RouteDetail) => d.tip === 'I')
                  const dec = o.detalii?.find((d: RouteDetail) => d.tip === 'D')
                  return (
                    <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa', cursor: 'pointer' }}
                      onClick={() => handleOpenOrder(o)}>
                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: INDIGO }}>{o.numar || '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>{o.data || '—'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: '500' }}>{o.client || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: o.tipPlanificare === 'Transport terti' ? '#dbeafe' : o.tipPlanificare === 'Transport propriu' ? '#dcfce7' : '#fef9c3', color: '#374151' }}>
                          {o.tipPlanificare || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>{inc?.localitate && dec?.localitate ? `${inc.localitate} → ${dec.localitate}` : '—'}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 'bold', color: MAGENTA }}>{o.tarifFaraTVA || '—'}</td>
                      <td style={{ padding: '10px 12px' }}>{o.moneda || '—'}</td>
                      <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDeleteOrder(o.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* FORMULAR */}
      {view === 'form' && (
        <>
          {showImport && (
            <div style={{ margin: '12px 20px 0', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ background: `linear-gradient(90deg, ${INDIGO}, ${BLUE})`, color: 'white', padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Import Document Transport (CMR / Confirmare)</span>
                <button onClick={() => setShowImport(false)} style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: '16px' }}>
                <PdfDropZone onExtracted={handleExtracted} />
                {extracted && <div style={{ marginTop: '10px', fontSize: '11px', color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '8px 12px' }}>✓ Date extrase automat</div>}
              </div>
            </div>
          )}

          <div style={{ margin: '12px 20px 0', display: 'flex', gap: '2px' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ padding: '6px 16px', fontSize: '11px', fontWeight: activeTab === tab.id ? 'bold' : 'normal', background: activeTab === tab.id ? 'white' : '#d1d5db', color: activeTab === tab.id ? INDIGO : '#6b7280', border: activeTab === tab.id ? `2px solid ${INDIGO}` : '2px solid transparent', borderBottom: activeTab === tab.id ? '2px solid white' : '2px solid transparent', borderRadius: '6px 6px 0 0', cursor: 'pointer' }}>
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ margin: '0 20px', background: 'white', border: `1px solid ${INDIGO}`, borderRadius: '0 6px 6px 6px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

            {activeTab === 'general' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', marginBottom: '12px' }}>
                  {/* CLIENT */}
                  <Panel title="Client">
                    <Field label="Număr comandă" value={order.numar || (orderId ? order.numar : 'Auto la salvare')} readOnly />
                    <DateField label="Data" value={order.data} onChange={set('data')} />
                    <Field label="Client" value={order.client} onChange={set('client')} />
                    <Field label="Contact" value={order.contact} onChange={set('contact')} />
                    <Field label="Referință" value={order.referinta} onChange={set('referinta')} />
                    <Field label="Contract" value={order.contract} onChange={set('contract')} />
                    <Field label="Responsabil" value={order.responsabil} onChange={set('responsabil')} />
                  </Panel>

                  {/* TARIF */}
                  <Panel title="Tarif">
                    <SelectField label="Tip transport" value={order.tipTransport} onChange={set('tipTransport')} options={['FTL', 'LTL']} />
                    <Field label="Regim transport" value={order.regimTransport} onChange={set('regimTransport')} />
                    <SelectField label="Cotă TVA (%)" value={order.cotaTVA} onChange={set('cotaTVA')} options={TVA_OPTIONS} />
                    <SelectField label="Monedă" value={order.moneda} onChange={set('moneda')} options={MONEDA_OPTIONS} />
                    <Field label="Termen (zile)" value={order.termen} onChange={set('termen')} />
                    <Field label="Cantitate" value={order.cantitate} onChange={set('cantitate')} />
                    <Field label="Tarif fără TVA" value={order.tarifFaraTVA} onChange={handleTarifFaraTVA} highlight />
                    <Field label="Tarif cu TVA" value={order.tarifCuTVA} onChange={handleTarifCuTVA} highlight />
                  </Panel>

                  {/* PLANIFICARE */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                      <div style={{ background: INDIGO, color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>Tip Planificare</div>
                      <div style={{ padding: '10px 16px' }}>
                        <SelectField label="Tip planificare" value={order.tipPlanificare} onChange={handleTipPlanificareChange}
                          options={['Transport propriu', 'Transport terti', 'Intercompany', 'Subcontractor']} />
                      </div>
                    </div>
                    {order.tipPlanificare && (
                      <PlanificarePanel tipPlanificare={order.tipPlanificare} planificare={order.planificare}
                        onChange={p => setOrder(prev => ({ ...prev, planificare: p }))}
                        onGenerate={handleGenerateNr} />
                    )}
                  </div>

                  {/* REZUMAT */}
                  <div style={{ padding: '10px 12px', fontSize: '11px' }}>
  <div style={{ marginBottom: '8px' }}>
    <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Comandă</div>
    <div style={{ fontWeight: 'bold', color: INDIGO }}>{order.numar || '—'}</div>
    <div style={{ color: '#6b7280', fontSize: '10px' }}>{order.referinta || ''}</div>
  </div>
  <div style={{ marginBottom: '8px' }}>
    <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Client</div>
    <div style={{ fontWeight: '500' }}>{order.client || '—'}</div>
  </div>
  <div style={{ marginBottom: '8px', padding: '6px', background: '#f0faf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
    <div style={{ color: '#16a34a', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>↑ ÎNCĂRCARE</div>
    <div style={{ fontWeight: '500', fontSize: '10px' }}>{incarcare?.partener || '—'}</div>
    <div style={{ color: '#6b7280', fontSize: '10px' }}>{incarcare?.localitate?.substring(0, 40) || ''}</div>
    <div style={{ color: '#6b7280', fontSize: '10px' }}>{incarcare?.data || ''} {incarcare?.ora ? `ora ${incarcare.ora}` : ''}</div>
  </div>
  <div style={{ marginBottom: '8px', padding: '6px', background: '#f0f4ff', borderRadius: '4px', border: `1px solid ${BLUE}40` }}>
    <div style={{ color: BLUE, fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>↓ DESCĂRCARE</div>
    <div style={{ fontWeight: '500', fontSize: '10px' }}>{descarcare?.partener || '—'}</div>
    <div style={{ color: '#6b7280', fontSize: '10px' }}>{descarcare?.localitate?.substring(0, 40) || ''}</div>
    <div style={{ color: '#6b7280', fontSize: '10px' }}>{descarcare?.data || ''} {descarcare?.ora ? `ora ${descarcare.ora}` : ''}</div>
  </div>
  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
    <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Tarif</div>
    <div style={{ fontWeight: 'bold', color: MAGENTA, fontSize: '13px' }}>{order.tarifFaraTVA ? `${order.tarifFaraTVA} ${order.moneda}` : '—'}</div>
    {order.tarifCuTVA && <div style={{ color: '#6b7280', fontSize: '10px' }}>Cu TVA: {order.tarifCuTVA} {order.moneda}</div>}
  </div>
</div>
                </div>

                {/* DETALII RUTĂ */}
                <div style={{ background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <div style={{ background: INDIGO, color: 'white', padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Detalii Rută</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setShowMap(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'white', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Map style={{ width: '12px', height: '12px' }} /> Selectare pe hartă
                      </button>
                      <button onClick={addDetail}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'white', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                        <Plus style={{ width: '12px', height: '12px' }} /> Adaugă linie
                      </button>
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f5f6fa' }}>
                          {['', 'Ord', 'Tip', 'Regim', 'Data', 'Ora', 'Status', 'Partener', 'Localitate', 'Firmă', 'Referință', 'Articol Marfă', ''].map((h, i) => (
                            <th key={i} style={{ textAlign: 'left', padding: '8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {order.detalii.length === 0 ? (
                          <tr><td colSpan={13} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                            Nicio linie. Folosește <strong>Selectare pe hartă</strong> sau adaugă manual.
                          </td></tr>
                        ) : order.detalii.map((d) => (
                          <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6', background: d.tip === 'I' ? '#f0faf4' : '#f0f4ff' }}>
                            <td style={{ padding: '6px 8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.tip === 'I' ? '#16a34a' : BLUE }} /></td>
                            <td style={{ padding: '6px 8px', color: '#9ca3af' }}>{d.ord}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', background: 'white' }}
                                value={d.tip} onChange={e => updateDetail(d.id, 'tip', e.target.value)}>
                                <option value="I">I — Încărcare</option>
                                <option value="D">D — Descărcare</option>
                              </select>
                            </td>
                            <td style={{ padding: '6px 8px' }}><input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '60px', background: 'white' }} value={d.regim} onChange={e => updateDetail(d.id, 'regim', e.target.value)} /></td>
                            <td style={{ padding: '6px 8px' }}><input type="date" style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', background: 'white' }} value={d.data} onChange={e => updateDetail(d.id, 'data', e.target.value)} /></td>
                            <td style={{ padding: '6px 8px' }}><input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '80px', background: 'white' }} value={d.ora} onChange={e => updateDetail(d.id, 'ora', e.target.value)} /></td>
                            <td style={{ padding: '6px 8px' }}><input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '80px', background: 'white' }} value={d.status} onChange={e => updateDetail(d.id, 'status', e.target.value)} /></td>
                            {(['partener', 'localitate', 'firma', 'referinta', 'articolMarfa'] as const).map(field => (
                              <td key={field} style={{ padding: '6px 8px' }}><input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '110px', background: 'white' }} value={d[field] as string} onChange={e => updateDetail(d.id, field, e.target.value)} /></td>
                            ))}
                            <td style={{ padding: '6px 8px' }}><button onClick={() => removeDetail(d.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 style={{ width: '14px', height: '14px' }} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'financiar' && <FinanciarTab financiar={order.financiar} order={order} onChange={f => setOrder(prev => ({ ...prev, financiar: f }))} />}
            {activeTab === 'observatii' && (
              <div style={{ padding: '8px' }}>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Observații comandă</label>
                <textarea style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '12px', resize: 'vertical', outline: 'none', background: 'white', boxSizing: 'border-box', minHeight: '120px' }}
                  value={order.observatii} onChange={e => set('observatii')(e.target.value)} placeholder="Adaugă observații..." />
              </div>
            )}
            {activeTab === 'listare' && <ListareTab order={order} />}
            {activeTab === 'statusuri' && <StatusuriTab statusuri={order.statusuri} onChange={s => setOrder(prev => ({ ...prev, statusuri: s }))} />}
          </div>
        </>
      )}

      <footer style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: INDIGO, color: 'rgba(255,255,255,0.7)', fontSize: '10px', padding: '4px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>Ctrl+S pentru salvare rapidă</span>
        <img src="/novasoft-logo.png" alt="Novasoft" style={{ height: '20px', objectFit: 'contain' }}
          onError={e => {
            const img = e.target as HTMLImageElement
            img.style.display = 'none'
            const span = document.createElement('span')
            span.style.cssText = 'color:#DA387E;font-weight:bold;font-size:10px;'
            span.textContent = 'Novasoft Digital Innovators'
            img.parentNode?.insertBefore(span, img)
          }} />
      </footer>
      <div style={{ height: '32px' }} />
    </div>
  )
}
