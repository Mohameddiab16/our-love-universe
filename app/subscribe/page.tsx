'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FiCheckCircle, FiCreditCard, FiHeart, FiLogOut } from 'react-icons/fi'

const plans = [
  {
    id: 'solo',
    name: 'فردي',
    icon: '👤',
    price: '$10',
    period: 'سنوياً',
    color: 'from-blue-400 to-indigo-500',
    border: 'border-blue-200',
    features: ['ذكريات غير محدودة', 'رسائل الحب', 'تحديات يومية', 'إحصائيات متقدمة', 'أفكار تواريخ', 'اختبار التوافق'],
  },
  {
    id: 'couple',
    name: 'ثنائي',
    icon: '💑',
    price: '$20',
    period: 'سنوياً',
    color: 'from-pink-400 to-rose-500',
    border: 'border-pink-300',
    badge: '⭐ الأكثر شيوعاً',
    features: ['كل مزايا الفردي', 'عالم ثنائي مشترك', 'دعوة شريكك', 'رسائل وذكريات مشتركة', 'مناسبات مشتركة'],
  },
  {
    id: 'family',
    name: 'عائلي',
    icon: '👨‍👩‍👧‍👦',
    price: '$50',
    period: 'سنوياً',
    color: 'from-purple-400 to-violet-500',
    border: 'border-purple-200',
    features: ['كل مزايا الثنائي', 'عالم عائلي حتى 6 أفراد', 'إدارة الصلاحيات', 'نسخ احتياطية PDF', 'دعم أولوي'],
  },
]

export default function SubscribePage() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [selected, setSelected] = useState('couple')
  const canceled = params.get('canceled') === '1'

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth'); return }
      setUser(session.user)

      // Check if already subscribed — skip paywall
      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('plan, expires_at')
        .eq('user_id', session.user.id)
        .single()

      if (sub && sub.plan && sub.plan !== 'free') {
        const valid = !sub.expires_at || new Date(sub.expires_at) > new Date()
        if (valid) { router.replace('/'); return }
      }

      // Admin bypass
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()
      if (profile?.is_admin) { router.replace('/'); return }

      setLoading(false)
    })
  }, [router])

  const handleCheckout = async (planId: string) => {
    if (!user) return
    setCheckoutLoading(planId)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, userId: user.id, userEmail: user.email }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else { alert('حدث خطأ، حاول مرة أخرى'); setCheckoutLoading(null) }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">💕</div>
          <p className="gradient-text font-bold text-lg">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-10"
      style={{ background: 'linear-gradient(135deg, #fff0f6 0%, #f5f0ff 100%)' }}>

      {/* Floating hearts */}
      <div className="fixed top-10 right-10 text-5xl opacity-10 animate-pulse pointer-events-none">💕</div>
      <div className="fixed bottom-10 left-10 text-4xl opacity-10 animate-pulse pointer-events-none">🌙</div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          <FiHeart className="text-white text-2xl" />
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Our Love Universe</h1>
        <p className="text-gray-500 text-sm">اختر خطتك وابدأ رحلتك المميزة</p>

        {/* Trial Banner */}
        <div className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold shadow"
          style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44dff)', color: '#fff' }}>
          🎉 شهر أول مجاناً — يتخصم السعر بعد 30 يوم
        </div>
      </div>

      {canceled && (
        <div className="mb-6 max-w-md w-full bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-center text-sm">
          ⚠️ لم يتم إتمام الدفع. يرجى اختيار خطة للمتابعة.
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full mb-8">
        {plans.map(p => (
          <div
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`relative rounded-3xl p-6 cursor-pointer transition-all flex flex-col border-2 ${
              selected === p.id
                ? `${p.border} shadow-xl scale-105 bg-white`
                : 'border-transparent bg-white/70 shadow hover:shadow-md'
            }`}
          >
            {p.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-xs font-bold px-3 py-1 rounded-full text-white shadow"
                  style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                  {p.badge}
                </span>
              </div>
            )}

            {selected === p.id && (
              <div className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                <FiCheckCircle className="text-white" size={14} />
              </div>
            )}

            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-3xl mb-4 shadow-md`}>
              {p.icon}
            </div>

            <h3 className="font-bold text-xl text-gray-800 mb-1">{p.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold gradient-text">{p.price}</span>
              <span className="text-gray-400 text-sm"> / {p.period}</span>
            </div>

            <ul className="space-y-2 flex-1 mb-5">
              {p.features.map((f, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-green-500 flex-shrink-0">✓</span> {f}
                </li>
              ))}
            </ul>

            <button
              onClick={e => { e.stopPropagation(); handleCheckout(p.id) }}
              disabled={checkoutLoading !== null}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                selected === p.id
                  ? 'text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={selected === p.id ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
              {checkoutLoading === p.id ? (
                <><span className="animate-spin">⏳</span> جاري التحويل...</>
              ) : (
                <><FiCreditCard size={14} /> ابدأ مجاناً</>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Trust note */}
      <div className="text-center text-gray-400 text-xs max-w-sm space-y-1">
        <p>🔒 الدفع آمن ومشفر عبر Stripe</p>
        <p>لن يتم خصم أي مبلغ خلال الـ 30 يوم الأولى</p>
        <p>يمكنك الإلغاء في أي وقت قبل انتهاء الفترة التجريبية</p>
      </div>

      {/* Logout link */}
      <button onClick={handleLogout}
        className="mt-6 text-gray-400 text-xs flex items-center gap-1 hover:text-gray-600 transition-colors">
        <FiLogOut size={12} /> تسجيل الخروج
      </button>
    </div>
  )
}
