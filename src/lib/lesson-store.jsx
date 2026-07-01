/* ============================================================================
   EastSide — Хранилище уроков (window.ELessonStore)
   ----------------------------------------------------------------------------
   «Бэкенд» учебной платформы для двух экранов: конструктора (#/learn/build/:id)
   и урока-тренажёра (#/learn/lesson/:id). Уроки — это адресуемые сущности с
   собственным id: на конкретный урок можно зайти по ссылке, редактировать его,
   открыть как ученик, дублировать, удалить.

   ОДИН интерфейс — две реализации за ним:
     · ЛОКАЛЬНАЯ  — таблица уроков в localStorage (ключ 'es-lessons-v1'). Работает
       без бэкенда: превью, file://, офлайн. Это источник правды, когда ES_API_BASE
       не задан.
     · СЕТЕВАЯ     — REST /api/learning/lessons через window.EApi, когда задан
       window.ES_API_BASE. Контракт — docs/lessons-api.md. localStorage при этом
       работает зеркалом-кешем (мгновенный getSync + офлайн-устойчивость).

   Все методы возвращают Promise (единый контракт с сетевым режимом). Для мест,
   которым нужен синхронный старт (инициализация конструктора), есть *Sync-версии
   поверх локального кеша.

   Схема таблицы (localStorage 'es-lessons-v1'):
     { version:1, current:<id|null>, order:[id...], items:{ [id]: lesson } }
   Урок хранится как есть (модель из window.ELessons: {id,title,subtitle,goal,
   level,video,objectives,glossary,notes,doc[],blocks[],materials[], createdAt,
   updatedAt}). createdAt/updatedAt — ISO-8601, проставляет стор.
   ============================================================================ */
