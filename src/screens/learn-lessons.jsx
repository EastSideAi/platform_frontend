/* ============================================================================
   EastSide — Библиотека уроков (window.EScreens.LearnLessons · #/learn/lessons)
   ----------------------------------------------------------------------------
   Кабинет преподавателя: список всех уроков как адресуемых сущностей. Отсюда
   заходишь на КОНКРЕТНЫЙ урок — редактировать (#/learn/build/:id) или открыть
   как ученик (#/learn/lesson/:id), дублировать, удалить, создать новый.
   Данные — window.ELessonStore (локальная таблица + REST при ES_API_BASE).

   Режим B «Рабочее» (design.md): светлое стекло, тот же язык, что и конструктор
   (--lb-* токены). Иерархия — ОДИН якорь: широкая карточка «Продолжить» для
   последнего урока + плотная сетка остальных. Свечение — внутрь (inset), обводки
   полупрозрачные, Manrope, цифры tabular-nums, голос на «вы».
   ============================================================================ */
(function () {
  'use strict';
  const R = window.React || React;
  const { createElement: h, useState, useCallback } = R;
  const Ic = window.EIcons || {};
  const Store = window.ELessonStore;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  /* ── стили (self-contained, токены совпадают с конструктором) ─────────────── */
  const CSS = `
  .ll-app{--lb-acc:#2073E6;--lb-acc-2:#5CB4FF;--lb-acc-deep:#1E63C2;--lb-acc-ink:#1763C8;
    --lb-acc-soft:rgba(43,143,255,.1);--lb-acc-line:rgba(43,143,255,.4);
    --lb-ink:#15203B;--lb-ink-sub:rgba(21,32,59,.6);--lb-ink-mute:rgba(21,32,59,.42);--lb-ink-faint:rgba(21,32,59,.24);
    --lb-line:rgba(22,32,59,.08);--lb-line-strong:rgba(22,32,59,.14);--lb-jade:#1C7E52;--lb-rose:#B23B2A;
    position:fixed;inset:0;display:flex;flex-direction:column;font-family:'Manrope',-apple-system,BlinkMacSystemFont,system-ui,'Segoe UI',sans-serif;
    color:var(--lb-ink);z-index:1;
    background:
      radial-gradient(760px 500px at 96% -10%, rgba(118,150,255,.13) 0%, transparent 64%),
      radial-gradient(560px 460px at -3% 0%, rgba(120,170,255,.09) 0%, transparent 62%),
      linear-gradient(180deg,#F4F6FD 0%,#FAFBFF 58%,#F4F6FD 100%);}
  .ll-app *{box-sizing:border-box;}
  .ll-num{font-variant-numeric:tabular-nums;}

  /* верхняя панель */
  .ll-top{flex:0 0 auto;display:flex;align-items:center;gap:14px;padding:13px 22px;border-bottom:1px solid var(--lb-line);
    background:rgba(247,248,254,.9);backdrop-filter:blur(12px);}
  .ll-back{flex:0 0 auto;width:38px;height:38px;border-radius:11px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-sub);
    background:rgba(255,255,255,.7);border:1.5px solid rgba(255,255,255,.9);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:transform .15s,color .15s;}
  .ll-back:hover{transform:translateY(-1px);color:var(--lb-ink);}
  .ll-brand__kick{font-size:12.5px;font-weight:600;color:var(--lb-ink);letter-spacing:-.01em;}
  .ll-brand__role{font-size:11.5px;font-weight:500;color:var(--lb-ink-mute);margin-top:1px;}
  .ll-sp{flex:1 1 auto;}
  .ll-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;border:0;white-space:nowrap;font-family:inherit;
    font-size:13.5px;font-weight:600;padding:10px 16px;border-radius:11px;transition:transform .14s,background .14s,box-shadow .14s,color .14s;}
  .ll-btn svg{transition:transform .15s;}
  .ll-btn--primary{background:#2073E6;color:#fff;box-shadow:inset 0 0 18px rgba(120,190,255,.8),inset 0 1px 0 rgba(255,255,255,.32);}
  .ll-btn--primary:hover{background:#2B8FFF;transform:translateY(-1px);box-shadow:inset 0 0 22px rgba(150,205,255,.9),inset 0 1px 0 rgba(255,255,255,.36);}
  .ll-btn--primary .arr{transform:rotate(-45deg);} .ll-btn--primary:hover .arr{transform:rotate(-45deg) translateX(2px);}
  .ll-btn--ghost{background:rgba(255,255,255,.66);color:var(--lb-ink);border:1.5px solid rgba(255,255,255,.95);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);}
  .ll-btn--ghost:hover{background:#fff;transform:translateY(-1px);}
  .ll-btn--sm{font-size:12.5px;padding:8px 13px;border-radius:10px;gap:6px;}

  /* прокрутка + колонка */
  .ll-scroll{flex:1 1 auto;min-height:0;overflow-y:auto;}
  .ll-scroll::-webkit-scrollbar{width:9px;} .ll-scroll::-webkit-scrollbar-thumb{background:rgba(22,32,59,.13);border-radius:99px;}
  .ll-wrap{max-width:1120px;margin:0 auto;padding:40px 44px 96px;}
  .ll-wrap>*{animation:llUp .5s cubic-bezier(.23,1,.32,1) both;}
  .ll-wrap>*:nth-child(2){animation-delay:.05s;} .ll-wrap>*:nth-child(3){animation-delay:.1s;} .ll-wrap>*:nth-child(4){animation-delay:.15s;}
  @keyframes llUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
  @media (prefers-reduced-motion:reduce){.ll-wrap>*{animation:none;}}

  /* заголовок страницы */
  .ll-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:26px;}
  .ll-h1{font-size:30px;font-weight:800;letter-spacing:-.03em;line-height:1.05;text-wrap:balance;margin:0;}
  .ll-h1sub{margin-top:8px;font-size:14px;font-weight:500;color:var(--lb-ink-sub);}

  /* секция-подпись (не серая мелкая метка — нормальный чернильный заголовок) */
  .ll-sec{display:flex;align-items:center;gap:10px;margin:34px 2px 15px;}
  .ll-sec__t{font-size:16px;font-weight:700;letter-spacing:-.02em;color:var(--lb-ink);}
  .ll-sec__c{font-size:12.5px;font-weight:600;color:var(--lb-ink-mute);padding:2px 9px;border-radius:99px;background:rgba(22,32,59,.06);}

  /* мета-строка урока */
  .ll-meta{display:flex;align-items:center;flex-wrap:wrap;gap:5px 14px;font-size:12.5px;font-weight:500;color:var(--lb-ink-mute);}
  .ll-meta b{font-weight:700;color:var(--lb-ink-sub);font-variant-numeric:tabular-nums;}
  .ll-meta i{width:3px;height:3px;border-radius:50%;background:var(--lb-ink-faint);font-style:normal;}
  .ll-chip{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--lb-acc-ink);
    padding:4px 10px;border-radius:99px;background:var(--lb-acc-soft);border:1px solid rgba(43,143,255,.16);}
  .ll-chip--v{color:var(--lb-ink-sub);background:rgba(22,32,59,.05);border-color:var(--lb-line);}

  /* ЯКОРЬ — карточка «Продолжить» (широкая, светится изнутри) */
  .ll-resume{position:relative;display:grid;grid-template-columns:1fr auto;align-items:center;gap:26px;
    padding:26px 28px;border-radius:22px;background:rgba(255,255,255,.62);border:1.5px solid var(--lb-acc-line);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 0 46px rgba(43,143,255,.14),inset 0 0 9px rgba(43,143,255,.07);}
  .ll-resume__kick{font-size:12.5px;font-weight:700;color:var(--lb-acc-ink);margin-bottom:8px;display:flex;align-items:center;gap:7px;}
  .ll-resume__t{font-size:23px;font-weight:800;letter-spacing:-.025em;line-height:1.1;text-wrap:balance;margin:0 0 7px;}
  .ll-resume__s{font-size:13.5px;font-weight:500;color:var(--lb-ink-sub);line-height:1.45;margin:0 0 14px;max-width:60ch;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .ll-resume__acts{display:flex;flex-direction:column;gap:9px;min-width:186px;}

  /* сетка уроков */
  .ll-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(292px,1fr));gap:16px;}
  .ll-card{position:relative;display:flex;flex-direction:column;min-height:172px;padding:18px 18px 15px;border-radius:18px;cursor:pointer;
    background:rgba(255,255,255,.52);border:1px solid var(--lb-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);
    transition:transform .16s cubic-bezier(.23,1,.32,1),background .16s,border-color .16s;}
  .ll-card:hover{transform:translateY(-2px);background:rgba(255,255,255,.86);border-color:var(--lb-acc-line);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 30px rgba(43,143,255,.1);}
  .ll-card__top{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
  .ll-card__t{font-size:16.5px;font-weight:700;letter-spacing:-.02em;line-height:1.22;color:var(--lb-ink);margin:0;text-wrap:balance;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .ll-card__s{margin-top:6px;font-size:13px;font-weight:500;color:var(--lb-ink-sub);line-height:1.4;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
  .ll-card__foot{margin-top:auto;padding-top:13px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--lb-line);}
  .ll-card__date{font-size:11.5px;font-weight:600;color:var(--lb-ink-mute);}
  .ll-card__gut{display:flex;gap:5px;opacity:0;transition:opacity .15s;}
  .ll-card:hover .ll-card__gut,.ll-card:focus-within .ll-card__gut{opacity:1;}
  .ll-gbtn{width:31px;height:31px;border-radius:9px;display:grid;place-items:center;cursor:pointer;color:var(--lb-ink-sub);
    background:rgba(255,255,255,.9);border:1px solid var(--lb-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.9);transition:color .14s,background .14s,transform .14s;}
  .ll-gbtn:hover{color:var(--lb-ink);transform:translateY(-1px);background:#fff;}
  .ll-gbtn--del:hover{color:var(--lb-rose);border-color:rgba(178,59,42,.3);}
  .ll-card__go{position:absolute;top:16px;right:16px;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:var(--lb-acc-deep);
    background:var(--lb-acc-soft);opacity:0;transform:translate(-2px,2px);transition:opacity .16s,transform .16s;}
  .ll-card:hover .ll-card__go{opacity:1;transform:none;}
  .ll-card__go .arr{transform:rotate(-45deg);}

  /* пустое состояние */
  .ll-empty{margin-top:40px;padding:56px 32px;text-align:center;border-radius:22px;background:rgba(255,255,255,.5);border:1px dashed rgba(22,32,59,.16);}
  .ll-empty__ic{width:56px;height:56px;border-radius:16px;margin:0 auto 18px;display:grid;place-items:center;color:var(--lb-acc-deep);
    background:var(--lb-acc-soft);box-shadow:inset 0 0 20px rgba(43,143,255,.16);}
  .ll-empty__t{font-size:19px;font-weight:800;letter-spacing:-.02em;margin:0 0 8px;}
  .ll-empty__s{font-size:14px;font-weight:500;color:var(--lb-ink-sub);margin:0 auto 22px;max-width:44ch;line-height:1.5;}

  @media (max-width:720px){
    .ll-top{padding:10px 14px;gap:10px;}
    .ll-brand{display:none;}
    .ll-wrap{padding:26px 16px 90px;}
    .ll-h1{font-size:25px;}
    .ll-head{flex-direction:column;align-items:stretch;gap:16px;}
    .ll-resume{grid-template-columns:1fr;gap:16px;padding:20px;}
    .ll-resume__acts{min-width:0;}
    .ll-grid{grid-template-columns:1fr;}
  }
  `;
  if (typeof document !== 'undefined' && !document.getElementById('learn-lessons-styles')) {
    const el = document.createElement('style'); el.id = 'learn-lessons-styles'; el.textContent = CSS; document.head.appendChild(el);
  }

  /* ── хелперы ─────────────────────────────────────────────────────────────── */
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso); if (isNaN(d.getTime())) return '';
    const now = new Date();
    const day = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const yest = new Date(now); yest.setDate(now.getDate() - 1);
    if (day(d, now)) return 'сегодня';
    if (day(d, yest)) return 'вчера';
    return d.getDate() + ' ' + MONTHS[d.getMonth()];
  }
  function plural(n, one, few, many) {
    const m = Math.abs(n) % 100, n1 = m % 10;
    if (m > 10 && m < 20) return many;
    if (n1 > 1 && n1 < 5) return few;
    if (n1 === 1) return one;
    return many;
  }
  const dot = () => h('i', null);

  // Иконка «дублировать» (нет в общем наборе) — локальная line-SVG.
  function dupIcon(size) {
    return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
      h('rect', { x: 9, y: 9, width: 11, height: 11, rx: 2.4 }),
      h('path', { d: 'M5 15V6a2 2 0 0 1 2-2h9' }));
  }

  /* ── мета-строка урока (конспект · задания · слова · минуты) ─────────────── */
  function metaRow(c) {
    const parts = [];
    if (c.doc) parts.push(h('span', { key: 'd' }, h('b', { className: 'll-num' }, c.doc), ' ' + plural(c.doc, 'блок', 'блока', 'блоков')));
    if (c.blocks) parts.push(h('span', { key: 'b' }, h('b', { className: 'll-num' }, c.blocks), ' ' + plural(c.blocks, 'задание', 'задания', 'заданий')));
    if (c.words) parts.push(h('span', { key: 'w' }, h('b', { className: 'll-num' }, c.words), ' ' + plural(c.words, 'слово', 'слова', 'слов')));
    if (c.minutes) parts.push(h('span', { key: 'm' }, '~', h('b', { className: 'll-num' }, c.minutes), ' мин'));
    const out = [];
    parts.forEach((p, i) => { if (i) out.push(h('i', { key: 'i' + i })); out.push(p); });
    return out;
  }

  /* ── карточка урока в сетке ──────────────────────────────────────────────── */
  function LessonCard(props) {
    const it = props.item;
    const edit = () => nav('/learn/build/' + it.id);
    const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
    return h('div', { className: 'll-card', role: 'button', tabIndex: 0, onClick: edit, onKeyDown: (e) => { if (e.key === 'Enter') edit(); } },
      h('div', { className: 'll-card__go' }, Ic.ArrowRight ? h(Ic.ArrowRight, { size: 16, className: 'arr' }) : '→'),
      h('div', { className: 'll-card__top' },
        h('span', { className: 'll-chip' }, it.level || 'Урок'),
        it.hasVideo ? h('span', { className: 'll-chip ll-chip--v' }, Ic.Monitor ? h(Ic.Monitor, { size: 13 }) : null, 'видео') : null),
      h('h3', { className: 'll-card__t' }, it.title || 'Новый урок'),
      it.subtitle ? h('div', { className: 'll-card__s' }, it.subtitle) : null,
      h('div', { className: 'll-meta', style: { marginTop: 12 } }, metaRow(it.counts || {})),
      h('div', { className: 'll-card__foot' },
        h('span', { className: 'll-card__date' }, it.updatedAt ? 'изменён ' + fmtDate(it.updatedAt) : 'черновик'),
        h('div', { className: 'll-card__gut' },
          h('button', { type: 'button', className: 'll-gbtn', title: 'Открыть как ученик', 'aria-label': 'Открыть как ученик', onClick: stop(() => nav('/learn/lesson/' + it.id)) }, Ic.Eye ? h(Ic.Eye, { size: 16 }) : '👁'),
          h('button', { type: 'button', className: 'll-gbtn', title: 'Дублировать', 'aria-label': 'Дублировать', onClick: stop(() => props.onDup(it.id)) }, dupIcon(16)),
          h('button', { type: 'button', className: 'll-gbtn ll-gbtn--del', title: 'Удалить', 'aria-label': 'Удалить', onClick: stop(() => props.onDel(it)) }, Ic.Trash ? h(Ic.Trash, { size: 16 }) : '✕'))));
  }

  /* ── КОРНЕВОЙ ЭКРАН ──────────────────────────────────────────────────────── */
  function LearnLessons() {
    if (!Store) return h('div', { style: { padding: 40 } }, 'Хранилище уроков не загружено');
    const [items, setItems] = useState(() => Store.listSync());
    const refresh = useCallback(() => setItems(Store.listSync()), []);

    const create = useCallback(() => {
      Store.create().then((l) => { if (l) nav('/learn/build/' + l.id); }).catch(() => {});
    }, []);
    const onDup = useCallback((id) => {
      Store.duplicate(id).then(() => refresh()).catch(() => {});
    }, [refresh]);
    const onDel = useCallback((it) => {
      let ok = true;
      try { ok = window.confirm('Удалить урок «' + (it.title || 'Новый урок') + '»? Это действие необратимо.'); } catch (e) {}
      if (!ok) return;
      Store.remove(it.id).then(() => refresh()).catch(() => {});
    }, [refresh]);

    const curId = Store.currentId();
    const resume = items.find((i) => i.id === curId) || items[0] || null;
    const rest = resume ? items.filter((i) => i.id !== resume.id) : items;
    const total = items.length;

    const newBtn = h('button', { type: 'button', className: 'll-btn ll-btn--primary', onClick: create }, Ic.Plus ? h(Ic.Plus, { size: 16 }) : '+', 'Новый урок');

    return h('div', { className: 'll-app' },
      h('div', { className: 'll-top' },
        h('button', { type: 'button', className: 'll-back', onClick: () => nav('/learn'), 'aria-label': 'В обучение', title: 'В обучение' }, Ic.ArrowLeft ? h(Ic.ArrowLeft, { size: 18 }) : '‹'),
        h('div', { className: 'll-brand' },
          h('div', { className: 'll-brand__kick' }, 'ИСТСАЙД · Уроки'),
          h('div', { className: 'll-brand__role' }, 'Кабинет преподавателя')),
        h('div', { className: 'll-sp' }),
        newBtn),
      h('div', { className: 'll-scroll' },
        h('div', { className: 'll-wrap' },
          h('div', { className: 'll-head' },
            h('div', null,
              h('h1', { className: 'll-h1' }, 'Библиотека уроков'),
              h('div', { className: 'll-h1sub' }, total
                ? [h('b', { key: 'n', className: 'll-num', style: { fontWeight: 700, color: 'var(--lb-ink-sub)' } }, total), ' ' + plural(total, 'урок', 'урока', 'уроков') + ' · сохраняются автоматически']
                : 'Соберите первый урок — он появится здесь'))),

          total === 0
            ? h('div', { className: 'll-empty' },
                h('div', { className: 'll-empty__ic' }, Ic.Book ? h(Ic.Book, { size: 26 }) : '📘'),
                h('h2', { className: 'll-empty__t' }, 'Пока нет ни одного урока'),
                h('p', { className: 'll-empty__s' }, 'Создайте первый урок: видео, конспект и интерактивные задания. Всё сохраняется само.'),
                h('button', { type: 'button', className: 'll-btn ll-btn--primary', onClick: create, style: { margin: '0 auto' } }, Ic.Plus ? h(Ic.Plus, { size: 16 }) : '+', 'Создать первый урок'))
            : null,

          resume ? h('div', { className: 'll-resume' },
            h('div', null,
              h('div', { className: 'll-resume__kick' }, Ic.Edit ? h(Ic.Edit, { size: 14 }) : null, 'Продолжить работу'),
              h('h2', { className: 'll-resume__t' }, resume.title || 'Новый урок'),
              resume.subtitle ? h('p', { className: 'll-resume__s' }, resume.subtitle) : null,
              h('div', { className: 'll-meta' },
                h('span', { className: 'll-chip', style: { marginRight: 4 } }, resume.level || 'Урок'),
                metaRow(resume.counts || {}),
                resume.updatedAt ? [h('i', { key: 'sep' }), h('span', { key: 'dt' }, 'изменён ' + fmtDate(resume.updatedAt))] : null)),
            h('div', { className: 'll-resume__acts' },
              h('button', { type: 'button', className: 'll-btn ll-btn--primary', onClick: () => nav('/learn/build/' + resume.id) }, Ic.Edit ? h(Ic.Edit, { size: 15 }) : null, 'Редактировать', Ic.ArrowRight ? h(Ic.ArrowRight, { size: 15, className: 'arr' }) : null),
              h('button', { type: 'button', className: 'll-btn ll-btn--ghost', onClick: () => nav('/learn/lesson/' + resume.id) }, Ic.Eye ? h(Ic.Eye, { size: 15 }) : null, 'Открыть как ученик'))) : null,

          rest.length ? h('div', { className: 'll-sec' },
            h('span', { className: 'll-sec__t' }, resume ? 'Другие уроки' : 'Все уроки'),
            h('span', { className: 'll-sec__c ll-num' }, rest.length)) : null,
          rest.length ? h('div', { className: 'll-grid' },
            rest.map((it) => h(LessonCard, { key: it.id, item: it, onDup, onDel }))) : null)));
  }

  (window.EScreens = window.EScreens || {}).LearnLessons = LearnLessons;
})();
