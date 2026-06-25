'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

const pinIcon = (emoji = '📍') => L.divIcon({
  html: `<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">${emoji}</div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

export default function MemoryMapView({ memories }: { memories: Memory[] }) {
  const withCoords = memories.filter(m => m.latitude && m.longitude)

  const center: [number, number] = withCoords.length > 0
    ? [withCoords[0].latitude!, withCoords[0].longitude!]
    : [30.0444, 31.2357] // Cairo default

  if (withCoords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-5xl mb-4">🗺️</p>
        <p className="text-gray-500 font-semibold">لا توجد ذكريات بإحداثيات بعد</p>
        <p className="text-gray-400 text-sm mt-1">أضف إحداثيات عند إنشاء ذكرى جديدة</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg" style={{ height: '500px' }}>
      <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map(m => (
          <Marker key={m.id} position={[m.latitude!, m.longitude!]} icon={pinIcon('💕')}>
            <Popup>
              <div className="text-right min-w-[160px]">
                {m.image_url && (
                  <img src={m.image_url} alt={m.title}
                    className="w-full h-24 object-cover rounded-lg mb-2" />
                )}
                <p className="font-bold text-gray-800 text-sm">{m.title}</p>
                {m.location && <p className="text-xs text-pink-500 mt-0.5">📍 {m.location}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(m.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
