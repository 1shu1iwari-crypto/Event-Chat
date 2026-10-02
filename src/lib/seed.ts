import type { EventState, Staff, Team } from '@/types/domain';
export const teams: Team[] = ['operations', 'registration', 'tech', 'logistics', 'security', 'medical', 'volunteers'];
export const zones = ['Entrance A', 'Entrance B', 'Main Stage', 'Hall A', 'Hall B', 'Food Zone', 'Workshop Zone', 'Operations Room'];
export const staff: Staff[] = [
  { uid: 'eventops-maya', name: 'Maya Rao', role: 'Operations Lead', team: 'operations', zone: 'Operations Room', availability: 'AVAILABLE' },
  { uid: 'eventops-arjun', name: 'Arjun Mehta', role: 'Tech Lead', team: 'tech', zone: 'Hall A', availability: 'AVAILABLE' },
  { uid: 'eventops-priya', name: 'Priya Sharma', role: 'Registration Lead', team: 'registration', zone: 'Entrance A', availability: 'AVAILABLE' },
  { uid: 'eventops-kabir', name: 'Kabir Singh', role: 'Volunteer', team: 'volunteers', zone: 'Entrance B', availability: 'AVAILABLE' },
  { uid: 'eventops-ananya', name: 'Ananya Patel', role: 'Volunteer', team: 'volunteers', zone: 'Entrance B', availability: 'AVAILABLE' },
  { uid: 'eventops-rohan', name: 'Rohan Gupta', role: 'Logistics Lead', team: 'logistics', zone: 'Food Zone', availability: 'AVAILABLE' },
  { uid: 'eventops-sara', name: 'Sara Khan', role: 'Security Lead', team: 'security', zone: 'Main Stage', availability: 'AVAILABLE' },
  { uid: 'eventops-neha', name: 'Neha Joshi', role: 'Medical Lead', team: 'medical', zone: 'Hall B', availability: 'AVAILABLE' },
];
export function freshState(): EventState {
  const now = new Date().toISOString();
  return { version: 1, runId: crypto.randomUUID().slice(0, 8), startedAt: now, staff: structuredClone(staff), incidents: [], signals: [], simulations: [], mode: 'DEMO', feed: [{ id: crypto.randomUUID(), at: now, text: 'NovaHack operations desk is open. All zones awaiting reports.', kind: 'status' }] };
}
export function teamGroup(team: Team) { return `eventops-novahack-${team}`; }
