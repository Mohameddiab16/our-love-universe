export type ThemeName = 'rose' | 'sunset' | 'ocean' | 'forest' | 'lavender' | 'coral' | 'moon' | 'heart'

export interface Theme {
  name: ThemeName
  label: string
  emoji: string
  primary: string
  secondary: string
  accent: string
  light: string
  gradient: string
  darkGradient: string
}

export const themes: Theme[] = [
  {
    name: 'rose', label: 'وردة', emoji: '🌹',
    primary: '#ff6b9d', secondary: '#c44569', accent: '#b44aff',
    light: '#fff0f6', gradient: 'from-pink-400 to-rose-500',
    darkGradient: 'from-pink-900 to-rose-950',
  },
  {
    name: 'sunset', label: 'غروب', emoji: '🌅',
    primary: '#ff7043', secondary: '#e64a19', accent: '#ff9800',
    light: '#fff3e0', gradient: 'from-orange-400 to-red-500',
    darkGradient: 'from-orange-900 to-red-950',
  },
  {
    name: 'ocean', label: 'محيط', emoji: '🌊',
    primary: '#0288d1', secondary: '#01579b', accent: '#00bcd4',
    light: '#e1f5fe', gradient: 'from-blue-400 to-cyan-500',
    darkGradient: 'from-blue-900 to-cyan-950',
  },
  {
    name: 'forest', label: 'غابة', emoji: '🌿',
    primary: '#388e3c', secondary: '#1b5e20', accent: '#8bc34a',
    light: '#e8f5e9', gradient: 'from-green-400 to-emerald-500',
    darkGradient: 'from-green-900 to-emerald-950',
  },
  {
    name: 'lavender', label: 'لافندر', emoji: '💜',
    primary: '#7c4dff', secondary: '#512da8', accent: '#e040fb',
    light: '#ede7f6', gradient: 'from-purple-400 to-violet-500',
    darkGradient: 'from-purple-900 to-violet-950',
  },
  {
    name: 'coral', label: 'مرجان', emoji: '🪸',
    primary: '#ff5252', secondary: '#c62828', accent: '#ff6d00',
    light: '#fce4ec', gradient: 'from-red-400 to-pink-500',
    darkGradient: 'from-red-900 to-pink-950',
  },
  {
    name: 'moon', label: 'قمر', emoji: '🌙',
    primary: '#5c6bc0', secondary: '#283593', accent: '#9fa8da',
    light: '#e8eaf6', gradient: 'from-indigo-400 to-blue-600',
    darkGradient: 'from-indigo-900 to-blue-950',
  },
  {
    name: 'heart', label: 'قلب', emoji: '❤️',
    primary: '#e91e63', secondary: '#880e4f', accent: '#f50057',
    light: '#fce4ec', gradient: 'from-pink-500 to-red-600',
    darkGradient: 'from-pink-900 to-red-950',
  },
]

export function getTheme(name: ThemeName): Theme {
  return themes.find(t => t.name === name) || themes[0]
}

export function applyTheme(name: ThemeName, dark: boolean) {
  const theme = getTheme(name)
  const root = document.documentElement
  root.style.setProperty('--primary', theme.primary)
  root.style.setProperty('--secondary', theme.secondary)
  root.style.setProperty('--accent', theme.accent)
  root.style.setProperty('--light', theme.light)
  if (dark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}
