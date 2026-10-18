# Демонстрация проектирования БД — сценарий на 7–8 минут

## Что открыть заранее

1. **Приложение**: <http://localhost:3000> (Docker Compose уже запущен).
2. **ER-диаграмма**: [`er-diagram.html`](er-diagram.html) в браузере — её можно масштабировать
   колесом мыши, не теряя качество. Резервный вариант — [`er-diagram.png`](er-diagram.png).
3. **Схема Prisma**: [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma).
4. **Терминал** в корне проекта.
5. **Админ-панель**: войти как `admin@vibecity.ru` / `admin`.

Проверьте перед показом:

```bash
docker compose ps
docker compose exec vibecity mysql --default-character-set=utf8mb4 -uvibecity -pvibecity vibecity -e "SHOW TABLES;"
```

Контейнер должен быть в статусе `healthy`, а команда — вывести 9 таблиц.

---

## 0:00–1:00. ER-диаграмма: общая картина

**Что показать:** [`er-diagram.html`](er-diagram.html).

**Что сказать:**

> Схема состоит из 9 сущностей. Я разделил их на три группы. Слева — справочники:
> организаторы, площадки и теги. В центре — основная сущность «Мероприятие»: она ссылается на
> все три справочника. Справа — транзакционная часть: пользователи, билеты, отзывы. Внизу —
> маркетинговый блок: подарки и промокоды.

Обратите внимание преподавателя на:

- центральное положение `Event` и три внешних ключа `organizerId`, `placeId`, `tagId`;
- `Ticket` и `Review` как две связи «один ко многим» от `Event` и от `User`;
- `Promocode` — необязательная связь с билетом (`0..1 : N`);
- подписи `UNIQUE` под `Review` и `Ticket`.

**Фраза для перехода:**

> Дальше покажу, что эта же схема описана в коде и что она реально существует в MySQL.

---

## 1:00–2:00. `schema.prisma`: схема как единый источник истины

