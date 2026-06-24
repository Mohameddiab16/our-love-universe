'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { FiZap, FiCheckCircle, FiStar } from 'react-icons/fi'

interface Challenge {
  id: string
  title: string
  description: string
  points: number
  category: string
}

const categoryEmoji: Record<string, string> = {
  romantic: '💕',
  memories: '📸',
  'quality-time': '⏰',
  appreciation: '🙏',
  adventure: '🌍',
  gifts: '🎁',
  fun: '😄',
}

export default function ChallengesPage() {
  const { totalPoints, setTotalPoints } = useApp()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadChallenges() }, [])

  const loadChallenges = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: allChallenges }, { data: userChallenges }] = await Promise.all([
      supabase.from('daily_challenges').select('*').order('created_at'),
      supabase.from('user_challenges').select('challenge_id').eq('user_id', user.id),
    ])

    setChallenges(allChallenges || [])
    const completedSet = new Set((userChallenges || []).map((uc: any) => uc.challenge_id))
    setCompleted(completedSet)

    const pts = (userChallenges || []).length * 10
    setTotalPoints(pts)
    setLoading(false)
  }

  const handleComplete = async (challenge: Challenge) => {
    if (completed.has(challenge.id)) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('user_challenges').insert({
      user_id: user.id,
      challenge_id: challenge.id,
      points_earned: challenge.points,
    })

    setCompleted((prev: Set<string>) => new Set(Array.from(prev).concat(challenge.id)))
    setTotalPoints((prev: number) => prev + challenge.points)
  }

  const completedCount = completed.size
  const progress = challenges.length > 0 ? Math.round((completedCount / challenges.length) * 100) : 0

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Navbar />
        <main className="flex-1 md:mr-64 p-4 md:p-8 pt-16 md:pt-8 animate-fadeIn">
          <div className="mb-6">
            <h1 className="text-2xl font-bold gradient-text flex items-center gap-2 mb-1">
              <FiZap /> التحديات اليومية
            </h1>
            <p className="text-gray-400 text-sm">أتمّ التحديات واكسب نقاط الحب 💕</p>
          </div>

          {/* Stats Bar */}
          <div className="glass-card rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md"
                  style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
                  ⭐
                </div>
                <div>
                  <p className="font-bold text-2xl gradient-text">{totalPoints}</p>
                  <p className="text-xs text-gray-400">نقطة مجموع</p>
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl text-gray-800 dark:text-white">{completedCount}/{challenges.length}</p>
                <p className="text-xs text-gray-400">تحدي مكتمل</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-xl gradient-text">{progress}%</p>
                <p className="text-xs text-gray-400">إنجاز</p>
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--primary), var(--accent))'
                }} />
            </div>
          </div>

          {/* Challenges */}
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="memory-card h-20 animate-pulse bg-gray-50" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {challenges.map(challenge => {
                const isDone = completed.has(challenge.id)
                return (
                  <div key={challenge.id}
                    className={`memory-card transition-all ${isDone ? 'opacity-80' : 'hover:shadow-lg cursor-pointer'}`}
                    onClick={() => !isDone && handleComplete(challenge)}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 transition-all ${isDone ? 'bg-green-100' : ''}`}
                        style={!isDone ? { background: 'linear-gradient(135deg, var(--light), #ede9fe)' } : {}}>
                        {isDone ? '✅' : (categoryEmoji[challenge.category] || '💪')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className={`font-bold text-sm ${isDone ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'}`}>
                            {challenge.title}
                          </h3>
                          <span className="badge badge-pink text-xs flex-shrink-0">
                            <FiStar size={9} /> {challenge.points}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{challenge.description}</p>
                        {isDone ? (
                          <p className="text-xs text-green-500 font-semibold mt-2 flex items-center gap-1">
                            <FiCheckCircle size={11} /> تم الإنجاز!
                          </p>
                        ) : (
                          <p className="text-xs mt-2 font-medium" style={{ color: 'var(--primary)' }}>
                            اضغط للإتمام ←
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Achievement Message */}
          {completedCount === challenges.length && challenges.length > 0 && (
            <div className="mt-6 glass-card rounded-2xl p-6 text-center animate-fadeIn">
              <p className="text-5xl mb-3">🏆</p>
              <h3 className="text-xl font-bold gradient-text mb-2">مبروك! أتممت كل التحديات!</h3>
              <p className="text-gray-500 text-sm">أنتما من أكثر الأزواج رومانسية 💕</p>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}
