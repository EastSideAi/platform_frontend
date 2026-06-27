/* ============================================================================
   EastSide — Образовательный хаб ученика (window.EScreens.LearnHub · #/learn)
   ----------------------------------------------------------------------------
   Главная экрана «Обучение»: единый пульт курса. Режим B, каркас ESStudentShell.
   Иерархия и один якорь: герой курса с прогресс-кольцом и горой → строка метрик
   (остаток занятий, прогресс, тесты, серия) → ближайшее занятие + домашка (одна
   текущая выделена) → результаты тестов + тихие риски → расписание → AI-тьютор →
   связь с куратором (CRM) и родителем. Никаких «3 одинаковых карточек».

   Все CTA живые: «Войти в урок» и текущая домашка ведут в тренажёр (#/learn/lesson),
   AI — в чат навигатора, родитель — в свой кабинет, куратор — в чат. Внизу тихая
   дверь в конструктор для преподавателя.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h } = window.React || React;
  const Ic = window.EIcons || {};
  const SH = window.ESStudentShell;
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};
  const arr = (s) => Ic.ArrowRight ? h(Ic.ArrowRight, { size: s || 16, className: 'sd-arr' }) : null;

  // ── Демо-данные курса (бэк подменит позже) ──────────────────────────────────
  const COURSE = {
    name: 'Китайский: с нуля до HSK 4',
    say: 'Личный курс под поступление. Идём по плану — язык подтянем к подаче на грант.',
    tariff: 'Премиум · индивидуально',
    teacher: 'Ли Вэй',
    pct: 46,
    lessonsLeft: 18, lessonsTotal: 32,
    testAvg: 84, streak: 12,
    next: { day: 'Завтра', date: '26 июня', time: '17:00', topic: 'Урок 12 · Время и распорядок дня', format: 'Онлайн · 50 минут', teacher: 'Ли Вэй' },
    schedule: [
      { day: 'Чт', date: '26 июня', time: '17:00', topic: 'Время и распорядок дня', next: true },
      { day: 'Пн', date: '30 июня', time: '17:00', topic: 'Покупки и числа' },
      { day: 'Чт', date: '3 июля', time: '17:00', topic: 'Еда и заказ в кафе' },
    ],
    homework: [
      { title: 'Урок 11 · Слова 你好 / 谢谢 / 再见', meta: 'Срок: до завтра', status: 'todo' },
      { title: 'Тренажёр: тоны и пиньинь', meta: 'Проверяется преподавателем', status: 'review' },
      { title: 'Урок 10 · Моя семья', meta: 'Оценка', score: '92', status: 'done' },
      { title: 'Урок 9 · Числа 1–10', meta: 'Просрочено на 2 дня', status: 'late' },
    ],
    tests: [
      { name: 'Тест по Уроку 10', date: '18 июня', score: 92 },
      { name: 'Лексика: семья', date: '14 июня', score: 84 },
      { name: 'Тоны · аудирование', date: '9 июня', score: 71 },
      { name: 'HSK 1 · пробник', date: '2 июня', score: 88 },
    ],
    risks: [
      { kind: 'warn', text: 'Домашка по Уроку 9 просрочена — давай догоним сегодня', cta: 'Догнать' },
      { kind: 'info', text: 'Аудирование тонов ниже плана. Добавил короткий тренажёр', cta: 'Тренажёр' },
    ],
  };

  function injectCSS() {
    if (document.getElementById('learn-hub-css')) return;
    const el = document.createElement('style');
    el.id = 'learn-hub-css';
    el.textContent = `
    .lh-wrap{position:relative;z-index:1;}

    /* ── ГЕРОЙ: тёмное восхождение — единственный якорь экрана ─────────────── */
    .lh-hero{position:relative;overflow:hidden;border-radius:26px;padding:42px 46px;min-height:262px;display:flex;flex-direction:column;justify-content:center;
      background:
        radial-gradient(640px 440px at 84% -18%, rgba(46,124,255,.4), transparent 60%),
        radial-gradient(440px 380px at 4% 124%, rgba(30,90,200,.24), transparent 64%),
        linear-gradient(150deg,#091230 0%,#0B1838 54%,#0A1B42 100%);
      border:1px solid rgba(120,160,255,.22);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.1),inset 0 0 100px rgba(40,110,240,.09),0 30px 72px rgba(8,16,44,.3);color:#fff;}
    .lh-hero__bg{position:absolute;z-index:0;right:0;top:-1px;bottom:-1px;width:56%;pointer-events:none;
      background:url('assets/ascent-lit.png') no-repeat right center;background-size:cover;opacity:.95;
      -webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 46%);mask-image:linear-gradient(90deg,transparent 0%,#000 46%);}
    .lh-hero__main{position:relative;z-index:1;max-width:560px;}
    .lh-hero__eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:11.5px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#9FCBFF;}
    .lh-hero__eyebrow::before{content:'';width:5px;height:5px;border-radius:99px;background:#5CB4FF;box-shadow:0 0 7px rgba(92,180,255,.9);}
    .lh-hero__title{font-family:'Onest',system-ui,sans-serif;font-weight:800;font-size:38px;letter-spacing:-1.5px;line-height:1.04;color:#fff;margin:14px 0 0;text-wrap:balance;max-width:15ch;}
    .lh-hero__say{font-size:15px;line-height:1.55;color:#AEB9DC;margin-top:13px;max-width:42ch;}
    .lh-hero__prog{display:flex;align-items:center;gap:14px;margin-top:24px;max-width:432px;}
    .lh-hero__track{flex:1 1 auto;height:7px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;}
    .lh-hero__fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#5CB4FF,#2073E6);box-shadow:0 0 12px rgba(43,143,255,.6);transition:width .5s cubic-bezier(.23,1,.32,1);}
    .lh-hero__plab{font-size:12.5px;font-weight:600;color:#CFE2FF;font-variant-numeric:tabular-nums;white-space:nowrap;}
    .lh-hero__cta{margin-top:26px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
    .lh-hero__teacher{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:500;color:#8FA0C8;}
    .lh-hero__teacher svg{color:#7FB0FF;} .lh-hero__teacher b{color:#EAF0FF;font-weight:600;}

    /* ── СТРОКА МЕТРИК (одна плашка с разделителями, не «4 карточки») ───────── */
    .lh-strip{display:flex;align-items:stretch;margin-top:18px;padding:22px 8px;border-radius:20px;
      background:linear-gradient(150deg,rgba(255,255,255,.7),rgba(244,247,255,.5));border:1px solid rgba(43,111,224,.14);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 0 30px rgba(43,143,255,.04);}
    .lh-st{flex:1 1 0;padding:0 26px;display:flex;flex-direction:column;justify-content:center;border-right:1px solid rgba(22,32,59,.1);}
    .lh-st:last-child{border-right:0;}
    .lh-st__ic{display:inline-flex;color:var(--sd-acc-deep);margin-bottom:11px;}
    .lh-st__v{font-size:27px;font-weight:800;letter-spacing:-1px;color:#15203B;line-height:1;font-variant-numeric:tabular-nums;}
    .lh-st__v em{font-size:16px;font-weight:700;color:var(--sd-ink-mute);font-style:normal;letter-spacing:-.3px;}
    .lh-st__v.gold{color:#C9923E;}
    .lh-st__k{font-size:12px;font-weight:600;color:var(--sd-ink-mute);margin-top:9px;line-height:1.3;}

    /* ── 2-колоночные ряды ──────────────────────────────────────────────────── */
    .lh-row{display:grid;gap:20px;margin-top:20px;}
    .lh-row--next{grid-template-columns:1.15fr 1fr;}
    .lh-row--tests{grid-template-columns:1.25fr 1fr;}
    .lh-panel{position:relative;overflow:hidden;border-radius:22px;padding:26px 28px;
      background:rgba(255,255,255,.58);border:1px solid rgba(22,32,59,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.85),inset 0 0 40px rgba(255,255,255,.25);}
    .lh-ph{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;}
    .lh-ph__t{font-family:'Onest',system-ui,sans-serif;font-weight:700;font-size:17px;color:#1A2440;letter-spacing:-.3px;}
    .lh-ph__l{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--sd-acc-deep);cursor:pointer;background:0;border:0;font-family:inherit;}
    .lh-ph__l:hover{gap:7px;}

    /* ближайшее занятие — светлая карточка (тёмный режим отдан только герою) */
    .lh-next{position:relative;display:flex;flex-direction:column;min-height:236px;
      background:linear-gradient(150deg,rgba(255,255,255,.74),rgba(242,246,255,.5));
      border:1px solid rgba(43,111,224,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.92),inset 0 0 50px rgba(43,143,255,.05);color:var(--sd-ink);}
    .lh-next__date{position:absolute;right:26px;top:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;width:62px;padding:9px 0;border-radius:14px;
      background:linear-gradient(150deg,var(--sd-acc-2,#5CB4FF),var(--sd-acc-deep));box-shadow:inset 0 1px 0 rgba(255,255,255,.3),0 10px 22px rgba(32,115,230,.24);}
    .lh-next__date b{font-size:21px;font-weight:800;color:#fff;line-height:1;letter-spacing:-.5px;font-variant-numeric:tabular-nums;}
    .lh-next__date span{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.86);margin-top:3px;}
    .lh-next__kick{display:inline-flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sd-acc-deep);}
    .lh-next__kick::before{content:'';width:5px;height:5px;border-radius:99px;background:var(--sd-acc);box-shadow:0 0 7px rgba(43,143,255,.7);}
    .lh-next__when{display:flex;align-items:baseline;gap:11px;margin-top:15px;}
    .lh-next__day{font-size:29px;font-weight:800;letter-spacing:-1px;color:#15203B;}
    .lh-next__time{font-size:17px;font-weight:700;color:var(--sd-acc-deep);font-variant-numeric:tabular-nums;}
    .lh-next__topic{font-size:17px;font-weight:600;color:var(--sd-ink);margin-top:13px;letter-spacing:-.2px;line-height:1.3;max-width:30ch;}
    .lh-next__meta{display:flex;gap:18px;margin-top:14px;flex-wrap:wrap;}
    .lh-next__m{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;color:var(--sd-ink-mute);}
    .lh-next__m svg{color:var(--sd-acc-deep);}
    .lh-next__cta{margin-top:auto;padding-top:22px;}

    /* домашка */
    .lh-hw{display:flex;flex-direction:column;gap:10px;}
    .lh-hwi{display:flex;align-items:center;gap:14px;padding:14px 15px;border-radius:14px;border:1.5px solid transparent;
      background:rgba(255,255,255,.55);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);transition:border-color .15s,background .15s,transform .15s;}
    .lh-hwi__ic{flex:0 0 36px;width:36px;height:36px;border-radius:11px;display:grid;place-items:center;}
    .lh-hwi__b{flex:1 1 auto;min-width:0;}
    .lh-hwi__t{font-size:14px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;line-height:1.3;}
    .lh-hwi__m{font-size:12px;font-weight:500;color:var(--sd-ink-mute);margin-top:3px;}
    .lh-hwi__r{flex:0 0 auto;}
    .lh-hwi.todo{cursor:pointer;border-color:var(--sd-acc-line);background:linear-gradient(150deg,rgba(255,255,255,.95),rgba(238,244,255,.82));
      box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 40px rgba(43,143,255,.1);}
    .lh-hwi.todo:hover{transform:translateY(-1px);}
    .lh-hwi.todo .lh-hwi__ic{color:#fff;background:linear-gradient(150deg,var(--sd-acc),var(--sd-acc-deep));box-shadow:inset 0 0 12px rgba(175,215,255,.55);}
    .lh-hwi.todo .lh-hwi__t{font-weight:700;}
    .lh-hwi.review .lh-hwi__ic{color:var(--sd-acc-deep);background:var(--sd-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,143,255,.18);}
    .lh-hwi.done .lh-hwi__ic{color:#1C7E52;background:#E2F4EA;box-shadow:inset 0 0 0 1px rgba(46,160,110,.3);}
    .lh-hwi.done .lh-hwi__t{color:var(--sd-ink-sub);}
    .lh-hwi.late{cursor:pointer;border-color:rgba(210,96,79,.34);background:rgba(251,231,226,.5);}
    .lh-hwi.late:hover{transform:translateY(-1px);}
    .lh-hwi.late .lh-hwi__ic{color:#fff;background:linear-gradient(150deg,#E2705C,#B23B2A);}
    .lh-hwi.late .lh-hwi__m{color:#B23B2A;}
    .lh-score{display:inline-flex;align-items:center;height:28px;padding:0 11px;border-radius:9px;font-size:13px;font-weight:800;color:#1C7E52;background:#E2F4EA;font-variant-numeric:tabular-nums;}
    .lh-go{color:var(--sd-acc-deep);display:inline-flex;}
    .lh-pill{display:inline-flex;align-items:center;height:26px;padding:0 11px;border-radius:8px;font-size:11.5px;font-weight:700;color:var(--sd-ink-mute);background:rgba(22,32,59,.05);}

    /* результаты тестов */
    .lh-tests{display:flex;flex-direction:column;}
    .lh-tests__top{display:flex;align-items:flex-end;gap:18px;margin-bottom:18px;}
    .lh-tests__big{font-size:46px;font-weight:800;letter-spacing:-2px;color:var(--sd-acc-deep);line-height:.9;font-variant-numeric:tabular-nums;}
    .lh-tests__bigk{font-size:12.5px;font-weight:600;color:var(--sd-ink-mute);margin-bottom:4px;}
    .lh-bars{display:flex;align-items:flex-end;gap:8px;flex:1 1 auto;height:62px;}
    .lh-bar{flex:1 1 0;border-radius:6px 6px 3px 3px;background:rgba(43,143,255,.16);position:relative;min-height:8px;transition:height .4s cubic-bezier(.23,1,.32,1);}
    .lh-bar.hi{background:linear-gradient(180deg,var(--sd-acc-2,#5CB4FF),var(--sd-acc-deep));box-shadow:0 0 12px rgba(43,143,255,.4);}
    .lh-tlist{display:flex;flex-direction:column;}
    .lh-tr{display:flex;align-items:center;gap:12px;padding:11px 2px;border-top:1px solid rgba(22,32,59,.07);}
    .lh-tr:first-child{border-top:0;}
    .lh-tr__b{flex:1 1 auto;min-width:0;}
    .lh-tr__t{font-size:13.5px;font-weight:600;color:var(--sd-ink);letter-spacing:-.1px;}
    .lh-tr__d{font-size:11.5px;color:var(--sd-ink-mute);margin-top:2px;}
    .lh-tr__s{flex:0 0 auto;font-size:15px;font-weight:800;letter-spacing:-.4px;font-variant-numeric:tabular-nums;}
    .lh-tr__s.ok{color:#1C7E52;} .lh-tr__s.mid{color:#C9923E;} .lh-tr__s.acc{color:var(--sd-acc-deep);}

    /* риски */
    .lh-risk{display:flex;flex-direction:column;gap:11px;}
    .lh-rk{display:flex;align-items:center;gap:13px;padding:15px 16px;border-radius:14px;border:1px solid;}
    .lh-rk.warn{background:rgba(251,241,218,.55);border-color:rgba(201,146,62,.28);}
    .lh-rk.info{background:rgba(255,255,255,.55);border-color:rgba(22,32,59,.08);}
    .lh-rk__ic{flex:0 0 34px;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;}
    .lh-rk.warn .lh-rk__ic{color:#9A6A12;background:rgba(245,200,76,.22);}
    .lh-rk.info .lh-rk__ic{color:var(--sd-acc-deep);background:var(--sd-acc-soft);}
    .lh-rk__t{flex:1 1 auto;font-size:13.5px;font-weight:600;color:var(--sd-ink);line-height:1.4;}
    .lh-rk.warn .lh-rk__t{color:#7A5712;}
    .lh-rk__cta{flex:0 0 auto;font-size:12.5px;font-weight:700;color:var(--sd-acc-deep);cursor:pointer;background:0;border:0;font-family:inherit;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;}
    .lh-allok{display:flex;align-items:center;gap:12px;padding:16px;border-radius:14px;background:rgba(224,243,234,.5);border:1px solid rgba(46,160,110,.24);color:#1C7E52;font-size:13.5px;font-weight:600;}

    /* расписание */
    .lh-sched{display:flex;flex-direction:column;gap:10px;}
    .lh-se{display:flex;align-items:center;gap:16px;padding:15px 18px;border-radius:15px;background:rgba(255,255,255,.55);border:1px solid rgba(22,32,59,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.7);transition:border-color .15s,transform .15s;}
    .lh-se.next{border-color:var(--sd-acc-line);background:linear-gradient(150deg,rgba(255,255,255,.92),rgba(238,244,255,.7));}
    .lh-se__date{flex:0 0 88px;display:flex;flex-direction:column;align-items:center;justify-content:center;width:88px;padding:8px 0;border-radius:12px;background:rgba(43,143,255,.07);}
    .lh-se.next .lh-se__date{background:linear-gradient(150deg,var(--sd-acc),var(--sd-acc-deep));}
    .lh-se__day{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--sd-acc-deep);}
    .lh-se.next .lh-se__day{color:#fff;}
    .lh-se__dnum{font-size:14px;font-weight:700;color:var(--sd-ink);margin-top:2px;}
    .lh-se.next .lh-se__dnum{color:#fff;}
    .lh-se__b{flex:1 1 auto;min-width:0;}
    .lh-se__t{font-size:15px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;}
    .lh-se__m{font-size:12.5px;color:var(--sd-ink-mute);margin-top:3px;font-variant-numeric:tabular-nums;}
    .lh-se__r{flex:0 0 auto;}
    .lh-se__badge{font-size:11px;font-weight:700;color:#fff;background:var(--sd-acc-deep);padding:5px 10px;border-radius:8px;}

    /* связь: куратор + родитель */
    .lh-link{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    .lh-lc{display:flex;align-items:center;gap:15px;padding:20px 22px;border-radius:18px;cursor:pointer;
      background:rgba(255,255,255,.58);border:1px solid rgba(22,32,59,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:border-color .15s,transform .15s;}
    .lh-lc:hover{border-color:var(--sd-acc-line);transform:translateY(-1px);}
    .lh-lc__av{flex:0 0 48px;width:48px;height:48px;border-radius:14px;display:grid;place-items:center;font-weight:800;font-size:18px;color:#fff;
      background:linear-gradient(150deg,var(--sd-acc-2,#5CB4FF),var(--sd-acc-deep));box-shadow:inset 0 0 14px rgba(175,215,255,.5);}
    .lh-lc__av.parent{background:linear-gradient(150deg,#8FA0C8,#4A5C8E);box-shadow:none;}
    .lh-lc__b{flex:1 1 auto;min-width:0;}
    .lh-lc__t{font-size:15px;font-weight:700;color:var(--sd-ink);letter-spacing:-.2px;}
    .lh-lc__s{font-size:12.5px;color:var(--sd-ink-mute);margin-top:3px;line-height:1.4;}
    .lh-lc__go{flex:0 0 auto;color:var(--sd-ink-mute);display:inline-flex;}
    .lh-lc:hover .lh-lc__go{color:var(--sd-acc-deep);}

    /* тихая дверь в конструктор */
    .lh-teacher{margin-top:30px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:12.5px;color:var(--sd-ink-mute);}
    .lh-teacher button{font-family:inherit;font-size:12.5px;font-weight:700;color:var(--sd-acc-deep);background:0;border:0;cursor:pointer;display:inline-flex;align-items:center;gap:5px;}
    .lh-teacher button:hover{text-decoration:underline;}

    @media (max-width:980px){
      .lh-row--next,.lh-row--tests,.lh-link{grid-template-columns:1fr;}
      .lh-hero{flex-direction:column;align-items:flex-start;} .lh-hero__bg{opacity:.4;}
      .lh-strip{flex-wrap:wrap;gap:18px 0;} .lh-st{flex:1 1 50%;border-right:0;}
    }`;
    document.head.appendChild(el);
  }

  const scoreCls = (s) => s >= 85 ? 'ok' : s >= 75 ? 'acc' : 'mid';

  function Hero() {
    return h('section', { className: 'lh-hero' },
      h('div', { className: 'lh-hero__bg' }),
      h('div', { className: 'lh-hero__main' },
        h('div', { className: 'lh-hero__eyebrow' }, 'Ваш курс · ' + COURSE.tariff.split(' · ')[0]),
        h('h1', { className: 'lh-hero__title' }, COURSE.name),
        h('p', { className: 'lh-hero__say' }, COURSE.say),
        h('div', { className: 'lh-hero__prog' },
          h('div', { className: 'lh-hero__track' }, h('div', { className: 'lh-hero__fill', style: { width: COURSE.pct + '%' } })),
          h('span', { className: 'lh-hero__plab' }, COURSE.pct + '% пройдено · до цели HSK 4')),
        h('div', { className: 'lh-hero__cta' },
          h('button', { type: 'button', className: 'sd-btn sd-btn--primary', onClick: () => nav('/learn/lesson') }, 'Продолжить урок', arr()),
          h('span', { className: 'lh-hero__teacher' }, Ic.User ? h(Ic.User, { size: 15 }) : null, 'Преподаватель: ', h('b', null, COURSE.teacher)))));
  }

  function Strip() {
    const st = (icon, v, k, gold) => h('div', { className: 'lh-st' },
      h('span', { className: 'lh-st__ic' }, icon ? h(icon, { size: 19 }) : null),
      h('div', { className: 'lh-st__v' + (gold ? ' gold' : '') }, v),
      h('div', { className: 'lh-st__k' }, k));
    return h('div', { className: 'lh-strip' },
      st(Ic.Calendar, [COURSE.lessonsLeft, h('em', { key: 'e' }, ' из ' + COURSE.lessonsTotal)], 'Занятий осталось'),
      st(Ic.TrendUp, COURSE.pct + '%', 'Прогресс курса'),
      st(Ic.CheckCircle, COURSE.testAvg, 'Средний балл тестов'),
      st(Ic.Bolt, [COURSE.streak, h('em', { key: 'e' }, ' дней')], 'Серия без пропусков'));
  }

  function NextAndHomework() {
    const n = COURSE.next;
    const hwIcon = (s) => s === 'todo' ? Ic.Spark : s === 'review' ? Ic.Hourglass : s === 'done' ? Ic.Check : Ic.AlertTriangle;
    const goLesson = () => nav('/learn/lesson');
    return h('div', { className: 'lh-row lh-row--next' },
      // ближайшее занятие
      h('div', { className: 'lh-panel lh-next' },
        h('div', { className: 'lh-next__date' },
          h('b', null, n.date.split(' ')[0]),
          h('span', null, n.date.split(' ')[1] || '')),
        h('div', { className: 'lh-next__kick' }, 'Ближайшее занятие'),
        h('div', { className: 'lh-next__when' },
          h('span', { className: 'lh-next__day' }, n.day),
          h('span', { className: 'lh-next__time' }, n.time)),
        h('div', { className: 'lh-next__topic' }, n.topic),
        h('div', { className: 'lh-next__meta' },
          h('span', { className: 'lh-next__m' }, Ic.Monitor ? h(Ic.Monitor, { size: 15 }) : null, n.format),
          h('span', { className: 'lh-next__m' }, Ic.User ? h(Ic.User, { size: 15 }) : null, n.teacher)),
        h('div', { className: 'lh-next__cta' },
          h('button', { type: 'button', className: 'sd-btn sd-btn--primary', onClick: goLesson }, 'Войти в урок', arr()))),
      // домашка
      h('div', { className: 'lh-panel' },
        h('div', { className: 'lh-ph' },
          h('div', { className: 'lh-ph__t' }, 'Домашние задания'),
          h('span', { className: 'lh-pill' }, '1 активное')),
        h('div', { className: 'lh-hw' }, COURSE.homework.map((hw, i) => {
          const clickable = hw.status === 'todo' || hw.status === 'late';
          return h('div', { key: i, className: 'lh-hwi ' + hw.status, onClick: clickable ? goLesson : undefined },
            h('span', { className: 'lh-hwi__ic' }, (hwIcon(hw.status)) ? h(hwIcon(hw.status), { size: 17, strokeWidth: hw.status === 'done' ? 2.6 : 1.8 }) : null),
            h('div', { className: 'lh-hwi__b' },
              h('div', { className: 'lh-hwi__t' }, hw.title),
              h('div', { className: 'lh-hwi__m' }, hw.meta)),
            h('div', { className: 'lh-hwi__r' },
              hw.status === 'done' ? h('span', { className: 'lh-score' }, hw.score)
                : clickable ? h('span', { className: 'lh-go' }, Ic.ChevronRight ? h(Ic.ChevronRight, { size: 18 }) : '›')
                  : h('span', { className: 'lh-pill' }, 'ждёт')));
        }))));
  }

  function TestsAndRisks() {
    const max = Math.max.apply(null, COURSE.tests.map((t) => t.score));
    const last = COURSE.tests[0];
    return h('div', { className: 'lh-row lh-row--tests' },
      // тесты
      h('div', { className: 'lh-panel' },
        h('div', { className: 'lh-ph' },
          h('div', { className: 'lh-ph__t' }, 'Результаты тестов'),
          h('button', { type: 'button', className: 'lh-ph__l', onClick: () => SH.onNav({ label: 'Диагностика', to: '/diagnostics' }) }, 'Все', arr(13))),
        h('div', { className: 'lh-tests' },
          h('div', { className: 'lh-tests__top' },
            h('div', null,
              h('div', { className: 'lh-tests__bigk' }, 'Последний тест'),
              h('div', { className: 'lh-tests__big' }, last.score)),
            h('div', { className: 'lh-bars' }, COURSE.tests.slice().reverse().map((t, i) =>
              h('div', { key: i, className: 'lh-bar' + (t.score === max ? ' hi' : ''), style: { height: Math.round(28 + (t.score / 100) * 34) + 'px' }, title: t.name + ': ' + t.score })))),
          h('div', { className: 'lh-tlist' }, COURSE.tests.map((t, i) => h('div', { key: i, className: 'lh-tr' },
            h('div', { className: 'lh-tr__b' },
              h('div', { className: 'lh-tr__t' }, t.name),
              h('div', { className: 'lh-tr__d' }, t.date)),
            h('div', { className: 'lh-tr__s ' + scoreCls(t.score) }, t.score)))))),
      // риски
      h('div', { className: 'lh-panel' },
        h('div', { className: 'lh-ph' }, h('div', { className: 'lh-ph__t' }, 'На что обратить внимание')),
        COURSE.risks.length
          ? h('div', { className: 'lh-risk' }, COURSE.risks.map((r, i) => h('div', { key: i, className: 'lh-rk ' + r.kind },
            h('span', { className: 'lh-rk__ic' }, (r.kind === 'warn' ? Ic.AlertTriangle : Ic.Info) ? h(r.kind === 'warn' ? Ic.AlertTriangle : Ic.Info, { size: 18 }) : '!'),
            h('span', { className: 'lh-rk__t' }, r.text),
            h('button', { type: 'button', className: 'lh-rk__cta', onClick: () => nav('/learn/lesson') }, r.cta, arr(13)))))
          : h('div', { className: 'lh-allok' }, Ic.CheckCircle ? h(Ic.CheckCircle, { size: 19 }) : '✓', 'Всё под контролем — рисков нет')));
  }

  function Schedule() {
    return h('section', { className: 'sd-sec' },
      h('div', { className: 'sd-sec__head' },
        h('h3', { className: 'sd-sec__title' }, 'Расписание'),
        h('span', { style: { fontSize: '13px', fontWeight: 500, color: 'var(--sd-ink-mute)' } }, 'Ближайшие занятия')),
      h('div', { className: 'lh-sched' }, COURSE.schedule.map((s, i) => h('div', { key: i, className: 'lh-se' + (s.next ? ' next' : '') },
        h('div', { className: 'lh-se__date' },
          h('div', { className: 'lh-se__day' }, s.day),
          h('div', { className: 'lh-se__dnum' }, s.date.split(' ')[0])),
        h('div', { className: 'lh-se__b' },
          h('div', { className: 'lh-se__t' }, s.topic),
          h('div', { className: 'lh-se__m' }, s.date + ' · ' + s.time)),
        h('div', { className: 'lh-se__r' }, s.next
          ? h('button', { type: 'button', className: 'lh-se__badge', onClick: () => nav('/learn/lesson'), style: { cursor: 'pointer' } }, 'Войти')
          : h('span', { className: 'lh-pill' }, '50 мин'))))));
  }

  function AiTutor() {
    return h('section', { className: 'sd-sec' },
      h('div', { className: 'sd-aibn', onClick: () => SH.openChat({ label: 'AI-тьютор по китайскому' }) },
        h('div', { className: 'sd-aibn__c' },
          h('div', { className: 'sd-aibn__kick' }, 'AI-тьютор'),
          h('div', { className: 'sd-aibn__t' }, 'Спросите о любом слове или тоне'),
          h('div', { className: 'sd-aibn__d' }, 'Забыли иероглиф, не дался тон, непонятна грамматика урока — разберём прямо сейчас. Тьютор знает, на каком вы уроке, и объясняет на вашем уровне.'),
          h('button', { type: 'button', className: 'sd-btn sd-btn--primary', onClick: (e) => { e.stopPropagation(); SH.openChat({ label: 'AI-тьютор по китайскому' }); } }, 'Спросить тьютора', arr())),
        h('img', { className: 'sd-aibn__img', src: 'assets/robot-ai.png', alt: '' })));
  }

  function Connect() {
    return h('section', { className: 'sd-sec' },
      h('div', { className: 'sd-sec__head' }, h('h3', { className: 'sd-sec__title' }, 'Кто рядом')),
      h('div', { className: 'lh-link' },
        h('div', { className: 'lh-lc', onClick: () => SH.onNav({ label: 'Куратор' }) },
          h('span', { className: 'lh-lc__av' }, 'А'),
          h('div', { className: 'lh-lc__b' },
            h('div', { className: 'lh-lc__t' }, 'Анна · ваш куратор'),
            h('div', { className: 'lh-lc__s' }, 'Ведёт вас по курсу, поможет с расписанием и оплатой')),
          h('span', { className: 'lh-lc__go' }, Ic.Chat ? h(Ic.Chat, { size: 20 }) : '›')),
        h('div', { className: 'lh-lc', onClick: () => nav('/parent') },
          h('span', { className: 'lh-lc__av parent' }, Ic.Users ? h(Ic.Users, { size: 22 }) : 'Р'),
          h('div', { className: 'lh-lc__b' },
            h('div', { className: 'lh-lc__t' }, 'Кабинет родителя'),
            h('div', { className: 'lh-lc__s' }, 'Родитель видит ваш прогресс, тесты и оплаты')),
          h('span', { className: 'lh-lc__go' }, Ic.ArrowUpRight ? h(Ic.ArrowUpRight, { size: 19 }) : '›'))));
  }

  function TeacherDoor() {
    return h('div', { className: 'lh-teacher' },
      'Вы преподаватель?',
      h('button', { type: 'button', onClick: () => nav('/learn/build') }, Ic.Edit ? h(Ic.Edit, { size: 14 }) : null, 'Открыть конструктор урока'));
  }

  function LearnHub() {
    if (!SH) return h('div', { style: { padding: 40, color: '#fff' } }, 'Скелет ученика не загружен');
    injectCSS();
    return h(SH.Shell, { active: 'learn', surface: 'light', hideTopBar: true },
      h('div', { className: 'lh-wrap' },
        h(Hero, null),
        h(Strip, null),
        h(NextAndHomework, null),
        h(TestsAndRisks, null),
        h(Schedule, null),
        h(AiTutor, null),
        h(Connect, null),
        h(TeacherDoor, null)));
  }

  (window.EScreens = window.EScreens || {}).LearnHub = LearnHub;
})();