**Что показать:** [`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma).

**На что обратить внимание:**

- `enum Role`, `EventStatus`, `TicketStatus`, `PromocodeStatus`, `GiftStatus`;
- `@relation(...)` и `onDelete: Restrict / Cascade / SetNull`;
- `@unique` у `email`, `phone`, `code`, `qrCode`;
- `@@unique([userId, eventId])` у `Review`;
- `@@unique([eventId, seatNumber])` у `Ticket`;
- `@@index([date])`, `@@index([category])`, `@@index([status])`.

**Что сказать:**

> Prisma-схема — единый источник истины. Из неё командой `prisma db push` создаются таблицы MySQL,
> а клиент Prisma генерирует типизированные запросы. Ограничения описаны здесь же, поэтому они
> одинаково работают и в коде, и на уровне базы.

---

## 2:00–3:30. Живая база: таблицы, ключи, внешние связи

**Команды:**

```bash
# 1. Таблицы
docker compose exec vibecity mysql --default-character-set=utf8mb4 -uvibecity -pvibecity vibecity -e "SHOW TABLES;"

# 2. Структура таблицы билетов: PK, FK, UK, индексы
docker compose exec vibecity mysql --default-character-set=utf8mb4 -uvibecity -pvibecity vibecity -e "SHOW CREATE TABLE Ticket\G"

# 3. Все внешние ключи базы
docker compose exec vibecity mysql --default-character-set=utf8mb4 -uvibecity -pvibecity vibecity -e "
SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'vibecity' AND REFERENCED_TABLE_NAME IS NOT NULL;"
```

**Что сказать по выводу `SHOW CREATE TABLE Ticket`:**

> Вот первичный ключ, четыре внешних ключа, уникальный `qrCode` и составной уникальный индекс
> `(eventId, seatNumber)`. Именно он не даст продать одно и то же место дважды.

**Что сказать по списку внешних ключей:**

> База сама гарантирует ссылочную целостность: нельзя создать билет на несуществующее
> мероприятие или привязать отзыв к несуществующему пользователю.

---

## 3:30–5:00. Приложение ↔ база: покупка билета

**Что сделать в интерфейсе:**

1. Открыть любое мероприятие.
2. Нажать «Купить билет».
3. Выбрать свободное место, например `777`.
4. Ввести промокод `VIBE10`.
5. Показать пересчёт цены и подтвердить покупку.
6. Открыть «Мои билеты» и показать QR-код.

**Сразу после покупки выполнить:**

```bash
docker compose exec vibecity mysql --default-character-set=utf8mb4 -uvibecity -pvibecity vibecity -e "
SELECT t.id, e.name, t.seatNumber, t.price, u.email, t.qrCode
FROM Ticket t
JOIN Event e ON e.id = t.eventId
JOIN User u  ON u.id = t.userId
ORDER BY t.id DESC
LIMIT 3;"
```

**Что сказать:**

> Только что купленный билет появился в таблице `Ticket`. Обратите внимание: в билете хранится
> `price` на момент покупки, а не текущая цена мероприятия. Промокод стал `USED`, скидка
> применилась на сервере в транзакции.

**Дополнительно показать:**

```bash
# промокод изменил статус
docker compose exec vibecity mysql --default-character-set=utf8mb4 -uvibecity -pvibecity vibecity -e "
SELECT code, discount, status FROM Promocode WHERE code = 'VIBE10';"

# количество билетов
docker compose exec vibecity mysql --default-character-set=utf8mb4 -uvibecity -pvibecity vibecity -e "SELECT COUNT(*) AS tickets FROM Ticket;"
```

---

## 5:00–6:00. Ограничения целостности

### 1. Уникальность места

В интерфейсе попробуйте купить **то же самое место** ещё раз. API вернёт
`409 «Это место уже занято»`. Это срабатывает `UNIQUE(eventId, seatNumber)`, а не только проверка
в коде.

### 2. Запрет удаления справочника

В админке: **Справочники → Места → удалить площадку, у которой есть мероприятия**.
Например, «Концертный зал «Аврора». Появится ошибка — это `ON DELETE RESTRICT`.

То же самое в SQL:

```bash
docker compose exec vibecity mysql --default-character-set=utf8mb4 -uvibecity -pvibecity vibecity -e "
START TRANSACTION;
DELETE FROM Place WHERE id = 5;
ROLLBACK;" || true
```

**Что сказать:**

> MySQL не разрешает удалить площадку, пока на неё ссылаются мероприятия. Мы не теряем данные
> и не получаем «висячие» внешние ключи.

### 3. Каскадное удаление

Если удалить мероприятие, его билеты и отзывы удалятся каскадно
(`onDelete: Cascade`). Это тоже можно показать по `SHOW CREATE TABLE Ticket`.

---

## 6:00–7:00. Нормализация и осознанные решения

**Что сказать:**

> Схема приведена к 3НФ. Справочники вынесены: в `Event` нет города, адреса и контактов
> организатора — только внешние ключи. Рейтинг и количество свободных мест не хранятся, а
> считаются: `AVG(Review.rating)` и `Place.capacity - COUNT(Ticket)`.

**Осознанные исключения:**

- `Ticket.price` — снимок цены на момент покупки, чтобы старые билеты не менялись;
- `Event.status` — состояние модерации, а не дублирование данных;
- `Event.category` — строковый атрибут по ТЗ; при необходимости выносится в справочник.

**Фраза для завершения:**

> Итого: 9 таблиц, 10 связей, ссылочная целостность на уровне MySQL, бизнес-ограничения в
> Prisma и валидация в API. Схема нормализована, а исключения осознанные и объяснены.

---

## 7:00–8:00. Вероятные вопросы и короткие ответы

| Вопрос | Ответ |
| --- | --- |
| Почему `Ticket.price`, если есть `Event.price`? | Цена билета фиксируется на момент покупки. Изменение цены события не должно менять уже проданные билеты. |
| Почему рейтинг не хранится в `Event`? | Он вычисляется из `Review`; хранение создало бы дублирование и риск рассинхронизации. |
| Почему `UNIQUE(eventId, seatNumber)`? | Защита от двойной продажи места при одновременных запросах. |
| Зачем `createdById`, если есть `Organizer`? | `Organizer` — справочник, а `createdById` — автор карточки (пользователь), чтобы работал кабинет «мои мероприятия». |
| Почему у мероприятия один тег? | По ТЗ `tagId` — один внешний ключ. Для many-to-many понадобилась бы таблица `EventTag`. |
| Как хранятся пароли? | Только bcrypt-хэш; открытый пароль не хранится и не возвращается API. |
| Как проверяется право на отзыв? | В контроллере ищется активный `Ticket` этого пользователя на это мероприятие. |
| Что будет при удалении пользователя? | Отзывы и билеты удалятся каскадно, а созданные им мероприятия останутся с `createdById = NULL`. |
| Как обеспечивается целостность при покупке? | Транзакция: создание билета + пометка промокода `USED`; уникальный индекс места. |
| Где в приложении видна админка БД? | Админ-панель работает с теми же таблицами через API: пользователи, мероприятия, отзывы, справочники. |

---

## Мини-шпаргалка SQL

```sql
-- Афиша с площадкой, организатором и тегом
SELECT e.id, e.name, e.date, p.city, p.name AS place, o.name AS organizer, t.name AS tag
FROM Event e
JOIN Place p     ON p.id = e.placeId
JOIN Organizer o ON o.id = e.organizerId
JOIN Tag t       ON t.id = e.tagId
ORDER BY e.date;

-- Свободные места
SELECT p.capacity - COUNT(t.id) AS available
FROM Event e
JOIN Place p ON p.id = e.placeId
LEFT JOIN Ticket t ON t.eventId = e.id AND t.status = 'ACTIVE'
WHERE e.id = 1
GROUP BY p.capacity;

-- Рейтинг мероприятий
SELECT e.name, ROUND(AVG(r.rating), 1) AS rating, COUNT(r.id) AS reviews
FROM Event e
LEFT JOIN Review r ON r.eventId = e.id
GROUP BY e.id, e.name
ORDER BY rating DESC;

-- Проверка индекса
EXPLAIN SELECT * FROM Event WHERE status = 'APPROVED' AND category = 'Концерты' ORDER BY date;
```
