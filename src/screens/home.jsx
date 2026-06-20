/* ============================================================================
   EastSide — Точка входа после логина (window.EScreens.Home · #/home)
   ----------------------------------------------------------------------------
   Пост-логин роутер: выбери, в какой кабинет зайти — ученик или родитель —
   и провалишься внутрь. Тот же язык «EastSide Dark»: трёхслойка (рейл → светлая
   плашка → панель-спутник с горой и тропой). Маленький и чистый экран-развилка.

   Только компоненты window.EUI и токены — ни одного хардкод-цвета. Каждая
   карточка ведёт по маршруту; модалка «кто-то другой» — мягкий выход назад.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const { AppShell, PathPanel, Banner, Button, Modal } = U;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  // Запасные данные семьи, если EMock недоступен (экран не должен пустеть).
  const STUDENT = (window.EMock && window.EMock.student) || {
    name: 'Дима Соколов', direction: 'Компьютерные науки, Китай',
  };
  const PARENT = (window.EMock && window.EMock.parent) || { name: 'Марина Соколова' };
  const CHILDREN = (window.EMock && window.EMock.children) || [
    { id: 'u-student-1', name: 'Дима Соколов', stageNow: 'Сбор документов', progressPct: 62 },
    { id: 'u-student-2', name: 'Аня Соколова', stageNow: 'Профориентация', progressPct: 18 },
  ];

  function Home() {
    const [helpFor, setHelpFor] = useState(null); // ключ роли для пояснения-модалки
    const [picked, setPicked] = useState(null);    // подсветка выбранной плитки

    useEffect(() => { setPicked(null); }, []);

    const firstName = (STUDENT.name || 'Ученик').split(' ')[0];
    const parentName = (PARENT.name || 'Родитель').split(' ')[0];
    const kidCount = CHILDREN.length;

    // ── Роли-развилки ──────────────────────────────────────────────────────
    const roles = [
      {
        id: 'student', to: '/student', icon: Ic.Compass,
        title: 'Я ученик',
        meta: 'Личный кабинет: что делать прямо сейчас, дорожная карта, документы и ассистент.',
        cta: 'Открыть кабинет ученика',
        who: firstName, whoSub: STUDENT.direction || 'Путь к поступлению',
        help: 'В кабинете ученика собрано всё про твой путь: ближайшие задачи на сегодня, читаемая дорожная карта по этапам, статусы документов и вход в ассистента. Если ты родитель — выбери вторую карточку.',
      },
      {
        id: 'parent', to: '/parent', icon: Ic.Users,
        title: 'Я родитель',
        meta: 'Видишь каждого ребёнка, отчёты человеческим языком, дедлайны, оплаты и спокойный контроль.',
        cta: 'Открыть кабинет родителя',
        who: parentName, whoSub: kidCount === 1 ? 'Один ребёнок на платформе' : kidCount + ' ребёнка на платформе',
        help: 'Кабинет родителя отвечает на один вопрос — «всё ли в порядке». Список детей с переключателем, прогресс трендом, ближайшие дедлайны, финансы и риски тоном «мы держим». Добавить ребёнка можно прямо на главном экране.',
      },
    ];

    // ── Сайдбар трёхслойки ─────────────────────────────────────────────────
    const rail = {
      brand: { name: 'EastSide', sub: 'Путь к поступлению', mark: 'E' },
      profile: { name: firstName || 'EastSide', role: 'Выбор кабинета', mascot: 'assets/mascot-cut.png' },
      items: [
        { icon: Ic.Home, label: 'Главная', to: '/home', active: true },
        { icon: Ic.Compass, label: 'Кабинет ученика', to: '/student' },
        { icon: Ic.Users, label: 'Кабинет родителя', to: '/parent' },
        { icon: Ic.Spark, label: 'Ассистент', to: '/assistant' },
      ],
      footer: [{ icon: Ic.Settings, label: 'Настройки', onClick: () => nav('/auth') }],
      onLogout: () => nav('/auth'),
    };

    // ── Панель-спутник «Твой путь» с горой ─────────────────────────────────
    const panel = h(PathPanel, {
      kicker: 'Твой путь',
      title: 'К поступлению в Китай',
      progress: 0.4,
      reached: false,
      pct: 40,
      gleamCap: 'Пройдено',
      steps: [
        { icon: Ic.Check, label: 'Диагностика', val: 'готово', status: 'done' },
        { label: 'Подготовка', val: 'сейчас', status: 'active', onClick: () => nav('/student') },
        { label: 'Подача и виза', status: 'upcoming' },
      ],
      widget: {
        head: 'Навигатор EastSide',
        text: 'Не уверен, куда зайти? Ассистент подскажет, с чего начать сегодня.',
        go: 'Открыть ассистента',
        to: '/assistant',
      },
    });

    // ── Карточка-развилка роли ─────────────────────────────────────────────
    const roleTile = (r) => h('button', {
      key: r.id, type: 'button',
      className: 'e-tile' + (picked === r.id ? ' is-sel' : ''),
      onClick: () => { setPicked(r.id); nav(r.to); },
      style: { display: 'grid', gap: 'var(--sp-3)' },
    },
      h('div', { className: 'u-flex u-items-center u-gap-3' },
        h('span', { className: 'e-chip-glow', style: { width: 38, height: 38, flex: '0 0 auto' }, 'aria-hidden': 'true' },
          h(r.icon, { size: 19 })),
        h('div', { className: 'u-grow' },
          h('div', { className: 'e-tile__title' }, r.title),
          h('div', { className: 'e-tile__meta' }, r.who + ' · ' + r.whoSub)),
        h(Ic.ChevronRight, { size: 18, style: { color: 'var(--plate-ink-sub)', flex: '0 0 auto' } })),
      h('p', { className: 'e-tile__meta', style: { margin: 0, lineHeight: 'var(--lh-normal)' } }, r.meta),
      h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3' },
        h('span', { className: 'e-btn e-btn--glow e-btn--sm', style: { pointerEvents: 'none' } },
          h('span', null, r.cta), h(Ic.ArrowRight, { size: 14 })),
        h('span', {
          role: 'button', tabIndex: 0,
          className: 'e-btn e-btn--ghost e-btn--sm',
          onClick: (e) => { e.stopPropagation(); setHelpFor(r); },
          onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setHelpFor(r); } },
        }, h('span', null, 'Что внутри')))
    );

    return h(React.Fragment, null,
      h(AppShell, { rail, panel },
        // шапка плашки
        h('div', { className: 'e-plate__kicker', key: 'k' }, 'С возвращением'),
        h('h1', { className: 'e-plate__h1', style: { marginTop: 'var(--sp-2)' }, key: 'h1' }, 'Куда заходим'),
        h('p', { className: 'e-plate__sub', key: 'sub' },
          'Один аккаунт — две проекции. Ученик видит свои задачи и маршрут, родитель — спокойный контроль и отчёты. Выбери, как зайти сейчас — переключиться можно в любой момент.'),

        // развилка ролей
        h('section', { className: 'e-plate-card', key: 'pick' },
          h('div', { className: 'e-plate-card__label' }, 'Выбери кабинет'),
          h('p', { className: 'e-plate-card__hint' }, 'Нажми карточку — попадёшь сразу внутрь. «Что внутри» откроет короткое пояснение.'),
          h('div', { style: { display: 'grid', gap: 'var(--sp-3)', marginTop: 'var(--sp-4)' } },
            roles.map(roleTile))),

        // маркетинговый баннер без давления
        h(Banner, {
          key: 'bn', tone: 'dark',
          kicker: 'Ассистент на связи',
          title: 'Подскажем, с чего начать сегодня',
          text: 'Спроси про вузы, гранты, документы и сроки — навигатор держит в голове весь твой путь.',
          cta: 'Открыть ассистента', to: '/assistant',
        })
      ),

      // Модалка-пояснение про роль (мягкий выход — без мёртвых кнопок)
      h(Modal, {
        open: !!helpFor, onClose: () => setHelpFor(null),
        title: helpFor ? helpFor.title : '',
        footer: helpFor ? h(React.Fragment, null,
          h(Button, { variant: 'ghost', onClick: () => setHelpFor(null) }, 'Назад'),
          h(Button, {
            variant: 'primary', iconRight: Ic.ArrowRight,
            onClick: () => { const r = helpFor; setHelpFor(null); setPicked(r.id); nav(r.to); },
          }, helpFor.cta)) : null,
      },
        helpFor ? h('div', { className: 'u-stack-3' },
          h('div', { className: 'u-flex u-items-center u-gap-3' },
            h('span', { className: 'e-chip-glow', style: { width: 40, height: 40, flex: '0 0 auto' }, 'aria-hidden': 'true' },
              h(helpFor.icon, { size: 20 })),
            h('div', null,
              h('div', { style: { fontWeight: 'var(--fw-bold)', color: 'var(--ink)' } }, helpFor.who),
              h('div', { style: { fontSize: 'var(--fs-sm)', color: 'var(--ink-soft)' } }, helpFor.whoSub))),
          h('p', { style: { color: 'var(--ink-soft)', lineHeight: 'var(--lh-relaxed)' } }, helpFor.help)
        ) : null)
    );
  }

  EScreens.Home = Home;
})();
