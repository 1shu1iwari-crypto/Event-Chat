'use client';
import dynamic from 'next/dynamic';
const ChatView = dynamic(() => import('./chat-view'), { ssr: false, loading: () => <div className="chat-offline">Opening conversation…</div> });
export function ChatPanel(props: { groupId?: string; leadUid?: string; banner?: React.ReactNode }) { return <ChatView {...props} />; }
