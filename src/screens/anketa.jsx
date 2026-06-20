/* ============================================================================
   EastSide — Анкета-квалификация (window.EScreens.Anketa · route #/anketa)
   ----------------------------------------------------------------------------
   Короткая заявка: 10-15 вопросов пошагово, 1-2 на экран. Легко и быстро.
   Кто поступает, класс, страна и направление, языки и сертификаты, балл,
   достижения, формат, срочность, контакты. В конце — экран ожидания AI с
   видимым прогрессом, потом переход на #/result.

   Chromeless: свой минимальный каркас (бренд сверху + theme-toggle), без общего
   Sidebar. Центрированная колонка, спокойно. Mobile-first.

   Собран ТОЛЬКО из компонентов window.EUI и токенов (никакого хардкода цвета/
   размера/тени — только var(--token) и утилиты styles.css). Данные ответов
   живут в локальном state, контракт сабмита — QuestionnaireAnswers (см. API.md);
   тут локальный mock-прогон без бэка.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useEffect, useRef } = React;
  const EScreens = (window.EScreens = window.EScreens || {});

  // --- Опции вопросов (локальный mock прямо в файле) -----------------------
  const COUNTRIES = [
    { value: 'china', label: 'Китай' },
    { value: 'undecided', label: 'Еще выбираю страну' },
  ];
  const FIELDS = [
    { value: 'it', label: 'IT и инженерия' },
    { value: 'business', label: 'Бизнес и экономика' },
    { value: 'medicine', label: 'Медицина' },
    { value: 'design', label: 'Дизайн и искусство' },
    { value: 'language', label: 'Языки и гуманитарные' },
    { value: 'science', label: 'Естественные науки' },
    { value: 'undecided', label: 'Пока не определился' },
  ];
  const LANG_LEVELS = [
    { value: 'none', label: 'С нуля' },
    { value: 'basic', label: 'Базовый' },
    { value: 'intermediate', label: 'Средний' },
    { value: 'advanced', label: 'Уверенный' },
  ];
  const CERTS = [
    { value: 'hsk', label: 'HSK (китайский)' },
    { value: 'duolingo', label: 'Duolingo' },
    { value: 'ielts', label: 'IELTS' },
    { value: 'toefl', label: 'TOEFL' },
    { value: 'none', label: 'Пока нет сертификатов' },
  ];
  const GPA = [
    { value: 'top', label: 'Отличник — почти все пятерки' },
    { value: 'good', label: 'Хорошо — больше четверок' },
    { value: 'mixed', label: 'Средне — есть тройки' },
    { value: 'unknown', label: 'Точно не скажу' },
  ];
  const ACHIEVEMENTS = [
    { value: 'olympiads', label: 'Олимпиады и конкурсы' },
    { value: 'projects', label: 'Проекты и исследования' },
    { value: 'sport_art', label: 'Спорт или творчество' },
    { value: 'volunteering', label: 'Волонтерство' },
    { value: 'none', label: 'Особо нечего выделить' },
  ];
  const FORMATS = [
    { value: 'grant', label: 'Грант — учеба за счет стипендии' },
    { value: 'paid', label: 'Платно — готовы оплачивать' },
    { value: 'language_year', label: 'Языковой год' },
    { value: 'summer', label: 'Летняя программа' },
    { value: 'unsure', label: 'Хочу понять, что реально' },
  ];
  const URGENCY = [
    { value: 'this_year', label: 'В этом году' },
    { value: 'next_year', label: 'Через год' },
    { value: 'later', label: 'Позже, пока изучаю' },
  ];

  // Поступающий: первое лицо (сам ученик) или родитель за ребенка.
  const WHO = [
    { value: 'student', label: 'Поступаю сам' },
    { value: 'parent', label: 'Я родитель' },
  ];

  // --- Этапы прогресса AI-ожидания -----------------------------------------
  const AI_STEPS = [
    'Читаю профиль и собираю картину',
    'Подбираю подходящие вузы Китая',
    'Считаю шансы и зоны роста',
    'Готовлю предварительное заключение',
  ];

  // ---------------------------------------------------------------------------
  // Каждый шаг — это id, заголовок, подпись и набор полей. Поля рендерятся
  // компонентами EUI. 1-2 вопроса на экран. Назад не теряет ответы (общий state).
  // ---------------------------------------------------------------------------
  function buildSteps(a) {
    const isParent = a.who === 'parent';
    const subject = isParent ? 'ребенка' : 'тебя';
    return [
      {
        id: 'who',
        kicker: 'Знакомимся',
        title: 'Кто планирует поступать',
        lead: 'Подстроим вопросы под того, кто отвечает.',
        fields: ['who'],
      },
      {
        id: 'grade',
        kicker: 'Профиль',
        title: isParent ? 'Класс и возраст ребенка' : 'Твой класс и возраст',
        lead: 'Чтобы понять, сколько времени до поступления.',
        fields: ['grade', 'age'],
      },
      {
        id: 'direction',
        kicker: 'Куда метим',
        title: 'Страна и направление',
        lead: 'Если еще выбираете — это нормально, так и отметьте.',
        fields: ['country', 'field'],
      },
      {
        id: 'languages',
        kicker: 'Языки',
        title: 'Уровень английского и китайского',
        lead: 'Честно как есть. С нуля — тоже рабочая точка старта.',
        fields: ['english', 'chinese'],
      },
      {
        id: 'certs',
        kicker: 'Сертификаты',
        title: 'Есть ли подтвержденный уровень',
        lead: 'HSK, Duolingo, IELTS — если сдавали. Нет — выберите «пока нет».',
        fields: ['cert', 'cert_score'],
      },
      {
        id: 'academics',
        kicker: 'Учеба',
        title: 'Средний балл и достижения',
        lead: 'Олимпиады, проекты, конкурсы — все идет в плюс.',
        fields: ['gpa', 'achievement'],
      },
      {
        id: 'format',
        kicker: 'Формат',
        title: 'Какой формат рассматриваете',
        lead: 'Можно выбрать главное — детали разберем на диагностике.',
        fields: ['format', 'urgency'],
      },
      {
        id: 'contacts',
        kicker: 'Куда прислать разбор',
        title: 'Контакты для заключения',
        lead: 'Пришлем предварительный разбор и не будем донимать звонками.',
        fields: isParent ? ['parent_name', 'parent_phone', 'student_name'] : ['student_name', 'student_phone', 'student_email'],
      },
    ];
  }

  // --- Валидация одного шага: мягкая, по заполнению обязательных ------------
  const REQUIRED = {
    who: ['who'], grade: ['grade'], direction: ['country', 'field'],
    languages: ['english', 'chinese'], certs: ['cert'], academics: ['gpa'],
    format: ['format', 'urgency'], contacts: [],
  };

  function validateStep(step, a) {
    const errs = {};
    (REQUIRED[step.id] || []).forEach((f) => {
      if (!a[f]) errs[f] = 'Выбери вариант, чтобы продолжить';
    });
    if (step.id === 'grade' && a.age && !/^\d{1,2}$/.test(String(a.age).trim())) {
      errs.age = 'Возраст числом, например 16';
    }
    if (step.id === 'contacts') {
      if (a.who === 'parent') {
        if (!a.parent_name) errs.parent_name = 'Как к вам обращаться';
        if (!a.parent_phone) errs.parent_phone = 'Телефон для связи';
      } else {
        if (!a.student_name) errs.student_name = 'Как тебя зовут';
        if (!a.student_phone) errs.student_phone = 'Телефон для связи';
      }
    }
    return errs;
  }

  // ===========================================================================
  // Экран ожидания AI: видимый прогресс по этапам, потом переход на #/result.
  // ===========================================================================
  function AiWaiting() {
    const Ic = window.EIcons, U = window.EUI;
    const { Card, ProgressBar } = U;
    const [done, setDone] = useState(0);

    useEffect(() => {
      let n = 0;
      const tick = () => {
        n += 1;
        setDone(n);
        if (n < AI_STEPS.length) {
          timer = setTimeout(tick, 1100);
        } else {
          timer = setTimeout(() => {
            window.ERouter && window.ERouter.navigate('/result', { replace: true });
          }, 900);
        }
      };
      let timer = setTimeout(tick, 700);
      return () => clearTimeout(timer);
    }, []);

    const pct = Math.round((done / AI_STEPS.length) * 100);

    return h('div', { className: 'es-anketa-wait u-animate-page', style: { textAlign: 'center' } },
      h('span', {
        className: 'es-anketa-orb', 'aria-hidden': 'true',
        style: {
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 'var(--sp-16)', height: 'var(--sp-16)', borderRadius: 'var(--r-pill)',
          background: 'var(--jade-tint)', color: 'var(--jade-ink)', marginBottom: 'var(--sp-5)',
        },
      }, h(Ic.Spark, { size: 30 })),
      h('h1', { style: { fontSize: 'var(--fs-2xl)' } }, 'Собираю предварительный разбор'),
      h('p', { className: 'u-lead', style: { marginTop: 'var(--sp-2)', marginInline: 'auto', maxWidth: '40ch' } },
        'Минуту — смотрю профиль, подбираю вузы и считаю шансы. Это бесплатно.'),

      h(Card, { variant: 'inset', className: 'es-anketa-progress', style: { marginTop: 'var(--sp-6)', textAlign: 'left' } },
        h(ProgressBar, { value: pct, tone: 'jade', showPct: true, label: 'Готовность разбора' }),
        h('div', { className: 'u-stack-3', style: { marginTop: 'var(--sp-5)' } },
          AI_STEPS.map((label, i) => {
            const state = i < done ? 'done' : i === done ? 'active' : 'wait';
            const Icon = state === 'done' ? Ic.CheckCircle : state === 'active' ? Ic.Spark : Ic.Clock;
            return h('div', {
              key: i, className: 'u-flex u-items-center u-gap-3',
              style: { opacity: state === 'wait' ? 0.5 : 1, transition: 'opacity var(--dur-base) var(--ease-out)' },
            },
              h('span', {
                'aria-hidden': 'true',
                style: { color: state === 'done' ? 'var(--jade-ink)' : state === 'active' ? 'var(--accent)' : 'var(--ink-mute)', display: 'inline-flex' },
              }, h(Icon, { size: 18 })),
              h('span', {
                style: {
                  fontSize: 'var(--fs-sm)', fontWeight: state === 'active' ? 'var(--fw-semibold)' : 'var(--fw-medium)',
                  color: state === 'wait' ? 'var(--ink-mute)' : 'var(--ink)',
                },
              }, label));
          }))
      )
    );
  }

  // ===========================================================================
  // Рендер поля по ключу — все на EUI-компонентах.
  // ===========================================================================
  function Field(props) {
    const { name, a, set, errs } = props;
    const U = window.EUI, Ic = window.EIcons;
    const { FormField, Select, SegmentedControl, Input } = U;
    const err = errs[name];

    const segField = (label, hint, opts, required) => h(FormField, { label, hint, error: err, required },
      h(SegmentedControl, { ariaLabel: label, options: opts, value: a[name], onChange: (v) => set(name, v) }));
    const selField = (label, hint, opts, placeholder, required) => h(FormField, { label, hint, error: err, required },
      h(Select, { options: opts, value: a[name], onChange: (v) => set(name, v), placeholder, error: !!err }));
    const inField = (label, hint, extra, required) => h(FormField, { label, hint, error: err, required },
      h(Input, Object.assign({ value: a[name] || '', onChange: (e) => set(name, e.target.value), error: !!err }, extra)));

    switch (name) {
      case 'who':
        return segField('Кто поступает', null, WHO, true);
      case 'grade':
        return selField('Класс или курс', 'Если уже не школьник — выбери «выпускник».',
          [
            { value: '8', label: '8 класс' }, { value: '9', label: '9 класс' },
            { value: '10', label: '10 класс' }, { value: '11', label: '11 класс' },
            { value: 'grad', label: 'Выпускник школы' }, { value: 'student', label: 'Студент' },
          ], 'Выбери класс', true);
      case 'age':
        return inField('Возраст', 'Полных лет.', { type: 'text', inputMode: 'numeric', placeholder: '16', maxLength: 2 });
      case 'country':
        return selField('Страна интереса', null, COUNTRIES, 'Выбери страну', true);
      case 'field':
        return selField('Направление', null, FIELDS, 'Выбери направление', true);
      case 'english':
        return segField('Английский', 'Уровень примерно.', LANG_LEVELS, true);
      case 'chinese':
        return segField('Китайский', 'С нуля — самый частый старт.', LANG_LEVELS, true);
      case 'cert':
        return selField('Сертификат', null, CERTS, 'Выбери сертификат', true);
      case 'cert_score':
        return a.cert && a.cert !== 'none'
          ? inField('Балл или уровень', 'Если помнишь — например HSK 3 или Duolingo 110.', { type: 'text', placeholder: 'HSK 3' })
          : null;
      case 'gpa':
        return selField('Средний балл', null, GPA, 'Выбери вариант', true);
      case 'achievement':
        return selField('Главное достижение', 'Самое заметное — остальное обсудим позже.', ACHIEVEMENTS, 'Выбери вариант');
      case 'format':
        return selField('Формат поступления', null, FORMATS, 'Выбери формат', true);
      case 'urgency':
        return segField('Когда планируете', null, URGENCY, true);
      case 'parent_name':
        return inField('Ваше имя', null, { type: 'text', placeholder: 'Как к вам обращаться', iconLeft: Ic.User }, true);
      case 'parent_phone':
        return inField('Телефон', 'Только для связи по разбору.', { type: 'tel', inputMode: 'tel', placeholder: '+7', iconLeft: Ic.Phone }, true);
      case 'student_name':
        return inField(a.who === 'parent' ? 'Имя ребенка' : 'Твое имя', null, { type: 'text', placeholder: 'Имя', iconLeft: Ic.User }, a.who !== 'parent');
      case 'student_phone':
        return inField('Телефон', 'Только для связи по разбору.', { type: 'tel', inputMode: 'tel', placeholder: '+7', iconLeft: Ic.Phone }, true);
      case 'student_email':
        return inField('Почта', 'Пришлем разбор сюда.', { type: 'email', inputMode: 'email', placeholder: 'mail@example.com', iconLeft: Ic.Mail });
      default:
        return null;
    }
  }

  // ===========================================================================
  function Anketa() {
    const U = window.EUI, Ic = window.EIcons;
    const { Topbar, Card, Button } = U;

    const [answers, setAnswers] = useState({ who: 'student' });
    const [idx, setIdx] = useState(0);
    const [errs, setErrs] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const topRef = useRef(null);

    const set = (name, value) => {
      setAnswers((prev) => Object.assign({}, prev, { [name]: value }));
      if (errs[name]) setErrs((prev) => { const n = Object.assign({}, prev); delete n[name]; return n; });
    };

    const steps = buildSteps(answers);
    const step = steps[idx];
    const last = idx === steps.length - 1;

    // прокрутка к началу вопроса при смене шага
    useEffect(() => { if (topRef.current) topRef.current.scrollIntoView({ block: 'start', behavior: 'auto' }); }, [idx]);

    const goBack = () => { if (idx > 0) setIdx(idx - 1); };
    const goNext = () => {
      const e = validateStep(step, answers);
      setErrs(e);
      if (Object.keys(e).length) return;
      if (last) { setSubmitting(true); return; }
      setIdx(idx + 1);
    };

    // --- Минимальный chromeless-каркас (бренд + theme-toggle) --------------
    const topbar = h(Topbar, {
      left: h('a', { href: '#/', className: 'u-flex u-items-center u-gap-2', style: { textDecoration: 'none' } },
        h('span', { className: 'e-rail__brand-mark', key: 'm' }, 'E'),
        h('span', { className: 'e-rail__brand-name', key: 'n' }, 'EastSide')),
      right: window.ETheme ? h(window.ETheme.ThemeToggle, { variant: 'cycle' }) : null,
    });

    if (submitting) {
      return h('div', { className: 'u-flex-col es-anketa-root', style: { minHeight: '100dvh' } },
        topbar,
        h('main', { id: 'main', className: 'es-anketa-wrap', style: { display: 'flex', alignItems: 'center' } },
          h(AiWaiting))
      );
    }

    // --- Шапка шага: HStepper + счетчик ------------------------------------
    const head = h('div', { className: 'es-anketa-head u-stack-4', ref: topRef },
      h('div', { className: 'u-flex u-items-center u-justify-between u-gap-3' },
        h('span', { className: 'es-section-label' }, 'Заявка на разбор'),
        h('span', { className: 'es-section-label u-tnum', style: { color: 'var(--ink-soft)' } },
          'Шаг ', h('b', { style: { color: 'var(--ink)' } }, idx + 1), ' из ', steps.length)),
      h(U.HStepper, { steps: steps.length, current: idx })
    );

    // --- Карточка вопроса ---------------------------------------------------
    const card = h(Card, { className: 'es-anketa-card u-animate-fade', key: step.id },
      h('div', { className: 'u-stack-2', style: { marginBottom: 'var(--sp-5)' } },
        h('div', { className: 'u-kicker', style: { color: 'var(--jade-ink)' } }, step.kicker),
        h('h1', { style: { fontSize: 'var(--fs-2xl)', lineHeight: 'var(--lh-snug)' } }, step.title),
        step.lead ? h('p', { className: 'u-lead', style: { marginTop: 'var(--sp-1)' } }, step.lead) : null),
      h('div', { className: 'u-stack-5' },
        step.fields.map((name) => h(Field, { key: name, name, a: answers, set, errs })).filter(Boolean))
    );

    // --- Низ: Назад / Далее -------------------------------------------------
    const footer = h('div', { className: 'es-anketa-nav u-flex u-items-center u-gap-3', style: { marginTop: 'var(--sp-6)' } },
      idx > 0
        ? h(Button, { variant: 'ghost', size: 'lg', iconLeft: Ic.ArrowLeft, onClick: goBack }, 'Назад')
        : h('span', { className: 'u-grow' }),
      idx > 0 ? h('span', { className: 'u-grow' }) : null,
      h(Button, {
        variant: 'primary', size: 'lg', iconRight: last ? Ic.Spark : Ic.ArrowRight, onClick: goNext,
      }, last ? 'Получить разбор' : 'Далее')
    );

    // спокойная сноска про доверие (без дожима)
    const note = h('p', {
      style: { marginTop: 'var(--sp-5)', textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--ink-mute)' },
    }, 'Это бесплатно. Контакты — только для разбора, без спама и звонков по кругу.');

    return h('div', { className: 'u-flex-col es-anketa-root', style: { minHeight: '100dvh' } },
      topbar,
      h('main', { id: 'main', className: 'es-anketa-wrap u-animate-page' },
        h('div', { className: 'u-stack-6' },
          head,
          card,
          footer,
          note
        )
      )
    );
  }

  EScreens.Anketa = Anketa;
})();

/* Локальные стили экрана — только токены, без хардкода значений.
   Inject один раз; центрированная узкая колонка, как у кабинета ученика. */
(function () {
  'use strict';
  if (document.getElementById('es-anketa-style')) return;
  const css = [
    '.es-anketa-wrap{flex:1 1 auto;width:100%;max-width:var(--content-max);margin-inline:auto;',
    'padding:var(--sp-6) var(--sp-4) var(--sp-12);}',
    '@media(min-width:768px){.es-anketa-wrap{max-width:560px;padding:var(--sp-10) var(--sp-4) var(--sp-16);}}',
    '.es-anketa-card{padding:var(--sp-6);}',
    '@media(min-width:768px){.es-anketa-card{padding:var(--sp-8);}}',
    '.es-anketa-wait{width:100%;}',
  ].join('');
  const tag = document.createElement('style');
  tag.id = 'es-anketa-style';
  tag.textContent = css;
  document.head.appendChild(tag);
})();
