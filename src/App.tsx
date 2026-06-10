import { useState } from 'react'
import PdfDropZone from './components/PdfDropZone'
import { emptyOrder } from './types/TransportOrder'
import type { TransportOrder, RouteDetail } from './types/TransportOrder'
import { mapTextractToOrder } from './utils/mapTextractToOrder'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'

function Field({ label, value, onChange, className = '' }: {
  label: string
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs text-gray-500 uppercase tracking-wide">{label}</label>
      <input
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm
          focus:outline-none focus:ring-2 focus:ring-nova-blue focus:border-nova-blue
          bg-white transition-all"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

export default function App() {
  const [order, setOrder] = useState<TransportOrder>(emptyOrder())
  const [extracted, setExtracted] = useState(false)

  const set = (field: keyof TransportOrder) => (value: string) =>
    setOrder(prev => ({ ...prev, [field]: value }))

  const handleExtracted = (pairs: Record<string, string>, rawText: string) => {
    const mapped = mapTextractToOrder(pairs, rawText)
    setOrder(prev => ({ ...prev, ...mapped }))
    setExtracted(true)
  }

  const addDetail = () => {
    const newDetail: RouteDetail = {
      id: Date.now().toString(),
      ord: order.detalii.length + 1,
      tip: 'I',
      regim: 'Tur',
      asociere: '',
      data: '',
      ora: '12:00:00',
      status: '',
      partener: '',
      localitate: '',
      firma: '',
      referinta: '',
      articolMarfa: '',
    }
    setOrder(prev => ({ ...prev, detalii: [...prev.detalii, newDetail] }))
  }

  const removeDetail = (id: string) =>
    setOrder(prev => ({ ...prev, detalii: prev.detalii.filter(d => d.id !== id) }))

  const updateDetail = (id: string, field: keyof RouteDetail, value: string) =>
    setOrder(prev => ({
      ...prev,
      detalii: prev.detalii.map(d => d.id === id ? { ...d, [field]: value } : d),
    }))

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-nova-indigo text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <span className="font-bold text-lg tracking-wide">
          Synergo — Comandă Rutieră {order.numar ? `· ${order.numar}` : ''}
        </span>
        <button
          onClick={() => { setOrder(emptyOrder()); setExtracted(false) }}
          className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Resetare
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-5">

        {/* Drop Zone */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-xs font-bold text-nova-indigo uppercase tracking-widest mb-4">
            Import Document Transport (CMR / Confirmare)
          </h2>
          <PdfDropZone onExtracted={handleExtracted} />
          {extracted && (
            <p className="mt-3 text-xs text-emerald-600 font-medium">
              ✓ Date extrase cu Amazon Textract — verifică și completează câmpurile lipsă
            </p>
          )}
        </div>

        {/* Client + Tarif + Planificare */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* CLIENT */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h2 className="text-xs font-bold text-nova-indigo uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">
              Client
            </h2>
            <div className="space-y-3">
              <Field label="Data" value={order.data} onChange={set('data')} />
              <Field label="Număr" value={order.numar} onChange={set('numar')} />
              <Field label="Client" value={order.client} onChange={set('client')} />
              <Field label="Contact" value={order.contact} onChange={set('contact')} />
              <Field label="Referință" value={order.referinta} onChange={set('referinta')} />
              <Field label="Contract" value={order.contract} onChange={set('contract')} />
              <Field label="Responsabil" value={order.responsabil} onChange={set('responsabil')} />
            </div>
          </div>

          {/* TARIF */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h2 className="text-xs font-bold text-nova-indigo uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">
              Tarif
            </h2>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 uppercase tracking-wide">Tip transport</label>
                <select
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nova-blue bg-white"
                  value={order.tipTransport}
                  onChange={e => set('tipTransport')(e.target.value)}
                >
                  <option value="">—</option>
                  <option value="FTL">FTL</option>
                  <option value="LTL">LTL</option>
                </select>
              </div>
              <Field label="Regim transport" value={order.regimTransport} onChange={set('regimTransport')} />
              <Field label="Cotă TVA (%)" value={order.cotaTVA} onChange={set('cotaTVA')} />
              <Field label="Monedă" value={order.moneda} onChange={set('moneda')} />
              <Field label="Termen (zile)" value={order.termen} onChange={set('termen')} />
              <Field label="Cantitate" value={order.cantitate} onChange={set('cantitate')} />
              <Field label="Tarif fără TVA" value={order.tarifFaraTVA} onChange={set('tarifFaraTVA')} />
              <Field label="Tarif cu TVA" value={order.tarifCuTVA} onChange={set('tarifCuTVA')} />
            </div>
          </div>

          {/* PLANIFICARE */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h2 className="text-xs font-bold text-nova-indigo uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">
              Planificare
            </h2>
            <div className="space-y-3">
              <Field label="Tip planificare" value={order.tipPlanificare} onChange={set('tipPlanificare')} />
              <Field label="Cod intern terț (DID)" value={order.codInternTert} onChange={set('codInternTert')} />
              <Field label="Beneficiar" value={order.beneficiar} onChange={set('beneficiar')} />
              <Field label="Transportator" value={order.transportator} onChange={set('transportator')} />
              <Field label="Termen plată (zile)" value={order.termenPlata} onChange={set('termenPlata')} />
              <Field label="Tarif transport" value={order.tarifTransport} onChange={set('tarifTransport')} />
              <Field label="Nr. înmatriculare" value={order.nrInmatriculare} onChange={set('nrInmatriculare')} />
              <Field label="Semiremorci" value={order.semiremorca} onChange={set('semiremorca')} />
              <Field label="Șofer" value={order.sofer} onChange={set('sofer')} />
            </div>
          </div>
        </div>

        {/* DETALII RUTĂ */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
            <h2 className="text-xs font-bold text-nova-indigo uppercase tracking-widest">
              Detalii Rută
            </h2>
            <button
              onClick={addDetail}
              className="flex items-center gap-1.5 text-xs bg-nova-indigo text-white px-3 py-1.5 rounded-lg hover:bg-nova-blue transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Adaugă linie
            </button>
          </div>

          {order.detalii.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Nicio linie. Trage un PDF sau adaugă manual.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-gray-100">
                    {['Ord', 'Tip', 'Data', 'Partener', 'Localitate', 'Firmă', 'Articol Marfă', ''].map(h => (
                      <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {order.detalii.map((d, i) => (
                    <tr key={d.id} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-2 py-1.5 text-gray-500">{d.ord}</td>
                      <td className="px-2 py-1.5">
                        <select
                          className="border border-gray-200 rounded px-1.5 py-1 text-xs bg-white"
                          value={d.tip}
                          onChange={e => updateDetail(d.id, 'tip', e.target.value)}
                        >
                          <option value="I">Î (Încărcare)</option>
                          <option value="D">D (Descărcare)</option>
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="date" className="border border-gray-200 rounded px-1.5 py-1 text-xs"
                          value={d.data} onChange={e => updateDetail(d.id, 'data', e.target.value)} />
                      </td>
                      {(['partener', 'localitate', 'firma', 'articolMarfa'] as const).map(field => (
                        <td key={field} className="px-2 py-1.5">
                          <input
                            className="border border-gray-200 rounded px-1.5 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-nova-blue"
                            value={d[field] as string}
                            onChange={e => updateDetail(d.id, field, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeDetail(d.id)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Observații */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
          <h2 className="text-xs font-bold text-nova-indigo uppercase tracking-widest mb-3">
            Observații
          </h2>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-nova-blue resize-none"
            rows={3}
            value={order.observatii}
            onChange={e => set('observatii')(e.target.value)}
          />
        </div>

      </div>
    </div>
  )
}
