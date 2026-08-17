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
  PlayCircle,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  Phone,
  HelpCircle,
} from 'lucide-react';
import Logo from './Logo';

const COLLAPSE_KEY = 'sidebar-collapsed';
const SUPPORT_PHONE = '0703285402';
const SIDEBAR_W = 260;
const SIDEBAR_W_COLLAPSED = 84;

function NavItem({ href, icon: Icon, label, active, collapsed }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg py-2.5 text-body-md font-medium transition-all duration-200 ease-in-out ${
        collapsed ? 'justify-center px-0' : 'px-3'
      } ${
        active
          ? 'bg-primary text-on-primary shadow-md shadow-primary/20'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
      }`}
    >
      <Icon size={20} strokeWidth={2} className="shrink-0" />
      {!collapsed && label}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-20 ml-3 whitespace-nowrap rounded-lg bg-inverse-surface px-2.5 py-1.5 text-label-sm text-inverse-on-surface opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
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
 *
 * `children` is rendered exactly once -- responsiveness (sidebar visible
 * vs. not, content offset) is handled entirely with CSS breakpoints, not
 * by mounting two copies of the content tree. Pages under this shell poll
 * on intervals (Dashboard/Comments/Blacklist), so a duplicated subtree
 * would mean duplicated fetches and duplicated timers, not just extra DOM.
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

  const railW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface lg:h-screen lg:overflow-hidden" style={{ '--rail-w': `${railW}px` }}>
      <nav
        style={{ width: railW }}
        className="fixed bottom-0 left-0 top-0 z-20 hidden flex-col border-r border-surface-container-high bg-surface-container-lowest shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-[width] duration-300 ease-in-out lg:flex"
      >
        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-9 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-surface-container-high bg-surface-container-lowest text-on-surface-variant shadow-sm transition-colors hover:text-primary"
        >
          {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
        </button>

        <div className="flex h-20 items-center justify-center border-b border-surface-container-high px-6">
          {collapsed ? <Logo variant="mark" height={32} /> : <Logo height={32} />}
        </div>

        {(base || isAdmin) && (
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
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

            <div className="mt-auto pt-6">
              <Link
                href="/demo"
                target="_blank"
                title={collapsed ? 'See it in action' : undefined}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 text-body-md font-medium text-on-surface shadow-sm transition-colors hover:bg-surface-container ${
                  collapsed ? 'px-0' : 'px-3'
                }`}
              >
                <PlayCircle size={18} />
                {!collapsed && 'See it in action'}
              </Link>
            </div>
          </div>
        )}

        {base && (
          <div className="flex flex-col gap-2 border-t border-surface-container-high bg-surface-container-lowest/50 p-4">
            {!collapsed && (
              <div className="flex flex-col gap-1 px-4 py-2">
                <div className="font-mono text-label-sm uppercase text-on-surface-variant">Need Help?</div>
                <a href={`tel:${SUPPORT_PHONE}`} className="flex items-center gap-2 text-on-surface transition-colors hover:text-primary">
                  <Phone size={16} />
                  <span className="font-mono text-label-md">{SUPPORT_PHONE}</span>
                </a>
              </div>
            )}
            <a
              href="mailto:hello@techermanos.org"
              title={collapsed ? 'Help & Support' : undefined}
              className={`flex items-center gap-3 rounded-lg py-2 text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface ${
                collapsed ? 'justify-center px-0' : 'px-4'
              }`}
            >
              <HelpCircle size={18} />
              {!collapsed && <span className="text-body-md text-sm">Help &amp; Support</span>}
            </a>
            <button
              onClick={handleLogout}
              type="button"
              title={collapsed ? 'Log out' : undefined}
              className={`flex items-center gap-3 rounded-lg py-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container ${
                collapsed ? 'justify-center px-0' : 'px-4'
              }`}
            >
              <LogOut size={18} />
              {!collapsed && <span className="text-body-md text-sm">Log out</span>}
            </button>
          </div>
        )}
      </nav>

      {/* Single content column for every breakpoint. Only its left offset
          (via the --rail-w custom property, scoped behind lg:) and the
          header's logo mark change between mobile and desktop. */}
      <div className="flex min-h-screen flex-col lg:ml-[var(--rail-w)] lg:h-screen lg:overflow-hidden lg:transition-[margin] lg:duration-300 lg:ease-in-out">
        <header className="z-10 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-surface-container-high bg-surface-container-lowest px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="shrink-0 lg:hidden">
              <Logo variant="mark" height={28} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-headline-md text-on-surface lg:text-headline-lg">{title}</h1>
              {subtitle && <p className="mt-0.5 hidden text-body-md text-on-surface-variant sm:block">{subtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-6">
            {headerAction}
            {base ? (
              <Link
                href={`${base}/profile`}
                title="Your profile"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-label-sm font-semibold text-on-secondary shadow-sm transition-opacity hover:opacity-90"
              >
                {initials}
              </Link>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-label-sm font-semibold text-on-secondary shadow-sm">
                {initials}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 bg-surface-container-low p-6 lg:overflow-y-auto lg:p-8">
          <div className={`animate-fade-in mx-auto ${wide ? 'max-w-[1400px]' : 'max-w-[1080px]'}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}
