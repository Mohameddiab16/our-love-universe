'use client'

import { useEffect, useRef, useState } from 'react'
import { FiX, FiSearch, FiCrosshair, FiCheck } from 'react-icons/fi'

interface Props {
  initialLat?: number | null
  initialLng?: number | null
  onConfirm: (lat: number, lng: number, name: string) => void
  onClose: () => void
}

// Default center: Cairo, Egypt
const DEFAULT_CENTER: [number, number] = [30.0444, 31.2357]

export default function LocationPicker({ initialLat, initialLng, onConfirm, onClose }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [coords, setCoords] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  )
  const [placeName, setPlaceName] = useState('')
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [ready, setReady] = useState(false)

  // Reverse geocode a point -> place name
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`
      )
      const data = await res.json()
      const name = data.display_name?.split('،').slice(0, 2).join('،').trim()
        || data.display_name?.split(',').slice(0, 2).join(',').trim()
        || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      setPlaceName(name)
    } catch {
      setPlaceName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`)
    }
  }

  const placeMarker = (lat: number, lng: number, fly = true) => {
    setCoords([lat, lng])
    const L = (window as any).L
    if (!leafletMap.current || !L) return
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(leafletMap.current)
      markerRef.current.on('dragend', (e: any) => {
        const p = e.target.getLatLng()
        setCoords([p.lat, p.lng])
        reverseGeocode(p.lat, p.lng)
      })
    }
    if (fly) leafletMap.current.setView([lat, lng], 14)
    reverseGeocode(lat, lng)
  }

  // Init Leaflet map once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = (await import('leaflet')).default
      ;(window as any).L = L
      // @ts-ignore — load CSS
      await import('leaflet/dist/leaflet.css' as any).catch(() => {})
      // Fix default marker icons (broken under bundlers) by pointing to the CDN assets
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      if (cancelled || !mapRef.current || leafletMap.current) return

      const start: [number, number] = coords || DEFAULT_CENTER
      const map = L.map(mapRef.current).setView(start, coords ? 14 : 11)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map)

      map.on('click', (e: any) => placeMarker(e.latlng.lat, e.latlng.lng, false))
      leafletMap.current = map

      if (coords) placeMarker(coords[0], coords[1], false)
      setReady(true)
      setTimeout(() => map.invalidateSize(), 200)
    })()
    return () => {
      cancelled = true
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Search a place by name
  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&accept-language=ar&limit=1`
      )
      const data = await res.json()
      if (data[0]) {
        placeMarker(parseFloat(data[0].lat), parseFloat(data[0].lon))
      } else {
        alert('لم يتم العثور على المكان')
      }
    } catch {
      alert('تعذّر البحث')
    }
    setSearching(false)
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return alert('المتصفح لا يدعم تحديد الموقع')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { placeMarker(pos.coords.latitude, pos.coords.longitude); setLocating(false) },
      () => { alert('تعذّر الحصول على موقعك'); setLocating(false) },
      { timeout: 10000 }
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">📍 اختر المكان على الخريطة</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-800">
            <FiX size={16} />
          </button>
        </div>

        {/* Search + my location */}
        <div className="p-3 flex gap-2">
          <form onSubmit={doSearch} className="relative flex-1">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400" size={15} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن مكان (مثال: برج القاهرة)..."
              className="input-field pr-9 py-2 text-sm" />
          </form>
          <button onClick={useMyLocation} disabled={locating}
            className="flex-shrink-0 px-3 rounded-xl text-sm font-medium text-white flex items-center gap-1 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <FiCrosshair size={14} /> {locating ? '...' : 'موقعي'}
          </button>
        </div>

        {/* Map */}
        <div className="relative">
          <div ref={mapRef} style={{ height: 360, width: '100%', background: '#e5e7eb' }} />
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">جاري تحميل الخريطة...</div>
          )}
          <div className="absolute top-2 right-2 z-[1000] bg-white/90 rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow pointer-events-none">
            اضغط على الخريطة لتحديد المكان
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          {coords ? (
            <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
              📍 <span className="font-medium">{placeName || `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400 mb-3">لم تختر مكاناً بعد — اضغط على الخريطة</p>
          )}
          <div className="flex gap-3">
            <button disabled={!coords}
              onClick={() => coords && onConfirm(coords[0], coords[1], placeName || `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`)}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              <FiCheck size={15} /> تأكيد المكان
            </button>
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-500 hover:bg-gray-50">
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
