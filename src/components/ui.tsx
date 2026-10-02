'use client';
import { useEffect, useRef } from 'react';
import { X, ArrowUpRight } from 'lucide-react';
import type { Incident } from '@/types/domain';
export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) { return <span className={`badge ${tone}`}>{children}</span>; }
export function Severity({ value }: { value: Incident['severity'] }) { return <Badge tone={value === 'P1' ? 'red' : value === 'P2' ? 'amber' : 'neutral'}>{value} {({ P1: 'Critical', P2: 'High', P3: 'Medium', P4: 'Low' })[value]}</Badge>; }
export function Avatar({ name, small = false }: { name: string; small?: boolean }) { return <span className={`avatar ${small ? 'small' : ''}`} aria-hidden="true">{name.split(' ').map(s => s[0]).slice(0, 2).join('')}</span>; }
export function Empty({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) { return <div className="empty-state"><span className="empty-cross"><ArrowUpRight size={24} /></span><h3>{title}</h3><p>{children}</p>{action}</div>; }
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); const dialog = ref.current; return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="modal" onCancel={onClose} aria-label={title}><header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={18} /></button></header>{children}</dialog>;
}
export function clock(at: string) { return new Date(at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }); }
export function duration(seconds: number) { return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`; }
export function elapsed(at: string) { return duration(Math.max(0, (Date.now() - new Date(at).getTime()) / 1000)); }
export function readableStatus(value: string) { return value.toLowerCase().replaceAll('_', ' '); }
