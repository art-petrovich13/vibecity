import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import type { EventStatus, PromocodeStatus } from '@prisma/client';
import { prisma } from './prisma';

const IMAGE = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
};

const usersSeed = [
  {
    key: 'admin',
    lastName: 'Петров',
    firstName: 'Артём',
    patronymic: 'Валерьевич',
    phone: '+7 900 000-00-01',
    email: 'admin@vibecity.ru',
    password: 'admin',
    role: 'ADMIN' as const,
  },
  {
    key: 'anna',
    lastName: 'Иванова',
    firstName: 'Анна',
    patronymic: 'Сергеевна',
    phone: '+7 900 000-00-02',
    email: 'user@vibecity.ru',
    password: 'user123',
    role: 'USER' as const,
  },
  {
    key: 'mikhail',
    lastName: 'Соколов',
    firstName: 'Михаил',
    patronymic: 'Андреевич',
    phone: '+7 900 000-00-03',
    email: 'mikhail@vibecity.ru',
    password: 'user123',
    role: 'USER' as const,
  },
  {
    key: 'elena',
    lastName: 'Кузнецова',
    firstName: 'Елена',
    patronymic: 'Дмитриевна',
    phone: '+7 900 000-00-04',
    email: 'elena@vibecity.ru',
    password: 'user123',
    role: 'USER' as const,
  },
];

const organizersSeed = [
  { key: 'vibe', name: 'Vibe Production', contactPerson: 'Артём Смирнов', phone: '+7 495 111-22-33' },
  { key: 'soundlab', name: 'Sound Lab', contactPerson: 'Ольга Крылова', phone: '+7 812 222-33-44' },
  { key: 'theatre', name: 'Театральный дом', contactPerson: 'Ирина Волкова', phone: '+7 495 333-44-55' },
  { key: 'artspace', name: 'ArtSpace', contactPerson: 'Дмитрий Лебедев', phone: '+7 343 444-55-66' },
  { key: 'standup', name: 'StandUp Club', contactPerson: 'Павел Гусев', phone: '+7 383 555-66-77' },
];

const placesSeed = [
  { key: 'cosmonaut', city: 'Москва', name: 'Клуб «Космонавт»', address: 'ул. Космонавтов, 12', capacity: 1200 },
  { key: 'vostok', city: 'Москва', name: 'Дом культуры «Восток»', address: 'ул. Восточная, 4', capacity: 450 },
  { key: 'sovremennik', city: 'Москва', name: 'Театр «Современник»', address: 'Чистопрудный бульвар, 19', capacity: 800 },
  { key: 'lofthall', city: 'Москва', name: 'Loft Hall', address: 'Нижняя Сыромятническая, 10', capacity: 600 },
  { key: 'avrora', city: 'Санкт-Петербург', name: 'Концертный зал «Аврора»', address: 'Невский проспект, 60', capacity: 1500 },
  { key: 'sevkabel', city: 'Санкт-Петербург', name: 'Клуб «Севкабель»', address: 'Кожевенная линия, 40', capacity: 900 },
  { key: 'smena', city: 'Казань', name: 'Центр «Смена»', address: 'ул. Бурхана Шахиди, 7', capacity: 250 },
  { key: 'yeltsin', city: 'Екатеринбург', name: 'Ельцин Центр', address: 'ул. Бориса Ельцина, 3', capacity: 350 },
  { key: 'podzemka', city: 'Новосибирск', name: 'Клуб «Подземка»', address: 'ул. Ленина, 20', capacity: 300 },
  { key: 'fabrika', city: 'Нижний Новгород', name: 'Арт-пространство «Фабрика»', address: 'ул. Рождественская, 24', capacity: 500 },
];

const tagsSeed = [
  { key: 'music', name: 'Музыка', type: 'music' },
  { key: 'theatre', name: 'Театр', type: 'theatre' },
  { key: 'art', name: 'Выставки', type: 'art' },
  { key: 'comedy', name: 'Стендап', type: 'comedy' },
  { key: 'sport', name: 'Спорт', type: 'sport' },
];

