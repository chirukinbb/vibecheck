// src/stores/chatStore.ts — состояние чата события
import {create} from 'zustand';
import {deleteChatMessage, getChatMessages, sendChatMessage, updateChatMessage,} from '../api/chat';
import type {PaginationMeta} from '../types';
import type {ChatMessage, ChatMessageDTO, ChatMessageUpdateDTO} from '../types/chat';

const getMessageTimestamp = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortMessagesByTimestamp = (messages: ChatMessage[]): ChatMessage[] =>
    [...messages].sort((a, b) => {
      const diff = getMessageTimestamp(a.created_at) - getMessageTimestamp(b.created_at);
      return diff !== 0 ? diff : a.id - b.id;
    });

const mergeMessages = (existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
  const map = new Map<number, ChatMessage>();

  [...existing, ...incoming].forEach((message) => {
    map.set(message.id, message);
  });

  return sortMessagesByTimestamp([...map.values()]);
};

const upsertMessage = (messages: ChatMessage[], message: ChatMessage): ChatMessage[] =>
    mergeMessages(messages, [message]);

interface ChatState {
  messages: ChatMessage[];
  meta: PaginationMeta | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  fetchMessages: (eventId: number, page?: number) => Promise<void>;
  sendMessage: (eventId: number, dto: ChatMessageDTO) => Promise<ChatMessage | null>;
  editMessage: (eventId: number, messageId: number, dto: ChatMessageUpdateDTO) => Promise<ChatMessage | null>;
  deleteMessage: (eventId: number, messageId: number) => Promise<string | null>;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  meta: null,
  isLoading: false,
  isSending: false,
  error: null,

  fetchMessages: async (eventId, page) => {
    set({isLoading: true, error: null});
    try {
      const res = await getChatMessages(eventId, {page, per_page: 30});
      set({
        messages: page === 1 ? mergeMessages([], res.data) : mergeMessages(get().messages, res.data),
        meta: res.meta,
      });
    } catch (e: any) {
      set({error: e?.message ?? 'Ошибка загрузки чата'});
    } finally {
      set({isLoading: false});
    }
  },

  sendMessage: async (eventId, dto) => {
    set({isSending: true, error: null});
    try {
      const res = await sendChatMessage(eventId, dto);
      const message = res.data;

      if (message) {
        set((state) => ({
          messages: upsertMessage(state.messages, message),
        }));
      }

      return message;
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка отправки сообщения';
      set({error: msg});
      return null;
    } finally {
      set({isSending: false});
    }
  },

  editMessage: async (eventId, messageId, dto) => {
    set({isSending: true, error: null});
    try {
      const res = await updateChatMessage(eventId, messageId, dto);
      const message = res.data;

      if (message) {
        set((state) => ({
          messages: upsertMessage(state.messages, message),
        }));
      }

      return message;
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка редактирования сообщения';
      set({error: msg});
      return null;
    } finally {
      set({isSending: false});
    }
  },

  deleteMessage: async (eventId, messageId) => {
    set({isSending: true, error: null});
    try {
      const res = await deleteChatMessage(eventId, messageId);
      set((state) => ({
        messages: state.messages.filter((message) => message.id !== messageId),
      }));
      return res.message ?? 'Сообщение удалено';
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка удаления сообщения';
      set({error: msg});
      return null;
    } finally {
      set({isSending: false});
    }
  },

  clear: () => {
    set({messages: [], meta: null, error: null});
  },
}));
