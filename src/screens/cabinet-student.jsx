/* ============================================================================
   EastSide — Кабинет ученика · ГЛАВНАЯ (window.EScreens.CabinetStudent · #/student)
   ----------------------------------------------------------------------------
   Премиальный дрим-пульт 2026: тонкая типографика SF Pro Display, глазморфизм,
   мягкое свечение, дрим-картинки бренда (гора-восхождение). Минимум коробок,
   максимум воздуха и визуала.

   Состав: воздушный текстовый статус (как идем + общий прогресс) → широкий
   баннер текущего этапа (дрим-гора) + список задач (стекло) → роадмап-путь с
   дрим-героем и целью-вершиной → полезное про переезд. Каркас — ESStudentShell.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = window.React || React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const Ic = window.EIcons || {};
  const SH = window.ESStudentShell;
  const arr = (s) => Ic.ArrowRight ? h(Ic.ArrowRight, { size: s || 16, className: 'sd-arr' }) : null;
  const mute = { fontSize: '13px', fontWeight: 500, color: 'var(--sd-ink-mute)' };
  const goStage = () => SH.onNav({ label: 'Этап', to: '/stage' });
  const goLearn = () => SH.onNav({ label: 'Обучение', to: '/learn' });
  const goDiag = () => SH.onNav({ label: 'Диагностика', to: '/diagnostics' });

  // ── Текущий этап. status: 'ok' (зеленый) | 'urgent' (янтарный) | 'late' (красный)
  const STAGE = {
    n: 3, total: 8, title: 'Сбор документов', daysLeft: 7, deadline: '28 июня',
    status: 'urgent',
    say: 'Медсправку нужно переделать до завтра — это сейчас главное. Остальное идет по графику.',
    banner: 'Собираем пакет под грант CSC. Осталось переоформить медсправку и загрузить фото — и переходим к подаче.',
  };

  // ── Под-шаги текущего этапа (для списка задач и попапа) ─────────────────────
  const STEPS = [
    { owner: 'us', status: 'done', title: 'Проверили аттестат и оценки',
      sub: 'Аттестат и оценки проходят по требованиям гранта.',
      desc: 'Сверили твой аттестат и баллы с требованиями CSC — все в порядке, документ готов к пакету.' },
    {
      owner: 'you', status: 'current', side: 'you', title: 'Переоформить медсправку',
      dl: 'завтра', dlState: 'late', prio: 'высокий', time: '5-10 минут на загрузку',
      why: 'Старую справку не приняли — нужна новая по форме CSC с переводом.',
      card: 'Нужна новая справка по форме CSC с переводом.',
      desc: 'Нужна новая медсправка по форме CSC (Foreigner Physical Examination Form) с печатями и переводом. Сделай в клинике, потом загрузи фото или скан — проверим за 1-2 дня. Если что-то непонятно по пунктам — спроси AI.',
      cta: 'Перейти к задаче',
      // Три части попапа: что и зачем -> инструкция с материалами -> выполнение.
      wizard: [
        { title: 'Что это за задача', body: [
          'Старую медсправку не приняли: она была не по той форме. Для гранта CSC нужна справка строго по форме Foreigner Physical Examination Form — с печатями клиники и переводом.',
          'Это последнее, что держит твой пакет документов. Закроем справку — и переходим к подаче на грант.',
        ] },
        { title: 'Как сделать',
          body: ['Несколько простых шагов по порядку. Бланк можно скачать ниже и принести с собой в клинику.'],
          bullets: [
            'Скачай бланк формы CSC и распечатай его.',
            'Пройди осмотр в клинике — врач заполнит бланк и заверит его печатями.',
            'Сделай перевод справки, если она на русском.',
            'Сфотографируй или отсканируй готовый документ — на последнем шаге загрузишь его сюда.',
          ],
          materials: [
            { kind: 'pdf', name: 'Форма CSC — Foreigner Physical Examination Form', meta: 'PDF · бланк для клиники' },
            { kind: 'guide', name: 'Как заполнить: пример и частые ошибки', meta: 'Памятка · 2 минуты' },
          ],
          note: { type: 'tip', text: 'Проверь, чтобы все печати и текст на справке читались на фото. Размытый скан — главная причина возврата.' },
        },
      ],
      action: {
        type: 'upload',
        heading: 'Загрузи готовую справку',
        hint: 'Прикрепи фото или скан заполненной и заверенной формы. Проверим за 1-2 дня и добавим в пакет.',
        formats: 'JPG, PNG или PDF, до 20 МБ',
        label: 'Отправить на проверку',
        doneText: 'Спасибо! Справка ушла на проверку. Обычно это занимает 1-2 дня — если что-то нужно поправить, дадим знать прямо здесь. Можно закрыть окно.',
      },
    },
    {
      owner: 'you', status: 'upcoming', side: 'you', title: 'Загрузить фото 33x48', dl: '28 июня', dlState: 'ok', time: '5 минут',
      sub: 'Белый фон, ровный свет, нейтральное выражение лица.',
      desc: 'Фото 33x48 мм: строго белый фон, ровный свет, нейтральное выражение лица, без аксессуаров.',
      cta: 'Загрузить фото',
      flow: [{ t: 'Ты загружаешь фото', st: 'current' }, { t: 'Мы проверяем', s: 'Скажем сразу, если надо переснять' }],
    },
    { owner: 'us', status: 'upcoming', title: 'Проверка пакета и подача на грант', time: '1-2 дня',
      sub: 'Соберем пакет и подадим заявку — от тебя ничего не нужно.',
      desc: 'Проверим все документы, соберем пакет и подадим заявку на грант CSC от твоего имени. От тебя ничего не нужно.' },
  ];

  // ── Все этапы пути. У каждого: lead (d), у активного — full (read more) и tasks (STEPS),
  //    у пройденных — done-задачи, у будущих — превью will + after ──────────────────────────
  const STAGES = [
    { n: 1, t: 'Выбор университета', st: 'done', sub: 'Подобрали программу и вуз под твой профиль.',
      d: 'Разобрали твой профиль и подобрали программу и вуз, где у тебя реальные шансы на грант.',
      tasks: [
        { status: 'done', owner: 'us', title: 'Собрали профиль и цели', sub: 'Разобрали интересы, баллы и цель по стране.' },
        { status: 'done', owner: 'us', title: 'Подобрали вуз и программу', sub: 'Вуз и направление, где реальны шансы на грант.' },
      ] },
    { n: 2, t: 'Уровень языка HSK', st: 'done', sub: 'Подтвердили уровень языка и участие в гранте.',
      d: 'Зафиксировали твой уровень языка и подтвердили, что ты проходишь по требованиям гранта.',
      tasks: [
        { status: 'done', owner: 'you', title: 'Прошел диагностику уровня', sub: 'Зафиксировали твой текущий уровень языка.' },
        { status: 'done', owner: 'us', title: 'Подтвердили участие в гранте', sub: 'Профиль проходит по требованиям CSC.' },
      ] },
    { n: 3, t: 'Сбор документов', st: 'active', sub: 'Собираем пакет под требования гранта CSC.',
      d: 'Собираем пакет под требования гранта CSC и проверяем каждый файл перед подачей. Сейчас в фокусе медсправка.',
      full: [
        'Готовим все, что комиссия CSC потребует при подаче: аттестат с оценками, сертификат HSK, медсправку по форме CSC, фото на документы, скан паспорта и письма.',
        'Важно собрать пакет заранее и без брака: неверная форма справки или фото не по стандарту приводят к возврату, а окно подачи открывается раз в год.',
        'На выходе — готовый проверенный пакет, который мы подаем на грант от твоего имени. Сейчас от тебя нужны два документа, остальное берем на себя.',
      ],
      tasks: STEPS },
    { n: 4, t: 'Подача на грант', st: 'locked', sub: 'Подадим заявку на грант CSC от твоего имени.',
      d: 'Когда пакет готов, подаем заявку на грант CSC от твоего имени и следим за статусом.',
      after: 3, will: ['Финальная проверка пакета', 'Подача заявки от твоего имени', 'Подтверждение приема заявки'] },
    { n: 5, t: 'Решение CSC', st: 'locked', sub: 'Комиссия рассматривает твою заявку.',
      d: 'Комиссия рассматривает заявку. Держим тебя в курсе и готовим к следующему шагу.',
      after: 4, will: ['Отслеживаем статус заявки', 'Готовим к возможному интервью', 'Сообщаем решение комиссии'] },
    { n: 6, t: 'Приглашение вуза', st: 'locked', sub: 'Вуз присылает официальное приглашение.',
      d: 'После одобрения гранта вуз присылает официальное приглашение для визы.',
      after: 5, will: ['Получаем приглашение от вуза', 'Проверяем данные в документе', 'Готовим пакет на визу'] },
    { n: 7, t: 'Виза и переезд', st: 'locked', sub: 'Оформляем визу и готовим к переезду.',
      d: 'Оформляем учебную визу и готовим тебя к переезду: жилье, билеты, первые дни.',
      after: 6, will: ['Подаем на визу X1/X2', 'Бронируем общежитие', 'Помогаем с билетами и страховкой'] },
    { n: 8, t: 'Приезд в Китай', st: 'locked', sub: 'Кампус, заселение и старт учебы.',
      d: 'Ты на вершине: кампус, заселение, старт учебы. Цель достигнута, мы рядом на месте.',
      after: 7, will: ['Заселение в общежитие', 'Регистрация и документы на месте', 'Старт учебы и адаптация'] },
  ];

  // ── База знаний «Про переезд» (попап) ───────────────────────────────────────
  // У featured-статьи body — типизированные блоки (lead/h/p/list/tip/quote),
  // их рендерит светлый редакторский попап. У остальных body — простые абзацы.
  const KNOW = [
    { cap: 'Переезд', title: 'Как устроено жилье для студентов в Китае',
      dur: '5 мин чтения', read: 5, icon: Ic.Home, image: 'assets/cosmos.png', thumbPos: '60% 36%', tint: '#2B8FFF',
      dek: 'Кампус или аренда, сколько это стоит и что выбрать на первый семестр.',
      body: [
        { type: 'lead', text: 'Жилье — первое, что станет твоим домом в Китае. Разберемся спокойно: какие есть варианты, сколько стоят и что выбрать на первый семестр, чтобы думать про учебу, а не про быт.' },
        { type: 'stats', items: [
          { v: '800–2000 ¥', l: 'в месяц за общежитие' },
          { v: '1–4', l: 'соседа в комнате' },
          { v: 'от 1 года', l: 'и можно на аренду' },
        ] },
        { type: 'p', text: 'Почти все студенты начинают с общежития на кампусе. Это самый простой путь: дешево, рядом с парами и сразу с соседями, которые проходят ровно то же, что и ты.' },
        { type: 'h', text: 'Общежитие на кампусе' },
        { type: 'p', text: 'Комнаты бывают на двоих, троих или четверых. Для иностранных студентов часто есть отдельные корпуса получше — со своим санузлом, кондиционером и интернетом. Кровать, стол и шкаф обычно уже стоят.' },
        { type: 'list', items: [
          'Комната на 1-2 человека — тише и дороже, удобно для учебы.',
          'Комната на 3-4 человека — дешевле и быстрее заводишь друзей.',
          'Общие кухни и прачечные — на этаже или в корпусе.',
        ] },
        { type: 'figure', src: 'assets/ascent-night.png', cap: 'От брони до заселения этот путь мы проходим вместе — комната ждет к началу семестра.' },
        { type: 'h', text: 'Общежитие или аренда' },
        { type: 'p', text: 'Оба варианта рабочие — разница в цене, приватности и хлопотах с документами. Коротко, чтобы было с чем сравнить:' },
        { type: 'table', head: ['Что сравниваем', 'Общежитие', 'Аренда'], rows: [
          ['Цена в месяц', '800–2000 ¥', 'от 2500 ¥'],
          ['Приватность', 'Сосед или соседи', 'Свое пространство'],
          ['Как заехать', 'Бронируем заранее', 'Ищешь сам'],
          ['Договор и депозит', 'Берем на себя', 'Оформляешь сам'],
          ['Кому подходит', 'Первый год', 'Со второго года'],
        ] },
        { type: 'tip', text: 'Заложи отдельный бюджет на первый месяц: депозит, постельное белье и бытовые мелочи. Дальше расходы выравниваются и становятся предсказуемыми.' },
        { type: 'h', text: 'Сколько это стоит' },
        { type: 'p', text: 'Общежитие — самый бюджетный вариант. Гранты CSC часто покрывают проживание полностью или дают стипендию, из которой это легко закрыть.' },
        { type: 'quote', text: 'Первый семестр поживи в общежитии. Так проще влиться, найти своих и понять район, прежде чем снимать жилье самому.' },
        { type: 'h', text: 'Что сделать заранее' },
        { type: 'list', items: [
          'Определись: кампус или аренда — от этого зависят бюджет и документы.',
          'Уточни у нас, что именно покрывает твой грант по проживанию.',
          'Собери на первый месяц сумму на депозит и быт.',
        ] },
        { type: 'p', text: 'Когда дойдем до переезда, мы оформим заселение, подскажем по документам на месте и будем на связи в первые дни. Твоя задача — собраться спокойно, остальное берем на себя.' },
      ] },
    { cap: 'Виза', title: 'Студенческая виза X1: что нужно знать',
      dur: '5 мин чтения', read: 5, icon: Ic.Doc, image: 'assets/ascent-night.png', thumbPos: '50% 40%', tint: '#3AAE8F',
      dek: 'Когда оформлять, какие документы нужны и что делать в первые 30 дней.',
      body: ['Виза X1 — для долгой учебы (больше 180 дней). Оформляется после приглашения от вуза.', 'Нужны приглашение, загранпаспорт, фото и анкета.', 'В Китае в первые 30 дней оформляешь вид на жительство — поможем.'] },
    { cap: 'Быт', title: 'Деньги, связь и транспорт в первый месяц',
      dur: '4 мин чтения', read: 4, icon: Ic.Clock, image: 'assets/mountain-dark.png', thumbPos: '50% 46%', tint: '#E08A5B',
      dek: 'WeChat и Alipay вместо наличных, местная симка и проездной — все за первую неделю.',
      body: ['Основные платежи в Китае — через WeChat и Alipay, наличные почти не нужны.', 'Сразу оформи местную симку и студенческий проездной.', 'На первый месяц заложи бюджет на залог и бытовые мелочи.'] },
    { cap: 'Учеба', title: 'Что важно знать про учебу в китайском вузе',
      dur: '5 мин чтения', read: 5, icon: Ic.Book, image: 'assets/ascent-lit.png', thumbPos: '50% 38%', tint: '#9B7BE6',
      dek: 'Когда начинается год, на каком языке учат и что покрывают гранты CSC.',
      body: ['Учебный год начинается в сентябре, есть строгая посещаемость.', 'Часть программ на английском, часть на китайском — зависит от вуза.', 'Гранты CSC часто покрывают обучение, проживание и стипендию.'] },
    { cap: 'Культура', title: 'Китайские традиции, праздники и адаптация',
      dur: '4 мин чтения', read: 4, icon: Ic.Heart, image: 'assets/mountain-path.png', thumbPos: '50% 50%', tint: '#56A8E0',
      dek: 'Праздники, привычки и негласные правила, к которым стоит привыкнуть заранее.',
      body: [
        { type: 'lead', text: 'Переезд — это не только документы и жилье. Другая культура поначалу удивляет, но к ней быстро привыкаешь. Собрали то, что стоит знать заранее, чтобы первые недели прошли спокойно.' },
        { type: 'h', text: 'Праздники и ритм года' },
        { type: 'p', text: 'Главные даты — китайский Новый год зимой и Праздник середины осени. В эти дни кампус пустеет, многие студенты уезжают домой, а магазины и службы работают по особому графику. Поездки и закупки лучше планировать заранее.' },
        { type: 'h', text: 'Как принято общаться' },
        { type: 'p', text: 'К иностранным студентам относятся дружелюбно и охотно помогают. Даже пара фраз на китайском от новичка располагает людей. Не бойся ошибаться: попытка говорить важнее идеального произношения.' },
        { type: 'list', items: [
          'Выучи 10-15 бытовых фраз — приветствие, заказ еды, благодарность.',
          'Поставь переводчик с камерой — выручает с меню и вывесками.',
          'Уважай очередь и личное пространство в транспорте.',
        ] },
        { type: 'tip', text: 'Первый месяц держись поближе к землякам и студсообществу вуза — так проще освоиться, а потом сам не заметишь, как заведешь местных друзей.' },
        { type: 'quote', text: 'Культурный шок проходит. Дай себе пару недель — и чужой город начнет казаться своим.' },
      ] },
  ];

  // Лента категорий под карточками (фильтр базы знаний)
  const CATS = [
    { t: 'Жилье', n: 8, icon: Ic.Home, tint: '#2B8FFF' },
    { t: 'Документы', n: 8, icon: Ic.Doc, tint: '#9B7BE6' },
    { t: 'Финансы', n: 9, icon: Ic.Wallet, tint: '#3AAE8F' },
    { t: 'Учеба', n: 11, icon: Ic.Book, tint: '#E08A5B' },
    { t: 'Быт', n: 10, icon: Ic.Compass, tint: '#E0656E' },
    { t: 'Здоровье', n: 6, icon: Ic.Heart, tint: '#E06A9C' },
  ];

  const taskOf = (s) => Object.assign({}, s, { title: s.title, desc: s.desc || s.why });
  const statusV = () => { const st = STAGE.status; return st === 'late' ? 'late' : st === 'urgent' ? 'warn' : 'ok'; };
  const USER = (SH && SH.USER) || {};

  /* ── Герой: крупный привет + заголовок в 2 строки, большая гора справа ──── */
  function Hero() {
    const v = statusV();
    const br = h('br', { key: 'br' });
    const line = v === 'late'
      ? ['Есть просрочка —', br, h('span', { key: 1, className: 'sd-hero2__em' }, 'нагони сроки')]
      : v === 'warn'
      ? ['Идешь по графику,', br, h('span', { key: 1, className: 'sd-hero2__em' }, 'горит только медсправка')]
      : ['Идешь по графику,', br, h('span', { key: 1, className: 'sd-hero2__em' }, 'все по плану')];
    const heart = () => Ic.Heart ? h(Ic.Heart, { size: 14 }) : null;
    return h('section', { className: 'sd-hero2 ' + v },
      h('div', { className: 'sd-hero2__main' },
        h('div', { className: 'sd-hero2__hi' }, 'Привет, ' + (USER.first || 'Дима') + '!'),
        h('h1', { className: 'sd-hero2__h' }, line),
        h('div', { className: 'sd-hero2__re' }, heart(), 'Ты справишься. Мы рядом', heart()),
        h('div', { className: 'sd-hero2__stats' },
          h('div', { className: 'sd-stat' },
            h('div', { className: 'sd-stat__ic' }, Ic.Calendar ? h(Ic.Calendar, { size: 20 }) : null),
            h('div', { className: 'sd-stat__b' },
              h('div', { className: 'sd-stat__lab' }, 'До дедлайна медсправки'),
              h('div', { className: 'sd-stat__val' }, '1 день'),
              h('div', { className: 'sd-stat__sub' }, 'Твоя задача — в фокусе'))),
          h('div', { className: 'sd-stat' },
            h('div', { className: 'sd-stat__ic' }, Ic.Spark ? h(Ic.Spark, { size: 20 }) : null),
            h('div', { className: 'sd-stat__b' },
              h('div', { className: 'sd-stat__lab' }, 'Твой прогресс'),
              h('div', { className: 'sd-stat__val' }, STAGE.n + ' из ' + STAGE.total + ' этапов'),
              h('div', { className: 'sd-stat__bar' }, h('i', { style: { width: (100 * STAGE.n / STAGE.total) + '%' } })))))),
      h('div', { className: 'sd-hero2__mtwrap' },
        h('img', { className: 'sd-hero2__mt', src: 'assets/mountain-peak.png', alt: '' })));
  }

  /* ── Верхний ряд: карточка текущего этапа (слева) + задачи (справа) ──────── */
  function TopRow() {
    const taskClick = (p) => (p.owner === 'you' && (p.desc || p.why)) ? SH.openTask(taskOf(p)) : goStage();
    const pending = STEPS.filter((p) => p.status !== 'done');
    const meta = (p) => (p.owner === 'you' ? 'Твоя задача' : 'Наша задача') + (p.dl ? ' · срок ' + p.dl : p.time ? ' · ' + p.time : '');
    return h('section', { className: 'sd-sec sd-toprow-sec' },
      h('div', { className: 'sd-toprow' },
        // карточка этапа — стеклянный медальон с папкой слева + текст
        h('div', { className: 'sd-glass sd-stagecard' },
          h('div', { className: 'sd-stagecard__head' },
            h('div', { className: 'sd-stagecard__kick' }, 'Текущий этап'),
            h('div', { className: 'sd-stagecard__chip' }, STAGE.n + ' / ' + STAGE.total)),
          h('div', { className: 'sd-stagecard__body' },
            h('div', { className: 'sd-stagecard__orb' }, h('img', { src: 'assets/docs-banner.png', alt: '' })),
            h('div', { className: 'sd-stagecard__txt' },
              h('h3', { className: 'sd-stagecard__t' }, STAGE.title),
              h('p', { className: 'sd-stagecard__d' }, STAGE.banner),
              h('button', { type: 'button', className: 'sd-btn sd-btn--primary sd-stagecard__cta', onClick: goStage }, 'Продолжить этап', arr())))),
        // задачи — без кнопки, только незавершенные
        h('div', { className: 'sd-glass sd-tasks' },
          h('div', { className: 'sd-tasks__h' },
            h('span', null, 'Что сейчас нужно сделать'),
            h('span', { className: 'sd-tasks__count' }, String(pending.length))),
          h('div', { className: 'sd-tasks__list' },
            pending.map((p, j) => h('div', { key: j, className: 'sd-tk ' + p.status + (p.status === 'current' && p.dlState === 'late' ? ' late' : ''), onClick: () => taskClick(p) },
              h('span', { className: 'sd-tk__dot' }, null),
              h('div', { className: 'sd-tk__b' },
                h('div', { className: 'sd-tk__t' }, p.title),
                h('div', { className: 'sd-tk__m' + (p.dlState === 'late' ? ' late' : '') }, meta(p))),
              h('span', { className: 'sd-tk__go' }, Ic.ChevronRight ? h(Ic.ChevronRight, { size: 17 }) : '›')))))));
  }

  /* ── Баннер AI — темная атмосфера на всю ширину ─────────────────────────── */
  function AiBanner() {
    return h('section', { className: 'sd-sec' },
      h('div', { className: 'sd-aibn', onClick: () => SH.openChat() },
        h('div', { className: 'sd-aibn__c' },
          h('div', { className: 'sd-aibn__kick' }, 'AI-наставник'),
          h('div', { className: 'sd-aibn__t' }, 'Рядом, когда нужен ответ'),
          h('div', { className: 'sd-aibn__d' }, 'Завис на шаге, горит срок или непонятно с документами — напиши, и получишь четкий разбор за секунды. Без ожидания куратора, в любое время.'),
          h('button', { type: 'button', className: 'sd-btn sd-btn--primary', onClick: (e) => { e.stopPropagation(); SH.openChat(); } }, 'Спросить AI', arr())),
        h('img', { className: 'sd-aibn__img', src: 'assets/robot-ai.png', alt: '' })));
  }

  /* ── «Твой путь в Китай» — master-detail (рейл этапов + панель выбранного) ──
     Чисто и воздушно: монохром-сапфир, без зеленого/красного, без выпуклых теней
     и пилюль. Выбранный этап слева — стеклянный контейнер с треугольником-язычком
     к панели. Текущие задачи раскрываются, у самой панели есть «читать подробнее».  */
  function injectJourneyCSS() {
    if (document.getElementById('es-journey-css')) return;
    const el = document.createElement('style');
    el.id = 'es-journey-css';
    el.textContent = `
    /* блок «Путь в Китай» занимает почти всю ширину рабочего полотна */
    .sd-main--light:has(.sd-jp2) .sd-wrap{max-width:1320px;}
    .sd-jp2{position:relative;display:grid;grid-template-columns:468px minmax(0,1fr);gap:36px;align-items:start;margin-top:16px;}

    /* ── ЛЕВО: рейл-контейнер со своей легкой границей и гранью сверху ──── */
    .sd-jp2-rail{position:relative;overflow:visible;display:flex;flex-direction:column;gap:6px;
      padding:20px 18px;border-radius:24px;
      background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,.16));
      border:1px solid rgba(22,32,59,.07);border-top-color:rgba(22,32,59,.12);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.85);}
    /* непрерывная линия-роадмап по центру узлов */
    .sd-jp2-rail::before{content:'';position:absolute;z-index:0;left:52px;top:68px;bottom:68px;width:2px;border-radius:2px;
      background:linear-gradient(180deg,var(--sd-acc) 0%,var(--sd-acc) var(--jp-fill,32%),rgba(22,32,59,.1) var(--jp-fill,32%),rgba(22,32,59,.1) 100%);}

    .sd-jp2-st{position:relative;z-index:1;display:flex;gap:14px;align-items:flex-start;width:100%;text-align:left;cursor:pointer;
      background:transparent;border:0;padding:0;}
    .sd-jp2-noden{flex:0 0 64px;display:flex;align-items:flex-start;justify-content:center;padding-top:18px;}
    .sd-jp2-node{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;
      font-size:15px;font-weight:700;font-variant-numeric:tabular-nums;position:relative;}
    .sd-jp2-st.done .sd-jp2-node{color:var(--sd-acc-deep);background:#EAF2FF;box-shadow:inset 0 0 0 1px rgba(43,143,255,.3);}
    .sd-jp2-st.active .sd-jp2-node{color:#fff;background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));
      box-shadow:inset 0 0 14px rgba(175,215,255,.55),inset 0 1px 0 rgba(255,255,255,.45),0 5px 14px rgba(43,143,255,.3);}
    .sd-jp2-st.locked .sd-jp2-node{color:var(--sd-ink-mute);background:#fff;box-shadow:inset 0 0 0 1.5px rgba(22,32,59,.12);}

    .sd-jp2-st__b{flex:1 1 auto;min-width:0;position:relative;
      padding:18px 20px;border-radius:16px;border:1px solid transparent;
      transition:background .2s,border-color .2s,box-shadow .2s,margin .26s cubic-bezier(.23,1,.32,1);}
    .sd-jp2-st:not(.is-sel):hover .sd-jp2-st__b{background:rgba(43,143,255,.05);}
    .sd-jp2-st__top{display:flex;align-items:baseline;gap:12px;}
    .sd-jp2-st__t{flex:1 1 auto;min-width:0;font-size:17px;font-weight:600;color:var(--sd-ink);letter-spacing:-.3px;line-height:1.3;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .sd-jp2-st.locked .sd-jp2-st__t{color:var(--sd-ink-sub);font-weight:500;}
    .sd-jp2-st__st{flex:0 0 auto;font-size:12px;font-weight:600;color:var(--sd-ink-mute);}
    .sd-jp2-st.done .sd-jp2-st__st,.sd-jp2-st.active .sd-jp2-st__st{color:var(--sd-acc-deep);}
    .sd-jp2-st__d{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
      font-size:13px;font-weight:500;color:var(--sd-ink-mute);line-height:1.45;margin-top:6px;}

    /* выбранный этап — светлая заливка изнутри, без тени, наезжает на панель */
    .sd-jp2-st.is-sel{z-index:6;}
    .sd-jp2-st.is-sel .sd-jp2-st__b{margin-right:-68px;background:rgba(255,255,255,.97);border-color:rgba(43,143,255,.32);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 40px rgba(43,143,255,.1);}
    .sd-jp2-st.is-sel .sd-jp2-st__b::after{content:'';position:absolute;right:-7px;top:28px;width:14px;height:14px;
      transform:rotate(45deg);background:rgba(255,255,255,.99);
      border-top:1px solid rgba(43,143,255,.32);border-right:1px solid rgba(43,143,255,.32);border-radius:0 4px 0 0;}

    /* ── ПРАВО: панель этапа — воздушная плашка, заливка изнутри, без тени ─ */
    .sd-jp2-panel{position:relative;overflow:hidden;z-index:2;border-radius:26px;padding:40px 44px 36px;
      background:linear-gradient(157deg,rgba(255,255,255,.82),rgba(244,247,255,.6));border:1px solid rgba(43,111,224,.12);
      -webkit-backdrop-filter:blur(22px) saturate(150%);backdrop-filter:blur(22px) saturate(150%);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.92),inset 0 0 70px rgba(43,143,255,.045);
      animation:jp-fade .28s cubic-bezier(.23,1,.32,1);}
    @keyframes jp-fade{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
    .sd-jp2-art{float:right;margin:0 0 20px 32px;width:258px;pointer-events:none;opacity:.92;
      filter:drop-shadow(0 20px 42px rgba(43,90,200,.14));
      -webkit-mask-image:radial-gradient(150% 130% at 78% 22%,#000 60%,transparent 100%);mask-image:radial-gradient(150% 130% at 78% 22%,#000 60%,transparent 100%);}
    .sd-jp2-art.locked{opacity:.3;filter:grayscale(.5) drop-shadow(0 14px 30px rgba(43,90,200,.1));}
    .sd-jp2-panel__head{position:relative;z-index:1;overflow:hidden;}
    .sd-jp2-eyebrow{font-size:12px;font-weight:600;color:var(--sd-ink-mute);}
    .sd-jp2-eyebrow.active{color:var(--sd-acc-deep);}
    .sd-jp2-panel__t{font-weight:700;font-size:32px;letter-spacing:-1.1px;line-height:1.06;color:#15203B;margin:13px 0 0;text-wrap:balance;}
    .sd-jp2-panel__d{font-size:15.5px;line-height:1.62;color:var(--sd-ink-sub);margin:14px 0 0;}
    .sd-jp2-more{overflow:hidden;max-height:0;opacity:0;transition:max-height .3s cubic-bezier(.23,1,.32,1),opacity .22s;}
    .sd-jp2-more.open{max-height:640px;opacity:1;}
    .sd-jp2-more p{font-size:14px;line-height:1.62;color:var(--sd-ink-sub);margin:13px 0 0;}
    .sd-jp2-readmore{margin-top:15px;display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--sd-acc-deep);
      background:0;border:0;cursor:pointer;padding:0;transition:opacity .15s;}
    .sd-jp2-readmore:hover{opacity:.7;}
    .sd-jp2-readmore svg{transition:transform .2s cubic-bezier(.23,1,.32,1);}
    .sd-jp2-readmore.open svg{transform:rotate(180deg);}

    /* прогресс — своя скругленная карточка с легкой границей (не разделитель) */
    .sd-jp2-prog{position:relative;z-index:1;margin-top:30px;padding:22px 24px;border-radius:18px;
      border:1px solid rgba(22,32,59,.08);background:rgba(255,255,255,.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
    .sd-jp2-prog__top{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;}
    .sd-jp2-prog__lab{font-size:11px;font-weight:600;color:var(--sd-ink-mute);}
    .sd-jp2-prog__pct{font-size:40px;font-weight:700;letter-spacing:-1.4px;line-height:1;color:var(--sd-acc-deep);font-variant-numeric:tabular-nums;margin-top:9px;}
    .sd-jp2-prog__of{font-size:13px;font-weight:600;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
    .sd-jp2-prog__track{margin-top:18px;height:8px;border-radius:99px;background:rgba(22,32,59,.07);overflow:hidden;}
    .sd-jp2-prog__fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--sd-acc-2),var(--sd-acc-deep));transform-origin:left;transition:transform .4s cubic-bezier(.23,1,.32,1);}

    /* ── задачи — простые кнопки, без expandable ── */
    .sd-jp2-tasks{position:relative;z-index:1;margin-top:14px;display:flex;flex-direction:column;gap:11px;}
    .sd-jp2-task{border:1px solid rgba(22,32,59,.08);border-radius:16px;background:rgba(255,255,255,.5);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.7);cursor:pointer;text-align:left;font-family:inherit;width:100%;
      transition:border-color .2s,background .2s,transform .15s;}
    .sd-jp2-task:hover{border-color:rgba(43,143,255,.22);background:rgba(255,255,255,.7);transform:translateY(-1px);}
    .sd-jp2-task__row{display:flex;align-items:center;gap:15px;padding:16px 18px;}
    .sd-jp2-task__mk{flex:0 0 36px;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;}
    .sd-jp2-task.done .sd-jp2-task__mk{color:var(--sd-acc-deep);background:rgba(43,143,255,.1);box-shadow:inset 0 0 0 1px rgba(43,143,255,.2);}
    .sd-jp2-task.upcoming .sd-jp2-task__mk{background:rgba(22,32,59,.04);box-shadow:inset 0 0 0 1.5px rgba(22,32,59,.1);}
    .sd-jp2-task__b{flex:1 1 auto;min-width:0;}
    .sd-jp2-task__t{font-size:15px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;line-height:1.3;}
    .sd-jp2-task.done .sd-jp2-task__t{color:var(--sd-ink-sub);}
    .sd-jp2-task__sub{font-size:12.5px;font-weight:500;color:var(--sd-ink-mute);line-height:1.45;margin-top:3px;}
    .sd-jp2-task__st{flex:0 0 auto;font-size:12px;font-weight:600;color:var(--sd-acc-deep);}
    .sd-jp2-task__dl{flex:0 0 auto;font-size:12.5px;font-weight:600;color:var(--sd-ink-mute);}
    .sd-jp2-task__dl.late{color:#C94040;}
    .sd-jp2-task__cta{flex:0 0 auto;}
    .sd-jp2-task.current{border:1.5px solid var(--sd-acc-line);
      background:linear-gradient(150deg,rgba(255,255,255,.95),rgba(244,247,255,.76));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 48px rgba(43,143,255,.1);}
    .sd-jp2-task.current:hover{border-color:var(--sd-acc-2);}
    .sd-jp2-task.current .sd-jp2-task__row{padding:20px 22px;}
    .sd-jp2-task.current .sd-jp2-task__mk{flex:0 0 42px;width:42px;height:42px;border-radius:13px;color:#fff;
      background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));box-shadow:inset 0 0 13px rgba(175,215,255,.55),inset 0 1px 0 rgba(255,255,255,.4);}
    .sd-jp2-task.current .sd-jp2-task__t{font-size:17px;font-weight:700;color:var(--sd-ink);}

    /* ── locked-этап: тихий превью своей карточкой ──────────────────────── */
    .sd-jp2-soon{position:relative;z-index:1;margin-top:22px;padding:22px 24px;border-radius:18px;
      border:1px solid rgba(22,32,59,.08);background:rgba(255,255,255,.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
    .sd-jp2-soon__h{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:var(--sd-ink-sub);}
    .sd-jp2-soon__h svg{color:var(--sd-ink-mute);}
    .sd-jp2-soon__list{margin-top:15px;display:flex;flex-direction:column;gap:12px;}
    .sd-jp2-soon__it{display:flex;gap:11px;align-items:flex-start;font-size:13.5px;color:var(--sd-ink-sub);line-height:1.4;}
    .sd-jp2-soon__dot{flex:0 0 5px;width:5px;height:5px;border-radius:50%;background:rgba(43,143,255,.42);margin-top:7px;}

    @media (max-width:920px){
      .sd-jp2{grid-template-columns:1fr;gap:18px;}
      .sd-jp2-st.is-sel .sd-jp2-st__b{margin-right:0;}
      .sd-jp2-st.is-sel .sd-jp2-st__b::after{display:none;}
      .sd-jp2-art{float:none;width:160px;opacity:.45;margin:0 0 16px 0;}
    }`;
    document.head.appendChild(el);
  }

  // мета текущей задачи — словом, сапфиром, без красного и пилюль
  function jpMeta(t) {
    const parts = [];
    if (t.dl) parts.push(h('span', { key: 'dl' }, 'Срок: ', h('b', null, t.dl)));
    if (t.prio) parts.push(h('span', { key: 'pr' }, 'Приоритет: ', h('b', null, t.prio)));
    if (t.time && !t.dl) parts.push(h('span', { key: 'tm' }, t.time));
    const out = [];
    parts.forEach((p, k) => { if (k > 0) out.push(h('span', { key: 's' + k, className: 'sd-jp2-meta__sep' })); out.push(p); });
    return h('div', { className: 'sd-jp2-meta' }, out);
  }

  function JpTask(s, t, i) {
    const click = () => SH.openTask(taskOf(t));
    const done = t.status === 'done';
    const current = t.status === 'current';

    const marker = done
      ? h('span', { className: 'sd-jp2-task__mk' }, Ic.Check ? h(Ic.Check, { size: 16, strokeWidth: 2.6 }) : '✓')
      : current
      ? h('span', { className: 'sd-jp2-task__mk' }, Ic.Spark ? h(Ic.Spark, { size: 18 }) : '•')
      : h('span', { className: 'sd-jp2-task__mk' });

    const dlText = done ? null : t.dl || (t.owner === 'us' ? 'Берем на себя' : t.time || null);
    const right = done
      ? h('span', { className: 'sd-jp2-task__st' }, 'Завершено')
      : dlText ? h('span', { className: 'sd-jp2-task__dl' + (t.dlState === 'late' ? ' late' : '') }, dlText) : null;

    return h('div', { key: i, className: 'sd-jp2-task ' + (t.status || 'upcoming'), onClick: click },
      h('div', { className: 'sd-jp2-task__row' },
        marker,
        h('div', { className: 'sd-jp2-task__b' },
          h('div', { className: 'sd-jp2-task__t' }, t.title),
          t.sub ? h('div', { className: 'sd-jp2-task__sub' }, t.sub) : null),
        current && t.cta
          ? h('div', { className: 'sd-jp2-task__cta' },
              h('button', { type: 'button', className: 'sd-btn sd-btn--primary sd-btn--sm',
                onClick: (e) => { e.stopPropagation(); SH.openTask(taskOf(t)); } },
                t.cta, arr(15)))
          : null,
        right));
  }

  function JpDetail(props) {
    const s = props.s;
    const locked = s.st === 'locked';
    const art = locked ? 'assets/mountain-peak.png' : 'assets/folder-glass.png';
    const eyebrow = locked ? 'Скоро' : s.st === 'done' ? 'Этап завершен' : 'Текущий этап';
    const head = [
      h('div', { key: 'e', className: 'sd-jp2-eyebrow' + (s.st === 'active' ? ' active' : '') }, eyebrow),
      h('h4', { key: 't', className: 'sd-jp2-panel__t' }, s.t),
      h('p', { key: 'd', className: 'sd-jp2-panel__d' }, s.d),
      s.full ? h('div', { key: 'm', className: 'sd-jp2-more' + (props.moreOpen ? ' open' : '') }, s.full.map((p, i) => h('p', { key: i }, p))) : null,
      s.full ? h('button', { key: 'b', type: 'button', className: 'sd-jp2-readmore' + (props.moreOpen ? ' open' : ''), onClick: () => props.setMoreOpen(!props.moreOpen) },
        props.moreOpen ? 'Свернуть' : 'Читать подробнее', Ic.ChevronDown ? h(Ic.ChevronDown, { size: 15 }) : 'v') : null,
    ];

    if (locked) {
      const prev = STAGES[s.after - 1];
      return h('section', { className: 'sd-jp2-panel' },
        h('div', { className: 'sd-jp2-panel__head' },
          h('img', { key: 'art', className: 'sd-jp2-art locked', src: art, alt: '' }),
          head),
        h('div', { className: 'sd-jp2-soon' },
          h('div', { className: 'sd-jp2-soon__h' }, Ic.Lock ? h(Ic.Lock, { size: 15 }) : null,
            'Откроется после этапа ' + s.after + (prev ? ' · «' + prev.t + '»' : '')),
          h('div', { className: 'sd-jp2-soon__list' },
            (s.will || []).map((w, i) => h('div', { key: i, className: 'sd-jp2-soon__it' },
              h('span', { className: 'sd-jp2-soon__dot' }), w)))));
    }

    const tasks = s.tasks || [];
    const doneN = tasks.filter((t) => t.status === 'done').length;
    const pct = s.st === 'done' ? 100 : Math.round((doneN / (tasks.length || 1)) * 100);
    return h('section', { className: 'sd-jp2-panel' },
      h('div', { className: 'sd-jp2-panel__head' },
        h('img', { key: 'art', className: 'sd-jp2-art', src: art, alt: '' }),
        head),
      h('div', { className: 'sd-jp2-prog' + (s.st === 'done' ? ' done' : '') },
        h('div', { className: 'sd-jp2-prog__top' },
          h('div', null,
            h('div', { className: 'sd-jp2-prog__lab' }, 'Прогресс этапа'),
            h('div', { className: 'sd-jp2-prog__pct' }, pct + '%')),
          h('div', { className: 'sd-jp2-prog__of' }, doneN + ' из ' + tasks.length + ' задач')),
        h('div', { className: 'sd-jp2-prog__track' },
          h('div', { className: 'sd-jp2-prog__fill', style: { transform: 'scaleX(' + (pct / 100) + ')' } }))),
      h('div', { className: 'sd-jp2-tasks' }, tasks.map((t, i) => JpTask(s, t, i))));
  }

  function JPath() {
    injectJourneyCSS();
    const activeN = (STAGES.find((s) => s.st === 'active') || STAGES[0]).n;
    const [sel, setSel] = useState(activeN);
    const [moreOpen, setMoreOpen] = useState(false);
    const s = STAGES.find((x) => x.n === sel) || STAGES[0];
    const activeIdx = STAGES.findIndex((x) => x.st === 'active');
    const fill = Math.round(((activeIdx + 0.5) / STAGES.length) * 100);
    const select = (n) => { setSel(n); setMoreOpen(false); };

    return h('section', { className: 'sd-sec' },
      h('div', { className: 'sd-sec__head' },
        h('h3', { className: 'sd-sec__title' }, 'Твой путь в Китай'),
        h('span', { style: mute }, 'Этап ' + STAGE.n + ' из ' + STAGE.total)),
      h('div', { className: 'sd-jp2' },
        h('div', { className: 'sd-jp2-rail', style: { '--jp-fill': fill + '%' } },
          STAGES.map((st) => {
            const isSel = st.n === sel;
            const node = st.st === 'done' ? (Ic.Check ? h(Ic.Check, { size: 15, strokeWidth: 2.6 }) : '✓')
              : st.st === 'locked' ? (Ic.Lock ? h(Ic.Lock, { size: 13 }) : st.n)
              : st.n;
            const stWord = st.st === 'done' ? 'Завершено' : st.st === 'active' ? 'Сейчас' : 'Ожидает';
            return h('button', { key: st.n, type: 'button', className: 'sd-jp2-st ' + st.st + (isSel ? ' is-sel' : ''), onClick: () => select(st.n) },
              h('span', { className: 'sd-jp2-noden' }, h('span', { className: 'sd-jp2-node' }, node)),
              h('span', { className: 'sd-jp2-st__b' },
                h('span', { className: 'sd-jp2-st__top' },
                  h('span', { className: 'sd-jp2-st__t' }, st.t),
                  h('span', { className: 'sd-jp2-st__st' }, stWord)),
                st.sub ? h('span', { className: 'sd-jp2-st__d' }, st.sub) : null));
          })),
        h(JpDetail, { key: sel, s: s, moreOpen: moreOpen, setMoreOpen: setMoreOpen })));
  }

  /* ── Полезное про переезд — журнальная сетка как в рефе: ВСЕ карточки
       full-bleed (картинка на весь размер карточки), текст/чип/время/кнопка
       лежат ПОВЕРХ. Слева крупная обложка на всю высоту, справа сетка 2×2.
       Под ними — лента-навигатор по категориям. Цвет: сапфир + лёгкие
       оттенки по рубрикам (чип, стрелка, иконка категории). ── */
  function injectKnowledgeCSS() {
    if (document.getElementById('es-kb-css')) return;
    const el = document.createElement('style');
    el.id = 'es-kb-css';
    el.textContent = `
    .kb-headwrap{min-width:0;}
    .kb-headwrap .sd-sec__title{font-size:26px;font-weight:500;}
    .sd-sec__sub{font-size:15px;font-weight:500;color:var(--sd-ink-mute);margin-top:7px;}
    .kb{display:grid;grid-template-columns:1.34fr 1fr 1fr;grid-template-rows:1fr 1fr;gap:16px;min-height:452px;}

    /* ═══ КАРТОЧКА (общий full-bleed): картинка на весь размер + оверлей ═══ */
    .kb-c{position:relative;overflow:hidden;cursor:pointer;text-align:left;font-family:inherit;padding:0;border:0;width:100%;background:#070E2A;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 14px 36px rgba(8,16,44,.16);
      transition:transform .2s cubic-bezier(.23,1,.32,1),box-shadow .2s;}
    .kb-c:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 26px 58px rgba(8,16,44,.3);}
    .kb-c__img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1);}
    .kb-c:hover .kb-c__img{transform:scale(1.05);}
    .kb-c__scrim{position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(157deg,rgba(4,9,26,.6) 0%,rgba(4,9,26,.16) 40%,rgba(4,9,26,.12) 60%,rgba(4,9,26,.62) 100%);}
    .kb-c__b{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;justify-content:space-between;}
    .kb-c__top{display:flex;flex-direction:column;align-items:flex-start;min-width:0;}
    /* чип рубрики — лёгкий оттенок категории, текст белый */
    .kb-chip{display:inline-flex;align-items:center;border-radius:8px;font-weight:600;color:#fff;
      -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.2);
      text-shadow:0 1px 2px rgba(4,9,28,.4);}
    .kb-time{display:inline-flex;align-items:center;gap:6px;font-weight:500;color:rgba(232,239,255,.9);font-variant-numeric:tabular-nums;text-shadow:0 1px 2px rgba(4,9,28,.5);}
    .kb-time svg{color:rgba(170,202,255,.95);}
    .kb-c__ttl{font-weight:600;color:#fff;letter-spacing:-.3px;text-wrap:balance;text-shadow:0 2px 10px rgba(4,9,28,.35);}
    /* стеклянная кнопка со стрелкой */
    .kb-sq{flex:0 0 auto;display:grid;place-items:center;
      background:rgba(255,255,255,.13);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
      border:1px solid rgba(255,255,255,.2);border-radius:12px;color:#fff;
      transition:transform .18s,background .18s;}
    .kb-sq svg{transition:transform .2s;}
    .kb-c:hover .kb-sq{transform:translateY(-2px);background:rgba(255,255,255,.22);}
    .kb-c:hover .kb-sq svg{transform:translateX(2px);}

    /* — крупная обложка слева — */
    .kb-feat{grid-column:1;grid-row:1 / span 2;border-radius:24px;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.1),0 22px 56px rgba(8,16,44,.24);}
    .kb-feat .kb-c__b{padding:28px 30px 26px;}
    .kb-feat .kb-chip{font-size:11px;padding:6px 13px;}
    .kb-feat .kb-c__ttl{font-size:29px;line-height:1.13;letter-spacing:-.8px;margin-top:13px;max-width:14ch;}
    .kb-feat .kb-time{font-size:12.5px;margin-top:12px;}
    .kb-feat__cta{flex:0 0 auto;display:grid;place-items:center;width:46px;height:46px;border-radius:14px;
      background:rgba(255,255,255,.13);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);
      border:1px solid rgba(255,255,255,.2);color:#fff;transition:transform .18s,background .18s;}
    .kb-feat:hover .kb-feat__cta{transform:translateY(-2px);background:rgba(255,255,255,.22);}
    .kb-feat__cta svg{transition:transform .2s;}
    .kb-feat:hover .kb-feat__cta svg{transform:translateX(2px);}

    /* — мелкие карточки 2×2 — */
    .kb-sm{border-radius:20px;}
    .kb-sm .kb-c__b{padding:15px 16px;}
    .kb-sm .kb-chip{font-size:9.5px;padding:4px 10px;}
    .kb-sm .kb-c__ttl{font-size:15px;line-height:1.26;margin-top:10px;max-width:17ch;
      display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .kb-sm .kb-time{font-size:11px;margin-top:8px;}
    .kb-sm .kb-sq{width:36px;height:36px;}

    /* ═══ ЛЕНТА КАТЕГОРИЙ (скрыта пока) ═══════════════════════════════════ */
    .kb-cats{display:none;}
    .kb-cats::-webkit-scrollbar{height:0;}
    .kb-cat{flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:11px 18px 11px 12px;border-radius:15px;cursor:pointer;font-family:inherit;
      background:rgba(255,255,255,.62);border:1px solid rgba(22,32,59,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 6px 16px rgba(8,16,44,.05);
      transition:transform .16s cubic-bezier(.23,1,.32,1),border-color .16s,background .16s;}
    .kb-cat:hover{transform:translateY(-2px);background:#fff;border-color:rgba(43,143,255,.26);}
    .kb-cat.is-on{background:linear-gradient(160deg,rgba(43,143,255,.13),rgba(43,143,255,.05));border-color:rgba(43,143,255,.34);}
    .kb-cat__ic{flex:0 0 38px;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;}
    .kb-cat__b{display:flex;flex-direction:column;}
    .kb-cat__t{font-size:13.5px;font-weight:600;color:var(--sd-ink);letter-spacing:-.1px;line-height:1.15;}
    .kb-cat__n{font-size:11px;font-weight:500;color:var(--sd-ink-mute);margin-top:2px;font-variant-numeric:tabular-nums;}
    .kb-cats__nav{flex:0 0 auto;align-self:center;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;cursor:pointer;color:var(--sd-ink-mute);
      background:rgba(255,255,255,.62);border:1px solid rgba(22,32,59,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.85);transition:transform .15s,background .15s,color .15s;}
    .kb-cats__nav:hover{background:#fff;color:var(--sd-ink);transform:translateY(-1px);}

    @media (max-width:1040px){
      .kb{grid-template-columns:1fr 1fr;grid-template-rows:auto;min-height:0;}
      .kb-feat{grid-column:1 / span 2;grid-row:auto;min-height:300px;}
      .kb-sm{min-height:188px;}
    }
    @media (max-width:620px){
      .kb{grid-template-columns:1fr;}
      .kb-feat{grid-column:1;}
      .kb-feat .kb-c__ttl{font-size:24px;}
      .kb-sm{min-height:172px;}
    }`;
    document.head.appendChild(el);
  }

  function Knowledge() {
    injectKnowledgeCSS();
    const feat = KNOW[0];
    const rest = KNOW.slice(1, 5);
    const open = (a) => SH.openArticle(a, KNOW);
    const clock = (s) => Ic.Clock ? h(Ic.Clock, { size: s || 13 }) : null;
    const arrR = (s) => Ic.ArrowRight ? h(Ic.ArrowRight, { size: s || 16 }) : '→';
    const hexA = (hex, a) => { const n = parseInt((hex || '#2B8FFF').slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };

    // full-bleed карточка: картинка на весь размер + оверлей (чип, заголовок, время, кнопка)
    const card = (a, cls, label, key) => h('button', { key: key, type: 'button', className: 'kb-c ' + cls, onClick: () => open(a) },
      h('img', { className: 'kb-c__img', src: a.image, alt: '', style: { objectPosition: a.thumbPos || '50% 42%' } }),
      h('span', { className: 'kb-c__scrim' }),
      h('span', { className: 'kb-c__b' },
        h('span', { className: 'kb-c__top' },
          h('span', { className: 'kb-chip', style: { background: hexA(a.tint, .22), borderColor: hexA(a.tint, .36) } }, label || a.cap),
          h('span', { className: 'kb-c__ttl' }, a.title),
          h('span', { className: 'kb-time' }, clock(cls === 'kb-feat' ? 13 : 12), a.dur)),
        cls === 'kb-feat'
          ? h('span', { className: 'kb-feat__cta' }, arrR(20))
          : h('span', { className: 'kb-sq' }, arrR(17))));

    return h('section', { className: 'sd-sec' },
      h('div', { className: 'sd-sec__head' },
        h('div', { className: 'kb-headwrap' },
          h('h3', { className: 'sd-sec__title' }, 'Полезное про переезд'),
          h('div', { className: 'sd-sec__sub' }, 'Жилье, документы, деньги, учеба — собрали всё, что нужно знать до и после переезда в Китай')),
        h('button', { type: 'button', className: 'sd-btn sd-btn--primary sd-btn--sm', onClick: goLearn }, 'Вся база', arr(14))),
      h('div', { className: 'kb' },
        card(feat, 'kb-feat', 'Главное', 'f'),
        rest.map((a, i) => card(a, 'kb-sm', null, i))),
      h('div', { className: 'kb-cats' },
        CATS.map((c, i) => h('button', { key: i, type: 'button', className: 'kb-cat' + (i === 0 ? ' is-on' : '') },
          h('span', { className: 'kb-cat__ic', style: { color: c.tint, background: hexA(c.tint, .12), boxShadow: 'inset 0 0 0 1px ' + hexA(c.tint, .22) } }, c.icon ? h(c.icon, { size: 19 }) : null),
          h('span', { className: 'kb-cat__b' },
            h('span', { className: 'kb-cat__t' }, c.t),
            h('span', { className: 'kb-cat__n' }, c.n + ' материалов')))),
        h('button', { type: 'button', className: 'kb-cats__nav', 'aria-label': 'Дальше' }, Ic.ChevronRight ? h(Ic.ChevronRight, { size: 18 }) : '›')));
  }

  function CabinetStudent() {
    if (!SH) return h('div', { style: { padding: 40, color: '#fff' } }, 'Скелет ученика не загружен');
    return h(SH.Shell, { active: 'home', surface: 'light', hideTopBar: true },
      h(Hero, null),
      h(TopRow, null),
      h(AiBanner, null),
      h(JPath, null),
      h(Knowledge, null));
  }

  EScreens.CabinetStudent = CabinetStudent;
})();
