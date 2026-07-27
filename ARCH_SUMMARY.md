# Структура проекта (API + типы + хранилища)

## Что сделано

Три слоя приложения, построенные по API-документации `API_DOCS_ANDROID.md`:

### 1. Типы — `src/types/`

| Файл | Содержит |
|---|---|
| `common.ts` | `SuccessResponse`, `ErrorResponse`, `ApiResponse<T>`, `PaginatedResponse<T>` (Laravel-пагинация) |
| `auth.ts` | `AuthCallbackResponse`, `AuthProvider` ('google'/'facebook') |
| `event.ts` | `Event`, `EventAuthor`, `Tag`, `CreateEventDTO`, `UpdateEventDTO` |
| `category.ts` | `Category` |
| `profile.ts` | `Profile`, `ProfileUpdateDTO` |
| `filter.ts` | `GeoCenter`, `GeoFilter`, `FilterUpdateDTO` |
| `member.ts` | `Member`, `MemberFeedbackDTO` |
| `feedback.ts` | `CreateFeedbackDTO` |
| `device.ts` | `DeviceTokenDTO` |
| `fcm.ts` | `RefreshNotificationData`, `EventNotificationData`, `FcmPayload` |

### 2. API-слой — `src/api/`

| Файл | Методы |
|---|---|
| `client.ts` | axios-инстанс, интерсептор (токен из authStore) |
| `auth.ts` | `getOAuthRedirectUrl`, `getOAuthCallbackUrl`, `handleOAuthCallback` |
| `events.ts` | `getEvents`, `getEvent`, `createEvent` (multipart), `updateEvent`, `deleteEvent`, `subscribeToEvent`, `unsubscribeFromEvent`, `submitMemberFeedback` |
| `categories.ts` | `getCategories` |
| `profile.ts` | `updateProfile` |
| `filter.ts` | `updateFilter` |
| `feedback.ts` | `sendFeedback` |
| `device.ts` | `updateDeviceToken` |

### 3. Хранилища (Zustand) — `src/stores/`

| Файл | Хранит |
|---|---|
| `authStore.ts` | token, profile, filter, hasFeedback, isAuthenticated, login/logout |
| `eventsStore.ts` | events[], meta (пагинация), selectedEvent, fetchEvents/refreshEvents/fetchNextPage, CRUD, subscribe/unsubscribe/feedbackMember |
| `categoriesStore.ts` | categories[], fetchCategories |
| `profileStore.ts` | saveProfile (+ синхронизация в authStore) |
| `filterStore.ts` | saveFilter (+ синхронизация в authStore) |
| `feedbackStore.ts` | submit |
| `deviceStore.ts` | fcmToken, registerToken |

## Связь слоёв

```
UI (React-компонент)
  → Store (Zustand)         ← состояние (реактивно)
    → API-функция            ← HTTP-запрос
      → apiClient (axios)    ← Bearer-токен из authStore.getState().token
        → Сервер Laravel
```

## Что нужно установить

```bash
npm install zustand
```

## Точки входа

```ts
// Типы
import type { Event, Profile, AuthCallbackResponse, PaginatedResponse } from '@/types';

// API
import { getEvents, createEvent, handleOAuthCallback } from '@/api';

// Хранилища
import { useAuthStore, useEventsStore, useCategoriesStore } from '@/stores';
```
