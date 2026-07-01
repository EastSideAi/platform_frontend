/* ============================================================================
   EastSide — Семейный дашборд родителя (window.EScreens.ParentHome · #/parent)
   ----------------------------------------------------------------------------
   Уровень 1 из двух: ОБЩАЯ картина по семье. Уровень 2 — заход в ребёнка
   (parent-child.jsx, #/parent/child?id=), где отдельно путь, задачи, обучение.

   Режим B (светлое стекло), внутри общего каркаса ученика (ESStudentShell) —
   сайдбар/футер/AI параметризованы под родителя. Экран собран из блоков learn/
   student (.sd-hero2/.sd-stat, .lr-sec__h, .lr-bot/.lr-panel/.lr-tk/.lr-ev,
   .lr-prog/.lr-card, .lr-ai) + минимум .pr- (карточки детей, статьи). Контент —
   из реальной parent-IA (см. старый cabinet-parent) и данных EMock (parent,
   children, billing, parentRisks, parentReports, products). Логика семейных
   аккаунтов — docs/parent-model.md.

   Что видит родитель (его срез, НЕ копия ученика): картина по детям · что нужно
   ОТ НЕГО · что держим МЫ (доверие) · финансы · отчёт человеческим языком ·
   полезное для родителей. Задачи и обучение ребёнка — при заходе в ребёнка.
   ============================================================================ */
