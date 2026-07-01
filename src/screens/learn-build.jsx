/* ============================================================================
   EastSide — Конструктор урока (window.EScreens.LearnBuilder · #/learn/build)
   ----------------------------------------------------------------------------
   Пересобран под философию «один документ»: преподаватель не заполняет CMS-
   поля, а пишет урок как в Google Docs / Notion. Две сущности — Теория и
   Практика — переключаются вкладкой по центру.

   ТРИ ЗОНЫ:
     · СЛЕВА  — структура урока (Теория: видео/материалы/документ; Практика:
                карточки заданий с drag). Не список файлов, а карта урока.
     · ЦЕНТР  — вкладка «Теория» = документ (свойства сверху + поток блоков
                lesson.doc[] с inline-редактированием, мини-toolbar, Notion-«+»);
                вкладка «Практика» = вертикальные карточки заданий (drag/dup/
                del/collapse).
     · СПРАВА — живой превью в рамке телефона: «как видит ученик». Теория —
                UI.StudyView(lesson, compact); практика — UI.BlockView(карточка).

   Реальный drag-and-drop (pointer events) — общий движок ReorderList для
   блоков документа и карточек практики. Автосохранение в localStorage на
   каждое изменение (L.save). «Открыть как ученик» — собранный урок в тренажёр.

   Источник стиля — design.md (режим B, сапфир-акцент, воздух, полупрозрачные
   бордеры, анимации transform/opacity). Шрифт — SF Pro Display через токен.
   ============================================================================ */
