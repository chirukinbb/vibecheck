// src/types/member.ts — участники события и отзывы

/** Отзыв участника о событии (PATCH /api/v1/event/{event}/member/{member}) */
export interface MemberFeedbackDTO {
    /** Состоялось ли событие */
    is_happened: boolean;
    /** Комментарий */
    comment: string;
    /** Оценка 0..10 */
    mark: number;
}

/** Участник события (из БД members) */
export interface Member {
    id: number;
    user_id: number;
    event_id: number;
    is_happened: boolean;
    comment: string | null;
    mark: string | null;
    created_at: string;
    updated_at: string;
}
