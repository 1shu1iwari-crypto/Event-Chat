"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  ChevronDown,
  FlaskConical,
  House,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Radio,
  Siren,
  Users,
  X,
} from "lucide-react";
import { useApp } from "./app-provider";
import { Avatar, Badge, Modal } from "./ui";
import { Brand } from "./brand";
import { useChat } from "./chat/chat-context";
const links = [
  {
    href: "/command",
    label: "Home",
    accessible: "Command center",
    icon: House,
  },
  {
    href: "/chat",
    label: "Chat",
    accessible: "Team channels",
    icon: MessageCircle,
  },
  {
    href: "/incidents",
    label: "Incidents",
    accessible: "Incidents",
    icon: Siren,
  },
  {
    href: "/staff",
    label: "Team",
    accessible: "Staff & assignments",
    icon: Users,
  },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const { state, error, clearError, request } = useApp();
  const chat = useChat();
  const pathname = usePathname(),
    router = useRouter();
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (state && !state.viewer && pathname !== "/") router.replace("/");
  }, [state, pathname, router]);
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  if (!state)
    return (
      <div className="boot">
        <span className="brand-symbol" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>Opening your workspace</span>
        <div className="loading-line" />
      </div>
    );
  const toast = error && (
    <div className="toast" role="alert">
      <span>{error}</span>
      <button
        onClick={clearError}
        className="icon-button"
        aria-label="Dismiss error"
      >
        <X size={18} />
      </button>
    </div>
  );
  if (pathname === "/" || !state.viewer)
    return (
      <>
        {children}
        {toast}
      </>
    );
  const active = state.incidents.filter(
    (i) => !["RESOLVED", "ARCHIVED"].includes(i.status),
  );
  const renderLink = (l: (typeof links)[number]) => (
    <Link
      key={l.href}
      href={l.href}
      aria-label={l.accessible}
      aria-current={pathname.startsWith(l.href) ? "page" : undefined}
      className={pathname.startsWith(l.href) ? "active" : ""}
    >
      <span className="nav-icon">
        <l.icon size={21} strokeWidth={2.1} />
        {l.href === "/incidents" && active.length > 0 && (
          <span className="nav-count">{active.length}</span>
        )}
      </span>
      <span>{l.label}</span>
    </Link>
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <div className="header-inner">
          <div className="desktop-brand">
            <Brand />
          </div>
          <div className="event-context">
            <span className="event-monogram" aria-hidden="true">
              N
            </span>
            <div>
              <strong>NovaHack 2026</strong>
              <span>
                <i
                  className={`dot ${chat.status === "ready" ? "green" : ""}`}
                />
                {chat.status === "ready"
                  ? "Team connected"
                  : chat.status === "connecting"
                    ? "Connecting chat"
                    : "Demo workspace"}
              </span>
            </div>
          </div>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(renderLink)}
          </nav>
          <div className="header-tools">
            <Link
              href="/simulation"
              className="desktop-lab"
              aria-label="Simulation lab"
            >
              <FlaskConical size={18} /> Demo lab
            </Link>
            <button
              className="profile-button"
              aria-label="Open navigation"
              aria-haspopup="dialog"
              onClick={() => setMenu(true)}
            >
              <Avatar name={state.viewer.name} small />
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className={`main-content ${pathname.startsWith("/incidents/") ? "room-page" : ""}`}
      >
        {children}
      </main>
      <nav className="bottom-nav" aria-label="Phone navigation">
        {links.map(renderLink)}
        <button
          className={
            menu || ["/simulation", "/research"].includes(pathname)
              ? "active"
              : ""
          }
          aria-label="More navigation"
          aria-haspopup="dialog"
          onClick={() => setMenu(true)}
        >
          <span className="nav-icon">
            <MoreHorizontal size={23} />
          </span>
          <span>More</span>
        </button>
      </nav>
      {menu && (
        <Modal title="Your workspace" onClose={() => setMenu(false)}>
          <div className="menu-profile">
            <Avatar name={state.viewer.name} />
            <div>
              <strong>{state.viewer.name}</strong>
              <p>{state.viewer.role}</p>
            </div>
            <Badge>{state.mode}</Badge>
          </div>
          <div className="workspace-links">
            <Link href="/simulation" onClick={() => setMenu(false)}>
              <span className="menu-icon">
                <FlaskConical size={21} />
              </span>
              <span>
                <strong>Simulation lab</strong>
                <small>Rehearse a response</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/research" onClick={() => setMenu(false)}>
              <span className="menu-icon">
                <ChartNoAxesCombined size={21} />
              </span>
              <span>
                <strong>Metrics & build notes</strong>
                <small>Review the event session</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
            <Link href="/" onClick={() => setMenu(false)}>
              <span className="menu-icon">
                <Users size={21} />
              </span>
              <span>
                <strong>Event & demo role</strong>
                <small>Return to the welcome screen</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="connection-note">
            <Radio size={17} />
            <span>
              {chat.status === "ready"
                ? "CometChat connected"
                : "Chat is not connected"}
              .{" "}
              {chat.status !== "ready" &&
                "Local exercises are available in the demo lab."}
            </span>
          </div>
          <button
            className="button full"
            onClick={() =>
              void request("logout")
                .then(() => {
                  setMenu(false);
                  router.push("/");
                })
                .catch(() => {})
            }
          >
            <LogOut size={17} /> Sign out
          </button>
        </Modal>
      )}
      {toast}
    </div>
  );
}
