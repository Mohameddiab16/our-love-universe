'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { useSiteTexts } from '@/lib/useSiteTexts'
import { FiCalendar, FiPlus, FiTrash2, FiEdit2, FiHeart, FiStar, FiGift, FiClock, FiMusic, FiX, FiMapPin } from 'react-icons/fi'

interface Occasion {
  id: string
  title: string
  description: string | null
  date: string
  type: string
  song_url: string | null
  created_at: string
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
  return match?.[1] || null
}

const types = [
  { value: 'anniversary', label: 'ذكرى سنوية', icon: '💑', color: 'from-pink-400 to-rose-500' },
  { value: 'birthday', label: 'عيد ميلاد', icon: '🎂', color: 'from-purple-400 to-pink-500' },
  { value: 'first', label: 'أول مرة', icon: '⭐', color: 'from-yellow-400 to-orange-400' },
  { value: 'trip', label: 'رحلة', icon: '✈️', color: 'from-blue-400 to-cyan-500' },
  { value: 'special', label: 'مناسبة خاصة', icon: '🎉', color: 'from-emerald-400 to-teal-500' },
]

const emptyForm = { title: '', description: '', date: new Date().toISOString().split('T')[0], type: 'anniversary', song_url: '' }

function getDaysUntil(dateStr: string) {
  // Force local timezone by appending T00:00:00 — avoids UTC-parse shifting date by 1 day
  const today = new Date()
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  return Math.round((target.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24))
}

