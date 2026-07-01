/* ============================================================================
   EastSide AI — API-клиент (window.EApi)
   ----------------------------------------------------------------------------
   База бэка — window.ES_API_BASE (выставляется в index.html). Когда база задана —
   фронт реально ходит в бэкенд по маршрутам из docs/API.md. Когда базы нет
   (пустая строка / file://) или запрос упал — graceful-fallback на мок из EMock,
   чтобы фронт жил без бэкенда. Никаких ПДн в localStorage/URL (см. SECURITY-RULES).
   Токен авторизации — в памяти модуля, не в сторадже.

   Маршруты бэка реальные и с префиксом /api (см. API.md). Mock же исторически
   разложен по плоским ключам ('GET /me', '/roadmap' и т.п.) — это форма, которую
   рендерят экраны (фронт — источник формы). Поэтому при фолбэке реальный путь
   нормализуется в плоский mock-ключ через mockKey(). Сопоставление путь→форма
   задокументировано в docs/_polish/phase5-integration.md.
   ============================================================================ */
(function () {
  'use strict';

  const BASE = (window.ES_API_BASE || '').replace(/\/+$/, '');
  // База AI-ассистента (бот, эндпоинт /kb/ask). Пусто = same-origin: запрос идёт
  // на /kb/ask своего домена, а прокси (Vite dev / vercel.json) уводит на бота —
  // поэтому CORS бота не задействован. Отдельно от BASE: бот — другой сервис.
  const BOT_BASE = (window.ES_BOT_BASE != null ? window.ES_BOT_BASE : '').replace(/\/+$/, '');
  let authToken = null; // короткоживущий JWT держим в памяти, не в localStorage
  let csrfToken = null; // CSRF для мутаций (бэк кладет в не-httpOnly cookie es_csrf)

  function setToken(t) { authToken = t || null; }
  function setCsrf(t) { csrfToken = t || null; }

  // Имитируем задержку сети для скелетонов на фолбэке (короткую).
  function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // Нормализуем реальный путь бэка в плоский ключ mock-слоя. Реальные маршруты
  // несут /api и идентификаторы ресурса — мок хранит форму по доменному ключу.
  function mockKey(method, path) {
    const m = (method || 'GET').toUpperCase();
    let p = path.split('?')[0].replace(/^\/api/, '');
    // client_id / id в путях схлопываем до доменного ключа.
    if (/^\/clients\/me$/.test(p)) p = '/me';
    else if (/^\/clients\/me\/children$/.test(p)) p = '/children';
    else if (/^\/clients\/[^/]+\/dashboard$/.test(p)) p = '/me/student';
    else if (/^\/clients\/[^/]+\/reports$/.test(p)) p = '/parent/reports';
    else if (/^\/clients\/[^/]+\/risks$/.test(p)) p = '/parent/risks';
    else if (/^\/diagnostics\/clients\/[^/]+$/.test(p)) p = '/diagnostics';
    else if (/^\/roadmap\/clients\/[^/]+\/milestones$/.test(p)) p = '/roadmap';
    else if (/^\/roadmap\/clients\/[^/]+$/.test(p)) p = '/roadmap';
    else if (/^\/documents\/clients\/[^/]+$/.test(p)) p = '/documents';
    else if (/^\/payments\/clients\/[^/]+$/.test(p)) p = '/payments';
    else if (/^\/partners\/me\/clients$/.test(p)) p = '/crm/clients';
    else if (/^\/partners\/me$/.test(p)) p = '/me';
    else if (/^\/assessment\/[^/]+$/.test(p)) p = '/diagnostics';
    else if (/^\/anketa\/sessions\/[^/]+$/.test(p)) p = '/diagnostics';
    else if (/^\/learning\/lessons\/[^/]+$/.test(p)) p = '/learning/lesson';
    else if (/^\/learning\/lessons$/.test(p)) p = '/learning/lessons';
    else if (/^\/learning\/progress\/[^/]+$/.test(p)) p = '/learning/progress';
    else if (/^\/crm\/deals\/board$/.test(p)) p = '/crm/funnel';
    else if (/^\/crm\/clients\/[^/]+$/.test(p)) p = '/crm/clients';
    else if (/^\/bot\/conversations\/[^/]+$/.test(p)) p = '/ai/thread';
    else if (/^\/kb\/universities/.test(p)) p = '/universities';
    return m + ' ' + p;
  }

  function mockFor(method, path) {
    if (!window.EMock) return null;
    // Сначала пробуем прямой ключ (экраны/легаси-вызовы по плоским путям),
    // затем — нормализованный из реального маршрута бэка.
    const direct = window.EMock.get((method || 'GET').toUpperCase() + ' ' + path.split('?')[0]);
    if (direct !== null && typeof direct !== 'undefined') return direct;
    return window.EMock.get(mockKey(method, path));
  }

  async function request(method, path, body) {
    method = (method || 'GET').toUpperCase();

    // Нет базы бэка вовсе — сразу мок (статика / file://).
    if (!BASE) {
      await delay(220);
      const data = mockFor(method, path);
      return { ok: true, data, mocked: true };
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = 'Bearer ' + authToken;
      // CSRF на мутации (бэк сверяет с cookie es_csrf, SECURITY-RULES §2.4).
      if (csrfToken && method !== 'GET') headers['X-CSRF-Token'] = csrfToken;

      const res = await fetch(BASE + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        // cookie сессии (refresh httpOnly + es_csrf) нужны для авторизованных вызовов.
        credentials: 'include',
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json().catch(() => null);
      return { ok: true, data, mocked: false };
    } catch (err) {
      // Бэк недоступен/упал — мягкий фолбэк на мок. Фронт не падает.
      if (window.console) console.warn('[EApi] fallback на mock:', method, path, '—', err.message);
      await delay(180);
      const data = mockFor(method, path);
      return { ok: true, data, mocked: true, error: err.message };
    }
  }

  // ── AI-ассистент: живой вопрос в базу знаний бота (POST /kb/ask) ─────────
  // Отдельный путь мимо request()/BASE: бот — другой сервис, без наших cookie и
  // CSRF, ответ приходит 15-30с. Возвращаем нормализованный результат, наверху
  // сам решает — показать answer или мягкий фолбэк. Никогда не бросаем.
  async function kbAsk(text, opts) {
    opts = opts || {};
    const q = String(text || '').trim().slice(0, 2000);
    if (!q) return { ok: false, answer: '', answered: false, error: 'empty' };
    const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    const to = setTimeout(() => { if (ctrl) ctrl.abort(); }, opts.timeout || 90000);
    try {
      const res = await fetch(BOT_BASE + '/kb/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: q, user_id: (opts.userId != null ? opts.userId : null) }),
        signal: ctrl ? ctrl.signal : undefined,
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json().catch(() => null);
      return {
        ok: true,
        answer: (data && typeof data.answer === 'string') ? data.answer : '',
        answered: !!(data && data.answered),
        hits: (data && Array.isArray(data.hits)) ? data.hits : [],
      };
    } catch (err) {
      if (window.console) console.warn('[EApi] kbAsk fail:', err && err.message);
      return { ok: false, answer: '', answered: false, error: (err && err.message) || 'network' };
    } finally {
      clearTimeout(to);
    }
  }

  // Удобные шорткаты по доменам — экраны зовут их, не сырые пути.
  // Пути выровнены под реальные маршруты бэка (docs/API.md). Где нужен client_id —
  // принимаем его аргументом; для демо/каркаса можно звать без id (фолбэк на мок).
  const Api = {
    base: BASE,
    setToken,
    setCsrf,
    request,
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    patch: (path, body) => request('PATCH', path, body),
    del: (path) => request('DELETE', path),

    // ── auth (API.md §1) ──────────────────────────────────────────────────
    register: (body) => request('POST', '/api/auth/register', body),
    login: (body) => request('POST', '/api/auth/login', body),
    oauth: (provider, body) => request('POST', '/api/auth/oauth/' + provider, body),
    refresh: (body) => request('POST', '/api/auth/refresh', body || {}),
    logout: () => request('POST', '/api/auth/logout', {}),
    me: () => request('GET', '/api/auth/me'),

    // ── leads / anketa (API.md §2) ────────────────────────────────────────
    touch: (body) => request('POST', '/api/leads/touch', body),
    anketaCreate: () => request('POST', '/api/anketa/sessions', {}),
    anketaAnswers: (sessionId, body) => request('POST', '/api/anketa/sessions/' + sessionId + '/answers', body),
    anketaSubmit: (body) => request('POST', '/api/anketa/submit', body),
    anketaSession: (sessionId) => request('GET', '/api/anketa/sessions/' + sessionId),

    // ── ai-assessment (API.md §3) ─────────────────────────────────────────
    assessment: (sessionId) => request('GET', '/api/assessment/' + sessionId),
    assessmentRetry: (sessionId) => request('POST', '/api/assessment/' + sessionId + '/retry', {}),

    // ── diagnostics (API.md §4) ───────────────────────────────────────────
    // Заключение 11 пунктов по client_id. Без id — фолбэк на мок (каркас/демо).
    diagnostics: (clientId) => request('GET', '/api/diagnostics/clients/' + (clientId || 'me')),
    languageTestDemo: () => request('GET', '/api/diagnostics/demo/language-test'),

    // ── roadmap (API.md §5) ───────────────────────────────────────────────
    roadmap: (clientId) => request('GET', '/api/roadmap/clients/' + (clientId || 'me')),
    milestones: (clientId) => request('GET', '/api/roadmap/clients/' + (clientId || 'me') + '/milestones'),
    patchStage: (stageId, body) => request('PATCH', '/api/roadmap/stages/' + stageId, body),

    // ── clients: кабинеты (API.md §6) ─────────────────────────────────────
    myCard: () => request('GET', '/api/clients/me'),
    children: () => request('GET', '/api/clients/me/children'),
    dashboard: (clientId) => request('GET', '/api/clients/' + (clientId || 'me') + '/dashboard'),
    parentReports: (clientId) => request('GET', '/api/clients/' + (clientId || 'me') + '/reports'),
    parentRisks: (clientId) => request('GET', '/api/clients/' + (clientId || 'me') + '/risks'),

    // ── кабинетные шорткаты (эталоны родителя/ученика) ────────────────────
    // Резолвятся в существующие mock-ключи (см. mockKey/EMock). На проде — направить
    // на боевые эндпоинты, когда появятся; до тех пор graceful-fallback на мок.
    student: () => request('GET', '/api/clients/me/dashboard'),     // -> /me/student
    today: () => request('GET', '/today'),
    billing: (clientId) => request('GET', '/billing'),
    parentOffers: (clientId) => request('GET', '/parent/offers'),
    curator: (clientId) => request('GET', '/curator'),
    aiThread: () => request('GET', '/api/bot/conversations/me'),    // -> /ai/thread

    // ── documents (API.md §7) ─────────────────────────────────────────────
    documents: (clientId) => request('GET', '/api/documents/clients/' + (clientId || 'me')),
    docVersions: (docId) => request('GET', '/api/documents/' + docId + '/versions'),
    patchDocument: (docId, body) => request('PATCH', '/api/documents/' + docId, body),

    // ── payments (API.md §8) ──────────────────────────────────────────────
    createPayment: (body) => request('POST', '/api/payments', body),
    payments: (clientId) => request('GET', '/api/payments/clients/' + (clientId || 'me')),
    paymentStatus: (paymentId) => request('GET', '/api/payments/' + paymentId),
    refunds: (paymentId) => request('GET', '/api/payments/' + paymentId + '/refunds'),

    // ── partners (API.md §9) ──────────────────────────────────────────────
    partnerMe: () => request('GET', '/api/partners/me'),
    partnerClients: () => request('GET', '/api/partners/me/clients'),
    partnerStats: () => request('GET', '/api/partners/me/stats'),
    partnerPayouts: () => request('GET', '/api/partners/me/payouts'),

    // ── products (каталог услуг) ──────────────────────────────────────────
    products: (category) => request('GET', '/api/products' + (category ? '?category=' + encodeURIComponent(category) : '')),
    product: (id) => request('GET', '/api/products/' + id),

    // ── crm (3 экрана: таблица, карточка, воронка) ────────────────────────
    crmClients: () => request('GET', '/api/crm/clients'),
    crmClient: (id) => request('GET', '/api/crm/clients/' + id),
    crmFunnel: () => request('GET', '/api/crm/deals/board'),

    // ── learning (3 экрана: расписание, урок, прогресс) ───────────────────
    schedule: () => request('GET', '/api/learning/schedule'),
    lesson: (id) => request('GET', '/api/learning/lessons/' + (id || 'demo')),
    learningProgress: (clientId) => request('GET', '/api/learning/progress/' + (clientId || 'me')),

    // ── learning: уроки как ресурс (конструктор + библиотека) ──────────────
    // Контракт — docs/lessons-api.md. Клиент-репозиторий window.ELessonStore
    // ходит сюда, когда задан ES_API_BASE; иначе живёт на локальной таблице.
    lessonsList: () => request('GET', '/api/learning/lessons'),
    lessonGet: (id) => request('GET', '/api/learning/lessons/' + id),
    lessonCreate: (body) => request('POST', '/api/learning/lessons', body),
    lessonUpdate: (id, body) => request('PUT', '/api/learning/lessons/' + id, body),
    lessonDelete: (id) => request('DELETE', '/api/learning/lessons/' + id),

    // ── bot / ассистент (API.md §10) ──────────────────────────────────────
    botThread: (clientId) => request('GET', '/api/bot/conversations/' + (clientId || 'me')),
    botSend: (body) => request('POST', '/api/bot/messages', body),
    // AI-ассистент в кабинете: вопрос в базу знаний бота (same-origin /kb/ask).
    kbAsk: (text, opts) => kbAsk(text, opts),

    // ── knowledge base (вузы/гранты) ──────────────────────────────────────
    universities: (q) => request('GET', '/api/kb/universities' + (q ? '?' + q : '')),
    grants: () => request('GET', '/api/kb/grants'),
  };

  window.EApi = Api;

  // Подхватить CSRF из cookie es_csrf (бэк кладет его не-httpOnly специально для фронта).
  try {
    const m = document.cookie.match(/(?:^|;\s*)es_csrf=([^;]+)/);
    if (m) csrfToken = decodeURIComponent(m[1]);
  } catch (e) { /* file:// без cookie — не страшно, мок */ }
})();
