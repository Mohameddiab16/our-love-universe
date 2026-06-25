'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'
import { FiMusic, FiPlay, FiPause, FiVolume2, FiVolumeX } from 'react-icons/fi'

export default function MusicPlayer() {
  const { activeWorldOwnerId } = useApp()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [musicUrl, setMusicUrl] = useState<string | null>(null)
  const [musicName, setMusicName] = useState('')
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [visible, setVisible] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get current user once
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  // Load music whenever user or active world changes
  useEffect(() => {
    if (!currentUserId) return
    const targetId = activeWorldOwnerId || currentUserId
    loadMusic(targetId)
  }, [currentUserId, activeWorldOwnerId])

  const loadMusic = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('music_url, music_name')
      .eq('id', userId)
      .single()

    if (data?.music_url) {
      if (data.music_url !== musicUrl) {
        setMusicUrl(data.music_url)
        setMusicName(data.music_name || 'أغنيتنا 💕')
      }
    } else {
      setMusicUrl(null)
      if (audioRef.current) {
        audioRef.current.pause()
        setPlaying(false)
      }
    }
  }

  useEffect(() => {
    if (!audioRef.current || !musicUrl) return
    audioRef.current.src = musicUrl
    audioRef.current.volume = volume
    audioRef.current.loop = true
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [musicUrl])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = muted ? 0 : volume
  }, [volume, muted])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  if (!musicUrl) return null

  return (
    <>
      <audio ref={audioRef} loop preload="auto" />
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-end gap-2">
        {visible && (
          <div className="glass-card rounded-2xl p-4 w-56 shadow-xl animate-fadeIn">
            <p className="text-xs text-gray-500 mb-1">🎵 يعزف الآن</p>
            <p className="font-bold text-sm gradient-text truncate mb-3">{musicName}</p>
            <div className="flex items-center gap-2">
              <button onClick={togglePlay}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
                {playing ? <FiPause size={15} /> : <FiPlay size={15} />}
              </button>
              <button onClick={() => setMuted(!muted)} className="text-gray-400 hover:text-gray-600">
                {muted ? <FiVolumeX size={16} /> : <FiVolume2 size={16} />}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={e => { setVolume(Number(e.target.value)); setMuted(false) }}
                className="flex-1 h-1 rounded-full cursor-pointer accent-pink-400" />
            </div>
          </div>
        )}
        <button onClick={() => setVisible(!visible)}
          className="w-12 h-12 rounded-full text-white shadow-xl flex items-center justify-center relative"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          <FiMusic size={18} />
          {playing && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white animate-pulse" />
          )}
        </button>
      </div>
    </>
  )
}
