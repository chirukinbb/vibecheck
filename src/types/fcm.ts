// src/types/fcm.ts — типы Firebase Push-уведомлений

/** Data-поле RefreshNotification — запрос на обновление списка событий */
export interface RefreshNotificationData {
    action: 'refresh';
    screen: 'events';
}

/** Data-поле EventNotification — уведомление о новом событии */
export interface EventNotificationData {
    screen: 'single_event';
    event_id: number;
}

/** Структура FCM-уведомления от сервера (data-only или notification+data) */
export interface FcmPayload {
    title?: string;
    body?: string;
    image?: string;
    data?: RefreshNotificationData | EventNotificationData;
}
