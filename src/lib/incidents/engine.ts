import type { EventState, Incident, Signal, TimelineEntry } from '@/types/domain';
import { analyzeOperationalMessage, correlateIncident, enrichAnalysis, generateIncidentBrief } from '../ai';
import { addIncidentMembers, configured, createIncidentGroup, sendText } from '../cometchat/server';
export function entry(text: string, kind: TimelineEntry['kind'] = 'status'): TimelineEntry { return { id: crypto.randomUUID(), at: new Date().toISOString(), text, kind }; }
export function record(state: EventState, incident: Incident, text: string, kind: TimelineEntry['kind'] = 'status') { const item = entry(text, kind); incident.timeline.push(item); state.feed.unshift(item); state.feed = state.feed.slice(0, 150); }
export async function ensureRoom(state: EventState, incident: Incident) {
  if (!configured()) { incident.roomState = 'unconfigured'; return; }
  try {
    const guid = await createIncidentGroup(incident, state.runId);
    // Persist the guid even if brief sending fails; retries reuse the same room.
    incident.cometChatGroupId = guid;
    await sendText('eventops-coordinator', guid, generateIncidentBrief(incident));
    incident.roomState = 'ready'; delete incident.roomError;
    record(state, incident, `${incident.id} response room connected via CometChat.`, 'communication');
  } catch (e) { incident.roomState = 'error'; incident.roomError = e instanceof Error ? e.message : 'Incident room creation failed.'; record(state, incident, `${incident.id} room needs attention.`, 'communication'); }
}
export async function ingestSignal(state: EventState, signal: Signal) {
  if (state.signals.some(s => s.id === signal.id) || new Date(signal.at) < new Date(state.startedAt)) return;
  state.signals.push(signal); state.signals = state.signals.slice(-500);
  state.feed.unshift(entry(`${state.staff.find(s => s.uid === signal.sender)?.name || 'Staff'}: ${signal.text}`, 'signal'));
  const closedMessages = new Set(state.incidents.filter(i => ['RESOLVED', 'ARCHIVED'].includes(i.status)).flatMap(i => i.relatedMessageIds));
  const eligible = state.signals.filter(s => !closedMessages.has(s.id));
  const processed: string[] = [];
  let candidate;
  while ((candidate = analyzeOperationalMessage(eligible, Date.now(), processed))) {
  processed.push(candidate.category);
  const existing = correlateIncident(state.incidents, candidate);
  if (existing) {
    const added = candidate.relatedMessageIds.filter(id => !existing.relatedMessageIds.includes(id));
    if (added.length) { existing.relatedMessageIds.push(...added); existing.observations = [...new Set([...existing.observations, ...candidate.observations])]; record(state, existing, 'Related operational report linked to this incident.', 'signal'); }
    continue;
  }
  // Resolved incidents cannot immediately reopen on their old supporting messages.
  const consumed = new Set(state.incidents.flatMap(i => i.relatedMessageIds));
  if (candidate.relatedMessageIds.some(id => consumed.has(id))) continue;
  const analysis = await enrichAnalysis(candidate, state.mode);
  const responders = state.staff.filter(s => analysis.recommendedTeams.includes(s.team) && s.availability === 'AVAILABLE');
  const volunteers = responders.filter(s => s.team === 'volunteers').slice(0, 2).map(s => s.uid);
  const id = `INC-${String(23 + state.incidents.length).padStart(3, '0')}`;
  const incident: Incident = { id, title: analysis.title, description: `${analysis.title} reported in ${analysis.zone}. Review the evidence and coordinate a response.`, category: analysis.category, severity: analysis.severity, status: 'DETECTED', zone: analysis.zone, confidence: analysis.confidence, observations: analysis.observations, inferences: analysis.inferences, recommendedTeams: analysis.recommendedTeams, actions: analysis.recommendedActions.map((text, index) => ({ id: `${id}-a${index}`, text, decision: 'pending', staffUids: /two available|volunteers/i.test(text) ? volunteers : [] })), assignedUsers: responders.filter(s => s.team !== 'volunteers').map(s => s.uid), relatedMessageIds: analysis.relatedMessageIds, createdAt: new Date().toISOString(), roomState: 'pending', timeline: analysis.relatedMessageIds.map(mid => { const m = state.signals.find(s => s.id === mid)!; return { id: m.id, at: m.at, text: `${state.staff.find(s => s.uid === m.sender)?.name}: ${m.text}`, kind: 'signal' }; }), analysisSource: analysis.source };
  state.incidents.unshift(incident);
  record(state, incident, `${id} detected: ${incident.title}.`, 'analysis');
  await ensureRoom(state, incident);
  }
}
export async function approveAction(state: EventState, incident: Incident, actionId: string, actor: string, decision: 'approved' | 'rejected', replacementUids?: string[]) {
  const action = incident.actions.find(a => a.id === actionId);
  if (!action) throw new Error('Action not found.');
  if (action.decision !== 'pending') throw new Error('This recommendation has already been decided.');
  if (['RESOLVED', 'ARCHIVED'].includes(incident.status)) throw new Error('This incident is closed.');
  const uids = replacementUids ?? action.staffUids;
  if (decision === 'approved') {
    for (const uid of uids) { const person = state.staff.find(s => s.uid === uid); if (!person || (person.availability !== 'AVAILABLE' && person.assignment !== incident.id)) throw new Error('Selected staff are unavailable. Modify the assignment.'); }
    if (incident.cometChatGroupId && incident.roomState === 'ready') await addIncidentMembers(incident.cometChatGroupId, uids);
    action.staffUids = uids;
    for (const uid of uids) { const person = state.staff.find(s => s.uid === uid)!; person.availability = 'ON INCIDENT'; person.assignment = incident.id; person.zone = incident.zone; }
    incident.assignedUsers = [...new Set([...incident.assignedUsers, ...uids])];
    incident.status = 'IN_PROGRESS'; incident.acknowledgedAt ??= new Date().toISOString();
  }
  action.decision = decision; action.decidedAt = new Date().toISOString(); action.decidedBy = actor;
  record(state, incident, `${decision === 'approved' ? 'Approved' : 'Rejected'}: ${action.text}${uids.length ? ` · ${uids.map(uid => state.staff.find(s => s.uid === uid)?.name).join(', ')}` : ''}`, 'action');
}
