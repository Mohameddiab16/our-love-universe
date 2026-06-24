'use client'

import { useEffect, useState } from 'react'
import { FiHeart } from 'react-icons/fi'

interface DayCounterProps {
  startDate: string
}

export default function DayCounter({ startDate }: DayCounterProps) {
  const [elapsed, setElapsed] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const update = () => {
      const start = new Date(startDate).getTime()
      const now = Date.now()
      const diff = now - start
      if (diff < 0) return
      const days    = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setElapsed({ days, hours, minutes, seconds })
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [startDate])

  const units = [
    { value: elapsed.days,    label: 'يوم' },
    { value: elapsed.hours,   label: 'ساعة' },
    { value: elapsed.minutes, label: 'دقيقة' },
    { value: elapsed.seconds, label: 'ثانية' },
  ]

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FiHeart style={{ color: 'var(--primary)' }} />
        <h3 className="font-bold text-gray-700 dark:text-gray-200">عدّاد أيامنا معاً 💕</h3>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {units.map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="text-2xl font-bold gradient-text animate-countUp">
              {String(value).padStart(2, '0')}
            </div>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
