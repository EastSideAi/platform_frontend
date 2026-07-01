/* ============================================================================
   EastSide — Урок-тренажёр ученика (window.EScreens.LearnLesson · #/learn/lesson)
   ----------------------------------------------------------------------------
   Учебная поверхность с тихой геймификацией. Режим B (светлый, ясный), но с
   энергией: сапфир — единственный CTA, золотая звезда — только «цель/успех»,
   нефрит — верно, роза — мягко неверно. Геймификация: прогресс-тропа, серия
   (combo), сердечки, начисление XP с всплытием. Никакой кислоты и мишуры.

   Урок берётся из window.ELessons.load() — это РОВНО тот урок, который собрал
   преподаватель в конструкторе (learn-build). Рендер каждого блока — общий
   компонент window.ELessonUI.BlockView, поэтому «как видит ученик» в конструкторе
   и реальный урок — буквально один и тот же код.
   ============================================================================ */
(function () {
  'use strict';
  const R = window.React || React;
  const { createElement: h, useState, useEffect, useRef } = R;
  const Ic = window.EIcons || {};
  const L = window.ELessons;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  /* ─────────────────────────────────────────────────────────────────────────
     СТИЛИ. .lx- — общий рендер блока (его шарит и конструктор). .lp- — плеер.
  ───────────────────────────────────────────────────────────────────────── */
  const CSS = `
  .lx-scope{
    --lx-acc:#2073E6; --lx-acc-2:#5CB4FF; --lx-acc-deep:#1E63C2; --lx-acc-ink:#1763C8;
    --lx-acc-soft:rgba(43,143,255,.10); --lx-acc-line:rgba(43,143,255,.40);
    --lx-ink:#15203B; --lx-ink-sub:rgba(21,32,59,.62); --lx-ink-mute:rgba(21,32,59,.44);
    --lx-jade:#1C7E52; --lx-jade-soft:#E2F4EA; --lx-jade-line:rgba(46,160,110,.5);
    --lx-rose:#B23B2A; --lx-rose-soft:#FBE7E2; --lx-rose-line:rgba(210,96,79,.5);
    --lx-gold:#E2A52E;
    font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;
  }
  .lx-scope *{box-sizing:border-box;}
  .lx-prompt{font-weight:600;font-size:21px;letter-spacing:-.4px;line-height:1.22;color:var(--lx-ink);text-wrap:balance;}
  /* шапка задания — пилюля-бейдж с иконкой (цвет + характер, не голый синий текст) */
  .lx-kick{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:var(--lx-acc-ink);
    background:var(--lx-acc-soft);padding:6px 12px 6px 10px;border-radius:99px;margin-bottom:16px;}
  .lx-kick svg{display:inline-flex;}

  /* ── Теория ─────────────────────────────────────────────────────────────── */
  .lx-theory__t{font-weight:600;font-size:22px;letter-spacing:-.4px;line-height:1.2;color:var(--lx-ink);text-wrap:balance;}
  .lx-theory__b{font-size:16px;line-height:1.62;color:var(--lx-ink-sub);margin-top:13px;max-width:60ch;}
  .lx-voc{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:24px;}
  .lx-voc__c{position:relative;overflow:hidden;border-radius:18px;padding:16px 18px;
    background:linear-gradient(155deg,rgba(255,255,255,.92),rgba(244,247,255,.6));
    border:1px solid rgba(43,111,224,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.92),inset 0 0 26px rgba(43,143,255,.05);}
  .lx-voc__top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
  .lx-voc__py{font-size:13px;font-weight:600;color:var(--lx-ink-mute);font-variant-numeric:tabular-nums;letter-spacing:.2px;}
  .lx-voc__audio{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;cursor:pointer;color:#fff;
    background:linear-gradient(150deg,#5CB4FF,#1E63C2);border:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 6px 14px -6px rgba(32,115,230,.5);transition:transform .14s,box-shadow .14s,opacity .14s;}
  .lx-voc__audio:hover{transform:translateY(-1px) scale(1.04);}
  .lx-voc__audio:active{transform:scale(.96);}
  .lx-voc__audio.is-busy{opacity:.55;animation:lx-pulse .8s ease-in-out infinite;}
  @keyframes lx-pulse{0%,100%{opacity:.55;}50%{opacity:.95;}}
  .lx-voc__hz{font-size:38px;font-weight:600;color:var(--lx-acc-deep);letter-spacing:1px;line-height:1;margin-top:8px;}
  .lx-voc__ru{font-size:15.5px;font-weight:600;color:var(--lx-ink);margin-top:5px;}

  /* ── Варианты (choice / gap) ────────────────────────────────────────────── */
  .lx-opts{display:flex;flex-direction:column;gap:10px;margin-top:22px;}
  .lx-opts--wrap{flex-direction:row;flex-wrap:wrap;gap:10px;margin-top:18px;}
  .lx-opt{position:relative;display:flex;align-items:center;gap:14px;width:100%;text-align:left;cursor:pointer;
    padding:15px 16px;border-radius:16px;background:#fff;border:1.5px solid rgba(22,32,59,.09);
    box-shadow:0 1px 2px rgba(18,28,58,.03);color:var(--lx-ink);
    transition:transform .15s cubic-bezier(.23,1,.32,1),border-color .15s,background .15s,box-shadow .15s;}
  .lx-opts--wrap .lx-opt{width:auto;flex:0 0 auto;}
  .lx-opt:hover:not(.is-locked){border-color:var(--lx-acc-line);transform:translateY(-2px);box-shadow:0 12px 26px -16px rgba(32,90,200,.4);}
  .lx-opt:hover:not(.is-locked):not(.is-sel) .lx-opt__mk{color:var(--lx-acc-deep);background:var(--lx-acc-soft);}
  .lx-opt:active:not(.is-locked){transform:translateY(0) scale(.99);}
  .lx-opt__mk{flex:0 0 34px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:700;
    color:var(--lx-ink-mute);background:rgba(22,32,59,.05);transition:all .15s;}
  .lx-opt__t{flex:1 1 auto;font-size:17px;font-weight:600;letter-spacing:-.2px;}
  .lx-opt__fb{flex:0 0 auto;display:none;}
  .lx-opt.is-sel{border-color:var(--lx-acc);background:var(--lx-acc-soft);
    box-shadow:inset 0 0 0 1px var(--lx-acc),0 10px 24px -12px rgba(43,143,255,.4);}
  .lx-opt.is-sel .lx-opt__mk{color:#fff;background:var(--lx-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.3);}
  .lx-opt.is-sel .lx-opt__t{color:var(--lx-acc-deep);}
  .lx-opt.is-locked{cursor:default;}
  .lx-opt.is-correct{border-color:var(--lx-jade-line);background:var(--lx-jade-soft);}
  .lx-opt.is-correct .lx-opt__mk{color:#fff;background:var(--lx-jade);box-shadow:none;}
  .lx-opt.is-correct .lx-opt__t{color:var(--lx-jade);}
  .lx-opt.is-correct .lx-opt__fb{display:inline-flex;color:var(--lx-jade);}
  .lx-opt.is-wrong{border-color:var(--lx-rose-line);background:var(--lx-rose-soft);animation:lx-shake .32s cubic-bezier(.36,.07,.19,.97);}
  .lx-opt.is-wrong .lx-opt__mk{color:#fff;background:var(--lx-rose);box-shadow:none;}
  .lx-opt.is-wrong .lx-opt__t{color:var(--lx-rose);}
  .lx-opt.is-wrong .lx-opt__fb{display:inline-flex;color:var(--lx-rose);}
  .lx-opt.is-dim{opacity:.5;}
  @keyframes lx-shake{10%,90%{transform:translateX(-1px);}20%,80%{transform:translateX(2px);}30%,50%,70%{transform:translateX(-4px);}40%,60%{transform:translateX(4px);}}

  /* ── Пропуск ────────────────────────────────────────────────────────────── */
  .lx-gapline{margin-top:22px;font-size:21px;font-weight:600;letter-spacing:-.3px;line-height:1.7;color:var(--lx-ink);}
  .lx-slot{display:inline-flex;align-items:center;justify-content:center;min-width:96px;height:38px;padding:0 14px;margin:0 4px;vertical-align:middle;
    border-radius:11px;border:1.5px dashed var(--lx-acc-line);background:var(--lx-acc-soft);color:var(--lx-acc-ink);font-weight:700;
    transition:all .15s;}
  .lx-slot.filled{border-style:solid;background:linear-gradient(150deg,rgba(255,255,255,.95),rgba(238,244,255,.8));box-shadow:inset 0 0 16px rgba(43,143,255,.1);}
  .lx-slot.ok{border-color:var(--lx-jade-line);background:var(--lx-jade-soft);color:var(--lx-jade);}
  .lx-slot.bad{border-color:var(--lx-rose-line);background:var(--lx-rose-soft);color:var(--lx-rose);}

  /* ── Пары (match) ───────────────────────────────────────────────────────── */
  .lx-match{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;margin-top:22px;}
  .lx-mcol{display:flex;flex-direction:column;gap:10px;}
  .lx-mcol__h{align-self:flex-start;font-size:11px;font-weight:700;color:var(--lx-acc-ink);background:var(--lx-acc-soft);padding:4px 10px;border-radius:99px;margin-bottom:2px;}
  .lx-mi{position:relative;display:flex;align-items:center;gap:10px;cursor:pointer;padding:13px 14px;border-radius:14px;min-height:54px;
    background:#fff;border:1.5px solid rgba(22,32,59,.09);box-shadow:0 1px 2px rgba(18,28,58,.03);
    transition:transform .15s cubic-bezier(.23,1,.32,1),border-color .15s,background .15s,box-shadow .15s;}
  .lx-mi:hover:not(.is-locked){border-color:var(--lx-acc-line);transform:translateY(-2px);box-shadow:0 12px 26px -16px rgba(32,90,200,.4);}
  .lx-mi__t{flex:1 1 auto;font-size:16px;font-weight:600;color:var(--lx-ink);letter-spacing:-.2px;}
  .lx-mcol--l .lx-mi{justify-content:center;background:linear-gradient(180deg,rgba(43,143,255,.06),rgba(43,143,255,.02));}
  .lx-mcol--l .lx-mi__t{flex:0 0 auto;font-family:var(--le-display,inherit);font-size:24px;color:var(--lx-acc-deep);letter-spacing:1px;}
  .lx-mi__b{flex:0 0 auto;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11.5px;font-weight:800;
    color:#fff;font-variant-numeric:tabular-nums;opacity:0;transform:scale(.6);transition:opacity .15s,transform .18s cubic-bezier(.23,1,.32,1);}
  .lx-mcol--l .lx-mi__b{position:absolute;top:8px;right:8px;}
  .lx-mi.has-b .lx-mi__b{opacity:1;transform:none;}
  .lx-mi.is-active{border-color:var(--lx-acc-line);background:linear-gradient(150deg,rgba(255,255,255,.96),rgba(238,244,255,.86));
    box-shadow:inset 0 0 0 1px var(--lx-acc-line),inset 0 0 26px rgba(43,143,255,.12);}
  .lx-mi.is-matched{border-color:var(--lx-acc-line);background:rgba(238,244,255,.6);}
  .lx-mi.is-locked{cursor:default;}
  .lx-mi.is-correct{border-color:var(--lx-jade-line);background:var(--lx-jade-soft);}
  .lx-mi.is-correct .lx-mi__b{background:var(--lx-jade);}
  .lx-mi.is-wrong{border-color:var(--lx-rose-line);background:var(--lx-rose-soft);}
  .lx-mi.is-wrong .lx-mi__b{background:var(--lx-rose);}
  /* бейдж-связка по умолчанию сапфировый */
  .lx-mi__b{background:var(--lx-acc-deep);}

  /* ── Собери предложение (order) ─────────────────────────────────────────── */
  .lx-order__line{min-height:66px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:22px;padding:15px 18px;border-radius:16px;
    border:1.5px dashed var(--lx-acc-line);background:var(--lx-acc-soft);transition:border-color .15s,background .15s;}
  .lx-order__line.is-empty{justify-content:center;}
  .lx-order__ph{font-size:14px;font-weight:600;color:var(--lx-ink-mute);}
  .lx-order__bank{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;min-height:48px;align-items:center;}
  .lx-order__done{font-size:13.5px;font-weight:600;color:var(--lx-jade);}
  .lx-tok{display:inline-flex;align-items:center;cursor:pointer;font-family:inherit;font-size:20px;font-weight:600;letter-spacing:.5px;color:var(--lx-ink);
    padding:10px 16px;border-radius:12px;background:rgba(255,255,255,.85);border:1.5px solid rgba(22,32,59,.12);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 4px 12px rgba(43,90,200,.06);transition:transform .14s cubic-bezier(.23,1,.32,1),border-color .14s,background .14s;}
  .lx-tok:hover:not(.is-locked){transform:translateY(-1px);border-color:var(--lx-acc-line);}
  .lx-tok--line{background:linear-gradient(150deg,rgba(255,255,255,.96),rgba(238,244,255,.86));border-color:var(--lx-acc-line);color:var(--lx-acc-deep);}
  .lx-tok.is-correct{border-color:var(--lx-jade-line);background:var(--lx-jade-soft);color:var(--lx-jade);}
  .lx-tok.is-wrong{border-color:var(--lx-rose-line);background:var(--lx-rose-soft);color:var(--lx-rose);}
  .lx-tok.is-locked{cursor:default;}

  /* ── Ввод ответа (type) ─────────────────────────────────────────────────── */
  .lx-type__field{margin-top:22px;}
  .lx-type__in{width:100%;font-family:inherit;font-size:22px;font-weight:600;letter-spacing:-.2px;color:var(--lx-ink);text-align:center;
    padding:18px 20px;border-radius:16px;background:rgba(255,255,255,.8);border:1.5px solid rgba(22,32,59,.12);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:border-color .15s,box-shadow .15s;}
  .lx-type__in::placeholder{color:var(--lx-ink-mute);font-weight:500;}
  .lx-type__in:focus{outline:0;border-color:var(--lx-acc-line);box-shadow:inset 0 0 0 1px var(--lx-acc-line),0 0 0 4px rgba(43,143,255,.1);}
  .lx-type__in.ok{border-color:var(--lx-jade-line);background:var(--lx-jade-soft);color:var(--lx-jade);}
  .lx-type__in.bad{border-color:var(--lx-rose-line);background:var(--lx-rose-soft);color:var(--lx-rose);}
  .lx-type__ans{margin-top:14px;text-align:center;font-size:15px;color:var(--lx-ink-sub);}
  .lx-type__ans b{color:var(--lx-jade);font-weight:700;}

  /* ── Выбор тона (tone) ──────────────────────────────────────────────────── */
  .lx-tone__card{margin-top:22px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:24px;border-radius:20px;
    background:linear-gradient(155deg,rgba(255,255,255,.85),rgba(244,247,255,.6));border:1px solid rgba(43,111,224,.16);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 0 30px rgba(43,143,255,.05);}
  .lx-tone__hz{font-size:72px;font-weight:600;line-height:1;color:var(--lx-acc-deep);letter-spacing:1px;}
  .lx-tone__pin{font-size:18px;font-weight:700;color:var(--lx-ink-sub);}
  .lx-tone__opts{display:grid;grid-template-columns:repeat(2,1fr);gap:11px;margin-top:18px;}
  .lx-tone__b{display:flex;align-items:center;gap:13px;cursor:pointer;font-family:inherit;text-align:left;padding:14px 18px;border-radius:14px;
    background:rgba(255,255,255,.7);border:1.5px solid rgba(22,32,59,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);color:var(--lx-ink);
    transition:transform .15s cubic-bezier(.23,1,.32,1),border-color .15s,background .15s;}
  .lx-tone__b:hover:not(.is-locked){transform:translateY(-1px);border-color:var(--lx-acc-line);}
  .lx-tone__top{display:flex;align-items:center;justify-content:center;gap:14px;}
  .lx-tone__mark{flex:0 0 42px;width:42px;display:inline-flex;align-items:center;justify-content:center;color:var(--lx-acc-deep);}
  .lx-tone__mark svg{display:block;width:38px;height:20px;}
  .lx-tone__n{font-weight:800;color:var(--lx-ink);font-variant-numeric:tabular-nums;margin-right:5px;}
  .lx-tone__name{flex:1 1 auto;font-size:13.5px;font-weight:600;color:var(--lx-ink-sub);}
  .lx-tone__b.is-sel{border-color:var(--lx-acc-line);background:linear-gradient(150deg,rgba(255,255,255,.96),rgba(238,244,255,.86));box-shadow:inset 0 0 26px rgba(43,143,255,.1);}
  .lx-tone__b.is-correct{border-color:var(--lx-jade-line);background:var(--lx-jade-soft);}
  .lx-tone__b.is-correct .lx-tone__mark,.lx-tone__b.is-correct .lx-tone__name{color:var(--lx-jade);}
  .lx-tone__b.is-wrong{border-color:var(--lx-rose-line);background:var(--lx-rose-soft);}
  .lx-tone__b.is-wrong .lx-tone__mark,.lx-tone__b.is-wrong .lx-tone__name{color:var(--lx-rose);}
  .lx-tone__b.is-dim{opacity:.5;}
  .lx-tone__b.is-locked{cursor:default;}

  /* ── Разбор (объяснение после проверки) ─────────────────────────────────── */
  .lx-explain{display:flex;gap:12px;align-items:flex-start;margin-top:20px;padding:15px 17px;border-radius:14px;font-size:14.5px;line-height:1.55;}
  .lx-explain__ic{flex:0 0 auto;display:inline-flex;margin-top:1px;}
  .lx-explain.ok{background:var(--lx-jade-soft);color:var(--lx-jade);}
  .lx-explain.bad{background:var(--lx-rose-soft);color:var(--lx-rose);}

  /* ═══════════════ СТРАНИЦА УРОКА · Режим B — вайб «Главной»/«Пути»: светлое стекло ═══════════════
     Правила владельца (§6.4): НЕТ разрядке букв, НЕТ серым мелким uppercase-eyebrow'ам
     (заголовки нормальные, тёмные), НЕТ выпуклым градиентам (плоско, прозрачно, стекло).
     Якорь — кастомный светлый плеер. Модули/уроки справа — чистая тропа. Тест — попап. */
  .sd-wrap:has(.le-root){max-width:1240px;padding:38px 52px 96px;}
  @media (max-width:680px){.sd-wrap:has(.le-root){padding:18px 18px 48px;}}

  /* .lt-modal — попап-тест рендерится сиблингом .le-root, поэтому токены ОБЯЗАНЫ
     объявляться и на нём, иначе var(--le-*) внутри модалки не резолвится
     (кнопки становятся прозрачными — «невидимая белая кнопка»). */
  .le-root,.le-study,.lt-modal{
    --le-display:-apple-system,'SF Pro Display','Onest',system-ui,sans-serif;
    --le-acc:#2B8FFF; --le-acc-2:#5CB4FF; --le-acc-deep:#2073E6; --le-acc-ink:#1763C8;
    --le-acc-soft:rgba(43,143,255,.09); --le-acc-line:rgba(43,143,255,.36);
    --le-ink:#16203B; --le-ink-sub:rgba(22,32,59,.62); --le-ink-mute:rgba(22,32,59,.44); --le-ink-faint:rgba(22,32,59,.28);
    --le-jade:#1C7E52; --le-jade-soft:#E2F4EA; --le-gold:#E2A52E; --le-rose:#B23B2A;
    --le-line:rgba(22,32,59,.08); --le-line-soft:rgba(22,32,59,.05); --le-line-strong:rgba(22,32,59,.14);
    --le-card:rgba(255,255,255,.5); --le-hi:inset 0 1px 0 rgba(255,255,255,.85); --le-cbord:rgba(255,255,255,.85);
    --le-sel:inset 0 0 30px rgba(43,143,255,.26),inset 0 0 7px rgba(43,143,255,.14); --le-sh:0 0 0 0 rgba(0,0,0,0);
    font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;color:var(--le-ink);-webkit-font-smoothing:antialiased;
  }
  /* чистая светлая поверхность — как «Главная»/кабинет: без аврор и свечений.
     Фон даёт сам светлый shell, страница — только чистые белые карточки. */
  .le-root{position:relative;}
  .le-root *{box-sizing:border-box;}
  .le-head,.le-grid{position:relative;z-index:1;}

  /* хедер — чистая крошка + белая пилюля-навигация, без тяжёлого бара (по референсу) */
  .le-head{display:flex;align-items:center;gap:16px;margin:0 0 24px;}
  .le-crumb{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:9px;font-size:13px;font-weight:600;}
  .le-crumb a,.le-crumb button{font:inherit;color:var(--le-ink-mute);background:0;border:0;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:7px;transition:color .15s;white-space:nowrap;}
  .le-crumb a:hover,.le-crumb button:hover{color:var(--le-acc-deep);}
  .le-crumb__home{color:var(--le-acc-deep);}
  .le-crumb__sep{color:var(--le-ink-faint);flex:0 0 auto;}
  .le-crumb__cur{color:var(--le-ink);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
  /* пилюля-навигация «‹ Урок N / M ›» */
  .le-switch{flex:0 0 auto;display:flex;align-items:center;gap:2px;padding:4px;border-radius:99px;background:rgba(255,255,255,.78);
    border:1px solid var(--le-line);box-shadow:0 8px 20px -14px rgba(12,26,64,.3),inset 0 1px 0 rgba(255,255,255,.75);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);}
  .le-switch__lab{font-size:13px;font-weight:600;color:var(--le-ink);font-variant-numeric:tabular-nums;white-space:nowrap;padding:0 8px;}
  .le-nav{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;cursor:pointer;color:var(--le-ink-sub);
    background:0;border:0;transition:color .15s,background .15s,opacity .15s;}
  .le-nav:hover:not(:disabled){color:var(--le-acc-deep);background:var(--le-acc-soft);}
  .le-nav:disabled{opacity:.3;cursor:not-allowed;}

  .le-grid{display:grid;grid-template-columns:minmax(0,1fr) 364px;gap:38px;align-items:start;margin-top:30px;}
  .le-main{min-width:0;}
  .le-rail{position:sticky;top:24px;display:flex;flex-direction:column;gap:20px;}

  /* титул — «Урок N» крупно и уверенно + пилюля модуля + описание (крафт «Главной») */
  .le-titlerow{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
  .le-h1{font-family:var(--le-display);font-weight:800;font-size:42px;letter-spacing:-.032em;line-height:1.02;color:var(--le-ink);margin:0;text-wrap:balance;}
  .le-modpill{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--le-ink);background:#fff;
    border:1px solid var(--le-line);border-radius:99px;padding:9px 16px;box-shadow:var(--le-sh);}
  .le-modpill svg{color:var(--le-acc-deep);flex:0 0 auto;}
  .le-sub{font-size:17px;line-height:1.55;color:var(--le-ink-sub);margin-top:14px;max-width:62ch;font-weight:400;}

  /* ── ПЛЕЕР — единственный якорь: реальное превью + кастомная панель (вайб ютуба, но чисто) ── */
  .le-player{position:relative;margin-top:30px;border-radius:22px;overflow:hidden;aspect-ratio:16/9;background:#111A2E;
    border:1px solid var(--le-line);box-shadow:0 30px 64px -34px rgba(12,26,64,.42);}
  /* пустое состояние — НЕ тёмная дыра с фейковой кнопкой play, а тихая заглушка:
     честно говорит «видео ещё не добавлено», ничего не имитирует и не кликается */
  .le-player--empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
    background:linear-gradient(180deg,rgba(43,143,255,.06),rgba(43,143,255,.02));
    border:1.5px dashed var(--le-line-soft);box-shadow:none;}
  .le-player__empty-ic{width:42px;height:42px;border-radius:13px;display:grid;place-items:center;color:var(--le-acc-deep);background:var(--le-acc-soft);}
  .le-player__empty-t{font-size:13px;font-weight:600;color:var(--le-ink-mute);}
  .le-player__frame{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;}
  /* база постера — тихий тёмный слейт (без свечений). Обычно перекрыта фото
     превью; показывается только если у урока нет картинки вообще. */
  .le-poster{position:absolute;inset:0;cursor:pointer;display:block;overflow:hidden;border:0;width:100%;height:100%;padding:0;
    background:linear-gradient(160deg,#1B2540 0%,#141C31 100%);}
  .le-poster__img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
  /* виньетка: тёмный слева (под наложенный титул) + низ (под панель управления) */
  .le-poster__scrim{position:absolute;inset:0;background:
    linear-gradient(90deg,rgba(6,10,22,.62) 0%,rgba(6,10,22,.2) 40%,transparent 66%),
    linear-gradient(180deg,rgba(6,8,16,.26) 0%,transparent 22%,transparent 58%,rgba(4,8,20,.8) 100%);}
  .le-poster__sky{position:absolute;inset:0;background:linear-gradient(160deg,#1B2540 0%,#141C31 100%);}
  .le-poster__cap{position:absolute;left:18px;top:16px;z-index:3;display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:#fff;
    background:rgba(10,16,32,.44);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.18);padding:6px 12px 6px 10px;border-radius:99px;}
  .le-poster__cap svg{opacity:.95;}
  /* наложенный титул урока слева-по центру: название + иероглифы + пиньинь.
     Ширина ограничена левой зоной — не наезжает на центральную кнопку play. */
  .le-vtitle{position:absolute;left:32px;top:50%;transform:translateY(-52%);z-index:3;max-width:39%;pointer-events:none;}
  .le-vtitle__t{display:block;font-family:var(--le-display);font-weight:700;font-size:25px;letter-spacing:-.02em;line-height:1.1;color:#fff;text-shadow:0 2px 22px rgba(0,0,0,.5);text-wrap:balance;}
  .le-vtitle__hz{display:block;font-family:var(--le-display);font-size:21px;font-weight:500;color:rgba(255,255,255,.96);margin-top:12px;letter-spacing:1px;text-shadow:0 2px 16px rgba(0,0,0,.5);}
  .le-vtitle__py{display:block;font-size:14.5px;font-weight:500;color:rgba(255,255,255,.8);margin-top:5px;text-shadow:0 1px 12px rgba(0,0,0,.5);}
  /* кнопка play — чистый светлый круг с сапфировым треугольником */
  .le-play{position:absolute;left:50%;top:47%;transform:translate(-50%,-50%);z-index:3;width:72px;height:72px;border-radius:50%;display:grid;place-items:center;color:var(--le-acc-deep);
    background:rgba(255,255,255,.97);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
    border:0;box-shadow:0 12px 38px -8px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,1),inset 0 0 0 1px rgba(22,32,59,.04);
    transition:transform .16s cubic-bezier(.23,1,.32,1),box-shadow .15s;}
  .le-poster:hover .le-play{transform:translate(-50%,-50%) scale(1.08);box-shadow:0 16px 46px -8px rgba(0,0,0,.6);}
  .le-play svg{margin-left:3px;}
  /* кастомная панель управления — интегрирована в низ кадра (не пилюля), вайб ютуба */
  .le-vctrl{position:absolute;left:0;right:0;bottom:0;z-index:3;display:flex;align-items:center;gap:16px;padding:0 18px 16px;pointer-events:none;}
  .le-vctrl__pl{flex:0 0 auto;display:inline-flex;color:#fff;}
  .le-vctrl__t{flex:0 0 auto;font-size:12.5px;font-weight:600;color:#fff;font-variant-numeric:tabular-nums;}
  .le-vctrl__t em{font-style:normal;color:rgba(255,255,255,.55);}
  .le-vctrl__track{flex:1 1 auto;position:relative;height:14px;display:flex;align-items:center;}
  .le-vctrl__track::before{content:'';position:absolute;left:0;right:0;top:50%;height:4px;border-radius:99px;background:rgba(255,255,255,.28);transform:translateY(-50%);}
  .le-vctrl__fill{position:absolute;left:0;top:50%;height:4px;border-radius:99px;background:var(--le-acc);transform:translateY(-50%);}
  .le-vctrl__knob{position:absolute;top:50%;width:13px;height:13px;border-radius:50%;background:#fff;box-shadow:0 1px 5px rgba(0,0,0,.45);transform:translate(-50%,-50%);}
  .le-vctrl__sp{flex:0 0 auto;display:inline-flex;gap:15px;align-items:center;}
  .le-vctrl__ic{flex:0 0 auto;display:inline-flex;color:rgba(255,255,255,.9);}

  /* ══ GlassVideoPlayer — реальный плеер файла на жидком стекле (Apple TV / iOS
     «Liquid Glass» референс): трио круглых frosted-кнопок (±10с + play/pause),
     нижняя стеклянная панель со скрабером. Контролы тихо гаснут во время игры,
     возвращаются по движению мыши/тапу. ══ */
  .le-gv{position:relative;width:100%;height:100%;background:#08080A;cursor:pointer;overflow:hidden;}
  .le-gv__frame{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#08080A;display:block;}
  .le-gv__tap{position:absolute;inset:0;z-index:1;}
  .le-gv__title{position:absolute;left:16px;top:14px;z-index:3;font-size:13px;font-weight:600;color:#fff;
    text-shadow:0 1px 6px rgba(0,0,0,.45);opacity:0;transition:opacity .25s;pointer-events:none;}
  .le-gv.is-shown .le-gv__title{opacity:.95;}

  .le-gv__trio{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;gap:30px;
    opacity:0;transition:opacity .28s cubic-bezier(.23,1,.32,1);pointer-events:none;}
  .le-gv.is-shown .le-gv__trio{opacity:1;pointer-events:auto;}
  /* рецепт «жидкого стекла»: тёмное полупрозрачное наполнение + сильный блюр +
     тонкая светлая обводка + внутренний блик сверху — без заливки цветом */
  .le-gv__glass{display:grid;place-items:center;cursor:pointer;color:#fff;border-radius:50%;
    background:rgba(8,9,14,.42);-webkit-backdrop-filter:blur(16px) saturate(1.5);backdrop-filter:blur(16px) saturate(1.5);
    border:1.5px solid rgba(255,255,255,.55);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 10px 26px -12px rgba(0,0,0,.55);
    transition:transform .14s cubic-bezier(.23,1,.32,1),background .15s;}
  .le-gv__glass:hover{background:rgba(8,9,14,.58);}
  .le-gv__glass:active{transform:scale(.92);}
  .le-gv__glass--side{width:46px;height:46px;}
  .le-gv__glass--main{width:68px;height:68px;}
  .le-gv__glass--main svg{margin-left:2px;}
  .le-gv.is-playing .le-gv__glass--main svg{margin-left:0;}

  .le-gv__bar{position:absolute;left:12px;right:12px;bottom:12px;z-index:2;display:flex;align-items:center;gap:11px;height:42px;padding:0 14px;border-radius:14px;
    background:rgba(16,22,40,.42);-webkit-backdrop-filter:blur(24px) saturate(1.7);backdrop-filter:blur(24px) saturate(1.7);
    border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 12px 28px -16px rgba(2,8,28,.55);
    opacity:0;transform:translateY(6px);transition:opacity .25s,transform .25s;pointer-events:none;}
  .le-gv.is-shown .le-gv__bar{opacity:1;transform:none;pointer-events:auto;}
  .le-gv__t{flex:0 0 auto;font-size:11.5px;font-weight:600;color:rgba(255,255,255,.92);font-variant-numeric:tabular-nums;}
  .le-gv__t--mute{color:rgba(255,255,255,.55);}
  .le-gv__track{position:relative;flex:1 1 auto;height:16px;display:flex;align-items:center;cursor:pointer;}
  .le-gv__track::before{content:'';position:absolute;left:0;right:0;top:50%;height:4px;border-radius:99px;background:rgba(255,255,255,.22);transform:translateY(-50%);}
  .le-gv__track-fill{position:absolute;left:0;top:50%;height:4px;border-radius:99px;background:#fff;transform:translateY(-50%);pointer-events:none;}
  .le-gv__track-dot{position:absolute;top:50%;width:11px;height:11px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:translate(-50%,-50%);pointer-events:none;}
  .le-gv__ic{flex:0 0 auto;width:26px;height:26px;display:grid;place-items:center;color:rgba(255,255,255,.86);background:0;border:0;cursor:pointer;border-radius:7px;transition:color .14s,background .14s;}
  .le-gv__ic:hover{color:#fff;background:rgba(255,255,255,.12);}

  /* ── КОНСПЕКТ — раскрытая панель, крупно и чисто ──────────────────────────── */
  .le-digest{margin-top:30px;border-radius:22px;border:1px solid var(--le-cbord);background:var(--le-card);box-shadow:var(--le-hi);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);overflow:hidden;}
  .le-digest__bar{width:100%;display:flex;align-items:center;gap:16px;padding:19px 24px;cursor:pointer;background:0;border:0;font:inherit;text-align:left;color:var(--le-ink);transition:background .15s;}
  .le-digest__bar:hover{background:rgba(43,143,255,.02);}
  .le-digest__ti{flex:1 1 auto;min-width:0;}
  .le-digest__t{font-family:var(--le-display);font-weight:500;font-size:19px;letter-spacing:-.012em;color:var(--le-ink);}
  .le-digest__h{font-size:13px;font-weight:500;color:var(--le-ink-mute);margin-top:4px;line-height:1.45;font-variant-numeric:tabular-nums;}
  .le-digest__chev{flex:0 0 auto;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:var(--le-ink-mute);border:1px solid var(--le-line);transition:transform .25s cubic-bezier(.23,1,.32,1),color .15s,border-color .15s;}
  .le-digest__bar:hover .le-digest__chev{color:var(--le-acc-deep);border-color:var(--le-acc-line);}
  .le-digest.open .le-digest__chev{transform:rotate(180deg);}
  .le-digest__body{padding:6px 28px 28px;border-top:1px solid var(--le-line-soft);}
  /* шапка конспекта — статичная (иконка + название), без сворачивания (по референсу) */
  .le-digest__hd{display:flex;align-items:center;gap:13px;padding:24px 28px 0;}
  .le-digest__hd-ic{flex:0 0 40px;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:var(--le-acc-deep);background:var(--le-acc-soft);}
  .le-digest__hd-t{font-family:var(--le-display);font-weight:700;font-size:21px;letter-spacing:-.016em;color:var(--le-ink);}
  /* табы конспекта — сегмент-контрол */
  .le-dtabs{display:flex;gap:8px;flex-wrap:wrap;padding:20px 28px 0;}
  .le-dtab{font-family:inherit;font-size:13.5px;font-weight:600;color:var(--le-ink-sub);background:rgba(255,255,255,.5);border:1px solid var(--le-line);
    padding:9px 16px;border-radius:99px;cursor:pointer;transition:color .15s,background .15s,border-color .15s;white-space:nowrap;}
  .le-dtab:hover{color:var(--le-acc-deep);border-color:var(--le-acc-line);}
  .le-dtab.is-on{color:var(--le-acc-deep);background:var(--le-acc-soft);border-color:var(--le-acc-line);box-shadow:inset 0 0 0 1px rgba(43,143,255,.14);}
  .le-dpane{padding:24px 28px 26px;animation:leReveal .22s cubic-bezier(.23,1,.32,1);}
  .le-dpane__h{font-family:var(--le-display);font-size:20px;font-weight:700;letter-spacing:-.016em;color:var(--le-ink);margin:0 0 16px;}
  /* двухколоночная таблица слов (по референсу) */
  .le-vt{display:grid;grid-template-columns:1fr 1fr;gap:0 44px;}
  .le-vt__col{display:flex;flex-direction:column;}
  .le-vt__row{display:grid;grid-template-columns:32px 62px 1fr;align-items:baseline;gap:12px;padding:10px 2px;border-bottom:1px solid var(--le-line-soft);}
  .le-vt__row:last-child{border-bottom:0;}
  .le-vt__hz{font-family:var(--le-display);font-size:21px;font-weight:600;color:var(--le-acc-deep);line-height:1;}
  .le-vt__py{font-size:13.5px;font-weight:500;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
  .le-vt__ru{font-size:15px;font-weight:500;color:var(--le-ink);}
  /* нижний ряд конспекта: скачать PDF + круглая кнопка */
  .le-dfoot{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:6px 26px 22px;padding-top:18px;border-top:1px solid var(--le-line-soft);}
  .le-dfoot__lnk{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--le-ink-sub);background:0;border:0;cursor:pointer;font-family:inherit;transition:color .15s;}
  .le-dfoot__lnk:hover{color:var(--le-acc-deep);}
  .le-dfoot__dl{flex:0 0 40px;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:var(--le-acc-deep);background:var(--le-acc-soft);border:1px solid var(--le-acc-line);cursor:pointer;transition:background .15s,transform .15s;}
  .le-dfoot__dl:hover{background:rgba(43,143,255,.14);transform:translateY(-1px);}
  /* пустое видео в узком превью — не занимает пол-экрана, слим-заглушка */
  .le-study.is-compact .le-player--empty{aspect-ratio:auto;min-height:112px;margin-top:22px;border-radius:18px;}
  .le-study.is-compact .le-player__empty-ic{width:36px;height:36px;border-radius:11px;}
  .le-study.is-compact .le-digest__hd{padding:16px 18px 0;gap:11px;}
  .le-study.is-compact .le-digest__hd-ic{flex-basis:32px;width:32px;height:32px;border-radius:10px;}
  .le-study.is-compact .le-digest__hd-t{font-size:16.5px;}
  /* в узком телефоне табы не переносим на вторую строку — тихая горизонтальная лента */
  .le-study.is-compact .le-dtabs{padding:12px 18px 0;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
  .le-study.is-compact .le-dtabs::-webkit-scrollbar{height:0;}
  .le-study.is-compact .le-dtab{flex:0 0 auto;padding:8px 14px;font-size:12.5px;}
  .le-study.is-compact .le-dpane{padding:16px 18px 18px;}
  .le-study.is-compact .le-dpane__h{font-size:16.5px;margin-bottom:12px;}
  /* таблица слов: в узком превью в ОДНУ колонку — иначе пиньинь/перевод обрезаются */
  .le-study.is-compact .le-vt{grid-template-columns:1fr;gap:0;}
  .le-study.is-compact .le-vt__row{grid-template-columns:30px minmax(46px,auto) minmax(0,1fr);gap:11px;padding:9px 2px;}
  .le-study.is-compact .le-vt__hz{font-size:19px;}
  .le-study.is-compact .le-vt__ru{min-width:0;overflow-wrap:break-word;}
  .le-study.is-compact .le-dfoot{margin:0 18px 16px;}
  @media (max-width:680px){.le-vt{grid-template-columns:1fr;gap:0;}}

  .le-aims{margin:22px 0 6px;}
  .le-aims__l{font-family:var(--le-display);font-size:17px;font-weight:500;color:var(--le-ink);letter-spacing:-.014em;}
  .le-aims__list{margin-top:15px;display:flex;flex-direction:column;gap:11px;}
  .le-aims__i{display:flex;align-items:center;gap:14px;font-size:16px;font-weight:450;color:var(--le-ink);line-height:1.45;padding:11px 14px;border-radius:13px;background:rgba(255,255,255,.5);border:1px solid var(--le-line);box-shadow:var(--le-hi);}
  .le-aims__c{flex:0 0 26px;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:var(--le-acc-deep);background:var(--le-acc-soft);border:1px solid var(--le-acc-line);}

  .le-note-h{font-family:var(--le-display);font-weight:600;font-size:19px;letter-spacing:-.018em;color:var(--le-ink);margin:32px 0 0;}
  .le-note-p{font-size:16px;line-height:1.66;color:var(--le-ink);margin:10px 0 0;font-weight:400;white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;}
  .le-note-img{margin:20px 0 0;}
  .le-note-img figure{margin:0;border-radius:14px;overflow:hidden;border:1px solid var(--le-line);}
  .le-note-img img{display:block;width:100%;height:auto;}
  .le-note-img figcaption{font-size:12.5px;color:var(--le-ink-mute);margin-top:9px;}

/* ── ДОКУМЕНТ (lesson.doc) — рендерится в конспекте, когда есть doc[] ──────────
   Слово — одна карточка в потоке (не сетка), список/цитата/аудио/выноски/раздел. */
.le-doc{display:flex;flex-direction:column;gap:2px;}
.le-hanzi{cursor:pointer;border-radius:5px;padding:1px 2px;margin:0 -1px;transition:background .12s,color .12s;}
.le-hanzi:hover{background:rgba(43,143,255,.14);color:var(--le-acc-deep);}
.le-doc .le-note-h{margin-top:26px;}
.le-doc .le-note-h:first-child{margin-top:0;}
.le-doc b{font-weight:700;color:var(--le-ink);}
.le-doc i{font-style:italic;}
.le-doc-quote{position:relative;margin:18px 0 4px;padding:16px 20px 16px 50px;background:linear-gradient(180deg,rgba(43,143,255,.07),rgba(43,143,255,.035));border-radius:15px;border:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 0 30px rgba(43,143,255,.05);font-family:var(--le-display);font-size:17px;font-weight:500;font-style:normal;line-height:1.5;color:var(--le-ink);}
.le-doc-quote::before{content:'\\201C';position:absolute;left:14px;top:7px;font-family:Georgia,'Times New Roman',serif;font-size:46px;line-height:1;color:rgba(32,115,230,.3);}
.le-doc-list{margin:12px 0 4px;padding:0 0 0 4px;list-style:none;display:flex;flex-direction:column;gap:8px;}
.le-doc-list li{position:relative;padding-left:22px;font-size:16px;line-height:1.6;color:var(--le-ink);overflow-wrap:break-word;word-break:break-word;}
.le-doc-list li::before{content:'';position:absolute;left:4px;top:11px;width:6px;height:6px;border-radius:50%;background:var(--le-acc);}
.le-doc-list--ol{counter-reset:ldoc;}
.le-doc-list--ol li{padding-left:26px;counter-increment:ldoc;}
.le-doc-list--ol li::before{content:counter(ldoc);left:0;top:1px;width:auto;height:auto;background:0;color:var(--le-acc-deep);font-weight:700;font-size:14px;font-variant-numeric:tabular-nums;}
.le-doc-word{margin:16px 0 4px;}
.le-doc-word .lx-voc{grid-template-columns:1fr;margin-top:0;}
/* НОВОЕ СЛОВО — не плоская строка-глоссарий, а словарная карточка: тайл-иероглиф
   на сапфировой вуали + стопка «пиньинь / перевод» + светящаяся озвучка. Тот же
   язык, что у карточек словаря в тренажёре (.lx-voc) — конструктор и урок = семья. */
.le-dword{display:flex;align-items:center;gap:15px;max-width:540px;margin:15px 0 7px;padding:11px 13px 11px 11px;border-radius:17px;
  background:linear-gradient(155deg,rgba(255,255,255,.9),rgba(243,247,255,.62));border:1px solid rgba(43,111,224,.16);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.92),inset 0 0 30px rgba(43,143,255,.05),0 1px 2px rgba(18,28,58,.03);
  transition:border-color .15s,box-shadow .15s,transform .15s;}
.le-dword:hover{border-color:var(--le-acc-line);transform:translateY(-1px);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 30px rgba(43,143,255,.09),0 14px 30px -20px rgba(18,28,58,.24);}
.le-dword__hz{flex:0 0 auto;display:grid;place-items:center;min-width:62px;height:62px;padding:0 16px;border-radius:15px;
  font-family:var(--le-display);font-size:31px;font-weight:600;color:var(--le-acc-deep);letter-spacing:1px;line-height:1;
  background:var(--le-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,143,255,.1),inset 0 0 20px rgba(43,143,255,.06);}
.le-dword__b{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px;}
.le-dword__py{font-size:13.5px;font-weight:500;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;letter-spacing:.2px;}
.le-dword__ru{font-size:16px;font-weight:600;color:var(--le-ink);letter-spacing:-.01em;line-height:1.25;overflow-wrap:break-word;}
.le-dword__say{flex:0 0 auto;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;cursor:pointer;color:#fff;
  background:linear-gradient(150deg,#5CB4FF,#1E63C2);border:0;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.32),0 8px 16px -8px rgba(32,115,230,.55);transition:transform .14s,box-shadow .14s;}
.le-dword__say:hover{transform:translateY(-1px) scale(1.04);}
.le-dword__say:active{transform:scale(.95);}
/* аудио в конспекте — виджет в духе системного плеера iOS: квадратная плашка
   play/pause слева (как обложка трека), заголовок + скрабер на всю ширину
   справа, тайминги «прошло / осталось» по краям дорожки. Без стекла — плоская
   бумажная поверхность, премиальность даёт масштаб и компоновка, не блюр. */
.le-doc-audio{display:flex;align-items:center;gap:15px;max-width:100%;margin:14px 0 4px;padding:14px 16px;border-radius:16px;background:var(--le-card);border:1px solid var(--le-line);box-shadow:var(--le-hi);transition:border-color .15s;}
.le-doc-audio.is-playing{border-color:var(--le-acc-line);}
.le-doc-audio__tile{flex:0 0 50px;width:50px;height:50px;border-radius:15px;display:grid;place-items:center;cursor:pointer;color:#fff;background:var(--le-acc-deep);border:0;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 10px 22px -12px rgba(32,115,230,.55);transition:transform .12s,background .15s;}
.le-doc-audio__tile svg{margin-left:2px;}
.le-doc-audio.is-playing .le-doc-audio__tile svg{margin-left:0;}
.le-doc-audio__tile:hover:not(:disabled){background:var(--le-acc-2);}
.le-doc-audio__tile:active:not(:disabled){transform:scale(.94);}
.le-doc-audio__tile:disabled{opacity:.35;cursor:default;}
.le-doc-audio__b{flex:1 1 auto;min-width:0;}
.le-doc-audio__t{font-size:14.5px;font-weight:600;color:var(--le-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.le-doc-audio__track{position:relative;margin-top:11px;height:16px;display:flex;align-items:center;cursor:pointer;}
.le-doc-audio__track::before{content:'';position:absolute;left:0;right:0;top:50%;height:4px;border-radius:99px;background:rgba(22,32,59,.08);transform:translateY(-50%);}
.le-doc-audio__fill{position:absolute;left:0;top:50%;height:4px;border-radius:99px;background:var(--le-acc);transform:translateY(-50%);transition:width .12s linear;pointer-events:none;}
.le-doc-audio__dot{position:absolute;top:50%;width:11px;height:11px;border-radius:50%;background:var(--le-acc-deep);box-shadow:0 0 0 3px #fff,0 2px 6px rgba(21,32,59,.25);transform:translate(-50%,-50%);pointer-events:none;}
.le-doc-audio__times{display:flex;align-items:center;justify-content:space-between;margin-top:3px;}
.le-doc-audio__times span{font-size:11.5px;font-weight:600;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
/* выноски: «Подсказка» (лёгкая золотая) ≠ «Важно» (правило-карточка) */
.le-doc-callout--hint{display:flex;gap:11px;align-items:flex-start;margin:16px 0 4px;padding:13px 15px;border-radius:14px;background:linear-gradient(180deg,rgba(226,165,46,.1),rgba(226,165,46,.05));border:1px solid rgba(226,165,46,.26);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),inset 0 0 26px rgba(226,165,46,.05);color:#6E4F12;font-size:15px;line-height:1.55;}
.le-doc-callout--hint .le-doc-callout__ic{flex:0 0 24px;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;color:#fff;background:#D49A33;margin-top:1px;}
.le-doc-callout--hint .le-doc-callout__tx{flex:1 1 auto;min-width:0;overflow-wrap:break-word;word-break:break-word;}
.le-doc-callout--imp{position:relative;margin:16px 0 4px;padding:13px 16px 14px 19px;border-radius:14px;background:linear-gradient(180deg,rgba(43,143,255,.08),rgba(43,143,255,.04));border:1px solid var(--le-acc-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),inset 0 0 30px rgba(43,143,255,.07);}
.le-doc-callout--imp::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:99px;background:var(--le-acc);}
.le-doc-callout--imp .le-doc-callout__head{display:flex;align-items:center;gap:6px;color:var(--le-acc-deep);font-family:var(--le-display);font-size:12.5px;font-weight:700;margin-bottom:5px;}
.le-doc-callout--imp .le-doc-callout__tx{color:var(--le-ink);font-size:15px;line-height:1.55;overflow-wrap:break-word;word-break:break-word;}
/* спойлер — самопроверка: вопрос + кнопка «Показать ответ» → ответ */
.le-doc-spoiler{margin:16px 0 4px;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.6);border:1px solid var(--le-line);}
.le-doc-spoiler__q{font-size:15px;font-weight:600;color:var(--le-ink);line-height:1.45;margin-bottom:10px;}
.le-doc-spoiler__btn{display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;color:var(--le-acc-deep);background:var(--le-acc-soft,rgba(43,143,255,.1));border:0;padding:8px 14px;border-radius:10px;transition:background .15s,transform .1s;}
.le-doc-spoiler__btn:hover{background:rgba(43,143,255,.16);} .le-doc-spoiler__btn:active{transform:scale(.97);}
.le-doc-spoiler__a{font-size:15px;line-height:1.6;color:var(--le-ink);padding:11px 14px;border-radius:11px;background:rgba(43,143,255,.06);border:1px solid var(--le-acc-line);animation:leReveal .22s cubic-bezier(.23,1,.32,1);overflow-wrap:break-word;word-break:break-word;}
@keyframes leReveal{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:none;}}
/* пример — фраза в контексте */
.le-doc-example{display:flex;align-items:flex-start;gap:12px;margin:16px 0 4px;padding:13px 15px;border-radius:14px;background:rgba(255,255,255,.6);border:1px solid var(--le-line);}
.le-doc-example__say{flex:0 0 auto;margin-top:2px;}
.le-doc-example__b{flex:1 1 auto;min-width:0;}
.le-doc-example__hz{font-family:var(--le-display);font-size:20px;font-weight:600;color:var(--le-ink);letter-spacing:.5px;line-height:1.3;overflow-wrap:break-word;}
.le-doc-example__py{font-size:13px;font-weight:500;color:var(--le-acc-deep);margin-top:2px;overflow-wrap:break-word;}
.le-doc-example__ru{font-size:14.5px;color:var(--le-ink-soft,var(--le-ink));margin-top:3px;overflow-wrap:break-word;}
.le-doc-material{display:flex;align-items:center;gap:9px;max-width:100%;margin:12px 0 4px;padding:11px 15px;border-radius:12px;background:rgba(255,255,255,.6);border:1px solid var(--le-line);color:var(--le-acc-ink);font-size:14px;font-weight:600;text-decoration:none;transition:border-color .15s,transform .15s;}
.le-doc-material__t{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.le-doc-material svg{flex:0 0 auto;}
.le-doc-material:hover{border-color:var(--le-acc-line);transform:translateY(-1px);}
.le-doc-divider{border:0;border-top:1px solid var(--le-line);margin:22px 0;}
.le-study.is-compact .le-doc{gap:0;}
.le-study.is-compact .le-doc .le-note-h{font-size:18px;font-weight:600;margin-top:26px;}
.le-study.is-compact .le-doc .le-note-p{font-size:14px;line-height:1.62;margin-top:8px;}
.le-study.is-compact .le-doc-quote{font-size:13.5px;padding:11px 14px 11px 34px;margin:12px 0 2px;}
.le-study.is-compact .le-doc-quote::before{left:10px;top:3px;font-size:30px;}
.le-study.is-compact .le-doc-list li{font-size:14px;}
.le-study.is-compact .le-doc-callout{font-size:13px;padding:11px 14px;margin:12px 0 2px;}
.le-study.is-compact .le-doc-word{margin:12px 0 2px;}
.le-study.is-compact .le-doc-word .lx-voc__hz{font-size:24px;}
.le-study.is-compact .le-dword{max-width:none;margin:11px 0 4px;gap:12px;padding:9px 11px 9px 9px;border-radius:15px;}
.le-study.is-compact .le-dword__hz{min-width:48px;height:48px;padding:0 12px;font-size:24px;border-radius:13px;}
.le-study.is-compact .le-dword__py{font-size:12px;}
.le-study.is-compact .le-dword__ru{font-size:14.5px;}
.le-study.is-compact .le-dword__say{width:33px;height:33px;border-radius:11px;}
.le-study.is-compact .le-doc-audio{margin:12px 0 2px;padding:11px 12px;gap:11px;}
.le-study.is-compact .le-doc-audio__tile{flex-basis:40px;width:40px;height:40px;border-radius:12px;}
.le-study.is-compact .le-doc-audio__t{font-size:13px;}
.le-study.is-compact .le-doc-audio__track{margin-top:8px;}
.le-study.is-compact .le-doc-list{margin:10px 0 2px;gap:6px;}
.le-study.is-compact .le-doc-spoiler{margin:12px 0 2px;padding:11px 12px;}
.le-study.is-compact .le-doc-spoiler__q{font-size:13px;margin-bottom:8px;}
.le-study.is-compact .le-doc-spoiler__a{font-size:13.5px;padding:10px 12px;}
.le-study.is-compact .le-doc-spoiler__btn{font-size:12.5px;padding:7px 12px;}
.le-study.is-compact .le-doc-example{margin:12px 0 2px;padding:11px 12px;gap:10px;}
.le-study.is-compact .le-doc-example__hz{font-size:17px;}
.le-study.is-compact .le-doc-example__py,.le-study.is-compact .le-doc-example__ru{font-size:12.5px;}
.le-study.is-compact .le-doc-material{margin:12px 0 2px;padding:9px 12px;font-size:13px;}
.le-study.is-compact .le-doc-divider{margin:16px 0;}

  .le-fig{margin:22px 0 0;border-radius:16px;padding:20px 22px 16px;background:rgba(43,143,255,.04);border:1px solid var(--le-line);}
  .le-tones{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;}
  .le-tone{border-radius:12px;padding:15px 10px 12px;background:rgba(255,255,255,.6);border:1px solid var(--le-line);text-align:center;}
  .le-tone svg{display:block;width:100%;height:30px;}
  .le-tone__py{font-size:16px;font-weight:600;color:var(--le-acc-deep);margin-top:10px;letter-spacing:.2px;}
  .le-tone__ru{font-size:11px;font-weight:500;color:var(--le-ink-mute);margin-top:3px;}
  .le-fig__cap{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:400;color:var(--le-ink-mute);margin-top:13px;}

  .le-words{margin-top:26px;}
  .le-words__l{font-size:14px;font-weight:600;color:var(--le-ink);letter-spacing:-.01em;}
  .le-gloss{margin-top:14px;border-radius:14px;overflow:hidden;border:1px solid var(--le-line);background:rgba(255,255,255,.55);box-shadow:var(--le-hi);}
  .le-gl{display:grid;grid-template-columns:66px 1fr auto;align-items:center;gap:18px;padding:14px 20px;border-top:1px solid var(--le-line-soft);}
  .le-gl:first-child{border-top:0;}
  .le-gl__hz{font-size:25px;font-weight:600;color:var(--le-acc-deep);letter-spacing:.5px;line-height:1;}
  .le-gl__py{font-size:13.5px;font-weight:500;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
  .le-gl__ru{font-size:15px;font-weight:500;color:var(--le-ink);text-align:right;}

  /* ── ДОМАШНЕЕ ЗАДАНИЕ / ТЕСТ — чистая белая карточка, акцент несёт кнопка ───── */
  .le-hw{position:relative;margin-top:28px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;border-radius:22px;padding:24px 26px;
    border:1px solid var(--le-cbord);background:var(--le-card);box-shadow:var(--le-hi);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);overflow:hidden;}
  .le-hw__ic{position:relative;flex:0 0 46px;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;color:#fff;background:var(--le-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.28);}
  .le-hw__cta.le-btn{padding:13px 24px;font-size:14.5px;}
  .le-study.is-compact .le-hw__cta.le-btn{padding:11px 16px;font-size:13px;}
  .le-hw.is-done .le-hw__ic{background:var(--le-jade);}
  .le-hw__b{flex:1 1 200px;min-width:0;}
  .le-hw__k{font-size:12.5px;font-weight:600;color:var(--le-acc-ink);}
  .le-hw.is-done .le-hw__k{color:var(--le-jade);}
  .le-hw__t{font-family:var(--le-display);font-weight:500;font-size:19px;letter-spacing:-.012em;color:var(--le-ink);margin-top:4px;}
  .le-hw__meta{display:flex;align-items:center;gap:9px;margin-top:9px;}
  .le-hw__mi{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
  .le-hw__mi svg{color:var(--le-acc-deep);opacity:.85;}
  .le-hw__dot{width:3px;height:3px;border-radius:50%;background:var(--le-ink-faint);}
  .le-study.is-compact .le-hw__meta{margin-top:7px;gap:7px;}
  .le-study.is-compact .le-hw__mi{font-size:11.5px;}
  .le-hw__cta{flex:0 0 auto;}

  /* ── материалы урока (файлы/ссылки от преподавателя) ──────────────────────── */
  .le-mats{margin-top:30px;}
  .le-mats__h{display:flex;align-items:center;gap:9px;font-family:var(--le-display);font-size:17px;font-weight:700;color:var(--le-ink);letter-spacing:-.014em;margin-bottom:13px;}
  .le-mats__h svg{color:var(--le-acc-deep);}
  .le-mats__list{display:flex;flex-direction:column;gap:9px;}
  .le-mat{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:13px;background:var(--le-card);border:1px solid var(--le-line);box-shadow:var(--le-hi);text-decoration:none;color:var(--le-ink);transition:border-color .15s,transform .15s,box-shadow .15s;}
  .le-mat:hover{border-color:var(--le-acc-line);transform:translateY(-1px);box-shadow:0 12px 26px -16px rgba(32,90,200,.34);}
  .le-mat__ic{flex:0 0 38px;width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:var(--le-acc-deep);background:var(--le-acc-soft);}
  .le-mat__t{flex:1 1 auto;min-width:0;font-size:14.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .le-mat__dl{flex:0 0 auto;color:var(--le-ink-mute);}
  .le-study.is-compact .le-mats{margin-top:16px;}
  .le-study.is-compact .le-mats__h{font-size:14px;margin-bottom:9px;}
  .le-study.is-compact .le-mat{padding:10px 12px;gap:10px;}
  .le-study.is-compact .le-mat__ic{flex-basis:30px;width:30px;height:30px;border-radius:9px;}
  .le-study.is-compact .le-mat__t{font-size:13px;}

  /* ── РЕЙЛ · контейнер «Ваш прогресс»: круговой график + текст ──────────────── */
  .le-prog{border-radius:18px;border:1px solid var(--le-line);background:rgba(255,255,255,.56);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:var(--le-hi);padding:18px 20px 20px;}
  .le-prog__hd{display:flex;align-items:center;justify-content:space-between;gap:10px;}
  .le-prog__lab{font-family:var(--le-display);font-size:16px;font-weight:500;color:var(--le-ink);letter-spacing:-.012em;}
  .le-prog__chip{font-size:11.5px;font-weight:600;color:var(--le-acc-ink);background:var(--le-acc-soft);border:1px solid var(--le-acc-line);padding:4px 10px;border-radius:99px;white-space:nowrap;}
  .le-prog__body{display:flex;align-items:center;gap:18px;margin-top:16px;}
  .le-prog__ring{position:relative;flex:0 0 86px;width:86px;height:86px;}
  .le-prog__ring svg{width:86px;height:86px;display:block;transform:rotate(-90deg);}
  .le-prog__ring i{display:block;height:100%;}
  .le-prog__pctt{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--le-display);font-size:23px;font-weight:600;letter-spacing:-.02em;color:var(--le-acc-deep);font-variant-numeric:tabular-nums;}
  .le-prog__pctt em{font-style:normal;font-size:13px;font-weight:600;color:var(--le-ink-mute);margin-left:1px;}
  .le-prog__meta{flex:1 1 auto;min-width:0;}
  .le-prog__big{font-size:16.5px;font-weight:600;color:var(--le-ink);letter-spacing:-.01em;font-variant-numeric:tabular-nums;}
  .le-prog__sub{font-size:12.5px;font-weight:450;color:var(--le-ink-sub);margin-top:6px;line-height:1.42;}
  .le-prog__sub b{font-weight:700;color:var(--le-acc-ink);}

  /* ── РЕЙЛ · ПЛЕЙЛИСТ модуля — ТАЙМЛАЙН восхождения ────────────────────────
     Вертикальная линия с узлами слева, крупные квадратные превью, тонкий
     прогресс-бар под шапкой. Пройдено (нефрит) · сейчас (сапфир) · закрыто. */
  .le-pl{border-radius:22px;border:1px solid var(--le-cbord);background:var(--le-card);box-shadow:var(--le-hi);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);overflow:hidden;}
  .le-pl__hd{display:flex;align-items:center;gap:11px;padding:18px 18px 12px;}
  .le-pl__hd-ic{flex:0 0 34px;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;color:var(--le-acc-deep);background:var(--le-acc-soft);}
  .le-pl__hd-b{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;}
  .le-pl__hd-t{display:block;font-family:var(--le-display);font-size:15px;font-weight:600;color:var(--le-ink);letter-spacing:-.014em;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .le-pl__hd-m{display:block;font-size:11.5px;font-weight:500;color:var(--le-ink-mute);margin-top:3px;font-variant-numeric:tabular-nums;}
  /* тонкий прогресс-бар модуля (линия, не выпуклость) */
  .le-pl__bar{margin:0 18px 4px;height:5px;border-radius:99px;background:rgba(22,32,59,.08);overflow:hidden;}
  .le-pl__bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--le-acc-deep),var(--le-acc));box-shadow:0 0 8px rgba(43,143,255,.5);transition:width .9s cubic-bezier(.22,.61,.36,1);}
  /* таймлайн: вертикальная линия слева + узлы, карточки правее (линия не под ними) */
  .le-pl__list{position:relative;padding:14px 10px 8px 6px;display:flex;flex-direction:column;gap:6px;}
  .le-pl__list::before{content:'';position:absolute;left:22px;top:38px;bottom:40px;width:2px;border-radius:99px;background:var(--le-line);}
  .le-pli{position:relative;display:flex;align-items:center;gap:12px;width:100%;text-align:left;font:inherit;background:0;border:1px solid transparent;border-radius:16px;padding:8px 10px 8px 40px;cursor:pointer;
    transition:background .16s,border-color .16s,box-shadow .16s,transform .16s cubic-bezier(.23,1,.32,1);}
  .le-pli:hover:not(.locked):not(.current){background:rgba(43,143,255,.05);}
  /* узел на линии */
  .le-pli__node{position:absolute;left:16px;top:50%;transform:translateY(-50%);width:14px;height:14px;border-radius:50%;z-index:1;background:#fff;box-shadow:inset 0 0 0 2px var(--le-line-strong);}
  .le-pli.done .le-pli__node{background:var(--le-jade);box-shadow:inset 0 0 0 2px var(--le-jade),0 0 0 3px rgba(46,160,110,.14);}
  .le-pli.current .le-pli__node{background:var(--le-acc-deep);box-shadow:inset 0 0 0 2px var(--le-acc-deep),0 0 0 4px rgba(43,143,255,.2);}
  /* квадратное превью, кадр в волосяной рамке — без чёрного фона и без серой обводки */
  .le-pli__th{position:relative;flex:0 0 56px;width:56px;height:56px;border-radius:14px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(22,32,59,.07);}
  .le-pli__th img{width:100%;height:100%;object-fit:cover;display:block;}
  .le-pli__badge{position:absolute;right:4px;bottom:4px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;color:#fff;
    box-shadow:0 2px 6px rgba(6,12,30,.4),0 0 0 2px #fff;font-size:10px;font-weight:800;font-variant-numeric:tabular-nums;}
  .le-pli.done .le-pli__badge{background:var(--le-jade);}
  .le-pli.locked .le-pli__badge{background:rgba(22,32,59,.55);}
  .le-pli__play{position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:linear-gradient(180deg,rgba(8,14,34,.04),rgba(8,14,34,.32));}
  .le-pli.current .le-pli__th{box-shadow:inset 0 0 0 1px var(--le-acc-line),0 0 0 3px rgba(43,143,255,.2),0 10px 20px -10px rgba(32,90,200,.4);}
  .le-pli.locked .le-pli__th img{filter:grayscale(.5) brightness(.86);}
  .le-pli.locked .le-pli__th{opacity:.82;}
  .le-pli__b{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:4px;}
  .le-pli__t{font-size:14px;font-weight:600;color:var(--le-ink);letter-spacing:-.01em;line-height:1.26;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .le-pli.locked .le-pli__t{color:var(--le-ink-mute);font-weight:500;}
  .le-pli__m{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:500;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
  .le-pli__m i{width:2.5px;height:2.5px;border-radius:50%;background:var(--le-ink-faint);flex:0 0 auto;}
  .le-pli.current{background:linear-gradient(180deg,rgba(43,143,255,.09),rgba(43,143,255,.045));border-color:var(--le-acc-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.6);}
  .le-pli.current .le-pli__t{font-weight:700;}
  .le-pli.locked{cursor:default;}
  .le-pli__r{flex:0 0 auto;display:inline-flex;align-items:center;padding-right:3px;}
  .le-pli__sc{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;color:#fff;background:var(--le-jade);font-size:11px;font-weight:800;font-variant-numeric:tabular-nums;box-shadow:inset 0 1px 0 rgba(255,255,255,.25);}
  .le-pli__now{font-size:10.5px;font-weight:700;color:#fff;background:var(--le-acc-deep);padding:4px 10px;border-radius:99px;white-space:nowrap;box-shadow:inset 0 1px 0 rgba(255,255,255,.3);}
  .le-pli__lock{color:var(--le-ink-faint);display:inline-flex;}
  .le-pl__all{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;color:var(--le-ink-sub);padding:14px;border:0;border-top:1px solid var(--le-line-soft);background:0;transition:color .15s,background .15s;}
  .le-pl__all:hover{color:var(--le-acc-deep);background:rgba(43,143,255,.03);}
  .le-pl__all svg{transition:transform .15s;}
  .le-pl__all:hover svg{transform:translateX(2px);}

  /* ── карточка преподавателя — живой профиль наставника ─────────────────────
     Настоящее фото в квадратно-скруглённом аватаре + онлайн-точка, тихое
     сапфировое свечение ПОЗАДИ (не выпуклый пузырь на плашке), имя/роль,
     чип-доверие и чистая кнопка. Хочется написать живому человеку. */
  .le-card{position:relative;overflow:hidden;border-radius:20px;padding:22px;background:var(--le-card);border:1px solid var(--le-cbord);box-shadow:var(--le-hi);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);}
  .le-card__h{position:relative;display:flex;align-items:center;gap:9px;padding:0 2px;}
  .le-card__hdot{flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:var(--le-jade);box-shadow:0 0 0 3px rgba(46,160,110,.16);}
  .le-card__t{font-size:13px;font-weight:600;letter-spacing:-.01em;color:var(--le-ink-sub);}
  .le-tch{position:relative;display:flex;align-items:center;gap:14px;padding:2px;margin-top:16px;}
  /* аватар преподавателя — КРУГЛЫЙ (по референсу) */
  .le-tch__av{position:relative;flex:0 0 58px;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;
    font-family:var(--le-display);font-size:23px;font-weight:600;color:#fff;background:var(--le-acc-deep);
    box-shadow:inset 0 0 0 1px rgba(22,32,59,.06),0 10px 22px -10px rgba(32,90,200,.5);}
  .le-tch__av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;border-radius:50%;}
  .le-tch__b{flex:1 1 auto;min-width:0;}
  .le-tch__n{font-size:17px;font-weight:600;color:var(--le-ink);letter-spacing:-.012em;line-height:1.2;}
  .le-tch__r{font-size:12.5px;font-weight:450;color:var(--le-ink-mute);margin-top:4px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .le-tchbtn{position:relative;margin-top:17px;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;padding:13px;border-radius:13px;color:#fff;background:var(--le-acc-deep);border:0;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 10px 22px -14px rgba(20,70,180,.55);transition:background .15s,transform .15s;}
  .le-tchbtn:hover{background:#2B8FFF;transform:translateY(-1px);}
  .le-tchbtn:active{transform:translateY(0);}

  /* ── НИЖНЯЯ ПАНЕЛЬ урока — ПЛАВАЮЩАЯ пилюля: «Назад · Урок N из M · Дальше».
     Отрывается от контента (sticky снизу + тень + зазор), стекло-блюр (футер —
     единственное разрешённое место настоящего blur в системе). ─────────────── */
  .le-foot{position:sticky;bottom:16px;z-index:8;margin-top:34px;display:flex;align-items:center;gap:14px;padding:11px 13px 11px 14px;border-radius:18px;
    background:rgba(255,255,255,.68);-webkit-backdrop-filter:blur(22px) saturate(1.5);backdrop-filter:blur(22px) saturate(1.5);
    border:1px solid var(--le-line);box-shadow:0 16px 40px -26px rgba(12,26,64,.36),inset 0 1px 0 rgba(255,255,255,.72);}
  .le-foot__mid{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:12px;min-width:0;}
  .le-foot__step{font-size:12.5px;font-weight:500;color:var(--le-ink-mute);white-space:nowrap;font-variant-numeric:tabular-nums;}
  .le-foot__dots{display:flex;align-items:center;gap:5px;}
  .le-foot__dot{width:6px;height:6px;border-radius:50%;background:rgba(22,32,59,.2);}
  .le-foot__dot.on{background:var(--le-acc-deep);width:18px;border-radius:99px;}
  .le-foot .le-btn{padding:12px 22px;font-size:14px;}
  @media (max-width:560px){ .le-foot__dots{display:none;} }

  /* кнопки (общие с попапом) — плоские, без выпуклости */
  .le-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;border:0;white-space:nowrap;font-family:inherit;font-size:14.5px;font-weight:600;letter-spacing:-.005em;padding:13px 22px;border-radius:12px;transition:transform .14s,background .14s,box-shadow .14s,opacity .14s;}
  .le-btn svg{transition:transform .15s;}
  /* канон-кнопка «Дальше» — сапфир + свечение ВНУТРИ (как анкета/роадмап), но
     ореол приглушён, чтобы плотный сапфир читался и кнопка не «выцветала» в белое */
  .le-btn--primary{background:var(--le-acc-deep);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.34),inset 0 9px 20px -8px rgba(150,200,255,.6),0 10px 24px -14px rgba(20,70,180,.5);}
  .le-btn--primary:hover{background:#2B8FFF;transform:translateY(-1px);}
  .le-btn--primary:active{transform:translateY(1px);}
  .le-btn--primary:disabled{background:#C3CCDE;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.2);cursor:not-allowed;opacity:.75;}
  .le-btn--ok{background:var(--le-jade);box-shadow:0 10px 22px -12px rgba(28,126,82,.55);color:#fff;}
  .le-btn--ok:hover{background:#1F8F5C;transform:translateY(-1px);}
  /* secondary «Назад» — видимая всегда (не белое на белом): тёмная подложка-чернило + чёткая обводка */
  .le-btn--ghost{background:rgba(22,32,59,.045);color:var(--le-ink-sub);border:1px solid var(--le-line-strong);}
  .le-btn--ghost:hover{background:rgba(22,32,59,.08);color:var(--le-ink);border-color:var(--le-ink-faint);transform:translateY(-1px);}
  .le-btn--ghost:disabled{opacity:.4;cursor:not-allowed;}
  .le-btn .bk{transform:rotate(135deg);} .le-btn--ghost:hover .bk{transform:rotate(135deg) translateX(2px);}
  .le-btn .arr{transform:rotate(-45deg);} .le-btn:hover .arr{transform:rotate(-45deg) translateX(2px);}

  /* ═══════════ ТЕСТ — ПОПАП (чисто, плоско, без блюра и выкрутасов) ═══════════ */
  .lt-modal{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:28px;background:rgba(10,16,38,.46);animation:lt-fade .2s ease;}
  @keyframes lt-fade{from{opacity:0;}to{opacity:1;}}
  .lt-modal__panel{position:relative;width:min(820px,100%);max-height:88vh;display:flex;flex-direction:column;border-radius:24px;background:#F7F9FE;border:1px solid rgba(255,255,255,.8);box-shadow:0 44px 120px -30px rgba(3,8,28,.5);overflow:hidden;animation:lt-rise .32s cubic-bezier(.23,1,.32,1);}
  @keyframes lt-rise{from{opacity:0;transform:translateY(16px) scale(.99);}to{opacity:1;transform:none;}}
  .lt-modal__head{flex:0 0 auto;display:flex;flex-direction:column;gap:14px;padding:18px 22px 16px;border-bottom:1px solid var(--le-line);
    background:radial-gradient(420px 120px at 18% 0%,rgba(43,143,255,.08),transparent 70%);}
  .lt-modal__hrow{display:flex;align-items:center;gap:11px;}
  .lt-badge{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--le-acc-ink);background:var(--le-acc-soft);padding:6px 12px 6px 10px;border-radius:99px;}
  .lt-badge svg{color:var(--le-acc-deep);}
  .lt-xp{font-size:12.5px;font-weight:700;color:var(--le-gold);font-variant-numeric:tabular-nums;}
  .lt-xp__u{font-weight:600;opacity:.8;}
  .lt-modal__count{margin-left:auto;font-size:15px;font-weight:700;color:var(--le-ink);font-variant-numeric:tabular-nums;letter-spacing:-.01em;}
  .lt-modal__count-d{font-size:13px;font-weight:600;color:var(--le-ink-mute);}
  .lt-modal__x{flex:0 0 auto;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;cursor:pointer;color:var(--le-ink-mute);background:rgba(255,255,255,.7);border:1px solid var(--le-line);transition:transform .15s,color .15s,border-color .15s;}
  .lt-modal__x:hover{color:var(--le-ink);transform:translateY(-1px);border-color:var(--le-acc-line);}
  .lt-modal__x--float{position:absolute;top:16px;right:16px;z-index:3;}
  /* сегментированный прогресс — по точке на вопрос (зелёный/розовый/текущий/серый) */
  .lt-seg{display:flex;gap:6px;}
  .lt-seg__i{flex:1 1 0;height:6px;border-radius:99px;background:rgba(22,32,59,.1);transition:background .3s,box-shadow .3s;}
  .lt-seg__i.is-done{background:var(--le-acc-deep);}
  .lt-seg__i.is-ok{background:var(--le-jade);}
  .lt-seg__i.is-bad{background:var(--le-rose);}
  .lt-seg__i.is-cur{background:var(--le-acc);box-shadow:0 0 0 3px rgba(43,143,255,.16);}
  .lt-modal__body{flex:1 1 auto;overflow-y:auto;padding:30px 32px 16px;}
  .lt-q{animation:lt-in .3s cubic-bezier(.23,1,.32,1);}
  @keyframes lt-in{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
  .lt-modal__foot{flex:0 0 auto;display:flex;align-items:center;gap:14px;padding:14px 18px;border-top:1px solid var(--le-line);
    background:rgba(232,236,251,.66);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.55);}
  .lt-back{flex:0 0 auto;}
  .lt-fb__hint{color:var(--le-ink-mute);font-weight:500;font-size:13px;}
  .lt-fb{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:11px;font-size:14.5px;font-weight:600;line-height:1.4;transition:color .2s;}
  .lt-fb__ic{opacity:0;transform:translateY(3px) scale(.9);transition:opacity .25s,transform .25s;}
  .lt-fb.show .lt-fb__ic{opacity:1;transform:none;}
  .lt-fb.show{opacity:1;transform:none;}
  .lt-fb.ok{color:var(--le-jade);} .lt-fb.bad{color:var(--le-rose);}
  .lt-fb__ic{flex:0 0 30px;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:#fff;}
  .lt-fb.ok .lt-fb__ic{background:var(--le-jade);}
  .lt-fb.bad .lt-fb__ic{background:var(--le-rose);}
  .lt-fb__xp{color:var(--le-acc-deep);font-weight:700;}

  .lt-done{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:46px 28px 40px;
    background:radial-gradient(540px 280px at 50% -8%,rgba(245,200,76,.1),transparent 64%);}
  .lt-done__star{position:relative;width:104px;height:104px;border-radius:50%;display:grid;place-items:center;
    background:radial-gradient(62% 62% at 50% 40%,rgba(255,242,206,.98),rgba(245,200,76,.3));
    box-shadow:0 0 0 10px rgba(245,200,76,.09),0 20px 48px -14px rgba(226,165,46,.45);animation:lt-star .6s cubic-bezier(.23,1,.32,1);}
  .lt-done__star svg{color:#E2A52E;}
  .lt-done__star::before{content:'';position:absolute;inset:-10px;border-radius:50%;border:2px solid rgba(245,200,76,.5);animation:lt-ring .85s cubic-bezier(.23,1,.32,1) .15s both;}
  @keyframes lt-star{0%{transform:scale(.4) rotate(-18deg);opacity:0;}60%{transform:scale(1.08) rotate(4deg);}100%{transform:scale(1) rotate(0);opacity:1;}}
  @keyframes lt-ring{from{transform:scale(.7);opacity:0;}45%{opacity:.85;}to{transform:scale(1.55);opacity:0;}}
  .lt-done__k{margin-top:22px;display:inline-flex;align-items:center;font-size:12px;font-weight:700;color:var(--le-jade);background:var(--le-jade-soft);padding:5px 13px;border-radius:99px;}
  .lt-done__h{font-family:var(--le-display);font-weight:500;font-size:34px;letter-spacing:-.028em;line-height:1.05;color:var(--le-ink);margin-top:16px;text-wrap:balance;}
  .lt-done__s{font-size:15.5px;color:var(--le-ink-sub);margin-top:12px;max-width:40ch;line-height:1.55;font-weight:400;}
  .lt-stats{display:flex;gap:12px;margin-top:28px;flex-wrap:wrap;justify-content:center;}
  .lt-stat{min-width:124px;padding:17px 20px;border-radius:16px;background:#fff;border:1px solid var(--le-line);box-shadow:0 1px 2px rgba(18,28,58,.03);}
  .lt-stat--gold{background:linear-gradient(180deg,rgba(245,200,76,.12),rgba(245,200,76,.04));border-color:rgba(226,165,46,.28);}
  .lt-stat__v{font-family:var(--le-display);font-size:30px;font-weight:600;letter-spacing:-.02em;color:var(--le-acc-deep);font-variant-numeric:tabular-nums;line-height:1;}
  .lt-stat__v.gold{color:var(--le-gold);}
  .lt-stat__k{font-size:12px;font-weight:500;color:var(--le-ink-mute);margin-top:10px;}
  .lt-done__cta{display:flex;gap:13px;margin-top:32px;flex-wrap:wrap;justify-content:center;}
  @media (prefers-reduced-motion:reduce){ .lt-done__star,.lt-done__star::before{animation:none;} }

  /* компактный режим — превью телефона в конструкторе */
  .le-study.is-compact .le-h1{font-size:23px;letter-spacing:-.02em;}
  .le-study.is-compact .le-sub{font-size:13px;margin-top:9px;}
  .le-study.is-compact .le-player{margin-top:18px;border-radius:14px;}
  .le-study.is-compact .le-play{width:54px;height:54px;}
  .le-study.is-compact .le-player__empty-ic{width:34px;height:34px;border-radius:10px;}
  .le-study.is-compact .le-player__empty-t{font-size:12px;}
  .le-study.is-compact .le-digest{margin-top:18px;}
  .le-study.is-compact .le-digest__t{font-size:15px;}
  .le-study.is-compact .le-note-h{font-size:17px;font-weight:600;margin-top:24px;}
  .le-study.is-compact .le-note-p{font-size:13px;line-height:1.62;margin-top:8px;}
  .le-study.is-compact .le-tones{grid-template-columns:repeat(2,1fr);}
  .le-study.is-compact .le-aims__i{font-size:13px;}
  .le-study.is-compact .le-gl{grid-template-columns:48px 1fr auto;gap:12px;padding:11px 14px;}
  .le-study.is-compact .le-gl__hz{font-size:19px;}
  .le-study.is-compact .le-hw{margin-top:18px;padding:15px 16px;gap:14px;}
  .le-study.is-compact .le-hw__ic{flex-basis:38px;width:38px;height:38px;border-radius:11px;}
  .le-study.is-compact .le-hw__t{font-size:15px;}
  .le-study.is-compact .le-hw__cta{font-size:12.5px;padding:10px 14px;}

  @media (max-width:1080px){
    .le-grid{grid-template-columns:1fr;}
    .le-rail{position:static;flex-direction:row;flex-wrap:wrap;gap:14px;}
    .le-prog{flex:1 1 100%;}
    .le-pl{flex:1 1 360px;}
    .le-rail>.le-card{flex:1 1 280px;}
  }
  @media (max-width:680px){
    .le-head{margin:0 0 8px;top:10px;padding:9px 10px 9px 14px;}
    .le-head::before{left:-18px;right:-18px;}
    .le-h1{font-size:30px;} .le-sub{font-size:15px;}
    .le-digest__body{padding:6px 18px 22px;}
    .le-tones{grid-template-columns:repeat(2,1fr);}
    .le-bar__spd,.le-bar__ic{display:none;}
    .lt-modal{padding:0;align-items:stretch;}
    .lt-modal__panel{width:100%;max-height:100%;border-radius:0;}
    .lt-modal__body{padding:24px 20px 14px;} .lx-voc,.lx-match,.lx-tone__opts{grid-template-columns:1fr;}
    .le-crumb__sep--mod,.le-crumb__mod{display:none;}
  }
  @media (prefers-reduced-motion: reduce){
    .lt-q,.lt-done__star,.lt-modal,.lt-modal__panel,.lx-opt.is-wrong{animation:none;}
    .lt-prog i,.le-prog__ring i{transition:none;}
  }
`;

  if (!document.getElementById('learn-lx-styles')) {
    const el = document.createElement('style');
    el.id = 'learn-lx-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     BlockView — ОБЩИЙ рендер блока (контролируемый). Шарится с конструктором.
     props: { block, mode:'play'|'preview', st, revealed, onChange }
  ───────────────────────────────────────────────────────────────────────── */
  const LET = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];

  function leftForPair(picks, pairIdx) {
    const k = Object.keys(picks).find((i) => picks[i] === pairIdx);
    return k == null ? null : +k;
  }

  function BlockView(props) {
    const { block, st, revealed, onChange } = props;
    if (!block) return null;
    const locked = !!revealed;

    // ── Теория ──
    if (block.type === 'theory') {
      const vocab = (block.vocab || []).filter((v) => v.hanzi || v.ru);
      return h('div', { className: 'lx-scope' },
        h('div', { className: 'lx-kick' }, Ic.Book ? h(Ic.Book, { size: 15 }) : null, 'Запоминаем'),
        block.title ? h('div', { className: 'lx-theory__t' }, block.title) : null,
        block.body ? h('div', { className: 'lx-theory__b' }, block.body) : null,
        vocab.length ? h('div', { className: 'lx-voc' }, vocab.map((v, i) => h('div', { key: i, className: 'lx-voc__c' },
          h('div', { className: 'lx-voc__top' },
            h('span', { className: 'lx-voc__py' }, v.pinyin || ''),
            v.hanzi ? h(SpeakBtn, { text: v.hanzi, size: 16 }) : null),
          v.hanzi ? h('div', { className: 'lx-voc__hz' }, v.hanzi) : null,
          v.ru ? h('div', { className: 'lx-voc__ru' }, v.ru) : null))) : null);
    }

    // ── Выбор / Пропуск: общий рендер вариантов ──
    if (block.type === 'choice' || block.type === 'gap') {
      const sel = st && st.sel;
      const pick = (i) => { if (!locked) onChange({ sel: i }); };
      const optCls = (i, o) => {
        let c = 'lx-opt';
        if (locked) {
          c += ' is-locked';
          if (o.correct) c += ' is-correct';
          else if (sel === i) c += ' is-wrong';
          else c += ' is-dim';
        } else if (sel === i) c += ' is-sel';
        return c;
      };
      const fbIc = (o, i) => {
        if (!locked) return null;
        if (o.correct) return h('span', { className: 'lx-opt__fb' }, Ic.Check ? h(Ic.Check, { size: 19, strokeWidth: 2.6 }) : '✓');
        if (sel === i) return h('span', { className: 'lx-opt__fb' }, Ic.Close ? h(Ic.Close, { size: 18 }) : '×');
        return null;
      };
      const options = (block.options || []).map((o, i) => h('button', {
        key: i, type: 'button', className: optCls(i, o), onClick: () => pick(i),
      },
        h('span', { className: 'lx-opt__mk' }, block.type === 'gap' ? (i + 1) : LET[i]),
        h('span', { className: 'lx-opt__t' }, o.text),
        fbIc(o, i)));

      const head = block.type === 'gap'
        ? [
          h('div', { key: 'k', className: 'lx-kick' }, Ic.Edit ? h(Ic.Edit, { size: 15 }) : null, 'Соберите фразу'),
          h('div', { key: 'p', className: 'lx-prompt' }, block.prompt),
          h('div', { key: 'g', className: 'lx-gapline' },
            block.before ? (block.before + ' ') : '',
            h('span', { className: 'lx-slot' + (sel != null ? ' filled' : '') + (locked ? (sel != null && block.options[sel] && block.options[sel].correct ? ' ok' : ' bad') : '') },
              sel != null ? block.options[sel].text : '…'),
            block.after ? (' ' + block.after) : ''),
        ]
        : [
          h('div', { key: 'k', className: 'lx-kick' }, Ic.CheckCircle ? h(Ic.CheckCircle, { size: 15 }) : null, 'Выберите ответ'),
          h('div', { key: 'p', className: 'lx-prompt' }, block.prompt),
        ];

      return h('div', { className: 'lx-scope' }, head,
        h('div', { className: 'lx-opts' + (block.type === 'gap' ? ' lx-opts--wrap' : '') }, options),
        revealed && block.explain ? explainRow(block, sel != null && block.options[sel] && block.options[sel].correct) : null);
    }

    // ── Пары (match) ──
    if (block.type === 'match') {
      const pairs = block.pairs || [];
      const order = (st && st.order) || pairs.map((_, i) => i);
      const picks = (st && st.picks) || {};
      const active = st && st.active;

      const clickLeft = (i) => {
        if (locked) return;
        onChange(Object.assign({}, st, { active: active === i ? null : i }));
      };
      const clickRight = (pairIdx) => {
        if (locked) return;
        const np = Object.assign({}, picks);
        // снять этот right у прежнего владельца
        const prev = leftForPair(np, pairIdx);
        if (prev != null) delete np[prev];
        if (active != null) { np[active] = pairIdx; }
        onChange(Object.assign({}, st, { picks: np, active: active != null ? null : active }));
      };

      const leftCol = h('div', { className: 'lx-mcol lx-mcol--l' },
        h('div', { className: 'lx-mcol__h' }, 'Иероглиф'),
        pairs.map((p, i) => {
          const has = picks[i] != null;
          let cls = 'lx-mi';
          if (active === i) cls += ' is-active';
          if (has) cls += ' is-matched has-b';
          if (locked && has) cls += (picks[i] === i ? ' is-correct' : ' is-wrong');
          if (locked) cls += ' is-locked';
          return h('button', { key: i, type: 'button', className: cls, onClick: () => clickLeft(i) },
            h('span', { className: 'lx-mi__t' }, p.left || '—'),
            h('span', { className: 'lx-mi__b' }, has ? (i + 1) : ''));
        }));

      const rightCol = h('div', { className: 'lx-mcol' },
        h('div', { className: 'lx-mcol__h' }, 'Перевод'),
        order.map((pairIdx, k) => {
          const owner = leftForPair(picks, pairIdx);
          const has = owner != null;
          let cls = 'lx-mi';
          if (has) cls += ' is-matched has-b';
          if (locked && has) cls += (owner === pairIdx ? ' is-correct' : ' is-wrong');
          if (locked) cls += ' is-locked';
          return h('button', { key: k, type: 'button', className: cls, onClick: () => clickRight(pairIdx) },
            h('span', { className: 'lx-mi__t' }, (pairs[pairIdx] && pairs[pairIdx].right) || '—'),
            h('span', { className: 'lx-mi__b' }, has ? (owner + 1) : ''));
        }));

      return h('div', { className: 'lx-scope' },
        h('div', { className: 'lx-kick' }, Ic.Grid ? h(Ic.Grid, { size: 15 }) : null, 'Соедините пары'),
        h('div', { className: 'lx-prompt' }, block.prompt),
        h('div', { className: 'lx-match' }, leftCol, rightCol),
        revealed && block.explain ? explainRow(block, L.isCorrect(block, st)) : null);
    }

    // ── Собери предложение (order) ──
    if (block.type === 'order') {
      const toks = block.tokens || [];
      const placed = (st && st.placed) || [];
      const order = (st && st.order) || toks.map((_, i) => i);
      const inLine = {};
      placed.forEach((i) => { inLine[i] = true; });
      const bank = order.filter((i) => !inLine[i]);
      const addTok = (i) => { if (!locked) onChange(Object.assign({}, st, { placed: placed.concat(i) })); };
      const removeAt = (pos) => { if (locked) return; const p = placed.slice(); p.splice(pos, 1); onChange(Object.assign({}, st, { placed: p })); };
      const lineChips = placed.length
        ? placed.map((ti, pos) => h('button', {
          key: pos, type: 'button', onClick: () => removeAt(pos),
          className: 'lx-tok lx-tok--line' + (locked ? (ti === pos ? ' is-correct is-locked' : ' is-wrong is-locked') : ''),
        }, toks[ti]))
        : h('span', { className: 'lx-order__ph' }, 'Нажимайте слова внизу по порядку');
      return h('div', { className: 'lx-scope' },
        h('div', { className: 'lx-kick' }, Ic.Route ? h(Ic.Route, { size: 15 }) : null, 'Соберите предложение'),
        h('div', { className: 'lx-prompt' }, block.prompt),
        h('div', { className: 'lx-order__line' + (placed.length ? '' : ' is-empty') }, lineChips),
        h('div', { className: 'lx-order__bank' }, bank.length
          ? bank.map((i) => h('button', { key: i, type: 'button', className: 'lx-tok' + (locked ? ' is-locked' : ''), onClick: () => addTok(i) }, toks[i]))
          : h('span', { className: 'lx-order__done' }, Ic.Check ? h(Ic.Check, { size: 15, strokeWidth: 2.6 }) : '✓', ' Все слова на месте')),
        revealed && block.explain ? explainRow(block, L.isCorrect(block, st)) : null);
    }

    // ── Ввод ответа (type) ──
    if (block.type === 'type') {
      const val = (st && st.value) || '';
      const ok = locked && L.isCorrect(block, st);
      const set = (v) => { if (!locked) onChange({ value: v }); };
      return h('div', { className: 'lx-scope' },
        h('div', { className: 'lx-kick' }, Ic.Send ? h(Ic.Send, { size: 15 }) : null, 'Впишите ответ'),
        h('div', { className: 'lx-prompt' }, block.prompt),
        h('div', { className: 'lx-type__field' },
          h('input', {
            className: 'lx-type__in' + (locked ? (ok ? ' ok' : ' bad') : ''), value: val, placeholder: 'Ваш ответ…',
            readOnly: locked, autoComplete: 'off', autoCapitalize: 'off', spellCheck: false,
            onChange: (e) => set(e.target.value),
          })),
        locked && !ok ? h('div', { className: 'lx-type__ans' }, 'Верно: ', h('b', null, (block.answers || [])[0] || '')) : null,
        revealed && block.explain ? explainRow(block, ok) : null);
    }

    // ── Выбор тона (tone) ──
    if (block.type === 'tone') {
      const sel = st && st.sel;
      const correctIdx = (block.tone || 1) - 1;
      const pick = (i) => { if (!locked) onChange({ sel: i }); };
      const optCls = (i) => {
        let c = 'lx-tone__b';
        if (locked) { c += ' is-locked'; if (i === correctIdx) c += ' is-correct'; else if (sel === i) c += ' is-wrong'; else c += ' is-dim'; }
        else if (sel === i) c += ' is-sel';
        return c;
      };
      return h('div', { className: 'lx-scope' },
        h('div', { className: 'lx-kick' }, Ic.Target ? h(Ic.Target, { size: 15 }) : null, 'Какой тон?'),
        h('div', { className: 'lx-prompt' }, block.prompt || 'Определите тон иероглифа'),
        h('div', { className: 'lx-tone__card' },
          h('div', { className: 'lx-tone__top' },
            h('div', { className: 'lx-tone__hz' }, block.hanzi || '?'),
            block.hanzi ? h(SpeakBtn, { text: block.hanzi, size: 18 }) : null),
          locked ? h('div', { className: 'lx-tone__pin' }, block.pinyin || '') : null),
        h('div', { className: 'lx-tone__opts' }, (L.TONES || []).map((t, i) => h('button', { key: i, type: 'button', className: optCls(i), onClick: () => pick(i) },
          h('span', { className: 'lx-tone__mark' }, ToneContour(t.contour)),
          h('span', { className: 'lx-tone__name' }, h('b', { className: 'lx-tone__n' }, (i + 1) + '-й'), t.name)))),
        revealed && block.explain ? explainRow(block, sel === correctIdx) : null);
    }

    return null;
  }

  function explainRow(block, ok) {
    return h('div', { className: 'lx-explain ' + (ok ? 'ok' : 'bad') },
      h('span', { className: 'lx-explain__ic' }, ok ? (Ic.CheckCircle ? h(Ic.CheckCircle, { size: 20 }) : '✓') : (Ic.Info ? h(Ic.Info, { size: 20 }) : 'i')),
      h('span', null, block.explain));
  }

  function PlayGlyph(size) {
    const s = size || 24;
    return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true },
      h('path', { d: 'M8 5.14v13.72a1 1 0 0 0 1.54.84l10.49-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z' }));
  }

  function PauseGlyph(size) {
    const s = size || 24;
    return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true },
      h('rect', { x: 6, y: 5, width: 4.2, height: 14, rx: 1.3 }),
      h('rect', { x: 13.8, y: 5, width: 4.2, height: 14, rx: 1.3 }));
  }

  function VolGlyph(size) {
    const s = size || 14;
    return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      h('path', { d: 'M11 5 6 9H3v6h3l5 4z' }),
      h('path', { d: 'M15.5 8.5a5 5 0 0 1 0 7' }));
  }

  function FsGlyph(size) {
    const s = size || 14;
    return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      h('path', { d: 'M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4' }));
  }

  function VolXGlyph(size) {
    const s = size || 14;
    return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      h('path', { d: 'M11 5 6 9H3v6h3l5 4z' }),
      h('path', { d: 'M16 9.5l5 5M21 9.5l-5 5' }));
  }

  /* перемотка ±10с — круговая стрелка с цифрой внутри (стиль iOS-плеера) */
  function SeekGlyph(size, back) {
    const s = size || 18;
    const arrow = back
      ? h('path', { d: 'M7 4.5 4 7l3 2.5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' })
      : h('path', { d: 'M17 4.5 20 7l-3 2.5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' });
    return h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
      h('path', {
        d: back ? 'M4 7a9 9 0 1 1-2.3 8.8' : 'M20 7a9 9 0 1 0 2.3 8.8',
        stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round',
      }),
      arrow,
      h('text', { x: 12, y: 15.5, textAnchor: 'middle', fontSize: 7.5, fontWeight: 700, fill: 'currentColor', stroke: 'none', fontFamily: 'inherit' }, '10'));
  }

  /* ── Озвучка (Web Speech API, zh-CN) и контуры тонов ───────────────────── */
  function speakHanzi(text) {
    try {
      if (!window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.lang = 'zh-CN'; u.rate = 0.9;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function SpeakBtn(props) {
    const { text, size, className } = props;
    const [busy, setBusy] = useState(false);
    const onClick = (e) => { e.stopPropagation(); if (!text) return; setBusy(true); speakHanzi(text); setTimeout(() => setBusy(false), 750); };
    return h('button', { type: 'button', className: (className || 'lx-voc__audio') + (busy ? ' is-busy' : ''), onClick, 'aria-label': 'Прослушать' }, VolGlyph(size || 16));
  }
  function ToneContour(d) {
    return h('svg', { viewBox: '0 0 60 30', 'aria-hidden': true }, h('path', { d, stroke: 'currentColor', strokeWidth: 3.4, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }));
  }

  /* ── Документ (lesson.doc): рендер marks (bold/italic) и блоков ──────────── */
  function renderText(text, marks) {
    const str = String(text == null ? '' : text);
    if (!marks || !marks.length) return str;
    const n = str.length;
    const b = new Array(n).fill(false), it = new Array(n).fill(false);
    (marks || []).forEach((m) => {
      if (!m || m.start == null || m.end == null) return;
      for (let k = Math.max(0, m.start); k < Math.min(n, m.end); k++) {
        if (m.type === 'bold') b[k] = true;
        if (m.type === 'italic') it[k] = true;
      }
    });
    const out = [];
    let buf = '', cb = false, ci = false, seg = 0;
    const flush = () => {
      if (!buf) return;
      const key = 's' + (seg++);
      let node = buf;
      if (cb && ci) node = h('b', { key }, h('i', null, buf));
      else if (cb) node = h('b', { key }, buf);
      else if (ci) node = h('i', { key }, buf);
      out.push(node); buf = '';
    };
    for (let k = 0; k < n; k++) {
      if (b[k] !== cb || it[k] !== ci) { flush(); cb = b[k]; ci = it[k]; }
      buf += str.charAt(k);
    }
    flush();
    return out.length ? out : str;
  }

  /* richText — текст с кликабельными иероглифами (озвучка по клику) + marks.
     marks применяются посегментно (частичный bold/italic тоже рендерится),
     внутри каждого сегмента иероглифы остаются кликабельными. */
  function richText(text, marks) {
    const str = String(text == null ? '' : text);
    if (!str) return str;
    const n = str.length;
    const b = new Array(n).fill(false), it = new Array(n).fill(false);
    (marks || []).forEach((mm) => {
      if (!mm || mm.start == null || mm.end == null) return;
      for (let k = Math.max(0, mm.start); k < Math.min(n, mm.end); k++) {
        if (mm.type === 'bold') b[k] = true;
        if (mm.type === 'italic') it[k] = true;
      }
    });
    const re = /([一-鿿]+)/g;
    let hk = 0;
    const splitHanzi = (chunk) => {           // кликабельные иероглифы внутри куска
      const nodes = [];
      let last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(chunk))) {
        if (m.index > last) nodes.push(chunk.slice(last, m.index));
        nodes.push(h('span', { key: 'h' + (hk++), className: 'le-hanzi', onClick: (e) => { e.stopPropagation(); speakHanzi(m[1]); } }, m[1]));
        last = m.index + m[1].length;
      }
      if (last < chunk.length) nodes.push(chunk.slice(last));
      return nodes;
    };
    const out = [];
    let seg = 0, i = 0;
    while (i < n) {
      const cb = b[i], ci = it[i];
      let j = i + 1;
      while (j < n && b[j] === cb && it[j] === ci) j++;
      const kids = splitHanzi(str.slice(i, j));
      const key = 's' + (seg++);
      let node;
      if (cb && ci) node = h('b', { key }, h('i', null, kids));
      else if (cb) node = h('b', { key }, kids);
      else if (ci) node = h('i', { key }, kids);
      else node = kids.length === 1 ? kids[0] : h('span', { key }, kids);
      out.push(node);
      i = j;
    }
    return out.length ? out : str;
  }

  function SpoilerView(props) {
    const b = props.block || {};
    const [open, setOpen] = useState(false);
    return h('div', { className: 'le-doc-spoiler' + (open ? ' is-open' : '') },
      b.title ? h('div', { className: 'le-doc-spoiler__q' }, richText(b.title)) : null,
      open
        ? h('div', { className: 'le-doc-spoiler__a' }, richText(b.text, b.marks))
        : h('button', { type: 'button', className: 'le-doc-spoiler__btn', onClick: function () { setOpen(true); } },
            Ic.Eye ? h(Ic.Eye, { size: 14 }) : null, h('span', null, 'Показать ответ')));
  }

  function fmtAudioTime(s) {
    if (!isFinite(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return m + ':' + (ss < 10 ? '0' : '') + ss;
  }

  /* Аудио в конспекте — настоящий мини-плеер (не пилюля-наклейка): круглая
     play/pause-кнопка, дорожка прогресса, тайминги. Озвучка — ядро языкового
     урока, поэтому она должна реально играть, а не просто намекать на это. */
  /* плеер-«виджет», структура как у системного плеера в Центре управления iOS:
     квадратная плашка-обложка (= кнопка play/pause) слева, заголовок сверху
     справа, на всю ширину — скрабер с точкой и тайминги по краям (прошло /
     осталось, осталось — со знаком минус, как в эталоне). */
  function AudioRow(props) {
    const b = props.block || {};
    const ref = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [cur, setCur] = useState(0);
    const [dur, setDur] = useState(0);
    const [seeking, setSeeking] = useState(false);
    useEffect(() => {
      const el = ref.current;
      if (!el) return;
      const onTime = function () { if (!seeking) setCur(el.currentTime || 0); };
      const onMeta = function () { setDur(el.duration || 0); };
      const onEnd = function () { setPlaying(false); setCur(0); };
      el.addEventListener('timeupdate', onTime);
      el.addEventListener('loadedmetadata', onMeta);
      el.addEventListener('ended', onEnd);
      return function () {
        el.removeEventListener('timeupdate', onTime);
        el.removeEventListener('loadedmetadata', onMeta);
        el.removeEventListener('ended', onEnd);
      };
    }, [b.url, seeking]);
    const toggle = function () {
      const el = ref.current;
      if (!el || !b.url) return;
      if (playing) el.pause(); else el.play().catch(function () {});
      setPlaying(!playing);
    };
    const onTrackClick = function (e) {
      const el = ref.current; if (!el || !dur) return;
      const r = e.currentTarget.getBoundingClientRect();
      const pct2 = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      el.currentTime = pct2 * dur; setCur(pct2 * dur);
    };
    const pct = dur ? Math.min(100, (cur / dur) * 100) : 0;
    return h('div', { className: 'le-doc-audio' + (playing ? ' is-playing' : '') },
      b.url ? h('audio', { ref, src: b.url, preload: 'metadata', style: { display: 'none' } }) : null,
      h('button', { type: 'button', className: 'le-doc-audio__tile', onClick: toggle, disabled: !b.url, 'aria-label': playing ? 'Пауза' : 'Слушать' },
        playing ? PauseGlyph(20) : PlayGlyph(20)),
      h('div', { className: 'le-doc-audio__b' },
        h('div', { className: 'le-doc-audio__t' }, b.title || 'Аудио'),
        h('div', {
          className: 'le-doc-audio__track', onClick: onTrackClick,
          onPointerDown: function () { setSeeking(true); }, onPointerUp: function () { setSeeking(false); },
        },
          h('i', { className: 'le-doc-audio__fill', style: { width: pct + '%' } }),
          h('i', { className: 'le-doc-audio__dot', style: { left: pct + '%' } })),
        h('div', { className: 'le-doc-audio__times' },
          h('span', null, b.url ? fmtAudioTime(cur) : 'нет файла'),
          b.url ? h('span', null, '−' + fmtAudioTime(Math.max(0, dur - cur))) : null)));
  }

  function renderDoc(doc) {
    return (doc || []).map((b, i) => {
      const key = (b && b._id) || ('d' + i);
      if (!b) return null;
      if (b.kind === 'heading') return h('div', { key, className: 'le-note-h' }, richText(b.text));
      if (b.kind === 'para') return h('p', { key, className: 'le-note-p' }, richText(b.text, b.marks));
      if (b.kind === 'quote') return h('blockquote', { key, className: 'le-doc-quote' }, richText(b.text, b.marks));
      if (b.kind === 'bullets') return h('ul', { key, className: 'le-doc-list' }, (b.items || []).map((it, k) => h('li', { key: k }, it || '')));
      if (b.kind === 'numbered') return h('ol', { key, className: 'le-doc-list le-doc-list--ol' }, (b.items || []).map((it, k) => h('li', { key: k }, it || '')));
      if (b.kind === 'word') return h('div', { key, className: 'le-dword' },
        h('span', { className: 'le-dword__hz' }, b.hanzi || '—'),
        h('span', { className: 'le-dword__b' },
          b.pinyin ? h('span', { className: 'le-dword__py' }, b.pinyin) : null,
          b.ru ? h('span', { className: 'le-dword__ru' }, b.ru) : null),
        b.hanzi ? h(SpeakBtn, { text: b.hanzi, size: 15, className: 'le-dword__say' }) : null);
      if (b.kind === 'image') return h('div', { key, className: 'le-note-img' },
        h('figure', null, h('img', { src: b.url, alt: b.caption || '', loading: 'lazy' }), b.caption ? h('figcaption', null, b.caption) : null));
      if (b.kind === 'audio') return h(AudioRow, { key, block: b });
      if (b.kind === 'hint') return h('div', { key, className: 'le-doc-callout le-doc-callout--hint' },
        h('span', { className: 'le-doc-callout__ic' }, Ic.Spark ? h(Ic.Spark, { size: 14 }) : null), h('span', { className: 'le-doc-callout__tx' }, b.text || ''));
      if (b.kind === 'important') return h('div', { key, className: 'le-doc-callout le-doc-callout--imp' },
        h('div', { className: 'le-doc-callout__head' }, Ic.AlertTriangle ? h(Ic.AlertTriangle, { size: 13 }) : null, h('span', null, 'Важно')),
        h('div', { className: 'le-doc-callout__tx' }, richText(b.text, b.marks)));
      if (b.kind === 'spoiler') return h(SpoilerView, { key, block: b });
      if (b.kind === 'example') return h('div', { key, className: 'le-doc-example' },
        b.hanzi ? h(SpeakBtn, { text: b.hanzi, size: 13, className: 'le-doc-example__say' }) : null,
        h('div', { className: 'le-doc-example__b' },
          b.hanzi ? h('div', { className: 'le-doc-example__hz' }, b.hanzi) : null,
          b.pinyin ? h('div', { className: 'le-doc-example__py' }, b.pinyin) : null,
          b.ru ? h('div', { className: 'le-doc-example__ru' }, b.ru) : null));
      if (b.kind === 'material') return h('a', { key, className: 'le-doc-material', href: b.url || '#', target: '_blank', rel: 'noreferrer' }, Ic.Paperclip ? h(Ic.Paperclip, { size: 15 }) : null, h('span', { className: 'le-doc-material__t' }, b.title || b.url || 'Материал'));
      if (b.kind === 'divider') return h('hr', { key, className: 'le-doc-divider' });
      return null;
    });
  }

  const SH = window.ESStudentShell;
  const toast = (window.EUI && window.EUI.toast) || function () {};

  // словарь из блоков теории — запасной глоссарий, если у урока нет своего
  function collectVocab(blocks) {
    const out = [], seen = {};
    (blocks || []).forEach((b) => {
      if (b.type === 'theory') (b.vocab || []).forEach((v) => {
        const k = v.hanzi || v.ru;
        if (k && !seen[k]) { seen[k] = 1; out.push(v); }
      });
    });
    return out;
  }

  // Фигура: контуры четырёх тонов (рисуется кодом — не сток-картинка)
  function ToneFigure(props) {
    if (props.name !== 'tones') return null;
    const tones = [
      { d: 'M5 7 L55 7', py: 'mā', ru: '1-й · ровный' },
      { d: 'M5 25 L55 6', py: 'má', ru: '2-й · восходящий' },
      { d: 'M5 9 Q 30 33 55 8', py: 'mǎ', ru: '3-й · ныряющий' },
      { d: 'M5 6 L55 26', py: 'mà', ru: '4-й · падающий' },
    ];
    return h('div', { className: 'le-fig' },
      h('div', { className: 'le-tones' }, tones.map((t, i) => h('div', { key: i, className: 'le-tone' },
        h('svg', { viewBox: '0 0 60 30', fill: 'none', 'aria-hidden': true },
          h('defs', null, h('linearGradient', { id: 'leTone' + i, x1: '0', y1: '0', x2: '1', y2: '0' },
            h('stop', { offset: '0', stopColor: '#5CB4FF' }), h('stop', { offset: '1', stopColor: '#1E63C2' }))),
          h('path', { d: t.d, stroke: 'url(#leTone' + i + ')', strokeWidth: 2.8, strokeLinecap: 'round', strokeLinejoin: 'round' })),
        h('div', { className: 'le-tone__py' }, t.py),
        h('div', { className: 'le-tone__ru' }, t.ru)))),
      h('div', { className: 'le-fig__cap' }, Ic.Info ? h(Ic.Info, { size: 14 }) : null, 'Один слог «ma» в четырёх тонах — четыре разных слова.'));
  }

  function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     GlassVideoPlayer — настоящий проигрыватель загруженного файла на жидком
     стекле (референс — iOS/Apple TV «Liquid Glass»): круглые frosted-glass
     кнопки перемотки ±10с и play/pause, нижняя стеклянная панель со скрабером,
     таймингом, mute и fullscreen. Управляет реальным <video> через ref — это
     НЕ декорация: после клика «play» родной браузерный UI больше не появляется
     (раньше так и было — наш красивый постер тут же подменялся уродливыми
     нативными контролами браузера). Контролы тихо гаснут во время игры и
     возвращаются по движению мыши/тапу — как в эталоне.
  ═════════════════════════════════════════════════════════════════════════ */
  function GlassVideoPlayer(props) {
    const { src, title, poster } = props;
    const videoRef = useRef(null);
    const hideTimer = useRef(0);
    const [playing, setPlaying] = useState(false);
    const [cur, setCur] = useState(0);
    const [dur, setDur] = useState(0);
    const [muted, setMuted] = useState(false);
    const [showCtl, setShowCtl] = useState(true);
    const [seeking, setSeeking] = useState(false);

    const wake = function () {
      setShowCtl(true);
      try { clearTimeout(hideTimer.current); } catch (e) {}
      hideTimer.current = setTimeout(function () { setShowCtl((s2) => { const el = videoRef.current; return (el && !el.paused && !seeking) ? false : s2; }); }, 2400);
    };
    useEffect(function () { return function () { try { clearTimeout(hideTimer.current); } catch (e) {} }; }, []);

    useEffect(function () {
      const el = videoRef.current;
      if (!el) return;
      const onTime = function () { if (!seeking) setCur(el.currentTime || 0); };
      const onMeta = function () { setDur(el.duration || 0); };
      const onPlay = function () { setPlaying(true); wake(); };
      const onPause = function () { setPlaying(false); setShowCtl(true); };
      const onEnd = function () { setPlaying(false); setShowCtl(true); };
      el.addEventListener('timeupdate', onTime);
      el.addEventListener('loadedmetadata', onMeta);
      el.addEventListener('play', onPlay);
      el.addEventListener('pause', onPause);
      el.addEventListener('ended', onEnd);
      return function () {
        el.removeEventListener('timeupdate', onTime);
        el.removeEventListener('loadedmetadata', onMeta);
        el.removeEventListener('play', onPlay);
        el.removeEventListener('pause', onPause);
        el.removeEventListener('ended', onEnd);
      };
      // eslint-disable-next-line
    }, [seeking]);

    const toggle = function () { const el = videoRef.current; if (!el) return; if (el.paused) el.play().catch(function () {}); else el.pause(); wake(); };
    const seekBy = function (delta) { const el = videoRef.current; if (!el) return; el.currentTime = Math.max(0, Math.min(dur || el.duration || 0, (el.currentTime || 0) + delta)); wake(); };
    const onTrackClick = function (e) {
      const el = videoRef.current; if (!el || !dur) return;
      const r = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      el.currentTime = pct * dur; setCur(pct * dur); wake();
    };
    const toggleMute = function () { const el = videoRef.current; if (!el) return; el.muted = !el.muted; setMuted(el.muted); wake(); };
    const toggleFs = function (e) {
      const wrap = e.currentTarget.closest('.le-gv'); if (!wrap) return;
      if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
      else wrap.requestFullscreen ? wrap.requestFullscreen().catch(function () {}) : null;
      wake();
    };
    const pct = dur ? Math.min(100, (cur / dur) * 100) : 0;

    return h('div', {
      className: 'le-gv' + (playing ? ' is-playing' : '') + (showCtl ? ' is-shown' : ''),
      onMouseMove: wake, onClick: function (e) { if (e.target === e.currentTarget || e.target.closest('.le-gv__tap')) toggle(); },
    },
      h('video', {
        ref: videoRef, className: 'le-gv__frame', src, poster: poster || undefined, playsInline: true, autoPlay: true,
        onClick: toggle,
      }),
      h('div', { className: 'le-gv__tap' }),
      title ? h('div', { className: 'le-gv__title' }, title) : null,
      h('div', { className: 'le-gv__trio' },
        h('button', { type: 'button', className: 'le-gv__glass le-gv__glass--side', onClick: function (e) { e.stopPropagation(); seekBy(-10); }, 'aria-label': 'Назад на 10 секунд' }, SeekGlyph(20, true)),
        h('button', { type: 'button', className: 'le-gv__glass le-gv__glass--main', onClick: function (e) { e.stopPropagation(); toggle(); }, 'aria-label': playing ? 'Пауза' : 'Смотреть' },
          playing ? PauseGlyph(26) : PlayGlyph(26)),
        h('button', { type: 'button', className: 'le-gv__glass le-gv__glass--side', onClick: function (e) { e.stopPropagation(); seekBy(10); }, 'aria-label': 'Вперёд на 10 секунд' }, SeekGlyph(20, false))),
      h('div', { className: 'le-gv__bar', onClick: function (e) { e.stopPropagation(); } },
        h('span', { className: 'le-gv__t' }, fmtAudioTime(cur)),
        h('span', { className: 'le-gv__track', onPointerDown: function () { setSeeking(true); }, onPointerUp: function () { setSeeking(false); }, onClick: onTrackClick },
          h('i', { className: 'le-gv__track-fill', style: { width: pct + '%' } }),
          h('i', { className: 'le-gv__track-dot', style: { left: pct + '%' } })),
        h('span', { className: 'le-gv__t le-gv__t--mute' }, fmtAudioTime(dur)),
        h('button', { type: 'button', className: 'le-gv__ic', onClick: toggleMute, 'aria-label': muted ? 'Включить звук' : 'Выключить звук' }, muted ? VolXGlyph(15) : VolGlyph(15)),
        h('button', { type: 'button', className: 'le-gv__ic', onClick: toggleFs, 'aria-label': 'Во весь экран' }, FsGlyph(15))));
  }

  /* ─────────────────────────────────────────────────────────────────────────
     StudyView — тело урока: тонкое имя → видео (якорь) → раскрывающийся
     конспект (цели, разбор, тоны, новые слова) → карточка домашки. Шарится со страницей ученика И превью
     конструктора (compact=true). props: { lesson, onStart, homeworkDone,
     hwResult, compact, playing, onPlay }.
  ───────────────────────────────────────────────────────────────────────── */
  function StudyView(props) {
    const { lesson, onStart, homeworkDone, hwResult, compact } = props;
    const internal = useState(false);
    const digest = useState(true);
    const tab = useState(0);
    if (!lesson) return null;
    const v = lesson.video || {};
    const emb = L.videoEmbed(v);
    const hasDoc = !!(lesson.doc && lesson.doc.length);
    const noteBlocks = hasDoc ? [] : L.notesToBlocks(lesson.notes);
    const blocks = lesson.blocks || [];
    const start = onStart || function () {};
    const glossary = (lesson.glossary && lesson.glossary.length) ? lesson.glossary : collectVocab(blocks);
    const objectives = (lesson.objectives || []).filter(Boolean);

    const playing = props.playing != null ? props.playing : internal[0];
    const setPlaying = props.onPlay || internal[1];
    const open = compact ? true : digest[0];
    const setOpen = digest[1];

    // file (прямой mp4 — играет всегда) приоритетнее ссылки на площадку
    const file = v.file || '';
    const hasVideo = !!file || !!emb;
    const canPlay = hasVideo && !compact;

    // ── плеер: единственный смелый якорь экрана ──
    let media = null;
    if (playing && !compact) {
      if (file) media = h(GlassVideoPlayer, { src: file, title: v.title || 'Видеоурок', poster: v.poster || '' });
      else if (emb) media = h('iframe', {
        className: 'le-player__frame', src: emb.src + (emb.src.indexOf('?') >= 0 ? '&' : '?') + 'autoplay=1',
        title: v.title || 'Видеоурок', loading: 'lazy',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen', allowFullScreen: true,
      });
    }
    // Иероглифы/пиньинь для наложенного титула: из видео, иначе из первого слова
    // урока (doc или глоссарий) — чтобы герой был живым, как в референсе.
    let heroHz = v.hanzi || '';
    let heroPy = v.pinyin || '';
    if (hasDoc && (!heroHz || !heroPy)) { const w = lesson.doc.find((b) => b && b.kind === 'word'); if (w) { if (!heroHz) heroHz = w.hanzi || ''; if (!heroPy) heroPy = w.pinyin || ''; } }
    if ((!heroHz || !heroPy) && glossary[0]) { if (!heroHz) heroHz = glossary[0].hanzi || ''; if (!heroPy) heroPy = glossary[0].pinyin || ''; }

    // Превью кадра: ручной постер > авто-превью YouTube > превью урока из модуля
    // (item.thumb) > сам файл как живой кадр. Так видео без своего постера всё
    // равно показывает нормальную картинку, а не чёрную дыру.
    const itemThumb = (props.item && props.item.thumb) || '';
    const itemDur = (props.item && props.item.duration) || '';
    const poster = v.poster || (emb && emb.thumb) || itemThumb || '';
    const showFileFrame = !poster && !!file;
    const player = !hasVideo
      ? h('div', { className: 'le-player le-player--empty' },
          h('span', { className: 'le-player__empty-ic' }, Ic.Monitor ? h(Ic.Monitor, { size: compact ? 17 : 21 }) : null),
          h('span', { className: 'le-player__empty-t' }, 'Видео пока не добавлено'))
      : media
        ? h('div', { className: 'le-player' }, media)
        : h('div', { className: 'le-player' },
          h(canPlay ? 'button' : 'div', {
            className: 'le-poster', type: canPlay ? 'button' : undefined,
            onClick: canPlay ? () => setPlaying(true) : undefined, 'aria-label': 'Смотреть видеоурок',
          },
            poster
              ? h('img', { className: 'le-poster__img', src: poster, alt: '', loading: 'lazy' })
              : showFileFrame
                ? h('video', { className: 'le-poster__img', src: file, muted: true, preload: 'metadata', playsInline: true })
                : h('span', { className: 'le-poster__sky' }),
            h('span', { className: 'le-poster__scrim' }),
            compact ? null : h('span', { className: 'le-poster__cap' }, PlayGlyph(11), 'Видеоурок'),
            compact ? null : h('span', { className: 'le-vtitle' },
              h('span', { className: 'le-vtitle__t' }, lesson.title || (props.item && props.item.title) || 'Видеоурок'),
              heroHz ? h('span', { className: 'le-vtitle__hz' }, heroHz) : null,
              heroPy ? h('span', { className: 'le-vtitle__py' }, heroPy) : null),
            h('span', { className: 'le-play' }, PlayGlyph(compact ? 19 : 27)),
            compact ? null : h('span', { className: 'le-vctrl' },
              h('span', { className: 'le-vctrl__pl' }, PlayGlyph(16)),
              h('span', { className: 'le-vctrl__t' }, '00:00 ', h('em', null, '/ ' + (v.duration || itemDur || '—'))),
              h('span', { className: 'le-vctrl__track' },
                h('i', { className: 'le-vctrl__fill', style: { width: '0%' } }),
                h('i', { className: 'le-vctrl__knob', style: { left: '0%' } })),
              h('span', { className: 'le-vctrl__sp' },
                h('span', { className: 'le-vctrl__ic' }, VolGlyph(16)),
                h('span', { className: 'le-vctrl__ic' }, Ic.Settings ? h(Ic.Settings, { size: 16 }) : null),
                h('span', { className: 'le-vctrl__ic' }, FsGlyph(16))))));

    // ── конспект (раскрывающийся): цели → разбор → тоны → новые слова ──
    const teaserBits = [];
    if (hasDoc) {
      const dHeads = lesson.doc.filter((b) => b && b.kind === 'heading').length;
      const dWords = lesson.doc.filter((b) => b && b.kind === 'word').length;
      if (dHeads) teaserBits.push(dHeads + ' ' + plural(dHeads, 'раздел', 'раздела', 'разделов'));
      if (dWords) teaserBits.push(dWords + ' ' + plural(dWords, 'новое слово', 'новых слова', 'новых слов'));
    } else {
      const heads = noteBlocks.filter((n) => n.kind === 'head').length;
      if (heads) teaserBits.push(heads + ' ' + plural(heads, 'раздел', 'раздела', 'разделов'));
      if (glossary.length) teaserBits.push(glossary.length + ' ' + plural(glossary.length, 'новое слово', 'новых слова', 'новых слов'));
    }
    if (objectives.length) teaserBits.push('цели урока');
    const teaser = teaserBits.join('  ·  ');

    const aims = objectives.length ? h('div', { className: 'le-aims' },
      h('div', { className: 'le-aims__l' }, 'В этом уроке вы научитесь'),
      h('div', { className: 'le-aims__list' }, objectives.map((o, i) => h('div', { key: i, className: 'le-aims__i' },
        h('span', { className: 'le-aims__c' }, Ic.Check ? h(Ic.Check, { size: 15, strokeWidth: 2.6 }) : '✓'),
        h('span', null, o))))) : null;

    const notesBody = hasDoc
      ? h('div', { className: 'le-doc' }, renderDoc(lesson.doc))
      : (noteBlocks.length ? h('div', null, noteBlocks.map((n, i) => {
          if (n.kind === 'head') return h('div', { key: i, className: 'le-note-h' }, n.text);
          if (n.kind === 'figure') return h(ToneFigure, { key: i, name: n.name });
          if (n.kind === 'img') return h('div', { key: i, className: 'le-note-img' },
            h('figure', null, h('img', { src: n.src, alt: n.alt || '', loading: 'lazy' }), n.alt ? h('figcaption', null, n.alt) : null));
          return h('p', { key: i, className: 'le-note-p' }, n.text);
        })) : null);

    // словарь урока: слова из doc, иначе глоссарий (для таба «Основные слова»)
    const docWords = hasDoc ? lesson.doc.filter((b) => b && b.kind === 'word').map((b) => ({ hanzi: b.hanzi, pinyin: b.pinyin, ru: b.ru })) : [];
    const vocab = docWords.length ? docWords : glossary;
    const vocabTable = function (list) {
      const half = Math.ceil(list.length / 2);
      const cols = [list.slice(0, half), list.slice(half)];
      return h('div', { className: 'le-vt' }, cols.map((col, ci) => h('div', { key: ci, className: 'le-vt__col' },
        col.map((g, i) => h('div', { key: i, className: 'le-vt__row' },
          h('span', { className: 'le-vt__hz' }, g.hanzi || '—'),
          h('span', { className: 'le-vt__py' }, g.pinyin || ''),
          h('span', { className: 'le-vt__ru' }, g.ru || ''))))));
    };

    // табы конспекта — только те, для которых есть содержимое (по референсу)
    // Порядок: сначала сам урок («Разбор» — то, что пишет преподаватель и что
    // видит ученик потоком), потом словарь-выжимка и цели. Ведём разбором, а не
    // сырым списком слов — так превью конструктора сразу показывает документ.
    const tabs = [];
    if (notesBody) tabs.push({ label: 'Разбор урока', node: h('div', { className: 'le-dpane', key: 'n' }, notesBody) });
    if (vocab.length) tabs.push({ label: 'Основные слова', node: h('div', { className: 'le-dpane', key: 'w' }, h('div', { className: 'le-dpane__h' }, 'Основные слова'), vocabTable(vocab)) });
    if (objectives.length) tabs.push({ label: 'Цели', node: h('div', { className: 'le-dpane', key: 'a' }, aims) });
    const ti = Math.min(tab[0], Math.max(0, tabs.length - 1));

    const pdfMat = (lesson.materials || []).find(function (m) { return m && /pdf/i.test((m.filename || '') + (m.url || '') + (m.title || '')); });
    const onPdf = function () { if (pdfMat && pdfMat.url) window.open(pdfMat.url, '_blank'); else toast('PDF-конспект скоро будет доступен'); };

    const digestEl = tabs.length ? h('div', { className: 'le-digest open' },
      h('div', { className: 'le-digest__hd' },
        h('span', { className: 'le-digest__hd-ic' }, Ic.Book ? h(Ic.Book, { size: 17 }) : null),
        h('span', { className: 'le-digest__hd-t' }, 'Конспект урока')),
      tabs.length > 1 ? h('div', { className: 'le-dtabs' }, tabs.map((t, i) => h('button', { key: i, type: 'button', className: 'le-dtab' + (i === ti ? ' is-on' : ''), onClick: () => tab[1](i) }, t.label))) : null,
      tabs[ti].node,
      compact ? null : h('div', { className: 'le-dfoot' },
        h('button', { type: 'button', className: 'le-dfoot__lnk', onClick: onPdf }, Ic.Download ? h(Ic.Download, { size: 16 }) : null, 'Скачать PDF-конспект'),
        h('button', { type: 'button', className: 'le-dfoot__dl', onClick: onPdf, 'aria-label': 'Скачать конспект' }, Ic.Download ? h(Ic.Download, { size: 17 }) : null))) : null;

    // ── домашка: карточка-тест с явным действием прямо здесь. Кнопку «Пройти
    //    тест» показываем и на полной странице (рядом с тестом — как просил
    //    владелец), не только в превью конструктора; после сдачи — «Пройти заново».
    const acc = hwResult && typeof hwResult.acc === 'number' ? hwResult.acc : null;
    const hwCta = !homeworkDone
      ? h('button', { type: 'button', className: 'le-btn le-btn--primary le-hw__cta', onClick: start },
          compact ? 'Начать' : 'Пройти тест', Ic.ArrowRight ? h(Ic.ArrowRight, { size: 17, className: 'arr' }) : null)
      : h('button', { type: 'button', className: 'le-btn le-btn--ghost le-hw__cta', onClick: start }, 'Пройти заново');
    var hwTasks = blocks.filter(function (b) { return b && b.type !== 'theory'; }).length || blocks.length;
    var hwMin = Math.max(1, Math.round(blocks.length * 1.2));
    const hwBody = blocks.length ? h('div', { className: 'le-hw' + (homeworkDone ? ' is-done' : '') },
      h('span', { className: 'le-hw__ic' }, homeworkDone ? (Ic.Check ? h(Ic.Check, { size: 21, strokeWidth: 2.6 }) : '✓') : (Ic.Edit ? h(Ic.Edit, { size: 19 }) : '✎')),
      h('div', { className: 'le-hw__b' },
        h('div', { className: 'le-hw__k' }, homeworkDone ? (acc != null ? 'Сдано · точность ' + acc + '%' : 'Сдано') : 'Домашнее задание'),
        h('div', { className: 'le-hw__t' }, homeworkDone ? 'Задание пройдено' : 'Закрепите урок на практике'),
        homeworkDone ? null : h('div', { className: 'le-hw__meta' },
          h('span', { className: 'le-hw__mi' }, (Ic.CheckCircle ? h(Ic.CheckCircle, { size: 13 }) : null), hwTasks + ' ' + plural(hwTasks, 'задание', 'задания', 'заданий')),
          h('span', { className: 'le-hw__dot' }),
          h('span', { className: 'le-hw__mi' }, (Ic.Clock ? h(Ic.Clock, { size: 13 }) : null), '~' + hwMin + ' мин'))),
      hwCta) : null;

    // ── материалы урока (файлы/ссылки, прикреплённые преподавателем) ──
    const mats = (lesson.materials || []).filter(function (m) { return m && (m.title || m.url || m.filename); });
    const matsEl = mats.length ? h('div', { className: 'le-mats' },
      h('div', { className: 'le-mats__h' }, Ic.Paperclip ? h(Ic.Paperclip, { size: 15 }) : null, h('span', null, 'Материалы')),
      h('div', { className: 'le-mats__list' }, mats.map(function (m, i) {
        return h('a', { key: i, className: 'le-mat', href: m.url || '#', target: '_blank', rel: 'noreferrer' },
          h('span', { className: 'le-mat__ic' }, Ic.File ? h(Ic.File, { size: 16 }) : null),
          h('span', { className: 'le-mat__t' }, m.title || m.filename || 'Файл'),
          Ic.Download ? h('span', { className: 'le-mat__dl' }, h(Ic.Download, { size: 15 })) : null);
      }))) : null;

    const titleEl = compact
      ? h('h1', { className: 'le-h1' }, lesson.title || 'Урок')
      : h('div', { className: 'le-titlerow' },
          h('h1', { className: 'le-h1' }, props.item ? ('Урок ' + props.item.n) : (lesson.title || 'Урок')),
          props.moduleName ? h('span', { className: 'le-modpill' }, Ic.Route ? h(Ic.Route, { size: 14 }) : null, props.moduleName) : null);

    return h('div', { className: 'le-study' + (compact ? ' is-compact' : '') },
      titleEl,
      lesson.subtitle ? h('p', { className: 'le-sub' }, lesson.subtitle) : null,
      player,
      digestEl,
      matsEl,
      hwBody);
  }

  window.ELessonUI = { BlockView, explainRow, StudyView, PlayGlyph };

  /* ─────────────────────────────────────────────────────────────────────────
     ТРЕНАЖЁР (домашка) — попап-модалка поверх страницы урока.
  ───────────────────────────────────────────────────────────────────────── */
  function Trainer(props) {
    const lesson = props.lesson;
    const blocks = lesson.blocks || [];

    // Состояние по каждому вопросу — массивами, чтобы работала навигация «назад»
    // без переспрашивания и без двойного начисления XP (счёт берём из scored[]).
    const [idx, setIdx] = useState(0);
    const [states, setStates] = useState(() => blocks.map((b) => L.initState(b)));
    const [reveals, setReveals] = useState(() => blocks.map(() => false));
    const [scored, setScored] = useState(() => blocks.map(() => null)); // null | true | false
    const [done, setDone] = useState(false);

    const block = blocks[idx];
    const total = blocks.length;
    const st = states[idx];
    const revealed = reveals[idx];
    const checkable = block && block.type !== 'theory';
    const complete = L.isComplete(block, st);
    const arrEl = () => Ic.ArrowRight ? h(Ic.ArrowRight, { size: 16, className: 'arr' }) : null;

    // деривация очков (back/forward-безопасно)
    const rightCount = scored.filter((x) => x === true).length;
    const theoryRevealed = blocks.filter((b, i) => b.type === 'theory' && reveals[i]).length;
    const baseXp = rightCount * 10 + theoryRevealed * 5;
    const gain = scored[idx] === true ? 10 : 0;

    const back = props.onExit || (() => nav('/learn'));
    const finish = props.onDone || back;

    const setSt = (v) => setStates((arr) => { const a = arr.slice(); a[idx] = (typeof v === 'function' ? v(arr[idx]) : v); return a; });
    const setAt = (setter, i, val) => setter((arr) => { const a = arr.slice(); a[i] = val; return a; });

    // блокируем прокрутку фона, пока открыт попап
    useEffect(() => {
      const mn = document.querySelector('.sd-main');
      const prev = mn ? mn.style.overflow : '';
      if (mn) mn.style.overflow = 'hidden';
      return () => { if (mn) mn.style.overflow = prev; };
    }, []);

    const onCheck = () => {
      if (revealed || !complete) return;
      const ok = L.isCorrect(block, st);
      setAt(setReveals, idx, true);
      setAt(setScored, idx, ok);
    };
    const advance = () => {
      const next = idx + 1;
      if (next >= total) { setDone(true); return; }
      setIdx(next);
    };
    const goBack = () => { if (idx > 0) setIdx(idx - 1); };
    const onTheoryNext = () => { setAt(setReveals, idx, true); advance(); };
    const restart = () => {
      setIdx(0); setStates(blocks.map((b) => L.initState(b)));
      setReveals(blocks.map(() => false)); setScored(blocks.map(() => null)); setDone(false);
    };

    useEffect(() => {
      const onKey = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); back(); return; }
        if (done) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          if (revealed) advance();
          else if (block && block.type === 'theory') onTheoryNext();
          else if (complete) onCheck();
        } else if ((e.key === 'ArrowLeft' || e.key === 'Backspace') && idx > 0) {
          e.preventDefault(); goBack();
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    });

    const closeX = (float) => h('button', {
      type: 'button', className: 'lt-modal__x' + (float ? ' lt-modal__x--float' : ''), onClick: back, 'aria-label': 'Закрыть тест',
    }, Ic.Close ? h(Ic.Close, { size: 18 }) : '×');
    const backdrop = (e) => { if (e.target === e.currentTarget) back(); };

    if (done) {
      const scoredCount = blocks.filter((b) => b.type !== 'theory').length || 1;
      const acc = Math.round((rightCount / scoredCount) * 100);
      const xp = baseXp + 20;
      return h('div', { className: 'lt-modal', onMouseDown: backdrop },
        h('div', { className: 'lt-modal__panel', role: 'dialog', 'aria-modal': 'true' },
          closeX(true),
          h('div', { className: 'lt-done' },
            h('div', { className: 'lt-done__star' + (acc >= 80 ? ' is-win' : '') }, Ic.Star ? h(Ic.Star, { size: 54 }) : '★'),
            h('div', { className: 'lt-done__k' }, 'Домашка сдана'),
            h('h2', { className: 'lt-done__h' }, acc >= 80 ? 'Отлично! Ещё шаг к вершине' : 'Хороший заход'),
            h('p', { className: 'lt-done__s' }, acc >= 80
              ? 'Сильно. Вы уверенно держите новые слова — так и поднимаемся к HSK.'
              : 'Эти слова уже ваши, остальное закрепим на следующем уроке.'),
            h('div', { className: 'lt-stats' },
              h('div', { className: 'lt-stat lt-stat--gold' }, h('div', { className: 'lt-stat__v gold' }, '+' + xp), h('div', { className: 'lt-stat__k' }, 'XP за домашку')),
              h('div', { className: 'lt-stat' }, h('div', { className: 'lt-stat__v' }, acc + '%'), h('div', { className: 'lt-stat__k' }, 'Точность')),
              h('div', { className: 'lt-stat' }, h('div', { className: 'lt-stat__v' }, rightCount + '/' + scoredCount), h('div', { className: 'lt-stat__k' }, 'Верных ответов'))),
            h('div', { className: 'lt-done__cta' },
              h('button', { type: 'button', className: 'le-btn le-btn--primary', onClick: () => finish({ acc: acc, xp: xp }) }, 'Вернуться к уроку', arrEl()),
              h('button', { type: 'button', className: 'le-btn le-btn--ghost', onClick: restart }, 'Пройти ещё раз')))));
    }

    const pct = Math.round(((idx + (revealed ? 1 : 0)) / total) * 100);
    const ansOk = revealed && checkable && L.isCorrect(block, st);
    const ansBad = revealed && checkable && !L.isCorrect(block, st);

    let footBtn;
    if (revealed) footBtn = h('button', { type: 'button', className: 'le-btn ' + (ansBad ? 'le-btn--primary' : 'le-btn--ok'), onClick: advance }, idx + 1 >= total ? 'Завершить' : 'Дальше', arrEl());
    else if (block.type === 'theory') footBtn = h('button', { type: 'button', className: 'le-btn le-btn--primary', onClick: onTheoryNext }, 'Понятно, дальше', arrEl());
    else footBtn = h('button', { type: 'button', className: 'le-btn le-btn--primary', disabled: !complete, onClick: onCheck }, 'Проверить');

    return h('div', { className: 'lt-modal', onMouseDown: backdrop },
      h('div', { className: 'lt-modal__panel', role: 'dialog', 'aria-modal': 'true' },
        h('div', { className: 'lt-modal__head' },
          h('div', { className: 'lt-modal__hrow' },
            h('span', { className: 'lt-badge' }, Ic.Edit ? h(Ic.Edit, { size: 13 }) : null, h('span', null, 'Домашка')),
            baseXp > 0 ? h('span', { className: 'lt-xp' }, '+' + baseXp, h('span', { className: 'lt-xp__u' }, ' XP')) : null,
            h('span', { className: 'lt-modal__count' }, (idx + 1), h('span', { className: 'lt-modal__count-d' }, ' / ' + total)),
            closeX(false)),
          h('div', { className: 'lt-seg' }, blocks.map(function (b, i) {
            var c = 'lt-seg__i';
            if (scored[i] === true) c += ' is-ok';
            else if (scored[i] === false) c += ' is-bad';
            else if (i === idx) c += ' is-cur';
            else if (i < idx || reveals[i]) c += ' is-done';
            return h('span', { key: i, className: c });
          }))),
        h('div', { className: 'lt-modal__body' },
          h('div', { className: 'lt-q', key: idx }, h(BlockView, { block, st, revealed, onChange: setSt }))),
        h('div', { className: 'lt-modal__foot' },
          h('button', { type: 'button', className: 'le-btn le-btn--ghost lt-back', disabled: idx === 0, onClick: goBack },
            Ic.ArrowLeft ? h(Ic.ArrowLeft, { size: 16 }) : '‹', 'Назад'),
          h('div', { className: 'lt-fb' + ((ansOk || ansBad) ? ' show ' : ' ') + (ansOk ? 'ok' : ansBad ? 'bad' : '') },
            (ansOk || ansBad) ? h('span', { className: 'lt-fb__ic' }, ansOk ? (Ic.Check ? h(Ic.Check, { size: 17, strokeWidth: 2.6 }) : '✓') : (Ic.Close ? h(Ic.Close, { size: 17 }) : '×')) : null,
            ansOk ? h('span', null, 'Верно! ', h('span', { className: 'lt-fb__xp' }, '+' + (gain || 10), ' XP'))
              : ansBad ? h('span', null, 'Почти — посмотрите верный вариант') : h('span', { className: 'lt-fb__hint' }, checkable ? 'Выберите ответ и проверьте' : '')),
          footBtn)));
  }

  /* ─────────────────────────────────────────────────────────────────────────
     Рейл: «Ваш прогресс» (круговой график) + плейлист видео + преподаватель.
  ───────────────────────────────────────────────────────────────────────── */
  // Круговой график прогресса курса. Заголовки нормальные (тёмное чернило),
  // без разрядки и серых микро-меток. Заливка кольца плоская (без выпуклого градиента).
  function ProgressCard(props) {
    const C = L.COURSE || {};
    const total = C.total || 32;
    const n = props.activeN;
    const pct = Math.round((n / total) * 100);
    const levelTotal = C.levelTotal || total;
    const left = Math.max(0, levelTotal - n);
    const R = 15.9155; // длина окружности = 100 → dasharray "pct 100"
    return h('div', { className: 'le-prog' },
      h('div', { className: 'le-prog__hd' },
        h('span', { className: 'le-prog__lab' }, 'Ваш прогресс'),
        h('span', { className: 'le-prog__chip' }, C.moduleShort || 'Модуль 1')),
      h('div', { className: 'le-prog__body' },
        h('div', { className: 'le-prog__ring' },
          h('svg', { viewBox: '0 0 36 36', 'aria-hidden': true },
            h('circle', { cx: 18, cy: 18, r: R, fill: 'none', stroke: 'rgba(22,32,59,.10)', strokeWidth: 3.4 }),
            h('circle', {
              cx: 18, cy: 18, r: R, fill: 'none', stroke: 'var(--le-acc-deep)', strokeWidth: 3.4,
              strokeLinecap: 'round', strokeDasharray: pct + ' 100',
            })),
          h('span', { className: 'le-prog__pctt' }, pct, h('em', null, '%'))),
        h('div', { className: 'le-prog__meta' },
          h('div', { className: 'le-prog__big' }, n + ' из ' + total + ' ' + plural(total, 'урока', 'уроков', 'уроков')),
          h('div', { className: 'le-prog__sub' }, left > 0
            ? ['До следующего уровня осталось ', h('b', { key: 'b' }, left + ' ' + plural(left, 'урок', 'урока', 'уроков'))]
            : 'Уровень пройден — впереди новый модуль'))));
  }

  // Плейлист уроков модуля с реальными превью видео (вайб ютуба):
  // пройдено (балл) · сейчас · заблокировано.
  function Playlist(props) {
    const lessons = props.lessons;
    const n = props.activeN;
    const C = L.COURSE || {};
    const doneCount = lessons.filter((it) => it.state === 'done').length;
    const progPct = Math.round((doneCount / Math.max(1, lessons.length)) * 100);
    return h('div', { className: 'le-pl' },
      h('div', { className: 'le-pl__hd' },
        h('span', { className: 'le-pl__hd-ic' }, Ic.Route ? h(Ic.Route, { size: 17 }) : (Ic.Grid ? h(Ic.Grid, { size: 16 }) : null)),
        h('span', { className: 'le-pl__hd-b' },
          h('span', { className: 'le-pl__hd-t' }, C.module || 'Модуль 1 · Первые слова'),
          h('span', { className: 'le-pl__hd-m' }, doneCount + ' из ' + lessons.length + ' ' + plural(lessons.length, 'урок', 'урока', 'уроков') + ' пройдено'))),
      h('div', { className: 'le-pl__bar' }, h('i', { style: { width: progPct + '%' } })),
      h('div', { className: 'le-pl__list' }, lessons.map((it) => {
        const cur = it.n === n;
        const onClick = it.state === 'locked'
          ? () => toast('Урок откроется после занятия' + (it.when ? ': ' + it.when : ''))
          : () => props.onSwitch(it);
        const right = cur
          ? h('span', { className: 'le-pli__now' }, 'Сейчас')
          : it.state === 'done'
            ? h('span', { className: 'le-pli__sc' }, Ic.Check ? h(Ic.Check, { size: 14, strokeWidth: 3 }) : '✓')
            : it.state === 'locked' ? h('span', { className: 'le-pli__lock' }, Ic.Lock ? h(Ic.Lock, { size: 15 }) : null) : null;
        return h('button', { key: it.n, type: 'button', className: 'le-pli ' + it.state + (cur ? ' current' : ''), onClick: onClick },
          h('span', { className: 'le-pli__node' }),
          h('span', { className: 'le-pli__th' },
            it.thumb ? h('img', { src: it.thumb, alt: '', loading: 'lazy' }) : null,
            cur ? h('span', { className: 'le-pli__play' }, PlayGlyph(16)) : null),
          h('span', { className: 'le-pli__b' },
            h('span', { className: 'le-pli__t' }, it.title),
            h('span', { className: 'le-pli__m' },
              h('span', null, it.duration),
              it.words ? h('i', null) : null,
              it.words ? h('span', null, it.words + ' ' + plural(it.words, 'слово', 'слова', 'слов')) : null)),
          h('span', { className: 'le-pli__r' }, right));
      })),
      h('button', { type: 'button', className: 'le-pl__all', onClick: () => nav('/learn') },
        'Показать все уроки', Ic.ArrowRight ? h(Ic.ArrowRight, { size: 14 }) : null));
  }

  function TeacherCard() {
    const t = (L.COURSE && L.COURSE.teacher) || { name: 'Преподаватель', role: '', initial: 'И' };
    const initial = t.initial || (t.name || 'И').charAt(0);
    return h('div', { className: 'le-card' },
      h('div', { className: 'le-card__h' },
        h('span', { className: 'le-card__hdot', title: 'На связи' }),
        h('span', { className: 'le-card__t' }, 'Ваш преподаватель')),
      h('div', { className: 'le-tch' },
        h('span', { className: 'le-tch__av' },
          initial,
          t.photo ? h('img', { src: t.photo, alt: t.name, loading: 'lazy', onError: function (e) { e.target.style.display = 'none'; } }) : null),
        h('div', { className: 'le-tch__b' },
          h('div', { className: 'le-tch__n' }, t.name),
          h('div', { className: 'le-tch__r' }, t.role || 'Преподаватель курса'))),
      h('button', { type: 'button', className: 'le-tchbtn', onClick: () => { if (SH && SH.openChat) SH.openChat({ label: t.name + ' · преподаватель' }); } },
        Ic.Chat ? h(Ic.Chat, { size: 15 }) : null, 'Написать преподавателю'));
  }

  function LessonHeader(props) {
    const cur = props.item;
    return h('div', { className: 'le-head' },
      h('div', { className: 'le-crumb' },
        h('button', { type: 'button', className: 'le-crumb__home', onClick: () => nav('/learn') }, Ic.Book ? h(Ic.Book, { size: 15 }) : null, 'Обучение'),
        h('span', { className: 'le-crumb__sep le-crumb__sep--mod' }, '/'),
        h('span', { className: 'le-crumb__mod', style: { color: 'var(--le-ink-mute)', fontWeight: 500 } }, (L.COURSE && L.COURSE.module) || 'Модуль'),
        h('span', { className: 'le-crumb__sep' }, '/'),
        h('span', { className: 'le-crumb__cur' }, 'Урок ' + cur.n)),
      h('div', { className: 'le-switch' },
        h('button', { type: 'button', className: 'le-nav', disabled: !props.prevOk, onClick: props.onPrev, 'aria-label': 'Предыдущий урок' }, Ic.ChevronLeft ? h(Ic.ChevronLeft, { size: 19 }) : '‹'),
        h('span', { className: 'le-switch__lab' }, 'Урок ' + cur.n + ' / ' + props.total),
        h('button', { type: 'button', className: 'le-nav', disabled: !props.nextOk, onClick: props.onNext, 'aria-label': 'Следующий урок' }, Ic.ChevronRight ? h(Ic.ChevronRight, { size: 19 }) : '›')));
  }

  // Нижняя панель урока — канон анкеты: «Назад · Урок N из M · Дальше».
  // «Дальше» ведёт по сценарию: не сдан тест → к тесту; сдан → следующий урок.
  function LessonFoot(props) {
    const { item, total, lessons, prevOk, onPrev, nextOk, onNext, homeworkDone, onStart } = props;
    const arr = () => Ic.ArrowRight ? h(Ic.ArrowRight, { size: 16, className: 'arr' }) : null;
    const back = h('button', { type: 'button', className: 'le-btn le-btn--ghost', disabled: !prevOk, onClick: prevOk ? onPrev : undefined },
      Ic.ArrowLeft ? h(Ic.ArrowLeft, { size: 16 }) : '‹', 'Назад');
    let next;
    if (!homeworkDone) next = h('button', { type: 'button', className: 'le-btn le-btn--primary', onClick: onStart }, 'Перейти к тесту', arr());
    else if (nextOk) next = h('button', { type: 'button', className: 'le-btn le-btn--primary', onClick: onNext }, 'Следующий урок', arr());
    else next = h('button', { type: 'button', className: 'le-btn le-btn--primary', disabled: true }, 'Модуль пройден');
    return h('div', { className: 'le-foot' },
      back,
      h('div', { className: 'le-foot__mid' },
        h('span', { className: 'le-foot__dots' }, lessons.map((it) => h('span', { key: it.n, className: 'le-foot__dot' + (it.n === item.n ? ' on' : '') }))),
        h('span', { className: 'le-foot__step' }, 'Урок ' + item.n + ' из ' + total)),
      next);
  }

  function LessonPage(props) {
    const { lesson, item, lessons, onStart, homeworkDone, hwResult, playing, onPlay, onSwitch, onPrev, onNext, prevOk, nextOk } = props;
    const total = (L.COURSE && L.COURSE.total) || lessons.length;
    return h('div', { className: 'le-root' },
      h(LessonHeader, { item, total, onPrev, onNext, prevOk, nextOk }),
      h('div', { className: 'le-grid' },
        h('div', { className: 'le-main' },
          h(StudyView, { lesson, item, moduleName: (L.COURSE && L.COURSE.module) || 'Модуль 1', onStart, homeworkDone, hwResult, playing, onPlay }),
          h(LessonFoot, { item, total, lessons, prevOk, onPrev, nextOk, onNext, homeworkDone, onStart })),
        h('aside', { className: 'le-rail' },
          h(Playlist, { lessons, activeN: item.n, onSwitch }),
          h(TeacherCard, null))));
  }

  /* ─────────────────────────────────────────────────────────────────────────
     LearnLesson — корневой экран внутри сайдбара ученика. study ⇄ homework,
     переключение между уроками модуля.
  ───────────────────────────────────────────────────────────────────────── */
  function LearnLesson() {
    if (!L) return h('div', { style: { padding: 40 } }, 'Учебный модуль не загружен');
    const loadedRef = useRef(null);
    if (!loadedRef.current) loadedRef.current = L.load();
    const live = loadedRef.current;
    const lessons = ((L.COURSE && L.COURSE.lessons) || []).map((it) => it.live ? Object.assign({}, it, { title: live.title || it.title }) : it);
    const currentItem = lessons.find((it) => it.live) || lessons[lessons.length - 1] || { n: 1, state: 'current' };

    const [activeN, setActiveN] = useState(currentItem.n);
    const [mode, setMode] = useState('study');
    const [hwDone, setHwDone] = useState(false);
    const [hwResult, setHwResult] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [run, setRun] = useState(0);

    const item = lessons.find((it) => it.n === activeN) || currentItem;
    const activeLesson = item.live ? live : (item.lesson || live);

    const openable = lessons.filter((it) => it.state !== 'locked');
    const pos = openable.findIndex((it) => it.n === item.n);
    const prevItem = pos > 0 ? openable[pos - 1] : null;
    const nextItem = pos >= 0 && pos < openable.length - 1 ? openable[pos + 1] : null;

    const switchTo = (it) => {
      if (!it) return;
      if (it.state === 'locked') { toast('Урок откроется после занятия' + (it.when ? ': ' + it.when : '')); return; }
      setActiveN(it.n); setMode('study'); setHwDone(false); setHwResult(null); setPlaying(false);
      const mn = document.querySelector('.sd-main'); if (mn) mn.scrollTop = 0;
    };

    // Страница урока — всегда; тест — попап-модалка поверх неё.
    const page = h(LessonPage, {
      lesson: activeLesson, item, lessons,
      onStart: () => { setRun((r) => r + 1); setMode('homework'); },
      homeworkDone: hwDone, hwResult, playing, onPlay: setPlaying, onSwitch: switchTo,
      onPrev: prevItem ? () => switchTo(prevItem) : undefined, onNext: nextItem ? () => switchTo(nextItem) : undefined,
      prevOk: !!prevItem, nextOk: !!nextItem,
    });
    const modal = mode === 'homework' ? h(Trainer, {
      key: 'hw-' + run + '-' + activeN, lesson: activeLesson,
      onExit: () => setMode('study'),
      onDone: (res) => { setHwDone(true); setHwResult(res || null); setMode('study'); },
    }) : null;
    const content = h('div', null, page, modal);

    if (SH && SH.Shell) return h(SH.Shell, { active: 'learn', surface: 'light', hideTopBar: true }, content);
    return h('div', { style: { padding: 24, minHeight: '100vh', background: '#F6F7FE' } }, content);
  }

  (window.EScreens = window.EScreens || {}).LearnLesson = LearnLesson;
})();
