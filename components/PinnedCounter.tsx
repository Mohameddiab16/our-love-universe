'use client'

import { useEffect, useState } from 'react'
import { FiHeart, FiClock, FiEdit2 } from 'react-icons/fi'

interface PinnedConfig {
  title: string
  date: string
  direction: 'up' | 'down'
  emoji: string
}

interface PinnedCounterProps {
  config: PinnedConfig
  onEdit?: () => void
}

export default function PinnedCounter({ config, onEdit }: PinnedCounterProps) {
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const update = () => {
      const target = new Date(config.date).getTime()
      const now = Date.now()
      const diff = config.direction === 'up' ? now - target : target - now

      if (diff < 0) {
        setElapsed({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }

      setElapsed({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [config])

  const units = [
    { value: elapsed.days,    label: 'يوم' },
    { value: elapsed.hours,   label: 'ساعة' },
    { value: elapsed.minutes, label: 'دقيقة' },
    { value: elapsed.seconds, label: 'ثانية' },
  ]

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 text-6xl opacity-5 select-none leading-none">{config.emoji}</div>
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.emoji}</span>
            <div>
              <p className="font-bold text-gray-800 dark:text-white text-sm">{config.title}</p>
              <p className="text-xs text-gray-400">
                {config.direction === 'up' ? '⏱️ منذ' : '⏳ متبقي'} — {new Date(config.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          {onEdit && (
            <button onClick={onEdit} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-pink-50 hover:text-pink-400 transition-colors">
              <FiEdit2 size={13} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {units.map(({ value, label }) => (
            <div key={label} className="text-center p-2 rounded-xl"
              style={{ background: 'linear-gradient(135deg, var(--light), #ede9fe)' }}>
              <p className="text-xl font-bold gradient-text">{String(value).padStart(2, '0')}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