interface SeedEvent {
  name: string;
  organizer: string;
  place: string;
  tag: string;
  category: string;
  days: number;
  time: string;
  price: number;
  description: string;
  image: string;
  status?: EventStatus;
  createdBy?: string;
}

const eventsSeed: SeedEvent[] = [
  {
    name: 'Фестиваль «Городской пульс»',
    organizer: 'vibe',
    place: 'avrora',
    tag: 'music',
    category: 'Концерты',
    days: 5,
    time: '20:00',
    price: 2500,
    description:
      'Большой городской фестиваль на стыке инди, электроники и неоклассики. Три сцены, десять артистов и специальная визуальная программа от петербургских медиахудожников. Приходите заранее — welcome-зона с винилом и кофе открывается за два часа до старта.',
    image: IMAGE('photo-1501386761578-eac5c94b800a'),
  },
  {
    name: 'Ночной синтезаторный сет «Neon Waves»',
    organizer: 'soundlab',
    place: 'sevkabel',
    tag: 'music',
    category: 'Концерты',
    days: 8,
    time: '23:00',
    price: 1800,
    description:
      'Пять часов живого модульного синтеза, ломаных ритмов и световых инсталляций прямо в цехе «Севкабеля». Sound Lab соберёт резидентов лейбла и приглашённых гостей из Москвы. Дресс-код — удобная обувь и хорошее настроение.',
    image: IMAGE('photo-1470229722913-7c0e2dbbafd3'),
  },
  {
    name: 'Стендап-концерт «Без фильтров»',
    organizer: 'standup',
    place: 'lofthall',
    tag: 'comedy',
    category: 'Стендап',
    days: 12,
    time: '19:30',
    price: 1500,
    description:
      'Честный разговор со зрителем без сценария и купюр: новые монологи, импровизация и разбор зрительских историй. В составе — резиденты StandUp Club и специальный гость, имя которого мы раскроем за неделю до концерта.',
    image: IMAGE('photo-1516280440614-37939bbacd81'),
    createdBy: 'anna',
  },
  {
    name: 'Спектакль «Письма к себе»',
    organizer: 'theatre',
    place: 'sovremennik',
    tag: 'theatre',
    category: 'Театр',
    days: 15,
    time: '19:00',
    price: 2200,
    description:
      'Камерная постановка о памяти, письмах и людях, которых мы оставляем в прошлом. Режиссёр соединяет документальные тексты и пластический театр, а сценография строится вокруг настоящих архивных ящиков.',
    image: IMAGE('photo-1507924538820-ede94a04019d'),
  },
  {
    name: 'Выставка «Город будущего»',
    organizer: 'artspace',
    place: 'yeltsin',
    tag: 'art',
    category: 'Выставки',
    days: 20,
    time: '12:00',
    price: 700,
    description:
      'Экспозиция о том, каким станет город через двадцать лет: интерактивные макеты, генеративная архитектура и проекты молодых урбанистов. Каждый зал — отдельный сценарий жизни мегаполиса.',
    image: IMAGE('photo-1531058020387-3be344556be6'),
  },
  {
    name: 'Квартирник «Тихие песни»',
    organizer: 'vibe',
    place: 'podzemka',
    tag: 'music',
    category: 'Концерты',
    days: 22,
    time: '20:30',
    price: 900,
    description:
      'Акустический вечер в формате «на расстоянии вытянутой руки»: гитара, фортепиано и новые песни, которые ещё не звучали на больших сценах. Количество мест ограничено, поэтому билеты быстро заканчиваются.',
    image: IMAGE('photo-1514525253161-7a46d19cd819'),
    createdBy: 'anna',
  },
  {
    name: 'Турнир по настольному теннису «Vibe Cup»',
    organizer: 'vibe',
    place: 'fabrika',
    tag: 'sport',
    category: 'Спорт',
    days: 28,
    time: '11:00',
    price: 600,
    description:
      'Любительский турнир для всех, кто держал ракетку хотя бы раз в жизни. Формат — швейцарская система, восемь столов и отдельная зона для болельщиков. Победители получают сезонные абонементы и мерч VibeCity.',
    image: IMAGE('photo-1554068865-24cecd4e34b8'),
  },
  {
    name: 'Иммерсивный спектакль «Сны Достоевского»',
    organizer: 'theatre',
    place: 'sevkabel',
    tag: 'theatre',
    category: 'Театр',
    days: 32,
    time: '19:30',
    price: 2800,
    description:
      'Полное погружение в петербургский текст: зрители перемещаются по лабиринту комнат вместе с актёрами. Каждый сеанс уникален — маршрут зависит от выбранных вами дверей.',
    image: IMAGE('photo-1503095396549-807759245b35'),
  },
  {
    name: 'Лекция «Архитектура и музыка»',
    organizer: 'artspace',
    place: 'smena',
    tag: 'art',
    category: 'Лекции',
    days: 35,
    time: '18:30',
    price: 500,
    description:
      'Как пространство влияет на звук, а музыка — на форму зданий. Лекция с живыми музыкальными примерами и разбором знаковых концертных залов XX века.',
    image: IMAGE('photo-1577083552431-6e5fd01aa342'),
  },
  {
    name: 'Стендап «Открытый микрофон»',
    organizer: 'standup',
    place: 'cosmonaut',
    tag: 'comedy',
    category: 'Стендап',
    days: 38,
    time: '20:00',
    price: 800,
    description:
      'Новые лица, первые шутки и проверка материала на зрителях. Если вы давно хотели выйти на сцену — это ваш шанс: заявки принимаются за час до начала.',
    image: IMAGE('photo-1543007630-9710e4a00a20'),
    createdBy: 'anna',
  },
  {
    name: 'Концерт «Симфония кино»',
    organizer: 'vibe',
    place: 'avrora',
    tag: 'music',
    category: 'Концерты',
    days: 42,
    time: '19:00',
    price: 2200,
    description:
      'Симфонический оркестр исполняет саундтреки к фильмам, которые мы пересматриваем каждый год. Музыка Ханса Циммера, Эннио Морриконе и Джо Хисаиси в сопровождении кинохроники.',
    image: IMAGE('photo-1465847899084-d164df4dedc6'),
  },
  {
    name: 'Выставка «Цифровое искусство»',
    organizer: 'artspace',
    place: 'vostok',
    tag: 'art',
    category: 'Выставки',
    days: 47,
    time: '13:00',
    price: 900,
    description:
      'Генеративная графика, нейросетевые инсталляции и аудиовизуальные перформансы. Выставка отвечает на вопрос, может ли алгоритм быть соавтором художника.',
    image: IMAGE('photo-1547891654-e66ed7ebb968'),
  },
  {
    name: 'Матч «Ночная лига. Финал»',
    organizer: 'vibe',
    place: 'fabrika',
    tag: 'sport',
    category: 'Спорт',
    days: 50,
    time: '21:00',
    price: 1200,
    description:
      'Финальная игра любительской баскетбольной лиги под открытым небом. DJ-сет, фуд-корт и конкурсы для болельщиков между четвертями. Приходите с командой — будет громко.',
    image: IMAGE('photo-1546519638-68e109498ffc'),
  },
  {
    name: 'Спектакль «Три сестры. Реверсия»',
    organizer: 'theatre',
    place: 'sovremennik',
    tag: 'theatre',
    category: 'Театр',
    days: 55,
    time: '19:00',
    price: 2400,
    description:
      'Современное прочтение чеховского текста: вместо усадьбы — стеклянный офис, вместо самовара — корпоративная кухня. Спектакль о том, как мечта о другом городе передаётся по наследству.',
    image: IMAGE('photo-1514306191717-452ec28c7814'),
  },
  {
    name: 'Стендап-фестиваль «Vibe Comedy Night»',
    organizer: 'standup',
    place: 'lofthall',
    tag: 'comedy',
    category: 'Стендап',
    days: 60,
    time: '19:00',
    price: 1900,
    description:
      'Четыре часа смеха, шесть комиков и один ведущий. Фестиваль объединяет разные школы стендапа — от классического монолога до музыкальной импровизации.',
    image: IMAGE('photo-1527224857830-43a7acc85260'),
    status: 'PENDING',
  },
];

