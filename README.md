# VibeCity — афиша мероприятий

Учебный проект (курсовая работа): полноценная веб-платформа для поиска городских событий и
продажи билетов. Внутри — React-фронтенд, REST API на Express, база MySQL и всё это упаковано
в один Docker-контейнер.

**Что умеет сервис:**

- афиша с фильтрами по категории, городу, тегу и датам + поиск и пагинация;
- карточка мероприятия с описанием, площадкой, организатором и отзывами;
- регистрация/вход по JWT, личный кабинет с билетами и QR-кодами;
- покупка билета с выбором конкретного места и промокодом (скидка пересчитывается на лету);
- кабинет организатора: создание и редактирование своих мероприятий, статистика продаж;
- админ-панель: пользователи (бан/разбан), модерация мероприятий, удаление отзывов,
  CRUD справочников (места, организаторы, теги, подарки, промокоды);
- тёмный адаптивный интерфейс на Tailwind CSS.

---

## Скриншоты

<p align="center">
  <img src="docs/screenshots/home.webp" alt="Главная страница — афиша" width="49%" />
  <img src="docs/screenshots/event.webp" alt="Карточка мероприятия" width="49%" />
</p>

<p align="center">
  <img src="docs/screenshots/admin.webp" alt="Админ-панель" width="49%" />
  <img src="docs/screenshots/organizer.webp" alt="Кабинет организатора" width="49%" />
</p>

<p align="center">
  <img src="docs/screenshots/login.webp" alt="Вход в аккаунт" width="62%" />
</p>

---

## Стек

| Слой | Технологии |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, React Router v6, Zustand, React Query, Axios, lucide-react, qrcode.react |
| Backend | Node.js 20, TypeScript, Express, Prisma ORM, JWT, bcryptjs, Zod |
| База данных | MySQL 8.0 |
| Инфраструктура | Docker, Docker Compose, единый контейнер (Ubuntu 24.04 + MySQL + Node.js) |

---

## Быстрый старт в Docker

Требуется установленный Docker.

```bash
docker compose up --build -d
```

Откройте **http://localhost:3000** — приложение раздаётся тем же Express-сервером, что и API.

Полезные команды:

```bash
docker compose logs -f         # логи приложения и MySQL
docker compose down            # остановить (данные в volume сохраняются)
docker compose down -v         # остановить и удалить базу данных
```

Альтернатива без compose:

```bash
docker build -t vibecity .
docker run -d --name vibecity -p 3000:3000 -v vibecity_mysql:/var/lib/mysql vibecity
```

> При первом запуске контейнер сам инициализирует MySQL, применяет схему Prisma и загружает
> демо-данные. При повторном запуске сидинг пропускается, данные сохраняются в volume
> `mysql_data`. Секрет JWT и пароль можно переопределить через переменные окружения
> `JWT_SECRET`, `DB_PASSWORD` в `docker-compose.yml`.

---

## Тестовые аккаунты

| Роль | Email | Пароль | Возможности |
| --- | --- | --- | --- |
| Администратор | `admin@vibecity.ru` | `admin` | всё: модерация, пользователи, справочники |
| Пользователь | `user@vibecity.ru` | `user123` | билеты, отзывы, кабинет организатора |
| Пользователь | `mikhail@vibecity.ru` | `user123` | билеты и отзывы |
| Пользователь | `elena@vibecity.ru` | `user123` | билеты и отзывы |

Промокоды для проверки покупки: `VIBE10` (−10%), `WELCOME15` (−15%), `NEON20` (−20%),
`GIFT50` (−50%). Промокод одноразовый: после покупки он получает статус `USED`.

Что можно проверить:

1. Войти как `user@vibecity.ru` → открыть любое событие → купить билет, выбрать место,
   ввести промокод → увидеть QR в «Мои билеты».
2. Оставить отзыв (доступен только после покупки билета).
3. Войти как `admin@vibecity.ru` → «Админка» → одобрить мероприятие «Vibe Comedy Night»
   (оно специально создано со статусом «На модерации»).
4. Создать мероприятие в кабинете организатора — оно уйдёт на модерацию; администратор
   публикует или отклоняет его.
5. Заблокировать пользователя в админке — вход под ним начнёт возвращать `403`.

---

## Запуск локально (без Docker)

Нужны Node.js 20+ и MySQL 8.0.

### 1. База данных

Создайте пустую базу `vibecity` и пользователя (или используйте root):

