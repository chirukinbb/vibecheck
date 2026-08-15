# Документация API для Android-разработчика

## Содержание

1. [Общая информация](#общая-информация)
2. [Авторизация (Sanctum Bearer Token)](#авторизация)
3. [Формат ответов](#формат-ответов)
4. [Обработка ошибок](#обработка-ошибок)
5. [API эндпоинты — полный справочник](#api-эндпоинты--полный-справочник)
6. [Firebase Push-уведомления (FCM)](#firebase-push-уведомления)
7. [Middleware и разрешения](#middleware-и-разрешения)
8. [Event-Driven модель сервера](#event-driven-модель)
9. [Структура БД](#структура-базы-данных)
10. [Примечания](#примечания)

---

## Общая информация

| Параметр        | Значение                              |
|----------------|---------------------------------------|
| Базовый URL     | `http://<HOST>:8080/api/v1`          |
| Аутентификация  | Bearer Token (Laravel Sanctum)       |
| Content-Type    | `application/json` (для POST/PUT/PATCH) |
| Формат ответа   | JSON                                  |
| Фреймворк       | Laravel 12                            |
| Пакеты          | Sanctum, Spatie/Permissions, FCM, Socialite |

Заголовки для ВСЕХ запросов (кроме login/register):

```
Authorization: Bearer <токен>
Accept: application/json
```

---

## Авторизация

Аутентификация реализована двумя способами:

### Способ 1. Email + Password (API)

#### Вход — `POST /api/v1/login`

Content-Type: `application/json`

Тело запроса:

```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**✅ Успех — HTTP 200**

```json
{
    "name": "John Doe",
    "token": "1|abc123def456...",
    "profile": {
        "name": "John Doe",
        "phone": null,
        "country_phone_code": null,
        "languages": null,
        "bio": null,
        "country_phone_iso": null
    },
    "filter": {
        "center": null,
        "radius": null,
        "categories": null
    },
    "has_feedback": false
}
```

**❌ Неверные учётные данные — HTTP 401**

```json
{
    "message": "Invalid email or password."
}
```

**❌ Ошибка валидации — HTTP 422**

Отсутствует email:

```json
{
    "message": "The email field is required.",
    "errors": {
        "email": ["The email field is required."]
    }
}
```

Неверный формат email:

```json
{
    "message": "The email field must be a valid email address.",
    "errors": {
        "email": ["The email field must be a valid email address."]
    }
}
```

Отсутствует password:

```json
{
    "message": "The password field is required.",
    "errors": {
        "password": ["The password field is required."]
    }
}
```

Пустое тело запроса (отсутствуют оба поля):

```json
{
    "message": "The email field is required. (and 1 more error)",
    "errors": {
        "email": ["The email field is required."],
        "password": ["The password field is required."]
    }
}
```

> 📌 При первом входе email автоматически верифицируется (`markEmailAsVerified`).

---

#### Регистрация — `POST /api/v1/register`

Content-Type: `application/json`

Тело запроса:

```json
{
    "name": "John Doe",
    "email": "user@example.com"
}
```

**✅ Успех — HTTP 200**

```json
{
    "message": "Registration successful! Please check your email for the password."
}
```

> 📌 Пароль генерируется автоматически (12 случайных символов) и отправляется на email пользователя. После этого пользователь может войти через `POST /api/v1/login`.

**❌ Ошибка сервера (проблема с отправкой email) — HTTP 401**

```json
{
    "message": "Try later"
}
```

**❌ Ошибка валидации — HTTP 422**

Email уже зарегистрирован:

```json
{
    "message": "The email has already been taken.",
    "errors": {
        "email": ["The email has already been taken."]
    }
}
```

Отсутствует имя:

```json
{
    "message": "The name field is required.",
    "errors": {
        "name": ["The name field is required."]
    }
}
```

Отсутствует email:

```json
{
    "message": "The email field is required.",
    "errors": {
        "email": ["The email field is required."]
    }
}
```

---

### Способ 2. OAuth через Google/Facebook (Socialite)

OAuth-flow реализован как web-редирект (в `routes/web.php`).

**Шаг 1 — Редирект на провайдера**

```
GET /auth/{provider}/redirect?source=app
```

- `{provider}` = `google` или `facebook`
- `source=app` — указывает серверу, что запрос из мобильного приложения

**Шаг 2 — Callback**

```
GET /auth/{provider}/callback
```

После OAuth сервер сверяет email пользователя:

- Существует → использует существующий аккаунт
- Новый → создаёт аккаунт (пароль генерируется автоматически)

Если запрос с `source=app`, сервер делает редирект на deep link:

```
events://auth-callback?token=<sanctum_token>
```

Если `source=web` (по умолчанию) — редирект на dashboard.

**Алгоритм для Android:**

1. Открыть WebView/Chrome Custom Tab на `http://<HOST>:8080/auth/google/redirect?source=app`
2. После авторизации Google редиректит на callback
3. Сервер редиректит на `events://auth-callback?token=...`
4. Приложение перехватывает URL, извлекает токен
5. Сохранить токен в EncryptedSharedPreferences / Keystore

---

### Использование токена

Формат токена: `{id}|{plain_text_token}` (стандартный Sanctum).

Заголовок для всех API-запросов:

```
Authorization: Bearer 1|abc123def456...
```

**Токен не имеет срока действия** (`expiration: null` в конфиге).

---

## Формат ответов

### Аутентификация (login / OAuth)

```json
{
    "name": "John Doe",
    "token": "1|abc123def456...",
    "profile": {
        "name": "John Doe",
        "phone": null,
        "country_phone_code": null,
        "languages": null,
        "bio": null,
        "country_phone_iso": null
    },
    "filter": {
        "center": null,
        "radius": null,
        "categories": null
    },
    "has_feedback": false
}
```

### Список событий — `GET /api/v1/events`

```json
{
    "data": [
        {
            "title": "Название события",
            "category": "Спорт",
            "thumbnail_url": "http://<HOST>:8080/storage/events/thumbnails/xxx.webp",
            "description": "Описание события",
            "coordinate_lat": "55.7558",
            "coordinate_lng": "37.6173",
            "country": "Russia",
            "planing_time": 1720000000,
            "slots": 10,
            "address": "Москва, ул. Пушкина, д. 1",
            "reserved": 3,
            "author": {
                "name": "John Doe",
                "phone": "+79001234567",
                "country_phone_code": "+7",
                "languages": ["en", "ru"],
                "bio": "О себе"
            }
        }
    ],
    "links": {
        "first": "http://<HOST>:8080/api/v1/events?page=1",
        "last": "http://<HOST>:8080/api/v1/events?page=1",
        "prev": null,
        "next": null
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 1,
        "per_page": 15,
        "to": 3,
        "total": 3
    }
}
```

### Одиночное событие — `GET /api/v1/event/{id}`

```json
{
    "data": {
        "title": "...",
        "category": "...",
        "thumbnail_url": "...",
        "description": "...",
        "coordinate_lat": "...",
        "coordinate_lng": "...",
        "country": "...",
        "planing_time": 1720000000,
        "slots": 10,
        "address": "...",
        "reserved": 3,
        "author": {
            "name": "...",
            "phone": "...",
            "country_phone_code": "...",
            "languages": ["en", "ru"],
            "bio": "..."
        }
    }
}
```

### Успешное действие (создание/обновление/удаление)

```json
{
    "message": "Event created successfully"
}
```

---

## Обработка ошибок

### Общие коды ошибок

| HTTP | Причина | Структура ответа |
|------|---------|-----------------|
| **400** | Ошибка бизнес-логики | `{"message": "This event is not reservable"}` |
| **401** | Нет токена / невалидный токен | `{"message": "Unauthenticated."}` |
| **403** | Недостаточно прав / не владелец | `{"message": "You are not authorized to access this event"}` |
| **404** | Ресурс не найден | Стандартный Laravel 404 (HTML или JSON) |
| **422** | Ошибка валидации полей | `{"message": "...", "errors": {...}}` |

### HTTP 422 — Ошибки валидации

Laravel возвращает ошибки валидации в формате:

```json
{
    "message": "The title field is required. (and 2 more errors)",
    "errors": {
        "title": ["The title field is required."],
        "description": ["The description field is required."],
        "planing_time": ["The planing time field is required."]
    }
}
```

- `message` — сводка всех ошибок (если больше одной — добавляется `(and N more errors)`)
- `errors` — объект, где ключ = имя поля, значение = массив сообщений

> ⚠️ **Важно для клиента**: всегда проверяйте HTTP-статус ответа. Статус 2xx = успех, 4xx = ошибка. Не полагайтесь только на наличие поля `message`.

---

## API эндпоинты — полный справочник

### 1. Аутентификация

#### POST /api/v1/login

**Назначение**: вход по email + паролю

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Успешный вход | `{"name":"...","token":"...","profile":{...},"filter":{...},"has_feedback":false}` |
| **401** | Неверный email или пароль | `{"message":"Invalid email or password."}` |
| **
422** | Отсутствует email | `{"message":"The email field is required.","errors":{"email":["The email field is required."]}}` |
| **
422** | Неверный формат email | `{"message":"The email field must be a valid email address.","errors":{"email":["..."]}}` |
| **422** | Отсутствует пароль | `{"message":"The password field is required.","errors":{"password":["..."]}}` |

**Валидация** (LoginRequest):

- `email` — required, valid email
- `password` — required

---

#### POST /api/v1/register

**Назначение**: регистрация нового пользователя

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Успешная регистрация | `{"message":"Registration successful! Please check your email for the password."}` |
| **401** | Ошибка отправки email | `{"message":"Try later"}` |
| **422** | Email уже существует | `{"message":"The email has already been taken.","errors":{"email":["..."]}}` |
| **422** | Отсутствует имя | `{"message":"The name field is required.","errors":{"name":["..."]}}` |
| **422** | Отсутствует email | `{"message":"The email field is required.","errors":{"email":["..."]}}` |

**Валидация** (RegisterRequest):

- `name` — required
- `email` — required, valid email, unique:users

---

### 2. События (Events)

#### GET /api/v1/events

**Назначение**: список событий с пагинацией

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Успех | `{"data":[...],"links":{...},"meta":{...}}` — 15 событий на страницу |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **403** | Нет разрешения | Стандартный Spatie-ответ (доступ запрещён) |

**Права**: `api view event list`

---

#### POST /api/v1/events

**Назначение**: создать событие Content-Type: `multipart/form-data`

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **201** | Создано | `{"message":"Event created successfully"}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **403** | Нет разрешения | Доступ запрещён |
| **422** | Ошибка валидации | `{"message":"...","errors":{...}}` |

**Валидация** (EventRequest):
| Поле | Правила | |------|---------| | `title` | required, string | | `description` | required, string | | `thumbnail`
| required_without:thumb_path, file, mimes:webp, max:1024 | | `thumb_path` | required_without:thumbnail, string |
| `address` | required, string | | `category_id` | required, numeric | | `slots` | numeric | | `user_id` | numeric,
exists:users,id | | `tags` | array | | `planing_time` | required, date_format:d/m/Y H:i |

> 📌 `thumbnail` и `thumb_path` — нужно ОДНО из двух

**Права**: `api create event`

---

#### GET /api/v1/event/{event}

**Назначение**: просмотр одного события

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Успех | `{"data":{...}}` — EventResource |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **403** | Нет разрешения | Доступ запрещён |
| **404** | Событие не существует | Стандартный 404 |

**Права**: `api view event`

---

#### PUT /api/v1/event/{event}

**Назначение**: обновить событие Content-Type: `multipart/form-data`

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Обновлено | `{"message":"Event updated successfully"}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **403** | Не владелец | `{"message":"You are not authorized to access this event"}` |
| **403** | Нет разрешения | Доступ запрещён |
| **404** | Событие не существует | Стандартный 404 |
| **422** | Ошибка валидации | `{"message":"...","errors":{...}}` |

**Валидация**: та же, что у POST (EventRequest), но thumbnail опционален

**Права**: `api edit event` + EventOwnerMiddleware (только владелец)

---

#### DELETE /api/v1/event/{event}

**Назначение**: удалить событие (soft delete)

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Удалено | `{"message":"Event deleted successfully"}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **403** | Не владелец | `{"message":"You are not authorized to access this event"}` |
| **403** | Нет разрешения | Доступ запрещён |
| **404** | Событие не существует | Стандартный 404 |

**Права**: `api create event` + EventOwnerMiddleware (только владелец)

---

#### POST /api/v1/event/{event}/subscribe

**Назначение**: записаться на событие

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Записан | `{"message":"Member created successfully"}` |
| **400** | Нет свободных мест | `{"message":"This event is not reservable"}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **404** | Событие не существует | Стандартный 404 |

**Middleware**: ReservableMiddleware — проверяет `slots > members.count()`

---

#### PATCH /api/v1/event/{event}/member/{member}

**Назначение**: оставить отзыв участника

Тело запроса:

```json
{
    "is_happened": true,
    "comment": "Крутое мероприятие!",
    "mark": 9
}
```

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Отзыв сохранён | `{"message":"Feedback created successfully"}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **403** | Не участник | `{"message":"You are not a member of this event"}` |
| **404** | Событие/участник не найден | Стандартный 404 |
| **422** | Ошибка валидации | `{"message":"...","errors":{...}}` |

**Валидация** (FeedbackRequest — модуль Events):
| Поле | Правила | |------|---------| | `is_happened` | required, boolean | | `comment` | required, string | | `mark` |
required, integer, min:0, max:10 |

**Middleware**: MemberMiddleware — проверяет, что пользователь является участником события

---

#### DELETE /api/v1/event/{event}/member/{member}/unsubscribe

**Назначение**: отписаться от события

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Отписан | `{"message":"Member deleted successfully"}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **403** | Не участник | `{"message":"You are not a member of this event"}` |
| **404** | Событие/участник не найден | Стандартный 404 |

**Middleware**: MemberMiddleware

---

### 3. Категории

#### GET /api/v1/categories

**Назначение**: список категорий

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Успех | `[{"id":1,"title":"Спорт"},{"id":2,"title":"Музыка"},...]` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |

---

### 4. Профиль пользователя

#### GET /api/v1/me

**Назначение**: получить данные текущего пользователя (профиль, фильтр, токен)

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Успех | `{"name":"...","token":"1|new_token...","profile":{...},"filter":{...},"has_feedback":false}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |

Формат ответа идентичен `/api/v1/login`:

```json
{
    "name": "John Doe",
    "token": "1|new_token_here...",
    "profile": {
        "name": "John Doe",
        "phone": null,
        "country_phone_code": null,
        "languages": null,
        "bio": null,
        "country_phone_iso": null
    },
    "filter": {
        "center": null,
        "radius": null,
        "categories": null
    },
    "has_feedback": false
}
```

> 📌 Каждый вызов `/me` генерирует **новый Sanctum-токен**. Предыдущий токен при этом **не инвалидируется** (старые токены остаются валидными). Клиент может использовать этот эндпоинт для проверки валидности текущего токена и получения актуальных данных профиля. Если нужно «освежить» токен — сохраняйте новый `token` из ответа.

---

#### PATCH /api/v1/profile

**Назначение**: обновить профиль

Тело запроса:

```json
{
    "name": "John Doe",
    "phone": "9001234567",
    "country_phone_code": "+7",
    "country_phone_iso": "RU",
    "languages": ["en", "ru"],
    "bio": "Привет, я John!"
}
```

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Обновлён | `{"message":"Profile updated successfully."}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **422** | Ошибка валидации | `{"message":"...","errors":{...}}` |

**Валидация** (ProfileRequest):
| Поле | Правила | |------|---------| | `name` | required, string, max:255 | | `phone` | required, string, max:255 |
| `country_phone_code` | required, string, max:255 | | `country_phone_iso` | required, string, max:255 | | `languages` |
required, array | | `bio` | required, string |

---

### 5. Гео-фильтр

#### PATCH /api/v1/filter

**Назначение**: обновить гео-фильтр

Тело запроса:

```json
{
    "address": "Москва, Красная площадь",
    "radius": 50,
    "categories": [1, 3, 5]
}
```

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Обновлён | `{"message":"Filter updated successfully."}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **422** | Ошибка валидации | `{"message":"...","errors":{...}}` |

**Валидация** (FilterRequest):
| Поле | Правила | |------|---------| | `address` | required, string | | `radius` | required, numeric | | `categories` |
required, array, min:1 |

> 📌 Сервер геокодирует `address` через TomTom API и сохраняет координаты в `center`

---

### 6. Обратная связь

#### POST /api/v1/feedback

**Назначение**: отправить feedback о приложении

Тело запроса:

```json
{
    "text": "Классное приложение!"
}
```

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Отправлен | `{"message":"Feedback created successfully."}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **422** | Ошибка валидации | `{"message":"...","errors":{"text":["The text field is required."]}}` |

**Валидация** (FeedbackRequest — модуль Users):
| Поле | Правила | |------|---------| | `text` | required, string |

> 📌 Один пользователь может отправить только один feedback (has_one отношение)

---

### 7. Устройство (FCM-токен)

#### PATCH /api/v1/device

**Назначение**: сохранить/обновить FCM-токен устройства

Тело запроса:

```json
{
    "fcm_token": "fcm_device_token_here"
}
```

| Статус | Условие | Тело ответа |
|--------|---------|------------|
| **200** | Сохранён | `{"message":"Device token updated."}` |
| **401** | Без токена | `{"message":"Unauthenticated."}` |
| **422** | Ошибка валидации | `{"message":"...","errors":{"fcm_token":["The fcm token field is required."]}}` |

**Валидация** (встроенная в контроллер):
| Поле | Правила | |------|---------| | `fcm_token` | required, string |

---

## Firebase Push-уведомления (FCM)

Пакет: `laravel-notification-channels/fcm` v6.1 с Firebase Admin SDK.

### Настройка на клиенте (Android)

1. Получить FCM device token через Firebase SDK
2. Отправить на сервер: `PATCH /api/v1/device` с `{"fcm_token": "..."}`

### Типы push-уведомлений

#### EventNotification — новое событие в радиусе

```
Title:  "New event"
Body:   "New event will be in your region."
Image:  thumbnail_url события
Data:   { "screen": "single_event", "event_id": 123 }
```

#### RefreshNotification — обновить список

```
Data: { "action": "refresh", "screen": "events" }
```

Приходит ВСЕМ (кроме автора) при создании события.

### Логика отправки

**При создании события** (`NewEventNotificationJob`, асинхронно):

1. Всем (кроме автора) → `RefreshNotification`
2. Пользователям в радиусе гео-фильтра → дополнительно `EventNotification`

**При изменении события** (`EventUpdatedNotificationJob`):

- Пользователям в радиусе → `EventNotification`

**Формула расстояния**: Хаверсин (haversine), радиус Земли 6371 км.

---

## Middleware и разрешения

API защищено несколькими слоями (в порядке выполнения):

| # | Middleware | Действие | Ошибка |
|---|-----------|----------|--------|
| 1 | **auth:sanctum** | Проверка Bearer токена | 401 `{"message":"Unauthenticated."}` |
| 2 | **role.permission** | Проверка прав Spatie | 403 (Spatie) |
| 3 | **
EventOwnerMiddleware** | Только владелец события | 403 `{"message":"You are not authorized to access this event"}` |
| 4 | **ReservableMiddleware** | Есть свободные места | 400 `{"message":"This event is not reservable"}` |
| 5 | **MemberMiddleware** | Пользователь — участник | 403 `{"message":"You are not a member of this event"}` |

### Права (abilities), возвращаемые в токене:

| Право | Действие |
|-------|---------|
| `api view event list` | Просмотр списка событий |
| `api view event` | Просмотр одного события |
| `api create event` | Создание / удаление события |
| `api edit event` | Редактирование события |

### Роли

| Роль | Описание |
|------|---------|
| **Master** | Администратор (все права) |
| **User** | Обычный пользователь (назначается автоматически при регистрации) |

---

## Event-Driven модель

Проект построен на модульной event-driven архитектуре.

### Traits

- **ModularResource** — `addUnit(key, value)` + `getUnits()` → ассоциативный массив. Используется в: UserResourceEvent,
  EventResourceEvent
- **HasCollection** — то же, но с Enum-объектами. Используется в: DashboardEvent, SettingsEvent, AbilitiesEvent

### События и сборка ответа

**UserResource (после login/OAuth):**

1. `UserResourceEvent` — добавляется имя + генерируется Sanctum токен с abilities
2. `event($userResourceEvent)` — оповещаются подписчики
3. `UsersServiceProvider` добавляет: `profile`, `filter`, `has_feedback`
4. Результат → `getUnits()` → JSON

**EventResource (при запросе события):**

1. `EventResourceEvent` — добавляются все поля события
2. `event($eventResourceEvent)` — оповещаются подписчики
3. `UsersServiceProvider` добавляет: `author` (профиль автора)
4. Результат → `getUnits()` → JSON

> ⚠️ **Для клиента**: структура ответа может динамически расширяться. Парсить JSON нужно гибко — проверять наличие полей, игнорировать неизвестные.

---

## Структура базы данных

### users

| Поле | Тип |
|------|-----|
| id | bigint PK |
| name | string |
| email | string UNQ |
| email_verified_at | timestamp? |
| password | string |
| remember_token | string? |
| fcm_token | string? |
| created_at | timestamp |
| updated_at | timestamp |

### events

| Поле | Тип |
|------|-----|
| id | bigint PK |
| user_id | bigint FK |
| category_id | bigint FK |
| title | string |
| thumbnail_url | string |
| address | string |
| description | text |
| coordinate_lat | string? |
| coordinate_lng | string? |
| country_iso | string? |
| planing_time | string |
| slots | integer |
| is_happened | integer? |
| deleted_at | timestamp? |
| created_at | timestamp |
| updated_at | timestamp |

### categories

| Поле | Тип |
|------|-----|
| id | bigint PK |
| title | string |

### tags

| Поле | Тип |
|------|-----|
| id | bigint PK |
| name | string |

### event_tag (pivot)

| Поле | Тип |
|------|-----|
| event_id | bigint |
| tag_id | bigint |

### members

| Поле | Тип |
|------|-----|
| id | bigint PK |
| user_id | bigint FK |
| event_id | bigint FK |
| is_happened | bool (def: 0) |
| comment | text? |
| mark | string? |
| created_at | timestamp |
| updated_at | timestamp |

### profiles

| Поле | Тип |
|------|-----|
| id | bigint PK |
| user_id | bigint FK |
| name | string |
| country_phone_iso | string? |
| country_phone_code | string? |
| phone | string? |
| languages | text (JSON) |
| bio | text? |
| created_at | timestamp |
| updated_at | timestamp |

### filters

| Поле | Тип |
|------|-----|
| id | bigint PK |
| user_id | bigint FK |
| center | string (JSON) |
| radius | integer? |
| categories | text (JSON) |
| created_at | timestamp |
| updated_at | timestamp |

### feedbacks

| Поле | Тип |
|------|-----|
| id | bigint PK |
| user_id | bigint FK |
| text | string |
| created_at | timestamp |
| updated_at | timestamp |

### comments

| Поле | Тип |
|------|-----|
| id | bigint PK |
| event_id | bigint FK |
| user_id | bigint FK |
| parent_comment_id | bigint? |
| content | text |
| created_at | timestamp |
| updated_at | timestamp |

---

## Примечания

### Что нужно сделать на сервере:

1. **Зарегистрировать API-роуты login/register** — методы `AuthController::login()` и `AuthController::register()`
   реализованы, но сами маршруты должны быть добавлены в `routes/api.php`:
   ```php
   Route::post('v1/login', [AuthController::class, 'login']);
   Route::post('v1/register', [AuthController::class, 'register']);
   ```
2. **Настроить Firebase Admin SDK** (`FIREBASE_CREDENTIALS` в .env)
3. **Выполнить миграцию** `php artisan migrate`

### Важные моменты:

- **planing_time** — отдаётся как Unix timestamp (секунды), принимается как `d/m/Y H:i`
- **thumbnail** — только `.webp`, до 1024 КБ
- **Координаты** — заполняются асинхронно через TomTom, могут быть null сразу после создания
- **reserved** = members.count()
- Пагинация: 15 событий на страницу, поля `links` + `meta`
- Сервер на порту **8080**
- Токен **без срока действия**
- Всегда проверяйте HTTP-статус, а не только тело ответа