(function () {
  'use strict';

  const L = window.ELessons;
  const Api = window.EApi;
  if (!L) { if (window.console) console.warn('[ELessonStore] window.ELessons не загружен'); }

  const TABLE_KEY = 'es-lessons-v1';   // таблица уроков
  const LEGACY_KEY = (L && L.KEY) || 'es-lesson-draft'; // старый одиночный черновик
  // База уроков отдельная (ES_LESSONS_BASE): только уроки уходят в бэкенд/БД, а
  // остальной фронт (диагностика/анкета/AI) остаётся на своём ES_API_BASE. Если
  // отдельной нет — падаем на общий ES_API_BASE. Пусто = локальный режим.
  const BASE = (window.ES_LESSONS_BASE || window.ES_API_BASE || '').replace(/\/+$/, '');
  const REMOTE = !!BASE;

  const clone = (x) => (L && L.clone ? L.clone(x) : JSON.parse(JSON.stringify(x)));
  const nowISO = () => new Date().toISOString();

  // ── id генератор: коротко, читаемо, устойчиво к коллизиям ────────────────────
  function newId() {
    const t = Date.now().toString(36);
    const r = Math.random().toString(36).slice(2, 6);
    return 'l' + t + r;
  }

  // ── Пустой урок (совпадает с blank конструктора) ─────────────────────────────
  function blankLesson(over) {
    return Object.assign({
      id: newId(),
      title: '', subtitle: '', goal: '', level: 'HSK 1',
      video: {}, objectives: [], glossary: [], notes: '',
      doc: [], blocks: [], materials: [],
      createdAt: nowISO(), updatedAt: nowISO(),
    }, over || {});
  }

  // ── Демо-библиотека: чтобы на конкретный урок было куда зайти сразу ───────────
  // Тянем реальные демо-уроки из window.ELessons (DEFAULT + встроенные в COURSE).
  function demoSeeds() {
    const out = [];
    if (L && L.DEFAULT) out.push(clone(L.DEFAULT));
    const course = (L && L.COURSE && L.COURSE.lessons) || [];
    course.forEach((it) => { if (it && it.lesson) out.push(clone(it.lesson)); });
    // порядок в библиотеке: по номеру урока (числа → семья → приветствие)
    return out.map((l, i) => stamp(Object.assign({ createdAt: nowISO() }, l), true));
  }

  // ── Нормализация/штамп времени ───────────────────────────────────────────────
  function stamp(lesson, keepUpdated) {
    const l = lesson || {};
    if (!l.id) l.id = newId();
    if (!l.createdAt) l.createdAt = nowISO();
    if (!keepUpdated || !l.updatedAt) l.updatedAt = nowISO();
    return l;
  }

  /* ── ЛОКАЛЬНАЯ ТАБЛИЦА ──────────────────────────────────────────────────── */
  function emptyTable() { return { version: 1, current: null, order: [], items: {} }; }

  function readTable() {
    try {
      const raw = localStorage.getItem(TABLE_KEY);
      if (raw) {
        const t = JSON.parse(raw);
        if (t && t.items && Array.isArray(t.order)) return t;
      }
    } catch (e) { /* битая таблица — пересоберём */ }
    return null;
  }

  function writeTable(t) {
    try { localStorage.setItem(TABLE_KEY, JSON.stringify(t)); return true; }
    catch (e) { if (window.console) console.warn('[ELessonStore] запись не удалась', e); return false; }
  }

  // Легаси-миграция: единственный черновик 'es-lesson-draft' → запись в таблице.
  // Прогоняем через ELessons.load() (он умеет мигрировать notes+blocks → doc[]).
  function importLegacy() {
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return null;
      const l = L && L.load ? L.load() : JSON.parse(raw);
      if (!l || typeof l !== 'object') return null;
      const isEmpty = (l.doc || []).length === 0 && (l.blocks || []).length === 0 && !String(l.title || '').trim();
      if (isEmpty) return null;
      // id СОХРАНЯЕМ: если это демо-id с правками пользователя — он перезапишет сид
      // того же id (правки побеждают), а не создаст дубль. Свежий id — только если id нет.
      if (!l.id) l.id = newId();
      return stamp(l);
    } catch (e) { return null; }
  }

  // Первичная сборка таблицы: демо-сиды + импорт легаси-черновика (если был).
  function seedTable() {
    const t = emptyTable();
    demoSeeds().forEach((l) => { t.items[l.id] = l; t.order.push(l.id); });
    const legacy = importLegacy();
    if (legacy) {
      t.items[legacy.id] = legacy;                    // перезаписывает сид того же id
      t.order = t.order.filter((x) => x !== legacy.id);
      t.order.unshift(legacy.id);                     // черновик пользователя — первым, без дубля
      t.current = legacy.id;
    } else {
      t.current = t.order[0] || null;
    }
    writeTable(t);
    return t;
  }

  // Кеш таблицы в памяти модуля (единый снапшот на сессию, синхронный доступ).
  let TABLE = readTable() || seedTable();

  function persist() { TABLE.version = 1; writeTable(TABLE); mirrorLegacy(); }

  // Зеркалим текущий урок в старый ключ 'es-lesson-draft' — обратная совместимость
  // с кодом, который ещё зовёт ELessons.load() (нетронутые пути).
  function mirrorLegacy() {
    try {
      const cur = TABLE.current && TABLE.items[TABLE.current];
      if (cur && L && L.save) L.save(cur);
    } catch (e) { /* не критично */ }
  }
  mirrorLegacy();

  function summaryOf(lesson) {
    const m = (L && L.meta) ? L.meta(lesson) : { blocks: (lesson.blocks || []).length, doc: (lesson.doc || []).length, words: 0, minutes: 1, xp: 0 };
    const vid = lesson.video || {};
    return {
      id: lesson.id,
      title: lesson.title || '',
      subtitle: lesson.subtitle || '',
      level: lesson.level || '',
      hasVideo: !!((vid.url && String(vid.url).trim()) || (vid.file && String(vid.file).trim())),
      duration: vid.duration || '',
      thumb: vid.poster || '',
      createdAt: lesson.createdAt || null,
      updatedAt: lesson.updatedAt || lesson.createdAt || null,
      counts: { doc: m.doc, blocks: m.blocks, words: m.words, minutes: m.minutes, xp: m.xp },
    };
  }

  // Пустышка: без названия И без контента (0 блоков конспекта, 0 практик).
  // Прячем такие из списка/плейлиста (например, брошенный «Новый урок»).
  function notEmpty(s) { return !!(s && ((s.title && String(s.title).trim()) || (s.counts && (s.counts.doc || s.counts.blocks)))); }
  function listLocal() {
    return TABLE.order
      .map((id) => TABLE.items[id])
      .filter(Boolean)
      .map(summaryOf)
      .filter(notEmpty);
  }

  function getLocal(id) {
    const l = id && TABLE.items[id];
    return l ? clone(l) : null;
  }

  function upsertLocal(lesson) {
    const l = stamp(clone(lesson));            // проставит updatedAt
    const isNew = !TABLE.items[l.id];
    TABLE.items[l.id] = l;
    if (isNew) TABLE.order.unshift(l.id);
    TABLE.current = l.id;
    persist();
    return clone(l);
  }

  function removeLocal(id) {
    if (!TABLE.items[id]) return false;
    delete TABLE.items[id];
    TABLE.order = TABLE.order.filter((x) => x !== id);
    if (TABLE.current === id) TABLE.current = TABLE.order[0] || null;
    persist();
    return true;
  }

  function duplicateLocal(id) {
    const src = TABLE.items[id];
    if (!src) return null;
    const copy = clone(src);
    copy.id = newId();
    copy.title = (src.title || 'Урок') + ' — копия';
    copy.createdAt = nowISO();
    copy.updatedAt = nowISO();
    TABLE.items[copy.id] = copy;
    const at = TABLE.order.indexOf(id);
    if (at >= 0) TABLE.order.splice(at + 1, 0, copy.id);
    else TABLE.order.unshift(copy.id);
    TABLE.current = copy.id;
    persist();
    return clone(copy);
  }

  /* ── СЕТЕВОЙ РЕЖИМ (когда задан ES_API_BASE) ─────────────────────────────────
     Сеть — источник правды для list/get/create/save/remove. Локальная таблица
     остаётся зеркалом-кешем (mirror), чтобы getSync/офлайн жили. Если сеть упала,
     EApi сам делает graceful-fallback на мок; здесь дополнительно падаем на кеш. */
  function mirrorPut(lesson) {
    if (!lesson || !lesson.id) return;
    const l = stamp(clone(lesson), true);
    const isNew = !TABLE.items[l.id];
    TABLE.items[l.id] = l;
    if (isNew) TABLE.order.unshift(l.id);
    persist();
  }
  function mirrorAll(lessons) {
    (lessons || []).forEach((l) => { if (l && l.id) { TABLE.items[l.id] = l; if (TABLE.order.indexOf(l.id) < 0) TABLE.order.push(l.id); } });
    persist();
  }

  // Прямой fetch к базе уроков (не через EApi — тот завязан на ES_API_BASE).
  // Без credentials: эндпоинты уроков анонимны, cookie/CSRF не нужны.
  async function remote(method, id, body) {
    const path = '/api/learning/lessons' + (id ? '/' + encodeURIComponent(id) : '');
    const res = await fetch(BASE + path, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json().catch(function () { return null; });
  }

  /* ── ПУБЛИЧНЫЙ АСИНХРОННЫЙ API ───────────────────────────────────────────── */
  async function list() {
    if (REMOTE) {
      try {
        const data = await remote('GET', '');
        const arr = (data && (data.lessons || data.items || data)) || [];
        if (Array.isArray(arr)) {
          // Успешный ответ бэка — источник правды (даже пустой список). Локальный
          // кеш подставляем ТОЛЬКО при сетевой ошибке (catch), иначе после создания
          // первого урока демо-кеш «затирал» бы бэкенд и мигал.
          if (arr.length && (arr[0].doc || arr[0].blocks)) mirrorAll(arr.map((l) => stamp(l, true)));
          return arr.map((l) => (l && l.counts ? l : summaryOf(l))).filter(notEmpty);
        }
      } catch (e) { /* сеть упала — на кеш */ }
    }
    return listLocal();
  }

  async function get(id) {
    if (REMOTE) {
      try {
        const data = await remote('GET', id);
        const l = (data && (data.lesson || data)) || null;
        if (l && l.id) { mirrorPut(l); return clone(l); }
      } catch (e) { /* падаем на кеш */ }
    }
    return getLocal(id);
  }

  async function create(seed) {
    let base;
    if (!seed) base = blankLesson();
    else if (typeof seed === 'string') {           // id шаблона из ELessons.TEMPLATES
      const tpl = (L.TEMPLATES || []).find((t) => t.id === seed);
      base = tpl ? stamp(tpl.build()) : blankLesson();
      base.id = newId();                           // шаблон → свой id
    } else base = stamp(Object.assign(blankLesson(), seed));
    if (REMOTE) {
      try {
        const data = await remote('POST', '', base);
        const l = (data && (data.lesson || data)) || base;
        mirrorPut(l); return clone(l);
      } catch (e) { /* локально */ }
    }
    return upsertLocal(base);
  }

  async function save(lesson) {
    if (!lesson) return null;
    const l = stamp(clone(lesson));
    if (REMOTE) {
      try {
        const data = await remote('PUT', l.id, l);
        const out = (data && (data.lesson || data)) || l;
        mirrorPut(out); TABLE.current = out.id; persist(); return clone(out);
      } catch (e) { /* локально */ }
    }
    return upsertLocal(l);
  }

  async function remove(id) {
    if (REMOTE) {
      try { await remote('DELETE', id); } catch (e) { /* всё равно чистим кеш */ }
    }
    return removeLocal(id);
  }

  async function duplicate(id) {
    if (REMOTE) {
      const src = await get(id);
      if (!src) return null;
      const copy = Object.assign({}, src, { id: newId(), title: (src.title || 'Урок') + ' — копия', createdAt: nowISO(), updatedAt: nowISO() });
      return create(copy);
    }
    return duplicateLocal(id);
  }

  /* ── СИНХРОННЫЕ ХЕЛПЕРЫ (локальный кеш) ─────────────────────────────────────
     Нужны конструктору для мгновенной инициализации без мигания загрузки. */
  function getSync(id) { return getLocal(id); }
  function listSync() { return listLocal(); }
  function currentId() { return TABLE.current; }
  function setCurrent(id) { if (TABLE.items[id]) { TABLE.current = id; persist(); } }
  function has(id) { return !!(id && TABLE.items[id]); }
  // Синхронная запись в кеш (конструктор автосейвит на каждый апдейт). В сетевом
  // режиме дублируется debounce-PUT'ом через saveDebounced.
  function saveLocalSync(lesson) { return upsertLocal(lesson); }

  // Debounce-обёртка для автосейва: локально пишем сразу, сеть дёргаем реже.
  let netTimer = null;
  function saveDebounced(lesson, ms) {
    const saved = saveLocalSync(lesson);           // мгновенно в кеш + legacy-зеркало
    if (REMOTE) {
      if (netTimer) clearTimeout(netTimer);
      const snap = clone(saved);
      netTimer = setTimeout(() => { save(snap).catch(() => {}); }, ms || 900);
    }
    return saved;
  }

  window.ELessonStore = {
    // режим и утилиты
    isRemote: () => REMOTE, newId, blankLesson, summaryOf, TABLE_KEY,
    // async CRUD (единый контракт локаль/сеть)
    list, get, create, save, remove, duplicate,
    // sync-хелперы поверх локального кеша
    listSync, getSync, has, currentId, setCurrent, saveLocalSync, saveDebounced,
  };
})();
