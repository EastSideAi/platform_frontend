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
    --lx-jade:#0E9F6E; --lx-jade-soft:#E2F4EA; --lx-jade-line:rgba(16,185,120,.5);
    --lx-rose:#E5484D; --lx-rose-soft:#FBE7E2; --lx-rose-line:rgba(240,84,72,.5);
    --lx-gold:#E2A52E;
    font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,system-ui,'Segoe UI',sans-serif;
  }
  .lx-scope *{box-sizing:border-box;}
  .lx-prompt{font-weight:600;font-size:21px;letter-spacing:-.4px;line-height:1.22;color:var(--lx-ink);text-wrap:balance;}
  /* шапка задания — пилюля-бейдж с иконкой (цвет + характер, не голый синий текст) */
  .lx-kick{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:var(--lx-acc-ink);
    background:var(--lx-acc-soft);padding:6px 12px 6px 10px;border-radius:99px;margin-bottom:16px;}
  .lx-kick svg{display:inline-flex;}
  /* единая шапка задания: иконка-тайл + инструкция (одна строка, без дубля-eyebrow) */
  .lx-head{display:flex;align-items:center;gap:12px;margin-bottom:6px;}
  .lx-head.has-sub{align-items:flex-start;}
  .lx-head__ic{flex:0 0 38px;width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#2073E6;background:rgba(43,143,255,.12);box-shadow:inset 0 0 14px rgba(43,143,255,.55),inset 0 0 3px rgba(160,205,255,.5);}
  .lx-head.has-sub .lx-head__ic{margin-top:1px;}
  .lx-head__tx{flex:1 1 auto;min-width:0;}
  .lx-head__t{min-width:0;font-family:var(--le-display,inherit);font-weight:600;font-size:20px;letter-spacing:-.02em;line-height:1.22;color:var(--lx-ink);text-wrap:balance;}
  .lx-head__s{margin-top:3px;font-size:13.5px;font-weight:500;line-height:1.4;letter-spacing:-.01em;color:var(--lx-ink-sub);}

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
    padding:16px 17px;border-radius:16px;background:rgba(255,255,255,.55);border:1px solid rgba(22,32,59,.09);color:var(--lx-ink);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.7);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
    transition:transform .15s cubic-bezier(.23,1,.32,1),border-color .15s,background .15s,box-shadow .15s;}
  .lx-opts--wrap .lx-opt{width:auto;flex:0 0 auto;}
  .lx-opt:hover:not(.is-locked){border-color:rgba(43,143,255,.4);background:rgba(255,255,255,.72);transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.8),inset 0 0 28px rgba(43,143,255,.08);}
  .lx-opt:active:not(.is-locked){transform:scale(.98);}
  .lx-opt.is-sel{transform:translateY(-1px);}
  @keyframes lx-pop{0%{transform:scale(1);}42%{transform:scale(1.018);}100%{transform:scale(1);}}
  @keyframes lx-badgepop{0%{transform:scale(.4);}62%{transform:scale(1.18);}100%{transform:scale(1);}}
  .lx-opt__mk{flex:0 0 36px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:700;
    color:#2073E6;background:rgba(43,143,255,.12);box-shadow:inset 0 0 12px rgba(43,143,255,.45),inset 0 0 3px rgba(160,205,255,.5);transition:all .15s;}
  .lx-opt__t{flex:1 1 auto;font-size:17px;font-weight:600;letter-spacing:-.2px;}
  .lx-opt__fb{flex:0 0 auto;display:none;}
  .lx-opt.is-sel{border-color:rgba(43,143,255,.45);background:rgba(255,255,255,.72);box-shadow:inset 0 0 32px rgba(43,143,255,.24),inset 0 0 8px rgba(43,143,255,.14);}
  .lx-opt.is-sel .lx-opt__mk{color:#fff;background:#2073E6;box-shadow:inset 0 0 14px rgba(120,190,255,.9),inset 0 1px 0 rgba(255,255,255,.3);animation:lx-badgepop .34s cubic-bezier(.23,1,.32,1);}
  .lx-opt.is-sel .lx-opt__t{color:var(--lx-acc-deep);}
  .lx-opt.is-locked{cursor:default;}
  .lx-opt.is-correct{border-color:rgba(16,185,120,.5);background:rgba(16,185,120,.1);box-shadow:inset 0 0 34px rgba(16,185,120,.24),inset 0 0 9px rgba(16,185,120,.14);animation:lx-pop .42s cubic-bezier(.23,1,.32,1);}
  .lx-opt.is-correct .lx-opt__mk{color:#fff;background:#0E9F6E;box-shadow:inset 0 0 12px rgba(120,235,180,.7),inset 0 1px 0 rgba(255,255,255,.25);}
  .lx-opt.is-correct .lx-opt__t{color:var(--lx-jade);}
  .lx-opt.is-correct .lx-opt__fb{display:inline-flex;color:var(--lx-jade);}
  .lx-opt.is-wrong{border-color:rgba(240,84,72,.5);background:rgba(240,84,72,.08);box-shadow:inset 0 0 32px rgba(240,84,72,.18),inset 0 0 8px rgba(240,84,72,.1);animation:lx-shake .32s cubic-bezier(.36,.07,.19,.97);}
  .lx-opt.is-wrong .lx-opt__mk{color:#fff;background:#E5484D;box-shadow:inset 0 0 12px rgba(250,165,150,.6),inset 0 1px 0 rgba(255,255,255,.2);}
  .lx-opt.is-wrong .lx-opt__t{color:var(--lx-rose);}
  .lx-opt.is-wrong .lx-opt__fb{display:inline-flex;color:var(--lx-rose);}
  .lx-opt.is-dim{opacity:.5;}
  @keyframes lx-shake{10%,90%{transform:translateX(-1px);}20%,80%{transform:translateX(2px);}30%,50%,70%{transform:translateX(-4px);}40%,60%{transform:translateX(4px);}}

  /* ── Пропуск ────────────────────────────────────────────────────────────── */
  .lx-gapline{margin-top:22px;font-size:21px;font-weight:600;letter-spacing:-.3px;line-height:1.7;color:var(--lx-ink);}
  .lx-slot{display:inline-flex;align-items:center;justify-content:center;min-width:96px;height:38px;padding:0 14px;margin:0 4px;vertical-align:middle;
    border-radius:11px;border:1.5px dashed var(--lx-acc-line);background:var(--lx-acc-soft);color:var(--lx-acc-ink);font-weight:700;
    transition:all .15s;}
  .lx-slot.filled{border-style:solid;border-color:rgba(43,143,255,.45);background:rgba(255,255,255,.72);box-shadow:inset 0 0 22px rgba(43,143,255,.2),inset 0 0 6px rgba(43,143,255,.13);}
  .lx-slot.ok{border-color:rgba(16,185,120,.5);background:rgba(16,185,120,.1);color:var(--lx-jade);box-shadow:inset 0 0 20px rgba(16,185,120,.2);}
  .lx-slot.bad{border-color:rgba(240,84,72,.5);background:rgba(240,84,72,.09);color:var(--lx-rose);box-shadow:inset 0 0 20px rgba(240,84,72,.18);}

  /* ── Пары (match) ───────────────────────────────────────────────────────── */
  .lx-match{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px 16px;margin-top:18px;}
  .lx-mcol{display:flex;flex-direction:column;gap:12px;}
  .lx-mcol__h{align-self:flex-start;font-size:12.5px;font-weight:600;color:var(--lx-ink-mute);letter-spacing:-.01em;padding:0 2px;margin-bottom:2px;}
  .lx-mi{position:relative;display:flex;align-items:center;gap:10px;min-width:0;cursor:pointer;padding:14px 15px;border-radius:15px;min-height:60px;
    background:rgba(255,255,255,.55);border:1px solid rgba(22,32,59,.09);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
    transition:transform .15s cubic-bezier(.23,1,.32,1),border-color .15s,background .15s,box-shadow .15s;}
  .lx-mi:active:not(.is-locked){transform:scale(.975);}
  .lx-mi:hover:not(.is-locked){border-color:rgba(43,143,255,.4);transform:translateY(-1px);box-shadow:inset 0 1px 0 rgba(255,255,255,.8),inset 0 0 24px rgba(43,143,255,.07);}
  .lx-mi__t{flex:1 1 auto;min-width:0;overflow-wrap:anywhere;font-size:16px;font-weight:600;color:var(--lx-ink);letter-spacing:-.2px;}
  .lx-mcol--l .lx-mi{justify-content:center;background:linear-gradient(180deg,rgba(43,143,255,.06),rgba(43,143,255,.02));}
  .lx-mcol--l .lx-mi__t{flex:0 0 auto;font-family:var(--le-display,inherit);font-size:24px;color:var(--lx-acc-deep);letter-spacing:1px;}
  .lx-mi__b{flex:0 0 auto;width:23px;height:23px;border-radius:50%;display:grid;place-items:center;font-size:11.5px;font-weight:800;
    color:#fff;font-variant-numeric:tabular-nums;opacity:0;transform:scale(.6);box-shadow:inset 0 0 10px rgba(120,190,255,.7),inset 0 1px 0 rgba(255,255,255,.3);transition:opacity .15s,transform .18s cubic-bezier(.23,1,.32,1);}
  .lx-mcol--l .lx-mi__b{position:absolute;top:8px;right:8px;}
  .lx-mi.has-b .lx-mi__b{opacity:1;transform:none;animation:lx-badgepop .34s cubic-bezier(.23,1,.32,1);}
  .lx-mi.is-active{border-color:rgba(43,143,255,.45);background:rgba(255,255,255,.72);box-shadow:inset 0 0 30px rgba(43,143,255,.22),inset 0 0 8px rgba(43,143,255,.13);}
  .lx-mi.is-matched{border-color:rgba(43,143,255,.4);background:rgba(255,255,255,.66);box-shadow:inset 0 0 24px rgba(43,143,255,.14),inset 0 0 6px rgba(43,143,255,.1);}
  .lx-mi.is-locked{cursor:default;}
  .lx-mi.is-correct{border-color:rgba(16,185,120,.5);background:rgba(16,185,120,.09);box-shadow:inset 0 0 26px rgba(16,185,120,.18),inset 0 0 7px rgba(16,185,120,.11);}
  .lx-mi.is-correct .lx-mi__b{background:var(--lx-jade);}
  .lx-mi.is-wrong{border-color:rgba(240,84,72,.5);background:rgba(240,84,72,.08);box-shadow:inset 0 0 26px rgba(240,84,72,.16),inset 0 0 7px rgba(240,84,72,.1);}
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
  .lx-tok.is-correct{border-color:rgba(16,185,120,.5);background:rgba(16,185,120,.1);color:var(--lx-jade);box-shadow:inset 0 0 18px rgba(16,185,120,.2);}
  .lx-tok.is-wrong{border-color:rgba(240,84,72,.5);background:rgba(240,84,72,.09);color:var(--lx-rose);box-shadow:inset 0 0 18px rgba(240,84,72,.18);}
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
  .lx-tone__opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin-top:18px;}
  .lx-tone__b{display:flex;align-items:center;gap:13px;min-width:0;cursor:pointer;font-family:inherit;text-align:left;padding:14px 18px;border-radius:14px;
    background:rgba(255,255,255,.7);border:1.5px solid rgba(22,32,59,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);color:var(--lx-ink);
    transition:transform .15s cubic-bezier(.23,1,.32,1),border-color .15s,background .15s;}
  .lx-tone__b:hover:not(.is-locked){transform:translateY(-1px);border-color:var(--lx-acc-line);}
  .lx-tone__top{display:flex;align-items:center;justify-content:center;gap:14px;}
  .lx-tone__mark{flex:0 0 42px;width:42px;display:inline-flex;align-items:center;justify-content:center;color:var(--lx-acc-deep);}
  .lx-tone__mark svg{display:block;width:38px;height:20px;}
  .lx-tone__n{font-weight:800;color:var(--lx-ink);font-variant-numeric:tabular-nums;margin-right:5px;}
  .lx-tone__name{flex:1 1 auto;min-width:0;overflow-wrap:anywhere;font-size:13.5px;font-weight:600;color:var(--lx-ink-sub);}
  .lx-tone__b.is-sel{border-color:rgba(43,143,255,.45);background:rgba(255,255,255,.72);box-shadow:inset 0 0 30px rgba(43,143,255,.22),inset 0 0 8px rgba(43,143,255,.13);}
  .lx-tone__b.is-correct{border-color:rgba(16,185,120,.5);background:rgba(16,185,120,.09);box-shadow:inset 0 0 24px rgba(16,185,120,.18);}
  .lx-tone__b.is-correct .lx-tone__mark,.lx-tone__b.is-correct .lx-tone__name{color:var(--lx-jade);}
  .lx-tone__b.is-wrong{border-color:rgba(240,84,72,.5);background:rgba(240,84,72,.08);box-shadow:inset 0 0 24px rgba(240,84,72,.16);}
  .lx-tone__b.is-wrong .lx-tone__mark,.lx-tone__b.is-wrong .lx-tone__name{color:var(--lx-rose);}
  .lx-tone__b.is-dim{opacity:.5;}
  .lx-tone__b.is-locked{cursor:default;}
  /* превью в конструкторе (contained-тренажёр) — узкий телефон: тоны в одну колонку, как на мобиле */
  .lt-modal--in .lx-tone__opts{grid-template-columns:1fr;}

  /* ── Открытое задание (отправка на проверку: текст + файлы/скрины) ────────── */
  .lx-task__brief{margin-top:16px;padding:15px 17px;border-radius:14px;background:rgba(43,143,255,.06);border:1px solid rgba(43,143,255,.22);box-shadow:inset 0 0 26px rgba(43,143,255,.06);font-size:14.5px;line-height:1.58;color:var(--lx-ink);}
  .lx-task__brief{white-space:pre-line;}
  .lx-task__brief b{font-weight:700;color:var(--lx-acc-deep);}
  .lx-task__req{margin-top:18px;}
  .lx-task__req-h{font-size:13.5px;font-weight:700;color:var(--lx-ink);margin-bottom:11px;letter-spacing:-.01em;}
  .lx-task__req-list{display:flex;flex-direction:column;gap:9px;}
  .lx-task__req-i{display:flex;align-items:flex-start;gap:12px;font-size:14.5px;line-height:1.5;color:var(--lx-ink);padding:12px 14px;border-radius:13px;background:rgba(255,255,255,.55);border:1px solid rgba(22,32,59,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
  .lx-task__req-n{flex:0 0 24px;width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:800;color:#2073E6;background:rgba(43,143,255,.12);box-shadow:inset 0 0 11px rgba(43,143,255,.45),inset 0 0 3px rgba(160,205,255,.5);margin-top:1px;font-variant-numeric:tabular-nums;}
  .lx-task__label{margin-top:22px;margin-bottom:9px;font-size:13.5px;font-weight:700;color:var(--lx-ink);letter-spacing:-.01em;}
  .lx-task__text{display:block;width:100%;min-height:104px;resize:vertical;font-family:inherit;font-size:15.5px;line-height:1.5;color:var(--lx-ink);padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.55);border:1px solid rgba(22,32,59,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);transition:border-color .15s,box-shadow .15s;}
  .lx-task__text::placeholder{color:var(--lx-ink-mute);}
  .lx-task__text:focus{outline:0;border-color:rgba(43,143,255,.45);box-shadow:inset 0 0 28px rgba(43,143,255,.1),inset 0 1px 0 rgba(255,255,255,.7);}
  .lx-task__drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;margin-top:14px;padding:26px 20px;border-radius:16px;cursor:pointer;text-align:center;
    border:1.5px dashed rgba(43,143,255,.4);background:rgba(43,143,255,.05);transition:border-color .15s,background .15s,box-shadow .15s;}
  .lx-task__drop:hover{border-color:rgba(43,143,255,.6);background:rgba(43,143,255,.09);box-shadow:inset 0 0 32px rgba(43,143,255,.09);}
  .lx-task__drop-ic{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;color:#2B8FFF;background:rgba(43,143,255,.12);box-shadow:inset 0 0 16px rgba(43,143,255,.32),inset 0 1px 0 rgba(255,255,255,.7);}
  .lx-task__drop:hover .lx-task__drop-ic{color:#2073E6;background:rgba(43,143,255,.16);}
  .lx-task__drop-t{font-size:14.5px;font-weight:600;color:var(--lx-ink);}
  .lx-task__drop-t b{color:var(--lx-acc-deep);}
  .lx-task__drop-s{font-size:12.5px;font-weight:500;color:var(--lx-ink-mute);}
  .lx-task__files{display:flex;flex-direction:column;gap:9px;margin-top:12px;}
  .lx-task__file{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:12px;background:rgba(255,255,255,.6);border:1px solid rgba(22,32,59,.09);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);animation:lx-fbup .26s cubic-bezier(.23,1,.32,1);}
  .lx-task__file-ic{flex:0 0 36px;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;color:#2073E6;background:rgba(43,143,255,.12);box-shadow:inset 0 0 12px rgba(43,143,255,.45),inset 0 0 3px rgba(160,205,255,.5);font-size:10px;font-weight:800;}
  .lx-task__file-b{flex:1 1 auto;min-width:0;}
  .lx-task__file-t{font-size:14px;font-weight:600;color:var(--lx-ink);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lx-task__file-s{font-size:12px;font-weight:500;color:var(--lx-ink-mute);margin-top:1px;font-variant-numeric:tabular-nums;}
  .lx-task__file-x{flex:0 0 30px;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;cursor:pointer;color:var(--lx-ink-mute);background:0;border:0;transition:color .15s,background .15s;}
  .lx-task__file-x:hover{color:#E5484D;background:rgba(240,84,72,.1);}

  /* ── Разбор (объяснение после проверки) ─────────────────────────────────── */
  .lx-explain{display:flex;gap:12px;align-items:flex-start;margin-top:20px;padding:15px 17px;border-radius:14px;font-size:14.5px;line-height:1.55;}
  .lx-explain__ic{flex:0 0 auto;display:inline-flex;margin-top:1px;}
  .lx-explain{border:1px solid transparent;}
  .lx-explain.ok{background:rgba(16,185,120,.09);border-color:rgba(16,185,120,.3);color:var(--lx-jade);box-shadow:inset 0 0 26px rgba(16,185,120,.1);}
  .lx-explain.bad{background:rgba(43,143,255,.06);border-color:rgba(43,143,255,.26);color:var(--lx-ink);box-shadow:inset 0 0 24px rgba(43,143,255,.07);}
  .lx-explain.bad .lx-explain__ic{color:var(--lx-acc-deep);}

  /* ═══════════════ СТРАНИЦА УРОКА · Режим B — вайб «Главной»/«Пути»: светлое стекло ═══════════════
     Правила владельца (§6.4): НЕТ разрядке букв, НЕТ серым мелким uppercase-eyebrow'ам
     (заголовки нормальные, тёмные), НЕТ выпуклым градиентам (плоско, прозрачно, стекло).
     Якорь — кастомный светлый плеер. Модули/уроки справа — чистая тропа. Тест — попап. */
  .sd-wrap:has(.le-root){max-width:1240px;padding:38px 52px 26px;}
  @media (max-width:680px){.sd-wrap:has(.le-root){padding:18px 18px 48px;}}

  /* .lt-modal — попап-тест рендерится сиблингом .le-root, поэтому токены ОБЯЗАНЫ
     объявляться и на нём, иначе var(--le-*) внутри модалки не резолвится
     (кнопки становятся прозрачными — «невидимая белая кнопка»). */
  .le-root,.le-study,.lt-modal{
    --le-display:'SF Pro Display',-apple-system,BlinkMacSystemFont,system-ui,'Segoe UI',sans-serif;
    --le-acc:#2B8FFF; --le-acc-2:#5CB4FF; --le-acc-deep:#2073E6; --le-acc-ink:#1763C8;
    --le-acc-soft:rgba(43,143,255,.09); --le-acc-line:rgba(43,143,255,.36);
    --le-ink:#16203B; --le-ink-sub:rgba(22,32,59,.62); --le-ink-mute:rgba(22,32,59,.44); --le-ink-faint:rgba(22,32,59,.28);
    --le-jade:#0E9F6E; --le-jade-soft:#E2F4EA; --le-gold:#E2A52E; --le-rose:#E5484D;
    --le-line:rgba(22,32,59,.08); --le-line-soft:rgba(22,32,59,.05); --le-line-strong:rgba(22,32,59,.14);
    --le-card:rgba(255,255,255,.66); --le-hi:inset 0 1px 0 rgba(255,255,255,.95); --le-cbord:rgba(22,32,59,.1); --le-cbord-hi:rgba(255,255,255,.9);
    --le-lift:0 0 0 0 transparent; --le-glow:inset 0 0 32px rgba(43,143,255,.22),inset 0 0 8px rgba(43,143,255,.13); --le-sel:inset 0 0 30px rgba(43,143,255,.24),inset 0 0 7px rgba(43,143,255,.13); --le-sh:0 0 0 0 transparent;
    font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,system-ui,'Segoe UI',sans-serif;color:var(--le-ink);-webkit-font-smoothing:antialiased;
  }
  /* чистая светлая поверхность — как «Главная»/кабинет: без аврор и свечений.
     Фон даёт сам светлый shell, страница — только чистые белые карточки. */
  .le-root{position:relative;}
  .le-root *{box-sizing:border-box;}
  .le-head,.le-grid{position:relative;z-index:1;}
  body:has(.le-root) .lr-aifab{display:none!important;}

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
    border:1px solid var(--le-cbord);box-shadow:var(--le-hi);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);}
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
  .le-h1{font-family:var(--le-display);font-weight:700;font-size:42px;letter-spacing:-.028em;line-height:1.02;color:var(--le-ink);margin:0;text-wrap:balance;}
  .le-modpill{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--le-ink);background:rgba(255,255,255,.55);
    border:1px solid var(--le-cbord);border-radius:99px;padding:9px 16px;box-shadow:var(--le-hi);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);}
  .le-modpill svg{color:var(--le-acc-deep);flex:0 0 auto;}
  .le-sub{font-size:17px;line-height:1.55;color:var(--le-ink-sub);margin-top:14px;max-width:62ch;font-weight:400;}

  /* ── ПЛЕЕР — единственный якорь: реальное превью + кастомная панель (вайб ютуба, но чисто) ── */
  .le-player{position:relative;margin-top:30px;border-radius:22px;overflow:hidden;aspect-ratio:16/9;background:#111A2E;
    border:1px solid var(--le-cbord);box-shadow:0 14px 36px -30px rgba(12,26,64,.34);}
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
  .le-digest{margin-top:34px;border-radius:22px;border:1px solid var(--le-cbord);background:var(--le-card);box-shadow:inset 0 1px 0 var(--le-cbord-hi);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);overflow:hidden;}
  .le-digest__bar{width:100%;display:flex;align-items:center;gap:16px;padding:19px 24px;cursor:pointer;background:0;border:0;font:inherit;text-align:left;color:var(--le-ink);transition:background .15s;}
  .le-digest__bar:hover{background:rgba(43,143,255,.02);}
  .le-digest__ti{flex:1 1 auto;min-width:0;}
  .le-digest__t{font-family:var(--le-display);font-weight:500;font-size:19px;letter-spacing:-.012em;color:var(--le-ink);}
  .le-digest__h{font-size:13px;font-weight:500;color:var(--le-ink-mute);margin-top:4px;line-height:1.45;font-variant-numeric:tabular-nums;}
  .le-digest__chev{flex:0 0 auto;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;color:var(--le-ink-mute);border:1px solid var(--le-line);transition:transform .25s cubic-bezier(.23,1,.32,1),color .15s,border-color .15s;}
  .le-digest__bar:hover .le-digest__chev{color:var(--le-acc-deep);border-color:var(--le-acc-line);}
  .le-digest.open .le-digest__chev{transform:rotate(180deg);}
  .le-digest__body{padding:24px 30px 18px;}
  /* шапка конспекта — статичная (иконка + название), без сворачивания (по референсу) */
  .le-digest__hd{display:flex;align-items:center;gap:14px;padding:28px 30px 0;}
  .le-digest__hd-ic{flex:0 0 40px;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:#2073E6;background:rgba(43,143,255,.12);box-shadow:inset 0 0 15px rgba(43,143,255,.42),inset 0 0 3px rgba(160,205,255,.45);}
  .le-digest__hd-t{font-family:var(--le-display);font-weight:700;font-size:21px;letter-spacing:-.016em;color:var(--le-ink);}
  /* табы конспекта — сегмент-контрол */
  .le-dtabs{display:flex;gap:8px;flex-wrap:wrap;padding:20px 28px 0;}
  .le-dtab{font-family:inherit;font-size:13.5px;font-weight:600;color:var(--le-ink-sub);background:rgba(255,255,255,.5);border:1px solid var(--le-line);
    padding:9px 16px;border-radius:99px;cursor:pointer;transition:color .15s,background .15s,border-color .15s;white-space:nowrap;}
  .le-dtab:hover{color:var(--le-acc-deep);border-color:var(--le-acc-line);}
  .le-dtab.is-on{color:var(--le-acc-deep);background:rgba(43,143,255,.1);border-color:rgba(43,143,255,.4);box-shadow:inset 0 0 16px rgba(43,143,255,.24),inset 0 0 4px rgba(160,205,255,.4);}
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
  .le-aims__list{margin-top:16px;display:flex;flex-direction:column;gap:12px;}
  .le-aims__i{display:flex;align-items:center;gap:14px;font-size:16px;font-weight:450;color:var(--le-ink);line-height:1.45;padding:14px 17px;border-radius:14px;background:rgba(255,255,255,.5);border:1px solid var(--le-cbord);box-shadow:var(--le-hi);}
  .le-aims__c{flex:0 0 26px;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:#2073E6;background:rgba(43,143,255,.12);box-shadow:inset 0 0 12px rgba(43,143,255,.42),inset 0 0 3px rgba(160,205,255,.45);}

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
.le-doc-material{display:flex;align-items:center;gap:13px;max-width:540px;margin:16px 0 6px;padding:12px 14px;border-radius:15px;background:rgba(255,255,255,.7);border:1px solid var(--le-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);text-decoration:none;color:var(--le-ink);transition:border-color .15s,background .15s,transform .15s;}
.le-doc-material__ic{flex:0 0 42px;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:#fff;background:var(--le-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.28);}
.le-doc-material__b{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px;}
.le-doc-material__t{min-width:0;font-size:14.5px;font-weight:600;color:var(--le-ink);letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.le-doc-material__meta{font-size:12px;font-weight:500;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
.le-doc-material__dl{flex:0 0 auto;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;color:var(--le-ink-mute);background:rgba(22,32,59,.04);transition:color .15s,background .15s;}
.le-doc-material:hover{border-color:var(--le-acc-line);background:#fff;transform:translateY(-1px);}
.le-doc-material:hover .le-doc-material__dl{color:var(--le-acc-deep);background:var(--le-acc-soft);}
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
.le-study.is-compact .le-doc-material{margin:12px 0 2px;padding:9px 11px;gap:11px;}
.le-study.is-compact .le-doc-material__ic{flex-basis:36px;width:36px;height:36px;border-radius:10px;}
.le-study.is-compact .le-doc-material__t{font-size:13px;}
.le-study.is-compact .le-doc-material__meta{font-size:11px;}
.le-study.is-compact .le-doc-material__dl{width:28px;height:28px;}
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
  .le-hw{position:relative;margin-top:0;display:flex;align-items:center;gap:20px;flex-wrap:wrap;border-radius:22px;padding:24px 26px;
    border:1px solid rgba(43,143,255,.34);background:rgba(43,143,255,.06);box-shadow:inset 0 1px 0 rgba(255,255,255,.6),var(--le-glow);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);overflow:hidden;}
  .le-hw__ic{position:relative;flex:0 0 46px;width:46px;height:46px;border-radius:14px;display:grid;place-items:center;color:#fff;background:var(--le-acc-deep);box-shadow:inset 0 0 16px rgba(120,190,255,.7),inset 0 1px 0 rgba(255,255,255,.32);}
  .le-hw__cta.le-btn{padding:15px 30px;font-size:15px;}
  .le-hwhead{display:flex;align-items:center;gap:9px;font-family:var(--le-display);font-size:17px;font-weight:700;color:var(--le-ink);letter-spacing:-.014em;margin:38px 0 14px;}
  .le-hwhead svg{color:var(--le-acc-deep);}
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
  .le-mats{margin-top:36px;}
  .le-mats__h{display:flex;align-items:center;gap:9px;font-family:var(--le-display);font-size:17px;font-weight:700;color:var(--le-ink);letter-spacing:-.014em;margin-bottom:13px;}
  .le-mats__h svg{color:var(--le-acc-deep);}
  .le-mats__list{display:flex;flex-direction:column;gap:9px;}
  .le-mat{display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:14px;background:var(--le-card);border:1px solid var(--le-cbord);box-shadow:inset 0 1px 0 var(--le-cbord-hi);-webkit-backdrop-filter:blur(18px);backdrop-filter:blur(18px);text-decoration:none;color:var(--le-ink);transition:border-color .15s,box-shadow .15s;}
  .le-mat:hover{border-color:rgba(43,143,255,.4);box-shadow:inset 0 0 20px rgba(43,143,255,.14),var(--le-hi);}
  .le-mat__ic{flex:0 0 42px;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:#fff;background:var(--le-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.28);}
  .le-mat__ext{font-family:var(--le-display);font-size:11px;font-weight:800;letter-spacing:.01em;color:#fff;}
  .le-mat__b{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px;}
  .le-mat__t{font-size:14.5px;font-weight:600;color:var(--le-ink);letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .le-mat__meta{font-size:12px;font-weight:500;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
  .le-mat__dl{flex:0 0 auto;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;color:var(--le-ink-mute);background:rgba(22,32,59,.04);transition:color .15s,background .15s;}
  .le-mat:hover .le-mat__dl{color:var(--le-acc-deep);background:var(--le-acc-soft);}
  .le-study.is-compact .le-mats{margin-top:16px;}
  .le-study.is-compact .le-mats__h{font-size:14px;margin-bottom:9px;}
  .le-study.is-compact .le-mat{padding:9px 11px;gap:11px;}
  .le-study.is-compact .le-mat__ic{flex-basis:36px;width:36px;height:36px;border-radius:10px;}
  .le-study.is-compact .le-mat__ext{font-size:10px;}
  .le-study.is-compact .le-mat__t{font-size:13px;}
  .le-study.is-compact .le-mat__meta{font-size:11px;}
  .le-study.is-compact .le-mat__dl{width:28px;height:28px;}

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

  /* ── РЕЙЛ · ПЛЕЙЛИСТ модуля — чистые стеклянные строки, БЕЗ таймлайна.
     Текущий урок — фирменное свечение изнутри (inset), как чойс-чипсы анкеты.
     Никаких линий, узлов и внешних теней. */
  .le-pl{border-radius:22px;border:1px solid var(--le-cbord);background:var(--le-card);box-shadow:inset 0 1px 0 var(--le-cbord-hi),var(--le-glow);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);overflow:hidden;}
  .le-pl__hd{display:flex;align-items:center;gap:13px;padding:20px 20px 16px;border-bottom:1px solid var(--le-line-soft);}
  .le-pl__hd-ic{flex:0 0 40px;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;color:#2073E6;
    background:rgba(43,143,255,.12);box-shadow:inset 0 0 13px rgba(43,143,255,.42),inset 0 0 3px rgba(160,205,255,.45);}
  .le-pl__hd-b{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;}
  .le-pl__hd-t{display:block;font-family:var(--le-display);font-size:17px;font-weight:700;color:var(--le-ink);letter-spacing:-.016em;line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .le-pl__hd-m{display:block;font-size:12.5px;font-weight:500;color:var(--le-ink-sub);margin-top:4px;font-variant-numeric:tabular-nums;}
  .le-pl__bar{margin:0 18px 6px;height:5px;border-radius:99px;background:rgba(22,32,59,.07);overflow:hidden;}
  .le-pl__bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#5CB4FF,#2073E6);box-shadow:0 0 10px rgba(43,143,255,.6);transition:width .9s cubic-bezier(.22,.61,.36,1);}
  .le-pl__list{padding:8px;display:flex;flex-direction:column;gap:3px;}
  .le-pli{position:relative;display:flex;align-items:center;gap:12px;width:100%;text-align:left;font:inherit;background:0;border:1px solid transparent;border-radius:15px;padding:9px 11px;cursor:pointer;
    transition:background .16s,border-color .16s,box-shadow .16s;}
  .le-pli:hover:not(.locked):not(.current){background:rgba(255,255,255,.42);border-color:var(--le-cbord);box-shadow:var(--le-hi);}
  .le-pli__th{position:relative;flex:0 0 54px;width:54px;height:54px;border-radius:14px;overflow:hidden;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.7),inset 0 0 0 2.5px rgba(43,143,255,.06);}
  .le-pli__th img{width:100%;height:100%;object-fit:cover;display:block;}
  .le-pli__play{position:absolute;inset:0;display:grid;place-items:center;color:#fff;background:linear-gradient(180deg,rgba(8,14,34,.02),rgba(8,14,34,.26));}
  .le-pli.locked .le-pli__th img{filter:grayscale(.5) brightness(.88);}
  .le-pli.locked .le-pli__th{opacity:.8;}
  .le-pli__b{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:4px;}
  .le-pli__t{font-size:14px;font-weight:600;color:var(--le-ink);letter-spacing:-.01em;line-height:1.26;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .le-pli.locked .le-pli__t{color:var(--le-ink-mute);font-weight:500;}
  .le-pli__m{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:500;color:var(--le-ink-mute);font-variant-numeric:tabular-nums;}
  .le-pli__m i{width:2.5px;height:2.5px;border-radius:50%;background:var(--le-ink-faint);flex:0 0 auto;}
  .le-pli.current{background:rgba(255,255,255,.6);border-color:rgba(43,143,255,.42);box-shadow:var(--le-sel);}
  .le-pli.current .le-pli__t{font-weight:700;}
  .le-pli.current .le-pli__th{box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.85),0 0 0 2px rgba(43,143,255,.32);}
  .le-pli.locked{cursor:default;}
  .le-pli__r{flex:0 0 auto;display:inline-flex;align-items:center;padding-right:2px;}
  .le-pli__sc{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;color:#0E9F6E;
    background:rgba(16,185,120,.12);box-shadow:inset 0 0 12px rgba(16,185,120,.5),inset 0 0 0 1px rgba(16,185,120,.42);}
  .le-pli__now{font-size:10.5px;font-weight:700;color:#fff;background:var(--le-acc-deep);padding:4px 11px;border-radius:99px;white-space:nowrap;
    box-shadow:inset 0 0 12px rgba(120,190,255,.7),inset 0 1px 0 rgba(255,255,255,.35);}
  .le-pli__lock{color:var(--le-ink-faint);display:inline-flex;}
  .le-pl__all{width:100%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:700;color:#fff;padding:15px;border:0;background:#2073E6;box-shadow:inset 0 0 18px rgba(120,190,255,.85),inset 0 1px 0 rgba(255,255,255,.3);transition:background .12s;}
  .le-pl__all:hover{background:#2B8FFF;}
  .le-pl__all svg{transition:transform .15s;}
  .le-pl__all:hover svg{transform:translateX(2px);}

  /* ── карточка преподавателя — живой профиль наставника ─────────────────────
     Настоящее фото в квадратно-скруглённом аватаре + онлайн-точка, тихое
     сапфировое свечение ПОЗАДИ (не выпуклый пузырь на плашке), имя/роль,
     чип-доверие и чистая кнопка. Хочется написать живому человеку. */
  .le-card{position:relative;overflow:hidden;border-radius:20px;padding:22px;background:var(--le-card);border:1px solid var(--le-cbord);box-shadow:inset 0 1px 0 var(--le-cbord-hi),var(--le-glow);-webkit-backdrop-filter:blur(22px) saturate(1.2);backdrop-filter:blur(22px) saturate(1.2);}
  .le-card__h{position:relative;display:flex;align-items:center;gap:9px;padding:0 2px;}
  .le-card__hdot{flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:var(--le-jade);box-shadow:0 0 0 3px rgba(16,185,120,.16);}
  .le-card__t{font-size:13px;font-weight:600;letter-spacing:-.01em;color:var(--le-ink-sub);}
  .le-tch{position:relative;display:flex;align-items:center;gap:14px;padding:2px;margin-top:2px;}
  /* аватар преподавателя — КРУГЛЫЙ (по референсу) */
  .le-tch__av{position:relative;flex:0 0 58px;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;
    font-family:var(--le-display);font-size:23px;font-weight:600;color:#fff;background:var(--le-acc-deep);
    box-shadow:inset 0 0 0 1px rgba(22,32,59,.06),0 10px 22px -10px rgba(32,90,200,.5);}
  .le-tch__av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;border-radius:50%;}
  .le-tch__b{flex:1 1 auto;min-width:0;}
  .le-tch__n{font-size:17px;font-weight:600;color:var(--le-ink);letter-spacing:-.012em;line-height:1.2;}
  .le-tch__r{font-size:12.5px;font-weight:450;color:var(--le-ink-mute);margin-top:4px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .le-tchbtn{position:relative;margin-top:17px;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;padding:13px;border-radius:13px;color:#fff;background:#2073E6;border:0;
    box-shadow:inset 0 0 18px rgba(120,190,255,.85),inset 0 1px 0 rgba(255,255,255,.3);transition:background .15s,transform .15s;}
  .le-tchbtn:hover{background:#2B8FFF;transform:translateY(-1px);}
  .le-tchbtn:active{transform:translateY(0);}

  /* ── НИЖНЯЯ ПАНЕЛЬ урока — ПЛАВАЮЩАЯ пилюля: «Назад · Урок N из M · Дальше».
     Отрывается от контента (sticky снизу + тень + зазор), стекло-блюр (футер —
     единственное разрешённое место настоящего blur в системе). ─────────────── */
  .le-foot{position:sticky;bottom:22px;z-index:12;margin:26px 402px 0 0;display:flex;align-items:center;gap:16px;padding:14px 18px;border-radius:20px;
    background:rgba(255,255,255,.9);-webkit-backdrop-filter:blur(24px) saturate(1.4);backdrop-filter:blur(24px) saturate(1.4);border:1px solid rgba(22,32,59,.08);box-shadow:0 16px 40px -18px rgba(20,32,64,.24);}
  .le-foot__mid{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:16px;min-width:0;}
  .le-foot__step{font-size:12.5px;font-weight:500;color:var(--le-ink-mute);white-space:nowrap;font-variant-numeric:tabular-nums;}
  .le-foot__dots{display:flex;align-items:center;}
  .le-foot__ln{width:6px;height:3px;border-radius:2px;background:#D3D8F0;margin:0 5px;flex:none;}
  .le-foot__dot{width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:inset 0 0 0 1.5px #C4CAE6;flex:none;}
  .le-foot__dot.done{background:#2B8FFF;box-shadow:none;}
  .le-foot__dot.cur{width:15px;height:15px;background:#2B8FFF;box-shadow:0 0 0 4px rgba(43,143,255,.22),inset 0 0 0 3px rgba(255,255,255,.92);}
  .le-foot .le-btn{padding:14px 26px;font-size:14.5px;}
  @media (max-width:560px){ .le-foot__dots{display:none;} }

  /* кнопки (общие с попапом) — плоские, без выпуклости */
  .le-btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;border:0;white-space:nowrap;font-family:inherit;font-size:14.5px;font-weight:600;letter-spacing:-.005em;padding:13px 22px;border-radius:12px;transition:transform .14s,background .14s,box-shadow .14s,opacity .14s;}
  .le-btn svg{transition:transform .15s;}
  /* канон-кнопка «Дальше» — сапфир + свечение ВНУТРИ (как анкета/роадмап), но
     ореол приглушён, чтобы плотный сапфир читался и кнопка не «выцветала» в белое */
  .le-btn--primary{background:#2073E6;color:#fff;box-shadow:inset 0 0 18px rgba(120,190,255,.85),inset 0 1px 0 rgba(255,255,255,.3);}
  .le-btn--primary:hover{background:#2B8FFF;transform:translateY(-1px);}
  .le-btn--primary:active{transform:translateY(1px);}
  .le-btn--primary:disabled{background:#C3CCDE;color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.2);cursor:not-allowed;opacity:.75;}
  .le-btn--ok{background:var(--le-jade);box-shadow:0 10px 22px -12px rgba(28,126,82,.55);color:#fff;}
  .le-btn--ok:hover{background:#1F8F5C;transform:translateY(-1px);}
  /* secondary «Назад» — видимая всегда (не белое на белом): тёмная подложка-чернило + чёткая обводка */
  .le-btn--ghost{background:#fff;color:#3A3A55;border:1px solid rgba(120,120,200,.2);}
  .le-btn--ghost:hover{background:#F2F3FC;}
  .le-btn--ghost:disabled{opacity:.4;cursor:not-allowed;}
  .le-btn .bk{transform:rotate(-45deg);} .le-btn--ghost:hover .bk{transform:rotate(-45deg) translateX(-2px);}
  .le-btn .arr{transform:rotate(-45deg);} .le-btn:hover .arr{transform:rotate(-45deg) translateX(2px);}

  /* ═══════════ ТЕСТ — ПОПАП (чисто, плоско, без блюра и выкрутасов) ═══════════ */
  .lt-modal{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;padding:28px;background:rgba(10,16,38,.5);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:lt-fade .24s ease;}
  @keyframes lt-fade{from{opacity:0;}to{opacity:1;}}
  .lt-modal__panel{position:relative;width:min(720px,100%);height:min(680px,86vh);display:flex;flex-direction:column;border-radius:24px;background:#F7F9FE;border:1px solid rgba(255,255,255,.85);box-shadow:0 44px 120px -32px rgba(3,8,28,.5);overflow:hidden;animation:lt-rise .32s cubic-bezier(.23,1,.32,1);will-change:transform;}
  .lt-modal__panel::before{content:'';position:absolute;top:9px;left:50%;transform:translateX(-50%);width:40px;height:4px;border-radius:99px;background:rgba(22,32,59,.16);z-index:5;pointer-events:none;display:none;}
  @keyframes lt-rise{from{opacity:0;transform:translateY(14px) scale(.985);}to{opacity:1;transform:none;}}
  @keyframes lt-sheet{from{transform:translateY(100%);}to{transform:translateY(0);}}
  .lt-modal__head{flex:0 0 auto;display:flex;flex-direction:column;gap:14px;padding:18px 22px 16px;border-bottom:1px solid var(--le-line);
    background:radial-gradient(420px 120px at 18% 0%,rgba(43,143,255,.08),transparent 70%);}
  .lt-modal__hrow{display:flex;align-items:center;gap:11px;}
  .lt-badge{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:700;color:var(--le-acc-ink);background:rgba(43,143,255,.12);padding:6px 13px 6px 11px;border-radius:99px;box-shadow:inset 0 0 14px rgba(43,143,255,.3),inset 0 0 3px rgba(160,205,255,.4);}
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
  .lt-prog{height:13px;border-radius:99px;background:rgba(22,32,59,.09);overflow:hidden;box-shadow:inset 0 1px 2px rgba(22,32,59,.08);}
  .lt-prog i{display:block;height:100%;min-width:13px;border-radius:99px;background:linear-gradient(90deg,#5CB4FF,#2073E6);box-shadow:0 0 12px rgba(43,143,255,.5),inset 0 2px 0 rgba(255,255,255,.4),inset 0 -2px 0 rgba(20,70,180,.18);transition:width .55s cubic-bezier(.34,1.35,.5,1);}
  .lt-modal__body{flex:1 1 auto;overflow-y:auto;padding:28px 30px 18px;}
  .lt-q{animation:lt-in .3s cubic-bezier(.23,1,.32,1);}
  @keyframes lt-in{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
    .lt-foot{flex:0 0 auto;}
  .lt-fbbar{display:flex;align-items:center;gap:14px;padding:16px 22px 15px;animation:lt-fbup .34s cubic-bezier(.23,1,.32,1);}
  @keyframes lt-fbup{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;}}
  .lt-foot.is-ok .lt-fbbar{background:rgba(16,185,120,.11);border-top:1px solid rgba(16,185,120,.3);}
  .lt-foot.is-bad .lt-fbbar{background:rgba(240,84,72,.1);border-top:1px solid rgba(240,84,72,.3);}
  .lt-fbbar__ic{flex:0 0 42px;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;color:#fff;animation:lx-badgepop .4s cubic-bezier(.23,1,.32,1);}
  .lt-foot.is-ok .lt-fbbar__ic{background:#0E9F6E;box-shadow:inset 0 0 13px rgba(120,235,180,.75),inset 0 1px 0 rgba(255,255,255,.3),0 8px 18px -8px rgba(16,185,120,.6);}
  .lt-foot.is-bad .lt-fbbar__ic{background:#E5484D;box-shadow:inset 0 0 13px rgba(250,165,150,.65),inset 0 1px 0 rgba(255,255,255,.25),0 8px 18px -8px rgba(240,84,72,.55);}
  .lt-fbbar__tx{flex:1 1 auto;min-width:0;}
  .lt-fbbar__t{font-size:17px;font-weight:700;letter-spacing:-.01em;}
  .lt-foot.is-ok .lt-fbbar__t{color:#0B8A5A;}
  .lt-foot.is-bad .lt-fbbar__t{color:#C4362B;}
  .lt-fbbar__s{font-size:13.5px;font-weight:500;color:var(--le-ink-sub);margin-top:2px;line-height:1.4;overflow-wrap:break-word;}
  .lt-fbbar__s b{font-weight:700;color:var(--le-ink);}
  .lt-modal__foot{flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:14px 18px;border-top:1px solid var(--le-line);
    background:rgba(232,236,251,.5);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:inset 0 1px 0 rgba(255,255,255,.55);}
  .lt-foot.is-ok .lt-modal__foot,.lt-foot.is-bad .lt-modal__foot{border-top:0;box-shadow:none;}
  .lt-hint{flex:1 1 auto;min-width:0;font-size:13px;font-weight:500;color:var(--le-ink-mute);}
  .lt-back{flex:0 0 auto;}

  .lt-done{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;padding:46px 28px 40px;
    background:radial-gradient(540px 280px at 50% -8%,rgba(245,200,76,.1),transparent 64%);}
  .lt-done__star{position:relative;width:104px;height:104px;border-radius:50%;display:grid;place-items:center;
    background:radial-gradient(62% 62% at 50% 40%,rgba(255,242,206,.98),rgba(245,200,76,.3));
    box-shadow:0 0 0 10px rgba(245,200,76,.09),0 20px 48px -14px rgba(226,165,46,.45);animation:lt-star .6s cubic-bezier(.23,1,.32,1);}
  .lt-done__star svg{color:#E2A52E;}
  .lt-done__star::before{content:'';position:absolute;inset:-10px;border-radius:50%;border:2px solid rgba(245,200,76,.5);animation:lt-ring .85s cubic-bezier(.23,1,.32,1) .15s both;}
  @keyframes lt-star{0%{transform:scale(.4) rotate(-18deg);opacity:0;}60%{transform:scale(1.08) rotate(4deg);}100%{transform:scale(1) rotate(0);opacity:1;}}
  @keyframes lt-ring{from{transform:scale(.7);opacity:0;}45%{opacity:.85;}to{transform:scale(1.55);opacity:0;}}
  .lt-done__cel{position:relative;display:grid;place-items:center;}
  .lt-conf{position:absolute;top:44px;left:50%;width:0;height:0;pointer-events:none;z-index:0;}
  .lt-conf i{position:absolute;left:0;top:0;width:9px;height:9px;border-radius:2px;opacity:0;animation:lt-conf 1.1s cubic-bezier(.2,.7,.3,1) forwards;}
  @keyframes lt-conf{0%{opacity:0;transform:translate(0,0) scale(.4) rotate(0);}18%{opacity:1;}100%{opacity:0;transform:translate(var(--cx),var(--cy)) scale(1) rotate(var(--cr));}}
  .lt-done__k{margin-top:22px;display:inline-flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:var(--le-acc-ink);background:rgba(43,143,255,.12);padding:7px 14px;border-radius:99px;box-shadow:inset 0 0 14px rgba(43,143,255,.3),inset 0 0 3px rgba(160,205,255,.4);}
  .lt-done__h{font-family:var(--le-display);font-weight:700;font-size:32px;letter-spacing:-.03em;line-height:1.06;color:var(--le-ink);margin-top:16px;text-wrap:balance;}
  .lt-done__s{font-size:15.5px;color:var(--le-ink-sub);margin-top:12px;max-width:40ch;line-height:1.55;font-weight:400;}
  .lt-stats{display:flex;gap:12px;margin-top:28px;flex-wrap:wrap;justify-content:center;}
  .lt-stat{min-width:124px;padding:18px 20px;border-radius:16px;background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.8);box-shadow:inset 0 1px 0 rgba(255,255,255,.8),inset 0 0 30px rgba(43,143,255,.07);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);}
  .lt-stat--gold{background:linear-gradient(180deg,rgba(245,200,76,.12),rgba(245,200,76,.04));border-color:rgba(226,165,46,.28);}
  .lt-stat__v{font-family:var(--le-display);font-size:30px;font-weight:600;letter-spacing:-.02em;color:var(--le-acc-deep);font-variant-numeric:tabular-nums;line-height:1;}
  .lt-stat__v.gold{color:var(--le-gold);}
  .lt-stat__k{font-size:12px;font-weight:500;color:var(--le-ink-mute);margin-top:10px;}
  .lt-done__cta{display:flex;gap:13px;margin-top:32px;flex-wrap:wrap;justify-content:center;}
  @media (prefers-reduced-motion:reduce){ .lt-done__star,.lt-done__star::before{animation:none;} }

  /* ── contained-режим Тренажёра: bottom sheet внутри рамки телефона (превью конструктора).
     Тест = попап поверх урока: скрим + блюр, шторка снизу со скруглённым верхом и грабером.
     Закрытие — кликом по фону, крестиком или Esc. ─────────────────────────────────────── */
  .lt-modal.lt-modal--in{position:absolute;inset:0;z-index:5;padding:0;flex-direction:column;justify-content:flex-end;align-items:stretch;
    background:rgba(8,14,34,.34);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:lt-fade .24s ease;}
  .lt-modal--in .lt-modal__panel{position:relative;width:100%;max-width:none;max-height:92%;border-radius:26px 26px 0 0;
    box-shadow:0 -24px 60px -26px rgba(6,12,30,.5),inset 0 1px 0 rgba(255,255,255,.9);animation:lt-sheet-up .4s cubic-bezier(.23,1,.32,1);}
  @keyframes lt-sheet-up{from{transform:translateY(36px);opacity:.4;}to{transform:none;opacity:1;}}
  .lt-modal--in .lt-modal__panel::before{content:'';position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:6;
    width:40px;height:5px;border-radius:99px;background:rgba(22,32,59,.16);}
  .lt-modal--in .lt-modal__head{padding-top:22px;}
  .lt-modal--in .lt-modal__body{padding:22px 18px 12px;}
  /* футер узкой шторки: не даём тексту-отзыву распирать строку с кнопками.
     Дежурную подсказку прячем, отзыв «Верно/Почти» — отдельной строкой сверху,
     основную кнопку тянем во всю оставшуюся ширину рядом с «Назад». */
  .lt-modal--in .lt-modal__foot{flex-wrap:wrap;padding:12px 16px calc(14px + env(safe-area-inset-bottom,0px));gap:10px 12px;}
  .lt-modal--in .lt-fb{order:-1;flex:1 1 100%;font-size:13.5px;}
  .lt-modal--in .lt-fb:not(.show){display:none;}          /* нет отзыва — нет пустой строки */
  .lt-modal--in .lt-back{flex:0 0 auto;}
  .lt-modal--in .lt-modal__foot .le-btn:not(.lt-back){flex:1 1 auto;justify-content:center;}
  /* экран результата под узкую шторку */
  .lt-modal--in .lt-done{padding:30px 20px 26px;}
  .lt-modal--in .lt-done__star{width:84px;height:84px;}
  .lt-modal--in .lt-done__star svg{width:44px;height:44px;}
  .lt-modal--in .lt-done__h{font-size:25px;}
  .lt-modal--in .lt-done__s{font-size:14px;margin-top:10px;}
  .lt-modal--in .lt-stats{gap:9px;margin-top:22px;flex-wrap:nowrap;}
  .lt-modal--in .lt-stat{min-width:0;flex:1 1 0;padding:14px 10px;text-align:center;}
  .lt-modal--in .lt-stat__v{font-size:21px;}
  .lt-modal--in .lt-stat__k{font-size:10.5px;margin-top:6px;}
  .lt-modal--in .lt-done__cta{margin-top:26px;flex-direction:column;width:100%;gap:10px;}
  .lt-modal--in .lt-done__cta .le-btn{width:100%;justify-content:center;}

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
  .le-study.is-compact .le-hw{margin-top:18px;padding:16px 16px 18px;gap:12px 14px;}
  .le-study.is-compact .le-hw__ic{flex-basis:38px;width:38px;height:38px;border-radius:11px;}
  .le-study.is-compact .le-hw__b{flex:1 1 auto;}
  .le-study.is-compact .le-hw__t{font-size:15px;}
  /* CTA домашки в узком превью — во всю ширину, отдельной строкой (реальный CTA) */
  .le-study.is-compact .le-hw__cta{flex:1 1 100%;width:100%;order:3;}
  .le-study.is-compact .le-hw__cta.le-btn{width:100%;padding:12px 16px;font-size:13.5px;margin-top:2px;}

  @media (max-width:1080px){
    .le-grid{grid-template-columns:1fr;}
    .le-foot{margin-right:0;}
    .le-rail{position:static;flex-direction:row;flex-wrap:wrap;gap:16px;margin-top:8px;}
    .le-pl{flex:1 1 360px;}
    .le-card{flex:1 1 280px;}
  }
  @media (max-width:680px){
    .le-head{margin:0 0 18px;padding:0;}
    .le-crumb{font-size:13.5px;min-width:0;}
    .le-crumb__mod,.le-crumb__cur,.le-crumb__sep{display:none;}
    .le-titlerow{gap:12px;}
    .le-h1{font-size:30px;letter-spacing:-.028em;}
    .le-sub{font-size:15px;margin-top:11px;}
    .le-player{margin-top:22px;border-radius:18px;}
    .le-vtitle{display:none;}
    .le-play{width:58px;height:58px;}
    .le-poster__cap{left:12px;top:12px;font-size:11px;}
    .le-vctrl{padding:0 12px 12px;gap:10px;}
    .le-digest{margin-top:26px;border-radius:20px;}
    .le-digest__hd{padding:20px 18px 0;}
    .le-digest__hd-t{font-size:19px;}
    .le-digest__body{padding:18px 18px 12px;}
    .le-dfoot{margin:4px 18px 18px;}
    .le-hwhead{margin:28px 0 12px;font-size:16px;}
    .le-hw{padding:20px 18px;gap:15px;}
    .le-hw__b{flex:1 1 100%;}
    .le-hw__cta.le-btn{width:100%;justify-content:center;padding:14px;}
    .le-mats{margin-top:28px;}
    .le-tones{grid-template-columns:repeat(2,1fr);}
    .le-rail{flex-direction:column;margin-top:24px;}
    .le-pl,.le-card{flex:1 1 100%;}
    .le-foot{padding:10px 12px;gap:8px;bottom:12px;border-radius:16px;}
    .le-foot .le-btn{padding:12px 16px;font-size:13.5px;flex:1 1 auto;}
    .le-foot__mid{display:none;}
    .lt-modal{padding:0;align-items:flex-end;}
    .lt-modal__panel{width:100%;height:86vh;border-radius:22px 22px 0 0;box-shadow:0 -30px 90px -24px rgba(3,8,28,.42);animation:lt-sheet .4s cubic-bezier(.32,.72,0,1);}
    .lt-modal__panel::before{display:block;}
    .lt-modal__head{padding:22px 18px 14px;}
    .lt-modal__head{padding:16px 16px 14px;}
    .lt-modal__body{padding:22px 16px 16px;}
    .lx-voc,.lx-tone__opts{grid-template-columns:1fr;}
    .lx-match{grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:9px 10px;}
    .lx-mcol{gap:9px;}
    .lx-mi{padding:12px 11px;min-height:54px;}
    .lx-mcol--l .lx-mi__t{font-size:21px;}
    .lx-mi__t{font-size:14.5px;}
    .lx-opt{padding:14px 15px;}
    .lx-opt__t{font-size:16px;}
    .lx-gapline{font-size:18px;}
    .lx-prompt{font-size:19px;}
    .lt-modal__foot{padding:12px 14px;gap:10px;}
    .lt-hint{display:none;}
    .lt-modal__foot .le-btn{padding:12px 15px;font-size:13.5px;}
    .lt-fb{font-size:13px;gap:8px;}
    .lt-done{padding:34px 18px 30px;}
    .lt-done__h{font-size:26px;}
    .lt-done__s{font-size:14.5px;}
    .lt-stats{gap:10px;}
    .lt-stat{min-width:0;flex:1 1 42%;padding:15px 14px;}
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

  function TaskView(props) {
    const block = props.block || {};
    const st = props.st || {};
    const files = st.files || [];
    const text = st.text || '';
    const set = function (patch) { if (props.onChange) props.onChange(Object.assign({}, st, patch)); };
    const fmtSize = function (b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + ' МБ' : Math.max(1, Math.round((b || 0) / 1024)) + ' КБ'; };
    const onPick = function (e) {
      const fl = Array.prototype.slice.call(e.target.files || []).map(function (f) { return { name: f.name, size: f.size, ext: (f.name.split('.').pop() || '').toUpperCase().slice(0, 4) }; });
      if (fl.length) set({ files: files.concat(fl) });
      e.target.value = '';
    };
    return h('div', { className: 'lx-scope lx-task' },
      h('div', { className: 'lx-head' + (block.body ? ' has-sub' : '') },
        h('span', { className: 'lx-head__ic' }, Ic.Edit ? h(Ic.Edit, { size: 19 }) : null),
        h('div', { className: 'lx-head__tx' },
          h('div', { className: 'lx-head__t' }, block.prompt || 'Задание'),
          block.body ? h('div', { className: 'lx-head__s' }, block.body) : null)),
      block.brief ? h('div', { className: 'lx-task__brief' }, block.brief) : null,
      (block.checklist && block.checklist.length) ? h('div', { className: 'lx-task__req' },
        h('div', { className: 'lx-task__req-h' }, 'Что нужно сделать'),
        h('div', { className: 'lx-task__req-list' }, block.checklist.map(function (it, i) {
          return h('div', { key: i, className: 'lx-task__req-i' }, h('span', { className: 'lx-task__req-n' }, i + 1), h('span', null, it));
        }))) : null,
      h('div', { className: 'lx-task__label' }, 'Ваш ответ'),
      h('textarea', { className: 'lx-task__text', placeholder: 'Напишите ответ или комментарий (по желанию)…', value: text, onChange: function (e) { set({ text: e.target.value }); } }),
      h('div', { className: 'lx-task__label' }, 'Прикрепите работу'),
      h('label', { className: 'lx-task__drop' },
        h('input', { type: 'file', hidden: true, multiple: true, onChange: onPick }),
        h('span', { className: 'lx-task__drop-ic' }, Ic.Upload ? h(Ic.Upload, { size: 21 }) : (Ic.Paperclip ? h(Ic.Paperclip, { size: 20 }) : null)),
        h('span', { className: 'lx-task__drop-t' }, 'Перетащите файл или ', h('b', null, 'нажмите, чтобы выбрать')),
        h('span', { className: 'lx-task__drop-s' }, block.accept || 'PDF, DOCX, JPG, PNG · до 10 МБ')),
      files.length ? h('div', { className: 'lx-task__files' }, files.map(function (f, i) {
        return h('div', { key: i, className: 'lx-task__file' },
          h('span', { className: 'lx-task__file-ic' }, f.ext || (Ic.File ? h(Ic.File, { size: 16 }) : null)),
          h('div', { className: 'lx-task__file-b' },
            h('div', { className: 'lx-task__file-t' }, f.name),
            h('div', { className: 'lx-task__file-s' }, fmtSize(f.size))),
          h('button', { type: 'button', className: 'lx-task__file-x', onClick: function () { set({ files: files.filter(function (_, j) { return j !== i; }) }); }, 'aria-label': 'Убрать' }, Ic.Close ? h(Ic.Close, { size: 15 }) : '×'));
      })) : null);
  }

  function BlockView(props) {
    const { block, st, revealed, onChange } = props;
    if (!block) return null;
    const locked = !!revealed;

    // ── Теория ──
    if (block.type === 'theory') {
      const vocab = (block.vocab || []).filter((v) => v.hanzi || v.ru);
      return h('div', { className: 'lx-scope' },
        exHead(Ic.Book ? h(Ic.Book, { size: 19 }) : null, block.title || 'Новые слова'),
        block.body ? h('div', { className: 'lx-theory__b' }, block.body) : null,
        vocab.length ? h('div', { className: 'lx-voc' }, vocab.map((v, i) => h('div', { key: i, className: 'lx-voc__c' },
          h('div', { className: 'lx-voc__top' },
            h('span', { className: 'lx-voc__py' }, v.pinyin || ''),
            v.hanzi ? h(SpeakBtn, { text: v.hanzi, size: 16 }) : null),
          v.hanzi ? h('div', { className: 'lx-voc__hz' }, v.hanzi) : null,
          v.ru ? h('div', { className: 'lx-voc__ru' }, v.ru) : null))) : null);
    }

    // ── Открытое задание (отправка на проверку) ──
    if (block.type === 'task') return h(TaskView, { block, st, onChange });

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
          exHead(Ic.Edit ? h(Ic.Edit, { size: 19 }) : null, block.prompt || 'Соберите фразу', 'k', locked ? null : 'Выберите слово в пропуск'),
          h('div', { key: 'g', className: 'lx-gapline' },
            block.before ? (block.before + ' ') : '',
            h('span', { className: 'lx-slot' + (sel != null ? ' filled' : '') + (locked ? (sel != null && block.options[sel] && block.options[sel].correct ? ' ok' : ' bad') : '') },
              sel != null ? block.options[sel].text : '…'),
            block.after ? (' ' + block.after) : ''),
        ]
        : [
          exHead(Ic.CheckCircle ? h(Ic.CheckCircle, { size: 19 }) : null, block.prompt || 'Выберите ответ', 'k', locked ? null : 'Выберите один вариант'),
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
        exHead(Ic.Grid ? h(Ic.Grid, { size: 19 }) : null, block.prompt || 'Соедините пары', 'k',
          locked ? null : 'Нажмите иероглиф, затем его перевод'),
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
        exHead(Ic.Route ? h(Ic.Route, { size: 19 }) : null, block.prompt || 'Соберите предложение', 'k', locked ? null : 'Нажимайте слова по порядку'),
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
        exHead(Ic.Send ? h(Ic.Send, { size: 19 }) : null, block.prompt || 'Впишите ответ', 'k', locked ? null : 'Введите перевод и проверьте себя'),
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
        exHead(Ic.Target ? h(Ic.Target, { size: 19 }) : null, block.prompt || 'Определите тон иероглифа', 'k', locked ? null : 'Выберите верный тон'),
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

  // ── Материал как настоящая файловая карточка: тип (по расширению) + размер ──
  function fmtBytes(n) {
    if (!n && n !== 0) return '';
    if (n < 1024) return n + ' Б';
    if (n < 1048576) return Math.round(n / 1024) + ' КБ';
    return (n / 1048576).toFixed(1) + ' МБ';
  }
  function fileMeta(m) {
    const raw = String((m && (m.filename || m.fileName || m.url || m.title)) || '');
    const em = raw.match(/\.([a-z0-9]{1,5})(?:[?#].*)?$/i);
    const ext = em ? em[1].toUpperCase() : '';
    const isLink = !ext && !!(m && m.url) && !(m && (m.filename || m.fileName));
    const size = (m && m.size) ? fmtBytes(m.size) : '';
    const kind = ext
      ? (ext === 'PDF' ? 'PDF-документ'
        : /^(PNG|JPG|JPEG|GIF|WEBP|SVG)$/.test(ext) ? 'Изображение'
        : /^(MP3|WAV|M4A|OGG)$/.test(ext) ? 'Аудио'
        : /^(MP4|MOV|WEBM)$/.test(ext) ? 'Видео'
        : /^(DOC|DOCX)$/.test(ext) ? 'Документ Word'
        : /^(XLS|XLSX|CSV)$/.test(ext) ? 'Таблица'
        : /^(PPT|PPTX)$/.test(ext) ? 'Презентация'
        : /^(ZIP|RAR|7Z)$/.test(ext) ? 'Архив'
        : ext + '-файл')
      : (isLink ? 'Ссылка' : 'Файл');
    let name = (m && m.title) || (m && (m.filename || m.fileName) || '').replace(/\.[^.]+$/, '') || '';
    const looksHash = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}/i.test(name) || /^[0-9a-f]{20,}$/i.test(name);
    if (!name || looksHash) name = kind;
    const badge = ext || (isLink ? 'URL' : '');
    const meta = size || kind;
    return { name, ext, badge, kind, size, meta };
  }

  // Единая шапка задания: иконка-тайл + инструкция. Инструкция = сам prompt
  // (он же и есть задание) — без дублирующего eyebrow над тем же текстом.
  function exHead(icon, title, key, sub) {
    return h('div', { className: 'lx-head' + (sub ? ' has-sub' : ''), key: key || 'exhead' },
      icon ? h('span', { className: 'lx-head__ic' }, icon) : null,
      h('div', { className: 'lx-head__tx' },
        h('div', { className: 'lx-head__t' }, title || ''),
        sub ? h('div', { className: 'lx-head__s' }, sub) : null));
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
      if (b.kind === 'material') {
        const fm = fileMeta({ title: b.title, url: b.url, filename: b.fileName || b.filename, size: b.size });
        return h('a', { key, className: 'le-doc-material', href: b.url || '#', target: '_blank', rel: 'noreferrer' },
          h('span', { className: 'le-doc-material__ic' }, fm.badge
            ? h('span', { className: 'le-mat__ext' }, fm.badge)
            : (Ic.Paperclip ? h(Ic.Paperclip, { size: 16 }) : null)),
          h('span', { className: 'le-doc-material__b' },
            h('span', { className: 'le-doc-material__t' }, fm.name || 'Материал'),
            h('span', { className: 'le-doc-material__meta' }, fm.meta)),
          Ic.Download ? h('span', { className: 'le-doc-material__dl' }, h(Ic.Download, { size: 16 })) : null);
      }
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

    // глоссарий-таблица (только когда урок без doc — иначе слова уже в потоке doc)
    const words = (!hasDoc && glossary.length) ? h('div', { className: 'le-words' },
      h('div', { className: 'le-words__l' }, 'Новые слова'),
      h('div', { className: 'le-gloss' }, glossary.map((g, i) => h('div', { key: i, className: 'le-gl' },
        h('span', { className: 'le-gl__hz' }, g.hanzi || '—'),
        h('span', { className: 'le-gl__py' }, g.pinyin || ''),
        h('span', { className: 'le-gl__ru' }, g.ru || ''))))) : null;

    const pdfMat = (lesson.materials || []).find(function (m) { return m && /pdf/i.test((m.filename || '') + (m.url || '') + (m.title || '')); });
    const onPdf = function () { if (pdfMat && pdfMat.url && pdfMat.url !== '#') window.open(pdfMat.url, '_blank'); else toast('PDF-конспект скоро будет доступен'); };

    // Конспект — единый поток (цели, разбор, слова, выноски) тем же renderDoc,
    // что и превью конструктора (build). Без табов — как во всём продукте.
    const digestEl = (aims || notesBody || words) ? h('div', { className: 'le-digest open' },
      h('div', { className: 'le-digest__hd' },
        h('span', { className: 'le-digest__hd-ic' }, Ic.Book ? h(Ic.Book, { size: 17 }) : null),
        h('span', { className: 'le-digest__hd-t' }, 'Конспект урока')),
      h('div', { className: 'le-digest__body' }, aims, notesBody, words),
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
    const hwHead = (blocks.length && !compact) ? h('div', { className: 'le-hwhead' },
      Ic.Edit ? h(Ic.Edit, { size: 16 }) : null, h('span', null, 'Домашнее задание')) : null;
    const hwBody = blocks.length ? h('div', { className: 'le-hw' + (homeworkDone ? ' is-done' : '') },
      h('span', { className: 'le-hw__ic' }, homeworkDone ? (Ic.Check ? h(Ic.Check, { size: 21, strokeWidth: 2.6 }) : '✓') : (Ic.Edit ? h(Ic.Edit, { size: 20 }) : '✎')),
      h('div', { className: 'le-hw__b' },
        homeworkDone ? h('div', { className: 'le-hw__k' }, acc != null ? 'Сдано · точность ' + acc + '%' : 'Сдано') : null,
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
        const fm = fileMeta(m);
        return h('a', { key: i, className: 'le-mat', href: m.url || '#', target: '_blank', rel: 'noreferrer', onClick: function (e) { if (!m.url || m.url === '#') { e.preventDefault(); toast('Файл скоро будет доступен для скачивания'); } } },
          h('span', { className: 'le-mat__ic' }, fm.badge
            ? h('span', { className: 'le-mat__ext' }, fm.badge)
            : (Ic.File ? h(Ic.File, { size: 18 }) : null)),
          h('span', { className: 'le-mat__b' },
            h('span', { className: 'le-mat__t' }, fm.name),
            h('span', { className: 'le-mat__meta' }, fm.meta)),
          Ic.Download ? h('span', { className: 'le-mat__dl' }, h(Ic.Download, { size: 16 })) : null);
      }))) : null;

    const titleEl = compact
      ? h('h1', { className: 'le-h1' }, lesson.title || 'Урок')
      : h('div', { className: 'le-titlerow' },
          h('h1', { className: 'le-h1' }, lesson.title || (props.item ? ('Урок ' + props.item.n) : 'Урок')),
          props.moduleName ? h('span', { className: 'le-modpill' }, Ic.Route ? h(Ic.Route, { size: 14 }) : null, props.moduleName) : null);

    return h('div', { className: 'le-study' + (compact ? ' is-compact' : '') },
      titleEl,
      lesson.subtitle ? h('p', { className: 'le-sub' }, lesson.subtitle) : null,
      player,
      digestEl,
      matsEl,
      hwHead,
      hwBody);
  }

  window.ELessonUI = { BlockView, explainRow, StudyView, PlayGlyph, Trainer };

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
    const isTask = block && block.type === 'task';
    const checkable = block && block.type !== 'theory' && !isTask;
    const complete = isTask ? !!(st && ((st.text && st.text.trim()) || (st.files && st.files.length))) : L.isComplete(block, st);
    const arrEl = () => Ic.ArrowRight ? h(Ic.ArrowRight, { size: 16, className: 'arr' }) : null;

    // деривация очков (back/forward-безопасно)
    const rightCount = scored.filter((x) => x === true).length;

    const back = props.onExit || (() => nav('/learn'));
    const finish = props.onDone || back;

    const setSt = (v) => setStates((arr) => { const a = arr.slice(); a[idx] = (typeof v === 'function' ? v(arr[idx]) : v); return a; });
    const setAt = (setter, i, val) => setter((arr) => { const a = arr.slice(); a[i] = val; return a; });

    // блокируем прокрутку фона, пока открыт попап (в contained-режиме превью — не трогаем страницу)
    useEffect(() => {
      if (props.contained) return;
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
          else if (checkable && complete) onCheck();
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
      const scoredCount = blocks.filter((b) => b.type !== 'theory' && b.type !== 'task').length || 1;
      const acc = Math.round((rightCount / scoredCount) * 100);
      return h('div', { className: 'lt-modal' + (props.contained ? ' lt-modal--in' : ''), onMouseDown: backdrop },
        h('div', { className: 'lt-modal__panel', role: 'dialog', 'aria-modal': 'true' },
          closeX(true),
          h('div', { className: 'lt-done' },
            h('div', { className: 'lt-done__cel' },
              h('div', { className: 'lt-conf' }, [
                { c: '#2B8FFF', cx: '-72px', cy: '86px', cr: '220deg', d: '0s' },
                { c: '#F5C84C', cx: '74px', cy: '76px', cr: '-190deg', d: '.05s' },
                { c: '#0E9F6E', cx: '-96px', cy: '26px', cr: '130deg', d: '.1s' },
                { c: '#5CB4FF', cx: '96px', cy: '34px', cr: '-150deg', d: '.08s' },
                { c: '#F5C84C', cx: '-44px', cy: '116px', cr: '210deg', d: '.15s' },
                { c: '#2B8FFF', cx: '52px', cy: '116px', cr: '-210deg', d: '.13s' },
              ].map(function (cp, i) { return h('i', { key: i, style: { background: cp.c, '--cx': cp.cx, '--cy': cp.cy, '--cr': cp.cr, animationDelay: cp.d } }); })),
              h('div', { className: 'lt-done__star' }, Ic.Star ? h(Ic.Star, { size: 52 }) : '★')),
            h('div', { className: 'lt-done__k' }, Ic.Clock ? h(Ic.Clock, { size: 13 }) : null, h('span', null, 'На проверке у преподавателя')),
            h('h2', { className: 'lt-done__h' }, acc >= 80 ? 'Отлично, домашка сдана!' : 'Готово — домашка отправлена!'),
            h('p', { className: 'lt-done__s' }, 'Ответы ушли преподавателю — он проверит и даст обратную связь. Предварительный результат ниже.'),
            h('div', { className: 'lt-stats' },
              h('div', { className: 'lt-stat' }, h('div', { className: 'lt-stat__v' }, acc + '%'), h('div', { className: 'lt-stat__k' }, 'Точность')),
              h('div', { className: 'lt-stat' }, h('div', { className: 'lt-stat__v' }, rightCount + '/' + scoredCount), h('div', { className: 'lt-stat__k' }, 'Верных ответов'))),
            h('div', { className: 'lt-done__cta' },
              h('button', { type: 'button', className: 'le-btn le-btn--primary', onClick: () => finish({ acc: acc }) }, 'Вернуться к уроку', arrEl()),
              h('button', { type: 'button', className: 'le-btn le-btn--ghost', onClick: restart }, 'Пройти ещё раз')))));
    }

    const pct = Math.round(((idx + (revealed ? 1 : 0)) / total) * 100);
    const ansOk = revealed && checkable && L.isCorrect(block, st);
    const ansBad = revealed && checkable && !L.isCorrect(block, st);
    const correctText = (block && block.type === 'choice') ? (((block.options || []).find(function (o) { return o.correct; }) || {}).text || null) : null;

    let footBtn;
    if (revealed) footBtn = h('button', { type: 'button', className: 'le-btn ' + (ansBad ? 'le-btn--primary' : 'le-btn--ok'), onClick: advance }, idx + 1 >= total ? 'Завершить' : 'Дальше', arrEl());
    else if (block.type === 'theory') footBtn = h('button', { type: 'button', className: 'le-btn le-btn--primary', onClick: onTheoryNext }, 'Понятно, дальше', arrEl());
    else if (isTask) footBtn = h('button', { type: 'button', className: 'le-btn le-btn--primary', disabled: !complete, onClick: function () { setAt(setReveals, idx, true); advance(); } }, 'Отправить на проверку', arrEl());
    else footBtn = h('button', { type: 'button', className: 'le-btn le-btn--primary', disabled: !complete, onClick: onCheck }, 'Проверить');

    return h('div', { className: 'lt-modal' + (props.contained ? ' lt-modal--in' : ''), onMouseDown: backdrop },
      h('div', { className: 'lt-modal__panel', role: 'dialog', 'aria-modal': 'true' },
        h('div', { className: 'lt-modal__head' },
          h('div', { className: 'lt-modal__hrow' },
            h('span', { className: 'lt-badge' }, Ic.Edit ? h(Ic.Edit, { size: 13 }) : null, h('span', null, 'Домашка')),
            h('span', { className: 'lt-modal__count' }, (idx + 1), h('span', { className: 'lt-modal__count-d' }, ' / ' + total)),
            closeX(false)),
          h('div', { className: 'lt-prog' }, h('i', { style: { width: Math.round((reveals.filter(Boolean).length / total) * 100) + '%' } }))),
        h('div', { className: 'lt-modal__body' },
          h('div', { className: 'lt-q', key: idx }, h(BlockView, { block, st, revealed, onChange: setSt }))),
        h('div', { className: 'lt-foot' + (ansOk ? ' is-ok' : ansBad ? ' is-bad' : '') },
          (ansOk || ansBad) ? h('div', { className: 'lt-fbbar' },
            h('span', { className: 'lt-fbbar__ic' }, ansOk ? (Ic.Check ? h(Ic.Check, { size: 22, strokeWidth: 2.6 }) : '✓') : (Ic.Close ? h(Ic.Close, { size: 21, strokeWidth: 2.6 }) : '×')),
            h('div', { className: 'lt-fbbar__tx' },
              h('div', { className: 'lt-fbbar__t' }, ansOk ? 'Верно!' : 'Почти!'),
              h('div', { className: 'lt-fbbar__s' }, ansOk ? 'Отличный ответ' : (correctText ? ['Верный ответ: ', h('b', { key: 'b' }, correctText)] : 'Верный вариант выделен зелёным')))) : null,
          h('div', { className: 'lt-modal__foot' },
            h('button', { type: 'button', className: 'le-btn le-btn--ghost lt-back', disabled: idx === 0, onClick: goBack }, Ic.ArrowLeft ? h(Ic.ArrowLeft, { size: 16 }) : '‹', 'Назад'),
            h('span', { className: 'lt-hint' }, (!revealed && checkable) ? 'Выберите ответ' : (!revealed && isTask ? 'Прикрепите работу или напишите ответ' : '')),
            footBtn))));
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
          h('span', { className: 'le-pl__hd-t' }, props.moduleName || C.module || 'Все уроки'),
          h('span', { className: 'le-pl__hd-m' }, doneCount + ' из ' + lessons.length + ' ' + plural(lessons.length, 'урок', 'урока', 'уроков') + ' пройдено'))),
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
      h('button', { type: 'button', className: 'le-pl__all', onClick: () => nav('/learn/lessons') },
        'Показать все уроки'));
  }

  function TeacherCard() {
    const t = (L.COURSE && L.COURSE.teacher) || { name: 'Преподаватель', role: '', initial: 'И' };
    const initial = t.initial || (t.name || 'И').charAt(0);
    return h('div', { className: 'le-card' },
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
        h('span', { className: 'le-crumb__mod', style: { color: 'var(--le-ink-mute)', fontWeight: 500 } }, props.moduleName || (L.COURSE && L.COURSE.module) || 'Модуль'),
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
    const arr = () => h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', className: 'arr' }, h('path', { d: 'M5 12h14M13 6l6 6-6 6' }));
    const back = h('button', { type: 'button', className: 'le-btn le-btn--ghost', disabled: !prevOk, onClick: prevOk ? onPrev : undefined },
      h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round', className: 'bk' }, h('path', { d: 'M19 12H5M11 6l-6 6 6 6' })), 'Назад');
    let next;
    if (nextOk) next = h('button', { type: 'button', className: 'le-btn le-btn--primary', onClick: onNext }, 'Следующий урок', arr());
    else next = h('button', { type: 'button', className: 'le-btn le-btn--primary', disabled: true }, 'Модуль пройден');
    return h('div', { className: 'le-foot' },
      back,
      h('div', { className: 'le-foot__mid' },
        h('span', { className: 'le-foot__step' }, 'Урок ' + item.n + ' из ' + total),
        h('span', { className: 'le-foot__dots' }, lessons.reduce(function (acc, it, i) { if (i) acc.push(h('span', { key: 'l' + it.n, className: 'le-foot__ln' })); acc.push(h('span', { key: 'd' + it.n, className: 'le-foot__dot' + (it.n === item.n ? ' cur' : (it.state === 'done' ? ' done' : '')) })); return acc; }, []))),
      next);
  }

  function LessonPage(props) {
    const { lesson, item, lessons, total, moduleName, onStart, homeworkDone, hwResult, playing, onPlay, onSwitch, onPrev, onNext, prevOk, nextOk } = props;
    const tot = total || lessons.length;
    return h('div', { className: 'le-root' },
      h(LessonHeader, { item, total: tot, moduleName, onPrev, onNext, prevOk, nextOk }),
      h('div', { className: 'le-grid' },
        h('div', { className: 'le-main' },
          h(StudyView, { lesson, item, moduleName, onStart, homeworkDone, hwResult, playing, onPlay })),
        h('aside', { className: 'le-rail' },
          h(Playlist, { lessons, activeN: item.n, moduleName, onSwitch }),
          h(TeacherCard, null))),
      h(LessonFoot, { item, total: tot, lessons, prevOk, onPrev, nextOk, onNext, homeworkDone, onStart }));
  }

  /* ─────────────────────────────────────────────────────────────────────────
     LearnLesson — корневой экран внутри сайдбара ученика. study ⇄ homework,
     переключение между уроками модуля.
  ───────────────────────────────────────────────────────────────────────── */
  const DEMO_LESSON = {
    id: 'demo-numbers', title: 'Числа от 1 до 10',
    subtitle: 'Изучаем числа от 1 до 10 на китайском языке — счет, тоны и написание иероглифов.', level: 'HSK 1',
    video: { file: 'assets/lesson-sample.mp4', title: 'Видеоурок: числа 1–10', duration: '08:40', poster: 'funnel-assets/universities/fudan.jpg', hanzi: '一二三' },
    materials: [{ title: 'Рабочая тетрадь · числа 1–10', url: '#', filename: 'numbers.pdf' }],
    doc: [
      { kind: 'heading', text: 'Счет от одного до десяти' },
      { kind: 'para', text: 'Китайские числа складываются логично: выучив первые десять, вы легко построите любое число до ста. Начнем с самих иероглифов и их звучания.' },
      { kind: 'word', hanzi: '一', pinyin: 'yī', ru: 'один' }, { kind: 'word', hanzi: '二', pinyin: 'èr', ru: 'два' },
      { kind: 'word', hanzi: '三', pinyin: 'sān', ru: 'три' }, { kind: 'word', hanzi: '四', pinyin: 'sì', ru: 'четыре' },
      { kind: 'word', hanzi: '五', pinyin: 'wǔ', ru: 'пять' },
      { kind: 'important', text: 'Тон меняет смысл: одно и то же сочетание звуков в разных тонах — разные слова. Слушайте аудио и повторяйте вслух.' },
      { kind: 'word', hanzi: '六', pinyin: 'liù', ru: 'шесть' }, { kind: 'word', hanzi: '七', pinyin: 'qī', ru: 'семь' },
      { kind: 'word', hanzi: '八', pinyin: 'bā', ru: 'восемь' }, { kind: 'word', hanzi: '九', pinyin: 'jiǔ', ru: 'девять' },
      { kind: 'word', hanzi: '十', pinyin: 'shí', ru: 'десять' },
      { kind: 'divider' },
      { kind: 'heading', text: 'Как считать людей и предметы' },
      { kind: 'para', text: 'Между числом и существительным ставится счетное слово. Универсальное счетное слово — 个 (gè).' },
      { kind: 'example', hanzi: '三个学生', pinyin: 'sān gè xuésheng', ru: 'три студента' },
      { kind: 'hint', text: 'Для «два» перед счетным словом используйте 两 (liǎng), а не 二: 两个人 — два человека.' },
      { kind: 'numbered', items: ['Назовите число', 'Добавьте счетное слово 个', 'Назовите предмет или человека'] },
      { kind: 'quote', text: 'Считать по-китайски проще, чем кажется: десять иероглифов открывают путь к тысячам.' },
      { kind: 'heading', text: 'Проверьте себя' },
      { kind: 'spoiler', title: 'Как сказать «пять человек»?', text: '五个人 (wǔ gè rén): число 五 + счетное слово 个 + 人 «человек».' },
      { kind: 'bullets', items: ['一 = 1, 十 = 10', 'Перед счетным словом «два» — 两, а не 二', 'Счетное слово 个 — универсальное'] },
    ],
    blocks: [
      { type: 'choice', prompt: 'Как будет «пять»?', options: [{ text: '四' }, { text: '五', correct: true }, { text: '六' }], explain: '五 (wǔ) — пять.' },
      { type: 'match', prompt: 'Соедините иероглиф и перевод', pairs: [{ left: '三', right: 'три' }, { left: '七', right: 'семь' }, { left: '十', right: 'десять' }] },
      { type: 'gap', prompt: 'Вставьте пропущенное', before: '', after: '个人', options: [{ text: '两', correct: true }, { text: '二' }], explain: 'Перед счетным словом «два» — 两.' },
    ],
    objectives: ['Считать от 1 до 10 на слух', 'Писать иероглифы чисел', 'Слышать тоны в счете'], glossary: [], notes: '',
  };

  var DEMO_TASK = Object.assign({}, DEMO_LESSON, {
    blocks: [{
      type: 'task',
      prompt: 'Напишите письмо другу по-китайски',
      body: 'Открытое задание — его проверит преподаватель.',
      brief: 'Составьте короткое письмо (5–7 предложений): поздоровайтесь, расскажите, сколько вам лет и что вы изучаете. Используйте новые слова урока. Прикрепите файлом (PDF/DOCX) или фото рукописного текста.',
      accept: 'PDF, DOCX, JPG, PNG · до 10 МБ',
    }],
  });

  var DEMO_TASK2 = Object.assign({}, DEMO_LESSON, {
    blocks: [{
      type: 'task',
      prompt: 'Итоговое задание по теме «Числа»',
      body: 'Большое открытое задание — преподаватель проверит каждую часть.',
      brief: 'Соберите работу по числам 1–10 и пришлите одним или несколькими файлами. Можно приложить документ, фото рукописного текста и аудио — сколько нужно.',
      checklist: [
        'Напишите числа 1–10 иероглифами от руки и сфотографируйте.',
        'Составьте 5 предложений со счётным словом (например, 三个人 — три человека).',
        'Запишите короткое аудио, как вы считаете вслух от 1 до 10.',
      ],
      accept: 'PDF, DOCX, JPG, PNG, MP3 · до 20 МБ · можно несколько файлов',
    }],
  });

  function LearnLesson(props) {
    if (!L) return h('div', { style: { padding: 40 } }, 'Учебный модуль не загружен');
    const Store = window.ELessonStore;
    const routeId = (props && props.params && props.params.id) || null;
    const isDemo = /[?&]demo\b/.test(window.location.hash || '');
    const isTask2 = /demo=task2/.test(window.location.hash || '');
    const isTaskDemo = /demo=task\b/.test(window.location.hash || '');
    const demoLive = isTask2 ? DEMO_TASK2 : (isTaskDemo ? DEMO_TASK : (isDemo ? DEMO_LESSON : null));

    // Библиотека уроков из стора → плейлист. Демо-шорткаты (?demo) изолированы:
    // показываем только сам демо-урок, чтобы не путать с реальной лентой.
    const lib = (!demoLive && Store) ? Store.listSync() : [];
    const firstId = lib[0] && lib[0].id;
    const activeId = demoLive ? null : (routeId || (Store && Store.currentId()) || firstId || null);

    // Живой урок: демо, иначе конкретный по id из URL, иначе fallback на черновик.
    const live = demoLive || (Store ? (Store.getSync(activeId) || L.load()) : L.load());

    // Позиционный прогресс: до активного — пройдено, активный — сейчас, дальше — открыт.
    const activeIdx = lib.findIndex((s) => s.id === activeId);
    const lessons = lib.map((s, i) => ({
      n: i + 1, id: s.id,
      title: s.title || ('Урок ' + (i + 1)),
      duration: s.duration || '',
      words: (s.counts && s.counts.words) || 0,
      thumb: s.thumb || '',
      state: s.id === activeId ? 'current' : (activeIdx >= 0 && i < activeIdx ? 'done' : 'available'),
      live: s.id === activeId,
    }));
    // currentItem — активный из ленты; если урока нет в ленте (демо/битый id/пустая
    // библиотека) — синтезируем одиночный элемент из самого урока.
    let currentItem = lessons.find((it) => it.id === activeId);
    let workLessons = lessons;
    if (!currentItem) {
      const v = live.video || {};
      currentItem = { n: 1, id: activeId || (live && live.id) || 'live', title: live.title || 'Урок', duration: v.duration || '', words: (live.glossary || []).length, thumb: v.poster || '', state: 'current', live: true };
      workLessons = [currentItem];
    }
    const moduleName = 'Все уроки';

    const [mode, setMode] = useState('study');
    const [hwDone, setHwDone] = useState(false);
    const [hwResult, setHwResult] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [run, setRun] = useState(0);

    // Смена урока (навигация по id / prev-next / клик в плейлисте) сбрасывает
    // режим изучения/домашку и скроллит наверх.
    useEffect(() => {
      setMode('study'); setHwDone(false); setHwResult(null); setPlaying(false);
      const mn = document.querySelector('.sd-main'); if (mn) mn.scrollTop = 0;
    }, [activeId]);

    const item = currentItem;
    const activeLesson = live;
    const total = workLessons.length;

    const pos = workLessons.findIndex((it) => it.id === item.id);
    const prevItem = pos > 0 ? workLessons[pos - 1] : null;
    const nextItem = pos >= 0 && pos < workLessons.length - 1 ? workLessons[pos + 1] : null;

    // Переключение урока — реальная навигация по id (адресуемо, URL меняется).
    const switchTo = (it) => { if (it && it.id) nav('/learn/lesson/' + it.id); };

    // Страница урока — всегда; тест — попап-модалка поверх неё.
    const page = h(LessonPage, {
      lesson: activeLesson, item, lessons: workLessons, total, moduleName,
      onStart: () => { setRun((r) => r + 1); setMode('homework'); },
      homeworkDone: hwDone, hwResult, playing, onPlay: setPlaying, onSwitch: switchTo,
      onPrev: prevItem ? () => switchTo(prevItem) : undefined, onNext: nextItem ? () => switchTo(nextItem) : undefined,
      prevOk: !!prevItem, nextOk: !!nextItem,
    });
    const modal = mode === 'homework' ? h(Trainer, {
      key: 'hw-' + run + '-' + item.id, lesson: activeLesson,
      onExit: () => setMode('study'),
      onDone: (res) => { setHwDone(true); setHwResult(res || null); setMode('study'); },
    }) : null;
    const content = h('div', null, page, modal);

    if (SH && SH.Shell) return h(SH.Shell, { active: 'learn', surface: 'light', hideTopBar: true }, content);
    return h('div', { style: { padding: 24, minHeight: '100vh', background: '#F6F7FE' } }, content);
  }

  (window.EScreens = window.EScreens || {}).LearnLesson = LearnLesson;
})();
