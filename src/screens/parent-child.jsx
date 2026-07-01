/* ============================================================================
   EastSide — Ребёнок глазами родителя (window.EScreens.ParentChild
   · #/parent/child?id=...)
   ----------------------------------------------------------------------------
   Уровень 2: заход родителя внутрь одного ребёнка. Отдельно ПУТЬ (дорожная
   карта 4 вех), отдельно ЗАДАЧИ, отдельно ОБУЧЕНИЕ — с выходом в существующие
   страницы (#/learn, #/student). Живёт в том же каркасе (ESStudentShell,
   режим B), нав/футер родительские. Собран из блоков learn/student (.lr-kpi,
   .lr-panel/.lr-tk, KPI-якорь) + минимум .pc- (таймлайн вех). Данные — EMock.
   Логика — docs/parent-model.md.
   ============================================================================ */
(function () {
  'use strict';
  const R = window.React || React;
  const { createElement: h } = R;
  const EScreens = (window.EScreens = window.EScreens || {});
  const Ic = window.EIcons || {};
  const SH = window.ESStudentShell;
  const M = window.EMock || {};
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  const css = `
  .sd-main--light:has(.pc-page) .sd-wrap{max-width:1160px;padding:34px 44px 84px;}
  .pc-page{position:relative;}
  .sd-main--light:has(.pc-page){
    background:
      radial-gradient(820px 560px at 99% -6%, rgba(88,158,255,.28) 0%, rgba(110,170,252,.08) 46%, transparent 72%),
      linear-gradient(165deg,#E9EDFA 0%,#EFF2FB 46%,#E9ECF8 100%);}
  .sd-scroll:has(.pc-page) .sd-foot__in{max-width:1160px;padding:0 44px;}
  @keyframes pcUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
  .pc-page>section{animation:pcUp .5s cubic-bezier(.23,1,.32,1) both;}
  .pc-page>section:nth-child(2){animation-delay:.06s;}
  .pc-page>section:nth-child(3){animation-delay:.12s;}
  .pc-page>section:nth-child(4){animation-delay:.18s;}
  @media (prefers-reduced-motion:reduce){.pc-page>section{animation:none;}}

  /* шапка ребёнка: назад + аватар + имя + статус + действия */
  .pc-head{display:flex;align-items:center;gap:15px;margin-bottom:6px;flex-wrap:wrap;}
  .pc-back{display:inline-flex;align-items:center;gap:7px;padding:9px 14px 9px 11px;border-radius:12px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;
    color:var(--sd-ink-sub);background:rgba(255,255,255,.55);border:1px solid rgba(120,150,215,.24);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:transform .15s,color .15s;}
  .pc-back:hover{transform:translateX(-2px);color:var(--sd-ink);}
  .pc-ava{flex:0 0 52px;width:52px;height:52px;border-radius:16px;display:grid;place-items:center;font-weight:700;font-size:18px;color:#fff;
    background:var(--sd-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 8px 20px -8px rgba(31,99,200,.5);}
  .pc-id__nm{font-family:inherit;font-weight:700;font-size:24px;letter-spacing:-.9px;color:var(--sd-ink);line-height:1.05;}
  .pc-id__sub{font-size:13px;font-weight:500;color:var(--sd-ink-sub);margin-top:3px;}
  .pc-actions{margin-left:auto;display:flex;gap:10px;flex-wrap:wrap;}
  .pc-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:13px;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;letter-spacing:-.2px;border:0;transition:transform .15s,box-shadow .15s,background .15s;}
  .pc-btn--primary{color:#fff;background:var(--sd-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 8px 20px -12px rgba(31,99,200,.5);}
  .pc-btn--primary:hover{transform:translateY(-1px);background:var(--sd-acc);}
  .pc-btn--ghost{color:var(--sd-acc-deep);background:rgba(255,255,255,.6);border:1px solid rgba(120,150,215,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);}
  .pc-btn--ghost:hover{transform:translateY(-1px);background:#fff;}
  .pc-btn svg{opacity:.9;}

  /* таймлайн вех — путь ребёнка */
  .pc-tl{display:flex;flex-direction:column;position:relative;padding:2px 0;}
  .pc-tls{position:relative;display:flex;gap:16px;padding-bottom:20px;}
  .pc-tls:last-child{padding-bottom:0;}
  .pc-tls__rail{position:absolute;left:19px;top:40px;bottom:-2px;width:2px;background:rgba(22,32,59,.1);}
  .pc-tls.done .pc-tls__rail{background:var(--sd-acc-deep);opacity:.55;}
  .pc-tls:last-child .pc-tls__rail{display:none;}
  .pc-tls__n{position:relative;z-index:1;flex:0 0 40px;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;font-weight:700;font-size:15px;font-variant-numeric:tabular-nums;
    background:rgba(90,120,180,.1);color:var(--sd-ink-mute);box-shadow:inset 0 0 0 1px rgba(22,32,59,.08);}
  .pc-tls.done .pc-tls__n{background:var(--sd-acc-deep);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 6px 16px -6px rgba(31,99,200,.5);}
  .pc-tls.cur .pc-tls__n{background:rgba(43,143,255,.14);color:var(--sd-acc-deep);box-shadow:inset 0 0 0 1.5px var(--sd-acc-deep),0 0 0 4px rgba(43,143,255,.14);}
  .pc-tls__b{flex:1 1 auto;min-width:0;padding-top:4px;}
  .pc-tls__t{font-size:15px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;}
  .pc-tls.upcoming .pc-tls__t{color:var(--sd-ink-sub);}
  .pc-tls__s{font-size:12.5px;font-weight:500;color:var(--sd-ink-mute);margin-top:3px;line-height:1.46;max-width:640px;}
  .pc-tls__now{display:inline-block;margin-top:8px;padding:3px 11px;border-radius:99px;font-size:11px;font-weight:700;color:var(--sd-acc-deep);background:var(--sd-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,143,255,.2);}

  /* обучение — сводка + вход в #/learn */
  .pc-learn{display:flex;flex-direction:column;gap:11px;}
  .pc-lrow{display:flex;align-items:center;gap:13px;padding:11px 0;border-bottom:1px solid rgba(22,32,59,.06);}
  .pc-lrow:first-child{padding-top:0;}
  .pc-lrow:last-child{border-bottom:0;padding-bottom:0;}
  .pc-lrow__ic{flex:0 0 36px;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:var(--sd-acc-deep);background:var(--sd-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,111,224,.12);}
  .pc-lrow__l{flex:1 1 auto;min-width:0;font-size:13px;font-weight:500;color:var(--sd-ink-sub);}
  .pc-lrow__v{font-weight:700;font-size:15px;letter-spacing:-.3px;color:var(--sd-ink);font-variant-numeric:tabular-nums;}
  .pc-learnbtn{margin-top:15px;}
  .pc-btn--full{width:100%;justify-content:center;}
  `;
  if (typeof document !== 'undefined' && !document.getElementById('parent-child-styles')) {
    const el = document.createElement('style');
    el.id = 'parent-child-styles';
    el.innerHTML = css;
    document.head.appendChild(el);
  }

  const initials = (name) => (name || '').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('');
  const arr = (s) => Ic.ArrowRight ? h(Ic.ArrowRight, { size: s || 16 }) : '→';
  const chat = (ctx) => SH && SH.openChat(ctx || null);
  const go = (label) => SH && SH.onNav({ label: label });

  /* ── данные детей (демо-доска на ребёнка) ───────────────────────────────── */
  const T = { coral: '210,96,79' };
  const BOARD = {
    'u-student-1': {
      stageIdx: 2, stageTitle: 'Документы и подача', progress: 62,
      tasks: [
        { hot: true, ic: Ic.Doc, title: 'Собрать пакет документов', sub: 'Аттестат, паспорт, справки', chip: '14 дней' },
        { ic: Ic.Edit, title: 'Мотивационное письмо', sub: 'Черновик на проверке у куратора', chip: 'На проверке' },
        { ic: Ic.Cap, title: 'Выбрать вузы для подачи', sub: 'Осталось подтвердить 2 из 5', chip: 'В работе' },
      ],
      learn: { hsk: 'HSK 4 → HSK 5', hskPct: 68, lessons: '46 / 60', streak: '12 дней' },
    },
    'u-student-2': {
      stageIdx: 1, stageTitle: 'Диагностика и профориентация', progress: 18,
      tasks: [
        { hot: true, ic: Ic.Edit, title: 'Пройти тест уровня языка', sub: 'Диагностика · HSK', chip: '5 дней' },
        { ic: Ic.Compass, title: 'Заполнить профориентацию', sub: 'Интересы и направления', chip: 'Новое' },
      ],
      learn: { hsk: 'HSK 2 → HSK 3', hskPct: 24, lessons: '8 / 60', streak: '3 дня' },
    },
  };
  const FALLBACK_CHILDREN = [
    { id: 'u-student-1', name: 'Дима Соколов', grade: '11 класс', status: 'on_track' },
    { id: 'u-student-2', name: 'Аня Соколова', grade: '9 класс', status: 'attention' },
  ];
  const CHILDREN = (M.children && M.children.length ? M.children : FALLBACK_CHILDREN);
  const ROADMAP = (M.roadmap && M.roadmap.length ? M.roadmap : [
    { id: 'm1', title: 'Диагностика и стратегия', summary: 'Точка А, подбор вузов и грантов, стратегия.' },
    { id: 'm2', title: 'Документы и подача', summary: 'Собрать пакет документов и подать заявки.' },
    { id: 'm3', title: 'Экзамены, интервью, результат', summary: 'Статусы заявок, интервью, виза.' },
    { id: 'm4', title: 'Зачисление и выезд', summary: 'Зачисление, виза, прием в Китае.' },
  ]);

  function statusPill(status) {
    const map = { on_track: ['идет по плану', '#1C7E52', 'rgba(46,160,110,.12)'], attention: ['нужен фокус', '#936417', 'rgba(201,146,62,.14)'], risk: ['риск', '#B23B2A', 'rgba(210,96,79,.13)'] };
    const s = map[status] || map.on_track;
    return h('span', { style: { display: 'inline-flex', alignItems: 'center', padding: '4px 11px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: s[1], background: s[2] } }, s[0]);
  }

  /* ── KPI-ряд ребёнка (тот же .lr-kpi, что на обзоре) ─────────────────────── */
  function Kpis(props) {
    const b = props.b;
    const kpis = [
      { anchor: true, ic: Ic.Sequence, lbl: 'Этап пути', num: b.stageIdx + ' / 4', delta: b.stageTitle },
      { ic: Ic.Book, lbl: 'Прогресс обучения', num: b.progress + '%', delta: 'по программе' },
      { ic: Ic.CheckCircle, lbl: 'Активные задачи', num: String(b.tasks.length), delta: b.tasks.filter(function (t) { return t.hot; }).length + ' срочная' },
    ];
    return h('div', { className: 'lr-kpi' },
      kpis.map(function (s, i) {
        return h('div', { key: i, className: 'lr-kpic' + (s.anchor ? ' anchor' : ''), style: { '--kpi-glow': '43,143,255' } },
          h('div', { className: 'lr-kpic__top' },
            h('span', { className: 'lr-kpic__ic' }, s.ic ? h(s.ic, { size: 19 }) : null),
            h('span', { className: 'lr-kpic__lbl' }, s.lbl)),
          h('div', { className: 'lr-kpic__bot' },
            h('div', null,
              h('div', { className: 'lr-kpic__num' }, s.num),
              h('div', { className: 'lr-kpic__delta neutral' }, s.delta))));
      }));
  }

  function Roadmap(props) {
    const idx = props.idx; // текущая веха ребёнка (1..4)
    return h('div', { className: 'lr-cpnl' },
      h('div', { className: 'pc-tl' },
        ROADMAP.map(function (m, i) {
          const n = i + 1;
          const st = n < idx ? 'done' : n === idx ? 'cur' : 'upcoming';
          return h('div', { key: m.id || i, className: 'pc-tls ' + st },
            h('span', { className: 'pc-tls__rail', 'aria-hidden': 'true' }),
            h('span', { className: 'pc-tls__n' }, st === 'done' && Ic.Check ? h(Ic.Check, { size: 17 }) : n),
            h('div', { className: 'pc-tls__b' },
              h('div', { className: 'pc-tls__t' }, m.title),
              h('div', { className: 'pc-tls__s' }, m.summary),
              st === 'cur' ? h('span', { className: 'pc-tls__now' }, 'Сейчас здесь') : null));
        })));
  }

  function ParentChild(props) {
    if (!SH) return h('div', { style: { padding: 40, color: '#fff' } }, 'Скелет ученика не загружен');
    const id = (props.query && props.query.id) || (CHILDREN[0] && CHILDREN[0].id);
    const child = CHILDREN.filter(function (c) { return c.id === id; })[0] || CHILDREN[0];
    const b = BOARD[child.id] || BOARD['u-student-1'];
    const first = (child.name || '').split(' ')[0];

    const PARENT_NAV = [
      { key: 'overview', label: 'Семья', icon: Ic.Home, to: '/parent' },
      { key: 'finance', label: 'Финансы', icon: Ic.Wallet, to: '/payments' },
      { key: 'docs', label: 'Документы', icon: Ic.Doc, to: '/documents' },
      { key: 'mylearn', label: 'Мое обучение', icon: Ic.Book, soon: true },
      { key: 'curator', label: 'Куратор', icon: Ic.Users, soon: true },
    ];
    const P = M.parent || {};
    const kidsN = (M.children && M.children.length) || 2;
    const PARENT_USER = { name: P.name || 'Марина Соколова', first: (P.name || 'Марина').split(' ')[0], role: 'Родитель · ' + kidsN + ' ' + (kidsN === 1 ? 'ребенок' : 'ребенка'), avatar: true, initials: P.initials || 'МС', help: 'Вопрос по пути ребенка? Напишите куратору' };
    const PARENT_FOOT = [{ label: 'Семья', to: '/parent' }, { label: 'Финансы', to: '/payments' }, { label: 'Документы', to: '/documents' }];

    return h(SH.Shell, { active: 'overview', surface: 'light', hideTopBar: true, footer: true, nav: PARENT_NAV, user: PARENT_USER, footerLinks: PARENT_FOOT },
      h('div', { className: 'pc-page' },
        // шапка ребёнка
        h('section', null,
          h('button', { type: 'button', className: 'pc-back', onClick: function () { nav('/parent'); } },
            Ic.ArrowLeft ? h(Ic.ArrowLeft, { size: 15 }) : '‹', 'Семья'),
          h('div', { className: 'pc-head', style: { marginTop: 16 } },
            h('span', { className: 'pc-ava' }, initials(child.name)),
            h('div', null,
              h('div', { className: 'pc-id__nm' }, child.name),
              h('div', { className: 'pc-id__sub' }, child.grade + ' · Веха ' + b.stageIdx + ' · ' + b.stageTitle)),
            statusPill(child.status),
            h('div', { className: 'pc-actions' },
              h('button', { type: 'button', className: 'pc-btn pc-btn--primary', onClick: function () { nav('/learn'); } }, Ic.Book ? h(Ic.Book, { size: 16 }) : null, 'Обучение'),
              h('button', { type: 'button', className: 'pc-btn pc-btn--ghost', onClick: function () { nav('/student'); } }, Ic.Route ? h(Ic.Route, { size: 16 }) : null, 'Путь и задачи'))),
          h('div', { style: { marginTop: 22 } }, h(Kpis, { b: b }))),
        // путь ребёнка (дорожная карта)
        h('section', { className: 'lr-sec' },
          h('div', { className: 'lr-sec__h' },
            h('h2', null, 'Как идет путь'),
            h('span', { className: 'lr-chip' }, Ic.Sequence ? h(Ic.Sequence, { size: 12 }) : null, 'Веха ' + b.stageIdx + ' из ' + ROADMAP.length)),
          h(Roadmap, { idx: b.stageIdx })),
        // задачи ребёнка | обучение
        h('section', { className: 'lr-sec lr-bot' },
          h('div', { className: 'lr-panel' },
            h('div', { className: 'lr-panel__h' },
              h('h3', null, 'Что делает ' + first),
              h('span', { className: 'lr-count', style: { marginLeft: 'auto' } }, String(b.tasks.length))),
            b.tasks.map(function (t, i) {
              return h('div', { key: i, className: 'lr-tk' + (t.hot ? ' is-hot' : ''), onClick: function () { go('Задача ребенка'); } },
                h('span', { className: 'lr-tk__ic' }, t.ic ? h(t.ic, { size: 17 }) : null),
                h('div', { className: 'lr-tk__b' },
                  h('div', { className: 'lr-tk__t' }, t.title),
                  h('div', { className: 'lr-tk__s' }, t.sub)),
                h('span', { className: 'lr-tk__chip' + (t.hot ? '' : ' grey') }, t.chip));
            }),
            h('div', { className: 'lr-foot' }, h('button', { type: 'button', className: 'lr-foot__link', onClick: function () { nav('/student'); } }, 'Открыть все задачи', arr(13)))),
          h('div', { className: 'lr-panel' },
            h('div', { className: 'lr-panel__h' },
              h('h3', null, 'Обучение'),
              h('span', { className: 'lr-chip', style: { marginLeft: 'auto' } }, b.learn.hsk)),
            h('div', { className: 'pc-learn' },
              [{ ic: Ic.Book, l: 'Уровень языка', v: b.learn.hsk },
               { ic: Ic.CheckCircle, l: 'Пройдено уроков', v: b.learn.lessons },
               { ic: Ic.Bolt, l: 'Серия занятий', v: b.learn.streak }].map(function (row, i) {
                return h('div', { key: i, className: 'pc-lrow' },
                  h('span', { className: 'pc-lrow__ic' }, row.ic ? h(row.ic, { size: 16 }) : null),
                  h('span', { className: 'pc-lrow__l' }, row.l),
                  h('span', { className: 'pc-lrow__v' }, row.v));
              })),
            h('div', { className: 'pc-learnbtn' },
              h('button', { type: 'button', className: 'pc-btn pc-btn--primary pc-btn--full', onClick: function () { nav('/learn'); } }, Ic.Book ? h(Ic.Book, { size: 16 }) : null, 'Открыть обучение'))))));
  }

  EScreens.ParentChild = ParentChild;
})();
