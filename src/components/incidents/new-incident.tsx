'use client';
import { useRouter } from 'next/navigation';
import { useApp } from '../app-provider';
import { Modal } from '../ui';
import { zones } from '@/lib/seed';
import type { Incident } from '@/types/domain';
export function NewIncident({ onClose }: { onClose: () => void }) {
  const { request, busy } = useApp(); const router = useRouter();
  return <Modal title="Report an incident" onClose={onClose}><form onSubmit={e => { e.preventDefault(); const d = new FormData(e.currentTarget); void request<Incident>('incidents', Object.fromEntries(d)).then(i => { onClose(); router.push(`/incidents/${i.id}`); }).catch(() => {}); }}><p className="form-note">Start with what you observed. A private response room will be created in CometChat.</p><label>Incident title<input name="title" required minLength={3} maxLength={120} placeholder="What needs attention?" autoFocus /></label><label>Observed details<textarea name="description" required minLength={3} maxLength={1500} rows={3} placeholder="Where, what happened, and who reported it" /></label><div className="form-row"><label>Venue zone<select name="zone">{zones.map(z => <option key={z}>{z}</option>)}</select></label><label>Severity<select name="severity" defaultValue="P2"><option value="P1">P1 · Critical</option><option value="P2">P2 · High</option><option value="P3">P3 · Medium</option><option value="P4">P4 · Low</option></select></label></div><button className="button primary full" disabled={busy}>{busy ? 'Creating response room…' : 'Create incident'}</button></form></Modal>;
}
