import { IncidentRoom } from '@/components/incidents/incident-room';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <IncidentRoom id={id} />; }
