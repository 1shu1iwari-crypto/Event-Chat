export type Team = 'operations' | 'registration' | 'tech' | 'logistics' | 'security' | 'medical' | 'volunteers';
export type Status = 'DETECTED' | 'TRIAGED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'ARCHIVED';
export type Severity = 'P1' | 'P2' | 'P3' | 'P4';
export type Scenario = 'registration' | 'wifi' | 'speaker' | 'food' | 'projector' | 'crowding';
export interface Staff { uid: string; name: string; role: string; team: Team; zone: string; availability: 'AVAILABLE' | 'ON INCIDENT' | 'OFFLINE'; assignment?: string }
export interface Signal { id: string; text: string; sender: string; group: string; at: string; transport: 'cometchat' | 'local'; }
export interface Action { id: string; text: string; decision: 'pending' | 'approved' | 'rejected'; staffUids: string[]; decidedAt?: string; decidedBy?: string; }
export interface TimelineEntry { id: string; at: string; text: string; kind: 'signal' | 'analysis' | 'action' | 'status' | 'communication'; }
export interface Incident { id: string; title: string; description: string; category: Scenario | 'manual' | 'medical' | 'security'; severity: Severity; status: Status; zone: string; confidence: number; observations: string[]; inferences: string[]; recommendedTeams: Team[]; actions: Action[]; assignedUsers: string[]; relatedMessageIds: string[]; createdAt: string; acknowledgedAt?: string; resolvedAt?: string; cometChatGroupId?: string; roomState: 'pending' | 'ready' | 'error' | 'unconfigured'; roomError?: string; timeline: TimelineEntry[]; report?: { summary: string; rootCause: string; notes: string; durationSeconds: number; }; analysisSource: 'rules' | 'llm' | 'manual'; }
export interface SimulationRun { id: string; scenario: Scenario; speed: number; step: number; startedAt: string; status: 'running' | 'complete' | 'error'; error?: string; transport: 'cometchat' | 'local'; }
export interface EventState { version: number; runId: string; startedAt: string; staff: Staff[]; incidents: Incident[]; signals: Signal[]; feed: TimelineEntry[]; simulations: SimulationRun[]; mode: 'DEMO' | 'LIVE'; }
export interface AppSnapshot extends EventState { viewer: Staff | null; configured: boolean; storage: 'postgres' | 'file'; }
