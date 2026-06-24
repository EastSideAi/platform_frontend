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
  const goLearn = () => SH.onNav({ label: 'Обучение', to: '/learning/schedule' });
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
      flow: [
        { t: 'Получаешь справку в клинике', s: 'По форме CSC, с переводом', st: 'current' },
        { t: 'Загружаешь сюда', s: 'Фото или скан' },
        { t: 'Мы проверяем и добавляем в пакет', s: 'Обычно 1-2 дня' },
      ],
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
  const KNOW = [
    { cap: 'Переезд', title: 'Как устроено жилье для студентов в Китае', dur: '6 мин чтения', icon: Ic.Home, image: 'assets/mountain-light.png',
      body: ['Большинство студентов живут в кампусе — это дешево и близко к учебе.', 'Есть варианты подороже: студии и квартиры рядом с вузом.', 'Заселение мы поможем оформить на этапе переезда.'] },
    { cap: 'Виза', title: 'Студенческая виза X1: что нужно знать', dur: '5 мин чтения', icon: Ic.Doc, image: 'assets/cosmos.png',
      body: ['Виза X1 — для долгой учебы (больше 180 дней). Оформляется после приглашения от вуза.', 'Нужны приглашение, загранпаспорт, фото и анкета.', 'В Китае в первые 30 дней оформляешь вид на жительство — поможем.'] },
    { cap: 'Быт', title: 'Деньги, связь и транспорт в первый месяц', dur: '4 мин чтения', icon: Ic.Clock, image: 'assets/ascent-lit.png',
      body: ['Основные платежи в Китае — через WeChat и Alipay, наличные почти не нужны.', 'Сразу оформи местную симку и студенческий проездной.', 'На первый месяц заложи бюджет на залог и бытовые мелочи.'] },
    { cap: 'Учеба', title: 'Что важно знать про учебу в китайском вузе', dur: '5 мин чтения', icon: Ic.Book, image: 'assets/ascent-night.png',
      body: ['Учебный год начинается в сентябре, есть строгая посещаемость.', 'Часть программ на английском, часть на китайском — зависит от вуза.', 'Гранты CSC часто покрывают обучение, проживание и стипендию.'] },
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
    .sd-jp2{position:relative;display:grid;grid-template-columns:404px minmax(0,1fr);gap:36px;align-items:start;margin-top:16px;}

    /* ── ЛЕВО: рейл-контейнер со своей легкой границей и гранью сверху ──── */
    .sd-jp2-rail{position:relative;overflow:visible;display:flex;flex-direction:column;gap:5px;
      padding:18px 16px;border-radius:24px;
      background:linear-gradient(180deg,rgba(255,255,255,.5),rgba(255,255,255,.16));
      border:1px solid rgba(22,32,59,.07);border-top-color:rgba(22,32,59,.12);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.85);}
    /* непрерывная линия-роадмап по центру узлов */
    .sd-jp2-rail::before{content:'';position:absolute;z-index:0;left:41px;top:54px;bottom:54px;width:2px;border-radius:2px;
      background:linear-gradient(180deg,var(--sd-acc) 0%,var(--sd-acc) var(--jp-fill,32%),rgba(22,32,59,.1) var(--jp-fill,32%),rgba(22,32,59,.1) 100%);}

    .sd-jp2-st{position:relative;z-index:1;display:flex;gap:14px;align-items:flex-start;width:100%;text-align:left;cursor:pointer;
      background:transparent;border:0;padding:0;}
    .sd-jp2-noden{flex:0 0 50px;display:flex;align-items:flex-start;justify-content:center;padding-top:15px;}
    .sd-jp2-node{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;
      font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;position:relative;}
    .sd-jp2-st.done .sd-jp2-node{color:var(--sd-acc-deep);background:#EAF2FF;box-shadow:inset 0 0 0 1px rgba(43,143,255,.3);}
    .sd-jp2-st.active .sd-jp2-node{color:#fff;background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));
      box-shadow:inset 0 0 12px rgba(175,215,255,.55),inset 0 1px 0 rgba(255,255,255,.45),0 5px 14px rgba(43,143,255,.3);}
    .sd-jp2-st.locked .sd-jp2-node{color:var(--sd-ink-mute);background:#fff;box-shadow:inset 0 0 0 1.5px rgba(22,32,59,.12);}

    .sd-jp2-st__b{flex:1 1 auto;min-width:0;position:relative;
      padding:13px 16px;border-radius:15px;border:1px solid transparent;
      transition:background .2s,border-color .2s,box-shadow .2s,margin .26s cubic-bezier(.23,1,.32,1);}
    .sd-jp2-st:not(.is-sel):hover .sd-jp2-st__b{background:rgba(43,143,255,.05);}
    .sd-jp2-st__top{display:flex;align-items:baseline;gap:12px;}
    .sd-jp2-st__t{flex:1 1 auto;min-width:0;font-size:15px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;line-height:1.3;
      overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .sd-jp2-st.locked .sd-jp2-st__t{color:var(--sd-ink-sub);font-weight:500;}
    .sd-jp2-st__st{flex:0 0 auto;font-size:11.5px;font-weight:600;color:var(--sd-ink-mute);letter-spacing:.005em;}
    .sd-jp2-st.done .sd-jp2-st__st,.sd-jp2-st.active .sd-jp2-st__st{color:var(--sd-acc-deep);}
    .sd-jp2-st__d{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
      font-size:12.5px;font-weight:500;color:var(--sd-ink-mute);line-height:1.45;margin-top:5px;}

    /* выбранный этап — светлая заливка изнутри, без тени, наезжает на панель */
    .sd-jp2-st.is-sel{z-index:6;}
    .sd-jp2-st.is-sel .sd-jp2-st__b{margin-right:-60px;background:rgba(255,255,255,.97);border-color:rgba(43,143,255,.32);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 40px rgba(43,143,255,.1);}
    .sd-jp2-st.is-sel .sd-jp2-st__b::after{content:'';position:absolute;right:-7px;top:23px;width:14px;height:14px;
      transform:rotate(45deg);background:rgba(255,255,255,.99);
      border-top:1px solid rgba(43,143,255,.32);border-right:1px solid rgba(43,143,255,.32);border-radius:0 4px 0 0;}

    /* ── ПРАВО: панель этапа — воздушная плашка, заливка изнутри, без тени ─ */
    .sd-jp2-panel{position:relative;overflow:hidden;z-index:2;border-radius:26px;padding:40px 44px 36px;
      background:linear-gradient(157deg,rgba(255,255,255,.82),rgba(244,247,255,.6));border:1px solid rgba(43,111,224,.12);
      -webkit-backdrop-filter:blur(22px) saturate(150%);backdrop-filter:blur(22px) saturate(150%);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.92),inset 0 0 70px rgba(43,143,255,.045);
      animation:jp-fade .28s cubic-bezier(.23,1,.32,1);}
    @keyframes jp-fade{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
    .sd-jp2-art{position:absolute;z-index:0;right:-8px;top:-18px;width:258px;pointer-events:none;opacity:.92;
      filter:drop-shadow(0 20px 42px rgba(43,90,200,.14));
      -webkit-mask-image:radial-gradient(150% 130% at 78% 22%,#000 60%,transparent 100%);mask-image:radial-gradient(150% 130% at 78% 22%,#000 60%,transparent 100%);}
    .sd-jp2-art.locked{opacity:.3;filter:grayscale(.5) drop-shadow(0 14px 30px rgba(43,90,200,.1));}
    .sd-jp2-panel__head{position:relative;z-index:1;max-width:60%;}
    .sd-jp2-eyebrow{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--sd-ink-mute);}
    .sd-jp2-eyebrow.active{color:var(--sd-acc-deep);}
    .sd-jp2-panel__t{font-weight:700;font-size:32px;letter-spacing:-1.1px;line-height:1.06;color:#15203B;margin:13px 0 0;text-wrap:balance;}
    .sd-jp2-panel__d{font-size:15.5px;line-height:1.62;color:var(--sd-ink-sub);margin:14px 0 0;max-width:54ch;}
    .sd-jp2-more{overflow:hidden;max-height:0;opacity:0;transition:max-height .3s cubic-bezier(.23,1,.32,1),opacity .22s;}
    .sd-jp2-more.open{max-height:640px;opacity:1;}
    .sd-jp2-more p{font-size:14px;line-height:1.62;color:var(--sd-ink-sub);margin:13px 0 0;max-width:64ch;}
    .sd-jp2-readmore{margin-top:15px;display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--sd-acc-deep);
      background:0;border:0;cursor:pointer;padding:0;transition:opacity .15s;}
    .sd-jp2-readmore:hover{opacity:.7;}
    .sd-jp2-readmore svg{transition:transform .2s cubic-bezier(.23,1,.32,1);}
    .sd-jp2-readmore.open svg{transform:rotate(180deg);}

    /* прогресс — своя скругленная карточка с легкой границей (не разделитель) */
    .sd-jp2-prog{position:relative;z-index:1;margin-top:30px;padding:22px 24px;border-radius:18px;
      border:1px solid rgba(22,32,59,.08);background:rgba(255,255,255,.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
    .sd-jp2-prog__top{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;}
    .sd-jp2-prog__lab{font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--sd-ink-mute);}
    .sd-jp2-prog__pct{font-size:40px;font-weight:700;letter-spacing:-1.4px;line-height:1;color:var(--sd-acc-deep);font-variant-numeric:tabular-nums;margin-top:9px;}
    .sd-jp2-prog__of{font-size:13px;font-weight:600;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
    .sd-jp2-prog__track{margin-top:18px;height:8px;border-radius:99px;background:rgba(22,32,59,.07);overflow:hidden;}
    .sd-jp2-prog__fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--sd-acc-2),var(--sd-acc-deep));transform-origin:left;transition:transform .4s cubic-bezier(.23,1,.32,1);}

    /* ── задачи — каждая своя карточка с границей, без разделителей ──────── */
    .sd-jp2-tasks{position:relative;z-index:1;margin-top:14px;display:flex;flex-direction:column;gap:11px;}
    .sd-jp2-task{border:1px solid rgba(22,32,59,.08);border-radius:16px;background:rgba(255,255,255,.5);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.7);transition:border-color .2s,background .2s;}
    .sd-jp2-task.done:hover,.sd-jp2-task.upcoming:hover{border-color:rgba(43,143,255,.22);background:rgba(255,255,255,.66);}
    .sd-jp2-task__row{display:flex;align-items:center;gap:15px;padding:16px 18px;}
    .sd-jp2-task.done .sd-jp2-task__row,.sd-jp2-task.upcoming .sd-jp2-task__row{cursor:pointer;}
    .sd-jp2-task__mk{flex:0 0 36px;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;}
    .sd-jp2-task.done .sd-jp2-task__mk{color:var(--sd-acc-deep);background:rgba(43,143,255,.1);box-shadow:inset 0 0 0 1px rgba(43,143,255,.2);}
    .sd-jp2-task.upcoming .sd-jp2-task__mk{color:var(--sd-ink-mute);background:rgba(22,32,59,.04);box-shadow:inset 0 0 0 1px rgba(22,32,59,.07);}
    .sd-jp2-task__b{flex:1 1 auto;min-width:0;}
    .sd-jp2-task__t{font-size:15px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;line-height:1.3;}
    .sd-jp2-task.done .sd-jp2-task__t{color:var(--sd-ink-sub);}
    .sd-jp2-task.upcoming .sd-jp2-task__t{color:var(--sd-ink-sub);}
    .sd-jp2-task__sub{font-size:12.5px;font-weight:500;color:var(--sd-ink-mute);line-height:1.45;margin-top:3px;}
    .sd-jp2-task__st{flex:0 0 auto;font-size:12px;font-weight:600;color:var(--sd-ink-mute);}
    .sd-jp2-task.done .sd-jp2-task__st{color:var(--sd-acc-deep);}
    .sd-jp2-task__chev{flex:0 0 auto;color:var(--sd-ink-mute);display:inline-flex;transition:transform .25s cubic-bezier(.23,1,.32,1);}
    .sd-jp2-task.is-open .sd-jp2-task__chev{transform:rotate(180deg);}
    /* текущая задача от тебя — единственный акцент */
    .sd-jp2-task.current{border:1.5px solid var(--sd-acc-line);
      background:linear-gradient(150deg,rgba(255,255,255,.95),rgba(244,247,255,.76));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 48px rgba(43,143,255,.1);}
    .sd-jp2-task.current .sd-jp2-task__row{padding:20px 22px;cursor:pointer;}
    .sd-jp2-task.current .sd-jp2-task__mk{flex:0 0 42px;width:42px;height:42px;border-radius:13px;color:#fff;
      background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));box-shadow:inset 0 0 13px rgba(175,215,255,.55),inset 0 1px 0 rgba(255,255,255,.4);}
    .sd-jp2-task.current .sd-jp2-task__t{font-size:17px;font-weight:700;color:var(--sd-ink);}
    .sd-jp2-meta{display:flex;align-items:center;flex-wrap:wrap;margin-top:7px;font-size:13px;font-weight:500;color:var(--sd-ink-mute);}
    .sd-jp2-meta b{color:var(--sd-acc-deep);font-weight:600;}
    .sd-jp2-meta__sep{margin:0 9px;width:3px;height:3px;border-radius:50%;background:rgba(22,32,59,.2);}
    .sd-jp2-task__cta{flex:0 0 auto;}
    /* раскрытие задачи */
    .sd-jp2-exp{overflow:hidden;max-height:0;opacity:0;transition:max-height .32s cubic-bezier(.23,1,.32,1),opacity .24s;}
    .sd-jp2-exp.open{max-height:520px;opacity:1;}
    .sd-jp2-exp__in{padding:0 18px 18px 69px;}
    .sd-jp2-task.current .sd-jp2-exp__in{padding:2px 22px 20px 79px;}
    .sd-jp2-exp__d{font-size:13.5px;line-height:1.6;color:var(--sd-ink-sub);max-width:62ch;}
    .sd-jp2-flow{margin-top:14px;}
    .sd-jp2-flowstep{display:flex;gap:12px;align-items:flex-start;padding:8px 0;}
    .sd-jp2-flowstep__mk{flex:0 0 22px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:700;
      color:var(--sd-acc-deep);background:rgba(43,143,255,.1);box-shadow:inset 0 0 0 1px rgba(43,143,255,.22);font-variant-numeric:tabular-nums;}
    .sd-jp2-flowstep__t{font-size:13.5px;font-weight:600;color:var(--sd-ink);}
    .sd-jp2-flowstep__s{font-size:12.5px;color:var(--sd-ink-mute);margin-top:2px;}

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
      .sd-jp2-panel__head{max-width:100%;}
      .sd-jp2-art{opacity:.45;width:150px;}
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

  const chevDown = () => h('span', { className: 'sd-jp2-task__chev' }, Ic.ChevronDown ? h(Ic.ChevronDown, { size: 18 }) : 'v');

  function JpTask(s, t, i, openTask, setOpenTask) {
    const isOpen = openTask === i;
    const toggle = () => setOpenTask(isOpen ? -1 : i);
    const flowOf = (t.flow && t.flow.length) ? h('div', { className: 'sd-jp2-flow' },
      t.flow.map((f, k) => h('div', { key: k, className: 'sd-jp2-flowstep' },
        h('span', { className: 'sd-jp2-flowstep__mk' }, k + 1),
        h('div', null,
          h('div', { className: 'sd-jp2-flowstep__t' }, f.t),
          f.s ? h('div', { className: 'sd-jp2-flowstep__s' }, f.s) : null)))) : null;

    if (t.status === 'done') {
      const exp = h('div', { className: 'sd-jp2-exp' + (isOpen ? ' open' : '') },
        h('div', { className: 'sd-jp2-exp__in' }, h('div', { className: 'sd-jp2-exp__d' }, t.desc || t.sub || 'Готово.')));
      return h('div', { key: i, className: 'sd-jp2-task done' + (isOpen ? ' is-open' : '') },
        h('div', { className: 'sd-jp2-task__row', onClick: toggle },
          h('span', { className: 'sd-jp2-task__mk' }, Ic.Check ? h(Ic.Check, { size: 16, strokeWidth: 2.6 }) : '✓'),
          h('div', { className: 'sd-jp2-task__b' },
            h('div', { className: 'sd-jp2-task__t' }, t.title),
            t.sub ? h('div', { className: 'sd-jp2-task__sub' }, t.sub) : null),
          h('span', { className: 'sd-jp2-task__st' }, 'Завершено'),
          chevDown()),
        exp);
    }

    if (t.status === 'current') {
      const exp = h('div', { className: 'sd-jp2-exp' + (isOpen ? ' open' : '') },
        h('div', { className: 'sd-jp2-exp__in' },
          t.desc ? h('div', { className: 'sd-jp2-exp__d' }, t.desc) : null,
          flowOf));
      return h('div', { key: i, className: 'sd-jp2-task current' + (isOpen ? ' is-open' : '') },
        h('div', { className: 'sd-jp2-task__row', onClick: toggle },
          h('span', { className: 'sd-jp2-task__mk' }, Ic.Spark ? h(Ic.Spark, { size: 18 }) : '•'),
          h('div', { className: 'sd-jp2-task__b' },
            h('div', { className: 'sd-jp2-task__t' }, t.title),
            jpMeta(t)),
          h('div', { className: 'sd-jp2-task__cta' },
            h('button', { type: 'button', className: 'sd-btn sd-btn--primary sd-btn--sm', onClick: (e) => { e.stopPropagation(); SH.openTask(taskOf(t)); } },
              t.cta || 'Перейти к задаче', arr(15))),
          chevDown()),
        exp);
    }

    // upcoming
    const st = t.owner === 'us' ? 'Наша задача' : t.dl ? 'Срок: ' + t.dl : 'Ожидает';
    const exp = h('div', { className: 'sd-jp2-exp' + (isOpen ? ' open' : '') },
      h('div', { className: 'sd-jp2-exp__in' },
        h('div', { className: 'sd-jp2-exp__d' }, t.desc || 'Откроется, когда дойдем до этого шага.'),
        flowOf));
    return h('div', { key: i, className: 'sd-jp2-task upcoming' + (isOpen ? ' is-open' : '') },
      h('div', { className: 'sd-jp2-task__row', onClick: toggle },
        h('span', { className: 'sd-jp2-task__mk' }, Ic.Lock ? h(Ic.Lock, { size: 15 }) : '·'),
        h('div', { className: 'sd-jp2-task__b' },
          h('div', { className: 'sd-jp2-task__t' }, t.title),
          t.sub ? h('div', { className: 'sd-jp2-task__sub' }, t.sub) : null),
        h('span', { className: 'sd-jp2-task__st' }, st),
        chevDown()),
      exp);
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
        h('img', { className: 'sd-jp2-art locked', src: art, alt: '' }),
        h('div', { className: 'sd-jp2-panel__head' }, head),
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
      h('img', { className: 'sd-jp2-art', src: art, alt: '' }),
      h('div', { className: 'sd-jp2-panel__head' }, head),
      h('div', { className: 'sd-jp2-prog' + (s.st === 'done' ? ' done' : '') },
        h('div', { className: 'sd-jp2-prog__top' },
          h('div', null,
            h('div', { className: 'sd-jp2-prog__lab' }, 'Прогресс этапа'),
            h('div', { className: 'sd-jp2-prog__pct' }, pct + '%')),
          h('div', { className: 'sd-jp2-prog__of' }, doneN + ' из ' + tasks.length + ' задач')),
        h('div', { className: 'sd-jp2-prog__track' },
          h('div', { className: 'sd-jp2-prog__fill', style: { transform: 'scaleX(' + (pct / 100) + ')' } }))),
      h('div', { className: 'sd-jp2-tasks' }, tasks.map((t, i) => JpTask(s, t, i, props.openTask, props.setOpenTask))));
  }

  function JPath() {
    injectJourneyCSS();
    const activeN = (STAGES.find((s) => s.st === 'active') || STAGES[0]).n;
    const [sel, setSel] = useState(activeN);
    const [moreOpen, setMoreOpen] = useState(false);
    const [openTask, setOpenTask] = useState(-1);
    const s = STAGES.find((x) => x.n === sel) || STAGES[0];
    const activeIdx = STAGES.findIndex((x) => x.st === 'active');
    const fill = Math.round(((activeIdx + 0.5) / STAGES.length) * 100);
    const select = (n) => { setSel(n); setMoreOpen(false); setOpenTask(-1); };

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
        h(JpDetail, { key: sel, s: s, moreOpen: moreOpen, setMoreOpen: setMoreOpen, openTask: openTask, setOpenTask: setOpenTask })));
  }

  /* ── Полезное про переезд (попап) ──────────────────────────────────────── */
  function Knowledge() {
    const feat = KNOW[0];
    const rest = KNOW.slice(1);
    const chev = (s) => Ic.ChevronRight ? h(Ic.ChevronRight, { size: s || 16 }) : '›';
    return h('section', { className: 'sd-sec' },
      h('div', { className: 'sd-sec__head' },
        h('h3', { className: 'sd-sec__title' }, 'Полезное про переезд'),
        h('button', { type: 'button', className: 'sd-sec__link', onClick: goLearn }, 'Вся база', arr(14))),
      h('div', { className: 'sd-know' },
        h('div', { className: 'sd-feat', onClick: () => SH.openArticle(feat) },
          h('img', { className: 'sd-feat__bg', src: feat.image, alt: '' }),
          h('div', { className: 'sd-feat__scrim' }),
          h('div', { className: 'sd-feat__body' },
            h('div', { className: 'sd-feat__cap' }, feat.cap),
            h('div', { className: 'sd-feat__title' }, feat.title),
            h('div', { className: 'sd-feat__meta' },
              h('span', null, feat.dur),
              h('span', { className: 'sd-feat__go' }, 'Читать', arr(14))))),
        h('div', { className: 'sd-know__list' },
          rest.map((a, i) => h('div', { key: i, className: 'sd-aitem', onClick: () => SH.openArticle(a) },
            h('div', { className: 'sd-aitem__icw' }, a.icon ? h(a.icon, { size: 19 }) : null),
            h('div', { className: 'sd-aitem__b' },
              h('div', { className: 'sd-aitem__cap' }, a.cap + ' · ' + a.dur),
              h('div', { className: 'sd-aitem__title' }, a.title)),
            h('div', { className: 'sd-aitem__go' }, chev(18)))))));
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
