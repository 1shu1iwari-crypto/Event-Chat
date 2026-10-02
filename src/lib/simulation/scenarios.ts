import type { Scenario, Team } from '@/types/domain';
export const scenarios: Record<Scenario, { title: string; description: string; messages: { sender: string; team: Team; text: string }[] }> = {
  registration: { title: 'Registration failure', description: 'A growing queue, an offline scanner, and a 15-minute wait.', messages: [
    { sender: 'eventops-kabir', team: 'volunteers', text: 'Entrance A queue is getting really long.' },
    { sender: 'eventops-priya', team: 'registration', text: 'Scanner 2 stopped responding at Entrance A.' },
    { sender: 'eventops-ananya', team: 'volunteers', text: 'Entrance A wait time is probably above 15 minutes now.' },
  ] },
  wifi: { title: 'Wi-Fi outage', description: 'Hall A loses connectivity during the build session.', messages: [{ sender: 'eventops-kabir', team: 'volunteers', text: 'Wi-Fi is down in Hall A. Several teams cannot connect.' }, { sender: 'eventops-arjun', team: 'tech', text: 'Confirmed Wi-Fi outage in Hall A; access point not responding.' }] },
  speaker: { title: 'Missing speaker', description: 'The next speaker has not arrived at the main stage.', messages: [{ sender: 'eventops-ananya', team: 'volunteers', text: 'Main Stage speaker is missing. Session starts in 5 minutes.' }, { sender: 'eventops-rohan', team: 'logistics', text: 'Speaker has not arrived at Main Stage; checking with their escort.' }] },
  food: { title: 'Food shortage', description: 'Lunch supplies are running low in the food zone.', messages: [{ sender: 'eventops-rohan', team: 'logistics', text: 'Food Zone lunch supplies running low.' }, { sender: 'eventops-kabir', team: 'volunteers', text: 'Food shortage at Food Zone, around 80 attendees still waiting.' }] },
  projector: { title: 'Projector failure', description: 'The workshop cannot display its presentation.', messages: [{ sender: 'eventops-ananya', team: 'volunteers', text: 'Projector stopped working in Workshop Zone.' }, { sender: 'eventops-arjun', team: 'tech', text: 'Projector failure confirmed in Workshop Zone; no display output.' }] },
  crowding: { title: 'Room overcrowding', description: 'Hall B receives reports of congestion at the doors.', messages: [{ sender: 'eventops-sara', team: 'security', text: 'Hall B is overcrowded. The doorway is congested.' }, { sender: 'eventops-kabir', team: 'volunteers', text: 'Hall B overcrowding; attendees have difficulty moving through the doorway.' }] },
};
