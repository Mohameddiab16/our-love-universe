'use client'

import { useEffect, useRef, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { themes } from '@/lib/themes'
import { FiSettings, FiLogOut, FiMoon, FiSun, FiGlobe, FiDownload, FiAlertTriangle, FiCheck, FiMusic, FiImage, FiTrash2 } from 'react-icons/fi'

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme, darkMode, setDarkMode, lang, setLang } = useApp()
  const musicRef = useRef<HTMLInputElement>(null)
  const bgRef = useRef<HTMLInputElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [userId, setUserId] = useState('')
  const [musicName, setMusicName] = useState('')
  const [currentMusic, setCurrentMusic] = useState<string | null>(null)
  const [currentBg, setCurrentBg] = useState<string | null>(null)
  const [uploadingMusic, setUploadingMusic] = useState(false)
  const [uploadingBg, setUploadingBg] = useState(false)
  const [musicMsg, setMusicMsg] = useState('')
  const [bgMsg, setBgMsg] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('profiles').select('music_url, music_name, background_url').eq('id', user.id).single().then(({ data }) => {
        setCurrentMusic(data?.music_url || null)
        setMusicName(data?.music_name || '')
        setCurrentBg(data?.background_url || null)
      })
    })
  }, [])

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploadingMusic(true)
    setMusicMsg('')
    const ext = file.name.split('.').pop()
    const path = `music/${userId}.${ext}`
    const { error } = await supabase.storage.from('love-media').upload(path, file, { upsert: true })
    if (error) { setMusicMsg('❌ خطأ في الرفع'); setUploadingMusic(false); return }
    const { data } = supabase.storage.from('love-media').getPublicUrl(path)
    const name = musicName || file.name.replace(/\.[^/.]+$/, '')
    await supabase.from('profiles').update({ music_url: data.publicUrl, music_name: name }).eq('id', userId)
    setCurrentMusic(data.publicUrl)
    setMusicMsg('✅ تم رفع الأغنية! ستعزف تلقائياً')
    setUploadingMusic(false)
  }

  const handleRemoveMusic = async () => {
    await supabase.from('profiles').update({ music_url: null, music_name: null }).eq('id', userId)
    setCurrentMusic(null)
    setMusicMsg('تم حذف الأغنية')
  }

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploadingBg(true)
    setBgMsg('')
    const ext = file.name.split('.').pop()
    const path = `backgrounds/${userId}.${ext}`
    const { error } = await supabase.storage.from('love-media').upload(path, file, { upsert: true })
    if (error) { setBgMsg('❌ خطأ في الرفع'); setUploadingBg(false); return }
    const { data } = supabase.storage.from('love-media').getPublicUrl(path)
    await supabase.from('profiles').update({ background_url: data.publicUrl }).eq('id', userId)
    setCurrentBg(data.publicUrl)
    setBgMsg('✅ تم رفع الخلفية!')
    setUploadingBg(false)
  }

  const handleRemoveBg = async () => {
    await supabase.from('profiles').update({ background_url: null }).eq('id', userId)
    setCurrentBg(null)
    setBgMsg('تم حذف الخلفية')
  }

  const handleLogout = async () => { await signOut(); router.push('/auth') }

  const handleExportData = async () => {
    const [{ data: memories }, { data: messages }, { data: occasions }] = await Promise.all([
      supabase.from('memories').select('*').eq('user_id', userId),
      supabase.from('messages').select('*').eq('user_id', userId),
      supabase.from('occasions').select('*').eq('user_id', userId),
    ])
    const blob = new Blob([JSON.stringify({ memories, messages, occasions, exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `our-love-universe-${new Date().toISOString().split('T')[0]}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const handleDeleteData = async () => {
    await Promise.all([
      supabase.from('memories').delete().eq('user_id', userId),
      supabase.from('messages').delete().eq('user_id', userId),
      supabase.from('occasions').delete().eq('user_id', userId),
    ])
    setConfirmDelete(false)
    alert('تم حذف جميع البيانات.')
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8 animate-fadeIn">
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-1"><FiSettings /> الإعدادات</h1>
            <p className="text-gray-400 text-sm">تخصيص تجربتك في عالمنا ⚙️</p>
          </div>

          <div className="max-w-lg space-y-5">
            {/* Music */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FiMusic style={{ color: 'var(--primary)' }} /> أغنيتنا 🎵
              </h2>
              {currentMusic && (
                <div className="flex items-center gap-3 p-3 rounded-xl mb-4"
                  style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
                  <span className="text-2xl">🎵</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{musicName || 'الأغنية الحالية'}</p>
                    <p className="text-xs text-green-500">✅ تعزف تلقائياً عند الدخول</p>
                  </div>
                  <button onClick={handleRemoveMusic} className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400">
                    <FiTrash2 size={13} />
                  </button>
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">اسم الأغنية (اختياري)</label>
                  <input type="text" value={musicName} onChange={e => setMusicName(e.target.value)}
                    className="input-field" placeholder="مثال: أغنيتنا المفضلة 💕" />
                </div>
                <input ref={musicRef} type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
                <button onClick={() => musicRef.current?.click()} disabled={uploadingMusic}
                  className="btn-primary w-full flex items-center justify-center gap-2">
                  <FiMusic size={14} />
                  {uploadingMusic ? 'جاري الرفع...' : currentMusic ? 'تغيير الأغنية' : 'رفع أغنية (MP3)'}
                </button>
                {musicMsg && <p className="text-sm text-center text-gray-500">{musicMsg}</p>}
                <p className="text-xs text-gray-400 text-center">الأغنية ستعزف تلقائياً لك ولشريكك عند فتح الموقع 🎶</p>
              </div>
            </div>

            {/* Background */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <FiImage style={{ color: 'var(--primary)' }} /> خلفية الموقع 🖼️
              </h2>
              {currentBg && (
                <div className="relative rounded-xl overflow-hidden mb-4 h-28">
                  <img src={currentBg} alt="bg" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <button onClick={handleRemoveBg}
                      className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs flex items-center gap-1">
                      <FiTrash2 size={12} /> حذف الخلفية
                    </button>
                  </div>
                </div>
              )}
              <input ref={bgRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
              <button onClick={() => bgRef.current?.click()} disabled={uploadingBg}
                className="btn-primary w-full flex items-center justify-center gap-2">
                <FiImage size={14} />
                {uploadingBg ? 'جاري الرفع...' : currentBg ? 'تغيير الخلفية' : 'رفع صورة خلفية'}
              </button>
              {bgMsg && <p className="text-sm text-center text-gray-500 mt-2">{bgMsg}</p>}
              <p className="text-xs text-gray-400 text-center mt-2">ستظهر الصورة خلفية شفافة لكل صفحات الموقع 🌸</p>
            </div>

            {/* Themes */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="font-bold text-gray-800 dark:text-white mb-4">🎨 المظهر</h2>
              <div className="grid grid-cols-4 gap-3">
                {themes.map(t => (
                  <button key={t.name} onClick={() => setTheme(t.name)}
                    className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${theme === t.name ? 'shadow-md' : 'border-gray-100 hover:border-gray-200'}`}
                    style={theme === t.name ? { borderColor: t.primary } : {}}>
                    <div className="w-8 h-8 rounded-full shadow-sm" style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }} />
                    <span className="text-xs text-gray-600 dark:text-gray-300">{t.emoji} {t.label}</span>
                    {theme === t.name && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: t.primary }}>
                        <FiCheck className="text-white" size={10} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Dark Mode */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <FiMoon style={{ color: 'var(--primary)' }} size={20} /> : <FiSun style={{ color: 'var(--primary)' }} size={20} />}
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">الوضع المظلم</p>
                    <p className="text-xs text-gray-400">{darkMode ? 'مفعّل' : 'معطّل'}</p>
                  </div>
                </div>
                <button onClick={() => setDarkMode(!darkMode)}
                  className="relative w-12 h-6 rounded-full transition-all"
                  style={{ background: darkMode ? 'var(--primary)' : '#e5e7eb' }}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${darkMode ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <FiGlobe style={{ color: 'var(--primary)' }} />
                <h2 className="font-semibold text-gray-800 dark:text-white">اللغة / Language</h2>
              </div>
              <div className="flex gap-3">
                {[{ val: 'ar', label: '🇸🇦 العربية' }, { val: 'en', label: '🇬🇧 English' }].map(l => (
                  <button key={l.val} onClick={() => setLang(l.val as any)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${lang === l.val ? 'text-white border-transparent' : 'border-gray-100 text-gray-500'}`}
                    style={lang === l.val ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Backup */}
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                <FiDownload style={{ color: 'var(--primary)' }} /> النسخ الاحتياطي
              </h2>
              <button onClick={handleExportData}
                className="w-full py-3 rounded-xl border-2 text-sm font-medium flex items-center justify-center gap-2 transition-all hover:shadow-md"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                <FiDownload size={14} /> تحميل نسخة احتياطية (JSON)
              </button>
            </div>

            {/* Danger Zone */}
            <div className="glass-card rounded-2xl p-5 border border-red-100">
              <h2 className="font-semibold text-red-500 mb-4 flex items-center gap-2"><FiAlertTriangle /> المنطقة الحساسة</h2>
              <div className="space-y-3">
                <button onClick={handleLogout}
                  className="w-full py-3 rounded-xl border-2 border-red-200 text-red-400 hover:bg-red-50 transition-all flex items-center justify-center gap-2 text-sm font-medium">
                  <FiLogOut /> تسجيل الخروج
                </button>
                {!confirmDelete ? (
                  <button onClick={() => setConfirmDelete(true)}
                    className="w-full py-3 rounded-xl border-2 border-red-100 text-red-300 hover:bg-red-50 transition-all text-sm">
                    حذف جميع البيانات
                  </button>
                ) : (
                  <div className="bg-red-50 rounded-2xl p-4 border border-red-200">
                    <p className="text-red-700 text-sm font-medium mb-3 text-center">⚠️ لا يمكن التراجع عن هذا!</p>
                    <div className="flex gap-2">
                      <button onClick={handleDeleteData} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-medium">نعم، احذف</button>
                      <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm">إلغاء</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 py-2">Our Love Universe 💕 — v2.0</p>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
