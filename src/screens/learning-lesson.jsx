/* ============================================================================
   EastSide — Обучение · Урок (window.EScreens.LearningLesson · #/learning/lesson)
   ----------------------------------------------------------------------------
   Связующий блок к учебной платформе в языке «EastSide Dark». Трёхслойка как у
   эталона: рейл «Обучение» -> молочная плашка с уроком -> панель-спутник
   «Модуль» (гора + прогресс + список уроков + переход к платформе).

   Плашка: превью урока + конспект (блоки), вкладки Конспект / Домашка / Разбор.
   Домашка — ЗАГЛУШКА «скоро»: полноценная сдача будет на учебной платформе.
   Внизу — баннер-переход на платформу обучения. Всё из window.EUI + токены.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const { AppShell, PathPanel, Banner, Card, Button, Badge, Pill, Avatar, Alert, ProgressBar, Tabs, Modal } = U;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  // --- Локальный mock (свой; общий mock.jsx не трогаем) --------------------
  const FALLBACK = {
    course: { module: 'Модуль 4. Грамматика 把-конструкции' },
    student: { name: 'Дима', role: 'Ученик' },
    teacher: { name: 'Анна Лю', role: 'Преподаватель', online: true },
    lesson: {
      n: 7,
      title: 'Конструкция 把 (bǎ): порядок слов и типичные ошибки',
      duration: '18 мин видео + конспект',
      tags: ['Грамматика', 'HSK 4'],
      video: { length: '18:24', poster: '把' },
      summary: [
        { kind: 'p', text: 'Конструкция 把 выносит дополнение перед глаголом и подчеркивает, что с предметом что-то сделали — результат, а не сам факт действия. На HSK 4 встречается почти в каждом тексте.' },
        { kind: 'h', text: 'Базовый порядок' },
        { kind: 'code', text: 'Подлежащее + 把 + дополнение + глагол + результат\n我 把 作业 写 完 了。 — Я доделал домашнее задание.' },
        { kind: 'p', text: 'После глагола почти всегда стоит дополнительный элемент: результат (完, 好), направление (起来) или 了. Голый глагол без него звучит оборванно.' },
        { kind: 'h', text: 'Где чаще всего ошибаются' },
        { kind: 'li', text: 'Ставят 不 или 没 после 把 — отрицание идет перед 把, а не внутри конструкции.' },
        { kind: 'li', text: 'Забывают результат после глагола: 我把书看 звучит незакончено.' },
        { kind: 'li', text: 'Пытаются использовать 把 с глаголами чувства (喜欢, 知道) — так нельзя.' },
      ],
      attachments: [
        { name: 'Конспект урока 7.pdf', size: '420 КБ' },
        { name: 'Карточки 把-конструкции.pdf', size: '180 КБ' },
      ],
    },
    homework: { title: 'Составь 8 предложений с 把', due: '14 июня, 21:00', daysLeft: 3 },
    comments: [
      { id: 'c1', name: 'Анна Лю', when: '2 дня назад', text: 'Дима, на прошлом уроке порядок слов уже держишь увереннее. Сегодня смотри внимательно на результат после глагола — это твое слабое место.' },
    ],
    module: { pct: 64, done: 7, total: 11, points: 240, streak: 5 },
    lessons: [
      { id: 'l1', n: 1, title: 'Знакомство с 把', status: 'done', score: 'A' },
      { id: 'l2', n: 2, title: 'Порядок слов', status: 'done', score: 'A' },
      { id: 'l3', n: 3, title: 'Результативные дополнения', status: 'done', score: 'B+' },
      { id: 'l4', n: 4, title: 'Отрицание в 把', status: 'done', score: 'A' },
      { id: 'l5', n: 5, title: 'Направление 起来 / 下去', status: 'done', score: 'A-' },
      { id: 'l6', n: 6, title: 'Сравнение с 被', status: 'done', score: 'B+' },
      { id: 'l7', n: 7, title: 'Порядок слов и ошибки', status: 'current' },
      { id: 'l8', n: 8, title: 'Практика: диалоги', status: 'upcoming' },
      { id: 'l9', n: 9, title: 'Аудирование HSK 4', status: 'upcoming' },
      { id: 'l10', n: 10, title: 'Письменное задание', status: 'upcoming' },
      { id: 'l11', n: 11, title: 'Итоговый разбор модуля', status: 'upcoming' },
    ],
    next: { n: 8, title: 'Практика: диалоги с 把', when: 'Завтра, 17:00', teacher: 'Анна Лю' },
  };
  const D = (window.EMock && EMock.lessonFull) || FALLBACK;

  // --- Скоуп-стили (только токены) -----------------------------------------
  function Styles() {
    return h('style', { id: 'es-ll-styles' }, `
      .es-ll-player { position:relative; aspect-ratio:16/9; border-radius:var(--r-lg); overflow:hidden;
        display:flex; align-items:flex-end; background:var(--base, #03081C); }
      .es-ll-player__poster { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; overflow:hidden;
        background:radial-gradient(120% 120% at 70% 18%, var(--violet, #2B8FFF) 0%, transparent 55%), var(--base, #03081C); }
      .es-ll-player__glyph { font-family:var(--font-display); font-weight:var(--fw-black); font-size:var(--fs-5xl);
        color:#fff; opacity:.16; line-height:1; user-select:none; transform:scale(2.4); }
      .es-ll-player__play { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
        width:60px; height:60px; border-radius:var(--r-pill); border:none; cursor:pointer;
        background:var(--plate-card); color:var(--violet-deep, var(--jade-ink)); display:flex; align-items:center; justify-content:center;
        box-shadow:var(--glow-chip); transition:transform var(--dur-fast) var(--ease-out); }
      .es-ll-player__play:hover { transform:translate(-50%,-50%) scale(1.06); }
      .es-ll-player__bar { position:relative; z-index:1; width:100%; display:flex; align-items:center; gap:var(--sp-3); padding:var(--sp-4); }
      .es-ll-player__time { color:#fff; font-size:var(--fs-xs); font-weight:var(--fw-semibold); }
      .es-ll-player__track { flex:1 1 auto; height:4px; border-radius:var(--r-pill); background:rgba(255,255,255,.25); overflow:hidden; }
      .es-ll-player__track-fill { display:block; width:28%; height:100%; background:#fff; border-radius:var(--r-pill); }

      .es-ll-head__title { font-family:var(--font-display); font-size:var(--fs-2xl); line-height:var(--lh-snug); color:var(--plate-ink); margin:0; }
      .es-ll-meta { display:flex; align-items:center; gap:var(--sp-2); flex-wrap:wrap; }
      .es-ll-meta__k { font-size:var(--fs-2xs); text-transform:uppercase; letter-spacing:var(--tracking-wide); color:var(--violet-deep, var(--jade-ink)); font-weight:var(--fw-bold); }
      .es-ll-meta__dur { font-size:var(--fs-xs); color:var(--plate-ink-sub); }

      .es-ll-note__h { font-family:var(--font-display); font-size:var(--fs-md); color:var(--plate-ink); margin:0; }
      .es-ll-note__p { font-size:var(--fs-sm); color:var(--plate-ink-sub); margin:0; line-height:var(--lh-relaxed); }
      .es-ll-note__code { font-family:var(--font-text); font-size:var(--fs-sm); color:var(--plate-ink);
        background:var(--plate-card); border:1px solid var(--plate-card-br); border-radius:var(--r-md);
        padding:var(--sp-3) var(--sp-4); white-space:pre-wrap; line-height:var(--lh-relaxed); margin:0; }
      .es-ll-note__li { display:flex; align-items:flex-start; gap:var(--sp-2); font-size:var(--fs-sm); color:var(--plate-ink); line-height:var(--lh-normal); }
      .es-ll-note__li-ic { color:var(--jade-ink); flex-shrink:0; margin-top:2px; }

      .es-ll-files { margin-top:var(--sp-5); padding-top:var(--sp-5); border-top:1px solid var(--plate-card-br); }
      .es-ll-file { display:flex; align-items:center; gap:var(--sp-3); padding:var(--sp-3); width:100%; text-align:left;
        border:1px solid var(--plate-card-br); border-radius:var(--r-md); background:var(--plate-card); color:var(--plate-ink); cursor:pointer;
        transition:border-color var(--dur-fast) var(--ease-out); }
      .es-ll-file + .es-ll-file { margin-top:var(--sp-2); }
      .es-ll-file:hover { border-color:var(--jade-line); }
      .es-ll-file__ic { display:flex; color:var(--jade-ink); flex-shrink:0; }
      .es-ll-file__name { display:block; font-size:var(--fs-sm); font-weight:var(--fw-medium); }
      .es-ll-file__size { display:block; font-size:var(--fs-2xs); color:var(--plate-ink-sub); }
      .es-ll-file__dl { color:var(--plate-ink-sub); flex-shrink:0; margin-left:auto; }

      .es-ll-soon { display:flex; flex-direction:column; align-items:center; text-align:center; gap:var(--sp-3);
        padding:var(--sp-7) var(--sp-5); background:var(--plate-card); border:1px dashed var(--plate-card-br); border-radius:var(--r-lg); }
      .es-ll-soon__ic { display:inline-flex; align-items:center; justify-content:center; width:52px; height:52px; border-radius:var(--r-pill);
        background:var(--jade-soft); color:var(--jade-ink); box-shadow:var(--glow-chip); }
      .es-ll-soon__title { font-family:var(--font-display); font-weight:var(--fw-bold); font-size:var(--fs-lg); color:var(--plate-ink); }
      .es-ll-soon__text { font-size:var(--fs-sm); color:var(--plate-ink-sub); max-width:46ch; line-height:var(--lh-relaxed); }

      .es-ll-comment { display:flex; gap:var(--sp-3); }
      .es-ll-comment__name { font-size:var(--fs-sm); font-weight:var(--fw-semibold); color:var(--plate-ink); }
      .es-ll-comment__when { font-size:var(--fs-2xs); color:var(--plate-ink-sub); margin-left:var(--sp-2); }
      .es-ll-comment__text { font-size:var(--fs-sm); color:var(--plate-ink-sub); margin:var(--sp-1) 0 0; line-height:var(--lh-normal); }

      .es-ll-list { display:flex; flex-direction:column; }
      .es-ll-item { display:flex; align-items:center; gap:var(--sp-3); padding:var(--sp-2); width:100%; text-align:left;
        border:none; background:none; border-radius:var(--r-sm); color:var(--plate-ink-sub); cursor:pointer;
        transition:background var(--dur-fast) var(--ease-out); }
      .es-ll-item:hover { background:var(--plate-card-hi); color:var(--plate-ink); }
      .es-ll-item__node { width:30px; height:30px; border-radius:var(--r-pill); display:flex; align-items:center; justify-content:center; flex-shrink:0;
        border:1px solid var(--plate-card-br); color:var(--plate-ink-sub); background:var(--plate-card); }
      .es-ll-item--done .es-ll-item__node { background:var(--jade); border-color:transparent; color:var(--on-fill,#fff); }
      .es-ll-item--current .es-ll-item__node { background:var(--pri-bg); border-color:transparent; color:var(--pri-tx); box-shadow:var(--glow-chip); }
      .es-ll-item__body { display:flex; flex-direction:column; min-width:0; flex:1 1 auto; }
      .es-ll-item__title { font-size:var(--fs-sm); font-weight:var(--fw-medium); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .es-ll-item--current .es-ll-item__title { font-weight:var(--fw-bold); color:var(--plate-ink); }
      .es-ll-item__sub { font-size:var(--fs-2xs); color:var(--plate-ink-sub); }
    `);
  }

  // --- Превью урока --------------------------------------------------------
  function LessonPlayer(props) {
    const { lesson, onPlay } = props;
    return h('div', { className: 'es-ll-player' },
      h('div', { className: 'es-ll-player__poster', 'aria-hidden': 'true', key: 'p' },
        h('span', { className: 'es-ll-player__glyph', key: 'g' }, lesson.video.poster)),
      h('button', { type: 'button', className: 'es-ll-player__play', 'aria-label': 'Запустить видео урока', onClick: onPlay, key: 'b' }, h(Ic.ArrowRight, { size: 24 })),
      h('div', { className: 'es-ll-player__bar', key: 'bar' },
        h('span', { className: 'es-ll-player__time u-tnum', key: 't' }, lesson.video.length),
        h('span', { className: 'es-ll-player__track', 'aria-hidden': 'true', key: 'tr' }, h('span', { className: 'es-ll-player__track-fill' })),
        h(Pill, { tone: 'info', key: 'badge' }, 'Видео урока'))
    );
  }

  // --- Конспект ------------------------------------------------------------
  function SummaryBody(props) {
    const { lesson } = props;
    const onFile = (f) => { if (window.EToast) window.EToast.push({ tone: 'info', title: 'Материал откроется на платформе', text: f.name + ' доступен на учебной платформе.' }); };
    const blocks = lesson.summary.map((b, i) => {
      if (b.kind === 'h') return h('h4', { key: i, className: 'es-ll-note__h' }, b.text);
      if (b.kind === 'code') return h('pre', { key: i, className: 'es-ll-note__code' }, b.text);
      if (b.kind === 'li') return h('div', { key: i, className: 'es-ll-note__li' },
        h(Ic.Check, { size: 16, className: 'es-ll-note__li-ic', key: 'i' }), h('span', { key: 't' }, b.text));
      return h('p', { key: i, className: 'es-ll-note__p' }, b.text);
    });
    return h('div', null,
      h('div', { className: 'u-stack-3', key: 'body' }, blocks),
      h('div', { className: 'es-ll-files', key: 'files' },
        h('div', { className: 'e-plate-card__hint', style: { marginBottom: 'var(--sp-3)', fontWeight: 'var(--fw-bold)', color: 'var(--plate-ink)' }, key: 'l' }, 'Материалы к уроку'),
        lesson.attachments.map((f, i) => h('button', { key: i, type: 'button', className: 'es-ll-file', onClick: () => onFile(f) },
          h('span', { className: 'es-ll-file__ic', 'aria-hidden': 'true', key: 'i' }, h(Ic.File, { size: 18 })),
          h('span', { key: 'm' },
            h('span', { className: 'es-ll-file__name' }, f.name),
            h('span', { className: 'es-ll-file__size u-tnum' }, f.size)),
          h(Ic.Download, { size: 18, className: 'es-ll-file__dl', key: 'd' }))))
    );
  }

  // --- Домашка — ЗАГЛУШКА «скоро» ------------------------------------------
  function HomeworkBody(props) {
    const { hw, onOpenPlatform } = props;
    return h('div', { className: 'es-ll-soon' },
      h('span', { className: 'es-ll-soon__ic', 'aria-hidden': 'true', key: 'i' }, h(Ic.Book, { size: 24 })),
      h(Badge, { tone: 'jade', key: 'b' }, 'Скоро'),
      h('div', { className: 'es-ll-soon__title', key: 't' }, hw.title),
      h('p', { className: 'es-ll-soon__text', key: 'p' },
        'Сдача домашних заданий переезжает на учебную платформу — там будет отправка текстом и фото, проверка и оценка. Дедлайн по этому заданию: ', h('b', { style: { color: 'var(--plate-ink)' } }, hw.due), '.'),
      h(Button, { variant: 'primary', size: 'sm', iconRight: Ic.ArrowRight, onClick: onOpenPlatform, key: 'cta' }, 'Открыть на платформе')
    );
  }

  // --- Разбор преподавателя ------------------------------------------------
  function CommentsBody(props) {
    const { comments, teacher } = props;
    if (!comments.length) {
      return h('div', { className: 'es-ll-note__p', style: { padding: 'var(--sp-4) 0' } }, 'Пока пусто. Преподаватель оставит разбор после проверки задания.');
    }
    return h('div', { className: 'u-stack-4' },
      comments.map((c) => h('div', { key: c.id, className: 'es-ll-comment' },
        h(Avatar, { name: c.name, size: 'sm', status: teacher.online ? true : undefined, key: 'a' }),
        h('div', { key: 'b' },
          h('div', { key: 'h' },
            h('span', { className: 'es-ll-comment__name', key: 'n' }, c.name),
            h('span', { className: 'es-ll-comment__when', key: 'w' }, c.when)),
          h('p', { className: 'es-ll-comment__text', key: 't' }, c.text)))))
    ;
  }

  // --- Список уроков модуля ------------------------------------------------
  function LessonList(props) {
    const { lessons, onPick } = props;
    const icon = (st) => st === 'done' ? Ic.CheckCircle : st === 'current' ? Ic.ArrowRight : Ic.Lock;
    return h('div', { className: 'es-ll-list' },
      lessons.map((l) => {
        const I = icon(l.status);
        return h('button', { key: l.id, type: 'button', className: 'es-ll-item es-ll-item--' + l.status, onClick: () => onPick(l), 'aria-current': l.status === 'current' ? 'true' : undefined },
          h('span', { className: 'es-ll-item__node', 'aria-hidden': 'true', key: 'n' }, h(I, { size: 16 })),
          h('span', { className: 'es-ll-item__body', key: 'b' },
            h('span', { className: 'es-ll-item__title' }, l.title),
            h('span', { className: 'es-ll-item__sub u-tnum' }, 'Урок ' + l.n)),
          l.score ? h(Badge, { tone: 'jade', key: 's' }, l.score)
            : l.status === 'current' ? h(Pill, { tone: 'info', key: 's' }, 'сейчас') : null);
      }));
  }

  function LearningLesson() {
    const [tab, setTab] = useState('note');
    const [platformOpen, setPlatformOpen] = useState(false);
    const { lesson, homework, comments, module, lessons, teacher, course } = D;

    const openPlatform = () => setPlatformOpen(true);
    const pickLesson = (l) => {
      if (window.EToast) window.EToast.push({ tone: 'info', title: 'Урок ' + l.n, text: l.title + ' откроется на учебной платформе.' });
    };

    const rail = {
      brand: { name: 'EastSide', sub: 'Учебная связка', mark: 'E' },
      profile: { name: D.student.name, role: 'Обучение', mascot: 'assets/mascot-cut.png' },
      items: [
        { icon: Ic.TrendUp, label: 'Прогресс', to: '/learning/progress' },
        { icon: Ic.Calendar, label: 'Расписание', to: '/learning/schedule' },
        { icon: Ic.Book, label: 'Урок', to: '/learning/lesson', active: true },
        { icon: Ic.Home, label: 'Мой кабинет', to: '/student' },
        { icon: Ic.Spark, label: 'Ассистент', to: '/assistant' },
      ],
      footer: [{ icon: Ic.Doc, label: 'Документы', onClick: () => nav('/documents') }],
      onLogout: () => nav('/auth'),
    };

    // --- Панель-спутник «Модуль» -------------------------------------------
    const panel = h(PathPanel, {
      kicker: 'Модуль',
      title: course.module.replace(/^Модуль \d+\.\s*/, ''),
      progress: module.pct / 100,
      reached: module.done >= module.total,
      pct: module.pct,
      gleamCap: 'Модуль пройден',
      steps: [
        { n: 1, icon: Ic.Check, label: 'Уроки сданы', val: module.done + ' из ' + module.total, status: 'done' },
        { label: 'Текущий урок', val: 'Урок ' + lesson.n, status: 'active', onClick: () => setTab('note') },
        { label: 'Итоговый разбор', status: 'upcoming' },
      ],
      widget: { head: 'Учебная платформа', text: 'Полный курс, тренажеры и сдача домашек — на платформе обучения.', go: 'Перейти к платформе', onClick: openPlatform },
    },
      h('div', { className: 'es-panel-hsk', key: 'g' },
        h('div', { className: 'es-panel-hsk__top' },
          h('span', { className: 'es-panel-hsk__label' }, 'Модуль 4 · прогресс'),
          h('span', { className: 'es-panel-hsk__pct u-tnum' }, module.pct + '%')),
        h('div', { className: 'es-panel-hsk__track' }, h('div', { className: 'es-panel-hsk__fill', style: { width: module.pct + '%' } })),
        h('div', { className: 'es-panel-hsk__meta' }, module.streak + ' дней подряд · ' + module.points + ' баллов'))
    );

    // --- Контент урока -----------------------------------------------------
    const tabs = [
      { key: 'note', label: 'Конспект' },
      { key: 'hw', label: 'Домашка · скоро' },
      { key: 'comments', label: 'Разбор' + (comments.length ? ' · ' + comments.length : '') },
    ];
    const body = tab === 'note' ? h(SummaryBody, { lesson })
      : tab === 'hw' ? h(HomeworkBody, { hw: homework, onOpenPlatform: openPlatform })
        : h(CommentsBody, { comments, teacher });

    return h(React.Fragment, null,
      h(AppShell, { rail, panel },
        h(Styles, { key: 'styles' }),
        h('div', { className: 'es-ll-meta', key: 'meta' },
          h('span', { className: 'es-ll-meta__k' }, course.module),
          h('span', { 'aria-hidden': 'true', style: { opacity: .4 } }, '·'),
          h('span', { className: 'es-ll-meta__dur u-tnum' }, 'Урок ' + lesson.n)),
        h('h1', { className: 'es-ll-head__title', style: { marginTop: 'var(--sp-2)' }, key: 'h1' }, lesson.title),
        h('div', { className: 'es-ll-meta', style: { marginTop: 'var(--sp-3)' }, key: 'tags' },
          lesson.tags.map((tg, i) => h(Badge, { tone: 'neutral', key: i }, tg)),
          h('span', { className: 'es-ll-meta__dur', key: 'd' }, lesson.duration)),

        // превью + конспект/домашка/разбор
        h('section', { className: 'e-plate-card', key: 'lesson', style: { marginTop: 'var(--sp-5)' } },
          h(LessonPlayer, { lesson, onPlay: openPlatform, key: 'player' }),
          h('div', { style: { marginTop: 'var(--sp-5)' }, key: 'tabs' }, h(Tabs, { tabs, active: tab, onChange: setTab })),
          h('div', { role: 'tabpanel', className: 'u-animate-fade', style: { marginTop: 'var(--sp-5)' }, key: 'panel' }, body)),

        // прогресс модуля + список уроков
        h('section', { className: 'e-plate-card', key: 'mod' },
          h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
            h('div', null,
              h('div', { className: 'e-plate-card__label' }, 'Модуль 4'),
              h('p', { className: 'e-plate-card__hint' }, 'Грамматика 把-конструкции — ' + module.done + ' из ' + module.total + ' уроков')),
            h(Badge, { tone: 'jade', icon: Ic.Flag }, module.done + ' / ' + module.total)),
          h('div', { style: { marginTop: 'var(--sp-4)' } }, h(ProgressBar, { value: module.pct, tone: 'jade', showPct: true, label: 'Пройдено' })),
          h('div', { className: 'u-flex u-items-center u-gap-2 u-wrap', style: { marginTop: 'var(--sp-4)' } },
            h(Badge, { tone: 'jade', icon: Ic.Bolt }, module.streak + ' дней подряд'),
            h(Badge, { tone: 'neutral', icon: Ic.Star }, module.points + ' баллов')),
          h('div', { style: { marginTop: 'var(--sp-5)' } }, h(LessonList, { lessons, onPick: pickLesson }))),

        // переход на учебную платформу
        h(Banner, { key: 'bn', tone: 'dark', kicker: 'Учебная платформа',
          title: 'Учись дальше на платформе',
          text: 'Видео-уроки, тренажеры и сдача домашек живут на отдельной учебной платформе. Здесь — связка и быстрый обзор.',
          cta: 'Открыть учебную платформу', onCta: openPlatform })
      ),

      // Модалка-заглушка перехода на учебную платформу
      h(Modal, { open: platformOpen, onClose: () => setPlatformOpen(false), title: 'Учебная платформа',
        footer: h(React.Fragment, null,
          h(Button, { variant: 'ghost', onClick: () => setPlatformOpen(false) }, 'Закрыть'),
          h(Button, { variant: 'primary', iconRight: Ic.ArrowRight, onClick: () => { setPlatformOpen(false); if (window.EToast) window.EToast.push({ tone: 'info', title: 'Учебная платформа', text: 'Скоро откроем переход в один клик прямо отсюда.' }); } }, 'Понятно')) },
        h('div', { className: 'u-stack-3' },
          h('p', { className: 'u-ink-soft' }, 'Полноценные уроки, тренажеры и сдача домашних заданий вынесены на отдельную учебную платформу. Этот раздел — связка: расписание, обзор урока и прогресс под рукой в кабинете.'),
          h('p', { className: 'u-ink-soft' }, 'Переход открывается по мере подключения твоего курса — куратор сообщит, когда будет готово.')))
    );
  }

  EScreens.LearningLesson = LearningLesson;
})();
