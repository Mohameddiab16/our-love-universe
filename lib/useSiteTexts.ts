import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type Texts = Record<string, string>

let cache: Texts | null = null

export function useSiteTexts() {
  const [texts, setTexts] = useState<Texts>(cache || {})

  useEffect(() => {
    if (cache) return
    supabase.from('site_texts').select('key, value').then(({ data }) => {
      if (!data) return
      const map: Texts = {}
      data.forEach((r: any) => { map[r.key] = r.value })
      cache = map
      setTexts(map)
    })
  }, [])

  const t = (key: string, fallback = '') => texts[key] ?? fallback
  return t
}
