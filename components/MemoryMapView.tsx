'use client'

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

  if (withCoords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-5xl mb-4">🗺️</p>
        <p className="text-gray-500 font-semibold">لا توجد ذكريات بإحداثيات بعد</p>
        <p className="text-gray-400 text-sm mt-1">أضف إحداثيات عند إنشاء ذكرى جديدة</p>
      </div>
    )
  }

  const openInMaps = (lat: number, lng: number, title: string) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}&z=15`, '_blank')
  }

  return (
    <div className="space-y-3">
      {/* Mini map via iframe for first location */}
      {withCoords.length > 0 && (
        <div className="rounded-2xl overflow-hidden shadow-md mb-4" style={{ height: 280 }}>
          <iframe
            title="خريطة الذكريات"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${withCoords[0].longitude! - 0.05},${withCoords[0].latitude! - 0.05},${withCoords[0].longitude! + 0.05},${withCoords[0].latitude! + 0.05}&layer=mapnik&marker=${withCoords[0].latitude},${withCoords[0].longitude}`}
          />
        </div>
      )}

      {/* List of memories with coords */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {withCoords.map(m => (
          <div key={m.id} className="memory-card flex items-center gap-3">
            {m.image_url && (
              <img src={m.image_url} alt={m.title}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm truncate">{m.title}</p>
              {m.location && <p className="text-xs text-pink-500 truncate">📍 {m.location}</p>}
              <p className="text-xs text-gray-400">
                {new Date(m.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => openInMaps(m.latitude!, m.longitude!, m.title)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium text-white"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
              🗺️ فتح
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