```sql
CREATE DATABASE vibecity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

При необходимости поправьте `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="mysql://root:root@localhost:3306/vibecity"
JWT_SECRET="vibecity-local-dev-secret"
JWT_EXPIRES_IN="24h"
```

```bash
npm ci
npx prisma db push      # создаёт таблицы
npm run seed            # демо-данные (--force для перезаписи)
npm run dev             # API на http://localhost:3000
```

### 3. Frontend

Во втором терминале:

```bash
cd frontend
npm ci
npm run dev             # Vite на http://localhost:5173
```

Vite проксирует все запросы `/api` на `http://localhost:3000` (см. `frontend/vite.config.ts`).

Production-сборка фронтенда:

```bash
cd frontend
npm run build           # dist/
```

Собранный `dist` можно положить в `backend/public` — Express начнёт раздавать статику и SPA.

---

## Структура проекта

```text
vibecity/
├── backend/
│   ├── prisma/schema.prisma      # 9 сущностей, связи, enum'ы
│   ├── src/
│   │   ├── controllers/          # auth, events, tickets, reviews, admin, meta
│   │   ├── middleware/           # JWT, роли, ошибки, валидация
│   │   ├── routes/               # REST-маршруты
│   │   ├── validators/           # Zod-схемы
│   │   ├── utils/                # JWT, ошибки, выборки, даты
│   │   ├── app.ts                # Express-приложение и раздача SPA
│   │   ├── index.ts              # запуск сервера
│   │   └── seed.ts               # демо-данные
│   └── package.json
├── frontend/
│   └── src/
│       ├── api/                  # Axios-клиент и методы API
│       ├── components/           # UI, карточки, модалки, админ-секции
│       ├── pages/                # Home, Event, Auth, Profile, Organizer, Admin, 404
│       ├── stores/               # Zustand (auth)
│       ├── lib/                  # форматирование, classnames
│       └── types/                # общие TypeScript-типы
├── Dockerfile                    # multi-stage: frontend → backend → Ubuntu + MySQL
├── entrypoint.sh                 # инициализация MySQL, prisma db push, seed, запуск
├── docker-compose.yml
├── plan.md                       # исходное ТЗ
└── README.md
```

---

## Модель данных

Схема описана в [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).

Материалы для защиты проектирования БД:

- [ER-диаграмма (PNG)](docs/database/er-diagram.png) и [интерактивная версия](docs/database/er-diagram.html);
- [подробное описание схемы, ключей, индексов и нормализации](docs/database/database-design.md);
- [PDF для печати](docs/database/database-design.pdf);
- [сценарий показа преподавателю на 7–8 минут](docs/database/demo-script.md).

1. **User** — ФИО, телефон, email, bcrypt-пароль, роль (`USER`/`ADMIN`), блокировка.
2. **Organizer** — название, контактное лицо, телефон.
3. **Place** — город, название, адрес, вместимость.
4. **Tag** — название и тип.
5. **Event** — название, дата, время, описание, категория, картинка, цена, статус модерации;
   связи с организатором, местом и тегом; автор карточки.
6. **Review** — оценка 1–5, текст, дата; уникальный отзыв от пользователя на мероприятие.
7. **Gift** — название, описание, тип, статус.
8. **Promocode** — код, статус, скидка; принадлежит подарку.
9. **Ticket** — место, цена, статус, UUID для QR; связи с пользователем, мероприятием и промокодом.
   Уникальная пара `(eventId, seatNumber)` защищает от двойной продажи места.

Дополнительно к ТЗ добавлены поля, без которых не работают описанные в нём сценарии:
`Event.price` (проверка «цена не отрицательная»), `Event.status` (модерация),
`Event.createdById` («свои мероприятия» организатора), `User.isBanned` (бан/разбан),
`Ticket.price` (итоговая цена со скидкой), `Promocode.discount` (размер скидки).

---

## REST API

Все ответы — JSON, ошибки приходят в виде `{ "message": "...", "details"?: ... }`.
Защищённые маршруты ожидают `Authorization: Bearer <JWT>`.

### Авторизация

| Метод | Маршрут | Доступ | Описание |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | публично | регистрация, роль `USER` |
| POST | `/api/auth/login` | публично | вход, JWT на 24 часа |
| GET | `/api/auth/me` | авторизован | текущий пользователь |
| PUT | `/api/auth/profile` | авторизован | профиль и смена пароля |

### Мероприятия

