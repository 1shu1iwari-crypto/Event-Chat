import { teams, staff, teamGroup } from '../seed';
import type { Incident, Signal } from '@/types/domain';
export function configured() { return !!(process.env.COMETCHAT_APP_ID && process.env.COMETCHAT_REGION && process.env.COMETCHAT_REST_API_KEY); }
export class ChatError extends Error { constructor(public code: string, message: string) { super(message); } }
export async function chatRequest<T = Record<string, unknown>>(endpoint: string, method = 'GET', body?: unknown, onBehalfOf?: string): Promise<T> {
  if (!configured()) throw new ChatError('NOT_CONFIGURED', 'Connect a CometChat app to enable live communication.');
  const id = process.env.COMETCHAT_APP_ID!, region = process.env.COMETCHAT_REGION!;
  if (!/^[a-zA-Z0-9-]+$/.test(id) || !['us', 'eu', 'in'].includes(region)) throw new Error('Invalid CometChat App ID or region.');
  const response = await fetch(`https://${id}.api-${region}.cometchat.io/v3${endpoint}`, { method, headers: { apikey: process.env.COMETCHAT_REST_API_KEY!, 'Content-Type': 'application/json', ...(onBehalfOf ? { onBehalfOf } : {}) }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', signal: AbortSignal.timeout(20000) });
  const result = await response.json();
  if (!response.ok || result.error) throw new ChatError(result.error?.code || `HTTP_${response.status}`, result.error?.message || 'CometChat request failed.');
  return result.data as T;
}
async function createIfMissing(endpoint: string, body: unknown, existingCode: string) {
  try { return await chatRequest(endpoint, 'POST', body); }
  catch (e) { if (!(e instanceof ChatError) || e.code !== existingCode) throw e; }
}
export async function seedCometChat() {
  for (const person of [...staff, { uid: 'eventops-coordinator', name: 'EventOps Coordinator' }]) {
    await createIfMissing('/users', { uid: person.uid, name: person.name }, 'ERR_UID_ALREADY_EXISTS');
  }
  const members = { admins: ['eventops-maya'], participants: [...staff.filter(s => s.uid !== 'eventops-maya').map(s => s.uid), 'eventops-coordinator'] };
  // All staff are subscribed to operational channels so signals can be correlated across teams.
  for (const team of teams) {
    const guid = teamGroup(team);
    await createIfMissing('/groups', { guid, name: `${team[0].toUpperCase() + team.slice(1)} · NovaHack`, type: 'private', owner: 'eventops-maya', tags: ['eventops-team'], members }, 'ERR_GUID_ALREADY_EXISTS');
    await chatRequest(`/groups/${guid}/members`, 'POST', members);
  }
}
export async function createIncidentGroup(incident: Incident, runId: string) {
  const guid = `eventops-${runId}-${incident.id.toLowerCase()}`;
  const participants = [...new Set([...incident.assignedUsers, 'eventops-coordinator'])].filter(uid => uid !== 'eventops-maya');
  await createIfMissing('/groups', { guid, name: `${incident.id} · ${incident.title}`, type: 'private', owner: 'eventops-maya', members: { admins: ['eventops-maya'], participants } }, 'ERR_GUID_ALREADY_EXISTS');
  const results = await chatRequest<Record<string, { success?: boolean; error?: unknown }>>(`/groups/${guid}/members`, 'POST', { admins: ['eventops-maya'], participants });
  // CometChat may return per-member failures with HTTP 200. Verify the actual roster before ready.
  const roster = await chatRequest<{ uid: string }[]>(`/groups/${guid}/members?perPage=100`);
  if (!['eventops-maya', ...participants].every(uid => roster.some(m => m.uid === uid))) throw new Error('CometChat room created, but some responders could not be added. Retry room setup.');
  void results;
  return guid;
}
export async function addIncidentMembers(guid: string, uids: string[]) {
  if (!uids.length) return;
  await chatRequest(`/groups/${guid}/members`, 'POST', { participants: uids });
  const roster = await chatRequest<{ uid: string }[]>(`/groups/${guid}/members?perPage=100`);
  if (!uids.every(uid => roster.some(m => m.uid === uid))) throw new Error('Could not add all assigned staff to the incident room.');
}
export async function sendText(sender: string, guid: string, text: string): Promise<Signal> {
  const message = await chatRequest<{ id: string | number; sentAt?: number }>('/messages', 'POST', { receiver: guid, receiverType: 'group', category: 'message', type: 'text', data: { text } }, sender);
  return { id: String(message.id), text, sender, group: guid, at: message.sentAt ? new Date(message.sentAt * 1000).toISOString() : new Date().toISOString(), transport: 'cometchat' };
}
export async function mintToken(uid: string) { return chatRequest<{ authToken: string }>(`/users/${uid}/auth_tokens`, 'POST', { force: false }); }
export async function readVerifiedMessage(id: string, uid: string): Promise<Signal> {
  if (!/^\d+$/.test(id)) throw new Error('Invalid message ID.');
  const m = await chatRequest<{ id: string | number; sender: string | { uid: string }; receiver: string; receiverType: string; type: string; data: { text?: string }; sentAt: number }>(`/messages/${id}`, 'GET', undefined, uid);
  if (m.type !== 'text' || m.receiverType !== 'group' || !teams.some(team => teamGroup(team) === m.receiver) || !m.data?.text) throw new Error('Only operational team text messages can be analyzed.');
  return { id: String(m.id), text: m.data.text, sender: typeof m.sender === 'string' ? m.sender : m.sender.uid, group: m.receiver, at: new Date(m.sentAt * 1000).toISOString(), transport: 'cometchat' };
}