(function () {
  'use strict';
  const R = window.React || React;
  const { createElement: h, useState, useEffect, useRef, useCallback } = R;
  const Ic = window.EIcons || {};
  const L = window.ELessons;
  const UI = window.ELessonUI;
  const Store = window.ELessonStore;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  // ── Оптимистичная загрузка медиа урока (window.EMedia).
  //    Сразу отдаём blob для мгновенного показа, заливка в бэкенд (bytea в
  //    Supabase Postgres) идёт В ФОНЕ; как файл сохранён — apply подменяет blob
  //    на постоянную ссылку. apply(url, uploading) зовётся дважды: (blob,true),
  //    затем (постоянная|blob, false). Файлы > лимита не грузим (видео — ссылкой).
  function pickMedia(file, apply) {
    if (!file) return;
    if (window.EMedia) {
      if (window.EMedia.tooBig(file)) { try { window.alert('Файл больше 20 МБ не сохранён на сервере. Для больших видео используйте ссылку (YouTube, Vimeo, RuTube, ВК).'); } catch (e) {} }
      window.EMedia.previewUpload(file, function (st) { apply(st.url, st.uploading); });
    } else {
      const u = URL.createObjectURL(file); apply(u, true); apply(u, false);
    }
  }

  /* ── Inline-SVG иконки (не в общем lib/icons.jsx — локально в экране) ─────── */
  const svg = (size, children, opts) => h('svg', Object.assign({
    width: size, height: size, viewBox: '0 0 24 24', fill: opts && opts.fill ? 'currentColor' : 'none',
    stroke: 'currentColor', strokeWidth: (opts && opts.sw) || 1.7, strokeLinecap: 'round', strokeLinejoin: 'round',
    'aria-hidden': true, focusable: 'false',
  }, (opts && opts.rest) || {}), children);
  const P = (d, k) => h('path', { d, key: k || d.slice(0, 5) });
  const Grip = (s) => svg(s, [P('M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01', 'a')], { sw: 2 });
  const Bold = (s) => svg(s, [P('M7 5h6a3.5 3.5 0 0 1 0 7H7zm0 7h7a3.5 3.5 0 0 1 0 7H7z', 'a')], { fill: true });
  const Italic = (s) => svg(s, [P('M14 5h4M6 19h4M15 5L9 19', 'a')]);
  const ListBullet = (s) => svg(s, [h('circle', { key: 'a', cx: 5, cy: 7, r: 1.4 }), h('circle', { key: 'b', cx: 5, cy: 12, r: 1.4 }), h('circle', { key: 'c', cx: 5, cy: 17, r: 1.4 }), P('M10 7h9', 'd'), P('M10 12h9', 'e'), P('M10 17h9', 'f')]);
  const ListNumbered = (s) => svg(s, [P('M4 6h1v-2M4 4h2', 'a'), P('M4 17h2a1 1 0 0 0 0-2H4l2-2H4', 'b'), P('M10 7h9', 'c'), P('M10 12h9', 'd'), P('M10 17h9', 'e')]);
  const QuoteIc = (s) => svg(s, [P('M7 7h4v6a4 4 0 0 1-4 4M13 7h4v6a4 4 0 0 1-4 4', 'a')], { fill: true });
  const ImgIc = (s) => svg(s, [h('rect', { key: 'a', x: 3, y: 4, width: 18, height: 16, rx: 2.5 }), h('circle', { key: 'b', cx: 8.5, cy: 9.5, r: 1.8 }), P('M21 16l-5-5-7 7', 'c')]);
  const AudioIc = (s) => svg(s, [P('M11 5 6 9H3v6h3l5 4z', 'a'), P('M15.5 8.5a5 5 0 0 1 0 7', 'b'), P('M18 6a8 8 0 0 1 0 12', 'c')]);
  const Duplicate = (s) => svg(s, [h('rect', { key: 'a', x: 8, y: 8, width: 12, height: 12, rx: 2.5 }), P('M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3', 'b')]);
  const LinkIc = (s) => svg(s, [P('M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1.5 1.5', 'a'), P('M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1.5-1.5', 'b')]);
  const UndoIc = (s) => svg(s, [P('M9 14 4 9l5-5', 'u1'), P('M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11', 'u2')]);
  const RedoIc = (s) => svg(s, [P('m15 14 5-5-5-5', 'r1'), P('M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13', 'r2')]);
  const SaveIc = (s) => svg(s, [P('M15.2 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7.8L15.2 3z', 's1'), P('M17 21v-7H7v7', 's2'), P('M7 3v4h8', 's3')]);
  /* иконки для кастомного видеоплеера */
  const PlayTri = (s) => svg(s, [P('M7 4.5l12 7.5-12 7.5z', 'a')], { fill: true });
  const PauseIc = (s) => svg(s, [h('rect', { key: 'a', x: 6.5, y: 5, width: 3.6, height: 14, rx: 1.2, fill: 'currentColor' }), h('rect', { key: 'b', x: 13.9, y: 5, width: 3.6, height: 14, rx: 1.2, fill: 'currentColor' })]);
  const VolIc = (s) => svg(s, [P('M11 5 6 9H3v6h3l5 4z', 'a'), P('M15.5 8.5a5 5 0 0 1 0 7', 'b'), P('M18 6a8 8 0 0 1 0 12', 'c')]);
  const VolXIc = (s) => svg(s, [P('M11 5 6 9H3v6h3l5 4z', 'a'), P('M16 9.5l5 5M21 9.5l-5 5', 'b')]);
  const FsIc = (s) => svg(s, [P('M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3', 'a')]);
  const Seek10Ic = (s, back) => h('svg', { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
    h('path', { d: back ? 'M4 7a9 9 0 1 1-2.3 8.8' : 'M20 7a9 9 0 1 0 2.3 8.8', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' }),
    h('path', { d: back ? 'M7 4.5 4 7l3 2.5' : 'M17 4.5 20 7l-3 2.5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }),
    h('text', { x: 12, y: 15.5, textAnchor: 'middle', fontSize: 7.5, fontWeight: 700, fill: 'currentColor', stroke: 'none', fontFamily: 'inherit' }, '10'));

  /* Контур тона (SVG) и озвучка (Web Speech API, zh-CN) — для конструктора */
  const ToneContour = (d) => h('svg', { viewBox: '0 0 60 30', width: 34, height: 18, 'aria-hidden': true }, h('path', { d, stroke: 'currentColor', strokeWidth: 3.4, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }));
  const speak = (text) => { try { if (!window.speechSynthesis || !text) return; window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(String(text)); u.lang = 'zh-CN'; u.rate = 0.9; window.speechSynthesis.speak(u); } catch (e) {} };

  /* ── Каталог блоков документа (для меню «+» и toolbar) ───────────────────── */
  const DOC_TEXT_KINDS = [
    { kind: 'heading', label: 'Заголовок', icon: (s) => svg(s, [P('M5 5v14M19 5v14M5 12h14', 'a')], { sw: 2 }) },
    { kind: 'para', label: 'Абзац', icon: (s) => svg(s, [P('M5 7h14M5 12h14M5 17h9', 'a')]) },
    { kind: 'quote', label: 'Цитата', icon: QuoteIc },
    { kind: 'bullets', label: 'Список', icon: ListBullet },
    { kind: 'numbered', label: 'Нумерация', icon: ListNumbered },
  ];
  const DOC_BLOCK_KINDS = [
    { kind: 'word', label: 'Новое слово', icon: (s) => svg(s, [P('M4 5h16M5 5l1.2 14a1 1 0 0 0 1 .9h9.6a1 1 0 0 0 1-.9L19 5', 'a')]) },
    { kind: 'example', label: 'Пример', icon: (s) => svg(s, [P('M4 6h16M4 11h11M4 16h7', 'a'), P('M17 14l2.5 2.5L17 19', 'b')]) },
    { kind: 'spoiler', label: 'Спойлер', icon: (s) => svg(s, [P('M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z', 'a'), h('circle', { key: 'c', cx: 12, cy: 12, r: 3 })]) },
    { kind: 'image', label: 'Изображение', icon: ImgIc },
    { kind: 'audio', label: 'Аудио', icon: AudioIc },
    { kind: 'material', label: 'Материал', icon: (s) => svg(s, [P('M13 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z', 'a'), P('M13 3v5h6', 'b')]) },
    { kind: 'hint', label: 'Подсказка', icon: (s) => svg(s, [P('M9 18h6M10 21h4', 'a'), P('M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.5h6c0-1.1.4-1.9 1-2.5A6 6 0 0 0 12 3z', 'b')]) },
    { kind: 'important', label: 'Важно', icon: (s) => svg(s, [P('M12 3 2.5 20h19L12 3z', 'a'), P('M12 10v4', 'b'), h('circle', { key: 'c', cx: 12, cy: 17, r: 0.6, fill: 'currentColor' })]) },
    { kind: 'divider', label: 'Разделитель', icon: (s) => svg(s, [P('M4 12h16', 'a')], { sw: 2 }) },
  ];
  const KIND_LABEL = {};
  DOC_TEXT_KINDS.concat(DOC_BLOCK_KINDS).forEach((k) => { KIND_LABEL[k.kind] = k.label; });
  const kindIcon = (kind) => {
    const all = DOC_TEXT_KINDS.concat(DOC_BLOCK_KINDS);
    return (all.find((k) => k.kind === kind) || all[1]).icon;
  };

  /* ─────────────────────────────────────────────────────────────────────────
     СТИЛИ. Префикс .lb-. Шрифт SF Pro Display через локальный токен.
  ───────────────────────────────────────────────────────────────────────── */
  const CSS = `
  .lb-app{position:fixed;inset:0;display:flex;flex-direction:column;overflow:hidden;
    --lb-display:'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
    --lb-text:'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
    --lb-acc:#2073E6; --lb-acc-2:#5CB4FF; --lb-acc-deep:#1E63C2; --lb-acc-ink:#1763C8;
    --lb-acc-soft:rgba(43,143,255,.1); --lb-acc-line:rgba(43,143,255,.4);
    --lb-ink:#15203B; --lb-ink-sub:rgba(21,32,59,.6); --lb-ink-mute:rgba(21,32,59,.42); --lb-ink-faint:rgba(21,32,59,.24);
    --lb-line:rgba(22,32,59,.08); --lb-line-strong:rgba(22,32,59,.14);
    --lb-surface:#FFFFFF; --lb-surface-2:#F6F8FE; --lb-jade:#1C7E52; --lb-warn:#A8741C; --lb-rose:#B23B2A; --lb-gold:#C9923E;
    font-family:var(--lb-text);color:var(--lb-ink);
    background:
      radial-gradient(760px 500px at 96% -10%, rgba(118,150,255,.13) 0%, transparent 64%),
      radial-gradient(560px 460px at -3% 0%, rgba(120,170,255,.09) 0%, transparent 62%),
      linear-gradient(180deg,#F4F6FD 0%,#FAFBFF 58%,#F4F6FD 100%);}
  .lb-app *{box-sizing:border-box;}
  /* гасим глобальный сапфировый focus-glow (--sh-focus) на инлайн-полях документа:
     наш фокус — нейтральный (подсветка/обводка чернилом), синего свечения нет */
  .lb-app input:focus, .lb-app input:focus-visible,
  .lb-app [contenteditable]:focus, .lb-app [contenteditable]:focus-visible{box-shadow:none;outline:none;}
  .lb-app ::selection{background:#15203B;color:#fff;}
  .lb-app ::-moz-selection{background:#15203B;color:#fff;}
  .lb-num{font-variant-numeric:tabular-nums;}

  /* ── верхняя панель ─────────────────────────────────────────────────────── */
  .lb-top{flex:0 0 auto;display:flex;align-items:center;gap:16px;padding:13px 22px;border-bottom:1px solid var(--lb-line);
    background:rgba(247,248,254,.9);backdrop-filter:blur(12px);}
  .lb-back{flex:0 0 auto;width:38px;height:38px;border-radius:11px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-sub);
    background:rgba(255,255,255,.7);border:1.5px solid rgba(255,255,255,.9);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:transform .15s,color .15s;}
  .lb-back:hover{transform:translateY(-1px);color:var(--lb-ink);}
  .lb-brand__kick{font-family:var(--lb-display);font-size:12.5px;font-weight:600;color:var(--lb-ink);letter-spacing:-.01em;}
  .lb-brand__role{font-size:11.5px;font-weight:500;color:var(--lb-ink-mute);margin-top:1px;}
  .lb-top__sp{flex:1 1 auto;}
  .lb-saved{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--lb-jade);}
  .lb-saved__dot{width:7px;height:7px;border-radius:50%;background:#2EC07E;box-shadow:0 0 8px rgba(46,192,126,.7);}
  .lb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;border:0;white-space:nowrap;font-family:inherit;
    font-size:13.5px;font-weight:600;padding:10px 16px;border-radius:11px;transition:transform .14s,background .14s,box-shadow .14s;}
  .lb-btn svg{transition:transform .15s;}
  .lb-btn--primary{background:#2073E6;color:#fff;box-shadow:inset 0 0 18px rgba(120,190,255,.8),inset 0 1px 0 rgba(255,255,255,.32);}
  .lb-btn--primary:hover{background:#2B8FFF;transform:translateY(-1px);box-shadow:inset 0 0 22px rgba(150,205,255,.9),inset 0 1px 0 rgba(255,255,255,.36);}
  .lb-btn--primary .arr{transform:rotate(-45deg);} .lb-btn--primary:hover .arr{transform:rotate(-45deg) translateX(2px);}
  .lb-btn--ghost{background:rgba(255,255,255,.65);color:var(--lb-ink);border:1.5px solid rgba(255,255,255,.95);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);}
  .lb-btn--ghost:hover{background:#fff;transform:translateY(-1px);}

  /* история undo/redo (с подписями) · очистить · сохранить */
  .lb-history{display:flex;gap:1px;padding:3px;border-radius:11px;background:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.9);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);}
  .lb-iconbtn{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-sub);background:transparent;border:0;transition:color .14s,background .14s;}
  .lb-iconbtn:hover:not(:disabled){color:var(--lb-ink);background:rgba(22,32,59,.06);}
  .lb-iconbtn:disabled{opacity:.32;cursor:default;}
  /* undo/redo — подписанные кнопки внутри сегмента: ясно, что это откат/возврат */
  .lb-hbtn{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px 0 10px;border-radius:8px;font-family:inherit;font-size:12.5px;font-weight:600;color:var(--lb-ink-sub);background:transparent;border:0;cursor:pointer;transition:color .14s,background .14s;}
  .lb-hbtn:hover:not(:disabled){color:var(--lb-ink);background:rgba(22,32,59,.06);}
  .lb-hbtn:disabled{opacity:.34;cursor:default;}
  .lb-hbtn svg{flex:0 0 auto;}
  /* очистить урок — полноценная кнопка с подписью, не голая иконка */
  .lb-clearbtn{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px;border-radius:11px;font-family:inherit;font-size:13px;font-weight:600;color:var(--lb-ink-sub);cursor:pointer;
    background:rgba(255,255,255,.65);border:1.5px solid var(--lb-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:color .14s,background .14s,border-color .14s,transform .14s;}
  .lb-clearbtn:hover{color:var(--lb-rose);background:#fff;border-color:rgba(210,96,79,.35);transform:translateY(-1px);}
  .lb-clearbtn svg{flex:0 0 auto;}
  /* сохранить — РУЧНОЕ сохранение по кнопке. dirty=есть правки (зовущий сапфир),
     saved=записано (тихая зелёная плашка), saving=пишем */
  .lb-savebtn{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 15px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;border-radius:11px;border:1.5px solid transparent;
    transition:color .14s,background .14s,border-color .14s,transform .14s,box-shadow .14s;}
  .lb-savebtn svg{flex:0 0 auto;}
  .lb-savebtn.is-dirty{color:#fff;background:#2073E6;box-shadow:inset 0 0 16px rgba(120,190,255,.75),inset 0 1px 0 rgba(255,255,255,.3);}
  .lb-savebtn.is-dirty:hover{background:#2B8FFF;transform:translateY(-1px);box-shadow:inset 0 0 20px rgba(150,205,255,.9),inset 0 1px 0 rgba(255,255,255,.34);}
  .lb-savebtn.is-saved{color:var(--lb-jade);background:#E8F6EE;border-color:rgba(46,160,110,.24);cursor:default;}
  .lb-savebtn.is-saving{color:var(--lb-ink-sub);background:rgba(255,255,255,.72);border-color:var(--lb-line);cursor:default;}
  .lb-savebtn__spin{width:13px;height:13px;border-radius:50%;border:2px solid rgba(22,32,59,.16);border-top-color:var(--lb-acc-deep);animation:lb-spin .7s linear infinite;}
  @keyframes lb-spin{to{transform:rotate(360deg);}}

  /* ── тело: 3 колонки ────────────────────────────────────────────────────── */
  .lb-body{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:262px minmax(0,1fr) 448px;}
  .lb-pane{height:100%;overflow-y:auto;padding:24px 24px 56px;position:relative;}
  .lb-pane::-webkit-scrollbar{width:8px;} .lb-pane::-webkit-scrollbar-thumb{background:rgba(22,32,59,.13);border-radius:99px;}
  .lb-pane--rail{border-right:1px solid var(--lb-line);background:rgba(247,249,253,.5);}
  /* Правая колонка превью НЕ скроллится сама — высота мокапа подгоняется под
     доступное место, и скроллится только «экран» внутри него (.lb-phone__body),
     как у настоящего телефона. Раньше при длинном уроке скроллилась вся
     панель целиком, что выглядело как баг. */
  .lb-pane--prev{overflow:hidden;border-left:1px solid var(--lb-line);background:linear-gradient(180deg,rgba(236,240,251,.42),rgba(244,247,255,.26));
    display:flex;flex-direction:column;align-items:center;padding:22px 24px 18px;}
  .lb-pane--center{padding:0 14px 130px;}
  .lb-canvas{max-width:920px;margin:0 auto;position:relative;}

  /* ── ЛЕВЫЙ RAIL: структура урока ────────────────────────────────────────── */
  .lb-rail__h{font-family:var(--lb-display);font-size:16px;font-weight:700;color:var(--lb-ink);letter-spacing:-.02em;margin:0 2px 12px;}
  .lb-grp{margin-top:26px;display:flex;flex-direction:column;gap:9px;}
  .lb-grp__t{font-family:var(--lb-display);font-size:14px;font-weight:700;letter-spacing:-.014em;color:var(--lb-ink);margin:0 2px;}
  .lb-rlink{display:flex;align-items:center;gap:11px;width:100%;text-align:left;cursor:pointer;font-family:inherit;
    padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.5);border:1px solid var(--lb-line);color:var(--lb-ink);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.65);transition:background .15s,border-color .15s,box-shadow .15s,transform .15s;}
  .lb-rlink:hover{background:rgba(255,255,255,.8);border-color:var(--lb-line-strong);transform:translateY(-1px);}
  .lb-rlink.is-sel{background:rgba(255,255,255,.9);border-color:var(--lb-acc-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 26px rgba(43,143,255,.2),inset 0 0 7px rgba(43,143,255,.12);}
  .lb-rlink__ic{flex:0 0 30px;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:var(--lb-acc-deep);background:var(--lb-acc-soft);}
  .lb-rlink.is-sel .lb-rlink__ic{color:#EAF2FF;background:#2073E6;box-shadow:inset 0 0 14px rgba(120,190,255,.7),inset 0 1px 0 rgba(255,255,255,.3);}
  .lb-rlink__b{flex:1 1 auto;min-width:0;}
  .lb-rlink__t{font-size:14.5px;font-weight:600;color:var(--lb-ink);letter-spacing:-.012em;}
  .lb-rlink__s{font-size:12px;color:var(--lb-ink-mute);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lb-rail__add{margin-top:0;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;
    color:var(--lb-ink-sub);padding:11px;border-radius:12px;background:rgba(22,32,59,.03);border:1.5px dashed var(--lb-line-strong);transition:background .15s,color .15s,border-color .15s;}
  .lb-rail__add:hover{background:rgba(22,32,59,.05);color:var(--lb-ink);border-color:var(--lb-ink-faint);}
  /* пустой список заданий — тихая дашед-заглушка, а не голая строка текста */
  .lb-rail-empty{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:18px 12px;border-radius:13px;
    background:rgba(255,255,255,.4);border:1.5px dashed var(--lb-line);}
  .lb-rail-empty__ic{width:28px;height:28px;border-radius:9px;display:grid;place-items:center;color:var(--lb-ink-faint);background:rgba(22,32,59,.04);}
  .lb-rail-empty span:last-child{font-size:12px;font-weight:500;color:var(--lb-ink-mute);}

  /* ── ЦЕНТР: табы — плавающий стеклянный сегмент-контрол по центру холста ──── */
  .lb-tabs{position:sticky;top:12px;z-index:34;display:flex;justify-content:center;padding:4px 0 26px;pointer-events:none;}
  .lb-tabseg{pointer-events:auto;display:inline-flex;align-items:center;gap:4px;padding:5px;border-radius:16px;
    background:rgba(255,255,255,.92);-webkit-backdrop-filter:blur(20px) saturate(1.5);backdrop-filter:blur(20px) saturate(1.5);
    border:1px solid rgba(255,255,255,.96);box-shadow:0 10px 26px -16px rgba(20,32,64,.24),inset 0 1px 0 rgba(255,255,255,.9);}
  .lb-tab{position:relative;display:inline-flex;align-items:center;font-family:inherit;font-size:13.5px;font-weight:600;color:var(--lb-ink-sub);background:0;border:0;cursor:pointer;padding:9px 18px;border-radius:12px;transition:color .18s var(--lb-ease,ease),background .18s,box-shadow .18s;}
  .lb-tab:hover{color:var(--lb-ink);}
  /* активный таб — сочный сапфировый градиент (цвет в верхнем меню) */
  .lb-tab.is-on{color:#fff;background:#2073E6;
    box-shadow:inset 0 0 18px rgba(120,190,255,.82),inset 0 1px 0 rgba(255,255,255,.32);}
  .lb-tab__c{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;margin-left:8px;border-radius:99px;background:rgba(22,32,59,.07);font-size:10.5px;font-weight:700;color:var(--lb-ink-sub);font-variant-numeric:tabular-nums;transition:background .18s,color .18s;}
  .lb-tab.is-on .lb-tab__c{background:rgba(255,255,255,.28);color:#fff;}

  /* ── вкладка ТЕОРИЯ: свойства урока + документ ─────────────────────────── */
  .lb-doc{position:relative;padding:34px 0 0 72px;}
  .lb-titlein{display:block;width:100%;resize:none;overflow:hidden;white-space:pre-wrap;overflow-wrap:break-word;font-family:var(--lb-display);font-size:38px;font-weight:600;letter-spacing:-.03em;line-height:1.1;color:var(--lb-ink);
    padding:4px 2px;border:0;border-bottom:1.5px solid transparent;background:0;transition:border-color .15s;}
  .lb-titlein::placeholder{color:var(--lb-ink-faint);}
  .lb-titlein:focus{outline:0;border-bottom-color:var(--lb-line-strong);}
  .lb-subin{width:100%;font-family:inherit;font-size:15px;font-weight:400;line-height:1.6;color:var(--lb-ink-sub);
    padding:6px 2px;border:0;background:0;margin-top:2px;}
  .lb-subin::placeholder{color:var(--lb-ink-faint);}
  .lb-subin:focus{outline:0;}

  /* свойства (видео/материалы) — НЕ карточки, а тихие строки в потоке документа */
  .lb-props{margin-top:20px;display:flex;flex-direction:column;gap:2px;}
  /* секция-карточка (видео, материалы) — единый чистый контейнер с заголовком */
  .lb-card{margin-top:22px;border-radius:16px;padding:16px 18px;background:rgba(255,255,255,.66);border:1px solid var(--lb-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
  .lb-card__h{display:flex;align-items:center;gap:10px;margin:0 0 14px;}
  .lb-card__ic{flex:0 0 30px;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:var(--lb-acc-deep);background:var(--lb-acc-soft);}
  .lb-card__t{font-family:var(--lb-display);font-size:15px;font-weight:600;color:var(--lb-ink);letter-spacing:-.01em;}
  .lb-card__s{margin-left:auto;font-size:12px;font-weight:500;color:var(--lb-ink-mute);}
  .lb-vempty{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
  .lb-vempty .lb-in{flex:1 1 220px;min-width:180px;}
  .lb-sect{margin-top:42px;}
  .lb-flow__pad{min-height:240px;margin-top:4px;border-radius:10px;cursor:text;display:flex;align-items:flex-start;}
  .lb-flow__pad__hint{font-size:14px;color:var(--lb-ink-faint);opacity:0;padding:10px 6px;transition:opacity .15s;}
  .lb-flow__pad:hover .lb-flow__pad__hint{opacity:.85;}
  .lb-aud__up{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:600;color:var(--lb-ink-sub);padding:7px 12px;border-radius:9px;background:rgba(22,32,59,.05);border:0;transition:background .14s,color .14s;}
  .lb-aud__up:hover{background:rgba(22,32,59,.09);color:var(--lb-ink);}
  /* модальное окно добавления задания (практика) — центрированное, надёжно кликабельное */
  .lb-overlay{position:fixed;inset:0;z-index:70;display:grid;place-items:center;padding:24px;background:rgba(8,14,32,.34);backdrop-filter:blur(4px);animation:lb-fade .15s ease;}
  .lb-modal{width:100%;max-width:460px;max-height:calc(100dvh - 48px);overflow-y:auto;background:#fff;border-radius:18px;border:1px solid var(--lb-line);box-shadow:0 30px 70px -24px rgba(8,16,44,.45),inset 0 1px 0 rgba(255,255,255,.9);padding:18px;animation:lb-pop .18s cubic-bezier(.23,1,.32,1);}
  .lb-modal__h{display:flex;align-items:center;justify-content:space-between;margin:0 2px 14px;}
  .lb-modal__t{font-family:var(--lb-display);font-size:17px;font-weight:600;color:var(--lb-ink);letter-spacing:-.01em;}
  .lb-modal__x{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-mute);background:transparent;border:0;transition:background .14s,color .14s;}
  .lb-modal__x:hover{background:rgba(22,32,59,.06);color:var(--lb-ink);}
  .lb-modal__grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .lb-modal__card{display:flex;flex-direction:column;align-items:flex-start;gap:7px;text-align:left;cursor:pointer;padding:14px;border-radius:13px;background:#F4F6FD;border:1px solid var(--lb-line);font-family:inherit;transition:border-color .14s,background .14s,transform .12s,box-shadow .14s;}
  .lb-modal__card:hover{border-color:var(--lb-acc-line);background:#fff;transform:translateY(-1px);box-shadow:inset 0 0 22px rgba(43,143,255,.12),inset 0 1px 0 rgba(255,255,255,.9);}
  .lb-modal__ic{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#EAF2FF;background:#2073E6;box-shadow:inset 0 0 15px rgba(120,190,255,.7),inset 0 1px 0 rgba(255,255,255,.3);}
  .lb-modal__label{font-size:14px;font-weight:600;color:var(--lb-ink);}
  .lb-modal__gets{font-size:12px;color:var(--lb-ink-mute);line-height:1.4;}
  @keyframes lb-fade{from{opacity:0;}to{opacity:1;}}
  .lb-praclist{display:flex;flex-direction:column;gap:14px;}

  /* инлайн-строка вставки (когда видео/материалов ещё нет) */
  .lb-inline-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:6px 2px;}
  .lb-inline-add{display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;color:var(--lb-ink-mute);
    background:0;border:0;padding:5px 4px;border-radius:8px;transition:color .15s,background .12s;}
  .lb-inline-add:hover{color:var(--lb-acc-deep);background:rgba(43,143,255,.06);}
  .lb-inline-link{flex:1 1 220px;min-width:160px;font-family:inherit;font-size:14px;color:var(--lb-ink-sub);padding:6px 2px;border:0;border-bottom:1px solid var(--lb-line);background:0;transition:border-color .15s;}
  .lb-inline-link::placeholder{color:var(--lb-ink-faint);}
  .lb-inline-link:focus{outline:0;border-bottom-color:var(--lb-line-strong);}

  /* видео — отдельный плеер на всю ширину конспекта */
  .lb-video{position:relative;display:flex;flex-direction:column;gap:12px;padding:0;}
  .lb-video__player{position:relative;aspect-ratio:16/9;width:100%;border-radius:14px;overflow:hidden;background:#0A0A0C;
    border:1px solid var(--lb-line);box-shadow:0 14px 34px -20px rgba(8,16,44,.5),inset 0 0 0 1px rgba(255,255,255,.04);}
  .lb-video__player iframe,.lb-video__player video{width:100%;height:100%;border:0;display:block;}
  .lb-video__thumb{display:grid;place-items:center;width:100%;height:100%;color:#fff;background:linear-gradient(150deg,#161618,#0A0A0C);}
  .lb-video__bar{display:flex;align-items:center;gap:12px;}
  .lb-video__b{flex:1 1 auto;min-width:0;}
  .lb-video__t{font-family:inherit;font-size:15px;font-weight:600;color:var(--lb-ink);background:transparent;border:0;outline:0;width:100%;padding:0;}
  .lb-video__t::placeholder{color:var(--lb-ink-faint);}
  .lb-video__s{font-size:12.5px;color:var(--lb-ink-mute);margin-top:2px;}
  /* пустое состояние видео — карточка загрузки */
  .lb-vdrop{display:flex;flex-direction:column;gap:14px;padding:8px 0 2px;}
  .lb-vdrop__card{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;cursor:pointer;padding:26px 22px;border-radius:16px;
    background:rgba(255,255,255,.6);border:1.5px dashed var(--lb-line-strong);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);transition:border-color .14s,background .14s;}
  .lb-vdrop__card:hover{background:rgba(255,255,255,.85);border-color:var(--lb-ink-mute);}
  .lb-vdrop__ic{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;color:#EAF2FF;background:#2073E6;box-shadow:inset 0 0 16px rgba(120,190,255,.7),inset 0 1px 0 rgba(255,255,255,.3);}
  .lb-vdrop__t{font-family:var(--lb-display);font-size:15px;font-weight:600;color:var(--lb-ink);letter-spacing:-.01em;}
  .lb-vdrop__s{font-size:12.5px;color:var(--lb-ink-mute);line-height:1.5;max-width:300px;}
  .lb-vdrop__or{display:flex;align-items:center;gap:12px;width:100%;color:var(--lb-ink-mute);font-size:12px;font-weight:600;}
  .lb-vdrop__or::before,.lb-vdrop__or::after{content:'';flex:1;height:1px;background:var(--lb-line);}
  /* кастомный видеоплеер (загруженный файл) — жидкое стекло, Apple TV/iOS
     референс: трио круглых frosted-кнопок (±10с + play/pause), нижняя
     стеклянная панель со скрабером. Тот же рецепт, что у .le-gv в учебном
     модуле — конструктор и урок ученика должны выглядеть одной семьёй. */
  .lb-vp{position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#08080A;border:1px solid var(--lb-line);
    box-shadow:0 14px 34px -20px rgba(8,16,44,.55),inset 0 0 0 1px rgba(255,255,255,.04);cursor:pointer;}
  .lb-vp video{width:100%;height:100%;object-fit:contain;display:block;background:#08080A;}
  .lb-vp__trio{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;gap:22px;
    opacity:0;transition:opacity .28s cubic-bezier(.23,1,.32,1);pointer-events:none;}
  .lb-vp.is-shown .lb-vp__trio{opacity:1;pointer-events:auto;}
  .lb-vp__glass{display:grid;place-items:center;cursor:pointer;color:#fff;border-radius:50%;
    background:rgba(8,9,14,.42);-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);
    border:1.5px solid rgba(255,255,255,.55);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 10px 26px -12px rgba(0,0,0,.55);
    transition:transform .14s cubic-bezier(.23,1,.32,1),background .15s;}
  .lb-vp__glass:hover{background:rgba(8,9,14,.58);}
  .lb-vp__glass:active{transform:scale(.92);}
  .lb-vp__glass--side{width:40px;height:40px;}
  .lb-vp__glass--main{width:60px;height:60px;}
  .lb-vp__glass--main svg{margin-left:2px;}
  .lb-vp.is-playing .lb-vp__glass--main svg{margin-left:0;}
  .lb-vp__bar{position:absolute;left:10px;right:10px;bottom:10px;z-index:2;display:flex;align-items:center;gap:10px;height:38px;padding:0 12px;border-radius:12px;
    background:rgba(16,22,40,.42);-webkit-backdrop-filter:blur(22px) saturate(1.7);backdrop-filter:blur(22px) saturate(1.7);
    border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.22),0 10px 24px -16px rgba(2,8,28,.55);
    opacity:0;transform:translateY(6px);transition:opacity .25s,transform .25s;pointer-events:none;}
  .lb-vp.is-shown .lb-vp__bar{opacity:1;transform:none;pointer-events:auto;}
  .lb-vp__track{position:relative;flex:1 1 auto;height:16px;display:flex;align-items:center;cursor:pointer;}
  .lb-vp__track::before{content:'';position:absolute;left:0;right:0;top:50%;height:4px;border-radius:99px;background:rgba(255,255,255,.22);transform:translateY(-50%);}
  .lb-vp__fill{position:absolute;left:0;top:50%;height:4px;border-radius:99px;background:#fff;transform:translateY(-50%);pointer-events:none;}
  .lb-vp__dot{position:absolute;top:50%;width:10px;height:10px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.4);transform:translate(-50%,-50%);pointer-events:none;}
  .lb-vp__ic{flex:0 0 auto;width:24px;height:24px;display:grid;place-items:center;color:rgba(255,255,255,.86);background:0;border:0;cursor:pointer;border-radius:7px;transition:color .14s,background .14s;}
  .lb-vp__ic:hover{color:#fff;background:rgba(255,255,255,.12);}
  .lb-vp__time{flex:0 0 auto;font-size:11px;font-weight:600;color:rgba(255,255,255,.92);letter-spacing:.01em;font-variant-numeric:tabular-nums;}
  .lb-vp__time--mute{color:rgba(255,255,255,.55);}

  /* материалы — вложения в строку (Gmail-style) */
  .lb-mats{display:flex;flex-wrap:wrap;gap:8px;padding:4px 2px;}
  .lb-mat{display:inline-flex;align-items:center;gap:7px;padding:6px 6px 6px 9px;border-radius:9px;background:rgba(22,32,59,.045);border:1px solid var(--lb-line);font-size:13px;font-weight:500;color:var(--lb-ink);}
  .lb-mat svg{color:var(--lb-ink-mute);}
  .lb-mat__t{background:0;border:0;font:inherit;color:inherit;font-weight:600;outline:0;min-width:54px;max-width:160px;}
  .lb-mat__x{width:18px;height:18px;border-radius:5px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-mute);background:0;border:0;transition:color .15s;}
  .lb-mat__x:hover{color:var(--lb-rose);}

  /* ── ПОТОК ДОКУМЕНТА: блоки + gutter «+» + drag handle ──────────────────── */
  .lb-flow{margin-top:2px;position:relative;}
  .lb-flow__h{font-family:var(--lb-display);font-size:14px;font-weight:600;color:var(--lb-ink);letter-spacing:-.01em;margin:0 0 16px;}

  /* Отступ между блоками задаётся ИНЛАЙН-СТИЛЕМ из JS (docRowGap) — ReorderList
     оборачивает каждую строку в свой .lb-rw, поэтому соседние .lb-row не
     являются настоящими DOM-сиблингами и CSS-комбинаторы (:first-child, +)
     тут физически не работают. margin-top ниже — только базовый сброс. */
  .lb-row{position:relative;border-radius:12px;transition:background .12s;}
  .lb-row__gutter{position:absolute;left:-103px;top:11px;display:flex;align-items:flex-start;gap:1px;opacity:0;transition:opacity .15s;z-index:2;}
  .lb-row:hover .lb-row__gutter,.lb-row.is-focus .lb-row__gutter{opacity:1;}
  .lb-handle{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;color:var(--lb-ink-mute);cursor:grab;background:0;border:0;touch-action:none;flex:0 0 auto;transition:color .15s,background .15s;}
  .lb-handle:hover{color:var(--lb-ink-sub);background:rgba(22,32,59,.06);}
  .lb-handle:active{cursor:grabbing;}
  .lb-gdel{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;color:var(--lb-ink-mute);cursor:pointer;background:0;border:0;flex:0 0 auto;transition:color .15s,background .15s;}
  .lb-gdel:hover{color:var(--lb-rose);background:rgba(210,96,79,.1);}
  .lb-plus{width:24px;height:24px;border-radius:7px;display:grid;place-items:center;color:var(--lb-ink-mute);cursor:pointer;background:0;border:0;flex:0 0 auto;transition:color .15s,background .15s;}
  .lb-plus:hover{color:var(--lb-acc-deep);background:var(--lb-acc-soft);}
  .lb-row__body{min-width:0;padding:4px 0;}
  .lb-row.is-dragging .lb-row__body{opacity:.32;}
  .lb-row.is-dropbefore::before,.lb-row.is-dropafter::after{content:'';position:absolute;left:0;right:0;height:2px;border-radius:99px;background:var(--lb-acc);box-shadow:0 0 10px rgba(43,143,255,.6);z-index:2;}
  .lb-row.is-dropbefore::before{top:-1px;} .lb-row.is-dropafter::after{bottom:-1px;}

  /* текстовые блоки — contentEditable */
  .lb-ce{font-family:var(--lb-text);outline:0;border-radius:8px;padding:3px 7px;min-height:1.7em;line-height:1.6;cursor:text;white-space:pre-wrap;}
  .lb-ce b,.lb-ce strong{font-weight:700;} .lb-ce i,.lb-ce em{font-style:italic;}
  .lb-ce--h{font-family:var(--lb-display);font-size:27px;font-weight:600;letter-spacing:-.024em;line-height:1.18;color:var(--lb-ink);}
  .lb-ce--p{font-size:16.5px;line-height:1.7;color:var(--lb-ink);}
  .lb-ce--q{position:relative;font-family:var(--lb-display);font-size:18.5px;font-weight:500;font-style:normal;color:var(--lb-ink);line-height:1.5;
    margin:4px 0;padding:15px 20px 15px 52px;border-radius:14px;background:rgba(43,143,255,.05);}
  .lb-ce--q::before{content:'\\201C';position:absolute;left:15px;top:8px;font-family:Georgia,'Times New Roman',serif;font-size:50px;line-height:1;color:rgba(32,115,230,.3);pointer-events:none;}
  .lb-ce:empty::before{content:attr(data-ph);color:var(--lb-ink-mute);}

  /* списки */
  .lb-list{margin:2px 0;padding-left:0;display:flex;flex-direction:column;gap:1px;}
  .lb-list__i{display:flex;align-items:stretch;gap:13px;min-height:32px;}
  .lb-list__mk{flex:0 0 24px;display:flex;align-items:center;justify-content:center;user-select:none;}
  .lb-list__dot{width:7px;height:7px;border-radius:50%;background:var(--lb-acc);}
  .lb-list__num{font-family:var(--lb-display);font-size:14px;font-weight:600;color:var(--lb-acc-deep);font-variant-numeric:tabular-nums;line-height:1;}
  .lb-list__in{flex:1 1 auto;font-family:inherit;font-size:16px;line-height:1.5;color:var(--lb-ink);padding:4px 8px;border:0;background:0;border-radius:8px;transition:background .12s;}
  .lb-list__in:focus{outline:0;background:rgba(22,32,59,.04);}
  .lb-list__x{flex:0 0 auto;width:24px;height:24px;border-radius:7px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-faint);background:0;border:0;opacity:0;transition:color .15s,opacity .15s,background .15s;}
  .lb-list__i:hover .lb-list__x{opacity:1;} .lb-list__x:hover{color:var(--lb-rose);background:rgba(210,96,79,.1);}
  .lb-listadd{align-self:flex-start;display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;color:var(--lb-ink-mute);background:0;border:0;padding:6px 9px 6px 4px;border-radius:8px;transition:background .12s,color .12s;margin-top:4px;}
  .lb-listadd:hover{background:rgba(22,32,59,.04);color:var(--lb-ink);}

  /* спец-блоки встроены в поток — отступы задаются по типу блока (.lb-row--*) */
  .lb-flowlist{display:flex;flex-direction:column;gap:0;}

  /* спец-блоки (аудио/материал) — тихий ряд: нейтральная поверхность, сапфир только на иконке */
  .lb-aud,.lb-matblk{display:flex;align-items:center;gap:11px;flex-wrap:wrap;padding:10px 12px;border-radius:12px;
    background:rgba(255,255,255,.55);border:1px solid var(--lb-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);
    transition:border-color .14s,background .14s;}
  .lb-aud:hover,.lb-matblk:hover{background:rgba(255,255,255,.82);border-color:var(--lb-line-strong);}
  .lb-aud>svg:first-child,.lb-matblk>svg:first-child{flex:0 0 auto;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;padding:5px;color:#fff;background:var(--lb-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.22);}

  /* СЛОВО — словарная карточка: тайл-иероглиф + стопка «пиньинь / перевод» + озвучка */
  .lb-word{display:flex;align-items:center;gap:15px;padding:10px 13px 10px 10px;border-radius:15px;
    background:linear-gradient(180deg,rgba(255,255,255,.8),rgba(247,250,255,.5));border:1px solid var(--lb-line);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.85),0 1px 2px rgba(18,28,58,.03);transition:border-color .14s,box-shadow .14s;}
  .lb-word:hover{border-color:var(--lb-line-strong);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 10px 24px -18px rgba(18,28,58,.24);}
  .lb-word__hz{flex:0 0 auto;field-sizing:content;width:auto;min-width:56px;max-width:210px;height:56px;padding:0 16px;border-radius:12px;text-align:center;box-sizing:border-box;
    font-family:var(--lb-display);font-size:28px;font-weight:600;color:var(--lb-acc-deep);letter-spacing:1px;line-height:56px;
    background:var(--lb-acc-soft);border:0;outline:0;}
  .lb-word__fields{display:flex;flex-direction:column;gap:1px;flex:1 1 auto;min-width:0;}
  .lb-word__py{font-family:inherit;font-size:13px;font-weight:500;color:var(--lb-ink-mute);background:transparent;border:0;outline:0;width:100%;font-variant-numeric:tabular-nums;padding:0;}
  .lb-word__ru{font-family:inherit;font-size:15.5px;font-weight:500;color:var(--lb-ink);background:transparent;border:0;outline:0;width:100%;padding:1px 0 0;}
  .lb-word__say{flex:0 0 auto;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;cursor:pointer;color:var(--lb-acc-deep);background:rgba(43,143,255,.08);border:0;transition:background .12s,transform .1s;}
  .lb-word__say:hover{background:rgba(43,143,255,.16);} .lb-word__say:active{transform:scale(.92);}

  /* общая «×» — удаление строки/блока, проявляется на hover */
  .lb-row__x{flex:0 0 auto;width:26px;height:26px;border-radius:7px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-mute);background:transparent;border:0;opacity:0;transition:color .15s,opacity .15s;}
  .lb-row:hover .lb-row__x,.lb-word:hover .lb-row__x,.lb-video:hover .lb-row__x,.lb-aud:hover .lb-row__x,.lb-matblk:hover .lb-row__x{opacity:1;}
  .lb-row__x:hover{color:var(--lb-rose);opacity:1;}

  /* изображение — просто картинка + подпись */
  .lb-img img{display:block;max-width:100%;border-radius:10px;}
  .lb-img__bar{display:flex;align-items:center;gap:8px;margin-top:6px;}
  .lb-capin{flex:1;font-family:inherit;font-size:13px;color:var(--lb-ink-mute);background:transparent;border:0;border-bottom:1px solid transparent;outline:0;transition:border-color .15s;padding:2px 0;}
  .lb-capin::placeholder{color:var(--lb-ink-faint);}
  .lb-capin:focus{border-bottom-color:var(--lb-line-strong);}
  .lb-img-empty{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}

  /* аудио — поле названия/ссылки (база ряда общая выше) */
  .lb-aud{color:var(--lb-acc-deep);}
  .lb-aud__t,.lb-aud__u{font-family:inherit;font-size:14px;background:transparent;border:0;border-bottom:1px solid transparent;outline:0;transition:border-color .15s;padding:3px 0;}
  .lb-aud__t{font-weight:600;color:var(--lb-ink);flex:1 1 120px;min-width:0;}
  .lb-aud__u{color:var(--lb-ink-mute);flex:2 1 150px;min-width:0;}
  .lb-aud__t:focus,.lb-aud__u:focus{border-bottom-color:var(--lb-line-strong);}

  /* материал-ссылка — поле названия/ссылки (база ряда общая выше) */
  .lb-matblk{color:var(--lb-acc-deep);}
  .lb-matblk__t{font-family:inherit;font-size:14px;font-weight:600;color:var(--lb-ink);background:transparent;border:0;border-bottom:1px solid transparent;outline:0;flex:1 1 120px;min-width:0;padding:3px 0;transition:border-color .15s;}
  .lb-matblk__u{font-family:inherit;font-size:13px;color:var(--lb-ink-mute);background:transparent;border:0;border-bottom:1px solid transparent;outline:0;flex:2 1 150px;min-width:0;padding:3px 0;transition:border-color .15s;}
  .lb-matblk__t:focus,.lb-matblk__u:focus{border-bottom-color:var(--lb-line-strong);}
  /* загруженный файл материала — чип с именем и размером */
  .lb-matblk__file{flex:1 1 auto;display:inline-flex;align-items:center;gap:8px;min-width:0;padding:5px 6px 5px 11px;border-radius:9px;background:rgba(22,32,59,.045);border:1px solid var(--lb-line);}
  .lb-matblk__fname{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:600;color:var(--lb-ink);}
  .lb-matblk__fsize{flex:0 0 auto;font-size:11.5px;font-weight:500;color:var(--lb-ink-mute);font-variant-numeric:tabular-nums;}
  .lb-matblk__fx{flex:0 0 auto;width:20px;height:20px;border-radius:6px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-mute);background:0;border:0;transition:color .14s,background .14s;}
  .lb-matblk__fx:hover{color:var(--lb-rose);background:rgba(210,96,79,.1);}

  /* ── Выноски: «Подсказка» (лёгкая заметка) ≠ «Важно» (правило-карточка) ── */
  .lb-callout__in{flex:1 1 auto;min-width:0;}
  .lb-callout__ce{font-family:inherit;font-size:15px;line-height:1.55;background:0;outline:0;overflow-wrap:break-word;word-break:break-word;}
  .lb-callout__ce:empty::before{content:attr(data-ph);opacity:.55;}
  /* Подсказка — мягкая золотая заметка с иконкой-чипом */
  .lb-callout--hint{display:flex;gap:11px;align-items:flex-start;padding:11px 13px;border-radius:13px;background:rgba(226,165,46,.08);border:1px solid rgba(226,165,46,.24);}
  .lb-callout--hint .lb-callout__ic{flex:0 0 26px;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:#fff;background:#D49A33;box-shadow:inset 0 1px 0 rgba(255,255,255,.28);margin-top:1px;}
  .lb-callout--hint .lb-callout__ce{color:#6E4F12;font-weight:500;}
  .lb-callout--hint .lb-callout__ce:empty::before{color:#9A7A3A;opacity:.8;}
  .lb-callout--hint .lb-row__x{margin-top:2px;}
  /* Важно — ключевое правило: шапка-лейбл + тело, акцентная подложка, левая грань */
  .lb-callout--imp{position:relative;display:flex;flex-direction:column;gap:6px;padding:11px 15px 13px 18px;border-radius:13px;background:rgba(43,143,255,.06);border:1px solid var(--lb-acc-line);}
  .lb-callout--imp::before{content:'';position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:99px;background:var(--lb-acc);}
  .lb-callout--imp .lb-callout__head{display:flex;align-items:center;gap:7px;color:var(--lb-acc-deep);font-family:var(--lb-display);font-size:12.5px;font-weight:700;}
  .lb-callout--imp .lb-callout__head>span{flex:1 1 auto;}
  .lb-callout--imp .lb-callout__head svg{flex:0 0 auto;}
  .lb-callout--imp .lb-callout__head .lb-row__x{margin:0;}
  .lb-callout--imp .lb-callout__ce{color:var(--lb-ink);}

  /* ── Спойлер (самопроверка): вопрос виден, ответ «закрыт» штриховкой ── */
  .lb-spoiler{border-radius:14px;border:1px solid var(--lb-line);background:rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);overflow:hidden;}
  .lb-spoiler__head{display:flex;align-items:center;gap:10px;padding:10px 12px;border-bottom:1px dashed var(--lb-line);}
  .lb-spoiler__ic{flex:0 0 26px;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:#fff;background:var(--lb-acc-deep);box-shadow:inset 0 1px 0 rgba(255,255,255,.22);}
  .lb-spoiler__q{flex:1 1 auto;min-width:0;font-family:inherit;font-size:14.5px;font-weight:600;color:var(--lb-ink);background:0;border:0;outline:0;padding:0;}
  .lb-spoiler__a{padding:12px 14px 8px;font-family:inherit;font-size:15px;line-height:1.55;color:var(--lb-ink);outline:0;overflow-wrap:break-word;word-break:break-word;min-height:1.7em;
    background:repeating-linear-gradient(135deg,rgba(43,143,255,.05),rgba(43,143,255,.05) 9px,rgba(43,143,255,.09) 9px,rgba(43,143,255,.09) 18px);}
  .lb-spoiler__a:empty::before{content:attr(data-ph);color:var(--lb-ink-mute);opacity:.75;}
  .lb-spoiler__note{display:flex;align-items:center;gap:6px;padding:7px 14px 9px;font-size:11.5px;font-weight:500;color:var(--lb-ink-mute);}
  .lb-spoiler__note svg{flex:0 0 auto;opacity:.7;}

  /* ── Пример — фраза в контексте: озвучка + иероглифы / чтение / перевод ── */
  .lb-example{display:flex;align-items:flex-start;gap:13px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.55);border:1px solid var(--lb-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);transition:border-color .14s,background .14s;}
  .lb-example:hover{background:rgba(255,255,255,.82);border-color:var(--lb-line-strong);}
  .lb-example__say{flex:0 0 34px;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;cursor:pointer;color:var(--lb-acc-deep);background:rgba(43,143,255,.08);border:0;margin-top:2px;transition:background .12s,transform .1s;}
  .lb-example__say:hover{background:rgba(43,143,255,.16);} .lb-example__say:active{transform:scale(.92);}
  .lb-example__fields{display:flex;flex-direction:column;gap:3px;flex:1 1 auto;min-width:0;}
  .lb-example__hz{font-family:var(--lb-display);font-size:20px;font-weight:600;color:var(--lb-ink);background:0;border:0;outline:0;width:100%;padding:0;letter-spacing:.5px;}
  .lb-example__py{font-size:13px;color:var(--lb-acc-deep);font-weight:500;background:0;border:0;outline:0;width:100%;padding:0;font-variant-numeric:tabular-nums;}
  .lb-example__ru{font-size:14.5px;color:var(--lb-ink-sub);background:0;border:0;outline:0;width:100%;padding:2px 0 0;}

  .lb-divider{height:1px;background:var(--lb-line);margin:6px 4px;border:0;}
  .lb-flow__endplus{display:flex;justify-content:flex-start;margin-top:14px;padding-left:2px;}
  .lb-endplus{display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;color:var(--lb-ink-mute);
    padding:6px 10px;border-radius:8px;background:0;border:0;transition:color .15s,background .12s;}
  .lb-endplus:hover{color:var(--lb-acc-deep);background:rgba(43,143,255,.06);}

  /* конспект — чистый лист прямо на холсте: без рамки-карточки, документ дышит */
  .lb-konspect{position:relative;margin-top:10px;padding:0;background:none;border:0;box-shadow:none;}
  .lb-konspect__head{display:block;padding:0 2px 8px;}
  .lb-konspect__label{display:flex;flex-direction:column;gap:5px;}
  .lb-konspect__title{font-family:var(--lb-display);font-size:23px;font-weight:600;letter-spacing:-.024em;color:var(--lb-ink);line-height:1.12;}
  .lb-konspect__hint{font-size:13px;font-weight:500;color:var(--lb-ink-mute);line-height:1.45;}

  /* toolbar — отдельная скругленная панель в шапке конспекта (статичная: не перекрывает и не мешает выделению текста) */
  .lb-toolbar{display:flex;width:fit-content;max-width:100%;margin:0 auto 22px;
    align-items:center;gap:2px;padding:6px 8px;border-radius:14px;
    background:rgba(255,255,255,.92);backdrop-filter:blur(16px) saturate(1.15);
    border:1px solid var(--lb-line-strong);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.95), 0 10px 26px -14px rgba(18,28,58,.26);}
  .lb-tbgrp{display:flex;align-items:center;gap:0;}
  .lb-tbsep{width:1px;height:20px;background:var(--lb-line);margin:0 8px;flex:0 0 auto;}
  .lb-tb{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-sub);background:transparent;border:0;transition:color .12s,background .12s,box-shadow .12s;}
  .lb-tb:hover:not(:disabled){color:var(--lb-ink);background:rgba(22,32,59,.06);}
  .lb-tb.is-on{color:var(--lb-acc-ink);background:var(--lb-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,143,255,.35),inset 0 1px 0 rgba(255,255,255,.6);}
  .lb-tb:disabled{opacity:.32;cursor:default;}
  /* всплывающая панель форматирования по выделению текста (Notion-style bubble) */
  .lb-bb{position:fixed;z-index:80;transform:translateX(-50%);display:inline-flex;align-items:center;gap:1px;padding:5px 6px;border-radius:12px;
    background:#0F1C38;box-shadow:0 14px 32px -10px rgba(8,16,44,.5),inset 0 1px 0 rgba(255,255,255,.08);animation:lb-pop .14s cubic-bezier(.23,1,.32,1);}
  .lb-bb__b{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;cursor:pointer;color:rgba(255,255,255,.82);background:transparent;border:0;transition:background .12s,color .12s;}
  .lb-bb__b:hover{background:rgba(255,255,255,.16);color:#fff;}
  .lb-bb__sep{width:1px;height:18px;background:rgba(255,255,255,.18);margin:0 5px;flex:0 0 auto;}
  .lb-backdrop{position:fixed;inset:0;z-index:66;background:transparent;}
  .lb-palette{z-index:70;}

  /* ── вкладка ПРАКТИКА: карточки заданий ─────────────────────────────────── */
  .lb-prac{max-width:920px;margin:0 auto;display:flex;flex-direction:column;gap:18px;}
  .lb-pcard{position:relative;border-radius:18px;background:rgba(255,255,255,.7);border:1px solid var(--lb-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:border-color .15s,box-shadow .15s;}
  .lb-pcard.is-sel{border-color:var(--lb-acc-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),0 0 0 4px rgba(43,143,255,.07);}
  .lb-pcard__head{display:flex;align-items:center;gap:12px;padding:15px 16px;cursor:pointer;}
  .lb-pcard__grip{flex:0 0 auto;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;color:var(--lb-ink-faint);cursor:grab;background:0;border:0;touch-action:none;transition:color .15s,background .15s;}
  .lb-pcard__grip:hover{color:var(--lb-ink-sub);background:rgba(22,32,59,.06);}
  .lb-pcard__mv{display:flex;flex-direction:column;gap:1px;flex:0 0 auto;}
  .lb-pcard__mvb{width:22px;height:13px;border-radius:5px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-faint);background:0;border:0;transition:color .14s,background .14s;}
  .lb-pcard__mvb:hover:not(:disabled){color:var(--lb-acc-deep);background:var(--lb-acc-soft);}
  .lb-pcard__mvb:disabled{opacity:.22;cursor:default;}
  .lb-pcard__n{flex:0 0 26px;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;font-size:12px;font-weight:700;color:var(--lb-ink-mute);background:rgba(22,32,59,.05);font-variant-numeric:tabular-nums;}
  .lb-pcard.is-sel .lb-pcard__n{color:#fff;background:var(--lb-acc-deep);}
  .lb-pcard__ic{flex:0 0 30px;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:var(--lb-acc-deep);background:var(--lb-acc-soft);}
  .lb-pcard__b{flex:1 1 auto;min-width:0;}
  .lb-pcard__t{font-size:14px;font-weight:600;color:var(--lb-ink);letter-spacing:-.1px;display:flex;align-items:center;gap:8px;}
  .lb-pcard__s{font-size:12.5px;color:var(--lb-ink-mute);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .lb-dotw{width:7px;height:7px;border-radius:50%;background:var(--lb-warn);box-shadow:0 0 0 3px rgba(168,116,28,.14);flex:0 0 auto;}
  .lb-pcard__chev{flex:0 0 auto;color:var(--lb-ink-mute);transition:transform .2s cubic-bezier(.23,1,.32,1);}
  .lb-pcard.is-open .lb-pcard__chev{transform:rotate(180deg);}
  .lb-pcard__body{padding:4px 16px 18px;border-top:1px solid var(--lb-line);margin-top:0;}
  .lb-pcard.is-open .lb-pcard__body{display:block;} .lb-pcard:not(.is-open) .lb-pcard__body{display:none;}
  /* дублировать + удалить: сдвинуты ЛЕВЕЕ шеврона-раскрытия (шеврон всегда крайний
     справа), иначе корзина и стрелка накладывались друг на друга */
  .lb-pcard__acts{position:absolute;right:40px;top:13px;display:flex;gap:4px;opacity:0;transition:opacity .15s;
    background:rgba(250,251,254,.9);border-radius:10px;-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);}
  .lb-pcard:hover .lb-pcard__acts,.lb-pcard.is-open .lb-pcard__acts{opacity:1;}
  .lb-pcard__chev{position:relative;z-index:1;}
  .lb-ib{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-mute);background:rgba(22,32,59,.05);border:0;transition:color .15s,background .15s;}
  .lb-ib:hover{color:var(--lb-acc-deep);background:var(--lb-acc-soft);} .lb-ib.del:hover{color:var(--lb-rose);background:rgba(210,96,79,.1);}

  /* поля практики */
  .lb-field{margin-top:16px;} .lb-field:first-child{margin-top:14px;}
  .lb-label{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:700;color:var(--lb-ink-sub);margin-bottom:8px;letter-spacing:-.1px;}
  .lb-label__hint{font-size:11px;font-weight:500;color:var(--lb-ink-mute);}
  .lb-in,.lb-ta{width:100%;font-family:inherit;font-size:14.5px;font-weight:500;color:var(--lb-ink);padding:11px 14px;border-radius:11px;
    background:rgba(255,255,255,.75);border:1.5px solid var(--lb-line);transition:border-color .15s,box-shadow .15s;}
  .lb-in::placeholder,.lb-ta::placeholder{color:var(--lb-ink-mute);}
  .lb-in:focus,.lb-ta:focus{outline:0;border-color:rgba(21,32,59,.32);box-shadow:0 0 0 3px rgba(21,32,59,.06);}
  .lb-ta{resize:vertical;min-height:76px;line-height:1.55;}
  .lb-in--hz{font-size:19px;font-weight:600;color:var(--lb-acc-deep);text-align:center;}
  .lb-rows{display:flex;flex-direction:column;gap:9px;}
  .lb-rowp{display:flex;align-items:center;gap:9px;}
  .lb-rowp .lb-in{flex:1 1 auto;}
  .lb-rn{flex:0 0 22px;width:22px;height:22px;border-radius:7px;display:grid;place-items:center;font-size:11px;font-weight:700;color:var(--lb-ink-mute);background:rgba(22,32,59,.05);font-variant-numeric:tabular-nums;}
  .lb-correct{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:700;color:var(--lb-ink-mute);
    padding:8px 11px;border-radius:10px;background:rgba(255,255,255,.65);border:1.5px solid var(--lb-line);white-space:nowrap;transition:color .15s,background .15s,border-color .15s;}
  .lb-correct.on{color:var(--lb-jade);background:#E2F4EA;border-color:rgba(46,160,110,.5);}
  .lb-correct__tick{width:16px;height:16px;border-radius:5px;display:grid;place-items:center;color:#fff;background:rgba(22,32,59,.16);}
  .lb-correct.on .lb-correct__tick{background:var(--lb-jade);}
  .lb-rowdel{flex:0 0 auto;width:32px;height:32px;border-radius:9px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-mute);background:rgba(22,32,59,.05);border:0;transition:color .15s,background .15s;}
  .lb-rowdel:hover{color:var(--lb-rose);background:rgba(210,96,79,.1);}
  .lb-pair{display:grid;grid-template-columns:22px minmax(0,1fr) 16px minmax(0,1fr) 32px;gap:9px;align-items:center;}
  .lb-pair__link{display:grid;place-items:center;color:var(--lb-ink-faint);}
  .lb-addrow{margin-top:10px;display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--lb-acc-deep);
    padding:8px 13px;border-radius:10px;background:var(--lb-acc-soft);border:0;transition:background .15s;}
  .lb-addrow:hover{background:rgba(43,143,255,.16);}
  .lb-tones{display:flex;gap:9px;flex-wrap:wrap;}
  .lb-tone{flex:1 1 0;min-width:90px;display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;padding:11px 6px;border-radius:11px;font-family:inherit;
    background:rgba(255,255,255,.65);border:1.5px solid var(--lb-line);transition:border-color .15s,background .15s;}
  .lb-tone:hover{border-color:var(--lb-acc-line);}
  .lb-tone.on{border-color:var(--lb-acc-line);background:rgba(238,244,255,.8);}
  .lb-tone__m{display:inline-flex;align-items:center;justify-content:center;color:var(--lb-acc-deep);}
  .lb-tone__m svg{display:block;}
  .lb-tone__n{font-size:10.5px;font-weight:600;color:var(--lb-ink-mute);} .lb-tone.on .lb-tone__n{color:var(--lb-acc-deep);}

  /* ── ПРАВЫЙ превью: рамка телефона ──────────────────────────────────────── */
  /* шапка и подпись — фиксированной высоты (flex:0 0 auto по умолчанию),
     сам мокап — растягивается на всё оставшееся место колонки (flex:1 1 auto),
     поэтому общая высота превью никогда не выталкивает скролл всей панели */
  .lb-prevh{flex:0 0 auto;width:100%;max-width:390px;display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
  .lb-prevh__t{font-size:15px;font-weight:700;color:var(--lb-ink);letter-spacing:-.015em;}
  .lb-prevh__s{font-size:11.5px;color:var(--lb-ink-mute);font-variant-numeric:tabular-nums;}
  .lb-phone__body .le-study.is-compact .le-h1{font-size:26px;letter-spacing:-.026em;}
  .lb-phone__body .le-study.is-compact .le-sub{font-size:13.5px;margin-top:10px;}
  .lb-phone{flex:1 1 auto;min-height:0;width:100%;max-width:384px;border-radius:48px;padding:9px;
    display:flex;
    background:linear-gradient(152deg,#171E33 0%,#0B1224 46%,#070C18 100%);
    box-shadow:0 44px 90px -30px rgba(8,14,34,.6),0 12px 30px -16px rgba(8,14,34,.5),
      inset 0 0 0 1.5px rgba(255,255,255,.07),inset 0 1.5px 1px rgba(255,255,255,.16),inset 0 -2px 2px rgba(0,0,0,.4);}
  /* поверхность экрана — светлый лавандово-синий режим B (как реальный кабинет),
     а не почти-белый: так белые стеклянные карточки внутри «всплывают», а превью
     перестаёт выглядеть «супер-бело» и пусто. */
  .lb-phone__screen{position:relative;border-radius:40px;overflow:hidden;background:
      radial-gradient(460px 320px at 88% -12%, rgba(120,158,255,.22), transparent 64%),
      linear-gradient(180deg,#ECF0FB 0%,#E6EBF7 58%,#EAEEF9 100%);flex:1 1 auto;min-height:0;width:100%;display:flex;flex-direction:column;
      box-shadow:inset 0 0 0 1px rgba(8,14,34,.5);}
  .lb-phone__island{position:absolute;left:50%;top:13px;transform:translateX(-50%);width:78px;height:23px;border-radius:99px;background:#05070E;z-index:6;
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.05),0 1px 3px rgba(0,0,0,.4);}
  .lb-phone__body{flex:1 1 auto;overflow-y:auto;padding:46px 16px 20px;}
  .lb-phone__body::-webkit-scrollbar{width:0;}
  /* превью теста = попап: сам урок остаётся сзади, но притемнён и не кликается.
     Шторку рисует сам Тренажёр (.lt-modal--in), позиционируясь в .lb-phone__screen. */
  .lb-phone__screen.has-sheet .lb-phone__body{overflow:hidden;}
  .lb-phone__body.is-behind{pointer-events:none;filter:saturate(.92);}
  .lb-prev__note{font-size:11.5px;color:var(--lb-ink-mute);margin-top:14px;text-align:center;line-height:1.5;max-width:320px;}
  .lb-prev-empty{width:100%;max-width:390px;padding:48px 24px;border-radius:20px;text-align:center;background:rgba(255,255,255,.4);border:1px dashed var(--lb-line);color:var(--lb-ink-mute);font-size:13px;line-height:1.55;}

  /* ── меню «+» (поповер) ────────────────────────────────────────────────── */
  .lb-menu{position:fixed;z-index:60;width:228px;max-height:min(380px,calc(100dvh - 24px));overflow-y:auto;border-radius:15px;padding:7px;background:rgba(252,253,255,.97);backdrop-filter:blur(14px);
    border:1px solid var(--lb-line);box-shadow:0 24px 56px -18px rgba(8,16,44,.4),inset 0 1px 0 rgba(255,255,255,.9);animation:lb-pop .16s cubic-bezier(.23,1,.32,1);}
  .lb-menu::-webkit-scrollbar{width:7px;} .lb-menu::-webkit-scrollbar-thumb{background:rgba(22,32,59,.14);border-radius:99px;}
  @keyframes lb-pop{from{opacity:0;transform:translateY(-6px) scale(.98);}to{opacity:1;transform:none;}}
  .lb-menu__g{font-size:11px;font-weight:700;color:var(--lb-ink-sub);padding:8px 11px 5px;}
  .lb-menu__i{display:flex;align-items:center;gap:11px;width:100%;text-align:left;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;color:var(--lb-ink);
    padding:8px 11px;border-radius:10px;background:0;border:0;transition:background .12s,color .12s;}
  .lb-menu__i:hover{background:var(--lb-acc-soft);color:var(--lb-acc-deep);}
  .lb-menu__ic{flex:0 0 28px;width:28px;height:28px;border-radius:8px;display:grid;place-items:center;color:var(--lb-acc-deep);background:var(--lb-acc-soft);}
  /* иконки-чипы с тихим внутренним сапфировым свечением — язык страницы урока */
  .lb-rlink__ic,.lb-card__ic,.lb-pcard__ic,.lb-menu__ic{box-shadow:inset 0 0 13px rgba(43,143,255,.24),inset 0 1px 0 rgba(255,255,255,.55);}
  .lb-menu__sep{height:1px;background:var(--lb-line);margin:5px 8px;}

  /* ── ghost перетаскивания ───────────────────────────────────────────────── */
  .lb-drag-ghost{position:fixed;top:0;left:0;z-index:9999;pointer-events:none;opacity:.94;border-radius:12px;
    box-shadow:0 24px 48px -12px rgba(8,16,44,.4);transform-origin:20px 16px;will-change:transform;}
  .lb-drag-ghost.lb-ghost--plain{transform:rotate(.5deg);}
  @media (prefers-reduced-motion: reduce){ .lb-drag-ghost{transform:none !important;} .lb-row,.lb-pcard,.lb-menu{transition:none;} }

  /* только мобилка — на десктопе скрыто */
  .lb-mnav{display:none;}
  .lb-mhead{display:none;}
  .lb-btn__txm{display:none;}

  @media (max-width:1240px){ .lb-body{grid-template-columns:240px minmax(0,1fr) 400px;} }
  @media (max-width:1080px){ .lb-body{grid-template-columns:230px minmax(0,1fr);} .lb-pane--prev{display:none;} }

  /* ── МОБИЛКА: одна панель за раз + нижний переключатель ─────────────────────
     На телефоне все три поверхности (структура / редактор / превью) достижимы
     через нижнюю навигацию; на экране всегда ровно одна — data-m на .lb-body. */
  @media (max-width:820px){
    .lb-body{grid-template-columns:1fr;}
    .lb-pane--rail,.lb-pane--center,.lb-pane--prev{display:none;}
    .lb-body[data-m="rail"] .lb-pane--rail{display:block;}
    .lb-body[data-m="editor"] .lb-pane--center{display:block;}
    .lb-body[data-m="preview"] .lb-pane--prev{display:flex;}
    .lb-pane--rail{border-right:0;}
    .lb-pane--prev{border-left:0;}
    .lb-pane{padding:20px 16px calc(80px + env(safe-area-inset-bottom,0px));}
    .lb-pane--center{padding:0 14px calc(96px + env(safe-area-inset-bottom,0px));}
    .lb-pane--prev{padding:14px 12px calc(84px + env(safe-area-inset-bottom,0px));}
    /* на десктопе .lb-doc держит 72px слева под колонку-гуттер; на телефоне это
       мёртвое поле — весь конспект уезжает вправо. Убираем, гуттер живёт справа. */
    .lb-doc{padding:6px 0 0;}
    /* на телефоне 38px-заголовок-инпут обрезается справа — уменьшаем кегль, чтобы влезало больше */
    .lb-titlein{font-size:27px;letter-spacing:-.025em;}

    /* липкие табы: прижаты к верху панели (top:0, без зазора-щели) + полноширинная
       маска-подложка, чтобы контент не просвечивал из-под пилюли при скролле */
    .lb-tabs{top:0;margin:0 -14px;padding:13px 14px 15px;
      background:linear-gradient(180deg,#F4F6FD 0%,#F4F6FD 80%,rgba(244,246,253,0) 100%);}

    /* ── топбар: назад · заголовок урока + статус · undo/redo · очистить · «Ученик»
       Заполняем центр названием урока (а не пустотой), автосохранение показываем
       строкой-статусом (кнопку «Сохранено» на мобилке прячем — autosave и так пишет),
       главную кнопку подписываем «Ученик», чтобы синий глаз не был ребусом. */
    .lb-top{gap:8px;padding:9px 12px;}
    .lb-brand,.lb-top__sp{display:none;}
    .lb-mhead{display:flex;flex-direction:column;justify-content:center;flex:1 1 auto;min-width:0;gap:1px;padding-left:2px;}
    .lb-mhead__t{font-family:var(--lb-display);font-size:14.5px;font-weight:700;letter-spacing:-.02em;color:var(--lb-ink);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .lb-mhead__s{font-size:11px;font-weight:500;color:var(--lb-ink-mute);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .lb-mhead__s.is-dirty{color:var(--lb-acc-deep);}
    .lb-history{flex:0 0 auto;}
    /* компактный верх на телефоне: undo/redo/очистить/сохранить — иконки без подписей */
    .lb-hbtn{padding:0;width:32px;justify-content:center;}
    .lb-hbtn__tx{display:none;}
    .lb-clearbtn{width:36px;padding:0;justify-content:center;}
    .lb-clearbtn__tx{display:none;}
    .lb-savebtn{width:38px;padding:0;justify-content:center;flex:0 0 auto;}
    .lb-savebtn__tx{display:none;}
    .lb-top .lb-btn__tx,.lb-top .lb-btn--primary .arr{display:none;}
    .lb-top .lb-btn__txm{display:inline;}
    .lb-top .lb-btn--primary{flex:0 0 auto;padding:9px 13px;gap:6px;font-size:13px;}

    /* нижняя навигация панелей */
    .lb-mnav{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;position:fixed;left:0;right:0;bottom:0;z-index:50;
      padding:7px 10px calc(7px + env(safe-area-inset-bottom,0px));
      background:rgba(248,250,254,.92);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);
      border-top:1px solid var(--lb-line);box-shadow:0 -12px 30px -18px rgba(21,32,59,.28);}
    .lb-mnav__b{display:flex;flex-direction:column;align-items:center;gap:3px;padding:7px 4px 6px;border-radius:13px;
      font-family:inherit;font-size:11px;font-weight:600;color:var(--lb-ink-mute);background:0;border:0;cursor:pointer;
      transition:color .15s,background .15s;-webkit-tap-highlight-color:transparent;}
    .lb-mnav__b.is-on{color:var(--lb-acc-deep);background:var(--lb-acc-soft);}
    .lb-mnav__b .lb-mnav__c{margin-left:5px;font-variant-numeric:tabular-nums;opacity:.7;}

    /* гуттер строки-документа: штатное место −103px слева уезжает за экран телефона.
       На мобилке при фокусе резервируем справа место (текст обтекает) и кладём туда
       панельку — она НЕ перекрывает контент. */
    .lb-row__gutter{left:auto;right:0;top:3px;gap:1px;padding:3px;border-radius:11px;
      background:rgba(255,255,255,.94);border:1px solid var(--lb-line);
      box-shadow:0 6px 16px -8px rgba(21,32,59,.3);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
    .lb-row:hover .lb-row__gutter{opacity:0;}
    .lb-row.is-focus .lb-row__gutter{opacity:1;}
    .lb-row.is-focus .lb-row__body{padding-right:106px;}
    .lb-handle,.lb-gdel,.lb-plus{width:31px;height:31px;}

    /* превью на самом телефоне: тоньше рамка, во всю ширину колонки */
    .lb-prevh{max-width:none;}
    .lb-phone{max-width:none;border-radius:36px;padding:7px;}
    .lb-prev__note{max-width:none;}
  }
  `;

  if (!document.getElementById('learn-build-styles')) {
    const el = document.createElement('style');
    el.id = 'learn-build-styles';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  const reducedMotion = (typeof window !== 'undefined' && window.matchMedia)
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;

  /* ══════════════════════════════════════════════════════════════════════════
     ReorderList — общий DnD-движок (pointer events). Переиспользуется для
     блоков документа и карточек практики. Commit-on-drop: массив мутирует
     ОДИН раз при pointerup (не на каждом move — иначе setLesson→автосейв).
     props: { items, keyFor, onReorder(from,to), renderRow(item,i,ctx),
              rowClassName, className, scrollRef, reduced, rowKey }
     ctx = { isDragging, isDropBefore, isDropAfter, gripProps }
     gripProps → вешать на handle: { onPointerDown }
     Слот: onReorder(from, to) — to это ИНДЕКС назначения (вставка ПЕРЕД ним,
     либо в конец если to === items.length).
  ═════════════════════════════════════════════════════════════════════════ */
  function ReorderList(props) {
    const { items, keyFor, onReorder, renderRow, rowClassName, className, scrollRef, reduced } = props;
    const [dragIdx, setDragIdx] = useState(null);
    const [dropSlot, setDropSlot] = useState(null); // 0..items.length
    const drag = useRef(null);
    const listRef = useRef(null);

    const cleanup = useCallback(() => {
      const d = drag.current;
      if (d) {
        if (d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
        if (d.scrollRaf) cancelAnimationFrame(d.scrollRaf);
        if (d.onMove) { d.target.removeEventListener('pointermove', d.onMove); d.target.removeEventListener('pointerup', d.onUp); d.target.removeEventListener('pointercancel', d.onUp); }
        try { if (d.target && d.pointerId != null) d.target.releasePointerCapture(d.pointerId); } catch (e) {}
      }
      drag.current = null;
      setDragIdx(null);
      setDropSlot(null);
    }, []);

    useEffect(() => () => cleanup(), [cleanup]);

    const measureMidYs = () => {
      const list = listRef.current;
      if (!list) return [];
      const rows = list.querySelectorAll('[data-row]');
      const mids = [];
      rows.forEach((r) => { const rc = r.getBoundingClientRect(); mids.push({ top: rc.top, mid: rc.top + rc.height / 2, bottom: rc.bottom }); });
      return mids;
    };

    const edgeScroll = (clientY) => {
      const d = drag.current;
      if (!d || !scrollRef || !scrollRef.current) return;
      const pane = scrollRef.current;
      const pr = pane.getBoundingClientRect();
      const zone = 56;
      let dir = 0;
      if (clientY < pr.top + zone) dir = -1;
      else if (clientY > pr.bottom - zone) dir = 1;
      if (dir === 0) { if (d.scrollRaf) { cancelAnimationFrame(d.scrollRaf); d.scrollRaf = 0; } return; }
      if (d.scrollRaf) return;
      const step = () => {
        const dd = drag.current;
        if (!dd) return;
        pane.scrollTop += dir * 7;
        dd.midYs = measureMidYs();
        dd.scrollRaf = requestAnimationFrame(step);
      };
      d.scrollRaf = requestAnimationFrame(step);
    };

    const onGripDown = (e, idx) => {
      if (items.length < 2) return;
      if (drag.current) return;
      const rowEl = e.currentTarget.closest('[data-row]');
      if (!rowEl) return;
      const target = e.currentTarget;
      try { target.setPointerCapture(e.pointerId); } catch (err) {}
      const rc = rowEl.getBoundingClientRect();
      drag.current = {
        idx, target, pointerId: e.pointerId,
        startX: e.clientX, startY: e.clientY,
        offX: e.clientX - rc.left, offY: e.clientY - rc.top,
        width: rc.width,
        moved: false, ghost: null, midYs: [], scrollRaf: 0,
        onMove: null, onUp: null,
      };
      const onMove = (ev) => { ev.preventDefault(); doMove(ev); };
      const onUp = (ev) => { doUp(ev); };
      drag.current.onMove = onMove; drag.current.onUp = onUp;
      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
      target.addEventListener('pointercancel', onUp);
    };

    const doMove = (e) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
      if (!d.moved) {
        const slop = e.pointerType === 'touch' ? 8 : 5;
        if (Math.abs(dx) < slop && Math.abs(dy) < slop) return;
        d.moved = true;
        setDragIdx(d.idx);
        const g = document.createElement('div');
        g.className = 'lb-drag-ghost' + (reduced ? '' : ' lb-ghost--plain');
        g.style.width = d.width + 'px';
        const rowEl = d.target.closest('[data-row]');
        if (rowEl) g.appendChild(rowEl.cloneNode(true));
        document.body.appendChild(g);
        d.ghost = g;
        d.midYs = measureMidYs();
      }
      if (d.ghost) {
        d.ghost.style.transform = 'translate(' + (e.clientX - d.offX) + 'px,' + (e.clientY - d.offY) + 'px)';
      }
      // вычислить слот
      d.midYs = measureMidYs();
      let slot = 0;
      for (let i = 0; i < d.midYs.length; i++) { if (e.clientY > d.midYs[i].mid) slot = i + 1; }
      if (slot !== dropSlotRef.current) { dropSlotRef.current = slot; setDropSlot(slot); }
      edgeScroll(e.clientY);
    };

    const dropSlotRef = useRef(null);
    const doUp = () => {
      const d = drag.current;
      if (!d) { cleanup(); return; }
      if (d.moved) {
        const slot = dropSlotRef.current;
        // slot — позиция вставки. Перевод в индекс назначения для onReorder(from,to):
        let to;
        if (slot <= d.idx) to = slot;
        else to = slot - 1;
        if (to !== d.idx && to >= 0 && to < items.length) onReorder(d.idx, to);
      }
      cleanup();
    };

    const ctxFor = (i) => ({
      isDragging: dragIdx === i,
      isDropBefore: dropSlot === i && dragIdx != null,
      isDropAfter: dropSlot === i + 1 && dragIdx != null,
      gripProps: { onPointerDown: (e) => onGripDown(e, i) },
    });

    return h('div', { className: (className || '') + ' lb-reorder', ref: listRef },
      items.map((item, i) => h('div', {
        key: keyFor ? keyFor(item, i) : i,
        'data-row': '',
        className: 'lb-rw' + (rowClassName ? ' ' + rowClassName : '')
          + (dragIdx === i ? ' is-dragging' : '')
          + (dropSlot === i && dragIdx != null ? ' is-dropbefore' : '')
          + (dropSlot === i + 1 && dragIdx != null && i === items.length - 1 ? ' is-dropafter' : ''),
      }, renderRow(item, i, ctxFor(i)))));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     Контент: marks ⇄ DOM (bold/italic). Чтение из contentEditable и запись.
  ═════════════════════════════════════════════════════════════════════════ */
  function readBlockFromDom(el) {
    const marks = [];
    let pos = 0;
    let text = '';
    const walk = (node, b, it, depth) => {
      const kids = node.childNodes;
      for (let k = 0; k < kids.length; k++) {
        const child = kids[k];
        if (child.nodeType === 3) {
          const val = (child.nodeValue || '').replace(/ /g, ' ');
          const len = val.length;
          if (len) {
            if (b) marks.push({ start: pos, end: pos + len, type: 'bold' });
            if (it) marks.push({ start: pos, end: pos + len, type: 'italic' });
            text += val; pos += len;
          }
        } else if (child.nodeName === 'BR') { text += '\n'; pos += 1; }
        else if (child.nodeName === 'B' || child.nodeName === 'STRONG') walk(child, true, it, depth + 1);
        else if (child.nodeName === 'I' || child.nodeName === 'EM') walk(child, b, true, depth + 1);
        else {
          if (depth === 0 && k > 0 && (child.nodeName === 'DIV' || child.nodeName === 'P')) { text += '\n'; pos += 1; }
          walk(child, b, it, depth + 1);
        }
      }
    };
    walk(el, false, false, 0);
    return { text: text, marks };
  }

  function applyBlockToDom(el, text, marks) {
    const str = String(text == null ? '' : text);
    if (!marks || !marks.length) { if (el.textContent !== str) el.textContent = str; return; }
    const n = str.length;
    const b = new Array(n).fill(false), it = new Array(n).fill(false);
    marks.forEach((m) => {
      if (!m || m.start == null || m.end == null) return;
      for (let k = Math.max(0, m.start); k < Math.min(n, m.end); k++) {
        if (m.type === 'bold') b[k] = true;
        if (m.type === 'italic') it[k] = true;
      }
    });
    const frag = document.createDocumentFragment();
    let buf = '', cb = false, ci = false;
    const flush = () => {
      if (!buf) return;
      let node = document.createTextNode(buf);
      if (cb && ci) { const bb = document.createElement('b'); const ii = document.createElement('i'); ii.appendChild(document.createTextNode(buf)); bb.appendChild(ii); node = bb; }
      else if (cb) { const bb = document.createElement('b'); bb.appendChild(document.createTextNode(buf)); node = bb; }
      else if (ci) { const ii = document.createElement('i'); ii.appendChild(document.createTextNode(buf)); node = ii; }
      frag.appendChild(node); buf = '';
    };
    for (let k = 0; k < n; k++) {
      if (b[k] !== cb || it[k] !== ci) { flush(); cb = b[k]; ci = it[k]; }
      buf += str.charAt(k);
    }
    flush();
    el.innerHTML = '';
    el.appendChild(frag);
  }

  /* Инлайн-markdown → {text, marks}. Разбирает **bold**, __bold__, *italic*,
     _italic_ и выкидывает маркеры, проставляя spans по нашей marks-модели
     (старт/конец — индексы в очищенном text). Если маркеров нет — text
     возвращается как есть, marks пуст. Совместимо с renderText/richText в
     learn-lesson (превью отрисует bold/italic). */
  function parseInline(src) {
    const str = String(src == null ? '' : src);
    const marks = [];
    let out = '';
    let i = 0;
    while (i < str.length) {
      const ch = str[i];
      // bold: ** или __
      if ((ch === '*' || ch === '_') && str[i + 1] === ch) {
        const close = str.indexOf(ch + ch, i + 2);
        if (close > i + 1) {
          const start = out.length;
          out += str.slice(i + 2, close);
          if (out.length > start) marks.push({ start, end: out.length, type: 'bold' });
          i = close + 2; continue;
        }
      }
      // italic: * или _ (одиночные, не часть двойного)
      if (ch === '*' || ch === '_') {
        let close = -1;
        for (let j = i + 1; j < str.length; j++) { if (str[j] === ch) { close = j; break; } }
        if (close > i + 1 && str[i + 1] !== ch && str[close + 1] !== ch && str[close - 1] !== ' ') {
          const start = out.length;
          out += str.slice(i + 1, close);
          if (out.length > start) marks.push({ start, end: out.length, type: 'italic' });
          i = close + 1; continue;
        }
      }
      out += ch; i++;
    }
    return { text: out, marks };
  }
  const hasMdMarkers = (t) => /(\*\*|\*|__|_|~~)/.test(String(t == null ? '' : t));

  /* ══════════════════════════════════════════════════════════════════════════
     Текстовый блок документа (heading/para/quote) — contentEditable.
     props: { block, onCommit(patch), onFocus(), toolbar Marks-актуализация }
  ═════════════════════════════════════════════════════════════════════════ */
  function TextBlock(props) {
    const { block, onCommit, registerActive, onMarkdown } = props;
    const ref = useRef(null);
    const focusedRef = useRef(false);
    const cls = block.kind === 'heading' ? 'lb-ce--h' : block.kind === 'quote' ? 'lb-ce--q' : 'lb-ce--p';
    const ph = block.kind === 'heading' ? 'Заголовок раздела' : block.kind === 'quote' ? 'Цитата…' : 'Пишите текст…';

    // Сеем DOM только когда блок НЕ в фокусе и данные пришли извне.
    useEffect(() => {
      const el = ref.current;
      if (!el || focusedRef.current) return;
      applyBlockToDom(el, block.text, block.marks);
    }, [block.text, JSON.stringify(block.marks || [])]);

    // Внешний сигнал «встань в конец текста» — после удаления соседнего блока
    // (Backspace на пустом), чтобы фокус не терялся, как в Google Docs.
    useEffect(() => {
      if (!props.focusSignal) return;
      const el = ref.current;
      if (!el) return;
      focusedRef.current = true;
      el.focus();
      try {
        const range = document.createRange(); range.selectNodeContents(el); range.collapse(false);
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      } catch (e) {}
    }, [props.focusSignal]);

    const onFocus = () => { focusedRef.current = true; if (registerActive) registerActive(); };
    const onBlur = () => {
      focusedRef.current = false;
      const el = ref.current;
      if (!el) return;
      const data = readBlockFromDom(el);
      let text = data.text, marks = data.marks;
      // Блок-markdown: ВСТАВИЛ или набрал «### Заголовок» / «> Цитата» одной
      // строкой — конвертируем в соответствующий блок. Раньше это ловилось ТОЛЬКО
      // при ручном наборе «###» + пробел; вставка одной строкой проходила мимо и
      // «### » оставалось буквально в тексте.
      if (onMarkdown && (block.kind === 'para' || block.kind === 'quote')) {
        const single = text.indexOf('\n') < 0;
        let mm;
        if (single && (mm = text.match(/^#{1,6}\s+(.+)$/))) { onMarkdown('heading', mm[1].trim()); return; }
        if (single && block.kind === 'para' && (mm = text.match(/^>\s+(.+)$/))) { onMarkdown('quote', mm[1].trim()); return; }
      }
      // Инлайн-markdown: если в тексте есть маркеры — разбираем, маркеры выкидываем,
      // spans уходят в marks (рендерится жирным/курсивом в превью). Без маркеров —
      // сохраняем formatting из toolbar (b/i из DOM).
      if (hasMdMarkers(text)) { const p = parseInline(text); if (p.text !== text) { text = p.text; marks = p.marks; } }
      onCommit({ text, marks });
    };
    // Markdown → блок: набрал "#"/"##"/">"/"-"/"*"/"1." и нажал Space.
    const onKeyDown = (e) => {
      // Backspace на пустом блоке → удалить и уйти в предыдущий (Docs-like).
      if (e.key === 'Backspace') {
        const el = ref.current;
        if (el && !(el.textContent || '').length) { e.preventDefault(); if (props.onEmptyBackspace) props.onEmptyBackspace(); return; }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        // Заголовок: Enter уводит в новый блок-абзац (как в Notion).
        if (block.kind === 'heading') { e.preventDefault(); if (props.onEnter) props.onEnter(); return; }
        // Абзац/цитата: Enter — мягкий перенос строки. Пишем свободно, без нового
        // блока и без скачка отступа (Notion-логика свободного текста).
        e.preventDefault();
        try { document.execCommand('insertLineBreak'); } catch (err) {}
        onInput();
        return;
      }
      if (e.key !== ' ' || !onMarkdown) return;
      const el = ref.current;
      const txt = (el && el.textContent) || '';
      let kind = null;
      if (/^#{1,6}$/.test(txt)) kind = 'heading';
      else if (txt === '>') kind = 'quote';
      else if (txt === '-' || txt === '*') kind = 'bullets';
      else if (/^\d+\.$/.test(txt)) kind = 'numbered';
      if (kind) { e.preventDefault(); if (el) el.textContent = ''; onMarkdown(kind, ''); }
    };
    const onPaste = (e) => {
      const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
      if (!text || !/\n/.test(text) || !props.onPasteMulti) return; // однострочный — нативно
      e.preventDefault();
      props.onPasteMulti(text);
    };
    // Живое превью: коммитим текст с задержкой, пока печатаем. Каретку не сбиваем —
    // эффект пересева пропускается, пока блок в фокусе (focusedRef).
    const commitTimer = useRef(0);
    useEffect(() => () => { try { clearTimeout(commitTimer.current); } catch (e) {} }, []);
    const onInput = () => {
      try { clearTimeout(commitTimer.current); } catch (e) {}
      commitTimer.current = setTimeout(() => {
        const el = ref.current;
        if (!el || !focusedRef.current) return;
        const data = readBlockFromDom(el);
        let text = data.text, marks = data.marks;
        if (hasMdMarkers(text)) { const p = parseInline(text); if (p.text !== text) { text = p.text; marks = p.marks; } }
        onCommit({ text, marks });
      }, 300);
    };

    return h('div', {
      ref, className: 'lb-ce ' + cls, contentEditable: true, suppressContentEditableWarning: true,
      'data-ph': ph, spellCheck: false,
      onFocus, onBlur, onKeyDown, onPaste, onInput,
    });
  }

  /* Notion-flow: пустой блок «пиши сразу». При вводе → параграф; при
     markdown-маркере + Space → соответствующий блок. */
  function GhostBlock(props) {
    const ref = useRef(null);
    const created = useRef(false);
    // Превращаем «ghost» в реальный блок на ПЕРВОМ вводе (а не на blur) — иначе
    // превью ученика молчит, пока не кликнешь мимо, и кажется, что «ничего не
    // печатается». После создания блок берёт фокус через focusTarget и набор
    // продолжается уже в TextBlock (со своим live-обновлением превью).
    const onInput = () => {
      if (created.current) return;
      const el = ref.current; const t = ((el && el.textContent) || '');
      if (!t.trim()) return;
      created.current = true;
      const p = parseInline(t);
      props.onCreate({ kind: 'para', text: p.text, marks: p.marks });
    };
    const onBlur = () => { if (created.current) return; const el = ref.current; const t = ((el && el.textContent) || '').trim(); if (t) { created.current = true; const p = parseInline(t); props.onCreate({ kind: 'para', text: p.text, marks: p.marks }); } };
    const onKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); try { document.execCommand('insertLineBreak'); } catch (err) {} return; }
      if (e.key !== ' ') return;
      const el = ref.current; const txt = (el && el.textContent) || '';
      let kind = null;
      if (/^#{1,6}$/.test(txt)) kind = 'heading';
      else if (txt === '>') kind = 'quote';
      else if (txt === '-' || txt === '*') kind = 'bullets';
      else if (/^\d+\.$/.test(txt)) kind = 'numbered';
      if (kind) { e.preventDefault(); if (el) el.textContent = ''; props.onCreate({ kind, text: '' }); }
    };
    const onPaste = (e) => {
      const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
      if (!text || !/\n/.test(text) || !props.onPasteMulti) return;
      e.preventDefault();
      props.onPasteMulti(text);
    };
    return h('div', { ref, className: 'lb-ce lb-ce--p', contentEditable: true, suppressContentEditableWarning: true, 'data-ph': 'Начните писать…', spellCheck: false, onInput, onBlur, onKeyDown, onPaste });
  }

  /* Список (bullets/numbered) */
  function ListBlock(props) {
    const { block, onCommit, onRemove } = props;
    const items = block.items || [''];
    const listRef = useRef(null);
    const numbered = block.kind === 'numbered';
    const setItem = (i, v) => { const a = items.slice(); a[i] = v; onCommit({ items: a }); };
    const delItem = (i) => { const a = items.filter((_, k) => k !== i); onCommit({ items: a.length ? a : [''] }); };
    const focusItem = (i) => { setTimeout(() => {
      const root = listRef.current; if (!root) return;
      const ins = root.querySelectorAll('.lb-list__in');
      const el = ins[Math.max(0, Math.min(i, ins.length - 1))];
      if (el) { el.focus(); try { const v = el.value; el.setSelectionRange(v.length, v.length); } catch (e) {} }
    }, 0); };
    const onKey = (i, e) => {
      if (e.key === 'Enter') { e.preventDefault(); const a = items.slice(); a.splice(i + 1, 0, ''); onCommit({ items: a }); focusItem(i + 1); return; }
      // Backspace на пустом пункте — стираем пункт (Docs/Notion-логика). Если он
      // был последним и единственным пустым — удаляем весь блок-список.
      if (e.key === 'Backspace' && (e.target.value || '') === '') {
        e.preventDefault();
        if (items.length > 1) { delItem(i); focusItem(i - 1); }
        else if (onRemove) onRemove();
        return;
      }
    };
    return h('div', { className: 'lb-list', ref: listRef },
      items.map((it, i) => h('div', { key: i, className: 'lb-list__i' },
        h('span', { className: 'lb-list__mk' }, numbered
          ? h('span', { className: 'lb-list__num' }, (i + 1))
          : h('span', { className: 'lb-list__dot' })),
        h('input', { className: 'lb-list__in', value: it, placeholder: 'Пункт списка',
          onChange: (e) => setItem(i, e.target.value), onKeyDown: (e) => onKey(i, e) }),
        h('button', { type: 'button', className: 'lb-list__x', onClick: () => { if (items.length > 1) delItem(i); else if (onRemove) onRemove(); }, 'aria-label': 'Удалить пункт' }, Ic.Close ? h(Ic.Close, { size: 14 }) : '×'))),
      h('button', { type: 'button', className: 'lb-listadd', onClick: () => { const a = items.concat(''); onCommit({ items: a }); focusItem(a.length - 1); } },
        h('span', { className: 'lb-list__mk' }, Ic.Plus ? h(Ic.Plus, { size: 14 }) : '+'), 'Добавить пункт'));
  }

  /* Слово — компактная инлайн-строка, часть потока документа */
  function WordBlock(props) {
    const { block, onCommit, onRemove } = props;
    const set = (k, v) => onCommit(Object.assign({}, block, { [k]: v }));
    return h('div', { className: 'lb-word' },
      h('input', { className: 'lb-word__hz', value: block.hanzi || '', placeholder: '汉字', onChange: (e) => set('hanzi', e.target.value) }),
      h('div', { className: 'lb-word__fields' },
        h('input', { className: 'lb-word__py', value: block.pinyin || '', placeholder: 'пиньинь', onChange: (e) => set('pinyin', e.target.value) }),
        h('input', { className: 'lb-word__ru', value: block.ru || '', placeholder: 'перевод', onChange: (e) => set('ru', e.target.value) })),
      h('button', { type: 'button', className: 'lb-word__say', onClick: () => speak(block.hanzi), disabled: !block.hanzi, 'aria-label': 'Прослушать', title: 'Прослушать' }, AudioIc(16)),
      h('button', { type: 'button', className: 'lb-row__x', onClick: onRemove, 'aria-label': 'Удалить слово' }, Ic.Close ? h(Ic.Close, { size: 15 }) : '×'));
  }

  /* Изображение — картинка + подпись, без карточки */
  function ImageBlock(props) {
    const { block, onCommit, onRemove } = props;
    const fileRef = useRef(null);
    const onPick = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; e.target.value = ''; pickMedia(f, function (url, up) { onCommit(up ? { url: url, caption: block.caption || f.name, uploading: true } : { url: url, uploading: false }); }); };
    if (block.url) return h('div', { className: 'lb-img' },
      h('img', { src: block.url, alt: block.caption || '' }),
      h('div', { className: 'lb-img__bar' },
        h('input', { className: 'lb-capin', value: block.caption || '', placeholder: 'Подпись (необязательно)', onChange: (e) => onCommit({ caption: e.target.value }) }),
        h('button', { type: 'button', className: 'lb-row__x', onClick: onRemove, 'aria-label': 'Удалить' }, Ic.Close ? h(Ic.Close, { size: 15 }) : '×')));
    return h('div', { className: 'lb-img-empty' },
      h('input', { ref: fileRef, type: 'file', accept: 'image/*', style: { display: 'none' }, onChange: onPick }),
      h('button', { type: 'button', className: 'lb-inline-add', onClick: () => fileRef.current && fileRef.current.click() }, Ic.Plus ? h(Ic.Plus, { size: 15 }) : '+', 'Загрузить изображение'),
      h('input', { className: 'lb-inline-link', value: '', placeholder: 'или вставьте ссылку', onChange: (e) => onCommit({ url: e.target.value }) }));
  }

  /* Аудио — компактная строка */
  function AudioBlock(props) {
    const { block, onCommit, onRemove } = props;
    const fileRef = useRef(null);
    const onPick = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; e.target.value = ''; pickMedia(f, function (url, up) { onCommit(up ? { url: url, title: block.title || f.name.replace(/\.[^.]+$/, ''), uploading: true } : { url: url, uploading: false }); }); };
    return h('div', { className: 'lb-aud' },
      AudioIc(16),
      h('input', { className: 'lb-aud__t', value: block.title || '', placeholder: 'Название записи', onChange: (e) => onCommit({ title: e.target.value }) }),
      h('input', { className: 'lb-aud__u', value: block.url || '', placeholder: 'ссылка на mp3', onChange: (e) => onCommit({ url: e.target.value }) }),
      h('input', { ref: fileRef, type: 'file', accept: 'audio/*', style: { display: 'none' }, onChange: onPick }),
      h('button', { type: 'button', className: 'lb-aud__up', onClick: () => fileRef.current && fileRef.current.click() }, Ic.Upload ? h(Ic.Upload, { size: 14 }) : (Ic.Plus ? h(Ic.Plus, { size: 13 }) : '+'), 'Файл'),
      h('button', { type: 'button', className: 'lb-row__x', onClick: onRemove, 'aria-label': 'Удалить' }, Ic.Close ? h(Ic.Close, { size: 15 }) : '×'));
  }

  /* Материал — ссылка ИЛИ загруженный файл (PDF/док/презентация) */
  function MaterialBlock(props) {
    const { block, onCommit, onRemove } = props;
    const fileRef = useRef(null);
    const fmtSize = (n) => { if (!n && n !== 0) return ''; if (n < 1024) return n + ' Б'; if (n < 1048576) return Math.round(n / 1024) + ' КБ'; return (n / 1048576).toFixed(1) + ' МБ'; };
    const onPick = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; e.target.value = ''; pickMedia(f, function (url, up) { onCommit(up ? { url: url, title: block.title || f.name.replace(/\.[^.]+$/, ''), fileName: f.name, size: f.size, uploading: true } : { url: url, uploading: false }); }); };
    const clearFile = () => onCommit({ url: '', fileName: '', size: 0 });
    const hasFile = !!block.fileName;
    return h('div', { className: 'lb-matblk' + (hasFile ? ' is-file' : '') },
      hasFile ? (Ic.File ? h(Ic.File, { size: 15 }) : LinkIc(15)) : LinkIc(15),
      h('input', { className: 'lb-matblk__t', value: block.title || '', placeholder: 'Название материала', onChange: (e) => onCommit({ title: e.target.value }) }),
      hasFile
        ? h('span', { className: 'lb-matblk__file' },
            h('span', { className: 'lb-matblk__fname' }, block.fileName),
            block.size ? h('span', { className: 'lb-matblk__fsize' }, fmtSize(block.size)) : null,
            h('button', { type: 'button', className: 'lb-matblk__fx', onClick: clearFile, 'aria-label': 'Убрать файл' }, Ic.Close ? h(Ic.Close, { size: 12 }) : '×'))
        : h('input', { className: 'lb-matblk__u', value: block.url || '', placeholder: 'вставьте ссылку или загрузите файл', onChange: (e) => onCommit({ url: e.target.value }) }),
      h('input', { ref: fileRef, type: 'file', style: { display: 'none' }, onChange: onPick }),
      hasFile ? null : h('button', { type: 'button', className: 'lb-aud__up', onClick: () => fileRef.current && fileRef.current.click() }, Ic.Upload ? h(Ic.Upload, { size: 14 }) : (Ic.Plus ? h(Ic.Plus, { size: 13 }) : '+'), 'Файл'),
      h('button', { type: 'button', className: 'lb-row__x', onClick: onRemove, 'aria-label': 'Удалить' }, Ic.Close ? h(Ic.Close, { size: 15 }) : '×'));
  }

  /* Выноска hint/important */
  function CalloutBlock(props) {
    const { block, onCommit, onRemove } = props;
    const ref = useRef(null);
    const focusedRef = useRef(false);
    const imp = block.kind === 'important';
    const ph = imp ? 'Правило, исключение или частая ошибка…' : 'Лёгкий совет ученику…';
    useEffect(() => {
      const el = ref.current;
      if (!el || focusedRef.current) return;
      if (el.textContent !== (block.text || '')) el.textContent = block.text || '';
    }, [block.text]);
    const ce = h('div', { ref, className: 'lb-callout__ce', contentEditable: true, suppressContentEditableWarning: true, 'data-ph': ph, spellCheck: false,
      onFocus: () => { focusedRef.current = true; }, onBlur: () => { focusedRef.current = false; if (ref.current) onCommit({ text: (ref.current.textContent || '').replace(/ /g, ' ') }); } });
    const del = h('button', { type: 'button', className: 'lb-row__x', onClick: onRemove, 'aria-label': 'Удалить' }, Ic.Close ? h(Ic.Close, { size: 15 }) : '×');
    if (imp) {
      return h('div', { className: 'lb-callout lb-callout--imp' },
        h('div', { className: 'lb-callout__head' },
          Ic.AlertTriangle ? h(Ic.AlertTriangle, { size: 14 }) : null, h('span', null, 'Важно'), del),
        h('div', { className: 'lb-callout__in' }, ce));
    }
    return h('div', { className: 'lb-callout lb-callout--hint' },
      h('span', { className: 'lb-callout__ic' }, Ic.Spark ? h(Ic.Spark, { size: 15 }) : null),
      h('div', { className: 'lb-callout__in' }, ce),
      del);
  }

  /* Спойлер — вопрос/подсказка + скрытый ответ (самопроверка ученика) */
  function SpoilerBlock(props) {
    const { block, onCommit, onRemove } = props;
    const ref = useRef(null);
    const focusedRef = useRef(false);
    useEffect(() => {
      const el = ref.current;
      if (!el || focusedRef.current) return;
      if (el.textContent !== (block.text || '')) el.textContent = block.text || '';
    }, [block.text]);
    return h('div', { className: 'lb-spoiler' },
      h('div', { className: 'lb-spoiler__head' },
        h('span', { className: 'lb-spoiler__ic' }, Ic.Eye ? h(Ic.Eye, { size: 15 }) : null),
        h('input', { className: 'lb-spoiler__q', value: block.title || '', placeholder: 'Вопрос или подсказка — видна сразу', onChange: (e) => onCommit({ title: e.target.value }) }),
        h('button', { type: 'button', className: 'lb-row__x', onClick: onRemove, 'aria-label': 'Удалить' }, Ic.Close ? h(Ic.Close, { size: 15 }) : '×')),
      h('div', { ref, className: 'lb-spoiler__a', contentEditable: true, suppressContentEditableWarning: true, 'data-ph': 'Ответ — откроется по клику ученика…', spellCheck: false,
        onFocus: () => { focusedRef.current = true; }, onBlur: () => { focusedRef.current = false; if (ref.current) onCommit({ text: (ref.current.textContent || '').replace(/ /g, ' ') }); } }),
      h('div', { className: 'lb-spoiler__note' }, Ic.Eye ? h(Ic.Eye, { size: 12 }) : null, 'Ученик нажмёт «Показать ответ» — и увидит этот текст'));
  }

  /* Пример — фраза целиком: иероглифы + чтение + перевод (контекст) */
  function ExampleBlock(props) {
    const { block, onCommit, onRemove } = props;
    const set = (k, v) => onCommit(Object.assign({}, block, { [k]: v }));
    return h('div', { className: 'lb-example' },
      h('button', { type: 'button', className: 'lb-example__say', onClick: () => speak(block.hanzi), disabled: !block.hanzi, 'aria-label': 'Прослушать', title: 'Прослушать' }, AudioIc(15)),
      h('div', { className: 'lb-example__fields' },
        h('input', { className: 'lb-example__hz', value: block.hanzi || '', placeholder: '例句 — пример на китайском', onChange: (e) => set('hanzi', e.target.value) }),
        h('input', { className: 'lb-example__py', value: block.pinyin || '', placeholder: 'пиньинь', onChange: (e) => set('pinyin', e.target.value) }),
        h('input', { className: 'lb-example__ru', value: block.ru || '', placeholder: 'перевод', onChange: (e) => set('ru', e.target.value) })),
      h('button', { type: 'button', className: 'lb-row__x', onClick: onRemove, 'aria-label': 'Удалить' }, Ic.Close ? h(Ic.Close, { size: 15 }) : '×'));
  }

  /* ── Один блок документа внутри ReorderList ─────────────────────────────── */
  /* Отступ между блоками документа — считаем В JS, не CSS-комбинаторами:
     ReorderList оборачивает каждую строку в свой .lb-rw, поэтому соседние
     .lb-row физически не являются DOM-сиблингами друг друга — `:first-child`
     и `+` там никогда не сработают (ловит «каждый блок единственный в своей
     обёртке» и тихо обнуляет отступ ВСЕМ строкам). Считаем явно: безопасный
     дефолт 18px, теснее — только для специально перечисленных тесных пар. */
  function docRowGap(kind, prevKind, isFirst) {
    if (isFirst) return 0;
    if (kind === 'heading') return 38;
    if (prevKind === 'heading') return 14;
    if (kind === 'para' && prevKind === 'para') return 9;
    if (kind === 'word' && prevKind === 'word') return 6;
    if (kind === 'divider') return 24;
    return 18;
  }

  function DocRow(props) {
    const { block, idx, ctx, onCommit, onRemove, onFocusRow, isActive, onOpenPlus, registerActiveCe, onConvertMd, onPasteMultiRow, onSplit, prevKind } = props;
    const body = (() => {
      if (block.kind === 'heading' || block.kind === 'para' || block.kind === 'quote')
        return h(TextBlock, { block, onCommit, onMarkdown: onConvertMd ? (kind, t) => onConvertMd(idx, kind, t) : null, onPasteMulti: onPasteMultiRow ? (text) => onPasteMultiRow(idx, text) : null, onEmptyBackspace: props.onEmptyBackspace, onEnter: onSplit ? () => onSplit(idx) : null, focusSignal: props.focusSignal, registerActive: () => { registerActiveCe(idx); onFocusRow(); } });
      if (block.kind === 'bullets' || block.kind === 'numbered') return h(ListBlock, { block, onCommit, onRemove });
      if (block.kind === 'word') return h(WordBlock, { block, onCommit, onRemove });
      if (block.kind === 'example') return h(ExampleBlock, { block, onCommit, onRemove });
      if (block.kind === 'spoiler') return h(SpoilerBlock, { block, onCommit, onRemove });
      if (block.kind === 'image') return h(ImageBlock, { block, onCommit, onRemove });
      if (block.kind === 'audio') return h(AudioBlock, { block, onCommit, onRemove });
      if (block.kind === 'material') return h(MaterialBlock, { block, onCommit, onRemove });
      if (block.kind === 'hint' || block.kind === 'important') return h(CalloutBlock, { block, onCommit, onRemove });
      if (block.kind === 'divider') return h('div', { className: 'lb-divider' });
      return null;
    })();
    const showTextTools = block.kind === 'para' || block.kind === 'quote';
    return h('div', { className: 'lb-row lb-row--' + block.kind + (isActive ? ' is-focus' : ''), style: { marginTop: docRowGap(block.kind, prevKind, idx === 0) + 'px' } },
      h('div', { className: 'lb-row__gutter' },
        h('button', { type: 'button', className: 'lb-plus', onClick: (e) => { e.stopPropagation(); onOpenPlus(idx, e); }, 'aria-label': 'Вставить блок' }, Ic.Plus ? h(Ic.Plus, { size: 16 }) : '+'),
        h('button', Object.assign({ type: 'button', className: 'lb-handle', 'aria-label': 'Перетащить' }, ctx.gripProps), Grip(16)),
        h('button', { type: 'button', className: 'lb-gdel', onClick: (e) => { e.stopPropagation(); onRemove(); }, 'aria-label': 'Удалить блок' }, Ic.Trash ? h(Ic.Trash, { size: 16 }) : '×')),
      h('div', { className: 'lb-row__body' }, body));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ПРАКТИКА — форма редактирования блока (choice/gap/match/order/type/tone)
  ═════════════════════════════════════════════════════════════════════════ */
  function inp(value, onChange, ph, cls) {
    return h('input', { className: 'lb-in' + (cls ? ' ' + cls : ''), value: value || '', placeholder: ph, onChange: (e) => onChange(e.target.value) });
  }
  function ta(value, onChange, ph) {
    return h('textarea', { className: 'lb-ta', value: value || '', placeholder: ph, onChange: (e) => onChange(e.target.value) });
  }
  function field(label, node, hint) {
    return h('div', { className: 'lb-field' },
      h('div', { className: 'lb-label' }, h('span', null, label), hint ? h('span', { className: 'lb-label__hint' }, hint) : null), node);
  }

  function OptionsEditor(props) {
    const { block, patch } = props;
    const opts = block.options || [];
    const setOpt = (i, key, v) => { const a = opts.slice(); a[i] = Object.assign({}, a[i], { [key]: v }); patch({ options: a }); };
    const setCorrect = (i) => { const a = opts.map((o, k) => Object.assign({}, o, { correct: k === i })); patch({ options: a }); };
    const add = () => patch({ options: opts.concat({ text: 'Новый вариант', correct: false }) });
    const del = (i) => patch({ options: opts.filter((_, k) => k !== i) });
    return h('div', null,
      h('div', { className: 'lb-rows' }, opts.map((o, i) => h('div', { key: i, className: 'lb-rowp' },
        h('span', { className: 'lb-rn' }, i + 1),
        inp(o.text, (v) => setOpt(i, 'text', v), 'Текст варианта'),
        h('button', { type: 'button', className: 'lb-correct' + (o.correct ? ' on' : ''), onClick: () => setCorrect(i) },
          h('span', { className: 'lb-correct__tick' }, o.correct ? (Ic.Check ? h(Ic.Check, { size: 12, strokeWidth: 2.8 }) : '✓') : ''), 'верный'),
        h('button', { type: 'button', className: 'lb-rowdel', disabled: opts.length <= 2, onClick: () => del(i), 'aria-label': 'Удалить' }, Ic.Trash ? h(Ic.Trash, { size: 15 }) : '×')))),
      h('button', { type: 'button', className: 'lb-addrow', onClick: add }, Ic.Plus ? h(Ic.Plus, { size: 14 }) : '+', 'Добавить вариант'));
  }

  function BlockForm(props) {
    const { block, idx, patch } = props;
    if (!block) return null;
    let body;
    if (block.type === 'choice') {
      body = h('div', null,
        field('Вопрос', inp(block.prompt, (v) => patch({ prompt: v }), 'Текст вопроса')),
        field('Варианты ответа', h(OptionsEditor, { block, patch }), 'отметь один верный'),
        field('Разбор после ответа', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
    } else if (block.type === 'gap') {
      body = h('div', null,
        field('Инструкция', inp(block.prompt, (v) => patch({ prompt: v }), 'Вставь пропущенное слово')),
        field('Текст до пропуска', inp(block.before, (v) => patch({ before: v }), 'Начало фразы')),
        field('Текст после пропуска', inp(block.after, (v) => patch({ after: v }), 'Конец фразы')),
        field('Варианты для пропуска', h(OptionsEditor, { block, patch }), 'отметь верный'),
        field('Разбор', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
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
            h('span', { className: 'lb-pair__link' }, Ic.ArrowRight ? h(Ic.ArrowRight, { size: 14 }) : '–'),
            inp(p.right, (x) => setP(i, 'right', x), 'Привет'),
            h('button', { type: 'button', className: 'lb-rowdel', disabled: pairs.length <= 2, onClick: () => delP(i) }, Ic.Trash ? h(Ic.Trash, { size: 15 }) : '×')))),
          h('button', { type: 'button', className: 'lb-addrow', onClick: addP }, Ic.Plus ? h(Ic.Plus, { size: 14 }) : '+', 'Добавить пару')), 'ученик кликает слово, потом перевод'),
        field('Разбор', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
    } else if (block.type === 'order') {
      const toks = block.tokens || [];
      const setT = (i, v) => { const a = toks.slice(); a[i] = v; patch({ tokens: a }); };
      const addT = () => patch({ tokens: toks.concat('') });
      const delT = (i) => patch({ tokens: toks.filter((_, k) => k !== i) });
      body = h('div', null,
        field('Инструкция', inp(block.prompt, (v) => patch({ prompt: v }), 'Собери предложение')),
        field('Слова в правильном порядке', h('div', null,
          h('div', { className: 'lb-rows' }, toks.map((t, i) => h('div', { key: i, className: 'lb-rowp' },
            h('span', { className: 'lb-rn' }, i + 1),
            inp(t, (x) => setT(i, x), 'слово', 'lb-in--hz'),
            h('button', { type: 'button', className: 'lb-rowdel', disabled: toks.length <= 2, onClick: () => delT(i) }, Ic.Trash ? h(Ic.Trash, { size: 15 }) : '×')))),
          h('button', { type: 'button', className: 'lb-addrow', onClick: addT }, Ic.Plus ? h(Ic.Plus, { size: 14 }) : '+', 'Добавить слово')), 'у ученика они перемешаются'),
        field('Разбор', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
    } else if (block.type === 'type') {
      const ans = block.answers || [];
      const setA = (i, v) => { const a = ans.slice(); a[i] = v; patch({ answers: a }); };
      const addA = () => patch({ answers: ans.concat('') });
      const delA = (i) => patch({ answers: ans.filter((_, k) => k !== i) });
      body = h('div', null,
        field('Вопрос', inp(block.prompt, (v) => patch({ prompt: v }), 'Напечатай пиньинь для 谢谢')),
        field('Верные ответы', h('div', null,
          h('div', { className: 'lb-rows' }, ans.map((a, i) => h('div', { key: i, className: 'lb-rowp' },
            h('span', { className: 'lb-rn' }, i + 1),
            inp(a, (x) => setA(i, x), 'xiexie'),
            h('button', { type: 'button', className: 'lb-rowdel', disabled: ans.length <= 1, onClick: () => delA(i) }, Ic.Trash ? h(Ic.Trash, { size: 15 }) : '×')))),
          h('button', { type: 'button', className: 'lb-addrow', onClick: addA }, Ic.Plus ? h(Ic.Plus, { size: 14 }) : '+', 'Добавить вариант')), 'регистр и пробелы не важны'),
        field('Разбор', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
    } else if (block.type === 'tone') {
      body = h('div', null,
        field('Иероглиф', inp(block.hanzi, (v) => patch({ hanzi: v }), '妈', 'lb-in--hz')),
        field('Пиньинь (после ответа)', inp(block.pinyin, (v) => patch({ pinyin: v }), 'mā')),
        field('Верный тон', h('div', { className: 'lb-tones' }, (L.TONES || []).map((t, i) => h('button', {
          key: i, type: 'button', className: 'lb-tone' + (block.tone === i + 1 ? ' on' : ''), onClick: () => patch({ tone: i + 1 }),
        }, h('span', { className: 'lb-tone__m' }, ToneContour(t.contour)), h('span', { className: 'lb-tone__n' }, (i + 1) + '-й · ' + t.name)))), 'какой тон выбрать ученику'),
        field('Разбор', ta(block.explain, (v) => patch({ explain: v }), 'Короткое объяснение')));
    }
    return body;
  }

  /* Карточка практики (collapse/expand + форма) */
  function PracticeCard(props) {
    const { block, idx, ctx, isOpen, onToggle, onPatch, onDup, onDel, onSelect, isSelected, canUp, canDown, onMoveUp, onMoveDown } = props;
    const meta = L.typeMeta(block.type);
    const issue = L.blockIssue(block);
    const summary = (() => {
      if (block.type === 'tone') return (block.hanzi || '?') + ' · тон ' + (block.tone || 1);
      if (block.type === 'order') return (block.tokens || []).join(' ') || 'Предложение';
      if (block.type === 'type') return block.prompt || 'Ввод ответа';
      return block.prompt || 'Вопрос';
    })();
    const IcT = Ic[meta.icon] || Ic.Book;
    return h('div', { className: 'lb-pcard' + (isOpen ? ' is-open' : '') + (isSelected ? ' is-sel' : '') },
      h('div', { className: 'lb-pcard__head', onClick: () => { onSelect(); onToggle(); } },
        h('button', Object.assign({ type: 'button', className: 'lb-pcard__grip', 'aria-label': 'Перетащить', onClick: (e) => e.stopPropagation() }, ctx.gripProps), Grip(15)),
        h('div', { className: 'lb-pcard__mv', onClick: (e) => e.stopPropagation() },
          h('button', { type: 'button', className: 'lb-pcard__mvb', disabled: !canUp, onClick: onMoveUp, 'aria-label': 'Выше', title: 'Выше' }, Ic.ChevronUp ? h(Ic.ChevronUp, { size: 15 }) : '↑'),
          h('button', { type: 'button', className: 'lb-pcard__mvb', disabled: !canDown, onClick: onMoveDown, 'aria-label': 'Ниже', title: 'Ниже' }, Ic.ChevronDown ? h(Ic.ChevronDown, { size: 15 }) : '↓')),
        h('span', { className: 'lb-pcard__n' }, idx + 1),
        h('span', { className: 'lb-pcard__ic' }, IcT ? h(IcT, { size: 16 }) : null),
        h('div', { className: 'lb-pcard__b' },
          h('div', { className: 'lb-pcard__t' }, meta.label, issue ? h('span', { className: 'lb-dotw', title: issue }) : null),
          h('div', { className: 'lb-pcard__s' }, summary)),
        h('div', { className: 'lb-pcard__acts' },
          h('button', { type: 'button', className: 'lb-ib', onClick: (e) => { e.stopPropagation(); onDup(); }, 'aria-label': 'Дублировать' }, Duplicate(15)),
          h('button', { type: 'button', className: 'lb-ib del', onClick: (e) => { e.stopPropagation(); onDel(); }, 'aria-label': 'Удалить' }, Ic.Trash ? h(Ic.Trash, { size: 15 }) : '×')),
        h('span', { className: 'lb-pcard__chev' }, Ic.ChevronDown ? h(Ic.ChevronDown, { size: 18 }) : '▾')),
      h('div', { className: 'lb-pcard__body' }, h(BlockForm, { block, idx, patch: onPatch })));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ПРЕВЬЮ — рамка телефона.
  ═════════════════════════════════════════════════════════════════════════ */
  function PhoneFrame(props) {
    return h('div', { className: 'lb-phone' },
      h('div', { className: 'lb-phone__screen' + (props.sheet ? ' has-sheet' : '') },
        h('div', { className: 'lb-phone__island' }),
        h('div', { className: 'lb-phone__body' + (props.sheet ? ' is-behind' : ''), 'aria-hidden': props.sheet ? 'true' : undefined }, props.children),
        props.overlay || null));
  }

  /* Кастомный видеоплеер для загруженного файла: сапфировые контролы, своя перемотка,
     тайминги, fullscreen. Панель прячется во время воспроизведения. */
  function VideoPlayer(props) {
    const { src } = props;
    const vref = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [cur, setCur] = useState(0);
    const [dur, setDur] = useState(0);
    const [muted, setMuted] = useState(false);
    const [shown, setShown] = useState(true);
    const hideRef = useRef(0);
    const poke = useCallback(() => {
      setShown(true);
      try { clearTimeout(hideRef.current); } catch (e) {}
      hideRef.current = setTimeout(() => { const v = vref.current; if (v && !v.paused) setShown(false); }, 2600);
    }, []);
    useEffect(() => () => { try { clearTimeout(hideRef.current); } catch (e) {} }, []);
    const toggle = (e) => { if (e) e.stopPropagation(); const v = vref.current; if (!v) return; if (v.paused) { v.play(); } else { v.pause(); } };
    const seekBy = (e, delta) => { if (e) e.stopPropagation(); const v = vref.current; if (!v) return; v.currentTime = Math.max(0, Math.min(dur || v.duration || 0, (v.currentTime || 0) + delta)); poke(); };
    const onTrackClick = (e) => { e.stopPropagation(); const v = vref.current; if (!v || !dur) return; const r = e.currentTarget.getBoundingClientRect(); const pct2 = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); v.currentTime = pct2 * dur; setCur(pct2 * dur); poke(); };
    const toggleMute = (e) => { if (e) e.stopPropagation(); const v = vref.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); poke(); };
    const goFs = (e) => { if (e) e.stopPropagation(); const el = e.currentTarget.closest('.lb-vp'); if (!el) return; try { if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen(); } catch (err) {} poke(); };
    const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); const m = Math.floor(s / 60); const ss = s % 60; return m + ':' + (ss < 10 ? '0' : '') + ss; };
    const pct = dur ? Math.min(100, Math.max(0, (cur / dur) * 100)) : 0;
    return h('div', { className: 'lb-vp' + (shown ? ' is-shown' : '') + (playing ? ' is-playing' : ''),
        onMouseMove: poke, onMouseLeave: () => { const v = vref.current; if (v && !v.paused) setShown(false); } },
      h('video', { ref: vref, src, playsInline: true, preload: 'metadata', onClick: toggle,
        onPlay: () => { setPlaying(true); poke(); }, onPause: () => { setPlaying(false); setShown(true); },
        onEnded: () => { setPlaying(false); setShown(true); },
        onTimeUpdate: (e) => setCur(e.currentTarget.currentTime || 0),
        onLoadedMetadata: (e) => setDur(e.currentTarget.duration || 0) }),
      h('div', { className: 'lb-vp__trio' },
        h('button', { type: 'button', className: 'lb-vp__glass lb-vp__glass--side', onClick: (e) => seekBy(e, -10), 'aria-label': 'Назад на 10 секунд' }, Seek10Ic(18, true)),
        h('button', { type: 'button', className: 'lb-vp__glass lb-vp__glass--main', onClick: toggle, 'aria-label': playing ? 'Пауза' : 'Смотреть' }, playing ? PauseIc(22) : PlayTri(22)),
        h('button', { type: 'button', className: 'lb-vp__glass lb-vp__glass--side', onClick: (e) => seekBy(e, 10), 'aria-label': 'Вперёд на 10 секунд' }, Seek10Ic(18, false))),
      h('div', { className: 'lb-vp__bar' },
        h('span', { className: 'lb-vp__time lb-num' }, fmt(cur)),
        h('span', { className: 'lb-vp__track', onClick: onTrackClick },
          h('i', { className: 'lb-vp__fill', style: { width: pct + '%' } }),
          h('i', { className: 'lb-vp__dot', style: { left: pct + '%' } })),
        h('span', { className: 'lb-vp__time lb-num lb-vp__time--mute' }, fmt(dur)),
        h('button', { type: 'button', className: 'lb-vp__ic', onClick: toggleMute, 'aria-label': muted ? 'Включить звук' : 'Без звука' }, muted ? VolXIc(15) : VolIc(15)),
        h('button', { type: 'button', className: 'lb-vp__ic', onClick: goFs, 'aria-label': 'На весь экран' }, FsIc(15))));
  }

  /* Всплывающая панель форматирования — появляется при выделении текста в блоке */
  function BubbleBar(props) {
    const { x, y, onBold, onItalic, onKind } = props;
    const btn = (title, icon, on) => h('button', { type: 'button', className: 'lb-bb__b', title, onMouseDown: (e) => { e.preventDefault(); if (on) on(); } }, icon);
    return h('div', { className: 'lb-bb', style: { left: x + 'px', top: (y - 54) + 'px' } },
      btn('Жирный (Ctrl+B)', Bold(15), onBold),
      btn('Курсив (Ctrl+I)', Italic(15), onItalic),
      h('span', { className: 'lb-bb__sep' }),
      btn('Заголовок', kindIcon('heading')(15), () => onKind('heading')),
      btn('Абзац', kindIcon('para')(15), () => onKind('para')),
      btn('Маркированный список', ListBullet(15), () => onKind('bullets')),
      btn('Цитата', QuoteIc(15), () => onKind('quote')));
  }
  function PracticePreview(props) {
    const { lesson } = props;
    const blocks = (lesson && lesson.blocks) || [];
    const [open, setOpen] = useState(true);
    if (!blocks.length) return h('div', { className: 'lb-prev-empty' }, 'Практика пуста. Добавьте задание, чтобы увидеть тест.');

    // тест = попап: bottom sheet поверх притемнённого урока. Внутри — реальный Тренажёр
    // ученика: все задачи, прогресс, экран результата и закрытие (крестик / фон / Esc).
    const close = () => setOpen(false);
    const sig = blocks.map(function (b) { return (b && b._id) || (b && b.type) || '?'; }).join('|'); // remount при смене состава задач
    const overlay = open && UI && UI.Trainer
      ? h(UI.Trainer, { key: sig, lesson, contained: true, onExit: close, onDone: close })
      : null;

    return h(R.Fragment, null,
      h(PhoneFrame, { sheet: open, overlay },
        UI ? h(UI.StudyView, { lesson, compact: true, onStart: function () { setOpen(true); } }) : null),
      h('div', { className: 'lb-prev__note' },
        open
          ? 'Так ученик проходит тест: все задания подряд, прогресс сверху и экран результата в конце. Закрыть — крестик, клик по фону или Esc.'
          : 'Тест закрыт. Нажмите «Начать» в уроке, чтобы открыть его снова.'));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     Меню «+» (поповер) — вставка блока.
  ═════════════════════════════════════════════════════════════════════════ */
  function PlusMenu(props) {
    const { pos, onPick, onClose } = props;
    const ref = useRef(null);
    useEffect(() => {
      const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
      window.addEventListener('mousedown', onDoc);
      return () => window.removeEventListener('mousedown', onDoc);
    }, [onClose]);
    const style = { top: (pos.y || 0) + 'px', left: (pos.x || 0) + 'px' };
    const item = (k) => h('button', { key: k.kind, type: 'button', className: 'lb-menu__i', onMouseDown: (e) => { e.preventDefault(); onPick(k.kind); } },
      h('span', { className: 'lb-menu__ic' }, k.icon(15)), k.label);
    return h('div', { ref, className: 'lb-menu', style, role: 'menu' },
      h('div', { className: 'lb-menu__g' }, 'Текст'),
      DOC_TEXT_KINDS.map(item),
      h('div', { className: 'lb-menu__sep' }),
      h('div', { className: 'lb-menu__g' }, 'Блоки'),
      DOC_BLOCK_KINDS.map(item));
  }

  /* ══════════════════════════════════════════════════════════════════════════
     КОРНЕВОЙ ЭКРАН
  ═════════════════════════════════════════════════════════════════════════ */
  function LearnBuilder(props) {
    if (!L || !UI) return h('div', { style: { padding: 40 } }, 'Учебный модуль не загружен');
    // Конкретный урок адресуется по id в URL: /learn/build/:id. Без id —
    // резюмируем последний открытый (или создаём новый). ?blank=1 — превью пустого.
    const routeId = (props && props.params && props.params.id) || null;
    const forceBlank = typeof window !== 'undefined' && (/[?&]blank=1/.test(window.location.search || '') || /[?&]blank=1/.test(window.location.hash || ''));
    const [lesson, setLessonRaw] = useState(() => {
      const blank = { id: 'blank', title: '', subtitle: '', goal: '', level: 'HSK 1', video: {}, objectives: [], glossary: [], notes: '', doc: [], blocks: [], materials: [] };
      if (forceBlank) return blank;
      // Стор — источник правды: урок по id, иначе текущий, иначе новый (свой id).
      if (Store) {
        if (routeId) { const l = Store.getSync(routeId); if (l) return l; }
        else { const cur = Store.currentId(); const l = cur && Store.getSync(cur); if (l) return l; }
        return Store.blankLesson();
      }
      // Fallback без стора — старое поведение (одиночный черновик).
      const l = L.load();
      const isDemo = l && l.id && String(l.id).indexOf('demo') === 0;
      const isEmpty = l && (l.doc || []).length === 0 && (l.blocks || []).length === 0;
      return (l && !isDemo && !isEmpty) ? l : blank;
    });

    // ── История для undo/redo. setLesson оборачивает setLessonRaw: перед каждой
    //    мутацией кладёт прошлый снапшот в past[], чистит future[]. coalesce —
    //    ключ порции: подряд идущие правки с тем же ключом в окне 900мс считаются
    //    одной записью (печать в инпуте не плодит по записи на букву).
    const past = useRef([]);
    const future = useRef([]);
    const lastKey = useRef(null);
    const lastPush = useRef(0);
    const lessonRef = useRef(lesson);
    lessonRef.current = lesson;
    const setLesson = useCallback((updater, coalesce) => {
      setLessonRaw((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (!next || next === prev) return prev;
        const now = Date.now();
        const same = coalesce && coalesce === lastKey.current && (now - lastPush.current) < 900;
        if (!same) {
          past.current.push(prev);
          if (past.current.length > 80) past.current.shift();
          future.current = [];
        }
        lastKey.current = coalesce || null;
        lastPush.current = now;
        return next;
      });
    }, []);
    const undo = useCallback(() => {
      // Если прямо сейчас печатают в блоке — сначала уводим фокус, чтобы живой
      // текст закоммитился в историю, а затем в следующем токе откатываемся.
      const ae = document.activeElement;
      if (ae && ae.isContentEditable) { try { ae.blur(); } catch (e) {} }
      setTimeout(() => {
        const prev = past.current.pop();
        if (prev == null) return;
        setLessonRaw((cur) => { future.current.push(cur); return prev; });
      }, 0);
    }, []);
    const redo = useCallback(() => {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable) { try { ae.blur(); } catch (e) {} }
      setTimeout(() => {
        const nxt = future.current.pop();
        if (nxt == null) return;
        setLessonRaw((cur) => { past.current.push(cur); return nxt; });
      }, 0);
    }, []);
    const canUndo = past.current.length > 0;
    const canRedo = future.current.length > 0;
    const [tab, setTab] = useState('theory');
    const [mView, setMView] = useState('editor'); // мобилка: 'rail'|'editor'|'preview' (какая панель видна)
    const [focus, setFocus] = useState(null); // theory: 'video'|'materials'|docId|null ; practice: индекс
    const [activeCe, setActiveCe] = useState(null); // индекс текстового блока в фокусе
    const [bubble, setBubble] = useState(null); // {x,y} — позиция всплывающей панели форматирования
    const [plusAt, setPlusAt] = useState(null); // { idx, x, y } | null
    const [openCards, setOpenCards] = useState({}); // { [idx]: true } — раскрытые карточки практики
    const [saveState, setSaveState] = useState('saved'); // 'saved' | 'saving'
    const [palette, setPalette] = useState(null);
    const [focusTarget, setFocusTarget] = useState(null); // {id,nonce} — встать в конец блока
    const centerRef = useRef(null);
    const videoFileRef = useRef(null);
    const matFileRef = useRef(null);

    const doc = lesson.doc || [];
    const blocks = lesson.blocks || [];
    const cur = tab === 'practice' && typeof focus === 'number' ? blocks[focus] : null;

    // ── Ручное сохранение (по кнопке, БЕЗ автосейва). savedRef хранит ссылку на
    //    последний записанный в стор урок; любая правка делает lesson !== savedRef →
    //    состояние «есть несохранённые изменения» (dirty). Кнопка «Сохранить»
    //    (или Ctrl+S) пишет в стор и обнуляет dirty.
    const savedRef = useRef(lesson);
    useEffect(() => {
      if (forceBlank) return;
      setSaveState(lesson === savedRef.current ? 'saved' : 'dirty');
    }, [lesson, forceBlank]);

    // URL-адресация урока (единый эффект, зависимость только [routeId] —
    // на правки самого урока не дёргаемся):
    //  · нет id в URL (/learn/build) → вписываем текущий id (replace, без скролла);
    //  · id указывает на ДРУГОЙ существующий урок → загружаем его (back/forward,
    //    переход из библиотеки при смонтированном конструкторе), сбрасываем историю;
    //  · id битый → нормализуем URL к фактическому уроку.
    useEffect(() => {
      if (!Store || forceBlank) return;
      const cur = lessonRef.current;
      const curId = cur && cur.id;
      const writeUrl = () => { if (curId && curId !== 'blank') { try { nav('/learn/build/' + curId, { replace: true, top: false }); } catch (e) {} } };
      if (!routeId || routeId === 'blank') { writeUrl(); return; }
      if (routeId === curId) return;                 // уже на нужном уроке
      const l = Store.getSync(routeId);
      if (l) { savedRef.current = l; past.current = []; future.current = []; setLessonRaw(l); setFocus(null); setActiveCe(null); setOpenCards({}); }
      else writeUrl();                               // битый id → к реальному уроку
    }, [routeId]);

    // ── Горячие клавиши: Ctrl/Cmd+Z undo, +Shift/Ctrl+Y redo, Ctrl+S save.
    //    Ctrl+A намеренно НЕ перехватываем — нативно выделяет текст в блоке.
    useEffect(() => {
      const onKey = (e) => {
        const mod = e.ctrlKey || e.metaKey;
        if (!mod || e.altKey) return;
        const k = String(e.key || '').toLowerCase();
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
        else if (k === 's') { e.preventDefault(); if (!forceBlank) { const snap = lessonRef.current; if (Store) { Store.saveLocalSync(snap); Store.save(snap).catch(function () {}); } else L.save(snap); savedRef.current = snap; setSaveState('saving'); setTimeout(function () { setSaveState('saved'); }, 350); } }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [undo, redo]);

    // всплывающая панель форматирования: видна, пока в текстовом блоке есть выделение
    useEffect(() => {
      const upd = () => {
        const sel = window.getSelection && window.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { setBubble(null); return; }
        const node = sel.anchorNode;
        const el = node && (node.nodeType === 3 ? node.parentElement : node);
        const ce = el && el.closest ? el.closest('.lb-ce') : null;
        if (!ce) { setBubble(null); return; }
        const r = sel.getRangeAt(0).getBoundingClientRect();
        if (!r || (r.width < 2 && r.height < 2)) { setBubble(null); return; }
        setBubble({ x: r.left + r.width / 2, y: r.top });
      };
      document.addEventListener('selectionchange', upd);
      const onScroll = () => setBubble(null);
      const pane = centerRef.current;
      if (pane) pane.addEventListener('scroll', onScroll, { passive: true });
      return () => { document.removeEventListener('selectionchange', upd); if (pane) pane.removeEventListener('scroll', onScroll); };
    }, []);

    // ── мутаторы doc ──
    const patchDoc = (i, patch) => setLesson((l) => { const d = (l.doc || []).slice(); if (!d[i]) return l; d[i] = Object.assign({}, d[i], patch); return Object.assign({}, l, { doc: d }); }, 'doc:' + i);
    // Патч по _id (устойчив к перестановке/удалению блока во время фоновой загрузки медиа).
    const patchDocById = (id, patch) => setLesson((l) => { const d = (l.doc || []).slice(); const k = d.findIndex((b) => b && b._id === id); if (k < 0) return l; d[k] = Object.assign({}, d[k], patch); return Object.assign({}, l, { doc: d }); }, 'doc:' + id);
    const insertDoc = (i, block) => setLesson((l) => { const d = (l.doc || []).slice(); d.splice(i, 0, block); return Object.assign({}, l, { doc: d }); });
    const splitDoc = (i) => { const nb = L.blankDocBlock('para'); insertDoc(i + 1, nb); setFocusTarget({ id: nb._id, nonce: Date.now() }); };
    const removeDoc = (i) => setLesson((l) => Object.assign({}, l, { doc: (l.doc || []).filter((_, k) => k !== i) }));
    // Удаление пустого блока с переходом фокуса в конец предыдущего текстового
    // блока (Docs-like Backspace). История — отдельной записью (без коалесинга).
    const focusPrev = (i) => {
      const prev = (lesson.doc || [])[i - 1];
      setLesson((l) => { const d = (l.doc || []).slice(); d.splice(i, 1); return Object.assign({}, l, { doc: d }); });
      if (prev && (prev.kind === 'heading' || prev.kind === 'para' || prev.kind === 'quote')) setFocusTarget({ id: prev._id, nonce: Date.now() });
    };
    const moveDoc = (from, to) => setLesson((l) => { const d = (l.doc || []).slice(); const [x] = d.splice(from, 1); d.splice(to, 0, x); return Object.assign({}, l, { doc: d }); });
    const convertDoc = (i, kind) => setLesson((l) => {
      const d = (l.doc || []).slice(); const old = d[i];
      if (kind === 'bullets' || kind === 'numbered') d[i] = Object.assign({ _id: old._id, kind, items: [old.text || ''] });
      else if (kind === 'heading' || kind === 'para' || kind === 'quote') d[i] = { _id: old._id, kind, text: (old.text != null ? old.text : (old.items ? old.items.join(' ') : '')), marks: kind === 'heading' ? [] : (old.marks || []) };
      else d[i] = Object.assign({}, L.blankDocBlock(kind), { _id: old._id });
      return Object.assign({}, l, { doc: d });
    });
    // Markdown-конвертация: текстовый блок превращается в heading/quote/list.
    const convertMd = (i, kind, text) => setLesson((l) => {
      const d = (l.doc || []).slice(); const old = d[i] || {};
      let nb;
      if (kind === 'bullets' || kind === 'numbered') nb = { _id: old._id, kind, items: text ? [text] : [''] };
      else nb = { _id: old._id, kind, text: text || '', marks: [] };
      d[i] = nb;
      return Object.assign({}, l, { doc: d });
    });
    // Markdown → массив блоков (для вставки многострочного текста).
    const parseMdBlocks = (text) => {
      const out = []; let listKind = null; const items = [];
      const flush = () => { if (listKind && items.length) { out.push({ kind: listKind, items: items.slice() }); listKind = null; items.length = 0; } };
      String(text || '').replace(/\r/g, '').split('\n').forEach((raw) => {
        const line = raw.trim(); let m;
        if ((m = line.match(/^#{1,6}\s+(.*)/))) { flush(); out.push(Object.assign({ kind: 'heading' }, parseInline(m[1]))); }
        else if ((m = line.match(/^>\s+(.*)/))) { flush(); out.push(Object.assign({ kind: 'quote' }, parseInline(m[1]))); }
        else if ((m = line.match(/^[-*]\s+(.*)/))) { listKind = 'bullets'; items.push(parseInline(m[1]).text); }
        else if ((m = line.match(/^\d+\.\s+(.*)/))) { listKind = 'numbered'; items.push(parseInline(m[1]).text); }
        else if (line === '') { flush(); }
        else { flush(); out.push(Object.assign({ kind: 'para' }, parseInline(line))); }
      });
      flush();
      return out;
    };
    // Вставка разобранных блоков после блока i.
    const pasteMulti = (i, text) => {
      const bs = parseMdBlocks(text);
      if (!bs.length) return;
      setLesson((l) => {
        const d = (l.doc || []).slice();
        bs.forEach((b, k) => { const nb = L.blankDocBlock(b.kind); Object.assign(nb, b); d.splice(i + 1 + k, 0, nb); });
        return Object.assign({}, l, { doc: d });
      });
    };

    // ── мутаторы blocks (практика) ──
    const patchBlock = (i, patch) => setLesson((l) => { const a = l.blocks.slice(); a[i] = Object.assign({}, a[i], patch); return Object.assign({}, l, { blocks: a }); }, 'blk:' + i);
    const addBlock = (type) => { setLesson((l) => { const a = l.blocks.concat(L.blankBlock(type)); const ni = a.length - 1; setOpenCards((s) => Object.assign({}, s, { [ni]: true })); setFocus(ni); return Object.assign({}, l, { blocks: a }); }); setTab('practice'); setPalette(null); setMView('editor'); };
    const dupBlock = (i) => setLesson((l) => { const a = l.blocks.slice(); a.splice(i + 1, 0, L.clone(l.blocks[i])); setOpenCards((s) => Object.assign({}, s, { [i + 1]: true })); setFocus(i + 1); return Object.assign({}, l, { blocks: a }); });
    const delBlock = (i) => setLesson((l) => { const a = l.blocks.filter((_, k) => k !== i); setFocus((f) => (typeof f === 'number' ? Math.max(0, Math.min(f, a.length - 1)) : f)); return Object.assign({}, l, { blocks: a }); });
    const moveBlock = (from, to) => setLesson((l) => { const a = l.blocks.slice(); const [x] = a.splice(from, 1); a.splice(to, 0, x); return Object.assign({}, l, { blocks: a }); });

    // ── мутаторы мета ──
    const setMeta = (patch) => setLesson((l) => Object.assign({}, l, patch), 'meta');
    const setVideo = (patch) => setLesson((l) => Object.assign({}, l, { video: Object.assign({}, l.video || {}, patch) }), 'video');
    const onVideoPick = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; e.target.value = ''; const nm = f.name.replace(/\.[^.]+$/, ''); const lid = lessonRef.current && lessonRef.current.id; pickMedia(f, function (url, up) { if (up) setVideo({ file: url, upload: f.name, title: (vid.title) || nm, uploading: true }); else if (lessonRef.current && lessonRef.current.id === lid) setVideo({ file: url, uploading: false }); }); };
    const addMaterial = (patch) => setLesson((l) => Object.assign({}, l, { materials: (l.materials || []).concat(Object.assign({ title: 'Новый материал', url: '' }, patch || {})) }));
    const patchMaterial = (i, patch) => setLesson((l) => { const a = (l.materials || []).slice(); a[i] = Object.assign({}, a[i], patch); return Object.assign({}, l, { materials: a }); }, 'mat:' + i);
    const delMaterial = (i) => setLesson((l) => Object.assign({}, l, { materials: (l.materials || []).filter((_, k) => k !== i) }));
    const updateMatById = (id, patch) => setLesson((l) => Object.assign({}, l, { materials: (l.materials || []).map((m) => (m && m._id === id ? Object.assign({}, m, patch) : m)) }), 'mat:' + id);

    // ── «+» меню ──
    // позиционирование с учётом границ экрана: если снизу не влезает — открываем вверх,
    // по X прижимаем внутрь. Иначе на длинных уроках меню уезжает за сгиб и его не видно.
    const placeMenu = (rect, w, h) => {
      const W = w || 228, pad = 12;
      const maxH = Math.max(220, window.innerHeight - 2 * pad);
      const H = Math.min(h || 360, maxH);
      let x = rect.left;
      if (x + W + pad > window.innerWidth) x = Math.max(pad, window.innerWidth - W - pad);
      let y = rect.bottom + 6;
      if (y + H + pad > window.innerHeight) {
        const up = rect.top - H - 6;
        y = up >= pad ? up : Math.max(pad, window.innerHeight - H - pad);
      }
      return { x, y };
    };
    const openPlus = (idx, e) => {
      const r = (e.currentTarget || e.target).getBoundingClientRect();
      const p = placeMenu(r);
      setPlusAt({ idx, x: p.x, y: p.y });
    };
    const pickPlus = (kind) => { const at = plusAt; setPlusAt(null); if (!at) return; insertDoc(at.idx + 1, L.blankDocBlock(kind)); };

    // ── toolbar: bold/italic для активного contentEditable ──
    const toggleMark = (cmd) => {
      const el = document.activeElement;
      if (!el || !el.isContentEditable) return;
      try { document.execCommand(cmd); } catch (e) {}
      const i = activeCe;
      if (typeof i !== 'number') return;
      const data = readBlockFromDom(el);
      patchDoc(i, { text: data.text, marks: data.marks });
    };

    // Сохранение: локальный кеш мгновенно (мгновенный UI/превью) + PUT на бэкенд
    // (Store.save апсертит в eastside.lessons; при офлайне тихо падает на кеш).
    const persist = (l) => { if (Store) { Store.saveLocalSync(l); return Store.save(l); } L.save(l); return Promise.resolve(l); };
    const openAsStudent = () => {
      const cur = lessonRef.current || {};
      persist(cur);
      savedRef.current = cur; setSaveState('saved');
      nav('/learn/lesson' + (cur.id && cur.id !== 'blank' ? '/' + cur.id : ''));
    };
    const saveNow = () => {
      if (forceBlank) { setSaveState('saved'); return; }
      const snap = lessonRef.current;
      setSaveState('saving');
      // локально уже записано внутри persist; ждём подтверждения бэка для «Сохранено»
      Promise.resolve(persist(snap)).then(function () { savedRef.current = snap; setSaveState('saved'); })
        .catch(function () { savedRef.current = snap; setSaveState('saved'); });
    };
    const clearLesson = () => {
      let ok = true;
      try { ok = window.confirm('Очистить урок и начать с пустого листа?'); } catch (e) {}
      if (!ok) return;
      const prev = lessonRef.current || {};
      // Тот же id — очищаем урок «на месте» (остаётся той же записью в библиотеке).
      const keepId = prev.id && prev.id !== 'blank' ? prev.id : (Store ? Store.newId() : 'blank');
      const blank = { id: keepId, title: '', subtitle: '', goal: '', level: prev.level || 'HSK 1', video: {}, objectives: [], glossary: [], notes: '', doc: [], blocks: [], materials: [], createdAt: prev.createdAt, updatedAt: prev.updatedAt };
      setLesson(blank);
      setFocus(null); setActiveCe(null); setOpenCards({});
    };
    const arr = () => Ic.ArrowRight ? h(Ic.ArrowRight, { size: 15, className: 'arr' }) : null;
    const m = L.meta(lesson);
    const vid = lesson.video || {};
    const emb = L.videoEmbed(vid);
    const hasVideo = !!(emb && emb.src) || !!String(vid.file || '').trim();
    const LEVELS = ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'Разговорный'];

    /* ── ЛЕВЫЙ RAIL ── */
    const rail = h('div', null,
      h('div', { className: 'lb-rail__h' }, 'Структура урока'),
      h('div', { className: 'lb-grp' },
        h('div', { className: 'lb-grp__t' }, 'Теория'),
        h('button', { type: 'button', className: 'lb-rlink' + (tab === 'theory' && focus === 'video' ? ' is-sel' : ''), onClick: () => { setTab('theory'); setFocus('video'); setMView('editor'); } },
          h('span', { className: 'lb-rlink__ic' }, UI && UI.PlayGlyph ? UI.PlayGlyph(14) : (Ic.Monitor ? h(Ic.Monitor, { size: 15 }) : null)),
          h('div', { className: 'lb-rlink__b' }, h('div', { className: 'lb-rlink__t' }, 'Видео'), h('div', { className: 'lb-rlink__s' }, hasVideo ? (emb ? emb.provider : 'загружено') : 'не добавлено'))),
        h('button', { type: 'button', className: 'lb-rlink' + (tab === 'theory' && focus === 'materials' ? ' is-sel' : ''), onClick: () => { setTab('theory'); setFocus('materials'); setMView('editor'); } },
          h('span', { className: 'lb-rlink__ic' }, Ic.Paperclip ? h(Ic.Paperclip, { size: 15 }) : null),
          h('div', { className: 'lb-rlink__b' }, h('div', { className: 'lb-rlink__t' }, 'Материалы'), h('div', { className: 'lb-rlink__s' }, ((lesson.materials || []).length || 0) + ' ' + (((lesson.materials || []).length) === 1 ? 'файл' : 'файлов')))),
        h('button', { type: 'button', className: 'lb-rlink' + (tab === 'theory' && focus === null ? ' is-sel' : ''), onClick: () => { setTab('theory'); setFocus(null); setMView('editor'); } },
          h('span', { className: 'lb-rlink__ic' }, Ic.Doc ? h(Ic.Doc, { size: 15 }) : null),
          h('div', { className: 'lb-rlink__b' }, h('div', { className: 'lb-rlink__t' }, 'Документ'), h('div', { className: 'lb-rlink__s' }, doc.length + ' ' + (doc.length === 1 ? 'блок' : 'блоков'))))),
      h('div', { className: 'lb-grp' },
        h('div', { className: 'lb-grp__t' }, 'Практика', h('span', { className: 'lb-tab__c', style: { marginLeft: 'auto', background: 'rgba(22,32,59,.08)' } }, blocks.length)),
        blocks.length ? h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } }, blocks.map((b, i) => {
          const meta = L.typeMeta(b.type); const IcT = Ic[meta.icon] || Ic.Book;
          return h('button', { key: i, type: 'button', className: 'lb-rlink' + (tab === 'practice' && focus === i ? ' is-sel' : ''), onClick: () => { setTab('practice'); setFocus(i); setOpenCards((s) => Object.assign({}, s, { [i]: true })); setMView('editor'); } },
            h('span', { className: 'lb-rlink__n', style: { flex: '0 0 22px', width: 22, height: 22, borderRadius: 7, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--lb-ink-mute)', background: 'rgba(22,32,59,.05)' } }, i + 1),
            h('span', { className: 'lb-rlink__ic' }, IcT ? h(IcT, { size: 14 }) : null),
            h('div', { className: 'lb-rlink__b' }, h('div', { className: 'lb-rlink__t' }, meta.label)));
        })) : h('div', { className: 'lb-rail-empty' },
            h('span', { className: 'lb-rail-empty__ic' }, Ic.Compass ? h(Ic.Compass, { size: 16 }) : null),
            h('span', null, 'Пока нет заданий')),
        h('button', { type: 'button', className: 'lb-rail__add', onClick: () => setPalette(true) }, Ic.Plus ? h(Ic.Plus, { size: 15 }) : '+', 'Добавить задание')));

    /* ── ЦЕНТР: вкладка Теория ── */
    const videoZone = hasVideo
      ? h('div', { className: 'lb-video' },
          emb ? h('div', { className: 'lb-video__player' },
              h('iframe', { src: emb.src + (emb.src.indexOf('?') >= 0 ? '&' : '?') + 'rel=0', title: vid.title || 'Видеоурок', loading: 'lazy', allowFullScreen: true, allow: 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture' }))
            : vid.file ? h(VideoPlayer, { src: vid.file })
            : h('div', { className: 'lb-video__player' }, h('div', { className: 'lb-video__thumb' }, UI && UI.PlayGlyph ? UI.PlayGlyph(28) : '▶')),
          h('div', { className: 'lb-video__bar' },
            h('div', { className: 'lb-video__b' },
              h('input', { className: 'lb-video__t', value: vid.title || '', placeholder: 'Название видео', onChange: (e) => setVideo({ title: e.target.value }) }),
              h('div', { className: 'lb-video__s' }, (emb ? emb.provider : (vid.file ? 'Файл' : 'Видео')) + (vid.duration ? ' · ' + vid.duration : '') + (vid.uploading ? ' · загрузка…' : (vid.file && !emb && String(vid.file).indexOf('blob:') !== 0 ? ' · сохранено' : '')))),
            h('button', { type: 'button', className: 'lb-row__x', onClick: () => setVideo({ url: '', file: '', upload: '' }), 'aria-label': 'Убрать видео' }, Ic.Close ? h(Ic.Close, { size: 16 }) : '×')))
      : h('div', { className: 'lb-vempty' },
          h('input', { ref: videoFileRef, type: 'file', accept: 'video/*', style: { display: 'none' }, onChange: onVideoPick }),
          h('button', { type: 'button', className: 'lb-btn lb-btn--ghost', onClick: () => videoFileRef.current && videoFileRef.current.click() }, Ic.Plus ? h(Ic.Plus, { size: 15 }) : '+', 'Загрузить файл'),
          h('input', { className: 'lb-in', value: vid.url || '', placeholder: 'или ссылка: YouTube, Vimeo, RuTube, ВК', onChange: (e) => setVideo({ url: e.target.value }), onFocus: () => setFocus('video') }));

    const mats = lesson.materials || [];
    const onMatPick = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; e.target.value = ''; const mid = 'mt' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); pickMedia(f, function (url, up) { if (up) addMaterial({ _id: mid, title: f.name.replace(/\.[^.]+$/, ''), url: url, filename: f.name, size: f.size, uploading: true }); else updateMatById(mid, { url: url, uploading: false }); }); };
    const materialsZone = mats.length
      ? h('div', { className: 'lb-mats' },
          h('input', { ref: matFileRef, type: 'file', style: { display: 'none' }, onChange: onMatPick }),
          mats.map((mt, i) => h('div', { key: i, className: 'lb-mat', title: mt.filename || '' },
            Ic.File ? h(Ic.File, { size: 13 }) : null,
            h('span', { className: 'lb-mat__t' }, mt.title || 'Материал'),
            h('button', { type: 'button', className: 'lb-mat__x', onClick: () => delMaterial(i), 'aria-label': 'Удалить' }, Ic.Close ? h(Ic.Close, { size: 12 }) : '×'))),
          h('button', { type: 'button', className: 'lb-inline-add', style: { fontSize: 13, padding: '6px 8px' }, onClick: () => matFileRef.current && matFileRef.current.click() }, Ic.Plus ? h(Ic.Plus, { size: 13 }) : '+', 'ещё'))
      : h('div', { className: 'lb-inline-row' },
          h('input', { ref: matFileRef, type: 'file', style: { display: 'none' }, onChange: onMatPick }),
          h('button', { type: 'button', className: 'lb-inline-add', onClick: () => matFileRef.current && matFileRef.current.click() }, Ic.Plus ? h(Ic.Plus, { size: 15 }) : '+', 'Добавить материалы'));

    /* статичная панель форматирования убрана — теперь это всплывающий bubble по выделению текста (BubbleBar) */

    const theoryTab = h('div', { className: 'lb-doc' },
      h('textarea', { className: 'lb-titlein', rows: 1, value: lesson.title || '', placeholder: 'Название урока', ref: (el) => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }, onChange: (e) => { setMeta({ title: e.target.value }); const el = e.target; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }, onFocus: () => setFocus(null) }),
      h('input', { className: 'lb-subin', value: lesson.subtitle || '', placeholder: 'Короткое описание урока', onChange: (e) => setMeta({ subtitle: e.target.value }) }),
      h('div', { className: 'lb-sect' },
        h('div', { className: 'lb-card__h' },
          h('span', { className: 'lb-card__ic' }, Ic.Monitor ? h(Ic.Monitor, { size: 16 }) : null),
          h('span', { className: 'lb-card__t' }, 'Видео'),
          hasVideo ? h('span', { className: 'lb-card__s' }, emb ? emb.provider : 'Файл') : null),
        h('div', { className: 'lb-card' }, videoZone)),
      h('div', { className: 'lb-sect' },
        h('div', { className: 'lb-card__h' },
          h('span', { className: 'lb-card__ic' }, Ic.Paperclip ? h(Ic.Paperclip, { size: 16 }) : null),
          h('span', { className: 'lb-card__t' }, 'Материалы'),
          mats.length ? h('span', { className: 'lb-card__s' }, mats.length + ' ' + (mats.length === 1 ? 'файл' : 'файла')) : null),
        h('div', { className: 'lb-card' }, materialsZone)),
      h('div', { className: 'lb-sect' },
        h('div', { className: 'lb-konspect__head' },
          h('div', { className: 'lb-konspect__label' },
            h('span', { className: 'lb-konspect__title' }, 'Конспект'),
            h('span', { className: 'lb-konspect__hint' }, 'Пишите как в документе — выделяйте и форматируйте текст'))),
        h('div', { className: 'lb-konspect' },
          h('div', { className: 'lb-flow' },
            doc.length ? h(ReorderList, {
              items: doc, keyFor: (b) => b._id, onReorder: moveDoc, scrollRef: centerRef, reduced: reducedMotion, className: 'lb-flowlist',
              renderRow: (block, i, ctx) => h(DocRow, {
                key: block._id, block, idx: i, ctx, isActive: activeCe === i || focus === block._id,
                prevKind: i > 0 ? doc[i - 1].kind : null,
                onCommit: (patch) => patchDocById(block._id, patch), onRemove: () => removeDoc(i),
                onConvertMd: convertMd, onPasteMultiRow: pasteMulti,
                onEmptyBackspace: () => focusPrev(i), onSplit: () => splitDoc(i),
                focusSignal: focusTarget && focusTarget.id === block._id ? focusTarget.nonce : 0,
                onFocusRow: () => { if (block.kind === 'heading' || block.kind === 'para' || block.kind === 'quote') setActiveCe(i); setFocus(block._id); },
                onOpenPlus: (idx, e) => { const r = e.currentTarget.getBoundingClientRect(); const p = placeMenu(r); setPlusAt({ idx, x: p.x, y: p.y }); },
                registerActiveCe: setActiveCe,
              }),
            }) : h(GhostBlock, {
              onCreate: (b) => { const nb = L.blankDocBlock(b.kind); if (b.kind === 'bullets' || b.kind === 'numbered') nb.items = ['']; else { nb.text = b.text || ''; nb.marks = b.marks || []; } insertDoc(0, nb); if (b.kind !== 'bullets' && b.kind !== 'numbered') setFocusTarget({ id: nb._id, nonce: Date.now() }); },
              onPasteMulti: (text) => { const bs = parseMdBlocks(text); bs.forEach((b, k) => { const nb = L.blankDocBlock(b.kind); Object.assign(nb, b); insertDoc(k, nb); }); },
            }),
            h('div', { className: 'lb-flow__pad', onClick: () => { const nb = L.blankDocBlock('para'); insertDoc(doc.length, nb); setFocusTarget({ id: nb._id, nonce: Date.now() }); } },
              h('span', { className: 'lb-flow__pad__hint' }, 'Нажмите, чтобы добавить текст'))))));

    // FIXME: plusAt.refIdx — позиционирование меню по строке. Простой fallback: открыть по курсору клика.
    // Уточняем координаты при рендере, если needRect.
    // (Реализовано ниже через эффект — но для простоты используем координаты из openPlus.)

    /* ── ЦЕНТР: вкладка Практика ── */
    const practiceTab = h('div', { className: 'lb-prac' },
      blocks.length ? h(ReorderList, {
        items: blocks, keyFor: (b, i) => 'p' + i, onReorder: moveBlock, scrollRef: centerRef, reduced: reducedMotion, className: 'lb-praclist',
        renderRow: (block, i, ctx) => h(PracticeCard, {
          key: i, block, idx: i, ctx,
          isOpen: !!openCards[i], isSelected: focus === i,
          canUp: i > 0, canDown: i < blocks.length - 1,
          onMoveUp: () => moveBlock(i, i - 1), onMoveDown: () => moveBlock(i, i + 1),
          onToggle: () => setOpenCards((s) => Object.assign({}, s, { [i]: !s[i] })),
          onPatch: (patch) => patchBlock(i, patch),
          onDup: () => dupBlock(i), onDel: () => delBlock(i),
          onSelect: () => setFocus(i),
        }),
      }) : h('div', { className: 'lb-prev-empty', style: { maxWidth: 'none' } }, 'Практика пуста. Добавьте первое задание.'),
      h('button', { type: 'button', className: 'lb-endplus', style: { alignSelf: 'center' }, onClick: () => setPalette(true) }, Ic.Plus ? h(Ic.Plus, { size: 15 }) : '+', 'Добавить задание'));

    const center = h('div', { className: 'lb-pane lb-pane--center', ref: centerRef },
      h('div', { className: 'lb-canvas' },
        h('div', { className: 'lb-tabs' },
          h('div', { className: 'lb-tabseg' },
            h('button', { type: 'button', className: 'lb-tab' + (tab === 'theory' ? ' is-on' : ''), onClick: () => setTab('theory') }, 'Теория', h('span', { className: 'lb-tab__c' }, doc.length)),
            h('button', { type: 'button', className: 'lb-tab' + (tab === 'practice' ? ' is-on' : ''), onClick: () => setTab('practice') }, 'Практика', h('span', { className: 'lb-tab__c' }, blocks.length)))),
        tab === 'theory' ? theoryTab : practiceTab));

    /* ── ПРЕВЬЮ справа ── */
    const preview = h('div', { className: 'lb-pane lb-pane--prev' },
      h('div', { className: 'lb-prevh' },
        h('span', { className: 'lb-prevh__t' }, 'Превью ученика'),
        h('span', { className: 'lb-prevh__s' }, tab === 'theory' ? 'Теория' : 'Практика')),
      tab === 'theory'
        ? h(R.Fragment, null,
            h(PhoneFrame, null, UI ? h(UI.StudyView, { lesson, compact: true, onStart: function () { setTab('practice'); if (blocks.length) { setFocus(0); setOpenCards(function (s) { return Object.assign({}, s, { 0: true }); }); } } }) : null),
            h('div', { className: 'lb-prev__note' }, 'Так ученик видит урок: видео, конспект и вход в домашнее задание.'))
        : h(PracticePreview, { block: cur, lesson }));

    /* ── палитра заданий (модалка) ── */
    const paletteModal = palette ? h('div', { className: 'lb-overlay', onClick: () => setPalette(null) },
      h('div', { className: 'lb-modal', role: 'dialog', onClick: (e) => e.stopPropagation() },
        h('div', { className: 'lb-modal__h' },
          h('span', { className: 'lb-modal__t' }, 'Добавить задание'),
          h('button', { type: 'button', className: 'lb-modal__x', onClick: () => setPalette(null), 'aria-label': 'Закрыть' }, Ic.Close ? h(Ic.Close, { size: 18 }) : '×')),
        h('div', { className: 'lb-modal__grid' },
          L.TYPES.filter((t) => t.type !== 'theory').map((t) => {
            const IcT = Ic[t.icon] || Ic.Book;
            return h('button', { key: t.type, type: 'button', className: 'lb-modal__card', onClick: () => addBlock(t.type) },
              h('span', { className: 'lb-modal__ic' }, IcT ? h(IcT, { size: 20 }) : null),
              h('span', { className: 'lb-modal__label' }, t.label),
              h('span', { className: 'lb-modal__gets' }, t.gets));
          })))) : null;

    return h('div', { className: 'lb-app' },
      h('div', { className: 'lb-top' },
        h('button', { type: 'button', className: 'lb-back', onClick: () => { if (saveState === 'dirty') { let ok = true; try { ok = window.confirm('Есть несохранённые изменения. Выйти без сохранения?'); } catch (e) {} if (!ok) return; } nav('/learn/lessons'); }, 'aria-label': 'К библиотеке уроков', title: 'К библиотеке уроков' }, Ic.ArrowLeft ? h(Ic.ArrowLeft, { size: 18 }) : '‹'),
        h('div', { className: 'lb-brand' }, h('div', { className: 'lb-brand__kick' }, 'ИСТСАЙД · Конструктор'), h('div', { className: 'lb-brand__role' }, 'Кабинет преподавателя')),
        h('div', { className: 'lb-mhead' },
          h('div', { className: 'lb-mhead__t' }, lesson.title || 'Новый урок'),
          h('div', { className: 'lb-mhead__s' + (saveState === 'dirty' ? ' is-dirty' : '') }, saveState === 'saving' ? 'Сохранение…' : saveState === 'dirty' ? 'Не сохранено' : 'Сохранено')),
        h('div', { className: 'lb-top__sp' }),
        h('div', { className: 'lb-history' },
          h('button', { type: 'button', className: 'lb-hbtn', onClick: undo, disabled: !canUndo, title: 'Отменить (Ctrl+Z)', 'aria-label': 'Отменить' }, UndoIc(15), h('span', { className: 'lb-hbtn__tx' }, 'Отменить')),
          h('button', { type: 'button', className: 'lb-hbtn', onClick: redo, disabled: !canRedo, title: 'Вернуть (Ctrl+Shift+Z)', 'aria-label': 'Вернуть' }, RedoIc(15), h('span', { className: 'lb-hbtn__tx' }, 'Вернуть'))),
        h('button', { type: 'button', className: 'lb-clearbtn', onClick: clearLesson, title: 'Очистить урок — начать с пустого листа', 'aria-label': 'Очистить урок' }, Ic.Trash ? h(Ic.Trash, { size: 16 }) : '✕', h('span', { className: 'lb-clearbtn__tx' }, 'Очистить')),
        h('button', { type: 'button', className: 'lb-savebtn ' + (saveState === 'saving' ? 'is-saving' : saveState === 'dirty' ? 'is-dirty' : 'is-saved'), onClick: saveNow, disabled: saveState === 'saved', title: 'Сохранить (Ctrl+S)' },
          saveState === 'saving'
            ? h('span', { className: 'lb-savebtn__spin', 'aria-hidden': true })
            : saveState === 'saved'
              ? (Ic.Check ? h(Ic.Check, { size: 15, strokeWidth: 2.6 }) : null)
              : SaveIc(15),
          h('span', { className: 'lb-savebtn__tx' }, saveState === 'saving' ? 'Сохранение…' : saveState === 'dirty' ? 'Сохранить' : 'Сохранено')),
        h('button', { type: 'button', className: 'lb-btn lb-btn--primary', onClick: openAsStudent }, Ic.Eye ? h(Ic.Eye, { size: 15 }) : null, h('span', { className: 'lb-btn__tx' }, 'Открыть как ученик'), h('span', { className: 'lb-btn__txm' }, 'Ученик'), arr())),
      h('div', { className: 'lb-body', 'data-m': mView },
        h('div', { className: 'lb-pane lb-pane--rail' }, rail),
        center,
        preview),
      h('div', { className: 'lb-mnav' },
        [
          { k: 'rail', label: 'Структура', ic: Ic.Compass },
          { k: 'editor', label: 'Редактор', ic: Ic.Doc },
          { k: 'preview', label: 'Превью', ic: Ic.Monitor },
        ].map((it) => h('button', {
          key: it.k, type: 'button',
          className: 'lb-mnav__b' + (mView === it.k ? ' is-on' : ''),
          onClick: () => setMView(it.k),
        }, it.ic ? h(it.ic, { size: 19 }) : null, h('span', null, it.label)))),
      plusAt ? h(PlusMenu, { pos: { x: plusAt.x, y: plusAt.y }, onPick: pickPlus, onClose: () => setPlusAt(null) }) : null,
      bubble && typeof activeCe === 'number' && doc[activeCe] ? h(BubbleBar, { x: bubble.x, y: bubble.y, onBold: () => toggleMark('bold'), onItalic: () => toggleMark('italic'), onKind: (k) => convertDoc(activeCe, k) }) : null,
      paletteModal);
  }

  (window.EScreens = window.EScreens || {}).LearnBuilder = LearnBuilder;
})();
