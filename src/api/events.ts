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

// ─── Создание / обновление / удаление ────────────────────────────────

/** POST /api/v1/events — создать событие (multipart/form-data) */
export function createEvent(dto: CreateEventDTO): Promise<SuccessResponse> {
    const fd = new FormData();
    fd.append('title', dto.title);
    fd.append('description', dto.description);

    const filename = dto.thumb_path.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';

    // 3. Формируем объект файла для DTO
    const thumbnail = {
        uri: dto.thumb_path,             // Локальный путь пути file://...
        name: filename,        // Имя файла (например, avatar.jpg или avatar.webp)
        type: type,            // MIME-тип (например, image/webp или image/jpeg)
    };

    fd.append('thumbnail', thumbnail);
    fd.append('address', dto.address);
    fd.append('category_id', String(dto.category_id));
    fd.append('slots', String(dto.slots));
    fd.append('planing_time', dto.planing_time);
    dto.tags?.forEach((tag) => fd.append('tags[]', tag));

    return apiClient
        .post<SuccessResponse>('/events', fd, {
            headers: {'Content-Type': 'multipart/form-data'},
        })
        .then((r) => r.data);
}

/** PUT /api/v1/event/{id} — обновить событие */
export function updateEvent(id: number, dto: UpdateEventDTO): Promise<SuccessResponse> {
    return apiClient.put<SuccessResponse>(`/event/${id}`, dto).then((r) => r.data);
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