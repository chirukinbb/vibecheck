# Документация API для Android-разработчика

## Содержание

1. [Общая информация](#общая-информация)
2. [Авторизация (Sanctum Bearer Token)](#авторизация)
3. [Формат ответов](#формат-ответов)
4. [Firebase Push-уведомления (FCM)](#firebase-push-уведомления)
5. [API эндпоинты](#api-эндпоинты)
6. [Event-Driven модель сервера](#event-driven-модель)
7. [Структура БД](#структура-базы-данных)

---

## Общая информация

| Параметр       | Значение                             |
|---------------|--------------------------------------|
| Базовый URL    | `http://<HOST>:8080/api/v1`         |
| Аутентификация | Bearer Token (Laravel Sanctum)      |
| Content-Type   | `application/json` (для POST/PUT/PATCH) |
| Формат ответа  | JSON                                |
| Фреймворк      | Laravel 12                          |
| Пакеты         | Sanctum, Spatie/Permissions, FCM    |

Заголовки для ВСЕХ запросов (кроме OAuth-авторизации):

```
Authorization: Bearer <токен>
Accept: application/json
```

---

## Авторизация

### 1. Получение токена (OAuth через Google/Facebook)

Токен получается НЕ через логин/пароль, а через Socialite OAuth-flow. Проект использует редирект-схему.

**Шаг 1: Редирект на провайдера**

```
GET http://<HOST>:8080/api/auth/{provider}/redirect
```

Где `{provider}` = `google` или `facebook`

Перенаправляет пользователя на страницу авторизации Google/Facebook.

**Шаг 2: Callback**

```
GET http://<HOST>:8080/api/auth/{provider}/callback
```

После успешной OAuth-авторизации провайдер перенаправляет на этот URL. Сервер сверяет email пользователя:

- Если пользователь существует — возвращает его данные + Sanctum токен
- Если новый — создаёт аккаунт и возвращает данные + токен

**Формат ответа (JSON):**

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

**ВАЖНО**: Для мобильного приложения нужно реализовать:

1. Открыть WebView/Chrome Custom Tab на URL `http://<HOST>:8080/api/auth/google/redirect`
2. После OAuth пользователь будет перенаправлен на `http://<HOST>:8080/api/auth/google/callback`
3. Поймать этот URL в WebView, извлечь из ответа JSON с токеном
4. Сохранить токен в защищённом хранилище (EncryptedSharedPreferences / Keystore)

Альтернативный подход (если доработать сервер):

- Сделать эндпоинт, принимающий `{provider}` + `{access_token}` от мобильного Google Sign-In SDK
- Сервер вызывает `Socialite::driver('google')->userFromToken($token)`

### 2. Использование токена

Токен формата: `{id}|{plain_text_token}` (стандартный Sanctum)

Пример заголовка:

```
Authorization: Bearer 1|abc123def456...
```

Токен передаётся во ВСЕХ API-запросах. Sanctum middleware `auth:sanctum` проверяет его.

**Токен не имеет срока действия** (`expiration: null` в конфиге).

---

## Формат ответов

### Список событий (GET /api/v1/events)

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
  "links": { ... },
  "meta": { ... }
}
```

### Одиночное событие (GET /api/v1/event/{id})

```json
{
  "data": {
    "title": "...",
    "category": "...",
    ...
  }
}
```

### Успешный ответ (создание/обновление/удаление)

```json
{
  "message": "Event created successfully"
}
```

### Ошибки

```json
{
  "message": "Unauthenticated."
}
```

HTTP 401 — нет/невалидный токен HTTP 403 — недостаточно прав HTTP 400 — ошибка валидации / бизнес-логики HTTP 422 —
ошибка валидации полей

---

## Firebase Push-уведомления (FCM)

Проект использует пакет `laravel-notification-channels/fcm` v6.1 с Firebase Admin SDK.

### Настройка на клиенте (Android)

1. Получить FCM device token через Firebase SDK на устройстве
2. Отправить токен на сервер через эндпоинт:

```
PATCH /api/v1/device
Authorization: Bearer <токен>
Body: { "fcm_token": "fcm_device_token_here" }
```

Эндпоинт уже реализован — сохраняет токен в БД в поле `fcm_token` таблицы `users`.

### Типы push-уведомлений

#### 1. EventNotification — уведомление о новом событии

Приходит, когда создаётся новое событие в радиусе гео-фильтра пользователя.

```
Title:  "New event"
Body:   "New event will be in your region."
Image:  URL картинки события (thumbnail_url)
Data:   { "screen": "single_event", "event_id": 123 }
```

#### 2. RefreshNotification — запрос на обновление списка

Приходит КАЖДОМУ пользователю (кроме автора) при создании нового события.

```
Data: { "action": "refresh", "screen": "events" }
```

**Действие приложения**: обновить список событий (pull-to-refresh).

### Логика отправки уведомлений

**При создании события** (`NewEventNotificationJob`, выполняется асинхронно):

1. ВСЕМ пользователям (кроме автора) отправляется `RefreshNotification` (data push)
2. Пользователям, у которых гео-фильтр (центр + радиус) покрывает координаты события — дополнительно `EventNotification`

**При изменении события** (`EventUpdatedNotificationJob`):

- Пользователям в радиусе — `EventNotification`

### Подсчёт расстояния

Сервер использует формулу Хаверсина (haversine) с радиусом Земли 6371 км.

---

## API эндпоинты

### Аутентификация

```
GET  /api/auth/{provider}/redirect    — редирект на OAuth (google/facebook)
GET  /api/auth/{provider}/callback    — OAuth callback, возвращает UserResource с токеном
```

### События (Events)

```
GET    /api/v1/events                 — список событий (пагинация)
POST   /api/v1/events                 — создать событие (perm: api create event)
GET    /api/v1/event/{event}          — просмотр события (perm: api view event)
PUT    /api/v1/event/{event}          — обновить событие (perm: api edit event, owner only)
DELETE /api/v1/event/{event}          — удалить событие (perm: api create event, owner only)
POST   /api/v1/event/{event}/subscribe             — записаться на событие
PATCH  /api/v1/event/{event}/member/{member}        — оставить отзыв участника
DELETE /api/v1/event/{event}/member/{member}/unsubscribe — отписаться
```

### Категории

```
GET /api/v1/categories                — список категорий
```

Ответ: `[{ "id": 1, "title": "Спорт" }, ...]`

### Профиль пользователя

```
PATCH /api/v1/profile                 — обновить профиль
```

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

### Гео-фильтр

```
PATCH /api/v1/filter                  — обновить гео-фильтр
```

Тело запроса:

```json
{
  "address": "Москва, Красная площадь",
  "radius": 50,
  "categories": [1, 3, 5]
}
```

- `address` - строка адреса (сервер геокодирует через TomTom API)
- `radius` - радиус в километрах
- `categories` - массив ID категорий для фильтрации

### Обратная связь

```
POST /api/v1/feedback                 — отправить feedback
```

Тело запроса:

```json
{
  "text": "Классное приложение!"
}
```

### Устройство (FCM-токен)

```
PATCH /api/v1/device                  — сохранить/обновить FCM-токен
```

Тело запроса:

```json
{
  "fcm_token": "fcm_device_token_here"
}
```

### Создание события (подробно)

```
POST /api/v1/events
Content-Type: multipart/form-data
```

Поля:
| Поле | Тип | Обязательное | Описание | |--------------|--------|-------------|---------------------------------------|
| title | string | да | Название | | description | string | да | Описание | | thumbnail | file | да*         |
Картинка (webp, до 1024 КБ)          | | thumb_path | string | да*         | Альтернатива: путь к файлу | | address |
string | да | Адрес (строка)                        | | category_id | int | да | ID категории | | slots | int | да |
Количество мест | | planing_time | string | да | Дата в формате `d/m/Y H:i`           | | user_id | int | нет | ID
автора (подставляется из токена)   | | tags | array | нет | Массив тегов (строки)                 |

`*` — нужно ОДНО из: thumbnail или thumb_path

### Отзыв участника (feedback по событию)

```
PATCH /api/v1/event/{event}/member/{member}
```

```json
{
  "is_happened": true,
  "comment": "Крутое мероприятие!",
  "mark": 9
}
```

- `is_happened` — bool, состоялось ли
- `mark` — число 0..10

---

## Middleware и разрешения

API защищено несколькими слоями:

1. **auth:sanctum** — проверка Bearer токена (все эндпоинты)
2. **role.permission** — проверка ролей Spatie:
   - `api view event list` — просмотр списка
   - `api view event` — просмотр одного
   - `api create event` — создание/удаление
   - `api edit event` — редактирование
3. **EventOwnerMiddleware** — только владелец события может редактировать/удалять
4. **ReservableMiddleware** — проверка, что есть свободные места (slots > members count)
5. **MemberMiddleware** — проверка, что пользователь является участником события

При получении токена (UserResource) вместе с ним возвращаются abilities (разрешения) пользователя.

---

## Роли пользователей

```
Master — администратор (все права)
User   — обычный пользователь
```

При регистрации через OAuth пользователю автоматически назначается роль `User`.

---

## Event-Driven модель (как работает сервер)

Проект построен на модульной event-driven архитектуре. Базовые компоненты:

### Traits (трейты)

- **ModularResource** — даёт методам `addUnit(key, value)` и `getUnits()` возвращает ассоциативный массив. Используется
  в: UserResourceEvent, EventResourceEvent
- **HasCollection** — то же, но работает с Enum-объектами (UnitEnum). Используется в: DashboardEvent, SettingsEvent,
  AbilitiesEvent

### События (Events)

- **UserResourceEvent** — формирует ответ аутентификации (имя + токен)
- **EventResourceEvent** — формирует ответ одного события
- **DashboardEvent** — сборка меню дашборда (web)
- **AbilitiesEvent** — сборка списка разрешений в токен
- **SettingsEvent** — сборка настроек

### Как работает сборка ответа:

**UserResource (после OAuth):**

1. Создаётся `UserResourceEvent`
2. Добавляется имя, генерируется Sanctum токен с abilities
3. Вызывается `event($userResourceEvent)` — все подписчики могут добавить данные
4. `UsersServiceProvider` слушает это событие и добавляет: `profile`, `filter`, `has_feedback`
5. Результат: `getUnits()` → JSON

**EventResource (при запросе события):**

1. Создаётся `EventResourceEvent`
2. Добавляются поля события
3. Вызывается `event($eventResourceEvent)`
4. `UsersServiceProvider` слушает и добавляет поле `author` (профиль автора)
5. Результат: getUnits() → JSON

### Для Android-разработчика:

Это значит, что структура ответа может динамически расширяться новыми модулями. Парсить JSON нужно гибко (проверять
наличие полей, игнорировать неизвестные).

---

## Структура базы данных

### users

| Поле              | Тип        |
|-------------------|------------|
| id                | bigint PK  |
| name              | string     |
| email             | string UNQ |
| email_verified_at | timestamp? |
| password          | string     |
| remember_token    | string?    |
| fcm_token         | string?    |
| created_at        | timestamp  |
| updated_at        | timestamp  |

### events

| Поле           | Тип         |
|---------------|-------------|
| id            | bigint PK   |
| user_id       | bigint FK   |
| category_id   | bigint FK   |
| title         | string      |
| thumbnail_url | string      |
| address       | string      |
| description   | text        |
| coordinate_lat| string?     |
| coordinate_lng| string?     |
| country_iso   | string?     |
| planing_time  | string      |
| slots         | integer     |
| is_happened   | integer?    |
| deleted_at    | timestamp?  |
| created_at    | timestamp   |
| updated_at    | timestamp   |

### categories

| Поле   | Тип        |
|--------|-----------|
| id     | bigint PK |
| title  | string    |

### tags

| Поле | Тип        |
|------|-----------|
| id   | bigint PK |
| name | string    |

### event_tag (pivot)

| Поле      | Тип      |
|-----------|---------|
| event_id  | bigint  |
| tag_id    | bigint  |

### members

| Поле         | Тип         |
|-------------|-------------|
| id          | bigint PK   |
| user_id     | bigint FK   |
| event_id    | bigint FK   |
| is_happened | bool (def:0)|
| comment     | text?       |
| mark        | string?     |
| created_at  | timestamp   |
| updated_at  | timestamp   |

### profiles

| Поле               | Тип        |
|-------------------|------------|
| id                | bigint PK  |
| user_id           | bigint FK  |
| name              | string     |
| country_phone_iso | string?    |
| country_phone_code| string?    |
| phone             | string?    |
| languages         | text (JSON)|
| bio               | text?      |
| created_at        | timestamp  |
| updated_at        | timestamp  |

### filters

| Поле       | Тип           |
|-----------|---------------|
| id        | bigint PK     |
| user_id   | bigint FK     |
| center    | string (JSON) |
| radius    | integer?      |
| categories| text (JSON)   |
| created_at| timestamp     |
| updated_at| timestamp     |

### feedbacks

| Поле       | Тип        |
|-----------|------------|
| id        | bigint PK  |
| user_id   | bigint FK  |
| text      | string     |
| created_at| timestamp  |
| updated_at| timestamp  |

### comments

| Поле              | Тип      |
|------------------|----------|
| id               | bigint PK|
| event_id         | bigint FK|
| user_id          | bigint FK|
| parent_comment_id| bigint?  |
| content          | text     |
| created_at       | timestamp|
| updated_at       | timestamp|

---

## Примечания для Android-разработчика

### Что нужно сделать на сервере перед началом:

1. **Добавить OAuth-эндпоинт, принимающий access_token от Google Sign-In SDK** (а не редирект), чтобы мобильное
   приложение могло использовать нативный Google Sign-In
2. **Настроить Firebase Admin SDK** (`FIREBASE_CREDENTIALS` в .env) — без этого push-уведомления работать не будут
3. **Выполнить миграцию** `php artisan migrate` — применит добавление колонки `fcm_token` в таблицу `users`

### Важные моменты:

- **planing_time** в API отдаётся как Unix timestamp (секунды), принимается как `d/m/Y H:i`
- **thumbnail** принимается только в формате `.webp`, до 1024 КБ
- **Координаты** (`coordinate_lat`, `coordinate_lng`) заполняются асинхронно через TomTom геокодинг — могут быть null
  сразу после создания события
- **reserved** = текущее количество участников (members.count())
- Пагинация событий — стандартная Laravel (15 на страницу, поля `links`, `meta` в ответе)
- Сервер запущен на **порту 8080**
