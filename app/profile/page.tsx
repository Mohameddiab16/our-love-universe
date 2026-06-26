'use client'

import { useEffect, useState, useRef } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import { FiUser, FiSave, FiCamera, FiLock, FiEye, FiEyeOff, FiPhone, FiCalendar } from 'react-icons/fi'

export default function ProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', phone: '', bio: '', birthday: '' })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [passMsg, setPassMsg] = useState('')
  const [passError, setPassError] = useState(false)
  const [savingPass, setSavingPass] = useState(false)

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        bio: data.bio || '',
        birthday: data.birthday || '',
      })
      setAvatarPreview(data.avatar_url || null)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let avatarUrl = profile?.avatar_url || null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      // Use the same public bucket that memory images use (avoids needing a separate bucket).
      // Cache-bust with a timestamp so the new image shows immediately.
      const path = `avatars/${user.id}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('love-media').upload(path, avatarFile, { upsert: true })
      if (upErr) {
        setSaving(false)
        alert('تعذّر رفع الصورة: ' + upErr.message)
        return
      }
      const { data } = supabase.storage.from('love-media').getPublicUrl(path)
      avatarUrl = data.publicUrl
    }

    await Promise.all([
      supabase.from('profiles').update({
        full_name: form.full_name,
        phone: form.phone || null,
        bio: form.bio || null,
        birthday: form.birthday || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id),
      supabase.auth.updateUser({ data: { full_name: form.full_name, avatar_url: avatarUrl } }),
    ])

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPassMsg('')
    if (passForm.newPass !== passForm.confirm) {
      setPassMsg('كلمتا المرور غير متطابقتين')
      setPassError(true)
      return
    }
    if (passForm.newPass.length < 6) {
      setPassMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      setPassError(true)
      return
    }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: passForm.newPass })
    setSavingPass(false)
    if (error) {
      setPassError(true)
      setPassMsg('حدث خطأ، تأكد من صحة كلمة المرور الحالية')
    } else {
      setPassError(false)
      setPassMsg('✅ تم تغيير كلمة المرور بنجاح!')
      setPassForm({ current: '', newPass: '', confirm: '' })
    }
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8 animate-fadeIn">
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-1">
              <FiUser /> ملفي الشخصي
            </h1>
            <p className="text-gray-400 text-sm">إدارة معلوماتك الشخصية 👤</p>
          </div>

          <div className="max-w-lg space-y-5">
            {/* Avatar + Info */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-bold text-gray-800 dark:text-white mb-5">الصورة الشخصية</h2>
              <div className="flex items-center gap-5 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 shadow-lg"
                    style={{ borderColor: 'var(--primary)' }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white"
                        style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
                        <FiUser size={28} />
                      </div>
                    )}
                  </div>
                  <button onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full text-white flex items-center justify-center shadow-md"
                    style={{ background: 'var(--primary)' }}>
                    <FiCamera size={13} />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white">{form.full_name || 'اسمك'}</p>
                  <p className="text-sm text-gray-400">اضغط على الصورة للتغيير</p>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الاسم الكامل</label>
                  <div className="relative">
                    <FiUser className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
                    <input type="text" value={form.full_name}
                      onChange={e => setForm({ ...form, full_name: e.target.value })}
                      className="input-field pr-10" placeholder="اسمك الكامل" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">رقم الهاتف</label>
                  <div className="relative">
                    <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
                    <input type="tel" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="input-field pr-10" placeholder="+20 01xxxxxxxxx" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">تاريخ الميلاد</label>
                  <div className="relative">
                    <FiCalendar className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
                    <input type="date" value={form.birthday}
                      onChange={e => setForm({ ...form, birthday: e.target.value })}
                      className="input-field pr-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نبذة شخصية</label>
                  <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
                    className="input-field resize-none" rows={3} placeholder="اكتب نبذة عنك..." />
                </div>
                <button type="submit" disabled={saving}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {saved ? '✅ تم الحفظ!' : saving ? '⏳ جاري الحفظ...' : <><FiSave /> حفظ التغييرات</>}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
                <FiLock style={{ color: 'var(--primary)' }} /> تغيير كلمة المرور
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {[
                  { key: 'newPass', label: 'كلمة المرور الجديدة' },
                  { key: 'confirm', label: 'تأكيد كلمة المرور الجديدة' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{f.label}</label>
                    <div className="relative">
                      <FiLock className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={passForm[f.key as keyof typeof passForm]}
                        onChange={e => setPassForm({ ...passForm, [f.key]: e.target.value })}
                        className="input-field pr-10 pl-10" required minLength={6}
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                      </button>
                    </div>
                  </div>
                ))}

                {passMsg && (
                  <p className={`text-sm p-3 rounded-xl ${passError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {passMsg}
                  </p>
                )}
                <button type="submit" disabled={savingPass}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  {savingPass ? '⏳ جاري التغيير...' : <><FiLock size={14} /> تغيير كلمة المرور</>}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
