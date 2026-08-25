// src/types/common.ts — общие типы для API-ответов

/** Обёртка успешного ответа (создание/обновление/удаление) */
export interface SuccessResponse {
    message: string;
}

/** Обёртка ошибки */
export interface ErrorResponse {
    message: string;
}

/** Стандартная обёртка Laravel JSON API (события, коллекции) */
export interface ApiResponse<T> {
    data: T;
}

/** Laravel-пагинация */
export interface PaginatedResponse<T> {
    data: T[];
    links: PaginationLinks;
    meta: PaginationMeta;
}

export interface PaginationLinks {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
}

export interface PaginationMeta {
    current_page: number;
    from: number | null;
    last_page: number;
    path?: string;
    per_page: number;
    to: number | null;
    total: number;
}
