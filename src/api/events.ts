// src/api/events.ts — события: CRUD, подписка, отзывы
import type {
    ApiResponse,
    CreateEventDTO,
    Event,
    EventListItem,
    MemberFeedbackDTO,
    PaginatedResponse,
    SuccessResponse,
    UpdateEventDTO,
} from '../types';
import {apiClient} from './client';
import {fileToFormData} from "@/constants/mock-data";

// ─── Список событий ──────────────────────────────────────────────────

/** GET /api/v1/events — список событий с пагинацией (сокращённый вид) */
export function getEvents(params?: {
    page?: number;
    per_page?: number;
}): Promise<PaginatedResponse<EventListItem>> {
    return apiClient.get<PaginatedResponse<EventListItem>>('/events', {params}).then((r) => r.data);
}

export function getOrganizingEvents(params?: {
    page?: number;
    per_page?: number;
}): Promise<PaginatedResponse<EventListItem>> {
    return apiClient.get<PaginatedResponse<EventListItem>>('/events/organizing', {params}).then((r) => r.data);
}

export function getAttendingEvents(params?: {
    page?: number;
    per_page?: number;
}): Promise<PaginatedResponse<EventListItem>> {
    return apiClient.get<PaginatedResponse<EventListItem>>('/events/attending', {params}).then((r) => r.data);
}

// ─── Одно событие ────────────────────────────────────────────────────

/** GET /api/v1/event/{id} */
export function getEvent(id: number): Promise<ApiResponse<Event>> {
    return apiClient.get<ApiResponse<Event>>(`/event/${id}`).then((r) => r.data);
}

function eventFormData(dto: CreateEventDTO): FormData {
    const fd = new FormData();
    fd.append('title', dto.title);
    fd.append('description', dto.description);

    if (dto.thumb_path && !dto.thumb_path.startsWith('https://')) {
        fd.append('thumbnail', fileToFormData(dto.thumb_path));
    } else fd.append('thumbnail_url', dto.thumb_path)

    dto.address?.forEach((tag) => fd.append('address[]', tag));
    fd.append('category_id', String(dto.category_id));
    fd.append('slots', String(dto.slots));
    fd.append('planing_time', dto.planing_time);
    dto.tags?.forEach((tag) => fd.append('tags[]', tag));

    return fd;
}

// ─── Создание / обновление / удаление ────────────────────────────────

/** POST /api/v1/events — создать событие (multipart/form-data) */
export function createEvent(dto: CreateEventDTO): Promise<SuccessResponse> {
    return apiClient
        .post<SuccessResponse>('/events', eventFormData(dto), {
            headers: {'Content-Type': 'multipart/form-data'},
        })
        .then((r) => r.data);
}

/** PUT /api/v1/event/{id} — обновить событие */
export function updateEvent(id: number, dto: UpdateEventDTO): Promise<SuccessResponse> {
    return apiClient.put<SuccessResponse>(`/event/${id}`, eventFormData(dto)).then((r) => r.data);
}

/** DELETE /api/v1/event/{id} — удалить событие */
export function deleteEvent(id: number): Promise<SuccessResponse> {
    return apiClient.delete<SuccessResponse>(`/event/${id}`).then((r) => r.data);
}

// ─── Подписка / отписка ──────────────────────────────────────────────

/** POST /api/v1/event/{id}/subscribe — записаться на событие */
export function subscribeToEvent(eventId: number): Promise<SuccessResponse> {
    return apiClient.post<SuccessResponse>(`/event/${eventId}/subscribe`).then((r) => r.data);
}

/** DELETE /api/v1/event/{event}/member/{member}/unsubscribe — отписаться */
export function unsubscribeFromEvent(
    eventId: number,
    memberId: number,
): Promise<SuccessResponse> {
    return apiClient
        .delete<SuccessResponse>(`/event/${eventId}/member/${memberId}/unsubscribe`)
        .then((r) => r.data);
}

// ─── Отзыв участника ─────────────────────────────────────────────────

/** PATCH /api/v1/event/{event}/member/{member} — оставить отзыв */
export function submitMemberFeedback(
    eventId: number,
    memberId: number,
    dto: MemberFeedbackDTO,
): Promise<SuccessResponse> {
    return apiClient
        .patch<SuccessResponse>(`/event/${eventId}/member/${memberId}`, dto)
        .then((r) => r.data);
}