| Метод | Маршрут | Доступ | Описание |
| --- | --- | --- | --- |
| GET | `/api/events` | публично | фильтры: `category`, `city`, `tagId`, `search`, `dateFrom`, `dateTo`, `sort`, `page`, `limit` |
| GET | `/api/events/:id` | публично | детали + площадка, организатор, тег, отзывы, рейтинг, места |
| GET | `/api/events/:id/seats` | публично | вместимость и занятые места |
| GET | `/api/events/:id/reviews` | публично | отзывы мероприятия |
| POST | `/api/events/:id/reviews` | авторизован + билет | отзыв, оценка 1–5 |
| POST | `/api/events` | авторизован | создание (пользователь → `PENDING`, админ → `APPROVED`) |
| PUT | `/api/events/:id` | автор или админ | редактирование |
| DELETE | `/api/events/:id` | автор или админ | удаление |
| GET | `/api/events/mine` | авторизован | мероприятия текущего автора |

### Билеты и промокоды

| Метод | Маршрут | Доступ | Описание |
| --- | --- | --- | --- |
| POST | `/api/tickets/buy` | авторизован | покупка: место, промокод, проверка вместимости |
| GET | `/api/tickets/my` | авторизован | билеты пользователя |
| GET | `/api/tickets/:id` | владелец или админ | один билет |
| POST | `/api/promocodes/validate` | публично | предпросмотр скидки по коду |
| DELETE | `/api/reviews/:id` | автор или админ | удаление отзыва |

### Админка

| Метод | Маршрут | Описание |
| --- | --- | --- |
| GET | `/api/admin/stats` | счётчики, выручка, последние мероприятия |
| GET | `/api/admin/users` | список с поиском и пагинацией |
| PATCH | `/api/admin/users/:id/ban` | блокировка/разблокировка |
| GET | `/api/admin/events` | все мероприятия с фильтром по статусу |
| PATCH | `/api/admin/events/:id/status` | модерация (`PENDING` / `APPROVED` / `REJECTED`) |
| DELETE | `/api/admin/events/:id` | удаление |
| GET / DELETE | `/api/admin/reviews`, `/api/admin/reviews/:id` | модерация отзывов |
| GET/POST/PUT/DELETE | `/api/admin/places`, `organizers`, `tags`, `gifts`, `promocodes` | справочники |
| GET | `/api/meta/catalog` | публичный справочник для фильтров и форм |

---

## Переменные окружения

| Переменная | Назначение | По умолчанию |
| --- | --- | --- |
| `PORT` | порт Express | `3000` |
| `NODE_ENV` | режим (`production` включает раздачу SPA) | `development` |
| `DATABASE_URL` | строка подключения Prisma | — |
| `JWT_SECRET` | секрет подписи токенов | dev-значение |
| `JWT_EXPIRES_IN` | срок жизни JWT | `24h` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | параметры MySQL в контейнере | `vibecity` / `vibecity` / `vibecity` |

---

## Безопасность и особенности реализации

- пароли хранятся только как bcrypt-хэши (10 раундов), в ответах API поле `password` отсутствует;
- JWT проверяется на каждом защищённом запросе, заблокированный пользователь получает `403`;
- все входные данные проходят валидацию Zod, ошибки Prisma (`P2002`, `P2025`, `P2003`)
  преобразуются в понятные ответы `400/404/409`;
- проверка роли — отдельный `adminMiddleware`, владелец мероприятия проверяется в контроллере;
- отзыв можно оставить только при наличии активного билета;
- цена пересчитывается на сервере, промокод помечается использованным в транзакции;
- уникальный индекс `(eventId, seatNumber)` не даёт двум людям купить одно место даже при гонке;
- оплата демонстрационная: билет создаётся без интеграции с платёжным шлюзом.

## Возможные проблемы

| Проблема | Решение |
| --- | --- |
| `Can't reach database server` | проверьте, что MySQL запущен, и `DATABASE_URL` указывает на верный порт |
| Порт 3000 занят | измените `PORT` и маппинг портов в `docker-compose.yml` |
| Нужно сбросить демо-данные | `cd backend && npm run seed -- --force` или `docker compose down -v` |
| Не загружаются картинки | события используют внешние изображения Unsplash; без интернета показывается заглушка |
| Белый экран после деплоя | убедитесь, что `frontend/dist` скопирован в `backend/public` и `NODE_ENV=production` |

---

## Команды разработчика

```bash
# backend
npm run dev       # ts-node-dev
npm run build     # tsc → dist/
npm run start     # node dist/index.js
npm run seed      # демо-данные
npm run prisma:push

# frontend
npm run dev       # Vite
npm run build     # tsc + vite build
npm run typecheck
```
