/* ============================================================================
   EastSide — AI-предварительная оценка (window.EScreens.Result · route #/result)
   ----------------------------------------------------------------------------
   Бесплатная AI-оценка шансов по анкете (модуль 3). Тон — экспертный отбор, не
   массовая продажа: «видим потенциал, для усиления стоит доработать вот это».
   Без давления, без «100%», без таймеров и счетчиков.

   Один вопрос экрана: «насколько я близок и что меня усилит». Структура:
   резюме профиля → уровень шансов (reach/match/safety + % charcoal) → сильные
   стороны → зоны роста (кликабельны → продукт с пробным режимом) → продукты →
   примерная траектория → финансовая картина → CTA (разбор + бот) → мягкая
   регистрация для сохранения прогресса.

   Chromeless: свой минимальный каркас (топбар с темой + центрированная колонка),
   без общего Sidebar. Mobile-first, клиентский экран.

   ЖЕСТКОЕ ПРАВИЛО: только компоненты window.EUI и токены. Этот файл — единственный
   правится в задаче, в styles.css не пишем — поэтому весь экранный layout идет
   ЧЕРЕЗ существующие утилиты styles.css (.u-* / .e-*) и инлайн-стили на var(--*)
   (так же, как это делают эталоны cabinet-*.jsx). Ни одного хардкод-цвета/размера.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const {
    Card, Button, Badge, Pill, Milestones, Alert, Modal, Skeleton,
  } = U;

  const rub = (n) => (n == null ? '' : Number(n).toLocaleString('ru-RU') + ' ₽');

  // Короткие алиасы инлайн-стилей на токенах (чтобы не дублировать var(--*)) ----
  const S = {
    wrap: { flex: '1 1 auto', width: '100%', maxWidth: '640px', marginInline: 'auto', padding: 'var(--sp-6) var(--sp-4) var(--sp-16)' },
    lineTitle: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-base)', color: 'var(--ink)', letterSpacing: 'var(--tracking-snug)', display: 'block' },
    sub: { fontSize: 'var(--fs-sm)', color: 'var(--ink-soft)', lineHeight: 'var(--lh-normal)' },
    label2xs: { fontSize: 'var(--fs-2xs)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wide)', color: 'var(--ink-mute)', fontWeight: 'var(--fw-semibold)' },
    markRound: { flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: 'var(--r-pill)', marginTop: '2px' },
    sunkenCell: { display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)', padding: 'var(--sp-4)', background: 'var(--surface-sunken)', borderRadius: 'var(--r-md)' },
  };

  // --- Локальный mock (только этот файл; общий mock.jsx подключит другой агент) -
  const MOCK = {
    profile: {
      name: 'Дима',
      summary:
        'Девятиклассник из Казани, метит на инженерные программы в Китае. База крепкая: ' +
        'математика и физика на хорошем уровне, есть запал учить язык. Главный пробел — ' +
        'китайский с нуля и пока нет сертификатов. Это решаемо за полтора года при ровной подготовке.',
      grade: '9 класс',
      direction: 'Инженерия и IT',
      city: 'Казань',
    },
    chance: {
      headline: 'Сильная база, нужен язык',
      note:
        'Оцениваем честно по категориям вузов. Это предварительный расклад по анкете — ' +
        'на разборе с куратором он станет точнее.',
      tiers: [
        { key: 'reach', label: 'Топ-10', pct: 38, hint: 'Амбициозная цель — реальна при сильном HSK и проектах.' },
        { key: 'match', label: 'Топ-30', pct: 64, hint: 'Твой коридор: сюда реально пройти при ровной подготовке.' },
        { key: 'safety', label: 'Топ-100', pct: 86, hint: 'Надежный запасной вариант с грантом.' },
      ],
    },
    strengths: [
      { id: 's1', title: 'Сильная математика и физика', body: 'Профильные предметы — твой фундамент под инженерные программы.' },
      { id: 's2', title: 'Ранний старт', body: '9 класс — времени на язык и документы достаточно, без спешки.' },
      { id: 's3', title: 'Четкое направление', body: 'Понимаешь, куда хочешь — это ускоряет подбор вузов и стратегию.' },
    ],
    growth: [
      {
        id: 'g1', title: 'Китайский с нуля',
        body: 'Языка пока нет — это главный рычаг. До HSK 4 реально дойти за 12-14 месяцев.',
        product: { name: 'Языковая платформа EastSide', trial: 'Демо-доступ и тест уровня — бесплатно',
          body: 'Подберем темп под твой класс и цель. Сначала бесплатный тест уровня и пробные уроки — посмотришь, как устроено, без оплаты.' },
      },
      {
        id: 'g2', title: 'Нет сертификатов',
        body: 'Для подачи нужен подтвержденный уровень языка. Спланируем подготовку к HSK.',
        product: { name: 'Подготовка к HSK', trial: 'Пробное занятие — бесплатно',
          body: 'Поставим реальный срок до нужного балла и проведем через экзамен. Первое занятие — пробное, чтобы понять формат.' },
      },
      {
        id: 'g3', title: 'Тонкое портфолио',
        body: 'Олимпиады и проекты усилят заявку в сильные вузы. Есть из чего собрать.',
        product: { name: 'Проектная подготовка', trial: 'Разбор портфолио — бесплатно',
          body: 'Поможем собрать проекты и достижения под выбранное направление. Начнем с бесплатного разбора того, что уже есть.' },
      },
    ],
    products: [
      { id: 'p1', name: 'Сопровождение поступления', tag: 'Флагман', body: 'Ведем от диагностики до выезда: язык, документы, подача, виза.' },
      { id: 'p2', name: 'Языковая платформа', tag: 'Под задачу', body: 'Системный китайский с куратором и понятным прогрессом.' },
      { id: 'p3', name: 'Подготовка к HSK', tag: 'Под задачу', body: 'Прицельная подготовка к сертификату с реальным сроком.' },
    ],
    trajectory: [
      { id: 't1', period: 'Сейчас', title: 'Точка А', status: 'done', summary: 'Сильная база по профильным, язык с нуля, направление выбрано.' },
      { id: 't2', period: '0-12 мес', title: 'Язык и сертификат', status: 'current', summary: 'Китайский до HSK 4, параллельно — сбор документов.', owner: 'Куратор языка' },
      { id: 't3', period: '12-16 мес', title: 'Подача и гранты', status: 'upcoming', summary: 'Заявки в вузы коридора, оформление на грант.' },
      { id: 't4', period: '16-18 мес', title: 'Виза и выезд', status: 'upcoming', summary: 'Финальные документы, виза, подготовка к переезду.' },
    ],
    finance: {
      grantNote: 'Гранты CSC и провинциальные покрывают обучение полностью или частично.',
      scenarios: [
        { id: 'f1', title: 'С полным грантом CSC', cost: 240000, note: 'Обучение покрыто, остаются проживание и расходы.' },
        { id: 'f2', title: 'С частичным грантом', cost: 420000, note: 'Часть обучения и проживание — в среднем за год.' },
        { id: 'f3', title: 'Без гранта', cost: 560000, note: 'Полная стоимость обучения и жизни за год.' },
      ],
    },
  };

  function fetchAssessment() {
    // имитация загрузки; реальный источник — GET /api/assessment/{session_id}
    return new Promise((res) => setTimeout(() => res(MOCK), 240));
  }

  function Result() {
    const [data, setData] = useState(null);
    const [growthOpen, setGrowthOpen] = useState(null); // выбранная зона роста (модалка продукта)

    useEffect(() => {
      let alive = true;
      fetchAssessment().then((d) => { if (alive) setData(d); });
      return () => { alive = false; };
    }, []);

    // --- Минимальный каркас (топбар) ---------------------------------------
    const topbar = h('header', { className: 'e-topbar', key: 'top' },
      h('div', { className: 'u-flex u-items-center u-gap-2' },
        h('span', { className: 'e-rail__brand-mark', key: 'm' }, 'E'),
        h('span', { className: 'e-rail__brand-name', key: 'n' }, 'EastSide')),
      h('div', { className: 'e-topbar__spacer', key: 'sp' }),
      h(window.ETheme.ThemeToggle, { variant: 'cycle', key: 'th' })
    );

    if (!data) {
      const loading = h('main', { id: 'main', className: 'u-stack-6', style: S.wrap },
        h(Skeleton, { variant: 'block', height: 132, style: { borderRadius: 'var(--r-lg)' }, key: 'a' }),
        h(Skeleton, { variant: 'block', height: 196, style: { borderRadius: 'var(--r-xl)' }, key: 'b' }),
        h(Skeleton, { variant: 'block', height: 240, style: { borderRadius: 'var(--r-lg)' }, key: 'c' })
      );
      return h('div', { className: 'u-flex-col', style: { minHeight: '100dvh', background: 'var(--bg)' } }, topbar, loading);
    }

    const p = data.profile;

    // --- Резюме профиля -----------------------------------------------------
    const intro = h('div', { key: 'hello' },
      h('div', { className: 'u-kicker' }, 'Предварительная оценка'),
      h('h1', { style: { marginTop: 'var(--sp-2)', maxWidth: '22ch' } }, 'Мы видим в тебе потенциал, ' + p.name),
      h('div', { className: 'u-flex u-gap-2 u-wrap', style: { marginTop: 'var(--sp-3)' } },
        h(Badge, { tone: 'neutral', icon: Ic.Cap, key: 'g' }, p.grade),
        h(Badge, { tone: 'neutral', icon: Ic.Target, key: 'd' }, p.direction),
        h(Badge, { tone: 'neutral', icon: Ic.Pin, key: 'c' }, p.city)),
      h('p', { className: 'u-prose u-soft', style: { marginTop: 'var(--sp-4)' } }, p.summary)
    );

    // --- Уровень шансов: reach / match / safety -----------------------------
    // % — критичное число (charcoal --on-accent на hero), не jade. Бары jade-bright.
    const ch = data.chance;
    const chanceTier = (t) => h('div', { key: t.key, style: { display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', padding: 'var(--sp-4) var(--sp-5)', borderRadius: 'var(--r-md)', background: 'var(--accent-soft)' } },
      h('div', { style: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--sp-3)' } },
        h('span', { style: { fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--on-accent)', opacity: .9 } }, t.label),
        h('span', { className: 'u-tnum', style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: 'var(--fs-3xl)', color: 'var(--on-accent)', lineHeight: 'var(--lh-tight)' } },
          t.pct, h('small', { style: { fontSize: 'var(--fs-lg)', opacity: .65 } }, '%'))),
      // трек на токенах: пустой на --on-accent (низкая прозрачность задается компонентом),
      // заливка --jade-bright. Используем ProgressBar-эстетику, но цвет под hero.
      h('div', { style: { height: '6px', borderRadius: 'var(--r-pill)', background: 'var(--accent-active)', overflow: 'hidden' } },
        h('span', { style: { display: 'block', height: '100%', width: t.pct + '%', borderRadius: 'var(--r-pill)', background: 'var(--jade-bright)', transition: 'width var(--dur-slow) var(--ease-out)' } })),
      h('div', { style: { fontSize: 'var(--fs-xs)', color: 'var(--on-accent)', opacity: .78, lineHeight: 'var(--lh-normal)' } }, t.hint)
    );

    const chanceCard = h(Card, { variant: 'hero', key: 'chance' },
      h('div', { className: 'u-flex u-items-center u-justify-between u-wrap u-gap-3', style: { marginBottom: 'var(--sp-5)' } },
        h('div', { className: 'u-kicker', style: { color: 'var(--jade-bright)' }, key: 'k' }, 'Уровень шансов'),
        h(Badge, { tone: 'jade', icon: Ic.TrendUp, key: 'b' }, ch.headline)),
      h('div', { className: 'u-grid u-gap-3', style: { gridTemplateColumns: '1fr' }, key: 'g' },
        ch.tiers.map(chanceTier)),
      h('p', { style: { marginTop: 'var(--sp-5)', fontSize: 'var(--fs-sm)', lineHeight: 'var(--lh-normal)', color: 'var(--on-accent)', opacity: .82, maxWidth: '52ch' }, key: 'note' }, ch.note)
    );

    // --- Сильные стороны ----------------------------------------------------
    const strengthsCard = h(Card, { key: 'str' },
      h('div', { className: 'e-card__head' },
        h('h3', { className: 'e-card__title' }, 'Сильные стороны'),
        h(Pill, { tone: 'success' }, 'Твоя опора')),
      h('div', { className: 'u-stack-4' },
        data.strengths.map((s) => h('div', { key: s.id, className: 'u-flex u-items-start u-gap-3' },
          h('span', { 'aria-hidden': 'true', key: 'm', style: Object.assign({}, S.markRound, { background: 'var(--jade-tint)', color: 'var(--jade-ink)' }) },
            h(Ic.Check, { size: 15 })),
          h('div', { className: 'u-grow', key: 'b' },
            h('span', { style: S.lineTitle }, s.title),
            h('p', { style: Object.assign({ marginTop: '2px' }, S.sub) }, s.body)))))
    );

    // --- Зоны роста (кликабельны → продукт с пробным режимом) ---------------
    const growthRow = (g) => h('button', {
      key: g.id, type: 'button',
      onClick: () => setGrowthOpen(g),
      'aria-label': g.title + ' — как закрыть',
      style: { display: 'flex', alignItems: 'flex-start', gap: 'var(--sp-3)', width: '100%', textAlign: 'left',
        background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: 'var(--sp-4)',
        cursor: 'pointer', transition: 'border-color var(--dur-fast), transform var(--dur-base)' },
      onMouseOver: (e) => { e.currentTarget.style.borderColor = 'var(--ochre)'; },
      onMouseOut: (e) => { e.currentTarget.style.borderColor = 'var(--line)'; },
    },
      h('span', { 'aria-hidden': 'true', key: 'm', style: Object.assign({}, S.markRound, { marginTop: '0', background: 'var(--ochre-soft)', color: 'var(--ochre-ink)' }) },
        h(Ic.Spark, { size: 16 })),
      h('span', { className: 'u-grow', style: { minWidth: 0 }, key: 'b' },
        h('span', { style: S.lineTitle }, g.title),
        h('span', { style: Object.assign({ display: 'block', marginTop: '2px' }, S.sub) }, g.body)),
      h(Ic.ChevronRight, { size: 18, key: 'c', style: { color: 'var(--ink-mute)', flexShrink: 0, marginTop: '4px' } })
    );

    const growthCard = h(Card, { key: 'grw' },
      h('div', { className: 'e-card__head' },
        h('h3', { className: 'e-card__title' }, 'Что стоит усилить'),
        h(Pill, { tone: 'warning' }, 'Зоны роста')),
      h('p', { style: Object.assign({ marginBottom: 'var(--sp-4)' }, S.sub) },
        'Нажми на любую — покажем, как ее закрыть, и дадим попробовать бесплатно.'),
      h('div', { className: 'u-stack-3' }, data.growth.map(growthRow))
    );

    // --- Какие продукты помогут ---------------------------------------------
    const productsCard = h(Card, { key: 'prd' },
      h('div', { className: 'e-card__head' },
        h('h3', { className: 'e-card__title' }, 'Что поможет'),
        h(Pill, { tone: 'neutral' }, 'Подобрано под тебя')),
      h('div', { className: 'u-stack-3' },
        data.products.map((pr) => h('div', { key: pr.id, style: { paddingBottom: 'var(--sp-3)', borderBottom: '1px solid var(--line)' } },
          h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3', style: { marginBottom: '2px' } },
            h('span', { style: S.lineTitle }, pr.name),
            h(Badge, { tone: pr.tag === 'Флагман' ? 'jade' : 'neutral' }, pr.tag)),
          h('p', { style: S.sub }, pr.body))))
    );

    // --- Примерная траектория -----------------------------------------------
    const trajectoryCard = h(Card, { key: 'trj' },
      h('div', { className: 'e-card__head' },
        h('h3', { className: 'e-card__title' }, 'Примерная траектория'),
        h(Badge, { tone: 'jade', icon: Ic.Route }, 'Ориентир')),
      h(Milestones, { items: data.trajectory }),
      h('p', { style: Object.assign({ marginTop: 'var(--sp-4)' }, S.sub) },
        'Это эскиз пути. Точные сроки и дедлайны соберем на разборе под твою цель.')
    );

    // --- Финансовая картина (честно: стоимость и грант раздельно) -----------
    const fin = data.finance;
    const financeCard = h(Card, { key: 'fin' },
      h('div', { className: 'e-card__head' },
        h('h3', { className: 'e-card__title' }, 'Финансовая картина'),
        h(Pill, { tone: 'neutral' }, 'Цена за год')),
      h('div', { className: 'u-grid u-gap-3', style: { gridTemplateColumns: '1fr' } },
        fin.scenarios.map((s) => h('div', { key: s.id, style: S.sunkenCell },
          h('div', { style: { fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--ink)' } }, s.title),
          h('div', { className: 'u-critical u-tnum', style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-black)', fontSize: 'var(--fs-2xl)', lineHeight: 'var(--lh-tight)' } }, rub(s.cost)),
          h('div', { style: { fontSize: 'var(--fs-xs)', color: 'var(--ink-soft)' } }, s.note)))),
      h('div', { style: { marginTop: 'var(--sp-4)' } },
        h(Alert, { tone: 'success', title: 'Про гранты', icon: Ic.Star }, fin.grantNote))
    );

    // --- CTA: разбор (бесплатно) + бот --------------------------------------
    const ctaCard = h(Card, { variant: 'hero', key: 'cta' },
      h('div', { className: 'u-kicker', style: { color: 'var(--jade-bright)' } }, 'Следующий шаг'),
      h('h3', { style: { marginTop: 'var(--sp-2)', maxWidth: '24ch', color: 'var(--on-accent)' } }, 'Разберем твой случай подробно — бесплатно'),
      h('p', { className: 'u-lead', style: { color: 'var(--on-accent)', opacity: .85, marginTop: 'var(--sp-3)', maxWidth: '46ch' } },
        'Куратор пройдется по шансам, подберет вузы из базы и соберет точный план под сроки. ' +
        'Без обязательств — посмотришь и решишь сам.'),
      h('div', { className: 'u-flex u-gap-3 u-wrap', style: { marginTop: 'var(--sp-6)' } },
        h(Button, { variant: 'jade', size: 'lg', iconRight: Ic.ArrowRight, key: 'a' }, 'Записаться на разбор'),
        h(Button, { variant: 'secondary', size: 'lg', iconLeft: Ic.Telegram, key: 'b' }, 'Задать вопрос в боте'))
    );

    // --- Мягкая регистрация для сохранения прогресса ------------------------
    const saveCard = h(Card, { variant: 'inset', key: 'save' },
      h('div', { className: 'u-flex u-items-start u-gap-3' },
        h('span', { 'aria-hidden': 'true', key: 'm', style: Object.assign({}, S.markRound, { width: '36px', height: '36px', background: 'var(--jade-tint)', color: 'var(--jade-ink)' }) },
          h(Ic.Heart, { size: 18 })),
        h('div', { className: 'u-grow', key: 'b' },
          h('span', { style: S.lineTitle }, 'Сохранить эту оценку'),
          h('p', { style: Object.assign({ marginTop: '2px' }, S.sub) },
            'Заведи бесплатный кабинет — оценка, тест языка и демо-доступ будут под рукой. ' +
            'Регистрация ни к чему не обязывает.'),
          h('div', { style: { marginTop: 'var(--sp-3)' } },
            h(Button, { variant: 'secondary', size: 'sm', iconLeft: Ic.User }, 'Создать кабинет'))))
    );

    // --- Модалка зоны роста (продукт + пробный режим) -----------------------
    const g = growthOpen;
    const growthModal = g ? h(Modal, {
      open: true, onClose: () => setGrowthOpen(null), title: g.title,
      footer: h(React.Fragment, null,
        h(Button, { variant: 'ghost', onClick: () => setGrowthOpen(null), key: 'c' }, 'Позже'),
        h(Button, { variant: 'jade', iconRight: Ic.ArrowRight, key: 'a' }, 'Попробовать бесплатно')),
    },
      h('div', { className: 'u-stack-4' },
        h('div', { key: 'p', style: { padding: 'var(--sp-4)', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' } },
          h(Badge, { tone: 'jade', icon: Ic.Spark, key: 'b' }, g.product.trial),
          h('div', { style: Object.assign({}, S.lineTitle, { marginTop: 'var(--sp-3)' }) }, g.product.name),
          h('p', { style: Object.assign({ marginTop: 'var(--sp-2)' }, S.sub) }, g.product.body)),
        h(Alert, { tone: 'info', icon: Ic.Info, key: 'a' },
          'Пробный режим — без оплаты и без обязательств. Захочешь — продолжим вместе.'))
    ) : null;

    // --- Сборка -------------------------------------------------------------
    return h('div', { className: 'u-flex-col', style: { minHeight: '100dvh', background: 'var(--bg)' } },
      topbar,
      h('main', { id: 'main', className: 'u-animate-page', style: S.wrap },
        h('div', { className: 'u-stack-8' },
          intro,
          chanceCard,
          h('div', { className: 'u-stack-6' },
            strengthsCard, growthCard, productsCard, trajectoryCard, financeCard),
          ctaCard,
          saveCard,
          h('p', { key: 'foot', style: { fontSize: 'var(--fs-xs)', color: 'var(--ink-mute)', lineHeight: 'var(--lh-normal)', maxWidth: '58ch' } },
            'Это предварительная оценка по анкете, а не приговор и не гарантия. ' +
            'Точную картину собираем с куратором на разборе.')
        )
      ),
      growthModal
    );
  }

  EScreens.Result = Result;
})();
