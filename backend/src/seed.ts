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
    phone: '+375 29 111-11-11',
    email: 'admin@vibecity.by',
    password: 'admin',
    role: 'ADMIN' as const,
  },
  {
    key: 'anna',
    lastName: 'Иванова',
    firstName: 'Анна',
    patronymic: 'Сергеевна',
    phone: '+375 29 222-22-22',
    email: 'user@vibecity.by',
    password: 'user123',
    role: 'ORGANIZER' as const,
  },
  {
    key: 'mikhail',
    lastName: 'Соколов',
    firstName: 'Михаил',
    patronymic: 'Андреевич',
    phone: '+375 33 333-33-33',
    email: 'mikhail@vibecity.by',
    password: 'user123',
    role: 'USER' as const,
  },
  {
    key: 'elena',
    lastName: 'Кузнецова',
    firstName: 'Елена',
    patronymic: 'Дмитриевна',
    phone: '+375 44 444-44-44',
    email: 'elena@vibecity.by',
    password: 'user123',
    role: 'USER' as const,
  },
];

const organizersSeed = [
  { key: 'vibe', name: 'Vibe Production', contactPerson: 'Андрей Ковалёв', phone: '+375 29 111-22-33' },
  { key: 'soundlab', name: 'Sound Lab', contactPerson: 'Ольга Крылова', phone: '+375 33 222-33-44' },
  { key: 'theatre', name: 'Театральный дом', contactPerson: 'Ирина Волкова', phone: '+375 44 333-44-55' },
  { key: 'artspace', name: 'ArtSpace', contactPerson: 'Дмитрий Лебедев', phone: '+375 29 444-55-66' },
  { key: 'standup', name: 'StandUp Club', contactPerson: 'Павел Гусев', phone: '+375 25 555-66-77' },
];

