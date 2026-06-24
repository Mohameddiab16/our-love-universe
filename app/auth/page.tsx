'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FiHeart, FiMail, FiLock, FiUser, FiPhone, FiEye, FiEyeOff, FiCamera, FiCheckCircle } from 'react-icons/fi'

type Step = 'form' | 'verify'

export default function AuthPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isLogin, setIsLogin] = useState(true)
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatar) return null
    const ext = avatar.name.split('.').pop()
    const path = `avatars/${userId}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, avatar, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (error) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      } else {
        router.push('/')
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name, phone: form.phone },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) {
        setError(error.message.includes('already') ? 'هذا البريد مسجل مسبقاً' : 'حدث خطأ، تحقق من البيانات')
      } else if (data.user) {
        // Upload avatar if provided
        if (avatar) {
          const avatarUrl = await uploadAvatar(data.user.id)
          if (avatarUrl) {
            await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } })
            await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', data.user.id)
          }
        }
        // Update phone in profile
        if (form.phone) {
          await supabase.from('profiles').update({ phone: form.phone, full_name: form.name }).eq('id', data.user.id)
        }
        setStep('verify')
      }
    }
    setLoading(false)
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center glass-card rounded-3xl p-10">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <FiCheckCircle className="text-green-500 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">تحقق من بريدك! 📧</h2>
          <p className="text-gray-500 mb-2">
            أرسلنا رسالة تأكيد إلى:
          </p>
          <p className="font-bold text-gray-800 mb-5 bg-pink-50 py-2 px-4 rounded-xl inline-block">{form.email}</p>
          <p className="text-gray-500 text-sm mb-6">
            افتح بريدك الإلكتروني واضغط على رابط التأكيد لتفعيل حسابك ثم عد للدخول
          </p>
          <button
            onClick={() => { setStep('form'); setIsLogin(true) }}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <FiHeart /> العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-10 right-10 text-6xl opacity-10 animate-float">💕</div>
      <div className="absolute bottom-10 left-10 text-5xl opacity-10 animate-float" style={{ animationDelay: '1s' }}>🌙</div>
      <div className="absolute top-1/3 left-8 text-4xl opacity-10 animate-float" style={{ animationDelay: '2s' }}>⭐</div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xl"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
            <FiHeart className="text-white text-4xl" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-1">Our Love Universe</h1>
          <p className="text-gray-400 text-sm">عالمنا الخاص المليء بالحب 💕</p>
        </div>

        <div className="glass-card rounded-3xl p-7">
          {/* Tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
            {[{ val: true, label: 'تسجيل الدخول' }, { val: false, label: 'إنشاء حساب' }].map(tab => (
              <button key={String(tab.val)}
                onClick={() => { setIsLogin(tab.val); setError('') }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  isLogin === tab.val
                    ? 'text-white shadow-md'
                    : 'text-gray-500'
                }`}
                style={isLogin === tab.val ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Upload (signup only) */}
            {!isLogin && (
              <div className="flex flex-col items-center gap-2 mb-2">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-20 h-20 rounded-full border-4 border-dashed cursor-pointer flex items-center justify-center overflow-hidden transition-all hover:opacity-80"
                  style={{ borderColor: 'var(--primary)' }}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <FiCamera className="text-3xl" style={{ color: 'var(--primary)' }} />
                  )}
                </div>
                <p className="text-xs text-gray-400">صورة الملف الشخصي (اختياري)</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
            )}

            {!isLogin && (
              <div className="relative">
                <FiUser className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
                <input type="text" placeholder="الاسم الكامل" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input-field pr-10" required />
              </div>
            )}

            <div className="relative">
              <FiMail className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
              <input type="email" placeholder="البريد الإلكتروني" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field pr-10" required />
            </div>

            {!isLogin && (
              <div className="relative">
                <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
                <input type="tel" placeholder="رقم الهاتف (اختياري)" value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="input-field pr-10" />
              </div>
            )}

            <div className="relative">
              <FiLock className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--primary)' }} />
              <input type={showPass ? 'text' : 'password'} placeholder="كلمة المرور"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field pr-10 pl-10" required minLength={6} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>

            {!isLogin && (
              <p className="text-xs text-gray-400 bg-blue-50 rounded-xl p-3 text-center">
                📧 بعد إنشاء الحساب، ستصلك رسالة تأكيد على بريدك الإلكتروني
              </p>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm text-center">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? '⏳ جاري...' : <><FiHeart /> {isLogin ? 'دخول إلى عالمنا' : 'إنشاء حسابي'}</>}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            {isLogin ? 'ليس لديك حساب؟ ' : 'لديك حساب؟ '}
            <button onClick={() => { setIsLogin(!isLogin); setError('') }}
              className="font-semibold hover:underline" style={{ color: 'var(--primary)' }}>
              {isLogin ? 'أنشئ حساباً' : 'سجل دخولك'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
