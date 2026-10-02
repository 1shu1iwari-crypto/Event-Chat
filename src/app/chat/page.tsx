'use client';
import { ChatPanel } from '@/components/chat/chat-loader';
import { Badge } from '@/components/ui';
export default function Page() { return <><div className="page-heading compact"><div><div className="eyebrow">KEEP THE TEAM IN THE LOOP</div><h1>Team channels</h1><p>Everyday updates here. Focused response in incident rooms.</p></div><Badge tone="green">POWERED BY COMETCHAT</Badge></div><div className="panel team-chat"><ChatPanel /></div></>; }
