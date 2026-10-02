'use client';
import { useEffect, useMemo, useState } from 'react';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatGroups, CometChatUsers, CometChatGroupMembers, CometChatMessageComposer, CometChatMessageHeader, CometChatMessageList, CometChatSearch, CometChatThreadHeader } from '@cometchat/chat-uikit-react';
import { useChat } from './chat-context';
import { useApp } from '../app-provider';
import { Empty } from '../ui';
export default function ChatView({ groupId, leadUid, banner }: { groupId?: string; leadUid?: string; banner?: React.ReactNode }) {
  const chat = useChat(); const { state, request, busy } = useApp();
  const [group, setGroup] = useState<CometChat.Group>(), [user, setUser] = useState<CometChat.User>(), [thread, setThread] = useState<CometChat.BaseMessage>(), [side, setSide] = useState<'search' | 'members' | null>(null), [goTo, setGoTo] = useState<number>(), [error, setError] = useState(''), [tab, setTab] = useState<'teams' | 'people'>('teams'), [small, setSmall] = useState(false);
  const groupsBuilder = useMemo(() => new CometChat.GroupsRequestBuilder().setLimit(30).setTags(['eventops-team']), []);
  const usersBuilder = useMemo(() => new CometChat.UsersRequestBuilder().setLimit(30), []);
  useEffect(() => { const mq = window.matchMedia('(max-width: 768px)'); setSmall(mq.matches); const change = () => setSmall(mq.matches); mq.addEventListener('change', change); return () => mq.removeEventListener('change', change); }, []);
  useEffect(() => {
    let active = true; setGroup(undefined); setUser(undefined); setThread(undefined); setSide(null); setError('');
    if (chat.status !== 'ready') return;
    if (groupId) void CometChat.getGroup(groupId).then(g => { if (active) setGroup(g); }).catch(e => { if (active) setError(e.message || 'Unable to open the incident room.'); });
    else if (leadUid) void CometChat.getUser(leadUid).then(u => { if (active) setUser(u); }).catch(e => { if (active) setError(e.message || 'Unable to open the lead conversation.'); });
    return () => { active = false; };
  }, [groupId, leadUid, chat.status]);
  if (chat.status !== 'ready') return <div className="chat-offline"><Empty title={chat.status === 'connecting' ? 'Connecting to your team…' : 'Connect the conversation'}>{chat.status === 'error' ? chat.error : 'Team messages, typing, presence, and calls use real CometChat. Connect your app to open this channel.'}</Empty>{chat.status !== 'connecting' && <div className="offline-actions">{state?.configured && state.viewer?.team === 'operations' && <button className="button" disabled={busy} onClick={() => void request('cometchat/seed').then(chat.retry).catch(() => {})}>Seed event staff & channels</button>}<button className="button primary" onClick={chat.retry}>Retry connection</button><small>See README for server credential configuration.</small></div>}</div>;
  const selected = !!(user || group), selector = !groupId && !leadUid;
  function resetPanels() { setThread(undefined); setSide(null); setGoTo(undefined); }
  return <div className={`chat-surface ${selected ? 'has-selection' : ''} ${thread || side ? 'has-side' : ''} ${selector ? '' : 'single-room'}`}>
    {selector && <aside className="chat-selector"><div className="chat-tabs"><button className={tab === 'teams' ? 'selected' : ''} onClick={() => setTab('teams')}>Team channels</button><button className={tab === 'people' ? 'selected' : ''} onClick={() => setTab('people')}>People</button></div>{tab === 'teams' ? <CometChatGroups groupsRequestBuilder={groupsBuilder} activeGroup={group} onItemClick={g => { setGroup(g); setUser(undefined); resetPanels(); }} /> : <CometChatUsers usersRequestBuilder={usersBuilder} activeUser={user} onItemClick={u => { setUser(u); setGroup(undefined); resetPanels(); }} />}</aside>}
    <section className="chat-messages">{error ? <Empty title="Room unavailable">{error}</Empty> : selected ? <><CometChatMessageHeader user={user} group={group} hideBackButton={!small || !selector} onBack={() => { setGroup(undefined); setUser(undefined); resetPanels(); }} onItemClick={() => { if (group) { setSide('members'); setThread(undefined); } }} onSearchOptionClicked={() => { setSide('search'); setThread(undefined); }} /><div className="chat-message-list"><CometChatMessageList user={user} group={group} goToMessageId={goTo} headerView={banner} onThreadRepliesClick={m => { setThread(m); setSide(null); }} /></div><CometChatMessageComposer user={user} group={group} placeholder="Send an operational update…" /></> : <Empty title={groupId || leadUid ? 'Opening conversation…' : 'Keep the team in the loop.'}>{selector ? 'Select a channel or a colleague. Important reports become signals for the operations desk.' : 'Loading real CometChat messages.'}</Empty>}</section>
    {(thread || side) && <aside className="chat-side">{thread ? <><CometChatThreadHeader parentMessage={thread} onClose={() => setThread(undefined)} onParentDeleted={() => setThread(undefined)} /><div className="chat-message-list"><CometChatMessageList parentMessage={thread} parentMessageId={thread.getId()} user={user} group={group} /></div><CometChatMessageComposer parentMessageId={thread.getId()} user={user} group={group} /></> : side === 'members' && group ? <CometChatGroupMembers group={group} onBack={() => setSide(null)} /> : <CometChatSearch uid={user?.getUid()} guid={group?.getGuid()} searchIn={['messages']} onBack={() => setSide(null)} onMessageClicked={e => { setGoTo(e.message.getId()); setSide(null); }} />}</aside>}
  </div>;
}
