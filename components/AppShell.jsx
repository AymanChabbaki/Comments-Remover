'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings as SettingsIcon, LogOut, Sparkles, Users } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

function NavItem({ href, icon: Icon, label, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
          : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={18} strokeWidth={2} />
      {label}
    </Link>
  );
}

/**
 * Sidebar + top bar shell shared by the client dashboard/settings pages
 * and the admin overview. Pass clientId+clientName for a client shell,
 * or isAdmin for the admin shell -- the nav differs (admin has no
 * Settings/Logout, since Basic Auth has no clean client-side logout;
 * you close the browser/tab or use a private window instead).
 */
export default function AppShell({ clientId, clientName, isAdmin, subtitle, headerAction, wide, children }) {
  const pathname = usePathname();
  const base = clientId ? `/clients/${clientId}` : null;
  const title = isAdmin ? 'Admin overview' : clientName;

  const initials = (clientName || (isAdmin ? 'A' : '?'))
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="mb-8 px-2">
          <Logo height={28} />
        </div>

        {(base || isAdmin) && (
          <nav className="flex flex-col gap-1">
            <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Menu
            </div>
            {isAdmin ? (
              <NavItem href="/admin" icon={Users} label="Clients" active={pathname === '/admin'} />
            ) : (
              <>
                <NavItem href={`${base}/dashboard`} icon={LayoutDashboard} label="Dashboard" active={pathname === `${base}/dashboard`} />
                <NavItem href={`${base}/settings`} icon={SettingsIcon} label="Settings" active={pathname === `${base}/settings`} />
              </>
            )}
          </nav>
        )}

        <div className="mt-auto flex flex-col gap-3">
          <Link
            href="/demo"
            target="_blank"
            className="flex flex-col gap-2 rounded-xl bg-gradient-to-br from-brand-600 to-brand-navy-500 p-4 text-white"
          >
            <Sparkles size={18} />
            <div className="text-sm font-semibold">See it in action</div>
            <div className="text-xs text-brand-50">Open the live interactive demo</div>
          </Link>
          {base && (
            <button
              onClick={handleLogout}
              type="button"
              className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <LogOut size={18} strokeWidth={2} />
              Log out
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
        <div className={wide ? 'mx-auto max-w-7xl' : 'mx-auto max-w-6xl'}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              {headerAction}
              <ThemeToggle />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {initials}
              </div>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
