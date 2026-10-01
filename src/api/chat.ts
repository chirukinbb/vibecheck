// src/api/chat.ts — API для сообщений чата события
import type {ApiResponse, SuccessResponse} from '../types';
import type {ChatMessage, ChatMessageDTO, ChatMessageListResponse, ChatMessageUpdateDTO} from '@/types';
import {apiClient} from './client';

export function getChatMessages(
    chatId: number,
    params?: { page?: number; per_page?: number; },
): Promise<ChatMessageListResponse> {
    return apiClient
        .get<ChatMessageListResponse>(`/chat/${chatId}`, {params})
        .then((response) => response.data);
}

export function sendChatMessage(
    chatId: number,
    dto: ChatMessageDTO,
): Promise<ApiResponse<ChatMessage>> {
    return apiClient
        .post<ApiResponse<ChatMessage>>(`/chat/${chatId}`, dto)
        .then((response) => response.data);
}

export function updateChatMessage(
    chatId: number,
    messageId: number,
    dto: ChatMessageUpdateDTO,
): Promise<ApiResponse<ChatMessage>> {
    return apiClient
        .put<ApiResponse<ChatMessage>>(`/chat/${chatId}/message/${messageId}`, dto)
        .then((response) => response.data);
}

export function deleteChatMessage(
    chatId: number,
    messageId: number,
): Promise<SuccessResponse> {
    return apiClient
        .delete<SuccessResponse>(`/chat/${chatId}/message/${messageId}`)
        .then((response) => response.data);
}
