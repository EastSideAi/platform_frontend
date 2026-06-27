/* ============================================================================
   EastSide UI — DASHBOARD-композиция (window.EUI.*) · НОВЫЙ скелет платформы
   ----------------------------------------------------------------------------
   Это НЕ раскладка анкеты (сайдбар-функций → плашка → панель-спутник → вертикаль).
   Это ДАШБОРД: горизонтальный роадмап сверху, фокус «сейчас», мастер-деталь
   выбранной вехи, плавающий ассистент, нижняя навигация на мобиле.

   Источник правды по UX — docs/UX-PLATFORM.md §3/§4/§5. Визуальный язык —
   design.md (sapphire, молочная плашка, inset-glow, гора). Стиль ТОЛЬКО через
   токены/классы из styles.css — ни одного хардкод-цвета/тени в JSX.

   Состав (регистрируются в window.EUI):
     DashShell      — каркас дашборда (тёмная база → светлая плашка-полотно),
                      БЕЗ панели-спутника и БЕЗ сайдбара-функций. Несёт верхнюю
                      строку статуса, контент в колонке, нижнюю нав на мобиле и
                      слот для FAB.
     RoadmapStrip   — горизонтальный степпер 4 вех: светящаяся тропа через
                      пройденные узлы, текущий крупнее, «Этап N из 4», клик → выбор.
     StageDetail    — поверхность знаний выбранной вехи: зачем, ЕЁ под-этапы
                      (текущий помечен), документы, кто что делает (+owner),
                      дедлайн, материалы, «Спросить про этот этап». На мобиле —
                      нижний лист (Sheet) по тапу на узел.
     AssistantFab   — глобальная плавающая кнопка (низ-право, над нижним баром).
     AssistantPopup — drawer-чат поверх экрана, контекстный (принимает {stage}).
     BottomNav      — нижний таб-бар на мобиле (3 пункта); десктоп-вариант — рейл.
     ProgressEmblem — компактная карточка «восхождение»: мини-гора + «Пройдено X из Y».
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect, useRef } = React;
  const EUI = (window.EUI = window.EUI || {});
  const cx = EUI.cx || function () { return Array.prototype.filter.call(arguments, Boolean).join(' '); };
  const Link = (window.ERouter && window.ERouter.Link) || null;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};

  // статус документа → тон/иконка/подпись
  const DOC = {
    accepted:  { tone: 'success', label: 'принят' },
    in_review: { tone: 'info',    label: 'на проверке' },
    awaiting:  { tone: 'neutral', label: 'ждём' },
    needs_fix: { tone: 'danger',  label: 'правка' },
  };

  // ── DashShell — каркас дашборда ────────────────────────────────────────
  // props: statusLine (ReactNode — строка «где я» сверху), nav (массив пунктов
  //        нижней/боковой нав [{icon,label,to,onClick,active}]), brand {name,mark},
  //        onMenu, fab (ReactNode — плавашка ассистента), children (полотно),
  //        themeToggle (ReactNode — переключатель темы в шапку).
  function DashShell(props) {
    const { statusLine, nav: navItems = [], brand, fab, children, themeToggle, className } = props;
    return h('div', { className: cx('e-dash', className) },
      // десктоп-рейл (slim) + мобайл-топбар несут навигацию
      h(DashRail, { brand, items: navItems, themeToggle, key: 'rail' }),
      h('div', { className: 'e-dash__body', key: 'body' },
        (statusLine || themeToggle) ? h('div', { className: 'e-dash__status', key: 'st' },
          statusLine,
          themeToggle ? h('span', { className: 'e-dash__theme' }, themeToggle) : null) : null,
        h('main', { id: 'main', className: 'e-dash__plate', key: 'plate' },
          h('div', { className: 'e-dash__col' }, children))
      ),
      h(BottomNav, { items: navItems, key: 'bn' }),
      fab || null
    );
  }

  // ── DashRail — тонкий боковой рейл (десктоп) + мобильный топбар ─────────
  function DashRail(props) {
    const { brand, items = [], themeToggle } = props;
    const Ic = window.EIcons || {};
    const item = (it, i) => {
      const cls = cx('e-dash-rail__item', it.active && 'is-active');
      const inner = [
        it.icon ? h('span', { className: 'e-dash-rail__ic', key: 'i' }, h(it.icon, { size: 20 })) : null,
        h('span', { className: 'e-dash-rail__label', key: 'l' }, it.label),
      ];
      if (it.to && Link) return h(Link, { key: i, to: it.to, className: cls }, inner);
      return h('button', { key: i, type: 'button', className: cls, onClick: it.onClick, 'aria-current': it.active ? 'page' : undefined }, inner);
    };
    return h('aside', { className: 'e-dash-rail', 'aria-label': 'Навигация' },
      h('div', { className: 'e-dash-rail__brand', key: 'br' },
        h('span', { className: 'e-dash-rail__mark' }, (brand && brand.mark) || 'E'),
        h('span', { className: 'e-dash-rail__brand-name' }, (brand && brand.name) || 'EastSide')),
      h('nav', { className: 'e-dash-rail__nav', key: 'nav' }, items.map(item)),
      themeToggle ? h('div', { className: 'e-dash-rail__foot', key: 'ft' }, themeToggle) : null
    );
  }

  // ── BottomNav — нижний таб-бар (мобайл) ────────────────────────────────
  function BottomNav(props) {
    const { items = [] } = props;
    const Ic = window.EIcons || {};
    const item = (it, i) => {
      const cls = cx('e-dash-bn__item', it.active && 'is-active');
      const inner = [
        it.icon ? h(it.icon, { size: 22, key: 'i' }) : null,
        h('span', { className: 'e-dash-bn__label', key: 'l' }, it.label),
      ];
      if (it.to && Link) return h(Link, { key: i, to: it.to, className: cls }, inner);
      return h('button', { key: i, type: 'button', className: cls, onClick: it.onClick, 'aria-current': it.active ? 'page' : undefined }, inner);
    };
    return h('nav', { className: 'e-dash-bn', 'aria-label': 'Навигация' }, items.map(item));
  }

  // ── RoadmapStrip — горизонтальный степпер 4 вех ────────────────────────
  // props: stages [{id,title,status: done|current|upcoming}], selectedId,
  //        onSelect(id), currentIndex (число — для «Этап N из M»), total
  function RoadmapStrip(props) {
    const { stages = [], selectedId, onSelect, className } = props;
    const Ic = window.EIcons || {};
    const total = stages.length || 4;
    const curIdx = Math.max(0, stages.findIndex((s) => s.status === 'current'));
    const curNum = curIdx >= 0 ? curIdx + 1 : Math.min(total, stages.filter((s) => s.status === 'done').length + 1);

    return h('section', { className: cx('e-strip', className), 'aria-label': 'Твой маршрут' },
      h('div', { className: 'e-strip__head' },
        h('span', { className: 'e-strip__kicker' }, 'Твой маршрут'),
        h('span', { className: 'e-strip__count u-tnum' }, 'Этап ' + curNum + ' из ' + total)),
      h('div', { className: 'e-strip__scroll' },
        h('ol', { className: 'e-strip__track' },
          stages.map((s, i) => {
            const st = s.status || 'upcoming';
            const sel = s.id === selectedId;
            const last = i === stages.length - 1;
            return h('li', { key: s.id, className: cx('e-strip__node', 'is-' + st, sel && 'is-sel') },
              // соединительная тропа к следующему узлу (горит, если этот пройден)
              !last ? h('span', { className: cx('e-strip__path', st === 'done' && 'is-lit'), 'aria-hidden': 'true' }) : null,
              h('button', {
                type: 'button', className: 'e-strip__btn', onClick: () => onSelect && onSelect(s.id),
                'aria-pressed': sel, 'aria-label': 'Этап ' + (i + 1) + ': ' + s.title,
              },
                h('span', { className: 'e-strip__dot' },
                  st === 'done' ? h(Ic.Check, { size: 17 })
                    : st === 'current' ? h('span', { className: 'e-strip__pulse', 'aria-hidden': 'true' })
                      : (i + 1)),
                h('span', { className: 'e-strip__title' }, s.title))
            );
          }))
      )
    );
  }

  // ── DocChip — документ со статусом ─────────────────────────────────────
  function DocChip(props) {
    const { name, status } = props;
    const d = DOC[status] || DOC.awaiting;
    const Ic = window.EIcons || {};
    const ico = status === 'accepted' ? Ic.Check : status === 'needs_fix' ? Ic.AlertTriangle
      : status === 'in_review' ? Ic.Clock : Ic.Hourglass;
    return h('span', { className: cx('e-doc', 'e-doc--' + d.tone) },
      h('span', { className: 'e-doc__ic', 'aria-hidden': 'true' }, ico ? h(ico, { size: 13 }) : null),
      h('span', { className: 'e-doc__name' }, name),
      h('span', { className: 'e-doc__st' }, d.label));
  }

  // ── NeedList — «что нужно от …» с подписью-ролью ───────────────────────
  function NeedList(props) {
    const { label, items, tone, icon } = props;
    const Ic = window.EIcons || {};
    if (!items || !items.length) return null;
    return h('div', { className: 'e-need' },
      h('div', { className: 'e-need__head' },
        icon ? h('span', { className: 'e-need__ic e-need__ic--' + tone, 'aria-hidden': 'true' }, h(icon, { size: 13 })) : null,
        h('span', { className: 'e-need__label' }, label)),
      h('ul', { className: 'e-need__list' },
        items.map((t, i) => h('li', { key: i, className: 'e-need__item' },
          h('span', { className: 'e-need__dot', 'aria-hidden': 'true' }), t))));
  }

  // ── StageDetail — поверхность знаний выбранной вехи ────────────────────
  // props: stage {title,status,period}, detail {zachem,substeps,owner,ownerName,
  //        deadlineLabel,documents?}, onAssistant(stage), variant 'panel'|'sheet'
  function StageDetail(props) {
    const { stage, detail, onAssistant, variant } = props;
    const Ic = window.EIcons || {};
    if (!stage) return null;
    const d = detail || {};
    const subs = d.substeps || [];
    // документы вехи = объединение документов под-этапов (или явный список)
    const docs = d.documents || subs.reduce((acc, s) => acc.concat(s.documents || []), []);
    const stTone = stage.status === 'done' ? 'success' : stage.status === 'current' ? 'info' : 'neutral';
    const stLabel = stage.status === 'done' ? 'Пройдено' : stage.status === 'current' ? 'Сейчас' : 'Впереди';

    return h('section', { className: cx('e-detail', 'e-detail--' + (variant || 'panel')), 'aria-label': 'Этап ' + stage.title },
      h('div', { className: 'e-detail__head' },
        h('div', { className: 'u-grow' },
          stage.period ? h('span', { className: 'e-detail__kicker' }, stage.period) : null,
          h('h3', { className: 'e-detail__title' }, stage.title)),
        h(EUI.Pill, { tone: stTone }, stLabel)),

      d.zachem ? h('p', { className: 'e-detail__zachem' },
        h('span', { className: 'e-detail__zachem-cap' }, 'Зачем'), d.zachem) : null,

      // под-этапы вехи — «видеть, какие этапы есть»; текущий помечен
      subs.length ? h('div', { className: 'e-detail__block' },
        h('div', { className: 'e-detail__label' }, 'Под-этапы вехи'),
        h('ul', { className: 'e-substeps' },
          subs.map((s) => h('li', { key: s.id, className: cx('e-substep', 'is-' + (s.status || 'todo')) },
            h('span', { className: 'e-substep__mark', 'aria-hidden': 'true' },
              s.status === 'done' ? h(Ic.Check, { size: 13 }) : s.status === 'current' ? h('span', { className: 'e-substep__pulse' }) : null),
            h('span', { className: 'e-substep__title' }, s.title),
            s.status === 'current' ? h('span', { className: 'e-substep__now' }, 'сейчас') : null)))) : null,

      // документы этапа
      docs.length ? h('div', { className: 'e-detail__block' },
        h('div', { className: 'e-detail__label' }, 'Документы этапа'),
        h('div', { className: 'e-detail__docs' }, docs.map((doc, i) => h(DocChip, Object.assign({ key: i }, doc))))) : null,

      // кто что делает
      (((d.student && d.student.length) || (d.parent && d.parent.length) || (d.team && d.team.length))
        ? h('div', { className: 'e-detail__block e-detail__needs' },
          NeedList({ label: 'От тебя', items: d.student, tone: 'warning', icon: Ic.User }),
          NeedList({ label: 'От родителя', items: d.parent, tone: 'info', icon: Ic.Users }),
          NeedList({ label: 'Команда', items: d.team, tone: 'jade', icon: Ic.Spark }))
        : null),

      // материалы этапа
      (d.materials && d.materials.length) ? h('div', { className: 'e-detail__block' },
        h('div', { className: 'e-detail__label' }, 'Материалы этапа'),
        h('div', { className: 'e-detail__mats' },
          d.materials.map((m, i) => h('button', { key: i, type: 'button', className: 'e-mat' },
            h(Ic.Paperclip, { size: 14, key: 'i' }), h('span', { key: 't' }, m))))) : null,

      // подвал: ответственный + дедлайн + спросить ассистента
      h('div', { className: 'e-detail__foot' },
        h('div', { className: 'e-detail__owner' },
          h('span', { className: 'e-detail__owner-label' }, 'Ведёт'),
          h('span', { className: 'e-detail__owner-name' }, d.ownerName || d.owner || 'Куратор')),
        d.deadlineLabel ? h('div', { className: 'e-detail__deadline' },
          h(Ic.Clock, { size: 15, key: 'i' }), h('span', { key: 't' }, d.deadlineLabel)) : null,
        h(EUI.Button, { variant: 'jade', size: 'sm', iconLeft: Ic.Spark, onClick: () => onAssistant && onAssistant(stage), className: 'e-detail__ask' }, 'Спросить про этот этап'))
    );
  }

  // ── ProgressEmblem — компактная карточка «восхождение» ─────────────────
  // props: doneSteps, totalSteps, hskLabel, hskNote, progress (0..1), reached
  function ProgressEmblem(props) {
    const { doneSteps, totalSteps, hskLabel, hskNote, progress = 0, reached } = props;
    return h('section', { className: 'e-emblem', 'aria-label': 'Твоё восхождение' },
      h('div', { className: 'e-emblem__mtn' }, h(EUI.Mountain, { progress, reached })),
      h('div', { className: 'e-emblem__body' },
        h('div', { className: 'e-emblem__cap' }, 'Твоё восхождение'),
        h('div', { className: 'e-emblem__steps' },
          'Пройдено ', h('b', { className: 'u-tnum' }, doneSteps), ' из ', h('b', { className: 'u-tnum' }, totalSteps), ' шагов'),
        hskLabel ? h('div', { className: 'e-emblem__hsk' }, hskLabel, hskNote ? h('span', { className: 'e-emblem__hsk-note' }, ' · ' + hskNote) : null) : null)
    );
  }

  // ── Ассистент EastSide — премиум-чат (светлая Apple-модалка по центру) ──
  // Чистый опрятный глассморфизм: морозная белая панель по центру экрана над
  // размытым затемнённым фоном. БЕЗ drop-теней — отделение даёт блюр фона и
  // hairline-канты; глубина — стеклом и тонкими линиями, как просили. Светлая
  // палитра (design.md §4.2) задана жёстко, чтобы модалка не перекрашивалась под
  // тему кабинета; шрифты/радиусы/отступы — токены. Аватар — AI-искра (своя SVG),
  // не «солнце». Стили инъектируются один раз; контракт пропсов 1:1 — чат везде один.
  const ASSIST_CSS = `
.esa-scope{
  --esa-ink:#15203B; --esa-ink-soft:rgba(21,32,59,.64); --esa-ink-mute:rgba(21,32,59,.45);
  --esa-line:rgba(21,32,59,.08); --esa-line-2:rgba(21,32,59,.13);
  --esa-accent:#2073E6; --esa-accent-hi:#2B8FFF; --esa-accent-ink:#1763C8; --esa-accent-soft:rgba(43,143,255,.10);
  --esa-ease:cubic-bezier(.23,1,.32,1);
}
/* затемнение + чистый ровный блюр (без saturate, чтобы фон не «горел») */
.esa-backdrop{ position:fixed; inset:0; z-index:var(--z-modal); display:grid; place-items:center; padding:var(--sp-6);
  background:rgba(10,15,32,.32);
  backdrop-filter:blur(28px); -webkit-backdrop-filter:blur(28px);
  animation:esa-fade .2s ease both; }
