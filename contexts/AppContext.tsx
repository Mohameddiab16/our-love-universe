'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ThemeName, applyTheme } from '@/lib/themes'
import { Lang } from '@/lib/i18n'

interface AppContextType {
  theme: ThemeName
  setTheme: (t: ThemeName) => void
  darkMode: boolean
  setDarkMode: (d: boolean) => void
  lang: Lang
  setLang: (l: Lang) => void
  activeWorldId: string | null
  setActiveWorldId: (id: string | null) => void
  activeWorldOwnerId: string | null
  setActiveWorldOwner: (worldId: string | null, ownerId: string | null) => void
  totalPoints: number
  setTotalPoints: (n: number) => void
}

const AppContext = createContext<AppContextType>({} as AppContextType)

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('rose')
  const [darkMode, setDarkModeState] = useState(false)
  const [lang, setLangState] = useState<Lang>('ar')
  const [activeWorldId, setActiveWorldId] = useState<string | null>(null)
  const [activeWorldOwnerId, setActiveWorldOwnerId] = useState<string | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)

  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as ThemeName) || 'rose'
    const savedDark = localStorage.getItem('darkMode') === 'true'
    const savedLang = (localStorage.getItem('lang') as Lang) || 'ar'
    const savedWorld = localStorage.getItem('activeWorldId')
    const savedOwner = localStorage.getItem('activeWorldOwnerId')
    setThemeState(savedTheme)
    setDarkModeState(savedDark)
    setLangState(savedLang)
    if (savedWorld) setActiveWorldId(savedWorld)
    if (savedOwner) setActiveWorldOwnerId(savedOwner)
    applyTheme(savedTheme, savedDark)
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = savedLang
  }, [])

  const setTheme = (t: ThemeName) => {
    setThemeState(t)
    localStorage.setItem('theme', t)
    applyTheme(t, darkMode)
  }

  const setDarkMode = (d: boolean) => {
    setDarkModeState(d)
    localStorage.setItem('darkMode', String(d))
    applyTheme(theme, d)
  }

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
    document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = l
  }

  const handleSetWorld = (id: string | null) => {
    setActiveWorldId(id)
    if (id) localStorage.setItem('activeWorldId', id)
    else localStorage.removeItem('activeWorldId')
  }

  const setActiveWorldOwner = (worldId: string | null, ownerId: string | null) => {
    setActiveWorldId(worldId)
    setActiveWorldOwnerId(ownerId)
    if (worldId) localStorage.setItem('activeWorldId', worldId)
    else localStorage.removeItem('activeWorldId')
    if (ownerId) localStorage.setItem('activeWorldOwnerId', ownerId)
    else localStorage.removeItem('activeWorldOwnerId')
  }

  return (
    <AppContext.Provider value={{
      theme, setTheme, darkMode, setDarkMode,
      lang, setLang,
      activeWorldId, setActiveWorldId: handleSetWorld,
      activeWorldOwnerId, setActiveWorldOwner,
      totalPoints, setTotalPoints,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
