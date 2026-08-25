// src/stores/eventsStore.ts — события: список, пагинация, CRUD
import {create} from 'zustand';
import {
  createEvent,
  deleteEvent,
  getEvent,
  getEvents,
  submitMemberFeedback,
  subscribeToEvent,
  unsubscribeFromEvent,
  updateEvent,
} from '../api/events';
import type {CreateEventDTO, Event, EventListItem, MemberFeedbackDTO, PaginationMeta, UpdateEventDTO} from '../types';

interface EventsState {
  // ─── Список ───
  events: EventListItem[];
  meta: PaginationMeta | null;

  // ─── Просмотр одного ───
  selectedEvent: Event | null;

  // ─── Состояние ───
  isLoadingList: boolean;
  isLoadingSingle: boolean;
  isMutating: boolean;
  error: string | null;

  // ─── Действия: список ───
  fetchEvents: (page?: number) => Promise<void>;
  refreshEvents: () => Promise<void>;
  fetchNextPage: () => Promise<void>;

  // ─── Действия: одно событие ───
  fetchEvent: (id: number) => Promise<void>;
  clearSelected: () => void;

  // ─── Действия: мутации ───
  addEvent: (dto: CreateEventDTO) => Promise<string | null>;
  editEvent: (id: number, dto: UpdateEventDTO) => Promise<string | null>;
  removeEvent: (id: number) => Promise<string | null>;

  // ─── Подписка / отзыв ───
  subscribe: (eventId: number) => Promise<string | null>;
  unsubscribe: (eventId: number, memberId: number) => Promise<string | null>;
  feedbackMember: (eventId: number, memberId: number, dto: MemberFeedbackDTO) => Promise<string | null>;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  meta: null,
  selectedEvent: null,
  isLoadingList: false,
  isLoadingSingle: false,
  isMutating: false,
  error: null,

  // ─── Список ──────────────────────────────────────────────────────

  fetchEvents: async (page = 1) => {
    set({isLoadingList: true, error: null});
    try {
      const res = await getEvents({page});
      console.log('Fetched events:', res);
      set({events: res.data, meta: res.meta});
    } catch (e: any) {
      set({error: e?.message ?? 'Ошибка загрузки событий'});
    } finally {
      set({isLoadingList: false});
    }
  },

  refreshEvents: async () => {
    await get().fetchEvents(1);
  },

  fetchNextPage: async () => {
    const {meta, isLoadingList, events} = get();
    if (isLoadingList || !meta) return;
    const nextPage = meta.current_page + 1;
    if (nextPage > meta.last_page) return;

    set({isLoadingList: true});
    try {
      const res = await getEvents({page: nextPage});
      set({
        events: [...events, ...res.data],
        meta: res.meta,
      });
    } catch (e: any) {
      set({error: e?.message ?? 'Ошибка подгрузки'});
    } finally {
      set({isLoadingList: false});
    }
  },

  // ─── Одно событие ────────────────────────────────────────────────

  fetchEvent: async (id) => {
    set({isLoadingSingle: true, error: null});
    try {
      const res = await getEvent(id);
      set({selectedEvent: res.data});
    } catch (e: any) {
      set({error: e?.message ?? 'Ошибка загрузки события'});
    } finally {
      set({isLoadingSingle: false});
    }
  },

  clearSelected: () => set({selectedEvent: null}),

  // ─── Мутации ─────────────────────────────────────────────────────

  addEvent: async (dto) => {
    set({isMutating: true, error: null});
    try {
      const res = await createEvent(dto);
      await get().refreshEvents();
      return res.message;
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка создания события';
      set({error: msg});
      return null;
    } finally {
      set({isMutating: false});
    }
  },

  editEvent: async (id, dto) => {
    set({isMutating: true, error: null});
    try {
      const res = await updateEvent(id, dto);
      // Обновить в списке и в selected
      const updated = await getEvent(id);
      set((s) => ({
        events: s.events.map((ev) => (ev.id === id ? updated.data : ev)),
        selectedEvent: s.selectedEvent?.id === id ? updated.data : s.selectedEvent,
      }));
      return res.message;
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка обновления';
      set({error: msg});
      return null;
    } finally {
      set({isMutating: false});
    }
  },

  removeEvent: async (id) => {
    set({isMutating: true, error: null});
    try {
      const res = await deleteEvent(id);
      set((s) => ({
        events: s.events.filter((ev) => ev.id !== id),
        selectedEvent: s.selectedEvent?.id === id ? null : s.selectedEvent,
      }));
      return res.message;
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка удаления';
      set({error: msg});
      return null;
    } finally {
      set({isMutating: false});
    }
  },

  // ─── Подписка / отзыв ────────────────────────────────────────────

  subscribe: async (eventId) => {
    set({isMutating: true, error: null});
    try {
      const res = await subscribeToEvent(eventId);
      // Обновить reserved локально
      set((s) => ({
        events: s.events.map((ev) =>
            ev.id === eventId ? {...ev, reserved: (ev.reserved ?? 0) + 1} : ev,
        ),
      }));
      return res.message;
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка записи';
      set({error: msg});
      return null;
    } finally {
      set({isMutating: false});
    }
  },

  unsubscribe: async (eventId, memberId) => {
    set({isMutating: true, error: null});
    try {
      const res = await unsubscribeFromEvent(eventId, memberId);
      set((s) => ({
        events: s.events.map((ev) =>
            ev.id === eventId ? {...ev, reserved: Math.max(0, (ev.reserved ?? 0) - 1)} : ev,
        ),
      }));
      return res.message;
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка отписки';
      set({error: msg});
      return null;
    } finally {
      set({isMutating: false});
    }
  },

  feedbackMember: async (eventId, memberId, dto) => {
    set({isMutating: true, error: null});
    try {
      const res = await submitMemberFeedback(eventId, memberId, dto);
      return res.message;
    } catch (e: any) {
      const msg = e?.message ?? 'Ошибка отправки отзыва';
      set({error: msg});
      return null;
    } finally {
      set({isMutating: false});
    }
  },
}));
