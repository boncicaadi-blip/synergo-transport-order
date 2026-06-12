import { useState, useCallback, useEffect } from 'react'
import { emptyLot } from '../types/LotMarfa'
import type { LotMarfa, ArticolLot, EntitatelLot, TransportLot } from '../types/LotMarfa'
import { saveLot, loadLoturi, deleteLot, dbToLot } from '../lib/loturi'
import { Plus, Trash2, Save, RefreshCw, ArrowLeft, List, FileUp, CheckCircle, XCircle, ChevronDown } from 'lucide-react'

const INDIGO = '#0B178B'
const MAGENTA = '#DA387E'
const BLUE = '#2980DA'

const VALUTA_OPTIONS = ['TRY', 'EUR', 'USD', 'RON', 'GBP']
const REGIM_OPTIONS = ['T1', 'T2', 'EX', 'IM', 'CO']

function Field({ label, value, onChange, readOnly = false }: {
  label: string; value: string; onChange?: (v: string) => void; readOnly?: boolean
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '6px', padding: '2px 0' }}>
      <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>{label}</label>
      <input
        style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', background: readOnly ? '#f3f4f6' : 'white', outline: 'none', cursor: readOnly ? 'not-allowed' : 'text' }}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
      />
    </div>
  )
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '6px', padding: '2px 0' }}>
      <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>{label}</label>
      <input type="date" style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '3px 8px', fontSize: '12px', background: 'white', outline: 'none', width: '100%' }}
        value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '6px', padding: '2px 0' }}>
      <label style={{ fontSize: '11px', color: '#6b7280', textAlign: 'right' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <select style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '3px 24px 3px 8px', fontSize: '12px', background: 'white', outline: 'none', appearance: 'none' }}
          value={value} onChange={e => onChange(e.target.value)}>
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

