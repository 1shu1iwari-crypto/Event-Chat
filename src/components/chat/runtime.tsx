'use client';
import { useEffect, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatErrorBoundary, CometChatIncomingCall, CometChatProvider, CometChatUIKit, useCometChatEvents } from '@cometchat/chat-uikit-react';
import { useApp } from '../app-provider';
import { ChatContext, type ChatState } from './chat-context';
let initPromise: Promise<unknown> | null = null;
let loginPromise: Promise<unknown> | null = null;
let loggingOut: Promise<unknown> | null = null;
async function connect() {
  await loggingOut;
  const configResponse = await fetch('/api/cometchat/config'); const config = await configResponse.json();
  if (!configResponse.ok || !config.configured) throw new Error('CometChat credentials are not configured.');
  initPromise ??= CometChatUIKit.initFromSettings({ appId: config.appId, region: config.region, chatSDK: { presenceSubscription: { type: 'ALL_USERS' } }, uiKit: { callsSDK: {} } }).catch(error => { initPromise = null; throw error; });
  await initPromise;
  if (!CometChatUIKit.getLoggedInUser()) {
    loginPromise ??= (async () => { const r = await fetch('/api/cometchat/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); const result = await r.json(); if (!r.ok) throw new Error(result.error); return CometChatUIKit.loginWithAuthToken(result.authToken); })().finally(() => { loginPromise = null; });
    await loginPromise;
  }
}
function EventListener({ setPresence }: { setPresence: React.Dispatch<React.SetStateAction<ChatState['presence']>> }) {
  const { refresh } = useApp();
  useCometChatEvents(event => {
    if (event.type === 'user/online' || event.type === 'user/offline') setPresence(p => ({ ...p, [event.user.getUid()]: event.type === 'user/online' ? 'online' : 'offline' }));
    if (event.type === 'message/text-received' || (event.type === 'ui:message/sent' && event.status === 'success')) {
      const message = event.message;
      if (message.getReceiverType() === 'group' && message.getReceiverId().startsWith('eventops-novahack-')) {
        void fetch('/api/signals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messageId: String(message.getId()) }) }).then(r => { if (r.ok) return refresh(); }).catch(() => {});
      }
    }
  }, [refresh]);
  useEffect(() => {
    let active = true;
    void new CometChat.UsersRequestBuilder().setLimit(100).build().fetchNext().then(users => { if (active) setPresence(Object.fromEntries(users.map(u => [u.getUid(), u.getStatus() === 'online' ? 'online' : 'offline']))); }).catch(() => { if (active) setPresence({}); });
    return () => { active = false; };
  }, [setPresence]);
  return null;
}
export default function ChatRuntime({ children }: { children: React.ReactNode }) {
  const { state } = useApp(); const [status, setStatus] = useState<ChatState['status']>('unconfigured'), [error, setError] = useState(''), [attempt, setAttempt] = useState(0), [presence, setPresence] = useState<ChatState['presence']>({});
  useEffect(() => {
    let cancelled = false;
    if (!state?.viewer || !state.configured) {
      setStatus('unconfigured'); setPresence({});
      if (CometChatUIKit.getLoggedInUser()) loggingOut = CometChatUIKit.logout().catch(() => {}).finally(() => { loggingOut = null; });
      return;
    }
    setStatus('connecting'); setError('');
    const login = async () => {
      const existing = CometChatUIKit.getLoggedInUser();
      if (existing && existing.getUid() !== state.viewer!.uid) await CometChatUIKit.logout();
      await connect(); if (!cancelled) setStatus('ready');
    };
    void login().catch(e => { if (!cancelled) { setError(e?.message || 'Unable to connect to CometChat.'); setStatus('error'); } });
    return () => { cancelled = true; };
  }, [state?.viewer?.uid, state?.configured, attempt]);
  const content = <ChatContext.Provider value={{ status, error, presence, retry: () => setAttempt(n => n + 1) }}>{children}</ChatContext.Provider>;
  if (status !== 'ready') return content;
  return <CometChatErrorBoundary fallbackView={() => <div className="boot"><p>Chat could not render.</p><button className="button" onClick={() => { setStatus('connecting'); setAttempt(n => n + 1); }}>Retry connection</button></div>}><CometChatProvider theme="dark"><EventListener setPresence={setPresence} /><CometChatIncomingCall />{content}</CometChatProvider></CometChatErrorBoundary>;
}
