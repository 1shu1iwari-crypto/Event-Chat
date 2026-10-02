import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeOperationalMessage } from '../src/lib/ai/index';
import { freshState, teamGroup } from '../src/lib/seed';
import { approveAction, ingestSignal } from '../src/lib/incidents/engine';
import { scenarios } from '../src/lib/simulation/scenarios';
import type { Scenario, Signal } from '../src/types/domain';
process.env.COMETCHAT_APP_ID = '';
process.env.COMETCHAT_REST_API_KEY = '';
function signals(scenario: Scenario): Signal[] { return scenarios[scenario].messages.map((m, idx) => ({ id: `${scenario}-${idx}`, text: m.text, sender: m.sender, group: teamGroup(m.team), at: new Date().toISOString(), transport: 'local' })); }
test('registration requires all three independent reports, not a lone keyword', () => {
  const reports = signals('registration');
  assert.equal(analyzeOperationalMessage(reports.slice(0, 2)), null);
  const result = analyzeOperationalMessage(reports)!;
  assert.equal(result.category, 'registration'); assert.equal(result.severity, 'P2'); assert.equal(result.observations.length, 3); assert.match(result.inferences[0], /may/);
});
test('stale reports and reports from conflicting zones are not fused', () => {
  const stale = signals('registration').map(s => ({ ...s, at: new Date(Date.now() - 6 * 60_000).toISOString() }));
  assert.equal(analyzeOperationalMessage(stale), null);
  const mixed = signals('registration'); mixed[1].text = 'Scanner 2 stopped responding at Entrance B.';
  assert.equal(analyzeOperationalMessage(mixed), null);
});
test('duplicate ingestion does not duplicate incidents; unrelated incidents still get detected', async () => {
  const state = freshState();
  for (const signal of signals('registration')) await ingestSignal(state, signal);
  assert.equal(state.incidents.length, 1); assert.equal(state.incidents[0].roomState, 'unconfigured');
  await ingestSignal(state, signals('registration')[0]); assert.equal(state.incidents.length, 1);
  for (const signal of signals('wifi')) await ingestSignal(state, signal);
  assert.equal(state.incidents.length, 2); assert.equal(state.incidents[0].category, 'wifi');
});
test('approval assigns staff once, rejection does not assign, and busy staff cannot be double-booked', async () => {
  const state = freshState(); for (const signal of signals('registration')) await ingestSignal(state, signal);
  const incident = state.incidents[0], deploy = incident.actions.find(a => a.staffUids.length)!;
  await approveAction(state, incident, deploy.id, 'eventops-maya', 'approved');
  assert.equal(state.staff.find(s => s.uid === 'eventops-kabir')!.assignment, incident.id); assert.equal(incident.status, 'IN_PROGRESS');
  await assert.rejects(approveAction(state, incident, deploy.id, 'eventops-maya', 'approved'), /already/);
  const other = structuredClone(incident); other.id = 'INC-999'; other.actions[0].decision = 'pending'; other.actions[0].staffUids = ['eventops-kabir'];
  await assert.rejects(approveAction(state, other, other.actions[0].id, 'eventops-maya', 'approved'), /unavailable/);
  await approveAction(state, incident, incident.actions[0].id, 'eventops-maya', 'rejected'); assert.equal(incident.actions[0].decision, 'rejected');
});
test('resolved evidence does not reopen an incident, but new reports can create a new one', async () => {
  const state = freshState(); for (const s of signals('registration')) await ingestSignal(state, s);
  state.incidents[0].status = 'RESOLVED';
  await ingestSignal(state, { id: 'ordinary', text: 'Lunch opens at 1pm.', sender: 'eventops-rohan', group: teamGroup('logistics'), at: new Date().toISOString(), transport: 'local' });
  assert.equal(state.incidents.length, 1);
  for (const s of signals('registration')) await ingestSignal(state, { ...s, id: `${s.id}-new` });
  assert.equal(state.incidents.length, 2);
});
test('medical reports only recommend escalation to responsible human leads', () => {
  const result = analyzeOperationalMessage([{ id: 'medical', text: 'Medical emergency reported in Hall B.', sender: 'eventops-kabir', group: teamGroup('volunteers'), at: new Date().toISOString(), transport: 'local' }])!;
  assert.equal(result.category, 'medical'); assert.equal(result.severity, 'P1'); assert.deepEqual(result.recommendedActions, ['Notify the Medical Lead and Operations Lead immediately']);
});