function TabelArticole({ articole, onChange }: { articole: ArticolLot[]; onChange: (a: ArticolLot[]) => void }) {
  const add = () => {
    const nou: ArticolLot = {
      id: Date.now().toString(), nrCrt: articole.length + 1, hsCod: '', cal: '', descriere: '',
      expeditor: '', adresaExpeditor: '', orasExpeditor: '', taraExpeditor: '', codPostalExpeditor: '',
      destinatar: '', adresaDestinatar: '', orasDestinatar: '', taraDestinatar: '', codPostalDestinatar: '',
      greutateBruta: '', greutateNeta: '', val: '', observatii: '',
    }
    onChange([...articole, nou])
  }
  const update = (id: string, field: keyof ArticolLot, value: string) =>
    onChange(articole.map(a => a.id === id ? { ...a, [field]: value } : a))
  const remove = (id: string) => onChange(articole.filter(a => a.id !== id))

  const cols = [
    { key: 'nrCrt', label: 'Nr.', w: '40px', readOnly: true },
    { key: 'hsCod', label: 'HS Cod', w: '90px' },
    { key: 'cal', label: 'Cal', w: '50px' },
    { key: 'descriere', label: 'Descriere', w: '160px' },
    { key: 'expeditor', label: 'Expeditor', w: '130px' },
    { key: 'adresaExpeditor', label: 'Adresă Exp.', w: '130px' },
    { key: 'orasExpeditor', label: 'Oraș Exp.', w: '100px' },
    { key: 'taraExpeditor', label: 'Țara Exp.', w: '70px' },
    { key: 'codPostalExpeditor', label: 'CP Exp.', w: '70px' },
    { key: 'destinatar', label: 'Destinatar', w: '130px' },
    { key: 'adresaDestinatar', label: 'Adresă Dest.', w: '130px' },
    { key: 'orasDestinatar', label: 'Oraș Dest.', w: '100px' },
    { key: 'taraDestinatar', label: 'Țara Dest.', w: '70px' },
    { key: 'codPostalDestinatar', label: 'CP Dest.', w: '70px' },
    { key: 'greutateBruta', label: 'Gr. Brută', w: '80px' },
    { key: 'greutateNeta', label: 'Gr. Netă', w: '80px' },
    { key: 'val', label: 'Val', w: '80px' },
    { key: 'observatii', label: 'Obs.', w: '100px' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: INDIGO, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
          <Plus style={{ width: '12px', height: '12px' }} /> Adaugă articol
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
          <thead>
            <tr style={{ background: '#f5f6fa' }}>
              {cols.map(c => (
                <th key={c.key} style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap', minWidth: c.w }}>{c.label}</th>
              ))}
              <th style={{ padding: '6px 8px', borderBottom: '1px solid #e5e7eb' }}></th>
            </tr>
          </thead>
          <tbody>
            {articole.length === 0 ? (
              <tr><td colSpan={cols.length + 1} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>Niciun articol. Adaugă manual sau importă din PDF.</td></tr>
            ) : articole.map((a, i) => (
              <tr key={a.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
                {cols.map(c => (
                  <td key={c.key} style={{ padding: '4px 6px' }}>
                    <input
                      style={{ border: '1px solid #e5e7eb', borderRadius: '3px', padding: '2px 5px', fontSize: '11px', width: c.w, background: (c as {readOnly?: boolean}).readOnly ? '#f9fafb' : 'white', outline: 'none' }}
                      value={String(a[c.key as keyof ArticolLot])}
                      readOnly={(c as {readOnly?: boolean}).readOnly}
                      onChange={e => update(a.id, c.key as keyof ArticolLot, e.target.value)}
                    />
                  </td>
                ))}
                <td style={{ padding: '4px 6px' }}>
                  <button onClick={() => remove(a.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 style={{ width: '13px', height: '13px' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {articole.length > 0 && (
            <tfoot>
              <tr style={{ background: '#f0f4ff', fontWeight: 'bold' }}>
                <td colSpan={14} style={{ padding: '6px 8px', fontSize: '11px', color: INDIGO }}>TOTAL</td>
                <td style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 'bold' }}>
                  {articole.reduce((s, a) => s + (parseFloat(a.greutateBruta) || 0), 0).toFixed(2)}
                </td>
                <td style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 'bold' }}>
                  {articole.reduce((s, a) => s + (parseFloat(a.greutateNeta) || 0), 0).toFixed(2)}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function TabelEntitati({ entitati, onChange }: { entitati: EntitatelLot[]; onChange: (e: EntitatelLot[]) => void }) {
  const add = () => onChange([...entitati, { id: Date.now().toString(), declarant: '', taraExpeditor: '', taraDestinatar: '', observatii: '' }])
  const update = (id: string, field: keyof EntitatelLot, value: string) =>
    onChange(entitati.map(e => e.id === id ? { ...e, [field]: value } : e))
  const remove = (id: string) => onChange(entitati.filter(e => e.id !== id))

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: INDIGO, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
          <Plus style={{ width: '12px', height: '12px' }} /> Adaugă entitate
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f5f6fa' }}>
            {['Declarant', 'Țara Expeditor', 'Țara Destinatar', 'Observații', ''].map((h, i) => (
              <th key={i} style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entitati.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>Nicio entitate.</td></tr>
          ) : entitati.map((e, i) => (
            <tr key={e.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
              {(['declarant', 'taraExpeditor', 'taraDestinatar', 'observatii'] as const).map(field => (
                <td key={field} style={{ padding: '4px 6px' }}>
                  <input style={{ border: '1px solid #e5e7eb', borderRadius: '3px', padding: '2px 5px', fontSize: '11px', width: '100%', background: 'white', outline: 'none' }}
                    value={e[field]} onChange={ev => update(e.id, field, ev.target.value)} />
                </td>
              ))}
              <td style={{ padding: '4px 6px' }}>
                <button onClick={() => remove(e.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Trash2 style={{ width: '13px', height: '13px' }} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TabelTransport({ transport, onChange }: { transport: TransportLot[]; onChange: (t: TransportLot[]) => void }) {
  const add = () => onChange([...transport, { id: Date.now().toString(), nrAuto: '', taraTransportator: '', codVamaExpeditor: '', codVamaDestinatar: '', ruta: '', nrSigiliu: '', observatii: '' }])
  const update = (id: string, field: keyof TransportLot, value: string) =>
    onChange(transport.map(t => t.id === id ? { ...t, [field]: value } : t))
  const remove = (id: string) => onChange(transport.filter(t => t.id !== id))

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <button onClick={add} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: INDIGO, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>
          <Plus style={{ width: '12px', height: '12px' }} /> Adaugă transport
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ background: '#f5f6fa' }}>
            {['Nr. Auto', 'Țara Transp.', 'Cod Vamă Exp.', 'Cod Vamă Dest.', 'Rută', 'Nr. Sigiliu', 'Observații', ''].map((h, i) => (
              <th key={i} style={{ textAlign: 'left', padding: '6px 8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transport.length === 0 ? (
            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>Niciun transport.</td></tr>
          ) : transport.map((t, i) => (
            <tr key={t.id} style={{ background: i % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f3f4f6' }}>
              {(['nrAuto', 'taraTransportator', 'codVamaExpeditor', 'codVamaDestinatar', 'ruta', 'nrSigiliu', 'observatii'] as const).map(field => (
                <td key={field} style={{ padding: '4px 6px' }}>
                  <input style={{ border: '1px solid #e5e7eb', borderRadius: '3px', padding: '2px 5px', fontSize: '11px', width: field === 'ruta' || field === 'observatii' ? '150px' : '100px', background: 'white', outline: 'none' }}
                    value={t[field]} onChange={ev => update(t.id, field, ev.target.value)} />
                </td>
              ))}
              <td style={{ padding: '4px 6px' }}>
                <button onClick={() => remove(t.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <Trash2 style={{ width: '13px', height: '13px' }} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface Props {
  onBack: () => void
}

export default function LotMarfaView({ onBack }: Props) {
  const [lot, setLot] = useState<LotMarfa>(emptyLot())
  const [lotId, setLotId] = useState<string | null>(null)
  const [view, setView] = useState<'form' | 'list'>('form')
  const [loturi, setLoturi] = useState<(LotMarfa & { id: string })[]>([])
  const [activeTab, setActiveTab] = useState('articole')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [loadingList, setLoadingList] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')

  const set = (field: keyof LotMarfa) => (value: string) =>
    setLot(prev => ({ ...prev, [field]: value }))

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveStatus('idle')
    const result = await saveLot(lotId ? { ...lot, id: lotId } : lot)
    if (result) {
      setLotId(result.id)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } else {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
    setSaving(false)
  }, [lot, lotId])

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

  const handleLoadList = async () => {
    setLoadingList(true)
    const data = await loadLoturi()
    setLoturi(data.map(dbToLot))
    setLoadingList(false)
    setView('list')
  }

  const handleNew = () => {
    setLot(emptyLot())
    setLotId(null)
    setView('form')
    setActiveTab('articole')
    setShowImport(false)
  }

  const handleOpenLot = (l: LotMarfa & { id: string }) => {
    setLot(l); setLotId(l.id); setView('form'); setActiveTab('articole')
  }

  const handleDeleteLot = async (id: string) => {
    if (!confirm('Ștergi acest lot?')) return
    await deleteLot(id)
    setLoturi(prev => prev.filter(l => l.id !== id))
  }

  const handleImportPdf = async (file: File) => {
    setImporting(true)
    setImportError('')
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve((reader.result as string).split(',')[1])
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      let pdfText = ''
      if (file.type.includes('pdf')) {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString()
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        const pdf = await pdfjsLib.getDocument({ data: bytes }).promise
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          pdfText += content.items.map((item: unknown) => (item as { str: string }).str).join(' ') + '\n'
        }
      }

      const response = await fetch('/api/extract-lot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mimeType: file.type, pdfText }),
      })

      if (!response.ok) throw new Error(`Server error: ${response.status}`)
      const extracted = await response.json()

      if (extracted.lot) {
        setLot(prev => ({ ...prev, ...extracted.lot }))
        setShowImport(false)
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import eșuat')
    }
    setImporting(false)
  }

  const tabs = [
    { id: 'articole', label: 'Articole' },
    { id: 'entitati', label: 'Entități' },
    { id: 'transport', label: 'Transport' },
    { id: 'observatii', label: 'Observații' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: '"Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif', fontSize: '12px' }}>

      {/* HEADER */}
      <header style={{ background: `linear-gradient(135deg, ${INDIGO} 0%, #1a2fa0 100%)`, height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/synergo-logo.png" alt="Synergo" style={{ height: '32px', objectFit: 'contain' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>Rutier → Multimodal</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>
              {view === 'list' ? 'Listă Loturi Marfă' : <>Lot Marfă {lot.mrn && <span style={{ marginLeft: '8px', color: MAGENTA, fontWeight: 'bold' }}>· {lot.mrn}</span>}</>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saveStatus === 'success' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#4ade80' }}><CheckCircle style={{ width: '14px', height: '14px' }} /> Salvat!</span>}
          {saveStatus === 'error' && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#f87171' }}><XCircle style={{ width: '14px', height: '14px' }} /> Eroare!</span>}
          <button onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
            <ArrowLeft style={{ width: '14px', height: '14px' }} /> Comenzi Rutiere
          </button>
          {view === 'form' && (
            <button onClick={() => setShowImport(s => !s)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
              <FileUp style={{ width: '14px', height: '14px' }} /> Import PDF
            </button>
          )}
          {view === 'list' ? (
            <button onClick={() => setView('form')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
              <ArrowLeft style={{ width: '14px', height: '14px' }} /> Înapoi
            </button>
          ) : (
            <button onClick={handleLoadList}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
              <List style={{ width: '14px', height: '14px' }} /> Listă loturi
            </button>
          )}
          <button onClick={handleNew}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'white', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>
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
        <span style={{ cursor: 'pointer', color: BLUE }} onClick={onBack}>Comenzi rutiere</span>
        <span>›</span>
        <span style={{ cursor: 'pointer', color: BLUE }} onClick={handleLoadList}>Loturi marfă</span>
        {view === 'form' && <><span>›</span><span style={{ fontWeight: '500', color: INDIGO }}>{lot.mrn || 'Lot nou'}</span></>}
      </div>

      {/* LISTA */}
      {view === 'list' && (
        <div style={{ margin: '16px 20px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ background: INDIGO, color: 'white', padding: '10px 16px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Loturi Marfă</span>
            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '999px' }}>{loturi.length} înregistrări</span>
          </div>
          {loadingList ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Se încarcă...</div>
          ) : loturi.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
              <div style={{ marginBottom: '8px' }}>Niciun lot salvat</div>
              <button onClick={() => setView('form')} style={{ background: INDIGO, color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Creează primul lot</button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr style={{ background: '#f5f6fa' }}>
                  {['MRN', 'Data', 'Regim', 'Valuta', 'Vamă', 'Total Articole', 'Greutate Brută', ''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '10px 12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loturi.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? 'white' : '#fafafa', cursor: 'pointer' }}
                    onClick={() => handleOpenLot(l)}>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', color: INDIGO }}>{l.mrn || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{l.data || '—'}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '999px', background: '#dbeafe', color: '#1e40af' }}>{l.regim || '—'}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{l.valuta || '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{l.vama || '—'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', color: MAGENTA }}>{l.articole?.length || 0}</td>
                    <td style={{ padding: '10px 12px' }}>{l.totalGreutateBruta || '—'}</td>
                    <td style={{ padding: '10px 12px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleDeleteLot(l.id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* FORMULAR */}
      {view === 'form' && (
        <>
          {/* IMPORT PDF */}
          {showImport && (
            <div style={{ margin: '12px 20px 0', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <div style={{ background: `linear-gradient(90deg, ${INDIGO}, ${BLUE})`, color: 'white', padding: '8px 16px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Import Document Vamal (T1, CMR, Orice limbă)</span>
                <button onClick={() => setShowImport(false)} style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
              </div>
              <div style={{ padding: '16px' }}>
                <div
                  style={{ border: '2px dashed #d1d5db', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb' }}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'application/pdf,image/*'
                    input.onchange = e => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) handleImportPdf(file)
                    }
                    input.click()
                  }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) handleImportPdf(file) }}
                >
                  {importing ? (
                    <div style={{ color: INDIGO, fontSize: '13px' }}>⏳ Se procesează documentul cu AI...</div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Trage documentul PDF aici sau click pentru selectare</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>T1, CMR, Transit — orice limbă (TR, EN, RO, DE, BG...)</div>
                    </div>
                  )}
                  {importError && <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '11px' }}>{importError}</div>}
                </div>
              </div>
            </div>
          )}

          {/* ANTET */}
          <div style={{ margin: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <Panel title="Date Generale">
              <Field label="Poziție R2" value={lot.pozitieR2} onChange={set('pozitieR2')} />
              <DateField label="Data" value={lot.data} onChange={set('data')} />
              <SelectField label="Valuta" value={lot.valuta} onChange={set('valuta')} options={VALUTA_OPTIONS} />
              <SelectField label="Regim" value={lot.regim} onChange={set('regim')} options={REGIM_OPTIONS} />
              <Field label="Vamă" value={lot.vama} onChange={set('vama')} />
              <Field label="Transit supl." value={lot.tranzitSuplimentar} onChange={set('tranzitSuplimentar')} />
            </Panel>

            <Panel title="Referințe">
              <Field label="MRN" value={lot.mrn} onChange={set('mrn')} />
              <Field label="LRN" value={lot.lrn} onChange={set('lrn')} />
              <Field label="URN" value={lot.urn} onChange={set('urn')} />
              <Field label="TSD CRN" value={lot.tsdCrn} onChange={set('tsdCrn')} />
              <Field label="DDT" value={lot.ddt} onChange={set('ddt')} />
              <DateField label="Data R2" value={lot.dataR2} onChange={set('dataR2')} />
            </Panel>

            <Panel title="Totale">
              <Field label="Total item-uri" value={lot.totalItemuri} onChange={set('totalItemuri')} />
              <Field label="Total gr. brută" value={lot.totalGreutateBruta} onChange={set('totalGreutateBruta')} />
              <div style={{ marginTop: '12px', padding: '10px', background: '#f0f4ff', borderRadius: '6px', border: `1px solid ${BLUE}30` }}>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', marginBottom: '6px' }}>Calculat din articole</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Nr. articole:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: INDIGO }}>{lot.articole.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Gr. brută totală:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: MAGENTA }}>
                    {lot.articole.reduce((s, a) => s + (parseFloat(a.greutateBruta) || 0), 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: '#6b7280' }}>Gr. netă totală:</span>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: MAGENTA }}>
                    {lot.articole.reduce((s, a) => s + (parseFloat(a.greutateNeta) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </Panel>
          </div>

          {/* TABS */}
          <div style={{ margin: '12px 20px 0', display: 'flex', gap: '2px' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{ padding: '6px 16px', fontSize: '11px', fontWeight: activeTab === tab.id ? 'bold' : 'normal', background: activeTab === tab.id ? 'white' : '#d1d5db', color: activeTab === tab.id ? INDIGO : '#6b7280', border: activeTab === tab.id ? `2px solid ${INDIGO}` : '2px solid transparent', borderBottom: activeTab === tab.id ? '2px solid white' : '2px solid transparent', borderRadius: '6px 6px 0 0', cursor: 'pointer' }}>
                {tab.label} {tab.id === 'articole' && lot.articole.length > 0 && <span style={{ marginLeft: '4px', background: MAGENTA, color: 'white', borderRadius: '999px', padding: '1px 6px', fontSize: '10px' }}>{lot.articole.length}</span>}
              </button>
            ))}
          </div>

          <div style={{ margin: '0 20px 48px', background: 'white', border: `1px solid ${INDIGO}`, borderRadius: '0 6px 6px 6px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {activeTab === 'articole' && <TabelArticole articole={lot.articole} onChange={a => setLot(prev => ({ ...prev, articole: a }))} />}
            {activeTab === 'entitati' && <TabelEntitati entitati={lot.entitati} onChange={e => setLot(prev => ({ ...prev, entitati: e }))} />}
            {activeTab === 'transport' && <TabelTransport transport={lot.transport} onChange={t => setLot(prev => ({ ...prev, transport: t }))} />}
            {activeTab === 'observatii' && (
              <div style={{ padding: '8px' }}>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Observații lot</label>
                <textarea style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '8px', fontSize: '12px', resize: 'vertical', outline: 'none', background: 'white', boxSizing: 'border-box', minHeight: '120px' }}
                  value={lot.observatii} onChange={e => set('observatii')(e.target.value)} placeholder="Adaugă observații..." />
              </div>
            )}
          </div>
        </>
      )}

      <footer style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: INDIGO, color: 'rgba(255,255,255,0.7)', fontSize: '10px', padding: '4px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Ctrl+S pentru salvare rapidă</span>
        <img src="/novasoft-logo.png" alt="Novasoft" style={{ height: '20px', objectFit: 'contain' }}
          onError={e => { const img = e.target as HTMLImageElement; img.style.display = 'none' }} />
      </footer>
    </div>
  )
}
