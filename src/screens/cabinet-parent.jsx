/* ============================================================================
   EastSide — Кабинет родителя · ДАШБОРД (window.EScreens.CabinetParent · #/parent)
   ----------------------------------------------------------------------------
   Язык эталон-дашборда (как cabinet-student.jsx, .ec-*): 256px-сайдбар (лого ·
   нав Семья/Финансы/Документы/Диагностика · профиль-родитель · помощь · ТОГГЛ
   ТЕМЫ · настройки) → переключатель детей + заметная «Добавить ребенка» → hero
   (АГРЕГАТ 4 вех, НЕ 18 этапов: одна фраза статуса + кольцо готовности + 2
   мини-стата) → «Что от тебя сейчас» (ближайшие дедлайны как нумерованные карты)
   → «Как идет работа» (горизонтальный таймлайн 4 вех, кликабелен + карта
   куратора) → «Что мы держим» (риски тоном «мы держим») → «Финансы» (оплаты
   ТОЛЬКО у родителя) → «Отчет» (человеческим языком) → низ («Что дальше» + «Все
   под контролем») + «Можно усилить» (1 оффер без давления).

   Граница видимости: родителю — агрегат + тренд, НЕ поштучные под-этапы. Все CTA
   живые (маршрут/попап/мутация mock). Стиль — только токены/классы (.ec-*) +
   компоненты EUI. Обе темы. Ассистент — глобальный FAB + попап.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const { Button, Modal, Alert, FormField, Input, AssistantFab, AssistantPopup } = U;
  const ThemeToggle = (window.ETheme && window.ETheme.ThemeToggle) || null;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};
  const Link = (window.ERouter && window.ERouter.Link) || null;
  const toast = (t) => window.EToast && window.EToast.push(t);

  const icoOf = (name) => (name && Ic[name]) || Ic.File;
  const rub = (n) => (n == null ? '—' : Number(n).toLocaleString('ru-RU').replace(/,/g, ' ') + ' руб');

  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const humanDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  };
  const shortDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate() + ' ' + MONTHS[d.getMonth()];
  };

  // Статус ребенка → тон фразы (без дожима, тоном «мы держим»)
  const STATUS = {
    on_track: { label: 'идет по плану', ok: 'Все идет по плану', okIcon: 'Check',
      calm: 'От тебя сейчас ничего не требуется — команда ведет подготовку.' },
    attention: { label: 'под наблюдением', ok: 'Держим под наблюдением', okIcon: 'Clock',
      calm: 'Есть пара рабочих моментов — куратор держит их, мы рядом.' },
    risk: { label: 'требует внимания', ok: 'Один вопрос на решении', okIcon: 'AlertCircle',
      calm: 'Один вопрос на решении — куратор уже на связи и подскажет шаги.' },
  };

  // Фолбэк способов привязки (если EMock частично пуст)
  const ADD = (window.EMock && window.EMock.addChild) || {
    inviteCode: 'EAST-7K2D',
    inviteLink: 'https://eastside.example/join/EAST-7K2D',
    methods: [
      { key: 'invite', title: 'Пригласить по коду', desc: 'Ребенок уже на платформе или зарегистрируется сам и введет код — связка подтвердится.' },
      { key: 'create', title: 'Создать профиль ребенка', desc: 'Ты заводишь ученика сам и выдаешь логин. Подходит, если ребенок младше.' },
    ],
    warning: 'Один ученик привязывается к одной семье. Если код уже использован — попроси ребенка отвязать старую связь или напиши куратору.',
  };

  // ── Кольцо прогресса (свет внутри через токены) ──────────────────────────
  function Ring(props) {
    const { pct = 0 } = props;
    const r = 64, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return h('div', { className: 'ec-ring' },
      h('svg', { width: 150, height: 150, viewBox: '0 0 150 150' },
        h('circle', { cx: 75, cy: 75, r, fill: 'none', stroke: 'rgba(43,143,255,.16)', strokeWidth: 13 }),
        h('circle', {
          cx: 75, cy: 75, r, fill: 'none', stroke: 'url(#ecpRing)', strokeWidth: 13, strokeLinecap: 'round',
          strokeDasharray: c, strokeDashoffset: off, style: { transition: 'stroke-dashoffset .9s var(--ease-out)' },
        }),
        h('defs', null, h('linearGradient', { id: 'ecpRing', x1: '0', y1: '0', x2: '1', y2: '1' },
          h('stop', { offset: '0', stopColor: 'var(--violet-2)' }),
          h('stop', { offset: '1', stopColor: 'var(--violet-deep)' })))),
      h('div', { className: 'ec-ring__c' },
        h('div', { className: 'ec-ring__v u-tnum' }, pct + '%'),
        h('div', { className: 'ec-ring__l' }, 'готово')));
  }

  // ── Сайдбар (слой 1) — нав родителя ──────────────────────────────────────
  function Rail(props) {
    const { parent, onHelp, onSettings, onAdd } = props;
    const navItems = [
      { icon: Ic.Users, label: 'Семья', to: '/parent', active: true },
      { icon: Ic.Wallet, label: 'Финансы', to: '/payments' },
      { icon: Ic.Doc, label: 'Документы', to: '/documents' },
      { icon: Ic.Target, label: 'Диагностика', to: '/diagnostics' },
      { icon: Ic.Book, label: 'Обучение', to: '/learning/progress' },
      { icon: Ic.Plus, label: 'Добавить ребенка', onClick: onAdd },
    ];
    const navEl = (it, i) => {
      const cls = 'ec-nav__a' + (it.active ? ' is-active' : '');
      const inner = [
        h('span', { key: 'i', style: { display: 'inline-flex' } }, h(it.icon, { size: 20 })),
        h('span', { key: 'l' }, it.label),
      ];
      if (it.to && Link) return h(Link, { key: i, to: it.to, className: cls }, inner);
      return h('button', { key: i, type: 'button', className: cls, onClick: it.onClick, style: { background: 'none', font: 'inherit', textAlign: 'left' } }, inner);
    };
    return h('aside', { className: 'ec-rail', 'aria-label': 'Навигация' },
      h(Link ? Link : 'a', Object.assign({ className: 'ec-logo' }, Link ? { to: '/parent' } : {}),
        h('span', { className: 'ec-logo__m' }, h(Ic.Compass, { size: 19 })),
        h('span', null,
          h('span', { className: 'ec-logo__t', style: { display: 'block' } }, 'EastSide'),
          h('span', { className: 'ec-logo__s' }, 'кабинет родителя'))),
      h('nav', { className: 'ec-nav' }, navItems.map(navEl)),
      h('div', { className: 'ec-rail__sp' }),
      // профиль родителя с маскотом
      h('div', { className: 'ec-pcard' },
        h('span', { className: 'ec-pcard__a' }, h('img', { src: 'assets/mascot-cut.png', alt: '' })),
        h('span', { className: 'ec-pcard__on', 'aria-hidden': 'true' }),
        h('div', null,
          h('div', { className: 'ec-pcard__n' }, parent ? parent.name : 'Родитель'),
          h('div', { className: 'ec-pcard__r' }, 'Родитель'))),
      // помощь
      h('button', { type: 'button', className: 'ec-mini', onClick: onHelp },
        h(Ic.Chat, { size: 18 }),
        h('div', null, h('b', null, 'Нужна помощь?'), h('span', null, 'Напиши куратору'))),
      // переключатель темы
      ThemeToggle ? h('div', { className: 'ec-theme' },
        h(Ic.Sun, { size: 17 }),
        h('span', null, 'Тема оформления'),
        h('span', { className: 'ec-theme__sw' }, h(ThemeToggle, { variant: 'cycle' }))) : null,
      // настройки
      h('button', { type: 'button', className: 'ec-mini', onClick: onSettings, style: { marginTop: '2px' } },
        h(Ic.Settings, { size: 18 }), h('b', null, 'Настройки')));
  }

  // ── Способ привязки в модалке (карточка выбора) ──────────────────────────
  function MethodCard(props) {
    const { method, active, onPick } = props;
    const icon = method.key === 'invite' ? (Ic.Send || Ic.ArrowRight) : (Ic.User || Ic.Users);
    return h('button', {
      type: 'button',
      className: 'e-tile' + (active ? ' is-sel' : ''),
      onClick: onPick,
      style: { width: '100%', textAlign: 'left', display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' },
    },
      h('span', {
        className: 'e-chip-glow', 'aria-hidden': 'true',
        style: { flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px' },
      }, h(icon, { size: 18 })),
      h('span', { style: { minWidth: 0 } },
        h('span', { className: 'e-tile__title' }, method.title),
        h('span', { className: 'e-tile__meta', style: { marginTop: 'var(--sp-1)', display: 'block', whiteSpace: 'normal' } }, method.desc)));
  }

  function CabinetParent() {
    const [parent, setParent] = useState(null);
    const [children, setChildren] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [roadmap, setRoadmap] = useState([]);
    const [billing, setBilling] = useState(null);
    const [risks, setRisks] = useState([]);
    const [reports, setReports] = useState([]);
    const [offers, setOffers] = useState([]);
    const [seeds, setSeeds] = useState(null);

    // веха, которую смотрит таймлайн (агрегат, не под-этапы)
    const [selMilestone, setSelMilestone] = useState(null);

    // попапы
    const [info, setInfo] = useState(null);             // {title, body[]}
    const [report, setReport] = useState(null);          // отчет в попапе
    const [assistOpen, setAssistOpen] = useState(false);

    // Флоу добавления ребенка: 'choose' -> 'form' -> 'done'
    const [addOpen, setAddOpen] = useState(false);
    const [addStep, setAddStep] = useState('choose');
    const [method, setMethod] = useState('invite');
    const [form, setForm] = useState({ name: '', login: '' });
    const [dupWarn, setDupWarn] = useState(false);
    const [addedName, setAddedName] = useState('');

    useEffect(() => {
      let alive = true;
      const A = window.EApi, M = window.EMock;
      if (M) setParent(M.parent || null);
      if (A) {
        if (A.me) A.me().then((r) => alive && r && r.data && setParent((p) => (r.data.role === 'parent' ? r.data : p))).catch(() => {});
        if (A.children) A.children().then((r) => { if (!alive) return; const lst = (r && r.data) || []; setChildren(lst); setActiveId((lst[0] && lst[0].id) || null); }).catch(() => {});
        if (A.roadmap) A.roadmap().then((r) => { if (!alive) return; const d = r && r.data; setRoadmap((d && (d.milestones || d.stages)) || d || []); }).catch(() => {});
        if (A.billing) A.billing().then((r) => alive && r && setBilling(r.data)).catch(() => {});
        if (A.parentRisks) A.parentRisks().then((r) => alive && setRisks((r && r.data) || [])).catch(() => {});
        if (A.parentReports) A.parentReports().then((r) => alive && setReports((r && r.data) || [])).catch(() => {});
        if (A.parentOffers) A.parentOffers().then((r) => alive && setOffers((r && r.data) || [])).catch(() => {});
      }
      if (M) {
        setChildren((c) => c || M.children || []);
        setActiveId((id) => id || (M.children && M.children[0] && M.children[0].id) || null);
        setRoadmap((r) => (r && r.length ? r : (M.roadmap || [])));
        setBilling((b) => b || M.billing || null);
        setRisks((r) => (r && r.length ? r : (M.parentRisks || [])));
        setReports((r) => (r && r.length ? r : (M.parentReports || [])));
        setOffers((o) => (o && o.length ? o : (M.parentOffers || [])));
        setSeeds(M.assistantSeeds || null);
      }
      return () => { alive = false; };
    }, []);

    const list = children || [];
    if (!list.length && children === null) return h('div', { className: 'ec' });

    const child = list.find((c) => c.id === activeId) || list[0] || null;
    const st = child ? (STATUS[child.status] || STATUS.on_track) : STATUS.on_track;
    const firstName = child ? child.name.split(' ')[0] : '';

    // агрегат по 4 вехам
    const milestones = roadmap || [];
    const doneCount = milestones.filter((m) => m.status === 'done').length;
    const totalMs = milestones.length || 4;
    const curMs = milestones.find((m) => m.status === 'current') || milestones[doneCount] || milestones[0] || null;
    const sel = milestones.find((m) => m.id === selMilestone) || curMs || milestones[0] || null;
    const selIdx = sel ? milestones.indexOf(sel) : -1;
    const overallPct = child ? (child.progressPct != null ? child.progressPct : Math.round((doneCount / totalMs) * 100)) : 0;
    const nextMs = (selIdx >= 0 && milestones[selIdx + 1]) || null;

    // ── Флоу добавления ─────────────────────────────────────────────────────
    function closeAdd() { setAddOpen(false); }
    function openAdd() { setAddStep('choose'); setMethod('invite'); setForm({ name: '', login: '' }); setDupWarn(false); setAddedName(''); setAddOpen(true); }

    function copyInvite() {
      const text = ADD.inviteLink || ADD.inviteCode;
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text); } catch (e) { /* статика без clipboard */ }
      toast({ tone: 'success', title: 'Ссылка скопирована', text: 'Отправь ее ребенку — он введет код, и вы свяжетесь.' });
    }

    function submitAdd() {
      const name = (form.name || '').trim();
      if (!name) { setDupWarn('empty'); return; }
      const dup = list.some((c) => c.name.trim().toLowerCase() === name.toLowerCase());
      if (dup && dupWarn !== 'confirm') { setDupWarn('confirm'); return; }
      const id = 'u-student-' + Date.now();
      const newChild = {
        id, name,
        initials: name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
        grade: '—',
        status: 'attention',
        stageNow: method === 'invite' ? 'Ожидаем подтверждения' : 'Профориентация',
        nextDeadline: { label: 'Пройти диагностику', daysLeft: 7, date: '' },
        progressPct: 4,
      };
      setChildren((arr) => (arr || []).concat(newChild));
      setActiveId(id);
      setAddedName(name.split(' ')[0]);
      setAddStep('done');
      toast({ tone: 'success', title: 'Ребенок добавлен', text: name.split(' ')[0] + ' появился в переключателе.' });
    }

    // ── Переключатель детей + «Добавить ребенка» (заметная, не в настройках) ─
    // Карточка ребенка: материал .ec-card, layout инлайном на токенах. Выбранный —
    // inset-свечение (--glow-sel-* / --jade-line). Без внешних теней.
    const kidStyle = (selKid) => ({
      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: '14px 16px',
      textAlign: 'left', cursor: 'pointer', width: '100%',
      border: selKid ? '1.5px solid var(--glow-sel-br)' : '1px solid var(--line)',
      background: selKid ? 'var(--glow-sel-bg)' : 'var(--surface)',
      boxShadow: selKid ? 'var(--glow-sel)' : 'var(--sh-md)',
      borderRadius: 'var(--r-xl)', font: 'inherit', color: 'var(--ink)',
    });
    const kids = h(React.Fragment, null,
      h('div', { className: 'ec-sec' },
        h('span', { className: 'ec-sec__t' }, 'Твои дети'),
        list.length ? h('span', { className: 'ec-sec__c u-tnum' }, list.length + (list.length === 1 ? ' ребенок' : list.length < 5 ? ' ребенка' : ' детей')) : null,
        h('button', { type: 'button', className: 'ec-sec__all', onClick: openAdd }, '+ Добавить ребенка')),
      list.length
        ? h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' } },
          list.map((c) => {
            const cst = STATUS[c.status] || STATUS.on_track;
            const selKid = child && c.id === child.id;
            const ini = c.initials || c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
            return h('button', {
              key: c.id, type: 'button', style: kidStyle(selKid),
              onClick: () => { setActiveId(c.id); setSelMilestone(null); },
              'aria-pressed': !!selKid, 'aria-label': c.name,
            },
              h('span', { 'aria-hidden': 'true', style: { flex: 'none', width: '42px', height: '42px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 'var(--fw-bold)', fontSize: '14px', color: '#fff', background: 'linear-gradient(150deg, var(--violet-2), var(--violet-deep))', boxShadow: 'inset 0 0 12px rgba(120,190,255,.5)' } }, ini),
              h('span', { style: { minWidth: 0, flex: '1 1 auto' } },
                h('span', { style: { display: 'block', fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' } }, c.name.split(' ')[0]),
                h('span', { style: { display: 'block', fontSize: '12px', color: 'var(--ink-mute)' } }, c.grade + ' · ' + cst.label)),
              h('span', { className: 'u-tnum', style: { flex: 'none', fontWeight: 'var(--fw-black)', color: 'var(--jade-ink)' } }, (c.progressPct != null ? c.progressPct : 0) + '%'));
          }),
          // карточка-приглашение «добавить»
          h('button', { type: 'button', onClick: openAdd, 'aria-label': 'Добавить ребенка',
            style: { display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: '14px 16px', textAlign: 'left', cursor: 'pointer', width: '100%', border: '1px dashed var(--line-strong)', background: 'transparent', borderRadius: 'var(--r-xl)', font: 'inherit', color: 'var(--ink)' } },
            h('span', { 'aria-hidden': 'true', className: 'e-chip-glow', style: { flex: 'none', width: '42px', height: '42px' } }, h(Ic.Plus, { size: 20 })),
            h('span', { style: { minWidth: 0 } },
              h('span', { style: { display: 'block', fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' } }, 'Добавить ребенка'),
              h('span', { style: { display: 'block', fontSize: '12px', color: 'var(--ink-mute)' } }, 'По коду или создать профиль'))))
        : h('div', { className: 'ec-card ec-empty' },
          h('span', { className: 'ec-empty__i' }, h(Ic.Users, { size: 20 })),
          h('div', null,
            h('div', { className: 'ec-empty__t' }, 'Пока нет детей'),
            h('div', { className: 'ec-empty__x' }, 'Добавь ребенка — пригласи по коду или заведи профиль сам.')),
          h('div', { style: { marginLeft: 'auto' } },
            h(Button, { variant: 'jade', size: 'sm', iconLeft: Ic.Plus, onClick: openAdd }, 'Добавить'))));

    // ── HERO · агрегат: одна фраза статуса + кольцо + 2 мини-стата ───────────
    const hero = child ? h('div', { className: 'ec-hero' },
      h('div', { className: 'ec-hero__l' },
        h('span', { className: 'ec-pill u-tnum' }, 'Веха ' + Math.min(doneCount + 1, totalMs) + ' из ' + totalMs),
        h('div', { className: 'ec-hero__t' }, firstName + ' ' + st.label),
        h('div', { className: 'ec-hero__ok' },
          h('span', { className: 'c' }, h(icoOf(st.okIcon), { size: 14 })),
          st.ok),
        h('div', { className: 'ec-hero__d' },
          'Сейчас: ', h('b', { style: { color: 'var(--plate-ink)' } }, (child.stageNow || (sel && sel.title) || '').toLowerCase() || 'подготовка'),
          '. ', st.calm),
        h('div', { className: 'ec-hero__mini' },
          h('div', { className: 'ec-mstat' },
            h('span', { className: 'ec-mstat__i' }, h(Ic.Calendar, { size: 19 })),
            h('div', null,
              h('div', { className: 'ec-mstat__l' }, 'Ближайший дедлайн'),
              h('div', { className: 'ec-mstat__v u-tnum' }, child.nextDeadline ? (child.nextDeadline.date ? shortDate(child.nextDeadline.date) : (child.nextDeadline.daysLeft + ' дн')) : 'нет'))),
          h('div', { className: 'ec-mstat' },
            h('span', { className: 'ec-mstat__i' }, h(Ic.TrendUp, { size: 19 })),
            h('div', null,
              h('div', { className: 'ec-mstat__l' }, 'Готовность'),
              h('div', { className: 'ec-mstat__v u-tnum' }, overallPct + '%'))))),
      h('div', { className: 'ec-hero__r' },
        h('div', { className: 'ec-hero__art', 'aria-hidden': 'true' }, h('img', { src: 'assets/mountain-light.png', alt: '' })),
        h(Ring, { pct: overallPct })))
      : h('div', { className: 'ec-hero' },
        h('div', { className: 'ec-hero__l' },
          h('span', { className: 'ec-pill' }, 'Кабинет родителя'),
          h('div', { className: 'ec-hero__t' }, 'Добавь ребенка'),
          h('div', { className: 'ec-hero__d' }, 'Здесь ты увидишь весь путь ребенка к поступлению в одном месте — статус, дедлайны и отчеты. Начни с привязки ученика.'),
          h('div', { style: { marginTop: 'var(--sp-2)' } }, h(Button, { variant: 'jade', iconLeft: Ic.Plus, onClick: openAdd }, 'Добавить ребенка'))),
        h('div', { className: 'ec-hero__r' },
          h('div', { className: 'ec-hero__art', 'aria-hidden': 'true' }, h('img', { src: 'assets/mountain-light.png', alt: '' })),
          h(Ring, { pct: 0 })));

    // ── Ближайшие дедлайны (нумерованные карты, как «действия» у ученика) ────
    const deadlines = [];
    if (child && child.nextDeadline) deadlines.push({
      id: 'dl', title: child.nextDeadline.label, tone: 'primary',
      explain: 'Команда ведет этот срок. Если понадобится твое участие — напишем заранее.',
      when: child.nextDeadline.date ? shortDate(child.nextDeadline.date) : ('через ' + child.nextDeadline.daysLeft + ' дн'),
      icon: 'Calendar', cta: 'Открыть путь', to: '/diagnostics',
    });
    if (billing && billing.nextPayment) deadlines.push({
      id: 'pay', title: billing.nextPayment.label, tone: 'warning',
      explain: 'Следующий платеж по сопровождению. Оплату можно сделать заранее.',
      when: shortDate(billing.nextPayment.date),
      icon: 'Wallet', cta: 'Оплатить', to: '/payments',
    });

    const actsBlock = child ? h(React.Fragment, null,
      h('div', { className: 'ec-sec' },
        h('span', { className: 'ec-sec__t' }, 'Что на горизонте'),
        deadlines.length ? h('span', { className: 'ec-sec__c u-tnum' }, deadlines.length + (deadlines.length === 1 ? ' срок' : ' срока')) : null),
      deadlines.length ? h('div', { className: 'ec-acts' },
        deadlines.map((d, i) => h('div', { key: d.id, className: 'ec-card ec-act' + (d.tone === 'warning' ? ' is-warning' : '') },
          h('div', { className: 'ec-act__h' },
            h('span', { className: 'ec-act__n u-tnum' }, i + 1),
            h('div', { className: 'ec-act__b' },
              h('div', { className: 'ec-act__t' }, d.title),
              h('div', { className: 'ec-act__x' }, d.explain),
              h('div', { className: 'ec-act__time' }, h(Ic.Clock, { size: 14 }), h('span', { className: 'u-tnum' }, d.when)))),
          h('div', { className: 'ec-act__btn' },
            h(Button, { variant: d.tone === 'warning' ? 'secondary' : 'jade', onClick: () => nav(d.to) }, d.cta)),
          h('span', { className: 'ec-act__ill', 'aria-hidden': 'true' }, h(icoOf(d.icon), { size: 42 })))))
        : h('div', { className: 'ec-card ec-empty' },
          h('span', { className: 'ec-empty__i' }, h(Ic.CheckCircle, { size: 20 })),
          h('div', null,
            h('div', { className: 'ec-empty__t' }, 'Срочного нет'),
            h('div', { className: 'ec-empty__x' }, 'Ближайших дедлайнов не предвидится — можно выдохнуть.')))) : null;

    // ── КАК ИДЕТ РАБОТА · таймлайн 4 вех (кликабелен) + куратор ──────────────
    const tl = h('div', { className: 'ec-tl' },
      milestones.map((m) => {
        const cls = 'ec-tls' + (m.status === 'done' ? ' is-done' : m.status === 'current' ? ' is-cur' : '');
        const num = (milestones.indexOf(m) + 1);
        return h('button', {
          key: m.id, type: 'button', className: cls, onClick: () => setSelMilestone(m.id),
          'aria-pressed': sel && m.id === sel.id, 'aria-label': 'Веха ' + num + ': ' + m.title,
          style: { background: 'none', border: 0, cursor: 'pointer', font: 'inherit' },
        },
          h('span', { className: 'ec-tls__bar', 'aria-hidden': 'true' }),
          h('span', { className: 'ec-tls__n' }, m.status === 'done' ? h(Ic.Check, { size: 17 }) : num),
          h('span', { className: 'ec-tls__t' }, m.title),
          m.status === 'current' ? h('span', { className: 'ec-tls__now' }, 'Сейчас') : null);
      }));
    const curatorName = (sel && sel.owner) || (window.EMock && window.EMock.curator && window.EMock.curator.name) || 'Куратор';
    const curInitials = curatorName.split(' ').map((w) => w[0]).slice(0, 2).join('');
    const workBlock = (child && milestones.length) ? h(React.Fragment, null,
      h('div', { className: 'ec-sec' }, h('span', { className: 'ec-sec__t' }, 'Как идет работа')),
      h('div', { className: 'ec-card ec-work' },
        tl,
        h('div', { className: 'ec-cur' },
          h('div', { className: 'ec-cur__h' },
            h('span', { className: 'ec-cur__a' }, curInitials, h('span', { className: 'ec-cur__on', 'aria-hidden': 'true' })),
            h('div', null,
              h('div', { className: 'ec-cur__n' }, curatorName),
              h('div', { className: 'ec-cur__r' }, (sel && sel.owner) ? 'Ведет веху' : 'Куратор поступления'))),
          h('p', null, (sel && sel.summary) || 'Мы ведем этот этап и держим тебя в курсе.'),
          h('div', { style: { marginTop: 'var(--sp-4)' } },
            h(Button, { variant: 'jade', size: 'sm', iconLeft: Ic.Spark, onClick: () => setAssistOpen(true) }, 'Спросить про этот этап'))))) : null;

    // ── ЧТО МЫ ДЕРЖИМ · риски тоном «мы держим» ─────────────────────────────
    const risksBlock = (child && risks.length) ? h(React.Fragment, null,
      h('div', { className: 'ec-sec' },
        h('span', { className: 'ec-sec__t' }, 'Что мы держим'),
        h('span', { className: 'ec-sec__c' }, 'Под контролем')),
      h('div', { className: 'ec-acts' },
        risks.map((r) => h('div', { key: r.id, className: 'ec-card ec-act' + (r.status === 'watching' ? ' is-warning' : '') },
          h('div', { className: 'ec-act__h' },
            h('span', { className: 'ec-act__ill', 'aria-hidden': 'true', style: { position: 'static', width: '46px', height: '46px', borderRadius: '13px' } }, h(r.status === 'holding' ? Ic.CheckCircle : Ic.Clock, { size: 24 })),
            h('div', { className: 'ec-act__b' },
              h('div', { className: 'ec-act__t', style: { fontSize: '16px' } }, r.title),
              h('div', { className: 'ec-act__x', style: { maxWidth: 'none' } }, r.hold),
              h('div', { className: 'ec-act__time' }, h(Ic.User, { size: 14 }), h('span', null, 'Ведет: ' + r.owner)))))))) : null;

    // ── ФИНАНСЫ · оплаты ТОЛЬКО у родителя ──────────────────────────────────
    const finBlock = (child && billing) ? h(React.Fragment, null,
      h('div', { className: 'ec-sec' },
        h('span', { className: 'ec-sec__t' }, 'Финансы'),
        h('button', { type: 'button', className: 'ec-sec__all', onClick: () => nav('/payments') }, 'Чеки и история →')),
      h('div', { className: 'ec-card ec-work', style: { gridTemplateColumns: '1.6fr 1fr' } },
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' } },
          [{ l: billing.nextPayment.label, v: rub(billing.nextPayment.amount), accent: true },
           { l: 'Дата платежа', v: humanDate(billing.nextPayment.date) },
           { l: 'Занятия в пакете', v: billing.lessonsLeft + ' из ' + billing.lessonsTotal }].map((s, i) =>
            h('div', { key: i, style: { padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--line)', background: 'var(--surface-2)' } },
              h('div', { style: { fontSize: '12px', color: 'var(--ink-mute)' } }, s.l),
              h('div', { className: 'u-tnum', style: { marginTop: '4px', fontSize: '18px', fontWeight: 'var(--fw-black)', color: s.accent ? 'var(--jade-ink)' : 'var(--ink)' } }, s.v)))),
        h('div', { className: 'ec-cur' },
          h('div', { className: 'ec-cur__n', style: { fontSize: '14px' } }, billing.plan),
          h('p', { style: { marginTop: 'var(--sp-1)' } }, billing.planNote + '.'),
          h('div', { className: 'u-flex u-gap-2 u-wrap', style: { marginTop: 'var(--sp-4)' } },
            h(Button, { variant: 'jade', size: 'sm', iconLeft: Ic.Wallet, onClick: () => nav('/payments') }, 'Оплатить'),
            h(Button, { variant: 'secondary', size: 'sm', iconLeft: Ic.Download, onClick: () => nav('/payments') }, 'Чеки'))))) : null;

    // ── ОТЧЕТ · человеческим языком (карты-статьи) ──────────────────────────
    const reportsBlock = (child && reports.length) ? h(React.Fragment, null,
      h('div', { className: 'ec-sec' },
        h('span', { className: 'ec-sec__t' }, 'Отчеты человеческим языком'),
        h('span', { className: 'ec-sec__c' }, 'Раз в неделю')),
      h('div', { className: 'ec-arts', style: { gridTemplateColumns: 'repeat(2, 1fr)' } },
        reports.map((r) => h('button', { key: r.id, type: 'button', className: 'ec-art', onClick: () => setReport(r), style: { display: 'block' } },
          h('span', { className: 'ec-art__ill', 'aria-hidden': 'true' }, h(r.kind === 'weekly' ? Ic.Calendar : Ic.TrendUp, { size: 30 })),
          h('span', { className: 'u-flex u-items-center u-gap-2', style: { marginBottom: '4px' } },
            h('span', { className: 'ec-tls__now', style: { background: 'var(--jade-soft)', color: 'var(--jade-ink)' } }, r.kind === 'weekly' ? 'Неделя' : 'Месяц'),
            h('span', { className: 'ec-art__s', style: { margin: 0 } }, r.period)),
          h('span', { className: 'ec-art__t', style: { display: 'block', fontSize: '14.5px' } }, r.headline))))) : null;

    // ── НИЗ · что дальше + все под контролем ────────────────────────────────
    const botBlock = child ? h('div', { className: 'ec-bot' },
      h('div', { className: 'ec-card ec-bcard' },
        h('div', { className: 'ec-bcard__b' },
          h('div', { className: 'ec-bcard__t' }, 'Что будет дальше?'),
          h('div', { className: 'ec-bcard__x' }, nextMs
            ? 'Следующая веха — «' + nextMs.title + '». ' + (nextMs.summary ? nextMs.summary.split('.')[0] + '.' : '')
            : 'Это финальная веха. Дальше — зачисление и старт учебы в Китае.'),
          h('button', { type: 'button', className: 'ec-bcard__a', onClick: () => nextMs ? setSelMilestone(nextMs.id) : nav('/diagnostics') },
            'Смотреть путь', h(Ic.ArrowUpRight, { size: 14 }))),
        h('span', { className: 'ec-bcard__ill', 'aria-hidden': 'true' }, h(Ic.Map, { size: 38 }))),
      h('div', { className: 'ec-card ec-bcard is-success' },
        h('div', { className: 'ec-bcard__b' },
          h('div', { className: 'ec-bcard__t' }, 'Все под контролем'),
          h('div', { className: 'ec-bcard__x' }, 'Мы следим за дедлайнами и сообщим тебе, если что-то потребуется от семьи.'),
          h('div', { className: 'ec-bcard__upd' }, 'Последнее обновление: сегодня в 12:30')),
        h('span', { className: 'ec-bcard__ill', 'aria-hidden': 'true' }, h(Ic.CheckCircle, { size: 38 })))) : null;

    // ── МОЖНО УСИЛИТЬ · 1 оффер без давления ────────────────────────────────
    const offerList = (offers && offers.length)
      ? offers
      : ((window.EMock && window.EMock.marketingBanners) || []).filter((b) => b.placement === 'parent').slice(0, 1).map((b) => ({ id: b.id, title: b.title, body: b.text, cta: b.cta, to: b.to }));
    const offersBlock = (child && offerList.length) ? h(React.Fragment, null,
      h('div', { className: 'ec-sec' }, h('span', { className: 'ec-sec__t' }, 'Можно усилить')),
      h('div', { className: 'ec-card ec-bcard' },
        h('span', { className: 'ec-bcard__ill', 'aria-hidden': 'true' }, h(Ic.Spark, { size: 38 })),
        h('div', { className: 'ec-bcard__b' },
          h('div', { className: 'ec-bcard__t' }, offerList[0].title),
          h('div', { className: 'ec-bcard__x' }, offerList[0].body),
          h('button', { type: 'button', className: 'ec-bcard__a', onClick: () => (offerList[0].to ? nav(offerList[0].to) : setAssistOpen(true)) },
            offerList[0].cta || 'Узнать подробнее', h(Ic.ArrowRight, { size: 14 }))))) : null;

    // мобильная нижняя нав
    const bn = h('nav', { className: 'ec-bn', 'aria-label': 'Навигация' },
      [{ icon: Ic.Users, label: 'Семья', to: '/parent', active: true },
       { icon: Ic.Wallet, label: 'Финансы', to: '/payments' },
       { icon: Ic.Doc, label: 'Документы', to: '/documents' },
       { icon: Ic.Target, label: 'Диагностика', to: '/diagnostics' }].map((it, i) => {
        const cls = 'ec-bn__item' + (it.active ? ' is-active' : '');
        const inner = [h(it.icon, { size: 22, key: 'i' }), h('span', { key: 'l' }, it.label)];
        return (it.to && Link) ? h(Link, { key: i, to: it.to, className: cls }, inner)
          : h('button', { key: i, type: 'button', className: cls }, inner);
      }));

    const helpInfo = { title: 'Написать куратору', body: [
      'Куратор ' + curatorName + ' на связи по будням. Напиши вопрос — ответим в чате сопровождения.',
      'Срочное лучше задать ассистенту: он подскажет сразу и при необходимости передаст куратору.'] };
    const settingsInfo = { title: 'Настройки родителя', body: [
      'Здесь будут профиль семьи, способы оплаты, уведомления и доступы детей.',
      'Раздел в проработке — пока всем управляет куратор. Если что-то нужно поменять, напиши в чат.'] };
    const notifInfo = { title: 'Уведомления', body: [
      'Тут появятся свежие события: статусы детей, дедлайны, отчеты и сообщения куратора.',
      'Сейчас новых уведомлений нет.'] };

    return h(React.Fragment, null,
      h('div', { className: 'ec' },
        h(Rail, { parent, onAdd: openAdd, onHelp: () => setInfo(helpInfo), onSettings: () => setInfo(settingsInfo) }),
        h('main', { id: 'main', className: 'ec-main' },
          h('div', { className: 'ec-top' },
            h('div', null,
              h('div', { className: 'ec-top__t' }, parent ? 'Семья ' + parent.name.split(' ')[1] : 'Кабинет родителя'),
              h('div', { className: 'ec-top__s' }, child ? 'Весь путь ' + firstName + ' к поступлению — в одном месте' : 'Подключи ребенка, чтобы видеть его путь')),
            h('div', { className: 'ec-top__sp' }),
            h('button', { type: 'button', className: 'ec-icb', 'aria-label': 'Уведомления', onClick: () => setInfo(notifInfo) },
              h('span', { className: 'ec-icb__d', 'aria-hidden': 'true' }), h(Ic.Bell, { size: 19 }))),
          kids,
          hero,
          actsBlock,
          workBlock,
          risksBlock,
          finBlock,
          reportsBlock,
          botBlock,
          offersBlock),
        bn,
        h(AssistantFab, { onClick: () => setAssistOpen(true) })),

      // ── Попап отчета ───────────────────────────────────────────────────────
      h(Modal, { open: !!report, onClose: () => setReport(null), title: report ? report.headline : '' },
        report ? h('div', { className: 'e-article' },
          h('p', null, h('b', null, (report.kind === 'weekly' ? 'Неделя' : 'Месяц') + ': ' + report.period)),
          h('p', null, report.body),
          h('p', null, 'Если хочешь обсудить что-то из отчета — нажми «Ассистент» или напиши куратору. Мы на связи.')) : null),

      // ── Попап-инфо (помощь/настройки/уведомления) ──────────────────────────
      h(Modal, { open: !!info, onClose: () => setInfo(null), title: info ? info.title : '' },
        info ? h('div', { className: 'e-article' }, info.body.map((p, i) => h('p', { key: i }, p))) : null),

      // ── Флоу-модалка «Добавить ребенка» ────────────────────────────────────
      h(Modal, {
        open: addOpen, onClose: closeAdd,
        title: addStep === 'done' ? 'Готово' : 'Добавить ребенка',
        footer: addStep === 'choose'
          ? h(React.Fragment, null,
            h(Button, { variant: 'ghost', onClick: closeAdd }, 'Отмена'),
            h(Button, { variant: 'primary', iconRight: Ic.ArrowRight, onClick: () => { setDupWarn(false); setAddStep('form'); } }, 'Дальше'))
          : addStep === 'form'
            ? h(React.Fragment, null,
              h(Button, { variant: 'ghost', onClick: () => { setDupWarn(false); setAddStep('choose'); } }, 'Назад'),
              h(Button, { variant: 'primary', iconRight: Ic.Check, onClick: submitAdd }, dupWarn === 'confirm' ? 'Все равно добавить' : (method === 'invite' ? 'Отправить приглашение' : 'Создать профиль')))
            : h(React.Fragment, null,
              h(Button, { variant: 'ghost', onClick: closeAdd }, 'Закрыть'),
              h(Button, { variant: 'primary', iconRight: Ic.ArrowRight, onClick: () => { closeAdd(); } }, 'Остаться в кабинете')),
      },
        addStep === 'choose'
          ? h('div', { className: 'u-stack-3' },
            h('p', { className: 'u-ink-soft' }, 'Два способа подключить ребенка. Выбери, что ближе.'),
            h('div', { className: 'u-stack-2' },
              ADD.methods.map((m) => h(MethodCard, { key: m.key, method: m, active: method === m.key, onPick: () => setMethod(m.key) }))),
            h(Alert, { tone: 'info', title: 'Защита от дублей', icon: Ic.Lock || Ic.AlertTriangle }, ADD.warning))

          : addStep === 'form'
            ? h('div', { className: 'u-stack-4' },
              method === 'invite'
                ? h('div', { className: 'u-stack-3' },
                  h('p', { className: 'u-ink-soft' }, 'Ребенок вводит этот код у себя — и вы связаны. Можно просто отправить ссылку.'),
                  h('div', { className: 'e-tile', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)' } },
                    h('div', null,
                      h('div', { className: 'e-tile__meta' }, 'Код приглашения'),
                      h('div', { style: { fontFamily: 'var(--font-arkhip)', fontWeight: 400, fontSize: 'var(--fs-lg)', letterSpacing: '.06em', color: 'var(--plate-ink)' } }, ADD.inviteCode)),
                    h(Button, { variant: 'secondary', size: 'sm', iconLeft: Ic.Paperclip, onClick: copyInvite }, 'Скопировать ссылку')),
                  h(FormField, { label: 'Имя ребенка (для твоего списка)', hint: 'Как подписать карточку в кабинете.' },
                    h(Input, { value: form.name, onChange: (e) => { setForm((f) => Object.assign({}, f, { name: e.target.value })); setDupWarn(false); }, placeholder: 'Например, Аня' })))
                : h('div', { className: 'u-stack-3' },
                  h('p', { className: 'u-ink-soft' }, 'Заводишь профиль сам и выдаешь ребенку логин. Пароль он сменит при первом входе.'),
                  h(FormField, { label: 'Имя и фамилия ребенка', required: true },
                    h(Input, { value: form.name, onChange: (e) => { setForm((f) => Object.assign({}, f, { name: e.target.value })); setDupWarn(false); }, placeholder: 'Аня Соколова' })),
                  h(FormField, { label: 'Логин ребенка', hint: 'Латиницей, без пробелов. По нему ребенок войдет.' },
                    h(Input, { value: form.login, onChange: (e) => setForm((f) => Object.assign({}, f, { login: e.target.value })), placeholder: 'anya.s' }))),
              dupWarn === 'empty' ? h(Alert, { tone: 'warning', title: 'Нужно имя', icon: Ic.AlertTriangle }, 'Впиши имя ребенка, чтобы добавить его в список.') : null,
              dupWarn === 'confirm' ? h(Alert, { tone: 'warning', title: 'Похоже, такой ребенок уже есть', icon: Ic.AlertTriangle }, 'В твоей семье уже есть ученик с таким именем. Один ученик привязывается к одной семье. Добавить еще раз?') : null)

            : h('div', { className: 'u-stack-3' },
              h('div', { className: 'u-flex u-items-center u-gap-3' },
                h('span', { className: 'e-chip-glow', 'aria-hidden': 'true', style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' } }, h(Ic.CheckCircle, { size: 22 })),
                h('div', null,
                  h('div', { style: { fontWeight: 'var(--fw-bold)', color: 'var(--ink)' } }, addedName + ' в твоем кабинете'),
                  h('div', { className: 'u-ink-soft', style: { fontSize: 'var(--fs-sm)' } }, method === 'invite' ? 'Приглашение отправлено — как подтвердит код, связка станет активной.' : 'Профиль создан. Логин готов — передай его ребенку.'))),
              h('p', { className: 'u-ink-soft' }, 'Что дальше: ' + addedName + ' появился в переключателе сверху. Первый шаг — пройти диагностику, чтобы построить маршрут.'),
              h('div', { className: 'u-flex u-gap-2 u-wrap' },
                h(Button, { variant: 'jade', size: 'sm', iconLeft: Ic.Target || Ic.ArrowRight, onClick: () => { closeAdd(); nav('/diagnostics'); } }, 'Пройти диагностику'),
                h(Button, { variant: 'ghost', size: 'sm', iconLeft: Ic.Home, onClick: () => { closeAdd(); } }, 'Остаться в кабинете')))
      ),

      // ── Глобальный ассистент-попап ─────────────────────────────────────────
      h(AssistantPopup, { open: assistOpen, onClose: () => setAssistOpen(false), stage: null, seeds }));
  }

  EScreens.CabinetParent = CabinetParent;
})();
