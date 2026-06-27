/* ============================================================================
   EastSide — Диагностическое заключение (window.EScreens.Diagnostics · #/diagnostics)
   ----------------------------------------------------------------------------
   Просмотр заключения В ЯЗЫКЕ ДАШБОРДА — та же композиция, что у эталона
   cabinet-student.jsx: 256px-сайдбар (.ec-rail: лого · нав, активна «Диагностика» ·
   профиль-маскот · помощь · ТОГГЛ ТЕМЫ · настройки) → .ec-main:
     • верхняя строка (привет + колокол-уведомления)
     • hero-карта (.ec-hero): «Заключение готово» + вердикт (Arkhip) + строка
       «Хорошие шансы» + лид + 2 мини-стата (шанс / категории) + кольцо шанса +
       иллюстрация-гора — все plate-ink, читается в обеих темах
     • «Где ты сейчас» — точка А и точка Б (две карты)
     • «Куда реально поступить» — подбор вузов reach/match/safety (реальные вузы
       Китая с иероглифами, шанс зачисления, грант)
     • «На что опираемся» — сильные стороны
     • «Над чем работаем» — слабые стороны (тоном задач, без тревоги)
     • «Что улучшить» — зоны роста, каждая связана с продуктом → пробный режим
       (модалка + тост, живой CTA)
     • «Рекомендуемая стратегия» — нумерованные шаги
     • «Документы к подаче» — таблица статусов + переход в раздел
     • низ (.ec-bot): «Что будет дальше?» (→ дорожная карта) + «Все под контролем»

   Read-only, премиально, обе темы, без drop-теней (глубина только через токены:
   inset-свечение/обводки/вуали). Стиль ТОЛЬКО токены/классы (.ec-*, .e-*, .u-*) +
   компоненты EUI. Данные — EMock.diagnostics/universities/documents/roadmap7 с
   in-file fallback, чтобы экран не падал без мока. На «ты», без «ё».
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const { Card, Button, Badge, Pill, Modal, ProgressBar, Alert, Table, AssistantFab, AssistantPopup } = U;
  const ThemeToggle = (window.ETheme && window.ETheme.ThemeToggle) || null;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};
  const Link = (window.ERouter && window.ERouter.Link) || null;
  const toast = (t) => (window.EToast && window.EToast.push ? window.EToast.push(t) : null);

  const icoOf = (name) => (name && Ic[name]) || Ic.File;

  // ── Данные (общий мок + мягкий fallback) ───────────────────────────────
  const EM = window.EMock || {};
  const STUDENT = EM.student || { name: 'Дима Соколов', grade: '11 класс', direction: 'Компьютерные науки, Китай' };
  const DIAG = EM.diagnostics || {
    chancePct: 74,
    verdict: 'Сильный кандидат на топ-вузы Китая по компьютерным наукам',
    pointA: 'HSK 4, средний балл 4.6, олимпиада по информатике (регион). Английский — уверенный B2.',
    pointB: 'Бакалавриат по Computer Science в вузе топ-30 Китая с частичным или полным грантом CSC.',
    growthZones: [
      { title: 'Мотивационное письмо', product: 'Мастерская писем', tone: 'warning' },
      { title: 'Портфолио проектов', product: 'Проектный трек', tone: 'ochre' },
      { title: 'HSK 5 к подаче', product: 'Языковая платформа', tone: 'info' },
    ],
  };
  const UNIS = (EM.universities && EM.universities.length) ? EM.universities : [
    { id: 'u1', name: 'Университет Цинхуа', cn: '清华大学', city: 'Пекин', category: 'reach', chancePct: 28, grant: 'Полный CSC' },
    { id: 'u3', name: 'Чжэцзянский университет', cn: '浙江大学', city: 'Ханчжоу', category: 'match', chancePct: 66, grant: 'Полный CSC' },
    { id: 'u6', name: 'Юго-Восточный университет', cn: '东南大学', city: 'Нанкин', category: 'safety', chancePct: 88, grant: 'Провинциальный' },
  ];
  const PRODUCTS = EM.products || [];
  const DOCS = (EM.documents || []).slice(0, 7);
  const ROADMAP7 = EM.roadmap7 || [];
  const seeds = EM.assistantSeeds7 || EM.assistantSeeds || null;

  const firstName = (STUDENT.name || 'Дима').split(' ')[0];

  // тело секции из мока (диагностика.sections[]) с fallback по ключу
  const bodyByKey = {};
  (DIAG.sections || []).forEach((s) => { if (s && s.key) bodyByKey[s.key] = s.body; });
  const sectionBody = (key, fallback) => bodyByKey[key] || fallback || '';

  // ── Категории вузов (китай-специфика: reach / match / safety) ───────────
  const TIER = {
    reach:  { tone: 'warning', label: 'Reach', cap: 'Топ-10',  note: 'Амбиция: идем при сильном письме' },
    match:  { tone: 'success', label: 'Match', cap: 'Топ-30',  note: 'Цель: профиль проходит уверенно' },
    safety: { tone: 'info',    label: 'Safety', cap: 'Топ-100', note: 'Опора: надежная подстраховка' },
  };
  const countTier = (t) => UNIS.filter((u) => u.category === t).length;

  // ── Метрики готовности (разбор точки А) ─────────────────────────────────
  const METRICS = [
    { label: 'Академика', value: 78 },
    { label: 'Язык',      value: 64 },
    { label: 'Документы', value: 52 },
    { label: 'Сроки',     value: 70 },
  ];

  // ── Сильные / слабые стороны ────────────────────────────────────────────
  const STRENGTHS = [
    { title: 'Олимпиадная информатика', body: 'Региональная олимпиада совпадает с направлением — заметный плюс в профиле.' },
    { title: 'Готовый HSK 4', body: 'Язык уже на уровне, который открывает часть программ и грантов без долгой раскачки.' },
    { title: 'Ровная академика', body: 'Средний балл 4.6 проходит порог большинства целевых вузов.' },
    { title: 'Ясная мотивация', body: 'Понятное направление облегчает мотивационное письмо и интервью.' },
  ];
  const WEAKNESSES = [
    { title: 'Письмо пока шаблонное', body: 'Мотивационное письмо не заточено под конкретный вуз — это снижает шанс на грант.' },
    { title: 'Нет международных проектов', body: 'В портфолио не хватает публичного проекта, который выделяет среди сильных кандидатов.' },
    { title: 'HSK можно поднять выше', body: 'Переход к HSK 5 к подаче расширит выбор программ и категорию грантов.' },
  ];

  // ── Зоны роста = что улучшить (каждая связана с продуктом, пробный режим) ─
  const GROWTH_GAIN = { warning: 'Сильно влияет', ochre: 'Заметно влияет', info: 'Расширяет выбор' };
  const GROWTH_BODY = {
    'Мотивационное письмо': 'Сильное письмо под конкретный вуз заметно поднимает шанс на грант. Разберем структуру и перепишем вместе.',
    'Портфолио проектов': 'Один публичный проект выделяет среди сильных кандидатов. Покажем, что и как собрать.',
    'HSK 5 к подаче': 'Переход к HSK 5 открывает больше программ и категорию грантов. Системные занятия с трекером.',
  };
  const GROWTH = (DIAG.growthZones || []).map((g) => ({
    title: g.title, product: g.product, tone: g.tone,
    gain: GROWTH_GAIN[g.tone] || 'Влияет',
    body: GROWTH_BODY[g.title] || 'Закроем эту зону роста по плану, шаг за шагом.',
  }));

  // ── Стратегия (шаги) ────────────────────────────────────────────────────
  const STRATEGY = {
    headline: 'Опора на match-вузы + одна амбиция',
    steps: [
      'Берем match-вузы (топ-30) как основную опору — туда профиль проходит уверенно.',
      'Держим один reach как амбицию (топ-10): идем при сильном письме, без давления на результат.',
      'Грант CSC — приоритет; дублируем провинциальной стипендией, чтобы не зависеть от одного источника.',
      'Письмо и портфолио закрываем заранее, не оставляя на дедлайны подачи.',
    ],
  };

  // ── Статусы документов ──────────────────────────────────────────────────
  const DOC_STATUS = {
    accepted:  { tone: 'success', label: 'Принят' },
    in_review: { tone: 'info',    label: 'На проверке' },
    uploaded:  { tone: 'info',    label: 'Загружен' },
    needs_fix: { tone: 'warning', label: 'Нужно исправить' },
    awaiting:  { tone: 'neutral', label: 'Ожидается' },
  };

  // ── Кольцо шанса (SVG, свет внутри через токены — зеркалит эталон) ───────
  function Ring(props) {
    const { pct = 0 } = props;
    const r = 64, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return h('div', { className: 'ec-ring' },
      h('svg', { width: 150, height: 150, viewBox: '0 0 150 150' },
        h('circle', { cx: 75, cy: 75, r, fill: 'none', stroke: 'rgba(43,143,255,.16)', strokeWidth: 13 }),
        h('circle', {
          cx: 75, cy: 75, r, fill: 'none', stroke: 'url(#diagRing)', strokeWidth: 13, strokeLinecap: 'round',
          strokeDasharray: c, strokeDashoffset: off, style: { transition: 'stroke-dashoffset .9s var(--ease-out)' },
        }),
        h('defs', null, h('linearGradient', { id: 'diagRing', x1: '0', y1: '0', x2: '1', y2: '1' },
          h('stop', { offset: '0', stopColor: 'var(--violet-2)' }),
          h('stop', { offset: '1', stopColor: 'var(--violet-deep)' })))),
      h('div', { className: 'ec-ring__c' },
        h('div', { className: 'ec-ring__v u-tnum' }, pct + '%'),
        h('div', { className: 'ec-ring__l' }, 'шанс')));
  }

  // ── Сайдбар (слой 1) — зеркалит эталон, активна «Диагностика» ───────────
  function Rail(props) {
    const { onHelp, onSettings } = props;
    const navItems = [
      { icon: Ic.Home, label: 'Главная', to: '/student' },
      { icon: Ic.Doc, label: 'Документы', to: '/documents' },
      { icon: Ic.Book, label: 'Обучение', to: '/learn' },
      { icon: Ic.Star, label: 'Гранты', to: '/diagnostics' },
      { icon: Ic.Target, label: 'Диагностика', to: '/diagnostics', active: true },
      { icon: Ic.Flag, label: 'Достижения', onClick: onSettings },
    ];
    const navEl = (it, i) => {
      const cls = 'ec-nav__a' + (it.active ? ' is-active' : '');
      const inner = [
        h('span', { key: 'i', style: { display: 'inline-flex' } }, h(it.icon, { size: 20 })),
        h('span', { key: 'l' }, it.label),
      ];
      if (it.to && Link) return h(Link, { key: i, to: it.to, className: cls }, inner);
      return h('button', { key: i, type: 'button', className: cls, onClick: it.onClick }, inner);
    };
    return h('aside', { className: 'ec-rail', 'aria-label': 'Навигация' },
      h(Link ? Link : 'a', Object.assign({ className: 'ec-logo' }, Link ? { to: '/student' } : {}),
        h('span', { className: 'ec-logo__m' }, h(Ic.Compass, { size: 19 })),
        h('span', null,
          h('span', { className: 'ec-logo__t', style: { display: 'block' } }, 'EastSide'),
          h('span', { className: 'ec-logo__s' }, 'поступление в Китай'))),
      h('nav', { className: 'ec-nav' }, navItems.map(navEl)),
      h('div', { className: 'ec-rail__sp' }),
      h('div', { className: 'ec-pcard' },
        h('span', { className: 'ec-pcard__a' }, h('img', { src: 'assets/mascot-cut.png', alt: '' })),
        h('span', { className: 'ec-pcard__on', 'aria-hidden': 'true' }),
        h('div', null,
          h('div', { className: 'ec-pcard__n' }, STUDENT.name || 'Ученик'),
          h('div', { className: 'ec-pcard__r' }, STUDENT.grade || ''))),
      h('button', { type: 'button', className: 'ec-mini', onClick: onHelp },
        h(Ic.Chat, { size: 18 }),
        h('div', null, h('b', null, 'Нужна помощь?'), h('span', null, 'Напиши куратору'))),
      ThemeToggle ? h('div', { className: 'ec-theme' },
        h(Ic.Sun, { size: 17 }),
        h('span', null, 'Тема оформления'),
        h('span', { className: 'ec-theme__sw' }, h(ThemeToggle, { variant: 'cycle' }))) : null,
      h('button', { type: 'button', className: 'ec-mini', onClick: onSettings, style: { marginTop: '2px' } },
        h(Ic.Settings, { size: 18 }), h('b', null, 'Настройки')));
  }

  function Diagnostics() {
    const [trialFor, setTrialFor] = useState(null);   // зона роста → модалка пробного режима
    const [info, setInfo] = useState(null);            // {title, body[]} — помощь/настройки/уведомления
    const [article, setArticle] = useState(null);      // справка по вузу (попап)
    const [assistOpen, setAssistOpen] = useState(false);

    const verdictOk = !!DIAG.verdict;
    const chance = DIAG.chancePct || 0;
    const chanceTone = chance >= 70 ? 'Хорошие шансы' : chance >= 45 ? 'Реальные шансы' : 'Шансы есть, поработаем';

    const startTrial = (zone) => {
      setTrialFor(null);
      toast({ tone: 'success', title: 'Пробный режим открыт', text: (zone.product || 'Продукт') + ' — первый шаг уже доступен в обучении. Оплата не нужна.' });
    };

    // дорожная карта: на какую веху ведет «Что дальше» (текущая или первая)
    const curStage = ROADMAP7.find((s) => s.status === 'current') || ROADMAP7[0] || null;

    // ── Заголовок секции (.ec-sec) ───────────────────────────────────────
    const secHead = (title, opts) => {
      const o = opts || {};
      return h('div', { className: 'ec-sec' },
        h('span', { className: 'ec-sec__t' }, title),
        o.count != null ? h('span', { className: 'ec-sec__c u-tnum' }, o.count) : null,
        o.allLabel ? h('button', { type: 'button', className: 'ec-sec__all', onClick: o.onAll }, o.allLabel) : null);
    };

    // ── HERO ─────────────────────────────────────────────────────────────
    const hero = h('div', { className: 'ec-hero' },
      h('div', { className: 'ec-hero__l' },
        h('span', { className: 'ec-pill' }, 'Заключение готово · проверено куратором'),
        h('div', { className: 'ec-hero__t' }, DIAG.verdict || 'Сильный кандидат на вузы Китая'),
        h('div', { className: 'ec-hero__ok' },
          h('span', { className: 'c' }, h(Ic.Check, { size: 14 })),
          chanceTone),
        h('div', { className: 'ec-hero__d' },
          STUDENT.grade + ' · ' + (STUDENT.direction || 'Китай') +
          '. Разбор честный: и сильные стороны, и то, над чем работаем. Без обещаний и дожима.'),
        h('div', { className: 'ec-hero__mini' },
          h('div', { className: 'ec-mstat' },
            h('span', { className: 'ec-mstat__i' }, h(Ic.Target, { size: 19 })),
            h('div', null,
              h('div', { className: 'ec-mstat__l' }, 'Шанс поступления'),
              h('div', { className: 'ec-mstat__v u-tnum' }, chance + '%'))),
          h('div', { className: 'ec-mstat' },
            h('span', { className: 'ec-mstat__i' }, h(Ic.Cap, { size: 19 })),
            h('div', null,
              h('div', { className: 'ec-mstat__l' }, 'Вузов в подборе'),
              h('div', { className: 'ec-mstat__v u-tnum' }, UNIS.length))))),
      h('div', { className: 'ec-hero__r' },
        h('div', { className: 'ec-hero__art', 'aria-hidden': 'true' }, h('img', { src: 'assets/mountain-light.png', alt: '' })),
        h(Ring, { pct: chance })));

    // ── Точка А / Точка Б ────────────────────────────────────────────────
    const pointCard = (icon, cap, text, hint) => h('div', { className: 'ec-card', style: { padding: '24px' } },
      h('div', { className: 'u-flex u-items-center u-gap-3' },
        h('span', { className: 'es-assist-ic', 'aria-hidden': 'true' }, h(icon, { size: 20 })),
        h('div', null,
          h('div', { className: 'es-section-label' }, cap),
          h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)', color: 'var(--ink)', marginTop: '2px' } }, hint))),
      h('p', { className: 'u-prose', style: { marginTop: 'var(--sp-3)', color: 'var(--ink-soft)' } }, text));
    const pointBlock = h(React.Fragment, null,
      secHead('Где ты сейчас и куда идем'),
      h('div', { className: 'u-cols-2' },
        pointCard(Ic.Map, 'Точка А', DIAG.pointA, 'Где ты сейчас'),
        pointCard(Ic.Flag, 'Точка Б', DIAG.pointB, 'Куда идем')));

    // ── Разбор шанса (метрики + 3 категории) ─────────────────────────────
    const chanceBlock = h(React.Fragment, null,
      secHead('Из чего сложился шанс'),
      h('div', { className: 'ec-card', style: { padding: '24px' } },
        h('div', { className: 'u-cols-2' },
          METRICS.map((mt) => h(ProgressBar, { key: mt.label, value: mt.value, tone: 'jade', label: mt.label, showPct: true }))),
        h('div', { className: 'u-cols-3', style: { marginTop: 'var(--sp-5)' } },
          ['reach', 'match', 'safety'].map((t) => {
            const T = TIER[t];
            return h(Card, { key: t, variant: 'inset' },
              h('div', { className: 'u-flex u-items-center u-justify-between u-gap-2' },
                h('div', { className: 'es-section-label' }, T.cap),
                h(Badge, { tone: T.tone, num: true }, countTier(t))),
              h('p', { className: 'u-prose', style: { fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-2)', color: 'var(--ink-soft)' } }, T.note));
          }))));

    // ── Подбор вузов (reach/match/safety, реальные, с иероглифами) ────────
    const uniCard = (u) => {
      const T = TIER[u.category] || TIER.match;
      return h(Card, { key: u.id, variant: 'inset' },
        h('div', { className: 'u-flex u-items-start u-justify-between u-gap-3 u-wrap' },
          h('div', { key: 'n' },
            h('div', { className: 'u-flex u-items-baseline u-gap-2 u-wrap' },
              h('h3', { className: 'e-card__title' }, u.name),
              h('span', { lang: 'zh', className: 'u-arkhip', style: { color: 'var(--jade-ink)', fontSize: 'var(--fs-lg)' } }, u.cn)),
            h('div', { className: 'u-flex u-items-center u-gap-2 u-wrap', style: { marginTop: 'var(--sp-1)', color: 'var(--ink-soft)', fontSize: 'var(--fs-sm)' } },
              h('span', { className: 'u-flex u-items-center u-gap-1' }, h(Ic.Pin, { size: 14 }), u.city),
              h('span', null, '·'),
              h('span', null, u.grant))),
          h(Badge, { tone: T.tone, key: 'tier' }, T.label + ' · ' + T.cap)),
        h('div', { className: 'u-flex u-items-center u-gap-4 u-wrap', style: { marginTop: 'var(--sp-4)' } },
          h('div', { className: 'u-grow', style: { minWidth: '180px' }, key: 'p' },
            h(ProgressBar, { value: u.chancePct, tone: 'jade', label: 'Шанс зачисления', showPct: true })),
          h('div', { key: 'g' },
            h('div', { className: 'es-section-label' }, 'Грант'),
            h('div', { className: 'u-tnum', style: { marginTop: '2px', color: 'var(--ink)', fontWeight: 'var(--fw-semibold)' } }, u.grant))),
        h('div', { style: { marginTop: 'var(--sp-3)' } },
          h(Button, { variant: 'ghost', size: 'sm', iconRight: Ic.ArrowUpRight, onClick: () => setArticle(u) }, 'Подробнее о вузе')));
    };
    const uniBlock = h(React.Fragment, null,
      secHead('Куда реально поступить', { count: UNIS.length + ' вуза', allLabel: 'Весь подбор →', onAll: () => nav('/result') }),
      h('p', { className: 'u-prose', style: { margin: '-8px 2px 16px', color: 'var(--ink-soft)', fontSize: 'var(--fs-sm)', maxWidth: '62ch' } },
        'Только реальные вузы Китая из базы. Разложили по уровню риска: амбиция, цель, подстраховка.'),
      h('div', { className: 'u-stack-3' }, UNIS.map(uniCard)));

    // ── Сильные стороны ──────────────────────────────────────────────────
    const strengthsBlock = h(React.Fragment, null,
      secHead('На что опираемся'),
      h('div', { className: 'ec-card', style: { padding: '24px' } },
        h('div', { className: 'u-cols-2' },
          STRENGTHS.map((s, i) => h('div', { key: i, className: 'u-flex u-items-start u-gap-3' },
            h('span', { 'aria-hidden': 'true', style: { color: 'var(--success-ink)', flexShrink: 0, marginTop: '1px' } }, h(Ic.CheckCircle, { size: 19 })),
            h('div', null,
              h('div', { style: { fontWeight: 'var(--fw-semibold)', color: 'var(--ink)' } }, s.title),
              h('p', { className: 'u-prose', style: { fontSize: 'var(--fs-sm)', marginTop: '2px', color: 'var(--ink-soft)' } }, s.body)))))));

    // ── Над чем работаем (слабые стороны) ────────────────────────────────
    const weakBlock = h(React.Fragment, null,
      secHead('Над чем работаем'),
      h('div', { className: 'u-stack-3' },
        WEAKNESSES.map((w, i) => h(Alert, { key: i, tone: 'warning', icon: Ic.AlertTriangle, title: w.title }, w.body))));

    // ── Что улучшить (зоны роста с пробным режимом → модалка) ─────────────
    const improveBlock = h(React.Fragment, null,
      secHead('Что улучшить', { count: GROWTH.length + (GROWTH.length === 1 ? ' зона' : ' зоны') }),
      h('p', { className: 'u-prose', style: { margin: '-8px 2px 16px', color: 'var(--ink-soft)', fontSize: 'var(--fs-sm)', maxWidth: '62ch' } },
        'Каждая зона роста связана с продуктом. Можно попробовать в пробном режиме, без оплаты.'),
      h('div', { className: 'u-stack-3' },
        GROWTH.map((z, i) => h(Card, { key: i, variant: 'inset' },
          h('div', { className: 'u-flex u-items-start u-justify-between u-gap-3 u-wrap' },
            h('div', { className: 'u-grow', key: 'l' },
              h('div', { className: 'u-flex u-items-center u-gap-2 u-wrap' },
                h('span', { 'aria-hidden': 'true', style: { color: 'var(--violet-deep)', display: 'inline-flex' } }, h(Ic.TrendUp, { size: 18 })),
                h('div', { style: { fontWeight: 'var(--fw-semibold)', color: 'var(--ink)' } }, z.title)),
              h('p', { className: 'u-prose', style: { fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-2)', color: 'var(--ink-soft)' } }, z.body)),
            h(Badge, { tone: 'jade', icon: Ic.Bolt, key: 'g' }, z.gain)),
          h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap', style: { marginTop: 'var(--sp-4)' } },
            h(Pill, { tone: 'neutral', key: 'p' }, z.product),
            h(Button, { variant: 'jade', size: 'sm', iconRight: Ic.ArrowRight, onClick: () => setTrialFor(z), key: 'b' }, 'Пробный режим'))))));

    // ── Стратегия (нумерованные шаги) ────────────────────────────────────
    const strategyBlock = h(React.Fragment, null,
      secHead('Рекомендуемая стратегия'),
      h('div', { className: 'ec-card', style: { padding: '24px' } },
        h('div', { style: { marginBottom: 'var(--sp-4)' } }, h(Pill, { tone: 'success' }, STRATEGY.headline)),
        h('div', { className: 'u-stack-3' },
          STRATEGY.steps.map((s, i) => h('div', { key: i, className: 'u-flex u-items-start u-gap-3' },
            h('span', {
              'aria-hidden': 'true',
              style: {
                flexShrink: 0, width: '28px', height: '28px', borderRadius: 'var(--r-pill)',
                background: 'var(--glow-sel-bg)', border: '1px solid var(--jade-line)', color: 'var(--violet-deep)',
                boxShadow: 'var(--glow-sel)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-sm)',
              },
            }, i + 1),
            h('p', { className: 'u-prose', style: { color: 'var(--ink)', marginTop: '3px', maxWidth: '60ch' } }, s))))));

    // ── Документы к подаче (таблица) ─────────────────────────────────────
    const docsBlock = h(React.Fragment, null,
      secHead('Документы к подаче', { allLabel: 'Открыть документы →', onAll: () => nav('/documents') }),
      h('div', { className: 'ec-card', style: { padding: '8px 8px' } },
        DOCS.length
          ? h(Table, {
            rowKey: 'id',
            columns: [
              { key: 'name', title: 'Документ' },
              { key: 'kind', title: 'Раздел' },
              { key: 'status', title: 'Статус', render: (r) => {
                const st = DOC_STATUS[r.status] || DOC_STATUS.awaiting;
                return h(Pill, { tone: st.tone }, st.label);
              } },
            ],
            rows: DOCS,
          })
          : h('p', { className: 'u-prose', style: { padding: 'var(--sp-4)', color: 'var(--ink-soft)' } },
            sectionBody('documents', 'Список документов появится после согласования стратегии.'))));

    // ── НИЗ · что дальше + все под контролем (.ec-bot) ───────────────────
    const botBlock = h('div', { className: 'ec-bot' },
      h('div', { className: 'ec-card ec-bcard' },
        h('div', { className: 'ec-bcard__b' },
          h('div', { className: 'ec-bcard__t' }, 'Что будет дальше?'),
          h('div', { className: 'ec-bcard__x' }, curStage
            ? 'Стратегия готова. Дальше — этап «' + curStage.title + '»: ' + ((curStage.zachem || '').split('.')[0] || 'идем по плану') + '.'
            : 'Стратегия готова. Дальше идем по дорожной карте — шаг за шагом до зачисления.'),
          h('button', { type: 'button', className: 'ec-bcard__a', onClick: () => nav('/student') },
            'Смотреть дорожную карту', h(Ic.ArrowUpRight, { size: 14 }))),
        h('span', { className: 'ec-bcard__ill', 'aria-hidden': 'true' }, h(Ic.Map, { size: 38 }))),
      h('div', { className: 'ec-card ec-bcard is-success' },
        h('div', { className: 'ec-bcard__b' },
          h('div', { className: 'ec-bcard__t' }, 'Все под контролем'),
          h('div', { className: 'ec-bcard__x' }, 'Это заключение — карта, а не приговор. Решение остается за тобой, а мы ведем по шагам.'),
          h('div', { className: 'ec-bcard__upd' }, 'Заключение проверено куратором')),
        h('span', { className: 'ec-bcard__ill', 'aria-hidden': 'true' }, h(Ic.CheckCircle, { size: 38 }))));

    // ── Мобильная нижняя нав ─────────────────────────────────────────────
    const bn = h('nav', { className: 'ec-bn', 'aria-label': 'Навигация' },
      [{ icon: Ic.Home, label: 'Главная', to: '/student' },
       { icon: Ic.Doc, label: 'Документы', to: '/documents' },
       { icon: Ic.Book, label: 'Обучение', to: '/learn' },
       { icon: Ic.Target, label: 'Диагностика', to: '/diagnostics', active: true }].map((it, i) => {
        const cls = 'ec-bn__item' + (it.active ? ' is-active' : '');
        const inner = [h(it.icon, { size: 22, key: 'i' }), h('span', { key: 'l' }, it.label)];
        return (it.to && Link) ? h(Link, { key: i, to: it.to, className: cls }, inner)
          : h('button', { key: i, type: 'button', className: cls }, inner);
      }));

    const helpInfo = { title: 'Написать куратору', body: [
      'Куратор Елена Жукова на связи по будням. Напиши вопрос по заключению — разберем в чате сопровождения.',
      'Срочное лучше задать ассистенту: он подскажет с учетом твоего разбора и при необходимости передаст куратору.'] };
    const settingsInfo = { title: 'Настройки и достижения', body: [
      'Здесь будут профиль, уведомления и твои достижения по этапам.',
      'Раздел в проработке — пока всем управляет куратор. Если что-то нужно поменять, напиши в чат.'] };
    const notifInfo = { title: 'Уведомления', body: [
      'Тут появятся свежие события: статусы документов, дедлайны и сообщения куратора.',
      'Сейчас новых уведомлений нет.'] };

    return h(React.Fragment, null,
      h('div', { className: 'ec' },
        h(Rail, { onHelp: () => setInfo(helpInfo), onSettings: () => setInfo(settingsInfo) }),
        h('main', { id: 'main', className: 'ec-main' },
          h('div', { className: 'ec-top' },
            h('div', null,
              h('div', { className: 'ec-top__t' }, firstName + ', вот твой расклад'),
              h('div', { className: 'ec-top__s' }, 'Диагностическое заключение — куда поступить и что для этого сделать')),
            h('div', { className: 'ec-top__sp' }),
            h('button', { type: 'button', className: 'ec-icb', 'aria-label': 'Уведомления', onClick: () => setInfo(notifInfo) },
              h('span', { className: 'ec-icb__d', 'aria-hidden': 'true' }), h(Ic.Bell, { size: 19 }))),
          hero,
          pointBlock,
          chanceBlock,
          uniBlock,
          strengthsBlock,
          weakBlock,
          improveBlock,
          strategyBlock,
          docsBlock,
          botBlock),
        bn,
        h(AssistantFab, { onClick: () => setAssistOpen(true) })),

      // Модалка пробного режима зоны роста (живой CTA → тост)
      h(Modal, {
        open: !!trialFor, onClose: () => setTrialFor(null),
        title: trialFor ? trialFor.product : 'Пробный режим',
        footer: h(React.Fragment, null,
          h(Button, { variant: 'ghost', onClick: () => setTrialFor(null) }, 'Не сейчас'),
          h(Button, { variant: 'primary', iconRight: Ic.ArrowRight, onClick: () => startTrial(trialFor || {}) }, 'Открыть пробный шаг')),
      },
        trialFor ? h('div', { className: 'u-stack-3' },
          h('div', { className: 'u-flex u-items-center u-gap-3' },
            h('span', { className: 'es-assist-ic', 'aria-hidden': 'true' }, h(Ic.TrendUp, { size: 22 })),
            h('div', null,
              h('div', { style: { fontWeight: 'var(--fw-bold)', color: 'var(--ink)' } }, trialFor.title),
              h('div', { className: 'u-ink-soft', style: { fontSize: 'var(--fs-sm)' } }, 'Зона роста из твоего заключения'))),
          h('p', { className: 'u-ink-soft' }, trialFor.body),
          h(Alert, { tone: 'info', icon: Ic.Spark, title: 'Как работает пробный режим' },
            'Открываем первый шаг продукта бесплатно — посмотришь, как устроено, без обязательств и оплаты.')
        ) : null),

      // Попап «подробнее о вузе»
      h(Modal, { open: !!article, onClose: () => setArticle(null), title: article ? article.name : '' },
        article ? h('div', { className: 'u-stack-3' },
          h('div', { className: 'u-flex u-items-center u-gap-3 u-wrap' },
            h('span', { lang: 'zh', className: 'u-arkhip', style: { color: 'var(--jade-ink)', fontSize: 'var(--fs-2xl)' } }, article.cn),
            h(Badge, { tone: (TIER[article.category] || TIER.match).tone }, (TIER[article.category] || TIER.match).label + ' · ' + (TIER[article.category] || TIER.match).cap)),
          h('div', { className: 'u-flex u-items-center u-gap-2 u-wrap u-ink-soft', style: { fontSize: 'var(--fs-sm)' } },
            h('span', { className: 'u-flex u-items-center u-gap-1' }, h(Ic.Pin, { size: 14 }), article.city),
            h('span', null, '·'), h('span', null, 'Грант: ' + article.grant)),
          h(ProgressBar, { value: article.chancePct, tone: 'jade', label: 'Шанс зачисления по твоему профилю', showPct: true }),
          h('p', { className: 'u-ink-soft' },
            'Это короткая справка из подбора. На боевой платформе сюда подтянется профиль вуза: программы на английском и китайском, требования к HSK, дедлайны подачи и условия гранта CSC.'),
          h(Alert, { tone: 'info', icon: Ic.Spark, title: 'Хочешь разобрать этот вуз?' },
            'Спроси ассистента — он сравнит требования вуза с твоим профилем и подскажет, что усилить до подачи.')
        ) : null),

      // Попап-инфо (помощь / настройки / уведомления)
      h(Modal, { open: !!info, onClose: () => setInfo(null), title: info ? info.title : '' },
        info ? h('div', { className: 'u-stack-3' }, info.body.map((p, i) => h('p', { key: i, className: 'u-ink-soft' }, p))) : null),

      // Ассистент (контекст — текущая веха дорожной карты)
      h(AssistantPopup, { open: assistOpen, onClose: () => setAssistOpen(false), stage: curStage, seeds }));
  }

  EScreens.Diagnostics = Diagnostics;
})();
