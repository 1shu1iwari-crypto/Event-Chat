"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  Plus,
  Siren,
  Users,
} from "lucide-react";
import { useApp } from "../app-provider";
import { useChat } from "../chat/chat-context";
import { Badge, clock, duration, readableStatus, Severity } from "../ui";
import { NewIncident } from "../incidents/new-incident";
import { zones } from "@/lib/seed";
export function CommandCenter() {
  const { state } = useApp();
  const chat = useChat();
  const [create, setCreate] = useState(false),
    [zone, setZone] = useState("");
  if (!state) return null;
  const active = state.incidents.filter(
      (i) => !["RESOLVED", "ARCHIVED"].includes(i.status),
    ),
    resolved = state.incidents.filter((i) => i.report);
  const visible = zone ? active.filter((i) => i.zone === zone) : active,
    available = state.staff.filter(
      (s) => s.availability === "AVAILABLE",
    ).length;
  const avg = resolved.length
    ? duration(
        resolved.reduce((n, i) => n + i.report!.durationSeconds, 0) /
          resolved.length,
      )
    : "—";
  const online = state.staff.filter(
    (s) => chat.presence[s.uid] === "online",
  ).length;
  return (
    <>
      <div className="page-heading home-heading">
        <div>
          <div className="eyebrow">
            Hello, {state.viewer?.name.split(" ")[0] || "team"}
            <span className="shift-label">
              <i className="dot green" /> On shift
            </span>
          </div>
          <h1>
            Keep the event
            <br className="phone-break" /> moving.
          </h1>
          <p>Your people. Your venue. One shared picture.</p>
        </div>
        <button
          className="button primary report-button"
          aria-label="Report incident"
          onClick={() => setCreate(true)}
        >
          <Plus size={19} />
          <span>Report incident</span>
        </button>
      </div>
      <section className={`event-summary ${active.length ? "attention" : ""}`}>
        <div className="summary-icon">
          {active.length ? <Siren size={23} /> : <Check size={23} />}
        </div>
        <div>
          <strong>
            {active.some((i) => i.severity === "P1")
              ? "A critical response is needed"
              : active.length
                ? `${active.length} incident${active.length > 1 ? "s" : ""} need${active.length === 1 ? "s" : ""} your team`
                : "All clear, for now."}
          </strong>
          <p>
            {active.length
              ? "Review the reports and choose the next move."
              : "No active incident reports. Keep the team in the loop."}
          </p>
        </div>
        <Badge tone={active.length ? "amber" : "green"}>
          {active.length ? "Needs attention" : "Steady"}
        </Badge>
      </section>
      <div className="home-columns">
        <div className="home-primary">
          <section className="home-incidents">
            <div className="section-heading">
              <h2>
                Needs attention
                {zone && <span className="filter-caption">{zone}</span>}
              </h2>
              <Link href="/incidents">
                View all <ArrowUpRight size={15} />
              </Link>
            </div>
            {visible.length ? (
              <div className="incident-cards">
                {visible.map((i) => (
                  <Link
                    href={`/incidents/${i.id}`}
                    key={i.id}
                    className={`response-card ${i.severity === "P1" ? "critical" : ""}`}
                  >
                    <div className="response-card-meta">
                      <Severity value={i.severity} />
                      <span className="mono">{i.id}</span>
                      <ChevronRight size={19} />
                    </div>
                    <h3>{i.title}</h3>
                    <p>
                      <MapPin size={15} />
                      {i.zone}
                      <span>·</span>
                      {i.relatedMessageIds.length} linked reports
                    </p>
                    <div className="response-card-bottom">
                      <div className="mini-avatars">
                        {i.assignedUsers.slice(0, 3).map((uid) => {
                          const person = state.staff.find((s) => s.uid === uid);
                          return (
                            person && (
                              <span key={uid} title={person.name}>
                                {person.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </span>
                            )
                          );
                        })}
                        <small>{i.assignedUsers.length} responders</small>
                      </div>
                      <Badge>{readableStatus(i.status)}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="clear-state">
                <span className="clear-art" aria-hidden="true">
                  <Check size={28} />
                </span>
                <div>
                  <h3>{zone ? "This zone is clear" : "Room to breathe."}</h3>
                  <p>
                    {zone
                      ? "No active incidents are reported here."
                      : "Related team reports will appear here when something needs a response."}
                  </p>
                  <Link href="/simulation">
                    Try a demo scenario <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </section>
          <section className="quick-actions" aria-label="Quick actions">
            <Link href="/chat">
              <span className="quick-icon">
                <MessageCircle size={22} />
              </span>
              <div>
                <strong>Team chat</strong>
                <small>Keep everyone in sync</small>
              </div>
              <ArrowUpRight size={17} />
            </Link>
            <Link href="/staff">
              <span className="quick-icon">
                <Users size={22} />
              </span>
              <div>
                <strong>Your team</strong>
                <small>{available} available responders</small>
              </div>
              <ArrowUpRight size={17} />
            </Link>
          </section>
          <section className="venue-section">
            <div className="section-heading">
              <h2>Around the venue</h2>
              <span>8 zones</span>
            </div>
            <div className="venue-map">
              {zones.map((z, index) => {
                const items = active.filter((i) => i.zone === z);
                const tone = items.some((i) => i.severity === "P1")
                  ? "red"
                  : items.length
                    ? "amber"
                    : "green";
                return (
                  <button
                    key={z}
                    aria-pressed={zone === z}
                    className={`map-zone ${items.length ? tone : ""} ${zone === z ? "selected" : ""}`}
                    onClick={() => setZone(zone === z ? "" : z)}
                  >
                    <span className="zone-meta">
                      <span className="mono">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <i className={`dot ${tone}`} />
                    </span>
                    <strong>{z}</strong>
                    <small>
                      {items.length
                        ? `${items.length} incident${items.length > 1 ? "s" : ""}`
                        : "No reported incident"}
                    </small>
                  </button>
                );
              })}
            </div>
            {zone && (
              <button
                className="text-button clear-filter"
                onClick={() => setZone("")}
              >
                Clear zone filter <span aria-hidden="true">×</span>
              </button>
            )}
            <p className="venue-caption">
              <MapPin size={13} /> Status from team reports · no live location
              tracking
            </p>
          </section>
        </div>
        <aside className="home-secondary">
          <section className="session-stats">
            <div className="section-heading">
              <h2>This session</h2>
              <Clock3 size={17} />
            </div>
            <div>
              <span>Resolved incidents</span>
              <strong>{resolved.length.toString().padStart(2, "0")}</strong>
            </div>
            <div>
              <span>Average resolution</span>
              <strong>{avg}</strong>
            </div>
            <div>
              <span>Team online</span>
              <strong>
                {chat.status === "ready"
                  ? `${online} / ${state.staff.length}`
                  : "—"}
              </strong>
            </div>
            <p>
              {chat.status === "ready"
                ? "Online status from CometChat."
                : "Connect chat to see live presence."}
            </p>
          </section>
          <section className="activity-section">
            <div className="section-heading">
              <h2>Latest activity</h2>
              <Badge>Session feed</Badge>
            </div>
            <div className="activity-feed">
              {state.feed.slice(0, 5).map((item) => (
                <div className="feed-item" key={item.id}>
                  <span className={`feed-marker ${item.kind}`} />
                  <div>
                    <p>{item.text}</p>
                    <small>
                      {clock(item.at)} IST<span> · {item.kind}</span>
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <div className="human-note">
            <span>
              <Check size={17} />
            </span>
            <p>
              Your team makes the call.
              <small>Recommendations always need a human decision.</small>
            </p>
          </div>
        </aside>
      </div>
      {create && <NewIncident onClose={() => setCreate(false)} />}
    </>
  );
}
