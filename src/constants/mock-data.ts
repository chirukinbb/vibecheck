// src/constants/mock-data.ts — хардкод-объекты для всех экранов

import type {MeResponse} from '@/types/auth';
import type {Category} from '@/types/category';
import type {Event} from '@/types/event';
import {ReactNativeFile} from "@/types/file";
import type {GeoFilter} from '@/types/filter';
import type {Profile} from '@/types/profile';

// ─── Категории ────────────────────────────────────────────────────────

export const MOCK_CATEGORIES: Category[] = [
  {id: 1, title: 'Спорт'},
  {id: 2, title: 'Музыка'},
  {id: 3, title: 'IT / Технологии'},
  {id: 4, title: 'Искусство'},
  {id: 5, title: 'Бизнес'},
  {id: 6, title: 'Еда и напитки'},
  {id: 7, title: 'Путешествия'},
  {id: 8, title: 'Кино'},
  {id: 9, title: 'Образование'},
  {id: 10, title: 'Настольные игры'},
];

// ─── События ──────────────────────────────────────────────────────────

const now = Math.floor(Date.now() / 1000);
const DAY = 86400;

export const MOCK_EVENTS: Event[] = [
  {
    id: 1,
    title: 'Йога на крыше',
    category: 'Спорт',
    thumbnail_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
    description:
        'Расслабляющая йога на закате с панорамным видом на город. Подходит для любого уровня подготовки. Занятие проводит сертифицированный инструктор с 10-летним стажем. Приносите свой коврик!',
    coordinate_lat: '55.7558',
    coordinate_lng: '37.6173',
    country: 'Россия',
    planing_time: now + 3 * DAY,
    slots: 20,
    address: 'Москва, ул. Тверская, 15, крыша БЦ "Галерея"',
    reserved: 12,
    author: {
      name: 'Анна Соколова',
      avatar_url: null,
      languages: ['ru', 'en'],
      bio: 'Сертифицированный инструктор по йоге, 10 лет практики',
    },
    tags: [
      {id: 1, name: 'йога'},
      {id: 2, name: 'здоровье'},
      {id: 3, name: 'на природе'},
    ],
    is_happened: null,
  },
  {
    id: 2,
    title: 'Джазовый вечер',
    category: 'Музыка',
    thumbnail_url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600',
    description:
        'Живой джаз в уютном подвальчике. Трио саксофон-контрабас-ударные. В программе — классика Майлза Дэвиса и авторские композиции. В баре специальные коктейли вечера.',
    coordinate_lat: '55.7618',
    coordinate_lng: '37.6046',
    country: 'Россия',
    planing_time: now + 5 * DAY,
    slots: 40,
    address: 'Москва, Брюсов пер., 7, джаз-клуб "Эссе"',
    reserved: 38,
    author: {
      name: 'Игорь Левин',
      avatar_url: null,
      languages: ['ru'],
      bio: 'Джазовый пианист и аранжировщик',
    },
    tags: [
      {id: 4, name: 'джаз'},
      {id: 5, name: 'живая музыка'},
    ],
    is_happened: null,
  },
  {
    id: 3,
    title: 'AI Meetup: Будущее LLM',
    category: 'IT / Технологии',
    thumbnail_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600',
    description:
        'Обсуждение трендов в больших языковых моделях. Доклады от инженеров Яндекса и Сбера. Рассмотрим RAG, fine-tuning, мультиагентные системы. Нетворкинг после докладов.',
    coordinate_lat: '55.7338',
    coordinate_lng: '37.5881',
    country: 'Россия',
    planing_time: now + 2 * DAY,
    slots: 100,
    address: 'Москва, ул. Льва Толстого, 16, Технопарк',
    reserved: 87,
    author: {
      name: 'Дмитрий Волков',
      avatar_url: null,
      languages: ['ru', 'en'],
      bio: 'ML Engineer, ex-Яндекс',
    },
    tags: [
      {id: 6, name: 'AI'},
      {id: 7, name: 'митап'},
      {id: 8, name: 'технологии'},
    ],
    is_happened: null,
  },
  {
    id: 4,
    title: 'Мастер-класс по керамике',
    category: 'Искусство',
    thumbnail_url: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600',
    description:
        'Создайте свою первую чашку из глины! Все материалы включены. Мастер покажет базовые техники ручной лепки и работы на гончарном круге. Готовое изделие можно забрать через неделю после обжига.',
    coordinate_lat: '59.9343',
    coordinate_lng: '30.3351',
    country: 'Россия',
    planing_time: now + 7 * DAY,
    slots: 8,
    address: 'Санкт-Петербург, наб. реки Фонтанки, 52',
    reserved: 5,
    author: {
      name: 'Мария Гончарова',
      avatar_url: null,
      languages: ['ru'],
      bio: 'Художник-керамист, выпускница Мухинского училища',
    },
    tags: [
      {id: 9, name: 'мастер-класс'},
      {id: 10, name: 'творчество'},
    ],
    is_happened: null,
  },
  {
    id: 5,
    title: 'Стартап-бранч',
    category: 'Бизнес',
    thumbnail_url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600',
    description:
        'Неформальная встреча фаундеров и инвесторов за завтраком. Обсуждение трендов венчурного рынка. Три питча ранних стартапов. Отличная возможность найти кофаундера или ментора.',
    coordinate_lat: '55.7410',
    coordinate_lng: '37.6274',
    country: 'Россия',
    planing_time: now + 4 * DAY,
    slots: 30,
    address: 'Москва, Космодамианская наб., 52, БЦ Riverside',
    reserved: 22,
    author: {
      name: 'Алексей Смирнов',
      avatar_url: null,
      languages: ['ru', 'en'],
      bio: 'Основатель стартап-студии, бизнес-ангел',
    },
    tags: [
      {id: 11, name: 'стартап'},
      {id: 12, name: 'нетворкинг'},
      {id: 13, name: 'бизнес'},
    ],
    is_happened: null,
  },
  {
    id: 6,
    title: 'Винная дегустация',
    category: 'Еда и напитки',
    thumbnail_url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600',
    description:
        'Дегустация 6 сортов вин Нового Света с сомелье. Лёгкие закуски включены. Узнаете, как правильно дегустировать, сочетать с едой и выбирать вино в магазине.',
    coordinate_lat: '55.7677',
    coordinate_lng: '37.5934',
    country: 'Россия',
    planing_time: now + 6 * DAY,
    slots: 16,
    address: 'Москва, ул. Большая Никитская, 22',
    reserved: 14,
    author: {
      name: 'Екатерина Виноградова',
      avatar_url: null,
      languages: ['ru', 'fr'],
      bio: 'Сомелье WSET Level 3, преподаватель винной школы',
    },
    tags: [
      {id: 14, name: 'вино'},
      {id: 15, name: 'дегустация'},
    ],
    is_happened: null,
  },
];

