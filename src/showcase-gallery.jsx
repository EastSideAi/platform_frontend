/* ============================================================================
   EastSide — Витрина компонентов (галерея). Загружается через ELoad последней.
   Рендерит каждый компонент во всех состояниях, обе темы. Только для QA дизайна.
   ============================================================================ */
(function () {
  'use strict';
  const { useState } = React;
  const h = React.createElement;
  const U = window.EUI, Ic = window.EIcons, M = window.EMock;
  const { ThemeProvider, ThemeToggle } = window.ETheme;

  function Section(props) {
    return h('section', { className: 'sc-section', id: props.id },
      h('h2', { className: 'sc-section__title' }, props.title),
      props.note ? h('p', { className: 'sc-section__note' }, props.note) : null,
      props.children);
  }
  function Row(props) { return h('div', { className: 'sc-row' }, props.children); }
  function Label(props) { return h('div', { className: 'sc-label' }, props.children); }

  function Showcase() {
    const [modal, setModal] = useState(false);
    const [drawer, setDrawer] = useState(false);
    const [sw1, setSw1] = useState(true);
    const [sw2, setSw2] = useState(false);
    const [seg, setSeg] = useState('match');
    const [tab, setTab] = useState('a');
    const [sel, setSel] = useState('');
    const [page, setPage] = useState(3);
    const [val, setVal] = useState('');

    const uniRows = M.universities;
    const uniCols = [
      { key: 'name', title: 'Вуз', render: (r) => h('span', null, r.name, h('span', { className: 'u-ink-mute', style: { marginLeft: 6 } }, r.cn)) },
      { key: 'city', title: 'Город' },
      { key: 'category', title: 'Категория', render: (r) => h(U.Pill, { tone: r.category === 'reach' ? 'warning' : r.category === 'match' ? 'info' : 'success' }, r.category) },
      { key: 'chancePct', title: 'Шанс', num: true, render: (r) => h('span', { className: 'u-critical' }, r.chancePct + '%') },
      { key: 'grant', title: 'Грант' },
    ];

    return h('div', { className: 'u-container u-container--wide', style: { paddingBottom: 'var(--sp-20)' } },
      h('div', { className: 'sc-topbar', style: { marginInline: 'calc(-1 * var(--sp-4))' } },
        h('div', { className: 'u-flex u-items-center u-gap-2' },
          h('span', { className: 'e-rail__brand-mark' }, 'E'),
          h('div', null,
            h('div', { className: 'e-rail__brand-name' }, 'Витрина компонентов'),
            h('div', { className: 'u-ink-mute', style: { fontSize: 'var(--fs-xs)' } }, 'EastSide AI · обе темы, все состояния'))),
        h('div', { className: 'u-flex u-items-center u-gap-3' },
          h('a', { href: 'index.html', className: 'e-btn e-btn--ghost e-btn--sm' }, h('span', null, 'К каркасу')),
          h(ThemeToggle, { variant: 'segmented' }))),

      h(Section, { title: 'Палитра', note: 'Семантические токены. Меняются значениями в обеих темах — компоненты не трогаем.' },
        h('div', { className: 'sc-grid sc-grid--3' },
          ['--bg', '--surface', '--surface-2', '--surface-sunken', '--accent', '--jade', '--success', '--warning', '--danger', '--info', '--ochre', '--terra'].map((t) =>
            h('div', { key: t, className: 'sc-swatch', style: { background: 'var(' + t + ')', color: t === '--accent' ? 'var(--on-accent)' : 'var(--ink)' } }, t)))),

      h(Section, { title: 'Типографика', note: 'Onest — заголовки и числа, Manrope — текст. Критичные числа — контрастный charcoal, не jade.' },
        h('div', { className: 'u-stack-3' },
          h('div', { className: 'u-kicker' }, 'Eyebrow / kicker'),
          h('h1', null, 'Заголовок экрана h1'),
          h('h2', null, 'Раздел h2'),
          h('h3', null, 'Подзаголовок h3'),
          h('h4', null, 'Заголовок карточки h4'),
          h('p', { className: 'u-lead' }, 'Лид-абзац под заголовком — спокойный, ограниченная мера строки.'),
          h('p', { className: 'u-prose u-soft' }, 'Длинная читаемая проза на Manrope с повышенным межстрочным. Сдержанность и воздух — это и есть наш премиум.'),
          h('div', { className: 'u-flex u-gap-6 u-wrap u-items-baseline' },
            h('span', { className: 'u-critical', style: { fontSize: 'var(--fs-4xl)', fontFamily: 'var(--font-display)' } }, '74%'),
            h('span', { className: 'u-critical-pos u-fw-semibold' }, '+6 за месяц'),
            h('span', { className: 'u-critical-neg u-fw-semibold' }, '-2 дня до дедлайна')))),

      h(Section, { title: 'Button', note: 'primary / secondary / ghost / danger / jade · sm/md/lg · состояния hover/active/focus/disabled/loading.' },
        h(Label, null, 'Варианты'),
        h(Row, null,
          h(U.Button, { variant: 'primary' }, 'Основное'),
          h(U.Button, { variant: 'secondary' }, 'Вторичное'),
          h(U.Button, { variant: 'ghost' }, 'Призрак'),
          h(U.Button, { variant: 'jade' }, 'Jade-действие'),
          h(U.Button, { variant: 'danger' }, 'Удалить'),
          h(U.Button, { variant: 'danger', solid: true }, 'Удалить (solid)')),
        h(Label, null, 'Размеры и иконки'),
        h(Row, null,
          h(U.Button, { size: 'sm' }, 'Small'),
          h(U.Button, { size: 'md', iconLeft: Ic.Plus }, 'Medium'),
          h(U.Button, { size: 'lg', iconRight: Ic.ArrowRight }, 'Large'),
          h(U.Button, { pill: true, iconLeft: Ic.Telegram }, 'Pill')),
        h(Label, null, 'Состояния'),
        h(Row, null,
          h(U.Button, { disabled: true }, 'Disabled'),
          h(U.Button, { loading: true }, 'Загрузка'),
          h(U.Button, { variant: 'secondary', loading: true }, 'Загрузка'),
          h(U.IconButton, { icon: Ic.More, label: 'Еще' }),
          h(U.IconButton, { icon: Ic.Bell, label: 'Уведомления', solid: true }),
          h(U.IconButton, { icon: Ic.Trash, label: 'Удалить', size: 'sm' }))),

      h(Section, { title: 'Поля и формы', note: 'FormField (label + hint/error) · Input · Textarea · Select · Switch · SegmentedControl.' },
        h('div', { className: 'sc-grid sc-grid--2' },
          h(U.FormField, { label: 'Имя ученика', hint: 'Как в загранпаспорте' },
            h(U.Input, { placeholder: 'Дима Соколов', value: val, onChange: (e) => setVal(e.target.value) })),
          h(U.FormField, { label: 'Поиск', hint: 'С иконкой слева' },
            h(U.Input, { placeholder: 'Найти вуз...', iconLeft: Ic.Search })),
          h(U.FormField, { label: 'Email', required: true, error: 'Проверь адрес — кажется, опечатка' },
            h(U.Input, { type: 'email', placeholder: 'mail@example.ru', error: true, defaultValue: 'mail@' })),
          h(U.FormField, { label: 'Заблокировано' },
            h(U.Input, { placeholder: 'Недоступно', disabled: true })),
          h(U.FormField, { label: 'Направление', hint: 'Кастомный дропдаун' },
            h(U.Select, { value: sel, onChange: setSel, placeholder: 'Выбери направление', options: [
              { value: 'cs', label: 'Компьютерные науки' }, { value: 'econ', label: 'Экономика' },
              { value: 'med', label: 'Медицина' }, { value: 'design', label: 'Дизайн' }] })),
          h(U.FormField, { label: 'Комментарий куратору', hint: 'До 500 символов' },
            h(U.Textarea, { placeholder: 'Напиши, что важно учесть...' }))),
        h(Label, null, 'Switch и SegmentedControl'),
        h(Row, null,
          h(U.Switch, { checked: sw1, onChange: setSw1, label: 'Уведомления в Telegram' }),
          h(U.Switch, { checked: sw2, onChange: setSw2, jade: true, label: 'Скрыть оценки от родителя' }),
          h(U.Switch, { checked: false, disabled: true, label: 'Заблокировано' })),
        h(Row, null,
          h(U.SegmentedControl, { value: seg, onChange: setSeg, ariaLabel: 'Категория вуза', options: [
            { value: 'reach', label: 'Reach' }, { value: 'match', label: 'Match' }, { value: 'safety', label: 'Safety' }] }))),

      h(Section, { title: 'FileUpload / Dropzone', note: 'Зона загрузки + чипы файлов со статусом и прогрессом.' },
        h('div', { className: 'sc-grid sc-grid--2' },
          h(U.FileUpload, { files: [
            { name: 'Аттестат_перевод.pdf', size: '2.4 МБ' },
            { name: 'HSK4_сертификат.jpg', size: '0.8 МБ', progress: 62 }],
            onRemove: () => {} }),
          h(U.FileUpload, { error: 'Файл больше 10 МБ — выбери поменьше', files: [] }))),

      h(Section, { title: 'Card и Stat', note: 'Обычная, вложенная, кликабельная, hero-карточка. Метрики — критичные числа контрастным ink.' },
        h('div', { className: 'sc-grid sc-grid--2' },
          h(U.Card, { title: 'Обычная карточка', action: h(U.Badge, { tone: 'jade' }, 'Новое') },
            h('p', { className: 'u-prose u-soft' }, 'Контейнер контента на поверхности с мягкой теплой тенью.')),
          h(U.Card, { variant: 'hero' },
            h('div', { className: 'u-kicker', style: { color: 'var(--jade-bright)' } }, 'Статус спокойствия'),
            h('h3', { style: { marginTop: 'var(--sp-2)' } }, 'Дима идет по плану'),
            h('p', { style: { color: 'var(--on-accent)', opacity: .82, marginTop: 'var(--sp-2)' } }, 'Сейчас — документы. Ближайший дедлайн через 14 дней.'))),
        h('div', { className: 'u-cols-4', style: { marginTop: 'var(--sp-4)' } },
          h(U.Stat, { label: 'Шанс на поступление', value: '74', unit: '%', bordered: true, tone: 'jade', delta: '+6 за месяц' }),
          h(U.Stat, { label: 'Платеж в июне', value: '24 000', unit: '₽', bordered: true }),
          h(U.Stat, { label: 'Осталось занятий', value: '18', bordered: true, delta: '−2 за неделю', deltaTone: 'neg' }),
          h(U.Stat, { label: 'До дедлайна', value: '14', unit: 'дн', bordered: true })),
        h(Label, null, 'Кликабельная карточка'),
        h('div', { className: 'sc-grid sc-grid--3' },
          M.universities.slice(0, 3).map((u) =>
            h(U.Card, { key: u.id, clickable: true, variant: 'pad-sm' },
              h('div', { className: 'u-flex u-justify-between u-items-start u-gap-2' },
                h('div', null, h('div', { className: 'u-fw-semibold' }, u.name), h('div', { className: 'u-ink-mute', style: { fontSize: 'var(--fs-xs)' } }, u.cn + ' · ' + u.city)),
                h(U.Badge, { tone: u.category === 'reach' ? 'warning' : u.category === 'match' ? 'info' : 'success' }, u.category)),
              h('div', { className: 'u-mt-4' }, h(U.ProgressBar, { value: u.chancePct, tone: 'jade', showPct: true, label: 'Шанс' })))))),

      h(Section, { title: 'Table', note: 'Sticky-заголовок, зебра, hover, числовые колонки справа, горизонтальный скролл на узком.' },
        h(U.Table, { columns: uniCols, rows: uniRows, rowKey: 'id' })),

      h(Section, { title: 'Tabs', note: 'Подчеркивание для активной вкладки.' },
        h(U.Tabs, { active: tab, onChange: setTab, tabs: [
          { key: 'a', label: 'Дорожная карта' }, { key: 'b', label: 'Документы' }, { key: 'c', label: 'Оплаты' }] }),
        h('div', { style: { paddingTop: 'var(--sp-4)' }, className: 'u-ink-soft' },
          tab === 'a' ? 'Контент: дорожная карта' : tab === 'b' ? 'Контент: документы' : 'Контент: оплаты')),

      h(Section, { title: 'Прогресс и вехи', note: 'ProgressBar (нейтральный/jade), кольцевой, Milestones (главный объект продукта), горизонтальный stepper.' },
        h('div', { className: 'sc-grid sc-grid--2' },
          h('div', { className: 'u-stack-4' },
            h(U.ProgressBar, { value: 62, label: 'Прогресс поступления', showPct: true }),
            h(U.ProgressBar, { value: 68, tone: 'jade', label: 'Язык: HSK 4 → HSK 5', showPct: true }),
            h(U.ProgressBar, { value: 40, size: 'sm', label: 'Документы', showPct: true }),
            h('div', { className: 'u-flex u-gap-6 u-items-center' },
              h(U.RingProgress, { value: 74 }),
              h(U.RingProgress, { value: 45, size: 72 }))),
          h('div', null,
            h(Label, null, 'Stepper (анкета)'),
            h(U.HStepper, { steps: 6, current: 2 }))),
        h('div', { className: 'u-mt-8' },
          h(U.Card, null,
            h('h4', { style: { marginBottom: 'var(--sp-5)' } }, 'Дорожная карта'),
            h(U.Milestones, { items: M.roadmap })))),

      h(Section, { title: 'Alert и Toast', note: 'Тоны success/warning/danger/info. В продукте доверия — спокойно, без агрессии.' },
        h('div', { className: 'u-stack-3' },
          h(U.Alert, { tone: 'success', title: 'Документ принят' }, 'Сертификат HSK 4 проверен и принят куратором.'),
          h(U.Alert, { tone: 'warning', title: 'Нужна правка' }, 'Медицинская справка — нужна форма международного образца.'),
          h(U.Alert, { tone: 'info', title: 'Куратор работает над темой' }, 'Подтягиваем грамматику к HSK 5 — все под контролем.'),
          h(U.Alert, { tone: 'danger', title: 'Дедлайн близко', action: h(U.Button, { size: 'sm', variant: 'secondary' }, 'Открыть') }, 'Подача на грант CSC — осталось 3 дня.')),
        h(Row, null,
          h(U.Button, { variant: 'secondary', onClick: () => window.EToast.push({ tone: 'success', title: 'Сохранено', text: 'Изменения применены.' }) }, 'Toast success'),
          h(U.Button, { variant: 'secondary', onClick: () => window.EToast.push({ tone: 'warning', title: 'Внимание', text: 'Проверь данные перед отправкой.' }) }, 'Toast warning'),
          h(U.Button, { variant: 'secondary', onClick: () => window.EToast.push({ tone: 'info', title: 'Напоминание', text: 'Встреча с куратором в 16:00.' }) }, 'Toast info'),
          h(U.Button, { variant: 'secondary', onClick: () => window.EToast.push({ tone: 'danger', title: 'Не удалось', text: 'Файл не загрузился, попробуй еще раз.' }) }, 'Toast danger'))),

      h(Section, { title: 'Badge, Pill, Tag', note: 'Мелкие метки и статусы. Не кричат.' },
        h(Label, null, 'Badge'),
        h(Row, null,
          h(U.Badge, null, 'Нейтральный'),
          h(U.Badge, { tone: 'jade', icon: Ic.Star }, 'Сильный кандидат'),
          h(U.Badge, { tone: 'success' }, 'Принят'),
          h(U.Badge, { tone: 'warning' }, 'На проверке'),
          h(U.Badge, { tone: 'danger' }, 'Правка'),
          h(U.Badge, { tone: 'info' }, 'Info'),
          h(U.Badge, { solid: true }, 'Solid'),
          h(U.Badge, { num: true, tone: 'jade' }, '3')),
        h(Label, null, 'Status-pill'),
        h(Row, null,
          h(U.Pill, { tone: 'success' }, 'Идет по плану'),
          h(U.Pill, { tone: 'warning' }, 'Нужно внимание'),
          h(U.Pill, { tone: 'danger' }, 'Риск'),
          h(U.Pill, { tone: 'info' }, 'Куратор'),
          h(U.Pill, { tone: 'neutral' }, 'Черновик'))),

      h(Section, { title: 'Avatar', note: 'Размеры, инициалы, фото, статус онлайн, группа кураторов.' },
        h(Row, null,
          h(U.Avatar, { name: 'Дима Соколов', size: 'sm' }),
          h(U.Avatar, { name: 'Марина Соколова', size: 'md', status: true }),
          h(U.Avatar, { name: 'Елена Жукова', size: 'lg' }),
          h(U.AvatarGroup, { items: [{ name: 'Елена Жукова' }, { name: 'Ли Вэй' }, { name: 'Анна Реут' }] }))),

      h(Section, { title: 'Tooltip, Breadcrumbs, Pagination' },
        h(Row, null,
          h(U.Tooltip, { label: 'Шанс на поступление по match-вузам' },
            h(U.Badge, { tone: 'info', icon: Ic.Info }, 'Наведи на меня')),
          h(U.Breadcrumbs, { items: [{ label: 'CRM', to: '/' }, { label: 'Клиенты', to: '/' }, { label: 'Дима Соколов' }] })),
        h(Row, null,
          h(U.Pagination, { page: page, pages: 12, onChange: setPage }))),

      h(Section, { title: 'EmptyState и Skeleton', note: 'Дружелюбная пустота и каркас загрузки вместо спиннера.' },
        h('div', { className: 'sc-grid sc-grid--2' },
          h(U.Card, { variant: 'flat' },
            h(U.EmptyState, { icon: Ic.Doc, title: 'Документов пока нет', text: 'Начни с загрузки аттестата — дальше подскажем по шагам.', action: h(U.Button, null, 'Загрузить документ') })),
          h(U.Card, null,
            h('div', { className: 'u-flex u-gap-3 u-items-center', style: { marginBottom: 'var(--sp-4)' } },
              h(U.Skeleton, { variant: 'circle', width: 40, height: 40 }),
              h('div', { className: 'u-grow' }, h(U.Skeleton, { variant: 'title' }), h(U.Skeleton, { variant: 'line', width: '40%' }))),
            h(U.Skeleton, { variant: 'text', lines: 3 }),
            h('div', { className: 'u-mt-4' }, h(U.Skeleton, { variant: 'card' }))))),

      h(Section, { title: 'Modal и Drawer', note: 'Фокус-ловушка, Esc, клик по оверлею. На мобильном modal — bottom-sheet.' },
        h(Row, null,
          h(U.Button, { variant: 'secondary', onClick: () => setModal(true) }, 'Открыть Modal'),
          h(U.Button, { variant: 'secondary', onClick: () => setDrawer(true) }, 'Открыть Drawer')),
        h(U.Modal, { open: modal, onClose: () => setModal(false), title: 'Подтвердить отправку',
          footer: [h(U.Button, { key: 'c', variant: 'ghost', onClick: () => setModal(false) }, 'Отмена'),
                   h(U.Button, { key: 'o', onClick: () => setModal(false) }, 'Отправить на проверку')] },
          h('p', { className: 'u-prose u-soft' }, 'Мотивационное письмо уйдет куратору на проверку. Куратор вернет с правками, если что-то стоит усилить.')),
        h(U.Drawer, { open: drawer, onClose: () => setDrawer(false), side: 'left', title: 'Меню' },
          h('div', { className: 'u-stack-2' },
            h(U.NavItem, { icon: Ic.Home, label: 'Главное', active: true }),
            h(U.NavItem, { icon: Ic.Route, label: 'Дорожная карта' }),
            h(U.NavItem, { icon: Ic.Doc, label: 'Документы', badge: 2 }),
            h(U.NavItem, { icon: Ic.Wallet, label: 'Оплаты' })))),

      h(Section, { title: 'Sidebar, Topbar, BottomNav', note: 'Десктоп-рейл с секциями и карточкой пользователя; мобильные топбар и нижняя навигация.' },
        h('div', { className: 'sc-grid sc-grid--2' },
          h('div', { style: { border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden', maxWidth: 280 } },
            h(U.Sidebar, { brand: { name: 'EastSide', mark: 'E' },
              user: { name: 'Дима Соколов', role: 'Ученик · 11 класс' },
              sections: [
                { items: [
                  { icon: Ic.Home, label: 'Главное', active: true },
                  { icon: Ic.Route, label: 'Дорожная карта', dot: true },
                  { icon: Ic.Doc, label: 'Документы', badge: 2 }] },
                { label: 'Обучение', items: [
                  { icon: Ic.Calendar, label: 'Расписание' },
                  { icon: Ic.Book, label: 'Уроки' },
                  { icon: Ic.Chat, label: 'AI-ассистент' }] }] })),
          h('div', { className: 'u-stack-4' },
            h('div', { style: { border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden' } },
              h(U.Topbar, { title: 'Документы', onMenu: () => {}, right: h(U.IconButton, { icon: Ic.Bell, label: 'Уведомления' }) })),
            h('div', { style: { border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', overflow: 'hidden' } },
              h(U.BottomNav, { items: [
                { icon: Ic.Home, label: 'Главное', active: true },
                { icon: Ic.Route, label: 'Карта' },
                { icon: Ic.Doc, label: 'Доки' },
                { icon: Ic.Chat, label: 'Чат' }] }))))),

      h(Section, { title: 'Иконки', note: 'Line-набор, inline SVG, наследуют цвет текста (currentColor).' },
        h('div', { className: 'sc-icons-grid' },
          Object.keys(Ic).map((name) =>
            h('div', { key: name, className: 'sc-icon-cell' },
              h(Ic[name], { size: 22 }), h('span', null, name))))),

      h(U.ToastHost, { key: 'toasts' })
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(h(ThemeProvider, null, h(Showcase)));
})();
