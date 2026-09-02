// src/api/index.ts — реэкспорт всех API-модулей

// HTTP-клиент
export { API_URL, apiClient } from './client';

// Auth
export {
    getCurrentUser,
    getOAuthCallbackUrl,
    getOAuthRedirectUrl,
    loginWithEmail,
    loginWithOAuth,
    registerWithEmail
} from './auth';

// События
export {
    createEvent, deleteEvent, getEvent, getEvents, submitMemberFeedback, subscribeToEvent,
    unsubscribeFromEvent as unsubscribe, updateEvent
} from './events';

// Категории
export { getCategories } from './categories';

// Профиль
export { updateProfile } from './profile';

// Гео-фильтр
export { updateFilter } from './filter';

// Обратная связь
export {sendFeedback} from './feedback';

// Языки
export {getLanguages} from './languages';

// FCM-токен
export {updateDeviceToken} from './device';

export {
    AddressSuggestion,
    Coordinates,
    fetchAddressSuggestions,
    getAddressFromCoordinates,
    getCurrentCoordinates,
    getStaticMapUrl
} from './geo';