const giftsSeed = [
  {
    key: 'merch',
    name: 'Скидка на мерч',
    description: 'Скидка на любую позицию в мерч-магазине VibeCity.',
    type: 'Скидка',
    status: 'AVAILABLE' as const,
  },
  {
    key: 'closed',
    name: 'Приглашение на закрытый квартирник',
    description: 'Приглашение на закрытое выступление для друзей VibeCity.',
    type: 'Приглашение',
    status: 'RESERVED' as const,
  },
  {
    key: 'coffee',
    name: 'Кофе в баре Vibe',
    description: 'Бесплатный кофе в баре на любом мероприятии VibeCity.',
    type: 'Напиток',
    status: 'AVAILABLE' as const,
  },
];

const promocodesSeed: Array<{
  key: string;
  gift: string;
  code: string;
  status: PromocodeStatus;
  discount: number;
}> = [
  { key: 'vibe10', gift: 'merch', code: 'VIBE10', status: 'ACTIVE', discount: 10 },
  { key: 'welcome15', gift: 'merch', code: 'WELCOME15', status: 'ACTIVE', discount: 15 },
  { key: 'neon20', gift: 'merch', code: 'NEON20', status: 'ACTIVE', discount: 20 },
  { key: 'gift50', gift: 'coffee', code: 'GIFT50', status: 'ACTIVE', discount: 50 },
  { key: 'usedcode', gift: 'closed', code: 'USEDCODE', status: 'USED', discount: 25 },
  { key: 'expired', gift: 'merch', code: 'EXPIRED24', status: 'EXPIRED', discount: 10 },
];

