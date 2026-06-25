'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { FiPlus, FiTrash2, FiHeart, FiCheck } from 'react-icons/fi'

interface BucketItem {
  id: string
  user_id: string
  world_id: string | null
  title: string
  description: string | null
  category: string
  is_done: boolean
  done_at: string | null
  created_at: string
}

const categories = [
  { value: 'travel',  label: 'سفر',          emoji: '✈️' },
  { value: 'food',    label: 'تجربة طعام',   emoji: '🍽️' },
  { value: 'event',   label: 'فعالية',        emoji: '🎭' },
  { value: 'together',label: 'معاً',           emoji: '💑' },
  { value: 'dream',   label: 'حلم',           emoji: '🌟' },
  { value: 'learn',   label: 'تعلم',          emoji: '📚' },
  { value: 'other',   label: 'أخرى',          emoji: '🎯' },
]

const emptyForm = { title: '', description: '', category: 'together' }

export default function BucketListPage() {
  const { activeWorldId } = useApp()
  const [items, setItems] = useState<BucketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [filterDone, setFilterDone] = useState<'all' | 'done' | 'pending'>('all')
  const [currentUserId, setCurrentUserId] = useState('')

  useEffect(() => { load() }, [activeWorldId])

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setCurrentUserId(user.id)

    let q = supabase.from('bucket_list').select('*').order('created_at', { ascending: false })
    if (activeWorldId) q = q.eq('world_id', activeWorldId)
    else q = q.eq('user_id', user.id).is('world_id', null)

    const { data } = await q
    setItems(data || [])
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('bucket_list').insert({
      user_id: user.id,
      world_id: activeWorldId || null,
      title: form.title,
      description: form.description || null,
      category: form.category,
      is_done: false,
    })
    setModalOpen(false)
    setForm(emptyForm)
    setSaving(false)
    load()
  }

  const toggleDone = async (item: BucketItem) => {
    await supabase.from('bucket_list').update({
      is_done: !item.is_done,
      done_at: !item.is_done ? new Date().toISOString() : null,
    }).eq('id', item.id)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا الهدف؟')) return
    await supabase.from('bucket_list').delete().eq('id', id)
    load()
  }

  const getCat = (v: string) => categories.find(c => c.value === v) || categories[6]

  const filtered = items.filter(it => {
    if (filterCat !== 'all' && it.category !== filterCat) return false
    if (filterDone === 'done' && !it.is_done) return false
    if (filterDone === 'pending' && it.is_done) return false
    return true
  })

  const done = items.filter(i => i.is_done).length
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text flex items-center gap-2">
                🌟 قائمة أحلامنا
              </h1>
              <p className="text-gray-500 text-sm mt-1">الأشياء اللي عايزين نعملها مع بعض 💕</p>
            </div>
            <button onClick={() => { setForm(emptyForm); setModalOpen(true) }}
              className="btn-primary flex items-center gap-2 self-start sm:self-auto">
              <FiPlus /> هدف جديد
            </button>
          </div>

          {/* Progress */}
          {items.length > 0 && (
            <div className="glass-card rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">تقدمنا معاً</span>
                <span className="text-sm font-bold gradient-text">{done} / {items.length} ✅</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-center">{pct}% منجز 🎉</p>
            </div>
          )}

          {/* Filters */}
          {items.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              <button onClick={() => setFilterDone('all')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filterDone === 'all' ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
                style={filterDone === 'all' ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                الكل
              </button>
              <button onClick={() => setFilterDone('pending')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filterDone === 'pending' ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
                style={filterDone === 'pending' ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                ⏳ لم تتم
              </button>
              <button onClick={() => setFilterDone('done')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filterDone === 'done' ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
                style={filterDone === 'done' ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                ✅ منجزة
              </button>
              {categories.map(c => (
                <button key={c.value} onClick={() => setFilterCat(filterCat === c.value ? 'all' : c.value)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${filterCat === c.value ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
                  style={filterCat === c.value ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="memory-card h-20 animate-pulse bg-gray-50" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🌟</p>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {items.length === 0 ? 'قائمة أحلامكم فارغة' : 'لا توجد نتائج'}
              </p>
              <p className="text-gray-400 mb-6">أضف أول حلم تريدان تحقيقه معاً</p>
              {items.length === 0 && (
                <button onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2">
                  <FiHeart /> أضف هدفاً
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(item => {
                const cat = getCat(item.category)
                return (
                  <div key={item.id} className={`memory-card group flex items-center gap-4 transition-all ${item.is_done ? 'opacity-70' : ''}`}>
                    {/* Done toggle */}
                    <button onClick={() => toggleDone(item)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        item.is_done
                          ? 'border-green-400 bg-green-50 text-green-500'
                          : 'border-gray-200 hover:border-pink-300 text-transparent hover:text-pink-300'
                      }`}>
                      <FiCheck size={18} />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{cat.emoji}</span>
                        <p className={`font-semibold text-gray-800 ${item.is_done ? 'line-through text-gray-400' : ''}`}>
                          {item.title}
                        </p>
                        {activeWorldId && item.user_id !== currentUserId && (
                          <span className="text-xs bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full">شريكك 💕</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{item.description}</p>
                      )}
                      {item.is_done && item.done_at && (
                        <p className="text-xs text-green-500 mt-0.5">
                          ✅ تم {new Date(item.done_at).toLocaleDateString('ar-EG')}
                        </p>
                      )}
                    </div>

                    {/* Delete */}
                    {item.user_id === currentUserId && (
                      <button onClick={() => handleDelete(item.id)}
                        className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <FiTrash2 size={13} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="هدف جديد 🌟">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الهدف *</label>
            <input type="text" placeholder="ماذا تريدان أن تفعلا معاً؟" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تفاصيل (اختياري)</label>
            <textarea placeholder="تفاصيل إضافية..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field resize-none" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(c => (
                <button key={c.value} type="button" onClick={() => setForm({ ...form, category: c.value })}
                  className={`p-2 rounded-xl border-2 text-center transition-all ${
                    form.category === c.value ? 'border-pink-400 bg-pink-50' : 'border-gray-100 hover:border-pink-200'
                  }`}>
                  <span className="text-xl block">{c.emoji}</span>
                  <span className="text-xs text-gray-600">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving ? 'جاري الحفظ...' : <><FiHeart /> إضافة الهدف</>}
            </button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-xl border-2 border-pink-100 text-gray-500 hover:bg-pink-50">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  )
}
