/* ============================================================================
   EastSide — Оркестратор каркаса (точка сборки)
   ----------------------------------------------------------------------------
   Подключает провайдер темы, тосты и хеш-роутер, регистрирует маршруты.

   Клиентский контур Продукта 1 (dark-rebuild): дашборд ученика, кабинет
   родителя, документы, оплаты, диагностика, обучение-связка, ассистент, вход.
   Каждый клиентский экран сам несет трёхслойку (AppShell: рейл → плашка →
   панель-спутник) и свою навигацию, поэтому рендерятся «в полный экран» —
   без демо-шапки. Лендинг остается в коде, но убран из дефолтного маршрута:
   точка входа после логина — роль-роутер Home (#/home), на него ведет «/».

   Экраны регистрируются в window.EScreens (см. ELoad в index.html) и
   добавляются в таблицу routes ниже. Рендерится в #app. Работает как статика.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = React;
  const { ThemeProvider, ThemeToggle } = window.ETheme;
  const { Routes, Link, useRoute, navigate } = window.ERouter;
  const U = window.EUI, Ic = window.EIcons, S = window.EScreens;

  // Заглушка 404 — дружелюбный EmptyState
  function NotFound(props) {
    return h('div', { className: 'u-container', style: { paddingBlock: 'var(--sp-16)' } },
      h(U.EmptyState, {
        icon: Ic.Compass,
        title: 'Такой страницы пока нет',
        text: 'Маршрут «' + (props.path || '') + '» не подключен.',
        action: h(Link, { to: '/home', className: 'e-btn e-btn--primary' }, h('span', null, 'На главную'))
      }));
  }

  // ── Таблица маршрутов ──────────────────────────────────────────────────
  // Точка входа («/») — роль-роутер Home. Лендинг сохранен на «/landing»,
  // но убран из дефолтной навигации (по брифу: оставить файл, снять с «/»).
  // Все экраны несут свой каркас, поэтому оборачивать их в демо-шапку не нужно.
  //
  // Навигация клиента (UX-PLATFORM §2): ученик — Главная(#/student) · Документы ·
  // Обучение; родитель — Семья(#/parent) · Финансы · Документы. Ассистент — НЕ
  // пункт нав и НЕ страница в первичной навигации: он глобальный FAB + попап
  // (см. GlobalAssistant ниже + собственные FAB у дашбордов). Лендинг и CRM сняты
  // с клиентской навигации (файлы и маршруты сохранены, но из навов исключены).
  const routes = {
    // вход и развилка
    '/': S.Home,                              // роль-роутер (ученик / родитель)
    '/home': S.Home,
    '/auth': S.Auth,                          // вход / регистрация / сброс пароля

    // клиентский контур
    '/student': S.CabinetStudent,             // дашборд ученика «что делать сейчас»
    '/plan': S.StudentPlan,                    // этапы: кинематографичная лента
    '/stage': S.StudentStage,                  // детали одного этапа
    '/stage-b': S.StudentStageB,               // детали этапа — вариант B (моя версия, для сравнения)
    '/parent': S.ParentHome,                  // семейный дашборд родителя (parent-home.jsx)
    '/parent/child': S.ParentChild,           // ребёнок глазами родителя (parent-child.jsx)
    '/diagnostics': S.Diagnostics,            // результаты диагностики (просмотр)
    '/documents': S.Documents,                // документы клиентского среза
    '/payments': S.Payments,                  // оплаты/финансы — ТОЛЬКО зона родителя

    // образовательная платформа
    '/learn': S.LearnHome,                    // «Обучение» — пересобранная learn-home.jsx
    '/learn/lessons': S.LearnLessons,         // библиотека уроков преподавателя
    '/learn/lesson': S.LearnLesson,           // урок-тренажёр — текущий урок
    '/learn/lesson/:id': S.LearnLesson,       // урок-тренажёр — конкретный урок по id
    '/learn/build': S.LearnBuilder,           // конструктор — текущий/новый урок
    '/learn/build/:id': S.LearnBuilder,       // конструктор — конкретный урок по id

    // Ассистент — НЕ первичная навигация (он FAB + попап). Маршрут-оболочку
    // оставляем как overlay-точку входа для устаревших ссылок из ещё не
    // пересобранных экранов — чтобы не плодить мёртвых ссылок (NO DEAD BUTTONS).
    // Из навигации ученика/родителя пункт «Ассистент» убран.
    '/assistant': S.Assistant,

    // публичная воронка — сохранена, но не в дефолтной навигации
    '/landing': S.Landing,
    '/anketa': S.Anketa,
    '/result': S.Result,

    // партнер / CRM — вне клиентского фокуса, оставлены маршрутами
    '/partner': S.Partner,
    '/crm': S.CrmClients,
    '/crm/client': S.CrmClient,
    '/crm/funnel': S.CrmFunnel,
  };

  // Экраны, которые уже содержат свой переключатель темы в рейле/шапке.
  // На остальных (клиентские кабинеты) монтируем глобальный плавающий тоггл,
  // чтобы смена темы работала на ВСЕХ экранах без правки самих экранов.
  const ownsThemeToggle = {
    '/auth': true, '/landing': true, '/anketa': true, '/result': true,
    '/partner': true, '/crm': true, '/crm/client': true, '/crm/funnel': true,
    '/student': true, // дашборд ученика несёт свой тоггл (рейл/статус) + FAB ассистента
    '/learn': true,        // хаб обучения несёт каркас ученика (FAB ассистента в Shell)
    '/learn/lessons': true,   // библиотека уроков — своя светлая раскладка
    '/learn/lesson': true, // урок-тренажёр — иммерсивный полноэкранный, свой выход
    '/learn/lesson/:id': true,
    '/learn/build': true,  // конструктор — полноэкранный, своя верхняя панель
    '/learn/build/:id': true,
    '/plan': true,    // этапы — своя тёмная раскладка, без плавающего тоггла
    '/stage': true,   // детали этапа — своя тёмная раскладка
    '/stage-b': true, // вариант B деталей этапа
    '/parent': true,  // дашборд родителя несёт свой тоггл (рейл/статус) + FAB ассистента
    '/parent/child': true, // страница ребёнка — тот же каркас родителя
  };

  // ── Кабинетные маршруты, на которых нужен глобальный FAB ассистента ───────
  // Дашборды ученика/родителя монтируют СВОЙ FAB+попап (контекст этапа), поэтому
  // их тут НЕТ — иначе дубль. Здесь — кабинетные экраны на старой раскладке
  // (документы, обучение, диагностика), у которых своего FAB нет: им даём
  // единый плавающий ассистент, чтобы он был «везде в кабинете» (бриф §3).
  // Страница /assistant — это уже сам чат, FAB на ней не нужен.
  const cabinetNeedsFab = {
    '/documents': true,
    '/diagnostics': true,
  };

  // Плавающий переключатель темы — только там, где экран не дал свой.
  // Стиль — только токены (фикс-позиция, чип-подложка), без правок styles.css.
  function FloatingTheme() {
    const route = useRoute();
    const p = route.path || '';
    // Иммерсивные экраны конструктора/урока адресуются с id (/learn/build/:id) —
    // ownsThemeToggle по точному пути их не поймает, ловим по префиксу.
    if (p.indexOf('/learn/build') === 0 || p.indexOf('/learn/lesson') === 0) return null;
    if (ownsThemeToggle[route.path]) return null;
    return h('div', {
      'aria-label': 'Переключатель темы',
      style: {
        position: 'fixed', right: 'var(--sp-4)', bottom: 'var(--sp-4)',
        zIndex: 'var(--z-sticky)', display: 'inline-flex',
        padding: 'var(--sp-1)', borderRadius: 'var(--r-pill)',
        background: 'var(--surface)', border: '1px solid var(--line)',
      },
    }, h(ThemeToggle, { variant: 'cycle' }));
  }

  // ── Глобальный ассистент (FAB + попап) для кабинетных экранов без своего ──
  // Монтируется один раз в оболочке приложения. Появляется только на кабинетных
  // маршрутах из cabinetNeedsFab (не на входе/лендинге/анкете/CRM и не на самих
  // дашбордах, у которых есть собственный контекстный FAB). Контекст — общий
  // (без конкретной вехи): сиды берём из EMock.assistantSeeds (_default).
  function GlobalAssistant() {
    const route = useRoute();
    const [open, setOpen] = useState(false);
    if (!cabinetNeedsFab[route.path]) return null;
    const Fab = U.AssistantFab, Popup = U.AssistantPopup;
    if (!Fab || !Popup) return null;
    const seeds = (window.EMock && window.EMock.assistantSeeds) || null;
    return h(React.Fragment, null,
      h(Fab, { key: 'fab', onClick: () => setOpen(true) }),
      h(Popup, { key: 'pop', open, onClose: () => setOpen(false), stage: null, seeds })
    );
  }

  function App() {
    return h(ThemeProvider, null,
      h(React.Fragment, null,
        h(Routes, { routes, fallback: NotFound, key: 'routes' }),
        h(GlobalAssistant, { key: 'assist' }),
        h(FloatingTheme, { key: 'theme' }),
        h(U.ToastHost, { key: 'toasts' })
      ));
  }

  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(h(App));
})();
