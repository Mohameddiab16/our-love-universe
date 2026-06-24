'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { FiGift, FiFilter } from 'react-icons/fi'

const ideas = [
  { id: 1, title: 'عشاء رومانسي في المنزل', desc: 'اطبخا طبقاً جديداً معاً وزيّنا المائدة بالشموع والورود', budget: 'low', category: 'home', emoji: '🕯️', duration: '3 ساعات' },
  { id: 2, title: 'نزهة تحت النجوم', desc: 'اخرجا لمكان هادئ وتأملا النجوم معاً مع فنجان قهوة', budget: 'free', category: 'outdoor', emoji: '🌙', duration: '2 ساعات' },
  { id: 3, title: 'يوم في المتحف', desc: 'استكشفا تاريخ المدينة والفن معاً واحتفظا بذكريات', budget: 'low', category: 'culture', emoji: '🏛️', duration: 'نهار كامل' },
  { id: 4, title: 'رحلة يومية لمدينة قريبة', desc: 'اكتشفا مدينة لم تزوراها من قبل وتذوقا مطبخها', budget: 'medium', category: 'travel', emoji: '🚗', duration: 'يوم كامل' },
  { id: 5, title: 'ورشة طبخ مشتركة', desc: 'تعلّما طبخ مطبخ جديد معاً (إيطالي، ياباني، ...)', budget: 'medium', category: 'home', emoji: '👨‍🍳', duration: '2 ساعات' },
  { id: 6, title: 'نهار في الطبيعة', desc: 'رحلة إلى الغابة أو الشاطئ مع سلة نزهة رومانسية', budget: 'low', category: 'outdoor', emoji: '🌿', duration: 'نهار كامل' },
  { id: 7, title: 'ليلة أفلام مخصصة', desc: 'اختارا أفضل 3 أفلام وزيّنا الغرفة كدار سينما منزلية', budget: 'free', category: 'home', emoji: '🎬', duration: 'ليلة كاملة' },
  { id: 8, title: 'دروس رقص مشتركة', desc: 'تعلّما رقصة جديدة معاً وانسجا ذكرى لا تُنسى', budget: 'medium', category: 'activity', emoji: '💃', duration: '1.5 ساعة' },
  { id: 9, title: 'رحلة سفينة أو قارب', desc: 'جولة على الماء مع غروب الشمس وموسيقى هادئة', budget: 'high', category: 'travel', emoji: '⛵', duration: '3 ساعات' },
  { id: 10, title: 'مغامرة الغرفة المشفرة', desc: 'حلّا ألغاز Escape Room معاً وتعزيز العمل الجماعي', budget: 'medium', category: 'activity', emoji: '🔐', duration: '1 ساعة' },
  { id: 11, title: 'ليلة تنجيم وقراءة طالع', desc: 'اقرآ عن أبراجكما واستمتعا بمحادثات ممتعة', budget: 'free', category: 'home', emoji: '⭐', duration: '2 ساعات' },
  { id: 12, title: 'رحلة مفاجئة للمطار', desc: 'اخترا وجهة عشوائية ثم سافرا! مغامرة حقيقية', budget: 'high', category: 'travel', emoji: '✈️', duration: 'أيام' },
]

const budgets = [
  { value: 'all',    label: 'الكل' },
  { value: 'free',   label: '🆓 مجاني' },
  { value: 'low',    label: '💚 اقتصادي' },
  { value: 'medium', label: '💛 متوسط' },
  { value: 'high',   label: '💎 فاخر' },
]

const categories = [
  { value: 'all',      label: 'الكل' },
  { value: 'home',     label: '🏠 المنزل' },
  { value: 'outdoor',  label: '🌿 الطبيعة' },
  { value: 'travel',   label: '✈️ السفر' },
  { value: 'activity', label: '🎯 أنشطة' },
  { value: 'culture',  label: '🏛️ ثقافة' },
]

export default function DateIdeasPage() {
  const [budget, setBudget] = useState('all')
  const [category, setCategory] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = ideas.filter(i =>
    (budget === 'all' || i.budget === budget) &&
    (category === 'all' || i.category === category)
  )

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8 animate-fadeIn">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-1">
                <FiGift /> أفكار التواريخ
              </h1>
              <p className="text-gray-400 text-sm">أفكار رومانسية لقضاء وقت مميز معاً 💕</p>
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all"
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              <FiFilter size={14} /> فلتر
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="glass-card rounded-2xl p-4 mb-5 space-y-3 animate-fadeIn">
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">الميزانية</p>
                <div className="flex flex-wrap gap-2">
                  {budgets.map(b => (
                    <button key={b.value} onClick={() => setBudget(b.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${budget === b.value ? 'text-white border-transparent' : 'border-gray-100 text-gray-500'}`}
                      style={budget === b.value ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">النوع</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button key={c.value} onClick={() => setCategory(c.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${category === c.value ? 'text-white border-transparent' : 'border-gray-100 text-gray-500'}`}
                      style={category === c.value ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-400 mb-4">{filtered.length} فكرة متاحة</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(idea => (
              <div key={idea.id} className="memory-card flex flex-col group">
                <div className="text-4xl mb-3">{idea.emoji}</div>
                <h3 className="font-bold text-gray-800 dark:text-white mb-2">{idea.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">{idea.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                  <span className={`badge text-xs ${
                    idea.budget === 'free' ? 'badge-green' :
                    idea.budget === 'low' ? 'badge-blue' :
                    idea.budget === 'medium' ? 'badge-orange' : 'badge-purple'
                  }`}>
                    {budgets.find(b => b.value === idea.budget)?.label}
                  </span>
                  <span className="text-xs text-gray-400">⏱️ {idea.duration}</span>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-5xl mb-3">💝</p>
              <p className="text-gray-500">لا توجد أفكار بهذه الفلاتر، جرّب فلاتر أخرى</p>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
