'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AppSnapshot } from '@/types/domain';
interface Context { state: AppSnapshot | null; error: string; clearError: () => void; refresh: () => Promise<void>; request: <T = unknown>(path: string, body?: unknown) => Promise<T>; busy: boolean; }
const AppContext = createContext<Context | null>(null);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppSnapshot | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const fetching = useRef(false), ticking = useRef(false);
  const refresh = useCallback(async () => {
    if (fetching.current) return; fetching.current = true;
    try { const r = await fetch('/api/state', { cache: 'no-store' }); const data = await r.json(); if (!r.ok) throw new Error(data.error); setState(data); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load event state.'); }
    finally { fetching.current = false; }
  }, []);
  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 2000); return () => clearInterval(timer); }, [refresh]);
  useEffect(() => {
    if (state?.viewer?.team !== 'operations' || !state.simulations.some(s => s.status === 'running')) return;
    const tick = async () => {
      if (ticking.current) return; ticking.current = true;
      try { const response = await fetch('/api/simulation/tick', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); const result = await response.json(); if (!response.ok) throw new Error(result.error); await refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : 'Simulation could not advance.'); }
      finally { ticking.current = false; }
    };
    void tick(); const timer = setInterval(() => void tick(), 1000); return () => clearInterval(timer);
  }, [state?.viewer?.team, state?.simulations.some(s => s.status === 'running'), refresh]);
  const request = useCallback(async <T,>(path: string, body: unknown = {}): Promise<T> => {
    setBusy(true); setError('');
    try { const response = await fetch(`/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const result = await response.json(); if (!response.ok) throw new Error(result.error); await refresh(); return result; }
    catch (e) { const message = e instanceof Error ? e.message : 'Request failed.'; setError(message); throw e; }
    finally { setBusy(false); }
  }, [refresh]);
  return <AppContext.Provider value={{ state, error, clearError: () => setError(''), refresh, request, busy }}>{children}</AppContext.Provider>;
}
export function useApp() { const ctx = useContext(AppContext); if (!ctx) throw new Error('AppProvider is required.'); return ctx; }
