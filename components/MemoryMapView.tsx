'use client'

import { useEffect, useRef } from 'react'

interface Memory {
  id: string
  title: string
  description: string
  location: string | null
  date: string
  image_url: string | null
  latitude: number | null
  longitude: number | null
}

export default function MemoryMapView({ memories }: { memories: Memory[] }) {
  const withCoords = memories.filter(m => m.latitude && m.longitude)
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)

  useEffect(() => {
    if (withCoords.length === 0) return
    let cancelled = false

    ;(async () => {
      const L = (await import('leaflet')).default
      // @ts-ignore — load CSS
      await import('leaflet/dist/leaflet.css' as any).catch(() => {})
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      if (cancelled || !mapRef.current || leafletMap.current) return

      const map = L.map(mapRef.current)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19,
      }).addTo(map)
      leafletMap.current = map

      // Add a marker for every memory with coords
      const latlngs: [number, number][] = []
      withCoords.forEach(m => {
        const lat = m.latitude!, lng = m.longitude!
        latlngs.push([lat, lng])
        const date = (() => {
          const [y, mo, d] = m.date.split('-').map(Number)
          return new Date(y, mo - 1, d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
        })()
        const popup = `
          <div style="text-align:right;min-width:160px;font-family:inherit">
            ${m.image_url ? `<img src="${m.image_url}" style="width:100%;height:90px;object-fit:cover;border-radius:8px;margin-bottom:6px" />` : ''}
            <strong style="font-size:13px">${m.title}</strong>
            ${m.location ? `<div style="font-size:11px;color:#db2777;margin-top:2px">📍 ${m.location}</div>` : ''}
            <div style="font-size:11px;color:#999;margin-top:2px">${date}</div>
            <a href="https://www.google.com/maps?q=${lat},${lng}&z=15" target="_blank" style="font-size:11px;color:#7c3aed">فتح في خرائط جوجل ↗</a>
          </div>`
        L.marker([lat, lng]).addTo(map).bindPopup(popup)
      })

      // Fit map to show all markers
      if (latlngs.length === 1) {
        map.setView(latlngs[0], 13)
      } else {
        map.fitBounds(L.latLngBounds(latlngs).pad(0.2))
      }
      setTimeout(() => map.invalidateSize(), 200)
    })()

    return () => {
      cancelled = true
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memories])

  if (withCoords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-5xl mb-4">🗺️</p>
        <p className="text-gray-500 font-semibold">لا توجد ذكريات بإحداثيات بعد</p>
        <p className="text-gray-400 text-sm mt-1">أضف موقعاً عند إنشاء ذكرى جديدة</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl overflow-hidden shadow-md" style={{ height: 400 }}>
        <div ref={mapRef} style={{ height: '100%', width: '100%', background: '#e5e7eb' }} />
      </div>
      <p className="text-xs text-gray-400 text-center">
        🗺️ {withCoords.length} ذكرى على الخريطة — اضغط على أي علامة لرؤية التفاصيل
      </p>
    </div>
  )
}
