import { useState } from 'react'
import PdfDropZone from './components/PdfDropZone'
import { emptyOrder } from './types/TransportOrder'
import type { TransportOrder, RouteDetail } from './types/TransportOrder'
import { mapTextractToOrder } from './utils/mapTextractToOrder'
import { RefreshCw, Plus, Trash2, Save, ChevronDown, FileUp } from 'lucide-react'

const INDIGO = '#0B178B'
const MAGENTA = '#DA387E'
const BLUE = '#2980DA'

function Field({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-[3px]">
      <label className="text-[11px] text-gray-500 text-right">{label}</label>
      <input
        className="border border-gray-300 rounded px-2 py-[3px] text-[12px] bg-white
          focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-2 py-[3px]">
      <label className="text-[11px] text-gray-500 text-right">{label}</label>
      <div className="relative">
        <select
          className="w-full border border-gray-300 rounded px-2 py-[3px] text-[12px] bg-white
            focus:outline-none focus:border-blue-500 appearance-none pr-6"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
        style={{ background: INDIGO }}>
        {title}
      </div>
      <div className="px-4 py-3">
        {children}
      </div>
    </div>
  )
}

export default function App() {
  const [order, setOrder] = useState<TransportOrder>(emptyOrder())
  const [extracted, setExtracted] = useState(false)
  const [showImport, setShowImport] = useState(true)

  const set = (field: keyof TransportOrder) => (value: string) =>
    setOrder(prev => ({ ...prev, [field]: value }))

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

  return (
    <div className="min-h-screen text-[12px]" style={{ background: '#eef0f5', fontFamily: '"Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif' }}>

      {/* HEADER */}
      <header className="flex items-center justify-between px-5 py-0 shadow-lg h-14"
        style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, #1a2fa0 100%)` }}>
        <div className="flex items-center gap-4">
          <img
            src="https://nova-soft.ro/wp-content/uploads/2023/03/logo-synergo-alb.png"
            alt="Synergo" className="h-8"
            onError={e => {
              const el = e.target as HTMLImageElement
              el.style.display = 'none'
              const span = document.createElement('span')
              span.className = 'text-white font-bold text-xl tracking-widest'
              span.textContent = 'SYNERGO'
              el.parentNode?.insertBefore(span, el)
            }}
          />
          <div className="h-6 w-px bg-white/20" />
          <div>
            <div className="text-white/60 text-[10px] uppercase tracking-widest">Rutier</div>
            <div className="text-white text-[13px] font-semibold leading-tight">
              Comandă Rutieră
              {order.numar && <span className="ml-2 font-bold" style={{ color: MAGENTA }}>· {order.numar}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-green-500/90 text-white px-2 py-1 rounded-full font-medium">
            ● Înregistrare editabilă
          </span>
          <button
            onClick={() => setShowImport(s => !s)}
            className="flex items-center gap-1.5 text-[11px] text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/20"
          >
            <FileUp className="w-3.5 h-3.5" />
            Import PDF
          </button>
          <button
            onClick={() => { setOrder(emptyOrder()); setExtracted(false); setShowImport(true) }}
            className="flex items-center gap-1.5 text-[11px] text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/20"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Nou
          </button>
          <button className="flex items-center gap-1.5 text-[11px] text-white px-3 py-1.5 rounded-lg transition-colors font-medium shadow"
            style={{ background: MAGENTA }}>
            <Save className="w-3.5 h-3.5" /> Salvează
          </button>
        </div>
      </header>

      {/* BREADCRUMB */}
      <div className="px-5 py-1.5 text-[10px] text-gray-500 border-b border-gray-200 bg-white flex items-center gap-1">
        <span>Rutier</span>
        <span className="mx-1">›</span>
        <span>Comenzi rutiere</span>
        <span className="mx-1">›</span>
        <span className="font-medium" style={{ color: INDIGO }}>
          {order.numar || 'Comandă nouă'}
        </span>
      </div>{/* IMPORT PDF */}
      {showImport && (
        <div className="mx-5 mt-4 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
            style={{ background: `linear-gradient(90deg, ${INDIGO}, ${BLUE})` }}>
            <span>Import Document Transport (CMR / Confirmare de comandă)</span>
            <button onClick={() => setShowImport(false)} className="text-white/70 hover:text-white text-xl leading-none">×</button>
          </div>
          <div className="p-4">
            <PdfDropZone onExtracted={handleExtracted} />
            {extracted && (
              <div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
                <span>✓</span>
                <span>Date extrase cu Amazon Textract — verifică și completează câmpurile lipsă</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ANTET - 3 coloane */}
      <div className="mx-5 mt-3 grid grid-cols-3 gap-3">
        <Panel title="Client">
          <Field label="Data" value={order.data} onChange={set('data')} />
          <Field label="Număr" value={order.numar} onChange={set('numar')} />
          <Field label="Client" value={order.client} onChange={set('client')} />
          <Field label="Contact" value={order.contact} onChange={set('contact')} />
          <Field label="Referință" value={order.referinta} onChange={set('referinta')} />
          <Field label="Contract" value={order.contract} onChange={set('contract')} />
          <Field label="Responsabil" value={order.responsabil} onChange={set('responsabil')} />
        </Panel>

        <Panel title="Tarif">
          <SelectField label="Tip transport" value={order.tipTransport} onChange={set('tipTransport')}
            options={[{ value: '', label: '—' }, { value: 'FTL', label: 'FTL' }, { value: 'LTL', label: 'LTL' }]} />
          <Field label="Regim transport" value={order.regimTransport} onChange={set('regimTransport')} />
          <Field label="Cotă TVA (%)" value={order.cotaTVA} onChange={set('cotaTVA')} />
          <Field label="Monedă" value={order.moneda} onChange={set('moneda')} />
          <Field label="Termen (zile)" value={order.termen} onChange={set('termen')} />
          <Field label="Cantitate" value={order.cantitate} onChange={set('cantitate')} />
          <Field label="Tarif fără TVA" value={order.tarifFaraTVA} onChange={set('tarifFaraTVA')} />
          <Field label="Tarif cu TVA" value={order.tarifCuTVA} onChange={set('tarifCuTVA')} />
        </Panel>

        <Panel title="Planificare">
          <Field label="Tip planificare" value={order.tipPlanificare} onChange={set('tipPlanificare')} />
          <Field label="Cod intern (DID)" value={order.codInternTert} onChange={set('codInternTert')} />
          <Field label="Beneficiar" value={order.beneficiar} onChange={set('beneficiar')} />
          <Field label="Transportator" value={order.transportator} onChange={set('transportator')} />
          <Field label="Termen plată" value={order.termenPlata} onChange={set('termenPlata')} />
          <Field label="Tarif transport" value={order.tarifTransport} onChange={set('tarifTransport')} />
          <Field label="Nr. înmatriculare" value={order.nrInmatriculare} onChange={set('nrInmatriculare')} />
          <Field label="Semiremorci" value={order.semiremorca} onChange={set('semiremorca')} />
          <Field label="Șofer" value={order.sofer} onChange={set('sofer')} />
        </Panel>
      </div>

      {/* DETALII RUTĂ */}
      <div className="mx-5 mt-3 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
          style={{ background: INDIGO }}>
          <span>Detalii Rută</span>
          <button onClick={addDetail}
            className="flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors border border-white/30">
            <Plus className="w-3 h-3" /> Adaugă linie
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr style={{ background: '#f5f6fa' }}>
                {['', 'Ord', 'Tip', 'Regim', 'Data', 'Ora', 'Status', 'Partener', 'Localitate', 'Firmă', 'Referință', 'Articol Marfă', ''].map((h, i) => (
                  <th key={i} className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-wide text-gray-500 border-b border-gray-200 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.detalii.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-8 text-gray-400 text-[12px]">
                    Nicio linie de rută. Trage un PDF sau adaugă manual.
                  </td>
                </tr>
              ) : (
                order.detalii.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    style={{ background: d.tip === 'I' ? '#f0faf4' : '#f0f4ff' }}>
                    <td className="px-2 py-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.tip === 'I' ? '#16a34a' : BLUE }} />
                    </td>
                    <td className="px-2 py-1.5 text-gray-400 font-medium">{d.ord}</td>
                    <td className="px-2 py-1.5">
                      <select className="border border-gray-300 rounded px-1.5 py-0.5 text-[11px] bg-white focus:outline-none"
                        value={d.tip} onChange={e => updateDetail(d.id, 'tip', e.target.value)}>
                        <option value="I">I — Încărcare</option>
                        <option value="D">D — Descărcare</option>
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input className="border border-gray-300 rounded px-1.5 py-0.5 text-[11px] w-16 bg-white focus:outline-none"
                        value={d.regim} onChange={e => updateDetail(d.id, 'regim', e.target.value)} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="date" className="border border-gray-300 rounded px-1.5 py-0.5 text-[11px] bg-white focus:outline-none"
                        value={d.data} onChange={e => updateDetail(d.id, 'data', e.target.value)} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input className="border border-gray-300 rounded px-1.5 py-0.5 text-[11px] w-20 bg-white focus:outline-none"
                        value={d.ora} onChange={e => updateDetail(d.id, 'ora', e.target.value)} />
                    </td>
                    <td className="px-2 py-1.5">
                      <input className="border border-gray-300 rounded px-1.5 py-0.5 text-[11px] w-20 bg-white focus:outline-none"
                        value={d.status} onChange={e => updateDetail(d.id, 'status', e.target.value)} />
                    </td>
                    {(['partener', 'localitate', 'firma', 'referinta', 'articolMarfa'] as const).map(field => (
                      <td key={field} className="px-2 py-1.5">
                        <input
                          className="border border-gray-300 rounded px-1.5 py-0.5 text-[11px] w-28 bg-white focus:outline-none focus:border-blue-400"
                          value={d[field] as string}
                          onChange={e => updateDetail(d.id, field, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      <button onClick={() => removeDetail(d.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OBSERVAȚII */}
      <div className="mx-5 mt-3 mb-12 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
          style={{ background: INDIGO }}>
          Observații
        </div>
        <div className="p-4">
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 text-[12px] focus:outline-none focus:border-blue-400 resize-none bg-white"
            rows={3}
            value={order.observatii}
            onChange={e => set('observatii')(e.target.value)}
          />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 text-white/70 text-[10px] px-5 py-1.5 flex items-center justify-between"
        style={{ background: INDIGO }}>
        <span>Client: DIDI TRANS INTERNATIONAL SRL · Mediu: [Producție] · Versiune: 25.1.1.17</span>
        <span style={{ color: MAGENTA }}>Created by Novasoft</span>
      </footer>

    </div>
  )
}