"use client";
import Link from "next/link";
import { useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { useApp } from "@/components/app-provider";
import { useChat } from "@/components/chat/chat-context";
import { Avatar, Badge, Empty } from "@/components/ui";
import { teams } from "@/lib/seed";
export default function Page() {
  const { state } = useApp();
  const chat = useChat();
  const [team, setTeam] = useState("all"),
    [query, setQuery] = useState("");
  if (!state) return null;
  const people = state.staff.filter(
    (s) =>
      (team === "all" || s.team === team) &&
      `${s.name} ${s.role} ${s.zone} ${s.availability}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR PEOPLE</div>
          <h1>Your team</h1>
          <p>
            {state.staff.filter((s) => s.availability === "AVAILABLE").length}{" "}
            available ·{" "}
            {state.staff.filter((s) => s.availability === "ON INCIDENT").length}{" "}
            on incident · {state.staff.length} demo responders
          </p>
        </div>
        <Badge>8 responders</Badge>
      </div>
      <div className="list-toolbar">
        <label className="inline-select">
          <span>Team</span>
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="all">All teams</option>
            {teams.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="search-input">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a responder"
            aria-label="Find staff"
          />
        </label>
      </div>
      <div className="staff-grid">
        {people.map((s) => (
          <article className="panel staff-card" key={s.uid}>
            <div className="staff-card-top">
              <Avatar name={s.name} />
              <Badge tone={s.availability === "AVAILABLE" ? "green" : "amber"}>
                {s.availability.toLowerCase()}
              </Badge>
            </div>
            <h2>{s.name}</h2>
            <p>{s.role}</p>
            <div className="staff-details">
              <span>
                Current zone<strong>{s.zone}</strong>
              </span>
              <span>
                Presence
                <strong>
                  <i
                    className={`dot ${chat.presence[s.uid] === "online" ? "green" : "neutral"}`}
                  />
                  {chat.presence[s.uid] || "Unavailable"}
                </strong>
              </span>
            </div>
            <div className="staff-assignment">
              {s.assignment ? (
                <Link href={`/incidents/${s.assignment}`}>
                  <span className="mono">{s.assignment}</span> Open assignment{" "}
                  <ArrowUpRight size={14} />
                </Link>
              ) : (
                <span>No current assignment</span>
              )}
            </div>
          </article>
        ))}
      </div>
      {!people.length && (
        <Empty title="No matching staff">Try a different team or search.</Empty>
      )}
      <p className="footnote">
        Availability is an EventOps work state. Online/offline is real CometChat
        presence. Assigned responders can be busy even when they are offline.
      </p>
    </>
  );
}
