// src/types/filter.ts — гео-фильтр пользователя

/**
 * Гео-центр в виде массива `[lat, lng]`.
 * В БД хранится как JSON-строка, API отдаёт/принимает как массив.
 */
export type GeoCenter = [number, number];

/** Гео-фильтр (из ответа GET /api/v1/me и PATCH /api/v1/filter) */
export interface GeoFilter {
    center: GeoCenter | null;
    /** Радиус в километрах */
    radius: number | null;
    /** ID выбранных категорий */
    categories: number[] | null;
}

/** Тело запроса на обновление гео-фильтра (PATCH /api/v1/filter) */
export interface FilterUpdateDTO {
    /** Адрес строкой — сервер геокодирует через TomTom и сохраняет в center */
    center: GeoCenter;
    /** Радиус в километрах */
    radius: number;
    /** ID категорий для фильтрации */
    categories: number[];
}
