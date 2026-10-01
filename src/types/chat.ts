// src/types/chat.ts — типы сообщений чата события

import type {Profile} from './profile';
import type {PaginatedResponse} from './common';

export interface ChatAuthor {
    id: number;
    profile: Profile;
}

export interface ChatMessage {
    id: number;
    event_id: number;
    content: string;
    created_at: number | string;
    updated_at?: number | string | null;
    author: ChatAuthor;
}

export interface ChatMessageDTO {
    content: string;
}

export interface ChatMessageUpdateDTO {
    content: string;
}

export interface ChatMessageListResponse extends PaginatedResponse<ChatMessage> {
}
