// src/types/feedback.ts — обратная связь о приложении

/** Тело запроса на отправку feedback (POST /api/v1/feedback) */
export interface CreateFeedbackDTO {
    text: string;
}
