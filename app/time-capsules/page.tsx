'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { FiPlus, FiTrash2, FiHeart, FiCamera, FiX, FiClock } from 'react-icons/fi'
import { useRef } from 'react'

interface TimeCapsule {
  id: string
  user_id: string
  world_id: string | null
  title: string
  content: string
  image_url: string | null
  open_at: string
  created_at: string
}

const emptyForm = { title: '', content: '', open_at: '' }

function getCountdown(dateStr: string) {
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000)
  if (diff <= 0) return null
  if (diff >= 365) return `${Math.floor(diff / 365)} سنة و ${Math.floor((diff % 365) / 30)} شهر`
  if (diff >= 30) return `${Math.floor(diff / 30)} شهر و ${diff % 30} يوم`
  return `${diff} يوم`
}

export default function TimeCapsulesPage() {
  const { activeWorldId } = useApp()
  const [capsules, setCapsules] = useState<TimeCapsule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [currentUserId, setCurrentUserId] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [openedCapsule, setOpenedCapsule] = useState<TimeCapsule | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [activeWorldId])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    let q = supabase.from('time_capsules').select('*').order('open_at')
    if (activeWorldId) q = q.eq('world_id', activeWorldId)
    else q = q.eq('user_id', user.id).is('world_id', null)

    const { data } = await q
    setCapsules(data || [])
    setLoading(false)
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !currentUserId) return null
    setUploading(true)
    const ext = imageFile.name.split('.').pop()
    const path = `capsules/${currentUserId}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('love-media').upload(path, imageFile, { upsert: true })
    setUploading(false)
    if (error) return null
    return supabase.storage.from('love-media').getPublicUrl(path).data.publicUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const imageUrl = imageFile ? await uploadImage() : null

    await supabase.from('time_capsules').insert({
      user_id: user.id,
      world_id: activeWorldId || null,
      title: form.title,
      content: form.content,
      open_at: form.open_at,
      image_url: imageUrl,
    })
    setModalOpen(false)
    setForm(emptyForm)
    setImageFile(null)
    setImagePreview(null)
    setSaving(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('حذف كبسولة الوقت هذه؟')) return
    await supabase.from('time_capsules').delete().eq('id', id)
    load()
  }

  const canOpen = (c: TimeCapsule) => getCountdown(c.open_at) === null

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)

  const locked = capsules.filter(c => !canOpen(c))
  const opened = capsules.filter(c => canOpen(c))

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
                ⏳ كبسولة الوقت
              </h1>
              <p className="text-gray-500 text-sm mt-1">لحظات تنتظر لحظة فتحها في المستقبل 💫</p>
            </div>
            <button onClick={() => { setForm(emptyForm); setImageFile(null); setImagePreview(null); setModalOpen(true) }}
              className="btn-primary flex items-center gap-2 self-start sm:self-auto">
              <FiPlus /> كبسولة جديدة
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1,2,3,4].map(i => <div key={i} className="memory-card h-40 animate-pulse bg-gray-50" />)}
            </div>
          ) : capsules.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">⏳</p>
              <p className="text-xl font-semibold text-gray-700 mb-2">لا توجد كبسولات بعد</p>
              <p className="text-gray-400 mb-6">أرسل رسالة لنفسك في المستقبل</p>
              <button onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
                <FiHeart /> أنشئ كبسولة
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {opened.length > 0 && (
                <div>
                  <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                    🎊 كبسولات جاهزة للفتح
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {opened.map(c => (
                      <div key={c.id} className="memory-card group cursor-pointer border-2 border-green-200 hover:border-green-300 transition-all"
                        onClick={() => setOpenedCapsule(c)}>
                        {c.image_url && (
                          <div className="w-full h-32 -mx-5 -mt-5 mb-3 overflow-hidden" style={{ width: 'calc(100% + 40px)' }}>
                            <div className="w-full h-full bg-green-100 flex items-center justify-center text-4xl">🎊</div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">🎊</span>
                          <h3 className="font-bold text-gray-800">{c.title}</h3>
                        </div>
                        <p className="text-sm text-green-600 font-medium">اضغط لفتح الكبسولة!</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(c.open_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {locked.length > 0 && (
                <div>
                  <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
                    🔐 كبسولات مقفولة
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {locked.map(c => {
                      const countdown = getCountdown(c.open_at)
                      return (
                        <div key={c.id} className="memory-card group relative">
                          <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            {c.user_id === currentUserId && (
                              <button onClick={() => handleDelete(c.id)}
                                className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                                <FiTrash2 size={12} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-2xl flex-shrink-0">
                              ⏳
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-800">{c.title}</h3>
                              <div className="mt-2 bg-purple-50 rounded-xl p-2 text-center">
                                <p className="text-xs text-gray-500">تُفتح بعد</p>
                                <p className="text-lg font-bold gradient-text">{countdown}</p>
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                📅 {new Date(c.open_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Create Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="كبسولة وقت جديدة ⏳">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">صورة (اختياري)</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden h-32 mb-2">
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }}
                  className="absolute top-2 left-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <FiX size={13} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => imageRef.current?.click()}
                className="w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-pink-300 hover:text-pink-400 transition-colors"
                style={{ borderColor: 'rgba(255,107,157,0.4)' }}>
                <FiCamera size={22} />
                <span className="text-sm">أضف صورة</span>
              </button>
            )}
            <input ref={imageRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)) } }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label>
            <input type="text" placeholder="اسم الكبسولة..." value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المحتوى *</label>
            <textarea placeholder="اكتب رسالتك للمستقبل... 💌" value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              className="input-field resize-none" rows={5} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الفتح *</label>
            <input type="date" value={form.open_at}
              min={minDate.toISOString().split('T')[0]}
              onChange={e => setForm({ ...form, open_at: e.target.value })}
              className="input-field" required />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving || uploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving || uploading ? 'جاري الحفظ...' : <><FiClock size={14} /> إغلاق الكبسولة</>}
            </button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-xl border-2 border-pink-100 text-gray-500 hover:bg-pink-50">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Open Capsule Modal */}
      {openedCapsule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="glass-card rounded-3xl p-8 max-w-md w-full text-center relative animate-fadeIn">
            <button onClick={() => setOpenedCapsule(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <FiX size={14} />
            </button>
            <div className="text-5xl mb-3">🎊</div>
            <h2 className="text-xl font-bold gradient-text mb-1">{openedCapsule.title}</h2>
            <p className="text-xs text-gray-400 mb-4">
              كُتبت في {new Date(openedCapsule.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {openedCapsule.image_url && (
              <img src={openedCapsule.image_url} alt="" className="w-full h-48 object-cover rounded-2xl mb-4" />
            )}
            <div className="bg-pink-50 rounded-2xl p-4 text-right">
              <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{openedCapsule.content}</p>
            </div>
            <button onClick={() => { handleDelete(openedCapsule.id); setOpenedCapsule(null) }}
              className="mt-4 text-xs text-gray-400 hover:text-red-400 transition-colors">
              حذف الكبسولة
            </button>
          </div>
        </div>
      )}
    </AuthGuard>
  )
}
