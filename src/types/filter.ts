// src/types/filter.ts — гео-фильтр пользователя

/** Гео-центр (lat/lng). В БД хранится как JSON-строка, API отдаёт/принимает как объект */
export interface GeoCenter {
    lat: number;
    lng: number;
}

/** Гео-фильтр (из OAuth-ответа и PATCH /api/v1/filter) */
export interface GeoFilter {
    center: GeoCenter | null;
    /** Радиус в километрах */
    radius: number | null;
    /** ID выбранных категорий */
    categories: number[] | null;
}

/** Тело запроса на обновление гео-фильтра (PATCH /api/v1/filter) */
export interface FilterUpdateDTO {
    /** Адрес строкой — сервер геокодирует через TomTom */
    address: string;
    /** Радиус в километрах */
    radius: number;
    /** ID категорий для фильтрации */
    categories: number[];
}
