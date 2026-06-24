/* ============================================================================
   EastSide — Кабинет ученика · ДЕТАЛИ ЭТАПА (вариант B, window.EScreens.StudentStageB · #/stage-b)
   ----------------------------------------------------------------------------
   Написано с нуля как конкурент к student-stage.jsx. Подход: чистое светлое
   полотно (Режим B), ОДИН тёмный атмосферный якорь — компактный медальон с
   кольцом прогресса и пиком, а не широкий тёмный баннер. Дальше всё светлое и
   тихое. Сапфир — единственный акцент; статус — словом/иконкой/весом, без
   радуги. Типографика плотная: eyebrow без огромного трекинга, заголовки на
   минус-трекинге с балансом, цифры табличные.

   Структура: 1) шапка (номер, название, статус, прогресс + медальон-якорь)
   2) «О чём этап» — редакторский лид с раскрытием (внутри «важно учесть»)
   3) задачи роадмапом — инлайн-аккордеон 4) полезное по этапу.

   Контракты не тронуты: SH = window.ESStudentShell, данные те же по фактам.
   Доп-CSS под префиксом .sg- (guard es-stage-b-css). База .sd- — из шелла.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = window.React || React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const Ic = window.EIcons || {};
  const SH = window.ESStudentShell;
  const ic = (name, props) => (Ic[name] ? h(Ic[name], props || {}) : null);
  const goHome = () => SH.onNav({ label: 'Главная', to: '/student' });

  /* ── Данные этапа (те же факты). status: 'ok' | 'urgent' | 'late' ───────── */
  const STAGE = {
    n: 3, total: 8, title: 'Сбор документов', pct: 40, daysLeft: 7, deadline: '28 июня',
    status: 'urgent', peak: 'assets/mountain-peak.png',
    lead: 'Собираем полный пакет документов под требования гранта CSC и проверяем каждый файл перед подачей — чтобы заявку приняли с первого раза.',
    full: [
      'На этом этапе мы готовим все, что комиссия CSC потребует от тебя при подаче: аттестат с оценками, сертификат HSK, медсправку по форме CSC, фото на документы, скан паспорта, мотивационное и рекомендательные письма.',
      'Самое важное здесь — собрать пакет заранее и без брака. Каждый документ проверяется под формат гранта: неверная форма справки или фото не по стандарту приводят к возврату и потере времени, а окно подачи открывается раз в год.',
      'На выходе у тебя готовый, проверенный пакет, который мы подаем на грант от твоего имени. Сейчас от тебя нужны два документа, остальное мы берем на себя.',
    ],
  };

  // «Важно учесть» — планирование (внутри раскрытия «О чём этап»).
  const PLAN = [
    { ic: 'Calendar', t: 'Окно подачи открывается раз в год', d: 'Заявки на грант CSC принимают весной, обычно до конца апреля — июня в зависимости от вуза. Пропустишь окно — ждать следующий набор.' },
    { ic: 'Clock', t: 'Часть документов делается заранее', d: 'Медсправка по форме CSC действительна ограниченный срок, а перевод и заверение занимают время. Закладывай 1-2 недели на оформление.' },
    { ic: 'Lock', t: 'Готовь пакет до старта подачи', d: 'Подачу мы запускаем только с полным проверенным пакетом. Чем раньше загрузишь свои документы, тем спокойнее пройдем дедлайн.' },
  ];

  // ВСЕ задачи этапа роадмапом. owner: 'you'|'us', status: 'done'|'current'|'upcoming'
  const TASKS = [
    { owner: 'us', status: 'done', title: 'Проверили аттестат и оценки', meta: 'Принят и заверен, добавлен в пакет',
      desc: 'Аттестат с приложением оценок принят, заверен и уже лежит в пакете на подачу. От тебя по нему ничего не нужно.' },
    {
      owner: 'you', status: 'current', dl: 'завтра', dlState: 'late', time: '5-10 минут на загрузку',
      title: 'Переоформить медсправку',
      meta: 'Старую справку не приняли — нужна новая по форме CSC',
      why: 'Старую справку не приняли — нужна новая по форме CSC с переводом.',
      desc: 'Нужна новая медсправка по форме CSC (Foreigner Physical Examination Form) с печатями и переводом. Сделай в клинике, потом загрузи фото или скан — проверим за 1-2 дня и добавим в пакет.',
      cta: 'Открыть задачу',
      flow: [
        { t: 'Получаешь справку в клинике', s: 'По форме CSC, с переводом' },
        { t: 'Загружаешь сюда', s: 'Фото или скан' },
        { t: 'Проверяем и добавляем в пакет', s: 'Обычно 1-2 дня' },
      ],
    },
    {
      owner: 'us', status: 'current', usDoing: true,
      title: 'Готовим черновик мотивационного письма',
      meta: 'Соберем по твоей анкете, пришлем на правку',
      desc: 'На основе твоей анкеты и выбранной программы готовим черновик мотивационного письма под формат CSC. Пришлем текст — ты сможешь дополнить и поправить под себя.',
    },
    {
      owner: 'you', status: 'upcoming', dl: '28 июня', dlState: 'ok', time: '5 минут',
      title: 'Загрузить фото 33x48',
      meta: 'Откроется после медсправки',
      desc: 'Фото 33x48 мм: строго белый фон, ровный свет, нейтральное выражение лица, без аксессуаров. Можно переснять на телефон по инструкции.',
      cta: 'Загрузить фото',
      flow: [{ t: 'Ты загружаешь фото' }, { t: 'Мы проверяем', s: 'Скажем сразу, если надо переснять' }],
    },
    {
      owner: 'you', status: 'upcoming', dl: '28 июня', dlState: 'ok', time: '3 минуты',
      title: 'Загрузить скан паспорта',
      meta: 'Откроется после медсправки',
      desc: 'Цветной скан или четкое фото разворота с фотографией. Без бликов и обрезанных краев.',
      cta: 'Загрузить скан',
      flow: [{ t: 'Ты загружаешь скан' }, { t: 'Мы проверяем' }],
    },
    { owner: 'us', status: 'upcoming', title: 'Проверка пакета и подача на грант', meta: 'Запустим, когда пакет будет готов',
      desc: 'Проверим все документы, соберем пакет и подадим заявку на грант CSC от твоего имени.' },
  ];

  const KNOW = [
    { cap: 'Документы', title: 'Как сделать идеальное фото на документы', dur: '5 мин чтения', icon: Ic.User, image: 'assets/mountain-light.png',
      body: ['Формат 33x48 мм: белый фон, нейтральное выражение, без аксессуаров.', 'Снимай днем у окна, без вспышки и резких теней.', 'Загрузи в задаче — проверим за пару часов.'] },
    { cap: 'Документы', title: 'Почему отклоняют медсправку и как этого избежать', dur: '4 мин чтения', icon: Ic.AlertCircle, image: 'assets/cosmos.png',
      body: ['Чаще всего из-за неверной формы, отсутствия перевода или просроченных анализов.', 'Для CSC нужна справка по их форме с печатями и переводом.', 'Сомневаешься — пришли фото, подскажем до визита в клинику.'] },
    { cap: 'Грант CSC', title: 'Как проходит подача на грант', dur: '6 мин чтения', icon: Ic.Doc, image: 'assets/ascent-night.png',
      body: ['Подача идет через университет или провинцию. Готовим пакет и подаем от твоего имени.', 'Сроки строгие — документы важно собрать заранее.', 'После подачи ждем решения комиссии, держим тебя в курсе.'] },
  ];

  const taskOf = (t) => Object.assign({}, t, { side: t.owner === 'us' ? 'us' : 'you', desc: t.desc || t.why });
  const two = (n) => (n < 10 ? '0' + n : '' + n);

  /* ── Доп-CSS (один раз, guard по id) ────────────────────────────────────── */
  function injectCSS() {
    if (document.getElementById('es-stage-b-css')) return;
    const el = document.createElement('style');
    el.id = 'es-stage-b-css';
    el.textContent = `
    /* ── Назад — тихая кнопка на светлом ───────────────────────────────────── */
    .sg-back{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--sd-ink-mute);
      background:0;border:0;border-radius:11px;padding:8px 12px 8px 8px;cursor:pointer;margin:0 0 0 -8px;
      transition:transform .16s cubic-bezier(.23,1,.32,1),color .16s;}
    .sg-back:hover{color:var(--sd-ink);} .sg-back svg{transition:transform .16s cubic-bezier(.23,1,.32,1);}
    .sg-back:hover svg{transform:translateX(-3px);}

    /* ── Шапка: слева смысл, справа ОДИН тёмный медальон-якорь ─────────────── */
    .sg-head{display:flex;gap:30px;align-items:stretch;margin-top:16px;}
    .sg-head__l{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;}
    .sg-eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--sd-acc-deep);}
    .sg-eyebrow b{color:var(--sd-ink);font-variant-numeric:tabular-nums;}
    .sg-eyebrow s{color:var(--sd-ink-faint,rgba(22,32,59,.3));text-decoration:none;font-weight:600;}
    .sg-eyebrow .sg-dot{width:3px;height:3px;border-radius:50%;background:var(--sd-ink-faint,rgba(22,32,59,.32));}
    .sg-eyebrow .sg-mute{color:var(--sd-ink-mute);font-weight:600;letter-spacing:.04em;}
    .sg-title{font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;font-weight:700;font-size:42px;letter-spacing:-1.7px;
      line-height:1.03;color:var(--sd-ink);margin:14px 0 0;text-wrap:balance;}
    .sg-status{display:inline-flex;align-items:center;gap:10px;margin-top:18px;font-size:15px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;}
    .sg-status__ic{width:22px;height:22px;flex:0 0 22px;display:inline-flex;align-items:center;justify-content:center;color:var(--sd-acc-deep);}
    .sg-status.late .sg-status__ic,.sg-status.urgent .sg-status__ic{color:var(--sd-rose);}
    .sg-now{font-size:14px;line-height:1.5;color:var(--sd-ink-sub);margin-top:11px;max-width:48ch;}
    .sg-now b{color:var(--sd-ink);font-weight:600;}
    /* прогресс-метр + мета — тихо, у низа левой колонки */
    .sg-meter{margin-top:auto;padding-top:28px;}
    .sg-meter__track{height:6px;border-radius:99px;background:rgba(22,32,59,.08);overflow:hidden;}
    .sg-meter__fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--sd-acc-2),var(--sd-acc-deep));
      box-shadow:0 0 10px rgba(43,143,255,.5);}
    .sg-meta{display:flex;align-items:center;gap:14px;margin-top:13px;font-size:13px;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
    .sg-meta b{color:var(--sd-ink);font-weight:600;}
    .sg-meta .sg-mdot{width:3px;height:3px;border-radius:50%;background:rgba(22,32,59,.24);}
    .sg-meta .late{color:var(--sd-rose);font-weight:600;}

    /* медальон-якорь — единственный тёмный блок экрана */
    .sg-orb{position:relative;overflow:hidden;flex:0 0 256px;width:256px;border-radius:26px;display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:30px 24px 26px;color:#fff;text-align:center;
      background:linear-gradient(150deg,#0A1126 0%,#0B1430 56%,#0C1A3C 100%);
      border:1px solid rgba(120,160,255,.22);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.1),inset 0 0 90px rgba(40,110,240,.14),0 24px 56px rgba(8,16,44,.3);}
    .sg-orb__glow{position:absolute;inset:0;z-index:0;pointer-events:none;
      background:radial-gradient(420px 320px at 50% -10%,rgba(46,130,255,.34),transparent 64%);}
    .sg-orb__stars{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.55;
      background-image:
        radial-gradient(1.3px 1.3px at 22% 26%,rgba(255,255,255,.9),transparent),
        radial-gradient(1.1px 1.1px at 70% 18%,rgba(190,215,255,.8),transparent),
        radial-gradient(1px 1px at 42% 64%,rgba(255,255,255,.6),transparent),
        radial-gradient(1.2px 1.2px at 84% 54%,rgba(200,222,255,.6),transparent);}
    .sg-orb__peak{position:absolute;z-index:1;bottom:-12px;left:50%;transform:translateX(-50%);width:190px;pointer-events:none;opacity:.55;
      filter:drop-shadow(0 16px 32px rgba(0,8,36,.5));
      -webkit-mask-image:linear-gradient(180deg,#000 70%,transparent);mask-image:linear-gradient(180deg,#000 70%,transparent);}
    .sg-orb__ring{position:relative;z-index:2;}
    .sg-orb__cap{position:relative;z-index:2;margin-top:16px;}
    .sg-orb__cw{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#AFC4EE;}
    .sg-orb__cs{font-size:12.5px;color:rgba(190,205,238,.7);margin-top:4px;line-height:1.4;font-variant-numeric:tabular-nums;}

    /* ── О чём этап — редакторский лид + тихое раскрытие ───────────────────── */
    .sg-about{margin-top:52px;}
    .sg-eb{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--sd-acc-deep);margin-bottom:15px;}
    .sg-lead{font-size:21px;font-weight:500;line-height:1.5;color:var(--sd-ink);letter-spacing:-.4px;max-width:64ch;text-wrap:balance;margin:0;}
    .sg-more{overflow:hidden;max-height:0;opacity:0;transition:max-height .28s cubic-bezier(.23,1,.32,1),opacity .2s ease;}
    .sg-more.open{max-height:1400px;opacity:1;}
    .sg-more p{font-size:15px;line-height:1.68;color:var(--sd-ink-sub);margin:15px 0 0;max-width:72ch;}
    .sg-more p:first-child{margin-top:24px;}
    /* «важно учесть» внутри раскрытия — тихий список на хайрлайнах */
    .sg-plan{margin-top:26px;border-top:1px solid var(--sd-line);padding-top:8px;}
    .sg-plan__row{display:flex;gap:15px;align-items:flex-start;padding:17px 0;border-bottom:1px solid var(--sd-line);}
    .sg-plan__row:last-child{border-bottom:0;}
    .sg-plan__ic{width:32px;height:32px;flex:0 0 32px;border-radius:10px;display:grid;place-items:center;color:var(--sd-acc-deep);margin-top:1px;
      background:var(--sd-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,143,255,.14);}
    .sg-plan__t{font-size:14.5px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;line-height:1.3;}
    .sg-plan__d{font-size:13px;color:var(--sd-ink-sub);line-height:1.55;margin-top:5px;max-width:70ch;}
    .sg-toggle{margin-top:22px;display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;color:var(--sd-acc-deep);
      background:0;border:0;cursor:pointer;padding:0;transition:opacity .15s;}
    .sg-toggle:hover{opacity:.7;} .sg-toggle svg{transition:transform .2s cubic-bezier(.23,1,.32,1);}
    .sg-toggle.open svg{transform:rotate(180deg);}

    /* ── Задачи — аккордеон на сквозном таймлайне ──────────────────────────── */
    .sg-rm{position:relative;display:flex;flex-direction:column;}
    .sg-rm::before{content:'';position:absolute;z-index:0;left:19px;top:26px;bottom:26px;width:2.5px;border-radius:2px;
      background:linear-gradient(180deg,var(--sd-acc) 0%,var(--sd-acc) var(--sg-fill,30%),rgba(22,32,59,.1) var(--sg-fill,30%),rgba(22,32,59,.1) 100%);}
    .sg-row{position:relative;z-index:1;display:flex;gap:18px;align-items:flex-start;}
    .sg-rail{flex:0 0 40px;display:flex;justify-content:center;}
    .sg-node{width:38px;height:38px;flex:0 0 38px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:15px;
      font-size:13.5px;font-weight:700;font-variant-numeric:tabular-nums;background:#fff;color:var(--sd-ink-mute);
      border:1.5px solid rgba(22,32,59,.14);box-shadow:0 0 0 5px #FAFBFF;}
    .sg-row.done .sg-node{color:var(--sd-acc-deep);border-color:var(--sd-acc-line);box-shadow:0 0 0 5px #FAFBFF,0 0 0 6px rgba(43,143,255,.04);}
    .sg-row.current .sg-node{color:#fff;border:0;background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));
      box-shadow:0 0 0 5px #FAFBFF,0 0 18px rgba(43,143,255,.5);margin-top:18px;}
    .sg-row.upcoming .sg-node{background:#EAEEF8;color:#8089A8;border:0;box-shadow:0 0 0 5px #FAFBFF;}

    .sg-card{flex:1 1 auto;min-width:0;margin-bottom:14px;border-radius:18px;overflow:hidden;
      background:rgba(255,255,255,.56);border:1px solid rgba(22,32,59,.07);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:border-color .16s,box-shadow .16s,transform .16s;}
    .sg-row:last-child .sg-card{margin-bottom:0;}
    .sg-row.upcoming .sg-card{background:rgba(255,255,255,.4);box-shadow:none;}
    .sg-row.current .sg-card{margin-bottom:18px;border:1.5px solid var(--sd-acc-line);
      background:linear-gradient(150deg,rgba(255,255,255,.9),rgba(244,247,255,.74));
      -webkit-backdrop-filter:blur(18px) saturate(140%);backdrop-filter:blur(18px) saturate(140%);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 44px rgba(43,143,255,.09),0 18px 44px rgba(43,111,224,.12);}
    .sg-head2{display:flex;align-items:center;gap:18px;padding:18px 22px;cursor:pointer;}
    .sg-row.current .sg-head2{padding:22px 26px 20px;}
    .sg-card__b{flex:1 1 auto;min-width:0;}
    .sg-lead2{display:inline-flex;align-items:center;gap:8px;margin-bottom:9px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;}
    .sg-lead2__ic{width:20px;height:20px;flex:0 0 20px;border-radius:7px;display:grid;place-items:center;}
    .sg-lead2.you .sg-lead2__ic{color:#fff;background:linear-gradient(150deg,var(--sd-acc),var(--sd-acc-deep));}
    .sg-lead2.us .sg-lead2__ic{color:var(--sd-acc-deep);background:var(--sd-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,143,255,.16);}
    .sg-lead2.done .sg-lead2__ic{color:var(--sd-jade);background:rgba(46,160,110,.12);box-shadow:inset 0 0 0 1px rgba(46,160,110,.2);}
    .sg-lead2.you .sg-lead2__w{color:var(--sd-acc-deep);}
    .sg-lead2.us .sg-lead2__w{color:var(--sd-ink-mute);}
    .sg-lead2.done .sg-lead2__w{color:#1C7E52;}
    .sg-row.current.late .sg-lead2.you .sg-lead2__w{color:var(--sd-rose);}
    .sg-row.current.late .sg-lead2.you .sg-lead2__ic{background:linear-gradient(150deg,#E2786A,#A83A2A);}
    .sg-card__t{font-size:16.5px;font-weight:600;color:var(--sd-ink);letter-spacing:-.3px;line-height:1.25;text-wrap:balance;}
    .sg-row.current .sg-card__t{font-size:19px;letter-spacing:-.5px;}
    .sg-row.upcoming .sg-card__t{color:var(--sd-ink-mute);font-weight:500;}
    .sg-card__m{font-size:13px;color:var(--sd-ink-mute);margin-top:6px;line-height:1.5;max-width:60ch;}
    .sg-card__m.late{color:var(--sd-rose);font-weight:600;}
    /* правый аффорданс: шеврон / замок / галочка */
    .sg-aff{flex:0 0 auto;display:inline-flex;align-items:center;color:var(--sd-ink-mute);}
    .sg-aff__chev{transition:transform .24s cubic-bezier(.23,1,.32,1);}
    .sg-card.open .sg-aff__chev{transform:rotate(180deg);}
    .sg-check{width:30px;height:30px;flex:0 0 30px;border-radius:10px;display:grid;place-items:center;color:var(--sd-jade);
      background:rgba(46,160,110,.12);box-shadow:inset 0 0 0 1px rgba(46,160,110,.2);}
    .sg-lock{color:var(--sd-ink-faint,rgba(22,32,59,.3));display:inline-flex;}
    /* тело аккордеона */
    .sg-body{max-height:0;opacity:0;overflow:hidden;transition:max-height .3s cubic-bezier(.23,1,.32,1),opacity .22s ease;}
    .sg-body.open{max-height:640px;opacity:1;}
    .sg-bin{padding:0 22px 22px;}
    .sg-row.current .sg-bin{padding:0 26px 24px;}
    .sg-bin__div{height:1px;background:var(--sd-line);margin-bottom:16px;}
    .sg-desc{font-size:14px;line-height:1.62;color:var(--sd-ink-sub);max-width:70ch;}
    .sg-steps{margin-top:16px;display:flex;flex-direction:column;gap:2px;}
    .sg-step{display:flex;gap:13px;align-items:flex-start;padding:9px 0;}
    .sg-step__n{width:22px;height:22px;flex:0 0 22px;border-radius:50%;display:grid;place-items:center;margin-top:1px;
      font-size:11.5px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--sd-acc-deep);
      background:var(--sd-acc-soft);box-shadow:inset 0 0 0 1px rgba(43,143,255,.18);}
    .sg-step__t{font-size:13.5px;font-weight:500;color:var(--sd-ink);line-height:1.35;}
    .sg-step__s{font-size:12.5px;color:var(--sd-ink-mute);margin-top:2px;line-height:1.4;}
    .sg-act{margin-top:18px;}
    .sg-note{margin-top:16px;display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--sd-ink-mute);}
    .sg-note svg{color:var(--sd-ink-faint,rgba(22,32,59,.3));}

    /* ── Вопрос по этапу — тихая светлая плашка ─────────────────────────────── */
    .sg-ask{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:24px;
      border-radius:20px;padding:22px 26px;
      background:linear-gradient(150deg,rgba(255,255,255,.66),rgba(241,245,255,.5));
      border:1px solid rgba(22,32,59,.07);
      -webkit-backdrop-filter:blur(20px) saturate(140%);backdrop-filter:blur(20px) saturate(140%);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 10px 28px rgba(43,90,200,.04);}
    .sg-ask__l{display:flex;align-items:center;gap:16px;min-width:0;}
    .sg-ask__ic{width:44px;height:44px;flex:0 0 44px;border-radius:14px;display:grid;place-items:center;color:#fff;
      background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));
      box-shadow:inset 0 0 14px rgba(175,215,255,.7),inset 0 1px 0 rgba(255,255,255,.5),0 6px 16px rgba(43,111,224,.22);}
    .sg-ask__t{font-size:16px;font-weight:600;color:var(--sd-ink);letter-spacing:-.3px;line-height:1.2;}
    .sg-ask__d{font-size:13px;color:var(--sd-ink-sub);line-height:1.5;margin-top:4px;max-width:54ch;}

    @media (max-width:980px){
      .sg-head{flex-direction:column;gap:22px;}
      .sg-orb{width:100%;flex:0 0 auto;flex-direction:row;justify-content:flex-start;gap:22px;text-align:left;padding:24px 26px;}
      .sg-orb__peak{display:none;} .sg-orb__cap{margin-top:0;}
      .sg-title{font-size:32px;} .sg-lead{font-size:18px;}
      .sg-meter{margin-top:8px;}
      .sg-ask{flex-direction:column;align-items:flex-start;gap:16px;}
    }`;
    document.head.appendChild(el);
  }

  const youOpen = TASKS.filter((t) => t.owner === 'you' && t.status !== 'done').length;
  const focusTask = TASKS.filter((t) => t.owner === 'you' && t.status === 'current')[0] || null;
  const stWord = STAGE.status === 'late' ? 'Есть просрочка' : STAGE.status === 'urgent' ? 'Горит срочное' : 'Идем по графику';

  /* ── Шапка ──────────────────────────────────────────────────────────────── */
  function Head() {
    const urgent = STAGE.status !== 'ok';
    const sIc = urgent ? (ic('AlertTriangle', { size: 17 }) || '!') : (ic('Check', { size: 18, strokeWidth: 2.8 }) || '+');
    const now = focusTask
      ? ['Сейчас в фокусе ', h('b', { key: 'b' }, focusTask.title.toLowerCase()), focusTask.dl ? ' — срок ' + focusTask.dl + '.' : '.']
      : 'Все задачи в работе, действий от тебя пока не нужно.';
    return h('section', { className: 'sg-head' },
      h('div', { className: 'sg-head__l' },
        h('div', { className: 'sg-eyebrow' },
          'Этап ', h('b', { key: 'n' }, two(STAGE.n)), h('s', { key: 's' }, ' / ' + two(STAGE.total)),
          h('span', { key: 'd', className: 'sg-dot' }),
          h('span', { key: 'm', className: 'sg-mute' }, 'Твой путь в Китай')),
        h('h1', { className: 'sg-title' }, STAGE.title),
        h('div', { className: 'sg-status ' + STAGE.status },
          h('span', { className: 'sg-status__ic' }, sIc), stWord),
        h('div', { className: 'sg-now' }, now),
        h('div', { className: 'sg-meter' },
          h('div', { className: 'sg-meter__track' }, h('span', { className: 'sg-meter__fill', style: { width: STAGE.pct + '%' } })),
          h('div', { className: 'sg-meta' },
            h('span', null, h('b', null, STAGE.pct + '%'), ' собрано'),
            h('span', { className: 'sg-mdot' }),
            h('span', { className: urgent ? 'late' : '' }, h('b', { className: urgent ? 'late' : '' }, STAGE.daysLeft + ' дней'), ' до подачи'),
            h('span', { className: 'sg-mdot' }),
            h('span', null, STAGE.deadline)))),
      h('div', { className: 'sg-orb' },
        h('div', { className: 'sg-orb__glow' }),
        h('div', { className: 'sg-orb__stars' }),
        h('img', { className: 'sg-orb__peak', src: STAGE.peak, alt: '' }),
        h('div', { className: 'sg-orb__ring' }, h(SH.Ring, { pct: STAGE.pct, size: 132, label: 'собрано' })),
        h('div', { className: 'sg-orb__cap' },
          h('div', { className: 'sg-orb__cw' }, youOpen === 1 ? '1 задача от тебя' : youOpen + ' задачи от тебя'),
          h('div', { className: 'sg-orb__cs' }, 'осталось до подачи'))));
  }

  /* ── О чём этап ─────────────────────────────────────────────────────────── */
  function About() {
    const [open, setOpen] = useState(false);
    return h('section', { className: 'sg-about' },
      h('div', { className: 'sg-eb' }, ic('Info', { size: 14 }), 'О чём этот этап'),
      h('p', { className: 'sg-lead' }, STAGE.lead),
      h('div', { className: 'sg-more' + (open ? ' open' : '') },
        STAGE.full.map((p, i) => h('p', { key: i }, p)),
        h('div', { className: 'sg-plan' },
          PLAN.map((p, i) => h('div', { key: i, className: 'sg-plan__row' },
            h('div', { className: 'sg-plan__ic' }, p.ic ? ic(p.ic, { size: 16 }) : null),
            h('div', null,
              h('div', { className: 'sg-plan__t' }, p.t),
              h('div', { className: 'sg-plan__d' }, p.d)))))),
      h('button', { type: 'button', className: 'sg-toggle' + (open ? ' open' : ''), onClick: () => setOpen(!open) },
        open ? 'Свернуть' : 'Читать подробнее и что важно учесть', ic('ChevronDown', { size: 16 }) || 'v'));
  }

  /* ── Задачи — аккордеон на сквозном таймлайне ───────────────────────────── */
  function Tasks() {
    const firstCurrent = TASKS.findIndex((t) => t.status === 'current');
    const [open, setOpen] = useState(firstCurrent >= 0 ? firstCurrent : -1);
    const done = TASKS.filter((t) => t.status === 'done').length;
    const fillPct = Math.round((((firstCurrent >= 0 ? firstCurrent : done - 1) + 0.5) / TASKS.length) * 100);
    const leadWord = (t) => t.status === 'done' ? 'Готово' : t.owner === 'you' ? 'Твой ход' : 'Делаем мы';
    const leadMod = (t) => t.status === 'done' ? 'done' : t.owner === 'you' ? 'you' : 'us';

    const row = (t, i) => {
      const isOpen = open === i;
      const lm = leadMod(t);
      const focusYou = t.owner === 'you' && t.status === 'current';
      const lateNow = t.status === 'current' && t.dlState === 'late';
      const leadIc = lm === 'done' ? (ic('Check', { size: 12, strokeWidth: 2.6 }) || '+')
        : t.owner === 'you' ? ic('User', { size: 12 }) : ic('Spark', { size: 12 });
      const aff = t.status === 'done'
        ? h('span', { className: 'sg-check' }, ic('Check', { size: 16, strokeWidth: 2.6 }) || '+')
        : (t.owner === 'you' && t.status === 'upcoming')
          ? h('span', { className: 'sg-lock' }, ic('Lock', { size: 17 }) || '')
          : h('span', { className: 'sg-aff' }, h('span', { className: 'sg-aff__chev' }, ic('ChevronDown', { size: 18 }) || 'v'));
      const steps = (t.flow || []).map((s, k) => h('div', { key: k, className: 'sg-step' },
        h('div', { className: 'sg-step__n' }, k + 1),
        h('div', null, h('div', { className: 'sg-step__t' }, s.t), s.s ? h('div', { className: 'sg-step__s' }, s.s) : null)));
      return h('div', { key: 'r' + i, className: 'sg-row ' + t.status + ' ' + t.owner + (lateNow ? ' late' : '') },
        h('div', { className: 'sg-rail' }, h('div', { className: 'sg-node' }, t.status === 'done' ? (ic('Check', { size: 16, strokeWidth: 2.6 }) || '+') : (i + 1))),
        h('div', { className: 'sg-card' + (isOpen ? ' open' : '') },
          h('div', { className: 'sg-head2', onClick: () => setOpen(isOpen ? -1 : i) },
            h('div', { className: 'sg-card__b' },
              h('div', { className: 'sg-lead2 ' + lm },
                h('span', { className: 'sg-lead2__ic' }, leadIc),
                h('span', { className: 'sg-lead2__w' }, leadWord(t))),
              h('div', { className: 'sg-card__t' }, t.title),
              t.meta ? h('div', { className: 'sg-card__m' + (lateNow ? ' late' : '') }, t.meta) : null),
            aff),
          h('div', { className: 'sg-body' + (isOpen ? ' open' : '') },
            h('div', { className: 'sg-bin' },
              h('div', { className: 'sg-bin__div' }),
              h('div', { className: 'sg-desc' }, t.desc || t.why || ''),
              steps.length ? h('div', { className: 'sg-steps' }, steps) : null,
              focusYou
                ? h('div', { className: 'sg-act' },
                    h('button', { type: 'button', className: 'sd-btn sd-btn--primary', onClick: (e) => { e.stopPropagation(); SH.openTask(taskOf(t)); } },
                      t.cta || 'Открыть задачу', ic('ArrowRight', { size: 16, className: 'sd-arr' })))
                : (t.owner === 'you' && t.status === 'upcoming')
                  ? h('div', { className: 'sg-note' }, ic('Lock', { size: 14 }), 'Откроется после медсправки')
                  : t.owner === 'us' && t.status !== 'done'
                    ? h('div', { className: 'sg-note' }, ic('Clock', { size: 14 }), 'Это на нашей стороне, от тебя ничего не нужно')
                    : null))));
    };

    return h('section', { className: 'sd-sec' },
      h('div', { className: 'sd-sec__head' },
        h('h3', { className: 'sd-sec__title' }, 'Задачи этапа'),
        h('span', { className: 'sd-num', style: { fontSize: '13px', fontWeight: 500, color: 'var(--sd-ink-mute)' } }, done + ' из ' + TASKS.length + ' готово')),
      h('div', { className: 'sg-rm', style: { '--sg-fill': fillPct + '%' } }, TASKS.map((t, i) => row(t, i))));
  }

  /* ── Полезное по этапу (как на Главной) ─────────────────────────────────── */
  function Know() {
    const feat = KNOW[0];
    const rest = KNOW.slice(1);
    return h('section', { className: 'sd-sec' },
      h('div', { className: 'sd-sec__head' },
        h('h3', { className: 'sd-sec__title' }, 'Полезное по этапу'),
        h('button', { type: 'button', className: 'sd-sec__link', onClick: () => SH.onNav({ label: 'Обучение', to: '/learning/schedule' }) },
          'Вся база', ic('ArrowRight', { size: 14, className: 'sd-arr' }))),
      h('div', { className: 'sd-know' },
        h('div', { className: 'sd-feat', onClick: () => SH.openArticle(feat) },
          h('img', { className: 'sd-feat__bg', src: feat.image, alt: '' }),
          h('div', { className: 'sd-feat__scrim' }),
          h('div', { className: 'sd-feat__body' },
            h('div', { className: 'sd-feat__cap' }, feat.cap),
            h('div', { className: 'sd-feat__title' }, feat.title),
            h('div', { className: 'sd-feat__meta' },
              h('span', null, feat.dur),
              h('span', { className: 'sd-feat__go' }, 'Читать', ic('ArrowRight', { size: 14, className: 'sd-arr' }))))),
        h('div', { className: 'sd-know__list' },
          rest.map((a, i) => h('div', { key: i, className: 'sd-aitem', onClick: () => SH.openArticle(a) },
            h('div', { className: 'sd-aitem__icw' }, a.icon ? h(a.icon, { size: 19 }) : null),
            h('div', { className: 'sd-aitem__b' },
              h('div', { className: 'sd-aitem__cap' }, a.cap + ' · ' + a.dur),
              h('div', { className: 'sd-aitem__title' }, a.title)),
            h('div', { className: 'sd-aitem__go' }, ic('ChevronRight', { size: 18 }) || '>'))))));
  }

  /* ── Вопрос по этапу ────────────────────────────────────────────────────── */
  function Ask() {
    return h('section', { className: 'sd-sec' },
      h('div', { className: 'sg-ask' },
        h('div', { className: 'sg-ask__l' },
          h('div', { className: 'sg-ask__ic' }, ic('Spark', { size: 21 }) || 'AI'),
          h('div', null,
            h('div', { className: 'sg-ask__t' }, 'Вопрос по этапу?'),
            h('div', { className: 'sg-ask__d' }, 'Подскажу по любому документу: что нужно, как оформить и что делать прямо сейчас.'))),
        h('button', { type: 'button', className: 'sd-btn sd-btn--primary', onClick: () => SH.openChat({ label: 'Этап: ' + STAGE.title }) },
          ic('Spark', { size: 16 }), 'Спросить AI')));
  }

  function StudentStageB() {
    if (!SH) return h('div', { style: { padding: 40 } }, 'Скелет ученика не загружен');
    injectCSS();
    return h(SH.Shell, { active: 'home', surface: 'light', hideTopBar: true },
      h('button', { type: 'button', className: 'sg-back', onClick: goHome }, ic('ArrowLeft', { size: 16 }) || '<', 'На главную'),
      h(Head, null),
      h(About, null),
      h(Tasks, null),
      h(Know, null),
      h(Ask, null));
  }

  EScreens.StudentStageB = StudentStageB;
})();
