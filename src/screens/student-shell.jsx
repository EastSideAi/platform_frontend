/* ============================================================================
   EastSide — ОБЩИЙ СКЕЛЕТ кабинета ученика (window.ESStudentShell)
   ----------------------------------------------------------------------------
   Сайдбар + топбар + единая dark-таблица стилей для двух экранов ученика:
   Главная (cabinet-student.jsx) и Мой план (student-plan.jsx). Чтобы обе
   страницы были одной семьей, вся раскладка/палитра живет тут.

   Язык — бренд EastSide Dark (design.md): сапфир #2B8FFF как ЕДИНЫЙ акцент
   (переменная --sd-acc — флипается в один цвет), темная база, свечение ВНУТРЬ,
   шрифты Arkhip (титулы) + Onest (все остальное), line-иконки из EIcons.
   Кинематографичный «герой» — на локальных ассетах (assets/ascent-*.png).

   Экспорт: ESStudentShell.Shell({active, surface, title, sub, children}),
            ESStudentShell.Ring({pct,size,label,sub}), ESStudentShell.NAV.
   ============================================================================ */
(function () {
  'use strict';
  const R = window.React || React;
  const { createElement: h, useState, useEffect, useRef } = R;
  const Ic = window.EIcons || {};
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};
  const toast = (window.EUI && window.EUI.toast) || null;

  /* ─────────────────────────────────────────────────────────────────────────
     СТИЛИ (инжектятся один раз). Все под префиксом .sd- — изолировано.
  ───────────────────────────────────────────────────────────────────────── */
  const CSS = `
  .sd-app{
    --sd-acc:#2B8FFF;            /* истинный сапфир (эталон anketa-dark) */
    --sd-acc-2:#5CB4FF;
    --sd-acc-deep:#2073E6;       /* фон сапфир-кнопки */
    --sd-acc-ink:#1763C8;        /* сапфир-ТЕКСТ, проходит AA на мелком */
    --sd-acc-soft:rgba(43,143,255,.10);
    --sd-acc-line:rgba(43,143,255,.42);
    --sd-base:#05091C;
    --sd-side:#070C20;
    --sd-ink:#16203B;           /* текст на светлом полотне */
    --sd-ink-sub:rgba(22,32,59,.60);
    --sd-ink-mute:rgba(22,32,59,.42);
    --sd-jade:#2EA06E;
    --sd-gold:#C9923E;
    --sd-rose:#D2604F;
    --sd-card:#FFFFFF;
    --sd-card-2:#F5F6FD;
    --sd-line:rgba(22,32,59,.09);
    font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;
    display:flex; gap:16px; padding:16px; height:100vh; width:100%; overflow:hidden;
    background:var(--sd-base); color:var(--sd-ink);
    -webkit-font-smoothing:antialiased;
  }
  /* фон базы — два тихих сапфировых перелива (design.md §2) */
  .sd-app::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
    background:
      radial-gradient(900px 520px at 86% -8%,rgba(30,114,240,.16),transparent 60%),
      radial-gradient(720px 520px at -2% 108%,rgba(22,100,230,.12),transparent 60%);}
  .sd-side,.sd-main,.sd-fab,.sd-scroll{position:relative;z-index:1;}
  /* колонка-скролл для режима с футером: белое окно + футер на тёмном холсте */
  .sd-scroll{flex:1 1 auto;min-width:0;height:100%;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;}
  .sd-main.sd-main--inflow{height:auto;min-height:calc(100vh - 32px);overflow:visible;flex:0 0 auto;}
  .sd-main--inflow .sd-wrap{padding-bottom:54px;}
  .sd-app *{box-sizing:border-box;}
  .sd-num{font-variant-numeric:tabular-nums;}
  .sd-arkhip{font-family:var(--font-arkhip);font-weight:400;}

  /* ── Сайдбар ─────────────────────────────────────────────────────────── */
  .sd-side{
    flex:0 0 252px; width:252px; height:100%; box-sizing:border-box;
    /* БЕЗ внешнего контейнера — «голый» сайдбар прямо на тёмном холсте, шире (как в анкете) */
    background:transparent; border:0; border-radius:0; box-shadow:none;
    display:flex; flex-direction:column; padding:10px 8px 14px;
  }
  .sd-brand{display:flex; align-items:center; padding:2px 8px 4px; margin-bottom:26px;}
  .sd-brand__logo{width:150px;height:auto;display:block;}

  .sd-nav{display:flex;flex-direction:column;gap:3px;flex:1 1 auto;overflow-y:auto;min-height:0;}
  /* «Создать урок» — основной CTA сайдбара (плоский сапфир, без выпуклости) */
  .sd-newlesson{display:flex;align-items:center;justify-content:center;gap:8px;margin:16px 2px 6px;padding:12px 14px;border-radius:13px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;letter-spacing:-.2px;color:#fff;
    background:#2073E6;border:1px solid rgba(120,170,255,.38);
    box-shadow:inset 0 0 18px rgba(120,190,255,.5),inset 0 1px 0 rgba(255,255,255,.22),0 8px 20px -8px rgba(20,60,160,.55);transition:background .16s,transform .16s;}
  .sd-newlesson:hover{background:#2b8fff;transform:translateY(-1px);}
  .sd-newlesson__ic{display:grid;place-items:center;}
  .sd-nav::-webkit-scrollbar{width:0;}
  .sd-nav__item{
    display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;
    padding:10.5px 12px;border-radius:12px;border:1px solid transparent;background:transparent;
    color:#9AA3C7;font-size:14.5px;font-weight:500;transition:background .15s,color .15s,border-color .15s;
  }
  .sd-nav__item:hover{color:#EAF0FF;background:rgba(255,255,255,.045);}
  .sd-nav__item.is-active{
    color:#fff;font-weight:600;
    background:linear-gradient(90deg,rgba(43,143,255,.52) 0%,rgba(43,143,255,.2) 48%,rgba(43,143,255,.05) 100%);
    border-color:var(--sd-acc-line);
    box-shadow:inset 0 0 22px rgba(43,143,255,.26),inset 0 1px 0 rgba(255,255,255,.14);
  }
  .sd-nav__ic{display:inline-flex;width:19px;height:19px;flex:0 0 19px;color:#9AA3C7;}
  .sd-nav__item:hover .sd-nav__ic{color:#CFE2FF;}
  .sd-nav__item.is-active .sd-nav__ic{color:#DCEBFF;filter:drop-shadow(0 0 8px rgba(120,185,255,.9));}
  .sd-nav__lab{flex:1 1 auto;}
  .sd-nav__badge{
    min-width:20px;height:20px;padding:0 6px;border-radius:99px;display:inline-flex;align-items:center;justify-content:center;
    font-size:11.5px;font-weight:700;color:#fff;background:linear-gradient(150deg,var(--sd-acc),var(--sd-acc-deep));
    box-shadow:0 0 10px rgba(43,143,255,.55);
  }
  .sd-nav__tick{color:var(--sd-jade);display:inline-flex;filter:drop-shadow(0 0 6px rgba(62,224,143,.6));}

  /* профиль ученика — приём anketa-dark: cutout-маскот выглядывает НАД плашкой,
     тёплое приветствие + имя. Аврора-свечение слева, тонкая сапфировая обводка. */
  .sd-prof{
    position:relative;margin-top:16px;flex:0 0 auto;overflow:visible;
    display:flex;align-items:center;min-height:100px;
    border-radius:20px;padding:16px 14px 16px 94px;
    background:linear-gradient(150deg,rgba(43,143,255,.2),rgba(43,143,255,.05) 60%),#07143A;
    border:1px solid rgba(60,150,250,.34);
  }
  .sd-prof__mascot{position:absolute;left:0;bottom:0;width:92px;height:174px;pointer-events:none;z-index:1;}
  .sd-prof__mascot img{width:100%;height:100%;object-fit:contain;object-position:bottom center;filter:drop-shadow(0 6px 14px rgba(4,6,26,.6));}
  .sd-prof__b{position:relative;z-index:2;min-width:0;}
  .sd-prof__hi{font-size:13px;line-height:1.25;color:#AFBBDD;margin-bottom:3px;}
  .sd-prof__name{font-weight:700;font-size:19px;color:#fff;letter-spacing:-.2px;text-transform:capitalize;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
  .sd-prof__role{font-size:12px;color:#9AA6CE;margin-top:3px;}
  /* профиль без маскота (родитель): инициалы-аватар в языке chip-glow (design.md §5) */
  .sd-prof--avatar{padding:14px;display:flex;align-items:center;gap:12px;min-height:0;}
  .sd-prof__ava{flex:0 0 46px;width:46px;height:46px;border-radius:13px;display:grid;place-items:center;
    font-weight:700;font-size:16px;color:#EAF2FF;
    background:rgba(43,143,255,.16);box-shadow:inset 0 0 14px rgba(43,143,255,.9),inset 0 0 3px rgba(160,205,255,.7);}
  .sd-prof--avatar .sd-prof__b{flex:1 1 auto;min-width:0;}

  .sd-help-mini{
    margin-top:10px;flex:0 0 auto;display:flex;align-items:center;gap:10px;width:100%;cursor:pointer;
    padding:10px 12px;border-radius:13px;border:1px solid rgba(140,170,255,.12);background:rgba(255,255,255,.02);
    color:#AEB7D6;font-size:12.5px;text-align:left;transition:background .15s,color .15s;
  }
  .sd-help-mini:hover{background:rgba(43,143,255,.08);color:#EAF0FF;}
  .sd-help-mini__ic{
    width:30px;height:30px;flex:0 0 30px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#EAF2FF;
    background:rgba(43,143,255,.16);box-shadow:inset 0 0 14px rgba(43,143,255,.9),inset 0 0 3px rgba(160,205,255,.7);
  }

  /* ── Главная область + топбар ───────────────────────────────────────── */
  .sd-main{flex:1 1 auto;min-width:0;height:100%;overflow-y:auto;overflow-x:hidden;border-radius:26px;
    border:1px solid rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 24px 60px rgba(3,8,28,.5);}
  .sd-main::-webkit-scrollbar{width:0;}
  .sd-main--light{
    /* чистый воздушный фон 2026: почти белый + мягкие сине-сиреневые свечения (аврора) */
    background:
      radial-gradient(680px 480px at 88% -4%, rgba(118,150,255,.18) 0%, transparent 64%),
      radial-gradient(560px 460px at 4% 6%, rgba(170,140,250,.14) 0%, transparent 62%),
      radial-gradient(720px 540px at 50% 118%, rgba(120,170,255,.10) 0%, transparent 60%),
      linear-gradient(180deg,#F7F8FE 0%,#FBFBFF 52%,#F6F7FD 100%);
    color:var(--sd-ink);
  }
  .sd-main--dark{
    background:
      radial-gradient(1000px 620px at 86% -12%,rgba(43,143,255,.18),transparent 58%),
      radial-gradient(760px 520px at 4% 110%,rgba(70,40,160,.16),transparent 60%),
      linear-gradient(180deg,#0A0F26 0%,#080C1F 100%);
    color:#EAF0FF;
  }
  .sd-wrap{max-width:1080px;margin:0 auto;padding:46px 52px 96px;}

  .sd-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:34px;}
  .sd-top__hi{font-weight:600;font-size:30px;letter-spacing:-.8px;line-height:1.05;}
  .sd-main--light .sd-top__hi{color:#1A2440;}
  .sd-main--dark .sd-top__hi{color:#fff;}
  .sd-top__sub{font-size:14px;margin-top:7px;}
  .sd-main--light .sd-top__sub{color:var(--sd-ink-sub);}
  .sd-main--dark .sd-top__sub{color:#9AA6CE;}
  .sd-top__act{display:flex;align-items:center;gap:12px;flex:0 0 auto;}
  .sd-iconbtn{
    position:relative;width:42px;height:42px;border-radius:13px;display:flex;align-items:center;justify-content:center;cursor:pointer;
    border:1.5px solid rgba(255,255,255,.9);background:rgba(255,255,255,.55);color:var(--sd-ink);transition:transform .15s,box-shadow .15s;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.7);
  }
  .sd-main--dark .sd-iconbtn{background:rgba(255,255,255,.05);border-color:rgba(140,170,255,.16);color:#EAF0FF;}
  .sd-iconbtn:hover{transform:translateY(-1px);}
  .sd-iconbtn__dot{position:absolute;top:9px;right:10px;width:8px;height:8px;border-radius:99px;background:var(--sd-rose);box-shadow:0 0 8px rgba(210,96,79,.9);border:1.5px solid var(--sd-card);}
  .sd-main--dark .sd-iconbtn__dot{border-color:#0A0F26;}
  .sd-pillbtn{
    display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 16px;border-radius:13px;cursor:pointer;
    font-size:13.5px;font-weight:600;border:1.5px solid rgba(255,255,255,.9);background:rgba(255,255,255,.55);color:var(--sd-ink);transition:transform .15s,box-shadow .15s;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.7);
  }
  .sd-main--dark .sd-pillbtn{background:rgba(255,255,255,.05);border-color:rgba(140,170,255,.16);color:#EAF0FF;}
  .sd-pillbtn:hover{transform:translateY(-1px);}
  .sd-pillbtn svg{color:var(--sd-acc);}

  /* ── Кнопки ─────────────────────────────────────────────────────────── */
  .sd-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;border:0;
    font-size:14px;font-weight:600;padding:13px 22px;border-radius:13px;transition:transform .14s,background .12s,box-shadow .12s;white-space:nowrap;}
  .sd-btn svg{transition:transform .15s;}
  .sd-btn--primary svg{transform:rotate(-45deg);}
  .sd-btn--primary{background:var(--sd-acc-deep);color:#fff;
    box-shadow:inset 0 0 24px rgba(175,215,255,.95),inset 0 0 8px rgba(255,255,255,.5),inset 0 1px 0 rgba(255,255,255,.5);}
  .sd-btn--primary:hover{background:#3A85F0;transform:translateY(-1px);}
  .sd-btn--primary:active{transform:translateY(1px);}
  .sd-btn--soft{background:var(--sd-acc-soft);color:var(--sd-acc-deep);}
  .sd-btn--soft:hover{background:rgba(43,143,255,.2);transform:translateY(-1px);}
  .sd-btn--ghost{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.2);}
  .sd-btn--ghost:hover{background:rgba(255,255,255,.16);transform:translateY(-1px);}
  .sd-btn--block{width:100%;}
  /* фирменная стрелка под −45° (design.md §7.2) */
  .sd-arr{transform:rotate(-45deg);transition:transform .15s;}
  .sd-btn:hover .sd-arr{transform:rotate(-45deg) translateX(2px);}
  .sd-sec__link:hover .sd-arr{transform:rotate(-45deg) translateX(2px);}

  /* ── Секции ─────────────────────────────────────────────────────────── */
  .sd-sec{margin-top:48px;position:relative;z-index:1;}
  .sd-sec__head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
  .sd-sec__title{font-weight:400;font-size:22px;letter-spacing:-.6px;}
  .sd-main--light .sd-sec__title{color:#1A2440;}
  .sd-main--dark .sd-sec__title{color:#fff;}
  .sd-sec__link{display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--sd-acc);cursor:pointer;background:0;border:0;}
  .sd-sec__link:hover{gap:7px;}

  /* материал светлой карточки — ВУАЛЬ по design.md §6: матовое стекло + белая
     полупрозрачная обводка + блик-хайлайт сверху. Свечение только ВНУТРЬ. */
  .sd-card{
    background:rgba(255,255,255,.58);
    border:1.5px solid rgba(255,255,255,.92);
    border-radius:22px;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.85), inset 0 0 40px rgba(255,255,255,.28);
  }
  .sd-grid2{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
  .sd-botrow{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.42fr);gap:18px;align-items:stretch;}
  .sd-cardh{font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:700;font-size:17px;color:#1A2440;letter-spacing:-.2px;}

  /* ── HERO (Главная) ─────────────────────────────────────────────────── */
  .sd-hero{position:relative;border-radius:24px;overflow:hidden;min-height:236px;padding:32px 36px;
    display:flex;align-items:center;justify-content:space-between;gap:26px;color:#fff;}
  .sd-hero__bg{position:absolute;inset:0;background-size:cover;background-position:78% 30%;z-index:0;transform:scale(1.02);}
  .sd-hero__shade{position:absolute;inset:0;z-index:1;
    background:linear-gradient(100deg,rgba(5,8,22,.96) 0%,rgba(6,10,30,.9) 42%,rgba(12,16,44,.6) 70%,rgba(22,20,56,.26) 100%);}
  .sd-hero__main{position:relative;z-index:2;max-width:60%;}
  .sd-hero__r{position:relative;z-index:2;flex:0 0 auto;}
  .sd-pill{display:inline-flex;align-items:center;gap:7px;padding:6px 13px;border-radius:99px;font-size:12px;font-weight:600;letter-spacing:.02em;
    background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);color:#EAF2FF;backdrop-filter:blur(6px);}
  .sd-pill__dot{width:6px;height:6px;border-radius:99px;background:var(--sd-acc-2);box-shadow:0 0 8px rgba(92,180,255,1);}
  .sd-hero__title{font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:800;font-size:38px;letter-spacing:-1.4px;margin:14px 0 10px;line-height:1.0;text-shadow:0 2px 20px rgba(4,8,24,.75);}
  .sd-hero__line{font-size:14.5px;color:rgba(234,240,255,.9);max-width:440px;line-height:1.5;text-shadow:0 1px 12px rgba(4,8,24,.6);}
  .sd-hero__chips{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;}
  .sd-hchip{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:13px;background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.16);}
  .sd-hchip__ic{color:var(--sd-acc-2);display:inline-flex;}
  .sd-hchip__k{font-size:11px;color:rgba(220,228,255,.66);}
  .sd-hchip__v{font-size:14px;font-weight:700;color:#fff;}
  .sd-hero__cta{margin-top:20px;}

  /* кольцо прогресса */
  .sd-ring{position:relative;display:flex;align-items:center;justify-content:center;}
  .sd-ring svg{transform:rotate(-90deg);display:block;}
  .sd-ring__track{stroke:rgba(255,255,255,.16);}
  .sd-ring__fill{stroke:url(#sdRingGrad);stroke-linecap:round;filter:drop-shadow(0 0 6px rgba(43,143,255,.8));
    transition:stroke-dashoffset 1.1s cubic-bezier(.22,.61,.36,1);}
  .sd-ring__cap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
  .sd-ring__pct{font-size:34px;font-weight:800;letter-spacing:-1px;color:#fff;line-height:1;}
  .sd-ring__lab{font-size:11px;color:rgba(220,228,255,.7);margin-top:3px;}
  .sd-ring--onlight .sd-ring__track{stroke:rgba(20,32,60,.1);}
  .sd-ring--onlight .sd-ring__pct{color:#13203D;}
  .sd-ring--onlight .sd-ring__lab{color:rgba(22,32,59,.55);}

  /* ── Светлый информативный герой (Главная) ──────────────────────────────── */
  .sd-lhero{position:relative;overflow:hidden;border-radius:24px;min-height:236px;padding:30px 36px;
    display:flex;align-items:center;justify-content:space-between;gap:28px;background:#E7EDF8;
    border:1.5px solid rgba(255,255,255,.9);box-shadow:inset 0 1px 0 rgba(255,255,255,.9);}
  .sd-lhero__bg{position:absolute;inset:0;background-size:cover;background-position:center 26%;z-index:0;}
  .sd-lhero__veil{position:absolute;inset:0;z-index:1;
    background:linear-gradient(96deg,rgba(240,244,252,.95) 0%,rgba(240,244,252,.78) 40%,rgba(240,244,252,.28) 66%,rgba(240,244,252,0) 100%);}
  .sd-lhero__main{position:relative;z-index:2;max-width:60%;}
  .sd-lhero__r{position:relative;z-index:2;flex:0 0 auto;}
  .sd-lhero__kick{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--sd-acc-deep);}
  .sd-lhero__title{font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:800;font-size:37px;letter-spacing:-1.3px;color:#12203D;margin:9px 0 11px;line-height:1.0;}
  .sd-lhero__say{font-size:14.5px;color:rgba(22,32,59,.72);line-height:1.5;max-width:440px;}
  .sd-lhero__stats{display:flex;align-items:stretch;margin-top:22px;}
  .sd-lstat{padding-right:24px;margin-right:24px;border-right:1px solid rgba(22,32,59,.12);}
  .sd-lstat:last-child{padding-right:0;margin-right:0;border-right:0;}
  .sd-lstat__v{font-size:22px;font-weight:800;color:#12203D;letter-spacing:-.6px;line-height:1;}
  .sd-lstat__v--warn{color:#B97A1E;}
  .sd-lstat__k{font-size:11.5px;color:rgba(22,32,59,.55);margin-top:6px;line-height:1.25;}
  /* ── Статус-баннер: СПЛОШНОЙ насыщенный цвет по статусу, правая часть пустая ─ */
  .sd-shero{position:relative;overflow:hidden;border-radius:26px;min-height:228px;padding:36px 42px;color:#fff;
    display:flex;flex-direction:column;justify-content:center;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.24),inset 0 0 80px rgba(255,255,255,.05);}
  .sd-shero::before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
    background:radial-gradient(620px 380px at 86% 48%,rgba(255,255,255,.16),transparent 70%),
               radial-gradient(440px 320px at 4% -14%,rgba(255,255,255,.18),transparent 64%);}
  .sd-shero.ok{background:linear-gradient(118deg,#15623F 0%,#1E885A 50%,#28A56F 100%);}
  .sd-shero.warn{background:linear-gradient(118deg,#9A5410 0%,#C57F1B 50%,#E3A52C 100%);}
  .sd-shero.late{background:linear-gradient(118deg,#891F13 0%,#BC3725 50%,#DC4F38 100%);}
  .sd-shero__main{position:relative;z-index:1;max-width:60%;}
  .sd-shero__status{display:inline-flex;align-items:center;gap:12px;}
  .sd-shero__sic{width:36px;height:36px;flex:0 0 36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;
    background:rgba(255,255,255,.2);box-shadow:inset 0 0 16px rgba(255,255,255,.5),inset 0 0 4px rgba(255,255,255,.85);}
  .sd-shero__sw{font-size:15.5px;font-weight:800;letter-spacing:.01em;color:#fff;}
  .sd-shero__title{font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:800;font-size:39px;letter-spacing:-1.5px;line-height:1.0;margin:14px 0 11px;
    text-shadow:0 2px 20px rgba(0,0,0,.18);}
  .sd-shero__say{font-size:14.5px;color:rgba(255,255,255,.92);line-height:1.5;max-width:430px;}
  .sd-shero__meta{display:flex;gap:30px;margin-top:22px;}
  .sd-shero__mk{font-size:11.5px;color:rgba(255,255,255,.74);letter-spacing:.02em;}
  .sd-shero__mv{font-size:18px;font-weight:800;color:#fff;letter-spacing:-.3px;margin-top:4px;}
  .sd-shero__cta{margin-top:25px;}
  .sd-btn--white{background:#fff;color:#15203B;box-shadow:0 6px 18px rgba(0,0,0,.16);}
  .sd-btn--white:hover{background:#fff;transform:translateY(-1px);box-shadow:0 10px 26px rgba(0,0,0,.22);}
  .sd-btn--white svg{color:inherit;}

  /* ── Баннер: настроение цветом-свечением, чисто и премиально, без дублей ── */
  .sd-chero{position:relative;overflow:hidden;border-radius:32px;min-height:320px;padding:54px 56px;display:flex;align-items:center;justify-content:space-between;gap:48px;
    border:1px solid rgba(255,255,255,.7);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 30px 78px rgba(80,100,200,.15);}
  .sd-chero__sky{position:absolute;inset:0;z-index:0;pointer-events:none;
    background:
      radial-gradient(640px 540px at 6% 2%, rgba(150,170,255,.28), transparent 56%),
      linear-gradient(135deg,#F1F4FE 0%,#F8F9FF 56%,#FEFEFF 100%);}
  .sd-chero__glow{position:absolute;inset:0;z-index:0;pointer-events:none;transition:background .4s;}
  .sd-chero.ok   .sd-chero__glow{background:radial-gradient(560px 480px at 80% 32%, rgba(46,198,130,.20), transparent 58%);}
  .sd-chero.warn .sd-chero__glow{background:radial-gradient(560px 480px at 80% 32%, rgba(246,188,72,.22), transparent 58%);}
  .sd-chero.late .sd-chero__glow{background:radial-gradient(560px 480px at 80% 32%, rgba(237,100,80,.20), transparent 58%);}
  .sd-chero__clouds{position:absolute;inset:0;z-index:0;pointer-events:none;filter:blur(4px);
    background:
      radial-gradient(190px 100px at 28% 98%, rgba(255,255,255,.9), transparent 72%),
      radial-gradient(230px 120px at 58% 110%, rgba(255,255,255,.76), transparent 74%),
      radial-gradient(160px 92px at 88% 94%, rgba(255,255,255,.8), transparent 74%);}
  .sd-chero__main{position:relative;z-index:2;flex:1 1 auto;max-width:52%;}
  .sd-chero__status{display:inline-flex;align-items:center;gap:10px;font-size:13.5px;font-weight:600;letter-spacing:.01em;}
  .sd-chero__dot{width:9px;height:9px;border-radius:50%;}
  .sd-chero.ok   .sd-chero__status{color:#1C8A5A;} .sd-chero.ok   .sd-chero__dot{background:#2EC07E;box-shadow:0 0 12px rgba(46,192,126,.85);}
  .sd-chero.warn .sd-chero__status{color:#B07514;} .sd-chero.warn .sd-chero__dot{background:#E3A52C;box-shadow:0 0 12px rgba(227,165,44,.85);}
  .sd-chero.late .sd-chero__status{color:#C0392B;} .sd-chero.late .sd-chero__dot{background:#E2503B;box-shadow:0 0 12px rgba(226,80,59,.85);}
  .sd-chero__title{font-weight:500;font-size:48px;letter-spacing:-2px;line-height:1.02;color:#161B2B;margin:17px 0 14px;}
  .sd-chero__say{font-size:16px;font-weight:400;color:#586079;line-height:1.56;max-width:430px;}
  .sd-chero__cta{margin-top:28px;}
  /* правая стеклянная панель-сводка: отвечает на этап / чего ждем / срок */
  .sd-chero__panel{position:relative;z-index:2;flex:0 0 320px;width:320px;border-radius:22px;padding:24px 26px;
    background:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.7);
    -webkit-backdrop-filter:blur(20px) saturate(135%);backdrop-filter:blur(20px) saturate(135%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 16px 40px rgba(80,100,200,.16);}
  .sd-chero__plab{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#8E96B2;}
  .sd-chero__row{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin-top:14px;}
  .sd-chero__rk{font-size:13px;font-weight:500;color:#8089A0;flex:0 0 auto;}
  .sd-chero__rv{font-size:13.5px;font-weight:600;color:#222A40;text-align:right;line-height:1.35;}
  .sd-chero__rv--late{color:#C0392B;} .sd-chero__rv--warn{color:#B07514;} .sd-chero__rv--ok{color:#1C8A5A;}
  .sd-chero__bar{height:7px;border-radius:99px;background:rgba(120,140,210,.16);overflow:hidden;margin-top:12px;}
  .sd-chero__barf{display:block;height:100%;border-radius:99px;}
  .sd-chero.ok   .sd-chero__barf{background:linear-gradient(90deg,#3CD08C,#1FB874);box-shadow:0 0 12px rgba(46,196,128,.7);}
  .sd-chero.warn .sd-chero__barf{background:linear-gradient(90deg,#F4C24E,#E6A526);box-shadow:0 0 12px rgba(231,170,52,.7);}
  .sd-chero.late .sd-chero__barf{background:linear-gradient(90deg,#F0735C,#DF4A36);box-shadow:0 0 12px rgba(228,84,64,.7);}
  .sd-chero__pdiv{height:1px;background:rgba(120,135,190,.16);margin:16px 0;}

  /* ── Карточки: картинка-фон + четкая стеклянная плашка под текст справа ── */
  .sd-duo{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
  .sd-bigcard{position:relative;overflow:hidden;border-radius:26px;min-height:250px;cursor:pointer;display:block;text-align:left;
    border:1px solid rgba(255,255,255,.7);background-size:cover;background-position:left center;background-repeat:no-repeat;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 16px 46px rgba(80,100,200,.14);transition:transform .2s,box-shadow .2s;}
  .sd-bigcard:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 28px 64px rgba(80,100,200,.24);}
  .sd-bigcard__c{position:absolute;top:16px;right:16px;bottom:16px;width:47%;z-index:1;
    display:flex;flex-direction:column;justify-content:center;padding:26px 28px;border-radius:18px;
    background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.55);
    -webkit-backdrop-filter:blur(18px) saturate(135%);backdrop-filter:blur(18px) saturate(135%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.75),0 10px 26px rgba(70,90,190,.12);}
  .sd-bigcard__t{font-size:20px;font-weight:600;color:#1A1F2E;line-height:1.2;letter-spacing:-.5px;}
  .sd-bigcard__d{font-size:13px;font-weight:400;color:#515A75;line-height:1.5;margin-top:9px;}
  .sd-bigcard__cta{margin-top:18px;display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:var(--sd-acc-deep);}
  .sd-bigcard:hover .sd-bigcard__cta .sd-arr{transform:rotate(-45deg) translateX(2px);}

  /* список ближайших шагов — текущий выделен */
  .sd-nextc.is-current{background:rgba(255,255,255,.74);border-color:rgba(43,143,255,.4);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 26px rgba(43,143,255,.09);}

  /* ── Роадмап «Твой путь»: вертикальный степпер карточек (эталон file_151) ─ */
  .sd-rm{display:flex;flex-direction:column;}
  .sd-rmrow{display:flex;gap:20px;align-items:stretch;cursor:pointer;}
  .sd-rmrow.locked{cursor:default;}
  /* рельса с номерным узлом */
  .sd-rmrail{display:flex;flex-direction:column;align-items:center;width:38px;flex:0 0 38px;}
  .sd-rmnode{width:38px;height:38px;flex:0 0 38px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;background:#fff;color:var(--sd-ink-mute);
    border:1.5px solid rgba(22,32,59,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.9);}
  .sd-rmrow.done .sd-rmnode{color:var(--sd-acc-deep);border-color:var(--sd-acc-line);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 0 0 4px rgba(43,143,255,.06);}
  .sd-rmrow.active .sd-rmnode{color:#fff;border:0;background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));
    box-shadow:0 0 0 5px rgba(43,143,255,.13),0 8px 22px rgba(43,143,255,.42),inset 0 0 10px rgba(175,215,255,.7),inset 0 1px 0 rgba(255,255,255,.5);}
  .sd-rmrow.goal .sd-rmnode{color:#fff;border:0;background:linear-gradient(150deg,#FBD786,#E29A33);
    box-shadow:0 0 0 5px rgba(245,196,90,.16),0 8px 22px rgba(214,150,40,.42),inset 0 1px 0 rgba(255,255,255,.5);}
  .sd-rmline{flex:1 1 auto;width:2.5px;background:rgba(22,32,59,.1);margin:6px 0;border-radius:2px;}
  .sd-rmrow.done .sd-rmline{background:linear-gradient(180deg,var(--sd-acc),rgba(43,143,255,.3));}
  .sd-rmrow.active .sd-rmline{background:linear-gradient(180deg,var(--sd-acc),rgba(22,32,59,.08));}
  /* карточка строки */
  .sd-rmbody{flex:1 1 auto;min-width:0;margin-bottom:14px;padding:17px 20px;border-radius:16px;
    background:rgba(255,255,255,.72);border:1px solid rgba(22,32,59,.1);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:transform .15s,border-color .15s;}
  .sd-rmrow:last-child .sd-rmbody{margin-bottom:0;}
  .sd-rmrow.done:hover .sd-rmbody{border-color:rgba(43,143,255,.3);transform:translateX(2px);}
  .sd-rmrow.locked .sd-rmbody{background:rgba(255,255,255,.42);border-color:rgba(22,32,59,.07);box-shadow:none;}
  .sd-rmrow.active .sd-rmbody{margin-bottom:18px;padding:24px 26px;cursor:default;
    background:linear-gradient(150deg,rgba(255,255,255,.86),rgba(244,247,255,.72));border:1.5px solid rgba(43,143,255,.42);
    -webkit-backdrop-filter:blur(20px) saturate(140%);backdrop-filter:blur(20px) saturate(140%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 40px rgba(43,143,255,.08),0 18px 44px rgba(43,111,224,.14);}
  .sd-rmhead{display:flex;align-items:flex-start;gap:14px;}
  .sd-rmhc{flex:1 1 auto;min-width:0;}
  .sd-rmeyebrow{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--sd-acc-deep);margin-bottom:6px;}
  .sd-rmt{font-size:16px;font-weight:600;color:var(--sd-ink);letter-spacing:-.3px;line-height:1.25;}
  .sd-rmrow.locked .sd-rmt{color:#8990A6;font-weight:500;}
  .sd-rmrow.active .sd-rmt{font-size:19px;letter-spacing:-.5px;}
  .sd-rmd{font-size:13px;font-weight:400;color:var(--sd-ink-sub);line-height:1.5;margin-top:5px;max-width:560px;}
  .sd-rmrow.locked .sd-rmd{color:var(--sd-ink-mute);}
  /* статус-чип */
  .sd-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:9px;font-size:12px;font-weight:600;letter-spacing:-.1px;flex:0 0 auto;white-space:nowrap;}
  .sd-chip--done{background:#E2F4EA;color:#1C7E52;}
  .sd-chip--wait{background:rgba(22,32,59,.05);color:var(--sd-ink-mute);}
  .sd-chip--goal{background:rgba(255,255,255,.18);color:#FCD98A;border:1px solid rgba(255,255,255,.28);}
  /* блок прогресса в активном этапе */
  .sd-rmprog{margin-top:18px;padding:15px 18px;border-radius:14px;background:rgba(43,143,255,.06);border:1px solid rgba(43,143,255,.16);}
  .sd-rmprog__top{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;}
  .sd-rmprog__l{display:flex;flex-direction:column;gap:4px;}
  .sd-rmprog__lab{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--sd-ink-mute);}
  .sd-rmprog__pct{font-size:27px;font-weight:700;line-height:1;color:var(--sd-acc-deep);letter-spacing:-1.2px;font-variant-numeric:tabular-nums;}
  .sd-rmprog__r{font-size:12.5px;font-weight:600;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
  .sd-rmprog__bar{height:7px;border-radius:99px;background:rgba(43,143,255,.16);margin-top:13px;overflow:hidden;}
  .sd-rmprog__bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--sd-acc-2),var(--sd-acc-deep));box-shadow:inset 0 0 8px rgba(255,255,255,.5);}
  /* подшаги активного этапа */
  .sd-rmsteps{margin-top:14px;display:flex;flex-direction:column;gap:7px;}
  .sd-rmstep{display:flex;gap:13px;align-items:center;padding:12px 14px;border-radius:13px;border:1px solid transparent;}
  .sd-rmstep.current{background:rgba(255,255,255,.92);border-color:rgba(43,143,255,.4);box-shadow:inset 0 0 24px rgba(43,143,255,.12);}
  .sd-rmstep.current.late{border-color:rgba(210,96,79,.42);box-shadow:inset 0 0 24px rgba(210,96,79,.14);}
  .sd-rmstep__dot{width:22px;height:22px;flex:0 0 22px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;}
  .sd-rmstep.done .sd-rmstep__dot{background:linear-gradient(140deg,#5CB4FF,#1666E0);box-shadow:inset 0 1px 3px rgba(255,255,255,.45);}
  .sd-rmstep.current .sd-rmstep__dot{background:transparent;border:2px solid var(--sd-acc-line);}
  .sd-rmstep.current.late .sd-rmstep__dot{border-color:rgba(210,96,79,.5);}
  .sd-rmstep.upcoming .sd-rmstep__dot{background:transparent;border:2px solid rgba(74,98,150,.28);}
  .sd-rmstep__b{flex:1 1 auto;min-width:0;}
  .sd-rmstep__t{font-size:13.5px;font-weight:500;color:var(--sd-ink);line-height:1.3;}
  .sd-rmstep__no{color:var(--sd-ink-mute);font-weight:600;margin-right:6px;font-variant-numeric:tabular-nums;}
  .sd-rmstep.current .sd-rmstep__t{color:var(--sd-acc-deep);font-weight:600;}
  .sd-rmstep.current.late .sd-rmstep__t{color:var(--sd-rose);}
  .sd-rmstep.upcoming .sd-rmstep__t{color:var(--sd-ink-mute);font-weight:400;}
  .sd-rmstep.upcoming .sd-rmstep__no{color:var(--sd-ink-faint,rgba(22,32,59,.3));}
  .sd-rmstep__meta{font-size:12px;font-weight:500;color:var(--sd-ink-mute);margin-top:3px;}
  .sd-rmstep__meta.late{color:var(--sd-rose);}
  .sd-rmstep__lock{flex:0 0 auto;color:var(--sd-ink-faint,rgba(22,32,59,.28));display:inline-flex;}
  .sd-btn--sm{padding:9px 16px;font-size:13px;border-radius:11px;gap:7px;flex:0 0 auto;}

  /* ── Дрим-герой роадмапа + цель-вершина с картинкой ────────────────────── */
  .sd-rmhero{position:relative;overflow:hidden;border-radius:24px;min-height:148px;margin-bottom:26px;padding:30px 36px;display:flex;flex-direction:column;justify-content:center;
    background-size:cover;background-position:center 36%;border:1px solid rgba(255,255,255,.7);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
  .sd-rmhero__scrim{position:absolute;inset:0;background:linear-gradient(100deg, rgba(246,247,255,.92) 0%, rgba(246,247,255,.6) 52%, rgba(246,247,255,.18) 100%);}
  .sd-rmhero__c{position:relative;z-index:1;}
  .sd-rmhero__t{font-weight:400;font-size:28px;letter-spacing:-1px;color:#161B2B;line-height:1.1;}
  .sd-rmhero__s{font-size:14px;font-weight:300;color:#5A627A;margin-top:8px;}
  .sd-rmrow.goal .sd-rmbody{position:relative;overflow:hidden;margin-bottom:0;padding:24px 26px;border-radius:18px;cursor:pointer;
    background-size:cover;background-position:center 30%;border:1px solid rgba(120,150,255,.42);box-shadow:0 18px 44px rgba(20,30,80,.22);}
  .sd-rmrow.goal .sd-rmbody::before{content:'';position:absolute;inset:0;z-index:0;background:linear-gradient(115deg, rgba(8,14,44,.74) 0%, rgba(18,28,68,.42) 66%, rgba(30,40,90,.24) 100%);}
  .sd-rmrow.goal .sd-rmhead{position:relative;z-index:1;}
  .sd-rmrow.goal .sd-rmt{color:#fff;}
  .sd-rmrow.goal .sd-rmd{color:rgba(255,255,255,.88);max-width:520px;}

  /* ── Герой: заголовок · мини-метрики · огромная гора (за сеткой, под карточками) ── */
  .sd-hero2{position:relative;min-height:470px;margin:8px 0 24px;z-index:1;}
  .sd-hero2__main{position:relative;z-index:2;max-width:600px;margin-top:30px;}
  .sd-hero2__hi{font-weight:600;font-size:15px;letter-spacing:-.2px;color:var(--sd-acc-deep);}
  .sd-hero2__h{font-weight:700;font-size:39px;line-height:1.1;letter-spacing:-1.6px;color:var(--sd-ink);margin-top:11px;max-width:580px;}
  .sd-hero2__em{color:var(--sd-acc-deep);}
  .sd-hero2.late .sd-hero2__em{color:var(--sd-rose);}
  .sd-hero2__re{display:inline-flex;align-items:center;gap:8px;margin-top:16px;font-size:13px;font-weight:500;color:var(--sd-ink-sub);}
  .sd-hero2__re svg{color:var(--sd-acc);}
  /* мини-метрики под заголовком */
  .sd-hero2__stats{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:26px;max-width:540px;}
  .sd-stat{display:flex;gap:13px;align-items:center;padding:15px 17px;border-radius:16px;
    background:linear-gradient(150deg,rgba(255,255,255,.8),rgba(243,246,255,.62));
    border:1px solid rgba(43,111,224,.2);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 22px rgba(43,143,255,.07);}
  .sd-stat__ic{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:var(--sd-acc-deep);
    background:rgba(43,143,255,.1);box-shadow:inset 0 0 0 1px rgba(43,143,255,.16);}
  .sd-stat__b{flex:1 1 auto;min-width:0;}
  .sd-stat__lab{font-size:11px;font-weight:600;color:var(--sd-ink-mute);letter-spacing:.01em;}
  .sd-stat__val{font-size:18px;font-weight:700;color:var(--sd-ink);letter-spacing:-.5px;margin-top:2px;font-variant-numeric:tabular-nums;}
  .sd-stat__sub{font-size:11.5px;font-weight:500;color:var(--sd-ink-mute);margin-top:3px;}
  .sd-stat__bar{height:5px;border-radius:99px;background:rgba(43,143,255,.16);margin-top:9px;overflow:hidden;}
  .sd-stat__bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--sd-acc-2),var(--sd-acc-deep));}
  /* гора-восхождение (наша, с флагом): крупная, прижата к правому краю и бьет за него, пик у верха, низ облаками тает к карточкам — как влитая */
  .sd-hero2__mtwrap{position:absolute;z-index:0;top:-18px;right:-88px;width:690px;max-width:62%;pointer-events:none;}
  .sd-hero2__mt{display:block;width:100%;height:auto;-webkit-mask-image:radial-gradient(125% 120% at 70% 30%,#000 60%,transparent 100%);mask-image:radial-gradient(125% 120% at 70% 30%,#000 60%,transparent 100%);}

  /* ── Верхний ряд: карточка этапа (слева) + задачи (справа), оба на стекле ── */
  /* баннеры сильно наезжают на гору — она глубоко уходит под них и стыкуется с карточками */
  .sd-toprow-sec{margin-top:-156px;position:relative;z-index:3;}
  .sd-toprow{display:grid;grid-template-columns:1.12fr 1fr;gap:20px;align-items:stretch;}
  .sd-glass{position:relative;overflow:hidden;border-radius:24px;
    background:linear-gradient(150deg, rgba(255,255,255,.74) 0%, rgba(243,246,255,.6) 100%);
    border:1px solid rgba(43,111,224,.2);
    -webkit-backdrop-filter:blur(26px) saturate(150%);backdrop-filter:blur(26px) saturate(150%);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 30px rgba(43,143,255,.08),0 10px 30px rgba(43,90,200,.06);}
  /* карточка текущего этапа: круглый стеклянный медальон с папкой слева + текст */
  .sd-stagecard{position:relative;display:flex;flex-direction:column;padding:24px 28px 26px;min-height:312px;}
  .sd-stagecard__head{display:flex;align-items:center;gap:11px;}
  .sd-stagecard__kick{font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--sd-acc-deep);}
  .sd-stagecard__chip{display:inline-flex;align-items:center;padding:4px 10px;border-radius:8px;font-size:11.5px;font-weight:700;color:var(--sd-acc-ink);background:var(--sd-acc-soft);font-variant-numeric:tabular-nums;}
  .sd-stagecard__body{display:flex;gap:24px;align-items:center;flex:1 1 auto;}
  .sd-stagecard__orb{flex:0 0 134px;width:134px;height:134px;border-radius:50%;position:relative;display:grid;place-items:center;
    background:radial-gradient(62% 62% at 50% 40%, rgba(255,255,255,.92), rgba(236,242,255,.5));
    border:1px solid rgba(43,111,224,.2);
    box-shadow:inset 0 1px 0 rgba(255,255,255,1),inset 0 0 28px rgba(43,143,255,.14),0 10px 26px rgba(43,90,200,.1);}
  .sd-stagecard__orb img{width:94px;height:auto;filter:drop-shadow(0 8px 16px rgba(70,80,200,.22));}
  .sd-stagecard__txt{flex:1 1 auto;min-width:0;}
  .sd-stagecard__t{font-weight:700;font-size:23px;letter-spacing:-.7px;line-height:1.1;color:var(--sd-ink);}
  .sd-stagecard__d{font-size:13.5px;font-weight:400;color:var(--sd-ink-sub);line-height:1.55;margin:9px 0 18px;}
  .sd-stagecard__cta{align-self:flex-start;}

  /* ── Баннер AI — темная атмосфера на всю ширину, маскот-робот справа ────── */
  .sd-aibn{position:relative;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;justify-content:center;
    border-radius:24px;padding:44px 48px;min-height:276px;transition:transform .18s,box-shadow .18s;
    background:
      radial-gradient(680px 440px at 86% 16%, rgba(43,120,255,.42), transparent 62%),
      radial-gradient(520px 380px at 10% 116%, rgba(28,86,210,.34), transparent 60%),
      linear-gradient(150deg, #0A1126 0%, #0B1430 58%, #0C1A3C 100%);
    border:1px solid rgba(120,160,255,.24);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.1),inset 0 0 70px rgba(40,110,240,.12),0 22px 52px rgba(8,16,44,.32);}
  .sd-aibn:hover{transform:translateY(-2px);box-shadow:inset 0 1px 0 rgba(255,255,255,.13),inset 0 0 84px rgba(40,110,240,.2),0 28px 64px rgba(8,16,44,.42);}
  .sd-aibn__c{position:relative;z-index:1;max-width:60%;}
  .sd-aibn__kick{font-size:11.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--sd-acc-2);margin-bottom:13px;}
  .sd-aibn__t{font-weight:700;font-size:27px;letter-spacing:-.8px;color:#fff;line-height:1.12;}
  .sd-aibn__d{font-size:14.5px;font-weight:400;color:#C5CBE3;line-height:1.6;margin:13px 0 26px;max-width:46ch;}
  .sd-aibn__img{position:absolute;z-index:0;right:40px;bottom:0;width:256px;max-width:34%;height:auto;pointer-events:none;
    filter:drop-shadow(0 20px 40px rgba(0,8,36,.55));}
  .sd-tasks{padding:24px 22px;display:flex;flex-direction:column;min-height:312px;}
  .sd-tasks__h{display:flex;align-items:center;justify-content:space-between;font-size:11.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--sd-ink-mute);padding:0 12px;margin-bottom:12px;}
  .sd-tasks__count{display:inline-flex;align-items:center;justify-content:center;min-width:21px;height:21px;padding:0 7px;border-radius:99px;background:var(--sd-acc-deep);color:#fff;font-size:11px;font-weight:700;letter-spacing:0;box-shadow:inset 0 0 10px rgba(120,190,255,.7);}
  .sd-tasks__list{display:flex;flex-direction:column;gap:9px;flex:1 1 auto;justify-content:center;}
  .sd-tk{position:relative;display:flex;gap:14px;align-items:center;padding:16px 15px;border-radius:14px;cursor:pointer;border:1.5px solid transparent;transition:background .15s,border-color .15s;}
  .sd-tk:hover{background:rgba(43,143,255,.05);}
  .sd-tk.current{background:rgba(255,255,255,.92);border-color:rgba(43,143,255,.4);
    box-shadow:inset 0 0 26px rgba(43,143,255,.2),inset 0 0 6px rgba(43,143,255,.12);}
  .sd-tk.current:hover{background:rgba(255,255,255,.96);}
  /* просроченная активная задача — то же свечение, но в нашем розовом, без смешения цветов */
  .sd-tk.current.late{border-color:rgba(210,96,79,.42);
    box-shadow:inset 0 0 26px rgba(210,96,79,.18),inset 0 0 6px rgba(210,96,79,.12);}
  .sd-tk.current.late .sd-tk__t{color:var(--sd-rose);}
  .sd-tk.current.late .sd-tk__dot{border-color:rgba(210,96,79,.5);}
  .sd-tk__dot{width:22px;height:22px;flex:0 0 22px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;}
  .sd-tk.done .sd-tk__dot{background:linear-gradient(140deg,#5CB4FF,#1666E0);box-shadow:inset 0 1px 3px rgba(255,255,255,.45);}
  .sd-tk.current .sd-tk__dot{background:transparent;border:2px solid var(--sd-acc-line);}
  .sd-tk.upcoming .sd-tk__dot{background:transparent;border:2px solid rgba(74,98,150,.3);}
  .sd-tk__b{flex:1 1 auto;min-width:0;}
  .sd-tk__t{font-size:14px;font-weight:500;color:var(--sd-ink);line-height:1.3;}
  .sd-tk.upcoming .sd-tk__t{color:var(--sd-ink-mute);font-weight:400;}
  .sd-tk.current .sd-tk__t{color:var(--sd-acc-deep);font-weight:600;}
  .sd-tk__m{font-size:12px;font-weight:500;color:var(--sd-ink-mute);margin-top:3px;}
  .sd-tk__m.late{color:var(--sd-rose);}
  .sd-tk__go{margin-left:auto;color:var(--sd-ink-faint,rgba(22,32,59,.26));flex:0 0 auto;display:inline-flex;align-self:center;transition:transform .15s,color .15s;}
  .sd-tk:hover .sd-tk__go,.sd-tk.current .sd-tk__go{color:var(--sd-acc-deep);}
  .sd-tk:hover .sd-tk__go{transform:translateX(2px);}
  .sd-tasks__cta{margin-top:16px;display:inline-flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:14px;border-radius:14px;cursor:pointer;
    background:var(--sd-acc-deep);color:#fff;font-size:14px;font-weight:600;border:0;
    box-shadow:inset 0 0 24px rgba(175,215,255,.95),inset 0 0 8px rgba(255,255,255,.5),inset 0 1px 0 rgba(255,255,255,.5);transition:background .12s,transform .14s;}
  .sd-tasks__cta:hover{background:#3A85F0;transform:translateY(-1px);}
  .sd-tasks__cta:active{transform:translateY(1px);}
  .sd-tasks__cta svg{transform:rotate(-45deg);transition:transform .15s;}
  .sd-tasks__cta:hover svg{transform:rotate(-45deg) translate(2px,-2px);}
  .sd-tasks__cta:hover .sd-arr{transform:translateX(3px);}

  /* статьи переезда — чистая иконка на мягком градиенте вместо фото */
  .sd-acard__th--grad{display:flex;align-items:center;justify-content:center;background:linear-gradient(158deg,#E9EFFC 0%,#DCE6FA 100%);}
  .sd-acard__icw{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#fff;
    background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));box-shadow:inset 0 0 18px rgba(160,205,255,.55),0 8px 20px rgba(43,143,255,.32);}

  /* ── Карточки задач ─────────────────────────────────────────────────── */
  .sd-task{position:relative;overflow:hidden;padding:22px 22px 20px;display:flex;flex-direction:column;cursor:pointer;
    transition:transform .15s,border-color .15s,box-shadow .15s;}
  .sd-task:hover{transform:translateY(-2px);border-color:rgba(43,143,255,.42);}
  .sd-task__bg{position:absolute;top:-44px;right:-34px;width:158px;height:158px;border-radius:50%;
    background:radial-gradient(circle,var(--sd-acc-soft),transparent 70%);z-index:0;}
  .sd-task__top{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
  .sd-task__n{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;
    background:#fff;color:var(--sd-acc-deep);box-shadow:0 2px 8px rgba(30,60,140,.16),inset 0 0 0 1px rgba(43,143,255,.18);}
  .sd-task__chip{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;color:var(--sd-ink-mute);
    background:rgba(255,255,255,.6);border:1px solid rgba(255,255,255,.92);padding:5px 11px;border-radius:99px;}
  .sd-task__chip svg{opacity:.8;}
  .sd-task__chip--warn{color:var(--sd-gold);background:rgba(201,146,62,.12);border-color:rgba(201,146,62,.22);}
  .sd-task__head{position:relative;z-index:1;display:flex;gap:15px;align-items:center;margin-bottom:18px;}
  .sd-task__media{width:62px;height:76px;flex:0 0 62px;border-radius:13px;overflow:hidden;display:flex;align-items:center;justify-content:center;
    border:2px solid rgba(255,255,255,.95);background:linear-gradient(150deg,var(--sd-acc-soft),rgba(43,143,255,.04));color:var(--sd-acc-deep);
    box-shadow:inset 0 0 18px rgba(43,143,255,.12);}
  .sd-task__media img{width:100%;height:100%;object-fit:cover;}
  .sd-task__title{font-size:17px;font-weight:700;color:#1A2440;margin-bottom:5px;line-height:1.15;}
  .sd-task__desc{font-size:13px;color:var(--sd-ink-sub);line-height:1.45;}
  .sd-task__foot{position:relative;z-index:1;margin-top:auto;}

  /* карточка-задача: иллюстрация-фон (субъект слева) + молочная плашка с текстом */
  .sd-task2{position:relative;overflow:hidden;border-radius:24px;min-height:264px;display:flex;align-items:center;cursor:pointer;
    background-size:cover;background-position:left center;border:1.5px solid rgba(255,255,255,.82);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.55);transition:transform .2s,box-shadow .2s;}
  .sd-task2:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 20px 44px rgba(18,38,104,.16);}
  .sd-task2__veil{position:absolute;inset:0;z-index:0;background:linear-gradient(90deg,rgba(238,242,251,0) 40%,rgba(238,242,251,.16) 80%,rgba(238,242,251,.3) 100%);}
  .sd-task2__panel{position:relative;z-index:1;margin-left:auto;margin-right:18px;width:53%;min-width:236px;
    background:rgba(255,255,255,.38);border:1px solid rgba(255,255,255,.8);border-radius:19px;padding:22px;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.85),inset 0 0 30px rgba(255,255,255,.28);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);}
  .sd-task2__title{font-size:20px;font-weight:700;color:#13203B;line-height:1.12;letter-spacing:-.3px;}
  .sd-task2__desc{font-size:13px;color:rgba(22,32,59,.66);line-height:1.5;margin-top:8px;}
  .sd-task2__dl{display:flex;align-items:center;gap:8px;margin-top:14px;font-size:13px;font-weight:600;color:rgba(22,32,59,.62);}
  .sd-task2__dl svg{color:var(--sd-acc-deep);opacity:.85;}
  .sd-task2__dl--warn{color:#B97A1E;}
  .sd-task2__dl--warn svg{color:#C9923E;opacity:1;}
  .sd-task2__dl b{font-weight:700;color:#13203B;}
  .sd-task2__dl--warn b{color:#9A6514;}
  .sd-task2__foot{margin-top:18px;}

  /* герой: визуальный статус (цвет + свечение внутрь) */
  .sd-lhero__glow{position:absolute;z-index:1;right:6%;top:-80px;width:380px;height:320px;border-radius:50%;pointer-events:none;}
  .sd-lhero.is-ok{box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 0 0 1.5px rgba(46,160,110,.2),inset 0 0 90px rgba(46,160,110,.13);}
  .sd-lhero.is-ok .sd-lhero__glow{background:radial-gradient(circle,rgba(46,160,110,.2),transparent 70%);}
  .sd-lhero.is-warn{box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 0 0 1.5px rgba(201,146,62,.24),inset 0 0 90px rgba(201,146,62,.15);}
  .sd-lhero.is-warn .sd-lhero__glow{background:radial-gradient(circle,rgba(201,146,62,.24),transparent 70%);}
  .sd-lhero__status{display:inline-flex;align-items:center;gap:11px;margin:13px 0 12px;}
  .sd-lhero__statusic{width:32px;height:32px;flex:0 0 32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;}
  .sd-lhero__status.ok .sd-lhero__statusic{background:linear-gradient(150deg,#3EE08F,#1C7E52);box-shadow:inset 0 0 12px rgba(190,255,225,.6),0 0 16px rgba(46,160,110,.55);}
  .sd-lhero__status.warn .sd-lhero__statusic{background:linear-gradient(150deg,#F5C84C,#C9923E);box-shadow:inset 0 0 12px rgba(255,238,190,.6),0 0 16px rgba(201,146,62,.55);}
  .sd-lhero__statustx{font-size:16px;font-weight:800;letter-spacing:-.2px;}
  .sd-lhero__status.ok .sd-lhero__statustx{color:#1C7E52;}
  .sd-lhero__status.warn .sd-lhero__statustx{color:#9A6514;}

  /* таймлайн этапов на светлой плашке — кольца узлов под светлый фон */
  .sd-tl--light .sd-tlrow.done .sd-tlnode{box-shadow:0 0 0 4px #EDF1F9,0 0 14px rgba(46,160,110,.45);}
  .sd-tl--light .sd-tlrow.active .sd-tlnode{box-shadow:0 0 0 4px #EDF1F9,0 0 22px rgba(43,143,255,.6);}
  .sd-tl--light .sd-tlrow.locked .sd-tlnode{box-shadow:0 0 0 4px #EDF1F9;}
  .sd-tl--light .sd-tlline{background:rgba(22,32,59,.12);}

  /* статьи переезда — чистые стеклянные карточки с мягкой иконкой */
  /* база знаний: один крупный якорь-стори + тихий список рядом (анти-дефолт «4 одинаковых») */
  .sd-know{display:grid;grid-template-columns:1.32fr 1fr;gap:20px;align-items:stretch;}
  .sd-feat{position:relative;overflow:hidden;border-radius:24px;min-height:300px;cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;
    border:1px solid rgba(43,111,224,.2);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 18px 44px rgba(8,16,44,.22);}
  .sd-feat__bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.2,.7,.2,1);}
  .sd-feat:hover .sd-feat__bg{transform:scale(1.045);}
  .sd-feat__scrim{position:absolute;inset:0;background:linear-gradient(192deg,rgba(6,12,32,0) 28%,rgba(6,12,32,.42) 62%,rgba(5,10,28,.86) 100%);}
  .sd-feat__body{position:relative;z-index:1;padding:30px 32px 28px;}
  .sd-feat__cap{display:inline-block;font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#BFD4FF;
    padding:5px 11px;border-radius:99px;background:rgba(43,120,255,.26);border:1px solid rgba(150,185,255,.34);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
  .sd-feat__title{font-size:25px;font-weight:600;line-height:1.16;letter-spacing:-.7px;color:#fff;margin-top:16px;max-width:90%;text-wrap:balance;}
  .sd-feat__meta{display:flex;align-items:center;justify-content:space-between;margin-top:18px;font-size:12.5px;font-weight:500;color:rgba(214,224,250,.78);}
  .sd-feat__go{display:inline-flex;align-items:center;gap:6px;color:#fff;font-weight:600;}
  .sd-feat__go .sd-arr{transition:transform .2s;}
  .sd-feat:hover .sd-feat__go .sd-arr{transform:translateX(3px);}
  .sd-know__list{display:flex;flex-direction:column;gap:12px;}
  .sd-aitem{flex:1 1 0;display:flex;align-items:center;gap:15px;padding:0 18px;cursor:pointer;border-radius:18px;
    background:linear-gradient(150deg,rgba(255,255,255,.72),rgba(243,246,255,.5));border:1px solid rgba(43,111,224,.16);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
    transition:transform .18s,border-color .18s,box-shadow .18s;}
  .sd-aitem:hover{transform:translateX(3px);border-color:rgba(43,143,255,.4);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 22px rgba(43,143,255,.08);}
  .sd-aitem__icw{flex:0 0 42px;width:42px;height:42px;border-radius:13px;display:grid;place-items:center;color:var(--sd-acc-deep);
    background:rgba(43,143,255,.1);box-shadow:inset 0 0 0 1px rgba(43,143,255,.16);}
  .sd-aitem__b{flex:1 1 auto;min-width:0;}
  .sd-aitem__cap{font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--sd-ink-mute);}
  .sd-aitem__title{font-size:14px;font-weight:500;color:#1A1F2E;letter-spacing:-.2px;line-height:1.32;margin-top:4px;}
  .sd-aitem__go{flex:0 0 auto;display:grid;place-items:center;color:var(--sd-ink-mute);transition:color .18s;}
  .sd-aitem:hover .sd-aitem__go{color:var(--sd-acc-deep);}

  /* подготовка — горизонтальный блок с крупным графиком */
  .sd-prep2{display:flex;gap:32px;align-items:center;padding:24px 28px;}
  .sd-prep2__l{flex:0 0 296px;min-width:0;}
  .sd-prep2__r{flex:1 1 auto;min-width:0;}
  .sd-prep2__meta{display:flex;gap:28px;margin:16px 0 18px;}
  .sd-prep2__meta .k{font-size:11.5px;color:var(--sd-ink-mute);}
  .sd-prep2__meta .v{font-size:14px;font-weight:700;color:#15203B;margin-top:4px;}
  @media (max-width:980px){
    .sd-know{grid-template-columns:1fr;}
    .sd-feat{min-height:240px;}
    .sd-prep2{flex-direction:column;align-items:stretch;}.sd-prep2__l{flex:none;}
    .sd-lhero{flex-direction:column;align-items:flex-start;}
    .sd-lhero__main{max-width:100%;}
    .sd-lhero__r{align-self:center;margin-top:8px;}
    .sd-act{flex-direction:column;}
    .sd-act__media{display:none;}
    .sd-next2{grid-template-columns:1fr;}
    .sd-lhero__stats{flex-wrap:wrap;gap:14px 0;}
  }
  @media (max-width:560px){ .sd-feat__title{font-size:21px;} }

  /* три состояния героя: ok(зеленый) / warn(янтарный) / late(красный) */
  .sd-lhero.is-late{box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 0 0 1.5px rgba(210,96,79,.28),inset 0 0 90px rgba(210,96,79,.16);}
  .sd-lhero.is-late .sd-lhero__glow{background:radial-gradient(circle,rgba(210,96,79,.26),transparent 70%);}
  .sd-lhero__status.late .sd-lhero__statusic{background:linear-gradient(150deg,#E8806F,#B23B2A);box-shadow:inset 0 0 12px rgba(255,205,196,.6),0 0 16px rgba(210,96,79,.55);}
  .sd-lhero__status.late .sd-lhero__statustx{color:#B23B2A;}

  /* ── Блок «Сейчас» (чей ход) ─────────────────────────────────────────── */
  .sd-act{position:relative;overflow:hidden;display:flex;min-height:206px;}
  .sd-act__main{flex:1 1 auto;min-width:0;padding:24px 26px;display:flex;flex-direction:column;z-index:2;}
  .sd-act__media{flex:0 0 240px;position:relative;background-size:cover;background-position:center;}
  .sd-act__media-sh{position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.85) 0%,rgba(255,255,255,.25) 40%,rgba(255,255,255,0) 75%);}
  .sd-act__owner{display:inline-flex;align-items:center;gap:9px;margin-bottom:12px;}
  .sd-act__ownic{width:30px;height:30px;flex:0 0 30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;}
  .sd-act__ownic--you{background:linear-gradient(150deg,var(--sd-acc),var(--sd-acc-deep));box-shadow:inset 0 0 12px rgba(160,205,255,.5);}
  .sd-act__ownic--us{background:linear-gradient(150deg,#3EE08F,#1C7E52);box-shadow:inset 0 0 12px rgba(190,255,225,.5);}
  .sd-act__owntx{font-size:12.5px;font-weight:800;letter-spacing:.02em;}
  .sd-act__owner--you .sd-act__owntx{color:var(--sd-acc-deep);}
  .sd-act__owner--us .sd-act__owntx{color:#1C7E52;}
  .sd-act__title{font-size:22px;font-weight:700;color:#15203B;letter-spacing:-.4px;line-height:1.1;}
  .sd-act__why{font-size:13.5px;color:var(--sd-ink-sub);line-height:1.5;margin-top:9px;max-width:540px;}
  .sd-act__dl{display:inline-flex;align-items:center;gap:8px;margin-top:14px;font-size:13.5px;font-weight:700;}
  .sd-act__dl.ok{color:var(--sd-acc-deep);} .sd-act__dl.warn{color:#9A6514;} .sd-act__dl.late{color:#B23B2A;}
  .sd-act__dl b{font-weight:800;}
  .sd-act__foot{margin-top:auto;padding-top:18px;display:flex;gap:11px;flex-wrap:wrap;}

  .sd-next2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;}
  .sd-nextc{display:flex;align-items:center;gap:13px;padding:14px 16px;border-radius:16px;cursor:pointer;width:100%;text-align:left;
    background:rgba(255,255,255,.5);border:1.5px solid rgba(255,255,255,.85);transition:transform .15s,border-color .15s;}
  .sd-nextc:hover{transform:translateY(-2px);border-color:rgba(43,143,255,.35);}
  .sd-nextc__ic{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
  .sd-nextc__ic--you{color:var(--sd-acc-deep);background:var(--sd-acc-soft);}
  .sd-nextc__ic--us{color:#1C7E52;background:rgba(46,160,110,.14);}
  .sd-nextc__b{flex:1 1 auto;min-width:0;}
  .sd-nextc__t{font-size:14px;font-weight:600;color:#15203B;}
  .sd-nextc__s{font-size:11.5px;color:var(--sd-ink-mute);margin-top:2px;}
  .sd-nextc__go{color:rgba(22,32,59,.3);flex:0 0 auto;display:inline-flex;}

  /* ── Путь: кинематографичные карточки этапов (картинка видна) ─────────── */
  .sd-pstrip{display:flex;gap:16px;overflow-x:auto;padding:2px 2px 12px;scroll-snap-type:x mandatory;}
  .sd-pstrip::-webkit-scrollbar{height:0;}
  .sd-pcard{flex:0 0 246px;width:246px;height:252px;position:relative;overflow:hidden;border-radius:20px;cursor:pointer;scroll-snap-align:start;
    border:1px solid rgba(255,255,255,.7);box-shadow:inset 0 1px 0 rgba(255,255,255,.4);transition:transform .2s,box-shadow .2s;}
  .sd-pcard:hover{transform:translateY(-3px);}
  .sd-pcard__bg{position:absolute;inset:0;background-size:cover;background-position:center;transition:filter .3s,transform .3s;}
  .sd-pcard:hover .sd-pcard__bg{transform:scale(1.05);}
  .sd-pcard.locked .sd-pcard__bg{filter:brightness(.52) saturate(.75);}
  .sd-pcard__sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(4,8,22,.04) 22%,rgba(4,8,22,.46) 56%,rgba(4,8,22,.92) 100%);}
  .sd-pcard.active{border-color:var(--sd-acc);box-shadow:0 16px 40px rgba(43,143,255,.32),inset 0 0 0 1.5px rgba(43,143,255,.55);}
  .sd-pcard__n{position:absolute;top:14px;left:14px;z-index:2;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;
    background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.42);backdrop-filter:blur(4px);}
  .sd-pcard.done .sd-pcard__n{background:linear-gradient(150deg,#3EE08F,#1C7E52);border-color:rgba(120,255,190,.6);}
  .sd-pcard.active .sd-pcard__n{background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));border-color:var(--sd-acc);box-shadow:0 0 14px rgba(43,143,255,.85);}
  .sd-pcard__bot{position:absolute;left:16px;right:16px;bottom:15px;z-index:2;}
  .sd-pcard__now{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8CC6FF;text-shadow:0 0 10px rgba(43,143,255,.7);margin-bottom:6px;}
  .sd-pcard__t{font-size:15.5px;font-weight:700;color:#fff;line-height:1.2;}
  .sd-pcard__d{font-size:11.5px;color:rgba(222,230,255,.82);line-height:1.42;margin-top:5px;}

  /* ── Вертикальный таймлайн под-шагов (внутри этапа) ──────────────────── */
  .sd-vt{position:relative;margin-top:6px;}
  .sd-vtrow{display:flex;gap:18px;position:relative;}
  .sd-vtrail{display:flex;flex-direction:column;align-items:center;width:38px;flex:0 0 38px;}
  .sd-vtnode{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex:0 0 38px;margin-top:2px;z-index:1;color:#fff;}
  .sd-vtrow.done .sd-vtnode{background:linear-gradient(150deg,#3EE08F,#1C7E52);box-shadow:0 0 0 4px #EDF1F9,0 0 12px rgba(46,160,110,.4);}
  .sd-vtrow.current .sd-vtnode{background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));box-shadow:0 0 0 4px #EDF1F9,0 0 18px rgba(43,143,255,.6);}
  .sd-vtrow.upcoming .sd-vtnode{background:#DFE4F1;color:#8089A8;box-shadow:0 0 0 4px #EDF1F9;}
  .sd-vtline{flex:1 1 auto;width:2px;background:rgba(22,32,59,.12);margin:5px 0;}
  .sd-vtrow:last-child .sd-vtline{display:none;}
  .sd-vtcard{flex:1 1 auto;min-width:0;margin-bottom:16px;border-radius:18px;padding:18px 20px;
    background:rgba(255,255,255,.56);border:1.5px solid rgba(255,255,255,.9);box-shadow:inset 0 1px 0 rgba(255,255,255,.85);}
  .sd-vtrow.current .sd-vtcard{background:rgba(255,255,255,.72);border-color:rgba(43,143,255,.4);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 28px rgba(43,143,255,.08);}
  .sd-vtrow.upcoming .sd-vtcard{background:rgba(255,255,255,.4);}
  .sd-vtcard__t{font-size:16.5px;font-weight:700;color:#15203B;letter-spacing:-.2px;margin-top:9px;}
  .sd-vtrow.upcoming .sd-vtcard__t{color:#6A7290;}
  .sd-vtcard__d{font-size:13px;color:var(--sd-ink-sub);line-height:1.5;margin-top:7px;}
  .sd-vthow{margin-top:13px;display:flex;flex-direction:column;gap:8px;}
  .sd-vthow__i{display:flex;gap:10px;font-size:12.5px;color:var(--sd-ink-sub);line-height:1.4;}
  .sd-vthow__n{width:19px;height:19px;flex:0 0 19px;border-radius:50%;background:var(--sd-acc-soft);color:var(--sd-acc-deep);font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:center;}
  .sd-vtcard__dl{display:inline-flex;align-items:center;gap:7px;margin-top:13px;font-size:13px;font-weight:700;}
  .sd-vtcard__dl.ok{color:var(--sd-acc-deep);} .sd-vtcard__dl.warn{color:#9A6514;} .sd-vtcard__dl.late{color:#B23B2A;}
  .sd-vtcard__foot{margin-top:15px;display:flex;gap:10px;flex-wrap:wrap;}

  /* ── Как идет работа ────────────────────────────────────────────────── */
  .sd-work{padding:24px 26px;position:relative;overflow:hidden;}
  .sd-work__body{position:relative;z-index:1;max-width:100%;}
  .sd-work__head{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;}
  .sd-work__fig{position:absolute;right:-6px;bottom:-6px;width:210px;height:210px;z-index:0;pointer-events:none;
    -webkit-mask-image:linear-gradient(270deg,#000 55%,transparent);mask-image:linear-gradient(270deg,#000 55%,transparent);}
  .sd-work__fig img{width:100%;height:100%;object-fit:contain;object-position:bottom right;filter:drop-shadow(0 8px 16px rgba(30,50,120,.25));}
  .sd-steps{display:flex;align-items:flex-start;justify-content:space-between;gap:6px;position:relative;}
  .sd-step{display:flex;flex-direction:column;align-items:center;text-align:center;flex:1 1 0;position:relative;}
  .sd-step__bar{position:absolute;top:13px;left:50%;width:100%;height:2px;background:var(--sd-line);z-index:0;}
  .sd-step.is-done .sd-step__bar,.sd-step.is-current .sd-step__bar{background:linear-gradient(90deg,var(--sd-jade),var(--sd-acc));}
  .sd-step:last-child .sd-step__bar{display:none;}
  .sd-step__dot{position:relative;z-index:1;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:700;background:var(--sd-card-2);border:1.5px solid var(--sd-line);color:var(--sd-ink-mute);}
  .sd-step.is-done .sd-step__dot{background:var(--sd-jade);border-color:var(--sd-jade);color:#fff;box-shadow:0 0 0 4px rgba(46,160,110,.14);}
  .sd-step.is-current .sd-step__dot{background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));border-color:var(--sd-acc);color:#fff;
    box-shadow:0 0 0 4px rgba(43,143,255,.18),0 0 14px rgba(43,143,255,.7);}
  .sd-step__pulse{width:8px;height:8px;border-radius:99px;background:#fff;animation:sdPulse 1.6s ease-in-out infinite;}
  @keyframes sdPulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.5);opacity:.65;}}
  .sd-step__lab{margin-top:9px;font-size:11.5px;line-height:1.3;color:var(--sd-ink-sub);max-width:92px;}
  .sd-step.is-current .sd-step__lab{color:var(--sd-acc-deep);font-weight:600;}
  .sd-step__now{margin-top:4px;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--sd-acc);
    background:var(--sd-acc-soft);padding:2px 7px;border-radius:99px;}

  .sd-cur{display:flex;align-items:center;gap:13px;margin-top:22px;padding-top:18px;border-top:1px solid var(--sd-line);}
  .sd-cur__av{width:42px;height:42px;flex:0 0 42px;border-radius:13px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;
    background:linear-gradient(150deg,var(--sd-acc),var(--sd-acc-deep));box-shadow:inset 0 0 12px rgba(160,205,255,.5);}
  .sd-cur__t{font-size:13.5px;color:#1A2440;}
  .sd-cur__t b{font-weight:700;}
  .sd-cur__s{font-size:12px;color:var(--sd-ink-mute);margin-top:2px;}

  /* ── Твоя подготовка ────────────────────────────────────────────────── */
  .sd-prep{position:relative;overflow:hidden;padding:24px;display:flex;flex-direction:column;}
  .sd-prep__head{display:flex;align-items:center;justify-content:space-between;}
  .sd-tag{display:inline-flex;align-items:center;font-size:11px;font-weight:700;letter-spacing:.04em;padding:4px 10px;border-radius:8px;
    background:var(--sd-acc-soft);color:var(--sd-acc-deep);}
  .sd-prep__stat{display:flex;align-items:baseline;gap:5px;margin-top:14px;}
  .sd-prep__num{font-size:44px;font-weight:800;letter-spacing:-1.5px;color:#1A2440;line-height:1;}
  .sd-prep__unit{font-size:14px;color:var(--sd-ink-mute);font-weight:500;}
  .sd-spark{margin:14px 0 16px;height:54px;width:100%;display:block;}
  .sd-prep__meta{display:flex;justify-content:space-between;gap:12px;font-size:12.5px;color:var(--sd-ink-sub);margin-bottom:16px;}
  .sd-prep__meta b{color:#1A2440;}
  .sd-prep__foot{margin-top:auto;}

  /* ── Полезно изучить ────────────────────────────────────────────────── */
  .sd-learn{padding:22px 0 22px 24px;overflow:hidden;}
  .sd-arts{display:flex;gap:14px;overflow-x:auto;padding:2px 24px 8px 0;scroll-snap-type:x mandatory;}
  .sd-arts::-webkit-scrollbar{height:0;}
  .sd-art{flex:0 0 168px;width:168px;cursor:pointer;scroll-snap-align:start;transition:transform .2s;}
  .sd-art:hover{transform:translateY(-3px);}
  .sd-art__th{position:relative;height:104px;border-radius:16px;overflow:hidden;display:flex;align-items:flex-start;justify-content:flex-end;padding:9px;}
  .sd-art__th svg{color:rgba(255,255,255,.92);opacity:.9;}
  .sd-art__dur{position:absolute;left:9px;bottom:9px;font-size:10.5px;font-weight:600;color:#fff;background:rgba(8,10,26,.6);padding:3px 8px;border-radius:99px;backdrop-filter:blur(4px);}
  .sd-art__title{font-size:13.5px;font-weight:600;color:#1A2440;margin-top:10px;line-height:1.3;}

  /* ── Нижний баннер помощи ───────────────────────────────────────────── */
  .sd-help{position:relative;overflow:hidden;border-radius:24px;margin-top:30px;padding:28px 32px;color:#fff;
    display:flex;align-items:center;justify-content:space-between;gap:24px;
    background:linear-gradient(120deg,#0B1230 0%,#111A44 55%,#1A2360 100%);border:1px solid rgba(60,150,250,.25);}
  .sd-help__glow{position:absolute;top:-60px;right:8%;width:200px;height:200px;border-radius:50%;
    background:radial-gradient(circle,rgba(43,143,255,.35),transparent 70%);z-index:0;}
  .sd-help__info{position:relative;z-index:1;}
  .sd-help__t{font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:700;font-size:22px;color:#fff;}
  .sd-help__s{font-size:13.5px;color:#A9B4DA;margin-top:6px;}
  .sd-help__act{position:relative;z-index:1;display:flex;gap:12px;flex:0 0 auto;}

  /* ── Страница «Мой план»: hero + таймлайн ───────────────────────────── */
  .sd-phero{position:relative;overflow:hidden;border-radius:24px;min-height:200px;padding:30px 34px;color:#fff;
    display:flex;align-items:center;justify-content:space-between;gap:24px;}
  .sd-phero__bg{position:absolute;inset:0;background-size:cover;background-position:center 40%;z-index:0;}
  .sd-phero__shade{position:absolute;inset:0;z-index:1;background:linear-gradient(100deg,rgba(6,9,26,.92),rgba(10,14,40,.66) 55%,rgba(30,22,60,.32));}
  .sd-phero__main{position:relative;z-index:2;flex:1 1 auto;}
  .sd-phero__cap{font-size:12px;letter-spacing:.05em;text-transform:uppercase;color:#9FB4E6;}
  .sd-phero__num{font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:700;font-size:52px;letter-spacing:-2px;line-height:1;margin:6px 0 14px;}
  .sd-pbar{height:8px;border-radius:99px;background:rgba(255,255,255,.14);overflow:hidden;max-width:440px;}
  .sd-pbar__fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--sd-acc-2),var(--sd-acc));box-shadow:0 0 10px rgba(43,143,255,.8);transition:width 1s cubic-bezier(.22,.61,.36,1);}
  .sd-phero__stage{font-size:15px;font-weight:600;margin-top:14px;}
  .sd-phero__sub{font-size:13px;color:#A9B4DA;margin-top:5px;}
  .sd-phero__sub b{color:var(--sd-gold);}

  .sd-tl{margin-top:28px;position:relative;padding-bottom:30px;}
  .sd-tlrow{display:flex;gap:20px;position:relative;}
  .sd-tlrail{display:flex;flex-direction:column;align-items:center;width:36px;flex:0 0 36px;position:relative;}
  .sd-tlnode{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;z-index:2;margin-top:6px;flex:0 0 36px;}
  .sd-tlrow.done .sd-tlnode{background:var(--sd-jade);color:#fff;box-shadow:0 0 0 4px #0A0F26,0 0 14px rgba(46,160,110,.5);}
  .sd-tlrow.active .sd-tlnode{background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));color:#fff;box-shadow:0 0 0 4px #0A0F26,0 0 22px rgba(43,143,255,.85);}
  .sd-tlrow.locked .sd-tlnode{background:#141A33;color:#5C678C;box-shadow:0 0 0 4px #0A0F26;border:1px solid rgba(140,170,255,.12);}
  .sd-tlline{flex:1 1 auto;width:2px;background:rgba(140,170,255,.14);margin:6px 0;}
  .sd-tlrow.done .sd-tlline{background:linear-gradient(180deg,var(--sd-jade),rgba(46,160,110,.2));}
  .sd-tlrow:last-child .sd-tlline{display:none;}

  .sd-stage{flex:1 1 auto;min-width:0;min-height:128px;position:relative;overflow:hidden;border-radius:18px;margin-bottom:18px;
    border:1px solid rgba(255,255,255,.16);background:#0E1430;transition:border-color .25s,box-shadow .25s,transform .2s;}
  .sd-stage__bg{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0;opacity:1;transition:transform .35s,filter .35s;}
  /* затемнение частичное: слева читаемо для текста, справа видно картинку */
  .sd-stage__shade{position:absolute;inset:0;z-index:1;background:linear-gradient(100deg,rgba(6,10,28,.88) 0%,rgba(6,10,28,.6) 36%,rgba(6,10,28,.16) 68%,rgba(6,10,28,.02) 100%);}
  .sd-stage__in{position:relative;z-index:2;padding:20px 24px;}
  .sd-stage.locked .sd-stage__bg{filter:brightness(.5) saturate(.78);}
  .sd-stage.locked{border-color:rgba(255,255,255,.08);}
  .sd-stage:not(.locked):hover{transform:translateY(-2px);}
  .sd-stage.active{border-color:var(--sd-acc);box-shadow:0 18px 44px rgba(43,143,255,.26),inset 0 0 0 1.5px rgba(43,143,255,.4);}
  .sd-stage.active .sd-stage__bg{transform:scale(1.03);}
  .sd-stage.active .sd-stage__shade{background:linear-gradient(100deg,rgba(6,10,28,.82) 0%,rgba(8,14,40,.5) 40%,rgba(10,16,46,.12) 74%,transparent 100%);}
  .sd-stage__top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
  .sd-stbadge{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 9px;border-radius:6px;}
  .sd-stbadge.done{background:rgba(46,160,110,.18);color:#3EE08F;}
  .sd-stadge.active,.sd-stbadge.active{}
  .sd-stbadge{font-size:10px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;padding:4px 9px;border-radius:6px;}
  .sd-stbadge.done{background:rgba(46,160,110,.18);color:#3EE08F;}
  .sd-stbadge.active{background:var(--sd-acc-deep);color:#fff;box-shadow:0 0 12px rgba(43,143,255,.6);}
  .sd-stchev{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#AEB9DE;
    background:rgba(255,255,255,.08);border:1px solid rgba(140,170,255,.14);cursor:pointer;flex:0 0 30px;transition:background .15s;}
  .sd-stchev:hover{background:rgba(255,255,255,.14);color:#fff;}
  .sd-stage__title{font-size:19px;font-weight:700;color:#fff;margin:12px 0 6px;}
  .sd-stage.locked .sd-stage__title{color:#9098BC;}
  .sd-stage__desc{font-size:13px;color:#9AA6CE;line-height:1.5;max-width:72%;}

  .sd-checks{margin-top:20px;display:flex;flex-direction:column;gap:11px;max-width:560px;}
  .sd-check{display:flex;align-items:center;gap:12px;}
  .sd-check__box{width:20px;height:20px;flex:0 0 20px;border-radius:6px;border:1.5px solid rgba(160,180,230,.3);display:flex;align-items:center;justify-content:center;color:transparent;}
  .sd-check.done .sd-check__box{background:var(--sd-acc-deep);border-color:var(--sd-acc-deep);color:#fff;box-shadow:0 0 10px rgba(43,143,255,.5);}
  .sd-check.action .sd-check__box{border-color:var(--sd-rose);}
  .sd-check__name{flex:1 1 auto;font-size:13.5px;color:#E2E8FB;}
  .sd-check__st{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:#7E88AE;}
  .sd-check__dot{width:6px;height:6px;border-radius:99px;}
  .sd-check.work .sd-check__st{color:var(--sd-acc-2);}
  .sd-check.work .sd-check__dot{background:var(--sd-acc-2);box-shadow:0 0 8px var(--sd-acc-2);}
  .sd-check.action .sd-check__st{color:var(--sd-rose);font-weight:600;}
  .sd-check.action .sd-check__dot{background:var(--sd-rose);box-shadow:0 0 8px var(--sd-rose);}
  .sd-stage__cta{margin-top:20px;}

  /* ── Статус-вердикт (правая колонка героя на главной) ───────────────── */
  .sd-verdict{position:relative;z-index:2;flex:0 0 300px;width:300px;border-radius:18px;padding:18px 18px 18px;
    background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);}
  .sd-verdict__cap{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:rgba(220,228,255,.7);font-weight:700;margin-bottom:10px;}
  .sd-verdict__row{display:flex;align-items:center;gap:12px;}
  .sd-verdict__ic{width:40px;height:40px;flex:0 0 40px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;
    background:rgba(43,143,255,.2);box-shadow:inset 0 0 14px rgba(43,143,255,.95),inset 0 0 3px rgba(160,205,255,.7);}
  .sd-verdict__t{font-size:14.5px;font-weight:700;color:#fff;line-height:1.25;}
  .sd-verdict__s{font-size:12px;color:rgba(220,228,255,.78);margin-top:2px;line-height:1.4;}
  .sd-verdict__cta{margin-top:14px;}

  /* ── «Твоя задача сейчас» + «Спроси AI» ─────────────────────────────── */
  .sd-now{padding:22px 24px;display:flex;flex-direction:column;height:100%;}
  .sd-now__head{display:flex;align-items:center;gap:11px;margin-bottom:6px;}
  .sd-now__badge{width:38px;height:38px;flex:0 0 38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;
    background:linear-gradient(150deg,var(--sd-acc),var(--sd-acc-deep));box-shadow:inset 0 0 12px rgba(160,205,255,.5);}
  .sd-now__cap{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--sd-acc-deep);font-weight:700;}
  .sd-now__title{font-size:19px;font-weight:700;color:#1A2440;margin-top:1px;}
  .sd-now__desc{font-size:13.5px;color:var(--sd-ink-sub);line-height:1.5;margin:12px 0 16px;}
  .sd-now__foot{margin-top:auto;display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
  .sd-now__meta{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--sd-gold);}

  .sd-ai{position:relative;overflow:hidden;padding:22px 24px;display:flex;flex-direction:column;color:#fff;border-radius:22px;
    background:linear-gradient(135deg,#0B1230,#142058 58%,#1B2A78);border:1px solid rgba(60,150,250,.3);}
  .sd-ai__glow{position:absolute;right:-40px;top:-40px;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,rgba(43,143,255,.4),transparent 70%);}
  .sd-ai__bot{position:relative;z-index:1;width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;color:#EAF2FF;margin-bottom:14px;
    background:rgba(43,143,255,.18);box-shadow:inset 0 0 16px rgba(43,143,255,.95),inset 0 0 4px rgba(160,205,255,.7);}
  .sd-ai__title{position:relative;z-index:1;font-size:18px;font-weight:700;}
  .sd-ai__desc{position:relative;z-index:1;font-size:13px;color:#A9B4DA;margin:6px 0 16px;line-height:1.5;}
  .sd-ai__foot{position:relative;z-index:1;margin-top:auto;}

  /* ── Обзор этапов на главной (кликабельный) ─────────────────────────── */
  .sd-jrny{padding:10px;}
  .sd-jstep{display:flex;align-items:center;gap:14px;padding:13px 14px;border-radius:14px;cursor:pointer;transition:background .15s;position:relative;width:100%;text-align:left;background:0;border:0;}
  .sd-jstep:hover{background:rgba(255,255,255,.55);}
  .sd-jstep__n{width:30px;height:30px;flex:0 0 30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;z-index:1;}
  .sd-jstep.done .sd-jstep__n{background:var(--sd-jade);color:#fff;box-shadow:0 0 0 4px rgba(46,160,110,.12);}
  .sd-jstep.active .sd-jstep__n{background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));color:#fff;box-shadow:0 0 0 4px rgba(43,143,255,.16),0 0 12px rgba(43,143,255,.6);}
  .sd-jstep.locked .sd-jstep__n{background:#E2E6F2;color:var(--sd-ink-mute);}
  .sd-jstep__t{flex:1 1 auto;font-size:14px;font-weight:600;color:#1A2440;}
  .sd-jstep.locked .sd-jstep__t{color:var(--sd-ink-mute);font-weight:500;}
  .sd-jstep__badge{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:3px 9px;border-radius:99px;}
  .sd-jstep.active .sd-jstep__badge{background:var(--sd-acc-soft);color:var(--sd-acc-deep);}
  .sd-jstep.done .sd-jstep__badge{color:var(--sd-jade);}
  .sd-jstep__line{position:absolute;left:28px;top:47px;width:2px;height:12px;background:var(--sd-line);}
  .sd-jstep:last-child .sd-jstep__line{display:none;}
  .sd-jstep__go{color:var(--sd-ink-mute);display:inline-flex;}

  /* ── Продукты EastSide ──────────────────────────────────────────────── */
  .sd-prods{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
  .sd-prod{padding:20px;display:flex;flex-direction:column;}
  .sd-prod__ic{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--sd-acc-deep);background:var(--sd-acc-soft);margin-bottom:14px;}
  .sd-prod__title{font-size:15.5px;font-weight:700;color:#1A2440;margin-bottom:6px;}
  .sd-prod__desc{font-size:12.5px;color:var(--sd-ink-sub);line-height:1.45;margin-bottom:14px;}
  .sd-prod__foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;}
  .sd-prod__price{font-size:13.5px;font-weight:700;color:#1A2440;}
  .sd-prod__price span{font-size:.72em;color:var(--sd-ink-mute);font-weight:500;}
  .sd-prod__go{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--sd-acc);}

  /* ── Страница ДЕТАЛЕЙ ЭТАПА ──────────────────────────────────────────── */
  .sd-back{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:#9AA6CE;background:0;border:0;cursor:pointer;margin-bottom:14px;}
  .sd-back:hover{color:#fff;}
  .sd-dgrid{display:grid;grid-template-columns:1.55fr 1fr;gap:18px;margin-top:22px;align-items:start;}
  .sd-dcol{display:flex;flex-direction:column;gap:18px;min-width:0;}
  .sd-block{padding:22px 24px;}
  .sd-block__title{font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:700;font-size:16px;color:#fff;margin-bottom:16px;}
  .sd-main--dark .sd-block{background:rgba(20,28,64,.5);border:1px solid rgba(140,170,255,.14);border-radius:20px;box-shadow:inset 0 1px 0 rgba(255,255,255,.05);}
  /* под-этапы внутри этапа */
  .sd-subs{display:flex;flex-direction:column;}
  .sd-sub{display:flex;gap:13px;position:relative;padding-bottom:16px;}
  .sd-sub:last-child{padding-bottom:0;}
  .sd-sub__mk{width:24px;height:24px;flex:0 0 24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;z-index:1;
    background:#141A33;color:#5C678C;border:1px solid rgba(140,170,255,.16);}
  .sd-sub.done .sd-sub__mk{background:var(--sd-jade);color:#fff;border-color:var(--sd-jade);}
  .sd-sub.current .sd-sub__mk{background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));color:#fff;border-color:var(--sd-acc);box-shadow:0 0 12px rgba(43,143,255,.7);}
  .sd-sub__line{position:absolute;left:11px;top:26px;bottom:0;width:2px;background:rgba(140,170,255,.14);}
  .sd-sub.done .sd-sub__line{background:rgba(46,160,110,.4);}
  .sd-sub:last-child .sd-sub__line{display:none;}
  .sd-sub__t{font-size:14px;font-weight:600;color:#E2E8FB;}
  .sd-sub.locked .sd-sub__t{color:#8B93B8;font-weight:500;}
  .sd-sub__s{font-size:12px;color:#7E88AE;margin-top:2px;}
  .sd-sub.current .sd-sub__t{color:#fff;}
  .sd-sub__now{display:inline-block;margin-top:5px;font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--sd-acc-2);background:rgba(43,143,255,.14);padding:2px 8px;border-radius:99px;}
  /* следующий этап */
  .sd-next{position:relative;overflow:hidden;border-radius:20px;padding:20px 22px;color:#fff;border:1px solid rgba(140,170,255,.16);}
  .sd-next__bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.3;z-index:0;}
  .sd-next__shade{position:absolute;inset:0;background:linear-gradient(100deg,#0C1230 40%,rgba(12,18,48,.6));z-index:1;}
  .sd-next__in{position:relative;z-index:2;}
  .sd-next__cap{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#9FB4E6;font-weight:700;}
  .sd-next__t{font-size:16px;font-weight:700;margin:8px 0 6px;}
  .sd-next__s{font-size:12.5px;color:#A9B4DA;line-height:1.45;}
  /* куратор-карточка на темном */
  .sd-curator{display:flex;align-items:center;gap:13px;padding:18px 20px;border-radius:18px;background:rgba(20,28,64,.5);border:1px solid rgba(140,170,255,.14);}
  .sd-curator__av{width:46px;height:46px;flex:0 0 46px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;
    background:linear-gradient(150deg,var(--sd-acc),var(--sd-acc-deep));box-shadow:inset 0 0 12px rgba(160,205,255,.5);}
  .sd-curator__n{font-size:14px;font-weight:700;color:#fff;}
  .sd-curator__r{font-size:12px;color:#9AA6CE;margin-top:2px;}
  /* мета-чипы на темном (детали) */
  .sd-dchips{display:flex;gap:12px;flex-wrap:wrap;margin-top:16px;}
  .sd-dchip{display:flex;align-items:center;gap:9px;padding:10px 14px;border-radius:13px;background:rgba(255,255,255,.06);border:1px solid rgba(140,170,255,.16);}
  .sd-dchip__ic{color:var(--sd-acc-2);display:inline-flex;}
  .sd-dchip__k{font-size:10.5px;color:#9AA6CE;}
  .sd-dchip__v{font-size:14px;font-weight:700;color:#fff;}

  /* ── Чистый статус-баннер (главная, без фото) ───────────────────────── */
  .sd-status{position:relative;overflow:hidden;border-radius:24px;padding:30px 34px;color:#fff;
    display:flex;align-items:center;justify-content:space-between;gap:28px;
    background:
      radial-gradient(700px 360px at 88% -20%,rgba(43,143,255,.30),transparent 62%),
      radial-gradient(520px 320px at 8% 130%,rgba(46,120,220,.18),transparent 60%),
      linear-gradient(125deg,#070D26 0%,#0C1740 52%,#102255 100%);
    border:1px solid rgba(70,140,240,.32);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.08),inset 0 0 60px rgba(43,143,255,.08);}
  .sd-status__mtn{position:absolute;right:0;bottom:0;width:340px;height:150px;opacity:.5;z-index:0;pointer-events:none;
    -webkit-mask-image:linear-gradient(270deg,#000 30%,transparent);mask-image:linear-gradient(270deg,#000 30%,transparent);}
  .sd-status__main{position:relative;z-index:1;flex:1 1 auto;min-width:0;}
  .sd-ontrack{display:inline-flex;align-items:center;gap:8px;padding:6px 13px;border-radius:99px;font-size:12px;font-weight:700;letter-spacing:.01em;}
  .sd-ontrack--ok{background:rgba(46,160,110,.16);color:#5FE6A6;border:1px solid rgba(62,224,143,.34);}
  .sd-ontrack--warn{background:rgba(201,146,62,.16);color:#F5C84C;border:1px solid rgba(245,200,76,.34);}
  .sd-ontrack__dot{width:7px;height:7px;border-radius:99px;background:currentColor;box-shadow:0 0 8px currentColor;}
  .sd-status__stage{font-size:12.5px;color:#9FB0DA;margin:16px 0 6px;letter-spacing:.02em;}
  .sd-status__title{font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:700;font-size:32px;letter-spacing:-1px;line-height:1.02;}
  .sd-status__say{font-size:14px;color:rgba(220,228,255,.82);line-height:1.5;max-width:480px;margin-top:10px;}
  .sd-status__chips{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;}
  .sd-status__r{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:14px;flex:0 0 auto;}

  /* ── Две стороны: «от тебя» / «делаем мы» ───────────────────────────── */
  .sd-sidecard{padding:20px 22px;display:flex;flex-direction:column;}
  .sd-sidecard__head{display:flex;align-items:center;gap:10px;margin-bottom:4px;}
  .sd-sidecard__ic{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
  .sd-sidecard__ic--you{color:#fff;background:linear-gradient(150deg,var(--sd-acc),var(--sd-acc-deep));box-shadow:inset 0 0 12px rgba(160,205,255,.5);}
  .sd-sidecard__ic--us{color:var(--sd-acc-deep);background:var(--sd-acc-soft);}
  .sd-sidecard__cap{font-size:11px;letter-spacing:.05em;text-transform:uppercase;font-weight:700;color:var(--sd-ink-mute);}
  .sd-sidecard__title{font-size:16px;font-weight:700;color:#1A2440;}
  .sd-sidecard__list{margin-top:14px;display:flex;flex-direction:column;gap:8px;}
  .sd-tasklite{display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;
    padding:12px 13px;border-radius:13px;border:1.5px solid rgba(255,255,255,.85);background:rgba(255,255,255,.5);transition:background .15s,border-color .15s,transform .15s;}
  .sd-tasklite:hover{background:rgba(255,255,255,.8);border-color:rgba(43,143,255,.4);transform:translateX(2px);}
  .sd-tasklite--static{cursor:default;}
  .sd-tasklite--static:hover{transform:none;border-color:rgba(255,255,255,.85);background:rgba(255,255,255,.5);}
  .sd-tasklite__mk{width:26px;height:26px;flex:0 0 26px;border-radius:8px;display:flex;align-items:center;justify-content:center;}
  .sd-tasklite__mk--warn{color:var(--sd-gold);background:rgba(201,146,62,.14);}
  .sd-tasklite__mk--info{color:var(--sd-acc-deep);background:var(--sd-acc-soft);}
  .sd-tasklite__mk--ok{color:var(--sd-jade);background:rgba(46,160,110,.14);}
  .sd-tasklite__b{flex:1 1 auto;min-width:0;}
  .sd-tasklite__t{font-size:13.5px;font-weight:600;color:#1A2440;}
  .sd-tasklite__s{font-size:11.5px;color:var(--sd-ink-mute);margin-top:1px;}
  .sd-tasklite__go{color:var(--sd-ink-faint,rgba(22,32,59,.3));display:inline-flex;}
  .sd-sidecard__note{margin-top:14px;padding-top:13px;border-top:1px solid var(--sd-line);font-size:12.5px;color:var(--sd-ink-sub);line-height:1.45;}
  .sd-sidecard__note b{color:#1A2440;}

  /* ── Кинематографичная лента этапов (Твой путь на главной) ──────────── */
  .sd-strip{display:flex;gap:14px;overflow-x:auto;padding:2px 2px 10px;scroll-snap-type:x mandatory;}
  .sd-strip::-webkit-scrollbar{height:0;}
  .sd-scard{flex:0 0 230px;width:230px;height:150px;position:relative;overflow:hidden;border-radius:18px;cursor:pointer;scroll-snap-align:start;
    border:1px solid rgba(140,170,255,.16);transition:transform .2s,box-shadow .2s,border-color .2s;}
  .sd-scard:hover{transform:translateY(-3px);}
  .sd-scard__bg{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0;transition:opacity .3s,filter .3s;}
  .sd-scard.locked .sd-scard__bg{filter:grayscale(70%) brightness(.5);opacity:.55;}
  .sd-scard.done .sd-scard__bg{filter:saturate(.85);}
  .sd-scard__shade{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(6,9,26,.1) 0%,rgba(6,9,26,.55) 55%,rgba(6,9,26,.92) 100%);}
  .sd-scard.active{border-color:var(--sd-acc);box-shadow:0 14px 34px rgba(43,143,255,.28);}
  .sd-scard.active .sd-scard__shade{background:linear-gradient(180deg,rgba(20,16,50,.05),rgba(10,14,40,.5) 50%,rgba(8,12,36,.92));}
  .sd-scard__in{position:absolute;inset:0;z-index:2;padding:14px;display:flex;flex-direction:column;justify-content:space-between;color:#fff;}
  .sd-scard__n{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;align-self:flex-start;
    background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(4px);}
  .sd-scard.done .sd-scard__n{background:var(--sd-jade);border-color:var(--sd-jade);}
  .sd-scard.active .sd-scard__n{background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));border-color:var(--sd-acc);box-shadow:0 0 12px rgba(43,143,255,.8);}
  .sd-scard__lab{font-size:13.5px;font-weight:600;line-height:1.25;}
  .sd-scard__badge{font-size:9.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:6px;color:var(--sd-acc-2);}

  /* ── Попапы (overlay + модалка + чат-дровер) ────────────────────────── */
  .sd-ov{position:fixed;inset:0;z-index:1000;display:flex;background:rgba(8,14,34,.46);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);animation:sdFade .2s ease;}
  @keyframes sdFade{from{opacity:0}to{opacity:1}}
  .sd-ov--center{align-items:center;justify-content:center;padding:34px;}
  .sd-ov--right{justify-content:flex-end;}
  /* попап-заглушка «раздел в разработке» (единый, зовётся через SH.openSoon) */
  .sd-soon{position:relative;width:100%;max-width:404px;border-radius:24px;padding:30px 28px 26px;text-align:center;
    background:linear-gradient(160deg,rgba(255,255,255,.95),rgba(238,242,253,.9));border:1px solid rgba(255,255,255,.7);
    box-shadow:0 34px 74px -22px rgba(6,16,44,.6),inset 0 1px 0 rgba(255,255,255,.92);
    animation:sdSoonIn .22s cubic-bezier(.23,1,.32,1) both;}
  @keyframes sdSoonIn{from{opacity:0;transform:translateY(10px) scale(.98)}to{opacity:1;transform:none}}
  .sd-soon__ic{width:52px;height:52px;margin:0 auto 16px;border-radius:16px;display:grid;place-items:center;color:#fff;
    background:var(--sd-acc-deep,#1f63c8);box-shadow:inset 0 0 18px rgba(120,190,255,.6),inset 0 1px 0 rgba(255,255,255,.3),0 10px 22px -8px rgba(31,99,200,.5);}
  .sd-soon__eyebrow{font-size:12.5px;font-weight:600;color:var(--sd-acc-deep,#1f63c8);margin-bottom:6px;}
  .sd-soon__t{font-weight:700;font-size:21px;letter-spacing:-.5px;color:var(--sd-ink,#15203b);}
  .sd-soon__s{font-size:14px;font-weight:500;line-height:1.5;color:var(--sd-ink-sub,#5a6785);margin-top:9px;text-wrap:balance;}
  .sd-soon__btn{margin-top:22px;width:100%;padding:14px;border-radius:14px;cursor:pointer;font-family:inherit;font-size:15px;font-weight:600;color:#fff;border:0;
    background:var(--sd-acc-deep,#1f63c8);box-shadow:inset 0 0 18px rgba(120,190,255,.5),inset 0 1px 0 rgba(255,255,255,.3);transition:background .16s,transform .16s;}
  .sd-soon__btn:hover{background:var(--sd-acc,#2b8fff);transform:translateY(-1px);}
  .sd-modal{width:100%;max-width:540px;max-height:86vh;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;color:#fff;
    background:rgba(13,20,46,.58);
    -webkit-backdrop-filter:blur(34px) saturate(150%);backdrop-filter:blur(34px) saturate(150%);
    border:1px solid rgba(120,160,255,.28);
    box-shadow:0 32px 84px rgba(6,12,36,.5),inset 0 1px 0 rgba(255,255,255,.14),inset 0 0 46px rgba(40,110,240,.1);
    animation:sdRise .24s cubic-bezier(.16,1,.3,1);}
  @keyframes sdRise{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
  .sd-modal__media{height:150px;position:relative;flex:0 0 auto;}
  .sd-modal__media-bg{position:absolute;inset:0;background-size:cover;background-position:center;}
  .sd-modal__media-sh{position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(10,15,38,.9));}
  .sd-modal__head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:22px 24px 0;}
  .sd-modal__cap{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--sd-acc-2);font-weight:700;}
  .sd-modal__title{font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:700;font-size:21px;color:#fff;margin-top:6px;line-height:1.1;}
  .sd-x{width:34px;height:34px;flex:0 0 34px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#AEB9DE;
    background:rgba(255,255,255,.07);border:1px solid rgba(140,170,255,.16);transition:background .15s;}
  .sd-x:hover{background:rgba(255,255,255,.14);color:#fff;}
  .sd-modal__body{padding:18px 24px 24px;overflow-y:auto;color:#C7D0EC;font-size:14px;line-height:1.6;}
  .sd-modal__body p{margin:0 0 12px;}
  .sd-modal__body h4{color:#fff;font-size:14.5px;font-weight:700;margin:18px 0 8px;}
  .sd-modal__foot{padding:16px 24px;border-top:1px solid rgba(140,170,255,.12);display:flex;gap:10px;align-items:center;flex-wrap:wrap;}

  /* статус-лента задачи в попапе */
  .sd-flow{display:flex;flex-direction:column;gap:0;margin:6px 0 4px;}
  .sd-flowstep{display:flex;gap:12px;position:relative;padding-bottom:16px;}
  .sd-flowstep:last-child{padding-bottom:0;}
  .sd-flowstep__mk{width:24px;height:24px;flex:0 0 24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;z-index:1;
    background:#141A33;color:#5C678C;border:1px solid rgba(140,170,255,.18);}
  .sd-flowstep.done .sd-flowstep__mk{background:var(--sd-jade);color:#fff;border-color:var(--sd-jade);}
  .sd-flowstep.current .sd-flowstep__mk{background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));color:#fff;border-color:var(--sd-acc);box-shadow:0 0 12px rgba(43,143,255,.7);}
  .sd-flowstep__line{position:absolute;left:11px;top:26px;bottom:0;width:2px;background:rgba(140,170,255,.16);}
  .sd-flowstep.done .sd-flowstep__line{background:rgba(46,160,110,.4);}
  .sd-flowstep:last-child .sd-flowstep__line{display:none;}
  .sd-flowstep__t{font-size:13.5px;color:#E2E8FB;font-weight:600;}
  .sd-flowstep__s{font-size:12px;color:#8B93B8;margin-top:2px;line-height:1.4;}
  .sd-pilltag{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;}
  .sd-pilltag--you{background:rgba(201,146,62,.16);color:#F5C84C;}
  .sd-pilltag--us{background:rgba(43,143,255,.16);color:var(--sd-acc-2);}

  /* ── AI-попап: светлое стеклянное окно по центру + печатание ───────────── */
  /* AI-попап — то же матовое тёмное стекло, что у попапа задачи (.et) */
  .sd-ai{position:relative;width:100%;max-width:640px;height:min(760px,90vh);display:flex;flex-direction:column;overflow:hidden;
    border-radius:24px;color:#fff;
    background:rgba(13,20,46,.58);
    border:1px solid rgba(120,160,255,.28);
    -webkit-backdrop-filter:blur(34px) saturate(150%);backdrop-filter:blur(34px) saturate(150%);
    box-shadow:0 32px 84px rgba(6,12,36,.5),inset 0 1px 0 rgba(255,255,255,.14),inset 0 0 46px rgba(40,110,240,.1);
    animation:sdRise .26s cubic-bezier(.16,1,.3,1);}
  .sd-ai>*{position:relative;z-index:1;}
  /* шапка — без разделителей */
  .sd-ai__head{display:flex;align-items:center;gap:14px;padding:22px 22px 12px 24px;}
  .sd-ai__bot{width:48px;height:48px;flex:0 0 48px;border-radius:16px;display:grid;place-items:center;color:#fff;
    background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));
    box-shadow:inset 0 0 18px rgba(175,215,255,.7),inset 0 1px 0 rgba(255,255,255,.5);}
  .sd-ai__id{flex:1 1 auto;min-width:0;}
  .sd-ai__name{font-size:16.5px;font-weight:700;color:#fff;letter-spacing:-.3px;line-height:1.15;}
  .sd-ai__status{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;color:#8B93B8;margin-top:3px;}
  .sd-ai__status i{width:6px;height:6px;border-radius:50%;background:var(--sd-acc);box-shadow:0 0 8px rgba(43,143,255,.85);font-style:normal;}
  .sd-ai__x{width:36px;height:36px;flex:0 0 36px;border-radius:12px;display:grid;place-items:center;cursor:pointer;color:#8B93B8;
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);transition:background .15s,color .15s,transform .15s;}
  .sd-ai__x:hover{background:rgba(255,255,255,.1);color:#fff;transform:translateY(-1px);}
  .sd-ai__ctx{padding:6px 24px 0;font-size:12.5px;color:#8B93B8;}
  .sd-ai__ctx b{color:#9FCBFF;font-weight:600;}
  /* лента сообщений */
  .sd-ai__feed{flex:1 1 auto;overflow-y:auto;padding:18px 24px 10px;display:flex;flex-direction:column;gap:13px;}
  .sd-ai__feed::-webkit-scrollbar{width:0;}
  .sd-bub{max-width:80%;padding:13px 17px;border-radius:19px;font-size:14.5px;line-height:1.56;white-space:pre-wrap;word-wrap:break-word;}
  .sd-bub.ai{align-self:flex-start;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#DFE4F3;
    border-bottom-left-radius:7px;}
  .sd-bub.me{align-self:flex-end;background:linear-gradient(150deg,var(--sd-acc),var(--sd-acc-deep));color:#fff;
    border-bottom-right-radius:7px;box-shadow:inset 0 0 16px rgba(175,215,255,.32),inset 0 1px 0 rgba(255,255,255,.25);}
  .sd-bub__caret{display:inline-block;width:2px;height:1.02em;vertical-align:-2px;margin-left:1px;border-radius:1px;
    background:#9FCBFF;animation:sdCaret 1s steps(1) infinite;}
  @keyframes sdCaret{50%{opacity:0;}}
  /* индикатор «печатает» */
  .sd-ai__typing{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;padding:16px 18px;border-radius:19px;border-bottom-left-radius:7px;
    background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);}
  .sd-ai__typing i{width:7px;height:7px;border-radius:50%;background:var(--sd-acc);opacity:.45;animation:sdDot 1.25s ease-in-out infinite;}
  .sd-ai__typing i:nth-child(2){animation-delay:.16s;} .sd-ai__typing i:nth-child(3){animation-delay:.32s;}
  @keyframes sdDot{0%,60%,100%{transform:translateY(0);opacity:.4;}30%{transform:translateY(-4px);opacity:1;}}
  /* композер — одна цельная плашка-капсула, без разделителей */
  .sd-ai__compose{padding:14px 20px 22px;}
  .sd-ai__field{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);
    border-radius:22px;padding:7px 7px 7px 22px;transition:border-color .16s,background .16s;}
  .sd-ai__field:focus-within{border-color:rgba(43,143,255,.5);background:rgba(43,143,255,.05);}
  .sd-ai__input{flex:1 1 auto;background:0;border:0;outline:0;color:#fff;font-size:15px;font-family:inherit;padding:13px 0;}
  .sd-ai__input::placeholder{color:#8B93B8;}
  .sd-ai__send{width:46px;height:46px;flex:0 0 46px;border-radius:16px;border:0;cursor:pointer;color:#fff;display:grid;place-items:center;
    background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));
    box-shadow:inset 0 0 16px rgba(160,205,255,.6),inset 0 1px 0 rgba(255,255,255,.4);transition:transform .15s,opacity .15s;}
  .sd-ai__send:hover{transform:translateY(-1px);}
  .sd-ai__send:disabled{opacity:.4;cursor:default;transform:none;}

  /* центральная плавающая кнопка AI — единый вызов ассистента с любого экрана кабинета */
  .lr-aifab{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:900;
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

  /* FAQ-аккордеон */
  .sd-faq{display:flex;flex-direction:column;gap:8px;}
  .sd-faq__item{border:1px solid rgba(140,170,255,.14);border-radius:14px;overflow:hidden;background:rgba(255,255,255,.03);}
  .sd-faq__q{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;text-align:left;cursor:pointer;
    padding:14px 16px;background:0;border:0;color:#E2E8FB;font-size:13.5px;font-weight:600;}
  .sd-faq__q svg{color:#8B93B8;transition:transform .2s;flex:0 0 auto;}
  .sd-faq__item.open .sd-faq__q svg{transform:rotate(180deg);}
  .sd-faq__a{padding:0 16px 14px;font-size:13px;color:#A9B4DA;line-height:1.55;}
  .sd-faq--light .sd-faq__item{border-color:rgba(22,32,59,.1);background:rgba(255,255,255,.5);}
  .sd-faq--light .sd-faq__q{color:#15203B;}
  .sd-faq--light .sd-faq__q svg{color:var(--sd-ink-mute);}
  .sd-faq--light .sd-faq__a{color:var(--sd-ink-sub);}

  /* ── Адаптив ────────────────────────────────────────────────────────── */
  @media (max-width:980px){
    .sd-verdict{flex-basis:auto;width:100%;}
    .sd-status{flex-direction:column;align-items:flex-start;}
    .sd-status__r{align-self:center;}
    .sd-dgrid{grid-template-columns:1fr;}
    .sd-prods{grid-template-columns:1fr;}
    .sd-modal,.sd-ai{max-width:100%;}
    .sd-ai{height:90vh;}
    .sd-side{display:none;}
    .sd-wrap{padding:64px 16px 44px;}
    .sd-grid2{grid-template-columns:1fr;}
    .sd-botrow{grid-template-columns:1fr;}
    .sd-hero,.sd-phero{flex-direction:column;align-items:flex-start;}
    .sd-hero__main{max-width:100%;}
    .sd-hero__r{align-self:center;margin-top:6px;}
    .sd-help{flex-direction:column;align-items:flex-start;}
    .sd-stage__desc{max-width:100%;}
    .sd-top__hi{font-size:24px;}
    .sd-duo{grid-template-columns:1fr;}
    .sd-srow{grid-template-columns:1fr;}
    .sd-wrow{grid-template-columns:1fr;}
    .sd-hero2{grid-template-columns:1fr;min-height:0;gap:8px;margin-bottom:8px;}
    .sd-toprow-sec{margin-top:24px;}
    .sd-hero2__r{display:none;}
    .sd-hero2__h{font-size:38px;}
    .sd-stagebn2{min-height:0;padding:28px 26px;}
    .sd-stagebn2__c{max-width:100%;}
    .sd-stagebn2__img{opacity:.16;}
    .sd-aibn{min-height:200px;}
    .sd-shero__main{max-width:100%;}
    .sd-chero__main{max-width:64%;}
    .sd-chero__prog{right:5%;} .sd-chero__ring{width:150px;height:150px;}
    .sd-bigcard__c{left:16px;width:auto;}
  }

/* ============================================================================
   JPath — «Твой путь в Китай» · премиальная вертикальная рельса (Режим B, свет)
   Префикс .sd-jp-* — самодостаточно, старые .sd-rm не трогаем.
   Один якорь: раскрытый активный этап. Рельса — непрерывная ось фиксированной
   ширины 40px; узел active растет визуально (scale + halo), НЕ меняя ширину
   колонки, поэтому линия не дает уступа ни на одном стыке. Цель — золотая
   вершина на ascent-lit (нем якорь, не кликается).
   ============================================================================ */
  .sd-app{--sd-ink-faint:rgba(22,32,59,.30);}
  .sd-jp{display:flex;flex-direction:column;}

  .sd-jp-row{display:flex;gap:18px;align-items:stretch;}
  .sd-jp-row.clickable{cursor:pointer;}

  /* рельса фикс. 40px; непрерывная линия рисуется как ::before на всю высоту строки,
     по центру колонки -> ось не дрожит при разной высоте строк и любом состоянии */
  .sd-jp-rail{position:relative;display:flex;flex-direction:column;align-items:center;
    width:40px;flex:0 0 40px;}
  .sd-jp-rail::before{content:'';position:absolute;left:50%;top:34px;bottom:-2px;
    width:2.5px;transform:translateX(-50%);border-radius:99px;background:rgba(22,32,59,.10);}
  .sd-jp-rail.last::before{display:none;}
  .sd-jp-row.done .sd-jp-rail::before{background:var(--sd-jade);}
  .sd-jp-row.active .sd-jp-rail::before{background:var(--sd-acc-line);}

  /* узел-медальон */
  .sd-jp-node{position:relative;width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;z-index:1;}
  .sd-jp-node__face{position:relative;z-index:2;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;
    font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:-.02em;
    background:var(--sd-card);color:var(--sd-ink-mute);
    border:1.5px solid rgba(22,32,59,.10);
    box-shadow:0 2px 8px rgba(8,16,44,.06), inset 0 1px 0 rgba(255,255,255,.9);}
  .sd-jp-node__face svg{display:block;}
  .sd-jp-node__halo{position:absolute;inset:-7px;z-index:1;border-radius:50%;
    background:radial-gradient(circle,rgba(43,143,255,.45),rgba(43,143,255,0) 70%);
    animation:sdJpPulse 2.6s ease-in-out infinite;}
  @keyframes sdJpPulse{0%,100%{opacity:.5;transform:scale(.92);}50%{opacity:1;transform:scale(1.06);}}

  .sd-jp-row.done .sd-jp-node__face{color:#fff;border:0;
    background:linear-gradient(150deg,#3EE08F,#1C7E52);
    box-shadow:0 4px 12px rgba(28,126,82,.28), inset 0 1px 1px rgba(255,255,255,.55);}
  /* active: ширину колонки НЕ трогаем, медальон растет через scale + свечение */
  .sd-jp-row.active .sd-jp-node__face{color:#fff;border:0;transform:scale(1.12);
    background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));
    box-shadow:0 6px 18px rgba(32,115,230,.4), inset 0 0 12px rgba(175,215,255,.7), inset 0 1px 2px rgba(255,255,255,.6);}
  .sd-jp-row.locked .sd-jp-node__face{color:var(--sd-ink-faint);
    background:rgba(255,255,255,.5);border:1.5px solid rgba(22,32,59,.08);box-shadow:none;}
  /* вершина: золото только из токенов (звезда #F5C84C -> deep #C9923E) */
  .sd-jp-row.goal .sd-jp-node__face{color:#fff;border:0;
    background:linear-gradient(150deg,#F5C84C,#C9923E);
    box-shadow:0 6px 18px rgba(201,146,62,.4), inset 0 1px 2px rgba(255,255,255,.65);}

  /* свернутая строка этапа — тихая, без коробки; воздух плотный между свернутыми */
  .sd-jp-min{flex:1 1 auto;min-width:0;display:flex;align-items:flex-start;gap:16px;padding:8px 0 22px;}
  .sd-jp-row:last-child .sd-jp-min{padding-bottom:0;}
  .sd-jp-min__b{flex:1 1 auto;min-width:0;}
  .sd-jp-min__t{font-size:16px;font-weight:600;letter-spacing:-.02em;color:var(--sd-ink);line-height:1.25;text-wrap:balance;}
  .sd-jp-min__d{font-size:13px;font-weight:400;color:var(--sd-ink-sub);line-height:1.5;margin-top:4px;max-width:540px;}
  .sd-jp-row.done .sd-jp-min__t{color:var(--sd-ink-sub);}
  .sd-jp-row.locked .sd-jp-min__t{color:var(--sd-ink-mute);font-weight:500;}
  .sd-jp-row.clickable .sd-jp-min{transition:transform .18s cubic-bezier(.23,1,.32,1);}
  .sd-jp-row.clickable:hover .sd-jp-min{transform:translateX(3px);}

  /* строка-цель: гора ascent-lit как лит-фон, золото; НЕ кликается (нем якорь) */
  .sd-jp-row.goal .sd-jp-min{position:relative;overflow:hidden;border-radius:18px;padding:22px 24px;
    background-size:cover;background-position:center 28%;align-items:center;
    box-shadow:0 18px 44px rgba(8,16,44,.18), inset 0 1px 0 rgba(255,255,255,.14);}
  .sd-jp-min__scrim{position:absolute;inset:0;z-index:0;
    background:linear-gradient(105deg,rgba(8,14,40,.84) 0%,rgba(14,24,62,.5) 58%,rgba(28,38,86,.22) 100%);}
  .sd-jp-row.goal .sd-jp-min__b{position:relative;z-index:1;}
  .sd-jp-row.goal .sd-jp-min__t{color:#fff;font-size:18px;}
  .sd-jp-row.goal .sd-jp-min__d{color:rgba(255,255,255,.86);max-width:480px;}

  /* статус-тег справа свернутой строки — цветом/иконкой/типографикой, без пилюли */
  .sd-jp-tag{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;align-self:center;
    font-size:12.5px;font-weight:600;letter-spacing:-.01em;}
  .sd-jp-tag svg{display:block;}
  .sd-jp-tag--done{color:var(--sd-jade);}
  .sd-jp-tag--done svg{filter:drop-shadow(0 1px 3px rgba(46,160,110,.4));}
  .sd-jp-tag--wait{color:var(--sd-ink-faint);font-weight:500;}
  .sd-jp-tag--goal{position:relative;z-index:1;color:#F5C84C;font-weight:700;letter-spacing:.02em;}
  .sd-jp-tag--goal svg{color:#F5C84C;filter:drop-shadow(0 1px 4px rgba(201,146,62,.55));}

  /* активный этап — просторная стеклянная панель (единственный якорь);
     узел совмещен с eyebrow -> панели даем top-отступ, рельсе сдвигаем линию */
  .sd-jp-panel{flex:1 1 auto;min-width:0;margin:2px 0 40px;padding:24px 26px;border-radius:20px;
    background:rgba(255,255,255,.72);backdrop-filter:blur(20px) saturate(140%);-webkit-backdrop-filter:blur(20px) saturate(140%);
    border:1px solid rgba(43,143,255,.22);
    box-shadow:0 20px 48px rgba(8,16,44,.12), 0 2px 8px rgba(8,16,44,.05), inset 0 0 40px rgba(43,143,255,.06), inset 0 1px 0 rgba(255,255,255,.9);}
  .sd-jp-panel__head{display:flex;align-items:flex-start;gap:14px;}
  .sd-jp-panel__hc{flex:1 1 auto;min-width:0;}
  .sd-jp-eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sd-acc-deep);margin-bottom:7px;}
  .sd-jp-panel__t{font-size:21px;font-weight:700;letter-spacing:-.025em;line-height:1.15;color:var(--sd-ink);text-wrap:balance;}
  .sd-jp-panel__d{font-size:13.5px;font-weight:400;color:var(--sd-ink-sub);line-height:1.55;margin-top:7px;max-width:540px;}

  /* прогресс-блок */
  .sd-jp-prog{margin-top:20px;}
  .sd-jp-prog__top{margin-bottom:16px;}
  .sd-jp-prog__l{display:flex;align-items:baseline;justify-content:space-between;gap:12px;}
  .sd-jp-prog__lab{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--sd-ink-mute);}
  .sd-jp-prog__num{display:flex;align-items:baseline;gap:10px;}
  .sd-jp-prog__pct{font-size:28px;font-weight:700;line-height:1;letter-spacing:-.04em;color:var(--sd-acc-deep);font-variant-numeric:tabular-nums;}
  .sd-jp-prog__of{font-size:12.5px;font-weight:600;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
  .sd-jp-prog__bar{height:7px;border-radius:99px;background:rgba(43,143,255,.14);margin-top:12px;overflow:hidden;}
  .sd-jp-prog__bar i{display:block;height:100%;width:100%;transform-origin:left center;border-radius:99px;
    background:linear-gradient(90deg,var(--sd-acc-2),var(--sd-acc-deep));
    box-shadow:inset 0 0 8px rgba(255,255,255,.5);}

  /* под-шаги активного этапа */
  .sd-jp-steps{display:flex;flex-direction:column;gap:8px;}
  .sd-jp-sub{display:flex;gap:13px;align-items:center;padding:13px 15px;border-radius:14px;border:1px solid transparent;}
  .sd-jp-sub.current{cursor:pointer;background:rgba(255,255,255,.92);border-color:rgba(43,143,255,.4);
    box-shadow:inset 0 0 26px rgba(43,143,255,.1), 0 4px 14px rgba(8,16,44,.06);
    transition:transform .15s cubic-bezier(.23,1,.32,1);}
  .sd-jp-sub.current:hover{transform:translateY(-1px);}
  .sd-jp-sub.current.late{border-color:rgba(210,96,79,.42);box-shadow:inset 0 0 26px rgba(210,96,79,.12), 0 4px 14px rgba(8,16,44,.06);}

  .sd-jp-sub__node{width:23px;height:23px;flex:0 0 23px;border-radius:50%;display:grid;place-items:center;color:#fff;}
  .sd-jp-sub__node svg{display:block;}
  .sd-jp-sub.done .sd-jp-sub__node{background:linear-gradient(140deg,#3EE08F,#1C7E52);box-shadow:inset 0 1px 2px rgba(255,255,255,.5);}
  .sd-jp-sub.current .sd-jp-sub__node{background:transparent;border:2px solid var(--sd-acc-line);}
  .sd-jp-sub.current.late .sd-jp-sub__node{border-color:rgba(210,96,79,.5);}
  .sd-jp-sub.upcoming .sd-jp-sub__node{background:transparent;border:2px solid rgba(22,32,59,.18);}

  .sd-jp-sub__b{flex:1 1 auto;min-width:0;}
  .sd-jp-sub__t{display:flex;align-items:baseline;gap:7px;font-size:13.5px;font-weight:500;color:var(--sd-ink);line-height:1.3;}
  .sd-jp-sub__no{color:var(--sd-ink-mute);font-weight:700;font-variant-numeric:tabular-nums;flex:0 0 auto;}
  .sd-jp-sub.current .sd-jp-sub__t{color:var(--sd-acc-deep);font-weight:600;}
  .sd-jp-sub.current.late .sd-jp-sub__t{color:var(--sd-rose);}
  .sd-jp-sub.upcoming .sd-jp-sub__t{color:var(--sd-ink-mute);font-weight:400;}
  .sd-jp-sub.upcoming .sd-jp-sub__no{color:var(--sd-ink-faint);}
  .sd-jp-sub__meta{font-size:12px;font-weight:500;color:var(--sd-ink-mute);margin-top:3px;}
  .sd-jp-sub__meta.late{color:var(--sd-rose);}
  .sd-jp-sub__aside{flex:0 0 auto;display:inline-flex;align-items:center;}
  .sd-jp-sub__lock{color:var(--sd-ink-faint);display:inline-flex;}

  /* минимальный функциональный чип «Завершено» — типографикой, без пилюли */
  .sd-jp-mini{display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;}
  .sd-jp-mini svg{display:block;}
  .sd-jp-mini--done{color:var(--sd-jade);}
  .sd-jp-mini--done svg{filter:drop-shadow(0 1px 2px rgba(46,160,110,.35));}

  @media (prefers-reduced-motion: reduce){
    .sd-jp-node__halo{animation:none;}
    .sd-jp-row.clickable .sd-jp-min,.sd-jp-sub.current{transition:none;}
  }

  /* ── Футер «Атмосфера»: белый контент уходит в ночь ─────────────────────── */
  .sd-foot{position:relative;color:#EAF0FF;background:transparent;margin-top:28px;padding:40px 0 44px;}
  .sd-foot__block{position:absolute;inset:0;z-index:6;cursor:default;}
  .sd-foot__in{position:relative;z-index:1;max-width:1320px;margin:0 auto;padding:0 52px;}
  /* футер выравнивается по контенту каждой страницы: обучение (.lr-page) уже 1248/44 */
  .sd-scroll:has(.lr-page) .sd-foot__in{max-width:1248px;padding:0 44px;}
  .sd-foot__grid{display:grid;grid-template-columns:1.85fr 1fr 1fr 1.1fr;gap:40px;}
  .sd-foot__logo{height:clamp(42px,4.2vw,56px);width:auto;display:block;}
  .sd-foot__tag{margin-top:22px;font-size:13.5px;line-height:1.64;color:#8E9BC4;max-width:300px;}
  .sd-foot__col h4{font-size:14px;font-weight:600;color:#E8EDFC;letter-spacing:-.01em;margin:2px 0 13px;}
  .sd-foot__col a{display:block;width:fit-content;font-size:13.5px;color:#8B98C1;text-decoration:none;padding:6px 0;
    transition:color .15s ease,transform .15s ease;cursor:pointer;}
  .sd-foot__col a:hover{color:#fff;transform:translateX(3px);}
  .sd-foot__legal{margin-top:46px;padding-top:22px;border-top:1px solid rgba(150,178,255,.12);
    display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap;}
  .sd-foot__copy{font-size:12.5px;color:#6E7AA6;}
  .sd-foot__legal-links{display:flex;gap:22px;}
  .sd-foot__legal-links a{font-size:12.5px;color:#6E7AA6;text-decoration:none;transition:color .15s;cursor:pointer;}
  .sd-foot__legal-links a:hover{color:#C5D0F0;}
  @media (max-width:880px){
    /* мобильный футер — во всю ширину (внутренние поля обнуляем), бренд сверху
       на всю строку с читаемым тэглайном, ссылки аккуратной сеткой, воздух больше */
    .sd-foot{margin-top:36px;padding:46px 20px 30px;}
    .sd-foot__in,.sd-scroll:has(.lr-page) .sd-foot__in{max-width:100%;padding:0;}
    .sd-foot__grid{grid-template-columns:1fr 1fr;gap:34px 20px;}
    .sd-foot__brand{grid-column:1 / -1;}
    .sd-foot__tag{max-width:340px;margin-top:16px;font-size:14px;}
    .sd-foot__col h4{margin-bottom:11px;}
    .sd-foot__col a{padding:7px 0;font-size:14px;}
    .sd-foot__legal{margin-top:38px;flex-direction:column;align-items:flex-start;gap:14px;}
  }
  @media (max-width:360px){
    .sd-foot__grid{grid-template-columns:1fr;gap:26px;}
  }

  /* ─────────────────────────────────────────────────────────────────────────
     МОБИЛЬНАЯ ХРОМОТА (≤980): без «белого окна» и без верхней шапки. Навигация —
     push-drawer «как в X/Twitter»: контент СЖИМАЕТСЯ в скруглённую карту, уезжает
     вправо и наезжает поверх тёмного фона, слева открывается рейл. Управляется
     жестом (свайп от края / свайп по карте) + хаптик — вся логика трансформа в JS,
     CSS только раскладка. Всё скрыто на десктопе.
  ───────────────────────────────────────────────────────────────────────── */
  .sd-pushmenu,.sd-burger,.sd-pushcatch{display:none;}
  .sd-shift__in{display:contents;}

  @media (max-width:980px){
    /* каркас → страничный скролл; тёмный фон-подложка (карта наезжает поверх него) */
    .sd-app{display:block;height:auto;min-height:100dvh;overflow-x:clip;overflow-y:visible;padding:0;gap:0;background:#04081A;}
    .sd-main{height:auto;overflow-x:clip;overflow-y:visible;border-radius:0;border:0;box-shadow:none;}
    .sd-main--inflow{min-height:100dvh;}
    .sd-main--inflow .sd-wrap{padding-bottom:40px;}
    .sd-shift__in{display:block;}
    /* контент-карта — непрозрачный слой над меню; трансформ пишет JS (origin слева) */
    .sd-scroll,.sd-app > .sd-main{display:block;height:auto;overflow-x:clip;overflow-y:visible;
      position:relative;z-index:2;background:var(--sd-base);transform-origin:left center;will-change:transform;}
    /* активный drawer: карта = фикс. окно во весь экран (чтобы скругления были видны) */
    .sd-app.is-drawer > .sd-scroll,.sd-app.is-drawer > .sd-main{position:fixed;inset:0;height:100dvh;overflow:hidden;}
    .sd-app.is-drawer .sd-shift__in{will-change:transform;}

    /* push-меню: тёмный рейл, фикс. слева, ЗА картой (открывается её сдвигом) */
    .sd-pushmenu{display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:1;width:84vw;max-width:328px;
      background:linear-gradient(180deg,#0A1030 0%,#070C20 100%);padding-top:env(safe-area-inset-top,0px);opacity:.55;}
    .sd-pushmenu .sd-side{display:flex;width:100%;height:100%;flex:1 1 auto;padding:calc(16px + env(safe-area-inset-top,0px)) 14px 18px;}

    /* плавающая кнопка-бургер — тихое морозное стекло, слева сверху (без шапки) */
    .sd-burger{display:grid;place-items:center;position:fixed;top:calc(13px + env(safe-area-inset-top,0px));left:14px;z-index:6;
      width:44px;height:44px;border-radius:14px;cursor:pointer;color:#EAF0FF;
      background:rgba(9,15,38,.5);-webkit-backdrop-filter:blur(18px) saturate(150%);backdrop-filter:blur(18px) saturate(150%);
      border:1px solid rgba(150,180,255,.22);box-shadow:0 10px 26px rgba(4,8,24,.3),inset 0 1px 0 rgba(255,255,255,.14);
      transition:opacity .22s,transform .15s;}
    .sd-burger:active{transform:scale(.93);}
    .sd-app.is-drawer .sd-burger{opacity:0;pointer-events:none;}

    /* ловушка-закрытие — ВНУТРИ карты, тап по отодвинутому контенту закрывает */
    .sd-app.is-drawer .sd-pushcatch{display:block;position:absolute;inset:0;z-index:50;background:transparent;}

    /* AI-FAB прячем на время drawer */
    .sd-app.is-drawer .lr-aifab{opacity:0;pointer-events:none;}
  }
  `;

  if (!document.getElementById('student-shell-styles')) {
    const el = document.createElement('style');
    el.id = 'student-shell-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ДАННЫЕ ученика (демо — синхронно с моком/рефами; AI/бэк подменит позже)
  ───────────────────────────────────────────────────────────────────────── */
  const USER = { name: 'Дима Соколов', first: 'Дима', role: '11 класс', xp: 760, xpMax: 1000, lvl: 7, initials: 'Д' };

  // Навигация сайдбара. Пока только два живых раздела — Главная и Обучение;
  // остальные (задачи/документы/гранты/куратор/сообщество) временно убраны.
  const NAV = [
    { key: 'home',  label: 'Главная',  icon: Ic.Home, to: '/student' },
    { key: 'learn', label: 'Обучение', icon: Ic.Book, to: '/learn' },
  ];

  function onNav(it) {
    const l = (it.label || '').toLowerCase();
    if (l.indexOf('ai') >= 0 || l.indexOf('ассистент') >= 0 || l.indexOf('куратор') >= 0) {
      openChat(l.indexOf('куратор') >= 0
        ? { label: 'Куратор', hello: 'На связи! Опиши вопрос — куратор ответит здесь же, обычно в течение пары часов.' }
        : null);
      return;
    }
    // Пока готов только раздел «Обучение» (/learn) — остальная навигация в разработке (попап).
    if (it.to === '/learn') { nav(it.to); return; }
    openSoon(it.label);
  }

  // «Создать урок» (в сайдбаре): создаёт новый урок и открывает конструктор
  function createLesson() {
    const Store = window.ELessonStore;
    if (Store && Store.create) { Store.create().then(function (l) { nav(l && l.id ? '/learn/build/' + l.id : '/learn/build'); }).catch(function () { nav('/learn/build'); }); }
    else { nav('/learn/build'); }
  }

  /* ── Ring — кольцо прогресса (SVG) ──────────────────────────────────── */
  function Ring(props) {
    const { pct = 0, size = 132, label = 'готово' } = props;
    const sw = 12, r = (size - sw) / 2, c = 2 * Math.PI * r;
    const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return h('div', { className: 'sd-ring' + (props.onLight ? ' sd-ring--onlight' : ''), style: { width: size, height: size } },
      h('svg', { width: size, height: size },
        h('defs', null,
          h('linearGradient', { id: 'sdRingGrad', x1: '0', y1: '0', x2: '1', y2: '1' },
            h('stop', { offset: '0', stopColor: '#5CB4FF' }),
            h('stop', { offset: '1', stopColor: '#1E63C2' }))),
        h('circle', { className: 'sd-ring__track', cx: size / 2, cy: size / 2, r, fill: 'none', strokeWidth: sw }),
        h('circle', { className: 'sd-ring__fill', cx: size / 2, cy: size / 2, r, fill: 'none', strokeWidth: sw, strokeDasharray: c, strokeDashoffset: off })),
      h('div', { className: 'sd-ring__cap' },
        h('div', { className: 'sd-ring__pct sd-num' }, pct + '%'),
        h('div', { className: 'sd-ring__lab' }, label)));
  }

  /* ── Sidebar ───────────────────────────────────────────────────────── */
  // props: active (ключ нав). Опционально nav / user — чтобы ТОТ ЖЕ сайдбар
  // переиспользовать под роль родителя (см. parent-home.jsx). Дефолты — ученик,
  // поэтому старые вызовы Shell без этих пропсов ведут себя как раньше.
  function Sidebar(props) {
    const active = props.active;
    const navItems = props.nav || NAV;
    const user = props.user || USER;
    return h('aside', { className: 'sd-side' },
      h('div', { className: 'sd-brand' },
        h('img', { className: 'sd-brand__logo', src: 'funnel-assets/logo-dark.png', alt: 'ИСТСАЙД.РФ' })),
      h('button', { type: 'button', className: 'sd-newlesson', onClick: () => { createLesson(); if (props.onItemClick) props.onItemClick(); } },
        h('span', { className: 'sd-newlesson__ic' }, Ic.Plus ? h(Ic.Plus, { size: 16 }) : null),
        'Создать урок'),
      h('nav', { className: 'sd-nav' },
        navItems.map((it) => h('button', {
          key: it.key, type: 'button',
          className: 'sd-nav__item' + (it.key === active ? ' is-active' : ''),
          onClick: () => { onNav(it); if (props.onItemClick) props.onItemClick(); },
        },
          h('span', { className: 'sd-nav__ic' }, it.icon ? h(it.icon, { size: 19 }) : null),
          h('span', { className: 'sd-nav__lab' }, it.label),
          it.badge != null ? h('span', { className: 'sd-nav__badge sd-num' }, it.badge) : null,
          it.done ? h('span', { className: 'sd-nav__tick' }, Ic.Check ? h(Ic.Check, { size: 15 }) : '✓') : null))),
      // профиль в стиле anketa-dark: cutout-маскот выглядывает над плашкой,
      // тёплое приветствие + имя. У родителя (user.avatar) — инициалы + роль, без маскота.
      h('div', { className: 'sd-prof' + (user.avatar ? ' sd-prof--avatar' : '') },
        user.avatar
          ? h('div', { className: 'sd-prof__ava' }, user.initials || '')
          : h('div', { className: 'sd-prof__mascot' },
              h('img', { src: user.mascot || 'assets/mascot-cut.png', alt: '' })),
        h('div', { className: 'sd-prof__b' },
          h('div', { className: 'sd-prof__hi' }, user.hello || 'С возвращением,'),
          h('div', { className: 'sd-prof__name' }, user.first || user.name),
          user.avatar ? h('div', { className: 'sd-prof__role' }, user.role) : null)),
      h('button', { type: 'button', className: 'sd-help-mini', onClick: () => { onNav({ label: 'Куратор' }); if (props.onItemClick) props.onItemClick(); } },
        h('span', { className: 'sd-help-mini__ic' }, Ic.Chat ? h(Ic.Chat, { size: 15 }) : null),
        h('span', null, user.help || 'Нужна помощь? Напишите куратору')));
  }

  /* ── TopBar ────────────────────────────────────────────────────────── */
  function TopBar(props) {
    return h('div', { className: 'sd-top' + (props.hideHello ? ' sd-top--bare' : '') },
      props.hideHello ? h('div', null) : h('div', null,
        h('div', { className: 'sd-top__hi' }, props.title || ('Привет, ' + USER.first + '!')),
        h('div', { className: 'sd-top__sub' }, props.sub || 'Ты на шаг ближе к поступлению в Китай')),
      h('div', { className: 'sd-top__act' },
        h('button', { type: 'button', className: 'sd-iconbtn', 'aria-label': 'Уведомления' },
          Ic.Bell ? h(Ic.Bell, { size: 19 }) : null,
          h('span', { className: 'sd-iconbtn__dot' })),
        h('button', { type: 'button', className: 'sd-pillbtn', onClick: () => onNav({ label: 'Куратор' }) },
          Ic.Chat ? h(Ic.Chat, { size: 17 }) : null, 'Написать куратору')));
  }

  /* ── Попап-шина: любой экран зовет SH.openTask/openArticle/openChat ──── */
  const _pop = { set: null };
  function openPopup(p) { if (_pop.set) _pop.set(p); }
  const openChat = (ctx) => openPopup({ kind: 'chat', ctx: ctx || null });
  const openArticle = (a, all) => openPopup({ kind: 'article', data: a, all: all || (a && a.more) || null });
  const openTask = (t) => openPopup({ kind: 'task', data: t });
  const openSoon = (label, message) => openPopup({ kind: 'soon', label: label || null, message: message || null });
  const closePopup = () => openPopup(null);
  // AI-чат — единый канонический попап EUI.AssistantPopup (тот же, что на #/documents),
  // рендерится из PopupHost по SH.openChat(). Локальный Chat удалён, чтобы попап был один.

  /* ── Светлый редакторский «лист для чтения» (Режим B, стекло + блёр) ──────
     Бренд-небо в шапке мягко растворяется в молочном листе; колонка контента
     с выверенной типографикой: лид, подзаголовки, списки, врезка-совет, цитата.
     body — массив строк (простые абзацы) ИЛИ типизированных блоков
     {type:'lead'|'h'|'p'|'list'|'tip'|'quote'}.  ───────────────────────────── */
  function injectArticleCSS() {
    if (typeof document === 'undefined' || document.getElementById('es-article-css')) return;
    const el = document.createElement('style');
    el.id = 'es-article-css';
    el.textContent = `
    .ar{position:relative;width:100%;max-width:840px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;
      border-radius:24px;font-family:'SF Pro Display','Segoe UI',system-ui,-apple-system,sans-serif;color:#fff;
      background:rgba(13,20,46,.58);
      border:1px solid rgba(120,160,255,.28);
      box-shadow:0 32px 84px rgba(6,12,36,.5),inset 0 1px 0 rgba(255,255,255,.14),inset 0 0 46px rgba(40,110,240,.1);
      -webkit-backdrop-filter:blur(34px) saturate(150%);backdrop-filter:blur(34px) saturate(150%);
      animation:arRise .3s cubic-bezier(.16,1,.3,1);-webkit-font-smoothing:antialiased;}
    @keyframes arRise{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
    .ar *{box-sizing:border-box;}

    /* плавающая кнопка закрытия — тихая, поверх листа */
    .ar__x{position:absolute;z-index:6;top:20px;right:20px;width:40px;height:40px;border-radius:13px;display:flex;align-items:center;justify-content:center;cursor:pointer;
      color:#8B93B8;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);
      -webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);transition:transform .15s,background .15s,color .15s;}
    .ar__x:hover{background:rgba(255,255,255,.1);color:#fff;transform:translateY(-1px);}
    .ar__x:active{transform:scale(.94);}

    /* прокручиваемый лист */
    .ar__body{position:relative;z-index:1;flex:1 1 auto;overflow-y:auto;padding:0;}
    .ar__body::-webkit-scrollbar{width:10px;}
    .ar__body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:99px;border:3px solid transparent;background-clip:padding-box;}
    .ar__body::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.24);background-clip:padding-box;}

    /* ══ СИСТЕМА (прописана и соблюдается, всё по сетке design.md) ══════════
       Колонка: 648px, поля 64px — единая левая ось у всех блоков.
       РИТМ по вертикали (кратно 4):
         flow  24  — базовый шаг между блоками (owl-селектор ниже)
         sect  48  — перед новым подзаголовком (разрыв секции)
         tight 16  — первый блок сразу под подзаголовком
         + точечно: kick→title 12, title→картинка 32, картинка→текст 24
       ТИПОРАЗМЕРЫ (из шкалы design.md): title 32 / h 19 / lead 16 / body 15
         / table 14 / meta 13 / micro 11. */
    .ar__col{margin:0 auto;padding:56px 72px 64px;}
    .ar__col > * + *{margin-top:24px;}        /* flow */
    .ar__title{margin-top:12px;}              /* kick → title */
    .ar__title + *{margin-top:32px;}          /* title → картинка / первый блок */
    .ar__img + *{margin-top:24px;}            /* картинка → текст */
    .ar__h{margin-top:48px;}                  /* sect */
    .ar__h + *{margin-top:16px;}              /* tight под подзаголовком */
    /* Лист шире, но текст держим в читаемой мере (≈70 знаков) на той же левой
       оси; картинки, статы и таблица занимают всю ширину колонки. */
    .ar__kick,.ar__title,.ar__lead,.ar__h,.ar__p,.ar__list,.ar__quote{max-width:620px;}

    .ar__kick{display:flex;align-items:center;gap:9px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.42);}
    .ar__kick b{color:#9FCBFF;font-weight:700;}
    .ar__kick i{width:3px;height:3px;border-radius:99px;background:rgba(255,255,255,.3);}
    .ar__title{font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,'Onest',system-ui,sans-serif;
      font-weight:300;font-size:32px;letter-spacing:-.03em;line-height:1.14;color:#fff;text-wrap:balance;}
    .ar__img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:20px;background:#0A1538;
      border:1px solid rgba(255,255,255,.1);box-shadow:0 26px 64px rgba(6,12,36,.4),inset 0 1px 0 rgba(255,255,255,.14);}
    .ar__lead{font-size:16px;line-height:1.62;color:rgba(255,255,255,.74);font-weight:400;letter-spacing:-.003em;}
    .ar__h{font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,'Onest',system-ui,sans-serif;font-weight:600;font-size:19px;letter-spacing:-.015em;line-height:1.3;color:#fff;}
    .ar__p{font-size:15px;line-height:1.72;color:rgba(255,255,255,.74);}
    .ar__list{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px;}
    .ar__li{display:flex;gap:13px;align-items:flex-start;font-size:15px;line-height:1.55;color:rgba(255,255,255,.8);}
    .ar__li-mk{flex:0 0 24px;width:24px;height:24px;border-radius:8px;display:grid;place-items:center;color:#9FCBFF;margin-top:1px;
      background:rgba(43,143,255,.12);box-shadow:inset 0 0 0 1px rgba(43,143,255,.28);}

    /* метрики — тройка сапфировых плашек с фирменным внутренним белым свечением
       (та же подпись, что у главной кнопки .sd-btn--primary), числа табличные */
    .ar__stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
    .ar__stat{padding:17px 18px;border-radius:14px;background:var(--sd-acc-deep,#2073E6);
      border:1px solid rgba(43,111,224,.5);
      box-shadow:inset 0 0 28px rgba(175,215,255,.6),inset 0 0 8px rgba(255,255,255,.32),inset 0 1px 0 rgba(255,255,255,.5),0 12px 28px rgba(43,90,200,.22);}
    .ar__stat-v{font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,'Onest',system-ui,sans-serif;font-weight:500;font-size:22px;letter-spacing:-.02em;
      color:#fff;font-variant-numeric:tabular-nums;line-height:1.1;white-space:nowrap;text-shadow:0 1px 1px rgba(6,18,52,.22);}
    .ar__stat-l{font-size:11px;line-height:1.4;color:rgba(255,255,255,.82);margin-top:8px;}

    /* вторая картинка с подписью */
    .ar__fig img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;object-position:50% 32%;border-radius:16px;background:#0A1538;
      border:1px solid rgba(255,255,255,.1);box-shadow:0 20px 50px rgba(6,12,36,.4),inset 0 1px 0 rgba(255,255,255,.12);}
    .ar__fig figcaption{margin:12px auto 0;max-width:52ch;text-align:center;font-size:13px;line-height:1.5;color:rgba(255,255,255,.5);}

    /* таблица-сравнение — стеклянная, тонкие полупрозрачные разделители */
    .ar__tablewrap{border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 14px 36px rgba(6,12,36,.2);
      background:rgba(255,255,255,.03);}
    .ar__table{width:100%;border-collapse:collapse;font-size:14px;}
    .ar__table th{text-align:left;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.5);padding:13px 18px;}
    .ar__table thead tr{background:rgba(43,143,255,.1);}
    .ar__table th:nth-child(2){color:#9FCBFF;}
    .ar__table td{padding:13px 18px;border-top:1px solid rgba(255,255,255,.08);color:rgba(255,255,255,.78);vertical-align:top;line-height:1.45;}
    .ar__table td:first-child{font-weight:600;color:#fff;}
    .ar__table td:nth-child(2){color:#9FCBFF;font-weight:500;}
    .ar__table tbody tr:nth-child(odd){background:rgba(255,255,255,.03);}

    .ar__tip{display:flex;gap:14px;align-items:flex-start;padding:18px 20px;border-radius:12px;
      background:rgba(43,143,255,.08);border:1px solid rgba(43,143,255,.22);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.06);}
    .ar__tip-ic{flex:0 0 34px;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#fff;margin-top:1px;
      background:linear-gradient(150deg,#5CB4FF,#2073E6);box-shadow:inset 0 0 12px rgba(175,215,255,.6),0 5px 14px rgba(43,143,255,.28);}
    .ar__tip-tx{flex:1 1 auto;min-width:0;font-size:14.5px;line-height:1.6;color:rgba(255,255,255,.8);}
    .ar__quote{position:relative;padding:4px 0 4px 22px;border-left:3px solid #2B8FFF;
      font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,'Onest',system-ui,sans-serif;font-size:19px;font-weight:300;line-height:1.45;letter-spacing:-.015em;color:#EAF0FF;text-wrap:balance;}

    /* «Читать дальше» — карточки других материалов на всю ширину колонки */
    .ar__more{margin-top:60px;padding-top:34px;border-top:1px solid rgba(255,255,255,.09);}
    .ar__more-h{font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,'Onest',system-ui,sans-serif;font-weight:600;font-size:19px;letter-spacing:-.015em;color:#fff;margin-bottom:18px;}
    .ar__more-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}
    /* full-bleed карточка как на главной (#/student · .kb-c): картинка на весь размер + скрим + чип + заголовок + стеклянная стрелка */
    .ar__more-card{position:relative;overflow:hidden;cursor:pointer;text-align:left;font-family:inherit;padding:0;border:0;width:100%;
      aspect-ratio:1/1;border-radius:18px;background:#070E2A;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 14px 36px rgba(6,12,36,.22);
      transition:transform .2s cubic-bezier(.23,1,.32,1),box-shadow .2s;}
    .ar__more-card:hover{transform:translateY(-3px);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 24px 52px rgba(6,12,36,.42);}
    .ar__more-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.2,.7,.2,1);}
    .ar__more-card:hover .ar__more-img{transform:scale(1.05);}
    .ar__more-scrim{position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(180deg,rgba(5,10,28,.5) 0%,rgba(5,10,28,.06) 30%,rgba(5,10,28,.24) 56%,rgba(5,10,28,.86) 100%),rgba(5,10,28,.2);}
    .ar__more-b{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;justify-content:space-between;padding:15px 16px;}
    .ar__more-chip{align-self:flex-start;display:inline-flex;align-items:center;border-radius:8px;font-size:10.5px;font-weight:600;color:#fff;padding:4px 11px;
      -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.2);text-shadow:0 1px 2px rgba(4,9,28,.4);}
    .ar__more-foot{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;}
    .ar__more-ttl{font-size:15px;font-weight:600;color:#fff;letter-spacing:-.2px;line-height:1.26;text-wrap:balance;
      text-shadow:0 2px 14px rgba(4,9,28,.66),0 1px 3px rgba(4,9,28,.5);
      display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
    .ar__more-sq{flex:0 0 auto;display:grid;place-items:center;width:34px;height:34px;border-radius:11px;color:#fff;
      background:rgba(255,255,255,.13);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.2);
      transition:transform .18s,background .18s;}
    .ar__more-sq svg{transform:rotate(-45deg);transition:transform .2s;}
    .ar__more-card:hover .ar__more-sq{transform:translateY(-2px);background:rgba(255,255,255,.22);}
    .ar__more-card:hover .ar__more-sq svg{transform:rotate(-45deg) translate(1.5px,-1.5px);}

    @media (prefers-reduced-motion: reduce){ .ar{animation:none;} }
    @media (max-width:760px){
      .ar{max-width:100%;border-radius:22px;}
      .ar__col{padding:52px 22px 44px;}
      .ar__title{font-size:27px;}
      .ar__stats{grid-template-columns:1fr;}
      .ar__table{font-size:13px;}
      .ar__more-cards{grid-template-columns:1fr;}
    }`;
    document.head.appendChild(el);
  }

  function ArticleModal(props) {
    injectArticleCSS();
    const a = props.data || {};
    const all = props.all || [];
    const more = all.filter((x) => x && x !== a).slice(0, 3);
    const body = a.body && a.body.length ? a.body : [{ type: 'p', text: 'Скоро здесь будет полный текст статьи.' }];
    const check = Ic.Check ? h(Ic.Check, { size: 14, strokeWidth: 2.6 }) : '✓';
    const clock = (s) => Ic.Clock ? h(Ic.Clock, { size: s || 12 }) : null;
    const hexA = (hex, al) => { const n = parseInt((hex || '#2B8FFF').slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + al + ')'; };
    const block = (b, i) => {
      if (typeof b === 'string') return h('p', { className: 'ar__p', key: i }, b);
      switch (b.type) {
        case 'lead': return h('p', { className: 'ar__lead', key: i }, b.text);
        case 'h': return h('h2', { className: 'ar__h', key: i }, b.text);
        case 'list': return h('ul', { className: 'ar__list', key: i },
          (b.items || []).map((it, j) => h('li', { className: 'ar__li', key: j },
            h('span', { className: 'ar__li-mk' }, check), h('span', null, it))));
        case 'stats': return h('div', { className: 'ar__stats', key: i },
          (b.items || []).map((s, j) => h('div', { className: 'ar__stat', key: j },
            h('div', { className: 'ar__stat-v' }, s.v), h('div', { className: 'ar__stat-l' }, s.l))));
        case 'figure': return h('figure', { className: 'ar__fig', key: i },
          h('img', { src: b.src, alt: '' }), b.cap ? h('figcaption', null, b.cap) : null);
        case 'table': return h('div', { className: 'ar__tablewrap', key: i },
          h('table', { className: 'ar__table' },
            b.head ? h('thead', null, h('tr', null, b.head.map((c, j) => h('th', { key: j }, c)))) : null,
            h('tbody', null, (b.rows || []).map((r, j) => h('tr', { key: j }, r.map((c, k) => h('td', { key: k }, c)))))));
        case 'tip': return h('div', { className: 'ar__tip', key: i },
          h('span', { className: 'ar__tip-ic' }, Ic.Spark ? h(Ic.Spark, { size: 17 }) : '★'),
          h('div', { className: 'ar__tip-tx' }, b.text));
        case 'quote': return h('blockquote', { className: 'ar__quote', key: i }, b.text);
        default: return h('p', { className: 'ar__p', key: i }, b.text);
      }
    };
    return h('div', { className: 'ar', onMouseDown: (e) => e.stopPropagation(), role: 'dialog', 'aria-modal': 'true', 'aria-label': a.title || 'Статья' },
      h('button', { className: 'ar__x', onClick: closePopup, 'aria-label': 'Закрыть' }, Ic.Close ? h(Ic.Close, { size: 18 }) : '×'),
      h('div', { className: 'ar__body' },
        h('div', { className: 'ar__col' },
          h('div', { className: 'ar__kick' },
            h('b', null, a.cap || 'Статья')),
          h('h1', { className: 'ar__title' }, a.title),
          a.image ? h('img', { className: 'ar__img', src: a.image, alt: '' }) : null,
          body.map(block),
          more.length ? h('div', { className: 'ar__more' },
            h('div', { className: 'ar__more-h' }, 'Читать дальше'),
            h('div', { className: 'ar__more-cards' },
              more.map((m, i) => h('button', { key: i, type: 'button', className: 'ar__more-card', onClick: () => openArticle(m, all) },
                h('img', { className: 'ar__more-img', src: m.image, alt: '', style: { objectPosition: m.thumbPos || '50% 42%' } }),
                h('span', { className: 'ar__more-scrim' }),
                h('span', { className: 'ar__more-b' },
                  h('span', { className: 'ar__more-chip', style: { background: hexA(m.tint, .30), borderColor: hexA(m.tint, .44) } }, m.cap),
                  h('span', { className: 'ar__more-foot' },
                    h('span', { className: 'ar__more-ttl' }, m.title),
                    h('span', { className: 'ar__more-sq' }, Ic.ArrowRight ? h(Ic.ArrowRight, { size: 16 }) : '→'))))))) : null)));
  }

  function TaskModal(props) {
    const t = props.data || {};
    const flow = t.flow || [];
    return h('div', { className: 'sd-modal', onMouseDown: (e) => e.stopPropagation() },
      h('div', { className: 'sd-modal__head' },
        h('div', null,
          h('div', { className: 'sd-modal__cap' },
            h('span', { className: 'sd-pilltag sd-pilltag--' + (t.side === 'us' ? 'us' : 'you') }, t.side === 'us' ? 'Делаем мы' : 'От тебя')),
          h('div', { className: 'sd-modal__title' }, t.title)),
        h('button', { className: 'sd-x', onClick: closePopup, 'aria-label': 'Закрыть' }, Ic.Close ? h(Ic.Close, { size: 17 }) : '×')),
      h('div', { className: 'sd-modal__body' },
        t.desc ? h('p', null, t.desc) : null,
        t.time ? h('p', { style: { color: '#8B93B8' } }, 'Обычно занимает: ' + t.time) : null,
        flow.length ? h(R.Fragment, null,
          h('h4', null, 'Как это происходит'),
          h('div', { className: 'sd-flow' }, flow.map((f, i) => h('div', { key: i, className: 'sd-flowstep ' + (f.st || '') },
            h('span', { className: 'sd-flowstep__mk' }, f.st === 'done' ? (Ic.Check ? h(Ic.Check, { size: 13, strokeWidth: 2.6 }) : '✓') : (i + 1)),
            h('span', { className: 'sd-flowstep__line' }),
            h('div', null, h('div', { className: 'sd-flowstep__t' }, f.t), f.s ? h('div', { className: 'sd-flowstep__s' }, f.s) : null))))) : null),
      h('div', { className: 'sd-modal__foot' },
        t.cta ? h('button', { className: 'sd-btn sd-btn--primary', onClick: () => { closePopup(); (t.onCta || (() => nav('/documents')))(); } },
          t.cta, Ic.ArrowRight ? h(Ic.ArrowRight, { size: 16, className: 'sd-arr' }) : null) : null,
        t.result ? h('button', { className: 'sd-btn sd-btn--ghost' }, Ic.Download ? h(Ic.Download, { size: 16 }) : null, t.result) : null,
        h('button', { className: 'sd-btn sd-btn--ghost', onClick: () => { closePopup(); openChat({ label: t.title }); } },
          Ic.Spark ? h(Ic.Spark, { size: 16 }) : null, 'Спросить AI')));
  }

  function SoonModal(props) {
    return h('div', { className: 'sd-soon', onMouseDown: function (e) { e.stopPropagation(); } },
      h('div', { className: 'sd-soon__ic' }, Ic.Bolt ? h(Ic.Bolt, { size: 22 }) : null),
      props.label ? h('div', { className: 'sd-soon__eyebrow' }, props.label) : null,
      h('div', { className: 'sd-soon__t' }, 'Платформа в разработке'),
      h('div', { className: 'sd-soon__s' }, props.message || 'Мы ещё дорабатываем платформу — этот раздел включим позже. Пока доступен раздел «Обучение».'),
      h('button', { type: 'button', className: 'sd-soon__btn', onClick: props.close }, 'Понятно'));
  }

  function PopupHost() {
    const [p, setP] = useState(null);
    useEffect(() => { _pop.set = setP; return () => { _pop.set = null; }; }, []);
    if (!p) return null;
    // Единый канонический AI-попап (тот же, что на #/documents) — своя подложка esa-backdrop
    if (p.kind === 'chat') {
      const AP = window.EUI && window.EUI.AssistantPopup;
      if (!AP) return null;
      const M = window.EMock || {};
      const seeds = M.assistantSeeds7 || M.assistantSeeds || null;
      const stage = (p.ctx && p.ctx.label) ? { id: 'ctx', title: p.ctx.label } : null;
      return h(AP, { open: true, onClose: closePopup, stage: stage, seeds: seeds });
    }
    return h('div', { className: 'sd-ov sd-ov--center', onMouseDown: closePopup },
      p.kind === 'article' ? h(ArticleModal, { key: (p.data && p.data.title) || 'ar', data: p.data, all: p.all })
        : p.kind === 'task'
          ? (window.ESTaskModal
            ? h(window.ESTaskModal, { data: p.data, close: closePopup, openChat: openChat })
            : h(TaskModal, { data: p.data }))
          : p.kind === 'soon'
            ? h(SoonModal, { label: p.label, message: p.message, close: closePopup })
            : null);
  }

  /* ── Shell — каркас страницы ученика ───────────────────────────────── */
  // props: active (ключ нав), surface ('light'|'dark'), title, sub, children
  function Footer(props) {
    const goto = (to) => (e) => { e.preventDefault(); nav(to); };
    const col = (title, items) => h('div', { className: 'sd-foot__col' },
      h('h4', null, title),
      items.map((it, i) => h('a', { key: i, href: it.href || (it.to ? '#' + it.to : '#'), onClick: it.onClick || (it.to ? goto(it.to) : null) }, it.label)));
    return h('footer', { className: 'sd-foot' },
      h('div', { className: 'sd-foot__in' },
        h('div', { className: 'sd-foot__grid' },
          h('div', { className: 'sd-foot__brand' },
            h('img', { className: 'sd-foot__logo', src: 'funnel-assets/logo-dark.png', alt: 'ИСТСАЙД.РФ' }),
            h('p', { className: 'sd-foot__tag' }, 'Спокойный путь к поступлению в университет Китая — от диагностики до заселения, рядом на каждом шаге.')),
          col('Платформа', props.links || [
            { label: 'Главная', to: '/student' },
            { label: 'Мой путь', to: '/student' },
            { label: 'Документы', to: '/documents' },
            { label: 'Обучение', to: '/learn' }]),
          col('Поддержка', [
            { label: 'AI-наставник', onClick: (e) => { e.preventDefault(); openChat(); } },
            { label: 'База знаний', to: '/student' },
            { label: 'Частые вопросы', href: '#' },
            { label: 'Связаться с куратором', href: '#' }]),
          col('Контакты', [
            { label: 'Telegram', href: '#' },
            { label: 'Почта', href: 'mailto:hello@истсайд.рф' },
            { label: 'истсайд.рф', href: '#' }])),
        h('div', { className: 'sd-foot__legal' },
          h('div', { className: 'sd-foot__copy' }, '© 2026 ИСТСАЙД · Поступление в университеты Китая'),
          h('div', { className: 'sd-foot__legal-links' },
            h('a', { href: '#' }, 'Политика конфиденциальности'),
            h('a', { href: '#' }, 'Оферта')))),
      // футер пока некликабелен — оверлей перехватывает клики (платформа в разработке)
      h('div', { className: 'sd-foot__block', onClick: function () { openSoon(); }, 'aria-hidden': 'true' }));
  }

  function Shell(props) {
    const surface = props.surface === 'dark' ? 'dark' : 'light';
    const appRef = useRef(null);
    const ctrl = useRef(null);   // { open, close } — заполняется жестовым контроллером

    /* ── Жестовый push-drawer «как в X»: контент сжимается в скруглённую карту,
       уезжает вправо поверх тёмного фона, слева открывается рейл. Свайп от левого
       края открывает, свайп по карте — закрывает. Трансформ пишем инлайном (rAF-free),
       CSS только раскладка. Хаптик через navigator.vibrate (Android; iOS игнорит). ── */
    useEffect(() => {
      const app = appRef.current;
      if (!app || typeof window === 'undefined') return;
      const mq = window.matchMedia('(max-width: 980px)');
      const card = () => app.querySelector(':scope > .sd-scroll') || app.querySelector(':scope > .sd-main');
      const inner = () => app.querySelector('.sd-shift__in');
      const menuEl = () => app.querySelector('.sd-pushmenu');
      const MW = () => Math.min(window.innerWidth * 0.84, 328);
      let isOpen = false, active = false, dragging = false, axis = 0, sx = 0, sy = 0, scrollY = 0, prog = 0, vibed = false;
      const buzz = (ms) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

      function enter() {
        if (active) return;
        scrollY = window.scrollY || window.pageYOffset || 0;
        app.classList.add('is-drawer');
        const inn = inner(); if (inn) inn.style.transform = 'translateY(' + (-scrollY) + 'px)';
        document.body.style.overflow = 'hidden';
        active = true;
        render(prog, false);
      }
      function leave() {
        if (!active) return;
        app.classList.remove('is-drawer');
        const c = card(), inn = inner(), m = menuEl();
        if (c) { c.style.transition = ''; c.style.transform = ''; c.style.borderRadius = ''; c.style.boxShadow = ''; }
        if (inn) inn.style.transform = '';
        if (m) { m.style.transition = ''; m.style.transform = ''; m.style.opacity = ''; }
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
        active = false; prog = 0;
      }
      function render(p, anim) {
        const c = card(); if (!c) return;
        p = p < 0 ? 0 : p > 1 ? 1 : p; prog = p;
        const mw = MW(), m = menuEl();
        const isCard = c.classList.contains('sd-scroll');
        c.style.transition = anim ? 'transform .4s cubic-bezier(.32,.72,0,1),border-radius .4s,box-shadow .4s' : 'none';
        if (isCard) {
          c.style.transform = 'translateX(' + (p * mw).toFixed(1) + 'px) scale(' + (1 - p * 0.1).toFixed(3) + ')';
          c.style.borderRadius = (p * 30).toFixed(1) + 'px';
          c.style.boxShadow = p > 0.008 ? '-28px 0 80px rgba(2,6,20,' + (0.6 * p).toFixed(2) + ')' : 'none';
        } else {
          c.style.transform = 'translateX(' + (p * mw).toFixed(1) + 'px)';
          c.style.boxShadow = p > 0.008 ? '-20px 0 56px rgba(2,6,20,' + (0.6 * p).toFixed(2) + ')' : 'none';
        }
        if (m) {
          m.style.transition = anim ? 'transform .4s cubic-bezier(.32,.72,0,1),opacity .4s' : 'none';
          m.style.transform = 'translateX(' + (-(1 - p) * 24).toFixed(1) + 'px)';
          m.style.opacity = (0.55 + 0.45 * p).toFixed(3);
        }
      }
      function open() { if (!mq.matches) return; enter(); requestAnimationFrame(() => render(1, true)); isOpen = true; buzz(10); }
      function close() { if (!active) { isOpen = false; return; } render(0, true); isOpen = false; buzz(7); setTimeout(() => { if (!dragging && prog === 0) leave(); }, 420); }
      ctrl.current = { open: open, close: close };

      function onStart(e) {
        if (!mq.matches) return;
        const t = e.touches ? e.touches[0] : e; sx = t.clientX; sy = t.clientY; axis = 0; vibed = false;
        dragging = isOpen || sx <= 26;   // открыто — тянем откуда угодно; закрыто — только от левого края
      }
      function onMove(e) {
        if (!dragging || !mq.matches) return;
        const t = e.touches ? e.touches[0] : e; const dx = t.clientX - sx, dy = t.clientY - sy;
        if (!axis) {
          if (Math.abs(dx) > Math.abs(dy) + 4) { axis = 1; if (!isOpen) enter(); }
          else if (Math.abs(dy) > Math.abs(dx) + 4) { axis = -1; dragging = false; return; }
          else return;
        }
        if (axis !== 1) return;
        if (e.cancelable) e.preventDefault();
        let p = isOpen ? 1 + dx / MW() : dx / MW();
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        if (!vibed && ((isOpen && p < 0.5) || (!isOpen && p > 0.5))) { buzz(5); vibed = true; }
        render(p, false);
      }
      function onEnd() {
        if (!dragging) return; dragging = false;
        if (axis !== 1) return;
        if (prog > (isOpen ? 0.62 : 0.4)) { render(1, true); if (!isOpen) buzz(9); isOpen = true; }
        else { render(0, true); isOpen = false; setTimeout(() => { if (!dragging && prog === 0) leave(); }, 420); }
      }
      const pv = { passive: false };
      document.addEventListener('touchstart', onStart, { passive: true });
      document.addEventListener('touchmove', onMove, pv);
      document.addEventListener('touchend', onEnd, { passive: true });
      document.addEventListener('touchcancel', onEnd, { passive: true });
      const onHash = () => { if (isOpen) close(); };
      window.addEventListener('hashchange', onHash);
      return () => {
        document.removeEventListener('touchstart', onStart);
        document.removeEventListener('touchmove', onMove, pv);
        document.removeEventListener('touchend', onEnd);
        document.removeEventListener('touchcancel', onEnd);
        window.removeEventListener('hashchange', onHash);
        leave();
      };
    }, []);

    const closeMenu = () => { if (ctrl.current) ctrl.current.close(); };
    const inShift = (kids) => h('div', { className: 'sd-shift__in' }, kids);
    const catcher = h('div', { className: 'sd-pushcatch', onClick: closeMenu, 'aria-label': 'Закрыть меню' });
    const bar = props.hideTopBar ? null : h(TopBar, { title: props.title, sub: props.sub, hideHello: props.hideHello });

    return h('div', { className: 'sd-app', ref: appRef },
      h(Sidebar, { active: props.active, nav: props.nav, user: props.user }),
      // push-меню (мобилка): тёмный рейл под картой контента, открывается её сдвигом
      h('aside', { className: 'sd-pushmenu' },
        h(Sidebar, { active: props.active, nav: props.nav, user: props.user, onItemClick: closeMenu })),
      // плавающая кнопка-бургер (без шапки) — только мобилка
      h('button', { type: 'button', className: 'sd-burger', onClick: () => ctrl.current && ctrl.current.open(), 'aria-label': 'Открыть меню' },
        Ic.Menu ? h(Ic.Menu, { size: 21 }) : '≡'),
      props.footer
        ? h('div', { className: 'sd-scroll' },
            inShift([
              h('div', { key: 'm', className: 'sd-main sd-main--' + surface + ' sd-main--inflow' },
                h('div', { className: 'sd-wrap' }, bar, props.children)),
              h(Footer, { key: 'f', links: props.footerLinks })]),
            catcher)
        : h('div', { className: 'sd-main sd-main--' + surface },
            inShift(h('div', { className: 'sd-wrap' }, bar, props.children)),
            catcher),
      h('button', { type: 'button', className: 'lr-aifab', onClick: () => openChat(), 'aria-label': 'Спросить AI-наставника' },
        h('span', { className: 'lr-aifab__ic' },
          h('span', { className: 'lr-aifab__pulse', 'aria-hidden': 'true' }),
          h('svg', { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' },
            h('path', { d: 'M11 2.5 L13 11 L21.5 13 L13 15 L11 23.5 L9 15 L0.5 13 L9 11 Z' }),
            h('path', { d: 'M19 3 L19.6 4.9 L21.5 5.5 L19.6 6.1 L19 8 L18.4 6.1 L16.5 5.5 L18.4 4.9 Z' }))),
        h('span', { className: 'lr-aifab__tx' },
          h('span', { className: 'lr-aifab__t' }, 'AI-наставник'),
          h('span', { className: 'lr-aifab__s' }, 'Спросить о чём угодно'))),
      h(PopupHost, null));
  }

  window.ESStudentShell = { Shell, Sidebar, TopBar, Ring, NAV, USER, onNav, openChat, openArticle, openTask, openSoon, closePopup };
})();
