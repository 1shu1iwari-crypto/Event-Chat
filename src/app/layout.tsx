import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@cometchat/chat-uikit-react/styles';
import './globals.css';
import { Providers } from '@/components/providers';
export const metadata: Metadata = { title: 'EventOps · Live incident command', description: 'From group chats to coordinated operations. A live event command desk powered by CometChat.' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body className={`${GeistSans.variable} ${GeistMono.variable}`}><Providers>{children}</Providers></body></html>; }
