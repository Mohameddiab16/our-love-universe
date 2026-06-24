'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { FiCheckCircle, FiCreditCard, FiTag, FiZap } from 'react-icons/fi'

const plans = [
  {
    id: 'free',
    name: 'مجاني 🌟',
    price: 0,
    priceLabel: 'مجاناً',
    color: 'from-gray-400 to-gray-600',
    features: [
      '✅ ذكريات غير محدودة',
      '✅ رسائل الحب',
      '✅ المناسبات الأساسية',
      '✅ الخط الزمني',
      '❌ عالم ثنائي',
      '❌ دعوة شريك',
      '❌ تحديات يومية',
      '❌ إحصائيات متقدمة',
    ],
  },
  {
    id: 'couple',
    name: 'ثنائي 💑',
    price: 3.99,
    priceLabel: '$3.99 / شهر',
    color: 'from-pink-400 to-rose-600',
    badge: 'الأكثر شيوعاً',
    features: [
      '✅ كل مزايا المجاني',
      '✅ عالم ثنائي مشترك',
      '✅ دعوة شريكك',
      '✅ تحديات يومية',
      '✅ إحصائيات متقدمة',
      '✅ أفكار تواريخ',
      '✅ اختبار التوافق',
      '❌ عالم عائلي',
    ],
  },
  {
    id: 'family',
    name: 'عائلي 👨‍👩‍👧‍👦',
    price: 5.99,
    priceLabel: '$5.99 / شهر',
    color: 'from-purple-400 to-violet-600',
    features: [
      '✅ كل مزايا الثنائي',
      '✅ عالم عائلي (حتى 6 أفراد)',
      '✅ إدارة صلاحيات الأعضاء',
      '✅ مشاركة حية للذكريات',
      '✅ نسخ احتياطية PDF',
      '✅ دعم أولوي',
      '✅ مظاهر حصرية',
      '✅ إحصائيات العائلة',
    ],
  },
]

export default function SubscriptionPage() {
  const { plan, setPlan } = useApp()
  const [current, setCurrent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [promoCode, setPromoCode] = useState('')
  const [promoStatus, setPromoStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [promoMsg, setPromoMsg] = useState('')
  const [applying, setApplying] = useState(false)

  useEffect(() => { loadSubscription() }, [])

  const loadSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('user_subscriptions').select('*').eq('user_id', user.id).single()
    if (data) {
      setCurrent(data)
      setPlan(data.plan as any)
    }
    setLoading(false)
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setApplying(true)
    setPromoStatus('idle')

    const { data: codeData, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .eq('is_active', true)
      .single()

    if (error || !codeData) {
      setPromoStatus('error')
      setPromoMsg('هذا الكود غير صالح أو منتهي الصلاحية')
      setApplying(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if already used
    const { data: used } = await supabase.from('promo_code_uses')
      .select('id').eq('code_id', codeData.id).eq('user_id', user.id).single()
    if (used) {
      setPromoStatus('error')
      setPromoMsg('لقد استخدمت هذا الكود من قبل')
      setApplying(false)
      return
    }

    // Apply
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + codeData.free_days)

    await Promise.all([
      supabase.from('user_subscriptions').upsert({
        user_id: user.id, plan: codeData.plan,
        expires_at: expiresAt.toISOString(), promo_code: promoCode.toUpperCase(),
      }, { onConflict: 'user_id' }),
      supabase.from('promo_code_uses').insert({ code_id: codeData.id, user_id: user.id }),
      supabase.from('promo_codes').update({ current_uses: (codeData.current_uses || 0) + 1 }).eq('id', codeData.id),
    ])

    setPromoStatus('success')
    setPromoMsg(`🎉 تم تفعيل خطة ${codeData.plan === 'couple' ? 'الثنائي' : 'العائلي'} لمدة ${codeData.free_days} يوم مجاناً!`)
    setPlan(codeData.plan as any)
    loadSubscription()
    setApplying(false)
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8 animate-fadeIn">
          <div className="mb-7">
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-1">
              <FiCreditCard /> خطط الاشتراك
            </h1>
            <p className="text-gray-400 text-sm">اختر الخطة المناسبة لك ولأحبائك 💕</p>
          </div>

          {/* Current Plan */}
          {!loading && current && (
            <div className="glass-card rounded-2xl p-5 mb-7 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
                {plan === 'free' ? '🌟' : plan === 'couple' ? '💑' : '👨‍👩‍👧‍👦'}
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-white">
                  خطتك الحالية: <span className="gradient-text capitalize">
                    {plan === 'free' ? 'مجاني' : plan === 'couple' ? 'ثنائي' : 'عائلي'}
                  </span>
                </p>
                {current.expires_at && (
                  <p className="text-sm text-gray-400">
                    تنتهي في: {new Date(current.expires_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {plans.map(p => (
              <div key={p.id} className={`memory-card relative flex flex-col ${plan === p.id ? 'ring-2' : ''}`}
                style={plan === p.id ? { '--tw-ring-color': 'var(--primary)' } as any : {}}>
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge badge-pink text-xs px-3 py-1">{p.badge}</span>
                  </div>
                )}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl mb-4 shadow-md`}>
                  {p.id === 'free' ? '🌟' : p.id === 'couple' ? '💑' : '👨‍👩‍👧‍👦'}
                </div>
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <p className="text-2xl font-bold gradient-text mb-4">{p.priceLabel}</p>
                <ul className="space-y-2 flex-1 mb-5">
                  {p.features.map((f, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{f}</li>
                  ))}
                </ul>
                {plan === p.id ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-600 font-semibold text-sm">
                    <FiCheckCircle /> خطتك الحالية
                  </div>
                ) : p.price === 0 ? (
                  <button className="py-3 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-500">مجاني دائماً</button>
                ) : (
                  <button
                    onClick={() => alert('سيتم ربط بوابة الدفع قريباً 🚀\nاستخدم كود ترويجي في الوقت الحالي!')}
                    className="btn-primary py-3 text-sm font-semibold">
                    الاشتراك الآن
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <div className="glass-card rounded-2xl p-6 max-w-md">
            <h2 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <FiTag style={{ color: 'var(--primary)' }} /> كود ترويجي
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="أدخل الكود (مثال: LOVE2024)"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                className="input-field flex-1"
              />
              <button onClick={handleApplyPromo} disabled={applying || !promoCode}
                className="btn-primary px-5 flex items-center gap-1 whitespace-nowrap">
                <FiZap size={14} /> تفعيل
              </button>
            </div>
            {promoStatus !== 'idle' && (
              <p className={`mt-3 text-sm p-3 rounded-xl ${promoStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {promoMsg}
              </p>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