/* центрированная панель — плотное морозное стекло, ОДНА общая граница */
.esa-panel{ position:relative; width:min(720px, 100%); height:min(720px, calc(100vh - 2*var(--sp-6)));
  display:flex; flex-direction:column; overflow:hidden; border-radius:28px;
  font-family:var(--font-text); color:var(--esa-ink);
  background:linear-gradient(180deg, rgba(255,255,255,.975), rgba(248,250,254,.95));
  backdrop-filter:blur(44px) saturate(180%); -webkit-backdrop-filter:blur(44px) saturate(180%);
  border:1px solid rgba(21,32,59,.10);
  box-shadow:inset 0 1px 0 rgba(255,255,255,.9); /* стеклянный кант грани, не тень */
  animation:esa-rise .26s var(--esa-ease) both; }
/* шапка — без делителя, отделяется воздухом (одна общая граница у панели) */
.esa-head{ display:flex; align-items:center; gap:var(--sp-3); padding:18px 20px 12px; }
.esa-ava{ flex:none; width:40px; height:40px; border-radius:13px; display:grid; place-items:center; color:#fff;
  background:linear-gradient(155deg, var(--esa-accent-hi), var(--esa-accent));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.45); }
.esa-h-name{ font-family:var(--font-display); font-weight:600; font-size:15px; letter-spacing:-.01em; line-height:1.2; color:var(--esa-ink); }
.esa-h-status{ display:flex; align-items:center; gap:6px; margin-top:2px; font-size:12px; color:var(--esa-ink-mute); }
.esa-live{ flex:none; width:6px; height:6px; border-radius:50%; background:var(--esa-accent-hi); }
.esa-close{ flex:none; margin-left:auto; width:32px; height:32px; border-radius:10px; display:grid; place-items:center;
  color:var(--esa-ink-mute); background:transparent; border:0; cursor:pointer;
  transition:transform .15s var(--esa-ease), background .15s, color .15s; }
