// src/stores/feedbackStore.ts — обратная связь о приложении
import {create} from 'zustand';
import type {CreateFeedbackDTO} from '../types';
import {sendFeedback} from '../api/feedback';

interface FeedbackState {
  isSending: boolean;
  error: string | null;

  submit: (dto: CreateFeedbackDTO) => Promise<boolean>;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  isSending: false,
  error: null,

  submit: async (dto) => {
    set({isSending: true, error: null});
    try {
      await sendFeedback(dto);
      return true;
    } catch (e: any) {
      set({error: e?.message ?? 'Ошибка отправки'});
      return false;
    } finally {
      set({isSending: false});
    }
  },
}));
