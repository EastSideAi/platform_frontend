/* ============================================================================
   EastSide — AI-ассистент · ОБОЛОЧКА ПОПАПА (window.EScreens.Assistant · #/assistant)
   ----------------------------------------------------------------------------
   Ассистент — НЕ страница в навигации, а ПОПАП-оболочка: правый drawer-чат поверх
   приложения (тот же язык, что у дашборда cabinet-student). Этот маршрут —
   overlay-точка входа для устаревших ссылок: открывается сразу как drawer, закрытие
   возвращает к дашборду ученика. На дашбордах живёт как FAB+попап (EUI.AssistantPopup).

   Внутри: пример нити из mock (EMock.aiThread), чипы-подсказки (EMock.assistantSeeds7
   по контексту этапа из ?stage=), ввод. Отправка дописывает сообщение пользователя и
   мягкую заглушку «скоро отвечу» — фейковой AI-логики нет, мозги собирает владелец.
   Контекст этапа принимается через query (?stage=s3 или ?title=...): чип-контекст
   сверху + приветствие/чипы под этап. Тот же чат идёт в Telegram и ВКонтакте.

   Только компоненты EUI и существующие классы styles.css (.e-assist__*, .e-drawer--*)
   + var(--token) в inline — ноль хардкода цвета/размера/тени. Обе темы. NO DEAD BUTTONS.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect, useRef } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const { Drawer, Pill, Badge, cx } = U;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};
  const toast = (t) => (window.EToast ? window.EToast.push(t) : null);

  // ── Пример нити из mock (in-file fallback, если мока нет) ────────────────
  // from: ai | user (пользователь). Это «живой» пример переписки на открытии.
  const FALLBACK_THREAD = [
    { id: 'a1', from: 'ai', text: 'Привет, Дима. Я ассистент EastSide — держу в голове весь твой путь. Спрашивай про вузы, гранты, документы и сроки.' },
    { id: 'a2', from: 'user', text: 'Что осталось по документам?' },
    { id: 'a3', from: 'ai', text: 'Осталось два пункта: рекомендательное письмо и фото 33×48. Медсправку нужно переоформить по международной форме — куратор уже написала об этом. Загрузить файлы можно в разделе «Документы».' },
  ];
  const SEED_THREAD = (window.EMock && window.EMock.aiThread && window.EMock.aiThread.length)
    ? window.EMock.aiThread
    : FALLBACK_THREAD;

  // нормализуем сид-нить к общей форме {from,text}
  const normThread = (arr) => (arr || []).map((m, i) => ({
    id: m.id || ('seed' + i), from: m.from === 'user' ? 'user' : 'ai', text: m.text,
  }));

  // ── Сиды под контекст этапа (assistantSeeds7 → fallback assistantSeeds) ──
  const SEEDS = (window.EMock && (window.EMock.assistantSeeds7 || window.EMock.assistantSeeds)) || {
    _default: { hello: 'Привет, я ассистент EastSide. Скоро отвечу прямо здесь.', chips: [] },
  };
  const seedFor = (stageId) => (stageId && SEEDS[stageId]) || SEEDS._default || { hello: '', chips: [] };

  // ── Имя этапа из roadmap7 по id (для строки-контекста) ───────────────────
  const titleForStage = (stageId) => {
    const list = (window.EMock && window.EMock.roadmap7) || [];
    const s = list.find((x) => x.id === stageId);
    return s ? s.title : null;
  };

  function Assistant(props) {
    const q = (props && props.query) || {};
    const stageId = q.stage || null;                 // ?stage=s3
    const stageTitle = q.title || titleForStage(stageId); // ?title=... или из roadmap7
    const seed = seedFor(stageId);

    // тред: пример нити из mock; если задан контекст этапа — открываем приветствием этапа
    const initial = stageId
      ? [{ id: 'ctx-hello', from: 'ai', text: seed.hello }]
      : normThread(SEED_THREAD);

    const [msgs, setMsgs] = useState(initial);
    const [text, setText] = useState('');
    const feedRef = useRef(null);

    // автоскролл ленты вниз на новое сообщение
    useEffect(() => {
      const el = feedRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, [msgs]);

    const close = () => nav('/student');

    const send = (raw) => {
      const val = (raw != null ? raw : text).trim();
      if (!val) return;
      setMsgs((m) => m.concat({ id: 'u' + Date.now(), from: 'user', text: val }));
      setText('');
      // мозги ассистента вне скоупа — мягкая заглушка «скоро отвечу»
      setTimeout(() => setMsgs((m) => m.concat({
        id: 'r' + Date.now(), from: 'ai', soft: true,
        text: 'Скоро отвечу — ассистент пока учится. Этот вопрос видит и куратор: если он окажется сложным, ответит здесь же.',
      })), 420);
      toast({ tone: 'info', title: 'Сообщение отправлено', text: 'Ассистент держит в голове весь твой путь — скоро ответит.' });
    };

    const chips = (seed.chips && seed.chips.length)
      ? seed.chips
      : ['Что мне делать прямо сейчас?', 'Когда ближайший дедлайн?', 'Что осталось по документам?'];

    return h(Drawer, {
      open: true, onClose: close, side: 'right',
      title: 'Ассистент EastSide', className: 'e-assist-drawer',
    },
      // строка-контекст этапа (если пришёл) + где ещё живёт чат
      h('div', {
        key: 'meta', className: 'u-flex u-items-center u-gap-2',
        style: { flexWrap: 'wrap', marginBottom: 'var(--sp-4)' },
      },
        stageId && stageTitle ? h('span', { key: 'ctx', className: 'e-assist__ctx', style: { marginBottom: 0 } },
          h(Ic.Pin, { size: 13, key: 'i' }), h('span', { key: 't' }, 'Контекст: ' + stageTitle)) : null,
        h('span', { key: 'on', style: { flexShrink: 0 } }, h(Pill, { tone: 'success' }, 'На связи')),
        h('span', { key: 'tg', style: { flexShrink: 0 } },
          h(Badge, { tone: 'neutral', icon: Ic.Telegram }, 'Тот же чат — в Telegram и ВК'))),

      // лента сообщений (пример нити из mock на старте)
      h('div', { key: 'feed', className: 'e-assist__feed', ref: feedRef, 'aria-label': 'Переписка с ассистентом' },
        msgs.map((m) => h('div', {
          key: m.id, className: cx('e-assist__bubble', m.from === 'user' ? 'is-me' : 'is-ai', m.soft && 'is-soft'),
        }, m.text))),

      // чипы-подсказки (под контекст этапа)
      h('div', { key: 'chips', className: 'e-assist__chips', role: 'group', 'aria-label': 'Частые вопросы' },
        chips.map((cText, i) => h('button', {
          key: i, type: 'button', className: 'e-assist__chip', onClick: () => send(cText),
        }, cText))),

      // поле ввода
      h('form', {
        key: 'compose', className: 'e-assist__compose',
        onSubmit: (e) => { e.preventDefault(); send(); },
      },
        h('input', {
          className: 'e-input', value: text, onChange: (e) => setText(e.target.value),
          placeholder: 'Спроси про урок, документы или сроки', 'aria-label': 'Сообщение ассистенту',
        }),
        h('button', {
          type: 'submit', className: 'e-icon-btn e-icon-btn--solid', 'aria-label': 'Отправить',
        }, Ic.Send ? h(Ic.Send, { size: 18 }) : '→'))
    );
  }

  EScreens.Assistant = Assistant;
})();
