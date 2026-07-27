// src/types/event.ts — события

/** Автор события (вложенный объект в ответе) */
export interface EventAuthor {
    name: string;
    phone: string;
    country_phone_code: string;
    languages: string[];
    bio: string;
}

/** Событие (из GET /api/v1/events и GET /api/v1/event/{id}) */
export interface Event {
    id: number;
    title: string;
    category: string;
    thumbnail_url: string;
    description: string;
    /** Широта (строка из БД) */
    coordinate_lat: string | null;
    /** Долгота (строка из БД) */
    coordinate_lng: string | null;
    country: string;
    /** Unix timestamp (секунды) */
    planing_time: number;
    slots: number;
    address: string;
    /** Текущее количество записавшихся */
    reserved: number;
    /** Профиль автора */
    author: EventAuthor;
    /** Теги (если есть) */
    tags?: Tag[];
    /** Состоялось ли событие */
    is_happened?: number | null;
}

/** Тег */
export interface Tag {
    id: number;
    name: string;
}

/** Тело запроса на создание события (POST /api/v1/events, multipart/form-data) */
export interface CreateEventDTO {
    title: string;
    description: string;
    /** Картинка (webp, до 1024 КБ) — одно из thumbnail или thumb_path обязательно */
    thumbnail?: File;
    /** Альтернатива thumbnail — путь к файлу */
    thumb_path?: string;
    address: string;
    category_id: number;
    slots: number;
    /** Дата в формате d/m/Y H:i */
    planing_time: string;
    /** Массив тегов (строки) */
    tags?: string[];
}

/** Тело запроса на обновление события (PUT /api/v1/event/{id}) */
export interface UpdateEventDTO extends Partial<CreateEventDTO> {
}
