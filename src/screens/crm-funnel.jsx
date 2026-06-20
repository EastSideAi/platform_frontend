/* ============================================================================
   EastSide — CRM · Воронка продаж (window.EScreens.CrmFunnel · route #/crm/funnel)
   ----------------------------------------------------------------------------
   Третий экран CRM. Командный шелл (свой рейл с секциями команды + топбар),
   широкий контейнер. Канбан: стадии воронки продаж из ARCHITECTURE §4
   (новый -> квалификация -> диагностика -> разбор назначен -> разбор проведен
   -> предложение -> оплата -> выигран). Горизонтальный скролл колонок.

   Карточка сделки лаконична: имя, чек (charcoal, .u-critical), куратор-аватар,
   дней в стадии, источник-пилюля, флаг если завис. Шапка колонки — тон по стадии,
   счетчик и сумма. Не перегружаем — это рабочая доска команды, не витрина.

   Собран ТОЛЬКО из window.EUI и токенов tokens.css. Никакого хардкода цвета/
   размера/тени — только var(--token) в инлайн-стилях раскладки (так же, как в
   эталоне cabinet-parent.jsx). Данные — локальный mock в этом файле; реальные
   придут из GET /api/crm/deals/board (подключит wiring-агент).
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useMemo, useEffect } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const {
    Sidebar, Topbar, Card, Button, Badge, Pill, Avatar, IconButton,
    Input, Select, Drawer, Tooltip,
  } = U;

  const rub = (n) => (n == null ? '—' : Number(n).toLocaleString('ru-RU') + ' ₽');
  // короткий формат суммы для шапки колонки: 1 240 000 -> 1,24 млн
  const rubShort = (n) => {
    if (!n) return '0 ₽';
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 2).replace('.', ',') + ' млн ₽';
    if (n >= 1e3) return Math.round(n / 1e3) + ' тыс ₽';
    return rub(n);
  };
  // склонение "день"
  const daysWord = (d) => {
    const m10 = d % 10, m100 = d % 100;
    if (m10 === 1 && m100 !== 11) return d + ' день';
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return d + ' дня';
    return d + ' дней';
  };

  // --- Стадии воронки (enum deal_stage из ARCHITECTURE §4) ------------------
  // tone -> тон шапки колонки. limit -> сколько дней в стадии = "завис".
  const STAGES = [
    { key: 'new', title: 'Новый лид', tone: 'neutral', stale: 3 },
    { key: 'qualified', title: 'Квалифицирован', tone: 'info', stale: 5 },
    { key: 'diag_booked', title: 'Записан на диагностику', tone: 'info', stale: 7 },
    { key: 'diag_done', title: 'Диагностика проведена', tone: 'jade', stale: 7 },
    { key: 'assessment_sent', title: 'Заключение отправлено', tone: 'jade', stale: 6 },
    { key: 'proposal', title: 'Коммерческое предложение', tone: 'ochre', stale: 8 },
    { key: 'contract', title: 'Договор', tone: 'ochre', stale: 6 },
    { key: 'payment', title: 'Оплата', tone: 'warning', stale: 4 },
    { key: 'won', title: 'Клиент', tone: 'success', stale: 99 },
  ];

  // Маппинг стадий бэка (enum deal_stage, crm.py _DEAL_STAGES) -> ключи колонок
  // фронта. Зафиксировано в phase5-integration §2 (board -> колонки).
  const BACK_STAGE = {
    novyj: 'new',
    kvalifikaciya: 'qualified',
    diagnostika: 'diag_booked',
    razbor_naznachen: 'diag_booked',
    razbor_proveden: 'diag_done',
    predlozhenie: 'proposal',
    oplata: 'payment',
    vyigran: 'won',
    proigran: 'won',
  };

  // Развернуть ответ бэка {board:{stage:[cards]}} в плоский список сделок формы
  // экрана. Карточка бэка: {id, client_id, stage, amount, owner_user_id}.
  function dealsFromBoard(board) {
    if (!board || typeof board !== 'object') return null;
    const out = [];
    Object.keys(board).forEach((backStage) => {
      const col = board[backStage] || [];
      col.forEach((c) => {
        out.push({
          id: c.id || c.client_id,
          stage: BACK_STAGE[c.stage || backStage] || 'new',
          name: c.display_name || c.name || ('Клиент ' + String(c.client_id || '').slice(0, 6)),
          amount: c.amount != null ? Number(c.amount) : null,
          curator: c.owner_name || c.curator || '—',
          source: c.source || 'Анкета на сайте',
          daysInStage: c.days_in_stage != null ? c.days_in_stage : 0,
          track: c.track || 'guided',
        });
      });
    });
    return out;
  }

  // тон шапки -> переменные фона/текста (только токены)
  const HEAD_TONE = {
    neutral: { bg: 'var(--surface-sunken)', dot: 'var(--ink-mute)', ink: 'var(--ink)' },
    info: { bg: 'var(--info-soft)', dot: 'var(--info)', ink: 'var(--ink)' },
    jade: { bg: 'var(--jade-tint)', dot: 'var(--jade)', ink: 'var(--ink)' },
    ochre: { bg: 'var(--ochre-soft)', dot: 'var(--ochre)', ink: 'var(--ink)' },
    warning: { bg: 'var(--warning-soft)', dot: 'var(--warning)', ink: 'var(--ink)' },
    success: { bg: 'var(--jade-soft)', dot: 'var(--success)', ink: 'var(--ink)' },
  };

  // источник лида -> тон пилюли
  const SOURCE_TONE = {
    'Анкета на сайте': 'jade',
    'Telegram-бот': 'info',
    'ВКонтакте': 'info',
    'Реферал партнера': 'neutral',
    'Вебинар': 'neutral',
    'Рекомендация': 'neutral',
  };

  // --- Локальный mock доски (форма ~ GET /api/crm/deals/board) --------------
  const MOCK_DEALS = [
    { id: 'd1', stage: 'new', name: 'Артем Лебедев', amount: null, curator: 'Анна Лебедева', source: 'Анкета на сайте', daysInStage: 1, track: 'guided' },
    { id: 'd2', stage: 'new', name: 'Сабина Нуржанова', amount: null, curator: 'Дмитрий Орлов', source: 'Telegram-бот', daysInStage: 0, track: 'explore' },
    { id: 'd3', stage: 'new', name: 'Кирилл Фомин', amount: null, curator: 'Анна Лебедева', source: 'Реферал партнера', daysInStage: 5, track: 'prep' },

    { id: 'd4', stage: 'qualified', name: 'Дарья Соколова', amount: 290000, curator: 'Дмитрий Орлов', source: 'Анкета на сайте', daysInStage: 2, track: 'guided' },
    { id: 'd5', stage: 'qualified', name: 'Тимур Алиев', amount: 180000, curator: 'Анна Лебедева', source: 'ВКонтакте', daysInStage: 8, track: 'prep' },

    { id: 'd6', stage: 'diag_booked', name: 'Алина Громова', amount: 290000, curator: 'Анна Лебедева', source: 'Вебинар', daysInStage: 3, track: 'guided' },
    { id: 'd7', stage: 'diag_booked', name: 'Максим Орлов', amount: 220000, curator: 'Дмитрий Орлов', source: 'Telegram-бот', daysInStage: 1, track: 'prep' },

    { id: 'd8', stage: 'diag_done', name: 'Виктория Зайцева', amount: 340000, curator: 'Дмитрий Орлов', source: 'Анкета на сайте', daysInStage: 2, track: 'guided' },

    { id: 'd9', stage: 'assessment_sent', name: 'Никита Беляев', amount: 340000, curator: 'Анна Лебедева', source: 'Реферал партнера', daysInStage: 4, track: 'guided' },
    { id: 'd10', stage: 'assessment_sent', name: 'Ева Карпова', amount: 290000, curator: 'Дмитрий Орлов', source: 'Анкета на сайте', daysInStage: 9, track: 'prep' },

    { id: 'd11', stage: 'proposal', name: 'Руслан Сафин', amount: 420000, curator: 'Анна Лебедева', source: 'Рекомендация', daysInStage: 3, track: 'guided' },
    { id: 'd12', stage: 'proposal', name: 'Полина Жукова', amount: 290000, curator: 'Дмитрий Орлов', source: 'Вебинар', daysInStage: 11, track: 'guided' },

    { id: 'd13', stage: 'contract', name: 'Глеб Морозов', amount: 420000, curator: 'Анна Лебедева', source: 'Анкета на сайте', daysInStage: 2, track: 'guided' },

    { id: 'd14', stage: 'payment', name: 'София Власова', amount: 420000, curator: 'Дмитрий Орлов', source: 'Рекомендация', daysInStage: 1, track: 'guided' },
    { id: 'd15', stage: 'payment', name: 'Артур Гайнуллин', amount: 340000, curator: 'Анна Лебедева', source: 'Telegram-бот', daysInStage: 6, track: 'guided' },

    { id: 'd16', stage: 'won', name: 'Михаил Тарасов', amount: 420000, curator: 'Анна Лебедева', source: 'Реферал партнера', daysInStage: 0, track: 'guided' },
    { id: 'd17', stage: 'won', name: 'Аделина Юсупова', amount: 290000, curator: 'Дмитрий Орлов', source: 'Анкета на сайте', daysInStage: 0, track: 'prep' },
  ];

  const CURATORS = [
    { value: 'all', label: 'Все кураторы' },
    { value: 'Анна Лебедева', label: 'Анна Лебедева' },
    { value: 'Дмитрий Орлов', label: 'Дмитрий Орлов' },
  ];

  // --- Рейл команды (свой, отличается от клиентских кабинетов) --------------
  function teamSections(active) {
    return [
      {
        label: 'Продажи',
        items: [
          { icon: Ic.Funnel, label: 'Воронка продаж', to: '/crm/funnel', active: active === 'funnel' },
          { icon: Ic.Users, label: 'Клиенты', to: '/crm' },
          { icon: Ic.Target, label: 'Сделки', to: '/crm/funnel', badge: 17 },
        ],
      },
      {
        label: 'Ведение',
        items: [
          { icon: Ic.Route, label: 'Дорожные карты', to: '/crm/funnel' },
          { icon: Ic.Doc, label: 'Документы', to: '/crm/funnel' },
          { icon: Ic.Chat, label: 'Диалоги', to: '/crm/funnel', dot: true },
          { icon: Ic.Calendar, label: 'Расписание', to: '/crm/funnel' },
        ],
      },
      {
        label: 'База',
        items: [
          { icon: Ic.Cap, label: 'Вузы и гранты', to: '/crm/funnel' },
          { icon: Ic.Grid, label: 'Продукты', to: '/crm/funnel' },
        ],
      },
    ];
  }

  // --- Карточка сделки ------------------------------------------------------
  function DealCard(props) {
    const { deal, stale, onOpen } = props;
    const isStale = deal.stage !== 'won' && deal.daysInStage >= stale;
    const srcTone = SOURCE_TONE[deal.source] || 'neutral';

    return h('button', {
      type: 'button',
      className: 'e-card e-card--pad-sm e-card--clickable',
      onClick: () => onOpen && onOpen(deal),
      style: {
        textAlign: 'left', width: '100%', display: 'block',
        borderColor: isStale ? 'var(--warning)' : undefined,
      },
    },
      // строка 1: имя + флаг "завис"
      h('div', {
        className: 'u-flex u-items-center u-justify-between u-gap-2',
        style: { marginBottom: 'var(--sp-2)' }, key: 'r1',
      },
        h('span', {
          className: 'u-truncate',
          style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-base)', color: 'var(--ink)' },
        }, deal.name),
        isStale ? h(Tooltip, { label: 'Завис в стадии: ' + daysWord(deal.daysInStage), key: 'flag' },
          h('span', {
            'aria-label': 'Сделка зависла',
            style: { display: 'inline-flex', color: 'var(--warning-ink)' },
          }, h(Ic.Flag, { size: 15 }))
        ) : null
      ),

      // строка 2: чек (charcoal, critical) — факт о деньгах
      h('div', {
        className: 'u-critical u-tnum',
        style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)', letterSpacing: 'var(--tracking-snug)', marginBottom: 'var(--sp-3)' },
        key: 'r2',
      }, deal.amount == null ? h('span', { style: { color: 'var(--ink-faint)', fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-medium)' } }, 'чек не определен') : rub(deal.amount)),

      // строка 3: источник-пилюля + дней в стадии
      h('div', {
        className: 'u-flex u-items-center u-justify-between u-gap-2',
        style: { marginBottom: 'var(--sp-3)' }, key: 'r3',
      },
        h(Badge, { tone: srcTone, key: 'src' }, deal.source),
        h('span', {
          className: 'u-flex u-items-center u-gap-1',
          style: { color: 'var(--ink-mute)', fontSize: 'var(--fs-xs)', flexShrink: 0 },
        },
          h(Ic.Clock, { size: 13, key: 'c' }),
          h('span', { className: 'u-tnum', key: 't' }, daysWord(deal.daysInStage)))
      ),

      // строка 4: куратор (аватар + имя)
      h('div', {
        className: 'u-flex u-items-center u-gap-2',
        style: { paddingTop: 'var(--sp-3)', borderTop: '1px solid var(--line)' }, key: 'r4',
      },
        h(Avatar, { name: deal.curator, size: 'sm', key: 'a' }),
        h('span', {
          className: 'u-truncate',
          style: { color: 'var(--ink-soft)', fontSize: 'var(--fs-xs)' },
        }, deal.curator)
      )
    );
  }

  // --- Колонка стадии -------------------------------------------------------
  function StageColumn(props) {
    const { stage, deals, onOpen } = props;
    const tone = HEAD_TONE[stage.tone] || HEAD_TONE.neutral;
    const count = deals.length;
    const sum = deals.reduce((acc, d) => acc + (d.amount || 0), 0);

    return h('section', {
      className: 'u-flex-col',
      style: {
        flex: '0 0 auto', width: 'var(--es-col-w)', minWidth: 'var(--es-col-w)',
        gap: 'var(--sp-3)',
      },
      'aria-label': stage.title,
    },
      // шапка колонки — тон по стадии
      h('header', {
        style: {
          background: tone.bg, borderRadius: 'var(--r-md)',
          padding: 'var(--sp-3) var(--sp-3)',
          position: 'sticky', top: 0, zIndex: 'var(--z-raised)',
        }, key: 'head',
      },
        h('div', { className: 'u-flex u-items-center u-gap-2', style: { marginBottom: 'var(--sp-1)' }, key: 'top' },
          h('span', {
            'aria-hidden': 'true',
            style: { width: '8px', height: '8px', borderRadius: 'var(--r-pill)', background: tone.dot, flexShrink: 0 },
          }),
          h('span', {
            className: 'u-grow u-truncate',
            style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-semibold)', fontSize: 'var(--fs-sm)', color: tone.ink, letterSpacing: 'var(--tracking-snug)' },
          }, stage.title),
          h('span', {
            className: 'u-tnum',
            style: { fontSize: 'var(--fs-xs)', fontWeight: 'var(--fw-bold)', color: 'var(--ink-soft)', background: 'var(--surface)', borderRadius: 'var(--r-pill)', padding: '0 var(--sp-2)', minWidth: '22px', textAlign: 'center', flexShrink: 0 },
          }, count)
        ),
        h('div', {
          className: 'u-tnum',
          style: { fontSize: 'var(--fs-xs)', color: 'var(--ink-mute)', paddingLeft: 'calc(8px + var(--sp-2))' },
        }, sum ? rubShort(sum) : 'без суммы')
      ),

      // тело колонки — карточки
      count
        ? h('div', { className: 'u-stack-3', key: 'body' },
            deals.map((d) => h(DealCard, { key: d.id, deal: d, stale: stage.stale, onOpen })))
        : h('div', {
            key: 'empty',
            style: {
              border: '1px dashed var(--line-strong)', borderRadius: 'var(--r-md)',
              padding: 'var(--sp-6) var(--sp-3)', textAlign: 'center',
              color: 'var(--ink-faint)', fontSize: 'var(--fs-xs)',
            },
          }, 'Пусто')
    );
  }

  // --- Экран ----------------------------------------------------------------
  function CrmFunnel() {
    const [navOpen, setNavOpen] = useState(false);
    const [curator, setCurator] = useState('all');
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(null); // сделка в дровере
    const [deals, setDeals] = useState(MOCK_DEALS);

    // Тянем доску из бэка (GET /api/crm/deals/board). Если базы бэка нет/запрос
    // упал — EApi сам отдаст mocked-форму, и мы остаемся на встроенном моке.
    useEffect(function () {
      let alive = true;
      if (!window.EApi || !window.EApi.crmFunnel) return undefined;
      window.EApi.crmFunnel().then(function (res) {
        if (!alive || !res || res.mocked) return; // mocked -> держим локальный mock
        const board = res.data && res.data.board ? res.data.board : res.data;
        const list = dealsFromBoard(board);
        if (list && list.length) setDeals(list);
      }).catch(function () { /* фолбэк уже на MOCK_DEALS */ });
      return function () { alive = false; };
    }, []);

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return deals.filter((d) => {
        if (curator !== 'all' && d.curator !== curator) return false;
        if (q && d.name.toLowerCase().indexOf(q) === -1) return false;
        return true;
      });
    }, [deals, curator, query]);

    const byStage = useMemo(() => {
      const map = {};
      STAGES.forEach((s) => { map[s.key] = []; });
      filtered.forEach((d) => { if (map[d.stage]) map[d.stage].push(d); });
      return map;
    }, [filtered]);

    // сводка по доске
    const totalCount = filtered.length;
    const openSum = useMemo(() =>
      filtered.filter((d) => d.stage !== 'won').reduce((a, d) => a + (d.amount || 0), 0)
    , [filtered]);
    const wonCount = byStage.won ? byStage.won.length : 0;

    // --- Рейл ---------------------------------------------------------------
    const rail = h(Sidebar, {
      brand: { name: 'EastSide', mark: 'E' },
      sections: teamSections('funnel'),
      user: { name: 'Анна Лебедева', role: 'Куратор продаж' },
      footer: h(window.ETheme.ThemeToggle, { variant: 'cycle' }),
    });

    // --- Топбар -------------------------------------------------------------
    const topbar = h(Topbar, {
      title: 'Воронка продаж',
      onMenu: () => setNavOpen(true),
      right: h('div', { className: 'u-flex u-items-center u-gap-2' },
        h(IconButton, { icon: Ic.Bell, label: 'Уведомления', key: 'bell' }),
        h(Avatar, { name: 'Анна Лебедева', size: 'sm', key: 'av' })
      ),
    });

    // --- Панель управления доской -------------------------------------------
    const controls = h('div', {
      className: 'u-flex u-items-center u-justify-between u-wrap u-gap-4',
      style: { marginBottom: 'var(--sp-5)' }, key: 'controls',
    },
      // левая часть: сводка
      h('div', { className: 'u-flex u-items-center u-wrap', style: { gap: 'var(--sp-6)' }, key: 'summary' },
        h('div', { key: 's1' },
          h('div', { style: { fontSize: 'var(--fs-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--ink-mute)' } }, 'Сделок в работе'),
          h('div', { className: 'u-tnum', style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xl)', color: 'var(--ink)' } }, totalCount)),
        h('div', { key: 's2' },
          h('div', { style: { fontSize: 'var(--fs-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--ink-mute)' } }, 'Открытый объем'),
          h('div', { className: 'u-critical u-tnum', style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xl)' } }, rub(openSum))),
        h('div', { key: 's3' },
          h('div', { style: { fontSize: 'var(--fs-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--ink-mute)' } }, 'Закрыто в клиента'),
          h('div', { className: 'u-tnum', style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-xl)', color: 'var(--ink)' } }, wonCount))
      ),
      // правая часть: фильтры + действие
      h('div', { className: 'u-flex u-items-center u-wrap u-gap-2', key: 'filters' },
        h('div', { style: { width: '220px' }, key: 'q' },
          h(Input, { value: query, onChange: (e) => setQuery(e.target.value), placeholder: 'Поиск по имени...', iconLeft: Ic.Search, 'aria-label': 'Поиск сделки' })),
        h('div', { style: { width: '190px' }, key: 'c' },
          h(Select, { options: CURATORS, value: curator, onChange: setCurator, 'aria-label': 'Фильтр по куратору' })),
        h(Button, { variant: 'primary', size: 'md', iconLeft: Ic.Plus, key: 'add' }, 'Новая сделка')
      )
    );

    // --- Доска (горизонтальный скролл колонок) ------------------------------
    const board = h('div', {
      key: 'board',
      style: {
        '--es-col-w': '284px',
        display: 'flex', gap: 'var(--sp-4)',
        overflowX: 'auto', paddingBottom: 'var(--sp-6)',
        alignItems: 'flex-start',
      },
    },
      STAGES.map((s) => h(StageColumn, { key: s.key, stage: s, deals: byStage[s.key] || [], onOpen: setActive }))
    );

    // --- Дровер: краткая сводка по сделке (открытие карточки клиента) --------
    const stageOf = active ? STAGES.find((s) => s.key === active.stage) : null;
    const drawerBody = active ? h('div', { className: 'u-stack-5', style: { padding: 'var(--sp-5)' } },
      h('div', { className: 'u-flex u-items-center u-gap-3', key: 'who' },
        h(Avatar, { name: active.name, size: 'lg', key: 'a' }),
        h('div', { key: 'd' },
          h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)', color: 'var(--ink)' } }, active.name),
          h('div', { style: { color: 'var(--ink-mute)', fontSize: 'var(--fs-sm)' } }, stageOf ? stageOf.title : ''))),
      h('div', { className: 'e-card e-card--inset', key: 'facts' },
        h('div', { className: 'u-flex u-justify-between u-items-baseline', style: { marginBottom: 'var(--sp-3)' }, key: 'f1' },
          h('span', { style: { color: 'var(--ink-mute)', fontSize: 'var(--fs-sm)' } }, 'Чек'),
          h('span', { className: 'u-critical u-tnum', style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)' } }, rub(active.amount))),
        h('div', { className: 'u-flex u-justify-between u-items-center', style: { marginBottom: 'var(--sp-3)' }, key: 'f2' },
          h('span', { style: { color: 'var(--ink-mute)', fontSize: 'var(--fs-sm)' } }, 'Источник'),
          h(Badge, { tone: SOURCE_TONE[active.source] || 'neutral' }, active.source)),
        h('div', { className: 'u-flex u-justify-between u-items-center', style: { marginBottom: 'var(--sp-3)' }, key: 'f3' },
          h('span', { style: { color: 'var(--ink-mute)', fontSize: 'var(--fs-sm)' } }, 'В стадии'),
          h('span', { className: 'u-tnum', style: { color: 'var(--ink)', fontSize: 'var(--fs-sm)' } }, daysWord(active.daysInStage))),
        h('div', { className: 'u-flex u-justify-between u-items-center', key: 'f4' },
          h('span', { style: { color: 'var(--ink-mute)', fontSize: 'var(--fs-sm)' } }, 'Куратор'),
          h('span', { className: 'u-flex u-items-center u-gap-2' },
            h(Avatar, { name: active.curator, size: 'sm', key: 'a' }),
            h('span', { style: { color: 'var(--ink)', fontSize: 'var(--fs-sm)' } }, active.curator)))),
      h('div', { className: 'u-stack-2', key: 'actions' },
        h(Button, { variant: 'primary', block: true, iconRight: Ic.ArrowRight, as: 'a', href: '#/crm/client', key: 'open' }, 'Открыть карточку клиента'),
        h(Button, { variant: 'secondary', block: true, iconLeft: Ic.Chat, key: 'chat' }, 'Написать клиенту'))
    ) : null;

    // --- Контент ------------------------------------------------------------
    const content = h('div', {
      className: 'u-animate-page', id: 'main',
      style: { padding: 'var(--sp-5) var(--sp-5) var(--sp-12)' },
    },
      controls,
      board
    );

    return h('div', { className: 'u-shell' },
      h('div', { className: 'u-hide-mobile' }, rail),
      h('div', { className: 'u-flex-col', style: { minWidth: 0 } },
        topbar,
        content
      ),
      h(Drawer, { open: navOpen, onClose: () => setNavOpen(false), side: 'left', title: 'EastSide' }, rail),
      h(Drawer, { open: !!active, onClose: () => setActive(null), side: 'right', title: 'Сделка' }, drawerBody)
    );
  }

  EScreens.CrmFunnel = CrmFunnel;
})();