// ─── Профиль ──────────────────────────────────────────────────────────

export const MOCK_PROFILE: Profile = {
  name: 'Богдан',
  avatar_url: null,
  languages: ['ru', 'en'],
  bio: 'Люблю активный отдых и технологии. Всегда открыт к новым знакомствам.',
};

// ─── Гео-фильтр ───────────────────────────────────────────────────────

export const MOCK_FILTER: GeoFilter = {
  center: [55.7558, 37.6173],
  radius: 10,
  categories: [1, 2, 3, 6, 10],
};

// ─── Ответ /me ────────────────────────────────────────────────────────

export const MOCK_AUTH_RESPONSE: MeResponse = {
  name: 'Богдан',
  profile: MOCK_PROFILE,
  filter: MOCK_FILTER,
  has_feedback: false,
};

// ─── Языки (для профиля) ─────────────────────────────────────────────

export const AVAILABLE_LANGUAGES: { code: string; label: string }[] = [
  {code: 'ru', label: 'Русский'},
  {code: 'en', label: 'English'},
  {code: 'es', label: 'Español'},
  {code: 'fr', label: 'Français'},
  {code: 'de', label: 'Deutsch'},
  {code: 'zh', label: '中文'},
];

// ─── Хелперы ──────────────────────────────────────────────────────────

export function formatDate(ts: number | string | null): string {
  if (ts === null || ts === undefined) return '';
  let seconds: number;
  if (typeof ts === 'number') {
    seconds = ts;
  } else if (/^\d+$/.test(ts)) {
    seconds = parseInt(ts, 10);
  } else {
    const ms = Date.parse(ts);
    if (isNaN(ms)) return '';
    seconds = Math.floor(ms / 1000);
  }

  const d = new Date(seconds * 1000);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(ts: number | string | null): string {
  if (ts === null || ts === undefined) return '';
  let seconds: number;
  if (typeof ts === 'number') {
    seconds = ts;
  } else if (/^\d+$/.test(ts)) {
    seconds = parseInt(ts, 10);
  } else {
    const ms = Date.parse(ts);
    if (isNaN(ms)) return '';
    seconds = Math.floor(ms / 1000);
  }

  const d = new Date(seconds * 1000);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

export function getCategoryById(id: number): Category | undefined {
  return MOCK_CATEGORIES.find((c) => c.id === id);
}

export function getEventById(id: number): Event | undefined {
  return MOCK_EVENTS.find((e) => e.id === id);
}

export function fileToFormData(filepath: string): ReactNativeFile {
  const filename = filepath.split('/').pop()
  if (filename != null) {
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';

    // 3. Формируем объект файла для DTO
    return {
      uri: filepath,             // Локальный путь пути file://...
      name: filename,        // Имя файла (например, avatar.jpg или avatar.webp)
      type: type,            // MIME-тип (например, image/webp или image/jpeg)
    };
  }
  // Если имя файла не найдено, возвращаем базовый объект вместо undefined
  return {
    uri: filepath,
    name: 'file',
    type: 'application/octet-stream',
  };
}
