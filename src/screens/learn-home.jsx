/* ============================================================================
   EastSide — Обучение (window.EScreens.LearnHome · #/learn)
   ----------------------------------------------------------------------------
   Режим B (Рабочее пространство). Живет ВНУТРИ общего скелета ученика
   (window.ESStudentShell) — тот же тёмный стеклянный сайдбар с маскотом, те же
   токены --sd-* (тема через класс, НЕ через prefers-color-scheme → не уходит в
   тёмное), тот же визуальный язык, что и Главная. Здесь — только контент обучения:
   воздушный hero с парящей горой-восхождением, минималистичные карточки программ
   (full-bleed 3D-render + frosted-панель), низ (расписание · задачи · достижения + AI).

   Hero — тёмный атмосферный баннер (восхождение): прозрачная гора assets/mountain-banner.png
   на ночном небе, белый текст, стеклянные пилюли. Голос «вы».
   Карточки программ: якорь каждой — её мягкий 3D-фон (card-blue/green/purple.png);
   хром нейтральный (белое стекло + сапфировая стрелка), цвет несёт только картинка.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h } = window.React || React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const Ic = window.EIcons || {};
  const SH = window.ESStudentShell;

  const css = `
  /* контент обучения шире стандартного 1080 — низ с AI-картой просит воздуха */
  .sd-main--light:has(.lr-page) .sd-wrap{max-width:1248px;padding:38px 44px 84px;}
  .lr-page{position:relative;}
  /* плашка learn — лёгкий синий блик только справа-сверху (за шаром), без
     фиолетового и без залитого синего по низу. Свечение живёт В карточках. */
  .sd-main--light:has(.lr-page){
    background:
      radial-gradient(880px 600px at 99% -4%, rgba(88,158,255,.34) 0%, rgba(110,170,252,.1) 46%, transparent 72%),
      linear-gradient(165deg,#E9EDFA 0%,#EFF2FB 46%,#E9ECF8 100%);}
  @keyframes lrUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
  .lr-page>section{animation:lrUp .5s cubic-bezier(.23,1,.32,1) both;}
  .lr-page>section:nth-child(2){animation-delay:.06s;}
  .lr-page>section:nth-child(3){animation-delay:.12s;}
  .lr-page>section:nth-child(4){animation-delay:.18s;}
  .lr-page>section:nth-child(5){animation-delay:.24s;}
  @media (prefers-reduced-motion:reduce){.lr-page>section{animation:none;}}

  /* ── HERO — светлый, компактный (классы sd-hero2 / sd-stat живут в шелле).
     Вместо горы — стеклянный шар-мир hero-learn.png (центрирован по вертикали),
     тёмные углы гасим радиальной маской. Высоту держим по контенту, чтобы блок
     «Мои обучения» шёл близко, без пустоты. Голубое ВНУТРЕННЕЕ свечение — НЕ за
     шаром, а в стат-карточках (как активный чип anketa, см. .lr-page .sd-stat). */
  .lr-page .sd-hero2{min-height:336px;margin:4px 0 0;}
  .lr-page .sd-hero2__main{margin-top:14px;}
  .lr-page .sd-hero2__mtwrap{top:50%;right:-8px;width:556px;max-width:49%;transform:translateY(-50%);}
  .lr-page .sd-hero2__mt{
    -webkit-mask-image:radial-gradient(58% 66% at 50% 47%,#000 58%,transparent 100%);
    mask-image:radial-gradient(58% 66% at 50% 47%,#000 58%,transparent 100%);
    filter:drop-shadow(0 18px 48px rgba(40,90,200,.22));}
  /* стат-карточки хиро — ТОЧНО как активная карточка anketa (свечение внутри) */
  .lr-page .sd-stat{border:1.5px solid rgba(43,143,255,.4);
    box-shadow:inset 0 0 26px rgba(43,143,255,.3),inset 0 0 6px rgba(43,143,255,.16),inset 0 1px 0 rgba(255,255,255,.5);}
  /* первый блок сразу под хиро — ближе, без пустоты */
  .lr-page .sd-hero2 + .lr-sec{margin-top:18px;}

  /* ── Заголовок секции ───────────────────────────────────────────────────── */
  .lr-sec{margin-top:38px;}
  .lr-sec__h{display:flex;align-items:center;gap:12px;margin-bottom:18px;}
  .lr-sec__h h2{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:600;font-size:21px;letter-spacing:-.5px;color:#1A2440;margin:0;}
  .lr-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:5px 12px;border-radius:99px;
    background:var(--sd-acc-soft);color:var(--sd-acc-ink);}
  .lr-chip svg{color:var(--sd-acc);}
  .lr-seclink{margin-left:auto;display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--sd-acc-deep);
    background:0;border:0;cursor:pointer;font-family:inherit;transition:gap .15s;}
  .lr-seclink:hover{gap:8px;}

  /* ── Карточки программ: цвет даёт сама картинка, текст БЕЛЫЙ без теней.
     Заголовок в две строки сверху, под ним счётчик уроков; кнопка внизу —
     полупрозрачное стекло в цвет своей карточки (--card-acc), текст белый. ── */
  .lr-prog{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
  .lr-card{position:relative;overflow:hidden;border-radius:22px;min-height:286px;display:flex;flex-direction:column;padding:24px 24px;cursor:pointer;
    border:1px solid rgba(43,90,200,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.5);
    transition:transform .2s cubic-bezier(.23,1,.32,1);}
  .lr-card:hover{transform:translateY(-3px);}
  .lr-card:hover .lr-card__bg{transform:scale(1.05);}
  .lr-card.is-active{border-color:rgba(255,255,255,.55);box-shadow:inset 0 0 0 1px rgba(255,255,255,.34),inset 0 1px 0 rgba(255,255,255,.5);}
  .lr-card__bg{position:absolute;z-index:0;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;
    transition:transform .45s cubic-bezier(.23,1,.32,1);}
  .lr-card--dim .lr-card__bg{filter:brightness(.9) saturate(1.03);}
  .lr-card--dim2 .lr-card__bg{filter:brightness(.82) saturate(1.05);}
  .lr-card__top{position:relative;z-index:2;}
  .lr-card__name{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:30px;letter-spacing:-1.1px;color:#fff;line-height:1.05;}
  .lr-card__count{margin-top:11px;font-size:13.5px;font-weight:600;color:#fff;font-variant-numeric:tabular-nums;}
  .lr-card__bottom{position:relative;z-index:2;margin-top:auto;}
  .lr-card__btn{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:14px;cursor:pointer;font-family:inherit;font-size:14.5px;font-weight:600;letter-spacing:-.2px;color:#fff;
    background:rgba(var(--card-acc,255,255,255),.15);-webkit-backdrop-filter:blur(8px) saturate(140%);backdrop-filter:blur(8px) saturate(140%);
    border:1px solid rgba(255,255,255,.28);box-shadow:inset 0 1px 0 rgba(255,255,255,.34);transition:transform .16s,background .16s;}
  .lr-card__btn:hover{transform:translateY(-2px);background:rgba(var(--card-acc,255,255,255),.28);}
  .lr-card__btn svg{opacity:.9;}

  /* ── Низ: расписание · задачи (две равные колонки, премиум-карточки) ─────── */
  .lr-bot{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:stretch;}
  .lr-panel{display:flex;flex-direction:column;border-radius:22px;padding:22px 20px 16px;
    background:linear-gradient(150deg,rgba(255,255,255,.56),rgba(255,255,255,.36));
    border:1px solid rgba(120,150,215,.2);-webkit-backdrop-filter:blur(30px) saturate(155%);backdrop-filter:blur(30px) saturate(155%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.78),0 4px 14px -10px rgba(21,32,59,.08);}
  .lr-panel__h{display:flex;align-items:center;gap:10px;margin-bottom:13px;padding:0 3px;}
  .lr-panel__h h3{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:600;font-size:17px;letter-spacing:-.3px;color:#1A2440;margin:0;}
  .lr-count{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 7px;border-radius:99px;font-size:11.5px;font-weight:700;color:var(--sd-acc-deep);
    background:var(--sd-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,143,255,.2);font-variant-numeric:tabular-nums;}
  .lr-tabs{margin-left:auto;display:inline-flex;background:rgba(22,32,59,.045);border-radius:11px;padding:3px;box-shadow:inset 0 0 0 1px rgba(21,32,59,.05);}
  .lr-tab{border:0;background:0;padding:5px 13px;border-radius:8px;font-size:12.5px;font-weight:600;color:var(--sd-ink-mute);cursor:pointer;font-family:inherit;transition:color .15s,background .15s;}
  .lr-tab.is-on{background:#fff;color:var(--sd-ink);box-shadow:0 1px 2px rgba(21,32,59,.08),0 0 0 1px rgba(21,32,59,.04);}
  .lr-foot{margin-top:auto;padding-top:12px;padding-left:3px;}
  .lr-foot__link{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--sd-acc-deep);background:0;border:0;cursor:pointer;font-family:inherit;transition:gap .15s;}
  .lr-foot__link:hover{gap:8px;}

  /* расписание: события-карточки, ближайшее подсвечено */
  .lr-ev{position:relative;display:flex;align-items:center;gap:13px;padding:11px 12px;border-radius:14px;cursor:pointer;
    border:1px solid transparent;transition:transform .16s cubic-bezier(.23,1,.32,1),background .16s,border-color .16s;}
  .lr-ev + .lr-ev{margin-top:7px;}
  .lr-ev:hover{background:rgba(255,255,255,.55);transform:translateX(2px);}
  /* активная строка — язык сайдбара: синий градиент слева→направо + inset-глоу */
  .lr-ev.is-next{background:linear-gradient(90deg,rgba(43,143,255,.16) 0%,rgba(43,143,255,.06) 55%,rgba(43,143,255,.015) 100%);
    border-color:rgba(43,143,255,.28);box-shadow:inset 0 0 24px rgba(43,143,255,.12),inset 0 1px 0 rgba(255,255,255,.7);}
  .lr-ev__time{flex:0 0 42px;text-align:right;font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:14px;letter-spacing:-.4px;color:var(--sd-ink);font-variant-numeric:tabular-nums;}
  .lr-ev.is-next .lr-ev__time{color:var(--sd-acc-deep);}
  /* иконки тихие нейтральные (без радуги) — цвет только на активной строке */
  .lr-ev__ic{flex:0 0 38px;width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:var(--sd-ink-sub);
    background:rgba(255,255,255,.5);box-shadow:inset 0 0 0 1px rgba(21,32,59,.06);transition:filter .16s,color .16s,background .16s;}
  .lr-ev.is-next .lr-ev__ic{color:var(--sd-acc-deep);background:rgba(43,143,255,.12);box-shadow:inset 0 0 0 1px rgba(43,143,255,.2);filter:drop-shadow(0 0 7px rgba(60,150,255,.5));}
  .lr-ev__b{flex:1 1 auto;min-width:0;}
  .lr-ev__t{font-size:13.5px;font-weight:600;color:var(--sd-ink);line-height:1.2;}
  .lr-ev__s{font-size:12px;font-weight:500;color:var(--sd-ink-mute);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lr-ev__chip{flex:0 0 auto;align-self:center;padding:4px 11px;border-radius:99px;font-size:11px;font-weight:600;color:var(--sd-ink-mute);background:rgba(22,32,59,.06);}
  .lr-ev.is-next .lr-ev__chip{color:var(--sd-acc-deep);background:rgba(43,143,255,.12);}

  /* задачи: строки-карточки, срочная подсвечена */
  .lr-tk{position:relative;display:flex;align-items:center;gap:13px;padding:11px 12px;border-radius:14px;cursor:pointer;
    border:1px solid transparent;transition:transform .16s cubic-bezier(.23,1,.32,1),background .16s,border-color .16s;}
  .lr-tk + .lr-tk{margin-top:7px;}
  .lr-tk:hover{background:rgba(255,255,255,.55);transform:translateX(2px);}
  .lr-tk.is-hot{background:linear-gradient(90deg,rgba(210,96,79,.15) 0%,rgba(210,96,79,.055) 55%,rgba(210,96,79,.015) 100%);
    border-color:rgba(210,96,79,.26);box-shadow:inset 0 0 24px rgba(210,96,79,.1),inset 0 1px 0 rgba(255,255,255,.7);}
  .lr-tk__ic{flex:0 0 38px;width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:var(--sd-ink-sub);
    background:rgba(255,255,255,.5);box-shadow:inset 0 0 0 1px rgba(21,32,59,.06);transition:filter .16s,color .16s,background .16s;}
  .lr-tk.is-hot .lr-tk__ic{color:rgb(210,96,79);background:rgba(210,96,79,.1);box-shadow:inset 0 0 0 1px rgba(210,96,79,.18);}
  .lr-tk__b{flex:1 1 auto;min-width:0;}
  .lr-tk__t{font-size:13.5px;font-weight:600;color:var(--sd-ink);line-height:1.2;}
  .lr-tk__s{font-size:12px;font-weight:500;color:var(--sd-ink-mute);margin-top:2px;}
  .lr-tk__chip{flex:0 0 auto;align-self:center;padding:4px 11px;border-radius:99px;font-size:11px;font-weight:600;color:var(--sd-ink-mute);background:rgba(22,32,59,.06);font-variant-numeric:tabular-nums;}
  .lr-tk.is-hot .lr-tk__chip{color:rgb(210,96,79);background:rgba(210,96,79,.11);}
  .lr-tk__chip.grey{color:var(--sd-ink-mute);background:rgba(22,32,59,.06);}

  /* ── «Ваш прогресс»: КРУПНЫЕ KPI + ряд аналитики (бары · донат · топ-темы) ── */
  .lr-spark{display:block;flex:0 0 auto;}
  .lr-kpi{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
  .lr-kpic{position:relative;overflow:hidden;border-radius:20px;padding:20px 22px 18px;min-height:182px;display:flex;flex-direction:column;
    background:linear-gradient(150deg,rgba(255,255,255,.56),rgba(255,255,255,.36));
    border:1px solid rgba(120,150,215,.2);-webkit-backdrop-filter:blur(28px) saturate(155%);backdrop-filter:blur(28px) saturate(155%);
    box-shadow:inset 0 0 56px rgba(var(--kpi-glow,43,143,255),.24),inset 0 0 22px rgba(var(--kpi-glow,43,143,255),.12),inset 0 1px 0 rgba(255,255,255,.76),0 4px 14px -10px rgba(21,32,59,.08);
    transition:transform .18s cubic-bezier(.23,1,.32,1),box-shadow .18s;}
  .lr-kpic:hover{transform:translateY(-3px);box-shadow:inset 0 0 56px rgba(var(--kpi-glow,43,143,255),.32),inset 0 0 22px rgba(var(--kpi-glow,43,143,255),.16),inset 0 1px 0 rgba(255,255,255,.76),0 8px 20px -12px rgba(21,32,59,.12);}
  .lr-kpic__top{display:flex;align-items:center;gap:11px;}
  .lr-kpic__ic{flex:0 0 40px;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:rgb(var(--kpi-glow,43,143,255));
    background:rgba(var(--kpi-glow,43,143,255),.1);box-shadow:inset 0 0 0 1px rgba(var(--kpi-glow,43,143,255),.18);}
  .lr-kpic__lbl{font-size:13px;font-weight:600;color:var(--sd-ink-sub);line-height:1.2;}
  .lr-kpic__bot{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;}
  .lr-kpic__num{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:52px;letter-spacing:-2.6px;color:var(--sd-ink);line-height:.9;font-variant-numeric:tabular-nums;}
  .lr-kpic__delta{display:inline-flex;align-items:center;gap:4px;margin-top:13px;font-size:12.5px;font-weight:600;color:#1C7E52;}
  .lr-kpic__delta.neutral{color:var(--sd-ink-mute);}
  .lr-kpic__bot .lr-spark{align-self:flex-end;margin-bottom:4px;}
  /* анкер — ПЛОСКАЯ сапфировая заливка, единственный сильный акцент в ряду (без выпуклости) */
  .lr-kpic.anchor{border-color:rgba(255,255,255,.28);background:var(--sd-acc-deep);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 1px 2px rgba(31,99,200,.2),0 22px 46px -20px rgba(31,99,200,.55);}
  .lr-kpic.anchor:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 1px 2px rgba(31,99,200,.24),0 30px 58px -22px rgba(31,99,200,.62);}
  .lr-kpic.anchor .lr-kpic__lbl{color:rgba(255,255,255,.9);}
  .lr-kpic.anchor .lr-kpic__num{color:#fff;}
  .lr-kpic.anchor .lr-kpic__ic{background:rgba(255,255,255,.16);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.24);}
  .lr-kpic.anchor .lr-kpic__delta{color:rgba(255,255,255,.9);}

  /* ряд аналитики: 3 стеклянные панели */
  .lr-charts{display:grid;grid-template-columns:1.5fr 1.15fr;gap:18px;margin-top:18px;align-items:stretch;}
  .lr-cpnl{display:flex;flex-direction:column;border-radius:22px;padding:22px 22px 20px;
    background:linear-gradient(150deg,rgba(255,255,255,.56),rgba(255,255,255,.36));
    border:1px solid rgba(120,150,215,.2);-webkit-backdrop-filter:blur(30px) saturate(155%);backdrop-filter:blur(30px) saturate(155%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.78),0 4px 14px -10px rgba(21,32,59,.08);}
  .lr-cpnl__h{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
  .lr-cpnl__h h3{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:600;font-size:16.5px;letter-spacing:-.3px;color:#1A2440;margin:0;}
  .lr-cpnl__sum{margin-left:auto;font-size:12.5px;font-weight:500;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
  .lr-cpnl__sum b{color:var(--sd-acc-deep);font-weight:700;}

  /* бар-чарт «Активность за неделю» */
  .lr-bars{display:flex;align-items:flex-end;gap:10px;margin-top:auto;}
  .lr-barcol{flex:1 1 0;display:flex;flex-direction:column;align-items:center;gap:11px;}
  .lr-bartrack{position:relative;width:100%;max-width:36px;height:152px;border-radius:10px;background:rgba(43,90,200,.06);display:flex;align-items:flex-end;}
  .lr-barfill{position:relative;width:100%;border-radius:9px;background:rgba(43,143,255,.32);transition:background .16s;}
  .lr-barcol.is-today .lr-barfill{background:var(--sd-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.3);}
  .lr-barcol:hover .lr-barfill{background:rgba(43,143,255,.5);}
  .lr-barcol.is-today:hover .lr-barfill{background:var(--sd-acc);}
  .lr-barval{position:absolute;top:-27px;left:50%;transform:translateX(-50%);white-space:nowrap;padding:3px 9px;border-radius:8px;font-size:11.5px;font-weight:700;color:#fff;
    background:var(--sd-acc-deep);box-shadow:0 6px 15px rgba(43,120,255,.34);font-variant-numeric:tabular-nums;}
  .lr-barval::after{content:'';position:absolute;left:50%;bottom:-3px;transform:translateX(-50%) rotate(45deg);width:7px;height:7px;background:var(--sd-acc-deep);border-radius:1px;}
  .lr-barlbl{font-size:11.5px;font-weight:600;color:var(--sd-ink-mute);}
  .lr-barcol.is-today .lr-barlbl{color:var(--sd-acc-deep);font-weight:700;}

  /* донат «Время по предметам» (крупнее, легенда с процентами) */
  .lr-donut{display:flex;flex-direction:column;align-items:center;gap:22px;margin-top:auto;}
  .lr-donut__svg{position:relative;display:grid;place-items:center;}
  .lr-donut__c{position:absolute;text-align:center;pointer-events:none;}
  .lr-donut__cn{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:31px;letter-spacing:-1.2px;color:var(--sd-ink);line-height:1;font-variant-numeric:tabular-nums;}
  .lr-donut__cl{font-size:11.5px;font-weight:500;color:var(--sd-ink-mute);margin-top:4px;}
  .lr-leg{width:100%;display:flex;flex-direction:column;gap:13px;}
  .lr-legrow{display:flex;align-items:center;gap:11px;font-size:13px;}
  .lr-legdot{flex:0 0 10px;width:10px;height:10px;border-radius:3px;}
  .lr-legname{font-weight:600;color:var(--sd-ink-sub);}
  .lr-legpct{margin-left:auto;font-weight:600;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
  .lr-legval{margin-left:13px;font-weight:700;color:var(--sd-ink);font-variant-numeric:tabular-nums;}

  /* топ-темы (список со спарклайнами) */
  .lr-top{display:flex;flex-direction:column;}
  .lr-toprow{display:flex;align-items:center;gap:13px;padding:13px 0;border-bottom:1px solid rgba(22,32,59,.06);}
  .lr-toprow:first-child{padding-top:0;}
  .lr-toprow:last-child{border-bottom:0;padding-bottom:0;}
  .lr-topb{flex:1 1 auto;min-width:0;}
  .lr-topt{font-size:13.5px;font-weight:600;color:var(--sd-ink);line-height:1.2;}
  .lr-tops{font-size:11.5px;font-weight:500;color:var(--sd-ink-mute);margin-top:2px;}
  .lr-topr{display:flex;align-items:center;gap:12px;flex:0 0 auto;}
  .lr-topscore{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:18px;letter-spacing:-.5px;color:var(--sd-ink);font-variant-numeric:tabular-nums;}

  /* ── ряд 2 аналитики: понятный календарь серии + статистика серии ────────── */
  .lr-charts2{display:grid;grid-template-columns:1.6fr 1fr;gap:18px;margin-top:18px;align-items:stretch;}
  /* ── «Серия занятий» — хитмап как «Avg Voicemail» в референсе: легенда-пороги
     сверху, ось Y (недели) слева, дни по X, тайлы + штрихованные пропуски ── */
  .lr-hmleg{display:flex;flex-wrap:wrap;align-items:center;gap:8px 15px;margin:-6px 0 16px;font-size:11px;font-weight:500;color:var(--sd-ink-mute);}
  .lr-hmleg__i{display:inline-flex;align-items:center;gap:6px;}
  .lr-hmleg__sw{width:13px;height:13px;border-radius:4px;flex:0 0 13px;border:1px solid rgba(255,255,255,.35);}
  .lr-hmleg__sw.off{background-color:rgba(90,120,180,.05);background-image:repeating-linear-gradient(45deg,rgba(96,124,186,.22) 0 1.5px,transparent 1.5px 6px);border-color:rgba(90,120,180,.16);}
  .lr-hmleg__best{margin-left:auto;font-weight:600;color:var(--sd-ink-sub);}
  .lr-hmleg__best b{color:var(--sd-acc-deep);font-weight:700;}
  .lr-hm{margin:auto 0;display:grid;grid-template-columns:auto 1fr;column-gap:11px;row-gap:9px;align-items:center;}
  .lr-hm__x{display:grid;grid-template-columns:repeat(7,1fr);gap:9px;}
  .lr-hm__xl{text-align:center;font-size:10.5px;font-weight:600;color:var(--sd-ink-mute);}
  .lr-hm__yl{font-size:10.5px;font-weight:600;color:var(--sd-ink-mute);white-space:nowrap;text-align:right;}
  .lr-hm__row{display:grid;grid-template-columns:repeat(7,1fr);gap:9px;}
  .lr-day{min-width:0;}
  .lr-day__box{display:block;position:relative;width:100%;aspect-ratio:1;border-radius:13px;
    border:1px solid rgba(255,255,255,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.4);transition:transform .15s cubic-bezier(.23,1,.32,1);}
  .lr-day:hover .lr-day__box{transform:translateY(-3px);}
  /* пропуск — диагональная штриховка (пустые ячейки из референса) */
  .lr-day.off .lr-day__box{background-color:rgba(90,120,180,.05);
    background-image:repeating-linear-gradient(45deg,rgba(96,124,186,.22) 0 1.5px,transparent 1.5px 6px);
    border-color:rgba(90,120,180,.16);box-shadow:none;}
  .lr-day.is-today .lr-day__box{box-shadow:0 0 0 2px var(--sd-acc-deep),0 6px 16px rgba(43,120,255,.34);border-color:transparent;}
  .lr-hmbest{margin-left:auto;font-weight:600;color:var(--sd-ink-sub);}
  .lr-hmbest b{color:var(--sd-acc-deep);font-weight:700;}
  .lr-fire{display:inline-flex;align-items:center;gap:6px;margin-left:auto;padding:5px 12px 5px 10px;border-radius:99px;
    background:var(--sd-acc-soft);font-size:12.5px;font-weight:700;color:var(--sd-acc-deep);font-variant-numeric:tabular-nums;}
  /* статистика серии (правая панель) */
  .lr-sst{display:flex;flex-direction:column;margin-top:-2px;}
  .lr-sstrow{display:flex;align-items:center;gap:13px;padding:13px 0;border-bottom:1px solid rgba(22,32,59,.06);}
  .lr-sstrow:first-child{padding-top:0;}
  .lr-sstrow:last-child{border-bottom:0;padding-bottom:0;}
  .lr-sst__ic{flex:0 0 38px;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:var(--sd-acc-deep);background:var(--sd-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,111,224,.12);}
  .lr-sst__lbl{flex:1 1 auto;min-width:0;font-size:13px;font-weight:500;color:var(--sd-ink-sub);}
  .lr-sst__val{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:16px;letter-spacing:-.4px;color:var(--sd-ink);font-variant-numeric:tabular-nums;}

  /* ── центральная плавающая кнопка AI (вместо FAB и баннера) ──────────────── */
  .lr-aifab{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:840;
    display:inline-flex;align-items:center;gap:12px;padding:11px 22px 11px 11px;border-radius:18px;cursor:pointer;font-family:inherit;
    background:rgba(11,18,42,.82);-webkit-backdrop-filter:blur(22px) saturate(160%);backdrop-filter:blur(22px) saturate(160%);
    border:1px solid rgba(120,160,255,.32);
    box-shadow:0 20px 48px rgba(8,16,44,.34),inset 0 1px 0 rgba(255,255,255,.14),inset 0 0 32px rgba(40,110,240,.16);
    transition:transform .2s cubic-bezier(.23,1,.32,1),box-shadow .2s;}
  .lr-aifab:hover{transform:translateX(-50%) translateY(-3px);box-shadow:0 26px 58px rgba(8,16,44,.44),inset 0 1px 0 rgba(255,255,255,.2),inset 0 0 44px rgba(40,110,240,.26);}
  .lr-aifab:active{transform:translateX(-50%) translateY(-1px) scale(.99);}
  .lr-aifab__ic{position:relative;flex:0 0 38px;width:38px;height:38px;border-radius:13px;display:grid;place-items:center;color:#fff;
    background:var(--sd-acc-deep);box-shadow:0 0 0 1px rgba(255,255,255,.14),0 6px 16px rgba(43,120,255,.5);}
  .lr-aifab__pulse{position:absolute;inset:0;border-radius:13px;border:2px solid rgba(43,143,255,.55);}
  .lr-aifab__tx{display:flex;flex-direction:column;text-align:left;line-height:1.12;}
  .lr-aifab__t{font-size:13.5px;font-weight:700;color:#fff;letter-spacing:-.2px;}
  .lr-aifab__s{font-size:11px;font-weight:500;color:rgba(190,208,255,.72);margin-top:1px;}
  @media (prefers-reduced-motion:no-preference){.lr-aifab__pulse{animation:aifabPulse 2.6s cubic-bezier(.23,1,.32,1) infinite;}}
  @keyframes aifabPulse{0%{transform:scale(1);opacity:.6;}70%{transform:scale(1.85);opacity:0;}100%{transform:scale(1.85);opacity:0;}}

  /* ── AI-наставник: тёмная атмосфера на всю ширину (спутник внизу экрана) ── */
  .lr-airow{margin-top:38px;}
  .lr-ai{position:relative;overflow:hidden;border-radius:24px;padding:26px 30px;min-height:152px;display:flex;flex-direction:column;justify-content:center;cursor:pointer;
    background:
      radial-gradient(720px 440px at 92% 12%, rgba(43,120,255,.4), transparent 62%),
      radial-gradient(520px 360px at 3% 122%, rgba(28,86,210,.3), transparent 60%),
      linear-gradient(150deg,#0A1126 0%,#0B1430 58%,#0C1A3C 100%);
    border:1px solid rgba(120,160,255,.24);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.1),inset 0 0 70px rgba(40,110,240,.12),0 18px 44px rgba(8,16,44,.28);
    transition:transform .18s,box-shadow .18s;}
  .lr-ai:hover{transform:translateY(-2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.13),inset 0 0 88px rgba(40,110,240,.2),0 24px 56px rgba(8,16,44,.38);}
  .lr-ai__c{position:relative;z-index:1;display:flex;align-items:baseline;gap:13px;flex-wrap:wrap;}
  .lr-ai__kick{font-size:12px;font-weight:600;color:var(--sd-acc-2);}
  .lr-ai__t{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:21px;letter-spacing:-.5px;color:#fff;line-height:1.18;}
  .lr-ai__chips{position:relative;z-index:1;display:flex;flex-wrap:wrap;gap:9px;margin-top:16px;max-width:calc(100% - 200px);}
  .lr-ai__chip{display:inline-flex;align-items:center;gap:7px;padding:9px 14px;border-radius:12px;font-size:12.5px;font-weight:500;color:#EAF0FF;cursor:pointer;font-family:inherit;
    background:rgba(255,255,255,.06);border:1px solid rgba(140,170,255,.2);transition:background .16s,border-color .16s,transform .16s;}
  .lr-ai__chip:hover{background:rgba(43,143,255,.16);border-color:rgba(43,143,255,.5);transform:translateY(-1px);}
  .lr-ai__chip svg{color:var(--sd-acc-2);}
  .lr-ai__bot{position:absolute;z-index:0;right:26px;bottom:0;width:172px;max-width:25%;height:auto;pointer-events:none;filter:drop-shadow(0 18px 36px rgba(0,8,36,.5));}

  @media (max-width:1100px){
    .lr-bot{grid-template-columns:1fr;}
    .lr-kpi{grid-template-columns:1fr 1fr;}
    .lr-charts{grid-template-columns:1fr 1fr;}
    .lr-charts2{grid-template-columns:1fr;}
    .lr-ai__chips{max-width:calc(100% - 150px);}
  }
  @media (max-width:880px){
    .lr-prog{grid-template-columns:1fr;}
    .lr-kpi{grid-template-columns:1fr 1fr;}
    .lr-charts{grid-template-columns:1fr;}
    .lr-charts2{grid-template-columns:1fr;}
    .lr-ai__chips{max-width:100%;}
    .lr-ai__bot{opacity:.45;}
  }

  /* во всём мобильном диапазоне (≤980) контент learn не уходит под плавающий
     бургер — верхний зазор 64px (планшетные боковые поля) */
  @media (max-width:980px){
    .sd-main--light:has(.lr-page) .sd-wrap{max-width:100%;padding:64px 26px 48px;}
  }

  /* ── Телефон: плашка во весь экран, воздуха больше, всё в один столбец,
     без картинки-шара сверху, «Мои обучения» без чипа/ссылки ── */
  @media (max-width:820px){
    .sd-main--light:has(.lr-page) .sd-wrap{max-width:100%;padding:64px 16px 48px;}
    /* грид-дети не должны раздувать трек до min-content своих строк */
    .lr-bot>*,.lr-kpi>*,.lr-charts>*,.lr-charts2>*{min-width:0;}
    .sd-main--light:has(.lr-page){
      background:
        radial-gradient(560px 460px at 100% -2%, rgba(88,158,255,.3) 0%, rgba(110,170,252,.08) 48%, transparent 74%),
        linear-gradient(170deg,#E9EDFA 0%,#EFF2FB 46%,#E9ECF8 100%);}

    /* герой — только текст + статы (картинка-шар убрана), больше воздуха */
    .lr-page .sd-hero2{min-height:auto;margin:0;}
    .lr-page .sd-hero2__mtwrap{display:none;}
    .lr-page .sd-hero2__main{margin-top:2px;max-width:100%;}
    .lr-page .sd-hero2__h{font-size:30px;letter-spacing:-1.2px;}
    .lr-page .sd-hero2__stats{grid-template-columns:1fr 1fr;gap:12px;margin-top:24px;max-width:100%;}
    .lr-page .sd-stat{padding:14px 15px;}
    .lr-page .sd-hero2 + .lr-sec{margin-top:42px;}

    /* воздух между секциями заметно больше */
    .lr-sec{margin-top:46px;}
    .lr-sec__h{gap:10px;margin-bottom:18px;}
    .lr-sec__h h2{font-size:20px;}
    /* «Мои обучения» (секция сразу за героем) — без чипа и ссылки «Все программы» */
    .lr-page .sd-hero2 + .lr-sec .lr-chip,
    .lr-page .sd-hero2 + .lr-sec .lr-seclink{display:none;}

    /* карточки программ */
    .lr-prog{gap:15px;}
    .lr-card{min-height:202px;padding:22px;border-radius:22px;}
    .lr-card__name{font-size:27px;letter-spacing:-.9px;}

    /* низ */
    .lr-bot{gap:15px;}
    .lr-panel{padding:20px 18px 15px;border-radius:22px;}

    /* KPI крупнее — цифры и иконки дышат */
    .lr-kpi{grid-template-columns:1fr;gap:15px;}
    .lr-kpic{min-height:152px;padding:24px 24px 22px;border-radius:22px;}
    .lr-kpic__ic{flex:0 0 44px;width:44px;height:44px;border-radius:14px;}
    .lr-kpic__num{font-size:52px;letter-spacing:-2.6px;}

    /* аналитика */
    .lr-charts{gap:15px;margin-top:15px;}
    .lr-charts2{gap:15px;margin-top:15px;}
    .lr-cpnl{padding:20px 20px 18px;border-radius:22px;}

    /* Серия занятий — минималистичнее: убираем подробную легенду-пороги
       (не влазила), плитки крупнее и просторнее */
    .lr-hmleg{display:none;}
    .lr-cpnl__h{margin-bottom:16px;}
    .lr-hm{column-gap:9px;row-gap:12px;}
    .lr-hm__row,.lr-hm__x{gap:12px;}
    .lr-day__box{border-radius:15px;}

    /* AI-спутник */
    .lr-airow{margin-top:46px;}
    .lr-ai{padding:24px 22px;border-radius:24px;}
    .lr-ai__t{font-size:20px;}
    .lr-ai__bot{width:120px;opacity:.35;}
  }
  @media (max-width:400px){
    .lr-page .sd-hero2__stats{grid-template-columns:1fr;}
    .lr-page .sd-hero2__h{font-size:27px;}
  }

  /* ── Мои уроки (живой режим #/learn?live) — реальные уроки из ELessonStore ── */
  .lr-les{display:grid;grid-template-columns:repeat(auto-fill,minmax(238px,1fr));gap:15px;}
  .lr-lescard{position:relative;display:flex;flex-direction:column;min-height:148px;padding:17px 17px 15px;border-radius:18px;cursor:pointer;
    background:linear-gradient(150deg,rgba(255,255,255,.62),rgba(255,255,255,.4));border:1px solid rgba(120,150,215,.22);
    -webkit-backdrop-filter:blur(26px) saturate(150%);backdrop-filter:blur(26px) saturate(150%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:transform .16s cubic-bezier(.23,1,.32,1),border-color .16s,background .16s;}
  .lr-lescard:hover{transform:translateY(-2px);border-color:rgba(43,143,255,.45);
    background:linear-gradient(150deg,rgba(255,255,255,.82),rgba(255,255,255,.58));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 0 30px rgba(43,143,255,.1);}
  .lr-lescard__lv{align-self:flex-start;font-size:11.5px;font-weight:700;color:#1763C8;padding:3px 9px;border-radius:99px;
    background:rgba(43,143,255,.1);border:1px solid rgba(43,143,255,.16);}
  .lr-lescard__t{margin-top:11px;font-size:16px;font-weight:700;letter-spacing:-.02em;line-height:1.22;color:#15203B;text-wrap:balance;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .lr-lescard__m{margin-top:auto;padding-top:12px;font-size:12px;font-weight:600;color:rgba(21,32,59,.5);font-variant-numeric:tabular-nums;
    display:flex;align-items:center;gap:8px;border-top:1px solid rgba(22,32,59,.07);}
  .lr-lescard__m i{width:3px;height:3px;border-radius:50%;background:rgba(21,32,59,.24);font-style:normal;}
  .lr-lescard__go{position:absolute;top:15px;right:15px;color:#1E63C2;opacity:0;transform:translate(-2px,2px);transition:opacity .16s,transform .16s;}
  .lr-lescard:hover .lr-lescard__go{opacity:1;transform:none;}
  .lr-lesempty{padding:30px;border-radius:18px;text-align:center;font-size:14px;font-weight:500;color:rgba(21,32,59,.55);
    background:rgba(255,255,255,.4);border:1px dashed rgba(22,32,59,.16);}
  `;

  if (!document.getElementById('learn-home-styles')) {
    const el = document.createElement('style');
    el.id = 'learn-home-styles';
    el.innerHTML = css;
    document.head.appendChild(el);
  }

  // ── helpers
  const go = (label) => SH && SH.onNav({ label: label });
  const chat = () => SH && SH.openChat();
  const arr = (s) => Ic.ArrowRight ? h(Ic.ArrowRight, { size: s || 16 }) : '→';
  const chev = (s) => Ic.ChevronRight ? h(Ic.ChevronRight, { size: s || 17 }) : '›';

  const T = { sap: '43,143,255', jade: '46,160,110', gold: '201,146,62', coral: '210,96,79' };

  // ── мини-спарклайны и графики (плоские: бары/линия/кольцо — это линии, не выпуклости)
  const SW = 84, SHH = 38;
  function sparkBars(vals, color, w, hh) {
    w = w || SW; hh = hh || SHH;
    const n = vals.length, gap = Math.max(2, w * 0.055), bw = (w - (n - 1) * gap) / n;
    return h('svg', { className: 'lr-spark', width: w, height: hh, viewBox: '0 0 ' + w + ' ' + hh, fill: 'none', 'aria-hidden': 'true' },
      vals.map(function (v, i) {
        const ht = Math.max(4, v * (hh - 2));
        return h('rect', { key: i, x: (i * (bw + gap)).toFixed(1), y: (hh - ht).toFixed(1), width: bw.toFixed(1), height: ht.toFixed(1), rx: '2.4', fill: color, opacity: i === n - 1 ? 1 : 0.36 });
      }));
  }
  function sparkLine(vals, color, w, hh) {
    w = w || SW; hh = hh || SHH;
    const n = vals.length, step = w / (n - 1);
    const pts = vals.map(function (v, i) { return (i * step).toFixed(1) + ',' + (hh - (v * (hh - 5) + 2)).toFixed(1); }).join(' ');
    const lx = ((n - 1) * step).toFixed(1), ly = (hh - (vals[n - 1] * (hh - 5) + 2)).toFixed(1);
    return h('svg', { className: 'lr-spark', width: w, height: hh, viewBox: '0 0 ' + w + ' ' + hh, fill: 'none', 'aria-hidden': 'true' },
      h('polyline', { points: pts, fill: 'none', stroke: color, strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', opacity: '.9' }),
      h('circle', { cx: lx, cy: ly, r: '2.8', fill: color }));
  }
  // плоское кольцо-донат: segs=[{val,color}], сегменты с зазорами
  function donut(segs, sz) {
    sz = sz || 132;
    const total = segs.reduce(function (a, s) { return a + s.val; }, 0) || 1;
    const r = sz / 2 - 14, cx = sz / 2, cy = sz / 2, sw = 18, C = 2 * Math.PI * r, gap = 3;
    let acc = 0;
    const arcs = segs.map(function (s, i) {
      const len = (s.val / total) * C, off = acc; acc += len;
      const dash = Math.max(0, len - gap);
      return h('circle', { key: i, cx: cx, cy: cy, r: r, fill: 'none', stroke: s.color, strokeWidth: sw,
        strokeDasharray: dash.toFixed(2) + ' ' + (C - dash).toFixed(2), strokeDashoffset: (-off).toFixed(2),
        strokeLinecap: 'round', transform: 'rotate(-90 ' + cx + ' ' + cy + ')' });
    });
    return h('svg', { width: sz, height: sz, viewBox: '0 0 ' + sz + ' ' + sz, fill: 'none', 'aria-hidden': 'true' },
      h('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: 'rgba(22,32,59,.06)', strokeWidth: sw }), arcs);
  }
  // плоское кольцо прогресса (трек + дуга), % рисуем поверх в разметке
  function ring(pct, color, sz) {
    sz = sz || 54;
    const r = sz / 2 - 5, cx = sz / 2, C = 2 * Math.PI * r, len = (pct / 100) * C;
    return h('svg', { width: sz, height: sz, viewBox: '0 0 ' + sz + ' ' + sz, fill: 'none', 'aria-hidden': 'true' },
      h('circle', { cx: cx, cy: cx, r: r, fill: 'none', stroke: 'rgba(22,32,59,.09)', strokeWidth: '5' }),
      h('circle', { cx: cx, cy: cx, r: r, fill: 'none', stroke: color, strokeWidth: '5', strokeLinecap: 'round',
        strokeDasharray: len.toFixed(1) + ' ' + (C - len).toFixed(1), transform: 'rotate(-90 ' + cx + ' ' + cx + ')' }));
  }

  // ── данные
  const PILLS = [
    { ic: Ic.Book, t: T.sap, time: '17:00', title: 'Китайский язык', sub: 'Урок 12 · Время и распорядок дня' },
    { ic: Ic.Monitor, t: T.jade, time: '20:00', title: 'IELTS · Вебинар', sub: 'Разбор эссе Task 2' },
  ];

  const PROGRAMS = [
    { bg: 'assets/card-blue.png',   acc: '43,143,255',  active: true, l1: 'Китайский', l2: 'язык', count: '32 урока · 12 тестов', cta: 'Продолжить' },
    { bg: 'assets/card-pink.png',   acc: '232,120,155', dim2: true, l1: 'Курс', l2: 'IELTS', count: '24 урока · 8 тестов', cta: 'Продолжить' },
    { bg: 'assets/card-orange.png', acc: '240,148,54',  dim: true, l1: 'Поступление', l2: 'в вуз', count: '8 этапов · 5 документов', cta: 'Перейти' },
  ];

  const SCHEDULE = [
    { t: T.sap, ic: Ic.Book, time: '17:00', title: 'Китайский язык', sub: 'Урок 12 · Время и распорядок дня', meta: 'Онлайн · 50 минут', m: T.sap, mt: 'Занятие', next: true },
    { t: T.jade, ic: Ic.Monitor, time: '20:00', title: 'IELTS · Вебинар', sub: 'Разбор эссе Task 2', meta: 'Онлайн · 60 минут', m: T.jade, mt: 'Вебинар' },
    { t: T.gold, ic: Ic.Edit, time: '23:59', title: 'Домашнее задание', sub: 'Аудирование · Тоны и интонации', meta: 'Дедлайн сегодня', m: T.gold, mt: 'Сдать' },
  ];

  const TASKS = [
    { t: T.coral, ic: Ic.Doc, title: 'Домашка по уроку 11', sub: 'IELTS · Writing', m: T.coral, mt: 'Сегодня, 23:59', hot: true },
    { t: T.sap, ic: Ic.Edit, title: 'Написать эссе Task 2', sub: 'Китайский язык', m: T.sap, mt: 'Завтра' },
    { t: T.jade, ic: Ic.Cap, title: 'Фото 3х4 для документов', sub: 'Поступление', m: 'grey', mt: 'До 18 июня' },
  ];

  const STATS = [
    { ic: Ic.Book, num: '18', lbl: 'Уроков пройдено', delta: '+3 за неделю', up: true, anchor: true, glow: '43,143,255', bars: [.32, .5, .42, .64, .56, .82, 1] },
    { ic: Ic.Bolt, num: '12', lbl: 'Дней подряд', delta: 'Личный рекорд', up: true, glow: '124,132,246', bars: [.4, .55, .5, .68, .6, .85, 1] },
    { ic: Ic.Edit, num: '240', lbl: 'Слов выучено', delta: '+18 за неделю', up: true, glow: '150,124,240', line: [.28, .42, .38, .6, .68, .64, .92] },
  ];

  // активность по дням недели (минуты), донат-распределение часов, сильные темы
  const ACTIVITY = [
    { d: 'Пн', v: .45, m: 42 }, { d: 'Вт', v: .7, m: 65 }, { d: 'Ср', v: .56, m: 52 },
    { d: 'Чт', v: .85, m: 78 }, { d: 'Пт', v: .6, m: 56 }, { d: 'Сб', v: 1, m: 92, today: true }, { d: 'Вс', v: .3, m: 28 },
  ];
  const SUBJECTS = [
    { name: 'Китайский', val: 8, color: 'rgb(32,115,230)' },
    { name: 'IELTS', val: 4, color: 'rgb(150,195,255)' },
  ];
  // тепловая карта серии: 24 недели × 7 дней, интенсивность 0-4 (детерминированно)
  // шкала интенсивности (0–4) и месяцы
  const HM_COLORS = ['rgba(90,120,180,.09)', 'rgba(43,143,255,.3)', 'rgba(43,143,255,.52)', 'rgba(43,143,255,.74)', 'rgb(40,130,246)'];
  const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  // последние 14 дней: число + день недели + интенсивность (последние 12 дней — серия)
  const CAL = (function () {
    var WD = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
    var pat = [2, 0, 3, 4, 2, 3, 4, 3, 2, 4, 3, 4, 3, 4];
    var anchor = new Date(2026, 5, 28), out = [];
    for (var i = 13; i >= 0; i--) {
      var d = new Date(anchor.getTime());
      d.setDate(d.getDate() - i);
      out.push({ n: d.getDate(), wd: WD[(d.getDay() + 6) % 7], mon: MONTHS_SHORT[d.getMonth()], v: pat[13 - i], today: i === 0 });
    }
    return out;
  })();
  const STREAKSTATS = [
    { ic: Ic.Bolt, lbl: 'Текущая серия', val: '12 дней' },
    { ic: Ic.Star, lbl: 'Лучшая серия', val: '14 дней' },
    { ic: Ic.Calendar, lbl: 'Эта неделя', val: '5 из 7 дней' },
    { ic: Ic.Clock, lbl: 'Всего часов', val: '48 ч' },
  ];

  /* ── HERO — копия hero Главной (sd-hero2/sd-stat), контент обучения ──────── */
  function Hero() {
    var first = (SH && SH.USER && SH.USER.first) || 'Дима';
    var heart = function () { return Ic.Heart ? h(Ic.Heart, { size: 14 }) : null; };
    return h('section', { className: 'sd-hero2' },
      h('div', { className: 'sd-hero2__main' },
        h('div', { className: 'sd-hero2__hi' }, 'Привет, ' + first + '!'),
        h('h1', { className: 'sd-hero2__h' }, 'Сегодня у вас', h('br'), h('span', { className: 'sd-hero2__em' }, '2 занятия и 1 задача')),
        h('div', { className: 'sd-hero2__re' }, heart(), 'Вы молодец, держите темп!', heart()),
        h('div', { className: 'sd-hero2__stats' },
          h('div', { className: 'sd-stat' },
            h('div', { className: 'sd-stat__ic' }, Ic.Calendar ? h(Ic.Calendar, { size: 20 }) : null),
            h('div', { className: 'sd-stat__b' },
              h('div', { className: 'sd-stat__lab' }, 'Ближайшее занятие'),
              h('div', { className: 'sd-stat__val' }, '17:00'),
              h('div', { className: 'sd-stat__sub' }, 'Китайский язык · Урок 12'))),
          h('div', { className: 'sd-stat' },
            h('div', { className: 'sd-stat__ic' }, Ic.TrendUp ? h(Ic.TrendUp, { size: 20 }) : null),
            h('div', { className: 'sd-stat__b' },
              h('div', { className: 'sd-stat__lab' }, 'Прогресс недели'),
              h('div', { className: 'sd-stat__val' }, '5 из 7 дней'),
              h('div', { className: 'sd-stat__bar' }, h('i', { style: { width: '71%' } })))))),
      h('div', { className: 'sd-hero2__mtwrap', 'aria-hidden': 'true' },
        h('img', { className: 'sd-hero2__mt', src: 'assets/hero-learn.png', alt: '' })));
  }

  /* ── Программы ─────────────────────────────────────────────────────────── */
  function Programs() {
    return h('section', { className: 'lr-sec' },
      h('div', { className: 'lr-sec__h' },
        h('h2', null, 'Мои обучения'),
        h('span', { className: 'lr-chip' }, Ic.Bolt ? h(Ic.Bolt, { size: 12 }) : null, '3 активные программы'),
        h('button', { type: 'button', className: 'lr-seclink', onClick: function () { go('Все программы'); } }, 'Все программы', arr(14))),
      h('div', { className: 'lr-prog' },
        PROGRAMS.map(function (p, i) {
          return h('div', { key: i, className: 'lr-card' + (p.active ? ' is-active' : '') + (p.dim ? ' lr-card--dim' : '') + (p.dim2 ? ' lr-card--dim2' : ''), style: { '--card-acc': p.acc }, onClick: chat },
            h('img', { className: 'lr-card__bg', src: p.bg, alt: '', 'aria-hidden': 'true' }),
            h('div', { className: 'lr-card__top' },
              h('div', { className: 'lr-card__name' }, p.l1, h('br'), p.l2),
              h('div', { className: 'lr-card__count' }, p.count)),
            h('div', { className: 'lr-card__bottom' },
              h('button', { type: 'button', className: 'lr-card__btn', onClick: function (e) { e.stopPropagation(); chat(); } },
                p.cta, Ic.ArrowUpRight ? h(Ic.ArrowUpRight, { size: 16 }) : '↗')));
        })));
  }

  /* ── Мои уроки (живой режим #/learn?live) — реальные уроки из ELessonStore ──
     Витрина уроков, собранных в конструкторе: клик → открыть как ученик, ссылка
     «Все уроки» → библиотека /learn/lessons. В демо-режиме секция не рендерится. */
  function lesPlural(n, a, b, c) { const m = Math.abs(n) % 100, n1 = m % 10; if (m > 10 && m < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c; }
  function MyLessons(props) {
    const nav = (window.ERouter && window.ERouter.navigate) || function () {};
    const items = (props && props.items) || [];
    return h('section', { className: 'lr-sec' },
      h('div', { className: 'lr-sec__h' },
        h('h2', null, 'Мои уроки'),
        h('span', { className: 'lr-chip' }, Ic.Book ? h(Ic.Book, { size: 12 }) : null, items.length + ' ' + lesPlural(items.length, 'урок', 'урока', 'уроков')),
        h('button', { type: 'button', className: 'lr-seclink', onClick: function () { nav('/learn/lessons'); } }, 'Все уроки', arr(14))),
      items.length
        ? h('div', { className: 'lr-les' }, items.slice(0, 6).map(function (it) {
            const c = it.counts || {};
            return h('div', { key: it.id, className: 'lr-lescard', onClick: function () { nav('/learn/lesson/' + it.id); } },
              h('span', { className: 'lr-lescard__go' }, arr(16)),
              h('span', { className: 'lr-lescard__lv' }, it.level || 'Урок'),
              h('div', { className: 'lr-lescard__t' }, it.title || 'Новый урок'),
              h('div', { className: 'lr-lescard__m' },
                h('span', null, (c.blocks || 0) + ' ' + lesPlural(c.blocks || 0, 'задание', 'задания', 'заданий')),
                c.words ? h('i', null) : null,
                c.words ? h('span', null, c.words + ' ' + lesPlural(c.words, 'слово', 'слова', 'слов')) : null,
                h('i', null), h('span', null, '~' + (c.minutes || 1) + ' мин')));
          }))
        : h('div', { className: 'lr-lesempty' }, 'Пока нет созданных уроков — соберите первый в конструкторе'));
  }

  /* ── Низ ───────────────────────────────────────────────────────────────── */
  function Bottom() {
    return h('section', { className: 'lr-sec lr-bot' },
      // расписание
      h('div', { className: 'lr-panel' },
        h('div', { className: 'lr-panel__h' },
          h('h3', null, 'Расписание'),
          h('div', { className: 'lr-tabs' },
            h('button', { type: 'button', className: 'lr-tab is-on' }, 'Сегодня'),
            h('button', { type: 'button', className: 'lr-tab' }, 'Завтра'))),
        SCHEDULE.map(function (s, i) {
          return h('div', { key: i, className: 'lr-ev' + (s.next ? ' is-next' : ''), style: { '--t': s.t, '--m': s.m }, onClick: function () { go('Открыть занятие'); } },
            h('span', { className: 'lr-ev__time' }, s.time),
            h('span', { className: 'lr-ev__ic' }, s.ic ? h(s.ic, { size: 17 }) : null),
            h('div', { className: 'lr-ev__b' },
              h('div', { className: 'lr-ev__t' }, s.title),
              h('div', { className: 'lr-ev__s' }, s.sub)),
            h('span', { className: 'lr-ev__chip' }, s.mt));
        }),
        h('div', { className: 'lr-foot' }, h('button', { type: 'button', className: 'lr-foot__link', onClick: function () { go('Полное расписание'); } }, 'Полное расписание', arr(13)))),
      // задачи
      h('div', { className: 'lr-panel' },
        h('div', { className: 'lr-panel__h' },
          h('h3', null, 'Ближайшие задачи'),
          h('span', { className: 'lr-count', style: { marginLeft: 'auto' } }, '3')),
        TASKS.map(function (t, i) {
          return h('div', { key: i, className: 'lr-tk' + (t.hot ? ' is-hot' : ''), style: { '--t': t.t }, onClick: function () { go('Открыть задачу'); } },
            h('span', { className: 'lr-tk__ic' }, t.ic ? h(t.ic, { size: 17 }) : null),
            h('div', { className: 'lr-tk__b' },
              h('div', { className: 'lr-tk__t' }, t.title),
              h('div', { className: 'lr-tk__s' }, t.sub)),
            h('span', { className: 'lr-tk__chip' + (t.m === 'grey' ? ' grey' : ''), style: t.m === 'grey' ? null : { '--m': t.m } }, t.mt));
        }),
        h('div', { className: 'lr-foot' }, h('button', { type: 'button', className: 'lr-foot__link', onClick: function () { go('Все задачи'); } }, 'Все задачи', arr(13)))));
  }

  /* ── Ваш прогресс: крупные KPI + ряд аналитики (бары · донат · топ-темы) ── */
  function Stats(props) {
    const live = props && props.live;
    const ls = (props && props.lessonStats) || null;
    // В живом режиме KPI считаются из реальных уроков (ELessonStore), в демо — статика.
    const kpis = (live && ls) ? [
      { ic: Ic.Book, num: String(ls.lessons), lbl: 'Уроков в библиотеке', delta: 'в конструкторе', up: true, anchor: true, glow: '43,143,255', bars: [.4, .55, .5, .7, .62, .85, 1] },
      { ic: Ic.Edit, num: String(ls.tasks), lbl: 'Заданий собрано', delta: 'во всех уроках', up: true, glow: '124,132,246', bars: [.35, .5, .48, .62, .7, .8, 1] },
      { ic: Ic.Book, num: String(ls.words), lbl: 'Слов в уроках', delta: 'словарь курса', up: true, glow: '150,124,240', line: [.3, .44, .4, .6, .66, .7, .95] },
    ] : STATS;
    return h('section', { className: 'lr-sec' },
      h('div', { className: 'lr-sec__h' },
        h('h2', null, 'Ваш прогресс'),
        h('span', { className: 'lr-chip' }, Ic.TrendUp ? h(Ic.TrendUp, { size: 12 }) : null, live ? 'По библиотеке' : 'Эта неделя')),
      // крупные KPI
      h('div', { className: 'lr-kpi' },
        kpis.map(function (s, i) {
          var color = s.anchor ? 'rgba(255,255,255,.92)' : ('rgb(' + s.glow + ')');
          var spark = s.line ? sparkLine(s.line, color) : sparkBars(s.bars, color);
          return h('div', { key: i, className: 'lr-kpic' + (s.anchor ? ' anchor' : ''), style: { '--kpi-glow': s.glow } },
            h('div', { className: 'lr-kpic__top' },
              h('span', { className: 'lr-kpic__ic' }, s.ic ? h(s.ic, { size: 19 }) : null),
              h('span', { className: 'lr-kpic__lbl' }, s.lbl)),
            h('div', { className: 'lr-kpic__bot' },
              h('div', null,
                h('div', { className: 'lr-kpic__num' }, s.num),
                h('div', { className: 'lr-kpic__delta' + (s.up ? '' : ' neutral') },
                  s.up && Ic.TrendUp ? h(Ic.TrendUp, { size: 12 }) : null, s.delta)),
              spark));
        })),
      // ряд аналитики: активность за неделю + время по предметам
      h('div', { className: 'lr-charts' },
        h('div', { className: 'lr-cpnl' },
          h('div', { className: 'lr-cpnl__h' },
            h('h3', null, 'Активность за неделю'),
            h('span', { className: 'lr-cpnl__sum' }, 'всего ', h('b', null, '413 мин'))),
          h('div', { className: 'lr-bars' },
            ACTIVITY.map(function (a, i) {
              return h('div', { key: i, className: 'lr-barcol' + (a.today ? ' is-today' : '') },
                h('div', { className: 'lr-bartrack' },
                  h('div', { className: 'lr-barfill', style: { height: (a.v * 100).toFixed(0) + '%' } },
                    a.today ? h('span', { className: 'lr-barval' }, a.m + ' мин') : null)),
                h('span', { className: 'lr-barlbl' }, a.d));
            }))),
        h('div', { className: 'lr-cpnl' },
          h('div', { className: 'lr-cpnl__h' }, h('h3', null, 'Время по предметам')),
          h('div', { className: 'lr-donut' },
            h('div', { className: 'lr-donut__svg' },
              donut(SUBJECTS, 152),
              h('div', { className: 'lr-donut__c' },
                h('div', { className: 'lr-donut__cn' }, '12'),
                h('div', { className: 'lr-donut__cl' }, 'часов в неделю'))),
            h('div', { className: 'lr-leg' },
              SUBJECTS.map(function (s, i) {
                return h('div', { key: i, className: 'lr-legrow' },
                  h('span', { className: 'lr-legdot', style: { background: s.color } }),
                  h('span', { className: 'lr-legname' }, s.name),
                  h('span', { className: 'lr-legpct' }, Math.round(s.val / 12 * 100) + '%'),
                  h('span', { className: 'lr-legval' }, s.val + ' ч'));
              }))))),
      // ряд аналитики 2: понятная тепловая карта серии + статистика серии
      h('div', { className: 'lr-charts2' },
        h('div', { className: 'lr-cpnl' },
          h('div', { className: 'lr-cpnl__h' },
            h('h3', null, 'Серия занятий'),
            h('span', { className: 'lr-fire' }, Ic.Bolt ? h(Ic.Bolt, { size: 13 }) : null, '12 дней подряд')),
          h('div', { className: 'lr-hmleg' },
            [['до 15 мин', 1], ['15–30', 2], ['30–45', 3], ['45 мин+', 4]].map(function (it) {
              return h('span', { key: it[1], className: 'lr-hmleg__i' },
                h('i', { className: 'lr-hmleg__sw', style: { background: HM_COLORS[it[1]] } }), it[0]);
            }),
            h('span', { className: 'lr-hmleg__i' }, h('i', { className: 'lr-hmleg__sw off' }), 'пропуск'),
            h('span', { className: 'lr-hmleg__best' }, 'Лучшая серия ', h('b', null, '14 дней'))),
          h('div', { className: 'lr-hm' },
            h('div', null),
            h('div', { className: 'lr-hm__x' },
              ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(function (w, i) { return h('span', { key: i, className: 'lr-hm__xl' }, w); })),
            h('div', { className: 'lr-hm__yl' }, CAL[0].n + '–' + CAL[6].n),
            h('div', { className: 'lr-hm__row' }, CAL.slice(0, 7).map(function (d, i) {
              var on = d.v >= 1;
              return h('div', { key: i, className: 'lr-day' + (on ? '' : ' off') + (d.today ? ' is-today' : '') }, h('span', { className: 'lr-day__box', style: on ? { background: HM_COLORS[d.v] } : null }));
            })),
            h('div', { className: 'lr-hm__yl' }, CAL[7].n + '–' + CAL[13].n),
            h('div', { className: 'lr-hm__row' }, CAL.slice(7, 14).map(function (d, i) {
              var on = d.v >= 1;
              return h('div', { key: i, className: 'lr-day' + (on ? '' : ' off') + (d.today ? ' is-today' : '') }, h('span', { className: 'lr-day__box', style: on ? { background: HM_COLORS[d.v] } : null }));
            })))),
        h('div', { className: 'lr-cpnl' },
          h('div', { className: 'lr-cpnl__h' }, h('h3', null, 'Статистика серии')),
          h('div', { className: 'lr-sst' },
            STREAKSTATS.map(function (s, i) {
              return h('div', { key: i, className: 'lr-sstrow' },
                h('span', { className: 'lr-sst__ic' }, s.ic ? h(s.ic, { size: 17 }) : null),
                h('span', { className: 'lr-sst__lbl' }, s.lbl),
                h('span', { className: 'lr-sst__val' }, s.val));
            })))));
  }

  function LearnHome(props) {
    if (!SH) return h('div', { style: { padding: 40, color: '#fff' } }, 'Скелет ученика не загружен');
    // Живой режим: #/learn?live — данные из реального бэкенда/ELessonStore.
    // Демо: #/learn — статичная витрина (как сейчас). Один макет, два источника.
    const live = !!(props && props.query && ('live' in props.query));
    const Store = window.ELessonStore;
    const summaries = (live && Store) ? Store.listSync() : [];
    const lessonStats = {
      lessons: summaries.length,
      tasks: summaries.reduce(function (a, s) { return a + ((s.counts && s.counts.blocks) || 0); }, 0),
      words: summaries.reduce(function (a, s) { return a + ((s.counts && s.counts.words) || 0); }, 0),
    };
    return h(SH.Shell, { active: 'learn', surface: 'light', hideTopBar: true, aiCenter: true, footer: true },
      h('div', { className: 'lr-page' },
        h(Hero, null),
        h(Programs, null),
        live ? h(MyLessons, { items: summaries }) : null,
        h(Bottom, null),
        h(Stats, { live: live, lessonStats: lessonStats })));
  }

  EScreens.LearnHome = LearnHome;
})();