(function () {
  'use strict';
  const R = window.React || React;
  const { createElement: h } = R;
  const EScreens = (window.EScreens = window.EScreens || {});
  const Ic = window.EIcons || {};
  const SH = window.ESStudentShell;
  const M = window.EMock || {};
  const toast = (window.EUI && window.EUI.toast) || null;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  /* ── стили: .pr- оболочка + карточки детей + статьи (остальное — lr/sd) ──── */
  const css = `
  .sd-main--light:has(.pr-page) .sd-wrap{max-width:1248px;padding:38px 44px 84px;}
  .pr-page{position:relative;}
  .sd-main--light:has(.pr-page){
    background:
      radial-gradient(880px 600px at 99% -4%, rgba(88,158,255,.34) 0%, rgba(110,170,252,.1) 46%, transparent 72%),
      linear-gradient(165deg,#E9EDFA 0%,#EFF2FB 46%,#E9ECF8 100%);}
  .sd-scroll:has(.pr-page) .sd-foot__in{max-width:1248px;padding:0 44px;}
  @keyframes prUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
  .pr-page>section{animation:prUp .5s cubic-bezier(.23,1,.32,1) both;}
  .pr-page>section:nth-child(2){animation-delay:.05s;}
  .pr-page>section:nth-child(3){animation-delay:.1s;}
  .pr-page>section:nth-child(4){animation-delay:.15s;}
  .pr-page>section:nth-child(5){animation-delay:.2s;}
  .pr-page>section:nth-child(6){animation-delay:.25s;}
  .pr-page>section:nth-child(7){animation-delay:.3s;}
  @media (prefers-reduced-motion:reduce){.pr-page>section{animation:none;}}

  .pr-page .sd-hero2{min-height:300px;margin:4px 0 0;}
  .pr-page .sd-hero2__main{margin-top:14px;}
  .pr-page .sd-hero2__mtwrap{top:50%;right:-8px;width:520px;max-width:46%;transform:translateY(-50%);}
  .pr-page .sd-hero2__mt{
    -webkit-mask-image:radial-gradient(58% 66% at 50% 47%,#000 58%,transparent 100%);
    mask-image:radial-gradient(58% 66% at 50% 47%,#000 58%,transparent 100%);
    filter:drop-shadow(0 18px 48px rgba(40,90,200,.22));}
  .pr-page .sd-stat{border:1.5px solid rgba(43,143,255,.4);
    box-shadow:inset 0 0 26px rgba(43,143,255,.3),inset 0 0 6px rgba(43,143,255,.16),inset 0 1px 0 rgba(255,255,255,.5);}
  .pr-page .sd-hero2 + .lr-sec{margin-top:18px;}

  /* карточки детей — стекло learn (.lr-cpnl), кликабельны в заход по ребёнку */
  .pr-kids{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;}
  .pr-kid{position:relative;text-align:left;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;gap:15px;padding:20px 22px;border-radius:20px;
    background:linear-gradient(150deg,rgba(255,255,255,.56),rgba(255,255,255,.36));border:1px solid rgba(120,150,215,.2);
    -webkit-backdrop-filter:blur(28px) saturate(155%);backdrop-filter:blur(28px) saturate(155%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.78),0 4px 14px -10px rgba(21,32,59,.08);
    transition:transform .18s cubic-bezier(.23,1,.32,1),box-shadow .18s;}
  .pr-kid:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.78),0 14px 30px -16px rgba(21,32,59,.2);}
  .pr-kid__top{display:flex;align-items:center;gap:13px;}
  .pr-kid__ava{flex:0 0 46px;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-weight:700;font-size:16px;color:#fff;
    background:var(--sd-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 6px 16px -6px rgba(31,99,200,.5);}
  .pr-kid__id{min-width:0;}
  .pr-kid__nm{font-weight:700;font-size:17px;letter-spacing:-.4px;color:var(--sd-ink);}
  .pr-kid__gr{font-size:12.5px;font-weight:500;color:var(--sd-ink-mute);margin-top:1px;}
  .pr-kid__st{margin-left:auto;display:inline-flex;align-items:center;gap:7px;padding:5px 11px 5px 9px;border-radius:99px;font-size:11.5px;font-weight:600;}
  .pr-kid__st.on_track{color:#1C7E52;background:rgba(46,160,110,.12);}
  .pr-kid__st.attention{color:#936417;background:rgba(201,146,62,.14);}
  .pr-kid__st.risk{color:#B23B2A;background:rgba(210,96,79,.13);}
  .pr-kid__stage{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--sd-acc-deep);}
  .pr-kid__stage svg{opacity:.9;}
  .pr-kid__prog{display:flex;flex-direction:column;gap:7px;}
  .pr-kid__pmeta{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;color:var(--sd-ink-sub);}
  .pr-kid__pmeta b{color:var(--sd-ink);font-variant-numeric:tabular-nums;}
  .pr-kid__bar{height:7px;border-radius:99px;background:rgba(43,90,200,.09);overflow:hidden;}
  .pr-kid__fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--sd-acc-2),var(--sd-acc-deep));box-shadow:0 0 8px rgba(43,143,255,.5);}
  .pr-kid__foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:1px;padding-top:14px;border-top:1px solid rgba(22,32,59,.07);}
  .pr-kid__dl{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:500;color:var(--sd-ink-sub);min-width:0;}
  .pr-kid__dl svg{color:var(--sd-acc-deep);flex:0 0 auto;}
  .pr-kid__dl span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .pr-kid__go{flex:0 0 auto;display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--sd-acc-deep);transition:gap .15s;}
  .pr-kid:hover .pr-kid__go{gap:8px;}

  /* строки задач с бейджем-статусом справа (в языке .lr-tk, но статус-пилюля цветная) */
  .pr-tag{flex:0 0 auto;align-self:center;padding:4px 11px;border-radius:99px;font-size:11px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--sd-ink-mute);background:rgba(22,32,59,.06);}
  .pr-tag.hold{color:#1C7E52;background:rgba(46,160,110,.12);}
  .pr-tag.watch{color:#936417;background:rgba(201,146,62,.14);}
  .pr-tag.act{color:var(--sd-acc-deep);background:var(--sd-acc-soft);}

  /* финансы — компактная стеклянная панель */
  .pr-fin{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:2px;}
  .pr-fincell{padding:14px 15px;border-radius:14px;background:rgba(255,255,255,.5);border:1px solid rgba(120,150,215,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
  .pr-fincell.acc{background:var(--sd-acc-deep);border-color:transparent;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 8px 20px -12px rgba(31,99,200,.5);}
  .pr-fincell__l{font-size:11.5px;font-weight:600;color:var(--sd-ink-mute);}
  .pr-fincell.acc .pr-fincell__l{color:rgba(255,255,255,.86);}
  .pr-fincell__v{margin-top:5px;font-size:19px;font-weight:700;letter-spacing:-.6px;color:var(--sd-ink);font-variant-numeric:tabular-nums;}
  .pr-fincell.acc .pr-fincell__v{color:#fff;}
  .pr-finbtns{display:flex;gap:10px;margin-top:14px;}
  .pr-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:13px;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;letter-spacing:-.2px;border:0;transition:transform .15s,box-shadow .15s,background .15s;}
  .pr-btn--primary{color:#fff;background:var(--sd-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 8px 20px -12px rgba(31,99,200,.5);}
  .pr-btn--primary:hover{transform:translateY(-1px);background:var(--sd-acc);}
  .pr-btn--ghost{color:var(--sd-acc-deep);background:rgba(255,255,255,.6);border:1px solid rgba(120,150,215,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);}
  .pr-btn--ghost:hover{transform:translateY(-1px);background:#fff;}

  /* отчёт куратора — карточки-статьи */
  .pr-rep{display:flex;flex-direction:column;gap:11px;}
  .pr-repcard{text-align:left;cursor:pointer;font-family:inherit;display:flex;gap:14px;align-items:flex-start;padding:15px 16px;border-radius:15px;
    background:rgba(255,255,255,.5);border:1px solid rgba(120,150,215,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);transition:transform .16s,box-shadow .16s;}
  .pr-repcard:hover{transform:translateY(-2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 10px 22px -14px rgba(21,32,59,.18);}
  .pr-repcard__ic{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:var(--sd-acc-deep);background:var(--sd-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,111,224,.14);}
  .pr-repcard__b{min-width:0;flex:1 1 auto;}
  .pr-repcard__meta{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:600;color:var(--sd-ink-mute);}
  .pr-repcard__badge{padding:2px 8px;border-radius:99px;font-weight:700;color:var(--sd-acc-deep);background:var(--sd-acc-soft);}
  .pr-repcard__t{font-size:14px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;line-height:1.3;margin-top:5px;}

  /* полезное для родителей — карточки-статьи (миниатюра + заголовок) */
  .pr-arts{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
  .pr-art{text-align:left;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;overflow:hidden;padding:0;border-radius:16px;
    background:rgba(255,255,255,.5);border:1px solid rgba(120,150,215,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);transition:transform .18s cubic-bezier(.23,1,.32,1),box-shadow .18s;}
  .pr-art:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 14px 30px -16px rgba(21,32,59,.2);}
  .pr-art__thwrap{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#0A1538;}
  .pr-art__th{width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.2,.7,.2,1);}
  .pr-art:hover .pr-art__th{transform:scale(1.05);}
  .pr-art__tint{position:absolute;inset:0;background:radial-gradient(85% 70% at 26% 14%,rgba(43,143,255,.16),transparent 68%);}
  .pr-art__b{padding:13px 15px 15px;display:flex;flex-direction:column;gap:8px;flex:1 1 auto;}
  .pr-art__t{font-size:14px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;line-height:1.3;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .pr-art__m{margin-top:auto;display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:500;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
  .pr-art__m svg{color:rgba(43,120,255,.7);}

  .pr-badge{position:absolute;z-index:3;top:14px;right:14px;padding:5px 11px;border-radius:99px;font-size:11px;font-weight:700;color:#fff;
    background:rgba(255,255,255,.16);-webkit-backdrop-filter:blur(8px) saturate(140%);backdrop-filter:blur(8px) saturate(140%);
    border:1px solid rgba(255,255,255,.34);box-shadow:inset 0 1px 0 rgba(255,255,255,.3);}

  @media (max-width:1000px){
    .pr-kids{grid-template-columns:1fr;}
    .pr-arts{grid-template-columns:1fr;}
    .pr-fin{grid-template-columns:1fr;}
  }
  `;
  if (typeof document !== 'undefined' && !document.getElementById('parent-home-styles')) {
    const el = document.createElement('style');
    el.id = 'parent-home-styles';
    el.innerHTML = css;
    document.head.appendChild(el);
  }

  /* ── helpers ──────────────────────────────────────────────────────────── */
  const go = (label) => SH && SH.onNav({ label: label });
  const chat = (ctx) => SH && SH.openChat(ctx || null);
  const openChild = (id) => nav('/parent/child?id=' + id);
  const connect = () => {
    if (toast) toast('Подключение ребенка — по QR или короткому коду. Скоро.');
    else chat({ label: 'Подключить ребенка' });
  };
  const arr = (s) => Ic.ArrowRight ? h(Ic.ArrowRight, { size: s || 16 }) : '→';
  const money = (n) => (n || 0).toLocaleString('ru-RU');
  const plural = (n, one, few, many) => {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  };
  const initials = (name) => (name || '').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('');

  /* ── данные детей (children + этап/прогресс/дедлайн из демо-доски) ──────── */
  const BOARD = [
    { stageIdx: 2, stageTitle: 'Документы и подача', deadline: 'Собрать пакет документов' },
    { stageIdx: 1, stageTitle: 'Диагностика и профориентация', deadline: 'Тест уровня языка' },
  ];
  const FALLBACK_CHILDREN = [
    { id: 'u-student-1', name: 'Дима Соколов', grade: '11 класс', status: 'on_track', progressPct: 62, nextDeadline: { label: 'Подача на грант CSC', daysLeft: 14 } },
    { id: 'u-student-2', name: 'Аня Соколова', grade: '9 класс', status: 'attention', progressPct: 18, nextDeadline: { label: 'Тест уровня языка', daysLeft: 5 } },
  ];
  const KIDS = (M.children && M.children.length ? M.children : FALLBACK_CHILDREN).map(function (c, i) {
    const b = BOARD[i] || BOARD[BOARD.length - 1];
    const nd = c.nextDeadline || {};
    return {
      id: c.id, name: c.name, first: (c.name || '').split(' ')[0], grade: c.grade,
      status: c.status || 'on_track',
      progress: c.progressPct != null ? c.progressPct : 0,
      days: nd.daysLeft != null ? nd.daysLeft : 0,
      deadlineLabel: nd.label || '',
      stageTitle: b.stageTitle, stageIdx: b.stageIdx,
    };
  });

  /* ── что нужно ОТ ВАС (задачи родителя) ─────────────────────────────────── */
  const PARENT_TODO = [
    { hot: true, ic: Ic.Wallet, title: 'Оплатить сопровождение — июль', sub: '24 000 ₽ · платеж за месяц', tag: '4 дня', kind: '' },
    { ic: Ic.Doc, title: 'Загрузить справку о доходах', sub: 'Нужна для заявки на грант CSC', tag: 'От вас', kind: 'act' },
    { ic: Ic.CheckCircle, title: 'Подтвердить финальный список вузов', sub: 'Куратор прислала на согласование', tag: 'Решение', kind: 'act' },
  ];
  /* ── что держим МЫ (риски тоном «мы держим» + сервис) ──────────────────── */
  const RISKS = M.parentRisks || [];
  const WE_HOLD = [
    { ic: Ic.CheckCircle, title: 'Готовим пакет к подаче', sub: 'Куратор Елена · проверяем документы', tag: 'В работе', kind: 'hold' },
  ].concat(RISKS.map(function (r) {
    return {
      ic: r.status === 'holding' ? Ic.CheckCircle : Ic.Clock,
      title: r.title,
      sub: 'Ведет: ' + (r.owner || 'Куратор'),
      tag: r.status === 'holding' ? 'Держим' : 'Наблюдаем',
      kind: r.status === 'holding' ? 'hold' : 'watch',
    };
  }));

  const BILLING = M.billing || { plan: 'Сопровождение поступления', planNote: '', nextPayment: { amount: 24000, label: 'Платеж' }, lessonsLeft: 18, lessonsTotal: 32 };
  const REPORTS = M.parentReports || [];

  /* ── полезное для родителей (свои статьи, не учебные) ───────────────────── */
  const ARTICLES = [
    { img: 'assets/articles/article-1.jpg', pos: '50% 48%', read: '6 мин', title: 'Как устроен грант CSC и кому его дают',
      lead: 'Грант CSC покрывает обучение, а часто и проживание со стипендией. Разбираем простыми словами: кто может претендовать, что смотрят и как мы повышаем шанс.' },
    { img: 'assets/articles/article-2.jpg', pos: '50% 50%', read: '5 мин', title: 'Сколько стоит учеба и жизнь студента в Китае',
      lead: 'Считаем честно: обучение, общежитие, еда, транспорт. Что покрывает грант, а что остается на семье — и как спланировать бюджет без сюрпризов.' },
    { img: 'assets/articles/article-3.jpg', pos: '50% 42%', read: '4 мин', title: 'Виза X1: что нужно и сколько это занимает',
      lead: 'Учебная виза X1 оформляется после зачисления. Показываем список документов, сроки и то, какую часть мы берем на себя.' },
    { img: 'assets/articles/article-4.jpg', pos: '50% 55%', read: '5 мин', title: 'Как поддержать ребенка и не давить',
      lead: 'Поступление — стресс для подростка. Несколько спокойных правил, которые помогают быть опорой, а не источником тревоги.' },
    { img: 'assets/articles/article-5.jpg', pos: '50% 52%', read: '4 мин', title: 'Безопасно ли учиться в Китае: честный ответ',
      lead: 'Про быт, медицину, отношение к иностранным студентам и как устроена поддержка на месте. Без прикрас и без пугалок.' },
  ];
  const openArticle = (a) => {
    if (SH && SH.openArticle) SH.openArticle({ cap: 'Полезное родителям', title: a.title, image: a.img, body: [{ type: 'lead', text: a.lead }] });
    else chat({ label: a.title });
  };

  /* ── предложения (продукты) ─────────────────────────────────────────────── */
  const OFFER_META = [
    { bg: 'assets/card-blue.png', acc: '43,143,255', name: ['Сопровождение', 'поступления'], active: true, badge: 'Рекомендуем' },
    { bg: 'assets/card-pink.png', acc: '232,120,155', name: ['Мастерская', 'писем'], dim2: true },
    { bg: 'assets/card-orange.png', acc: '240,148,54', name: ['Языковой', 'курс'], dim: true },
  ];
  let OFFERS = (M.products && M.products.length ? M.products : []).slice(0, 3).map(function (p, i) {
    const meta = OFFER_META[i] || OFFER_META[0];
    return Object.assign({}, meta, {
      title: p.name,
      price: money(p.price_amount) + ' ₽' + (p.price_note ? ' · ' + p.price_note : ''),
      cta: p.cta_label || 'Подробнее',
    });
  });
  if (!OFFERS.length) OFFERS = OFFER_META.map(function (m) { return Object.assign({}, m, { title: m.name.join(' '), price: 'По запросу', cta: 'Подробнее' }); });

  /* ── роль родителя для сайдбара/футера ────────────────────────────────── */
  const P = M.parent || {};
  const KID_WORD = KIDS.length + ' ' + plural(KIDS.length, 'ребенок', 'ребенка', 'детей');
  const PARENT_NAV = [
    { key: 'overview', label: 'Семья', icon: Ic.Home, to: '/parent' },
    { key: 'finance', label: 'Финансы', icon: Ic.Wallet, to: '/payments' },
    { key: 'docs', label: 'Документы', icon: Ic.Doc, to: '/documents' },
    { key: 'mylearn', label: 'Мое обучение', icon: Ic.Book, soon: true },
    { key: 'curator', label: 'Куратор', icon: Ic.Users, soon: true },
  ];
  const PARENT_USER = {
    name: P.name || 'Марина Соколова',
    first: (P.name || 'Марина Соколова').split(' ')[0],
    role: 'Родитель · ' + KID_WORD,
    avatar: true,
    initials: P.initials || 'МС',
    help: 'Вопрос по пути ребенка? Напишите куратору',
  };
  const PARENT_FOOT = [
    { label: 'Семья', to: '/parent' },
    { label: 'Финансы', to: '/payments' },
    { label: 'Документы', to: '/documents' },
  ];

  /* ── HERO — сводка по семье ─────────────────────────────────────────────── */
  function Hero() {
    const nearest = KIDS.slice().sort(function (a, b) { return a.days - b.days; })[0] || KIDS[0];
    const attn = KIDS.filter(function (k) { return k.status !== 'on_track'; });
    const one = KIDS.length === 1;
    const headLead = one ? (KIDS[0].first + ' идет') : 'Ваши дети идут';
    const statusVal = attn.length ? 'Нужно внимание' : 'Все по плану';
    const statusSub = attn.length ? (attn.map(function (k) { return k.first; }).join(', ') + ' · нужен фокус') : 'дети идут в графике';
    const statusInk = attn.length ? '#936417' : '#1C7E52';
    const heart = function () { return Ic.Heart ? h(Ic.Heart, { size: 14 }) : null; };
    return h('section', { className: 'sd-hero2' },
      h('div', { className: 'sd-hero2__main' },
        h('div', { className: 'sd-hero2__hi' }, 'Здравствуйте, ' + PARENT_USER.first),
        h('h1', { className: 'sd-hero2__h' }, headLead, h('br'), h('span', { className: 'sd-hero2__em' }, 'к поступлению в Китай')),
        h('div', { className: 'sd-hero2__re' }, heart(), 'Вы видите каждый шаг — мы рядом'),
        h('div', { className: 'sd-hero2__stats' },
          h('div', { className: 'sd-stat' },
            h('div', { className: 'sd-stat__ic' }, Ic.Flag ? h(Ic.Flag, { size: 20 }) : null),
            h('div', { className: 'sd-stat__b' },
              h('div', { className: 'sd-stat__lab' }, 'Ближайший дедлайн'),
              h('div', { className: 'sd-stat__val' }, nearest.days + ' ' + plural(nearest.days, 'день', 'дня', 'дней')),
              h('div', { className: 'sd-stat__sub' }, nearest.first + ' · ' + nearest.deadlineLabel))),
          h('div', { className: 'sd-stat' },
            h('div', { className: 'sd-stat__ic' }, Ic.Users ? h(Ic.Users, { size: 20 }) : null),
            h('div', { className: 'sd-stat__b' },
              h('div', { className: 'sd-stat__lab' }, 'Статус детей'),
              h('div', { className: 'sd-stat__val', style: { color: statusInk } }, statusVal),
              h('div', { className: 'sd-stat__sub' }, statusSub))))),
      h('div', { className: 'sd-hero2__mtwrap', 'aria-hidden': 'true' },
        h('img', { className: 'sd-hero2__mt', src: 'assets/hero-learn.png', alt: '' })));
  }

  /* ── Мои дети — карточки с заходом внутрь ───────────────────────────────── */
  function Kids() {
    return h('section', { className: 'lr-sec' },
      h('div', { className: 'lr-sec__h' },
        h('h2', null, 'Мои дети'),
        h('span', { className: 'lr-chip' }, Ic.Users ? h(Ic.Users, { size: 12 }) : null, KID_WORD),
        h('button', { type: 'button', className: 'lr-seclink', onClick: connect },
          Ic.PairLink ? h(Ic.PairLink, { size: 15 }) : null, 'Подключить ребенка')),
      h('div', { className: 'pr-kids' },
        KIDS.map(function (k, i) {
          const stName = k.status === 'on_track' ? 'идет по плану' : k.status === 'attention' ? 'нужен фокус' : 'риск';
          return h('button', { key: i, type: 'button', className: 'pr-kid', onClick: function () { openChild(k.id); } },
            h('div', { className: 'pr-kid__top' },
              h('span', { className: 'pr-kid__ava' }, initials(k.name)),
              h('div', { className: 'pr-kid__id' },
                h('div', { className: 'pr-kid__nm' }, k.name),
                h('div', { className: 'pr-kid__gr' }, k.grade)),
              h('span', { className: 'pr-kid__st ' + k.status }, stName)),
            h('div', { className: 'pr-kid__stage' }, Ic.Sequence ? h(Ic.Sequence, { size: 15 }) : null, 'Веха ' + k.stageIdx + ' · ' + k.stageTitle),
            h('div', { className: 'pr-kid__prog' },
              h('div', { className: 'pr-kid__pmeta' }, h('span', null, 'Прогресс обучения'), h('b', null, k.progress + '%')),
              h('div', { className: 'pr-kid__bar' }, h('div', { className: 'pr-kid__fill', style: { width: k.progress + '%' } }))),
            h('div', { className: 'pr-kid__foot' },
              h('span', { className: 'pr-kid__dl' }, Ic.Flag ? h(Ic.Flag, { size: 14 }) : null, h('span', null, 'Ближайшее: ' + k.deadlineLabel)),
              h('span', { className: 'pr-kid__go' }, 'Открыть', Ic.ArrowUpRight ? h(Ic.ArrowUpRight, { size: 15 }) : '↗')));
        })));
  }

  // общий рендер строки-задачи (.lr-tk с цветной статус-пилюлей .pr-tag)
  function tkRow(t, i) {
    return h('div', { key: i, className: 'lr-tk' + (t.hot ? ' is-hot' : ''), onClick: function () { go(t.title); } },
      h('span', { className: 'lr-tk__ic' }, t.ic ? h(t.ic, { size: 17 }) : null),
      h('div', { className: 'lr-tk__b' },
        h('div', { className: 'lr-tk__t' }, t.title),
        h('div', { className: 'lr-tk__s' }, t.sub)),
      h('span', { className: 'pr-tag ' + (t.kind || '') }, t.tag));
  }

  /* ── Что нужно от вас | Что мы держим ───────────────────────────────────── */
  function NeedHold() {
    return h('section', { className: 'lr-sec lr-bot' },
      h('div', { className: 'lr-panel' },
        h('div', { className: 'lr-panel__h' },
          h('h3', null, 'Что нужно от вас'),
          h('span', { className: 'lr-count', style: { marginLeft: 'auto' } }, String(PARENT_TODO.length))),
        PARENT_TODO.map(tkRow),
        h('div', { className: 'lr-foot' }, h('button', { type: 'button', className: 'lr-foot__link', onClick: function () { chat({ label: 'Что нужно от родителя' }); } }, 'Спросить, если непонятно', arr(13)))),
      h('div', { className: 'lr-panel' },
        h('div', { className: 'lr-panel__h' },
          h('h3', null, 'Что мы держим за вас'),
          h('span', { className: 'lr-chip', style: { marginLeft: 'auto' } }, Ic.CheckCircle ? h(Ic.CheckCircle, { size: 12 }) : null, 'Под контролем')),
        WE_HOLD.map(tkRow),
        h('div', { className: 'lr-foot' }, h('button', { type: 'button', className: 'lr-foot__link', onClick: function () { chat({ label: 'Как идет работа' }); } }, 'Спросить куратора', arr(13)))));
  }

  /* ── Финансы | Отчет куратора ───────────────────────────────────────────── */
  function FinanceReport() {
    return h('section', { className: 'lr-sec lr-bot' },
      // финансы
      h('div', { className: 'lr-panel' },
        h('div', { className: 'lr-panel__h' },
          h('h3', null, 'Финансы'),
          h('button', { type: 'button', className: 'lr-foot__link', style: { marginLeft: 'auto' }, onClick: function () { nav('/payments'); } }, 'Чеки и история', arr(13))),
        h('div', { className: 'pr-fin' },
          h('div', { className: 'pr-fincell acc' },
            h('div', { className: 'pr-fincell__l' }, 'Следующий платеж'),
            h('div', { className: 'pr-fincell__v' }, money(BILLING.nextPayment.amount) + ' ₽')),
          h('div', { className: 'pr-fincell' },
            h('div', { className: 'pr-fincell__l' }, 'Занятия в пакете'),
            h('div', { className: 'pr-fincell__v' }, BILLING.lessonsLeft + ' / ' + BILLING.lessonsTotal)),
          h('div', { className: 'pr-fincell' },
            h('div', { className: 'pr-fincell__l' }, 'Тариф'),
            h('div', { className: 'pr-fincell__v', style: { fontSize: '14px', letterSpacing: '-.2px' } }, 'Полный'))),
        h('div', { className: 'pr-finbtns' },
          h('button', { type: 'button', className: 'pr-btn pr-btn--primary', onClick: function () { nav('/payments'); } }, Ic.Wallet ? h(Ic.Wallet, { size: 16 }) : null, 'Оплатить'),
          h('button', { type: 'button', className: 'pr-btn pr-btn--ghost', onClick: function () { nav('/payments'); } }, Ic.Download ? h(Ic.Download, { size: 16 }) : null, 'Чеки'))),
      // отчет куратора
      h('div', { className: 'lr-panel' },
        h('div', { className: 'lr-panel__h' },
          h('h3', null, 'Отчет куратора'),
          h('span', { className: 'lr-chip', style: { marginLeft: 'auto' } }, 'Раз в неделю')),
        h('div', { className: 'pr-rep' },
          REPORTS.map(function (r, i) {
            return h('button', { key: i, type: 'button', className: 'pr-repcard', onClick: function () { openArticle({ title: r.headline, img: 'assets/articles/article-' + (i % 5 + 1) + '.jpg', lead: r.body }); } },
              h('span', { className: 'pr-repcard__ic' }, (r.kind === 'weekly' ? Ic.Calendar : Ic.TrendUp) ? h(r.kind === 'weekly' ? Ic.Calendar : Ic.TrendUp, { size: 19 }) : null),
              h('div', { className: 'pr-repcard__b' },
                h('div', { className: 'pr-repcard__meta' },
                  h('span', { className: 'pr-repcard__badge' }, r.kind === 'weekly' ? 'Неделя' : 'Месяц'),
                  h('span', null, r.period)),
                h('div', { className: 'pr-repcard__t' }, r.headline)));
          }))));
  }

  /* ── Полезное для родителей (статьи) ────────────────────────────────────── */
  function Articles() {
    return h('section', { className: 'lr-sec' },
      h('div', { className: 'lr-sec__h' },
        h('h2', null, 'Полезное для родителей'),
        h('span', { className: 'lr-chip' }, Ic.Book ? h(Ic.Book, { size: 12 }) : null, 'Гранты · деньги · виза'),
        h('button', { type: 'button', className: 'lr-seclink', onClick: function () { go('Все статьи'); } }, 'Все статьи', arr(14))),
      h('div', { className: 'pr-arts' },
        ARTICLES.slice(0, 3).map(function (a, i) {
          return h('button', { key: i, type: 'button', className: 'pr-art', onClick: function () { openArticle(a); } },
            h('span', { className: 'pr-art__thwrap' },
              h('img', { className: 'pr-art__th', src: a.img, alt: '', style: { objectPosition: a.pos } }),
              h('span', { className: 'pr-art__tint' })),
            h('span', { className: 'pr-art__b' },
              h('span', { className: 'pr-art__t' }, a.title),
              h('span', { className: 'pr-art__m' }, Ic.Clock ? h(Ic.Clock, { size: 12 }) : null, a.read + ' чтения')));
        })));
  }

  /* ── Предложения (продукты под этап) ────────────────────────────────────── */
  function Offers() {
    return h('section', { className: 'lr-sec' },
      h('div', { className: 'lr-sec__h' },
        h('h2', null, 'Можно усилить'),
        h('span', { className: 'lr-chip' }, Ic.Bolt ? h(Ic.Bolt, { size: 12 }) : null, 'Без давления'),
        h('button', { type: 'button', className: 'lr-seclink', onClick: function () { go('Все продукты'); } }, 'Все продукты', arr(14))),
      h('div', { className: 'lr-prog' },
        OFFERS.map(function (p, i) {
          return h('div', { key: i, className: 'lr-card' + (p.active ? ' is-active' : '') + (p.dim ? ' lr-card--dim' : '') + (p.dim2 ? ' lr-card--dim2' : ''), style: { '--card-acc': p.acc }, onClick: function () { chat({ label: p.title }); } },
            h('img', { className: 'lr-card__bg', src: p.bg, alt: '', 'aria-hidden': 'true' }),
            p.badge ? h('span', { className: 'pr-badge' }, p.badge) : null,
            h('div', { className: 'lr-card__top' },
              h('div', { className: 'lr-card__name' }, p.name[0], p.name[1] ? h('br') : null, p.name[1] || null),
              h('div', { className: 'lr-card__count' }, p.price)),
            h('div', { className: 'lr-card__bottom' },
              h('button', { type: 'button', className: 'lr-card__btn', onClick: function (e) { e.stopPropagation(); chat({ label: p.title }); } },
                p.cta, Ic.ArrowUpRight ? h(Ic.ArrowUpRight, { size: 16 }) : '↗')));
        })));
  }

  /* ── AI-помощник для родителей ──────────────────────────────────────────── */
  function Assistant() {
    const chip = function (label, ic) {
      return h('button', { type: 'button', className: 'lr-ai__chip', onClick: function (e) { e.stopPropagation(); chat({ label: label }); } },
        ic ? h(ic, { size: 15 }) : null, label);
    };
    return h('section', { className: 'lr-airow' },
      h('div', { className: 'lr-ai', onClick: function () { chat({ label: 'AI-помощник для родителей' }); } },
        h('div', { className: 'lr-ai__c' },
          h('span', { className: 'lr-ai__kick' }, 'AI-помощник для родителей'),
          h('div', { className: 'lr-ai__t' }, 'Спросите о пути ребенка, оплатах и следующих шагах')),
        h('div', { className: 'lr-ai__chips' },
          chip('Что оплатить на этом этапе?', Ic.Wallet),
          chip('Как идет подача на грант?', Ic.TrendUp),
          chip('Когда ближайший созвон?', Ic.Calendar)),
        h('img', { className: 'lr-ai__bot', src: 'assets/robot-ai.png', alt: '', 'aria-hidden': 'true' })));
  }

  /* ── Экран ────────────────────────────────────────────────────────────── */
  function ParentHome() {
    if (!SH) return h('div', { style: { padding: 40, color: '#fff' } }, 'Скелет ученика не загружен');
    return h(SH.Shell, { active: 'overview', surface: 'light', hideTopBar: true, footer: true, nav: PARENT_NAV, user: PARENT_USER, footerLinks: PARENT_FOOT },
      h('div', { className: 'pr-page' },
        h(Hero, null),
        h(Kids, null),
        h(NeedHold, null),
        h(FinanceReport, null),
        h(Articles, null),
        h(Offers, null),
        h(Assistant, null)));
  }

  EScreens.ParentHome = ParentHome;
})();
