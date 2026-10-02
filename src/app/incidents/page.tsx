'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, ChevronRight, Search } from 'lucide-react';
import { useApp } from '@/components/app-provider';
import { NewIncident } from '@/components/incidents/new-incident';
import { Badge, Empty, Severity, clock, readableStatus } from '@/components/ui';
export default function Page() {
  const { state } = useApp(); const [create, setCreate] = useState(false), [filter, setFilter] = useState('active'), [query, setQuery] = useState('');
  const incidents = state?.incidents.filter(i => (filter === 'all' || (filter === 'active' ? !['RESOLVED', 'ARCHIVED'].includes(i.status) : ['RESOLVED', 'ARCHIVED'].includes(i.status))) && `${i.id} ${i.title} ${i.zone} ${i.severity} ${i.category} ${readableStatus(i.status)}`.toLowerCase().includes(query.toLowerCase())) || [];
  return <><div className="page-heading"><div><div className="eyebrow">RESPONSE DESK</div><h1>Incidents</h1><p>From the first report to the final resolution.</p></div><button className="button" onClick={() => setCreate(true)}><Plus size={16} /> Report incident</button></div><div className="list-toolbar"><div className="tabs">{['active', 'resolved', 'all'].map(f => <button key={f} className={filter === f ? 'selected' : ''} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div><label className="search-input"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search incidents" aria-label="Search incidents" /></label></div><section className="panel">{incidents.length ? <div className="incident-list">{incidents.map(i => <Link href={`/incidents/${i.id}`} key={i.id} className="incident-row"><span className="mono muted">{i.id}</span><div className="incident-name"><strong>{i.title}</strong><small>{i.zone} · detected {clock(i.createdAt)} IST</small></div><Severity value={i.severity} /><Badge>{readableStatus(i.status)}</Badge><ChevronRight size={16} /></Link>)}</div> : <Empty title="Nothing on this desk yet">Report an incident or run a scenario in the simulation lab.</Empty>}</section>{create && <NewIncident onClose={() => setCreate(false)} />}</>;
}
