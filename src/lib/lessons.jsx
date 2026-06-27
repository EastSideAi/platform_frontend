/* ============================================================================
   EastSide — Учебный домен: модель урока (window.ELessons)
   ----------------------------------------------------------------------------
   ЕДИНЫЙ источник правды для трёх экранов образовательной платформы:
     · хаб ученика (learn-hub)      — берёт COURSE + список уроков;
     · урок-тренажёр (learn-lesson) — играет lesson (load());
     · конструктор (learn-build)    — редактирует lesson и сохраняет (save()).
   Конструктор пишет урок в localStorage, тренажёр читает его оттуда (fallback —
   DEFAULT). Рендер блока общий — window.ELessonUI.BlockView (learn-lesson.jsx),
   поэтому «как видит ученик» в конструкторе = реальный урок.

   Структура урока (как у реальных преподавателей): ВИДЕО — основа, под ним
   КОНСПЕКТ (текст), затем ДОМАШНЕЕ ЗАДАНИЕ — интерактивные блоки (тест + разные
   типы заданий). lesson.video (ссылка), lesson.notes (текст), lesson.blocks (домашка).

   Форматы блока домашки (7): theory, choice, gap, match, order, type, tone.
   ============================================================================ */
(function () {
  'use strict';

  const KEY = 'es-lesson-draft';

  // ── Палитра блоков для конструктора ─────────────────────────────────────────
  // icon — ключ window.EIcons; gets — что в итоге делает ученик (для галереи).
  const TYPES = [
    { type: 'theory', label: 'Теория',     icon: 'Book',        hint: 'Объяснение и новые слова', gets: 'Читает правило и новые слова' },
    { type: 'choice', label: 'Один ответ', icon: 'CheckCircle', hint: 'Выбор одного верного',     gets: 'Выбирает один верный вариант' },
    { type: 'gap',    label: 'Пропуск',    icon: 'Edit',        hint: 'Вставить нужное слово',    gets: 'Вставляет слово в пропуск' },
    { type: 'match',  label: 'Пары',       icon: 'Grid',        hint: 'Соединить слово и перевод', gets: 'Соединяет пары иероглиф—перевод' },
    { type: 'order',  label: 'Предложение',icon: 'Route',       hint: 'Собрать фразу из слов',    gets: 'Собирает фразу из слов' },
    { type: 'type',   label: 'Ввод',       icon: 'Send',        hint: 'Напечатать ответ',         gets: 'Печатает ответ сам' },
    { type: 'tone',   label: 'Тон',        icon: 'Target',      hint: 'Определить тон иероглифа',  gets: 'Определяет тон иероглифа' },
  ];
  const typeMeta = (t) => TYPES.find((x) => x.type === t) || { type: t, label: t, icon: 'Book' };
  const typeLabel = (t) => typeMeta(t).label;

  const TONES = [
    { mark: 'ā', name: '1-й · ровный' },
    { mark: 'á', name: '2-й · восходящий' },
    { mark: 'ǎ', name: '3-й · нисходяще-восходящий' },
    { mark: 'à', name: '4-й · падающий' },
  ];

  // ── Урок по умолчанию: «Знакомство», HSK 1 (показывает все форматы) ─────────
  const DEFAULT = {
    id: 'demo-hsk1-greetings',
    title: 'Приветствие и первое знакомство',
    subtitle: 'Первые слова, с которых начинается китайский',
    goal: 'Запомнить 4 базовых слова и собрать первую фразу',
    level: 'HSK 1',
    video: { url: '', file: 'assets/lesson-sample.mp4', title: 'Приветствие: 你好, 谢谢, 再见', duration: '08:40', hanzi: '你好', poster: 'funnel-assets/universities/fudan.jpg' },
    objectives: [
      'Поздороваться и попрощаться в любой ситуации',
      'Произнести четыре базовых слова в нужном тоне',
      'Собрать первую фразу «Я — учитель»',
    ],
    glossary: [
      { hanzi: '你好', pinyin: 'nǐ hǎo', ru: 'Привет' },
      { hanzi: '谢谢', pinyin: 'xièxie', ru: 'Спасибо' },
      { hanzi: '再见', pinyin: 'zàijiàn', ru: 'До свидания' },
      { hanzi: '老师', pinyin: 'lǎoshī', ru: 'Учитель' },
      { hanzi: '我', pinyin: 'wǒ', ru: 'Я' },
      { hanzi: '是', pinyin: 'shì', ru: 'Быть, являться' },
    ],
    notes: 'Китайское приветствие складывается из простых слов. Достаточно запомнить несколько, чтобы поздороваться, поблагодарить и попрощаться почти в любой ситуации.\n\n## С чего начинается разговор\n你好 (nǐ hǎo) — универсальное «привет», дословно «ты хороший». Подходит и близкому другу, и незнакомому человеку.\n\n## Вежливость\n谢谢 (xièxie) — «спасибо», повтор слога делает слово мягким. 再见 (zàijiàn) — «до свидания», дословно «увидимся снова».\n\n## Почему важен тон\nОдин и тот же слог в разных тонах — разные слова: один звук в четырёх тонах даёт четыре слова. Поэтому тон мы слышим и держим с самого первого урока.\n[[tones]]',
    blocks: [
      {
        type: 'theory',
        title: 'Базовое приветствие',
        body: 'В китайском приветствие складывается из простых слов. Запомните эти четыре — и сможете поздороваться, поблагодарить и попрощаться с кем угодно.',
        vocab: [
          { hanzi: '你好', pinyin: 'nǐ hǎo', ru: 'Привет' },
          { hanzi: '谢谢', pinyin: 'xièxie', ru: 'Спасибо' },
          { hanzi: '再见', pinyin: 'zàijiàn', ru: 'Пока' },
          { hanzi: '老师', pinyin: 'lǎoshī', ru: 'Учитель' },
        ],
      },
      {
        type: 'choice',
        prompt: 'Как сказать «Привет»?',
        options: [
          { text: '你好', correct: true },
          { text: '谢谢', correct: false },
          { text: '再见', correct: false },
          { text: '对不起', correct: false },
        ],
        explain: '你好 (nǐ hǎo) дословно — «ты хороший». Универсальное приветствие в любой ситуации.',
      },
      {
        type: 'tone',
        hanzi: '妈',
        pinyin: 'mā',
        tone: 1,
        explain: '妈 (mā) — «мама», ровный первый тон. Тон меняет смысл: má — это уже «конопля».',
      },
      {
        type: 'gap',
        prompt: 'Вставьте пропущенное слово',
        before: 'Спасибо по-китайски —',
        after: ', это слово ты слышишь повсюду.',
        options: [
          { text: '谢谢', correct: true },
          { text: '你好', correct: false },
          { text: '再见', correct: false },
        ],
        explain: '谢谢 (xièxie) — «спасибо». Повтор слога делает слово мягким и вежливым.',
      },
      {
        type: 'order',
        prompt: 'Соберите фразу «Я — учитель»',
        tokens: ['我', '是', '老师'],
        explain: 'Порядок в китайском строгий: подлежащее → 是 → кто/что. 我是老师 — «Я учитель».',
      },
      {
        type: 'match',
        prompt: 'Соедините иероглиф и перевод',
        pairs: [
          { left: '你好', right: 'Привет' },
          { left: '谢谢', right: 'Спасибо' },
          { left: '再见', right: 'Пока' },
          { left: '老师', right: 'Учитель' },
        ],
        explain: 'Эти четыре слова — твой стартовый набор для первого разговора.',
      },
      {
        type: 'type',
        prompt: 'Напечатайте пиньинь для 谢谢',
        answers: ['xiexie', 'xièxie', 'xie xie'],
        explain: 'xièxie — оба слога четвёртым тоном, второй часто звучит легче.',
      },
    ],
  };

  // ── Пустой блок для конструктора ────────────────────────────────────────────
  function blankBlock(type) {
    switch (type) {
      case 'theory':
        return { type: 'theory', title: 'Новая тема', body: 'Короткое объяснение в пару предложений.', vocab: [{ hanzi: '', pinyin: '', ru: '' }] };
      case 'choice':
        return { type: 'choice', prompt: 'Текст вопроса', options: [{ text: 'Верный ответ', correct: true }, { text: 'Вариант', correct: false }, { text: 'Вариант', correct: false }], explain: '' };
      case 'gap':
        return { type: 'gap', prompt: 'Вставьте пропущенное слово', before: 'Начало фразы', after: 'конец фразы.', options: [{ text: 'верное', correct: true }, { text: 'вариант', correct: false }, { text: 'вариант', correct: false }], explain: '' };
      case 'match':
        return { type: 'match', prompt: 'Соедините пары', pairs: [{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }], explain: '' };
      case 'order':
        return { type: 'order', prompt: 'Соберите предложение', tokens: ['我', '是', '学生'], explain: '' };
      case 'type':
        return { type: 'type', prompt: 'Напечатайте ответ', answers: ['ответ'], explain: '' };
      case 'tone':
        return { type: 'tone', hanzi: '好', pinyin: 'hǎo', tone: 3, explain: '' };
      default:
        return { type: 'theory', title: '', body: '', vocab: [] };
    }
  }

  // ── Хелперы ──────────────────────────────────────────────────────────────────
  function shuffle(n) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function norm(s) {
    return String(s == null ? '' : s).trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?;:]+$/u, '');
  }

  // ── Видео: ссылка → встраиваемый src + имя площадки ──────────────────────────
  // Понимает YouTube / Vimeo / RuTube / VK; готовый /embed/ оставляет как есть.
  function videoEmbed(url) {
    const u = String((url && url.url != null ? url.url : url) || '').trim();
    if (!u) return null;
    let m;
    if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/)))
      return { src: 'https://www.youtube.com/embed/' + m[1] + '?rel=0&modestbranding=1', provider: 'YouTube' };
    if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)))
      return { src: 'https://player.vimeo.com/video/' + m[1], provider: 'Vimeo' };
    if ((m = u.match(/rutube\.ru\/(?:video|play\/embed)\/([A-Za-z0-9]+)/)))
      return { src: 'https://rutube.ru/play/embed/' + m[1], provider: 'RuTube' };
    if ((m = u.match(/vk(?:video)?\.(?:com|ru)\/.*?video(-?\d+)_(\d+)/)))
      return { src: 'https://vk.com/video_ext.php?oid=' + m[1] + '&id=' + m[2] + '&hd=2', provider: 'VK' };
    if (/^https?:\/\//.test(u)) return { src: u, provider: 'Видео' };
    return null;
  }

  // ── Конспект: текст → массив {kind:'head'|'para', text} ──────────────────────
  // Строка, начинающаяся с «## », — подзаголовок (даже если за ней сразу идёт
  // текст). Подряд идущие обычные строки склеиваются в абзац; пустая строка —
  // граница абзаца. Так формат прощает и «## h\nтекст», и «## h\n\nтекст».
  function notesToBlocks(notes) {
    const raw = String(notes || '').replace(/\r/g, '').trim();
    if (!raw) return [];
    const out = [];
    let para = [];
    const flush = () => { if (para.length) { out.push({ kind: 'para', text: para.join(' ').trim() }); para = []; } };
    raw.split('\n').forEach((lineRaw) => {
      const line = lineRaw.trim();
      if (!line) { flush(); return; }
      const hm = line.match(/^#{1,3}\s+(.*)$/);
      if (hm) { flush(); out.push({ kind: 'head', text: hm[1].trim() }); return; }
      // встроенная фигура-иллюстрация: [[tones]] и т.п. (рисуется кодом, без ассета)
      const fm = line.match(/^\[\[([a-z0-9_-]+)\]\]$/i);
      if (fm) { flush(); out.push({ kind: 'figure', name: fm[1].toLowerCase() }); return; }
      // картинка в конспекте: ![подпись](assets/...png)
      const im = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (im) { flush(); out.push({ kind: 'img', alt: im[1].trim(), src: im[2].trim() }); return; }
      para.push(line);
    });
    flush();
    return out.filter((b) => b.kind === 'figure' || b.kind === 'img' || b.text);
  }

  // ── Стейт-инициализация ответа (для тренажёра и превью) ──────────────────────
  function initState(block) {
    if (!block) return {};
    switch (block.type) {
      case 'match': return { picks: {}, active: null, order: shuffle((block.pairs || []).length) };
      case 'order': return { placed: [], order: shuffle((block.tokens || []).length) };
      case 'type':  return { value: '' };
      default:      return { sel: null }; // choice / gap / tone
    }
  }

  // ── Завершён ли блок (можно проверять) ───────────────────────────────────────
  function isComplete(block, st) {
    if (!block) return false;
    switch (block.type) {
      case 'theory': return true;
      case 'match':  return Object.keys((st && st.picks) || {}).length >= (block.pairs || []).length;
      case 'order':  return ((st && st.placed) || []).length >= (block.tokens || []).length;
      case 'type':   return !!(st && String(st.value || '').trim());
      default:       return st && st.sel != null;
    }
  }

  // ── Верный ли ответ ──────────────────────────────────────────────────────────
  function isCorrect(block, st) {
    if (!block) return false;
    switch (block.type) {
      case 'theory': return true;
      case 'match': {
        const pairs = block.pairs || [];
        for (let i = 0; i < pairs.length; i++) if (st.picks[i] !== i) return false;
        return true;
      }
      case 'order': {
        const placed = (st && st.placed) || [];
        const toks = block.tokens || [];
        if (placed.length !== toks.length) return false;
        // верно, если собранная строка совпала с эталонной (учёт повторов слов)
        return placed.map((i) => toks[i]).join('') === toks.join('');
      }
      case 'type': {
        const want = (block.answers || []).map(norm).filter(Boolean);
        return want.indexOf(norm(st && st.value)) >= 0;
      }
      case 'tone':
        return st && st.sel === ((block.tone || 1) - 1);
      default: {
        const o = (block.options || [])[st && st.sel];
        return !!(o && o.correct);
      }
    }
  }

  // ── Метаданные урока: блоки, ~минуты, ~XP (для шапки конструктора) ────────────
  function meta(lesson) {
    const blocks = (lesson && lesson.blocks) || [];
    let sec = 0, xp = 0;
    blocks.forEach((b) => { if (b.type === 'theory') { sec += 30; xp += 5; } else { sec += 25; xp += 10; } });
    return { blocks: blocks.length, minutes: Math.max(1, Math.round(sec / 60)), xp: xp + (blocks.length ? 20 : 0) };
  }

  // ── Валидация блока: первая проблема строкой, либо null ──────────────────────
  function blockIssue(b) {
    if (!b) return null;
    switch (b.type) {
      case 'theory':
        return (b.title || b.body) ? null : 'Пустой блок';
      case 'choice': case 'gap': {
        if (!String(b.prompt || '').trim() && b.type === 'choice') return 'Нет вопроса';
        const opts = b.options || [];
        if (opts.length < 2) return 'Мало вариантов';
        if (!opts.some((o) => o.correct)) return 'Не отмечен верный';
        if (opts.some((o) => !String(o.text || '').trim())) return 'Пустой вариант';
        return null;
      }
      case 'match': {
        const ps = b.pairs || [];
        if (ps.length < 2) return 'Мало пар';
        if (ps.some((p) => !String(p.left || '').trim() || !String(p.right || '').trim())) return 'Заполни пары';
        return null;
      }
      case 'order': {
        const t = (b.tokens || []).filter((x) => String(x || '').trim());
        return t.length < 2 ? 'Мало слов' : null;
      }
      case 'type': {
        const a = (b.answers || []).filter((x) => String(x || '').trim());
        return a.length ? null : 'Нет верного ответа';
      }
      case 'tone':
        return String(b.hanzi || '').trim() ? null : 'Нет иероглифа';
      default:
        return null;
    }
  }

  // ── Шаблоны урока (быстрый старт) ────────────────────────────────────────────
  const TEMPLATES = [
    { id: 'vocab', label: 'Лексика HSK', icon: 'Book', hint: 'Слова, выбор, пары, ввод', build: () => clone(DEFAULT) },
    {
      id: 'tones', label: 'Тоновый дрилл', icon: 'Target', hint: 'Тренировка четырёх тонов',
      build: () => ({
        id: 'tpl-tones', title: 'Четыре тона', subtitle: 'Слышим и различаем тоны', goal: 'Не путать тоны на базовых слогах', level: 'HSK 1',
        video: { url: '', title: 'Видеоурок: четыре тона', duration: '' },
        notes: 'В китайском высота и движение голоса меняют смысл слова. Тонов четыре, плюс нейтральный. Их нужно не выучить, а услышать и научиться повторять.\n\n## Слог ma в четырёх тонах\nmā — ровный высокий, má — восходящий, mǎ — нисходяще-восходящий, mà — резкий падающий. Один звук, четыре разных слова.',
        blocks: [
          { type: 'theory', title: 'Зачем тоны', body: 'Один и тот же слог в разных тонах — разные слова. mā (мама), má (конопля), mǎ (лошадь), mà (ругать). Тон нужно слышать и держать.', vocab: [
            { hanzi: '妈', pinyin: 'mā', ru: 'мама · 1-й' }, { hanzi: '麻', pinyin: 'má', ru: 'конопля · 2-й' },
            { hanzi: '马', pinyin: 'mǎ', ru: 'лошадь · 3-й' }, { hanzi: '骂', pinyin: 'mà', ru: 'ругать · 4-й' } ] },
          { type: 'tone', hanzi: '妈', pinyin: 'mā', tone: 1, explain: 'mā — ровный высокий первый тон.' },
          { type: 'tone', hanzi: '马', pinyin: 'mǎ', tone: 3, explain: 'mǎ — нисходяще-восходящий третий тон.' },
          { type: 'tone', hanzi: '骂', pinyin: 'mà', tone: 4, explain: 'mà — резкий падающий четвёртый тон.' },
          { type: 'choice', prompt: 'Какое слово значит «лошадь»?', options: [
            { text: 'mǎ 马', correct: true }, { text: 'mā 妈', correct: false }, { text: 'mà 骂', correct: false } ], explain: 'Лошадь — третий тон, mǎ.' },
        ],
      }),
    },
    {
      id: 'grammar', label: 'Грамматика', icon: 'Route', hint: 'Порядок слов и конструкции',
      build: () => ({
        id: 'tpl-grammar', title: 'Порядок слов', subtitle: 'Базовая структура предложения', goal: 'Собирать предложение подлежащее-是-кто', level: 'HSK 1',
        video: { url: '', title: 'Видеоурок: порядок слов', duration: '' },
        notes: 'Китайский держится на строгом порядке слов: кто — что делает — над чем. Менять местами нельзя, и это упрощает жизнь: один раз понял схему — собираешь любые простые фразы.\n\n## Связка 是\n是 (shì) соединяет «кто есть кто»: подлежащее + 是 + кто/что. 我是学生 — «Я студент». Порядок всегда такой.',
        blocks: [
          { type: 'theory', title: 'Структура с 是', body: 'Простое предложение «кто-то есть кто-то» строится так: подлежащее + 是 (shì) + кто/что. 我是学生 — «Я студент».', vocab: [
            { hanzi: '我', pinyin: 'wǒ', ru: 'я' }, { hanzi: '是', pinyin: 'shì', ru: 'быть, являться' }, { hanzi: '学生', pinyin: 'xuésheng', ru: 'студент' } ] },
          { type: 'order', prompt: 'Соберите «Я студент»', tokens: ['我', '是', '学生'], explain: '我是学生 — порядок строгий: 我 → 是 → 学生.' },
          { type: 'gap', prompt: 'Вставьте нужное слово', before: '我', after: '老师 — «Я учитель».', options: [
            { text: '是', correct: true }, { text: '好', correct: false }, { text: '不', correct: false } ], explain: '是 (shì) связывает «кто есть кто».' },
          { type: 'choice', prompt: 'Где ошибка в порядке слов?', options: [
            { text: '学生我是', correct: true }, { text: '我是学生', correct: false } ], explain: 'Подлежащее идёт первым: 我是学生.' },
        ],
      }),
    },
  ];

  // ── Хранилище ─────────────────────────────────────────────────────────────────
  function save(lesson) { try { localStorage.setItem(KEY, JSON.stringify(lesson)); return true; } catch (e) { return false; } }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const l = JSON.parse(raw); if (l && Array.isArray(l.blocks) && l.blocks.length) return l; }
    } catch (e) { /* битый драфт — отдаём дефолт */ }
    return clone(DEFAULT);
  }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // ── Соседние уроки модуля (для переключателя и «пройденных») ──────────────────
  const LESSON_NUMBERS = {
    id: 'demo-hsk1-numbers', title: 'Числа от 1 до 10', subtitle: 'Считаем и называем количество',
    goal: 'Свободно считать до десяти на слух и вслух', level: 'HSK 1',
    video: { url: '', file: 'assets/lesson-sample.mp4', title: 'Числа 1–10', duration: '07:20', hanzi: '一二三', poster: 'funnel-assets/universities/qingdao.jpg' },
    objectives: ['Назвать любое число от 1 до 10', 'Услышать число в речи', 'Показать число жестом по-китайски'],
    glossary: [
      { hanzi: '一', pinyin: 'yī', ru: 'один' }, { hanzi: '二', pinyin: 'èr', ru: 'два' },
      { hanzi: '三', pinyin: 'sān', ru: 'три' }, { hanzi: '十', pinyin: 'shí', ru: 'десять' },
    ],
    notes: 'Числа — фундамент: они нужны для цен, времени, дат и количества. Десять знаков, и из них собирается счёт до девяноста девяти.\n\n## Первая десятка\n一 (yī) — один, 二 (èr) — два, 三 (sān) — три. Дальше до 十 (shí) — десять. Знаки простые, а 一 二 三 — это просто черты.',
    blocks: [
      { type: 'theory', title: 'Считаем до трёх', body: 'Первые три числа пишутся чертами: 一 一черта, 二 две, 三 три. Запомнить легко.', vocab: [
        { hanzi: '一', pinyin: 'yī', ru: 'один' }, { hanzi: '二', pinyin: 'èr', ru: 'два' }, { hanzi: '三', pinyin: 'sān', ru: 'три' }, { hanzi: '十', pinyin: 'shí', ru: 'десять' } ] },
      { type: 'choice', prompt: 'Какой иероглиф значит «три»?', options: [
        { text: '三', correct: true }, { text: '二', correct: false }, { text: '十', correct: false } ], explain: '三 (sān) — три черты, три.' },
      { type: 'match', prompt: 'Соедините число и значение', pairs: [
        { left: '一', right: 'один' }, { left: '二', right: 'два' }, { left: '十', right: 'десять' } ], explain: 'Базовый счёт.' },
    ],
  };
  const LESSON_FAMILY = {
    id: 'demo-hsk1-family', title: 'Моя семья', subtitle: 'Рассказываем о семье простыми словами',
    goal: 'Назвать членов семьи и сказать, кто есть кто', level: 'HSK 1',
    video: { url: '', file: 'assets/lesson-sample.mp4', title: 'Семья по-китайски', duration: '09:05', hanzi: '家', poster: 'funnel-assets/universities/nanjing.jpg' },
    objectives: ['Назвать маму, папу и себя', 'Сказать «это мой папа»', 'Понять притяжательное 的'],
    glossary: [
      { hanzi: '爸爸', pinyin: 'bàba', ru: 'папа' }, { hanzi: '妈妈', pinyin: 'māma', ru: 'мама' },
      { hanzi: '哥哥', pinyin: 'gēge', ru: 'старший брат' }, { hanzi: '的', pinyin: 'de', ru: 'частица «-ого/-ой»' },
    ],
    notes: 'Слова о семье — одни из самых тёплых и частых. С ними вы расскажете о близких и поймёте, когда о семье спрашивают вас.\n\n## Родители\n爸爸 (bàba) — папа, 妈妈 (māma) — мама. Повтор слога — типичная черта «домашних» слов.\n\n## Чей это\n的 (de) делает слово притяжательным: 我的妈妈 — «моя мама».',
    blocks: [
      { type: 'theory', title: 'Кто есть кто', body: 'Семейные слова часто удваивают слог: 爸爸, 妈妈, 哥哥. Так звучит мягче и по-домашнему.', vocab: [
        { hanzi: '爸爸', pinyin: 'bàba', ru: 'папа' }, { hanzi: '妈妈', pinyin: 'māma', ru: 'мама' }, { hanzi: '哥哥', pinyin: 'gēge', ru: 'старший брат' } ] },
      { type: 'gap', prompt: 'Вставьте пропущенное слово', before: 'Это моя', after: '— она дома.', options: [
        { text: '妈妈', correct: true }, { text: '爸爸', correct: false }, { text: '哥哥', correct: false } ], explain: '妈妈 (māma) — мама.' },
      { type: 'order', prompt: 'Соберите «моя мама»', tokens: ['我', '的', '妈妈'], explain: '我的妈妈 — 的 связывает «чей».' },
    ],
  };

  // Модуль курса: лента уроков для переключателя на странице урока.
  const COURSE = {
    name: 'Китайский: с нуля до HSK 4',
    module: 'Модуль 1 · Первые слова',
    moduleShort: 'Модуль 1',
    total: 32,
    levelTotal: 14,       // уроков в текущем уровне (Модуль 1) — для «до уровня осталось N»
    teacher: { name: 'Ли Вэй', role: 'Преподаватель курса', initial: '李', sub: 'Носитель языка · 6 лет с подростками' },
    lessons: [
      { n: 9,  title: 'Числа от 1 до 10', duration: '07:20', words: 10, state: 'done', score: 88, thumb: 'funnel-assets/universities/qingdao.jpg', lesson: LESSON_NUMBERS },
      { n: 10, title: 'Моя семья', duration: '09:05', words: 12, state: 'done', score: 92, thumb: 'funnel-assets/universities/nanjing.jpg', lesson: LESSON_FAMILY },
      { n: 11, title: 'Приветствие и первое знакомство', duration: '08:40', words: 8, state: 'current', live: true, thumb: 'funnel-assets/universities/fudan.jpg' },
      { n: 12, title: 'Время и распорядок дня', duration: '09:15', words: 14, state: 'locked', when: 'Завтра, 17:00', thumb: 'funnel-assets/universities/harbin.jpg' },
      { n: 13, title: 'Покупки и числа', duration: '10:30', words: 18, state: 'locked', when: '30 июня', thumb: 'funnel-assets/universities/zhejiang.jpg' },
    ],
  };

  window.ELessons = {
    KEY, TYPES, TONES, TEMPLATES, typeMeta, typeLabel, DEFAULT, COURSE,
    blankBlock, initState, isComplete, isCorrect, meta, blockIssue, norm,
    videoEmbed, notesToBlocks, save, load, clone,
  };
})();
