'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  ShieldOff,
  Settings as SettingsIcon,
  UserCircle,
  LogOut,
  Sparkles,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';

const COLLAPSE_KEY = 'sidebar-collapsed';
const SUPPORT_PHONE = '0703285402';

function NavItem({ href, icon: Icon, label, active, collapsed }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
        collapsed ? 'justify-center px-0' : ''
      } ${
        active
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
          : 'text-slate-500 hover:translate-x-0.5 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
      {!collapsed && label}
      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 dark:bg-slate-700">
          {label}
        </span>
      )}
    </Link>
  );
}

/**
 * Sidebar + top bar shell shared by the client dashboard/settings/profile
 * pages and the admin overview. Pass clientId+clientName for a client
 * shell, or isAdmin for the admin shell -- the nav differs (admin has no
 * Settings/Profile/Logout, since Basic Auth has no clean client-side
 * logout; you close the browser/tab or use a private window instead).
 */
export default function AppShell({ clientId, clientName, isAdmin, subtitle, headerAction, wide, children }) {
  const pathname = usePathname();
  const base = clientId ? `/clients/${clientId}` : null;
  const title = isAdmin ? 'Admin overview' : clientName;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_KEY) === '1') setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1');
      return !c;
    });
  }

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
      <aside
        className={`relative hidden shrink-0 flex-col border-r border-slate-200 bg-white py-6 transition-[width] duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:flex ${
          collapsed ? 'w-[76px] px-2' : 'w-64 px-4'
        }`}
        style={{
          backgroundImage:
            'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '18px 18px',
          backgroundPosition: '-9px -9px',
          color: 'rgb(148 163 184 / 0.08)',
        }}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:scale-110 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:text-brand-400"
        >
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>

        <div className={`mb-8 flex px-2 ${collapsed ? 'justify-center' : ''}`}>
          {collapsed ? <Logo variant="mark" height={34} /> : <Logo height={32} />}
        </div>

        {(base || isAdmin) && (
          <nav className="flex flex-col gap-1">
            {!collapsed && (
              <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Menu
              </div>
            )}
            {isAdmin ? (
              <NavItem href="/admin" icon={Users} label="Clients" active={pathname === '/admin'} collapsed={collapsed} />
            ) : (
              <>
                <NavItem href={`${base}/dashboard`} icon={LayoutDashboard} label="Dashboard" active={pathname === `${base}/dashboard`} collapsed={collapsed} />
                <NavItem href={`${base}/comments`} icon={MessageSquare} label="Comments" active={pathname === `${base}/comments`} collapsed={collapsed} />
                <NavItem href={`${base}/blacklist`} icon={ShieldOff} label="Blacklist" active={pathname === `${base}/blacklist`} collapsed={collapsed} />
                <NavItem href={`${base}/settings`} icon={SettingsIcon} label="Settings" active={pathname === `${base}/settings`} collapsed={collapsed} />
                <NavItem href={`${base}/profile`} icon={UserCircle} label="Profile" active={pathname === `${base}/profile`} collapsed={collapsed} />
              </>
            )}
          </nav>
        )}

        <div className="mt-auto flex flex-col gap-3">
          <Link
            href="/demo"
            target="_blank"
            title={collapsed ? 'See it in action' : undefined}
            className={`group flex flex-col gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-navy-500 text-white transition-transform duration-200 hover:scale-[1.02] ${
              collapsed ? 'items-center p-2.5' : 'p-4'
            }`}
          >
            <Sparkles size={18} className="transition-transform duration-300 group-hover:rotate-12" />
            {!collapsed && (
              <>
                <div className="text-sm font-semibold">See it in action</div>
                <div className="text-xs text-brand-50">Open the live interactive demo</div>
              </>
            )}
          </Link>
          {base && (
            <a
              href={`tel:${SUPPORT_PHONE}`}
              title={collapsed ? `Having a problem? Call ${SUPPORT_PHONE}` : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-brand-400 ${
                collapsed ? 'justify-center px-0' : ''
              }`}
            >
              <Phone size={18} strokeWidth={2} className="shrink-0" />
              {!collapsed && (
                <span className="flex flex-col leading-tight">
                  <span>Having a problem?</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Call {SUPPORT_PHONE}</span>
                </span>
              )}
            </a>
          )}
          {base && (
            <button
              onClick={handleLogout}
              type="button"
              title={collapsed ? 'Log out' : undefined}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 ${
                collapsed ? 'justify-center px-0' : ''
              }`}
            >
              <LogOut size={18} strokeWidth={2} />
              {!collapsed && 'Log out'}
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
        <div className={`animate-fade-in ${wide ? 'mx-auto max-w-7xl' : 'mx-auto max-w-6xl'}`}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              {headerAction}
              <ThemeToggle />
              {base ? (
                <Link
                  href={`${base}/profile`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 ring-2 ring-transparent transition-all hover:ring-brand-400 dark:bg-slate-800 dark:text-slate-300"
                >
                  {initials}
                </Link>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {initials}
                </div>
              )}
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