const reviewsSeed = [
  { user: 'anna', event: 1, rating: 5, text: 'Атмосфера просто космос: свет, звук и публика сложились в идеальный вечер. Обязательно вернусь.' },
  { user: 'mikhail', event: 1, rating: 4, text: 'Музыка отличная, но на входе пришлось постоять около двадцати минут.' },
  { user: 'elena', event: 2, rating: 5, text: 'Пять часов пролетели незаметно. Визуал в цехе — отдельный вид искусства.' },
  { user: 'anna', event: 3, rating: 5, text: 'Смеялась до слёз, особенно с импровизации про московское метро.' },
  { user: 'mikhail', event: 4, rating: 4, text: 'Очень тонкая работа с текстом. Пластические сцены понравились больше всего.' },
  { user: 'elena', event: 5, rating: 5, text: 'Выставка заставляет задуматься. Интерактивный макет города — вау-эффект.' },
];

const main = async () => {
  const force = process.argv.includes('--force') || process.env.SEED_FORCE === '1';
  const userCount = await prisma.user.count();

  if (userCount > 0 && !force) {
    // eslint-disable-next-line no-console
    console.log(`[seed] В базе уже ${userCount} пользователей — пропускаем наполнение (--force для перезаписи).`);
    return;
  }

  if (force) {
    // eslint-disable-next-line no-console
    console.log('[seed] Очищаем таблицы перед повторным наполнением...');
    await prisma.ticket.deleteMany();
    await prisma.review.deleteMany();
    await prisma.promocode.deleteMany();
    await prisma.gift.deleteMany();
    await prisma.event.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.place.deleteMany();
    await prisma.organizer.deleteMany();
    await prisma.user.deleteMany();

    // Сбрасываем AUTO_INCREMENT, чтобы демо-данные всегда имели предсказуемые ID.
    for (const table of [
      'Ticket',
      'Review',
      'Promocode',
      'Gift',
      'Event',
      'Tag',
      'Place',
      'Organizer',
      'User',
    ]) {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` AUTO_INCREMENT = 1`);
    }
  }

  const userMap = new Map<string, number>();
  for (const user of usersSeed) {
    const created = await prisma.user.create({
      data: {
        lastName: user.lastName,
        firstName: user.firstName,
        patronymic: user.patronymic,
        phone: user.phone,
        email: user.email,
        password: await bcrypt.hash(user.password, 10),
        role: user.role,
      },
    });
    userMap.set(user.key, created.id);
  }

  const organizerMap = new Map<string, number>();
  for (const organizer of organizersSeed) {
    const created = await prisma.organizer.create({
      data: {
        name: organizer.name,
        contactPerson: organizer.contactPerson,
        phone: organizer.phone,
      },
    });
    organizerMap.set(organizer.key, created.id);
  }

  const placeMap = new Map<string, number>();
  for (const place of placesSeed) {
    const created = await prisma.place.create({
      data: {
        city: place.city,
        name: place.name,
        address: place.address,
        capacity: place.capacity,
      },
    });
    placeMap.set(place.key, created.id);
  }

  const tagMap = new Map<string, number>();
  for (const tag of tagsSeed) {
    const created = await prisma.tag.create({ data: { name: tag.name, type: tag.type } });
    tagMap.set(tag.key, created.id);
  }

  const eventMap = new Map<number, number>();
  for (const [index, event] of eventsSeed.entries()) {
    const created = await prisma.event.create({
      data: {
        name: event.name,
        organizerId: organizerMap.get(event.organizer)!,
        placeId: placeMap.get(event.place)!,
        tagId: tagMap.get(event.tag)!,
        createdById: userMap.get(event.createdBy ?? 'admin')!,
        date: daysFromNow(event.days),
        time: event.time,
        description: event.description,
        category: event.category,
        imageUrl: event.image,
        price: event.price,
        status: event.status ?? 'APPROVED',
      },
    });
    eventMap.set(index + 1, created.id);
  }

  const giftMap = new Map<string, number>();
  for (const gift of giftsSeed) {
    const created = await prisma.gift.create({
      data: {
        name: gift.name,
        description: gift.description,
        type: gift.type,
        status: gift.status,
      },
    });
    giftMap.set(gift.key, created.id);
  }

  const promoMap = new Map<string, number>();
  for (const promo of promocodesSeed) {
    const created = await prisma.promocode.create({
      data: {
        giftId: giftMap.get(promo.gift)!,
        code: promo.code,
        status: promo.status,
        discount: promo.discount,
      },
    });
    promoMap.set(promo.key, created.id);
  }

  for (const review of reviewsSeed) {
    await prisma.review.create({
      data: {
        userId: userMap.get(review.user)!,
        eventId: eventMap.get(review.event)!,
        rating: review.rating,
        text: review.text,
      },
    });
  }

  const ticketsSeed = [
    { user: 'anna', event: 1, seat: 12, promo: null },
    { user: 'anna', event: 1, seat: 13, promo: null },
    { user: 'anna', event: 3, seat: 5, promo: 'usedcode' },
    { user: 'anna', event: 4, seat: 7, promo: null },
    { user: 'mikhail', event: 1, seat: 20, promo: null },
    { user: 'mikhail', event: 3, seat: 8, promo: null },
    { user: 'elena', event: 2, seat: 3, promo: null },
  ];

  for (const ticket of ticketsSeed) {
    const event = eventsSeed[ticket.event - 1];
    const promo = ticket.promo ? promocodesSeed.find((item) => item.key === ticket.promo) : null;
    const price = promo ? Math.round(event.price * (1 - promo.discount / 100)) : event.price;

    await prisma.ticket.create({
      data: {
        userId: userMap.get(ticket.user)!,
        eventId: eventMap.get(ticket.event)!,
        promoId: promo ? promoMap.get(promo.key)! : null,
        seatNumber: ticket.seat,
        price,
        status: 'ACTIVE',
        qrCode: crypto.randomUUID(),
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `[seed] Готово: ${usersSeed.length} пользователей, ${organizersSeed.length} организаторов, ` +
      `${placesSeed.length} мест, ${tagsSeed.length} тегов, ${eventsSeed.length} мероприятий, ` +
      `${promocodesSeed.length} промокодов, ${reviewsSeed.length} отзывов, ${ticketsSeed.length} билетов.`,
  );
  // eslint-disable-next-line no-console
  console.log('[seed] Админ: admin@vibecity.ru / admin · Пользователь: user@vibecity.ru / user123');
};

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('[seed] Ошибка наполнения базы:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
