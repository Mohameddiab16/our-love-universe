'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import Modal from '@/components/Modal'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import {
  FiGlobe, FiPlus, FiUser, FiUsers, FiHeart, FiTrash2,
  FiMail, FiCheckCircle, FiLink, FiPhone, FiCopy, FiEye
} from 'react-icons/fi'

interface World {
  id: string; name: string; type: string; description: string | null
  cover_emoji: string; owner_id: string
}
interface WorldMember {
  id: string; user_id: string; role: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
}
interface JoinedWorld {
  world_id: string; role: string
  worlds: World
}

const worldTypes = [
  { value: 'personal', label: 'عالمي الخاص', emoji: '🌍' },
  { value: 'couple',   label: 'عالم ثنائي',  emoji: '💑' },
  { value: 'family',   label: 'عالم عائلي',  emoji: '👨‍👩‍👧‍👦' },
]
const roles = [
  { value: 'viewer', label: '👁️ مشاهد', desc: 'عرض فقط' },
  { value: 'editor', label: '✏️ محرر',   desc: 'عرض وتعديل' },
  { value: 'admin',  label: '🔑 مسؤول', desc: 'صلاحيات كاملة' },
]

export default function WorldsPage() {
  const { activeWorldId, activeWorldOwnerId, setActiveWorldOwner } = useApp()
  const [myWorlds, setMyWorlds] = useState<World[]>([])
  const [joinedWorlds, setJoinedWorlds] = useState<JoinedWorld[]>([])
  const [members, setMembers] = useState<Record<string, WorldMember[]>>({})
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [inviteModal, setInviteModal] = useState<string | null>(null)
  const [membersModal, setMembersModal] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [form, setForm] = useState({ name: '', description: '', type: 'personal', cover_emoji: '🌍' })
  const [inviteMethod, setInviteMethod] = useState<'email' | 'link' | 'phone'>('link')
  const [inviteForm, setInviteForm] = useState({ email: '', phone: '', role: 'editor' })
  const [saving, setSaving] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ link: string; whatsapp: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { loadWorlds() }, [])

  const loadWorlds = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // My own worlds
    const { data: owned } = await supabase.from('worlds').select('*').eq('owner_id', user.id).order('created_at')
    setMyWorlds(owned || [])

    // Worlds I joined (not mine)
    const { data: joined } = await supabase
      .from('world_members')
      .select('world_id, role, worlds(*)')
      .eq('user_id', user.id)
    // Filter out worlds I own
    const filtered = (joined || []).filter(
      (j: any) => j.worlds && j.worlds.owner_id !== user.id
    )
    setJoinedWorlds(filtered as JoinedWorld[])

    // Load members for my worlds
    for (const w of owned || []) {
      const { data: mems } = await supabase
        .from('world_members')
        .select('*, profiles(full_name, avatar_url)')
        .eq('world_id', w.id)
      setMembers(prev => ({ ...prev, [w.id]: mems || [] }))
    }

    setLoading(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await supabase.from('worlds').insert({
      name: form.name, description: form.description || null,
      type: form.type, cover_emoji: form.cover_emoji, owner_id: userId
    })
    setModalOpen(false); setSaving(false); loadWorlds()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا العالم؟')) return
    await supabase.from('worlds').delete().eq('id', id)
    if (activeWorldId === id) setActiveWorldOwner(null, null)
    loadWorlds()
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteModal) return
    setSaving(true)

    const { data: inv } = await supabase.from('partner_invitations').insert({
      sender_id: userId, world_id: inviteModal,
      email: inviteForm.email || `phone:${inviteForm.phone}`,
      role: inviteForm.role,
    }).select().single()

    if (inv) {
      const baseUrl = window.location.origin
      const link = `${baseUrl}/invite/${inv.token}`
      const worldName = myWorlds.find(w => w.id === inviteModal)?.name || 'عالمنا'
      const whatsappMsg = encodeURIComponent(`💕 دعوة للانضمام إلى "${worldName}" في Our Love Universe\n\nاضغط الرابط:\n${link}`)
      const whatsappUrl = inviteForm.phone
        ? `https://wa.me/${inviteForm.phone.replace(/[^0-9]/g, '')}?text=${whatsappMsg}`
        : `https://wa.me/?text=${whatsappMsg}`
      setInviteResult({ link, whatsapp: whatsappUrl })
    }
    setSaving(false)
  }

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRemoveMember = async (memberId: string, worldId: string) => {
    if (!confirm('إزالة هذا العضو؟')) return
    await supabase.from('world_members').delete().eq('id', memberId)
    setMembers(prev => ({ ...prev, [worldId]: prev[worldId]?.filter(m => m.id !== memberId) || [] }))
  }

  const activateWorld = (worldId: string, ownerId: string) => {
    if (activeWorldId === worldId) {
      setActiveWorldOwner(null, null)
    } else {
      setActiveWorldOwner(worldId, ownerId)
    }
  }

  const allWorlds = [
    ...myWorlds.map(w => ({ ...w, isOwner: true, myRole: 'admin' })),
    ...joinedWorlds.map(j => ({ ...j.worlds, isOwner: false, myRole: j.role })),
  ]

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text flex items-center gap-2"><FiGlobe /> العوالم</h1>
              <p className="text-gray-400 text-sm mt-1">عوالمك وعوالم من دعوتك 🌍</p>
            </div>
            <button
              onClick={() => { setForm({ name: '', description: '', type: 'personal', cover_emoji: '🌍' }); setModalOpen(true) }}
              className="btn-primary flex items-center gap-2">
              <FiPlus /> عالم جديد
            </button>
          </div>

          {/* Active world banner */}
          {activeWorldId && (
            <div className="mb-5 p-4 rounded-2xl flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
              <div className="flex items-center gap-3">
                <FiCheckCircle style={{ color: 'var(--primary)' }} />
                <div>
                  <p className="font-semibold text-sm gradient-text">
                    {allWorlds.find(w => w.id === activeWorldId)?.name}
                  </p>
                  {activeWorldOwnerId && activeWorldOwnerId !== userId && (
                    <p className="text-xs text-gray-400">أنت تشاهد محتوى صاحب هذا العالم</p>
                  )}
                </div>
              </div>
              <button onClick={() => setActiveWorldOwner(null, null)} className="text-sm text-gray-500 hover:text-red-400 underline">إلغاء</button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="stat-card h-40 animate-pulse bg-gray-50" />)}
            </div>
          ) : allWorlds.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-6xl mb-4">🌍</p>
              <p className="text-xl font-semibold text-gray-700 mb-2">لا توجد عوالم بعد</p>
              <button onClick={() => setModalOpen(true)} className="btn-primary inline-flex items-center gap-2 mt-3">
                <FiPlus /> إنشاء عالم
              </button>
            </div>
          ) : (
            <>
              {/* My Worlds */}
              {myWorlds.length > 0 && (
                <>
                  <h2 className="font-bold text-gray-600 dark:text-gray-300 text-sm mb-3 flex items-center gap-2">
                    <FiUser size={13} /> عوالمي
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {myWorlds.map(w => {
                      const typeInfo = worldTypes.find(t => t.value === w.type)!
                      const worldMembers = members[w.id] || []
                      const isActive = activeWorldId === w.id
                      return (
                        <div key={w.id} className={`memory-card relative group ${isActive ? 'ring-2 ring-pink-400' : ''}`}>
                          {isActive && <div className="absolute top-3 left-3"><span className="badge badge-pink text-xs">نشط</span></div>}
                          <div className="flex items-start gap-3 mb-3">
                            <span className="text-4xl">{w.cover_emoji}</span>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800 dark:text-white">{w.name}</h3>
                              <p className="text-xs text-gray-400">{typeInfo.label}</p>
                              {w.description && <p className="text-sm text-gray-500 mt-1">{w.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <FiUsers size={13} className="text-gray-400" />
                            <span className="text-xs text-gray-400">{worldMembers.length} عضو</span>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <button onClick={() => activateWorld(w.id, w.owner_id)}
                              className="flex-1 py-1.5 rounded-xl text-xs font-semibold text-white transition-all"
                              style={{ background: isActive ? '#9ca3af' : 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                              {isActive ? 'إلغاء' : 'تفعيل'}
                            </button>
                            <button
                              onClick={() => { setInviteModal(w.id); setInviteResult(null); setInviteForm({ email: '', phone: '', role: 'editor' }) }}
                              className="flex-1 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all"
                              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                              <FiMail className="inline ml-1" size={11} /> دعوة
                            </button>
                            <button onClick={() => setMembersModal(w.id)}
                              className="px-3 py-1.5 rounded-xl text-xs border-2 border-gray-200 text-gray-500 hover:bg-gray-50">
                              <FiUsers size={11} />
                            </button>
                            <button onClick={() => handleDelete(w.id)}
                              className="px-3 py-1.5 rounded-xl text-xs bg-red-50 text-red-400 hover:bg-red-100">
                              <FiTrash2 size={11} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Joined Worlds */}
              {joinedWorlds.length > 0 && (
                <>
                  <h2 className="font-bold text-gray-600 dark:text-gray-300 text-sm mb-3 flex items-center gap-2">
                    <FiHeart size={13} style={{ color: 'var(--primary)' }} /> عوالم انضممت إليها
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {joinedWorlds.map(j => {
                      const w = j.worlds
                      const typeInfo = worldTypes.find(t => t.value === w.type)!
                      const isActive = activeWorldId === w.id
                      return (
                        <div key={w.id} className={`memory-card relative border-2 ${isActive ? 'border-pink-400' : 'border-purple-100'}`}>
                          {isActive && <div className="absolute top-3 left-3"><span className="badge badge-pink text-xs">نشط</span></div>}
                          <div className="absolute top-3 right-3">
                            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                              {roles.find(r => r.value === j.role)?.label}
                            </span>
                          </div>
                          <div className="flex items-start gap-3 mb-3 mt-6">
                            <span className="text-4xl">{w.cover_emoji}</span>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800 dark:text-white">{w.name}</h3>
                              <p className="text-xs text-gray-400">{typeInfo.label}</p>
                              {w.description && <p className="text-sm text-gray-500 mt-1">{w.description}</p>}
                            </div>
                          </div>
                          <button onClick={() => activateWorld(w.id, w.owner_id)}
                            className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
                            style={{ background: isActive ? '#9ca3af' : 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                            <FiEye size={13} />
                            {isActive ? 'إلغاء التفعيل' : 'عرض محتوى العالم'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Create World Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="إنشاء عالم جديد 🌍">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم العالم *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="input-field" placeholder="مثال: عالمنا الخاص" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع العالم</label>
            <div className="grid grid-cols-3 gap-2">
              {worldTypes.map(t => (
                <button key={t.value} type="button"
                  onClick={() => setForm({ ...form, type: t.value, cover_emoji: t.emoji })}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${form.type === t.value ? 'border-pink-400 bg-pink-50' : 'border-gray-100'}`}>
                  <p className="text-2xl mb-1">{t.emoji}</p>
                  <p className="text-xs font-medium">{t.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف (اختياري)</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field" placeholder="وصف قصير" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'جاري...' : 'إنشاء'}</button>
            <button type="button" onClick={() => setModalOpen(false)}
              className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-500">إلغاء</button>
          </div>
        </form>
      </Modal>

      {/* Invite Modal */}
      <Modal isOpen={!!inviteModal} onClose={() => { setInviteModal(null); setInviteResult(null) }} title="دعوة شريك 💌">
        {inviteResult ? (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-4xl mb-2">🎉</p>
              <p className="font-bold text-gray-800">تم إنشاء رابط الدعوة!</p>
              <p className="text-xs text-gray-400 mt-1">شارك الرابط ده مع شريكك</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">🔗 رابط الدعوة</label>
              <div className="flex gap-2">
                <input readOnly value={inviteResult.link} className="input-field text-sm flex-1" />
                <button onClick={() => copyLink(inviteResult.link)}
                  className="btn-primary px-4 flex items-center gap-1 whitespace-nowrap text-sm">
                  {copied ? <FiCheckCircle size={14} /> : <FiCopy size={14} />}
                  {copied ? 'تم!' : 'نسخ'}
                </button>
              </div>
            </div>
            <a href={inviteResult.whatsapp} target="_blank" rel="noopener noreferrer"
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
              <span className="text-lg">📱</span> إرسال عبر واتساب
            </a>
            <button onClick={() => { setInviteModal(null); setInviteResult(null) }}
              className="w-full py-3 rounded-xl border-2 border-gray-100 text-gray-500 text-sm">إغلاق</button>
          </div>
        ) : (
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">طريقة الدعوة</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'link',  l: '🔗 رابط' },
                  { v: 'email', l: '📧 بريد' },
                  { v: 'phone', l: '📱 هاتف' },
                ].map(m => (
                  <button key={m.v} type="button" onClick={() => setInviteMethod(m.v as any)}
                    className={`p-2.5 rounded-xl border-2 text-center text-xs font-medium transition-all ${inviteMethod === m.v ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-100 text-gray-500'}`}>
                    {m.l}
                  </button>
                ))}
              </div>
            </div>
            {inviteMethod === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input type="email" value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="input-field" placeholder="example@email.com" required />
              </div>
            )}
            {inviteMethod === 'phone' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الواتساب</label>
                <input type="tel" value={inviteForm.phone}
                  onChange={e => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  className="input-field" placeholder="مثال: 201012345678+" />
              </div>
            )}
            {inviteMethod === 'link' && (
              <p className="text-sm text-gray-500 bg-blue-50 rounded-xl p-3 text-center">
                🔗 سيتم إنشاء رابط يمكنك مشاركته بأي طريقة
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الدور</label>
              <div className="space-y-2">
                {roles.map(r => (
                  <label key={r.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${inviteForm.role === r.value ? 'border-pink-400 bg-pink-50' : 'border-gray-100'}`}>
                    <input type="radio" name="role" value={r.value} checked={inviteForm.role === r.value}
                      onChange={() => setInviteForm({ ...inviteForm, role: r.value })} className="hidden" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{r.label}</p>
                      <p className="text-xs text-gray-400">{r.desc}</p>
                    </div>
                    {inviteForm.role === r.value && <FiCheckCircle style={{ color: 'var(--primary)' }} />}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? 'جاري...' : <><FiLink size={14} /> إنشاء الدعوة</>}
              </button>
              <button type="button" onClick={() => setInviteModal(null)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-100 text-gray-500">إلغاء</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Members Modal */}
      <Modal isOpen={!!membersModal} onClose={() => setMembersModal(null)} title="أعضاء العالم 👥">
        {membersModal && (
          <div className="space-y-3">
            {(members[membersModal] || []).length === 0 ? (
              <p className="text-center text-gray-400 py-6">لا يوجد أعضاء بعد — أرسل دعوة!</p>
            ) : (
              (members[membersModal] || []).map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
                      {m.profiles?.avatar_url
                        ? <img src={m.profiles.avatar_url} className="w-full h-full object-cover" alt="" />
                        : <FiUser className="text-white" size={14} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{m.profiles?.full_name || 'مستخدم'}</p>
                      <span className="text-xs text-gray-400">{roles.find(r => r.value === m.role)?.label}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveMember(m.id, membersModal)}
                    className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                    <FiTrash2 size={13} />
                  </button>
                </div>
              ))
            )}
            <button onClick={() => setMembersModal(null)} className="btn-primary w-full mt-2">إغلاق</button>
          </div>
        )}
      </Modal>
    </AuthGuard>
  )
}
