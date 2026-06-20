/* ============================================================================
   EastSide — Обучение · Расписание (window.EScreens.LearningSchedule · #/learning/schedule)
   ----------------------------------------------------------------------------
   Связующий блок к учебной платформе в языке «EastSide Dark». Трёхслойка как у
   эталона-дашборда: тёмный рейл «Обучение» -> светлая молочная плашка -> панель
   -спутник «Твой темп» (гора + бар + HSK-виджет). Главный вопрос экрана:
   «какие занятия на этой неделе и сколько ещё оплачено».

   Плашка: остаток оплаченных занятий (по направлениям), переключатель недели,
   недельный календарь со статусами и «перенести». Внизу — баннер-переход на
   полноценную учебную платформу. Всё из компонентов window.EUI + токены; своих
   хардкод-цветов нет, тема переключается на лету.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const { AppShell, PathPanel, Banner, Button, Badge, Pill, Avatar, Alert, ProgressBar, IconButton } = U;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  // --- Статусы занятия: пилюля + тон ---------------------------------------
  const LESSON_STATUS = {
    upcoming: { tone: 'neutral', label: 'Предстоит' },
    live:     { tone: 'info',    label: 'Идет сейчас' },
    done:     { tone: 'success', label: 'Завершено' },
    canceled: { tone: 'warning', label: 'Отменено' },
  };
  // тон направления для цветной точки/рейла слева
  const TRACK_TONE = { language: 'jade', hsk: 'info', duolingo: 'warning', interview: 'neutral' };

  // --- Локальный mock (свой; общий mock.jsx не трогаем) --------------------
  const FALLBACK = {
    viewer: { name: 'Дима', role: 'Ученик · 11 класс' },
    balance: [
      { id: 'language', name: 'Китайский язык', track: 'language', left: 18, total: 32, note: 'хватит до конца июля' },
      { id: 'hsk', name: 'Подготовка к HSK', track: 'hsk', left: 9, total: 16, note: 'идешь по плану' },
      { id: 'duolingo', name: 'Duolingo English', track: 'duolingo', left: 4, total: 24, note: 'осталось мало — пора продлить' },
      { id: 'interview', name: 'Подготовка к интервью', track: 'interview', left: 6, total: 8, note: 'стартовали недавно' },
    ],
  };
  const BAL = (window.EMock && EMock.scheduleBalance) || FALLBACK.balance;
  const VIEWER = (window.EMock && EMock.scheduleViewer) || FALLBACK.viewer;

  function makeWeeks() {
    const cur = {
      label: '9 — 15 июня', sub: 'Эта неделя',
      days: [
        { dow: 'Понедельник', date: '9 июня', today: false, lessons: [
          { id: 'm1', from: '17:00', to: '18:30', subj: 'Китайский · разговорная практика', track: 'language', teacher: { name: 'Ли Вэй', role: 'Преподаватель' }, status: 'done' } ] },
        { dow: 'Вторник', date: '10 июня', today: false, lessons: [
          { id: 't1', from: '18:00', to: '19:00', subj: 'HSK 4 · грамматика и аудирование', track: 'hsk', teacher: { name: 'Аня Лебедева', role: 'Куратор HSK' }, status: 'done' },
          { id: 't2', from: '20:00', to: '20:30', subj: 'Duolingo · отработка лексики', track: 'duolingo', teacher: { name: 'Бот EastSide', role: 'Тренажер' }, status: 'done' } ] },
        { dow: 'Среда', date: '11 июня', today: true, lessons: [
          { id: 'w1', from: '17:00', to: '18:30', subj: 'Китайский · иероглифика', track: 'language', teacher: { name: 'Ли Вэй', role: 'Преподаватель', online: true }, status: 'live' },
          { id: 'w2', from: '19:30', to: '20:15', subj: 'Подготовка к интервью · самопрезентация', track: 'interview', teacher: { name: 'Марк Иванов', role: 'Наставник по интервью' }, status: 'upcoming' } ] },
        { dow: 'Четверг', date: '12 июня', today: false, lessons: [
          { id: 'th1', from: '18:00', to: '19:00', subj: 'HSK 4 · письмо и чтение', track: 'hsk', teacher: { name: 'Аня Лебедева', role: 'Куратор HSK' }, status: 'upcoming' } ] },
        { dow: 'Пятница', date: '13 июня', today: false, lessons: [
          { id: 'f1', from: '17:00', to: '18:30', subj: 'Китайский · разговорная практика', track: 'language', teacher: { name: 'Ли Вэй', role: 'Преподаватель' }, status: 'canceled', cancelNote: 'Преподаватель перенес — куратор предложит новое время' } ] },
        { dow: 'Суббота', date: '14 июня', today: false, lessons: [] },
        { dow: 'Воскресенье', date: '15 июня', today: false, lessons: [] },
      ],
    };
    const next = {
      label: '16 — 22 июня', sub: 'Следующая неделя',
      days: [
        { dow: 'Понедельник', date: '16 июня', today: false, lessons: [
          { id: 'n-m1', from: '17:00', to: '18:30', subj: 'Китайский · разговорная практика', track: 'language', teacher: { name: 'Ли Вэй', role: 'Преподаватель' }, status: 'upcoming' } ] },
        { dow: 'Вторник', date: '17 июня', today: false, lessons: [
          { id: 'n-t1', from: '18:00', to: '19:00', subj: 'HSK 4 · пробный экзамен', track: 'hsk', teacher: { name: 'Аня Лебедева', role: 'Куратор HSK' }, status: 'upcoming' } ] },
        { dow: 'Среда', date: '18 июня', today: false, lessons: [] },
        { dow: 'Четверг', date: '19 июня', today: false, lessons: [
          { id: 'n-th1', from: '19:30', to: '20:15', subj: 'Подготовка к интервью · разбор вопросов', track: 'interview', teacher: { name: 'Марк Иванов', role: 'Наставник по интервью' }, status: 'upcoming' } ] },
        { dow: 'Пятница', date: '20 июня', today: false, lessons: [] },
        { dow: 'Суббота', date: '21 июня', today: false, lessons: [] },
        { dow: 'Воскресенье', date: '22 июня', today: false, lessons: [] },
      ],
    };
    const prev = {
      label: '2 — 8 июня', sub: 'Прошлая неделя',
      days: [
        { dow: 'Понедельник', date: '2 июня', today: false, lessons: [
          { id: 'p-m1', from: '17:00', to: '18:30', subj: 'Китайский · разговорная практика', track: 'language', teacher: { name: 'Ли Вэй', role: 'Преподаватель' }, status: 'done' } ] },
        { dow: 'Среда', date: '4 июня', today: false, lessons: [
          { id: 'p-w1', from: '17:00', to: '18:30', subj: 'Китайский · иероглифика', track: 'language', teacher: { name: 'Ли Вэй', role: 'Преподаватель' }, status: 'done' } ] },
        { dow: 'Четверг', date: '5 июня', today: false, lessons: [
          { id: 'p-th1', from: '18:00', to: '19:00', subj: 'HSK 4 · грамматика', track: 'hsk', teacher: { name: 'Аня Лебедева', role: 'Куратор HSK' }, status: 'done' } ] },
      ],
    };
    return [prev, cur, next];
  }
  const WEEKS = makeWeeks();
  const START_WEEK = 1;
  const LOW_LEFT = 5;

  // тон направления как var --
  const trackColorVar = { jade: 'var(--jade)', info: 'var(--info)', warning: 'var(--ochre)', neutral: 'var(--plate-ink-sub)' };

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  // --- Скоуп-стили экрана (только токены, 0 хардкода значений) --------------
  const STYLE_ID = 'es-ls-styles';
  function Styles() {
    return h('style', { id: STYLE_ID }, `
      .es-ls-bal { display:grid; gap:var(--sp-3); grid-template-columns:1fr; }
      @media(min-width:560px){ .es-ls-bal{ grid-template-columns:repeat(2,minmax(0,1fr)); } }
      .es-ls-bal__item { display:flex; flex-direction:column; gap:var(--sp-3); padding:var(--sp-4);
        background:var(--plate-card); border:1px solid var(--plate-card-br); border-radius:var(--r-md); }
      .es-ls-bal__top { display:flex; align-items:center; gap:var(--sp-2); }
      .es-ls-bal__dot { width:var(--sp-2); height:var(--sp-2); border-radius:var(--r-pill); flex-shrink:0; }
      .es-ls-bal__name { font-weight:var(--fw-semibold); color:var(--plate-ink); font-size:var(--fs-sm); }
      .es-ls-bal__count { margin-left:auto; font-family:var(--font-display); font-weight:var(--fw-bold); color:var(--plate-ink); font-size:var(--fs-lg); }
      .es-ls-bal__count small { font-weight:var(--fw-medium); color:var(--plate-ink-sub); font-size:var(--fs-xs); margin-left:var(--sp-1); }
      .es-ls-bal__note { font-size:var(--fs-xs); color:var(--plate-ink-sub); }

      .es-ls-week { display:flex; align-items:center; gap:var(--sp-2); flex-shrink:0; }
      .es-ls-week__label { font-family:var(--font-display); font-weight:var(--fw-bold); color:var(--plate-ink); font-size:var(--fs-base); min-width:13ch; text-align:center; }

      .es-ls-days > * + * { margin-top:var(--sp-5); }
      .es-ls-day__head { display:flex; align-items:baseline; gap:var(--sp-2); margin-bottom:var(--sp-3); }
      .es-ls-day__dow { font-family:var(--font-display); font-weight:var(--fw-bold); color:var(--plate-ink); font-size:var(--fs-md); }
      .es-ls-day__date { font-size:var(--fs-sm); color:var(--plate-ink-sub); }
      .es-ls-day--today .es-ls-day__dow { color:var(--jade-ink); }
      .es-ls-day__badge { margin-left:auto; }

      .es-ls-lesson { display:flex; align-items:center; gap:var(--sp-4); padding:var(--sp-3) var(--sp-4);
        border:1px solid var(--plate-card-br); border-radius:var(--r-md); background:var(--plate-card);
        transition:border-color var(--dur-fast) var(--ease-out); }
      .es-ls-lesson + .es-ls-lesson { margin-top:var(--sp-2); }
      .es-ls-lesson:hover { border-color:var(--jade-line); }
      .es-ls-lesson--live { border-color:var(--jade-line); background:var(--glow-sel-bg); box-shadow:var(--glow-sel); }
      .es-ls-lesson--canceled { opacity:.6; }
      .es-ls-lesson__time { display:flex; flex-direction:column; align-items:flex-start; min-width:6ch; flex-shrink:0; }
      .es-ls-lesson__from { font-family:var(--font-display); font-weight:var(--fw-bold); color:var(--plate-ink); font-size:var(--fs-base); font-variant-numeric:tabular-nums; }
      .es-ls-lesson__to { font-size:var(--fs-2xs); color:var(--plate-ink-sub); font-variant-numeric:tabular-nums; }
      .es-ls-lesson__rail { width:3px; align-self:stretch; min-height:34px; border-radius:var(--r-pill); flex-shrink:0; }
      .es-ls-lesson__body { min-width:0; flex:1 1 auto; }
      .es-ls-lesson__subj { font-weight:var(--fw-semibold); color:var(--plate-ink); font-size:var(--fs-base); }
      .es-ls-lesson__teacher { display:flex; align-items:center; gap:var(--sp-2); margin-top:var(--sp-1); font-size:var(--fs-sm); color:var(--plate-ink-sub); }
      .es-ls-lesson__side { display:flex; align-items:center; gap:var(--sp-3); flex-shrink:0; }
      .es-ls-empty { font-size:var(--fs-sm); color:var(--plate-ink-sub); padding:var(--sp-3) var(--sp-4);
        background:var(--plate-card); border:1px dashed var(--plate-card-br); border-radius:var(--r-md); }
      @media(max-width:560px){
        .es-ls-lesson { flex-wrap:wrap; }
        .es-ls-lesson__side { width:100%; justify-content:space-between; }
      }
    `);
  }

  // --- Карточка остатка по направлению -------------------------------------
  function BalanceItem(props) {
    const b = props.item;
    const tone = TRACK_TONE[b.track] || 'neutral';
    const pct = b.total ? Math.round((b.left / b.total) * 100) : 0;
    const low = b.left <= LOW_LEFT;
    return h('div', { className: 'es-ls-bal__item' },
      h('div', { className: 'es-ls-bal__top', key: 'top' },
        h('span', { className: 'es-ls-bal__dot', 'aria-hidden': 'true', style: { background: trackColorVar[tone] }, key: 'd' }),
        h('span', { className: 'es-ls-bal__name', key: 'n' }, b.name),
        h('span', { className: 'es-ls-bal__count u-tnum', key: 'c' }, b.left, h('small', { key: 's' }, '/ ' + b.total))),
      h(ProgressBar, { value: pct, tone: 'jade', size: 'sm', key: 'p' }),
      h('div', { className: 'es-ls-bal__note', key: 'note' },
        low ? 'Осталось ' + b.left + ' ' + plural(b.left, 'занятие', 'занятия', 'занятий') + ' — спокойно продли' : b.note)
    );
  }

  // --- Одно занятие --------------------------------------------------------
  function LessonRow(props) {
    const { lesson, onReschedule } = props;
    const st = LESSON_STATUS[lesson.status] || LESSON_STATUS.upcoming;
    const tone = TRACK_TONE[lesson.track] || 'neutral';
    const canMove = lesson.status === 'upcoming' || lesson.status === 'live';
    return h('div', { className: 'es-ls-lesson' + (lesson.status === 'live' ? ' es-ls-lesson--live' : '') + (lesson.status === 'canceled' ? ' es-ls-lesson--canceled' : '') },
      h('div', { className: 'es-ls-lesson__time', key: 'time' },
        h('span', { className: 'es-ls-lesson__from', key: 'f' }, lesson.from),
        h('span', { className: 'es-ls-lesson__to', key: 't' }, lesson.to)),
      h('span', { className: 'es-ls-lesson__rail', 'aria-hidden': 'true', style: { background: trackColorVar[tone] }, key: 'rail' }),
      h('div', { className: 'es-ls-lesson__body', key: 'body' },
        h('div', { className: 'es-ls-lesson__subj' }, lesson.subj),
        h('div', { className: 'es-ls-lesson__teacher' },
          h(Avatar, { name: lesson.teacher.name, size: 'sm', status: lesson.teacher.online ? true : undefined, key: 'a' }),
          h('span', { key: 'n' }, lesson.teacher.name),
          h('span', { 'aria-hidden': 'true', style: { opacity: .5 }, key: 'sep' }, '·'),
          h('span', { key: 'r' }, lesson.teacher.role)),
        lesson.status === 'canceled' && lesson.cancelNote
          ? h('div', { className: 'es-ls-lesson__teacher', key: 'cn', style: { color: 'var(--warning-ink)' } },
              h(Ic.Info, { size: 14, key: 'i' }), h('span', { key: 's' }, lesson.cancelNote))
          : null),
      h('div', { className: 'es-ls-lesson__side', key: 'side' },
        h(Pill, { tone: st.tone, key: 'p' }, st.label),
        canMove ? h(Button, { variant: 'ghost', size: 'sm', iconLeft: Ic.Calendar, onClick: () => onReschedule && onReschedule(lesson), key: 'b' }, 'Перенести') : null)
    );
  }

  function DayBlock(props) {
    const { day, onReschedule } = props;
    const count = (day.lessons || []).length;
    return h('div', { className: 'es-ls-day' + (day.today ? ' es-ls-day--today' : '') },
      h('div', { className: 'es-ls-day__head', key: 'head' },
        h('span', { className: 'es-ls-day__dow', key: 'd' }, day.dow),
        h('span', { className: 'es-ls-day__date', key: 'dt' }, day.date),
        day.today ? h('span', { className: 'es-ls-day__badge', key: 'tb' }, h(Badge, { tone: 'jade', key: 'b' }, 'Сегодня')) : null),
      count
        ? h('div', { key: 'lessons' }, day.lessons.map((l) => h(LessonRow, { key: l.id, lesson: l, onReschedule })))
        : h('div', { className: 'es-ls-empty', key: 'empty' }, 'Занятий нет — день свободен')
    );
  }

  function LearningSchedule() {
    const [weekIdx, setWeekIdx] = useState(START_WEEK);
    const week = WEEKS[weekIdx];

    const onReschedule = (lesson) => {
      if (window.EToast) window.EToast.push({
        tone: 'info', title: 'Запрос на перенос отправлен',
        text: 'Куратор предложит удобное время для занятия «' + lesson.subj.split(' · ')[0] + '».',
      });
    };

    // --- Рейл «Обучение» ---------------------------------------------------
    const rail = {
      brand: { name: 'EastSide', sub: 'Учебная связка', mark: 'E' },
      profile: { name: VIEWER.name, role: 'Обучение', mascot: 'assets/mascot-cut.png' },
      items: [
        { icon: Ic.TrendUp, label: 'Прогресс', to: '/learning/progress' },
        { icon: Ic.Calendar, label: 'Расписание', to: '/learning/schedule', active: true },
        { icon: Ic.Book, label: 'Урок', to: '/learning/lesson' },
        { icon: Ic.Home, label: 'Мой кабинет', to: '/student' },
        { icon: Ic.Spark, label: 'Ассистент', to: '/assistant' },
      ],
      footer: [{ icon: Ic.Doc, label: 'Документы', onClick: () => nav('/documents') }],
      onLogout: () => nav('/auth'),
    };

    // --- Панель-спутник «Твой темп» ----------------------------------------
    const weekTotal = week ? week.days.reduce((n, d) => n + (d.lessons ? d.lessons.length : 0), 0) : 0;
    const doneTotal = week ? week.days.reduce((n, d) => n + (d.lessons ? d.lessons.filter((l) => l.status === 'done').length : 0), 0) : 0;
    const weekPct = weekTotal ? Math.round((doneTotal / weekTotal) * 100) : 0;
    const lowest = BAL.reduce((m, b) => (b.left < m.left ? b : m), BAL[0]);

    const panel = h(PathPanel, {
      kicker: 'Твой темп',
      title: week ? week.sub : 'Неделя',
      progress: weekTotal ? doneTotal / weekTotal : 0,
      reached: weekTotal > 0 && doneTotal === weekTotal,
      pct: weekPct,
      gleamCap: 'Неделя пройдена',
      steps: WEEKS.map((w, i) => ({
        n: i + 1, label: w.sub,
        val: i === weekIdx ? 'смотришь' : '',
        status: i < weekIdx ? 'done' : i === weekIdx ? 'active' : 'upcoming',
        onClick: () => setWeekIdx(i),
      })),
      widget: { head: 'Учебная платформа', text: 'Уроки, тренажеры и материалы — на отдельной платформе обучения.', go: 'Перейти к урокам', to: '/learning/lesson' },
    },
      h('div', { className: 'es-panel-hsk', key: 'bal' },
        h('div', { className: 'es-panel-hsk__top' },
          h('span', { className: 'es-panel-hsk__label' }, 'Оплаченных занятий меньше всего'),
          h('span', { className: 'es-panel-hsk__pct u-tnum' }, lowest.left)),
        h('div', { className: 'es-panel-hsk__track' }, h('div', { className: 'es-panel-hsk__fill', style: { width: Math.round((lowest.left / lowest.total) * 100) + '%' } })),
        h('div', { className: 'es-panel-hsk__meta' }, lowest.name + ' · ' + lowest.note))
    );

    // --- Контент плашки ----------------------------------------------------
    const weekSwitch = h('div', { className: 'es-ls-week', key: 'sw' },
      h(IconButton, { icon: Ic.ChevronLeft, label: 'Прошлая неделя', size: 'sm', disabled: weekIdx <= 0, onClick: () => setWeekIdx((i) => Math.max(0, i - 1)), key: 'p' }),
      h('span', { className: 'es-ls-week__label', key: 'l' }, week ? week.label : '—'),
      h(IconButton, { icon: Ic.ChevronRight, label: 'Следующая неделя', size: 'sm', disabled: weekIdx >= WEEKS.length - 1, onClick: () => setWeekIdx((i) => Math.min(WEEKS.length - 1, i + 1)), key: 'n' })
    );

    const lowBalances = BAL.filter((b) => b.left <= LOW_LEFT);

    return h(AppShell, { rail, panel },
      h(Styles, { key: 'styles' }),
      h('div', { className: 'e-plate__kicker', key: 'k' }, 'Обучение'),
      h('h1', { className: 'e-plate__h1', style: { marginTop: 'var(--sp-2)' }, key: 'h1' }, 'Твое расписание'),
      h('p', { className: 'e-plate__sub', key: 'sub' },
        'Занятия по языку, HSK, Duolingo и подготовке к интервью. Не успеваешь ко времени — нажми «Перенести», куратор подберет новое.'),

      // остаток оплаченных занятий
      h('section', { className: 'e-plate-card', key: 'bal' },
        h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
          h('div', null,
            h('div', { className: 'e-plate-card__label' }, 'Оплаченные занятия'),
            h('p', { className: 'e-plate-card__hint' }, 'По направлениям — видно, на сколько ещё хватит.')),
          h(Badge, { tone: 'neutral' }, 'Абонементы')),
        h('div', { className: 'es-ls-bal', style: { marginTop: 'var(--sp-4)' } },
          BAL.map((b) => h(BalanceItem, { key: b.id, item: b })))),

      // спокойное предупреждение по абонементам
      lowBalances.length ? h(Alert, {
        key: 'low', tone: 'warning', icon: Ic.Info, title: 'Скоро закончатся занятия',
        action: h(Button, { variant: 'secondary', size: 'sm', iconRight: Ic.ArrowRight, onClick: () => nav('/payments') }, 'Продлить'),
      }, 'По направлению «' + lowBalances.map((b) => b.name).join('», «') + '» осталось мало занятий. Спокойно продли, чтобы не делать паузу — куратор поможет с тарифом.') : null,

      // недельный календарь
      h('section', { className: 'e-plate-card', key: 'cal' },
        h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
          h('div', null,
            h('div', { className: 'e-plate-card__label' }, week ? week.sub : 'Неделя'),
            h('p', { className: 'e-plate-card__hint' }, weekTotal + ' ' + plural(weekTotal, 'занятие', 'занятия', 'занятий') + ' на этой неделе')),
          weekSwitch),
        h('div', { className: 'es-ls-days', style: { marginTop: 'var(--sp-5)' } },
          week.days.map((d, i) => h(DayBlock, { key: week.label + '-' + i, day: d, onReschedule })))),

      // переход на учебную платформу
      h(Banner, { key: 'bn', tone: 'dark', kicker: 'Учебная платформа',
        title: 'Уроки и тренажеры — отдельно',
        text: 'Видео-разборы, домашки и материалы живут на учебной платформе. Расписание здесь, занятия — там.',
        cta: 'Открыть учебную платформу', to: '/learning/lesson' })
    );
  }

  EScreens.LearningSchedule = LearningSchedule;
})();
