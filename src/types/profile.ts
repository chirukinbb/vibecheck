// src/types/profile.ts — профиль пользователя

/** Профиль пользователя (из OAuth-ответа и GET/PATCH /api/v1/profile) */
export interface Profile {
    name: string;
    phone: string | null;
    country_phone_code: string | null;
    country_phone_iso: string | null;
    /** JSON-поле: массив языковых кодов (ISO 639-1) */
    languages: string[] | null;
    bio: string | null;
    /** URI аватара (WebP) */
    avatar: string | null;
}

/** Тело запроса на обновление профиля (PATCH /api/v1/profile) */
export interface ProfileUpdateDTO {
    name: string;
    phone: string;
    country_phone_code: string;
    country_phone_iso: string;
    languages: string[];
    bio: string;
    avatar: string | null;
}
