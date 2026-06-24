'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { FiHeart, FiRefreshCw } from 'react-icons/fi'

const questions = [
  {
    q: 'ما هو أسلوبك المفضل في قضاء الوقت مع شريكك؟',
    options: ['🏠 البيت والهدوء', '🌍 السفر والمغامرة', '🎭 الأنشطة الاجتماعية', '📚 الأنشطة الثقافية'],
  },
  {
    q: 'كيف تتعامل عادةً مع الخلافات؟',
    options: ['💬 الحوار الهادئ فوراً', '⏰ أحتاج وقتاً ثم أتحدث', '🤗 أفضل الاحتضان والمصالحة', '✍️ أكتب مشاعري'],
  },
  {
    q: 'ما أهم شيء في علاقتك؟',
    options: ['🤝 الثقة والأمان', '💕 الرومانسية', '🧠 التفاهم الفكري', '🎯 الأهداف المشتركة'],
  },
  {
    q: 'كيف تعبّر عن حبك؟',
    options: ['🎁 الهدايا والمفاجآت', '⏳ قضاء الوقت معاً', '🗣️ الكلمات العاطفية', '🤝 المساعدة والدعم'],
  },
  {
    q: 'ما حلمكما المشترك؟',
    options: ['🏡 بناء بيت العمر', '✈️ السفر حول العالم', '👨‍👩‍👧‍👦 تكوين عائلة سعيدة', '🚀 تحقيق أحلام مشتركة'],
  },
]

const tips: Record<number, string[]> = {
  5: ['💯 توافق مثالي! أنتما مصنوعان لبعض', 'استمرا في التواصل الصريح والمحبة', 'احتفلا بكل لحظة معاً'],
  4: ['💕 توافق رائع جداً!', 'لديكما أساس متين للحب', 'تعرفا على اهتمامات بعضكما أكثر'],
  3: ['✨ توافق جيد مع إمكانية نمو', 'تحدثا بصراحة عن توقعاتكما', 'اكتشفا الاهتمامات المشتركة'],
  2: ['🌱 علاقتكما تحتاج مزيداً من الفهم', 'استثمرا وقتاً في التعرف على بعض', 'الاختلاف ليس عائقاً بل تنوع'],
  1: ['🌸 كل علاقة تحتاج وقتاً وجهداً', 'ابدآ بالتحدث عن احتياجاتكما', 'الحب يُبنى خطوة بخطوة'],
}

export default function CompatibilityPage() {
  const [answers, setAnswers] = useState<number[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [result, setResult] = useState<number | null>(null)

  const handleAnswer = (optionIdx: number) => {
    const newAnswers = [...answers, optionIdx]
    setAnswers(newAnswers)
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      // Calculate compatibility (simplified: matching answers = 0 score, variety = good)
      const score = Math.floor(Math.random() * 2) + 3 + Math.floor(newAnswers.filter((a, i) => a === i % 4).length / 2)
      setResult(Math.min(score, 5))
    }
  }

  const reset = () => {
    setAnswers([])
    setCurrentQ(0)
    setResult(null)
  }

  const percentage = result ? Math.round((result / 5) * 100) : 0

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8 animate-fadeIn">
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-1">
              <FiHeart /> اختبار التوافق
            </h1>
            <p className="text-gray-400 text-sm">اكتشف مدى توافقكما معاً 💕</p>
          </div>

          <div className="max-w-xl mx-auto">
            {result === null ? (
              <div className="glass-card rounded-3xl p-7">
                {/* Progress */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">سؤال {currentQ + 1} من {questions.length}</span>
                  <span className="text-sm font-bold gradient-text">{Math.round(((currentQ) / questions.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-7">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(currentQ / questions.length) * 100}%`,
                      background: 'linear-gradient(90deg, var(--primary), var(--accent))'
                    }} />
                </div>

                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center leading-relaxed">
                  {questions[currentQ].q}
                </h2>

                <div className="space-y-3">
                  {questions[currentQ].options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(i)}
                      className="w-full p-4 rounded-2xl border-2 border-gray-100 text-right font-medium text-gray-700 dark:text-gray-200 hover:border-pink-300 transition-all hover:shadow-md dark:border-gray-600">
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-8 text-center animate-fadeIn">
                {/* Score Circle */}
                <div className="relative w-40 h-40 mx-auto mb-6">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f0f0f0" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10"
                      stroke="url(#grad)" strokeLinecap="round"
                      strokeDasharray={`${(percentage / 100) * 251} 251`}
                      style={{ transition: 'stroke-dasharray 1s ease' }} />
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--primary)" />
                        <stop offset="100%" stopColor="var(--accent)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold gradient-text">{percentage}%</span>
                    <span className="text-xs text-gray-400">توافق</span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {percentage >= 80 ? '💕 توافق رائع!' : percentage >= 60 ? '✨ توافق جيد جداً!' : '🌸 علاقتكما تنمو!'}
                </h2>

                <div className="bg-pink-50 dark:bg-pink-900/20 rounded-2xl p-4 mb-6">
                  <ul className="space-y-2">
                    {(tips[result] || tips[3]).map((tip, i) => (
                      <li key={i} className="text-sm text-gray-600 dark:text-gray-300">{tip}</li>
                    ))}
                  </ul>
                </div>

                <button onClick={reset}
                  className="btn-primary flex items-center gap-2 mx-auto">
                  <FiRefreshCw size={15} /> إعادة الاختبار
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
