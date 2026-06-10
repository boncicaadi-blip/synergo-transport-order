import { useState } from 'react'
import PdfDropZone from './components/PdfDropZone'
import { emptyOrder } from './types/TransportOrder'
import type { TransportOrder, RouteDetail } from './types/TransportOrder'
import { mapTextractToOrder } from './utils/mapTextractToOrder'
import { RefreshCw, Plus, Trash2, Save, ChevronDown } from 'lucide-react'

function Field({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <label className="text-[11px] text-gray-500 w-28 shrink-0 text-right pr-1">{label}</label>
      <input
        className="flex-1 border border-gray-300 rounded px-2 py-[3px] text-[12px] focus:outline-none focus:ring-1 focus:ring-nova-blue bg-white"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-1">
      <label className="text-[11px] text-gray-500 w-28 shrink-0 text-right pr-1">{label}</label>
      <div className="flex-1 relative">
        <select
          className="w-full border border-gray-300 rounded px-2 py-[3px] text-[12px] focus:outline-none focus:ring-1 focus:ring-nova-blue bg-white appearance-none pr-6"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="bg-nova-indigo text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 mb-2">
      {children}
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
    <div className="min-h-screen bg-[#f0f0f0] text-[12px]">
      <header className="bg-nova-indigo h-12 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center gap-3">
          <img
            src="https://nova-soft.ro/wp-content/uploads/2023/03/logo-synergo-alb.png"
            alt="Synergo" className="h-7"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <span className="text-white/60 text-xs">|</span>
          <span className="text-white text-[13px] font-medium tracking-wide">
            Comandă Rutieră
            {order.numar && <span className="text-nova-magenta font-bold ml-2">· {order.numar}</span>}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded">Înregistrare editabilă</span>
          <button
            onClick={() => { setOrder(emptyOrder()); setExtracted(false); setShowImport(true) }}
            className="flex items-center gap-1.5 text-[11px] text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Nou
          </button>
          <button className="flex items-center gap-1.5 text-[11px] text-white bg-nova-magenta hover:bg-pink-600 px-3 py-1.5 rounded transition-colors">
            <Save className="w-3 h-3" /> Salvează
          </button>
        </div>
      </header>{showImport && (
        <div className="mx-4 mt-3 bg-white border border-gray-200 rounded shadow-sm">
          <div className="bg-gradient-to-r from-nova-indigo to-nova-blue text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 flex items-center justify-between rounded-t">
            <span>Import Document Transport (CMR / Confirmare)</span>
            <button onClick={() => setShowImport(false)} className="text-white/60 hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="p-3">
            <PdfDropZone onExtracted={handleExtracted} />
            {extracted && (
              <p className="mt-2 text-[11px] text-emerald-600 font-medium">
                ✓ Date extrase automat — verifică și completează câmpurile lipsă
              </p>
            )}
          </div>
        </div>
      )}
      {!showImport && (
        <div className="mx-4 mt-2">
          <button onClick={() => setShowImport(true)} className="text-[11px] text-nova-blue hover:underline flex items-center gap-1">
            <Plus className="w-3 h-3" /> Import document PDF
          </button>
        </div>
      )}

      <div className="mx-4 mt-2 grid grid-cols-3 gap-2">
        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <SectionTitle>Client</SectionTitle>
          <div className="px-3 pb-3 space-y-1.5">
            <Field label="Data" value={order.data} onChange={set('data')} />
            <Field label="Număr" value={order.numar} onChange={set('numar')} />
            <Field label="Client" value={order.client} onChange={set('client')} />
            <Field label="Contact" value={order.contact} onChange={set('contact')} />
            <Field label="Referință" value={order.referinta} onChange={set('referinta')} />
            <Field label="Contract" value={order.contract} onChange={set('contract')} />
            <Field label="Responsabil" value={order.responsabil} onChange={set('responsabil')} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <SectionTitle>Tarif</SectionTitle>
          <div className="px-3 pb-3 space-y-1.5">
            <Select label="Tip transport" value={order.tipTransport} onChange={set('tipTransport')}
              options={[{ value: '', label: '—' }, { value: 'FTL', label: 'FTL' }, { value: 'LTL', label: 'LTL' }]} />
            <Field label="Regim transport" value={order.regimTransport} onChange={set('regimTransport')} />
            <Field label="Cotă TVA (%)" value={order.cotaTVA} onChange={set('cotaTVA')} />
            <Field label="Monedă" value={order.moneda} onChange={set('moneda')} />
            <Field label="Termen (zile)" value={order.termen} onChange={set('termen')} />
            <Field label="Cantitate" value={order.cantitate} onChange={set('cantitate')} />
            <Field label="Tarif fără TVA" value={order.tarifFaraTVA} onChange={set('tarifFaraTVA')} />
            <Field label="Tarif cu TVA" value={order.tarifCuTVA} onChange={set('tarifCuTVA')} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded shadow-sm">
          <SectionTitle>Planificare</SectionTitle>
          <div className="px-3 pb-3 space-y-1.5">
            <Field label="Tip planificare" value={order.tipPlanificare} onChange={set('tipPlanificare')} />
            <Field label="Cod intern (DID)" value={order.codInternTert} onChange={set('codInternTert')} />
            <Field label="Beneficiar" value={order.beneficiar} onChange={set('beneficiar')} />
            <Field label="Transportator" value={order.transportator} onChange={set('transportator')} />
            <Field label="Termen plată" value={order.termenPlata} onChange={set('termenPlata')} />
            <Field label="Tarif transport" value={order.tarifTransport} onChange={set('tarifTransport')} />
            <Field label="Nr. înmatriculare" value={order.nrInmatriculare} onChange={set('nrInmatriculare')} />
            <Field label="Semiremorci" value={order.semiremorca} onChange={set('semiremorca')} />
            <Field label="Șofer" value={order.sofer} onChange={set('sofer')} />
          </div>
        </div>
      </div>

      <div className="mx-4 mt-2 bg-white border border-gray-200 rounded shadow-sm">
        <div className="bg-nova-indigo text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 flex items-center justify-between rounded-t">
          <span>Detalii Rută</span>
          <button onClick={addDetail} className="flex items-center gap-1 text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-colors">
            <Plus className="w-3 h-3" /> Adaugă linie
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                {['', 'Ord', 'Tip', 'Regim', 'Data', 'Ora', 'Status', 'Partener', 'Localitate', 'Firmă', 'Referință', 'Articol Marfă', ''].map((h, i) => (
                  <th key={i} className="text-left px-2 py-1.5 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.detalii.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-6 text-gray-400">
                    Nicio linie de rută. Trage un PDF sau adaugă manual.
                  </td>
                </tr>
              ) : (
                order.detalii.map((d) => (
                  <tr key={d.id} className={`border-b border-gray-100 ${d.tip === 'I' ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <td className="px-2 py-1">
                      <div className={`w-2 h-2 rounded-full ${d.tip === 'I' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    </td>
                    <td className="px-2 py-1 text-gray-500">{d.ord}</td>
                    <td className="px-2 py-1">
                      <select className="border border-gray-300 rounded px-1 py-0.5 text-[11px] bg-white"
                        value={d.tip} onChange={e => updateDetail(d.id, 'tip', e.target.value)}>
                        <option value="I">I (Încărcare)</option>
                        <option value="D">D (Descărcare)</option>
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input className="border border-gray-300 rounded px-1 py-0.5 text-[11px] w-16 bg-white"
                        value={d.regim} onChange={e => updateDetail(d.id, 'regim', e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <input type="date" className="border border-gray-300 rounded px-1 py-0.5 text-[11px] bg-white"
                        value={d.data} onChange={e => updateDetail(d.id, 'data', e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <input className="border border-gray-300 rounded px-1 py-0.5 text-[11px] w-20 bg-white"
                        value={d.ora} onChange={e => updateDetail(d.id, 'ora', e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <input className="border border-gray-300 rounded px-1 py-0.5 text-[11px] w-20 bg-white"
                        value={d.status} onChange={e => updateDetail(d.id, 'status', e.target.value)} />
                    </td>
                    {(['partener', 'localitate', 'firma', 'referinta', 'articolMarfa'] as const).map(field => (
                      <td key={field} className="px-2 py-1">
                        <input
                          className="border border-gray-300 rounded px-1 py-0.5 text-[11px] w-28 bg-white focus:outline-none focus:ring-1 focus:ring-nova-blue"
                          value={d[field] as string}
                          onChange={e => updateDetail(d.id, field, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1">
                      <button onClick={() => removeDetail(d.id)} className="text-red-400 hover:text-red-600">
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

      <div className="mx-4 mt-2 mb-10 bg-white border border-gray-200 rounded shadow-sm">
        <SectionTitle>Observații</SectionTitle>
        <div className="px-3 pb-3">
          <textarea
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-nova-blue resize-none"
            rows={3}
            value={order.observatii}
            onChange={e => set('observatii')(e.target.value)}
          />
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-nova-indigo text-white/60 text-[10px] px-4 py-1 flex items-center justify-between">
        <span>Client: DIDI TRANS INTERNATIONAL SRL · Mediu: [Producție] · Versiune: 25.1.1.17</span>
        <span>Created by Novasoft</span>
      </footer>
    </div>
  )
}