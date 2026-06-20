/* ============================================================================
   EastSide — Документы (клиентский срез) · ЯЗЫК ДАШБОРДА (.ec-*)
   window.EScreens.Documents · #/documents
   ----------------------------------------------------------------------------
   Зеркалит эталон-дашборд cabinet-student.jsx: 256px-сайдбар (лого · нав ·
   профиль-маскот · помощь · ТОГГЛ ТЕМЫ · настройки) → топ-бар (привет + колокол)
   → hero-карта («Документы и подача» + статус + 2 мини-стата + кольцо готовности
   + гора) → «Что нужно от тебя» (нумерованные карты по бумагам, что ждут действия)
   → «Все документы» (список со статусами-пилюлями + фильтр + загрузка/история/
   скачивание у каждой строки) → «Договоры и чеки» (на скачивание) → низ
   (куратор на связи + все под контролем).

   Граница видимости (load-bearing): клиент видит ТОЛЬКО свой срез — перевод,
   нотариус и подачу делает команда. Тон спокойный: дедлайн — ориентир, не таймер.

   Статусы: awaiting (ожидается) · uploaded (загружен) · in_review (на проверке) ·
   needs_fix (нужно поправить) · accepted (принят). Загрузка — модалка + смена
   статуса на «на проверке» + тост + новая версия в историю. Скачивание — тост.

   Все CTA живые. Стиль — только токены/классы (.ec-*) + компоненты EUI. Обе темы.
   Данные — EMock.documents с in-file фолбэком (mock.jsx не трогаем).
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect, useMemo } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const {
    Button, Modal, Pill, Badge, Avatar, IconButton, FileUpload,
    SegmentedControl, Skeleton, AssistantFab, AssistantPopup,
  } = U;
  const ThemeToggle = (window.ETheme && window.ETheme.ThemeToggle) || null;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};
  const Link = (window.ERouter && window.ERouter.Link) || null;
  const toast = (t) => window.EToast && window.EToast.push(t);

  const icoOf = (name) => (name && Ic[name]) || Ic.File;

  // ── Статусы документа: пилюля + тон (единый язык статуса) ───────────────
  // Правки — тёплая охра (warning), не терракота-danger: не пугаем родителя красным.
  const DOC_STATUS = {
    awaiting: { tone: 'neutral', label: 'Ожидается' },
    uploaded: { tone: 'info', label: 'Загружен' },
    in_review: { tone: 'info', label: 'На проверке' },
    needs_fix: { tone: 'warning', label: 'Нужно поправить' },
    accepted: { tone: 'success', label: 'Принят' },
  };
  const norm = (s) => (s === 'review' ? 'in_review' : s === 'fix' ? 'needs_fix' : s);
  const needsAction = (s) => s === 'awaiting' || s === 'needs_fix';

  // ── Деталь по документу (заметки, дедлайны, версии) — поверх плоского EMock ──
  const DOC_DETAIL = {
    d1: { note: 'Скан с обеих сторон вместе с переводом.', versions: [{ name: 'attestat-perevod.pdf', size: '2,4 МБ', date: '12 мая', mine: true }] },
    d2: { note: 'Разворот с фото, целиком, без бликов.', versions: [{ name: 'pasport.pdf', size: '1,1 МБ', date: '12 мая', mine: true }] },
    d3: { note: 'Скан сертификата HSK 4 с печатью.', versions: [{ name: 'hsk4.png', size: '0,8 МБ', date: '20 мая', mine: true }] },
    d4: { note: 'Черновик готовили вместе с куратором — сейчас читает.', versions: [{ name: 'motivation.docx', size: '0,2 МБ', date: '4 июня', mine: true }] },
    d5: {
      note: 'Форма международного образца. Подскажем, в какой клинике сделать быстрее.',
      due: { label: '20 июля', daysLeft: 37 },
      review: 'Загрузили обычную форму 086, а вузу нужна международная — с переводом на английский. Сделай по образцу, мы пришлем шаблон в чат.',
      reviewBy: 'Елена Жукова',
      actionTitle: 'Переоформить медсправку',
      actionCta: 'Что делать?',
      actionTime: '1 день',
      versions: [{ name: 'medspravka.jpg', size: '1,6 МБ', date: '2 июня', mine: true, tag: 'нужно поправить' }],
    },
    d6: { note: 'Письмо от учителя-предметника или классного руководителя.', due: { label: '28 июня', daysLeft: 15 }, actionTitle: 'Рекомендательное письмо', actionCta: 'Загрузить файл', actionTime: '10 минут', versions: [] },
    d7: { note: 'Цветное, на белом фоне, 33×48 мм — без улыбки и аксессуаров.', due: { label: '20 июля', daysLeft: 37 }, actionTitle: 'Фото 33×48', actionCta: 'Загрузить фото', actionTime: '5 минут', versions: [] },
  };

  // ── Полный in-file фолбэк (если EMock недоступен) ───────────────────────
  const FALLBACK = {
    docs: [
      { id: 'd1', name: 'Аттестат + перевод', kind: 'Образование', status: 'accepted', size: '2,4 МБ' },
      { id: 'd2', name: 'Загранпаспорт', kind: 'Личное', status: 'accepted', size: '1,1 МБ' },
      { id: 'd3', name: 'Сертификат HSK 4', kind: 'Язык', status: 'accepted', size: '0,8 МБ' },
      { id: 'd4', name: 'Мотивационное письмо', kind: 'Подача', status: 'in_review', size: '0,2 МБ' },
      { id: 'd5', name: 'Медицинская справка', kind: 'Виза', status: 'needs_fix', size: '1,6 МБ' },
      { id: 'd6', name: 'Рекомендательное письмо', kind: 'Подача', status: 'awaiting' },
      { id: 'd7', name: 'Фото 33×48', kind: 'Виза', status: 'awaiting' },
    ],
    student: { name: 'Дима Соколов', grade: '11 класс' },
    curator: { name: 'Елена Жукова', role: 'Куратор по документам', online: true },
  };

  // Договоры и чеки — только на скачивание (in-file, не в EMock)
  const FILES = [
    { id: 'contract', kind: 'Договор', title: 'Договор на сопровождение', meta: 'PDF · 240 КБ · 5 мая' },
    { id: 'receipt1', kind: 'Чек', title: 'Чек об оплате диагностики', meta: 'PDF · 60 КБ · 5 мая' },
    { id: 'receipt2', kind: 'Чек', title: 'Чек, первый платеж по тарифу', meta: 'PDF · 64 КБ · 12 мая' },
  ];

  // Фильтр по статусу
  const FILTERS = [
    { value: 'all', label: 'Все' },
    { value: 'todo', label: 'Нужно от тебя' },
    { value: 'in_review', label: 'На проверке' },
    { value: 'accepted', label: 'Готово' },
  ];

  // ── Кольцо готовности (SVG, свет внутри через токены) — как у эталона ────
  function Ring(props) {
    const { pct = 0 } = props;
    const r = 64, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
    return h('div', { className: 'ec-ring' },
      h('svg', { width: 150, height: 150, viewBox: '0 0 150 150' },
        h('circle', { cx: 75, cy: 75, r, fill: 'none', stroke: 'rgba(43,143,255,.16)', strokeWidth: 13 }),
        h('circle', {
          cx: 75, cy: 75, r, fill: 'none', stroke: 'url(#ecDocRing)', strokeWidth: 13, strokeLinecap: 'round',
          strokeDasharray: c, strokeDashoffset: off, style: { transition: 'stroke-dashoffset .9s var(--ease-out)' },
        }),
        h('defs', null, h('linearGradient', { id: 'ecDocRing', x1: '0', y1: '0', x2: '1', y2: '1' },
          h('stop', { offset: '0', stopColor: 'var(--violet-2)' }),
          h('stop', { offset: '1', stopColor: 'var(--violet-deep)' })))),
      h('div', { className: 'ec-ring__c' },
        h('div', { className: 'ec-ring__v u-tnum' }, pct + '%'),
        h('div', { className: 'ec-ring__l' }, 'принято')));
  }

  // ── Сайдбар (слой 1) — зеркало эталона ──────────────────────────────────
  function Rail(props) {
    const { student, todoCount, onHelp, onSettings } = props;
    const navItems = [
      { icon: Ic.Home, label: 'Главная', to: '/student' },
      { icon: Ic.Doc, label: 'Документы', to: '/documents', active: true, badge: todoCount || undefined },
      { icon: Ic.Book, label: 'Обучение', to: '/learning/progress' },
      { icon: Ic.Star, label: 'Гранты', to: '/diagnostics' },
      { icon: Ic.Target, label: 'Диагностика', to: '/diagnostics' },
      { icon: Ic.Flag, label: 'Достижения', onClick: onSettings },
    ];
    const navEl = (it, i) => {
      const cls = 'ec-nav__a' + (it.active ? ' is-active' : '');
      const inner = [
        h('span', { key: 'i', style: { display: 'inline-flex' } }, h(it.icon, { size: 20 })),
        h('span', { key: 'l' }, it.label),
        it.badge ? h('span', { key: 'b', className: 'ec-nav__tick u-tnum', style: { color: 'var(--warning-ink)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-2xs)' } }, it.badge) : null,
      ];
      if (it.to && Link) return h(Link, { key: i, to: it.to, className: cls }, inner);
      return h('button', { key: i, type: 'button', className: cls, onClick: it.onClick }, inner);
    };
    return h('aside', { className: 'ec-rail', 'aria-label': 'Навигация' },
      h(Link ? Link : 'a', Object.assign({ className: 'ec-logo' }, Link ? { to: '/student' } : {}),
        h('span', { className: 'ec-logo__m' }, h(Ic.Compass, { size: 19 })),
        h('span', null,
          h('span', { className: 'ec-logo__t', style: { display: 'block' } }, 'EastSide'),
          h('span', { className: 'ec-logo__s' }, 'поступление в Китай'))),
      h('nav', { className: 'ec-nav' }, navItems.map(navEl)),
      h('div', { className: 'ec-rail__sp' }),
      h('div', { className: 'ec-pcard' },
        h('span', { className: 'ec-pcard__a' }, h('img', { src: 'assets/mascot-cut.png', alt: '' })),
        h('span', { className: 'ec-pcard__on', 'aria-hidden': 'true' }),
        h('div', null,
          h('div', { className: 'ec-pcard__n' }, student ? student.name : 'Ученик'),
          h('div', { className: 'ec-pcard__r' }, student ? student.grade : ''))),
      h('button', { type: 'button', className: 'ec-mini', onClick: onHelp },
        h(Ic.Chat, { size: 18 }),
        h('div', null, h('b', null, 'Нужна помощь?'), h('span', null, 'Напиши куратору'))),
      ThemeToggle ? h('div', { className: 'ec-theme' },
        h(Ic.Sun, { size: 17 }),
        h('span', null, 'Тема оформления'),
        h('span', { className: 'ec-theme__sw' }, h(ThemeToggle, { variant: 'cycle' }))) : null,
      h('button', { type: 'button', className: 'ec-mini', onClick: onSettings, style: { marginTop: '2px' } },
        h(Ic.Settings, { size: 18 }), h('b', null, 'Настройки')));
  }

  // ── Чип-файл (имя + мета + скачать). Внутри .ec-card → чернила --ink ─────
  function FileChip(props) {
    const { name, meta, onDownload, badge } = props;
    return h('div', {
      className: 'u-flex u-items-center u-gap-3',
      style: {
        padding: '10px 12px', borderRadius: 'var(--r-md)',
        background: 'var(--surface-2)', border: '1px solid var(--line)',
      },
    },
      h('span', { 'aria-hidden': 'true', style: { color: 'var(--ink-mute)', flexShrink: 0, display: 'inline-flex' }, key: 'i' }, h(Ic.File, { size: 20 })),
      h('div', { className: 'u-grow', key: 'b' },
        h('div', { style: { fontWeight: 'var(--fw-medium)', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 'var(--fs-sm)' } }, name),
        meta ? h('div', { style: { fontSize: 'var(--fs-xs)', color: 'var(--ink-mute)' } }, meta) : null),
      badge || null,
      h(IconButton, { icon: Ic.Download, label: 'Скачать ' + name, size: 'sm', onClick: onDownload, key: 'd' }));
  }

  // ── История версий — модалка ────────────────────────────────────────────
  function VersionsModal(props) {
    const { doc, onClose, onDownload } = props;
    if (!doc) return null;
    const versions = doc.versions || [];
    return h(Modal, { open: !!doc, onClose, title: 'История версий — ' + doc.name },
      versions.length
        ? h('div', { className: 'u-stack-2' },
            versions.map((v, i) => h(FileChip, {
              key: v.name + i, name: v.name,
              meta: 'Версия ' + (versions.length - i) + ' · ' + v.size + ' · ' + v.date + (v.mine ? ' · ты загрузил' : ''),
              badge: v.tag
                ? h(Pill, { tone: 'warning', key: 'p' }, v.tag)
                : (i === 0 ? h(Badge, { tone: 'neutral', key: 'p' }, 'текущая') : null),
              onDownload: () => onDownload(v.name),
            })))
        : h('p', { className: 'u-ink-soft', style: { fontSize: 'var(--fs-sm)' } },
            'Версий пока нет. Как только загрузишь файл — он появится здесь.'));
  }

  // ── Зона загрузки — модалка ─────────────────────────────────────────────
  function UploadModal(props) {
    const { doc, onClose, onUpload } = props;
    const [picked, setPicked] = useState([]);
    useEffect(() => { if (doc) setPicked([]); }, [doc && doc.id]);
    if (!doc) return null;

    const onFiles = (fileList) => {
      const arr = Array.prototype.slice.call(fileList || []).map((f) => ({
        name: f.name,
        size: f.size ? Math.max(1, Math.round(f.size / 1024)) + ' КБ' : '',
        progress: 100,
      }));
      setPicked(arr);
    };
    const confirm = () => { onUpload(doc, picked); onClose(); };

    return h(Modal, {
      open: !!doc, onClose, title: 'Загрузить — ' + doc.name,
      footer: h(React.Fragment, null,
        h(Button, { variant: 'ghost', onClick: onClose }, 'Отмена'),
        h(Button, { variant: 'primary', iconLeft: Ic.Upload, disabled: !picked.length, onClick: confirm }, 'Отправить куратору')),
    },
      h('div', { className: 'u-stack-3' },
        h('p', { className: 'u-ink-soft', style: { fontSize: 'var(--fs-sm)' } },
          doc.status === 'needs_fix'
            ? 'Загрузи исправленную версию — куратор сверит и подскажет, если что-то еще.'
            : 'Перетащи файл или выбери на устройстве. Куратор проверит и отметит статус.'),
        h(FileUpload, {
          onFiles, files: picked, accept: 'image/*,.pdf,.doc,.docx',
          hint: 'PDF, JPG, PNG или DOCX, до 10 МБ',
          onRemove: () => setPicked([]),
        })));
  }

  // ── Одна строка документа (внутри .ec-card-списка) ──────────────────────
  function DocRow(props) {
    const { doc, onUpload, onHistory, onDownload, last } = props;
    const detail = DOC_DETAIL[doc.id] || {};
    const st = DOC_STATUS[doc.status] || DOC_STATUS.awaiting;
    const note = detail.note || doc.note;
    const due = detail.due;
    const versions = detail.versions || [];
    const cur = versions[0];
    const wantFile = needsAction(doc.status);
    const hasHistory = versions.length > 0;

    return h('div', {
      style: {
        padding: '16px 0',
        borderBottom: last ? '0' : '1px solid var(--line)',
      },
    },
      // шапка: вид + название + статус
      h('div', { className: 'u-flex u-items-start u-justify-between u-gap-3', key: 'top' },
        h('div', { className: 'u-grow', style: { minWidth: 0 }, key: 't' },
          h('div', { style: { fontSize: 'var(--fs-2xs)', fontWeight: 'var(--fw-bold)', letterSpacing: 'var(--tracking-wider)', textTransform: 'uppercase', color: 'var(--ink-mute)' } }, doc.kind || 'Документ'),
          h('div', { style: { fontFamily: 'var(--font-display)', fontSize: 'var(--fs-lg)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)', letterSpacing: '-.01em', marginTop: '3px' } }, doc.name),
          note ? h('p', { style: { marginTop: '5px', fontSize: 'var(--fs-sm)', lineHeight: 'var(--lh-normal)', color: 'var(--ink-soft)', maxWidth: '54ch' } }, note) : null),
        h(Pill, { tone: st.tone, key: 'p' }, st.label)),

      // дедлайн-ориентир
      due ? h('div', {
        key: 'due', className: 'u-flex u-items-center u-gap-2',
        style: { marginTop: 'var(--sp-3)', fontSize: 'var(--fs-sm)', color: 'var(--ink-soft)' },
      },
        h(Ic.Clock, { size: 15, key: 'i' }),
        h('span', { key: 's' },
          'Срок: ', h('b', { style: { color: 'var(--ink)' } }, due.label),
          due.daysLeft != null ? h('span', null, ' · через ', h('span', { className: 'u-tnum' }, due.daysLeft), ' дн.') : null)) : null,

      // комментарий куратора по правкам
      doc.status === 'needs_fix' && detail.review ? h('div', {
        key: 'rev', className: 'u-flex u-items-start u-gap-3',
        style: {
          marginTop: 'var(--sp-3)', padding: '12px 14px', borderRadius: 'var(--r-md)',
          background: 'var(--warning-soft)', borderLeft: '3px solid var(--ochre)',
        },
      },
        h('span', { 'aria-hidden': 'true', style: { color: 'var(--ochre)', flexShrink: 0, marginTop: '2px', display: 'inline-flex' }, key: 'i' }, h(Ic.Edit, { size: 18 })),
        h('div', { className: 'u-grow', key: 'b' },
          h('div', { style: { fontWeight: 'var(--fw-semibold)', color: 'var(--ink)', fontSize: 'var(--fs-sm)' } },
            'Комментарий куратора' + (detail.reviewBy ? ' · ' + detail.reviewBy : '')),
          h('p', { style: { marginTop: '4px', fontSize: 'var(--fs-sm)', lineHeight: 'var(--lh-normal)', color: 'var(--ink-soft)' } }, detail.review))) : null,

      // текущий загруженный файл
      cur ? h('div', { key: 'cur', style: { marginTop: 'var(--sp-3)' } },
        h(FileChip, { name: cur.name, meta: cur.size + ' · ' + cur.date, onDownload: () => onDownload(cur.name) })) : null,

      // нижний ряд действий
      h('div', { className: 'u-flex u-items-center u-gap-2 u-wrap', key: 'foot', style: { marginTop: 'var(--sp-3)' } },
        wantFile
          ? h(Button, { variant: 'primary', size: 'sm', iconLeft: Ic.Upload, onClick: () => onUpload(doc), key: 'u' }, doc.status === 'needs_fix' ? 'Загрузить заново' : 'Загрузить файл')
          : doc.status === 'accepted'
            ? h(Button, { variant: 'secondary', size: 'sm', iconLeft: Ic.Upload, onClick: () => onUpload(doc), key: 'r' }, 'Заменить')
            : h(Button, { variant: 'secondary', size: 'sm', iconLeft: Ic.Upload, onClick: () => onUpload(doc), key: 'r2' }, 'Загрузить новую версию'),
        hasHistory
          ? h(Button, { variant: 'ghost', size: 'sm', iconLeft: Ic.Clock, onClick: () => onHistory(doc), key: 'h' }, 'История версий')
          : null));
  }

  function Documents() {
    const [docs, setDocs] = useState(null);
    const [meta, setMeta] = useState({ student: FALLBACK.student, curator: FALLBACK.curator });
    const [seeds, setSeeds] = useState(null);
    const [filter, setFilter] = useState('all');
    const [historyDoc, setHistoryDoc] = useState(null);
    const [uploadDoc, setUploadDoc] = useState(null);
    const [assistOpen, setAssistOpen] = useState(false);
    const [info, setInfo] = useState(null); // {title, body[]}

    useEffect(() => {
      let alive = true;
      const M = window.EMock, A = window.EApi;
      const apply = (list) => {
        if (!alive) return;
        setDocs((Array.isArray(list) && list.length ? list : FALLBACK.docs).map((d) => Object.assign({}, d, { status: norm(d.status) })));
      };
      if (M) {
        setMeta({ student: M.student || FALLBACK.student, curator: M.curator || FALLBACK.curator });
        setSeeds(M.assistantSeeds7 || M.assistantSeeds || null);
      }
      if (A && A.documents) {
        A.documents().then((r) => apply(r && r.data)).catch(() => apply((M && M.documents) || FALLBACK.docs));
      } else {
        setTimeout(() => apply((M && M.documents) || FALLBACK.docs), 160);
      }
      return () => { alive = false; };
    }, []);

    // ── Мутация загрузки: меняем статус + версия в историю + тост ──────────
    const handleUpload = (doc, files) => {
      const f = (files && files[0]) || { name: doc.name + '.pdf', size: '1,0 МБ' };
      const det = DOC_DETAIL[doc.id] || (DOC_DETAIL[doc.id] = {});
      det.versions = [{ name: f.name, size: f.size || '1,0 МБ', date: 'сегодня', mine: true }].concat(det.versions || []);
      det.review = null;
      setDocs((arr) => (arr || []).map((d) => (d.id === doc.id ? Object.assign({}, d, { status: 'in_review' }) : d)));
      toast({ tone: 'success', title: 'Файл загружен', text: doc.name + ' ушел куратору на проверку.' });
    };

    const handleDownload = (name) => {
      toast({ tone: 'info', title: 'Скачивание', text: name + ' — загрузка началась.' });
    };

    // ── Счетчики и фильтрация ──────────────────────────────────────────────
    const counts = useMemo(() => {
      const cc = { all: 0, todo: 0, in_review: 0, accepted: 0 };
      (docs || []).forEach((d) => {
        cc.all += 1;
        if (needsAction(d.status)) cc.todo += 1;
        if (d.status === 'in_review' || d.status === 'uploaded') cc.in_review += 1;
        if (d.status === 'accepted') cc.accepted += 1;
      });
      return cc;
    }, [docs]);

    const visible = (docs || []).filter((d) => {
      if (filter === 'all') return true;
      if (filter === 'todo') return needsAction(d.status);
      if (filter === 'in_review') return d.status === 'in_review' || d.status === 'uploaded';
      if (filter === 'accepted') return d.status === 'accepted';
      return true;
    });

    const firstName = (meta.student.name || 'ученика').split(' ')[0];
    const acceptedPct = counts.all ? Math.round((counts.accepted / counts.all) * 100) : 0;

    const openAssistant = () => setAssistOpen(true);
    const seedStage = { id: 's3', stageId: 'm2', title: 'Сбор документов' };

    const helpInfo = { title: 'Написать куратору', body: [
      'Куратор ' + (meta.curator.name || 'команды') + ' проверяет документы по будням. Напиши вопрос — ответим в чате сопровождения.',
      'Срочное лучше задать ассистенту: он подскажет сразу и при необходимости передаст куратору.'] };
    const settingsInfo = { title: 'Настройки', body: [
      'Здесь будут профиль, уведомления и настройки приватности.',
      'Раздел в проработке — пока всем управляет куратор. Если что-то нужно поменять, напиши в чат.'] };
    const notifInfo = { title: 'Уведомления', body: [
      'Тут появятся свежие события по документам: что приняли, что нужно поправить и ближайшие сроки.',
      counts.todo ? 'Сейчас от тебя ждут ' + counts.todo + ' документ(а). Загляни в раздел «Что нужно от тебя».' : 'Сейчас от тебя ничего не нужно — все на стороне команды.'] };

    // ── Загрузка ───────────────────────────────────────────────────────────
    const railProps = { student: meta.student, todoCount: counts.todo, onHelp: () => setInfo(helpInfo), onSettings: () => setInfo(settingsInfo) };

    if (!docs) {
      return h('div', { className: 'ec' },
        h(Rail, railProps),
        h('main', { id: 'main', className: 'ec-main' },
          h('div', { className: 'ec-top' },
            h('div', null,
              h('div', { className: 'ec-top__t' }, 'Документы'),
              h('div', { className: 'ec-top__s' }, 'Собираем пакет для подачи'))),
          h('div', { className: 'u-stack-4' },
            h(Skeleton, { variant: 'block', height: 200 }),
            h(Skeleton, { variant: 'block', height: 140 }),
            h(Skeleton, { variant: 'block', height: 220 }))));
    }

    // ── HERO ────────────────────────────────────────────────────────────────
    const allDone = counts.todo === 0;
    const hero = h('div', { className: 'ec-card ec-hero' },
      h('div', { className: 'ec-hero__l' },
        h('span', { className: 'ec-pill' }, 'Этап 3 из 7'),
        h('div', { className: 'ec-hero__t' }, 'Документы и подача'),
        h('div', { className: 'ec-hero__ok' },
          h('span', { className: 'c' }, h(allDone ? Ic.Check : Ic.Clock, { size: 14 })),
          allDone ? 'Все бумаги собраны' : 'Все идет по плану'),
        h('div', { className: 'ec-hero__d' }, allDone
          ? 'Документы на месте. Команда переводит, заверяет и готовит подачу — от тебя пока ничего не нужно.'
          : 'От тебя осталось ' + counts.todo + ' ' + (counts.todo === 1 ? 'документ' : 'документа') + ' — загрузи их, и мы готовим подачу на грант CSC. Перевод и нотариус берем на себя.'),
        h('div', { className: 'ec-hero__mini' },
          h('div', { className: 'ec-mstat' },
            h('span', { className: 'ec-mstat__i' }, h(Ic.CheckCircle, { size: 19 })),
            h('div', null,
              h('div', { className: 'ec-mstat__l' }, 'Принято'),
              h('div', { className: 'ec-mstat__v u-tnum' }, counts.accepted + ' из ' + counts.all))),
          h('div', { className: 'ec-mstat' },
            h('span', { className: 'ec-mstat__i' }, h(counts.todo ? Ic.AlertCircle : Ic.Check, { size: 19 })),
            h('div', null,
              h('div', { className: 'ec-mstat__l' }, 'Ждут тебя'),
              h('div', { className: 'ec-mstat__v u-tnum' }, counts.todo ? counts.todo + ' шт.' : 'нет'))))),
      h('div', { className: 'ec-hero__r' },
        h('div', { className: 'ec-hero__art', 'aria-hidden': 'true' }, h('img', { src: 'assets/mountain-light.png', alt: '' })),
        h(Ring, { pct: acceptedPct })));

    // ── ЧТО НУЖНО ОТ ТЕБЯ · нумерованные карты (awaiting / needs_fix) ───────
    const explainFor = (detail, d) => {
      if (d.status === 'needs_fix') return detail.review ? detail.review.split('.')[0] + '.' : 'Куратор попросил поправить — открой подробности ниже.';
      return detail.note || 'Загрузи файл — куратор проверит и подскажет, если что-то поправить.';
    };
    const todos = (docs || []).filter((d) => needsAction(d.status));
    const actsBlock = h(React.Fragment, null,
      h('div', { className: 'ec-sec' },
        h('span', { className: 'ec-sec__t' }, 'Что нужно от тебя'),
        todos.length ? h('span', { className: 'ec-sec__c u-tnum' }, todos.length + (todos.length === 1 ? ' документ' : ' документа')) : null),
      todos.length
        ? h('div', { className: 'ec-acts' },
            todos.map((d, i) => {
              const detail = DOC_DETAIL[d.id] || {};
              const warn = d.status === 'needs_fix';
              return h('div', { key: d.id, className: 'ec-card ec-act' + (warn ? ' is-warning' : '') },
                h('div', { className: 'ec-act__h' },
                  h('span', { className: 'ec-act__n u-tnum' }, i + 1),
                  h('div', { className: 'ec-act__b' },
                    h('div', { className: 'ec-act__t' }, detail.actionTitle || d.name),
                    h('div', { className: 'ec-act__x' }, explainFor(detail, d)),
                    detail.actionTime ? h('div', { className: 'ec-act__time' }, h(Ic.Clock, { size: 14 }), h('span', null, '~ ' + detail.actionTime)) : null)),
                h('div', { className: 'ec-act__btn' },
                  h(Button, { variant: warn ? 'secondary' : 'jade', onClick: () => warn && detail.review ? openAssistant() : setUploadDoc(d) },
                    detail.actionCta || (warn ? 'Что делать?' : 'Загрузить файл'))),
                h('span', { className: 'ec-act__ill', 'aria-hidden': 'true' }, h(icoOf(warn ? 'AlertTriangle' : 'File'), { size: 42 })));
            }))
        : h('div', { className: 'ec-card ec-empty' },
            h('span', { className: 'ec-empty__i' }, h(Ic.CheckCircle, { size: 20 })),
            h('div', null,
              h('div', { className: 'ec-empty__t' }, 'От тебя сейчас ничего не нужно'),
              h('div', { className: 'ec-empty__x' }, 'Все документы у команды. Мы напишем, как только понадобится действие.'))));

    // ── ВСЕ ДОКУМЕНТЫ · фильтр + список ─────────────────────────────────────
    const listBlock = h(React.Fragment, null,
      h('div', { className: 'ec-sec' },
        h('span', { className: 'ec-sec__t' }, 'Все документы'),
        h('span', { className: 'ec-sec__c u-tnum' }, counts.all + ' всего')),
      h('section', { className: 'ec-card', style: { padding: '20px 24px' }, 'aria-label': 'Список документов' },
        h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3 u-wrap', style: { marginBottom: 'var(--sp-4)' } },
          h('p', { style: { fontSize: 'var(--fs-sm)', color: 'var(--ink-soft)', maxWidth: '46ch' } },
            'Загружай по мере готовности — статус обновится сам. Перевод, нотариус и подачу берем на себя.'),
          h(Badge, { tone: counts.todo ? 'warning' : 'success', icon: counts.todo ? Ic.AlertTriangle : Ic.CheckCircle },
            counts.todo ? counts.todo + ' в работе' : 'Все на месте')),
        h('div', { style: { overflowX: 'auto', marginBottom: 'var(--sp-2)' } },
          h(SegmentedControl, {
            ariaLabel: 'Фильтр по статусу',
            options: FILTERS.map((f) => {
              const k = f.value === 'todo' ? 'todo' : f.value;
              return { value: f.value, label: f.label + (f.value !== 'all' && counts[k] ? ' · ' + counts[k] : '') };
            }),
            value: filter, onChange: setFilter,
          })),
        visible.length
          ? h('div', { style: { marginTop: 'var(--sp-2)' } },
              visible.map((d, i) => h(DocRow, {
                key: d.id, doc: d, last: i === visible.length - 1,
                onUpload: setUploadDoc, onHistory: setHistoryDoc, onDownload: handleDownload,
              })))
          : h('div', { style: { textAlign: 'center', padding: 'var(--sp-6) var(--sp-4)' } },
              h('span', { 'aria-hidden': 'true', style: { color: 'var(--ink-mute)', opacity: 0.6, display: 'inline-flex' } }, h(Ic.CheckCircle, { size: 36 })),
              h('div', { style: { marginTop: 'var(--sp-2)', fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' } }, 'Здесь пусто'),
              h('p', { style: { marginTop: '4px', fontSize: 'var(--fs-sm)', color: 'var(--ink-soft)' } }, 'В этом фильтре документов нет. Глянь другие статусы.'),
              h('div', { style: { marginTop: 'var(--sp-3)' } },
                h(Button, { variant: 'secondary', size: 'sm', onClick: () => setFilter('all') }, 'Показать все')))));

    // ── ДОГОВОРЫ И ЧЕКИ · на скачивание ─────────────────────────────────────
    const filesBlock = h(React.Fragment, null,
      h('div', { className: 'ec-sec' },
        h('span', { className: 'ec-sec__t' }, 'Договоры и чеки'),
        h('button', { type: 'button', className: 'ec-sec__all', onClick: () => nav('/payments') }, 'Все платежи →')),
      h('section', { className: 'ec-card', style: { padding: '20px 24px' }, 'aria-label': 'Договоры и чеки' },
        h('p', { style: { fontSize: 'var(--fs-sm)', color: 'var(--ink-soft)', marginBottom: 'var(--sp-4)' } }, 'Можно скачать в любой момент.'),
        h('div', { className: 'u-stack-2' },
          FILES.map((f) => h(FileChip, {
            key: f.id, name: f.title, meta: f.kind + ' · ' + f.meta,
            onDownload: () => handleDownload(f.title),
          })))));

    // ── НИЗ · куратор + все под контролем ───────────────────────────────────
    const cur = meta.curator || {};
    const curInitials = (cur.name || '').split(' ').map((w) => w[0]).slice(0, 2).join('');
    const botBlock = h('div', { className: 'ec-bot' },
      h('div', { className: 'ec-card ec-bcard' },
        h('span', { className: 'ec-cur__a', 'aria-hidden': 'true', style: { width: 56, height: 56, fontSize: 'var(--fs-base)', fontWeight: 'var(--fw-bold)', color: '#fff' } },
          curInitials, cur.online ? h('span', { className: 'ec-cur__on' }) : null),
        h('div', { className: 'ec-bcard__b' },
          h('div', { className: 'ec-bcard__t' }, cur.name || 'Куратор'),
          h('div', { className: 'ec-bcard__x' }, (cur.role || 'Куратор по документам') + (cur.online ? ' · на связи' : '') + '. Проверяет документы и подскажет, если что-то поправить.'),
          h('button', { type: 'button', className: 'ec-bcard__a', onClick: openAssistant },
            'Спросить про документы', h(Ic.ArrowUpRight, { size: 14 })))),
      h('div', { className: 'ec-card ec-bcard is-success' },
        h('div', { className: 'ec-bcard__b' },
          h('div', { className: 'ec-bcard__t' }, 'Все под контролем'),
          h('div', { className: 'ec-bcard__x' }, 'Мы следим за сроками подачи и сообщим, если какой-то документ потребует внимания.'),
          h('div', { className: 'ec-bcard__upd' }, 'Последнее обновление: сегодня в 12:30')),
        h('span', { className: 'ec-bcard__ill', 'aria-hidden': 'true' }, h(Ic.CheckCircle, { size: 38 }))));

    // мобильная нижняя нав
    const bn = h('nav', { className: 'ec-bn', 'aria-label': 'Навигация' },
      [{ icon: Ic.Home, label: 'Главная', to: '/student' },
       { icon: Ic.Doc, label: 'Документы', to: '/documents', active: true },
       { icon: Ic.Book, label: 'Обучение', to: '/learning/progress' },
       { icon: Ic.Target, label: 'Диагностика', to: '/diagnostics' }].map((it, i) => {
        const cls = 'ec-bn__item' + (it.active ? ' is-active' : '');
        const inner = [h(it.icon, { size: 22, key: 'i' }), h('span', { key: 'l' }, it.label)];
        return (it.to && Link) ? h(Link, { key: i, to: it.to, className: cls }, inner)
          : h('button', { key: i, type: 'button', className: cls }, inner);
      }));

    return h(React.Fragment, null,
      h('div', { className: 'ec' },
        h(Rail, railProps),
        h('main', { id: 'main', className: 'ec-main' },
          h('div', { className: 'ec-top' },
            h('div', null,
              h('div', { className: 'ec-top__t' }, 'Документы ' + firstName),
              h('div', { className: 'ec-top__s' }, 'Собираем пакет для подачи в вузы и на грант CSC')),
            h('div', { className: 'ec-top__sp' }),
            h('button', { type: 'button', className: 'ec-icb', 'aria-label': 'Уведомления', onClick: () => setInfo(notifInfo) },
              counts.todo ? h('span', { className: 'ec-icb__d', 'aria-hidden': 'true' }) : null, h(Ic.Bell, { size: 19 }))),
          hero,
          actsBlock,
          listBlock,
          filesBlock,
          h('div', { style: { height: 'var(--sp-5)' } }),
          botBlock),
        bn,
        h(AssistantFab, { onClick: openAssistant })),

      h(VersionsModal, { doc: historyDoc, onClose: () => setHistoryDoc(null), onDownload: handleDownload }),
      h(UploadModal, { doc: uploadDoc, onClose: () => setUploadDoc(null), onUpload: handleUpload }),
      h(Modal, { open: !!info, onClose: () => setInfo(null), title: info ? info.title : '' },
        info ? h('div', { className: 'e-article' }, info.body.map((p, i) => h('p', { key: i }, p))) : null),
      h(AssistantPopup, { open: assistOpen, onClose: () => setAssistOpen(false), stage: seedStage, seeds }));
  }

  EScreens.Documents = Documents;
})();
