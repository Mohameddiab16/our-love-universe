'use client'

import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import { FiImage, FiPlus, FiMapPin, FiCalendar, FiSearch, FiTrash2, FiEdit2, FiHeart, FiCamera, FiX, FiEye, FiGrid, FiMap, FiMusic } from 'react-icons/fi'
import { useApp } from '@/contexts/AppContext'
import { useSiteTexts } from '@/lib/useSiteTexts'
import MemoryMapView from '@/components/MemoryMapView'

interface Memory {
  id: string
  title: string
  description: string
  location: string | null
  date: string
  image_url: string | null
  song_url: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
}

const emptyForm = { title: '', description: '', location: '', date: new Date().toISOString().split('T')[0], latitude: '', longitude: '', song_url: '' }

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match?.[1] || null
}

export default function MemoriesPage() {
  const { activeWorldId, activeWorldOwnerId } = useApp()
  const t = useSiteTexts()
  const [memories, setMemories] = useState<Memory[]>([])
  const [filtered, setFiltered] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Memory | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [userId, setUserId] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [viewMemory, setViewMemory] = useState<Memory | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`
          )
          const data = await res.json()
          const name = data.display_name?.split('،')[0]?.trim() || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          setForm(f => ({ ...f, location: name, latitude: latitude.toString(), longitude: longitude.toString() }))
        } catch {
          setForm(f => ({ ...f, latitude: latitude.toString(), longitude: longitude.toString() }))
        }
        setGettingLocation(false)
      },
      () => {
        alert('تعذّر الحصول على موقعك. تأكد من إذن الموقع.')
        setGettingLocation(false)
      },
      { timeout: 10000 }
    )
  }

  useEffect(() => { loadMemories() }, [activeWorldId])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(memories.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      (m.location || '').toLowerCase().includes(q)
    ))
  }, [search, memories])

  const loadMemories = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    let query = supabase.from('memories').select('*').order('date', { ascending: false })

    if (activeWorldId) {
      query = query.eq('world_id', activeWorldId)
    } else {
      query = query.eq('user_id', user.id).is('world_id', null)
    }

    const { data, error } = await query
    if (!error) {
      setMemories(data || [])
      setFiltered(data || [])
    }
    setLoading(false)
  }

  const openAdd = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setSaveError('')
    setModalOpen(true)
  }

  const openEdit = (m: Memory) => {
    setEditTarget(m)
    setForm({ title: m.title, description: m.description, location: m.location || '', date: m.date, latitude: m.latitude?.toString() || '', longitude: m.longitude?.toString() || '', song_url: m.song_url || '' })
    setImageFile(null)
    setImagePreview(m.image_url || null)
    setSaveError('')
    setModalOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !userId) return null
    setUploadingImage(true)
    const ext = imageFile.name.split('.').pop()
    const path = `memories/${userId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('love-media').upload(path, imageFile, { upsert: true })
    setUploadingImage(false)
    if (error) return null
    const { data } = supabase.storage.from('love-media').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    let imageUrl = editTarget?.image_url || null
    if (imageFile) {
      const uploaded = await uploadImage()
      if (uploaded) imageUrl = uploaded
    }

    if (editTarget) {
      const { error } = await supabase.from('memories').update({
        title: form.title,
        description: form.description,
        location: form.location || null,
        date: form.date,
        image_url: imageUrl,
        song_url: form.song_url || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      }).eq('id', editTarget.id)
      if (error) { setSaveError('حدث خطأ في الحفظ: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('memories').insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        location: form.location || null,
        date: form.date,
        image_url: imageUrl,
        song_url: form.song_url || null,
        world_id: activeWorldId || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      })
      if (error) { setSaveError('حدث خطأ في الحفظ: ' + error.message); setSaving(false); return }
    }

    setModalOpen(false)
    setSaving(false)
    await loadMemories()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الذكرى؟')) return
    await supabase.from('memories').delete().eq('id', id)
    loadMemories()
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8">
          {activeWorldOwnerId && (
            <div className="mb-4 p-3 rounded-2xl flex items-center gap-2 text-sm"
              style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
              <FiEye style={{ color: 'var(--primary)' }} size={15} />
              <span className="gradient-text font-medium">أنت تشاهد ذكريات صاحب العالم</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
                <FiImage /> ذكرياتنا
              </h1>
              <p className="text-gray-500 text-sm mt-1">{t('memories_subtitle', 'كل لحظة جميلة نعيشها معاً 💕')}</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex rounded-xl overflow-hidden border border-pink-100">
                <button onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm flex items-center gap-1 transition-all ${viewMode === 'grid' ? 'text-white' : 'text-gray-400 bg-white'}`}
                  style={viewMode === 'grid' ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                  <FiGrid size={14} /> قائمة
                </button>
                <button onClick={() => setViewMode('map')}
                  className={`px-3 py-2 text-sm flex items-center gap-1 transition-all ${viewMode === 'map' ? 'text-white' : 'text-gray-400 bg-white'}`}
                  style={viewMode === 'map' ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                  <FiMap size={14} /> خريطة
                </button>
              </div>
              <button onClick={openAdd} className="btn-primary flex items-center gap-2">
                <FiPlus /> ذكرى جديدة
              </button>
            </div>
          </div>

          <div className="relative mb-6">
            <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400" />
            <input type="text" placeholder="ابحث في الذكريات..." value={search}
              onChange={e => setSearch(e.target.value)} className="input-field pr-10" />
          </div>

          {viewMode === 'map' && !loading && (
            <MemoryMapView memories={filtered} />
          )}

          {viewMode === 'grid' && loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="memory-card h-48 bg-gray-50 animate-pulse" />)}
            </div>
          ) : viewMode === 'grid' && filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📸</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {search ? 'لا توجد نتائج' : 'لا توجد ذكريات بعد'}
              </p>
              <p className="text-gray-400 mb-6">{search ? 'جرب بحثاً مختلفاً' : 'ابدأ بحفظ أول ذكرى جميلة'}</p>
              {!search && (
                <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
                  <FiHeart /> أضف ذكرى
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(memory => (
                <div key={memory.id} className="memory-card group relative cursor-pointer" onClick={() => setViewMemory(memory)}>
                  {/* Image */}
                  {memory.image_url && (
                    <div className="w-full mb-4 rounded-xl overflow-hidden">
                      <img src={memory.image_url} alt={memory.title} className="w-full h-auto" />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={e => { e.stopPropagation(); openEdit(memory) }}
                      className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-blue-400 hover:text-blue-600">
                      <FiEdit2 size={14} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleDelete(memory.id) }}
                      className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-red-400 hover:text-red-600">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                  {memory.song_url && (
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-pink-400">
                      <FiMusic size={14} />
                    </div>
                  )}

                  {!memory.image_url && (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mb-4">
                      <FiImage className="text-pink-400 text-xl" />
                    </div>
                  )}

                  <h3 className="font-bold text-gray-800 mb-2 text-lg">{memory.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-3">{memory.description}</p>

                  <div className="flex flex-wrap items-center gap-3 mt-auto pt-3 border-t border-pink-50">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FiCalendar size={11} className="text-pink-400" />
                      {new Date(memory.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    {memory.location && (
                      <span className="text-xs text-pink-500 flex items-center gap-1 bg-pink-50 px-2 py-0.5 rounded-full">
                        <FiMapPin size={10} /> {memory.location}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </main>
      </div>

      {/* View Memory Modal */}
      {viewMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setViewMemory(null)}>
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewMemory(null)}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-800">
              <FiX size={18} />
            </button>

            {viewMemory.image_url && (
              <img src={viewMemory.image_url} alt={viewMemory.title} className="w-full h-auto rounded-t-3xl" />
            )}

            <div className="p-6">
              <h2 className="text-2xl font-bold gradient-text mb-3">{viewMemory.title}</h2>
              <p className="text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">{viewMemory.description}</p>

              <div className="flex flex-wrap gap-3 mb-5">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <FiCalendar size={13} className="text-pink-400" />
                  {new Date(viewMemory.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                {viewMemory.location && (
                  <span className="text-sm text-pink-500 flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full">
                    <FiMapPin size={12} /> {viewMemory.location}
                  </span>
                )}
              </div>

              {viewMemory.song_url && getYouTubeId(viewMemory.song_url) && (
                <div>
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                    <FiMusic size={14} className="text-pink-400" /> أغنية الذكرى 🎵
                  </p>
                  <div className="rounded-2xl overflow-hidden">
                    <iframe
                      width="100%"
                      height="200"
                      src={`https://www.youtube.com/embed/${getYouTubeId(viewMemory.song_url)}?autoplay=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="border-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'تعديل الذكرى' : 'ذكرى جديدة 💕'}>
        <form onSubmit={handleSave} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">صورة الذكرى (اختياري)</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden h-40 mb-2">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null) }}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <FiX size={13} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => imageRef.current?.click()}
                className="w-full h-28 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-pink-300 hover:text-pink-400 transition-colors"
                style={{ borderColor: 'rgba(255,107,157,0.4)' }}>
                <FiCamera size={24} />
                <span className="text-sm">اضغط لإضافة صورة</span>
              </button>
            )}
            <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان الذكرى *</label>
            <input type="text" placeholder="ما هو عنوان هذه اللحظة الجميلة؟" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التفاصيل *</label>
            <textarea placeholder="اكتب تفاصيل هذه الذكرى الجميلة..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field resize-none" rows={4} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المكان</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <FiMapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400" />
                <input type="text" placeholder="أين كانت هذه اللحظة؟" value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })} className="input-field pr-10" />
              </div>
              <button type="button" onClick={handleGetLocation} disabled={gettingLocation}
                className="flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                {gettingLocation ? '⏳' : '📍 موقعي'}
              </button>
            </div>
            {form.latitude && form.longitude && (
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-green-600">✅ تم تحديد الموقع على الخريطة</p>
                <button type="button" onClick={() => setForm(f => ({ ...f, latitude: '', longitude: '' }))}
                  className="text-xs text-red-400 hover:text-red-600">إزالة</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ *</label>
            <input type="date" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <FiMusic size={14} className="text-pink-400" /> أغنية الذكرى (اختياري)
            </label>
            <input type="url" placeholder="الصق رابط YouTube هنا..." value={form.song_url}
              onChange={e => setForm({ ...form, song_url: e.target.value })} className="input-field" />
            <p className="text-xs text-gray-400 mt-1">مثال: https://youtube.com/watch?v=...</p>
          </div>

          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm text-center">
              ⚠️ {saveError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || uploadingImage} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving || uploadingImage ? 'جاري الحفظ...' : <><FiHeart /> {editTarget ? 'حفظ التعديلات' : 'إضافة الذكرى'}</>}
            </button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-xl border-2 border-pink-100 text-gray-500 hover:bg-pink-50 transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  )
}
