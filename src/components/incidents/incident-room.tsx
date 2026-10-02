"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  Edit3,
  MessageSquare,
  Phone,
  ShieldAlert,
  X,
} from "lucide-react";
import { useApp } from "../app-provider";
import { ChatPanel } from "../chat/chat-loader";
import {
  Avatar,
  Badge,
  clock,
  duration,
  elapsed,
  Empty,
  Modal,
  readableStatus,
  Severity,
} from "../ui";
import type { Action } from "@/types/domain";
export function IncidentRoom({ id }: { id: string }) {
  const { state, request, busy } = useApp();
  const [resolve, setResolve] = useState(false),
    [modify, setModify] = useState<Action | null>(null),
    [selectedUids, setSelectedUids] = useState<string[]>([]),
    [callLead, setCallLead] = useState(false),
    [showTimeline, setShowTimeline] = useState(true),
    [view, setView] = useState("overview"),
    [proposeAction, setProposeAction] = useState(false),
    [newActionText, setNewActionText] = useState("");
  if (!state?.viewer) return null;
  const i = state.incidents.find((i) => i.id === id);
  if (!i)
    return (
      <Empty
        title="Incident not found"
        action={
          <Link className="button" href="/incidents">
            Back to incidents
          </Link>
        }
      >
        This incident may have been cleared by an event reset.
      </Empty>
    );
  const lead = state.viewer.team === "operations",
    member = lead || i.assignedUsers.includes(state.viewer.uid),
    closed = ["RESOLVED", "ARCHIVED"].includes(i.status);
  const command = (operation: string, body?: unknown) =>
    request(`incidents/${id}/${operation}`, body).catch(() => {});
  const techLead = state.staff.find(
    (s) =>
      s.team ===
      (i.category === "medical"
        ? "medical"
        : i.category === "security" || i.category === "crowding"
          ? "security"
          : "tech"),
  ) || state.staff.find((s) => s.role.includes("Lead")) || state.staff[0];
  const roomBanner = (
    <Link href={`/incidents/${id}`} className="incident-chat-card">
      <span className="mono">{id}</span>
      <strong>{i.title}</strong>
      <span>
        {i.severity} · {i.zone} · {readableStatus(i.status)}
      </span>
    </Link>
  );
  return (
    <>
      <Link href="/incidents" className="back-link">
        <ArrowLeft size={14} /> All incidents
      </Link>
      <div className="page-heading incident-heading">
        <div>
          <div className="eyebrow">
            <span className="mono">{id}</span>
            <Severity value={i.severity} />
            <Badge tone={closed ? "green" : "amber"}>
              {readableStatus(i.status)}
            </Badge>
          </div>
          <h1>{i.title}</h1>
          <p>
            {i.zone}
            <span className="separator">·</span>
            <Clock3 size={13} />
            {closed && i.report
              ? duration(i.report.durationSeconds)
              : elapsed(i.createdAt)}
            <span className="separator">·</span>
            {i.relatedMessageIds.length} linked reports
          </p>
        </div>
        <div className="header-actions">
          {!closed && (
            <>
              <button
                className="button"
                disabled={
                  busy || !member || !["DETECTED", "TRIAGED", "ESCALATED"].includes(i.status) || !!i.acknowledgedAt
                }
                onClick={() => void command("acknowledge")}
              >
                <Check size={15} /> {i.acknowledgedAt ? "Acknowledged" : "Acknowledge"}
              </button>
              <button
                className="button"
                disabled={busy || !member || i.status === "ESCALATED"}
                onClick={() => void command("escalate")}
              >
                {i.status === "ESCALATED" ? "Escalated" : "Escalate"}
              </button>
              <button
                className="button primary"
                disabled={!lead || busy}
                onClick={() => setResolve(true)}
              >
                <CheckCheck size={15} /> Resolve
              </button>
            </>
          )}
          {i.status === "RESOLVED" && lead && (
            <button
              className="button"
              disabled={busy}
              onClick={() => void command("archive")}
            >
              Archive incident
            </button>
          )}
        </div>
      </div>
      <nav className="room-tabs" aria-label="Incident views">
        {["overview", "actions", "chat"].map((tab) => (
          <button
            key={tab}
            aria-pressed={view === tab}
            className={view === tab ? "selected" : ""}
            onClick={() => setView(tab)}
          >
            {tab === "overview"
              ? "Overview"
              : tab === "actions"
                ? "Actions"
                : "Response chat"}
            {tab === "actions" && (
              <span>
                {i.actions.filter((a) => a.decision === "pending").length}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="room-content" data-view={view}>
        <div className="incident-workspace">
          <aside className="evidence-column">
            <section className="panel evidence">
              <div className="panel-heading">
                <h2>Situation brief</h2>
                <ShieldAlert size={16} />
              </div>
              <div className="evidence-body">
                <div className="evidence-label">
                  <i className="dot green" /> OBSERVED
                </div>
                <ul>
                  {i.observations.map((s, index) => (
                    <li key={index}>{s}</li>
                  ))}
                </ul>
                <div className="evidence-label">
                  <i className="dot amber" /> INFERRED
                </div>
                {i.inferences.length ? (
                  <ul>
                    {i.inferences.map((s, index) => (
                      <li key={index}>{s}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">
                    No inferred explanation. Awaiting team assessment.
                  </p>
                )}
                <div className="confidence">
                  <span>
                    {i.analysisSource === "manual"
                      ? "Human report"
                      : `${i.analysisSource === "llm" ? "Model-assisted" : "Rule-based"} analysis`}
                  </span>
                  {i.analysisSource !== "manual" && (
                    <strong>{Math.round(i.confidence * 100)}%</strong>
                  )}
                </div>
                {i.analysisSource !== "manual" && (
                  <p className="fineprint">
                    Heuristic confidence; not a calibrated probability. Reports
                    have not been independently verified.
                  </p>
                )}
              </div>
            </section>
            <section className="panel responders">
              <div className="panel-heading">
                <h2>Response team</h2>
                <span className="mono muted">{i.assignedUsers.length}</span>
              </div>
              {[...new Set(i.assignedUsers)].map((uid) => {
                const person = state.staff.find((s) => s.uid === uid);
                return (
                  person && (
                    <div className="responder" key={uid}>
                      <Avatar name={person.name} small />
                      <span>
                        <strong>{person.name}</strong>
                        <small>{person.role}</small>
                      </span>
                    </div>
                  )
                );
              })}
              <div className="responder coordinator">
                <span className="coordinator-icon">
                  <MessageSquare size={14} />
                </span>
                <span>
                  <strong>EventOps Coordinator</strong>
                  <small>Incident briefs & recommendations</small>
                </span>
              </div>
            </section>
          </aside>
          <section className="panel incident-conversation">
            <div className="panel-heading">
              <h2>Response room</h2>
              <Badge tone={i.roomState === "ready" ? "green" : "amber"}>
                {i.roomState === "ready" ? "COMETCHAT" : i.roomState}
              </Badge>
            </div>
            {member && i.roomState === "ready" && i.cometChatGroupId ? (
              <ChatPanel groupId={i.cometChatGroupId} banner={roomBanner} />
            ) : (
              <Empty
                title={
                  member
                    ? "Response room needs attention"
                    : "This room is for assigned responders"
                }
                action={
                  lead && i.roomState !== "ready" ? (
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => void command("retry-room")}
                    >
                      Retry room setup
                    </button>
                  ) : undefined
                }
              >
                {member
                  ? i.roomError ||
                    "Connect CometChat and retry room setup to create the real team conversation."
                  : "The Operations Lead can add you through an approved staff assignment."}
              </Empty>
            )}
          </section>
          <aside className="actions-column">
            <section className="panel action-panel">
              <div className="panel-heading">
                <h2>Recommended actions</h2>
                <Badge>HUMAN APPROVAL</Badge>
              </div>
              {i.actions.length ? (
                i.actions.map((action) => (
                  <div className="action-item" key={action.id}>
                    <div className="action-title">
                      <span className={`action-indicator ${action.decision}`}>
                        {action.decision === "approved" ? (
                          <Check size={13} />
                        ) : action.decision === "rejected" ? (
                          <X size={13} />
                        ) : null}
                      </span>
                      <strong>{action.text}</strong>
                    </div>
                    {action.staffUids.length > 0 && (
                      <p className="action-staff">
                        {action.staffUids
                          .map(
                            (uid) =>
                              state.staff.find((s) => s.uid === uid)?.name,
                          )
                          .join(" + ")}
                        <small>
                          {action.decision === "pending"
                            ? `Suggested responders for ${i.zone}`
                            : "Assignment approved by Operations"}
                        </small>
                      </p>
                    )}
                    {action.decision === "pending" && !closed ? (
                      <div className="action-buttons">
                        <button
                          className="button primary small"
                          disabled={!lead || busy}
                          onClick={() =>
                            void command("action", {
                              actionId: action.id,
                              decision: "approved",
                            })
                          }
                        >
                          Approve
                        </button>
                        {!closed && lead && (
                          <button
                            className="icon-button"
                            disabled={!lead || busy}
                            aria-label={`Assign responders for ${action.text}`}
                            title="Assign responders"
                            onClick={() => {
                              setModify(action);
                              setSelectedUids(action.staffUids);
                            }}
                          >
                            <Edit3 size={15} />
                          </button>
                        )}
                        <button
                          className="text-button"
                          disabled={!lead || busy}
                          onClick={() =>
                            void command("action", {
                              actionId: action.id,
                              decision: "rejected",
                            })
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <Badge
                        tone={
                          action.decision === "approved" ? "green" : "neutral"
                        }
                      >
                        {action.decision === "pending"
                          ? "Not acted on"
                          : action.decision}
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="panel-text muted">
                  Manual incident. Coordinate the next steps with your response
                  team.
                </p>
              )}
              {!closed && lead && (
                <button
                  className="button small"
                  style={{ marginTop: "0.75rem" }}
                  disabled={busy}
                  onClick={() => {
                    setNewActionText("");
                    setSelectedUids([]);
                    setProposeAction(true);
                  }}
                >
                  <Edit3 size={14} /> Propose action
                </button>
              )}
              {!lead && (
                <p className="fineprint panel-text">
                  The Operations Lead approves recommendations.
                </p>
              )}
            </section>
            <section className="panel escalation-panel">
              <Phone size={19} />
              <h3>Talk it through.</h3>
              <p>
                Open a direct conversation with {techLead.name}, then use the
                real voice or video call control.
              </p>
              <button
                className="button full"
                disabled={!state.configured || !member}
                onClick={() => setCallLead(true)}
              >
                <Phone size={14} /> Call {techLead.role}
              </button>
              <small>
                Group calls are joined from meeting messages in the response
                room.
              </small>
            </section>
          </aside>
        </div>
        {i.report && (
          <section className="panel after-action">
            <div className="panel-heading">
              <h2>After-action report</h2>
              <Badge tone="green">RESOLVED</Badge>
            </div>
            <div className="report-grid">
              <div>
                <span className="eyebrow">OUTCOME · HUMAN CONFIRMED</span>
                <h3>{i.report.summary}</h3>
                <p>
                  <strong>Root cause:</strong> {i.report.rootCause}
                </p>
                {i.report.notes && <p>{i.report.notes}</p>}
              </div>
              <div className="report-details">
                <span>
                  Detected<strong>{clock(i.createdAt)} IST</strong>
                </span>
                <span>
                  Acknowledged
                  <strong>
                    {i.acknowledgedAt
                      ? clock(i.acknowledgedAt) + " IST"
                      : "Not recorded"}
                  </strong>
                </span>
                <span>
                  Resolved<strong>{clock(i.resolvedAt!)} IST</strong>
                </span>
                <span>
                  Resolution time
                  <strong>{duration(i.report.durationSeconds)}</strong>
                </span>
                <span>
                  Participants<strong>{i.assignedUsers.length}</strong>
                </span>
                <span>
                  Approved actions
                  <strong>
                    {i.actions.filter((a) => a.decision === "approved").length}
                  </strong>
                </span>
              </div>
            </div>
          </section>
        )}
        <section className="panel timeline">
          <button
            className="panel-heading full"
            onClick={() => setShowTimeline((v) => !v)}
            aria-expanded={showTimeline}
          >
            <h2>Incident timeline</h2>
            <ChevronDown size={16} />
          </button>
          {showTimeline && (
            <div className="timeline-items">
              {i.timeline.map((item) => (
                <div key={item.id}>
                  <span className="mono muted">{clock(item.at)} IST</span>
                  <i
                    className={`dot ${item.kind === "analysis" ? "amber" : "green"}`}
                  />
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
      {resolve && (
        <Modal title="Resolve this incident" onClose={() => setResolve(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const d = new FormData(e.currentTarget);
              void request(`incidents/${id}/resolve`, Object.fromEntries(d))
                .then(() => {
                  setResolve(false);
                  setView("overview");
                })
                .catch(() => {});
            }}
          >
            <p className="form-note">
              Confirm the outcome. Assigned staff will become available and the
              incident timeline will be preserved.
            </p>
            <label>
              Resolution summary
              <textarea
                name="summary"
                required
                minLength={3}
                maxLength={1500}
                rows={3}
                placeholder="What was restored or resolved?"
                autoFocus
              />
            </label>
            <label>
              Confirmed root cause
              <input
                name="rootCause"
                required
                minLength={3}
                maxLength={500}
                defaultValue={i.inferences[0] || ""}
                placeholder="Write ‘Unconfirmed’ if the cause is still unknown"
              />
            </label>
            <label>
              Notes (optional)
              <textarea name="notes" maxLength={1500} rows={2} />
            </label>
            <button className="button primary full" disabled={busy}>
              Confirm resolution
            </button>
          </form>
        </Modal>
      )}
      {modify && (
        <Modal title="Modify the assignment" onClose={() => setModify(null)}>
          <p className="form-note">{modify.text}</p>
          <div className="staff-picker">
            {state.staff
              .filter(
                (s) => s.availability === "AVAILABLE" || s.assignment === id,
              )
              .map((s) => (
                <label key={s.uid}>
                  <input
                    type="checkbox"
                    checked={selectedUids.includes(s.uid)}
                    onChange={(e) =>
                      setSelectedUids((uids) =>
                        e.target.checked
                          ? [...uids, s.uid]
                          : uids.filter((uid) => uid !== s.uid),
                      )
                    }
                  />
                  <span>
                    {s.name}
                    <small>
                      {s.role} · {s.zone}
                    </small>
                  </span>
                </label>
              ))}
          </div>
          <button
            className="button primary full"
            disabled={busy || !selectedUids.length}
            onClick={() =>
              void request(`incidents/${id}/action`, {
                actionId: modify.id,
                decision: "approved",
                staffUids: selectedUids,
              })
                .then(() => setModify(null))
                .catch(() => {})
            }
          >
            Approve modified assignment
          </button>
        </Modal>
      )}
      {callLead && (
        <Modal
          title={`Escalate to ${techLead.name}`}
          onClose={() => setCallLead(false)}
        >
          <div className="direct-call-chat">
            <ChatPanel leadUid={techLead.uid} />
          </div>
        </Modal>
      )}
      {proposeAction && (
        <Modal title="Propose an action" onClose={() => setProposeAction(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newActionText.trim()) return;
              void request(`incidents/${id}/add-action`, {
                text: newActionText.trim(),
                staffUids: selectedUids,
              })
                .then(() => {
                  setProposeAction(false);
                  setNewActionText("");
                  setSelectedUids([]);
                })
                .catch(() => {});
            }}
          >
            <p className="form-note">
              Describe the operational action. You can optionally assign available responders.
            </p>
            <label>
              Action description
              <input
                required
                minLength={3}
                maxLength={300}
                placeholder="e.g. Deploy technical check at Entrance A"
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                autoFocus
              />
            </label>
            <p className="form-note" style={{ marginTop: "0.5rem", marginBottom: "0.25rem" }}>
              Assign responders (optional):
            </p>
            <div className="staff-picker">
              {state.staff
                .filter(
                  (s) => s.availability === "AVAILABLE" || s.assignment === id,
                )
                .map((s) => (
                  <label key={s.uid}>
                    <input
                      type="checkbox"
                      checked={selectedUids.includes(s.uid)}
                      onChange={(e) =>
                        setSelectedUids((uids) =>
                          e.target.checked
                            ? [...uids, s.uid]
                            : uids.filter((uid) => uid !== s.uid),
                        )
                      }
                    />
                    <span>
                      {s.name}
                      <small>
                        {s.role} · {s.zone}
                      </small>
                    </span>
                  </label>
                ))}
            </div>
            <button className="button primary full" disabled={busy || !newActionText.trim()}>
              Add recommended action
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
