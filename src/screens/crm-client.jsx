/* ============================================================================
   EastSide — CRM: детальная карточка клиента
   (window.EScreens.CrmClient · route #/crm/client)
   ----------------------------------------------------------------------------
   Командный экран. Единый источник правды по клиенту: куратор/продавец видят
   всю картину в одном месте. Командный шелл (свой рейл с секциями команды +
   топбар, широкий контейнер). Плотно, профессионально — не дженерик-админка.

   Что внутри: шапка (ученик+класс, родитель+контакты, трек, теги, источник/UTM,
   статус воронки, кто отвечает за следующий шаг). Дальше табы: заявка ·
   заключение · дорожная карта · документы (внутренняя кухня видна команде) ·
   продукты и оплаты · занятия · коммуникации · комментарии команды · риски.

   Собран ТОЛЬКО из компонентов window.EUI и токенов (никакого хардкода цвета/
   размера/тени — только var(--token) и утилиты styles.css). Данные — локальный
   mock в этом файле; общий стор подключит wiring-агент.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const {
    Sidebar, Topbar, Card, Button, Badge, Pill, Avatar, AvatarGroup, Alert,
    Tabs, Table, Milestones, ProgressBar, Stat, EmptyState, Drawer, Input,
    IconButton, Tooltip,
  } = U;

  const rub = (n) => (n == null ? '—' : Number(n).toLocaleString('ru-RU') + ' ₽');

  // --- Карта статусов и ролей (язык команды одинаков по всему экрану) --------
  const ROLE_LABEL = {
    curator: 'Куратор', sales: 'Продавец', teacher: 'Преподаватель',
    finance: 'Финансы', admin: 'Администратор', client: 'Клиент', team: 'Команда',
  };
  const STAGE_TONE = {
    'не_начато': 'neutral', 'в_работе': 'info', 'ожидает_клиента': 'warning',
    'ожидает_команды': 'info', 'на_проверке': 'info', 'завершено': 'success',
    'просрочено': 'danger', 'риск': 'danger',
  };
  const STAGE_LABEL = {
    'не_начато': 'Не начато', 'в_работе': 'В работе', 'ожидает_клиента': 'Ждем клиента',
    'ожидает_команды': 'Ждем команду', 'на_проверке': 'На проверке',
    'завершено': 'Завершено', 'просрочено': 'Просрочено', 'риск': 'Риск',
  };
  const DOC_TONE = {
    'ожидается': 'neutral', 'загружен': 'info', 'на_проверке': 'info',
    'нужно_перевести': 'warning', 'нужно_заверить': 'warning',
    'нужно_исправить': 'danger', 'подан': 'success', 'принят': 'success',
  };
  const DOC_LABEL = {
    'ожидается': 'Ожидается', 'загружен': 'Загружен', 'на_проверке': 'На проверке',
    'нужно_перевести': 'Нужно перевести', 'нужно_заверить': 'Нужно заверить',
    'нужно_исправить': 'Нужно исправить', 'подан': 'Подан', 'принят': 'Принят',
  };
  const DEAL_LABEL = {
    'новый': 'Новый', 'квалификация': 'Квалификация', 'диагностика': 'Диагностика',
    'разбор_назначен': 'Разбор назначен', 'разбор_проведен': 'Разбор проведен',
    'предложение': 'Предложение', 'оплата': 'Оплата', 'выигран': 'Выигран', 'проигран': 'Проигран',
  };
  const DEAL_ORDER = ['новый', 'квалификация', 'диагностика', 'разбор_назначен',
    'разбор_проведен', 'предложение', 'оплата', 'выигран'];
  const CHANNEL = {
    telegram: { icon: Ic.Telegram, label: 'Telegram' },
    vk: { icon: Ic.Globe, label: 'ВКонтакте' },
    chat: { icon: Ic.Chat, label: 'Чат кабинета' },
    email: { icon: Ic.Mail, label: 'Email' },
  };

  // ======================================================================
  //  Локальный mock (заменяется стором wiring-агентом)
  // ======================================================================
  const CLIENT = {
    id: 'cl_2049',
    student: { name: 'Дима Соколов', grade: '10 класс', age: 16, city: 'Казань', avatar: null,
      track: 'guided', readiness: 'Средняя', direction: 'Инженерия, бакалавриат' },
    parent: { name: 'Марина Соколова', relation: 'Мама, плательщик',
      phone: '+7 917 240-18-06', tg: '@m_sokolova', email: 'm.sokolova@mail.ru' },
    tags: ['HSK 3', 'Английский B1', 'Грант CSC', 'Дедлайн близко'],
    source: { channel: 'Telegram-бот', utm: 'tg / autumn_intake / hsk-test',
      ref: 'Партнер: Лингва-центр', firstTouch: '12 сен 2025' },
    deal: { stage: 'предложение', amount: 285000, tier: 'Сопровождение — Стандарт',
      owner: 'Алексей Рогов', ownerRole: 'sales' },
    nextStep: { who: 'Алексей Рогов', role: 'sales',
      action: 'Выставить счет по тарифу «Стандарт» и проводить до оплаты',
      due: '8 июн', overdue: false },
    curators: [
      { name: 'Алексей Рогов', role: 'sales', online: true },
      { name: 'Оля Денисова', role: 'curator', online: true },
    ],
  };

  const ANKETA = [
    { q: 'Класс / возраст', a: '10 класс, 16 лет' },
    { q: 'Город', a: 'Казань' },
    { q: 'Страна и направление', a: 'Китай · инженерия, бакалавриат' },
    { q: 'Уровень китайского', a: 'HSK 3 (есть сертификат)' },
    { q: 'Уровень английского', a: 'B1, IELTS не сдавал' },
    { q: 'Средний балл аттестата', a: '4.6 из 5' },
    { q: 'Достижения', a: 'Призер региональной олимпиады по физике' },
    { q: 'Когда планирует поступать', a: 'Осень 2026' },
    { q: 'Бюджет на обучение', a: 'Рассчитывает на полный или частичный грант' },
    { q: 'Как узнал о нас', a: 'Реклама в Telegram, прошел тест уровня языка' },
  ];

  const ASSESSMENT = {
    chanceLevel: 'Высокие при подготовке HSK',
    chancePct: 68,
    summary: 'Сильный профиль по физике и баллу, язык — главная зона роста. ' +
      'При выходе на HSK 4 к подаче реально претендовать на полный грант CSC в вузах второй линии.',
    pointA: 'HSK 3, английский B1, олимпиадник по физике',
    pointB: 'Полный грант CSC, инженерный бакалавриат, осень 2026',
    strengths: ['Балл аттестата 4.6', 'Призер олимпиады по физике', 'Раннее начало подготовки'],
    growth: ['Подтянуть китайский до HSK 4', 'Сдать IELTS на 5.5+', 'Собрать мотивационное письмо'],
    universities: [
      { name: 'Харбинский политех', cn: '哈尔滨工业大学', city: 'Харбин', cat: 'match', chance: 64, grant: 'CSC полный' },
      { name: 'Далянь технологич.', cn: '大连理工大学', city: 'Далянь', cat: 'safety', chance: 78, grant: 'Провинц.' },
      { name: 'Чжэцзянский ун-т', cn: '浙江大学', city: 'Ханчжоу', cat: 'reach', chance: 41, grant: 'CSC частичн.' },
    ],
  };

  const ROADMAP = [
    { id: 'm1', title: 'Стратегия и подбор вузов', period: 'Сен — окт 2025', status: 'done',
      summary: 'Профиль разобран, шорт-лист из 6 вузов согласован с семьей.', owner: 'Куратор',
      tasks: [{ title: 'Диагностика проведена', status: 'done' }, { title: 'Шорт-лист утвержден', status: 'done' }] },
    { id: 'm2', title: 'Язык и экзамены', period: 'Ноя 2025 — мар 2026', status: 'current',
      summary: 'Идет подготовка к HSK 4, параллельно IELTS. Дедлайн регистрации на HSK — близко.',
      owner: 'Преподаватель',
      tasks: [{ title: 'HSK 3 закрыт', status: 'done' }, { title: 'Подготовка к HSK 4', status: 'in_review' }, { title: 'Регистрация на IELTS', status: 'upcoming' }] },
    { id: 'm3', title: 'Документы и подача', period: 'Апр — июн 2026', status: 'upcoming',
      summary: 'Сбор пакета, переводы, нотариус, подача в вузы и на грант CSC.', owner: 'Куратор',
      tasks: [{ title: 'Пакет документов', status: 'upcoming' }, { title: 'Подача на грант CSC', status: 'upcoming' }] },
    { id: 'm4', title: 'Зачисление и виза', period: 'Июл — сен 2026', status: 'upcoming',
      summary: 'Получение приглашения, оформление визы X1, подготовка к выезду.', owner: 'Куратор',
      tasks: [{ title: 'Письмо о зачислении', status: 'upcoming' }, { title: 'Виза X1', status: 'upcoming' }] },
  ];

  // Документы — ВНУТРЕННЯЯ КУХНЯ видна команде (visibility='internal' тоже)
  const DOCUMENTS = [
    { id: 'd1', name: 'Загранпаспорт', status: 'принят', owner: 'curator', visibility: 'client', updated: '2 окт', note: 'Срок до 2029' },
    { id: 'd2', name: 'Аттестат (скан)', status: 'на_проверке', owner: 'curator', visibility: 'client', updated: '5 дн назад', note: 'Проверяем читаемость печати' },
    { id: 'd3', name: 'Аттестат — перевод на кит.', status: 'нужно_перевести', owner: 'curator', visibility: 'internal', updated: '5 дн назад', note: 'Передать переводчику' },
    { id: 'd4', name: 'Сертификат HSK 3', status: 'принят', owner: 'curator', visibility: 'client', updated: '12 сен', note: '' },
    { id: 'd5', name: 'Мед. справка 008', status: 'нужно_заверить', owner: 'curator', visibility: 'internal', updated: '3 дн назад', note: 'Нотариус, ждем запись' },
    { id: 'd6', name: 'Мотивационное письмо', status: 'нужно_исправить', owner: 'curator', visibility: 'client', updated: 'вчера', note: 'Слабая концовка, дали правки' },
    { id: 'd7', name: 'Форма CSC (онлайн)', status: 'ожидается', owner: 'curator', visibility: 'internal', updated: '—', note: 'Откроется после пакета' },
  ];

  const PAYMENTS = [
    { id: 'p1', date: '14 сен 2025', what: 'Диагностика', amount: 990, status: 'оплачен', receipt: true },
    { id: 'p2', date: '2 окт 2025', what: 'Сопровождение — Стандарт, 1-й транш', amount: 95000, status: 'оплачен', receipt: true },
    { id: 'p3', date: '8 июн 2026', what: 'Сопровождение — Стандарт, 2-й транш', amount: 95000, status: 'ожидает_оплаты', receipt: false },
  ];
  const BILLING = { tier: 'Сопровождение — Стандарт', total: 285000, paid: 95990, lessonsLeft: 22, lessonsTotal: 40 };

  const LESSONS = [
    { id: 'l1', date: '6 июн, 18:00', topic: 'HSK 4 — грамматика 把-конструкции', teacher: 'Ли Вэй', status: 'запланирован' },
    { id: 'l2', date: '3 июн', topic: 'HSK 4 — аудирование, блок 3', teacher: 'Ли Вэй', status: 'проведен', mark: 'хорошо' },
    { id: 'l3', date: '30 мая', topic: 'IELTS — Writing Task 1', teacher: 'Анна Кей', status: 'проведен', mark: 'отлично' },
    { id: 'l4', date: '27 мая', topic: 'HSK 4 — лексика, тема «образование»', teacher: 'Ли Вэй', status: 'пропущен', mark: '' },
  ];

  const TIMELINE = [
    { id: 't1', channel: 'telegram', author: 'Дима', dir: 'in', when: 'Сегодня, 11:42', text: 'А когда ближайший дедлайн на HSK? Хочу успеть зарегистрироваться.' },
    { id: 't2', channel: 'telegram', author: 'Бот EastSide', dir: 'out', mode: 'support', when: 'Сегодня, 11:42', text: 'Регистрация на HSK 4 закрывается через 14 дней. Передаю куратору, чтобы помог с записью.' },
    { id: 't3', channel: 'chat', author: 'Оля Денисова', dir: 'out', mode: 'human', when: 'Сегодня, 12:10', text: 'Дима, привет! Записал тебя в очередь на регистрацию, нужен скан паспорта — загрузи в кабинет.' },
    { id: 't4', channel: 'vk', author: 'Марина (мама)', dir: 'in', when: 'Вчера, 20:05', text: 'Подскажите, второй транш в июне — можно частями?' },
    { id: 't5', channel: 'email', author: 'Финансы', dir: 'out', mode: 'human', when: '2 окт', text: 'Чек по первому траншу отправлен на m.sokolova@mail.ru.' },
  ];

  const COMMENTS = [
    { id: 'c1', author: 'Алексей Рогов', role: 'sales', when: 'Сегодня, 09:30', pinned: true, text: 'Семья теплая, мама за полный грант. Двигаем к оплате 2-го транша до 8 июня — это блокер для подачи на CSC.' },
    { id: 'c2', author: 'Оля Денисова', role: 'curator', when: 'Вчера', pinned: false, text: 'Дима мотивирован, но проседает по аудированию. Добавила доп. урок с Ли Вэй на неделю.' },
    { id: 'c3', author: 'Ли Вэй', role: 'teacher', when: '3 дн назад', pinned: false, text: 'К HSK 4 идем с запасом по грамматике. Лексику добиваем — дал карточки.' },
  ];

  const RISKS = [
    { id: 'r1', title: 'Перевод аттестата завис у переводчика', severity: 'high', auto: true,
      owner: 'curator', hold: 'Документ «Аттестат — перевод» в статусе «нужно перевести» 5 дней. Тормозит сбор пакета к подаче.',
      due: 'Сдвинуть до 10 июня' },
    { id: 'r2', title: 'Регистрация на HSK 4 закрывается через 14 дней', severity: 'medium', auto: true,
      owner: 'curator', hold: 'Без сдачи HSK 4 шансы на полный грант падают. Нужна запись на ближайшую дату.',
      due: 'Записать на этой неделе' },
    { id: 'r3', title: 'Оплата 2-го транша — блокер подачи', severity: 'medium', auto: false,
      owner: 'sales', hold: 'Подача на CSC стартует после оплаты. Держим коммуникацию с мамой, обсуждаем рассрочку.',
      due: 'Закрыть к 8 июня' },
  ];

  // ======================================================================
  //  Мелкие переиспользуемые куски
  // ======================================================================
  function Field(props) {
    return h('div', { style: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' } },
      h('div', { style: { fontSize: 'var(--fs-2xs)', textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-mute)', fontWeight: 'var(--fw-semibold)' } }, props.label),
      h('div', { className: props.tnum ? 'u-tnum' : null, style: { color: 'var(--ink)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-sm)' } }, props.value));
  }

  function SectionHead(props) {
    return h('div', { className: 'e-card__head' },
      h('h3', { className: 'e-card__title' }, props.title),
      props.action || null);
  }

  function Tag(props) {
    return h(Badge, { tag: true, tone: props.tone || 'neutral' }, props.children);
  }

  // ======================================================================
  //  Контент табов
  // ======================================================================
  function TabAnketa() {
    return h('div', { className: 'u-cols-2', style: { gap: 'var(--sp-3)' } },
      ANKETA.map((row, i) => h('div', { key: i, className: 'u-surface-2', style: { padding: 'var(--sp-3) var(--sp-4)' } },
        h('div', { style: { fontSize: 'var(--fs-2xs)', textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--ink-mute)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--sp-1)' } }, row.q),
        h('div', { style: { color: 'var(--ink)', fontSize: 'var(--fs-sm)' } }, row.a))));
  }

  function TabAssessment() {
    const uniCols = [
      { key: 'name', title: 'Вуз', render: (r) => h('span', null, r.name,
        h('span', { className: 'u-ink-mute', style: { marginLeft: 6, fontSize: 'var(--fs-xs)' } }, r.cn)) },
      { key: 'city', title: 'Город' },
      { key: 'cat', title: 'Категория', render: (r) => h(Pill, { tone: r.cat === 'reach' ? 'warning' : r.cat === 'match' ? 'info' : 'success' },
        r.cat === 'reach' ? 'Топ-10' : r.cat === 'match' ? 'Топ-30' : 'Топ-100') },
      { key: 'chance', title: 'Шанс', num: true, render: (r) => h('span', { className: 'u-critical u-tnum' }, r.chance + '%') },
      { key: 'grant', title: 'Грант' },
    ];
    return h('div', { className: 'u-stack-4' },
      h('div', { className: 'u-cols-3' },
        h(Stat, { label: 'Оценка шансов', value: ASSESSMENT.chancePct, unit: '%', bordered: true, tone: 'jade' }),
        h('div', { className: 'u-surface-2', style: { padding: 'var(--sp-4) var(--sp-5)' } },
          h(Field, { label: 'Точка А', value: ASSESSMENT.pointA })),
        h('div', { className: 'u-surface-2', style: { padding: 'var(--sp-4) var(--sp-5)' } },
          h(Field, { label: 'Точка Б', value: ASSESSMENT.pointB }))),
      h('p', { className: 'u-prose u-soft', style: { fontSize: 'var(--fs-sm)' } }, ASSESSMENT.summary),
      h('div', { className: 'u-cols-2' },
        h('div', { className: 'u-stack-2' },
          h('div', { className: 'es-crm-sub' }, 'Сильные стороны'),
          h('div', { className: 'u-flex u-wrap u-gap-2' }, ASSESSMENT.strengths.map((s, i) => h(Tag, { key: i, tone: 'success' }, s)))),
        h('div', { className: 'u-stack-2' },
          h('div', { className: 'es-crm-sub' }, 'Зоны роста'),
          h('div', { className: 'u-flex u-wrap u-gap-2' }, ASSESSMENT.growth.map((s, i) => h(Tag, { key: i, tone: 'warning' }, s))))),
      h('div', { className: 'u-stack-2' },
        h('div', { className: 'es-crm-sub' }, 'Подбор вузов (из базы знаний)'),
        h(Table, { columns: uniCols, rows: ASSESSMENT.universities, rowKey: 'name', compact: true })),
      h('div', null,
        h(Button, { variant: 'secondary', size: 'sm', iconLeft: Ic.Doc, as: 'a', href: '#/diagnostics' }, 'Полное заключение (11 пунктов)')));
  }

  function TabRoadmap() {
    return h('div', { className: 'u-stack-4' },
      h(Alert, { tone: 'info', title: 'Кто отвечает за следующий шаг',
        action: h(Badge, { tone: 'neutral' }, ROLE_LABEL[CLIENT.nextStep.role]) },
        CLIENT.nextStep.action + ' — до ' + CLIENT.nextStep.due),
      h(Milestones, { items: ROADMAP }));
  }

  function TabDocuments() {
    const cols = [
      { key: 'name', title: 'Документ', render: (r) => h('span', null, r.name,
        r.visibility === 'internal'
          ? h('span', { style: { marginLeft: 8, verticalAlign: 'middle' } }, h(Badge, { tone: 'neutral', icon: Ic.Lock }, 'внутр.'))
          : null) },
      { key: 'status', title: 'Статус', render: (r) => h(Pill, { tone: DOC_TONE[r.status] || 'neutral' }, DOC_LABEL[r.status] || r.status) },
      { key: 'owner', title: 'Ответственный', render: (r) => ROLE_LABEL[r.owner] || r.owner },
      { key: 'updated', title: 'Обновлен' },
      { key: 'note', title: 'Заметка команды', render: (r) => h('span', { className: 'u-ink-soft', style: { fontSize: 'var(--fs-xs)' } }, r.note || '—') },
    ];
    return h('div', { className: 'u-stack-3' },
      h(Alert, { tone: 'info' }, 'Команде видна внутренняя кухня: переводы, заверение, подача. Клиент видит только свой срез.'),
      h(Table, { columns: cols, rows: DOCUMENTS, rowKey: 'id', compact: true }),
      h('div', null, h(Button, { variant: 'secondary', size: 'sm', iconLeft: Ic.Upload }, 'Загрузить версию')));
  }

  function TabPayments() {
    const cols = [
      { key: 'date', title: 'Дата' },
      { key: 'what', title: 'Назначение' },
      { key: 'amount', title: 'Сумма', num: true, render: (r) => h('span', { className: 'u-critical u-tnum' }, rub(r.amount)) },
      { key: 'status', title: 'Статус', render: (r) => h(Pill, { tone: r.status === 'оплачен' ? 'success' : 'warning' }, r.status === 'оплачен' ? 'Оплачен' : 'Ждет оплаты') },
      { key: 'receipt', title: 'Чек', render: (r) => r.receipt
        ? h(Button, { variant: 'ghost', size: 'sm', iconLeft: Ic.Download }, 'Чек')
        : h('span', { className: 'u-ink-mute' }, '—') },
    ];
    const remain = BILLING.total - BILLING.paid;
    return h('div', { className: 'u-stack-4' },
      h('div', { className: 'u-cols-4' },
        h('div', { className: 'u-surface-2', style: { padding: 'var(--sp-4) var(--sp-5)' } }, h(Field, { label: 'Тариф', value: BILLING.tier })),
        h(Stat, { label: 'Оплачено', value: rub(BILLING.paid), bordered: true }),
        h(Stat, { label: 'Остаток', value: rub(remain), bordered: true }),
        h(Stat, { label: 'Занятия', value: BILLING.lessonsLeft + ' / ' + BILLING.lessonsTotal, bordered: true })),
      h('div', { className: 'u-stack-2' },
        h('div', { className: 'es-crm-sub' }, 'История платежей'),
        h(Table, { columns: cols, rows: PAYMENTS, rowKey: 'id', compact: true })),
      h('div', null, h(Button, { variant: 'primary', size: 'sm', iconLeft: Ic.Wallet }, 'Выставить счет')));
  }

  function TabLessons() {
    const cols = [
      { key: 'date', title: 'Когда' },
      { key: 'topic', title: 'Тема' },
      { key: 'teacher', title: 'Преподаватель' },
      { key: 'status', title: 'Статус', render: (r) => {
        const tone = r.status === 'проведен' ? 'success' : r.status === 'пропущен' ? 'danger' : 'info';
        const label = r.status === 'проведен' ? 'Проведен' : r.status === 'пропущен' ? 'Пропущен' : 'Запланирован';
        return h(Pill, { tone }, label);
      } },
      { key: 'mark', title: 'Оценка', render: (r) => r.mark ? h(Badge, { tone: 'jade' }, r.mark) : h('span', { className: 'u-ink-mute' }, '—') },
    ];
    return h('div', { className: 'u-stack-3' },
      h(Table, { columns: cols, rows: LESSONS, rowKey: 'id', compact: true }));
  }

  function TabComms() {
    return h('div', { className: 'es-crm-timeline u-stack-3' },
      TIMELINE.map((m) => {
        const ch = CHANNEL[m.channel] || CHANNEL.chat;
        const human = m.mode === 'human';
        return h('div', { key: m.id, className: 'es-crm-msg es-crm-msg--' + m.dir },
          h('div', { className: 'es-crm-msg__rail', 'aria-hidden': 'true' },
            h('span', { className: 'es-crm-msg__chan' }, h(ch.icon, { size: 15 }))),
          h('div', { className: 'es-crm-msg__body u-surface-2' },
            h('div', { className: 'es-crm-msg__meta' },
              h('span', { style: { fontWeight: 'var(--fw-semibold)', color: 'var(--ink)' } }, m.author),
              h(Badge, { tone: m.mode === 'support' ? 'neutral' : human ? 'jade' : 'info' },
                m.dir === 'in' ? 'входящее' : m.mode === 'human' ? 'человек' : m.mode === 'support' ? 'бот' : 'исходящее'),
              h('span', { className: 'u-ink-mute', style: { fontSize: 'var(--fs-xs)' } }, ch.label + ' · ' + m.when)),
            h('div', { style: { color: 'var(--ink-soft)', fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-1)' } }, m.text)));
      }));
  }

  function TabComments() {
    const [text, setText] = useState('');
    return h('div', { className: 'u-stack-4' },
      h('form', { className: 'u-flex u-gap-2', onSubmit: (e) => { e.preventDefault(); setText(''); } },
        h('div', { className: 'u-grow' },
          h(Input, { value: text, onChange: (e) => setText(e.target.value), placeholder: 'Комментарий для команды (клиент не видит)…', 'aria-label': 'Комментарий команды' })),
        h(Button, { variant: 'primary', size: 'md', type: 'submit', iconLeft: Ic.Send }, 'Добавить')),
      h('div', { className: 'u-stack-3' },
        COMMENTS.map((c) => h('div', { key: c.id, className: 'u-surface', style: { padding: 'var(--sp-4)' } },
          h('div', { className: 'u-flex u-items-center u-gap-2', style: { marginBottom: 'var(--sp-2)' } },
            h(Avatar, { name: c.author, size: 'sm' }),
            h('div', { className: 'u-grow', style: { minWidth: 0 } },
              h('div', { style: { fontWeight: 'var(--fw-semibold)', color: 'var(--ink)', fontSize: 'var(--fs-sm)' } }, c.author),
              h('div', { className: 'u-ink-mute', style: { fontSize: 'var(--fs-xs)' } }, ROLE_LABEL[c.role] + ' · ' + c.when)),
            c.pinned ? h(Badge, { tone: 'jade', icon: Ic.Pin }, 'закреплено') : null),
          h('div', { className: 'u-prose u-soft', style: { fontSize: 'var(--fs-sm)' } }, c.text)))));
  }

  function TabRisks() {
    return h('div', { className: 'u-stack-3' },
      RISKS.map((r) => h(Alert, {
        key: r.id,
        tone: r.severity === 'high' ? 'danger' : 'warning',
        title: r.title,
        action: h('div', { className: 'u-flex u-items-center u-gap-2', style: { flexShrink: 0 } },
          r.auto ? h(Badge, { tone: 'neutral', icon: Ic.Bolt }, 'авто-риск') : null,
          h(Badge, { tone: 'neutral' }, ROLE_LABEL[r.owner])),
      },
        h('div', null, r.hold),
        h('div', { className: 'u-flex u-items-center u-gap-2', style: { marginTop: 'var(--sp-2)' } },
          h(Ic.Clock, { size: 14 }),
          h('span', { style: { fontWeight: 'var(--fw-semibold)', color: 'var(--ink)', fontSize: 'var(--fs-xs)' } }, r.due)))));
  }

  const TABS = [
    { key: 'anketa', label: 'Заявка', render: TabAnketa },
    { key: 'assessment', label: 'Заключение', render: TabAssessment },
    { key: 'roadmap', label: 'Дорожная карта', render: TabRoadmap },
    { key: 'documents', label: 'Документы', render: TabDocuments },
    { key: 'payments', label: 'Продукты и оплаты', render: TabPayments },
    { key: 'lessons', label: 'Занятия', render: TabLessons },
    { key: 'comms', label: 'Коммуникации', render: TabComms },
    { key: 'comments', label: 'Комментарии', render: TabComments },
    { key: 'risks', label: 'Риски', render: TabRisks },
  ];

  // ======================================================================
  //  Командный рейл
  // ======================================================================
  function teamSections() {
    return [
      { label: 'CRM', items: [
        { icon: Ic.Grid, label: 'Клиенты', to: '/crm' },
        { icon: Ic.User, label: 'Карточка клиента', to: '/crm/client', active: true },
        { icon: Ic.Funnel, label: 'Воронка продаж', to: '/crm/funnel' },
      ] },
      { label: 'Работа', items: [
        { icon: Ic.Doc, label: 'Документы', to: '/crm' },
        { icon: Ic.Wallet, label: 'Оплаты', to: '/crm' },
        { icon: Ic.Cap, label: 'Обучение', to: '/learn' },
        { icon: Ic.Chat, label: 'Диалоги', to: '/crm', badge: 3 },
      ] },
      { label: 'База', items: [
        { icon: Ic.Globe, label: 'База знаний', to: '/crm' },
        { icon: Ic.Settings, label: 'Настройки', to: '/crm' },
      ] },
    ];
  }

  // ======================================================================
  //  Экран
  // ======================================================================
  function CrmClient() {
    const [tab, setTab] = useState('roadmap');
    const [navOpen, setNavOpen] = useState(false);
    const c = CLIENT;
    const active = TABS.find((t) => t.key === tab) || TABS[0];

    const rail = h(Sidebar, {
      brand: { name: 'EastSide', mark: 'E' },
      sections: teamSections(),
      user: { name: 'Оля Денисова', role: 'Куратор' },
      footer: h(window.ETheme.ThemeToggle, { variant: 'cycle' }),
    });

    const topbar = h(Topbar, {
      title: 'Карточка клиента',
      onMenu: () => setNavOpen(true),
      left: h('div', { className: 'u-hide-mobile', style: { marginRight: 'var(--sp-2)' } },
        h(U.Breadcrumbs, { items: [
          { label: 'CRM', to: '/crm' },
          { label: 'Клиенты', to: '/crm' },
          { label: c.student.name },
        ] })),
      right: h('div', { className: 'u-flex u-items-center u-gap-2' },
        h(IconButton, { icon: Ic.Search, label: 'Поиск', key: 's' }),
        h(IconButton, { icon: Ic.Bell, label: 'Уведомления', key: 'b' }),
        h(Avatar, { name: 'Оля Денисова', size: 'sm', key: 'a' })),
    });

    // --- Шапка карточки ---------------------------------------------------
    const header = h(Card, { className: 'es-crm-head', key: 'head' },
      // строка 1: личность + ключевые действия
      h('div', { className: 'es-crm-head__top' },
        h('div', { className: 'u-flex u-items-center u-gap-4', style: { minWidth: 0 } },
          h(Avatar, { name: c.student.name, size: 'lg' }),
          h('div', { style: { minWidth: 0 } },
            h('div', { className: 'u-flex u-items-center u-gap-2 u-wrap' },
              h('h2', { style: { margin: 0, fontSize: 'var(--fs-2xl)' } }, c.student.name),
              h(Badge, { tone: 'neutral' }, c.student.grade)),
            h('div', { className: 'u-ink-soft', style: { fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-1)' } },
              c.student.city + ' · ' + c.student.direction))),
        h('div', { className: 'u-flex u-items-center u-gap-2 u-wrap' },
          h('div', { className: 'u-hide-mobile' }, h(AvatarGroup, { items: c.curators.map((x) => ({ name: x.name, status: x.online ? true : undefined })) })),
          h(Button, { variant: 'secondary', size: 'sm', iconLeft: Ic.Chat }, 'Написать'),
          h(Button, { variant: 'primary', size: 'sm', iconLeft: Ic.Funnel }, DEAL_LABEL[c.deal.stage]))),

      // строка 2: статус воронки лентой стадий
      h('div', { className: 'es-crm-stages', 'aria-label': 'Стадия воронки' },
        DEAL_ORDER.map((st) => {
          const idx = DEAL_ORDER.indexOf(c.deal.stage);
          const here = st === c.deal.stage;
          const past = DEAL_ORDER.indexOf(st) < idx;
          return h('span', { key: st, className: 'es-crm-stage' + (here ? ' is-current' : past ? ' is-done' : '') },
            DEAL_LABEL[st]);
        })),

      // строка 3: сетка полей — родитель, трек, источник, деньги
      h('div', { className: 'es-crm-grid' },
        h('div', { className: 'es-crm-grid__cell u-stack-2' },
          h(Field, { label: 'Родитель (плательщик)', value: c.parent.name }),
          h('div', { className: 'u-flex u-wrap u-gap-2', style: { fontSize: 'var(--fs-xs)' } },
            h('a', { href: 'tel:' + c.parent.phone, className: 'es-crm-link' }, h(Ic.Phone, { size: 13 }), c.parent.phone),
            h('a', { href: '#', className: 'es-crm-link' }, h(Ic.Telegram, { size: 13 }), c.parent.tg),
            h('a', { href: 'mailto:' + c.parent.email, className: 'es-crm-link' }, h(Ic.Mail, { size: 13 }), c.parent.email))),
        h('div', { className: 'es-crm-grid__cell u-stack-2' },
          h(Field, { label: 'Трек', value: 'Guided (ведем за руку)' }),
          h(Field, { label: 'Готовность', value: c.student.readiness })),
        h('div', { className: 'es-crm-grid__cell u-stack-2' },
          h(Field, { label: 'Источник', value: c.source.channel }),
          h('div', { style: { fontSize: 'var(--fs-xs)', color: 'var(--ink-mute)', lineHeight: 'var(--lh-normal)' } },
            'UTM: ' + c.source.utm, h('br'), c.source.ref, ' · c ' + c.source.firstTouch)),
        h('div', { className: 'es-crm-grid__cell u-stack-2' },
          h(Field, { label: 'Сделка', value: c.deal.tier }),
          h('div', { className: 'u-critical u-tnum', style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: 'var(--fs-xl)' } }, rub(c.deal.amount)))),

      // строка 4: теги
      h('div', { className: 'u-flex u-wrap u-gap-2', style: { marginTop: 'var(--sp-4)' } },
        c.tags.map((t, i) => h(Tag, { key: i, tone: i === c.tags.length - 1 ? 'warning' : 'neutral' }, t))),

      // строка 5: кто отвечает за следующий шаг (load-bearing)
      h('div', { className: 'es-crm-next' + (c.nextStep.overdue ? ' is-overdue' : '') },
        h('span', { className: 'es-crm-next__icon', 'aria-hidden': 'true' }, h(Ic.Flag, { size: 17 })),
        h('div', { className: 'u-grow', style: { minWidth: 0 } },
          h('div', { className: 'es-crm-next__label' }, 'Следующий шаг'),
          h('div', { className: 'es-crm-next__text' }, c.nextStep.action)),
        h('div', { className: 'u-flex u-items-center u-gap-2', style: { flexShrink: 0 } },
          h(Pill, { tone: 'info' }, c.nextStep.who + ' · ' + ROLE_LABEL[c.nextStep.role]),
          h(Badge, { tone: c.nextStep.overdue ? 'danger' : 'neutral', icon: Ic.Clock }, 'до ' + c.nextStep.due)))
    );

    // --- Тело: табы + контент ---------------------------------------------
    const body = h(Card, { key: 'body', className: 'es-crm-body' },
      h('div', { className: 'es-crm-tabs' },
        h(Tabs, { tabs: TABS.map((t) => ({ key: t.key, label: t.label })), active: tab, onChange: setTab })),
      h('div', { className: 'es-crm-panel', role: 'tabpanel', 'aria-label': active.label },
        active.render())
    );

    const content = h('div', { className: 'es-crm u-animate-page', id: 'main' },
      h('div', { className: 'u-stack-6' }, header, body));

    return h('div', { className: 'u-shell' },
      h('div', { className: 'u-hide-mobile' }, rail),
      h('div', { className: 'u-flex-col', style: { minWidth: 0 } },
        topbar,
        h('div', { className: 'es-crm-wrap' }, content)),
      h(Drawer, { open: navOpen, onClose: () => setNavOpen(false), side: 'left', title: 'EastSide' }, rail)
    );
  }

  EScreens.CrmClient = CrmClient;
})();
