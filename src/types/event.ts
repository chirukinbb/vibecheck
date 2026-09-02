// src/types/event.ts — события

import {Profile} from "@/types/profile";

/** Автор события (вложенный объект в ответе GET /api/v1/event/{id}) */
export interface EventAuthor {
    name: string;
    avatar_url: string | null;
    languages: string[];
    bio: string | null;
}

/** Общие поля события */
interface EventBase {
    id: number;
    title: string;
    category: string;
    thumbnail_url: string;
    description: string;
    slots: number;
    /** Текущее количество записавшихся (может быть null — известный баг бэкенда) */
    reserved: number | null;
    /** Unix timestamp (секунды) */
    planing_time: number | string | null;
}

/**
 * Элемент списка событий (GET /api/v1/events).
 * Возвращается в СОКРАЩЁННОМ виде — без address, координат, country и author.
 */
export interface EventListItem extends EventBase {
}

/**
 * Полное событие (GET /api/v1/event/{id}).
 * Содержит address, координаты, country и author.
 */
export interface Event extends EventBase {
    /** Широта (строка из БД) */
    coordinate_lat: string | null;
    /** Долгота (строка из БД) */
    coordinate_lng: string | null;
    /** Альтернативные имена полей, которые иногда приходят из API */
    coordinates_lat?: string | null;
    coordinates_lng?: string | null;
    /** Иногда приходит ID категории вместо строки */
    category_id?: number;
    country: string | null;
    address: string;
    /** Профиль автора */
    author: EventAuthor;
    /** Теги (если есть) — могут быть строками или объектами `{id,name}` */
    tags: Array<string | Tag>;
    /** Состоялось ли событие */
    is_happened?: number | null;
    member?: number;
    members?: Member[];
}

export interface Member {
    id: number;
    profile: Profile;
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
    /** Альтернатива thumbnail — путь к файлу */
    thumb_path?: string | undefined;
    address: [number, number];
    category_id: number;
    slots: number;
    /** Дата в формате d/m/Y H:i */
    planing_time: number | null;
    /** Массив тегов (строки) */
    tags?: string[];
}

/** Тело запроса на обновление события (PUT /api/v1/event/{id}) */
export interface UpdateEventDTO extends Partial<CreateEventDTO> {
}
