/* ============================================================================
   EastSide — Обучение · Связка (window.EScreens.LearningProgress · #/learning/progress)
   ----------------------------------------------------------------------------
   Главная страница раздела «Обучение» как СВЯЗКА с учебной платформой, в языке
   эталона-дашборда (cabinet-student.jsx). Трёхслойка: тёмный рейл «Обучение» ->
   светлая молочная плашка -> панель-спутник «Твой темп» (гора + HSK-виджет).

   Содержимое плашки (по задаче):
     1. Прогресс языка / HSK — кольцо, путь по уровням, цель HSK 4.
     2. Деликатная геймификация (стрик, баллы, уроки, Duolingo).
     3. Темп за период (бар-чарт).
     4. РАСПИСАНИЕ-ПРЕВЬЮ — ближайшие занятия, связка -> /learning/schedule.
     5. ДОМАШКИ-ЗАГЛУШКА — текущее задание, полноценная сдача на платформе.
     6. Зоны роста + пробники (свернуто компактно).
     7. Баннер «перейти на учебную платформу».

   Все CTA живые (маршрут/тост/попап). Стиль — только токены/классы + EUI.
   Обе темы, без drop-shadow (глубина — inset/границы из токенов).
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const { AppShell, PathPanel, Banner, Button, Badge, Pill, ProgressBar, RingProgress, Table, EmptyState, Modal, Stat } = U;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  // --- Локальный mock (свой; общий mock.jsx не трогаем) --------------------
  const FALLBACK = {
    student: { name: 'Дима', role: 'Ученик · 10 класс' },
    language: {
      title: 'Китайский язык', level: 'HSK 3', levelPath: 'A0 -> HSK 3 пройдено, идешь к HSK 4',
      overallPct: 62, nextGoal: 'HSK 4', nextGoalPct: 41,
      duolingo: { league: 'Изумрудная лига', xpWeek: 1240, days: 18 },
    },
    game: { streakDays: 18, points: 3460, lessonsDone: 47, lessonsTotal: 76 },
    trend: { period: 'Последние 8 недель', bars: [38, 44, 35, 58, 61, 49, 72, 80], summary: 'Ровный рост. Последние две недели — лучший темп за период.' },
    // расписание-превью: ближайшие занятия (полное — на /learning/schedule)
    upcoming: [
      { id: 'u1', day: 'Сегодня', time: '17:00', subj: 'Китайский · иероглифика', track: 'language', teacher: 'Ли Вэй', live: true },
      { id: 'u2', day: 'Сегодня', time: '19:30', subj: 'Интервью · самопрезентация', track: 'interview', teacher: 'Марк Иванов', live: false },
      { id: 'u3', day: 'Завтра', time: '18:00', subj: 'HSK 4 · письмо и чтение', track: 'hsk', teacher: 'Аня Лебедева', live: false },
    ],
    // домашка-заглушка: текущее задание (сдача — на платформе)
    homework: { title: 'Составить 8 предложений с 把', lesson: 'Урок 7 · 把-конструкции', due: '14 июня, 21:00', daysLeft: 3 },
    modules: [
      { id: 'm1', title: 'Фонетика и пиньинь', status: 'done', score: 96 },
      { id: 'm2', title: 'Базовая лексика HSK 1-2', status: 'done', score: 91 },
      { id: 'm3', title: 'Иероглифика: 300 знаков', status: 'done', score: 88 },
      { id: 'm4', title: 'Грамматика HSK 3', status: 'current', score: 64 },
      { id: 'm5', title: 'Аудирование HSK 3-4', status: 'current', score: 52 },
      { id: 'm6', title: 'Чтение и порядок слов', status: 'upcoming', score: null },
    ],
    growth: [
      { id: 'g1', title: 'Счетные слова и измерения', note: 'Часто путаешь 个 / 张 / 本. Это закрывается одним фокус-блоком.', product: 'Интенсив «Грамматика без пробелов»' },
      { id: 'g2', title: 'Аудирование на скорости', note: 'На быстрой речи теряешь часть смысла. Помогут тренажеры на слух.', product: 'Модуль «Слушаю и понимаю»' },
    ],
    tests: [
      { id: 't1', name: 'Пробный HSK 3', date: '12 мая', score: 224, max: 300, verdict: 'pass' },
      { id: 't2', name: 'Внутренний срез · лексика', date: '28 апр', score: 86, max: 100, verdict: 'pass' },
      { id: 't3', name: 'Пробный HSK 4', date: '2 мая', score: 178, max: 300, verdict: 'attention' },
      { id: 't4', name: 'Диагностика под грант CSC', date: 'не сдан', score: null, max: null, verdict: 'upcoming' },
    ],
  };
  const D = (window.EMock && (EMock.learningProgressFull || EMock.learningConnect)) || FALLBACK;

  const VERDICT = { pass: { tone: 'success', label: 'Сдан' }, attention: { tone: 'warning', label: 'Близко' }, upcoming: { tone: 'neutral', label: 'Впереди' } };
  const MODULE_STATUS = {
    done: { tone: 'success', label: 'Пройден', icon: Ic.CheckCircle, ink: 'var(--success-ink)' },
    current: { tone: 'info', label: 'В работе', icon: Ic.Clock, ink: 'var(--info-ink)' },
    upcoming: { tone: 'neutral', label: 'Скоро', icon: Ic.Lock, ink: 'var(--plate-ink-sub)' },
  };
  // тон направления -> токен-цвет для точки/рейла расписания
  const TRACK_COLOR = { language: 'var(--jade)', hsk: 'var(--info)', duolingo: 'var(--ochre)', interview: 'var(--plate-ink-sub)' };

  function Styles() {
    return h('style', { id: 'es-lp-styles' }, `
      .es-lp-hero { display:flex; align-items:center; gap:var(--sp-6); flex-wrap:wrap; }
      .es-lp-hero__body { flex:1 1 220px; min-width:220px; }
      .es-lp-hero__kick { font-size:var(--fs-2xs); text-transform:uppercase; letter-spacing:var(--tracking-wide); color:var(--violet-deep, var(--jade-ink)); font-weight:var(--fw-bold); }
      .es-lp-hero__h { font-family:var(--font-display); font-size:var(--fs-2xl); color:var(--plate-ink); line-height:var(--lh-tight); margin:var(--sp-1) 0 0; }
      .es-lp-hero__sub { font-size:var(--fs-sm); color:var(--plate-ink-sub); margin:var(--sp-2) 0 0; max-width:40ch; line-height:var(--lh-relaxed); }
      .es-lp-goal { margin-top:var(--sp-5); max-width:420px; }
      .es-lp-goal__row { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:var(--sp-2); }
      .es-lp-goal__a { font-size:var(--fs-sm); color:var(--plate-ink-sub); }
      .es-lp-goal__b { font-size:var(--fs-sm); font-weight:var(--fw-bold); color:var(--jade-ink); font-variant-numeric:tabular-nums; }

      .es-lp-trend { display:flex; align-items:flex-end; gap:var(--sp-2); height:120px; }
      .es-lp-trend__bar { flex:1 1 0; min-width:4px; background:var(--jade); border-radius:var(--r-sm); opacity:.5; transition:height var(--dur-slow) var(--ease-out); }
      .es-lp-trend__bar:last-child { opacity:1; filter:drop-shadow(0 0 6px var(--jade-line)); }

      .es-lp-mod { display:flex; align-items:center; gap:var(--sp-3); padding:var(--sp-3) var(--sp-4);
        background:var(--plate-card); border:1px solid var(--plate-card-br); border-radius:var(--r-md); }
      .es-lp-mod + .es-lp-mod { margin-top:var(--sp-2); }
      .es-lp-mod__ic { display:inline-flex; flex-shrink:0; }
      .es-lp-mod__body { flex:1 1 auto; min-width:0; }
      .es-lp-mod__title { font-weight:var(--fw-semibold); color:var(--plate-ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .es-lp-mod__st { font-size:var(--fs-xs); color:var(--plate-ink-sub); margin-top:2px; }
      .es-lp-mod__score { font-family:var(--font-display); font-weight:var(--fw-bold); font-size:var(--fs-lg); color:var(--plate-ink); font-variant-numeric:tabular-nums; flex-shrink:0; }
      .es-lp-mod__score small { font-size:var(--fs-2xs); color:var(--plate-ink-sub); margin-left:2px; }

      /* расписание-превью: компактные строки занятий */
      .es-lp-up { display:flex; align-items:center; gap:var(--sp-4); padding:var(--sp-3) var(--sp-4); width:100%; text-align:left;
        background:var(--plate-card); border:1px solid var(--plate-card-br); border-radius:var(--r-md); color:var(--plate-ink); cursor:pointer;
        transition:border-color var(--dur-fast) var(--ease-out); }
      .es-lp-up + .es-lp-up { margin-top:var(--sp-2); }
      .es-lp-up:hover { border-color:var(--jade-line); }
      .es-lp-up--live { border-color:var(--jade-line); background:var(--glow-sel-bg); box-shadow:var(--glow-sel); }
      .es-lp-up__rail { width:3px; align-self:stretch; min-height:30px; border-radius:var(--r-pill); flex-shrink:0; }
      .es-lp-up__when { display:flex; flex-direction:column; min-width:6.5ch; flex-shrink:0; }
      .es-lp-up__time { font-family:var(--font-display); font-weight:var(--fw-bold); color:var(--plate-ink); font-variant-numeric:tabular-nums; }
      .es-lp-up__day { font-size:var(--fs-2xs); color:var(--plate-ink-sub); }
      .es-lp-up__body { flex:1 1 auto; min-width:0; }
      .es-lp-up__subj { font-weight:var(--fw-semibold); color:var(--plate-ink); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .es-lp-up__teacher { font-size:var(--fs-xs); color:var(--plate-ink-sub); margin-top:1px; }
      .es-lp-up__side { flex-shrink:0; display:flex; align-items:center; gap:var(--sp-2); color:var(--plate-ink-sub); }

      /* домашка-заглушка */
      .es-lp-hw { display:flex; align-items:center; gap:var(--sp-4); padding:var(--sp-4) var(--sp-5);
        background:var(--plate-card); border:1px dashed var(--plate-card-br); border-radius:var(--r-lg); flex-wrap:wrap; }
      .es-lp-hw__ic { display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:var(--r-md);
        background:var(--jade-soft); color:var(--jade-ink); box-shadow:var(--glow-chip); flex-shrink:0; }
      .es-lp-hw__body { flex:1 1 220px; min-width:0; }
      .es-lp-hw__title { font-weight:var(--fw-bold); color:var(--plate-ink); font-size:var(--fs-base); }
      .es-lp-hw__meta { font-size:var(--fs-xs); color:var(--plate-ink-sub); margin-top:3px; }
      .es-lp-hw__meta b { color:var(--plate-ink); font-weight:var(--fw-semibold); }
      .es-lp-hw__act { flex-shrink:0; }

      .es-lp-growth { padding:var(--sp-4); background:var(--ochre-soft); border:1px solid var(--ochre); border-left:3px solid var(--ochre); border-radius:var(--r-md); }
      .es-lp-growth + .es-lp-growth { margin-top:var(--sp-3); }
      .es-lp-growth__h { display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-1); }
      .es-lp-growth__ic { color:var(--ochre-ink); display:inline-flex; }
      .es-lp-growth__title { font-weight:var(--fw-semibold); color:var(--plate-ink); }
      .es-lp-growth__note { font-size:var(--fs-sm); color:var(--plate-ink-sub); margin:0; line-height:var(--lh-normal); }
      .es-lp-growth__foot { display:flex; align-items:center; gap:var(--sp-3); flex-wrap:wrap; margin-top:var(--sp-3); }
      .es-lp-growth__prod { font-size:var(--fs-xs); color:var(--plate-ink-sub); }
    `);
  }

  function LearningProgress() {
    const lang = D.language, game = D.game, trend = D.trend;
    const [platformOpen, setPlatformOpen] = useState(false);
    const ping = (title, text, tone) => { if (window.EToast) window.EToast.push({ tone: tone || 'info', title, text }); };
    const openPlatform = () => setPlatformOpen(true);

    const rail = {
      brand: { name: 'EastSide', sub: 'Учебная связка', mark: 'E' },
      profile: { name: D.student.name, role: 'Обучение', mascot: 'assets/mascot-cut.png' },
      items: [
        { icon: Ic.TrendUp, label: 'Прогресс', to: '/learning/progress', active: true },
        { icon: Ic.Calendar, label: 'Расписание', to: '/learning/schedule' },
        { icon: Ic.Book, label: 'Урок', to: '/learning/lesson' },
        { icon: Ic.Home, label: 'Мой кабинет', to: '/student' },
        { icon: Ic.Spark, label: 'Ассистент', to: '/assistant' },
      ],
      footer: [{ icon: Ic.Doc, label: 'Документы', onClick: () => nav('/documents') }],
      onLogout: () => nav('/auth'),
    };

    // --- Панель-спутник «Твой темп» (HSK + стрик) --------------------------
    const panel = h(PathPanel, {
      kicker: 'Твой темп',
      title: 'Путь к ' + lang.nextGoal,
      progress: lang.overallPct / 100,
      reached: lang.overallPct >= 100,
      pct: lang.overallPct,
      gleamCap: 'Язык в целом',
      steps: [
        { n: 1, icon: Ic.Check, label: 'HSK 3', val: 'пройден', status: 'done' },
        { label: 'HSK 4', val: lang.nextGoalPct + '%', status: 'active', onClick: () => ping('HSK 4', 'Готовность к следующему уровню — ' + lang.nextGoalPct + '%.') },
        { label: 'HSK 5', status: 'upcoming' },
      ],
      widget: { head: 'Учебная платформа', text: 'Курс, тренажеры и пробники — на отдельной платформе обучения.', go: 'Перейти к платформе', onClick: openPlatform },
    },
      h('div', { className: 'es-panel-hsk', key: 'hsk' },
        h('div', { className: 'es-panel-hsk__top' },
          h('span', { className: 'es-panel-hsk__label' }, lang.level + ' -> ' + lang.nextGoal),
          h('span', { className: 'es-panel-hsk__pct u-tnum' }, lang.nextGoalPct + '%')),
        h('div', { className: 'es-panel-hsk__track' }, h('div', { className: 'es-panel-hsk__fill', style: { width: lang.nextGoalPct + '%' } })),
        h('div', { className: 'es-panel-hsk__meta' }, game.streakDays + ' дней подряд · ' + game.lessonsDone + ' из ' + game.lessonsTotal + ' уроков'))
    );

    // --- Бар-чарт тренда ---------------------------------------------------
    const maxBar = Math.max.apply(null, trend.bars.concat([1]));

    return h(React.Fragment, null,
      h(AppShell, { rail, panel },
        h(Styles, { key: 'styles' }),
        h('div', { className: 'e-plate__kicker', key: 'k' }, 'Обучение'),
        h('h1', { className: 'e-plate__h1', style: { marginTop: 'var(--sp-2)' }, key: 'h1' }, 'Твое обучение'),
        h('p', { className: 'e-plate__sub', key: 'sub' },
          'Связка с учебной платформой: где ты по языку, ближайшие занятия и текущая домашка. Уроки и тренажеры — на платформе, обзор и прогресс — тут.'),

        // hero: кольцо языка + путь
        h('section', { className: 'e-plate-card', key: 'hero' },
          h('div', { className: 'es-lp-hero' },
            h(RingProgress, { value: lang.overallPct, size: 120, stroke: 11, label: lang.overallPct + '%', key: 'ring' }),
            h('div', { className: 'es-lp-hero__body', key: 'b' },
              h('div', { className: 'es-lp-hero__kick' }, lang.title),
              h('div', { className: 'es-lp-hero__h' }, 'Ты на уровне ', lang.level),
              h('p', { className: 'es-lp-hero__sub' }, lang.levelPath),
              h('div', { className: 'es-lp-goal' },
                h('div', { className: 'es-lp-goal__row' },
                  h('span', { className: 'es-lp-goal__a' }, 'До цели ' + lang.nextGoal),
                  h('span', { className: 'es-lp-goal__b u-tnum' }, lang.nextGoalPct + '%')),
                h(ProgressBar, { value: lang.nextGoalPct, tone: 'jade' }))))),

        // геймификация — деликатно
        h('div', { key: 'stats', style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 'var(--sp-3)', marginTop: 'var(--sp-6)' } },
          h(Stat, { label: 'Дней подряд', value: game.streakDays, unit: 'дн', bordered: true, tone: 'jade', delta: 'не прерывай', deltaTone: 'pos' }),
          h(Stat, { label: 'Баллы', value: game.points.toLocaleString('ru-RU'), bordered: true }),
          h(Stat, { label: 'Уроки', value: game.lessonsDone, unit: 'из ' + game.lessonsTotal, bordered: true }),
          h(Stat, { label: 'Duolingo', value: lang.duolingo.xpWeek, unit: 'XP', bordered: true, delta: lang.duolingo.league, deltaTone: 'pos' })),

        // РАСПИСАНИЕ-ПРЕВЬЮ — ближайшие занятия, связка на расписание
        h('section', { className: 'e-plate-card', key: 'sched' },
          h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
            h('div', null,
              h('div', { className: 'e-plate-card__label' }, 'Ближайшие занятия'),
              h('p', { className: 'e-plate-card__hint' }, 'Превью расписания — полную неделю смотри в разделе «Расписание».')),
            h(Button, { variant: 'secondary', size: 'sm', iconRight: Ic.ArrowRight, onClick: () => nav('/learning/schedule') }, 'Все расписание')),
          h('div', { style: { marginTop: 'var(--sp-4)' } },
            (D.upcoming || []).length
              ? (D.upcoming).map((u) => h('button', {
                  key: u.id, type: 'button',
                  className: 'es-lp-up' + (u.live ? ' es-lp-up--live' : ''),
                  onClick: () => u.live ? openPlatform() : nav('/learning/schedule'),
                },
                  h('span', { className: 'es-lp-up__rail', 'aria-hidden': 'true', style: { background: TRACK_COLOR[u.track] || 'var(--plate-ink-sub)' }, key: 'r' }),
                  h('span', { className: 'es-lp-up__when', key: 'w' },
                    h('span', { className: 'es-lp-up__time' }, u.time),
                    h('span', { className: 'es-lp-up__day' }, u.day)),
                  h('span', { className: 'es-lp-up__body', key: 'b' },
                    h('span', { className: 'es-lp-up__subj' }, u.subj),
                    h('span', { className: 'es-lp-up__teacher' }, u.teacher)),
                  h('span', { className: 'es-lp-up__side', key: 's' },
                    u.live ? h(Pill, { tone: 'info', key: 'p' }, 'Идет сейчас') : h(Ic.ChevronRight, { size: 18, key: 'c' }))))
              : h(EmptyState, { icon: Ic.Calendar, title: 'Занятий пока нет', text: 'Куратор добавит занятия в расписание.' }))),

        // ДОМАШКИ-ЗАГЛУШКА — текущее задание, сдача на платформе
        h('section', { className: 'e-plate-card', key: 'hw' },
          h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
            h('div', null,
              h('div', { className: 'e-plate-card__label' }, 'Домашнее задание'),
              h('p', { className: 'e-plate-card__hint' }, 'Текущая домашка по уроку. Сдача — на учебной платформе.')),
            h(Badge, { tone: 'jade', key: 'b' }, 'Скоро на платформе')),
          D.homework
            ? h('div', { className: 'es-lp-hw', style: { marginTop: 'var(--sp-4)' } },
                h('span', { className: 'es-lp-hw__ic', 'aria-hidden': 'true', key: 'i' }, h(Ic.Book, { size: 22 })),
                h('div', { className: 'es-lp-hw__body', key: 'b' },
                  h('div', { className: 'es-lp-hw__title' }, D.homework.title),
                  h('div', { className: 'es-lp-hw__meta' },
                    D.homework.lesson, ' · до ', h('b', null, D.homework.due),
                    D.homework.daysLeft != null ? ' · осталось ' + D.homework.daysLeft + ' дн' : '')),
                h('div', { className: 'es-lp-hw__act', key: 'a' },
                  h(Button, { variant: 'primary', size: 'sm', iconRight: Ic.ArrowRight, onClick: openPlatform }, 'Сдать на платформе')))
            : h('div', { style: { marginTop: 'var(--sp-4)' } }, h(EmptyState, { icon: Ic.CheckCircle, title: 'Домашек нет', text: 'Все задания сданы — отдыхай до следующего урока.' }))),

        // тренд за период
        h('section', { className: 'e-plate-card', key: 'trend' },
          h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
            h('div', null,
              h('div', { className: 'e-plate-card__label' }, 'Темп за период'),
              h('p', { className: 'e-plate-card__hint' }, trend.summary)),
            h(Pill, { tone: 'success' }, trend.period)),
          h('div', { className: 'es-lp-trend', style: { marginTop: 'var(--sp-5)' }, 'aria-hidden': 'true' },
            trend.bars.map((v, i) => h('span', { key: i, className: 'es-lp-trend__bar', style: { height: Math.max(8, Math.round((v / maxBar) * 100)) + '%' } })))),

        // модули программы
        h('section', { className: 'e-plate-card', key: 'mods' },
          h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
            h('div', null,
              h('div', { className: 'e-plate-card__label' }, 'Модули программы'),
              h('p', { className: 'e-plate-card__hint' }, game.lessonsDone + ' из ' + game.lessonsTotal + ' уроков пройдено')),
            h(Badge, { tone: 'jade', icon: Ic.Cap }, game.lessonsDone + ' / ' + game.lessonsTotal)),
          h('div', { style: { marginTop: 'var(--sp-4)' } },
            D.modules.map((m) => {
              const st = MODULE_STATUS[m.status] || MODULE_STATUS.upcoming;
              return h('div', { key: m.id, className: 'es-lp-mod' },
                h('span', { 'aria-hidden': 'true', className: 'es-lp-mod__ic', style: { color: st.ink }, key: 'i' }, h(st.icon, { size: 20 })),
                h('div', { className: 'es-lp-mod__body', key: 'b' },
                  h('div', { className: 'es-lp-mod__title' }, m.title),
                  h('div', { className: 'es-lp-mod__st' }, st.label)),
                m.score != null
                  ? h('span', { className: 'es-lp-mod__score u-tnum', key: 's' }, m.score, h('small', null, '/100'))
                  : h(Pill, { tone: 'neutral', key: 's' }, 'не начат'));
            }))),

        // зоны роста
        h('section', { className: 'e-plate-card', key: 'growth' },
          h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
            h('div', null,
              h('div', { className: 'e-plate-card__label' }, 'Куда тянуться'),
              h('p', { className: 'e-plate-card__hint' }, 'Слабые темы — и чем их закрыть.')),
            h(Badge, { tone: 'neutral' }, 'Зоны роста')),
          D.growth.length
            ? h('div', { style: { marginTop: 'var(--sp-4)' } },
                D.growth.map((g) => h('div', { key: g.id, className: 'es-lp-growth' },
                  h('div', { className: 'es-lp-growth__h', key: 'h' },
                    h('span', { 'aria-hidden': 'true', className: 'es-lp-growth__ic', key: 'i' }, h(Ic.Target, { size: 16 })),
                    h('span', { className: 'es-lp-growth__title', key: 't' }, g.title)),
                  h('p', { className: 'es-lp-growth__note', key: 'n' }, g.note),
                  h('div', { className: 'es-lp-growth__foot', key: 'f' },
                    h(Button, { variant: 'secondary', size: 'sm', iconRight: Ic.ArrowRight, onClick: () => ping('Подбор подготовки', g.product + ' — куратор расскажет, как устроено.'), key: 'b' }, 'Попробовать'),
                    h('span', { className: 'es-lp-growth__prod', key: 'p' }, g.product)))))
            : h('div', { style: { marginTop: 'var(--sp-4)' } }, h(EmptyState, { icon: Ic.CheckCircle, title: 'Слабых мест нет', text: 'Темп ровный, разрывов по темам не видно.' }))),

        // пробники и тесты
        h('section', { className: 'e-plate-card', key: 'tests' },
          h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
            h('div', null,
              h('div', { className: 'e-plate-card__label' }, 'Пробники и тесты'),
              h('p', { className: 'e-plate-card__hint' }, 'Диагностика под грант CSC добавится, когда подойдет срок.')),
            h(Pill, { tone: 'neutral' }, 'История')),
          h('div', { style: { marginTop: 'var(--sp-4)' } },
            h(Table, {
              rowKey: 'id',
              columns: [
                { key: 'name', title: 'Тест' },
                { key: 'date', title: 'Дата' },
                { key: 'score', title: 'Результат', num: true, render: (r) => r.score == null
                  ? h('span', { style: { color: 'var(--plate-ink-sub)' } }, '—')
                  : h('span', { className: 'u-tnum', style: { fontWeight: 'var(--fw-bold)', color: 'var(--plate-ink)' } }, r.score, h('small', { style: { color: 'var(--plate-ink-sub)', fontWeight: 'var(--fw-regular)' } }, ' / ' + r.max)) },
                { key: 'verdict', title: 'Статус', num: true, render: (r) => { const v = VERDICT[r.verdict] || VERDICT.upcoming; return h(Pill, { tone: v.tone }, v.label); } },
              ],
              rows: D.tests,
            }))),

        // переход на учебную платформу
        h(Banner, { key: 'bn', tone: 'dark', kicker: 'Учебная платформа',
          title: 'Тренируйся на платформе',
          text: 'Тренажеры, пробники и разборы — на учебной платформе обучения. Прогресс собираем здесь, в кабинете.',
          cta: 'Открыть учебную платформу', onCta: openPlatform })
      ),

      // Модалка-заглушка перехода на учебную платформу
      h(Modal, { open: platformOpen, onClose: () => setPlatformOpen(false), title: 'Учебная платформа',
        footer: h(React.Fragment, null,
          h(Button, { variant: 'ghost', onClick: () => setPlatformOpen(false) }, 'Закрыть'),
          h(Button, { variant: 'primary', iconRight: Ic.ArrowRight, onClick: () => { setPlatformOpen(false); ping('Учебная платформа', 'Скоро откроем переход в один клик прямо отсюда.'); } }, 'Понятно')) },
        h('div', { className: 'u-stack-3' },
          h('p', { className: 'u-ink-soft' }, 'Видео-уроки, тренажеры и сдача домашних заданий вынесены на отдельную учебную платформу. Этот раздел — связка: прогресс, расписание и текущая домашка под рукой в кабинете.'),
          h('p', { className: 'u-ink-soft' }, 'Переход открывается по мере подключения твоего курса — куратор сообщит, когда будет готово.')))
    );
  }

  EScreens.LearningProgress = LearningProgress;
})();
