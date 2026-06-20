/* ============================================================================
   EastSide — Оплаты, клиентская часть (window.EScreens.Payments · route #/payments)
   ----------------------------------------------------------------------------
   Трёхслойка «EastSide Dark» как у эталона cabinet-student: тёмная база →
   светлая молочная плашка с узкой колонкой → панель-спутник «Твои оплаты»
   (гора + бегущий бар + шаги). Главный вопрос экрана: «за что я плачу и что
   дальше». Прозрачно, без давления — ноль таймеров, ноль дожима.

   Состав: текущий тариф и его состав · следующий платеж · остаток оплаченных
   занятий по направлениям · история платежей с чеками (скачать → тост) ·
   статусы возвратов · оплата абонемента (мок-модалка ЮKassa с экраном успеха).

   Только токены/классы и компоненты window.EUI. Данные — из EMock.billing /
   EMock.payments; недостающее (состав тарифа, занятия, возвраты, абонементы)
   дополнено in-file fallback-константами, чтобы не править общий mock.jsx.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const {
    AppShell, PathPanel, Banner, Card, Stat, Button, Badge, Pill,
    ProgressBar, Table, Tabs, Modal, EmptyState, Spinner,
  } = U;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  const rub = (n) => (n == null ? '' : Number(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽');

  // Дата ISO → человекочитаемо («25 июня 2026»).
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const human = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  };

  // Статус платежа → тон Pill + подпись (без агрессии).
  const PAY_STATUS = {
    paid: { tone: 'success', label: 'Оплачено' },
    pending: { tone: 'warning', label: 'Ждет оплаты' },
    refunded: { tone: 'neutral', label: 'Возврат' },
    failed: { tone: 'danger', label: 'Не прошел' },
  };
  // Статус возврата (ЮKassa: запрос → в обработке → выполнен/отклонен).
  const REFUND_STATUS = {
    requested: { tone: 'info', label: 'Запрос принят' },
    processing: { tone: 'warning', label: 'В обработке' },
    done: { tone: 'success', label: 'Возвращено' },
    rejected: { tone: 'danger', label: 'Отклонен' },
  };

  // --- In-file fallback: то, чего нет в общем EMock.billing -----------------
  // Общий mock.jsx не трогаем — расширяем локально (без правки чужих ключей).
  const PLAN_INCLUDES = [
    'Куратор и ведение по дорожной карте',
    'Подготовка и проверка документов',
    'Подача на грант CSC и в вузы',
    'Поддержка ассистента и команды',
  ];
  const LESSONS = [
    { id: 'cn', subject: 'Китайский язык (HSK)', left: 9, total: 16 },
    { id: 'duo', subject: 'Подготовка к Duolingo', left: 4, total: 8 },
    { id: 'int', subject: 'Интервью и мотивация', left: 2, total: 4 },
  ];
  const REFUNDS = [
    { id: 'r-01', date: '2026-03-12', title: 'Возврат за перенос урока', amount: 1200, status: 'done' },
  ];
  const BUNDLES = [
    { id: 'b8', title: 'Пакет языка · 8 занятий', note: 'Китайский, индивидуально', amount: 12000 },
    { id: 'b16', title: 'Пакет языка · 16 занятий', note: 'Выгоднее на занятие', amount: 22000, best: true },
    { id: 'mo', title: 'Месяц ведения', note: 'Продлить сопровождение', amount: 28000 },
  ];
  // Долга нет по умолчанию (null). Если появится — Alert тоном «мы держим».
  const DEBT = null;

  function Payments() {
    const [billing, setBilling] = useState(null);
    const [payments, setPayments] = useState(null);
    const [tab, setTab] = useState('all');
    const [payOpen, setPayOpen] = useState(false);
    const [picked, setPicked] = useState(null);
    const [payState, setPayState] = useState('idle'); // idle | processing | done

    // Данные: пробуем бэк через EApi, иначе — мок (graceful-fallback).
    useEffect(() => {
      let alive = true;
      const A = window.EApi, M = window.EMock;
      const fallback = () => {
        if (!alive) return;
        setBilling((M && M.billing) || null);
        setPayments((M && M.payments) || []);
      };
      if (A && A.billing && A.payments) {
        Promise.all([A.billing(), A.payments()])
          .then(([b, p]) => { if (!alive) return; setBilling((b && b.data) || (M && M.billing)); setPayments((p && p.data) || (M && M.payments) || []); })
          .catch(fallback);
      } else {
        fallback();
      }
      return () => { alive = false; };
    }, []);

    const ready = !!billing;

    // Открыть оплату абонемента → мок-модалка ЮKassa.
    const openPay = (bundle) => { setPicked(bundle || null); setPayState('idle'); setPayOpen(true); };
    const closePay = () => { setPayOpen(false); setPayState('idle'); setPicked(null); };
    // Имитация оплаты: idle → processing → done (экран успеха).
    const runPay = () => {
      setPayState('processing');
      setTimeout(() => {
        setPayState('done');
        if (window.EToast) window.EToast.push({
          tone: 'success', title: 'Оплата прошла',
          text: 'Чек придет на email и сохранится в кабинете.',
        });
      }, 900);
    };

    // ── Сайдбар (рейл трёхслойки) ──────────────────────────────────────────
    const rail = {
      brand: { name: 'EastSide', sub: 'Путь к поступлению', mark: 'E' },
      profile: { name: 'Марина', role: 'Кабинет родителя', mascot: 'assets/mascot-cut.png' },
      items: [
        { icon: Ic.Home, label: 'Главная', to: '/parent' },
        { icon: Ic.Route, label: 'Дорожная карта', to: '/parent' },
        { icon: Ic.Doc, label: 'Документы', to: '/documents' },
        { icon: Ic.Wallet, label: 'Оплаты', to: '/payments', active: true },
        { icon: Ic.Spark, label: 'Ассистент', onClick: () => nav('/assistant') },
      ],
      footer: [{ icon: Ic.Settings, label: 'Настройки', onClick: () => nav('/auth') }],
      onLogout: () => nav('/auth'),
    };

    // ── Панель-спутник «Твои оплаты» ───────────────────────────────────────
    const totalLeft = ready ? LESSONS.reduce((s, l) => s + l.left, 0) : 0;
    const totalLessons = ready ? LESSONS.reduce((s, l) => s + l.total, 0) : 0;
    const lessonsPct = totalLessons ? Math.round((totalLeft / totalLessons) * 100) : 0;

    const panel = h(PathPanel, {
      kicker: 'Твои оплаты',
      title: ready && billing.plan ? 'Сопровождение' : 'Оплаты',
      progress: lessonsPct / 100,
      reached: false,
      pct: lessonsPct,
      gleamCap: 'Занятия',
      steps: [
        { n: 1, icon: Ic.Check, label: 'Тариф активен', status: 'done' },
        { label: 'Следующий платеж', val: ready ? human(billing.nextPayment.date).replace(/ \d{4}$/, '') : '', status: 'active', onClick: () => { const el = document.getElementById('pay-plan'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
        { label: 'История и чеки', status: 'upcoming', onClick: () => { const el = document.getElementById('pay-history'); if (el) el.scrollIntoView({ behavior: 'smooth' }); } },
      ],
      widget: {
        head: 'Вопрос по оплате?',
        text: 'Напиши куратору — поможем с чеком, возвратом или переносом без спешки.',
        go: 'Написать куратору',
        onClick: () => nav('/parent'),
      },
    },
      // Мини-сводка занятий в углу панели (фирменный штрих, как HSK в эталоне).
      ready ? h('div', { className: 'es-panel-hsk', key: 'sum' },
        h('div', { className: 'es-panel-hsk__top' },
          h('span', { className: 'es-panel-hsk__label' }, 'Оплачено занятий'),
          h('span', { className: 'es-panel-hsk__pct u-tnum' }, totalLeft + ' из ' + totalLessons)),
        h('div', { className: 'es-panel-hsk__track' }, h('div', { className: 'es-panel-hsk__fill', style: { width: lessonsPct + '%' } })),
        h('div', { className: 'es-panel-hsk__meta' }, 'Напомним заранее, когда пакет подойдет к концу')) : null
    );

    // ── H1 + лид ───────────────────────────────────────────────────────────
    const head = h('div', { key: 'head' },
      h('div', { className: 'e-plate__kicker' }, 'Оплаты'),
      h('h1', { className: 'e-plate__h1', style: { marginTop: 'var(--sp-2)' } }, 'За что ты платишь'),
      h('p', { className: 'e-plate__sub' },
        ready
          ? h(React.Fragment, null, 'Текущий тариф, ближайший платеж и вся история — прозрачно, в одном месте. Чеки скачиваешь в пару кликов, возвраты видно по статусу.')
          : 'Загружаем твои платежи…')
    );

    // ── Задолженность (если есть) тоном «мы держим» ────────────────────────
    const debtBlock = (ready && DEBT) ? h('section', { className: 'e-plate-card', key: 'debt' },
      h('div', { className: 'u-flex u-items-start u-gap-3' },
        h('span', { 'aria-hidden': 'true', style: { color: 'var(--violet-deep)', flexShrink: 0, marginTop: '2px' } }, h(Ic.AlertTriangle, { size: 20 })),
        h('div', { className: 'u-grow' },
          h('div', { className: 'e-plate-card__label' }, 'Открытый платеж'),
          h('p', { className: 'e-plate-card__hint' }, 'По тарифу осталось внести ' + rub(DEBT.amount) + ' до ' + human(DEBT.due) + '. Занятия идут как обычно — доступ не закрываем.'),
          h('div', { style: { marginTop: 'var(--sp-4)' } },
            h(Button, { variant: 'primary', size: 'sm', iconLeft: Ic.Wallet, onClick: () => openPay({ id: 'debt', title: 'Платеж по тарифу', note: 'Закрыть открытый платеж', amount: DEBT.amount }) }, 'Оплатить'))))
    ) : null;

    // ── Текущий тариф + следующий платеж (главная карточка) ────────────────
    const planBlock = ready ? h('section', { className: 'e-plate-card', key: 'plan', id: 'pay-plan' },
      h('div', { className: 'u-flex u-items-start u-justify-between u-gap-3 u-wrap' },
        h('div', null,
          h('div', { className: 'e-plate-card__label' }, billing.plan),
          h('p', { className: 'e-plate-card__hint' }, billing.planNote)),
        h(Pill, { tone: 'success' }, 'Тариф активен')),
      // состав тарифа
      h('ul', { className: 'u-stack-2', style: { listStyle: 'none', margin: 'var(--sp-5) 0 0', padding: 0 } },
        PLAN_INCLUDES.map((it, i) => h('li', {
          key: i, className: 'u-flex u-items-start u-gap-2',
          style: { fontSize: 'var(--fs-sm)', color: 'var(--plate-ink-sub)' },
        },
          h(Ic.CheckCircle, { size: 17, style: { color: 'var(--violet-deep)', flexShrink: 0, marginTop: '2px' }, key: 'i' }),
          h('span', { key: 't' }, it)))),
      // следующая оплата — прозрачно, без дожима
      h('div', { className: 'es-bill-grid', style: { marginTop: 'var(--sp-5)' } },
        h('div', { className: 'es-bill-cell' },
          h('div', { className: 'es-bill-cell__label' }, 'Следующий платеж'),
          h('div', { className: 'es-bill-cell__val u-critical u-tnum' }, rub(billing.nextPayment.amount)),
          h('div', { className: 'es-bill-cell__note' }, billing.nextPayment.label + ' · ' + human(billing.nextPayment.date))),
        h('div', { className: 'es-bill-cell' },
          h('div', { className: 'es-bill-cell__label' }, 'Оплачено занятий'),
          h('div', { className: 'es-bill-cell__val u-tnum' }, totalLeft + ' из ' + totalLessons),
          h('div', { className: 'es-bill-cell__note' }, 'По всем направлениям'))),
      h('div', { style: { marginTop: 'var(--sp-5)' } },
        h(Button, { variant: 'primary', iconLeft: Ic.Wallet, onClick: () => openPay(BUNDLES.find((b) => b.id === 'mo')) }, 'Оплатить следующий платеж'))
    ) : null;

    // ── Остаток оплаченных занятий по направлениям ─────────────────────────
    const lessonsBlock = ready ? h('section', { className: 'e-plate-card', key: 'lessons' },
      h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
        h('div', null,
          h('div', { className: 'e-plate-card__label' }, 'Остаток занятий'),
          h('p', { className: 'e-plate-card__hint' }, 'Сколько оплаченных уроков осталось по каждому направлению.')),
        h(Badge, { tone: 'jade' }, 'По направлениям')),
      h('div', { className: 'u-stack-4', style: { marginTop: 'var(--sp-5)' } },
        LESSONS.map((l) => h('div', { key: l.id, className: 'u-stack-2' },
          h('div', { className: 'u-flex u-items-baseline u-justify-between u-gap-3' },
            h('span', { style: { fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--plate-ink)' } }, l.subject),
            h('span', { className: 'u-tnum', style: { fontSize: 'var(--fs-sm)', color: 'var(--plate-ink-sub)' } }, l.left + ' из ' + l.total)),
          h(ProgressBar, { value: Math.round((l.left / l.total) * 100), tone: 'jade' })))),
      h('p', { className: 'e-plate-card__hint', style: { marginTop: 'var(--sp-4)' } },
        'Когда пакет подходит к концу, мы заранее напомним — продлевать заранее не обязательно.')
    ) : null;

    // ── История платежей (таблица) + фильтр ────────────────────────────────
    const tabs = [
      { key: 'all', label: 'Все' },
      { key: 'paid', label: 'Оплаченные' },
      { key: 'refunded', label: 'Возвраты' },
    ];
    const rows = ready ? (payments || []).filter((p) =>
      tab === 'all' ? true : tab === 'paid' ? p.status === 'paid' : p.status === 'refunded') : [];

    const columns = [
      { key: 'date', title: 'Дата', render: (r) => h('span', { style: { color: 'var(--plate-ink-sub)' } }, human(r.date)) },
      { key: 'label', title: 'Назначение', render: (r) => r.label },
      {
        key: 'status', title: 'Статус', render: (r) => {
          const s = PAY_STATUS[r.status] || PAY_STATUS.pending;
          return h(Pill, { tone: s.tone }, s.label);
        },
      },
      { key: 'amount', title: 'Сумма', num: true, render: (r) => h('span', { className: 'u-tnum u-critical' }, rub(r.amount)) },
      {
        key: 'receipt', title: 'Чек', num: true, render: (r) => r.receipt
          ? h(Button, {
            variant: 'ghost', size: 'sm', iconLeft: Ic.Download,
            onClick: () => window.EToast && window.EToast.push({ tone: 'success', title: 'Чек отправлен', text: 'Копия чека за «' + r.label + '» ушла на твой email.' }),
          }, 'Скачать')
          : h('span', { style: { color: 'var(--plate-ink-sub)' } }, '—'),
      },
    ];

    const historyBlock = ready ? h('section', { className: 'e-plate-card', key: 'history', id: 'pay-history' },
      h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
        h('div', null,
          h('div', { className: 'e-plate-card__label' }, 'История платежей'),
          h('p', { className: 'e-plate-card__hint' }, 'Все списания и возвраты. Чек по каждому — на email.')),
        h(Tabs, { tabs, active: tab, onChange: setTab })),
      h('div', { style: { marginTop: 'var(--sp-5)' } },
        h(Table, {
          columns, rows, rowKey: 'id',
          empty: h(EmptyState, { icon: Ic.Wallet, title: 'Пока пусто', text: 'Здесь появятся платежи и чеки.' }),
        }))
    ) : null;

    // ── Возвраты ───────────────────────────────────────────────────────────
    const refundsBlock = (ready && REFUNDS.length) ? h('section', { className: 'e-plate-card', key: 'refunds' },
      h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
        h('div', null,
          h('div', { className: 'e-plate-card__label' }, 'Возвраты'),
          h('p', { className: 'e-plate-card__hint' }, 'Статус каждого возврата — видно на каждом шаге.')),
        h(Badge, { tone: 'neutral' }, 'Статусы')),
      h('div', { className: 'u-stack-3', style: { marginTop: 'var(--sp-5)' } },
        REFUNDS.map((r) => {
          const s = REFUND_STATUS[r.status] || REFUND_STATUS.requested;
          return h('div', { key: r.id, className: 'e-tile', style: { cursor: 'default' } },
            h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3' },
              h('div', { className: 'u-grow', style: { minWidth: 0 } },
                h('div', { className: 'e-tile__title' }, r.title),
                h('div', { className: 'e-tile__meta u-tnum' }, human(r.date) + ' · ' + rub(r.amount))),
              h(Pill, { tone: s.tone }, s.label)));
        })),
      h('p', { className: 'e-plate-card__hint', style: { marginTop: 'var(--sp-4)' } },
        'Возврат проходит через ЮKassa на ту же карту, обычно за несколько рабочих дней.')
    ) : null;

    // ── Пополнить или продлить (вход к оплате) ─────────────────────────────
    const bundlesBlock = ready ? h('section', { className: 'e-plate-card', key: 'bundles' },
      h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap' },
        h('div', null,
          h('div', { className: 'e-plate-card__label' }, 'Пополнить или продлить'),
          h('p', { className: 'e-plate-card__hint' }, 'Выбери пакет — оплата на защищенной странице, чек придет на email.')),
        h(Badge, { tone: 'jade', icon: Ic.Wallet }, 'Оплата онлайн')),
      h('div', { className: 'u-stack-3', style: { marginTop: 'var(--sp-5)' } },
        BUNDLES.map((b) => h('button', {
          key: b.id, type: 'button', className: 'e-tile', onClick: () => openPay(b),
        },
          h('div', { className: 'u-flex u-items-center u-gap-3' },
            h('div', { className: 'u-grow', style: { minWidth: 0 } },
              h('div', { className: 'u-flex u-items-center u-gap-2 u-wrap' },
                h('span', { className: 'e-tile__title' }, b.title),
                b.best ? h(Badge, { tone: 'jade' }, 'Выгоднее') : null),
              h('div', { className: 'e-tile__meta' }, b.note)),
            h('span', { className: 'u-tnum u-critical', style: { fontSize: 'var(--fs-lg)', fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', flexShrink: 0 } }, rub(b.amount)),
            h(Ic.ChevronRight, { size: 18, style: { color: 'var(--plate-ink-sub)', flexShrink: 0 }, key: 'c' })))))
    ) : null;

    // ── Маркетинговый баннер (без давления) ────────────────────────────────
    const bannerBlock = ready ? h(Banner, {
      key: 'banner', tone: 'dark',
      kicker: 'Спокойно по деньгам',
      title: 'Платежи прозрачны, без скрытых списаний',
      text: 'Видишь каждый платеж и чек, возврат — по статусу. Вопрос — куратор рядом.',
      cta: 'Написать куратору',
      onCta: () => nav('/parent'),
    }) : null;

    // ── Модалка оплаты (мок ЮKassa: idle → processing → done) ──────────────
    const isDone = payState === 'done';
    const isProcessing = payState === 'processing';
    const payModal = h(Modal, {
      open: payOpen, onClose: closePay,
      title: isDone ? 'Оплата прошла' : 'Оплата абонемента',
      footer: isDone
        ? h(Button, { variant: 'primary', block: true, iconRight: Ic.ArrowRight, onClick: closePay }, 'Готово')
        : h('div', { className: 'u-flex u-gap-3', style: { justifyContent: 'flex-end', width: '100%' } },
          h(Button, { variant: 'ghost', onClick: closePay, disabled: isProcessing }, 'Отмена'),
          h(Button, { variant: 'primary', iconRight: isProcessing ? undefined : Ic.ArrowRight, loading: isProcessing, onClick: runPay }, isProcessing ? 'Оплачиваем…' : 'Оплатить')),
    },
      isDone
        ? h('div', { className: 'u-stack-4', style: { textAlign: 'center' } },
          h('div', { className: 'es-pay-ok', 'aria-hidden': 'true', style: { margin: '0 auto', width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--glow-sel-bg)', color: 'var(--violet-deep)' } },
            h(Ic.CheckCircle, { size: 30 })),
          h('div', null,
            h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)', color: 'var(--ink)' } },
              picked ? rub(picked.amount) + ' оплачено' : 'Оплата прошла'),
            h('p', { className: 'u-ink-soft', style: { fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-2)' } },
              'Чек уже на пути к тебе на email и сохранится здесь, в истории платежей.')))
        : h('div', { className: 'u-stack-4' },
          picked ? h('div', { className: 'es-bill-cell' },
            h('div', { className: 'es-bill-cell__label' }, picked.title),
            h('div', { className: 'es-bill-cell__val u-critical u-tnum', style: { fontSize: 'var(--fs-xl)' } }, rub(picked.amount)),
            h('div', { className: 'es-bill-cell__note' }, picked.note)) : null,
          h('p', { className: 'u-ink-soft', style: { fontSize: 'var(--fs-sm)' } },
            'Это демо-оплата для кабинета. На проде откроется защищенная страница ЮKassa, после оплаты чек придет на email и сохранится здесь. Оплату всегда можно вернуть через поддержку.'),
          h('div', { className: 'u-flex u-items-center u-gap-2', style: { color: 'var(--ink-mute)', fontSize: 'var(--fs-xs)' } },
            isProcessing ? h(Spinner, { size: 15, key: 'sp' }) : h(Ic.Lock, { size: 15, key: 'i' }),
            h('span', { key: 't' }, isProcessing ? 'Проводим платеж через ЮKassa…' : 'Платеж проходит на стороне ЮKassa, данные карты мы не храним.')))
    );

    return h(React.Fragment, null,
      h(AppShell, { rail, panel },
        head,
        debtBlock,
        planBlock,
        lessonsBlock,
        historyBlock,
        refundsBlock,
        bundlesBlock,
        bannerBlock
      ),
      payModal
    );
  }

  EScreens.Payments = Payments;
})();
