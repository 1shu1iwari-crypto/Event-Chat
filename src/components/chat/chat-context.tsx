'use client';
import { createContext, useContext } from 'react';
export interface ChatState { status: 'unconfigured' | 'connecting' | 'ready' | 'error'; error?: string; presence: Record<string, 'online' | 'offline'>; retry: () => void; }
export const ChatContext = createContext<ChatState>({ status: 'unconfigured', presence: {}, retry: () => {} });
export function useChat() { return useContext(ChatContext); }