.esa-close:hover{ background:rgba(21,32,59,.06); color:var(--esa-ink); }
.esa-close:active{ transform:scale(.92); }
/* чип контекста этапа */
.esa-ctx{ align-self:flex-start; display:inline-flex; align-items:center; gap:6px; margin:14px 18px 0;
  padding:6px 11px; border-radius:999px; font-size:12px; color:var(--esa-accent-ink);
  background:var(--esa-accent-soft); border:1px solid rgba(43,143,255,.18); }
/* лента сообщений */
.esa-feed{ flex:1; min-height:0; overflow-y:auto; padding:18px; display:flex; flex-direction:column; gap:10px;
  scrollbar-width:thin; scrollbar-color:rgba(21,32,59,.18) transparent; }
.esa-feed::-webkit-scrollbar{ width:9px; }
.esa-feed::-webkit-scrollbar-thumb{ background:rgba(21,32,59,.16); border-radius:99px; border:3px solid transparent; background-clip:content-box; }
.esa-feed::-webkit-scrollbar-track{ background:transparent; }
.esa-row{ display:flex; animation:esa-pop .22s var(--esa-ease) both; }
.esa-row.is-ai{ justify-content:flex-start; }
.esa-row.is-me{ justify-content:flex-end; }
.esa-bub{ max-width:min(82%, 560px); padding:11px 15px; font-size:15px; line-height:1.55; letter-spacing:-.003em; border-radius:18px; }
.esa-bub.is-ai{ background:#EFF2FA; color:#15203B; border-top-left-radius:7px; }
.esa-bub.is-me{ background:linear-gradient(160deg, var(--esa-accent-hi), var(--esa-accent)); color:#fff; border-top-right-radius:7px; }
.esa-bub.is-soft{ background:#F2F5FB; color:var(--esa-ink-soft); }
/* typing «печатает» */
.esa-bub.esa-typing{ display:inline-flex; align-items:center; gap:5px; padding:13px 15px; }
.esa-typing i{ width:6px; height:6px; border-radius:50%; background:var(--esa-ink-mute); opacity:.4;
  animation:esa-blink 1.2s infinite ease-in-out; }
.esa-typing i:nth-child(2){ animation-delay:.18s; } .esa-typing i:nth-child(3){ animation-delay:.36s; }
/* чипы-стартеры */
.esa-chips{ display:flex; flex-wrap:wrap; gap:8px; padding:0 20px 14px; }
.esa-chip{ font-family:var(--font-text); font-size:13px; font-weight:500; color:var(--esa-accent-ink);
  padding:8px 14px; border-radius:999px; background:rgba(43,143,255,.09); border:0; cursor:pointer;
  transition:transform .15s var(--esa-ease), background .15s; }
.esa-chip:hover{ background:rgba(43,143,255,.16); }
.esa-chip:active{ transform:scale(.97); }
/* композер: поле сверху, действия снизу. БЕЗ своей рамки и фокус-кольца —
   одна общая граница у панели; на фокусе меняется только мягкий фон поля. */
.esa-compose{ padding:4px 16px 16px; }
.esa-composer{ border-radius:16px; background:rgba(21,32,59,.04); padding:12px 12px 10px; transition:background .15s; }
.esa-composer:focus-within{ background:rgba(21,32,59,.055); }
.esa-input{ display:block; width:100%; min-height:24px; max-height:160px; resize:none; overflow-y:auto;
  background:transparent; border:0; outline:0; color:var(--esa-ink);
  font-family:var(--font-text); font-size:15px; line-height:1.5; padding:2px 6px; }
.esa-input::placeholder{ color:var(--esa-ink-mute); }
.esa-input::-webkit-scrollbar{ width:8px; }
.esa-input::-webkit-scrollbar-thumb{ background:rgba(21,32,59,.14); border-radius:99px; border:2px solid transparent; background-clip:content-box; }
.esa-bar{ display:flex; align-items:center; gap:4px; margin-top:8px; }
.esa-tool{ flex:none; width:34px; height:34px; border-radius:10px; display:grid; place-items:center;
  color:var(--esa-ink-mute); background:transparent; border:0; cursor:pointer;
  transition:transform .15s var(--esa-ease), background .15s, color .15s; }
.esa-tool:hover{ background:rgba(21,32,59,.07); color:var(--esa-ink); }
.esa-tool:active{ transform:scale(.92); }
.esa-send{ flex:none; margin-left:auto; height:38px; padding:0 17px; border-radius:11px; display:inline-flex; align-items:center; gap:7px;
  color:#fff; border:0; cursor:pointer; font-family:var(--font-text); font-weight:600; font-size:13.5px; letter-spacing:-.005em;
  background:linear-gradient(160deg, var(--esa-accent-hi), var(--esa-accent));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.30);
  transition:transform .15s var(--esa-ease), filter .15s, opacity .15s; }
.esa-send:hover{ filter:brightness(1.06); }
.esa-send:active{ transform:scale(.96); }
.esa-send:disabled{ opacity:.4; cursor:default; filter:none; }
/* FAB — единственная сапфировая кнопка, чистая, без тени */
.esa-fab{ position:fixed; right:var(--sp-6); bottom:var(--sp-6); z-index:var(--z-sticky);
  display:inline-flex; align-items:center; gap:9px; padding:10px 16px 10px 11px; border-radius:999px; border:0; cursor:pointer; color:#fff;
  font-family:var(--font-text); font-weight:600; font-size:14px; letter-spacing:-.005em;
  background:linear-gradient(160deg, var(--esa-accent-hi), var(--esa-accent));
  box-shadow:inset 0 1px 0 rgba(255,255,255,.28);
  transition:transform .18s cubic-bezier(.23,1,.32,1), filter .18s; }
.esa-fab:hover{ transform:translateY(-1px); filter:brightness(1.05); }
.esa-fab:active{ transform:translateY(0) scale(.97); }
.esa-fab:focus-visible{ outline:none; box-shadow:inset 0 1px 0 rgba(255,255,255,.28), 0 0 0 3px rgba(43,143,255,.35); }
.esa-fab__ic{ flex:none; display:grid; place-items:center; width:28px; height:28px; border-radius:50%; color:#fff; background:rgba(255,255,255,.18); }
@media (max-width:520px){
  .esa-backdrop{ padding:0; place-items:end stretch; }
  .esa-panel{ width:100%; height:90vh; border-radius:24px 24px 0 0; }
  .esa-fab{ right:var(--sp-4); bottom:calc(64px + env(safe-area-inset-bottom) + var(--sp-3)); }
}
@media (max-width:380px){ .esa-fab__label{ display:none; } .esa-fab{ padding:11px; } }
@keyframes esa-fade{ from{ opacity:0; } to{ opacity:1; } }
@keyframes esa-rise{ from{ opacity:0; transform:translateY(10px) scale(.98); } to{ opacity:1; transform:none; } }
@keyframes esa-pop{ from{ opacity:0; transform:translateY(5px); } to{ opacity:1; transform:none; } }
@keyframes esa-blink{ 0%,80%,100%{ opacity:.35; transform:translateY(0); } 40%{ opacity:1; transform:translateY(-2px); } }
@media (prefers-reduced-motion: reduce){
  .esa-backdrop,.esa-panel,.esa-row{ animation:none !important; }
  .esa-typing i{ animation:none !important; }
}
`;
  (function ensureAssistCss() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('esa-assist-css')) return;
    const s = document.createElement('style');
    s.id = 'esa-assist-css';
    s.textContent = ASSIST_CSS;
    document.head.appendChild(s);
  })();

  // ── Sparkle — аватар-искра ассистента (4 луча, читается как AI, не «солнце») ──
  function Sparkle(size) {
    return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true' },
      h('path', { d: 'M12 2.2c.42 0 .79.28.9.68l1.06 3.74a4.2 4.2 0 0 0 2.92 2.92l3.74 1.06a.94.94 0 0 1 0 1.8l-3.74 1.06a4.2 4.2 0 0 0-2.92 2.92l-1.06 3.74a.94.94 0 0 1-1.8 0l-1.06-3.74a4.2 4.2 0 0 0-2.92-2.92L3.4 12.4a.94.94 0 0 1 0-1.8l3.74-1.06a4.2 4.2 0 0 0 2.92-2.92l1.06-3.74c.11-.4.48-.68.9-.68z' }));
  }

  // ── AssistantFab — плавающий вызов ассистента (одна сапфировая кнопка) ──
  // props: onClick, label
  function AssistantFab(props) {
    const { onClick, label = 'Ассистент' } = props;
    return h('div', { className: 'esa-scope' },
      h('button', { type: 'button', className: 'esa-fab', onClick, 'aria-label': 'Открыть ассистента EastSide' },
        h('span', { className: 'esa-fab__ic', 'aria-hidden': 'true', key: 'i' }, Sparkle(15)),
        h('span', { className: 'esa-fab__label', key: 'l' }, label)));
  }

  // ── AssistantPopup — премиум-чат с AI (стеклянная панель «Атмосфера») ───
  // props: open, onClose, stage (контекст этапа|null), seeds (assistantSeeds)
  function AssistantPopup(props) {
    const { open, onClose, stage, seeds } = props;
    const Ic = window.EIcons || {};
    const seedFor = (st) => (seeds && st && (seeds[st.id] || seeds[st.stageId])) || (seeds && seeds._default) || {
      hello: 'Привет, я ассистент EastSide. Скоро отвечу прямо здесь.', chips: [],
    };
    const seed = seedFor(stage);
    const [msgs, setMsgs] = useState([]);
    const [text, setText] = useState('');
    const [typing, setTyping] = useState(false);
    const feedRef = useRef(null);
    const inputRef = useRef(null);
    const fileRef = useRef(null);

    // при открытии / смене контекста — нить начинается с приветствия этапа
    useEffect(() => {
      if (!open) return;
      setMsgs([{ from: 'ai', text: seed.hello }]);
      setText('');
      setTyping(false);
      const t = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 140);
      return () => clearTimeout(t);
    }, [open, stage && (stage.id || stage.stageId), seed.hello]);

    // лента всегда прокручена к последнему сообщению
    useEffect(() => {
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, [msgs, typing]);

    // Escape закрывает, фон под чатом не скроллится
    useEffect(() => {
      if (!open) return;
      const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
      document.addEventListener('keydown', onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
    }, [open, onClose]);

    if (!open) return null;

    const send = (val) => {
      const t = (val != null ? val : text).trim();
      if (!t) return;
      setMsgs((m) => m.concat({ from: 'user', text: t }));
      setText('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
      setTyping(true);
      // мозги вне скоупа — живая заглушка: «печатает», затем мягкий ответ
      setTimeout(() => {
        setTyping(false);
        setMsgs((m) => m.concat({ from: 'ai', soft: true, text: 'Я еще учусь отвечать сам, но твой вопрос уже у куратора: он на связи и поможет. Скоро буду отвечать прямо здесь.' }));
      }, 950);
    };

    const showChips = seed.chips && seed.chips.length && msgs.length <= 1 && !typing;

    // авто-рост поля; Enter — отправить, Shift+Enter — перенос строки
    const grow = () => { const el = inputRef.current; if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 132) + 'px'; };
    const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    const resetThread = () => { setMsgs([{ from: 'ai', text: seed.hello }]); setText(''); setTyping(false); if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.focus(); } };
    const onAttach = (e) => { const f = e.target.files && e.target.files[0]; if (f && window.EToast) window.EToast.push({ tone: 'info', title: 'Файл выбран', text: f.name + ' — прикреплю к диалогу, когда ассистент заработает.' }); e.target.value = ''; };

    return h('div', { className: 'esa-scope' },
      h('div', { className: 'esa-backdrop', onMouseDown: (e) => { if (e.target === e.currentTarget && onClose) onClose(); } },
        h('section', { className: 'esa-panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Ассистент EastSide' },
          h('header', { className: 'esa-head', key: 'h' },
            h('div', { className: 'esa-ava', 'aria-hidden': 'true', key: 'a' }, Sparkle(20)),
            h('div', { className: 'esa-h-meta', key: 'm' },
              h('div', { className: 'esa-h-name' }, 'Ассистент EastSide'),
              h('div', { className: 'esa-h-status' },
                h('span', { className: 'esa-live', 'aria-hidden': 'true', key: 'd' }),
                h('span', { key: 't' }, 'на связи'))),
            h('button', { type: 'button', className: 'esa-close', 'aria-label': 'Закрыть', onClick: onClose, key: 'x' },
              Ic.Close ? h(Ic.Close, { size: 18 }) : '×')),
          stage ? h('div', { className: 'esa-ctx', key: 'c' },
            Ic.Pin ? h(Ic.Pin, { size: 13, key: 'i' }) : null, h('span', { key: 't' }, 'Контекст: ' + stage.title)) : null,
          h('div', { className: 'esa-feed', ref: feedRef, key: 'f' },
            msgs.map((m, i) => h('div', { key: i, className: cx('esa-row', m.from === 'user' ? 'is-me' : 'is-ai') },
              h('div', { className: cx('esa-bub', m.from === 'user' ? 'is-me' : 'is-ai', m.soft && 'is-soft') }, m.text))),
            typing ? h('div', { className: 'esa-row is-ai', key: 'typ' },
              h('div', { className: 'esa-bub is-ai esa-typing' }, h('i', { key: 1 }), h('i', { key: 2 }), h('i', { key: 3 }))) : null),
          showChips ? h('div', { className: 'esa-chips', key: 'ch' },
            seed.chips.map((c, i) => h('button', { key: i, type: 'button', className: 'esa-chip', onClick: () => send(c) }, c))) : null,
          h('form', { className: 'esa-compose', key: 'cmp', onSubmit: (e) => { e.preventDefault(); send(); } },
            h('input', { type: 'file', ref: fileRef, onChange: onAttach, style: { display: 'none' }, 'aria-hidden': 'true', key: 'file' }),
            h('div', { className: 'esa-composer', key: 'box' },
              h('textarea', { className: 'esa-input', ref: inputRef, rows: 1, placeholder: 'Спроси про вузы, гранты, сроки…', value: text, onChange: (e) => { setText(e.target.value); grow(); }, onKeyDown: onKey, 'aria-label': 'Сообщение ассистенту' }),
              h('div', { className: 'esa-bar', key: 'bar' },
                h('button', { type: 'button', className: 'esa-tool', 'aria-label': 'Новый диалог', title: 'Новый диалог', onClick: resetThread, key: 'new' }, Ic.Plus ? h(Ic.Plus, { size: 18 }) : '+'),
                h('button', { type: 'button', className: 'esa-tool', 'aria-label': 'Прикрепить файл', title: 'Прикрепить файл', onClick: () => fileRef.current && fileRef.current.click(), key: 'att' }, Ic.Paperclip ? h(Ic.Paperclip, { size: 18 }) : '📎'),
                h('button', { type: 'submit', className: 'esa-send', 'aria-label': 'Отправить', disabled: !text.trim(), key: 'sb' },
                  h('span', { key: 't' }, 'Отправить'), Ic.Send ? h(Ic.Send, { size: 16, key: 'i' }) : '→')))))));
  }

  Object.assign(EUI, {
    DashShell, DashRail, BottomNav, RoadmapStrip, StageDetail,
    ProgressEmblem, AssistantFab, AssistantPopup, DocChip,
  });
})();
