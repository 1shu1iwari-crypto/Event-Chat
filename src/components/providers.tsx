'use client';
import dynamic from 'next/dynamic';
import { AppProvider } from './app-provider';
import { Shell } from './shell';
const Runtime = dynamic(() => import('./chat/runtime'), { ssr: false, loading: () => <div className="boot">Opening the operations desk…</div> });
export function Providers({ children }: { children: React.ReactNode }) { return <AppProvider><Runtime><Shell>{children}</Shell></Runtime></AppProvider>; }
