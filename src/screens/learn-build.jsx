/* ============================================================================
   EastSide — Конструктор урока (window.EScreens.LearnBuilder · #/learn/build)
   ----------------------------------------------------------------------------
   Рабочее место преподавателя (Режим B), пересобранное под скорость и ясность.
   Три зоны: СЛЕВА урок (цель, авто-метрики, структура с валидацией и быстрыми
   действиями), В ЦЕНТРЕ фокус-редактор активного блока, СПРАВА живой превью в
   рамке-устройстве «как видит ученик» (тот же window.ELessonUI.BlockView, что и
   тренажёр). Автосохранение в localStorage на каждое изменение. «Пройти как
   ученик» открывает собранный урок в реальном тренажёре (#/learn/lesson).

   7 форматов блока: теория, один ответ, пропуск, пары, предложение, ввод, тон.
   Быстрый старт — шаблоны урока. Анти-дефолт: не серый CMS-кром, а стекло на
   светлой авроре, сапфир-акцент, поля с сапфировым фокусом, превью — настоящая
   поверхность ученика в рамке устройства.
   ============================================================================ */
(function () {
  'use strict';
  const R = window.React || React;
  const { createElement: h, useState, useEffect, useRef } = R;
  const Ic = window.EIcons || {};
  const L = window.ELessons;
  const UI = window.ELessonUI;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  const CSS = `
  .lb-app{position:fixed;inset:0;display:flex;flex-direction:column;overflow:hidden;
    --lb-acc:#2073E6; --lb-acc-2:#5CB4FF; --lb-acc-deep:#1E63C2; --lb-acc-ink:#1763C8;
    --lb-acc-soft:rgba(43,143,255,.1); --lb-acc-line:rgba(43,143,255,.4);
    --lb-ink:#15203B; --lb-ink-sub:rgba(21,32,59,.6); --lb-ink-mute:rgba(21,32,59,.42);
    --lb-line:rgba(22,32,59,.08); --lb-jade:#1C7E52; --lb-warn:#A8741C; --lb-rose:#B23B2A;
    font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;color:var(--lb-ink);
    background:
      radial-gradient(720px 480px at 94% -8%, rgba(118,150,255,.14) 0%, transparent 64%),
      radial-gradient(560px 460px at -2% 0%, rgba(120,170,255,.1) 0%, transparent 62%),
      linear-gradient(180deg,#F4F6FD 0%,#FAFBFF 60%,#F4F6FD 100%);}
  .lb-app *{box-sizing:border-box;}
  .lb-num{font-variant-numeric:tabular-nums;}

  /* ── верхняя панель ─────────────────────────────────────────────────────── */
  .lb-top{flex:0 0 auto;display:flex;align-items:center;gap:16px;padding:14px 22px;border-bottom:1px solid var(--lb-line);
    background:rgba(247,248,254,.92);}
  .lb-back{flex:0 0 auto;width:40px;height:40px;border-radius:12px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-sub);
    background:rgba(255,255,255,.7);border:1.5px solid rgba(255,255,255,.9);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:transform .15s,color .15s;}
  .lb-back:hover{transform:translateY(-1px);color:var(--lb-ink);}
  .lb-brand__kick{font-size:11px;font-weight:600;color:var(--lb-acc-deep);}
  .lb-brand__role{font-size:12.5px;font-weight:600;color:var(--lb-ink-mute);margin-top:1px;}
  .lb-top__sp{flex:1 1 auto;}
  .lb-saved{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--lb-jade);}
  .lb-saved__dot{width:7px;height:7px;border-radius:50%;background:#2EC07E;box-shadow:0 0 8px rgba(46,192,126,.7);}
  .lb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;border:0;white-space:nowrap;font-family:inherit;
    font-size:14px;font-weight:700;padding:11px 18px;border-radius:12px;transition:transform .14s,background .14s,box-shadow .14s;}
  .lb-btn svg{transition:transform .15s;}
  .lb-btn--primary{background:var(--lb-acc-deep);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 10px 22px -12px rgba(32,115,230,.5);}
  .lb-btn--primary:hover{background:#2B8FFF;transform:translateY(-1px);}
  .lb-btn--primary .arr{transform:rotate(-45deg);} .lb-btn--primary:hover .arr{transform:rotate(-45deg) translateX(2px);}
  .lb-btn--ghost{background:rgba(255,255,255,.65);color:var(--lb-ink);border:1.5px solid rgba(255,255,255,.95);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);}
  .lb-btn--ghost:hover{background:#fff;transform:translateY(-1px);}

  /* ── тело: 3 колонки ────────────────────────────────────────────────────── */
  .lb-body{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:320px minmax(0,1fr) 468px;}
  .lb-pane{height:100%;overflow-y:auto;padding:22px 22px 40px;}
  .lb-pane::-webkit-scrollbar{width:8px;} .lb-pane::-webkit-scrollbar-thumb{background:rgba(22,32,59,.13);border-radius:99px;}
  .lb-pane--rail{border-right:1px solid var(--lb-line);}
  .lb-pane--prev{border-left:1px solid var(--lb-line);background:linear-gradient(180deg,rgba(236,240,251,.5),rgba(244,247,255,.3));
    display:flex;flex-direction:column;align-items:center;}
  .lb-sech{font-size:12.5px;font-weight:600;color:var(--lb-ink);margin:4px 2px 12px;display:flex;align-items:center;justify-content:space-between;}

  /* шапка урока слева: название + цель + метрики */
  .lb-lesson{margin-bottom:22px;}
  .lb-titlein{width:100%;font-family:inherit;font-size:21px;font-weight:600;letter-spacing:-.5px;color:var(--lb-ink);
    padding:6px 2px;border:0;border-bottom:1.5px solid transparent;background:0;transition:border-color .15s;}
  .lb-titlein:focus{outline:0;border-bottom-color:var(--lb-acc-line);}
  .lb-goal{display:flex;align-items:center;gap:8px;margin-top:10px;padding:9px 12px;border-radius:11px;background:rgba(255,255,255,.6);border:1px solid var(--lb-line);}
  .lb-goal svg{flex:0 0 auto;color:var(--lb-acc-deep);}
  .lb-goal input{flex:1 1 auto;min-width:0;font-family:inherit;font-size:12.5px;font-weight:500;color:var(--lb-ink);border:0;background:0;}
  .lb-goal input:focus{outline:0;}
  .lb-goal input::placeholder{color:var(--lb-ink-mute);}
  .lb-meta{display:flex;gap:8px;margin-top:12px;}
  .lb-mc{flex:1 1 0;text-align:center;padding:10px 6px;border-radius:12px;background:rgba(255,255,255,.6);border:1px solid var(--lb-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
  .lb-mc__v{font-size:18px;font-weight:700;letter-spacing:-.5px;color:var(--lb-ink);line-height:1;font-variant-numeric:tabular-nums;}
  .lb-mc__v.acc{color:var(--lb-acc-deep);}
  .lb-mc__k{font-size:10.5px;font-weight:600;color:var(--lb-ink-mute);margin-top:5px;}
  .lb-lvlrow{display:flex;align-items:center;gap:8px;margin-top:12px;}
  .lb-lvl{flex:1 1 auto;font-family:inherit;font-size:13px;font-weight:700;color:var(--lb-acc-ink);padding:9px 12px;border-radius:11px;cursor:pointer;
    background:var(--lb-acc-soft);border:1.5px solid var(--lb-acc-line);}
  .lb-tplbtn{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--lb-ink-sub);
    padding:9px 12px;border-radius:11px;background:rgba(255,255,255,.6);border:1.5px solid var(--lb-line);transition:border-color .15s,color .15s;}
  .lb-tplbtn:hover{border-color:var(--lb-acc-line);color:var(--lb-acc-deep);}

  /* структура */
  .lb-list{display:flex;flex-direction:column;gap:7px;}
  .lb-item{position:relative;display:flex;align-items:center;gap:11px;cursor:pointer;padding:11px 12px;border-radius:13px;
    background:rgba(255,255,255,.55);border:1.5px solid var(--lb-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);
    transition:border-color .15s,background .15s,transform .15s;}
  .lb-item:hover{border-color:var(--lb-acc-line);transform:translateX(2px);}
  .lb-item.is-sel{border-color:var(--lb-acc-line);background:rgba(238,244,255,.72);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 24px rgba(43,143,255,.09);}
  .lb-item__n{flex:0 0 22px;width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-size:11px;font-weight:700;font-variant-numeric:tabular-nums;
    color:var(--lb-ink-mute);background:rgba(22,32,59,.05);}
  .lb-item.is-sel .lb-item__n{color:#fff;background:var(--lb-acc-deep);}
  .lb-item__ic{flex:0 0 auto;color:var(--lb-acc-deep);display:inline-flex;opacity:.9;}
  .lb-item__b{flex:1 1 auto;min-width:0;}
  .lb-item__t{font-size:13px;font-weight:700;color:var(--lb-ink);letter-spacing:-.2px;display:flex;align-items:center;gap:7px;}
  .lb-item__s{font-size:11.5px;color:var(--lb-ink-mute);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lb-dot{flex:0 0 auto;width:7px;height:7px;border-radius:50%;background:var(--lb-warn);box-shadow:0 0 0 3px rgba(168,116,28,.12);}
  .lb-item__act{position:absolute;right:9px;top:50%;transform:translateY(-50%);display:flex;gap:3px;opacity:0;transition:opacity .15s;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.95) 22%);padding-left:18px;}
  .lb-item:hover .lb-item__act,.lb-item.is-sel .lb-item__act{opacity:1;}
  .lb-ib{width:25px;height:25px;border-radius:7px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-mute);background:rgba(22,32,59,.05);border:0;transition:color .15s,background .15s;}
  .lb-ib:hover{color:var(--lb-acc-deep);background:var(--lb-acc-soft);}
  .lb-ib.del:hover{color:var(--lb-rose);background:rgba(210,96,79,.1);}
  .lb-ib:disabled{opacity:.3;cursor:default;}
  .lb-add{margin-top:12px;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:700;
    color:var(--lb-acc-deep);padding:13px;border-radius:13px;background:var(--lb-acc-soft);border:1.5px dashed var(--lb-acc-line);transition:background .15s;}
  .lb-add:hover{background:rgba(43,143,255,.16);}

  /* пустой урок */
  .lb-empty{margin-top:18px;padding:26px 22px;border-radius:16px;text-align:center;background:rgba(255,255,255,.55);border:1px dashed var(--lb-line);}
  .lb-empty__t{font-size:14px;font-weight:700;color:var(--lb-ink);}
  .lb-empty__s{font-size:12.5px;color:var(--lb-ink-mute);margin-top:6px;line-height:1.5;}

  /* ── центр: фокус-редактор ──────────────────────────────────────────────── */
  .lb-edit{max-width:680px;}
  .lb-edit__kick{font-size:12.5px;font-weight:600;color:var(--lb-acc-deep);display:flex;align-items:center;gap:8px;}
  .lb-edit__title{font-size:23px;font-weight:600;letter-spacing:-.5px;color:var(--lb-ink);margin:8px 0 28px;}
  .lb-field{margin-bottom:22px;}
  .lb-label{display:flex;align-items:center;justify-content:space-between;font-size:12.5px;font-weight:700;color:var(--lb-ink-sub);margin-bottom:9px;letter-spacing:-.1px;}
  .lb-label__hint{font-size:11.5px;font-weight:500;color:var(--lb-ink-mute);}
  .lb-in,.lb-ta{width:100%;font-family:inherit;font-size:15px;font-weight:500;color:var(--lb-ink);padding:12px 15px;border-radius:12px;
    background:rgba(255,255,255,.75);border:1.5px solid var(--lb-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);transition:border-color .15s,box-shadow .15s;}
  .lb-in::placeholder,.lb-ta::placeholder{color:var(--lb-ink-mute);}
  .lb-in:focus,.lb-ta:focus{outline:0;border-color:var(--lb-acc-line);box-shadow:inset 0 0 0 1px var(--lb-acc-line),0 0 0 4px rgba(43,143,255,.09);}
  .lb-ta{resize:vertical;min-height:88px;line-height:1.55;}
  .lb-in--hz{font-size:20px;font-weight:600;}

  .lb-rows{display:flex;flex-direction:column;gap:10px;}
  .lb-row{display:flex;align-items:center;gap:10px;}
  .lb-row .lb-in{flex:1 1 auto;}
  .lb-rn{flex:0 0 22px;width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-size:11px;font-weight:700;color:var(--lb-ink-mute);background:rgba(22,32,59,.05);font-variant-numeric:tabular-nums;}
  .lb-correct{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-size:12.5px;font-weight:700;color:var(--lb-ink-mute);
    padding:9px 12px;border-radius:11px;background:rgba(255,255,255,.6);border:1.5px solid var(--lb-line);white-space:nowrap;transition:all .15s;}
  .lb-correct.on{color:#1C7E52;background:#E2F4EA;border-color:rgba(46,160,110,.5);}
  .lb-correct__tick{width:18px;height:18px;border-radius:6px;display:grid;place-items:center;color:#fff;background:rgba(22,32,59,.16);}
  .lb-correct.on .lb-correct__tick{background:var(--lb-jade);}
  .lb-rowdel{flex:0 0 auto;width:34px;height:34px;border-radius:9px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-mute);background:rgba(22,32,59,.05);border:0;transition:color .15s,background .15s;}
  .lb-rowdel:hover{color:var(--lb-rose);background:rgba(210,96,79,.1);}
  .lb-rowdel:disabled{opacity:.3;cursor:default;}
  .lb-pair{display:grid;grid-template-columns:22px 1fr 16px 1fr 34px;gap:10px;align-items:center;}
  .lb-pair__link{display:grid;place-items:center;color:var(--lb-ink-mute);}
  .lb-addrow{margin-top:11px;display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:700;color:var(--lb-acc-deep);
    padding:9px 14px;border-radius:11px;background:var(--lb-acc-soft);border:0;transition:background .15s;}
  .lb-addrow:hover{background:rgba(43,143,255,.16);}
  .lb-tones{display:flex;gap:9px;}
  .lb-tone{flex:1 1 0;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:12px 6px;border-radius:12px;font-family:inherit;
    background:rgba(255,255,255,.6);border:1.5px solid var(--lb-line);transition:border-color .15s,background .15s;}
  .lb-tone:hover{border-color:var(--lb-acc-line);}
  .lb-tone.on{border-color:var(--lb-acc-line);background:rgba(238,244,255,.72);}
  .lb-tone__m{font-size:26px;font-weight:600;color:var(--lb-acc-deep);line-height:1;}
  .lb-tone__n{font-size:10.5px;font-weight:600;color:var(--lb-ink-mute);}
  .lb-tone.on .lb-tone__n{color:var(--lb-acc-deep);}

  /* ── видео: загрузка-дропзона + «или ссылка» ─────────────────────────────── */
  .lb-drop{width:100%;display:flex;align-items:center;gap:14px;text-align:left;cursor:pointer;font-family:inherit;
    padding:16px 18px;border-radius:14px;background:rgba(255,255,255,.6);border:1.5px dashed var(--lb-acc-line);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.7);transition:border-color .15s,background .15s;}
  .lb-drop:hover{background:rgba(43,143,255,.05);border-color:var(--lb-acc-deep);}
  .lb-drop.is-loaded{cursor:default;border-style:solid;border-color:rgba(46,160,110,.5);background:rgba(226,244,234,.5);}
  .lb-drop__ic{flex:0 0 44px;width:44px;height:44px;border-radius:12px;display:grid;place-items:center;color:#fff;
    background:var(--lb-acc-deep);box-shadow:inset 0 0 12px rgba(175,215,255,.5);}
  .lb-drop.is-loaded .lb-drop__ic{background:var(--lb-jade);}
  .lb-drop__b{flex:1 1 auto;min-width:0;}
  .lb-drop__t{font-size:14.5px;font-weight:600;color:var(--lb-ink);}
  .lb-drop__s{font-size:12px;color:var(--lb-ink-mute);margin-top:3px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lb-drop__x{flex:0 0 auto;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-mute);background:rgba(22,32,59,.05);border:0;transition:color .15s,background .15s;}
  .lb-drop__x:hover{color:var(--lb-rose);background:rgba(210,96,79,.1);}
  .lb-or{display:flex;align-items:center;gap:12px;margin:15px 0;color:var(--lb-ink-mute);font-size:11.5px;font-weight:600;}
  .lb-or::before,.lb-or::after{content:'';flex:1 1 auto;height:1px;background:var(--lb-line);}

  /* ── правый превью в рамке устройства ───────────────────────────────────── */
  .lb-phone{width:100%;max-width:404px;margin-top:6px;border-radius:34px;padding:12px;background:linear-gradient(160deg,#0A1126,#0C1A3C);
    box-shadow:0 30px 70px rgba(8,16,44,.4),inset 0 1px 0 rgba(255,255,255,.14);}
  .lb-phone__screen{position:relative;border-radius:24px;overflow:hidden;background:
      radial-gradient(420px 300px at 90% -10%, rgba(118,150,255,.16), transparent 64%),
      linear-gradient(180deg,#FBFBFF,#F4F6FD);min-height:540px;display:flex;flex-direction:column;}
  .lb-phone__notch{position:absolute;left:50%;top:9px;transform:translateX(-50%);width:96px;height:6px;border-radius:99px;background:rgba(22,32,59,.16);z-index:3;}
  .lb-phone__hud{flex:0 0 auto;display:flex;align-items:center;gap:9px;padding:22px 16px 12px;}
  .lb-phud__track{flex:1 1 auto;height:8px;border-radius:99px;background:rgba(22,32,59,.08);overflow:hidden;}
  .lb-phud__fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#5CB4FF,#1E63C2);box-shadow:0 0 8px rgba(43,143,255,.5);}
  .lb-phud__xp{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:var(--lb-acc-deep);font-variant-numeric:tabular-nums;}
  .lb-phud__xp svg{color:var(--lb-acc);}
  .lb-phone__body{flex:1 1 auto;overflow-y:auto;padding:8px 18px 14px;}
  .lb-phone__body::-webkit-scrollbar{width:0;}
  .lb-phone__foot{flex:0 0 auto;padding:12px 18px 18px;}
  .lb-pvbtn{width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;padding:13px;border-radius:13px;border:0;transition:transform .14s,background .14s;}
  .lb-pvbtn--ck{background:var(--lb-acc-deep);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 10px 20px -12px rgba(32,115,230,.5);}
  .lb-pvbtn--ck:hover{background:#2B8FFF;transform:translateY(-1px);} .lb-pvbtn--ck:disabled{background:#C3CCDE;cursor:not-allowed;}
  .lb-pvbtn--rs{background:rgba(255,255,255,.8);color:var(--lb-ink-sub);border:1.5px solid var(--lb-line);}
  .lb-pvbtn--rs:hover{background:#fff;}
  .lb-prev__note{font-size:12px;color:var(--lb-ink-mute);margin-top:14px;text-align:center;line-height:1.5;max-width:320px;}
  /* в узкой рамке многоколоночные блоки — в одну колонку */
  .lb-phone .lx-voc,.lb-phone .lx-match,.lb-phone .lx-tone__opts{grid-template-columns:1fr;}
  .lb-phone .lx-prompt,.lb-phone .lx-theory__t{font-size:21px;}
  .lb-phone .lx-tone__hz{font-size:56px;}
  .lb-phone .lx-opt__t,.lb-phone .lx-mi__t,.lb-phone .lx-tok{font-size:17px;}
  .lb-phone .lx-mcol--l .lx-mi__t{font-size:19px;}

  /* ── модалки (палитра / шаблоны) ────────────────────────────────────────── */
  .lb-ov{position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;padding:24px;
    background:rgba(8,14,36,.52);animation:lb-ov .18s ease;}
  @keyframes lb-ov{from{opacity:0;}to{opacity:1;}}
  .lb-modal{width:100%;max-width:560px;max-height:84vh;overflow-y:auto;border-radius:24px;padding:28px 30px 30px;
    background:rgba(250,251,255,.97);border:1px solid rgba(255,255,255,.9);
    box-shadow:0 40px 90px rgba(8,16,44,.4),inset 0 1px 0 rgba(255,255,255,.95);animation:lb-pop .22s cubic-bezier(.23,1,.32,1);}
  @keyframes lb-pop{from{opacity:0;transform:translateY(12px) scale(.98);}to{opacity:1;transform:none;}}
  .lb-modal__h{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:20px;}
  .lb-modal__t{font-size:21px;font-weight:600;letter-spacing:-.5px;color:var(--lb-ink);}
  .lb-modal__s{font-size:13px;color:var(--lb-ink-sub);margin-top:4px;}
  .lb-x{flex:0 0 auto;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-mute);background:rgba(22,32,59,.05);border:0;transition:color .15s,background .15s;}
  .lb-x:hover{color:var(--lb-ink);background:rgba(22,32,59,.1);}
  .lb-gal{display:grid;grid-template-columns:1fr 1fr;gap:11px;}
  .lb-galc{display:flex;align-items:flex-start;gap:13px;cursor:pointer;text-align:left;padding:15px 16px;border-radius:15px;font-family:inherit;
    background:rgba(255,255,255,.7);border:1.5px solid var(--lb-line);transition:border-color .15s,transform .15s,box-shadow .15s;}
  .lb-galc:hover{border-color:var(--lb-acc-line);transform:translateY(-2px);box-shadow:0 12px 28px -14px rgba(20,40,90,.2);}
  .lb-galc__ic{flex:0 0 38px;width:38px;height:38px;border-radius:11px;display:grid;place-items:center;color:#fff;
    background:var(--lb-acc-deep);box-shadow:inset 0 0 12px rgba(175,215,255,.5);}
  .lb-galc__t{font-size:14.5px;font-weight:700;color:var(--lb-ink);}
  .lb-galc__s{font-size:12px;color:var(--lb-ink-mute);margin-top:3px;line-height:1.4;}
  .lb-tplnote{margin-top:16px;font-size:12px;color:var(--lb-warn);display:flex;align-items:center;gap:7px;}

  /* фикс-пункты структуры: видео и конспект (основа урока) */
  .lb-item--fix .lb-item__ic{opacity:1;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:var(--lb-acc-soft);}
  .lb-item--fix.is-sel .lb-item__ic{color:#fff;background:var(--lb-acc-deep);}
  .lb-vchk{display:flex;align-items:center;gap:8px;margin-top:-10px;margin-bottom:22px;font-size:12.5px;font-weight:600;}
  .lb-vchk.ok{color:var(--lb-jade);} .lb-vchk.bad{color:var(--lb-rose);}
  .lb-vchk svg{flex:0 0 auto;}
  .lb-vhint{margin-top:-10px;margin-bottom:22px;font-size:12.5px;color:var(--lb-ink-mute);line-height:1.5;}
  .lb-ta--lg{min-height:236px;}
  .lb-notetip{margin-top:6px;font-size:12.5px;color:var(--lb-ink-sub);line-height:1.55;display:flex;gap:9px;align-items:flex-start;
    padding:13px 15px;border-radius:12px;background:rgba(255,255,255,.55);border:1px solid var(--lb-line);}
  .lb-notetip svg{flex:0 0 auto;color:var(--lb-acc-deep);margin-top:1px;}
  .lb-phone__body--study{padding:24px 16px 20px;}
  .lb-phone__body--study::-webkit-scrollbar{width:0;}

  /* ── редактор основы: видео / конспект (богатый, ведущий центр) ─────────── */
  .lb-vstate{display:flex;align-items:center;gap:14px;margin-bottom:22px;padding:16px 18px;border-radius:15px;border:1px solid var(--lb-line);
    background:rgba(255,255,255,.6);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
  .lb-vstate__ic{flex:0 0 42px;width:42px;height:42px;border-radius:13px;display:grid;place-items:center;color:#fff;
    background:var(--lb-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.25);}
  .lb-vstate__t{font-size:15px;font-weight:700;letter-spacing:-.3px;color:var(--lb-ink);}
  .lb-vstate__s{font-size:12.5px;color:var(--lb-ink-mute);margin-top:3px;line-height:1.45;}
  .lb-vstate.ok{background:rgba(225,244,233,.6);border-color:rgba(46,160,110,.42);}
  .lb-vstate.ok .lb-vstate__ic{background:var(--lb-jade);box-shadow:inset 0 1px 0 rgba(255,255,255,.25);}
  .lb-vstate.bad{background:rgba(251,231,226,.5);border-color:rgba(210,96,79,.42);}
  .lb-vstate.bad .lb-vstate__ic{background:var(--lb-rose);box-shadow:none;}
  .lb-platforms{display:flex;flex-wrap:wrap;align-items:center;gap:7px;margin:-12px 0 22px;}
  .lb-platforms__l{font-size:11.5px;font-weight:600;color:var(--lb-ink-mute);margin-right:3px;}
  .lb-plat{display:inline-flex;align-items:center;height:26px;padding:0 11px;border-radius:8px;font-size:11.5px;font-weight:600;color:var(--lb-ink-sub);
    background:rgba(255,255,255,.62);border:1px solid var(--lb-line);}
  .lb-grid2{display:grid;grid-template-columns:1fr 168px;gap:16px;}
  .lb-grid2 .lb-field{margin-bottom:22px;}
  .lb-tip{display:flex;gap:11px;align-items:flex-start;padding:15px 17px;border-radius:13px;background:rgba(255,255,255,.55);border:1px solid var(--lb-line);
    font-size:12.5px;line-height:1.56;color:var(--lb-ink-sub);}
  .lb-tip svg{flex:0 0 auto;color:var(--lb-acc-deep);margin-top:1px;}
  .lb-tip b{color:var(--lb-ink);font-weight:700;}
  .lb-outline{margin:-6px 0 22px;padding:16px 18px;border-radius:14px;background:rgba(255,255,255,.5);border:1px solid var(--lb-line);}
  .lb-outline__h{font-size:12.5px;font-weight:600;color:var(--lb-ink);margin-bottom:11px;}
  .lb-outline__r{display:flex;align-items:center;gap:12px;padding:8px 0;border-top:1px solid var(--lb-line);}
  .lb-outline__r:first-of-type{border-top:0;}
  .lb-outline__n{flex:0 0 21px;width:21px;height:21px;border-radius:6px;display:grid;place-items:center;font-size:10.5px;font-weight:700;color:var(--lb-acc-deep);
    background:var(--lb-acc-soft);font-variant-numeric:tabular-nums;}
  .lb-outline__t{flex:1 1 auto;min-width:0;font-size:13px;font-weight:600;color:var(--lb-ink);letter-spacing:-.1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lb-outline__e{font-size:12.5px;color:var(--lb-ink-mute);line-height:1.5;}

  @media (max-width:1240px){ .lb-body{grid-template-columns:300px minmax(0,1fr);} .lb-pane--prev{display:none;} }
  @media (max-width:900px){ .lb-body{grid-template-columns:1fr;} .lb-pane--rail{display:none;} }
  @media (prefers-reduced-motion: reduce){ .lb-item,.lb-galc,.lb-modal,.lb-ov{transition:none;animation:none;} }`;

  if (!document.getElementById('learn-build-styles')) {
    const el = document.createElement('style');
    el.id = 'learn-build-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  const LEVELS = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'Разговорный'];
  const summary = (b) => {
    if (b.type === 'theory') return b.title || 'Теория';
    if (b.type === 'tone') return (b.hanzi || '?') + ' · тон ' + (b.tone || 1);
    if (b.type === 'order') return (b.tokens || []).join(' ') || 'Предложение';
    if (b.type === 'type') return b.prompt || 'Ввод ответа';
    return b.prompt || 'Вопрос';
  };
  const icon = (name) => Ic[name] || Ic.Book;

  /* ── живой превью в рамке устройства ──────────────────────────────────────── */
  function Preview(props) {
    const { block, pos, total } = props;
    const [st, setSt] = useState(() => L.initState(block));
    const [revealed, setRevealed] = useState(false);
    const checkable = block && block.type !== 'theory';
    const complete = L.isComplete(block, st);
    const reset = () => { setSt(L.initState(block)); setRevealed(false); };
    const pct = total ? Math.round(((pos + 0.5) / total) * 100) : 30;
    const xp = block.type === 'theory' ? 5 : 10;

    return h(R.Fragment, null,
      h('div', { className: 'lb-phone' },
        h('div', { className: 'lb-phone__screen' },
          h('div', { className: 'lb-phone__notch' }),
          h('div', { className: 'lb-phone__hud' },
            h('div', { className: 'lb-phud__track' }, h('div', { className: 'lb-phud__fill', style: { width: pct + '%' } })),
            h('span', { className: 'lb-phud__xp' }, Ic.Spark ? h(Ic.Spark, { size: 13 }) : null, '+' + xp)),
          h('div', { className: 'lb-phone__body' },
            UI ? h(UI.BlockView, { block, st, revealed, onChange: setSt }) : null),
          h('div', { className: 'lb-phone__foot' },
            block.type === 'theory'
              ? h('button', { type: 'button', className: 'lb-pvbtn lb-pvbtn--ck', onClick: reset }, 'Понятно, дальше')
              : revealed
                ? h('button', { type: 'button', className: 'lb-pvbtn lb-pvbtn--rs', onClick: reset }, Ic.ArrowLeft ? h(Ic.ArrowLeft, { size: 15 }) : null, 'Пройти заново')
                : h('button', { type: 'button', className: 'lb-pvbtn lb-pvbtn--ck', disabled: !complete, onClick: () => setRevealed(true) }, 'Проверить')))),
      h('div', { className: 'lb-prev__note' }, 'Кликай прямо в экране — превью ведёт себя как реальный тренажёр ученика.'));
  }

  /* ── редакторы ────────────────────────────────────────────────────────────── */
  function field(label, node, hint) {
    return h('div', { className: 'lb-field' },
      h('div', { className: 'lb-label' }, h('span', null, label), hint ? h('span', { className: 'lb-label__hint' }, hint) : null), node);
  }
  function inp(value, onChange, ph, cls) {
    return h('input', { className: 'lb-in' + (cls ? ' ' + cls : ''), value: value || '', placeholder: ph, onChange: (e) => onChange(e.target.value) });
  }
  function ta(value, onChange, ph) {
    return h('textarea', { className: 'lb-ta', value: value || '', placeholder: ph, onChange: (e) => onChange(e.target.value) });
  }

  function OptionsEditor(props) {
    const { block, patch } = props;
    const opts = block.options || [];
    const setOpt = (i, key, v) => { const a = opts.slice(); a[i] = Object.assign({}, a[i], { [key]: v }); patch({ options: a }); };
    const setCorrect = (i) => { const a = opts.map((o, k) => Object.assign({}, o, { correct: k === i })); patch({ options: a }); };
    const add = () => patch({ options: opts.concat({ text: 'Новый вариант', correct: false }) });
    const del = (i) => patch({ options: opts.filter((_, k) => k !== i) });
    return h('div', null,
      h('div', { className: 'lb-rows' }, opts.map((o, i) => h('div', { key: i, className: 'lb-row' },
        h('span', { className: 'lb-rn' }, i + 1),
        inp(o.text, (v) => setOpt(i, 'text', v), 'Текст варианта'),
        h('button', { type: 'button', className: 'lb-correct' + (o.correct ? ' on' : ''), onClick: () => setCorrect(i) },
          h('span', { className: 'lb-correct__tick' }, o.correct ? (Ic.Check ? h(Ic.Check, { size: 13, strokeWidth: 2.8 }) : '✓') : ''), 'верный'),
        h('button', { type: 'button', className: 'lb-rowdel', disabled: opts.length <= 2, onClick: () => del(i), 'aria-label': 'Удалить' }, Ic.Trash ? h(Ic.Trash, { size: 16 }) : '×')))),
      h('button', { type: 'button', className: 'lb-addrow', onClick: add }, Ic.Plus ? h(Ic.Plus, { size: 15 }) : '+', 'Добавить вариант'));
  }

  function Editor(props) {
    const { block, idx, patch } = props;
    if (!block) return h('div', { className: 'lb-pane' });
    const tm = L.typeMeta(block.type);
    const TIc = icon(tm.icon);
    const head = h('div', null,
      h('div', { className: 'lb-edit__kick' }, TIc ? h(TIc, { size: 15 }) : null, 'Блок ' + (idx + 1) + ' · ' + tm.label),
      h('div', { className: 'lb-edit__title' }, summary(block) || 'Без названия'));

    let body;
    if (block.type === 'theory') {
      const vocab = block.vocab || [];
      const setV = (i, key, v) => { const a = vocab.slice(); a[i] = Object.assign({}, a[i], { [key]: v }); patch({ vocab: a }); };
      const addV = () => patch({ vocab: vocab.concat({ hanzi: '', pinyin: '', ru: '' }) });
      const delV = (i) => patch({ vocab: vocab.filter((_, k) => k !== i) });
      body = h('div', null,
        field('Заголовок темы', inp(block.title, (v) => patch({ title: v }), 'Например, Базовое приветствие')),
        field('Объяснение', ta(block.body, (v) => patch({ body: v }), 'Пара предложений простым языком')),
        field('Новые слова', h('div', null,
          h('div', { className: 'lb-rows' }, vocab.map((v, i) => h('div', { key: i, className: 'lb-row' },
            inp(v.hanzi, (x) => setV(i, 'hanzi', x), '你好', 'lb-in--hz'),
            inp(v.pinyin, (x) => setV(i, 'pinyin', x), 'nǐ hǎo'),
            inp(v.ru, (x) => setV(i, 'ru', x), 'Привет'),
            h('button', { type: 'button', className: 'lb-rowdel', disabled: vocab.length <= 1, onClick: () => delV(i) }, Ic.Trash ? h(Ic.Trash, { size: 16 }) : '×')))),
          h('button', { type: 'button', className: 'lb-addrow', onClick: addV }, Ic.Plus ? h(Ic.Plus, { size: 15 }) : '+', 'Добавить слово')),
          'иероглиф · пиньинь · перевод'));
    } else if (block.type === 'choice') {
      body = h('div', null,
        field('Вопрос', inp(block.prompt, (v) => patch({ prompt: v }), 'Текст вопроса')),
        field('Варианты ответа', h(OptionsEditor, { block, patch }), 'отметь один верный'),
        field('Разбор после ответа', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение, почему так')));
    } else if (block.type === 'gap') {
      body = h('div', null,
        field('Инструкция', inp(block.prompt, (v) => patch({ prompt: v }), 'Вставь пропущенное слово')),
        field('Текст до пропуска', inp(block.before, (v) => patch({ before: v }), 'Начало фразы')),
        field('Текст после пропуска', inp(block.after, (v) => patch({ after: v }), 'Конец фразы')),
        field('Варианты для пропуска', h(OptionsEditor, { block, patch }), 'отметь верный'),
        field('Разбор после ответа', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
    } else if (block.type === 'match') {
      const pairs = block.pairs || [];
      const setP = (i, key, v) => { const a = pairs.slice(); a[i] = Object.assign({}, a[i], { [key]: v }); patch({ pairs: a }); };
      const addP = () => patch({ pairs: pairs.concat({ left: '', right: '' }) });
      const delP = (i) => patch({ pairs: pairs.filter((_, k) => k !== i) });
      body = h('div', null,
        field('Инструкция', inp(block.prompt, (v) => patch({ prompt: v }), 'Соедини иероглиф и перевод')),
        field('Пары', h('div', null,
          h('div', { className: 'lb-rows' }, pairs.map((p, i) => h('div', { key: i, className: 'lb-pair' },
            h('span', { className: 'lb-rn' }, i + 1),
            inp(p.left, (x) => setP(i, 'left', x), '你好', 'lb-in--hz'),
            h('span', { className: 'lb-pair__link' }, Ic.ArrowRight ? h(Ic.ArrowRight, { size: 15 }) : '–'),
            inp(p.right, (x) => setP(i, 'right', x), 'Привет'),
            h('button', { type: 'button', className: 'lb-rowdel', disabled: pairs.length <= 2, onClick: () => delP(i) }, Ic.Trash ? h(Ic.Trash, { size: 16 }) : '×')))),
          h('button', { type: 'button', className: 'lb-addrow', onClick: addP }, Ic.Plus ? h(Ic.Plus, { size: 15 }) : '+', 'Добавить пару')),
          'ученик кликает слово, потом перевод'),
        field('Разбор после ответа', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
    } else if (block.type === 'order') {
      const toks = block.tokens || [];
      const setT = (i, v) => { const a = toks.slice(); a[i] = v; patch({ tokens: a }); };
      const addT = () => patch({ tokens: toks.concat('') });
      const delT = (i) => patch({ tokens: toks.filter((_, k) => k !== i) });
      body = h('div', null,
        field('Инструкция', inp(block.prompt, (v) => patch({ prompt: v }), 'Собери предложение')),
        field('Слова в правильном порядке', h('div', null,
          h('div', { className: 'lb-rows' }, toks.map((t, i) => h('div', { key: i, className: 'lb-row' },
            h('span', { className: 'lb-rn' }, i + 1),
            inp(t, (x) => setT(i, x), 'слово', 'lb-in--hz'),
            h('button', { type: 'button', className: 'lb-rowdel', disabled: toks.length <= 2, onClick: () => delT(i) }, Ic.Trash ? h(Ic.Trash, { size: 16 }) : '×')))),
          h('button', { type: 'button', className: 'lb-addrow', onClick: addT }, Ic.Plus ? h(Ic.Plus, { size: 15 }) : '+', 'Добавить слово')),
          'у ученика они перемешаются'),
        field('Разбор после ответа', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
    } else if (block.type === 'type') {
      const ans = block.answers || [];
      const setA = (i, v) => { const a = ans.slice(); a[i] = v; patch({ answers: a }); };
      const addA = () => patch({ answers: ans.concat('') });
      const delA = (i) => patch({ answers: ans.filter((_, k) => k !== i) });
      body = h('div', null,
        field('Вопрос', inp(block.prompt, (v) => patch({ prompt: v }), 'Напечатай пиньинь для 谢谢')),
        field('Верные ответы', h('div', null,
          h('div', { className: 'lb-rows' }, ans.map((a, i) => h('div', { key: i, className: 'lb-row' },
            h('span', { className: 'lb-rn' }, i + 1),
            inp(a, (x) => setA(i, x), 'xiexie'),
            h('button', { type: 'button', className: 'lb-rowdel', disabled: ans.length <= 1, onClick: () => delA(i) }, Ic.Trash ? h(Ic.Trash, { size: 16 }) : '×')))),
          h('button', { type: 'button', className: 'lb-addrow', onClick: addA }, Ic.Plus ? h(Ic.Plus, { size: 15 }) : '+', 'Добавить вариант написания')),
          'регистр и пробелы не важны'),
        field('Разбор после ответа', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
    } else if (block.type === 'tone') {
      body = h('div', null,
        field('Иероглиф', inp(block.hanzi, (v) => patch({ hanzi: v }), '妈', 'lb-in--hz')),
        field('Пиньинь (покажем после ответа)', inp(block.pinyin, (v) => patch({ pinyin: v }), 'mā')),
        field('Верный тон', h('div', { className: 'lb-tones' }, (L.TONES || []).map((t, i) => h('button', {
          key: i, type: 'button', className: 'lb-tone' + (block.tone === i + 1 ? ' on' : ''), onClick: () => patch({ tone: i + 1 }),
        }, h('span', { className: 'lb-tone__m' }, t.mark), h('span', { className: 'lb-tone__n' }, (i + 1) + '-й')))), 'какой тон должен выбрать ученик'),
        field('Разбор после ответа', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
    }
    return h('div', { className: 'lb-pane' }, h('div', { className: 'lb-edit' }, head, body));
  }

  /* ── редактор видео (основа урока) ───────────────────────────────────────── */
  function VideoEditor(props) {
    const { lesson, setMeta } = props;
    const v = lesson.video || {};
    const emb = L.videoEmbed(v);
    const hasUrl = !!String(v.url || '').trim();
    const hasFile = !!String(v.file || '').trim();
    const setV = (patch) => setMeta({ video: Object.assign({}, v, patch) });
    const fileRef = useRef(null);
    const onPick = (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      const nm = f.name.replace(/\.[^.]+$/, '');
      setV({ file: url, upload: f.name, title: v.title || nm });
    };
    const clearFile = () => setV({ file: '', upload: '' });

    const drop = hasFile
      ? h('div', { className: 'lb-drop is-loaded' },
        h('span', { className: 'lb-drop__ic' }, Ic.Check ? h(Ic.Check, { size: 20, strokeWidth: 2.6 }) : '✓'),
        h('div', { className: 'lb-drop__b' },
          h('div', { className: 'lb-drop__t' }, 'Видео загружено'),
          h('div', { className: 'lb-drop__s' }, v.upload || 'Файл готов — предпросмотр справа')),
        h('button', { type: 'button', className: 'lb-drop__x', onClick: clearFile, 'aria-label': 'Убрать' }, Ic.Close ? h(Ic.Close, { size: 16 }) : '×'))
      : h('button', { type: 'button', className: 'lb-drop', onClick: () => fileRef.current && fileRef.current.click() },
        h('span', { className: 'lb-drop__ic' }, UI && UI.PlayGlyph ? UI.PlayGlyph(20) : '▶'),
        h('div', { className: 'lb-drop__b' },
          h('div', { className: 'lb-drop__t' }, 'Загрузите видеоурок'),
          h('div', { className: 'lb-drop__s' }, 'Нажмите, чтобы выбрать файл · MP4, до 500 МБ')));

    let linkState = null;
    if (hasUrl && emb) linkState = h('div', { className: 'lb-vstate ok' },
      h('span', { className: 'lb-vstate__ic' }, Ic.CheckCircle ? h(Ic.CheckCircle, { size: 18 }) : '✓'),
      h('div', null,
        h('div', { className: 'lb-vstate__t' }, 'Ссылка распознана · ' + emb.provider),
        h('div', { className: 'lb-vstate__s' }, 'Появится под заголовком урока. Превью — справа.')));
    else if (hasUrl) linkState = h('div', { className: 'lb-vstate bad' },
      h('span', { className: 'lb-vstate__ic' }, Ic.AlertTriangle ? h(Ic.AlertTriangle, { size: 17 }) : '!'),
      h('div', null,
        h('div', { className: 'lb-vstate__t' }, 'Ссылку не разобрали'),
        h('div', { className: 'lb-vstate__s' }, 'Проверьте формат — поддерживаем площадки ниже.')));

    return h('div', { className: 'lb-pane' }, h('div', { className: 'lb-edit' },
      h('div', null,
        h('div', { className: 'lb-edit__kick' }, UI && UI.PlayGlyph ? UI.PlayGlyph(14) : null, 'Основа урока · Видео'),
        h('div', { className: 'lb-edit__title' }, 'Видеоурок')),
      h('input', { ref: fileRef, type: 'file', accept: 'video/*', style: { display: 'none' }, onChange: onPick }),
      drop,
      h('div', { className: 'lb-or' }, h('span', null, 'или дайте ссылку')),
      field('Ссылка на видео', inp(v.url, (url) => setV({ url }), 'https://youtu.be/…')),
      linkState,
      h('div', { className: 'lb-platforms' },
        h('span', { className: 'lb-platforms__l' }, 'Понимаем:'),
        ['YouTube', 'Vimeo', 'RuTube', 'VK', 'Zoom'].map((p) => h('span', { key: p, className: 'lb-plat' }, p))),
      h('div', { className: 'lb-grid2' },
        field('Название', inp(v.title, (title) => setV({ title }), 'Видеоурок: первые слова')),
        field('Длительность', inp(v.duration, (duration) => setV({ duration }), '08:40')))));
  }

  /* ── редактор конспекта (текст под видео) ────────────────────────────────── */
  function NotesEditor(props) {
    const { lesson, setMeta } = props;
    const nb = L.notesToBlocks(lesson.notes);
    const heads = nb.filter((b) => b.kind === 'head').map((b) => b.text);
    const n = nb.length;
    const word = n === 1 ? 'блок' : (n >= 2 && n <= 4 ? 'блока' : 'блоков');
    return h('div', { className: 'lb-pane' }, h('div', { className: 'lb-edit' },
      h('div', null,
        h('div', { className: 'lb-edit__kick' }, Ic.Doc ? h(Ic.Doc, { size: 15 }) : null, 'Под видео · Конспект'),
        h('div', { className: 'lb-edit__title' }, 'Конспект урока')),
      field('Текст конспекта',
        h('textarea', { className: 'lb-ta lb-ta--lg', value: lesson.notes || '', placeholder: 'Короткий конспект, который ученик читает прямо под видео…', onChange: (e) => setMeta({ notes: e.target.value }) }),
        n ? (n + ' ' + word + ' текста') : 'пока пусто'),
      heads.length
        ? h('div', { className: 'lb-outline' },
          h('div', { className: 'lb-outline__h' }, 'Разделы конспекта'),
          heads.map((hh, i) => h('div', { key: i, className: 'lb-outline__r' },
            h('span', { className: 'lb-outline__n' }, i + 1),
            h('span', { className: 'lb-outline__t' }, hh))))
        : h('div', { className: 'lb-outline' },
          h('div', { className: 'lb-outline__h' }, 'Разделы конспекта'),
          h('div', { className: 'lb-outline__e' }, 'Пока нет подзаголовков. Начните строку с «## », чтобы создать раздел.')),
      h('div', { className: 'lb-tip' }, Ic.Info ? h(Ic.Info, { size: 15 }) : 'i',
        h('span', null, 'Строка с ', h('b', null, '«## »'), ' в начале — это подзаголовок раздела. Абзацы разделяйте пустой строкой. Короткий конспект на 2–4 раздела читается лучше всего.'))));
  }

  /* ── модалки ────────────────────────────────────────────────────────────── */
  function PaletteModal(props) {
    return h('div', { className: 'lb-ov', onMouseDown: props.onClose },
      h('div', { className: 'lb-modal', onMouseDown: (e) => e.stopPropagation() },
        h('div', { className: 'lb-modal__h' },
          h('div', null,
            h('div', { className: 'lb-modal__t' }, 'Добавить блок'),
            h('div', { className: 'lb-modal__s' }, 'Выберите формат — он сразу появится в уроке')),
          h('button', { type: 'button', className: 'lb-x', onClick: props.onClose }, Ic.Close ? h(Ic.Close, { size: 17 }) : '×')),
        h('div', { className: 'lb-gal' }, L.TYPES.map((t) => {
          const TIc = icon(t.icon);
          return h('button', { key: t.type, type: 'button', className: 'lb-galc', onClick: () => props.onPick(t.type) },
            h('span', { className: 'lb-galc__ic' }, TIc ? h(TIc, { size: 18 }) : null),
            h('div', null, h('div', { className: 'lb-galc__t' }, t.label), h('div', { className: 'lb-galc__s' }, t.gets)));
        }))));
  }

  function TemplatesModal(props) {
    return h('div', { className: 'lb-ov', onMouseDown: props.onClose },
      h('div', { className: 'lb-modal', onMouseDown: (e) => e.stopPropagation() },
        h('div', { className: 'lb-modal__h' },
          h('div', null,
            h('div', { className: 'lb-modal__t' }, 'Шаблоны урока'),
            h('div', { className: 'lb-modal__s' }, 'Готовая структура — останется поправить слова')),
          h('button', { type: 'button', className: 'lb-x', onClick: props.onClose }, Ic.Close ? h(Ic.Close, { size: 17 }) : '×')),
        h('div', { className: 'lb-gal' }, L.TEMPLATES.map((t) => {
          const TIc = icon(t.icon);
          return h('button', { key: t.id, type: 'button', className: 'lb-galc', onClick: () => props.onPick(t) },
            h('span', { className: 'lb-galc__ic' }, TIc ? h(TIc, { size: 18 }) : null),
            h('div', null, h('div', { className: 'lb-galc__t' }, t.label), h('div', { className: 'lb-galc__s' }, t.hint)));
        })),
        h('div', { className: 'lb-tplnote' }, Ic.AlertTriangle ? h(Ic.AlertTriangle, { size: 14 }) : '!', 'Заменит текущий урок')));
  }

  /* ── корневой конструктор ───────────────────────────────────────────────── */
  function LearnBuilder() {
    if (!L || !UI) return h('div', { style: { padding: 40 } }, 'Учебный модуль не загружен');
    const [lesson, setLesson] = useState(() => L.load());
    const [sel, setSel] = useState('video'); // 'video' | 'notes' | индекс блока
    const [modal, setModal] = useState(null); // 'palette' | 'templates' | null
    const blocks = lesson.blocks || [];
    const cur = typeof sel === 'number' ? blocks[sel] : null;
    const m = L.meta(lesson);
    const vid = lesson.video || {};
    const emb = L.videoEmbed(vid);
    const nNotes = L.notesToBlocks(lesson.notes).length;

    // автосохранение на каждое изменение
    useEffect(() => { L.save(lesson); }, [lesson]);

    const setMeta = (patch) => setLesson((l) => Object.assign({}, l, patch));
    const patchBlock = (i, patch) => setLesson((l) => { const a = l.blocks.slice(); a[i] = Object.assign({}, a[i], patch); return Object.assign({}, l, { blocks: a }); });
    const addBlock = (type) => { setLesson((l) => { const a = l.blocks.concat(L.blankBlock(type)); setSel(a.length - 1); return Object.assign({}, l, { blocks: a }); }); setModal(null); };
    const dupBlock = (i) => setLesson((l) => { const a = l.blocks.slice(); a.splice(i + 1, 0, L.clone(l.blocks[i])); setSel(i + 1); return Object.assign({}, l, { blocks: a }); });
    const delBlock = (i) => setLesson((l) => { const a = l.blocks.filter((_, k) => k !== i); setSel((s) => (typeof s === 'number' ? Math.max(0, Math.min(s, a.length - 1)) : s)); return Object.assign({}, l, { blocks: a }); });
    const move = (i, dir) => setLesson((l) => { const j = i + dir; if (j < 0 || j >= l.blocks.length) return l; const a = l.blocks.slice(); const t = a[i]; a[i] = a[j]; a[j] = t; setSel(j); return Object.assign({}, l, { blocks: a }); });
    const applyTpl = (tpl) => { const ls = tpl.build(); setLesson(ls); setSel(0); setModal(null); };

    const openAsStudent = () => { L.save(lesson); nav('/learn/lesson'); };
    const arr = () => Ic.ArrowRight ? h(Ic.ArrowRight, { size: 16, className: 'arr' }) : null;
    const prevKey = cur ? (sel + ':' + cur.type + ':' + ((cur.options && cur.options.length) || (cur.pairs && cur.pairs.length) || (cur.tokens && cur.tokens.length) || 0)) : 'none';

    return h('div', { className: 'lb-app' },
      // верх
      h('div', { className: 'lb-top' },
        h('button', { type: 'button', className: 'lb-back', onClick: () => nav('/learn'), 'aria-label': 'Назад' }, Ic.ArrowLeft ? h(Ic.ArrowLeft, { size: 19 }) : '‹'),
        h('div', null,
          h('div', { className: 'lb-brand__kick' }, 'ИСТСАЙД · Конструктор'),
          h('div', { className: 'lb-brand__role' }, 'Кабинет преподавателя')),
        h('div', { className: 'lb-top__sp' }),
        h('div', { className: 'lb-saved' }, h('span', { className: 'lb-saved__dot' }), 'Сохранено'),
        h('button', { type: 'button', className: 'lb-btn lb-btn--ghost', onClick: () => setModal('templates') }, Ic.Grid ? h(Ic.Grid, { size: 16 }) : null, 'Шаблоны'),
        h('button', { type: 'button', className: 'lb-btn lb-btn--primary', onClick: openAsStudent }, Ic.Eye ? h(Ic.Eye, { size: 16 }) : null, 'Открыть как ученик', arr())),
      // тело
      h('div', { className: 'lb-body' },
        // слева — урок
        h('div', { className: 'lb-pane lb-pane--rail' },
          h('div', { className: 'lb-lesson' },
            h('input', { className: 'lb-titlein', value: lesson.title || '', placeholder: 'Название урока', onChange: (e) => setMeta({ title: e.target.value }) }),
            h('div', { className: 'lb-goal' }, Ic.Target ? h(Ic.Target, { size: 15 }) : null,
              h('input', { value: lesson.goal || '', placeholder: 'Чему научится ученик', onChange: (e) => setMeta({ goal: e.target.value }) })),
            h('div', { className: 'lb-meta' },
              h('div', { className: 'lb-mc' }, h('div', { className: 'lb-mc__v' }, m.blocks), h('div', { className: 'lb-mc__k' }, 'заданий')),
              h('div', { className: 'lb-mc' }, h('div', { className: 'lb-mc__v' }, '~' + m.minutes), h('div', { className: 'lb-mc__k' }, 'минут')),
              h('div', { className: 'lb-mc' }, h('div', { className: 'lb-mc__v acc' }, m.xp), h('div', { className: 'lb-mc__k' }, 'XP'))),
            h('div', { className: 'lb-lvlrow' },
              h('select', { className: 'lb-lvl', value: lesson.level || LEVELS[0], onChange: (e) => setMeta({ level: e.target.value }) }, LEVELS.map((lv) => h('option', { key: lv, value: lv }, lv))),
              h('button', { type: 'button', className: 'lb-tplbtn', onClick: () => setModal('templates') }, Ic.Grid ? h(Ic.Grid, { size: 14 }) : null, 'Шаблон'))),
          h('div', { className: 'lb-sech' }, h('span', null, 'Из чего урок')),
          h('div', { className: 'lb-list' },
            h('div', { className: 'lb-item lb-item--fix' + (sel === 'video' ? ' is-sel' : ''), onClick: () => setSel('video') },
              h('span', { className: 'lb-item__ic' }, UI && UI.PlayGlyph ? UI.PlayGlyph(15) : (Ic.Monitor ? h(Ic.Monitor, { size: 15 }) : null)),
              h('div', { className: 'lb-item__b' },
                h('div', { className: 'lb-item__t' }, 'Видео'),
                h('div', { className: 'lb-item__s' }, emb ? emb.provider : (String(vid.url || '').trim() ? 'ссылка не разобрана' : 'ссылка не добавлена')))),
            h('div', { className: 'lb-item lb-item--fix' + (sel === 'notes' ? ' is-sel' : ''), onClick: () => setSel('notes') },
              h('span', { className: 'lb-item__ic' }, Ic.Doc ? h(Ic.Doc, { size: 15 }) : null),
              h('div', { className: 'lb-item__b' },
                h('div', { className: 'lb-item__t' }, 'Конспект'),
                h('div', { className: 'lb-item__s' }, nNotes ? (nNotes + ' ' + (nNotes === 1 ? 'раздел' : (nNotes >= 2 && nNotes <= 4 ? 'раздела' : 'разделов'))) : 'пусто')))),
          h('div', { className: 'lb-sech', style: { marginTop: 20 } }, h('span', null, 'Домашнее задание'), h('span', { className: 'lb-num' }, blocks.length + ' ' + (blocks.length === 1 ? 'блок' : (blocks.length >= 2 && blocks.length <= 4 ? 'блока' : 'блоков')))),
          blocks.length ? h('div', { className: 'lb-list' }, blocks.map((b, i) => {
            const TIc = icon(L.typeMeta(b.type).icon);
            const issue = L.blockIssue(b);
            return h('div', { key: i, className: 'lb-item' + (i === sel ? ' is-sel' : ''), onClick: () => setSel(i) },
              h('span', { className: 'lb-item__n' }, i + 1),
              h('span', { className: 'lb-item__ic' }, TIc ? h(TIc, { size: 16 }) : null),
              h('div', { className: 'lb-item__b' },
                h('div', { className: 'lb-item__t' }, L.typeMeta(b.type).label, issue ? h('span', { className: 'lb-dot', title: issue }) : null),
                h('div', { className: 'lb-item__s' }, summary(b))),
              h('div', { className: 'lb-item__act' },
                h('button', { type: 'button', className: 'lb-ib', disabled: i === 0, onClick: (e) => { e.stopPropagation(); move(i, -1); }, 'aria-label': 'Выше' }, Ic.ChevronUp ? h(Ic.ChevronUp, { size: 14 }) : '↑'),
                h('button', { type: 'button', className: 'lb-ib', disabled: i === blocks.length - 1, onClick: (e) => { e.stopPropagation(); move(i, 1); }, 'aria-label': 'Ниже' }, Ic.ChevronDown ? h(Ic.ChevronDown, { size: 14 }) : '↓'),
                h('button', { type: 'button', className: 'lb-ib', onClick: (e) => { e.stopPropagation(); dupBlock(i); }, 'aria-label': 'Дублировать' }, Ic.Plus ? h(Ic.Plus, { size: 14 }) : '+'),
                h('button', { type: 'button', className: 'lb-ib del', onClick: (e) => { e.stopPropagation(); delBlock(i); }, 'aria-label': 'Удалить' }, Ic.Trash ? h(Ic.Trash, { size: 14 }) : '×')));
          })) : h('div', { className: 'lb-empty' },
            h('div', { className: 'lb-empty__t' }, 'Домашка пуста'),
            h('div', { className: 'lb-empty__s' }, 'Добавьте первое задание или начните с готового шаблона')),
          h('button', { type: 'button', className: 'lb-add', onClick: () => setModal('palette') }, Ic.Plus ? h(Ic.Plus, { size: 16 }) : '+', 'Добавить задание')),
        // центр — редактор (видео / конспект / задание)
        sel === 'video' ? h(VideoEditor, { lesson, setMeta })
          : sel === 'notes' ? h(NotesEditor, { lesson, setMeta })
            : cur ? h(Editor, { block: cur, idx: sel, patch: (p) => patchBlock(sel, p) })
              : h('div', { className: 'lb-pane' }, h('div', { className: 'lb-edit' },
                h('div', { className: 'lb-edit__kick' }, 'Пусто'),
                h('div', { className: 'lb-edit__title' }, 'Добавьте задание, чтобы начать'),
                h('button', { type: 'button', className: 'lb-add', onClick: () => setModal('palette') }, Ic.Plus ? h(Ic.Plus, { size: 16 }) : '+', 'Добавить задание'))),
        // справа — превью
        h('div', { className: 'lb-pane lb-pane--prev' },
          h('div', { className: 'lb-sech', style: { width: '100%', maxWidth: 404 } }, h('span', null, 'Превью ученика'), h('span', { className: 'lb-num' }, lesson.level || '')),
          (sel === 'video' || sel === 'notes')
            ? h(R.Fragment, null,
              h('div', { className: 'lb-phone' },
                h('div', { className: 'lb-phone__screen' },
                  h('div', { className: 'lb-phone__notch' }),
                  h('div', { className: 'lb-phone__body lb-phone__body--study' }, UI ? h(UI.StudyView, { lesson, compact: true, homeworkDone: false, onStart: function () {} }) : null))),
              h('div', { className: 'lb-prev__note' }, 'Так ученик видит урок: видео сверху, конспект и кнопка к домашке.'))
            : cur ? h(Preview, { key: prevKey, block: cur, pos: sel, total: blocks.length })
              : h('p', { style: { color: 'var(--lb-ink-mute)', fontSize: 13 } }, 'Выберите блок, чтобы увидеть превью.'))),
      // модалки
      modal === 'palette' ? h(PaletteModal, { onPick: addBlock, onClose: () => setModal(null) }) : null,
      modal === 'templates' ? h(TemplatesModal, { onPick: applyTpl, onClose: () => setModal(null) }) : null);
  }

  (window.EScreens = window.EScreens || {}).LearnBuilder = LearnBuilder;
})();
