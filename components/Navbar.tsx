'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  FiHome, FiImage, FiMessageCircle, FiCalendar, FiClock, FiBarChart2,
  FiSettings, FiLogOut, FiMenu, FiX, FiHeart, FiGlobe, FiUser,
  FiStar, FiZap, FiGift, FiCreditCard, FiShield, FiBell
} from 'react-icons/fi'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { useApp } from '@/contexts/AppContext'

const navGroups = [
  {
    label: 'الرئيسية',
    items: [
      { href: '/',            label: 'الرئيسية',     icon: FiHome },
      { href: '/worlds',      label: 'العوالم',       icon: FiGlobe },
    ]
  },
  {
    label: 'المحتوى',
    items: [
      { href: '/memories',    label: 'الذكريات',     icon: FiImage },
      { href: '/messages',    label: 'الرسائل',      icon: FiMessageCircle },
      { href: '/occasions',   label: 'المناسبات',    icon: FiCalendar },
      { href: '/timeline',    label: 'الخط الزمني',  icon: FiClock },
      { href: '/stats',       label: 'الإحصائيات',   icon: FiBarChart2 },
    ]
  },
  {
    label: 'مميزات',
    items: [
      { href: '/challenges',    label: 'التحديات',       icon: FiZap },
      { href: '/date-ideas',    label: 'أفكار تواريخ',   icon: FiGift },
      { href: '/compatibility', label: 'اختبار التوافق', icon: FiHeart },
    ]
  },
  {
    label: 'الحساب',
    items: [
      { href: '/profile',      label: 'ملفي الشخصي',  icon: FiUser },
      { href: '/subscription', label: 'الاشتراك',     icon: FiCreditCard },
      { href: '/settings',     label: 'الإعدادات',    icon: FiSettings },
    ]
  },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { plan } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [unreadNotif, setUnreadNotif] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setAvatarUrl(user.user_metadata?.avatar_url || null)
      setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || '')
      supabase.from('profiles').select('is_admin').eq('id', user.id).single().then(({ data }) => {
        setIsAdmin(data?.is_admin || false)
      })
      supabase.from('notifications').select('id', { count: 'exact', head: true })
        .eq('user_id', user.id).eq('is_read', false).then(({ count }) => {
          setUnreadNotif(count || 0)
        })
    })
  }, [])

  const handleLogout = async () => {
    await signOut()
    router.push('/auth')
  }

  const planBadge = {
    free:   { label: 'مجاني',  cls: 'plan-free' },
    couple: { label: 'ثنائي',  cls: 'plan-couple' },
    family: { label: 'عائلي',  cls: 'plan-family' },
  }[plan]

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6 px-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          <FiHeart className="text-white text-lg" />
        </div>
        <div>
          <p className="font-bold text-sm gradient-text">Our Love Universe</p>
          <span className={`badge text-xs ${planBadge.cls}`}>{planBadge.label}</span>
        </div>
      </div>

      {/* User mini card */}
      <Link href="/profile" onClick={() => setMobileOpen(false)}
        className="flex items-center gap-3 p-3 rounded-xl mb-4 hover:bg-white/30 transition-colors">
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            : <FiUser className="text-white m-auto mt-1.5 text-lg" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{userName}</p>
          <p className="text-xs text-gray-400">عرض الملف الشخصي</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-4 overflow-y-auto">
        {navGroups.map(group => (
          <div key={group.label}>
            <p className="text-xs text-gray-400 font-semibold px-3 mb-1 uppercase tracking-wider">{group.label}</p>
            {group.items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className={`sidebar-link ${pathname === href ? 'active' : ''}`}>
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        ))}

        {isAdmin && (
          <div>
            <p className="text-xs text-gray-400 font-semibold px-3 mb-1 uppercase tracking-wider">الإدارة</p>
            <Link href="/admin" onClick={() => setMobileOpen(false)}
              className={`sidebar-link ${pathname === '/admin' ? 'active' : ''}`}>
              <FiShield size={16} />
              <span>لوحة التحكم</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Notifications + Logout */}
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-1">
        <Link href="/notifications" onClick={() => setMobileOpen(false)}
          className="sidebar-link relative">
          <FiBell size={16} />
          <span>الإشعارات</span>
          {unreadNotif > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center"
              style={{ background: 'var(--primary)' }}>
              {unreadNotif}
            </span>
          )}
        </Link>
        <button onClick={handleLogout}
          className="sidebar-link w-full text-right text-red-400 hover:text-red-500 hover:bg-red-50">
          <FiLogOut size={16} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sidebar-desktop fixed right-0 top-0 h-full w-64 glass-card z-40 flex flex-col py-5 px-3 border-l border-white/30 overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 glass-card px-4 py-3 flex items-center justify-between border-b border-white/30">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1" style={{ color: 'var(--primary)' }}>
          {mobileOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <span className="font-bold gradient-text text-sm">Our Love Universe</span>
        <Link href="/notifications" className="relative p-1">
          <FiBell size={20} style={{ color: 'var(--primary)' }} />
          {unreadNotif > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center"
              style={{ background: 'var(--primary)' }}>
              {unreadNotif}
            </span>
          )}
        </Link>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute top-0 right-0 h-full w-72 glass-card flex flex-col py-5 px-3 pt-16 overflow-y-auto">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