export default function OccasionsPage() {
  const { activeWorldId } = useApp()
  const t = useSiteTexts()
  const [occasions, setOccasions] = useState<Occasion[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Occasion | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Occasion | null>(null)

  useEffect(() => { loadOccasions() }, [activeWorldId])

  const loadOccasions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let query = supabase.from('occasions').select('*').order('date')
    if (activeWorldId) {
      query = query.eq('world_id', activeWorldId)
    } else {
      query = query.eq('user_id', user.id).is('world_id', null)
    }

    const { data } = await query
    setOccasions(data || [])
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (editTarget) {
      await supabase.from('occasions').update({
        title: form.title, description: form.description || null, date: form.date, type: form.type,
        song_url: form.song_url || null,
      }).eq('id', editTarget.id)
    } else {
      await supabase.from('occasions').insert({
        user_id: user.id, title: form.title, description: form.description || null,
        date: form.date, type: form.type, world_id: activeWorldId || null,
        song_url: form.song_url || null,
      })
    }
    setModalOpen(false)
    setSaving(false)
    loadOccasions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه المناسبة؟')) return
    await supabase.from('occasions').delete().eq('id', id)
    loadOccasions()
  }

  const getTypeInfo = (type: string) => types.find(t => t.value === type) || types[4]

  const upcoming = occasions.filter(o => getDaysUntil(o.date) >= 0)
  const past = occasions.filter(o => getDaysUntil(o.date) < 0)

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
                <FiCalendar /> المناسبات
              </h1>
              <p className="text-gray-500 text-sm mt-1">{t('occasions_subtitle', 'لحظاتنا المميزة على مدار العام 🎉')}</p>
            </div>
            <button
              onClick={() => { setEditTarget(null); setForm(emptyForm); setModalOpen(true) }}
              className="btn-primary flex items-center gap-2 self-start sm:self-auto"
            >
              <FiPlus /> مناسبة جديدة
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="memory-card h-24 bg-gray-50 animate-pulse" />)}
            </div>
          ) : occasions.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-xl font-semibold text-gray-700 mb-2">لا توجد مناسبات بعد</p>
              <p className="text-gray-400 mb-6">أضف مناسباتك المميزة لتذكرها دائماً</p>
              <button
                onClick={() => { setEditTarget(null); setForm(emptyForm); setModalOpen(true) }}
                className="btn-primary inline-flex items-center gap-2"
              >
                <FiStar /> أضف مناسبة
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Upcoming */}
              {upcoming.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FiClock className="text-pink-400" /> المناسبات القادمة
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {upcoming.map(occ => {
                      const info = getTypeInfo(occ.type)
                      const days = getDaysUntil(occ.date)
                      return (
                        <div key={occ.id} className="memory-card group relative overflow-hidden cursor-pointer" onClick={() => setSelected(occ)}>
                          <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${info.color}`} />
                          <div className="flex items-start gap-4 pr-2">
                            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${info.color} flex items-center justify-center text-2xl shadow-md flex-shrink-0`}>
                              {info.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-bold text-gray-800">{occ.title}</h3>
                                  <p className="text-xs text-gray-400 mt-0.5">{info.label}</p>
                                  {occ.description && <p className="text-sm text-gray-500 mt-1">{occ.description}</p>}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                  <button onClick={e => { e.stopPropagation(); setEditTarget(occ); setForm({ title: occ.title, description: occ.description || '', date: occ.date, type: occ.type, song_url: occ.song_url || '' }); setModalOpen(true) }}
                                    className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-400">
                                    <FiEdit2 size={12} />
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); handleDelete(occ.id) }}
                                    className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                                    <FiTrash2 size={12} />
                                  </button>
                                </div>
                              </div>
                              {occ.song_url && getYouTubeId(occ.song_url) && (
                                <span className="inline-flex items-center gap-1 text-xs text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full mt-2">
                                  <FiMusic size={10} /> أغنية
                                </span>
                              )}
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-400">
                                  {new Date(occ.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${days === 0 ? 'bg-pink-100 text-pink-600' : days <= 7 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                  {days === 0 ? '🎉 اليوم!' : `${days} يوم`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Past */}
              {past.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <FiGift className="text-purple-400" /> المناسبات الماضية
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {past.map(occ => {
                      const info = getTypeInfo(occ.type)
                      return (
                        <div key={occ.id} className="memory-card group opacity-70 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setSelected(occ)}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                              {info.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-700 truncate">{occ.title}</h3>
                              <p className="text-xs text-gray-400">
                                {new Date(occ.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={e => { e.stopPropagation(); handleDelete(occ.id) }}
                                className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                                <FiTrash2 size={12} />
                              </button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? 'تعديل المناسبة' : 'مناسبة جديدة 🎉'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المناسبة *</label>
            <input type="text" placeholder="ما هي هذه المناسبة؟" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea placeholder="تفاصيل إضافية..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field resize-none" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع المناسبة</label>
            <div className="grid grid-cols-2 gap-2">
              {types.map(t => (
                <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
                  className={`p-3 rounded-xl border-2 text-right flex items-center gap-2 transition-all ${
                    form.type === t.value ? 'border-pink-400 bg-pink-50' : 'border-gray-100 hover:border-pink-200'
                  }`}>
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-sm text-gray-700">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ *</label>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
              className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
              <FiMusic size={14} className="text-pink-400" /> أغنية المناسبة (اختياري)
            </label>
            <input type="url" placeholder="الصق رابط YouTube هنا..." value={form.song_url}
              onChange={e => setForm({ ...form, song_url: e.target.value })} className="input-field" />
            <p className="text-xs text-gray-400 mt-1">مثال: https://youtube.com/watch?v=...</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? 'جاري الحفظ...' : <><FiHeart /> {editTarget ? 'حفظ' : 'إضافة'}</>}
            </button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-xl border-2 border-pink-100 text-gray-500 hover:bg-pink-50 transition-colors">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      {selected && (() => {
        const info = getTypeInfo(selected.type)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setSelected(null)}>
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelected(null)}
                className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-800">
                <FiX size={18} />
              </button>

              <div className={`h-28 bg-gradient-to-br ${info.color} flex items-center justify-center text-6xl rounded-t-3xl`}>
                {info.icon}
              </div>

              <div className="p-6">
                <span className="text-xs text-gray-400">{info.label}</span>
                <h2 className="text-2xl font-bold gradient-text mb-3">{selected.title}</h2>
                {selected.description && (
                  <p className="text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">{selected.description}</p>
                )}

                <span className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                  <FiCalendar size={13} className="text-pink-400" />
                  {(() => { const [y,m,d] = selected.date.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) })()}
                </span>

                {selected.song_url && getYouTubeId(selected.song_url) && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                      <FiMusic size={14} className="text-pink-400" /> أغنية المناسبة 🎵
                    </p>
                    <div className="rounded-2xl overflow-hidden">
                      <iframe
                        width="100%"
                        height="200"
                        src={`https://www.youtube.com/embed/${getYouTubeId(selected.song_url)}?autoplay=1`}
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
        )
      })()}
    </AuthGuard>
  )
}
