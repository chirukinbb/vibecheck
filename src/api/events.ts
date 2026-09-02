// src/api/events.ts — события: CRUD, подписка, отзывы
import {fileToFormData} from "@/constants/mock-data";
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

function eventFormData(dto: Partial<CreateEventDTO>): FormData {
    const fd = new FormData();

    if (dto.title !== undefined) fd.append('title', String(dto.title));
    if (dto.description !== undefined) fd.append('description', String(dto.description));

    if (dto.thumb_path && !dto.thumb_path.startsWith('https://')) {
        // React Native File shape isn't assignable to browser Blob type, cast to any
        fd.append('thumbnail', fileToFormData(dto.thumb_path) as unknown as any);
    } else if (dto.thumb_path !== undefined) {
        fd.append('thumbnail_url', String(dto.thumb_path));
    }

    // address may be [lat, lng] — convert each element to string when appending
    dto.address?.forEach((addr) => fd.append('address[]', String(addr)));
    if (dto.category_id !== undefined) fd.append('category_id', String(dto.category_id));
    if (dto.slots !== undefined) fd.append('slots', String(dto.slots));
    if (dto.planing_time !== undefined) fd.append('planing_time', String(dto.planing_time));
    dto.tags?.forEach((tag) => fd.append('tags[]', String(tag)));

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
export function subscribeToEvent(eventId: number): Promise<ApiResponse<Event>> {
    return apiClient.post<ApiResponse<Event>>(`/event/${eventId}/subscribe`).then((r) => r.data);
}

/** DELETE /api/v1/event/{event}/member/{member}/unsubscribe — отписаться */
export function unsubscribeFromEvent(
    eventId: number,
): Promise<ApiResponse<Event>> {
    return apiClient
        .delete<ApiResponse<Event>>(`/event/${eventId}/unsubscribe`)
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