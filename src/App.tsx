import { useState, useEffect } from 'react'
import PdfDropZone from './components/PdfDropZone'
import { emptyOrder } from './types/TransportOrder'
import type { TransportOrder, RouteDetail } from './types/TransportOrder'
import { mapTextractToOrder } from './utils/mapTextractToOrder'
import { RefreshCw, Plus, Trash2, Save, ChevronDown, FileUp, TruckIcon } from 'lucide-react'

const INDIGO = '#0B178B'
const MAGENTA = '#DA387E'
const BLUE = '#2980DA'

const TVA_OPTIONS = ['0', '5', '9', '19', '21', '25']
const MONEDA_OPTIONS = ['RON', 'EUR', 'USD', 'GBP', 'CHF', 'HUF', 'BGN', 'PLN']
const TIP_PLANIFICARE_OPTIONS = ['Transport terti', 'Transport proprii', 'Subcontractori', 'Intercompany']

function Field({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-[3px]">
      <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>{label}</label>
      <input
        style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', background: 'white', outline: 'none' }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function DateField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-[3px]">
      <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>{label}</label>
      <input
        type="date"
        style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', background: 'white', outline: 'none', width: '100%' }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-[3px]">
      <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select
          style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 24px 2px 8px', fontSize: '12px', background: 'white', outline: 'none', appearance: 'none' }}
          value={value}
          onChange={e => onChange(e.target.value)}
        >
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
      <div style={{ background: INDIGO, color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {title}
      </div>
      <div style={{ padding: '10px 16px' }}>
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const [order, setOrder] = useState<TransportOrder>(emptyOrder())
  const [extracted, setExtracted] = useState(false)
  const [showImport, setShowImport] = useState(true)
  const [activeTab, setActiveTab] = useState('general')

  const set = (field: keyof TransportOrder) => (value: string) =>
    setOrder(prev => ({ ...prev, [field]: value }))

  // Calcul automat TVA
  useEffect(() => {
    const tva = parseFloat(order.cotaTVA) || 0
    if (order.tarifFaraTVA && order.tarifFaraTVA !== '') {
      const faraTVA = parseFloat(order.tarifFaraTVA.replace(',', '.')) || 0
      const cuTVA = faraTVA * (1 + tva / 100)
      setOrder(prev => ({ ...prev, tarifCuTVA: cuTVA.toFixed(2) }))
    } else if (order.tarifCuTVA && order.tarifCuTVA !== '') {
      const cuTVA = parseFloat(order.tarifCuTVA.replace(',', '.')) || 0
      const faraTVA = cuTVA / (1 + tva / 100)
      setOrder(prev => ({ ...prev, tarifFaraTVA: faraTVA.toFixed(2) }))
    }
  }, [order.cotaTVA, order.tarifFaraTVA])

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

  const handleExtracted = (pairs: Record<string, string>, rawText: string) => {
    const mapped = mapTextractToOrder(pairs, rawText)
    setOrder(prev => ({ ...prev, ...mapped }))
    setExtracted(true)
    setShowImport(false)
  }

  const addDetail = () => {
    const d: RouteDetail = {
      id: Date.now().toString(),
      ord: order.detalii.length + 1,
      tip: 'I', regim: 'Tur', asociere: '', data: '', ora: '12:00:00',
      status: '', partener: '', localitate: '', firma: '', referinta: '', articolMarfa: '',
    }
    setOrder(prev => ({ ...prev, detalii: [...prev.detalii, d] }))
  }

  const removeDetail = (id: string) =>
    setOrder(prev => ({ ...prev, detalii: prev.detalii.filter(d => d.id !== id) }))

  const updateDetail = (id: string, field: keyof RouteDetail, value: string) =>
    setOrder(prev => ({
      ...prev,
      detalii: prev.detalii.map(d => d.id === id ? { ...d, [field]: value } : d),
    }))

  const tabs = [
    { id: 'general', label: 'Date generale' },
    { id: 'financiar', label: 'Financiar' },
    { id: 'observatii', label: 'Observații' },
    { id: 'listare', label: 'Listare' },
    { id: 'statusuri', label: 'Statusuri' },
  ]

  // Rezumat comandă
  const incarcare = order.detalii.find(d => d.tip === 'I')
  const descarcare = order.detalii.find(d => d.tip === 'D')

  return (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: '"Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif', fontSize: '12px' }}>

      {/* HEADER */}
      <header style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, #1a2fa0 100%)`, height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img
            src="https://nova-soft.ro/wp-content/uploads/2023/03/logo-synergo-alb.png"
            alt="Synergo" style={{ height: '32px' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>Rutier</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>
              Comandă Rutieră
              {order.numar && <span style={{ marginLeft: '8px', color: MAGENTA, fontWeight: 'bold' }}>· {order.numar}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', background: 'rgba(34,197,94,0.85)', color: 'white', padding: '4px 10px', borderRadius: '999px', fontWeight: '500' }}>
            ● Înregistrare editabilă
          </span>
          <button onClick={() => setShowImport(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            <FileUp style={{ width: '14px', height: '14px' }} /> Import PDF
          </button>
          <button onClick={() => { setOrder(emptyOrder()); setExtracted(false); setShowImport(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            <RefreshCw style={{ width: '14px', height: '14px' }} /> Nou
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: MAGENTA, border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
            <Save style={{ width: '14px', height: '14px' }} /> Salvează
          </button>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div style={{ padding: '6px 20px', fontSize: '10px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', background: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span>Rutier</span><span>›</span><span>Comenzi rutiere</span><span>›</span>
        <span style={{ fontWeight: '500', color: INDIGO }}>{order.numar || 'Comandă nouă'}</span>
      </div>

      {/* IMPORT PDF */}
      {showImport && (
        <div style={{ margin: '12px 20px 0', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ background: `linear-gradient(90deg, ${INDIGO}, ${BLUE})`, color: 'white', padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Import Document Transport (CMR / Confirmare de comandă)</span>
            <button onClick={() => setShowImport(false)} style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
          <div style={{ padding: '16px' }}>
            <PdfDropZone onExtracted={handleExtracted} />
            {extracted && (
              <div style={{ marginTop: '10px', fontSize: '11px', color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '8px 12px' }}>
                ✓ Date extrase automat — verifică și completează câmpurile lipsă
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABS */}
      <div style={{ margin: '12px 20px 0', display: 'flex', gap: '2px' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 16px', fontSize: '11px', fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              background: activeTab === tab.id ? 'white' : '#d1d5db',
              color: activeTab === tab.id ? INDIGO : '#6b7280',
              border: activeTab === tab.id ? `2px solid ${INDIGO}` : '2px solid transparent',
              borderBottom: activeTab === tab.id ? '2px solid white' : '2px solid transparent',
              borderRadius: '6px 6px 0 0', cursor: 'pointer',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div style={{ margin: '0 20px', background: 'white', border: `1px solid ${INDIGO}`, borderRadius: '0 6px 6px 6px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

        {activeTab === 'general' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px' }}>

            {/* CLIENT */}
            <Panel title="Client">
              <DateField label="Data" value={order.data} onChange={set('data')} />
              <Field label="Număr" value={order.numar} onChange={set('numar')} />
              <Field label="Client" value={order.client} onChange={set('client')} />
              <Field label="Contact" value={order.contact} onChange={set('contact')} />
              <Field label="Referință" value={order.referinta} onChange={set('referinta')} />
              <Field label="Contract" value={order.contract} onChange={set('contract')} />
              <Field label="Responsabil" value={order.responsabil} onChange={set('responsabil')} />
            </Panel>

            {/* TARIF */}
            <Panel title="Tarif">
              <SelectField label="Tip transport" value={order.tipTransport} onChange={set('tipTransport')}
                options={['FTL', 'LTL']} />
              <Field label="Regim transport" value={order.regimTransport} onChange={set('regimTransport')} />
              <SelectField label="Cotă TVA (%)" value={order.cotaTVA} onChange={set('cotaTVA')}
                options={TVA_OPTIONS} />
              <SelectField label="Monedă" value={order.moneda} onChange={set('moneda')}
                options={MONEDA_OPTIONS} />
              <Field label="Termen (zile)" value={order.termen} onChange={set('termen')} />
              <Field label="Cantitate" value={order.cantitate} onChange={set('cantitate')} />
              <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-[3px]">
                <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>Tarif fără TVA</label>
                <input
                  style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', background: '#fffbeb', outline: 'none' }}
                  value={order.tarifFaraTVA}
                  onChange={e => handleTarifFaraTVA(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-[3px]">
                <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>Tarif cu TVA</label>
                <input
                  style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', background: '#fffbeb', outline: 'none' }}
                  value={order.tarifCuTVA}
                  onChange={e => handleTarifCuTVA(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </Panel>

            {/* PLANIFICARE */}
            <Panel title="Planificare">
              <SelectField label="Tip planificare" value={order.tipPlanificare} onChange={set('tipPlanificare')}
                options={TIP_PLANIFICARE_OPTIONS} />
              <Field label="Cod intern (DID)" value={order.codInternTert} onChange={set('codInternTert')} />
              <Field label="Beneficiar" value={order.beneficiar} onChange={set('beneficiar')} />
              <Field label="Transportator" value={order.transportator} onChange={set('transportator')} />
              <Field label="Termen plată" value={order.termenPlata} onChange={set('termenPlata')} />
              <Field label="Tarif transport" value={order.tarifTransport} onChange={set('tarifTransport')} />
              <Field label="Nr. înmatriculare" value={order.nrInmatriculare} onChange={set('nrInmatriculare')} />
              <Field label="Semiremorci" value={order.semiremorca} onChange={set('semiremorca')} />
              <Field label="Șofer" value={order.sofer} onChange={set('sofer')} />
            </Panel>

            {/* REZUMAT COMANDĂ */}
            <div style={{ width: '220px', background: '#f8faff', borderRadius: '6px', border: `1px solid ${INDIGO}30`, overflow: 'hidden' }}>
              <div style={{ background: INDIGO, color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Rezumat
              </div>
              <div style={{ padding: '10px 12px', fontSize: '11px' }}>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Comandă</div>
                  <div style={{ fontWeight: 'bold', color: INDIGO }}>{order.numar || '—'}</div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Client</div>
                  <div style={{ fontWeight: '500' }}>{order.client || '—'}</div>
                </div>
                <div style={{ marginBottom: '8px', padding: '6px', background: '#f0faf4', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <TruckIcon style={{ width: '12px', height: '12px' }} />
                    ÎNCĂRCARE
                  </div>
                  <div style={{ fontWeight: '500' }}>{incarcare?.partener || '—'}</div>
                  <div style={{ color: '#6b7280', fontSize: '10px' }}>{incarcare?.localitate || ''}</div>
                  <div style={{ color: '#6b7280', fontSize: '10px' }}>{incarcare?.data || ''}</div>
                </div>
                <div style={{ marginBottom: '8px', padding: '6px', background: '#f0f4ff', borderRadius: '4px', border: `1px solid ${BLUE}40` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: BLUE, fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <TruckIcon style={{ width: '12px', height: '12px' }} />
                    DESCĂRCARE
                  </div>
                  <div style={{ fontWeight: '500' }}>{descarcare?.partener || '—'}</div>
                  <div style={{ color: '#6b7280', fontSize: '10px' }}>{descarcare?.localitate || ''}</div>
                  <div style={{ color: '#6b7280', fontSize: '10px' }}>{descarcare?.data || ''}</div>
                </div>
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                  <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Tarif</div>
                  <div style={{ fontWeight: 'bold', color: MAGENTA, fontSize: '14px' }}>
                    {order.tarifFaraTVA ? `${order.tarifFaraTVA} ${order.moneda}` : '—'}
                  </div>
                  {order.tarifCuTVA && (
                    <div style={{ color: '#6b7280', fontSize: '10px' }}>
                      Cu TVA: {order.tarifCuTVA} {order.moneda}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ color: '#6b7280', fontSize: '10px', textTransform: 'uppercase', marginBottom: '2px' }}>Transportator</div>
                  <div style={{ fontWeight: '500', fontSize: '11px' }}>{order.transportator || '—'}</div>
                  <div style={{ color: '#6b7280', fontSize: '10px' }}>{order.nrInmatriculare || ''}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div style={{ marginTop: '12px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            <div style={{ background: INDIGO, color: 'white', padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Detalii Rută</span>
              <button onClick={addDetail} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'white', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                <Plus style={{ width: '12px', height: '12px' }} /> Adaugă linie
              </button>
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
                    <tr><td colSpan={13} style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>Nicio linie de rută. Trage un PDF sau adaugă manual.</td></tr>
                  ) : (
                    order.detalii.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6', background: d.tip === 'I' ? '#f0faf4' : '#f0f4ff' }}>
                        <td style={{ padding: '6px 8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: d.tip === 'I' ? '#16a34a' : BLUE }} />
                        </td>
                        <td style={{ padding: '6px 8px', color: '#9ca3af' }}>{d.ord}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <select style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', background: 'white' }}
                            value={d.tip} onChange={e => updateDetail(d.id, 'tip', e.target.value)}>
                            <option value="I">I — Încărcare</option>
                            <option value="D">D — Descărcare</option>
                          </select>
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '64px', background: 'white' }}
                            value={d.regim} onChange={e => updateDetail(d.id, 'regim', e.target.value)} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input type="date" style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', background: 'white' }}
                            value={d.data} onChange={e => updateDetail(d.id, 'data', e.target.value)} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '80px', background: 'white' }}
                            value={d.ora} onChange={e => updateDetail(d.id, 'ora', e.target.value)} />
                        </td>
                        <td style={{ padding: '6px 8px' }}>
                          <input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '80px', background: 'white' }}
                            value={d.status} onChange={e => updateDetail(d.id, 'status', e.target.value)} />
                        </td>
                        {(['partener', 'localitate', 'firma', 'referinta', 'articolMarfa'] as const).map(field => (
                          <td key={field} style={{ padding: '6px 8px' }}>
                            <input style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', width: '112px', background: 'white' }}
                              value={d[field] as string} onChange={e => updateDetail(d.id, field, e.target.value)} />
                          </td>
                        ))}
                        <td style={{ padding: '6px 8px' }}>
                          <button onClick={() => removeDetail(d.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'financiar' && (
          <div style={{ padding: '16px', color: '#6b7280', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>Secțiunea Financiar</div>
            <div style={{ fontSize: '11px' }}>Facturile și deconturile vor apărea aici.</div>
          </div>
        )}

        {activeTab === 'observatii' && (
          <div style={{ padding: '8px' }}>
            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Observații comandă</label>
            <textarea
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '12px', resize: 'vertical', outline: 'none', background: 'white', boxSizing: 'border-box', minHeight: '120px' }}
              value={order.observatii}
              onChange={e => set('observatii')(e.target.value)}
              placeholder="Adaugă observații..."
            />
          </div>
        )}

        {activeTab === 'listare' && (
          <div style={{ padding: '16px', color: '#6b7280', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>Listare documente</div>
            <div style={{ fontSize: '11px' }}>CMR, Aviz de însoțire, Confirmare comandă.</div>
          </div>
        )}

        {activeTab === 'statusuri' && (
          <div style={{ padding: '16px', color: '#6b7280', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>Istoric statusuri</div>
            <div style={{ fontSize: '11px' }}>Niciun status înregistrat.</div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: INDIGO, color: 'rgba(255,255,255,0.7)', fontSize: '10px', padding: '6px 20px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span style={{ color: MAGENTA, fontWeight: '500' }}>Created by Novasoft</span>
      </footer>

      <div style={{ height: '32px' }} />
    </div>
  )
}
