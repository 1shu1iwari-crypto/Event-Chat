"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  MapPin,
  MessageCircle,
  Users,
} from "lucide-react";
import { useApp } from "@/components/app-provider";
import { staff } from "@/lib/seed";
import { Avatar, Badge } from "@/components/ui";
import { Brand } from "@/components/brand";
export default function Home() {
  const { state, request, busy } = useApp();
  const router = useRouter();
  const [uid, setUid] = useState("eventops-maya"),
    [accessCode, setAccessCode] = useState("");
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand href="/" />
        <a
          href="https://github.com/1shu1iwari-crypto/Event-Chat"
          target="_blank"
          rel="noreferrer"
        >
          View project <ArrowUpRight size={16} />
        </a>
      </header>
      <main className="landing-main">
        <section className="landing-copy">
          <span className="welcome-label">
            <span className="dot green" /> For the people behind the event
          </span>
          <h1>
            Big event.
            <br />
            Small screen.
            <br />
            <span>You've got this.</span>
          </h1>
          <p>
            Your team chat, incident response, and next move. Together in a
            workspace that goes wherever you do.
          </p>
          <div className="landing-principles">
            <span>
              <MessageCircle size={18} /> Talk to your team
            </span>
            <span>
              <Check size={18} /> Stay in command
            </span>
          </div>
          <div className="venue-art" aria-hidden="true">
            <div className="art-caption">One event. Every team connected.</div>
            <div className="art-path" />
            <span className="art-node art-node-one">Check-in</span>
            <span className="art-node art-node-two">Main stage</span>
            <span className="art-node art-node-three">Your team</span>
            <span className="art-hub">
              <span className="brand-symbol">
                <i />
                <i />
                <i />
              </span>
            </span>
            <div className="art-coordinate">NOVA / 2026</div>
          </div>
        </section>
        <section className="event-entry">
          <div className="event-poster">
            <div className="poster-top">
              <span className="event-monogram">N</span>
              <Badge>Demo event</Badge>
            </div>
            <h2>
              NovaHack
              <br />
              2026
              <span className="poster-star" aria-hidden="true">
                ✳
              </span>
            </h2>
            <p>1,000 builders. One connected team.</p>
            <div className="event-meta">
              <span>
                <MapPin size={16} /> 8 venue zones
              </span>
              <span>
                <Users size={16} /> 8 responders
              </span>
            </div>
          </div>
          <div className="entry-body">
            <h3>Your shift starts here.</h3>
            <p className="entry-intro">
              Choose a demo role to open the workspace.
            </p>
            {state?.viewer ? (
              <>
                <div className="signed-in">
                  <Avatar name={state.viewer.name} />
                  <span>
                    Welcome back<strong>{state.viewer.name}</strong>
                  </span>
                </div>
                <Link href="/command" className="button primary full">
                  Enter command center <ArrowRight size={18} />
                </Link>
                <button
                  className="text-button full"
                  onClick={() => void request("logout").catch(() => {})}
                >
                  Switch demo persona
                </button>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void request("session", { uid, accessCode })
                    .then(() => router.push("/command"))
                    .catch(() => {});
                }}
              >
                <label>
                  Demo role
                  <select value={uid} onChange={(e) => setUid(e.target.value)}>
                    {staff.map((s) => (
                      <option value={s.uid} key={s.uid}>
                        {s.name} · {s.role}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Event access code{" "}
                  <span className="optional-label">if required</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your event code"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                  />
                </label>
                <button className="button primary full" disabled={busy}>
                  {busy ? "Opening workspace…" : "Enter command center"}
                  <ArrowRight size={18} />
                </button>
                <p className="entry-note">
                  Fictional demo roles. No code needed on localhost.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <span>Built for the people who make it happen.</span>
        <span>EventOps · CometChat</span>
      </footer>
    </div>
  );
}
