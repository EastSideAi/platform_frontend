/* ============================================================================
   EastSide — Лендинг-витрина (window.EScreens.Landing · route #/)
   ----------------------------------------------------------------------------
   Первый контакт. Цель экрана — довести холодного родителя до анкеты, спокойно
   и без дожима. Один вопрос экрана: «можно ли доверить этим людям поступление
   ребенка в Китай». Ответ — доказательствами, не обещаниями.

   Chromeless: свой premium-хедер (лого + тема) и футер, без общего Sidebar.
   Тон доверия: ноль «100%», таймеров, счетчиков мест. Mobile-first.

   Собран ТОЛЬКО из компонентов window.EUI и токенов (никакого хардкода цвета/
   размера/тени — только var(--token) и утилиты styles.css). Данные — локальный
   mock в этом файле (общий mock.jsx не трогаем).
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;
  const {
    Card, Button, Badge, Pill, Stat, Avatar, ProgressBar,
  } = U;

  /* --- Локальные данные витрины (mock прямо здесь) ------------------------ */
  const PROOFS = [
    { label: 'Городов поступления', value: '14', note: 'Пекин, Шанхай, Гуанчжоу и далее' },
    { label: 'Грантов получено', value: '380', note: 'полных и частичных, за 4 года' },
    { label: 'Сэкономлено семьям', value: '320', unit: 'млн ₽', note: 'на обучении и проживании' },
    { label: 'Вузов-партнеров', value: '60', note: 'с прямым каналом подачи' },
  ];

  const STEPS = [
    { icon: 'Doc', title: 'Короткая анкета', body: 'Десять-пятнадцать вопросов про класс, языки, баллы и цели. Пять минут, без регистрации.' },
    { icon: 'Spark', title: 'AI-оценка шансов', body: 'Сразу видишь сильные и слабые стороны, уровень шансов и какие шаги их поднимут.' },
    { icon: 'Target', title: 'Разбор с куратором', body: 'Живой специалист собирает заключение: подбор вузов, грантов и стратегию под ребенка.' },
    { icon: 'Route', title: 'Сопровождение', body: 'Ведем по дорожной карте до зачисления: язык, документы, подача, виза, выезд.' },
  ];

  const CASES = [
    { name: 'Артем, 11 класс', city: 'Казань → Пекин', uni: 'Beijing Institute of Technology · 北京理工大学', grant: 'Полный грант CSC', tone: 'jade' },
    { name: 'София, 1 курс', city: 'Алматы → Шанхай', uni: 'Fudan University · 复旦大学', grant: 'Частичный грант + общежитие', tone: 'neutral' },
    { name: 'Даниил, 10 класс', city: 'Москва → Ханчжоу', uni: 'Zhejiang University · 浙江大学', grant: 'Провинциальный грант', tone: 'neutral' },
  ];

  const LANG = [
    { label: 'HSK 5', sub: 'Подготовка к экзамену с нуля за учебный год', pct: 88, foot: 'средний результат группы' },
    { label: 'Duolingo English 110+', sub: 'Для англоязычных программ китайских вузов', pct: 76, foot: 'доходят до проходного балла' },
  ];

  const TEACHERS = [
    { name: 'Ли Вэй', role: 'Носитель языка, HSK-методист', tag: '12 лет практики' },
    { name: 'Анна Громова', role: 'Куратор поступления, экс-CSC', tag: '200+ заявок' },
    { name: 'Чжан Мин', role: 'Преподаватель академического китайского', tag: 'PhD, Fudan' },
  ];

  const REVIEWS = [
    { name: 'Марина, мама Артема', text: 'Боялась, что сын потеряет год. Здесь сразу показали честную картину и план по шагам. Через полгода — грант на руках.' },
    { name: 'Сергей, папа Софии', text: 'Понравилось, что не давили и не обещали золотых гор. Показывали прогресс каждую неделю, было видно, что работа идет.' },
    { name: 'Гульнара, мама Даниила', text: 'Документы и виза — самое страшное для родителя. Команда вела за руку, я просто видела статусы и спала спокойно.' },
  ];

  const FAQ = [
    { q: 'Сколько стоит начать', a: 'Первая диагностика шансов по анкете — бесплатно. Развернутое заключение с подбором вузов и стратегией — отдельная недорогая услуга, сумму называем заранее, без скрытых платежей.' },
    { q: 'Вы гарантируете поступление', a: 'Честно: гарантий поступления не дает никто, и обещания «100%» — повод насторожиться. Мы отвечаем за подготовку, подачу и сопровождение, а шансы показываем реалистично — reach, match и safety раздельно.' },
    { q: 'А если ребенок еще не знает китайский', a: 'Это норма. Большинство начинают с нуля. В дорожную карту встроена языковая подготовка под нужный экзамен — HSK для китаеязычных программ или английский для англоязычных.' },
    { q: 'Чем вы отличаетесь от агентств', a: 'Мы ведем не «до подачи», а до зачисления и выезда, и показываем работу прозрачно: родитель видит вехи, дедлайны и оплаты в своем кабинете. Никакой внутренней кухни вслепую.' },
  ];

  /* --- Хедер витрины (свой, не общий Sidebar) ---------------------------- */
  function SiteHeader() {
    return h('header', { className: 'e-topbar', style: { paddingInline: 'var(--sp-4)' } },
      h('div', { className: 'u-flex u-items-center u-gap-2', key: 'brand' },
        h('span', { className: 'e-rail__brand-mark', key: 'm' }, 'E'),
        h('span', { className: 'e-rail__brand-name', key: 'n' }, 'EastSide')),
      h('div', { className: 'e-topbar__spacer', key: 'sp' }),
      h('div', { className: 'u-flex u-items-center u-gap-2', key: 'right' },
        h(window.ETheme.ThemeToggle, { variant: 'cycle', key: 't' }),
        h(Button, { variant: 'ghost', size: 'sm', as: 'a', href: '#/auth', key: 'login' }, 'Войти'),
        h(Button, { variant: 'primary', size: 'sm', as: 'a', href: '#/anketa', iconRight: Ic.ArrowRight, className: 'u-hide-mobile', key: 'cta' }, 'Диагностика'))
    );
  }

  /* --- Eyebrow-метка раздела --------------------------------------------- */
  function Eyebrow(props) {
    return h('div', { className: 'u-kicker', style: { color: 'var(--jade-ink)', marginBottom: 'var(--sp-3)' } }, props.children);
  }

  /* --- Герой -------------------------------------------------------------- */
  function Hero() {
    return h('section', { className: 'u-container', style: { paddingTop: 'var(--sp-16)', paddingBottom: 'var(--sp-12)' } },
      h('div', { style: { textAlign: 'center', marginBottom: 'var(--sp-4)' } },
        h(Pill, { tone: 'success' }, 'Поступление в вузы Китая под ключ')),
      h('h1', {
        style: {
          textAlign: 'center', fontSize: 'clamp(var(--fs-4xl), 6vw, var(--fs-5xl))',
          lineHeight: 'var(--lh-tight)', maxWidth: '18ch', margin: '0 auto',
        },
      }, 'Поступить в университет Китая — по гранту'),
      h('p', {
        className: 'u-lead',
        style: { textAlign: 'center', maxWidth: '52ch', margin: 'var(--sp-5) auto 0' },
      }, 'Ведем школьника и студента из СНГ от первой анкеты до зачисления: оценка шансов, подбор вузов и грантов, язык, документы, виза и выезд.'),
      h('div', {
        className: 'u-flex u-items-center u-justify-center u-wrap u-gap-3',
        style: { marginTop: 'var(--sp-8)' },
      },
        h(Button, { variant: 'primary', size: 'lg', as: 'a', href: '#/anketa', iconRight: Ic.ArrowRight, key: 'a' }, 'Бесплатная диагностика'),
        h(Button, { variant: 'secondary', size: 'lg', as: 'a', href: '#/auth', key: 'b' }, 'Войти')),
      h('div', {
        className: 'u-flex u-items-center u-justify-center u-gap-2',
        style: { marginTop: 'var(--sp-4)', color: 'var(--ink-mute)', fontSize: 'var(--fs-sm)' },
      },
        h(Ic.Lock, { size: 15, key: 'i' }),
        h('span', { key: 't' }, 'Без регистрации и звонков — пять минут на анкету'))
    );
  }

  /* --- Доказательства (цифры charcoal) ----------------------------------- */
  function Proofs() {
    return h('section', { className: 'u-container', style: { paddingBlock: 'var(--sp-10)' } },
      h(Card, { variant: 'flat' },
        h('div', { className: 'u-cols-4' },
          PROOFS.map((p, i) => h(Stat, {
            key: i, bordered: true,
            label: p.label, value: p.value, unit: p.unit,
            delta: p.note, deltaTone: 'pos',
          })))
      )
    );
  }

  /* --- Как это работает --------------------------------------------------- */
  function HowItWorks() {
    return h('section', { className: 'u-container', style: { paddingBlock: 'var(--sp-12)' } },
      h('div', { style: { textAlign: 'center', marginBottom: 'var(--sp-8)' } },
        h(Eyebrow, null, 'Путь — четыре шага'),
        h('h2', { style: { margin: '0 auto', maxWidth: '20ch' } }, 'Как проходит дорога к зачислению')),
      h('div', { className: 'u-cols-4' },
        STEPS.map((s, i) => {
          const StepIc = Ic[s.icon] || Ic.Spark;
          return h(Card, { key: i },
            h('div', {
              className: 'u-flex u-items-center u-justify-center',
              style: {
                width: 'var(--sp-12)', height: 'var(--sp-12)', borderRadius: 'var(--r-md)',
                background: 'var(--jade-tint)', color: 'var(--jade-ink)', marginBottom: 'var(--sp-4)',
              },
            }, h(StepIc, { size: 22 })),
            h('div', { className: 'u-flex u-items-center u-gap-2', style: { marginBottom: 'var(--sp-2)' } },
              h(Badge, { tone: 'neutral', num: true }, i + 1),
              h('h4', { style: { fontSize: 'var(--fs-lg)', margin: 0 } }, s.title)),
            h('p', { className: 'u-prose u-soft', style: { fontSize: 'var(--fs-sm)', margin: 0 } }, s.body));
        }))
    );
  }

  /* --- Кейсы учеников ----------------------------------------------------- */
  function Cases() {
    return h('section', { className: 'u-container', style: { paddingBlock: 'var(--sp-12)' } },
      h('div', { style: { marginBottom: 'var(--sp-8)' } },
        h(Eyebrow, null, 'Реальные поступления'),
        h('h2', { style: { maxWidth: '22ch' } }, 'Куда и с какими грантами уезжают наши ученики')),
      h('div', { className: 'u-cols-3' },
        CASES.map((c, i) => h(Card, { key: i },
          h('div', { className: 'u-flex u-items-center u-gap-3', style: { marginBottom: 'var(--sp-4)' } },
            h(Avatar, { name: c.name, size: 'md', key: 'a' }),
            h('div', { key: 'd' },
              h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' } }, c.name),
              h('div', { style: { fontSize: 'var(--fs-sm)', color: 'var(--ink-mute)' } }, c.city))),
          h('div', { style: { fontSize: 'var(--fs-md)', color: 'var(--ink)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--sp-3)' } }, c.uni),
          h(Badge, { tone: c.tone === 'jade' ? 'jade' : 'neutral', icon: Ic.Flag }, c.grant)
        )))
    );
  }

  /* --- Результаты Duolingo / HSK ----------------------------------------- */
  function LangResults() {
    return h('section', { className: 'u-container', style: { paddingBlock: 'var(--sp-12)' } },
      h(Card, { variant: 'inset' },
        h('div', { className: 'e-card__head' },
          h('div', null,
            h(Eyebrow, null, 'Языковая подготовка'),
            h('h3', { className: 'e-card__title', style: { margin: 0 } }, 'Результаты по HSK и Duolingo')),
          h(Pill, { tone: 'neutral' }, 'С нуля за учебный год')),
        h('div', { className: 'u-cols-2', style: { marginTop: 'var(--sp-2)' } },
          LANG.map((l, i) => h('div', { key: i, className: 'u-stack-2' },
            h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)', color: 'var(--ink)' } }, l.label),
            h('div', { style: { fontSize: 'var(--fs-sm)', color: 'var(--ink-soft)' } }, l.sub),
            h(ProgressBar, { value: l.pct, tone: 'jade', showPct: true }),
            h('div', { style: { fontSize: 'var(--fs-xs)', color: 'var(--ink-mute)' } }, l.foot))))
      )
    );
  }

  /* --- Преподаватели и регалии ------------------------------------------- */
  function Teachers() {
    return h('section', { className: 'u-container', style: { paddingBlock: 'var(--sp-12)' } },
      h('div', { style: { marginBottom: 'var(--sp-8)' } },
        h(Eyebrow, null, 'Команда'),
        h('h2', { style: { maxWidth: '22ch' } }, 'Преподаватели-практики и кураторы поступления')),
      h('div', { className: 'u-cols-3' },
        TEACHERS.map((t, i) => h(Card, { key: i },
          h('div', { className: 'u-flex u-items-center u-gap-3' },
            h(Avatar, { name: t.name, size: 'lg', key: 'a' }),
            h('div', { key: 'd' },
              h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', color: 'var(--ink)' } }, t.name),
              h('div', { style: { fontSize: 'var(--fs-sm)', color: 'var(--ink-soft)', marginTop: 'var(--sp-1)' } }, t.role),
              h('div', { style: { marginTop: 'var(--sp-2)' } }, h(Badge, { tone: 'jade', icon: Ic.Star }, t.tag))))
        )))
    );
  }

  /* --- Отзывы ------------------------------------------------------------- */
  function Reviews() {
    return h('section', { className: 'u-container', style: { paddingBlock: 'var(--sp-12)' } },
      h('div', { style: { marginBottom: 'var(--sp-8)' } },
        h(Eyebrow, null, 'Голос родителей'),
        h('h2', { style: { maxWidth: '20ch' } }, 'Что говорят семьи')),
      h('div', { className: 'u-cols-3' },
        REVIEWS.map((r, i) => h(Card, { key: i, variant: 'flat' },
          h(Ic.Heart, { size: 20, key: 'i', style: { color: 'var(--jade)' } }),
          h('p', { className: 'u-prose', style: { fontSize: 'var(--fs-md)', marginBlock: 'var(--sp-3)' }, key: 'q' }, r.text),
          h('div', { className: 'u-flex u-items-center u-gap-2', key: 'm' },
            h(Avatar, { name: r.name, size: 'sm', key: 'a' }),
            h('span', { style: { fontSize: 'var(--fs-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--ink)' }, key: 'n' }, r.name))
        )))
    );
  }

  /* --- FAQ (раскрывающиеся вопросы) -------------------------------------- */
  function FaqItem(props) {
    const { item } = props;
    const [open, setOpen] = useState(false);
    return h(Card, { variant: 'flat', style: { padding: 'var(--sp-4) var(--sp-6)' } },
      h('button', {
        type: 'button',
        className: 'u-flex u-items-center u-justify-between u-gap-3',
        onClick: () => setOpen((v) => !v),
        'aria-expanded': open,
        style: {
          width: '100%', background: 'none', border: 0, cursor: 'pointer',
          font: 'inherit', textAlign: 'left', color: 'var(--ink)',
          padding: 0, minHeight: 'var(--tap-min)',
        },
      },
        h('span', { style: { fontFamily: 'var(--font-display)', fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-lg)' }, key: 'q' }, item.q),
        h(open ? Ic.ChevronUp : Ic.ChevronDown, { size: 20, style: { color: 'var(--ink-mute)', flexShrink: 0 }, key: 'c' })),
      open ? h('p', { className: 'u-prose u-soft', style: { fontSize: 'var(--fs-sm)', marginTop: 'var(--sp-3)' } }, item.a) : null
    );
  }

  function Faq() {
    return h('section', { className: 'u-container', style: { paddingBlock: 'var(--sp-12)' } },
      h('div', { style: { marginBottom: 'var(--sp-8)' } },
        h(Eyebrow, null, 'Частые вопросы'),
        h('h2', { style: { maxWidth: '20ch' } }, 'Коротко о главном')),
      h('div', { className: 'u-stack-3' },
        FAQ.map((f, i) => h(FaqItem, { key: i, item: f })))
    );
  }

  /* --- Финальный CTA ------------------------------------------------------ */
  function FinalCta() {
    return h('section', { className: 'u-container', style: { paddingBlock: 'var(--sp-12)' } },
      h(Card, { variant: 'hero' },
        h(Eyebrow, null, 'Первый шаг — без обязательств'),
        h('h2', { style: { color: 'var(--on-accent)', maxWidth: '20ch', lineHeight: 'var(--lh-tight)' } },
          'Узнайте шансы ребенка на грант за пять минут'),
        h('p', { className: 'u-lead', style: { color: 'var(--on-accent)', opacity: .85, maxWidth: '46ch', marginTop: 'var(--sp-3)' } },
          'Заполните короткую анкету — AI покажет честную картину, а куратор поможет собрать стратегию.'),
        h('div', { className: 'u-flex u-items-center u-wrap u-gap-3', style: { marginTop: 'var(--sp-6)' } },
          h(Button, { variant: 'jade', size: 'lg', as: 'a', href: '#/anketa', iconRight: Ic.ArrowRight, key: 'a' }, 'Пройти диагностику'),
          h(Button, { variant: 'ghost', size: 'lg', as: 'a', href: '#/auth', style: { color: 'var(--on-accent)' }, key: 'b' }, 'У меня есть кабинет'))
      )
    );
  }

  /* --- Футер -------------------------------------------------------------- */
  function SiteFooter() {
    const linkStyle = { color: 'var(--ink-soft)', textDecoration: 'none', fontSize: 'var(--fs-sm)' };
    return h('footer', {
      style: {
        borderTop: '1px solid var(--line)', marginTop: 'var(--sp-12)',
        paddingBlock: 'var(--sp-10)', background: 'var(--rail)',
      },
    },
      h('div', { className: 'u-container' },
        h('div', { className: 'u-flex u-items-start u-justify-between u-wrap u-gap-8' },
          h('div', { style: { maxWidth: '34ch' }, key: 'brand' },
            h('div', { className: 'u-flex u-items-center u-gap-2', style: { marginBottom: 'var(--sp-3)' } },
              h('span', { className: 'e-rail__brand-mark', key: 'm' }, 'E'),
              h('span', { className: 'e-rail__brand-name', key: 'n' }, 'EastSide')),
            h('p', { className: 'u-prose u-soft', style: { fontSize: 'var(--fs-sm)', margin: 0 } },
              'Поступление в вузы Китая для школьников и студентов из СНГ — от диагностики до выезда.')),
          h('nav', { className: 'u-stack-2', 'aria-label': 'Навигация', key: 'links' },
            h('div', { className: 'es-section-label', style: { marginBottom: 'var(--sp-1)' } }, 'Платформа'),
            h('a', { href: '#/anketa', style: linkStyle }, 'Бесплатная диагностика'),
            h('a', { href: '#/auth', style: linkStyle }, 'Войти в кабинет'),
            h('a', { href: '#/result', style: linkStyle }, 'Пример заключения')),
          h('nav', { className: 'u-stack-2', 'aria-label': 'Связь', key: 'contact' },
            h('div', { className: 'es-section-label', style: { marginBottom: 'var(--sp-1)' } }, 'Связь'),
            h('a', { href: '#/', style: linkStyle, className: 'u-flex u-items-center u-gap-2' }, h(Ic.Telegram, { size: 15 }), 'Telegram'),
            h('a', { href: '#/', style: linkStyle, className: 'u-flex u-items-center u-gap-2' }, h(Ic.Mail, { size: 15 }), 'Почта'))),
        h('div', {
          style: {
            marginTop: 'var(--sp-8)', paddingTop: 'var(--sp-4)', borderTop: '1px solid var(--line)',
            color: 'var(--ink-mute)', fontSize: 'var(--fs-xs)',
          },
        }, 'EastSide · РФ и Казахстан · Показываем честные шансы, а не обещания'))
    );
  }

  /* --- Сборка экрана ------------------------------------------------------ */
  function Landing() {
    return h('div', { className: 'u-flex-col', style: { minHeight: '100dvh' } },
      h(SiteHeader, { key: 'hd' }),
      h('main', { id: 'main', className: 'u-grow u-animate-page', key: 'main' },
        h(Hero, { key: 'hero' }),
        h(Proofs, { key: 'proofs' }),
        h(HowItWorks, { key: 'how' }),
        h(Cases, { key: 'cases' }),
        h(LangResults, { key: 'lang' }),
        h(Teachers, { key: 'teachers' }),
        h(Reviews, { key: 'reviews' }),
        h(Faq, { key: 'faq' }),
        h(FinalCta, { key: 'cta' })),
      h(SiteFooter, { key: 'ft' })
    );
  }

  EScreens.Landing = Landing;
})();
