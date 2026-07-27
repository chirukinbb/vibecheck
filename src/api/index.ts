// src/api/index.ts — реэкспорт всех API-модулей

// HTTP-клиент
export {apiClient, API_URL} from './client';

// OAuth
export {getOAuthRedirectUrl, getOAuthCallbackUrl, handleOAuthCallback} from './auth';

// События
export {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    subscribeToEvent,
    unsubscribeFromEvent,
    submitMemberFeedback,
} from './events';

// Категории
export {getCategories} from './categories';

// Профиль
export {updateProfile} from './profile';

// Гео-фильтр
export {updateFilter} from './filter';

// Обратная связь
export {sendFeedback} from './feedback';

// FCM-токен
export {updateDeviceToken} from './device';
