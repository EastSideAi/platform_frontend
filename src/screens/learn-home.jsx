/* ============================================================================
   EastSide — Обучение (window.EScreens.LearnHome · #/learn)
   ----------------------------------------------------------------------------
   Режим B (Рабочее пространство). Живет ВНУТРИ общего скелета ученика
   (window.ESStudentShell) — тот же тёмный стеклянный сайдбар с маскотом, те же
   токены --sd-* (тема через класс, НЕ через prefers-color-scheme → не уходит в
   тёмное), тот же визуальный язык, что и Главная. Здесь — только контент обучения:
   воздушный hero с парящей горой-восхождением, минималистичные карточки программ
   (full-bleed 3D-render + frosted-панель), низ (расписание · задачи · достижения + AI).

   Якорь hero — сапфировая гора assets/mountain-peak.png (как в hero Главной). Голос «вы».
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
  @keyframes lrUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
  .lr-page>section{animation:lrUp .5s cubic-bezier(.23,1,.32,1) both;}
  .lr-page>section:nth-child(2){animation-delay:.06s;}
  .lr-page>section:nth-child(3){animation-delay:.12s;}
  .lr-page>section:nth-child(4){animation-delay:.18s;}
  .lr-page>section:nth-child(5){animation-delay:.24s;}
  @media (prefers-reduced-motion:reduce){.lr-page>section{animation:none;}}

  /* ── HERO: воздушный, как на Главной — текст слева, гора парит справа ─────── */
  .lr-hero{position:relative;min-height:312px;padding-top:6px;}
  .lr-hero__main{position:relative;z-index:2;max-width:560px;}
  .lr-hero__hi{font-weight:600;font-size:15px;letter-spacing:-.2px;color:var(--sd-acc-deep);}
  .lr-hero__h{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:40px;line-height:1.08;
    letter-spacing:-1.7px;color:var(--sd-ink);margin:11px 0 0;text-wrap:balance;}
  .lr-hero__h .em{color:var(--sd-acc-deep);}
  .lr-hero__re{display:inline-flex;align-items:center;gap:8px;margin-top:15px;font-size:13.5px;font-weight:500;color:var(--sd-ink-sub);}
  .lr-hero__re svg{color:var(--sd-acc);}

  .lr-pills{display:flex;gap:13px;flex-wrap:wrap;margin-top:26px;}
  .lr-pill{display:flex;align-items:center;gap:13px;padding:12px 14px 12px 12px;border-radius:16px;cursor:pointer;font-family:inherit;
    background:linear-gradient(150deg,rgba(255,255,255,.82),rgba(244,247,255,.66));
    border:1px solid rgba(43,111,224,.16);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 8px 22px rgba(43,90,200,.06);
    transition:transform .16s cubic-bezier(.23,1,.32,1),border-color .16s,box-shadow .16s;}
  .lr-pill:hover{transform:translateY(-2px);border-color:rgba(43,143,255,.32);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 14px 30px rgba(43,90,200,.1);}
  .lr-pill__ic{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:#fff;
    background:rgb(var(--t));box-shadow:inset 0 0 0 1px rgba(255,255,255,.18),inset 0 1px 0 rgba(255,255,255,.4);}
  .lr-pill__b{display:flex;flex-direction:column;gap:1px;min-width:0;}
  .lr-pill__time{font-size:11.5px;font-weight:700;color:rgb(var(--t));font-variant-numeric:tabular-nums;letter-spacing:.01em;}
  .lr-pill__t{font-size:14px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;line-height:1.2;}
  .lr-pill__s{font-size:12px;font-weight:500;color:var(--sd-ink-mute);line-height:1.25;}
  .lr-pill__go{margin-left:6px;color:var(--sd-ink-faint,rgba(22,32,59,.3));display:inline-flex;flex:0 0 auto;transition:transform .15s,color .15s;}
  .lr-pill:hover .lr-pill__go{color:var(--sd-acc-deep);transform:translateX(2px);}

  /* плашка-статус сверху справа */
  .lr-note{position:absolute;top:2px;right:0;z-index:3;width:266px;border-radius:18px;padding:16px 18px;
    background:linear-gradient(150deg,rgba(255,255,255,.86),rgba(244,247,255,.74));
    border:1px solid rgba(43,111,224,.14);-webkit-backdrop-filter:blur(18px) saturate(140%);backdrop-filter:blur(18px) saturate(140%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 16px 38px rgba(43,90,200,.1);}
  .lr-note__top{display:flex;align-items:center;gap:10px;}
  .lr-note__ic{flex:0 0 28px;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:#fff;
    background:linear-gradient(150deg,#3EE08F,#1C7E52);box-shadow:inset 0 0 10px rgba(190,255,225,.55),0 0 14px rgba(46,160,110,.4);}
  .lr-note__t{font-size:14px;font-weight:700;color:var(--sd-ink);letter-spacing:-.2px;}
  .lr-note__s{font-size:12px;font-weight:500;color:var(--sd-ink-mute);line-height:1.4;margin-top:8px;}
  .lr-note__link{margin-top:12px;display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--sd-acc-deep);
    background:0;border:0;cursor:pointer;font-family:inherit;padding:0;transition:gap .15s;}
  .lr-note__link:hover{gap:8px;}

  .lr-hero__mtwrap{position:absolute;z-index:0;top:-58px;right:-58px;width:560px;max-width:50%;pointer-events:none;}
  .lr-hero__mt{display:block;width:100%;height:auto;
    filter:drop-shadow(0 24px 50px rgba(43,90,200,.16));
    -webkit-mask-image:radial-gradient(128% 124% at 68% 32%,#000 58%,transparent 100%);mask-image:radial-gradient(128% 124% at 68% 32%,#000 58%,transparent 100%);}

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

  /* ── Карточки программ: full-bleed 3D-фон + минимальная frosted-панель ──────
     Якорь карточки — её мягкий 3D-render во всю площадь. Хром нейтральный
     (белое стекло + сапфировая стрелка); цвет несёт только сама картинка. */
  .lr-prog{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
  .lr-card{position:relative;overflow:hidden;border-radius:22px;min-height:262px;display:block;cursor:pointer;
    border:1px solid rgba(43,90,200,.1);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 14px 34px rgba(43,90,200,.08);
    transition:transform .2s cubic-bezier(.23,1,.32,1),box-shadow .2s;}
  .lr-card:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 24px 52px rgba(43,90,200,.16);}
  .lr-card:hover .lr-card__bg{transform:scale(1.045);}
  .lr-card.is-active{border-color:rgba(43,143,255,.5);
    box-shadow:inset 0 0 0 1px rgba(43,143,255,.32),inset 0 1px 0 rgba(255,255,255,.5),0 16px 42px rgba(43,120,255,.2);}
  .lr-card__bg{position:absolute;z-index:0;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;
    transition:transform .45s cubic-bezier(.23,1,.32,1);}
  /* статус-чип сверху слева — frosted, цветная точка-пульс */
  .lr-card__st{position:absolute;z-index:2;top:14px;left:14px;display:inline-flex;align-items:center;gap:7px;
    padding:6px 12px 6px 10px;border-radius:99px;font-size:11.5px;font-weight:600;color:var(--sd-ink);
    background:rgba(255,255,255,.6);-webkit-backdrop-filter:blur(16px) saturate(150%);backdrop-filter:blur(16px) saturate(150%);
    border:1px solid rgba(255,255,255,.66);box-shadow:0 4px 14px rgba(43,90,200,.08);}
  .lr-card__st .d{width:7px;height:7px;border-radius:50%;background:rgb(var(--s));box-shadow:0 0 8px rgba(var(--s),.75);}
  /* нижняя frosted-панель — единственный текстовый блок */
  .lr-card__panel{position:absolute;z-index:2;left:12px;right:12px;bottom:12px;border-radius:16px;padding:14px 15px 13px;
    background:rgba(255,255,255,.7);-webkit-backdrop-filter:blur(22px) saturate(165%);backdrop-filter:blur(22px) saturate(165%);
    border:1px solid rgba(255,255,255,.78);box-shadow:inset 0 1px 0 rgba(255,255,255,.92),0 10px 26px rgba(43,90,200,.1);}
  .lr-card__name{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:17px;letter-spacing:-.4px;color:var(--sd-ink);line-height:1.1;}
  .lr-card__next{font-size:12.5px;font-weight:500;color:var(--sd-ink-sub);margin-top:5px;line-height:1.3;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lr-card__row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;}
  .lr-card__when{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
  .lr-card__when svg{opacity:.5;}
  .lr-card__go{flex:0 0 34px;width:34px;height:34px;border-radius:50%;border:0;cursor:pointer;display:grid;place-items:center;color:#fff;
    background:var(--sd-acc-deep);box-shadow:0 4px 12px rgba(43,120,255,.32),inset 0 1px 0 rgba(255,255,255,.32);transition:background .16s,transform .16s;}
  .lr-card__go:hover{background:var(--sd-acc);transform:translateX(2px);}

  /* ── Низ: расписание · задачи (две равные колонки) ──────────────────────── */
  .lr-bot{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:stretch;}
  .lr-panel{display:flex;flex-direction:column;border-radius:22px;padding:22px 22px 18px;
    background:linear-gradient(150deg,rgba(255,255,255,.72),rgba(244,247,255,.58));
    border:1px solid rgba(43,111,224,.14);-webkit-backdrop-filter:blur(20px) saturate(140%);backdrop-filter:blur(20px) saturate(140%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.92),0 12px 30px rgba(43,90,200,.05);}
  .lr-panel__h{display:flex;align-items:center;gap:10px;margin-bottom:16px;}
  .lr-panel__h h3{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:600;font-size:16.5px;letter-spacing:-.3px;color:#1A2440;margin:0;}
  .lr-count{display:inline-grid;place-items:center;min-width:21px;height:21px;padding:0 7px;border-radius:99px;font-size:11px;font-weight:700;color:#fff;
    background:var(--sd-acc-deep);box-shadow:inset 0 0 10px rgba(120,190,255,.7);font-variant-numeric:tabular-nums;}
  .lr-tabs{margin-left:auto;display:inline-flex;background:rgba(22,32,59,.05);border-radius:11px;padding:3px;}
  .lr-tab{border:0;background:0;padding:5px 13px;border-radius:8px;font-size:12.5px;font-weight:600;color:var(--sd-ink-mute);cursor:pointer;font-family:inherit;transition:color .15s,background .15s;}
  .lr-tab.is-on{background:#fff;color:var(--sd-ink);box-shadow:0 1px 3px rgba(22,32,59,.1);}
  .lr-foot{margin-top:auto;padding-top:14px;}
  .lr-foot__link{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--sd-acc-deep);background:0;border:0;cursor:pointer;font-family:inherit;transition:gap .15s;}
  .lr-foot__link:hover{gap:8px;}

  /* расписание-таймлайн */
  .lr-tl{display:flex;flex-direction:column;}
  .lr-tlrow{display:flex;gap:13px;padding-bottom:16px;}
  .lr-tlrow:last-child{padding-bottom:2px;}
  .lr-tlrail{display:flex;flex-direction:column;align-items:center;flex:0 0 11px;padding-top:5px;}
  .lr-tldot{width:11px;height:11px;border-radius:50%;flex:0 0 11px;background:rgb(var(--t));box-shadow:0 0 0 4px rgba(var(--t),.14);}
  .lr-tlline{flex:1 1 auto;width:2px;background:rgba(22,32,59,.1);margin-top:5px;border-radius:2px;}
  .lr-tlrow:last-child .lr-tlline{display:none;}
  .lr-tlb{flex:1 1 auto;min-width:0;display:flex;align-items:flex-start;gap:11px;}
  .lr-tlic{flex:0 0 32px;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:rgb(var(--t));
    background:rgba(var(--t),.1);box-shadow:inset 0 0 0 1px rgba(var(--t),.14);}
  .lr-tltx{flex:1 1 auto;min-width:0;}
  .lr-tltime{font-size:11.5px;font-weight:700;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
  .lr-tltt{font-size:13.5px;font-weight:600;color:var(--sd-ink);line-height:1.25;margin-top:1px;}
  .lr-tlss{font-size:12px;font-weight:500;color:var(--sd-ink-mute);margin-top:2px;}
  .lr-mini{flex:0 0 auto;align-self:center;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;color:rgb(var(--m));
    background:rgba(var(--m),.1);}
  .lr-mini.grey{color:var(--sd-ink-mute);background:rgba(22,32,59,.06);}

  /* задачи */
  .lr-task{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid rgba(22,32,59,.07);}
  .lr-task:first-of-type{padding-top:0;}
  .lr-task:last-of-type{border-bottom:0;}
  .lr-task__ic{flex:0 0 36px;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:rgb(var(--t));
    background:rgba(var(--t),.1);box-shadow:inset 0 0 0 1px rgba(var(--t),.14);}
  .lr-task__b{flex:1 1 auto;min-width:0;}
  .lr-task__t{font-size:13.5px;font-weight:600;color:var(--sd-ink);line-height:1.25;}
  .lr-task__s{font-size:12px;font-weight:500;color:var(--sd-ink-mute);margin-top:2px;}

  /* ── «Ваш прогресс»: КРУПНЫЕ KPI + ряд аналитики (бары · донат · топ-темы) ── */
  .lr-spark{display:block;flex:0 0 auto;}
  .lr-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
  .lr-kpic{position:relative;overflow:hidden;border-radius:20px;padding:20px 22px 18px;min-height:182px;display:flex;flex-direction:column;
    background:linear-gradient(150deg,rgba(255,255,255,.76),rgba(244,247,255,.62));
    border:1px solid rgba(43,111,224,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.92),0 12px 30px rgba(43,90,200,.06);
    transition:transform .18s cubic-bezier(.23,1,.32,1),box-shadow .18s;}
  .lr-kpic:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.92),0 20px 46px rgba(43,90,200,.12);}
  .lr-kpic__top{display:flex;align-items:center;gap:11px;}
  .lr-kpic__ic{flex:0 0 40px;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:var(--sd-acc-deep);
    background:var(--sd-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,111,224,.12);}
  .lr-kpic__lbl{font-size:13px;font-weight:600;color:var(--sd-ink-sub);line-height:1.2;}
  .lr-kpic__bot{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:12px;}
  .lr-kpic__num{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:52px;letter-spacing:-2.6px;color:var(--sd-ink);line-height:.9;font-variant-numeric:tabular-nums;}
  .lr-kpic__delta{display:inline-flex;align-items:center;gap:4px;margin-top:13px;font-size:12.5px;font-weight:600;color:#1C7E52;}
  .lr-kpic__delta.neutral{color:var(--sd-ink-mute);}
  .lr-kpic__bot .lr-spark{align-self:flex-end;margin-bottom:4px;}
  /* анкер — плоская сапфировая заливка, единственный сильный акцент в ряду */
  .lr-kpic.anchor{border-color:rgba(130,175,255,.45);background:var(--sd-acc-deep);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 0 56px rgba(150,195,255,.2),0 16px 40px rgba(31,99,200,.28);}
  .lr-kpic.anchor .lr-kpic__lbl{color:rgba(255,255,255,.9);}
  .lr-kpic.anchor .lr-kpic__num{color:#fff;}
  .lr-kpic.anchor .lr-kpic__ic{background:rgba(255,255,255,.16);color:#fff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.24);}
  .lr-kpic.anchor .lr-kpic__delta{color:rgba(255,255,255,.9);}

  /* ряд аналитики: 3 стеклянные панели */
  .lr-charts{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:18px;margin-top:18px;align-items:stretch;}
  .lr-cpnl{display:flex;flex-direction:column;border-radius:22px;padding:22px 22px 20px;
    background:linear-gradient(150deg,rgba(255,255,255,.74),rgba(244,247,255,.6));
    border:1px solid rgba(43,111,224,.14);-webkit-backdrop-filter:blur(20px) saturate(140%);backdrop-filter:blur(20px) saturate(140%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.92),0 12px 30px rgba(43,90,200,.05);}
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

  /* донат «Время по предметам» */
  .lr-donut{display:flex;flex-direction:column;align-items:center;gap:20px;margin-top:auto;}
  .lr-donut__svg{position:relative;display:grid;place-items:center;}
  .lr-donut__c{position:absolute;text-align:center;pointer-events:none;}
  .lr-donut__cn{font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:27px;letter-spacing:-1px;color:var(--sd-ink);line-height:1;font-variant-numeric:tabular-nums;}
  .lr-donut__cl{font-size:11px;font-weight:500;color:var(--sd-ink-mute);margin-top:3px;}
  .lr-leg{width:100%;display:flex;flex-direction:column;gap:12px;}
  .lr-legrow{display:flex;align-items:center;gap:10px;font-size:13px;}
  .lr-legdot{flex:0 0 9px;width:9px;height:9px;border-radius:3px;}
  .lr-legname{font-weight:600;color:var(--sd-ink-sub);}
  .lr-legval{margin-left:auto;font-weight:700;color:var(--sd-ink);font-variant-numeric:tabular-nums;}

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

  /* ── ряд 2 аналитики: тепловая карта серии + кольца прогресса по программам ── */
  .lr-charts2{display:grid;grid-template-columns:1.5fr 1fr;gap:18px;margin-top:18px;align-items:stretch;}
  .lr-hm{display:flex;gap:6px;height:156px;margin-top:auto;}
  .lr-hmcol{flex:1 1 0;display:flex;flex-direction:column;gap:6px;}
  .lr-hmc{flex:1 1 0;border-radius:4px;background:rgba(43,90,200,.07);}
  .lr-hmlegend{display:flex;align-items:center;gap:7px;margin-top:18px;font-size:11.5px;font-weight:500;color:var(--sd-ink-mute);}
  .lr-hmlegend .lr-hmc{flex:0 0 13px;width:13px;height:13px;}
  .lr-fire{display:inline-flex;align-items:center;gap:6px;margin-left:auto;font-size:12.5px;font-weight:700;color:var(--sd-acc-deep);font-variant-numeric:tabular-nums;}
  .lr-pp{display:flex;flex-direction:column;margin-top:-2px;}
  .lr-pprow{display:flex;align-items:center;gap:15px;padding:13px 0;border-bottom:1px solid rgba(22,32,59,.06);}
  .lr-pprow:first-child{padding-top:0;}
  .lr-pprow:last-child{border-bottom:0;padding-bottom:0;}
  .lr-ppring{position:relative;flex:0 0 auto;display:grid;place-items:center;}
  .lr-ppring__v{position:absolute;font-family:'Onest','Segoe UI',system-ui,sans-serif;font-weight:700;font-size:13px;letter-spacing:-.5px;color:var(--sd-ink);font-variant-numeric:tabular-nums;}
  .lr-ppb{flex:1 1 auto;min-width:0;}
  .lr-ppt{font-size:13.5px;font-weight:600;color:var(--sd-ink);line-height:1.2;}
  .lr-pps{font-size:11.5px;font-weight:500;color:var(--sd-ink-mute);margin-top:3px;}

  /* ── центральная плавающая кнопка AI (вместо FAB и баннера) ──────────────── */
  .lr-aifab{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:840;
    display:inline-flex;align-items:center;gap:12px;padding:10px 22px 10px 11px;border-radius:999px;cursor:pointer;font-family:inherit;
    background:rgba(11,18,42,.82);-webkit-backdrop-filter:blur(22px) saturate(160%);backdrop-filter:blur(22px) saturate(160%);
    border:1px solid rgba(120,160,255,.32);
    box-shadow:0 20px 48px rgba(8,16,44,.34),inset 0 1px 0 rgba(255,255,255,.14),inset 0 0 32px rgba(40,110,240,.16);
    transition:transform .2s cubic-bezier(.23,1,.32,1),box-shadow .2s;}
  .lr-aifab:hover{transform:translateX(-50%) translateY(-3px);box-shadow:0 26px 58px rgba(8,16,44,.44),inset 0 1px 0 rgba(255,255,255,.2),inset 0 0 44px rgba(40,110,240,.26);}
  .lr-aifab:active{transform:translateX(-50%) translateY(-1px) scale(.99);}
  .lr-aifab__ic{position:relative;flex:0 0 36px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:#fff;
    background:var(--sd-acc-deep);box-shadow:0 0 0 1px rgba(255,255,255,.14),0 6px 16px rgba(43,120,255,.5);}
  .lr-aifab__pulse{position:absolute;inset:0;border-radius:50%;border:2px solid rgba(43,143,255,.55);}
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
    .lr-hero__mtwrap{opacity:.5;right:-120px;}
    .lr-note{position:static;width:auto;margin-bottom:18px;}
    .lr-prog{grid-template-columns:1fr;}
    .lr-kpi{grid-template-columns:1fr 1fr;}
    .lr-charts{grid-template-columns:1fr;}
    .lr-charts2{grid-template-columns:1fr;}
    .lr-ai__chips{max-width:100%;}
    .lr-ai__bot{opacity:.45;}
  }
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
  function donut(segs) {
    const total = segs.reduce(function (a, s) { return a + s.val; }, 0) || 1;
    const sz = 132, r = 52, cx = 66, cy = 66, sw = 18, C = 2 * Math.PI * r, gap = 3;
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
    { bg: 'assets/card-blue.png',   s: T.jade,  st: 'Идем по плану', name: 'Китайский язык', active: true,
      next: 'Урок 12 · Время и распорядок дня', when: 'Завтра, 17:00' },
    { bg: 'assets/card-green.png',  s: T.gold,  st: 'Есть задача',   name: 'IELTS',
      next: 'Вебинар · Разбор эссе Task 2', when: 'Сегодня, 20:00' },
    { bg: 'assets/card-purple.png', s: T.coral, st: 'Есть дедлайн',  name: 'Поступление',
      next: 'Фото 3х4 для документов', when: 'До 18 июня' },
  ];

  const SCHEDULE = [
    { t: T.sap, ic: Ic.Book, time: '17:00', title: 'Китайский язык', sub: 'Урок 12 · Время и распорядок', m: T.sap, mt: 'Занятие' },
    { t: T.jade, ic: Ic.Monitor, time: '20:00', title: 'IELTS · Вебинар', sub: 'Разбор эссе Task 2', m: T.jade, mt: 'Вебинар' },
    { t: T.gold, ic: Ic.Edit, time: '23:59', title: 'Домашнее задание', sub: 'Аудирование · Тоны и интонации', m: T.gold, mt: 'Сдать' },
  ];

  const TASKS = [
    { t: T.coral, ic: Ic.Doc, title: 'Домашка по уроку 11', sub: 'Сдать до сегодня, 23:59', m: T.gold, mt: 'Скоро дедлайн' },
    { t: T.sap, ic: Ic.Edit, title: 'Написать эссе Task 2', sub: 'IELTS · Writing', m: T.sap, mt: 'Завтра' },
    { t: T.jade, ic: Ic.Cap, title: 'Фото 3х4 для документов', sub: 'Поступление', m: 'grey', mt: 'До 18 июня' },
  ];

  const STATS = [
    { ic: Ic.Book, num: '18', lbl: 'Уроков пройдено', delta: '+3 за неделю', up: true, anchor: true, bars: [.32, .5, .42, .64, .56, .82, 1] },
    { ic: Ic.Bolt, num: '12', lbl: 'Дней подряд', delta: 'Личный рекорд', up: true, bars: [.4, .55, .5, .68, .6, .85, 1] },
    { ic: Ic.TrendUp, num: '84', lbl: 'Средний балл', delta: '+6 за месяц', up: true, line: [.28, .42, .38, .6, .68, .64, .92] },
    { ic: Ic.Star, num: '3', lbl: 'Активные программы', delta: 'Все по плану', up: false, line: [.6, .6, .6, .6, .6, .6, .6] },
  ];

  // активность по дням недели (минуты), донат-распределение часов, сильные темы
  const ACTIVITY = [
    { d: 'Пн', v: .45, m: 42 }, { d: 'Вт', v: .7, m: 65 }, { d: 'Ср', v: .56, m: 52 },
    { d: 'Чт', v: .85, m: 78 }, { d: 'Пт', v: .6, m: 56 }, { d: 'Сб', v: 1, m: 92, today: true }, { d: 'Вс', v: .3, m: 28 },
  ];
  const SUBJECTS = [
    { name: 'Китайский', val: 8, color: 'rgb(43,143,255)' },
    { name: 'IELTS', val: 4, color: 'rgb(46,160,110)' },
    { name: 'Поступление', val: 2, color: 'rgb(201,146,62)' },
  ];
  const TOPICS = [
    { t: 'Аудирование', s: 'Тоны и интонации', score: '88', line: [.4, .5, .45, .62, .7, .66, .9] },
    { t: 'Лексика HSK', s: '600 из 1200 слов', score: '84', line: [.5, .55, .6, .58, .7, .75, .82] },
    { t: 'Грамматика', s: 'Порядок слов', score: '76', line: [.3, .42, .5, .48, .6, .64, .72] },
  ];
  // тепловая карта серии: 16 недель × 7 дней, интенсивность 0-4 (детерминированно)
  const HM_COLORS = ['rgba(43,90,200,.07)', 'rgba(43,143,255,.24)', 'rgba(43,143,255,.44)', 'rgba(43,143,255,.68)', 'rgb(43,143,255)'];
  const STREAK = (function () {
    const pat = [0, 1, 2, 1, 3, 0, 2, 4, 1, 2, 0, 3], grid = [];
    for (var wk = 0; wk < 16; wk++) {
      var col = [];
      for (var dy = 0; dy < 7; dy++) {
        var seed = wk * 7 + dy;
        col.push(wk >= 14 ? Math.min(4, 3 + (seed % 2)) : pat[seed % pat.length]);
      }
      grid.push(col);
    }
    return grid;
  })();
  const PROGPROG = [
    { name: 'Китайский язык', sub: '18 из 32 уроков', pct: 46, color: 'rgb(43,143,255)' },
    { name: 'IELTS', sub: '7 из 18 занятий', pct: 38, color: 'rgb(46,160,110)' },
    { name: 'Поступление', sub: '3 из 12 шагов', pct: 25, color: 'rgb(201,146,62)' },
  ];

  const AI_CHIPS = [
    { ic: Ic.Spark, t: 'Объяснить тему' },
    { ic: Ic.CheckCircle, t: 'Проверить работу' },
    { ic: Ic.Map, t: 'Составить план' },
    { ic: Ic.Chat, t: 'Потренировать разговор' },
    { ic: Ic.Monitor, t: 'Подготовиться к вебинару' },
  ];

  /* ── HERO ──────────────────────────────────────────────────────────────── */
  function Hero() {
    return h('section', { className: 'lr-hero' },
      h('div', { className: 'lr-hero__mtwrap', 'aria-hidden': 'true' },
        h('img', { className: 'lr-hero__mt', src: 'assets/mountain-peak.png', alt: '' })),
      h('div', { className: 'lr-note' },
        h('div', { className: 'lr-note__top' },
          h('span', { className: 'lr-note__ic' }, Ic.Check ? h(Ic.Check, { size: 15, strokeWidth: 2.6 }) : '✓'),
          h('span', { className: 'lr-note__t' }, 'Все идет по плану')),
        h('div', { className: 'lr-note__s' }, 'Вы держите темп — так и продолжайте.'),
        h('button', { type: 'button', className: 'lr-note__link', onClick: chat }, 'Посмотреть советы', arr(13))),
      h('div', { className: 'lr-hero__main' },
        h('div', { className: 'lr-hero__hi' }, 'Привет, ' + ((SH && SH.USER && SH.USER.first) || 'Дима') + '!'),
        h('h1', { className: 'lr-hero__h' }, 'Сегодня у вас', h('br'), h('span', { className: 'em' }, '2 занятия и 1 задача')),
        h('div', { className: 'lr-hero__re' }, Ic.Heart ? h(Ic.Heart, { size: 14 }) : null, 'Вы молодец, держите темп!'),
        h('div', { className: 'lr-pills' },
          PILLS.map(function (p, i) {
            return h('button', { key: i, type: 'button', className: 'lr-pill', style: { '--t': p.t }, onClick: chat },
              h('span', { className: 'lr-pill__ic' }, p.ic ? h(p.ic, { size: 18 }) : null),
              h('span', { className: 'lr-pill__b' },
                h('span', { className: 'lr-pill__time' }, p.time),
                h('span', { className: 'lr-pill__t' }, p.title),
                h('span', { className: 'lr-pill__s' }, p.sub)),
              h('span', { className: 'lr-pill__go' }, chev(16)));
          }))));
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
          return h('div', { key: i, className: 'lr-card' + (p.active ? ' is-active' : ''), style: { '--s': p.s }, onClick: chat },
            h('img', { className: 'lr-card__bg', src: p.bg, alt: '', 'aria-hidden': 'true' }),
            h('span', { className: 'lr-card__st' }, h('span', { className: 'd' }), p.st),
            h('div', { className: 'lr-card__panel' },
              h('div', { className: 'lr-card__name' }, p.name),
              h('div', { className: 'lr-card__next' }, p.next),
              h('div', { className: 'lr-card__row' },
                h('span', { className: 'lr-card__when' }, Ic.Clock ? h(Ic.Clock, { size: 13 }) : null, p.when),
                h('button', { type: 'button', className: 'lr-card__go', 'aria-label': 'Открыть', onClick: function (e) { e.stopPropagation(); chat(); } }, arr(16)))));
        })));
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
        h('div', { className: 'lr-tl' },
          SCHEDULE.map(function (s, i) {
            return h('div', { key: i, className: 'lr-tlrow', style: { '--t': s.t } },
              h('div', { className: 'lr-tlrail' }, h('span', { className: 'lr-tldot' }), h('span', { className: 'lr-tlline' })),
              h('div', { className: 'lr-tlb' },
                h('span', { className: 'lr-tlic' }, s.ic ? h(s.ic, { size: 16 }) : null),
                h('div', { className: 'lr-tltx' },
                  h('div', { className: 'lr-tltime' }, s.time),
                  h('div', { className: 'lr-tltt' }, s.title),
                  h('div', { className: 'lr-tlss' }, s.sub)),
                h('span', { className: 'lr-mini', style: { '--m': s.m } }, s.mt)));
          })),
        h('div', { className: 'lr-foot' }, h('button', { type: 'button', className: 'lr-foot__link', onClick: function () { go('Полное расписание'); } }, 'Полное расписание', arr(13)))),
      // задачи
      h('div', { className: 'lr-panel' },
        h('div', { className: 'lr-panel__h' },
          h('h3', null, 'Ближайшие задачи'),
          h('span', { className: 'lr-count', style: { marginLeft: 'auto' } }, '2')),
        TASKS.map(function (t, i) {
          return h('div', { key: i, className: 'lr-task', style: { '--t': t.t } },
            h('span', { className: 'lr-task__ic' }, t.ic ? h(t.ic, { size: 17 }) : null),
            h('div', { className: 'lr-task__b' },
              h('div', { className: 'lr-task__t' }, t.title),
              h('div', { className: 'lr-task__s' }, t.sub)),
            h('span', { className: 'lr-mini' + (t.m === 'grey' ? ' grey' : ''), style: t.m === 'grey' ? null : { '--m': t.m } }, t.mt));
        }),
        h('div', { className: 'lr-foot' }, h('button', { type: 'button', className: 'lr-foot__link', onClick: function () { go('Все задачи'); } }, 'Все задачи', arr(13)))));
  }

  /* ── Ваш прогресс: крупные KPI + ряд аналитики (бары · донат · топ-темы) ── */
  function Stats() {
    return h('section', { className: 'lr-sec' },
      h('div', { className: 'lr-sec__h' },
        h('h2', null, 'Ваш прогресс'),
        h('span', { className: 'lr-chip' }, Ic.TrendUp ? h(Ic.TrendUp, { size: 12 }) : null, 'Эта неделя'),
        h('button', { type: 'button', className: 'lr-seclink', onClick: function () { go('Статистика'); } }, 'Подробнее', arr(14))),
      // крупные KPI
      h('div', { className: 'lr-kpi' },
        STATS.map(function (s, i) {
          var color = s.anchor ? 'rgba(255,255,255,.92)' : 'rgb(43,143,255)';
          var spark = s.line ? sparkLine(s.line, color) : sparkBars(s.bars, color);
          return h('div', { key: i, className: 'lr-kpic' + (s.anchor ? ' anchor' : '') },
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
      // ряд аналитики
      h('div', { className: 'lr-charts' },
        // бар-чарт активности
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
        // донат по предметам
        h('div', { className: 'lr-cpnl' },
          h('div', { className: 'lr-cpnl__h' }, h('h3', null, 'Время по предметам')),
          h('div', { className: 'lr-donut' },
            h('div', { className: 'lr-donut__svg' },
              donut(SUBJECTS),
              h('div', { className: 'lr-donut__c' },
                h('div', { className: 'lr-donut__cn' }, '14'),
                h('div', { className: 'lr-donut__cl' }, 'часов'))),
            h('div', { className: 'lr-leg' },
              SUBJECTS.map(function (s, i) {
                return h('div', { key: i, className: 'lr-legrow' },
                  h('span', { className: 'lr-legdot', style: { background: s.color } }),
                  h('span', { className: 'lr-legname' }, s.name),
                  h('span', { className: 'lr-legval' }, s.val + ' ч'));
              })))),
        // сильные темы
        h('div', { className: 'lr-cpnl' },
          h('div', { className: 'lr-cpnl__h' }, h('h3', null, 'Сильные темы')),
          h('div', { className: 'lr-top' },
            TOPICS.map(function (t, i) {
              return h('div', { key: i, className: 'lr-toprow' },
                h('div', { className: 'lr-topb' },
                  h('div', { className: 'lr-topt' }, t.t),
                  h('div', { className: 'lr-tops' }, t.s)),
                h('div', { className: 'lr-topr' },
                  sparkLine(t.line, 'rgb(43,143,255)', 64, 26),
                  h('span', { className: 'lr-topscore' }, t.score)));
            })))));
  }

  /* ── AI-наставник: тёмная атмосферная полоса во всю ширину ─────────────── */
  function AICoach() {
    return h('section', { className: 'lr-airow' },
      h('div', { className: 'lr-ai', onClick: chat },
        h('div', { className: 'lr-ai__c' },
          h('span', { className: 'lr-ai__kick' }, 'AI-наставник'),
          h('span', { className: 'lr-ai__t' }, 'Чем я могу помочь сегодня?')),
        h('div', { className: 'lr-ai__chips' },
          AI_CHIPS.map(function (c, i) {
            return h('button', { key: i, type: 'button', className: 'lr-ai__chip', onClick: function (e) { e.stopPropagation(); chat(); } },
              c.ic ? h(c.ic, { size: 14 }) : null, c.t);
          })),
        h('img', { className: 'lr-ai__bot', src: 'assets/robot-ai.png', alt: '', 'aria-hidden': 'true' })));
  }

  function LearnHome() {
    if (!SH) return h('div', { style: { padding: 40, color: '#fff' } }, 'Скелет ученика не загружен');
    return h(SH.Shell, { active: 'learn', surface: 'light', hideTopBar: true },
      h('div', { className: 'lr-page' },
        h(Hero, null),
        h(Programs, null),
        h(Bottom, null),
        h(Stats, null),
        h(AICoach, null)));
  }

  EScreens.LearnHome = LearnHome;
})();
