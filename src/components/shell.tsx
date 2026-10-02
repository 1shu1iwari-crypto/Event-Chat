'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, ChevronDown, CircleHelp, Command, LayoutDashboard, MessageSquare, Radio, ShieldAlert, Users, FlaskConical, LogOut, Menu, X } from 'lucide-react';
import { useApp } from './app-provider';
import { Avatar, Badge } from './ui';
import { useChat } from './chat/chat-context';
const links = [{ href: '/command', label: 'Command center', icon: LayoutDashboard }, { href: '/chat', label: 'Team channels', icon: MessageSquare }, { href: '/incidents', label: 'Incidents', icon: ShieldAlert }, { href: '/staff', label: 'Staff & assignments', icon: Users }, { href: '/simulation', label: 'Simulation lab', icon: FlaskConical }];
export function Shell({ children }: { children: React.ReactNode }) {
  const { state, error, clearError, request } = useApp(); const chat = useChat(); const pathname = usePathname(), router = useRouter();
  const [menu, setMenu] = useState(false);
  useEffect(() => { if (state && !state.viewer && pathname !== '/') router.replace('/'); }, [state, pathname, router]);
  useEffect(() => setMenu(false), [pathname]);
  if (!state) return <div className="boot"><Radio size={30} /><span>Opening the operations desk…</span></div>;
  const toast = error && <div className="toast" role="alert"><span>{error}</span><button onClick={clearError} className="icon-button" aria-label="Dismiss error"><X size={16} /></button></div>;
  if (pathname === '/' || !state.viewer) return <>{children}{toast}</>;
  const active = state.incidents.filter(i => !['RESOLVED', 'ARCHIVED'].includes(i.status));
  const current = links.find(l => pathname.startsWith(l.href))?.label || 'Incident room';
  return <div className="app-shell">
    {menu && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <aside className={`sidebar ${menu ? 'open' : ''}`}>
      <Link className="brand" href="/command"><span className="brand-mark"><Radio size={21} /></span>eventops<span className="brand-period">.</span></Link>
      <Link href="/" className="event-switch"><span className="event-icon">N</span><span><strong>NovaHack 2026</strong><small>Live event workspace</small></span><ChevronDown size={14} /></Link>
      <div className="nav-label">OPERATIONS</div>
      <nav aria-label="Main navigation">{links.map(l => <Link key={l.href} href={l.href} className={pathname.startsWith(l.href) ? 'active' : ''}><l.icon size={18} /><span>{l.label}</span>{l.href === '/incidents' && active.length > 0 && <span className="nav-count">{active.length}</span>}</Link>)}</nav>
      <div className="sidebar-bottom"><div className="workspace-note"><Activity size={17} /><span>Humans make the call.<small>Recommendations require approval.</small></span></div><Link href="/research" className="utility-link"><CircleHelp size={16} /> Metrics & build notes <ArrowUpRight size={13} /></Link><div className="profile"><Avatar name={state.viewer.name} small /><span><strong>{state.viewer.name}</strong><small>{state.viewer.role}</small></span><button onClick={() => void request('logout').then(() => router.push('/')).catch(() => {})} className="icon-button" aria-label="Sign out"><LogOut size={16} /></button></div></div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" onClick={() => setMenu(true)} aria-label="Open navigation"><Menu size={19} /></button><Command size={15} /><span>NovaHack 2026</span><span className="slash">/</span><strong>{current}</strong></div><div className="topbar-right"><span className={`connection-dot ${chat.status === 'ready' ? 'on' : ''}`} /><span>{chat.status === 'ready' ? 'CometChat connected' : chat.status === 'connecting' ? 'Connecting chat…' : 'Chat disconnected'}</span><Badge tone="green">{state.mode}</Badge></div></header><main className="main-content">{children}</main></div>{toast}
  </div>;
}
