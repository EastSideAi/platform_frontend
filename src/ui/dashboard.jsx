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

  // ── AssistantFab — глобальная плавашка ─────────────────────────────────
  // props: onClick
  function AssistantFab(props) {
    const { onClick, label = 'Ассистент' } = props;
    const Ic = window.EIcons || {};
    return h('button', { type: 'button', className: 'e-fab', onClick, 'aria-label': 'Открыть ассистента' },
      h('span', { className: 'e-fab__dot', 'aria-hidden': 'true' }),
      h(Ic.Spark, { size: 22, key: 'i' }),
      h('span', { className: 'e-fab__label', key: 'l' }, label));
  }

  // ── AssistantPopup — drawer-чат, контекстный ───────────────────────────
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
    const feedRef = useRef(null);

    // при открытии/смене контекста — сбрасываем нить на приветствие этапа
    useEffect(() => {
      if (!open) return;
      setMsgs([{ from: 'ai', text: seed.hello }]);
      setText('');
    }, [open, stage && (stage.id || stage.stageId), seed.hello]);

    useEffect(() => {
      if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }, [msgs]);

    const send = (val) => {
      const t = (val != null ? val : text).trim();
      if (!t) return;
      setMsgs((m) => m.concat({ from: 'user', text: t }));
      setText('');
      // мозги вне скоупа — мягкая заглушка
      setTimeout(() => setMsgs((m) => m.concat({ from: 'ai', text: 'Скоро отвечу — ассистент пока учится. Куратор тоже видит этот вопрос.', soft: true })), 420);
    };

    return h(EUI.Drawer, { open, onClose, side: 'right', title: 'Ассистент EastSide', className: 'e-assist-drawer' },
      stage ? h('div', { className: 'e-assist__ctx' },
        h(Ic.Pin, { size: 13, key: 'i' }), h('span', { key: 't' }, 'Контекст: ' + stage.title)) : null,
      h('div', { className: 'e-assist__feed', ref: feedRef },
        msgs.map((m, i) => h('div', { key: i, className: cx('e-assist__bubble', m.from === 'user' ? 'is-me' : 'is-ai', m.soft && 'is-soft') }, m.text))),
      (seed.chips && seed.chips.length) ? h('div', { className: 'e-assist__chips' },
        seed.chips.map((c, i) => h('button', { key: i, type: 'button', className: 'e-assist__chip', onClick: () => send(c) }, c))) : null,
      h('form', { className: 'e-assist__compose', onSubmit: (e) => { e.preventDefault(); send(); } },
        h('input', { className: 'e-input', placeholder: 'Спроси что угодно про поступление', value: text, onChange: (e) => setText(e.target.value), 'aria-label': 'Сообщение' }),
        h('button', { type: 'submit', className: 'e-icon-btn e-icon-btn--solid', 'aria-label': 'Отправить' }, Ic.Send ? h(Ic.Send, { size: 18 }) : '→'))
    );
  }

  Object.assign(EUI, {
    DashShell, DashRail, BottomNav, RoadmapStrip, StageDetail,
    ProgressEmblem, AssistantFab, AssistantPopup, DocChip,
  });
})();