const placesSeed = [
  { key: 'republic', city: 'Минск', name: 'Клуб «Re:Public»', address: 'ул. Октябрьская, 16', capacity: 700 },
  { key: 'primehall', city: 'Минск', name: 'Prime Hall', address: 'пр-т Победителей, 20', capacity: 1200 },
  { key: 'kupala', city: 'Минск', name: 'Театр имени Янки Купалы', address: 'ул. Энгельса, 7', capacity: 500 },
  { key: 'gomelokc', city: 'Гомель', name: 'Общественно-культурный центр', address: 'ул. Ланге, 17', capacity: 800 },
  { key: 'secretroom', city: 'Гомель', name: 'Клуб «Secret Room»', address: 'ул. Советская, 25', capacity: 300 },
  { key: 'brestokc', city: 'Брест', name: 'Областной общественно-культурный центр', address: 'ул. Советская, 8', capacity: 600 },
  { key: 'bresthall', city: 'Брест', name: 'Концертный зал «Проспект»', address: 'пр-т Машерова, 33', capacity: 250 },
  { key: 'vitebskphil', city: 'Витебск', name: 'Областная филармония', address: 'ул. Ленина, 30', capacity: 450 },
  { key: 'grodnodrama', city: 'Гродно', name: 'Областной драматический театр', address: 'ул. Мостовая, 35', capacity: 400 },
  { key: 'mogilevsport', city: 'Могилёв', name: 'Спортивный комплекс «Олимпиец»', address: 'ул. Крупской, 19', capacity: 500 },
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
    place: 'primehall',
    tag: 'music',
    category: 'Концерты',
    days: 5,
    time: '20:00',
    price: 65,
    description:
      'Большой городской фестиваль на стыке инди, электроники и неоклассики. Три сцены, десять артистов и специальная визуальная программа от минских медиахудожников. Приходите заранее — welcome-зона с винилом и кофе открывается за два часа до старта.',
    image: IMAGE('photo-1501386761578-eac5c94b800a'),
  },
  {
    name: 'Ночной синтезаторный сет «Neon Waves»',
    organizer: 'soundlab',
    place: 'republic',
    tag: 'music',
    category: 'Концерты',
    days: 8,
    time: '23:00',
    price: 45,
    description:
      'Пять часов живого модульного синтеза, ломаных ритмов и световых инсталляций на большой сцене Re:Public. Sound Lab соберёт резидентов лейбла и приглашённых гостей из Минска и Вильнюса. Дресс-код — удобная обувь и хорошее настроение.',
    image: IMAGE('photo-1470229722913-7c0e2dbbafd3'),
  },
  {
    name: 'Стендап-концерт «Без фильтров»',
    organizer: 'standup',
    place: 'secretroom',
    tag: 'comedy',
    category: 'Стендап',
    days: 12,
    time: '19:30',
    price: 35,
    description:
      'Честный разговор со зрителем без сценария и купюр: новые монологи, импровизация и разбор зрительских историй. В составе — резиденты StandUp Club и специальный гость, имя которого мы раскроем за неделю до концерта.',
    image: IMAGE('photo-1516280440614-37939bbacd81'),
    createdBy: 'anna',
  },
  {
    name: 'Спектакль «Письма к себе»',
    organizer: 'theatre',
    place: 'kupala',
    tag: 'theatre',
    category: 'Театр',
    days: 15,
    time: '19:00',
    price: 50,
    description:
      'Камерная постановка о памяти, письмах и людях, которых мы оставляем в прошлом. Режиссёр соединяет документальные тексты и пластический театр, а сценография строится вокруг настоящих архивных ящиков.',
    image: IMAGE('photo-1507924538820-ede94a04019d'),
  },
  {
    name: 'Выставка «Город будущего»',
    organizer: 'artspace',
    place: 'brestokc',
    tag: 'art',
    category: 'Выставки',
    days: 20,
    time: '12:00',
    price: 18,
    description:
      'Экспозиция о том, каким станет город через двадцать лет: интерактивные макеты, генеративная архитектура и проекты молодых урбанистов. Каждый зал — отдельный сценарий жизни белорусского города.',
    image: IMAGE('photo-1531058020387-3be344556be6'),
  },
  {
    name: 'Квартирник «Тихие песни»',
    organizer: 'vibe',
    place: 'grodnodrama',
    tag: 'music',
    category: 'Концерты',
    days: 22,
    time: '20:30',
    price: 25,
    description:
      'Акустический вечер в формате «на расстоянии вытянутой руки»: гитара, фортепиано и новые песни, которые ещё не звучали на больших сценах. Количество мест ограничено, поэтому билеты быстро заканчиваются.',
    image: IMAGE('photo-1514525253161-7a46d19cd819'),
    createdBy: 'anna',
  },
  {
    name: 'Турнир по настольному теннису «Vibe Cup»',
    organizer: 'vibe',
    place: 'mogilevsport',
    tag: 'sport',
    category: 'Спорт',
    days: 28,
    time: '11:00',
    price: 15,
    description:
      'Любительский турнир для всех, кто держал ракетку хотя бы раз в жизни. Формат — швейцарская система, восемь столов и отдельная зона для болельщиков. Победители получают сезонные абонементы и мерч VibeCity.',
    image: IMAGE('photo-1554068865-24cecd4e34b8'),
  },
  {
    name: 'Иммерсивный спектакль «Сны Достоевского»',
    organizer: 'theatre',
    place: 'brestokc',
    tag: 'theatre',
    category: 'Театр',
    days: 32,
    time: '19:30',
    price: 70,
    description:
      'Полное погружение в мир Достоевского: зрители перемещаются по лабиринту комнат вместе с актёрами. Каждый сеанс уникален — маршрут зависит от выбранных вами дверей.',
    image: IMAGE('photo-1503095396549-807759245b35'),
  },
  {
    name: 'Лекция «Архитектура и музыка»',
    organizer: 'artspace',
    place: 'bresthall',
    tag: 'art',
    category: 'Лекции',
    days: 35,
    time: '18:30',
    price: 12,
    description:
      'Как пространство влияет на звук, а музыка — на форму зданий. Лекция с живыми музыкальными примерами и разбором знаковых концертных залов XX века.',
    image: IMAGE('photo-1577083552431-6e5fd01aa342'),
  },
  {
    name: 'Стендап «Открытый микрофон»',
    organizer: 'standup',
    place: 'gomelokc',
    tag: 'comedy',
    category: 'Стендап',
    days: 38,
    time: '20:00',
    price: 20,
    description:
      'Новые лица, первые шутки и проверка материала на зрителях. Если вы давно хотели выйти на сцену — это ваш шанс: заявки принимаются за час до начала.',
    image: IMAGE('photo-1543007630-9710e4a00a20'),
    createdBy: 'anna',
  },
  {
    name: 'Концерт «Симфония кино»',
    organizer: 'vibe',
    place: 'vitebskphil',
    tag: 'music',
    category: 'Концерты',
    days: 42,
    time: '19:00',
    price: 55,
    description:
      'Симфонический оркестр исполняет саундтреки к фильмам, которые мы пересматриваем каждый год. Музыка Ханса Циммера, Эннио Морриконе и Джо Хисаиси в сопровождении кинохроники.',
    image: IMAGE('photo-1465847899084-d164df4dedc6'),
  },
  {
    name: 'Выставка «Цифровое искусство»',
    organizer: 'artspace',
    place: 'gomelokc',
    tag: 'art',
    category: 'Выставки',
    days: 47,
    time: '13:00',
    price: 22,
    description:
      'Генеративная графика, нейросетевые инсталляции и аудиовизуальные перформансы. Выставка отвечает на вопрос, может ли алгоритм быть соавтором художника.',
    image: IMAGE('photo-1547891654-e66ed7ebb968'),
  },
  {
    name: 'Матч «Ночная лига. Финал»',
    organizer: 'vibe',
    place: 'mogilevsport',
    tag: 'sport',
    category: 'Спорт',
    days: 50,
    time: '21:00',
    price: 30,
    description:
      'Финальная игра любительской баскетбольной лиги под открытым небом. DJ-сет, фуд-корт и конкурсы для болельщиков между четвертями. Приходите с командой — будет громко.',
    image: IMAGE('photo-1546519638-68e109498ffc'),
  },
  {
    name: 'Спектакль «Три сестры. Реверсия»',
    organizer: 'theatre',
    place: 'kupala',
    tag: 'theatre',
    category: 'Театр',
    days: 55,
    time: '19:00',
    price: 60,
    description:
      'Современное прочтение чеховского текста: вместо усадьбы — стеклянный офис, вместо самовара — корпоративная кухня. Спектакль о том, как мечта о другом городе передаётся по наследству.',
    image: IMAGE('photo-1514306191717-452ec28c7814'),
  },
  {
    name: 'Стендап-фестиваль «Vibe Comedy Night»',
    organizer: 'standup',
    place: 'primehall',
    tag: 'comedy',
    category: 'Стендап',
    days: 60,
    time: '19:00',
    price: 40,
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
  { user: 'elena', event: 2, rating: 5, text: 'Пять часов пролетели незаметно. Свет и визуал в Re:Public — отдельный вид искусства.' },
  { user: 'anna', event: 3, rating: 5, text: 'Смеялась до слёз, особенно с импровизации про минское метро.' },
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
    { user: 'mikhail', event: 4, seat: 9, promo: null },
    { user: 'elena', event: 2, seat: 3, promo: null },
    { user: 'elena', event: 5, seat: 11, promo: null },
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
  console.log('[seed] Админ: admin@vibecity.by / admin · Организатор: user@vibecity.by / user123 · Пользователь: mikhail@vibecity.by / user123');
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
