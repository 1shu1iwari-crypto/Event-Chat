import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertOrigin, constantEqual, HttpError, requireSession, session, signIn, signOut } from '@/lib/auth';
import { readState, mutate, storage } from '@/lib/store';
import { freshState, staff, teamGroup, zones } from '@/lib/seed';
import { configured, mintToken, readVerifiedMessage, seedCometChat, sendText } from '@/lib/cometchat/server';
import { approveAction, ensureRoom, entry, ingestSignal, record } from '@/lib/incidents/engine';
import { generateAfterActionReport } from '@/lib/ai';
import { scenarios } from '@/lib/simulation/scenarios';
import type { Incident } from '@/types/domain';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
const scenarioSchema = z.enum(['registration', 'wifi', 'speaker', 'food', 'projector', 'crowding']);
const loginAttempts = new Map<string, { count: number; until: number }>();
function json(value: unknown) { return NextResponse.json(value, { headers: { 'Cache-Control': 'no-store' } }); }
function findIncident(state: Awaited<ReturnType<typeof readState>>, id: string) { const i = state.incidents.find(i => i.id === id); if (!i) throw new HttpError(404, 'Incident not found.'); return i; }
export async function GET(req: Request, context: Context) {
  try {
    const { path } = await context.params;
    if (path.join('/') === 'state') {
      const viewer = await session(); const state = viewer ? await readState() : freshState();
      return json({ ...state, viewer, configured: configured(), storage });
    }
    if (path.join('/') === 'cometchat/config') {
      await requireSession(); return json({ configured: configured(), appId: process.env.COMETCHAT_APP_ID || '', region: process.env.COMETCHAT_REGION || '' });
    }
    throw new HttpError(404, 'Endpoint not found.');
  } catch (e) { return errorResponse(e); }
}
export async function POST(req: Request, context: Context) {
  try {
    assertOrigin(req);
    if (!req.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'Send JSON.');
    const raw = await req.text(); if (raw.length > 20000) throw new HttpError(413, 'Request too large.');
    const body = JSON.parse(raw || '{}'); const { path } = await context.params; const route = path.join('/');
    if (route === 'session') {
      const data = z.object({ uid: z.string(), accessCode: z.string().max(128).optional() }).parse(body);
      const hostname = new URL(`http://${req.headers.get('host') || new URL(req.url).host}`).hostname;
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
      if (!local && (!process.env.EVENTOPS_ACCESS_CODE || (process.env.SESSION_SECRET?.length || 0) < 32)) throw new HttpError(503, 'Set EVENTOPS_ACCESS_CODE and a SESSION_SECRET of at least 32 characters before sharing this app.');
      const bucket = req.headers.get('x-forwarded-for')?.split(',')[0] || 'local';
      const attempts = loginAttempts.get(bucket);
      if (attempts && attempts.until > Date.now() && attempts.count >= 10) throw new HttpError(429, 'Too many sign-in attempts. Try again in one minute.');
      if (process.env.EVENTOPS_ACCESS_CODE && !constantEqual(data.accessCode || '', process.env.EVENTOPS_ACCESS_CODE)) {
        loginAttempts.set(bucket, { count: attempts && attempts.until > Date.now() ? attempts.count + 1 : 1, until: Date.now() + 60000 });
        throw new HttpError(401, 'Event access code is incorrect.');
      }
      if (!staff.some(s => s.uid === data.uid)) throw new HttpError(400, 'Choose a seeded event staff member.');
      await signIn(data.uid, new URL(req.url).protocol === 'https:'); return json({ ok: true });
    }
    if (route === 'logout') { await signOut(); return json({ ok: true }); }
    const actor = await requireSession();
    if (route === 'cometchat/token') return json(await mintToken(actor.uid));
    if (route === 'cometchat/seed') { await requireSession(true); await seedCometChat(); return json({ ok: true }); }
    if (route === 'signals') {
      const { messageId } = z.object({ messageId: z.string().regex(/^\d+$/) }).parse(body);
      const signal = await readVerifiedMessage(messageId, actor.uid);
      await mutate(s => ingestSignal(s, signal)); return json({ ok: true });
    }
    if (route === 'mode') { await requireSession(true); const { mode } = z.object({ mode: z.enum(['DEMO', 'LIVE']) }).parse(body); await mutate(s => { s.mode = mode; }); return json({ ok: true }); }
    if (route === 'simulation/run') {
      await requireSession(true);
      const { scenario, speed } = z.object({ scenario: scenarioSchema, speed: z.union([z.literal(1), z.literal(2), z.literal(0)]) }).parse(body);
      const run = await mutate(s => {
        if (s.simulations.some(r => r.status === 'running')) throw new HttpError(409, 'A scenario is already running.');
        if (s.incidents.some(i => i.category === scenario && !['RESOLVED', 'ARCHIVED'].includes(i.status))) throw new HttpError(409, 'Resolve the active incident before running this scenario again.');
        const run = { id: crypto.randomUUID(), scenario, speed, step: 0, startedAt: new Date().toISOString(), status: 'running' as const, transport: configured() ? 'cometchat' as const : 'local' as const };
        s.simulations.push(run); s.feed.unshift(entry(`${scenarios[scenario].title} scenario started (${run.transport === 'cometchat' ? 'real CometChat messages' : 'local engine exercise — chat disconnected'}).`)); return run;
      });
      return json(run);
    }
    if (route === 'simulation/tick') {
      await requireSession(true);
      await mutate(async s => {
        const run = s.simulations.find(r => r.status === 'running'); if (!run) return;
        const messages = scenarios[run.scenario].messages;
        while (run.step < messages.length && (run.speed === 0 || Date.now() - new Date(run.startedAt).getTime() >= run.step * 4000 / run.speed)) {
          const step = messages[run.step];
          try {
            const signal = run.transport === 'cometchat' ? await sendText(step.sender, teamGroup(step.team), step.text) : { id: `local-${run.id}-${run.step}`, text: step.text, sender: step.sender, group: teamGroup(step.team), at: new Date().toISOString(), transport: 'local' as const };
            await ingestSignal(s, signal); run.step++;
          } catch (e) { run.status = 'error'; run.error = e instanceof Error ? e.message : 'Scenario message failed.'; s.feed.unshift(entry(`Simulation paused: ${run.error}`, 'communication')); break; }
        }
        if (run.step === messages.length) run.status = 'complete';
      });
      return json({ ok: true });
    }
    if (route === 'simulation/reset') { await requireSession(true); await mutate(s => Object.assign(s, freshState())); return json({ ok: true }); }
    if (route === 'incidents') {
      const data = z.object({ title: z.string().min(3).max(120), description: z.string().min(3).max(1500), severity: z.enum(['P1', 'P2', 'P3', 'P4']), zone: z.enum(zones as [string, ...string[]]) }).parse(body);
      const incident = await mutate(async s => {
        const id = `INC-${String(23 + s.incidents.length).padStart(3, '0')}`;
        const i: Incident = { ...data, id, category: 'manual', status: 'DETECTED', confidence: 1, observations: [data.description], inferences: [], recommendedTeams: ['operations'], actions: [], assignedUsers: [...new Set(['eventops-maya', actor.uid])], relatedMessageIds: [], createdAt: new Date().toISOString(), roomState: 'pending', timeline: [], analysisSource: 'manual' };
        s.incidents.unshift(i); record(s, i, `${actor.name} reported ${id}: ${i.title}.`); await ensureRoom(s, i); return i;
      }); return json(incident);
    }
    if (path[0] === 'incidents' && path.length === 3) {
      const id = path[1], operation = path[2];
      if (['action', 'resolve', 'retry-room', 'archive'].includes(operation)) await requireSession(true);
      await mutate(async s => {
        const i = findIncident(s, id);
        if (!i.assignedUsers.includes(actor.uid) && actor.team !== 'operations') throw new HttpError(403, 'You are not on this response team.');
        if (operation === 'retry-room') { await ensureRoom(s, i); return; }
        if (operation === 'action') {
          const d = z.object({ actionId: z.string(), decision: z.enum(['approved', 'rejected']), staffUids: z.array(z.enum(staff.map(s => s.uid) as [string, ...string[]])).max(8).optional() }).parse(body);
          await approveAction(s, i, d.actionId, actor.uid, d.decision, d.staffUids); return;
        }
        if (operation === 'archive') { if (i.status !== 'RESOLVED') throw new HttpError(409, 'Resolve the incident first.'); i.status = 'ARCHIVED'; record(s, i, `${actor.name} archived the incident.`); return; }
        if (['RESOLVED', 'ARCHIVED'].includes(i.status)) throw new HttpError(409, 'This incident is closed.');
        if (operation === 'acknowledge') {
          if (!['DETECTED', 'TRIAGED'].includes(i.status)) throw new HttpError(409, 'Incident has already been acknowledged.');
          i.status = 'ACKNOWLEDGED'; i.acknowledgedAt = new Date().toISOString(); record(s, i, `${actor.name} acknowledged ${id}.`); return;
        }
        if (operation === 'triage') { if (i.status !== 'DETECTED') throw new HttpError(409, 'Incident is already triaged.'); i.status = 'TRIAGED'; record(s, i, `${actor.name} triaged ${id}.`); return; }
        if (operation === 'escalate') { i.status = 'ESCALATED'; record(s, i, `${actor.name} escalated ${id} for lead review.`); return; }
        if (operation === 'resolve') {
          const d = z.object({ summary: z.string().min(3).max(1500), rootCause: z.string().min(3).max(500), notes: z.string().max(1500).default('') }).parse(body);
          i.status = 'RESOLVED'; i.resolvedAt = new Date().toISOString(); i.report = generateAfterActionReport(i, d.summary, d.rootCause, d.notes);
          for (const person of s.staff) if (person.assignment === id) { person.availability = 'AVAILABLE'; delete person.assignment; }
          record(s, i, `${actor.name} resolved ${id}: ${d.summary}`); return;
        }
        throw new HttpError(404, 'Incident operation not found.');
      }); return json({ ok: true });
    }
    throw new HttpError(404, 'Endpoint not found.');
  } catch (e) { return errorResponse(e); }
}
function errorResponse(error: unknown) {
  if (error instanceof z.ZodError) return NextResponse.json({ error: 'Check the required fields and try again.' }, { status: 400 });
  if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  return NextResponse.json({ error: error instanceof Error ? error.message : 'Something went wrong. Try again.' }, { status: error instanceof HttpError ? error.status : 500 });
}
