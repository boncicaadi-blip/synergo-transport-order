import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { RouteDetail } from '../types/TransportOrder'

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

const INDIGO = '#0B178B'
const BLUE = '#2980DA'

interface GeoPoint {
  lat: number
  lng: number
  label: string
  detail: RouteDetail
}

function FitBounds({ points }: { points: GeoPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [40, 40] })
    }
  }, [points, map])
  return null
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length < 3) return null
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'Accept-Language': 'ro,en' } }
    )
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
  } catch { /* ignore */ }
  return null
}

interface Props {
  detalii: RouteDetail[]
  onClose: () => void
}

export default function RouteMap({ detalii, onClose }: Props) {
  const [points, setPoints] = useState<GeoPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadPoints() {
      setLoading(true)
      const results: GeoPoint[] = []

      for (const d of detalii) {
        const searchStr = d.localitate || d.partener || ''
        if (!searchStr) continue

        // Încearcă adresa completă, apoi doar prima parte
        let coords = await geocode(searchStr)
        if (!coords) {
          const short = searchStr.split(/[-,]/)[0].trim()
          coords = await geocode(short)
        }

        if (coords) {
          results.push({
            lat: coords.lat,
            lng: coords.lng,
            label: d.partener || searchStr,
            detail: d,
          })
        }
        // Pauză mică între request-uri Nominatim
        await new Promise(r => setTimeout(r, 300))
      }

      if (results.length === 0) {
        setError('Nu s-au putut găsi coordonatele pentru localitățile specificate.')
      }
      setPoints(results)
      setLoading(false)
    }
    loadPoints()
  }, [detalii])

  const routeCoords: [number, number][] = points.map(p => [p.lat, p.lng])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '12px', width: '90vw', maxWidth: '1000px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ background: INDIGO, color: 'white', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>🗺️ Vizualizare Rută</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '4px', padding: '4px 12px', cursor: 'pointer', fontSize: '16px' }}>×</button>
        </div>

        {/* Legendă */}
        <div style={{ padding: '8px 16px', background: '#f8faff', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '16px', fontSize: '11px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
            Punct încărcare
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', background: BLUE, borderRadius: '50%', display: 'inline-block' }} />
            Punct descărcare
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '20px', height: '3px', background: INDIGO, display: 'inline-block' }} />
            Rută
          </span>
        </div>

        {/* Hartă */}
        <div style={{ flex: 1, position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.9)', zIndex: 1000, gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', border: `3px solid ${INDIGO}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '13px', color: INDIGO, fontWeight: '500' }}>Se calculează ruta...</div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>Geocodificare adrese...</div>
            </div>
          )}

          {!loading && error && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', zIndex: 1000 }}>
              <div style={{ textAlign: 'center', color: '#6b7280' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗺️</div>
                <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>Ruta nu poate fi afișată</div>
                <div style={{ fontSize: '11px' }}>{error}</div>
              </div>
            </div>
          )}

          <MapContainer
            center={[45.9432, 24.9668]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />

            {points.length > 0 && <FitBounds points={points} />}

            {routeCoords.length > 1 && (
              <Polyline
                positions={routeCoords}
                color={INDIGO}
                weight={3}
                dashArray="8 4"
                opacity={0.8}
              />
            )}

            {points.map((p, i) => (
              <Marker
                key={i}
                position={[p.lat, p.lng]}
                icon={p.detail.tip === 'I' ? greenIcon : blueIcon}
              >
                <Popup>
                  <div style={{ fontSize: '12px', minWidth: '160px' }}>
                    <div style={{ fontWeight: 'bold', color: p.detail.tip === 'I' ? '#16a34a' : BLUE, marginBottom: '4px' }}>
                      {p.detail.tip === 'I' ? '↑ Încărcare' : '↓ Descărcare'} {i + 1}
                    </div>
                    <div style={{ fontWeight: '500' }}>{p.label}</div>
                    <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>{p.detail.localitate}</div>
                    {p.detail.data && <div style={{ color: '#6b7280', fontSize: '11px' }}>Data: {p.detail.data}</div>}
                    {p.detail.articolMarfa && <div style={{ color: '#6b7280', fontSize: '11px' }}>Marfă: {p.detail.articolMarfa}</div>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Footer cu detalii rută */}
        {!loading && points.length > 0 && (
          <div style={{ padding: '10px 16px', background: '#f8faff', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {points.map((p, i) => (
              <div key={i} style={{ minWidth: '180px', background: 'white', borderRadius: '6px', border: `1px solid ${p.detail.tip === 'I' ? '#bbf7d0' : '#bfdbfe'}`, padding: '8px 10px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: p.detail.tip === 'I' ? '#16a34a' : BLUE, marginBottom: '4px' }}>
                  {p.detail.tip === 'I' ? '↑ ÎNCĂRCARE' : '↓ DESCĂRCARE'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '500' }}>{p.label}</div>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>{p.detail.data} {p.detail.ora && `ora ${p.detail.ora}`}</div>
              </div>
            ))}
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
