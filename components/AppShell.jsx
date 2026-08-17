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
import Logo from './Logo';

const COLLAPSE_KEY = 'sidebar-collapsed';
const SUPPORT_PHONE = '0703285402';

function NavItem({ href, icon: Icon, label, active, collapsed }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors duration-150 ${
        collapsed ? 'justify-center px-0' : 'px-3'
      } ${
        active
          ? 'bg-brand-600 font-semibold text-white'
          : 'font-medium text-navy-300 hover:bg-navy-800 hover:text-white'
      }`}
    >
      {/* Active marker bleeds into the sidebar edge -- reads as a tab, not a floating pill. */}
      {active && !collapsed && (
        <span className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-300" />
      )}
      <Icon size={17} strokeWidth={2} className="shrink-0" />
      {!collapsed && label}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-20 ml-3 whitespace-nowrap rounded-md bg-navy-950 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
          {label}
        </span>
      )}
    </Link>
  );
}

/**
 * Sidebar + top bar shell shared by the client pages and the admin
 * screens. Pass clientId+clientName for a client shell, or isAdmin for
 * the admin shell -- the nav differs (admin has no Settings/Profile/
 * Logout, since Basic Auth has no clean client-side logout).
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
    <div className="flex min-h-screen bg-paper">
      <aside
        className={`relative hidden shrink-0 flex-col bg-navy-900 py-6 transition-[width] duration-300 ease-in-out lg:flex ${
          collapsed ? 'w-[76px] px-3' : 'w-64 px-4'
        }`}
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-9 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-ink-mute shadow-sm transition-colors hover:text-brand-600"
        >
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>

        <div className="mb-9 flex justify-center px-1">
          {collapsed ? <Logo variant="mark" height={32} forceLight /> : <Logo height={30} forceLight />}
        </div>

        {(base || isAdmin) && (
          <nav className="flex flex-col gap-1">
            {!collapsed && (
              <div className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-navy-400">
                Menu
              </div>
            )}
            {isAdmin ? (
              <>
                <NavItem href="/admin" icon={LayoutDashboard} label="Overview" active={pathname === '/admin'} collapsed={collapsed} />
                <NavItem href="/admin/clients" icon={Users} label="Clients" active={pathname === '/admin/clients'} collapsed={collapsed} />
              </>
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

        <div className="mt-auto flex flex-col gap-2">
          <Link
            href="/demo"
            target="_blank"
            title={collapsed ? 'See it in action' : undefined}
            className={`group flex flex-col gap-2 rounded-lg border border-navy-700 bg-navy-800 transition-colors hover:border-brand-500 ${
              collapsed ? 'items-center p-2.5' : 'p-4'
            }`}
          >
            <Sparkles size={17} className="text-brand-300 transition-transform duration-300 group-hover:rotate-12" />
            {!collapsed && (
              <>
                <div className="text-sm font-semibold text-white">See it in action</div>
                <div className="text-xs leading-snug text-navy-300">Open the live interactive demo</div>
              </>
            )}
          </Link>

          {base && (
            <>
              <div className="my-1 h-px bg-navy-800" />
              <a
                href={`tel:${SUPPORT_PHONE}`}
                title={collapsed ? `Having a problem? Call ${SUPPORT_PHONE}` : undefined}
                className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-navy-300 transition-colors hover:bg-navy-800 hover:text-white ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                }`}
              >
                <Phone size={17} strokeWidth={2} className="shrink-0" />
                {!collapsed && (
                  <span className="flex flex-col leading-tight">
                    <span>Having a problem?</span>
                    <span className="text-xs text-navy-400">Call {SUPPORT_PHONE}</span>
                  </span>
                )}
              </a>
              <button
                onClick={handleLogout}
                type="button"
                title={collapsed ? 'Log out' : undefined}
                className={`flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-navy-300 transition-colors hover:bg-brand-600 hover:text-white ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                }`}
              >
                <LogOut size={17} strokeWidth={2} className="shrink-0" />
                {!collapsed && 'Log out'}
              </button>
            </>
          )}
        </div>
      </aside>

      <div className="bg-grain flex-1 px-4 py-7 sm:px-7 lg:px-10">
        <div className={`animate-fade-in ${wide ? 'mx-auto max-w-7xl' : 'mx-auto max-w-6xl'}`}>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
              {headerAction}
              {base ? (
                <Link
                  href={`${base}/profile`}
                  title="Your profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white transition-colors hover:bg-brand-600"
                >
                  {initials}
                </Link>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-700 text-xs font-bold text-white">
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
