'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface NavigationItem {
  label: string
  href: string
  icon?: React.ReactNode
}

interface MainNavProps {
  items: NavigationItem[]
}

export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname()

  return (
    <nav className="px-3 space-y-1">
      {items.map((item) => {
        const isActive = pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(item.href + '/'))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }
            `}
          >
            {item.icon && (
              <span
                className={
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500'
                }
              >
                {item.icon}
              </span>
            )}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
