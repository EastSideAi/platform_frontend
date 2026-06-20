/* ============================================================================
   EastSide — Кабинет партнера (window.EScreens.Partner · route #/partner)
   ----------------------------------------------------------------------------
   Отдельный партнерский шелл. Партнер НЕ видит чужих клиентов и не видит ПДн
   своих приведенных дальше необходимого (имя/этап/статус, не контакты).

   Главный экран отвечает на один вопрос: «сколько я заработал и кто в работе».
   Сверху — реф-ссылка/промокод (главное действие — поделиться), ряд чисел,
   воронка переходов; рядом — клиенты, бонусы, выплаты, контент со встроенной
   реф-ссылкой, эфиры. Два уровня: партнер и ассоциация (бонус обоим).

   Собран ТОЛЬКО из компонентов window.EUI и токенов (никакого хардкода цвета/
   размера/тени — только var(--token) и утилиты styles.css). Данные — локальный
   mock прямо в этом файле (общий mock подключит отдельный агент).
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const {
    Sidebar, Topbar, Card, Stat, Table, Button, Badge, Pill, Avatar,
    ProgressBar, EmptyState, Skeleton, Drawer, Tabs,
  } = U;

  const rub = (n) => (n == null ? '' : Number(n).toLocaleString('ru-RU') + ' ₽');

  // --- Локальный mock (заменится общим src/lib/mock.jsx отдельным агентом) ----
  const MOCK = {
    partner: {
      name: 'Анна Лебедева',
      role: 'Партнер',
      level: 'partner',          // partner | association
      refCode: 'ANNA2026',
      refUrl: 'https://eastside.ai/r/ANNA2026',
    },
    stats: {
      clicks: 412,
      leads: 47,
      paid: 9,
      convPct: 19,               // заявка -> оплата
      bonusEarned: 184000,       // начислено всего
      bonusPending: 36000,       // в ожидании выплаты
    },
    // воронка переходов: переход -> заявка -> оплата
    funnel: [
      { label: 'Переходы', value: 412, tone: 'accent' },
      { label: 'Заявки', value: 47, tone: 'jade' },
      { label: 'Оплаты', value: 9, tone: 'jade' },
    ],
    // приведенные клиенты — без контактов, только имя/этап/статус
    clients: [
      { id: 'c1', name: 'Дима С.', kind: 'referral', stage: 'Диагностика', status: 'paid', bonus: 24000 },
      { id: 'c2', name: 'Алиса К.', kind: 'protege', stage: 'Сопровождение', status: 'paid', bonus: 60000 },
      { id: 'c3', name: 'Тимур Р.', kind: 'referral', stage: 'Заявка', status: 'lead', bonus: 0 },
      { id: 'c4', name: 'Вера М.', kind: 'referral', stage: 'Разбор', status: 'lead', bonus: 0 },
      { id: 'c5', name: 'Глеб А.', kind: 'protege', stage: 'Предложение', status: 'pending', bonus: 36000 },
    ],
    payouts: [
      { id: 'p1', date: '12 мая 2026', amount: 60000, status: 'paid', note: 'За апрель' },
      { id: 'p2', date: '14 апр 2026', amount: 48000, status: 'paid', note: 'За март' },
      { id: 'p3', date: 'Ожидается', amount: 36000, status: 'pending', note: 'За май, на проверке' },
    ],
    // 5 новых материалов + ТОП-5 (со встроенной реф-ссылкой)
    contentNew: [
      { id: 'n1', title: 'Гранты CSC: как поступить бесплатно', kind: 'Статья', date: '2 июня' },
      { id: 'n2', title: 'Топ-10 вузов Китая для IT', kind: 'Подборка', date: '28 мая' },
      { id: 'n3', title: 'HSK с нуля за год — реальный план', kind: 'Гайд', date: '24 мая' },
      { id: 'n4', title: 'Сколько стоит учеба в Китае', kind: 'Разбор', date: '19 мая' },
      { id: 'n5', title: 'Чек-лист документов на подачу', kind: 'Чек-лист', date: '14 мая' },
    ],
    contentTop: [
      { id: 't1', title: 'Поступление в Китай: с чего начать', shares: 86 },
      { id: 't2', title: 'Гранты CSC: как поступить бесплатно', shares: 71 },
      { id: 't3', title: 'Топ-10 вузов Китая для IT', shares: 54 },
      { id: 't4', title: 'HSK с нуля за год — реальный план', shares: 42 },
      { id: 't5', title: 'Сколько стоит учеба в Китае', shares: 38 },
    ],
    streams: [
      { id: 's1', title: 'Поступление-2026: разбор грантов', date: '10 июня, 19:00', live: true },
      { id: 's2', title: 'Как мы готовим к HSK', date: '17 июня, 19:00', live: false },
    ],
  };

  const CLIENT_STATUS = {
    paid: { tone: 'success', label: 'Оплатил' },
    pending: { tone: 'warning', label: 'На оплате' },
    lead: { tone: 'neutral', label: 'В работе' },
  };
  const KIND = {
    referral: { tone: 'jade', label: 'Реферал' },
    protege: { tone: 'neutral', label: 'Протеже' },
  };

  // --- Боковая навигация партнерского кабинета -------------------------------
  function railSections(active) {
    return [{
      label: 'Партнерство',
      items: [
        { icon: Ic.Home, label: 'Главная', to: '/partner', active: active === 'home' },
        { icon: Ic.Users, label: 'Мои клиенты', to: '/partner' },
        { icon: Ic.Wallet, label: 'Бонусы и выплаты', to: '/partner' },
        { icon: Ic.Book, label: 'Материалы', to: '/partner' },
        { icon: Ic.Monitor, label: 'Эфиры', to: '/partner' },
      ],
    }];
  }

  // --- Реф-ссылка с копированием ---------------------------------------------
  function CopyField(props) {
    const { value, label } = props;
    const [done, setDone] = useState(false);
    const copy = () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value);
      } catch (e) { /* буфер недоступен — тихо */ }
      setDone(true);
      if (window.EToast) window.EToast.push({ tone: 'success', title: 'Скопировано', text: label + ' в буфере обмена' });
      setTimeout(() => setDone(false), 1800);
    };
    return h('div', {
      className: 'u-flex u-items-center u-gap-2',
      style: {
        background: 'var(--surface)', borderRadius: 'var(--r-md)',
        padding: 'var(--sp-1) var(--sp-1) var(--sp-1) var(--sp-3)', minWidth: 0,
      },
    },
      h('div', { className: 'u-grow u-truncate u-tnum', style: { color: 'var(--ink)', fontSize: 'var(--fs-sm)', minWidth: 0 }, key: 'v' }, value),
      h(Button, {
        variant: done ? 'jade' : 'secondary', size: 'sm',
        iconLeft: done ? Ic.Check : Ic.Doc, onClick: copy,
        'aria-label': 'Скопировать ' + label, key: 'b',
      }, done ? 'Готово' : 'Копировать')
    );
  }

  function Partner() {
    const [data, setData] = useState(null);
    const [navOpen, setNavOpen] = useState(false);

    useEffect(() => {
      // имитация загрузки (общий API подключит отдельный агент)
      const t = setTimeout(() => setData(MOCK), 120);
      return () => clearTimeout(t);
    }, []);

    const p = data && data.partner;
    const s = data && data.stats;
    const isAssoc = p && p.level === 'association';

    // --- Рейл + мобильная шторка ------------------------------------------
    const rail = p ? h(Sidebar, {
      brand: { name: 'EastSide', mark: 'E' },
      sections: railSections('home'),
      user: { name: p.name, role: isAssoc ? 'Ассоциация' : 'Партнер' },
      footer: h(window.ETheme.ThemeToggle, { variant: 'cycle' }),
    }) : null;

    const topbar = h(Topbar, {
      title: 'Кабинет партнера',
      onMenu: () => setNavOpen(true),
      right: h('div', { className: 'u-flex u-items-center u-gap-2' },
        h(U.IconButton, { icon: Ic.Bell, label: 'Уведомления', key: 'bell' }),
        p ? h(Avatar, { name: p.name, size: 'sm', key: 'av' }) : null
      ),
    });

    // --- Hero: реф-ссылка/промокод (главное действие — поделиться) --------
    const hero = p ? h(Card, { variant: 'hero', key: 'hero' },
      h('div', { className: 'u-flex u-items-center u-justify-between u-wrap u-gap-3', style: { marginBottom: 'var(--sp-4)' } },
        h('div', { className: 'u-kicker', style: { color: 'var(--jade-bright)' }, key: 'k' },
          isAssoc ? 'Ассоциация EastSide' : 'Партнер EastSide'),
        h(Badge, { tone: 'jade', icon: Ic.Bolt, key: 'lvl' },
          isAssoc ? 'Уровень: ассоциация' : 'Уровень: партнер')
      ),
      h('h1', { style: { maxWidth: '18ch', lineHeight: 'var(--lh-tight)' }, key: 'h' },
        'Делись ссылкой — получай бонус'),
      h('p', { className: 'u-lead', style: { color: 'var(--on-accent)', opacity: .85, marginTop: 'var(--sp-3)', maxWidth: '48ch' }, key: 'p' },
        isAssoc
          ? 'Бонус идет и тебе, и партнерам ассоциации. Каждый, кто пришел по твоей ссылке или промокоду, закрепляется за тобой.'
          : 'Каждый, кто пришел по твоей ссылке или промокоду и оплатил, приносит бонус. Закрепление защищено — клиент твой.'),
      // ссылка + промокод с копированием
      h('div', {
        className: 'u-stack-3',
        style: {
          marginTop: 'var(--sp-5)', background: 'var(--surface-sunken)',
          borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)',
        }, key: 'share',
      },
        h('div', { className: 'u-stack-2', key: 'r1' },
          h('span', { className: 'u-kicker', style: { color: 'var(--ink-soft)' }, key: 'c' }, 'Твоя ссылка'),
          h(CopyField, { value: p.refUrl, label: 'Ссылка', key: 'f' })),
        h('div', { className: 'u-stack-2', key: 'r2' },
          h('span', { className: 'u-kicker', style: { color: 'var(--ink-soft)' }, key: 'c' }, 'Промокод'),
          h(CopyField, { value: p.refCode, label: 'Промокод', key: 'f' }))
      )
    ) : h(Skeleton, { key: 'hero-sk', variant: 'block', height: 280, style: { borderRadius: 'var(--r-2xl)' } });

    // --- Ряд ключевых чисел -----------------------------------------------
    const stats = s ? h('div', { className: 'u-cols-4', key: 'stats' },
      h(Stat, { label: 'Переходы', value: s.clicks, bordered: true }),
      h(Stat, { label: 'Заявки', value: s.leads, bordered: true, tone: 'jade' }),
      h(Stat, { label: 'Оплаты', value: s.paid, bordered: true, tone: 'jade', delta: s.convPct + '% из заявок', deltaTone: 'pos' }),
      h(Stat, { label: 'Начислено бонусов', value: rub(s.bonusEarned), bordered: true })
    ) : null;

    // --- Воронка переходов (простой график) -------------------------------
    const funnelMax = data ? Math.max.apply(null, data.funnel.map((f) => f.value)) : 1;
    const funnelCard = data ? h(Card, { key: 'funnel' },
      h('div', { className: 'e-card__head' },
        h('h3', { className: 'e-card__title' }, 'Воронка переходов'),
        h(Pill, { tone: 'neutral' }, 'За 30 дней')),
      h('div', { className: 'u-stack-3', key: 'fn' },
        data.funnel.map((f) => h('div', { className: 'u-flex u-items-center u-gap-3', key: f.label },
          h('div', { style: { width: '5.5rem', flexShrink: 0, fontSize: 'var(--fs-sm)', color: 'var(--ink-soft)', fontWeight: 'var(--fw-semibold)' } }, f.label),
          h('div', {
            className: 'u-grow',
            style: { height: '0.75rem', background: 'var(--surface-sunken)', borderRadius: 'var(--r-pill)', overflow: 'hidden' },
          },
            h('div', {
              style: {
                height: '100%',
                width: Math.max(8, Math.round((f.value / funnelMax) * 100)) + '%',
                background: f.tone === 'jade' ? 'var(--jade)' : 'var(--accent)',
                borderRadius: 'var(--r-pill)',
                transition: 'width var(--dur-slow) var(--ease-out)',
              },
            })),
          h('div', { className: 'u-tnum u-critical', style: { width: '3rem', textAlign: 'right', fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)' } }, f.value)))),
      h('p', { className: 'u-prose u-soft', style: { marginTop: 'var(--sp-3)', fontSize: 'var(--fs-sm)' } },
        'Из ' + s.leads + ' заявок оплатили ' + s.paid + ' — это ' + s.convPct + '%. Делись материалами из подборки ниже, они конвертят лучше.')
    ) : null;

    // --- Статусы приведенных клиентов (таблица, без ПДн) ------------------
    const clientsCard = data ? h(Card, { key: 'clients' },
      h('div', { className: 'e-card__head' },
        h('h3', { className: 'e-card__title' }, 'Мои клиенты'),
        h(Badge, { tone: 'neutral' }, data.clients.length + ' всего')),
      h(Table, {
        rowKey: 'id',
        columns: [
          { key: 'name', title: 'Клиент', render: (r) => h('div', { className: 'u-flex u-items-center u-gap-2' },
            h(Avatar, { name: r.name, size: 'sm', key: 'a' }),
            h('div', { key: 'd' },
              h('div', { style: { fontWeight: 'var(--fw-semibold)' } }, r.name),
              h(Badge, { tone: KIND[r.kind].tone, key: 'k' }, KIND[r.kind].label))) },
          { key: 'stage', title: 'Этап', render: (r) => h('span', { style: { color: 'var(--ink-soft)' } }, r.stage) },
          { key: 'status', title: 'Статус', render: (r) => h(Pill, { tone: CLIENT_STATUS[r.status].tone }, CLIENT_STATUS[r.status].label) },
          { key: 'bonus', title: 'Бонус', num: true, render: (r) => h('span', { className: 'u-critical u-tnum' }, r.bonus ? rub(r.bonus) : '—') },
        ],
        rows: data.clients,
        empty: h(EmptyState, { icon: Ic.Users, title: 'Пока никого', text: 'Поделись ссылкой — первые переходы появятся здесь.' }),
      }),
      h('p', { className: 'u-prose u-soft', style: { marginTop: 'var(--sp-3)', fontSize: 'var(--fs-xs)' } },
        'Показываем только имя, этап и статус — контакты приведенных тебе не передаем.')
    ) : null;

    // --- Бонусы и история выплат ------------------------------------------
    const bonusCard = data ? h(Card, { key: 'bonus' },
      h('div', { className: 'e-card__head' },
        h('h3', { className: 'e-card__title' }, 'Бонусы'),
        h(Pill, { tone: 'success' }, 'Начисляются после оплаты')),
      h('div', { className: 'es-bill-grid', style: { gridTemplateColumns: '1fr 1fr' } },
        h('div', { className: 'es-bill-cell' },
          h('div', { className: 'es-bill-cell__label' }, 'Начислено'),
          h('div', { className: 'es-bill-cell__val u-critical u-tnum' }, rub(s.bonusEarned)),
          h('div', { className: 'es-bill-cell__note' }, 'всего за все время')),
        h('div', { className: 'es-bill-cell' },
          h('div', { className: 'es-bill-cell__label' }, 'В ожидании'),
          h('div', { className: 'es-bill-cell__val u-tnum' }, rub(s.bonusPending)),
          h('div', { className: 'es-bill-cell__note' }, 'на проверке, выплата по графику'))),
      h('div', { className: 'es-section-label', style: { marginTop: 'var(--sp-5)', marginBottom: 'var(--sp-3)' } }, 'История выплат'),
      h('div', { className: 'u-stack-2' },
        data.payouts.map((po) => h('div', {
          key: po.id, className: 'u-flex u-items-center u-justify-between u-gap-3',
          style: { background: 'var(--surface-sunken)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3) var(--sp-4)' },
        },
          h('div', { style: { minWidth: 0 }, key: 'm' },
            h('div', { className: 'u-tnum', style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' } }, rub(po.amount)),
            h('div', { style: { fontSize: 'var(--fs-xs)', color: 'var(--ink-soft)' } }, po.note)),
          h('div', { className: 'u-flex u-items-center u-gap-3', style: { flexShrink: 0 }, key: 's' },
            h('span', { className: 'u-tnum', style: { fontSize: 'var(--fs-xs)', color: 'var(--ink-mute)' } }, po.date),
            h(Pill, { tone: po.status === 'paid' ? 'success' : 'warning' }, po.status === 'paid' ? 'Выплачено' : 'В ожидании'))))),
      isAssoc ? h('div', { style: { marginTop: 'var(--sp-4)' } },
        h(U.Alert, { tone: 'info', title: 'Ассоциация' },
          'Бонус начисляется и тебе, и партнеру, который привел клиента. Видишь свою долю и долю команды.')) : null
    ) : null;

    // --- Библиотека контента: 5 новых + ТОП-5 (со встроенной реф-ссылкой) -
    const contentCard = data ? h(Card, { key: 'content' },
      h('div', { className: 'e-card__head' },
        h('h3', { className: 'e-card__title' }, 'Материалы для тебя'),
        h(Badge, { tone: 'jade', icon: Ic.Spark }, 'С твоей ссылкой')),
      h(ContentLibrary, { newItems: data.contentNew, topItems: data.contentTop, refUrl: p.refUrl })
    ) : null;

    // --- Эфиры ------------------------------------------------------------
    const streamsCard = data ? h(Card, { key: 'streams', variant: 'inset' },
      h('div', { className: 'e-card__head' },
        h('h3', { className: 'e-card__title' }, 'Эфиры'),
        h(Pill, { tone: 'neutral' }, 'Зови клиентов')),
      h('div', { className: 'u-stack-3' },
        data.streams.map((st) => h('div', { key: st.id, className: 'u-flex u-items-center u-gap-3' },
          h('span', {
            'aria-hidden': 'true', key: 'i',
            style: {
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '2.25rem', height: '2.25rem', flexShrink: 0,
              borderRadius: 'var(--r-md)', background: 'var(--jade-tint)', color: 'var(--jade-ink)',
            },
          }, h(Ic.Monitor, { size: 18 })),
          h('div', { className: 'u-grow', style: { minWidth: 0 }, key: 'd' },
            h('div', { style: { fontWeight: 'var(--fw-semibold)', color: 'var(--ink)', fontSize: 'var(--fs-sm)' } }, st.title),
            h('div', { className: 'u-tnum', style: { fontSize: 'var(--fs-xs)', color: 'var(--ink-soft)' } }, st.date)),
          st.live
            ? h(Button, { variant: 'secondary', size: 'sm', iconLeft: Ic.Send, key: 'b' }, 'Пригласить')
            : h(Badge, { tone: 'neutral', key: 'b' }, 'Скоро'))))
    ) : null;

    // --- Сборка контента --------------------------------------------------
    const content = h('div', { className: 'es-cab u-animate-page', id: 'main' },
      h('div', { className: 'es-cab__main u-stack-6' },
        hero, stats, funnelCard, clientsCard, contentCard
      ),
      h('div', { className: 'es-cab__aside u-stack-6' },
        bonusCard, streamsCard
      )
    );

    return h('div', { className: 'u-shell' },
      h('div', { className: 'u-hide-mobile' }, rail),
      h('div', { className: 'u-flex-col', style: { minWidth: 0 } },
        topbar,
        h('div', { className: 'es-cab-wrap' }, content)
      ),
      h(Drawer, { open: navOpen, onClose: () => setNavOpen(false), side: 'left', title: 'EastSide' }, rail)
    );
  }

  // --- Библиотека контента (вкладки: новое / топ) ----------------------------
  function ContentLibrary(props) {
    const { newItems, topItems, refUrl } = props;
    const [tab, setTab] = useState('new');

    const shareItem = (item) => {
      // в реальности — слаг материала добавляется к реф-ссылке (заглушка)
      const url = refUrl;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url);
      } catch (e) { /* буфер недоступен */ }
      if (window.EToast) window.EToast.push({ tone: 'success', title: 'Ссылка скопирована', text: 'Можно делиться — переход закрепится за тобой' });
    };

    const row = (item, extra) => h('div', {
      key: item.id, className: 'u-flex u-items-center u-gap-3',
      style: { background: 'var(--surface-sunken)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3) var(--sp-4)' },
    },
      h('div', { className: 'u-grow', style: { minWidth: 0 }, key: 'd' },
        h('div', { className: 'u-truncate', style: { fontWeight: 'var(--fw-semibold)', color: 'var(--ink)', fontSize: 'var(--fs-sm)' } }, item.title),
        h('div', { className: 'u-flex u-items-center u-gap-2', style: { marginTop: 'var(--sp-1)', fontSize: 'var(--fs-xs)', color: 'var(--ink-mute)' } }, extra)),
      h(Button, { variant: 'ghost', size: 'sm', iconLeft: Ic.Send, onClick: () => shareItem(item), key: 'b' }, 'Поделиться')
    );

    return h('div', null,
      h(Tabs, {
        key: 'tabs', active: tab, onChange: setTab,
        tabs: [{ key: 'new', label: 'Новое' }, { key: 'top', label: 'Топ-5' }],
      }),
      h('div', { className: 'u-stack-2', style: { marginTop: 'var(--sp-4)' }, key: 'list' },
        tab === 'new'
          ? newItems.map((it) => row(it, [
              h(Badge, { tone: 'neutral', key: 'k' }, it.kind),
              h('span', { key: 'd' }, it.date),
            ]))
          : topItems.map((it) => row(it,
              h('span', { className: 'u-tnum', key: 's' }, it.shares + ' раз поделились'))))
    );
  }

  EScreens.Partner = Partner;
})();
