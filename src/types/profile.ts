// src/types/profile.ts — профиль пользователя

/** Профиль пользователя (из ответа GET /api/v1/me и PATCH /api/v1/profile) */
export interface Profile {
    name: string;
    /** URI аватара (WebP). Поле phone/country_phone_code/country_phone_iso удалены из API */
    avatar_url: string | null;
    /** JSON-поле: массив языковых кодов (ISO 639-1) */
    languages: string[] | null;
    bio: string | null;
}

/** Тело запроса на обновление профиля (PATCH /api/v1/profile, multipart или JSON) */
export interface ProfileUpdateDTO {
    name: string;
    /** Файл аватара (webp, до 2048 КБ) — альтернатива avatar_url */
    avatar?: File;
    /** Ссылка на аватар — альтернатива файлу avatar */
    avatar_url?: string | null;
    languages: string[];
    bio: string;
}
