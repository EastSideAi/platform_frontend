/* ============================================================================
   EastSide — CRM · Таблица клиентов (window.EScreens.CrmClients · route #/crm)
   ----------------------------------------------------------------------------
   Командный экран. Главный вопрос: «зайти и за минуту понять, что с клиентом».
   Единый источник правды — карточка клиента; здесь ее обзорный срез для команды.

   Каркас — КОМАНДНЫЙ шелл: свой Sidebar с секциями команды (Клиенты активны,
   остальное — переход-заглушки) + Topbar с поиском и кнопкой «Новый лид».
   Широкий контейнер, плотная таблица, панель фильтров, пагинация. Строка ведет
   на карточку клиента (#/crm/client).

   Собран ТОЛЬКО из компонентов window.EUI и токенов (var(--token) + утилиты
   styles.css). Никакого хардкода цвета/размера/тени. Данные — локальный mock в
   этом файле (общий mock подключит wiring-агент).
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useMemo } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const {
    Sidebar, Topbar, Table, Card, Button, IconButton, Badge, Pill, Avatar,
    Input, Select, SegmentedControl, Pagination, EmptyState, Drawer,
  } = U;

  // --- Справочники (повторяют enum'ы из ARCHITECTURE / contracts) -----------
  // Трек сегментации grade × readiness (load-bearing логика воронки).
  const TRACK = {
    guided: { label: 'Guided', tone: 'jade' },
    prep: { label: 'Prep', tone: 'info' },
    explore: { label: 'Explore', tone: 'neutral' },
  };
  // Стадия воронки продаж (deal_stage из ARCHITECTURE §4).
  const STAGE = {
    novyy: { label: 'Новый', tone: 'neutral' },
    kvalifikaciya: { label: 'Квалификация', tone: 'neutral' },
    diagnostika: { label: 'Диагностика', tone: 'info' },
    razbor: { label: 'Разбор назначен', tone: 'info' },
    predlozhenie: { label: 'Предложение', tone: 'warning' },
    oplata: { label: 'Оплата', tone: 'warning' },
    vyigran: { label: 'Клиент', tone: 'success' },
    proigran: { label: 'Проигран', tone: 'danger' },
  };

  // --- Локальный mock (wiring-агент заменит на window.EApi.crmClients) ------
  const SOURCES = ['Сайт', 'Telegram-бот', 'ВКонтакте', 'Реф-ссылка', 'Эфир', 'Яндекс'];
  const CURATORS = [
    { name: 'Анна Лебедева', online: true },
    { name: 'Дмитрий Орлов', online: false },
    { name: 'Камила Юсупова', online: true },
    { name: 'Сергей Панин', online: false },
  ];
  const ROWS = [
    { id: 'c-1041', student: 'Дима Соколов', city: 'Москва', parent: 'Марина Соколова', track: 'guided', stage: 'oplata', chance: 78, payAmount: 45000, payLabel: 'Стандарт, 12 июля', curator: 0, source: 'Сайт', utm: 'cpc / china-2026', risk: false },
    { id: 'c-1042', student: 'Алина Жанбекова', city: 'Алматы', parent: 'Гульнара Жанбекова', track: 'prep', stage: 'razbor', chance: 64, payAmount: null, payLabel: '—', curator: 2, source: 'Telegram-бот', utm: 'bot / start', risk: false },
    { id: 'c-1043', student: 'Тимур Идрисов', city: 'Казань', parent: 'Рустам Идрисов', track: 'explore', stage: 'diagnostika', chance: 41, payAmount: 990, payLabel: 'Диагностика, ожидает', curator: 1, source: 'ВКонтакте', utm: 'vk / target-9kl', risk: true },
    { id: 'c-1044', student: 'Соня Верещагина', city: 'Санкт-Петербург', parent: 'Ольга Верещагина', track: 'guided', stage: 'vyigran', chance: 82, payAmount: 30000, payLabel: 'Премиум, 1 авг', curator: 0, source: 'Реф-ссылка', utm: 'ref / partner-77', risk: false },
    { id: 'c-1045', student: 'Артем Власов', city: 'Новосибирск', parent: 'Ирина Власова', track: 'prep', stage: 'predlozhenie', chance: 59, payAmount: null, payLabel: 'Ждет оффер', curator: 3, source: 'Эфир', utm: 'webinar / may', risk: false },
    { id: 'c-1046', student: 'Лейла Сатпаева', city: 'Астана', parent: 'Динара Сатпаева', track: 'guided', stage: 'oplata', chance: 71, payAmount: 45000, payLabel: 'Стандарт, 18 июля', curator: 2, source: 'Telegram-бот', utm: 'bot / kz', risk: false },
    { id: 'c-1047', student: 'Никита Громов', city: 'Екатеринбург', parent: 'Павел Громов', track: 'explore', stage: 'kvalifikaciya', chance: 33, payAmount: null, payLabel: '—', curator: 1, source: 'Яндекс', utm: 'yd / search', risk: true },
    { id: 'c-1048', student: 'Майя Рустамова', city: 'Уфа', parent: 'Зухра Рустамова', track: 'prep', stage: 'diagnostika', chance: 56, payAmount: 990, payLabel: 'Диагностика, оплачена', curator: 3, source: 'Сайт', utm: 'organic / blog', risk: false },
    { id: 'c-1049', student: 'Глеб Зотов', city: 'Самара', parent: 'Елена Зотова', track: 'guided', stage: 'razbor', chance: 67, payAmount: null, payLabel: '—', curator: 0, source: 'Реф-ссылка', utm: 'ref / partner-12', risk: false },
    { id: 'c-1050', student: 'Аружан Бекова', city: 'Шымкент', parent: 'Асель Бекова', track: 'explore', stage: 'novyy', chance: 28, payAmount: null, payLabel: '—', curator: 2, source: 'ВКонтакте', utm: 'vk / target-kz', risk: false },
    { id: 'c-1051', student: 'Кирилл Маслов', city: 'Краснодар', parent: 'Наталья Маслова', track: 'prep', stage: 'predlozhenie', chance: 61, payAmount: null, payLabel: 'Ждет оффер', curator: 1, source: 'Эфир', utm: 'webinar / jun', risk: false },
    { id: 'c-1052', student: 'Эльвира Гайнуллина', city: 'Челябинск', parent: 'Рамиль Гайнуллин', track: 'guided', stage: 'vyigran', chance: 85, payAmount: 30000, payLabel: 'Премиум, 5 авг', curator: 3, source: 'Сайт', utm: 'cpc / china-2026', risk: false },
    { id: 'c-1053', student: 'Марк Третьяков', city: 'Пермь', parent: 'Светлана Третьякова', track: 'explore', stage: 'diagnostika', chance: 38, payAmount: 990, payLabel: 'Диагностика, ожидает', curator: 0, source: 'Telegram-бот', utm: 'bot / start', risk: true },
    { id: 'c-1054', student: 'Дана Алиева', city: 'Караганда', parent: 'Жанна Алиева', track: 'prep', stage: 'razbor', chance: 53, payAmount: null, payLabel: '—', curator: 2, source: 'Реф-ссылка', utm: 'ref / partner-77', risk: false },
    { id: 'c-1055', student: 'Степан Лазарев', city: 'Воронеж', parent: 'Андрей Лазарев', track: 'guided', stage: 'oplata', chance: 74, payAmount: 45000, payLabel: 'Стандарт, 20 июля', curator: 1, source: 'Яндекс', utm: 'yd / search', risk: false },
  ];

  const rub = (n) => (n == null ? '' : Number(n).toLocaleString('ru-RU') + ' ₽');
  const PAGE_SIZE = 8;

  // --- Локальные стили экрана: ТОЛЬКО токены (var(--*)), 0 хардкода ----------
  // Инжектится один раз. Та же дисциплина, что в styles.css — значения берутся
  // из tokens.css, смена темы работает сама. Раскладка/плотность таблицы.
  const STYLE_ID = 'crm-clients-style';
  function ensureStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = [
      '.crm-shell-wrap{padding:var(--sp-5) var(--sp-4) var(--sp-16);}',
      '@media (min-width:768px){.crm-shell-wrap{padding:var(--sp-8) var(--sp-8) var(--sp-16);}}',
      '.crm-wrap{max-width:var(--content-wide);margin-inline:auto;display:flex;flex-direction:column;gap:var(--sp-5);}',
      '.crm-head{display:flex;align-items:flex-end;justify-content:space-between;gap:var(--sp-4);flex-wrap:wrap;}',
      '.crm-head__title{margin:var(--sp-1) 0 0;}',
      '.crm-head__sub{color:var(--ink-soft);font-size:var(--fs-sm);margin:var(--sp-2) 0 0;max-width:62ch;line-height:var(--lh-normal);}',
      '.crm-head__count{font-family:var(--font-display);font-weight:var(--fw-bold);font-size:var(--fs-sm);color:var(--ink-mute);white-space:nowrap;padding-bottom:var(--sp-1);}',
      '.crm-topsearch{width:clamp(220px,26vw,320px);}',
      '.crm-mobile-search{margin-top:calc(var(--sp-2) * -1);}',
      '.crm-board{padding:0;overflow:hidden;}',
      '.crm-filters{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);flex-wrap:wrap;padding:var(--sp-4) var(--sp-4) var(--sp-3);border-bottom:1px solid var(--line);}',
      '@media (min-width:768px){.crm-filters{padding:var(--sp-4) var(--sp-5) var(--sp-3);}}',
      '.crm-filters__selects{display:flex;gap:var(--sp-2);flex-wrap:wrap;}',
      '.crm-filters__selects .e-select{min-width:148px;}',
      '.crm-tablewrap{width:100%;}',
      // делаем строку плотнее и кликабельной без вложенных кнопок-«коробок»
      '.crm-board .e-table td{padding-block:var(--sp-2);vertical-align:middle;}',
      '.crm-rowlink{display:flex;width:100%;background:none;border:0;padding:0;margin:0;text-align:left;cursor:pointer;color:inherit;font:inherit;border-radius:var(--r-sm);}',
      '.crm-rowlink:focus-visible{outline:none;box-shadow:var(--sh-focus);}',
      '.crm-rowclick{cursor:pointer;}',
      '.crm-cell-name{display:flex;align-items:center;gap:var(--sp-3);min-width:0;}',
      '.crm-cell-name__txt{display:flex;flex-direction:column;min-width:0;}',
      '.crm-cell-name__main{font-weight:var(--fw-semibold);color:var(--ink);white-space:nowrap;}',
      '.crm-cell-name__sub{font-size:var(--fs-xs);color:var(--ink-mute);}',
      '.crm-cell-stack{display:flex;flex-direction:column;min-width:0;}',
      '.crm-cell-stack__main{color:var(--ink-soft);white-space:nowrap;}',
      '.crm-cell-stack__sub{font-size:var(--fs-2xs);color:var(--ink-mute);}',
      '.crm-utm{font-variant-numeric:tabular-nums;letter-spacing:var(--tracking-snug);}',
      '.crm-chance{font-family:var(--font-display);font-weight:var(--fw-bold);}',
      '.crm-cell-pay{display:flex;flex-direction:column;align-items:flex-end;}',
      '.crm-cell-pay__sum{font-weight:var(--fw-semibold);}',
      '.crm-cell-pay__note{font-size:var(--fs-2xs);color:var(--ink-mute);font-variant-numeric:normal;}',
      '.crm-cell-pay__none{color:var(--ink-faint);}',
      '.crm-cell-cur{display:flex;align-items:center;gap:var(--sp-2);min-width:0;}',
      '.crm-cell-cur__name{font-size:var(--fs-sm);color:var(--ink-soft);white-space:nowrap;}',
      '.crm-risk{display:inline-flex;color:var(--warning-ink);}',
      '.crm-row-go{color:var(--ink-faint);}',
      '.crm-board .e-table tr:hover .crm-row-go{color:var(--ink-mute);}',
      '.crm-foot{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);flex-wrap:wrap;padding:var(--sp-3) var(--sp-4);border-top:1px solid var(--line);}',
      '@media (min-width:768px){.crm-foot{padding:var(--sp-3) var(--sp-5);}}',
      '.crm-foot__count{font-size:var(--fs-xs);color:var(--ink-mute);}',
    ].join('');
    document.head.appendChild(el);
  }
  ensureStyle();

  // --- Секции командного рейла ---------------------------------------------
  function railSections(active) {
    return [{
      label: 'CRM команды',
      items: [
        { icon: Ic.Users, label: 'Клиенты', to: '/crm', active: active === 'clients', badge: ROWS.length },
        { icon: Ic.Funnel, label: 'Воронка', to: '/crm/funnel' },
        { icon: Ic.CheckCircle, label: 'Задачи', to: '/crm', dot: true },
        { icon: Ic.Doc, label: 'Документы', to: '/crm' },
        { icon: Ic.TrendUp, label: 'Аналитика', to: '/crm' },
      ],
    }, {
      label: 'База знаний',
      items: [
        { icon: Ic.Cap, label: 'Вузы и гранты', to: '/crm' },
        { icon: Ic.Settings, label: 'Настройки', to: '/crm' },
      ],
    }];
  }

  function CrmClients() {
    const [q, setQ] = useState('');
    const [stage, setStage] = useState('all');
    const [track, setTrack] = useState('all');
    const [source, setSource] = useState('all');
    const [curatorF, setCuratorF] = useState('all');
    const [page, setPage] = useState(1);
    const [navOpen, setNavOpen] = useState(false);

    // --- Фильтрация (на клиенте; бэк отдаст уже отфильтрованное) ------------
    const filtered = useMemo(() => {
      const needle = q.trim().toLowerCase();
      return ROWS.filter((r) => {
        if (track !== 'all' && r.track !== track) return false;
        if (source !== 'all' && r.source !== source) return false;
        if (curatorF !== 'all' && String(r.curator) !== curatorF) return false;
        if (stage === 'risk' && !r.risk) return false;
        if (stage === 'clients' && r.stage !== 'vyigran') return false;
        if (stage === 'active' && (r.stage === 'vyigran' || r.stage === 'proigran')) return false;
        if (needle) {
          const hay = (r.student + ' ' + r.parent + ' ' + r.city + ' ' + r.id).toLowerCase();
          if (hay.indexOf(needle) === -1) return false;
        }
        return true;
      });
    }, [q, stage, track, source, curatorF]);

    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const safePage = Math.min(page, pages);
    const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
    // Select зовет onChange(value); сбрасываем страницу при любом изменении фильтра.
    const resetPage = (fn) => (v) => { fn(v); setPage(1); };
    // Input — нативный, отдает событие; берем строку и сбрасываем страницу.
    const onSearch = (e) => { setQ(e.target.value); setPage(1); };

    const goClient = (r) => { window.location.hash = '#/crm/client'; };

    // --- Колонки таблицы ----------------------------------------------------
    const columns = [
      {
        key: 'student', title: 'Ученик',
        render: (r) => h('div', { className: 'crm-cell-name' },
          h(Avatar, { name: r.student, size: 'sm', key: 'a' }),
          h('div', { className: 'crm-cell-name__txt', key: 't' },
            h('span', { className: 'crm-cell-name__main' }, r.student),
            h('span', { className: 'crm-cell-name__sub' }, r.city))),
      },
      {
        key: 'parent', title: 'Родитель-плательщик',
        render: (r) => h('div', { className: 'crm-cell-stack' },
          h('span', { className: 'crm-cell-stack__main' }, r.parent),
          h('span', { className: 'crm-cell-stack__sub' }, 'Платит и продлевает')),
      },
      {
        key: 'track', title: 'Трек',
        render: (r) => { const t = TRACK[r.track]; return h(Badge, { tone: t.tone }, t.label); },
      },
      {
        key: 'stage', title: 'Этап воронки',
        render: (r) => { const s = STAGE[r.stage]; return h(Pill, { tone: s.tone }, s.label); },
      },
      {
        key: 'chance', title: 'Шанс', num: true,
        render: (r) => h('span', { className: 'u-critical u-tnum crm-chance' }, r.chance + '%'),
      },
      {
        key: 'pay', title: 'Следующий платеж', num: true,
        render: (r) => r.payAmount != null
          ? h('div', { className: 'crm-cell-pay' },
            h('span', { className: 'u-critical u-tnum crm-cell-pay__sum' }, rub(r.payAmount)),
            h('span', { className: 'crm-cell-pay__note' }, r.payLabel))
          : h('span', { className: 'crm-cell-pay__none' }, '—'),
      },
      {
        key: 'curator', title: 'Куратор',
        render: (r) => { const cu = CURATORS[r.curator]; return h('div', { className: 'crm-cell-cur' },
          h(Avatar, { name: cu.name, size: 'sm', status: cu.online ? true : undefined, key: 'a' }),
          h('span', { className: 'crm-cell-cur__name', key: 'n' }, cu.name.split(' ')[0])); },
      },
      {
        key: 'source', title: 'Источник',
        render: (r) => h('div', { className: 'crm-cell-stack' },
          h('span', { className: 'crm-cell-stack__main' }, r.source),
          h('span', { className: 'crm-cell-stack__sub crm-utm' }, r.utm)),
      },
      {
        key: 'risk', title: '', num: true,
        render: (r) => r.risk
          ? h('span', { className: 'crm-risk', title: 'Требует внимания' },
            h(Ic.AlertTriangle, { size: 17, key: 'i' }))
          : h(Ic.ChevronRight, { size: 16, className: 'crm-row-go', key: 'g' }),
      },
    ];

    // оборачиваем render так, чтобы вся строка была кликабельной
    const rows = pageRows.map((r) => Object.assign({}, r, { _onClick: () => goClient(r) }));
    const tableColumns = columns.map((c, ci) => ci === 0 ? Object.assign({}, c, {
      render: (r, i) => h('button', {
        type: 'button', className: 'crm-rowlink', onClick: r._onClick,
        'aria-label': 'Открыть карточку: ' + r.student,
      }, c.render(r, i)),
    }) : Object.assign({}, c, {
      render: (r, i) => h('div', { className: 'crm-rowclick', onClick: r._onClick }, c.render(r, i)),
    }));

    const empty = h(EmptyState, {
      icon: Ic.Search,
      title: 'Никого не нашли',
      text: 'Под эти фильтры клиентов нет. Сбрось поиск или поменяй условия — и список вернется.',
      action: h(Button, {
        variant: 'secondary', size: 'sm', iconLeft: Ic.Close,
        onClick: () => { setQ(''); setStage('all'); setTrack('all'); setSource('all'); setCuratorF('all'); setPage(1); },
      }, 'Сбросить фильтры'),
    });

    // --- Рейл (командный) и топбар -----------------------------------------
    const rail = h(Sidebar, {
      brand: { name: 'EastSide', mark: 'E' },
      sections: railSections('clients'),
      user: { name: 'Анна Лебедева', role: 'Куратор' },
      footer: h(window.ETheme.ThemeToggle, { variant: 'cycle' }),
    });

    const topbar = h(Topbar, {
      title: 'Клиенты',
      onMenu: () => setNavOpen(true),
      right: h('div', { className: 'u-flex u-items-center u-gap-2' },
        h('div', { className: 'crm-topsearch u-hide-mobile', key: 'srch' },
          h(Input, {
            iconLeft: Ic.Search, value: q, onChange: onSearch,
            placeholder: 'Имя, родитель, город или ID', 'aria-label': 'Поиск клиента',
          })),
        h(Button, { variant: 'primary', size: 'sm', iconLeft: Ic.Plus, key: 'new' }, 'Новый лид'),
        h(IconButton, { icon: Ic.Bell, label: 'Уведомления', key: 'bell' })
      ),
    });

    // --- Панель фильтров над таблицей --------------------------------------
    const stageSeg = h(SegmentedControl, {
      ariaLabel: 'Статус воронки', value: stage, onChange: resetPage(setStage),
      options: [
        { value: 'all', label: 'Все' },
        { value: 'active', label: 'В работе' },
        { value: 'clients', label: 'Клиенты' },
        { value: 'risk', label: 'Риск' },
      ],
    });

    const filters = h('div', { className: 'crm-filters' },
      h('div', { className: 'crm-filters__lead' }, stageSeg),
      h('div', { className: 'crm-filters__selects' },
        h(Select, {
          value: track, onChange: resetPage(setTrack), placeholder: 'Трек',
          options: [{ value: 'all', label: 'Любой трек' }].concat(
            Object.keys(TRACK).map((k) => ({ value: k, label: TRACK[k].label }))),
        }),
        h(Select, {
          value: source, onChange: resetPage(setSource), placeholder: 'Источник',
          options: [{ value: 'all', label: 'Любой источник' }].concat(
            SOURCES.map((s) => ({ value: s, label: s }))),
        }),
        h(Select, {
          value: curatorF, onChange: resetPage(setCuratorF), placeholder: 'Куратор',
          options: [{ value: 'all', label: 'Все кураторы' }].concat(
            CURATORS.map((c, i) => ({ value: String(i), label: c.name }))),
        })
      )
    );

    // мобильный поиск (в топбаре скрыт на узком)
    const mobileSearch = h('div', { className: 'crm-mobile-search u-hide-desktop' },
      h(Input, {
        iconLeft: Ic.Search, value: q, onChange: onSearch,
        placeholder: 'Имя, родитель, город или ID', 'aria-label': 'Поиск клиента',
      }));

    const countLabel = filtered.length + ' ' + plural(filtered.length, 'клиент', 'клиента', 'клиентов');

    const content = h('div', { className: 'crm-wrap u-animate-page', id: 'main' },
      h('div', { className: 'crm-head' },
        h('div', null,
          h('div', { className: 'u-kicker' }, 'Единый источник правды'),
          h('h1', { className: 'crm-head__title' }, 'Клиенты'),
          h('p', { className: 'crm-head__sub' },
            'Зайди и за минуту пойми, что с клиентом: трек, этап воронки, шанс, ближайший платеж и кто ведет.')),
        h('div', { className: 'crm-head__count u-hide-mobile' }, countLabel)
      ),
      mobileSearch,
      h(Card, { variant: 'flat', className: 'crm-board' },
        filters,
        h('div', { className: 'crm-tablewrap' },
          h(Table, { columns: tableColumns, rows, rowKey: 'id', empty: filtered.length ? null : empty })),
        filtered.length ? h('div', { className: 'crm-foot' },
          h('span', { className: 'crm-foot__count u-tnum' },
            'Показаны ' + ((safePage - 1) * PAGE_SIZE + 1) + '–' +
            Math.min(safePage * PAGE_SIZE, filtered.length) + ' из ' + filtered.length),
          pages > 1 ? h(Pagination, { page: safePage, pages, onChange: setPage }) : null
        ) : null
      )
    );

    return h('div', { className: 'u-shell' },
      h('div', { className: 'u-hide-mobile' }, rail),
      h('div', { className: 'u-flex-col', style: { minWidth: 0 } },
        topbar,
        h('div', { className: 'crm-shell-wrap' }, content)
      ),
      h(Drawer, { open: navOpen, onClose: () => setNavOpen(false), side: 'left', title: 'EastSide' }, rail)
    );
  }

  // склонение числительных без буквы е с точками
  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  EScreens.CrmClients = CrmClients;
})();
