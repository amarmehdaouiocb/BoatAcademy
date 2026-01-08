'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileCheck,
  MessageSquare,
  Building2,
  ClipboardList,
  Anchor,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Array<'admin' | 'manager' | 'instructor'>;
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'instructor'],
  },
  {
    label: 'Sites',
    href: '/dashboard/sites',
    icon: Building2,
    roles: ['admin'],
  },
  {
    label: 'Étudiants',
    href: '/dashboard/students',
    icon: Users,
    roles: ['admin', 'manager'],
  },
  {
    label: 'Sessions',
    href: '/dashboard/sessions',
    icon: Calendar,
    roles: ['admin', 'manager', 'instructor'],
  },
  {
    label: 'Documents',
    href: '/dashboard/documents',
    icon: FileCheck,
    roles: ['admin', 'manager'],
  },
  {
    label: 'Messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
    roles: ['admin', 'manager'],
  },
  {
    label: 'Planning',
    href: '/dashboard/planning',
    icon: ClipboardList,
    roles: ['admin', 'manager', 'instructor'],
  },
];

interface AdminSidebarProps {
  userRole: 'admin' | 'manager' | 'instructor';
}

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="flex w-64 flex-col bg-navy-900">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-navy-800 px-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white">
            <Anchor className="h-5 w-5 text-navy-900" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-white">
              Boat Academy
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6">
        <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-navy-400">
          Menu
        </p>
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-navy-200 hover:bg-navy-800 hover:text-white'
              }`}
            >
              <Icon
                className={`h-5 w-5 transition-colors ${
                  isActive ? 'text-navy-700' : 'text-navy-400 group-hover:text-navy-200'
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Role badge */}
      <div className="border-t border-navy-800 p-4">
        <div className="rounded-lg bg-navy-800/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-navy-400">
            Votre rôle
          </p>
          <p className="mt-1 text-sm font-semibold capitalize text-white">{userRole}</p>
        </div>
      </div>
    </aside>
  );
}
