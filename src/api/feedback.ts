// src/api/feedback.ts — обратная связь о приложении
import {apiClient} from './client';
import type {CreateFeedbackDTO, SuccessResponse} from '../types';

/** POST /api/v1/feedback — отправить отзыв о приложении */
export function sendFeedback(dto: CreateFeedbackDTO): Promise<SuccessResponse> {
  return apiClient.post<SuccessResponse>('/feedback', dto).then((r) => r.data);
}
