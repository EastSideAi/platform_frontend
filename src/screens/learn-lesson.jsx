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
  .lx-prompt{font-weight:600;font-size:22px;letter-spacing:-.4px;line-height:1.2;color:var(--lx-ink);text-wrap:balance;}
  .lx-kick{font-size:12.5px;font-weight:600;color:var(--lx-acc-ink);margin-bottom:14px;display:flex;align-items:center;gap:8px;}
  .lx-kick svg{display:none;}

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
  .lx-opts{display:flex;flex-direction:column;gap:11px;margin-top:24px;}
  .lx-opts--wrap{flex-direction:row;flex-wrap:wrap;gap:10px;margin-top:18px;}
  .lx-opt{position:relative;display:flex;align-items:center;gap:14px;width:100%;text-align:left;cursor:pointer;
    padding:16px 18px;border-radius:15px;background:rgba(255,255,255,.7);border:1.5px solid rgba(22,32,59,.1);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.8);color:var(--lx-ink);
    transition:transform .15s cubic-bezier(.23,1,.32,1),border-color .15s,background .15s,box-shadow .15s;}
  .lx-opts--wrap .lx-opt{width:auto;flex:0 0 auto;}
  .lx-opt:hover:not(.is-locked){border-color:var(--lx-acc-line);background:rgba(255,255,255,.92);transform:translateY(-1px);}
  .lx-opt__mk{flex:0 0 30px;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-size:13px;font-weight:700;
    color:var(--lx-ink-mute);background:rgba(22,32,59,.05);box-shadow:inset 0 0 0 1px rgba(22,32,59,.06);transition:all .15s;}
  .lx-opt__t{flex:1 1 auto;font-size:17px;font-weight:600;letter-spacing:-.2px;}
  .lx-opt__fb{flex:0 0 auto;display:none;}
  .lx-opt.is-sel{border-color:var(--lx-acc-line);background:linear-gradient(150deg,rgba(255,255,255,.96),rgba(238,244,255,.86));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 30px rgba(43,143,255,.1),0 6px 18px rgba(43,90,200,.1);}
  .lx-opt.is-sel .lx-opt__mk{color:#fff;background:var(--lx-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.25);}
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
  .lx-match{display:grid;grid-template-columns:1fr 1fr;gap:14px 22px;margin-top:24px;}
  .lx-mcol{display:flex;flex-direction:column;gap:11px;}
  .lx-mcol__h{font-size:12px;font-weight:600;color:var(--lx-ink-mute);margin-bottom:2px;}
  .lx-mi{position:relative;display:flex;align-items:center;gap:12px;cursor:pointer;padding:14px 16px;border-radius:14px;
    background:rgba(255,255,255,.7);border:1.5px solid rgba(22,32,59,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);
    transition:transform .15s cubic-bezier(.23,1,.32,1),border-color .15s,background .15s;}
  .lx-mi:hover:not(.is-locked){border-color:var(--lx-acc-line);transform:translateY(-1px);}
  .lx-mi__t{flex:1 1 auto;font-size:17px;font-weight:600;color:var(--lx-ink);letter-spacing:-.2px;}
  .lx-mcol--l .lx-mi__t{font-size:22px;color:var(--lx-acc-deep);letter-spacing:.5px;}
  .lx-mi__b{flex:0 0 auto;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;font-size:12px;font-weight:800;
    color:#fff;font-variant-numeric:tabular-nums;opacity:0;transform:scale(.6);transition:opacity .15s,transform .18s cubic-bezier(.23,1,.32,1);}
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
  .sd-wrap:has(.le-root){max-width:1216px;padding:30px 44px 76px;}
  @media (max-width:680px){.sd-wrap:has(.le-root){padding:16px 18px 44px;}}

  /* .lt-modal — попап-тест рендерится сиблингом .le-root, поэтому токены ОБЯЗАНЫ
     объявляться и на нём, иначе var(--le-*) внутри модалки не резолвится
     (кнопки становятся прозрачными — «невидимая белая кнопка»). */
  .le-root,.le-study,.lt-modal{
    --le-display:-apple-system,'SF Pro Display','Onest',system-ui,sans-serif;
    --le-acc:#2B8FFF; --le-acc-2:#5CB4FF; --le-acc-deep:#2073E6; --le-acc-ink:#1763C8;
    --le-acc-soft:rgba(43,143,255,.09); --le-acc-line:rgba(43,143,255,.36);
    --le-ink:#16203B; --le-ink-sub:rgba(22,32,59,.62); --le-ink-mute:rgba(22,32,59,.44); --le-ink-faint:rgba(22,32,59,.28);
    --le-jade:#1C7E52; --le-jade-soft:#E2F4EA; --le-gold:#E2A52E; --le-rose:#B23B2A;
    --le-line:rgba(22,32,59,.08); --le-line-soft:rgba(22,32,59,.05);
    --le-card:rgba(255,255,255,.55); --le-hi:inset 0 1px 0 rgba(255,255,255,.7);
    font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;color:var(--le-ink);-webkit-font-smoothing:antialiased;
  }
  .le-root *{box-sizing:border-box;}

  .le-head{position:sticky;top:0;z-index:9;display:flex;align-items:center;gap:16px;margin:-30px -44px 0;padding:20px 44px 14px;
    background:linear-gradient(180deg,#F7F8FE 60%,rgba(247,248,254,.85) 82%,rgba(247,248,254,0));}
  .le-crumb{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:9px;font-size:12.5px;font-weight:600;}
  .le-crumb a,.le-crumb button{font:inherit;color:var(--le-ink-mute);background:0;border:0;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:7px;transition:color .15s;white-space:nowrap;}
  .le-crumb a:hover,.le-crumb button:hover{color:var(--le-acc-deep);}
  .le-crumb__sep{color:var(--le-ink-faint);flex:0 0 auto;}
  .le-crumb__cur{color:var(--le-ink);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;}
  .le-switch{flex:0 0 auto;display:flex;align-items:center;gap:8px;}
  .le-switch__lab{font-size:12px;font-weight:600;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;white-space:nowrap;}
  .le-nav{flex:0 0 auto;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;cursor:pointer;color:var(--le-ink-sub);
    background:rgba(255,255,255,.6);border:1px solid var(--le-line);transition:transform .15s,color .15s,border-color .15s,opacity .15s;}
  .le-nav:hover:not(:disabled){transform:translateY(-1px);color:var(--le-acc-deep);border-color:var(--le-acc-line);}
  .le-nav:disabled{opacity:.32;cursor:not-allowed;}

  .le-grid{display:grid;grid-template-columns:minmax(0,1fr) 352px;gap:36px;align-items:start;margin-top:24px;}
  .le-main{min-width:0;}
  .le-rail{position:sticky;top:72px;display:flex;flex-direction:column;gap:16px;}

  /* имя урока — SF Pro Display, тонкое но тёмное (не hairline, не жирное) */
  .le-h1{font-family:var(--le-display);font-weight:400;font-size:40px;letter-spacing:-.026em;line-height:1.08;color:var(--le-ink);margin:0;text-wrap:balance;}
  .le-sub{font-size:16.5px;line-height:1.6;color:var(--le-ink-sub);margin-top:13px;max-width:56ch;font-weight:400;}

  /* ── ПЛЕЕР — единственный якорь: реальное превью + кастомная панель (вайб ютуба, но чисто) ── */
  .le-player{position:relative;margin-top:26px;border-radius:18px;overflow:hidden;aspect-ratio:16/9;background:#0A1430;
    border:1px solid var(--le-line);box-shadow:0 22px 48px -30px rgba(12,26,70,.5);}
  .le-player__frame{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;}
  .le-poster{position:absolute;inset:0;cursor:pointer;display:block;overflow:hidden;border:0;width:100%;height:100%;padding:0;background:0;}
  .le-poster__img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;}
  /* мягкая виньетка: затемняем низ под панель и чуть верх под мету, не «пузырём» */
  .le-poster__scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,16,40,.28) 0%,rgba(8,16,40,0) 26%,rgba(8,16,40,0) 50%,rgba(6,12,32,.62) 100%);}
  .le-poster__sky{position:absolute;inset:0;background:radial-gradient(130% 120% at 50% 8%,#16264F 0%,#0B1530 60%,#070E22 100%);}
  .le-poster__cap{position:absolute;left:16px;top:14px;z-index:2;display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:600;color:rgba(255,255,255,.92);}
  .le-poster__cap svg{opacity:.92;}
  .le-poster__dur{position:absolute;right:14px;top:14px;z-index:2;font-size:11.5px;font-weight:700;color:#fff;background:rgba(8,14,34,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.14);padding:4px 9px;border-radius:8px;font-variant-numeric:tabular-nums;}
  .le-play{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);z-index:2;width:76px;height:76px;border-radius:50%;display:grid;place-items:center;color:var(--le-acc-deep);
    background:rgba(255,255,255,.94);border:1px solid rgba(255,255,255,.7);box-shadow:0 18px 40px -14px rgba(4,12,40,.62),inset 0 1px 0 rgba(255,255,255,.9);transition:transform .16s cubic-bezier(.23,1,.32,1);}
  .le-poster:hover .le-play{transform:translate(-50%,-50%) scale(1.07);}
  .le-play svg{margin-left:4px;}
  .le-bar{position:absolute;left:12px;right:12px;bottom:12px;z-index:2;display:flex;align-items:center;gap:13px;height:46px;padding:0 14px;border-radius:13px;
    background:rgba(10,18,42,.5);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.14);box-shadow:0 10px 26px -14px rgba(4,10,30,.6),inset 0 1px 0 rgba(255,255,255,.14);}
  .le-bar__pl{flex:0 0 auto;display:inline-flex;color:#fff;}
  .le-bar__t{flex:0 0 auto;font-size:11.5px;font-weight:600;color:rgba(255,255,255,.92);font-variant-numeric:tabular-nums;}
  .le-bar__t--d{color:rgba(255,255,255,.55);}
  .le-bar__track{flex:1 1 auto;height:4px;border-radius:99px;background:rgba(255,255,255,.22);overflow:hidden;}
  .le-bar__track i{display:block;height:100%;width:14%;border-radius:99px;background:var(--le-acc);}
  .le-bar__spd{flex:0 0 auto;font-size:11px;font-weight:700;color:#fff;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);padding:3px 7px;border-radius:7px;font-variant-numeric:tabular-nums;}
  .le-bar__ic{flex:0 0 auto;display:inline-flex;color:rgba(255,255,255,.78);}

  /* ── КОНСПЕКТ — раскрытая панель, крупно и чисто ──────────────────────────── */
  .le-digest{margin-top:30px;border-radius:18px;border:1px solid var(--le-line);background:var(--le-card);box-shadow:var(--le-hi);overflow:hidden;}
  .le-digest__bar{width:100%;display:flex;align-items:center;gap:16px;padding:19px 24px;cursor:pointer;background:0;border:0;font:inherit;text-align:left;color:var(--le-ink);transition:background .15s;}
  .le-digest__bar:hover{background:rgba(43,143,255,.02);}
  .le-digest__ti{flex:1 1 auto;min-width:0;}
  .le-digest__t{font-family:var(--le-display);font-weight:500;font-size:19px;letter-spacing:-.012em;color:var(--le-ink);}
  .le-digest__h{font-size:13px;font-weight:500;color:var(--le-ink-mute);margin-top:4px;line-height:1.45;font-variant-numeric:tabular-nums;}
  .le-digest__chev{flex:0 0 auto;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:var(--le-ink-mute);border:1px solid var(--le-line);transition:transform .25s cubic-bezier(.23,1,.32,1),color .15s,border-color .15s;}
  .le-digest__bar:hover .le-digest__chev{color:var(--le-acc-deep);border-color:var(--le-acc-line);}
  .le-digest.open .le-digest__chev{transform:rotate(180deg);}
  .le-digest__body{padding:6px 28px 28px;border-top:1px solid var(--le-line-soft);}

  .le-aims{margin:22px 0 6px;}
  .le-aims__l{font-family:var(--le-display);font-size:17px;font-weight:500;color:var(--le-ink);letter-spacing:-.014em;}
  .le-aims__list{margin-top:15px;display:flex;flex-direction:column;gap:11px;}
  .le-aims__i{display:flex;align-items:center;gap:14px;font-size:16px;font-weight:450;color:var(--le-ink);line-height:1.45;padding:11px 14px;border-radius:13px;background:rgba(255,255,255,.5);border:1px solid var(--le-line);box-shadow:var(--le-hi);}
  .le-aims__c{flex:0 0 26px;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:var(--le-acc-deep);background:var(--le-acc-soft);border:1px solid var(--le-acc-line);}

  .le-note-h{font-family:var(--le-display);font-weight:500;font-size:18px;letter-spacing:-.012em;color:var(--le-ink);margin:30px 0 0;}
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
.le-doc-quote{margin:18px 0 4px;padding:14px 18px;border-left:3px solid var(--le-acc);background:rgba(43,143,255,.05);border-radius:0 12px 12px 0;font-size:16px;line-height:1.6;color:var(--le-ink);font-weight:450;}
.le-doc-list{margin:12px 0 4px;padding:0 0 0 4px;list-style:none;display:flex;flex-direction:column;gap:8px;}
.le-doc-list li{position:relative;padding-left:22px;font-size:16px;line-height:1.6;color:var(--le-ink);overflow-wrap:break-word;word-break:break-word;}
.le-doc-list li::before{content:'';position:absolute;left:4px;top:11px;width:6px;height:6px;border-radius:50%;background:var(--le-acc);}
.le-doc-list--ol{counter-reset:ldoc;}
.le-doc-list--ol li{padding-left:26px;counter-increment:ldoc;}
.le-doc-list--ol li::before{content:counter(ldoc);left:0;top:1px;width:auto;height:auto;background:0;color:var(--le-acc-deep);font-weight:700;font-size:14px;font-variant-numeric:tabular-nums;}
.le-doc-word{margin:16px 0 4px;}
.le-doc-word .lx-voc{grid-template-columns:1fr;margin-top:0;}
.le-dword{display:flex;align-items:center;gap:11px;flex-wrap:wrap;margin:9px 0 5px;padding:3px 2px;}
.le-dword__hz{font-size:22px;font-weight:600;color:var(--le-acc-deep);letter-spacing:.5px;line-height:1.1;}
.le-dword__py{font-size:13px;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
.le-dword__ru{font-size:15px;color:var(--le-ink);}
.le-dword__say{flex:0 0 auto;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;cursor:pointer;color:#fff;background:linear-gradient(150deg,#5CB4FF,#1E63C2);border:0;box-shadow:inset 0 1px 0 rgba(255,255,255,.3);transition:transform .14s;}
.le-dword__say:hover{transform:translateY(-1px);}
.le-doc-audio{display:inline-flex;align-items:center;gap:11px;margin:14px 0 4px;padding:12px 16px;border-radius:13px;background:rgba(43,143,255,.06);border:1px solid var(--le-line);color:var(--le-acc-deep);font-size:14.5px;font-weight:600;}
.le-doc-callout{display:flex;gap:11px;align-items:flex-start;margin:16px 0 4px;padding:14px 17px;border-radius:13px;font-size:15px;line-height:1.55;}
.le-doc-callout svg{flex:0 0 auto;margin-top:2px;}
.le-doc-callout--hint{background:rgba(226,165,46,.08);border:1px solid rgba(226,165,46,.3);color:#7A5712;}
.le-doc-callout--imp{background:rgba(43,143,255,.07);border:1px solid var(--le-acc-line);color:var(--le-ink);}
.le-doc-material{display:inline-flex;align-items:center;gap:9px;margin:12px 0 4px;padding:11px 15px;border-radius:12px;background:rgba(255,255,255,.6);border:1px solid var(--le-line);color:var(--le-acc-ink);font-size:14px;font-weight:600;text-decoration:none;transition:border-color .15s,transform .15s;}
.le-doc-material:hover{border-color:var(--le-acc-line);transform:translateY(-1px);}
.le-doc-divider{border:0;border-top:1px solid var(--le-line);margin:22px 0;}
.le-study.is-compact .le-doc{gap:0;}
.le-study.is-compact .le-doc .le-note-h{font-size:18px;font-weight:600;margin-top:26px;}
.le-study.is-compact .le-doc .le-note-p{font-size:14px;line-height:1.62;margin-top:8px;}
.le-study.is-compact .le-doc-quote{font-size:13.5px;padding:11px 14px;margin:12px 0 2px;}
.le-study.is-compact .le-doc-list li{font-size:14px;}
.le-study.is-compact .le-doc-callout{font-size:13px;padding:11px 14px;margin:12px 0 2px;}
.le-study.is-compact .le-doc-word{margin:12px 0 2px;}
.le-study.is-compact .le-doc-word .lx-voc__hz{font-size:24px;}

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

  /* ── ДОМАШНЕЕ ЗАДАНИЕ — одно чистое действие (открывает попап) ─────────────── */
  .le-hw{position:relative;margin-top:30px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;border-radius:18px;padding:20px 22px;border:1px solid var(--le-line);background:var(--le-card);box-shadow:var(--le-hi);overflow:hidden;}
  .le-hw__ic{flex:0 0 46px;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;color:#fff;background:var(--le-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.28);}
  .le-hw.is-done .le-hw__ic{background:var(--le-jade);}
  .le-hw__b{flex:1 1 200px;min-width:0;}
  .le-hw__k{font-size:12.5px;font-weight:600;color:var(--le-acc-ink);}
  .le-hw.is-done .le-hw__k{color:var(--le-jade);}
  .le-hw__t{font-family:var(--le-display);font-weight:500;font-size:19px;letter-spacing:-.012em;color:var(--le-ink);margin-top:4px;}
  .le-hw__cta{flex:0 0 auto;}

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

  /* ── РЕЙЛ · контейнер-плейлист: реальные превью видео (вайб ютуба) ─────────── */
  .le-pl{border-radius:18px;border:1px solid var(--le-line);background:rgba(255,255,255,.56);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:var(--le-hi);overflow:hidden;}
  .le-pl__hd{display:flex;align-items:center;gap:9px;padding:16px 18px 4px;font-family:var(--le-display);font-size:15px;font-weight:500;color:var(--le-ink);letter-spacing:-.012em;}
  .le-pl__hd svg{color:var(--le-acc-deep);flex:0 0 auto;}
  .le-pl__list{padding:8px 8px 6px;display:flex;flex-direction:column;gap:2px;}
  .le-pli{display:flex;align-items:center;gap:11px;width:100%;text-align:left;font:inherit;background:0;border:1px solid transparent;border-radius:13px;padding:8px 9px;cursor:pointer;transition:background .15s,border-color .15s;}
  .le-pli:hover:not(.locked):not(.current){background:rgba(43,143,255,.04);}
  .le-pli__st{flex:0 0 22px;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;color:#fff;font-size:11px;font-weight:700;font-variant-numeric:tabular-nums;}
  .le-pli.done .le-pli__st{background:var(--le-jade);box-shadow:inset 0 1px 0 rgba(255,255,255,.25);}
  .le-pli.current .le-pli__st{background:var(--le-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.25);}
  .le-pli.locked .le-pli__st{background:0;color:var(--le-ink-faint);box-shadow:inset 0 0 0 1px var(--le-line-strong);}
  .le-pli__th{position:relative;flex:0 0 60px;width:60px;height:40px;border-radius:9px;overflow:hidden;border:1px solid var(--le-line);background:#0A1430;}
  .le-pli__th img{width:100%;height:100%;object-fit:cover;display:block;}
  .le-pli__th .le-pli__pl{position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:rgba(8,14,34,.28);}
  .le-pli.locked .le-pli__th img{filter:grayscale(.55) brightness(.82);}
  .le-pli.locked .le-pli__th{opacity:.78;}
  .le-pli.current .le-pli__th{border-color:var(--le-acc-line);box-shadow:0 0 0 2px rgba(43,143,255,.28);}
  .le-pli__b{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px;}
  .le-pli__t{font-size:13.5px;font-weight:550;color:var(--le-ink);letter-spacing:-.008em;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .le-pli.locked .le-pli__t{color:var(--le-ink-mute);font-weight:500;}
  .le-pli__m{font-size:11px;font-weight:500;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
  .le-pli.current{background:rgba(43,143,255,.06);border-color:var(--le-acc-line);}
  .le-pli.current .le-pli__t{font-weight:650;}
  .le-pli.locked{cursor:default;}
  .le-pli__r{flex:0 0 auto;display:inline-flex;align-items:center;}
  .le-pli__sc{font-size:13px;font-weight:700;color:var(--le-jade);font-variant-numeric:tabular-nums;}
  .le-pli__now{font-size:10.5px;font-weight:600;color:var(--le-acc-deep);background:var(--le-acc-soft);border:1px solid var(--le-acc-line);padding:3px 9px;border-radius:99px;white-space:nowrap;}
  .le-pli__lock{color:var(--le-ink-faint);display:inline-flex;}
  .le-pl__all{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;color:var(--le-ink-sub);padding:13px;border:0;border-top:1px solid var(--le-line-soft);background:0;transition:color .15s,background .15s;}
  .le-pl__all:hover{color:var(--le-acc-deep);background:rgba(43,143,255,.03);}

  /* карточка преподавателя */
  .le-card{border-radius:18px;padding:18px;background:var(--le-card);border:1px solid var(--le-line);box-shadow:var(--le-hi);}
  .le-card__h{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:0 2px;}
  .le-card__t{font-size:13.5px;font-weight:600;letter-spacing:-.01em;color:var(--le-ink);}
  .le-tch{display:flex;align-items:center;gap:13px;padding:2px;margin-top:13px;}
  .le-tch__av{flex:0 0 46px;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;font-size:21px;font-weight:600;color:#fff;background:var(--le-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.25);}
  .le-tch__b{flex:1 1 auto;min-width:0;}
  .le-tch__n{font-size:15px;font-weight:600;color:var(--le-ink);letter-spacing:-.01em;}
  .le-tch__r{font-size:12px;font-weight:400;color:var(--le-ink-mute);margin-top:2px;line-height:1.35;}
  .le-tchbtn{margin-top:15px;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;padding:12px;border-radius:11px;color:var(--le-acc-deep);background:var(--le-acc-soft);border:1px solid var(--le-acc-line);transition:background .15s,transform .15s;}
  .le-tchbtn:hover{background:rgba(43,143,255,.14);transform:translateY(-1px);}

  /* ── НИЖНЯЯ ПАНЕЛЬ урока: «Назад · Урок N из M · Дальше» (канон анкеты) ─────── */
  .le-foot{margin-top:28px;display:flex;align-items:center;gap:14px;padding:12px 14px;border-radius:16px;
    background:rgba(232,236,251,.86);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.7);box-shadow:inset 0 1px 0 rgba(255,255,255,.6);}
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
  .lt-modal__head{flex:0 0 auto;display:flex;flex-direction:column;gap:14px;padding:20px 24px 16px;border-bottom:1px solid var(--le-line);}
  .lt-modal__hrow{display:flex;align-items:center;gap:12px;}
  .lt-modal__k{flex:1 1 auto;font-size:13px;font-weight:600;letter-spacing:-.01em;color:var(--le-acc-ink);}
  .lt-modal__count{font-size:12.5px;font-weight:600;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
  .lt-modal__x{flex:0 0 auto;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;cursor:pointer;color:var(--le-ink-mute);background:rgba(255,255,255,.7);border:1px solid var(--le-line);transition:transform .15s,color .15s,border-color .15s;}
  .lt-modal__x:hover{color:var(--le-ink);transform:translateY(-1px);border-color:var(--le-acc-line);}
  .lt-modal__x--float{position:absolute;top:16px;right:16px;z-index:3;}
  .lt-prog{position:relative;height:6px;border-radius:99px;background:rgba(22,32,59,.07);overflow:hidden;}
  .lt-prog i{display:block;height:100%;border-radius:99px;background:var(--le-acc-deep);transition:width .4s cubic-bezier(.23,1,.32,1);}
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

  .lt-done{display:flex;flex-direction:column;align-items:center;text-align:center;padding:30px 28px 38px;}
  .lt-done__star{position:relative;width:96px;height:96px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(60% 60% at 50% 42%,rgba(255,240,200,.95),rgba(245,200,76,.26));box-shadow:0 0 0 9px rgba(245,200,76,.08),0 16px 42px -14px rgba(226,165,46,.4);animation:lt-star .6s cubic-bezier(.23,1,.32,1);}
  .lt-done__star svg{color:#E2A52E;}
  @keyframes lt-star{0%{transform:scale(.4) rotate(-18deg);opacity:0;}60%{transform:scale(1.08) rotate(4deg);}100%{transform:scale(1) rotate(0);opacity:1;}}
  .lt-done__k{margin-top:20px;font-size:12.5px;font-weight:600;color:var(--le-acc-deep);letter-spacing:-.01em;}
  .lt-done__h{font-family:var(--le-display);font-weight:400;font-size:32px;letter-spacing:-.026em;line-height:1.06;color:var(--le-ink);margin-top:10px;text-wrap:balance;}
  .lt-done__s{font-size:15.5px;color:var(--le-ink-sub);margin-top:12px;max-width:42ch;line-height:1.55;font-weight:400;}
  .lt-stats{display:flex;gap:13px;margin-top:26px;flex-wrap:wrap;justify-content:center;}
  .lt-stat{min-width:130px;padding:16px 22px;border-radius:15px;background:rgba(255,255,255,.6);border:1px solid var(--le-line);box-shadow:var(--le-hi);}
  .lt-stat__v{font-family:var(--le-display);font-size:28px;font-weight:600;letter-spacing:-.02em;color:var(--le-acc-deep);font-variant-numeric:tabular-nums;line-height:1;}
  .lt-stat__v.gold{color:var(--le-gold);}
  .lt-stat__k{font-size:12px;font-weight:500;color:var(--le-ink-mute);margin-top:9px;}
  .lt-done__cta{display:flex;gap:13px;margin-top:30px;flex-wrap:wrap;justify-content:center;}

  /* компактный режим — превью телефона в конструкторе */
  .le-study.is-compact .le-h1{font-size:23px;letter-spacing:-.02em;}
  .le-study.is-compact .le-sub{font-size:13px;margin-top:9px;}
  .le-study.is-compact .le-player{margin-top:18px;border-radius:14px;}
  .le-study.is-compact .le-play{width:46px;height:46px;}
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
    .le-head{margin:-16px -18px 0;padding:14px 18px 10px;}
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
        b.hanzi ? h('span', { className: 'le-dword__hz' }, b.hanzi) : null,
        b.pinyin ? h('span', { className: 'le-dword__py' }, b.pinyin) : null,
        b.ru ? h('span', { className: 'le-dword__ru' }, b.ru) : null,
        b.hanzi ? h(SpeakBtn, { text: b.hanzi, size: 13, className: 'le-dword__say' }) : null);
      if (b.kind === 'image') return h('div', { key, className: 'le-note-img' },
        h('figure', null, h('img', { src: b.url, alt: b.caption || '', loading: 'lazy' }), b.caption ? h('figcaption', null, b.caption) : null));
      if (b.kind === 'audio') return h('div', { key, className: 'le-doc-audio' }, PlayGlyph(16), h('span', null, b.title || 'Аудио'));
      if (b.kind === 'hint') return h('div', { key, className: 'le-doc-callout le-doc-callout--hint' }, Ic.Info ? h(Ic.Info, { size: 16 }) : null, h('span', null, b.text || ''));
      if (b.kind === 'important') return h('div', { key, className: 'le-doc-callout le-doc-callout--imp' }, Ic.AlertCircle ? h(Ic.AlertCircle, { size: 16 }) : null, h('span', null, b.text || ''));
      if (b.kind === 'material') return h('a', { key, className: 'le-doc-material', href: b.url || '#', target: '_blank', rel: 'noreferrer' }, Ic.Paperclip ? h(Ic.Paperclip, { size: 15 }) : null, h('span', null, b.title || b.url || 'Материал'));
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
    const canPlay = (!!file || !!emb) && !compact;

    // ── плеер: единственный смелый якорь экрана ──
    let media = null;
    if (playing && !compact) {
      if (file) media = h('video', {
        className: 'le-player__frame', src: file, controls: true, autoPlay: true, muted: true, playsInline: true,
        style: { background: '#06112E', objectFit: 'cover' },
      });
      else if (emb) media = h('iframe', {
        className: 'le-player__frame', src: emb.src + (emb.src.indexOf('?') >= 0 ? '&' : '?') + 'autoplay=1',
        title: v.title || 'Видеоурок', loading: 'lazy',
        allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen', allowFullScreen: true,
      });
    }
    const poster = v.poster || '';
    const player = media
      ? h('div', { className: 'le-player' }, media)
      : h('div', { className: 'le-player' },
        h(canPlay ? 'button' : 'div', {
          className: 'le-poster', type: canPlay ? 'button' : undefined,
          onClick: canPlay ? () => setPlaying(true) : undefined, 'aria-label': 'Смотреть видеоурок',
        },
          poster
            ? h('img', { className: 'le-poster__img', src: poster, alt: '', loading: 'lazy' })
            : h('span', { className: 'le-poster__sky' }),
          h('span', { className: 'le-poster__scrim' }),
          compact ? null : h('span', { className: 'le-poster__cap' }, PlayGlyph(11), 'Видеоурок'),
          compact ? null : h('span', { className: 'le-poster__dur' }, v.duration || '08:40'),
          h('span', { className: 'le-play' }, PlayGlyph(compact ? 18 : 26)),
          compact ? null : h('span', { className: 'le-bar' },
            h('span', { className: 'le-bar__pl' }, PlayGlyph(13)),
            h('span', { className: 'le-bar__t' }, '00:00'),
            h('span', { className: 'le-bar__track' }, h('i', null)),
            h('span', { className: 'le-bar__t le-bar__t--d' }, v.duration || '08:40'),
            h('span', { className: 'le-bar__spd' }, '1×'),
            h('span', { className: 'le-bar__ic' }, VolGlyph(16)),
            h('span', { className: 'le-bar__ic' }, FsGlyph(16)))));

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

    const words = (!hasDoc && glossary.length) ? h('div', { className: 'le-words' },
      h('div', { className: 'le-words__l' }, 'Новые слова'),
      h('div', { className: 'le-gloss' }, glossary.map((g, i) => h('div', { key: i, className: 'le-gl' },
        h('span', { className: 'le-gl__hz' }, g.hanzi || '—'),
        h('span', { className: 'le-gl__py' }, g.pinyin || ''),
        h('span', { className: 'le-gl__ru' }, g.ru || ''))))) : null;

    const digestEl = (aims || notesBody || words) ? h('div', { className: 'le-digest' + (open ? ' open' : '') },
      h(compact ? 'div' : 'button', { className: 'le-digest__bar', type: compact ? undefined : 'button', onClick: compact ? undefined : () => setOpen(!open) },
        h('div', { className: 'le-digest__ti' },
          h('div', { className: 'le-digest__t' }, 'Конспект урока'),
          h('div', { className: 'le-digest__h' }, open ? 'Коротко о главном: разбор, тоны и новые слова' : teaser)),
        compact ? null : h('span', { className: 'le-digest__chev' }, Ic.ChevronDown ? h(Ic.ChevronDown, { size: 18 }) : '▾')),
      open ? h('div', { className: 'le-digest__body' }, aims, notesBody, words) : null) : null;

    // ── домашка: статус-карточка. На полной странице запуск теста живёт в нижней
    //    панели (Дальше → тест), поэтому здесь кнопку показываем только в превью
    //    конструктора (compact) и для повтора уже сданного задания.
    const acc = hwResult && typeof hwResult.acc === 'number' ? hwResult.acc : null;
    const hwCta = (compact && !homeworkDone)
      ? h('button', { type: 'button', className: 'le-btn le-btn--primary le-hw__cta', onClick: start },
          'Начать задание', Ic.ArrowRight ? h(Ic.ArrowRight, { size: 17, className: 'arr' }) : null)
      : homeworkDone
        ? h('button', { type: 'button', className: 'le-btn le-btn--ghost le-hw__cta', onClick: start }, 'Пройти заново')
        : null;
    const hwBody = blocks.length ? h('div', { className: 'le-hw' + (homeworkDone ? ' is-done' : '') },
      h('span', { className: 'le-hw__ic' }, homeworkDone ? (Ic.Check ? h(Ic.Check, { size: 21, strokeWidth: 2.6 }) : '✓') : (Ic.Edit ? h(Ic.Edit, { size: 19 }) : '✎')),
      h('div', { className: 'le-hw__b' },
        h('div', { className: 'le-hw__k' }, homeworkDone ? (acc != null ? 'Сдано · точность ' + acc + '%' : 'Сдано') : 'Домашнее задание'),
        h('div', { className: 'le-hw__t' }, homeworkDone ? 'Задание пройдено' : 'Закрепите урок на практике')),
      hwCta) : null;

    return h('div', { className: 'le-study' + (compact ? ' is-compact' : '') },
      h('h1', { className: 'le-h1' }, lesson.title || 'Урок'),
      lesson.subtitle ? h('p', { className: 'le-sub' }, lesson.subtitle) : null,
      player,
      digestEl,
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
            h('div', { className: 'lt-done__star' }, Ic.Star ? h(Ic.Star, { size: 52 }) : '★'),
            h('div', { className: 'lt-done__k' }, 'Домашка сдана'),
            h('h2', { className: 'lt-done__h' }, 'Ещё шаг к вершине'),
            h('p', { className: 'lt-done__s' }, acc >= 80
              ? 'Сильно. Вы уверенно держите новые слова — так и поднимаемся к HSK.'
              : 'Хороший заход. Эти слова уже ваши, остальное закрепим на следующем уроке.'),
            h('div', { className: 'lt-stats' },
              h('div', { className: 'lt-stat' }, h('div', { className: 'lt-stat__v gold' }, '+' + xp), h('div', { className: 'lt-stat__k' }, 'XP за домашку')),
              h('div', { className: 'lt-stat' }, h('div', { className: 'lt-stat__v' }, acc + '%'), h('div', { className: 'lt-stat__k' }, 'Точность'))),
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
            h('span', { className: 'lt-modal__k' }, 'Домашнее задание'),
            h('span', { className: 'lt-modal__count' }, (idx + 1) + ' из ' + total),
            closeX(false)),
          h('div', { className: 'lt-prog' }, h('i', { style: { width: Math.max(3, pct) + '%' } }))),
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
    return h('div', { className: 'le-pl' },
      h('div', { className: 'le-pl__hd' }, (L.COURSE && L.COURSE.module) || 'Модуль 1 · Первые слова'),
      h('div', { className: 'le-pl__list' }, lessons.map((it) => {
        const cur = it.n === n;
        const onClick = it.state === 'locked'
          ? () => toast('Урок откроется после занятия' + (it.when ? ': ' + it.when : ''))
          : () => props.onSwitch(it);
        const meta = it.duration + (it.words ? '  ·  ' + it.words + ' ' + plural(it.words, 'слово', 'слова', 'слов') : '');
        return h('button', { key: it.n, type: 'button', className: 'le-pli ' + it.state + (cur ? ' current' : ''), onClick: onClick },
          h('span', { className: 'le-pli__st' }, it.state === 'done'
            ? (Ic.Check ? h(Ic.Check, { size: 12, strokeWidth: 3 }) : '✓')
            : it.state === 'locked' ? (Ic.Lock ? h(Ic.Lock, { size: 11 }) : '•') : PlayGlyph(10)),
          h('span', { className: 'le-pli__th' },
            it.thumb ? h('img', { src: it.thumb, alt: '', loading: 'lazy' }) : null,
            cur ? h('span', { className: 'le-pli__pl' }, PlayGlyph(13)) : null),
          h('span', { className: 'le-pli__b' },
            h('span', { className: 'le-pli__t' }, it.title),
            h('span', { className: 'le-pli__m' }, meta)),
          h('span', { className: 'le-pli__r' }, cur
            ? h('span', { className: 'le-pli__now' }, 'Сейчас')
            : it.state === 'done' && it.score != null ? h('span', { className: 'le-pli__sc' }, it.score)
              : it.state === 'locked' ? h('span', { className: 'le-pli__lock' }, Ic.Lock ? h(Ic.Lock, { size: 13 }) : null) : null));
      })),
      h('button', { type: 'button', className: 'le-pl__all', onClick: () => nav('/learn') },
        Ic.Grid ? h(Ic.Grid, { size: 14 }) : null, 'Показать все уроки'));
  }

  function TeacherCard() {
    const t = (L.COURSE && L.COURSE.teacher) || { name: 'Преподаватель', role: '', initial: 'И' };
    return h('div', { className: 'le-card' },
      h('div', { className: 'le-card__h' }, h('span', { className: 'le-card__t' }, 'Ваш преподаватель')),
      h('div', { className: 'le-tch', style: { marginTop: 12 } },
        h('span', { className: 'le-tch__av' }, t.initial || (t.name || 'И').charAt(0)),
        h('div', { className: 'le-tch__b' },
          h('div', { className: 'le-tch__n' }, t.name),
          h('div', { className: 'le-tch__r' }, t.sub || t.role))),
      h('button', { type: 'button', className: 'le-tchbtn', onClick: () => { if (SH && SH.openChat) SH.openChat({ label: t.name + ' · преподаватель' }); } },
        Ic.Chat ? h(Ic.Chat, { size: 15 }) : null, 'Написать преподавателю'));
  }

  function LessonHeader(props) {
    const cur = props.item;
    return h('div', { className: 'le-head' },
      h('div', { className: 'le-crumb' },
        h('button', { type: 'button', onClick: () => nav('/learn') }, Ic.Book ? h(Ic.Book, { size: 15 }) : null, 'Обучение'),
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
          h(StudyView, { lesson, onStart, homeworkDone, hwResult, playing, onPlay }),
          h(LessonFoot, { item, total, lessons, prevOk, onPrev, nextOk, onNext, homeworkDone, onStart })),
        h('aside', { className: 'le-rail' },
          h(ProgressCard, { activeN: item.n }),
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
    const lessons = ((L.COURSE && L.COURSE.lessons) || []).map((it) => it.live ? Object.assign({}, it, { title: live.title }) : it);
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
