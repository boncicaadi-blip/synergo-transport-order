import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
})

export interface MapLocation {
  lat: number
  lng: number
  label: string
  address: string
  type: 'incarcare' | 'descarcare'
}

interface Props {
  onConfirm: (locations: MapLocation[]) => void
  onClose: () => void
}

function SearchBox({ onResult }: { onResult: (lat: number, lng: number, label: string, address: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [loading, setLoading] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`)
      const data = await res.json()
      setResults(data)
    } catch { setResults([]) }
    setLoading(false)
  }

  return (
    <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '400px' }}>
      <div style={{ display: 'flex', gap: '4px', background: 'white', padding: '6px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
        <input
          style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '4px', padding: '6px 10px', fontSize: '13px', outline: 'none' }}
          placeholder="Caută localitate, adresă..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
        />
        <button onClick={search}
          style={{ background: '#0B178B', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>
          {loading ? '...' : 'Caută'}
        </button>
      </div>
      {results.length > 0 && (
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', marginTop: '4px', maxHeight: '200px', overflowY: 'auto' }}>
          {results.map((r, i) => (
            <div key={i}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px', borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              onClick={() => {
                const parts = r.display_name.split(',')
                const label = parts[0].trim()
                onResult(parseFloat(r.lat), parseFloat(r.lon), label, r.display_name)
                setResults([])
                setQuery('')
              }}>
              {r.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng.lat, e.latlng.lng),
  })
  return null
}

export default function MapPicker({ onConfirm, onClose }: Props) {
  const [locations, setLocations] = useState<MapLocation[]>([])
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number; label: string; address: string } | null>(null)

  const handleSearchResult = (lat: number, lng: number, label: string, address: string) => {
    setPendingLocation({ lat, lng, label, address })
  }

  const handleMapClick = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await res.json()
      const label = data.address?.city || data.address?.town || data.address?.village || data.display_name.split(',')[0]
      setPendingLocation({ lat, lng, label, address: data.display_name })
    } catch {
      setPendingLocation({ lat, lng, label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, address: '' })
    }
  }

  const addLocation = (type: 'incarcare' | 'descarcare') => {
    if (!pendingLocation) return
    setLocations(prev => [...prev, { ...pendingLocation, type }])
    setPendingLocation(null)
  }

  const removeLocation = (i: number) => setLocations(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '90vw', maxWidth: '1000px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ background: '#0B178B', color: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>🗺️ Selectare puncte încărcare / descărcare</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <SearchBox onResult={handleSearchResult} />
            <MapContainer center={[45.9432, 24.9668]} zoom={7} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
              <MapClickHandler onMapClick={handleMapClick} />

              {pendingLocation && (
                <Marker position={[pendingLocation.lat, pendingLocation.lng]}>
                  <Popup>
                    <div style={{ fontSize: '12px', minWidth: '180px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>{pendingLocation.label}</div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => addLocation('incarcare')}
                          style={{ flex: 1, background: '#16a34a', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                          ↑ Încărcare
                        </button>
                        <button onClick={() => addLocation('descarcare')}
                          style={{ flex: 1, background: '#2980DA', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                          ↓ Descărcare
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {locations.map((loc, i) => (
                <Marker key={i} position={[loc.lat, loc.lng]} icon={loc.type === 'incarcare' ? greenIcon : blueIcon}>
                  <Popup>
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: loc.type === 'incarcare' ? '#16a34a' : '#2980DA' }}>
                        {loc.type === 'incarcare' ? '↑ Încărcare' : '↓ Descărcare'} {i + 1}
                      </div>
                      <div>{loc.label}</div>
                      <button onClick={() => removeLocation(i)}
                        style={{ marginTop: '4px', background: '#f87171', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
                        Șterge
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div style={{ width: '260px', background: '#f8faff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0B178B', textTransform: 'uppercase', marginBottom: '8px' }}>Instrucțiuni</div>
              <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.8' }}>
                1. Caută o localitate sau<br />
                2. Click direct pe hartă<br />
                3. Alege tip punct (↑/↓)<br />
                4. Adaugă câte puncte vrei
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0B178B', textTransform: 'uppercase', marginBottom: '6px' }}>
                Puncte selectate ({locations.length})
              </div>
              {locations.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#9ca3af', textAlign: 'center', padding: '16px' }}>Niciun punct selectat</div>
              ) : locations.map((loc, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '6px', border: `1px solid ${loc.type === 'incarcare' ? '#bbf7d0' : '#bfdbfe'}`, padding: '8px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: loc.type === 'incarcare' ? '#16a34a' : '#2980DA' }}>
                      {loc.type === 'incarcare' ? '↑ ÎNCĂRCARE' : '↓ DESCĂRCARE'}
                    </span>
                    <button onClick={() => removeLocation(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '14px' }}>×</button>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: '500' }}>{loc.label}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{loc.address.substring(0, 60)}...</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => locations.length > 0 && onConfirm(locations)}
                disabled={locations.length === 0}
                style={{ width: '100%', background: locations.length > 0 ? '#0B178B' : '#d1d5db', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: locations.length > 0 ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 'bold' }}>
                ✓ Confirmă {locations.length} punct{locations.length !== 1 ? 'e' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
