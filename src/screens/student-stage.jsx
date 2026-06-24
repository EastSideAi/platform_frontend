/* ============================================================================
   EastSide — Кабинет ученика · ЭТАПЫ (window.EScreens.StudentStage · #/stage)
   ----------------------------------------------------------------------------
   Передизайн под референс владельца: master-detail «Твой путь в Китай».
   СЛЕВА — тихий рейл всех 8 этапов со сквозной светящейся линией (где я и
   сколько пути впереди). СПРАВА — стеклянная детальная панель активного этапа:
   PNG-папка как якорь, крупный прогресс, задачи роадмапом. Клик по этапу слева
   меняет панель справа.

   Принципы (режим B, design.md §3):
   - Воздух, а не тени. Теней почти нет — глубину держат тонкие полупрозрачные
     обводки, свечение-изнутри на активном и крупные интервалы между смыслами.
   - Один якорь — правая панель. Левый рейл дисциплинированный и тихий.
   - Статус словом+цветом+иконкой, без залитых пилюль (jade «Завершено»,
     сапфировый пульс «твой ход», rose «горит»).
   - Яркая кнопка — только у текущей задачи от тебя. Выполнение — в попапе
     (SH.openTask). Будущие задачи тихие, с замком.

   Доп-CSS под префиксом .s2- (guard по id es-stage2-css). Базовая .sd-CSS и
   попап-шина — в общем ESStudentShell.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = window.React || React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const Ic = window.EIcons || {};
  const SH = window.ESStudentShell;
  const ic = (name, props) => (Ic[name] ? h(Ic[name], props || {}) : null);
  const arr = (s) => (Ic.ArrowRight ? h(Ic.ArrowRight, { size: s || 16, className: 'sd-arr' }) : null);
  const goHome = () => SH.onNav({ label: 'Главная', to: '/student' });

  /* ─────────────────────────────────────────────────────────────────────────
     ДАННЫЕ. status этапа: 'done' | 'active' | 'locked'.
     Задача: owner 'you'|'us', state 'done'|'current'|'upcoming'.
  ───────────────────────────────────────────────────────────────────────── */
  const STAGES = [
    {
      n: 1, title: 'Выбор университета', status: 'done',
      sub: 'Подобрали программу и вуз под твой профиль.',
      lead: 'Разобрали твой профиль и подобрали программу и вуз, где у тебя реальные шансы на грант.',
      tasks: [
        { owner: 'us', state: 'done', title: 'Собрали профиль и цели', meta: 'По анкете и диагностике' },
        { owner: 'us', state: 'done', title: 'Подобрали вуз и программу', meta: 'Под грант CSC и твой уровень' },
      ],
    },
    {
      n: 2, title: 'Уровень языка HSK', status: 'done',
      sub: 'Подтвердили уровень и участие в гранте.',
      lead: 'Зафиксировали твой уровень языка и убедились, что ты проходишь по требованиям гранта.',
      tasks: [
        { owner: 'you', state: 'done', title: 'Прошел диагностику уровня', meta: 'Результат принят' },
        { owner: 'us', state: 'done', title: 'Подтвердили участие в гранте', meta: 'Профиль соответствует требованиям' },
      ],
    },
    {
      n: 3, title: 'Сбор документов', status: 'active',
      sub: 'Текущий этап',
      lead: 'Собираем пакет под требования гранта CSC и проверяем каждый файл перед подачей. Сейчас горит медсправка.',
      tasks: [
        {
          owner: 'us', state: 'done', title: 'Проверили аттестат и оценки',
          meta: 'Принят и заверен, добавлен в пакет',
        },
        {
          owner: 'you', state: 'current', heat: 'late',
          title: 'Переоформить медсправку',
          dl: 'завтра', prio: 'высокий',
          meta: 'Старую справку не приняли — нужна новая по форме CSC',
          desc: 'Нужна новая медсправка по форме CSC (Foreigner Physical Examination Form) с печатями и переводом. Сделай в клинике, потом загрузи фото или скан — проверим за 1-2 дня и добавим в пакет.',
          time: '5-10 минут на загрузку',
          cta: 'Перейти к задаче',
          flow: [
            { t: 'Получаешь справку в клинике', s: 'По форме CSC, с переводом', st: 'current' },
            { t: 'Загружаешь сюда', s: 'Фото или скан' },
            { t: 'Проверяем и добавляем в пакет', s: 'Обычно 1-2 дня' },
          ],
        },
        {
          owner: 'you', state: 'upcoming', title: 'Загрузить фото 3x4 (8 шт)',
          dl: '28 июня',
          meta: 'Откроется после медсправки',
          desc: 'Фото 33x48 мм: строго белый фон, ровный свет, нейтральное выражение, без аксессуаров. Можно переснять на телефон по инструкции.',
          time: '5 минут', cta: 'Загрузить фото',
          flow: [{ t: 'Ты загружаешь фото', st: 'current' }, { t: 'Мы проверяем', s: 'Скажем сразу, если надо переснять' }],
        },
        {
          owner: 'us', state: 'upcoming', title: 'Проверка пакета и подача на грант',
          us: '1-2 дня',
          meta: 'Запустим, когда пакет будет готов',
          desc: 'Проверим все документы, соберем пакет и подадим заявку на грант CSC от твоего имени.',
        },
      ],
    },
    { n: 4, title: 'Подача на грант', status: 'locked', sub: 'Подаем заявку на грант CSC от вуза.',
      lead: 'Когда пакет готов, мы подаем заявку на грант CSC от твоего имени и следим за статусом.',
      after: 3, will: ['Финальная проверка пакета', 'Подача заявки от твоего имени', 'Подтверждение приема заявки'] },
    { n: 5, title: 'Рассмотрение заявки', status: 'locked', sub: 'Ждем решения комиссии по гранту.',
      lead: 'Комиссия рассматривает заявку. Мы держим тебя в курсе и готовим к следующему шагу.',
      after: 4, will: ['Отслеживаем статус заявки', 'Готовим к возможному интервью', 'Сообщаем решение комиссии'] },
    { n: 6, title: 'Получение визы', status: 'locked', sub: 'Оформляем учебную визу X1/X2.',
      lead: 'После одобрения гранта оформляем приглашение и учебную визу для въезда в Китай.',
      after: 5, will: ['Получаем приглашение от вуза', 'Готовим пакет на визу', 'Подаем на визу X1/X2'] },
    { n: 7, title: 'Подготовка к выезду', status: 'locked', sub: 'Билеты, общежитие, первые дни.',
      lead: 'Готовимся к переезду: жилье, билеты, страховка и план первых дней на месте.',
      after: 6, will: ['Бронируем общежитие', 'Помогаем с билетами и страховкой', 'План первых дней в кампусе'] },
    { n: 8, title: 'Прибытие в Китай', status: 'locked', sub: 'Заселение и старт учебы.',
      lead: 'Встречаем на месте, помогаем с заселением, регистрацией и стартом учебы.',
      after: 7, will: ['Заселение в общежитие', 'Регистрация и документы на месте', 'Старт учебы и адаптация'] },
  ];

  const taskOf = (t) => Object.assign({}, t, {
    side: t.owner === 'us' ? 'us' : 'you',
    desc: t.desc || t.meta,
  });

  const doneCount = (st) => (st.tasks || []).filter((t) => t.state === 'done').length;
  const pctOf = (st) => {
    if (st.status === 'done') return 100;
    const tot = (st.tasks || []).length || 1;
    return Math.round((doneCount(st) / tot) * 100);
  };

  /* ── Доп-CSS этой страницы (один раз, guard по id) ──────────────────────── */
  function injectCSS() {
    if (document.getElementById('es-stage2-css')) return;
    const el = document.createElement('style');
    el.id = 'es-stage2-css';
    el.textContent = `
    /* шире полотно: master-detail дышит свободнее обычной колонки */
    .sd-main--light:has(.s2-root) .sd-wrap{max-width:1320px;padding:34px 44px 84px;}

    /* ── Кнопка «Назад» — тихая ─────────────────────────────────────────── */
    .s2-back{display:inline-flex;align-items:center;gap:8px;font-size:13.5px;font-weight:600;
      color:var(--sd-ink-sub);background:transparent;border:0;border-radius:11px;padding:8px 12px 8px 8px;cursor:pointer;margin-left:-8px;
      transition:transform .16s cubic-bezier(.23,1,.32,1),opacity .16s;}
    .s2-back:hover{opacity:.7;}
    .s2-back svg{transition:transform .16s cubic-bezier(.23,1,.32,1);}
    .s2-back:hover svg{transform:translateX(-3px);}

    /* ── Шапка экрана ───────────────────────────────────────────────────── */
    .s2-head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-top:14px;margin-bottom:30px;}
    .s2-head__l{min-width:0;}
    .s2-head__eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--sd-acc-deep);margin-bottom:13px;}
    .s2-head__kdot{width:4px;height:4px;border-radius:50%;background:rgba(43,143,255,.5);}
    .s2-head__title{font-weight:700;font-size:38px;letter-spacing:-1.4px;line-height:1.02;color:#15203B;text-wrap:balance;margin:0;}
    .s2-head__count{flex:0 0 auto;display:inline-flex;align-items:center;gap:9px;font-size:13px;font-weight:600;color:var(--sd-ink-mute);
      font-variant-numeric:tabular-nums;padding:9px 15px;border-radius:99px;border:1px solid var(--sd-line);background:rgba(255,255,255,.5);}
    .s2-head__count b{color:var(--sd-ink);font-weight:700;}

    /* ── Сетка master-detail ────────────────────────────────────────────── */
    .s2-grid{display:grid;grid-template-columns:352px minmax(0,1fr);gap:34px;align-items:start;}

    /* ── ЛЕВО: рейл этапов со сквозной светящейся линией ─────────────────── */
    .s2-rail{position:relative;display:flex;flex-direction:column;gap:4px;padding:2px 0;}
    .s2-rail::before{content:'';position:absolute;z-index:0;left:18px;top:34px;bottom:34px;width:2.5px;border-radius:2px;
      background:linear-gradient(180deg,
        var(--sd-jade) 0%,
        var(--sd-acc) var(--s2-fill,32%),
        rgba(22,32,59,.1) var(--s2-fill,32%),
        rgba(22,32,59,.1) 100%);}
    .s2-st{position:relative;z-index:1;display:flex;gap:15px;align-items:flex-start;width:100%;text-align:left;cursor:pointer;
      background:transparent;border:0;padding:11px 14px 11px 0;border-radius:16px;
      transition:transform .16s cubic-bezier(.23,1,.32,1),background .16s;}
    .s2-st:not(.is-sel):not(.locked):hover{background:rgba(43,143,255,.05);transform:translateX(2px);}
    .s2-st.locked{cursor:pointer;}
    .s2-st.locked:hover{background:rgba(22,32,59,.025);}
    /* узел */
    .s2-node{flex:0 0 38px;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;color:#fff;position:relative;
      box-shadow:0 0 0 6px #FAFBFF;}
    .s2-st.done .s2-node{background:linear-gradient(150deg,#3EE08F,#1C7E52);box-shadow:0 0 0 6px #FAFBFF,0 4px 12px rgba(46,160,110,.32);}
    .s2-st.active .s2-node{background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));box-shadow:0 0 0 6px #FAFBFF,0 0 0 4px rgba(43,143,255,.16),0 6px 18px rgba(43,143,255,.45);}
    .s2-st.locked .s2-node{background:#E7EBF6;color:#9098B6;box-shadow:0 0 0 6px #FAFBFF;}
    /* тело */
    .s2-st__b{flex:1 1 auto;min-width:0;padding-top:1px;}
    .s2-st__n,.s2-st__t,.s2-st__s,.s2-st__done{display:block;}
    .s2-st__n{font-size:11px;font-weight:700;letter-spacing:.06em;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
    .s2-st.active .s2-st__n{color:var(--sd-acc-deep);}
    .s2-st__t{font-size:15px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;line-height:1.25;margin-top:3px;text-wrap:balance;}
    .s2-st.locked .s2-st__t{color:var(--sd-ink-mute);font-weight:500;}
    .s2-st__s{font-size:12.5px;color:var(--sd-ink-mute);line-height:1.45;margin-top:5px;max-width:30ch;}
    .s2-st__done{display:inline-flex;align-items:center;gap:5px;margin-top:7px;font-size:12px;font-weight:600;color:var(--sd-jade);letter-spacing:-.01em;}
    /* выбранный этап — подсветка свечением изнутри + карет к панели */
    .s2-st.is-sel{background:linear-gradient(150deg,rgba(255,255,255,.94),rgba(244,247,255,.7));
      border:1px solid rgba(43,143,255,.34);padding:11px 14px;margin:0 -1px;
      box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 34px rgba(43,143,255,.08);}
    .s2-st.is-sel.done{border-color:rgba(46,160,110,.32);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 34px rgba(46,160,110,.07);}
    .s2-st.is-sel.locked{border-color:rgba(22,32,59,.12);box-shadow:inset 0 1px 0 rgba(255,255,255,.9);}
    .s2-st.is-sel .s2-node{box-shadow:0 0 0 6px #FDFDFF,0 0 0 4px rgba(43,143,255,.16),0 6px 18px rgba(43,143,255,.45);}
    .s2-st__caret{position:absolute;right:-34px;top:50%;transform:translateY(-50%);display:none;color:var(--sd-acc);}
    .s2-st.is-sel .s2-st__caret{display:block;}
    .s2-st.is-sel.done .s2-st__caret{color:var(--sd-jade);}
    .s2-st.is-sel.locked .s2-st__caret{color:var(--sd-ink-faint,rgba(22,32,59,.3));}

    /* ── ПРАВО: детальная панель этапа ──────────────────────────────────── */
    .s2-panel{position:relative;overflow:hidden;border-radius:26px;padding:38px 40px 34px;
      background:linear-gradient(160deg,rgba(255,255,255,.82),rgba(244,247,255,.62));
      border:1px solid rgba(43,111,224,.14);
      -webkit-backdrop-filter:blur(26px) saturate(150%);backdrop-filter:blur(26px) saturate(150%);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.95);}
    /* тихий PNG-якорь у правого верха */
    .s2-panel__art{position:absolute;z-index:0;right:-20px;top:-14px;width:248px;pointer-events:none;opacity:.92;
      filter:drop-shadow(0 22px 44px rgba(43,90,200,.16));
      -webkit-mask-image:radial-gradient(150% 130% at 78% 22%,#000 62%,transparent 100%);mask-image:radial-gradient(150% 130% at 78% 22%,#000 62%,transparent 100%);}
    .s2-panel__art.locked{opacity:.34;filter:grayscale(.4) drop-shadow(0 18px 36px rgba(43,90,200,.1));}
    .s2-panel__head{position:relative;z-index:1;max-width:60%;}
    .s2-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;}
    .s2-eyebrow.active{color:var(--sd-acc-deep);}
    .s2-eyebrow.done{color:var(--sd-jade);}
    .s2-eyebrow.locked{color:var(--sd-ink-mute);}
    .s2-eyebrow__dot{width:7px;height:7px;border-radius:50%;}
    .s2-eyebrow.active .s2-eyebrow__dot{background:var(--sd-acc);box-shadow:0 0 0 3px rgba(43,143,255,.16),0 0 9px rgba(43,143,255,.7);}
    .s2-eyebrow.done .s2-eyebrow__dot{background:var(--sd-jade);box-shadow:0 0 0 3px rgba(46,160,110,.16);}
    .s2-eyebrow.locked .s2-eyebrow__dot{background:var(--sd-ink-faint,rgba(22,32,59,.3));}
    .s2-panel__title{font-weight:700;font-size:30px;letter-spacing:-1px;line-height:1.06;color:#15203B;margin:15px 0 0;text-wrap:balance;}
    .s2-panel__lead{font-size:15px;line-height:1.6;color:var(--sd-ink-sub);margin:14px 0 0;max-width:54ch;}

    /* прогресс этапа */
    .s2-prog{position:relative;z-index:1;margin-top:30px;border-radius:18px;padding:22px 24px;
      background:rgba(255,255,255,.58);border:1px solid var(--sd-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.9);}
    .s2-prog__top{display:flex;align-items:baseline;justify-content:space-between;gap:16px;}
    .s2-prog__lab{font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--sd-ink-mute);}
    .s2-prog__val{font-size:34px;font-weight:700;letter-spacing:-1.2px;line-height:1;color:var(--sd-acc-deep);font-variant-numeric:tabular-nums;margin-top:9px;}
    .s2-prog.done .s2-prog__val{color:var(--sd-jade);}
    .s2-prog__cnt{font-size:13px;font-weight:600;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
    .s2-prog__track{margin-top:16px;height:8px;border-radius:99px;background:rgba(22,32,59,.07);overflow:hidden;}
    .s2-prog__fill{height:100%;border-radius:99px;background:linear-gradient(90deg,var(--sd-acc-2),var(--sd-acc-deep));
      box-shadow:0 0 10px rgba(43,143,255,.5);transition:width .4s cubic-bezier(.23,1,.32,1);}
    .s2-prog.done .s2-prog__fill{background:linear-gradient(90deg,#3EE08F,#1C7E52);box-shadow:0 0 10px rgba(46,160,110,.5);}

    /* ── список задач этапа ─────────────────────────────────────────────── */
    .s2-tasks{position:relative;z-index:1;margin-top:14px;display:flex;flex-direction:column;gap:10px;}
    .s2-task{display:flex;align-items:center;gap:18px;border-radius:16px;padding:17px 20px;
      background:rgba(255,255,255,.5);border:1px solid rgba(22,32,59,.07);
      transition:transform .16s cubic-bezier(.23,1,.32,1);}
    .s2-task.done{background:rgba(255,255,255,.42);}
    .s2-task.upcoming{background:rgba(255,255,255,.32);}
    .s2-task__mk{flex:0 0 34px;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;}
    .s2-task.done .s2-task__mk{color:var(--sd-jade);background:rgba(46,160,110,.12);box-shadow:inset 0 0 0 1px rgba(46,160,110,.22);}
    .s2-task.upcoming .s2-task__mk{color:var(--sd-ink-faint,rgba(22,32,59,.34));background:rgba(22,32,59,.04);box-shadow:inset 0 0 0 1px rgba(22,32,59,.06);}
    .s2-task__b{flex:1 1 auto;min-width:0;}
    .s2-task__n{font-size:12px;font-weight:700;color:var(--sd-ink-mute);font-variant-numeric:tabular-nums;}
    .s2-task__t{font-size:15.5px;font-weight:600;color:var(--sd-ink);letter-spacing:-.2px;line-height:1.25;margin-top:2px;text-wrap:balance;}
    .s2-task.upcoming .s2-task__t{color:var(--sd-ink-mute);font-weight:500;}
    .s2-task__m{font-size:12.5px;color:var(--sd-ink-mute);line-height:1.45;margin-top:5px;}
    .s2-task__done{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:600;color:var(--sd-jade);flex:0 0 auto;}
    .s2-task__lock{flex:0 0 32px;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;
      color:var(--sd-ink-faint,rgba(22,32,59,.32));background:rgba(22,32,59,.035);}

    /* активная задача от тебя — единственный яркий фокус */
    .s2-task.current{cursor:pointer;align-items:center;padding:22px 22px;
      background:linear-gradient(150deg,rgba(255,255,255,.95),rgba(244,247,255,.78));
      border:1.5px solid var(--sd-acc-line);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 46px rgba(43,143,255,.1);}
    .s2-task.current.heat-late{border-color:rgba(210,96,79,.42);box-shadow:inset 0 1px 0 rgba(255,255,255,.95),inset 0 0 46px rgba(210,96,79,.1);}
    .s2-task.current:hover{transform:translateY(-1px);}
    .s2-task.current .s2-task__mk{flex:0 0 38px;width:38px;height:38px;border-radius:12px;color:#fff;background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));
      box-shadow:inset 0 0 14px rgba(175,215,255,.7),0 6px 16px rgba(43,111,224,.3);}
    .s2-task.current.heat-late .s2-task__mk{background:linear-gradient(150deg,#E2786A,#A83A2A);box-shadow:inset 0 0 14px rgba(255,190,176,.6),0 6px 16px rgba(168,58,42,.28);}
    .s2-task.current .s2-task__t{font-size:18px;letter-spacing:-.45px;font-weight:700;}
    /* строка метаданных текущей: словом+цветом, без пилюль */
    .s2-meta{display:flex;align-items:center;flex-wrap:wrap;gap:7px 0;margin-top:8px;font-size:13px;font-weight:500;color:var(--sd-ink-mute);}
    .s2-meta__sep{margin:0 11px;width:3px;height:3px;border-radius:50%;background:rgba(22,32,59,.22);}
    .s2-meta__heat{display:inline-flex;align-items:center;gap:6px;font-weight:700;color:var(--sd-rose);}
    .s2-meta b{color:var(--sd-ink);font-weight:600;}
    .s2-meta b.late{color:var(--sd-rose);}
    .s2-task__cta{flex:0 0 auto;}

    /* ── locked-этап: тихий превью-блок ─────────────────────────────────── */
    .s2-soon{position:relative;z-index:1;margin-top:24px;border-radius:18px;padding:22px 24px;
      background:rgba(255,255,255,.42);border:1px solid var(--sd-line);}
    .s2-soon__h{display:flex;align-items:center;gap:11px;font-size:13.5px;font-weight:600;color:var(--sd-ink-sub);}
    .s2-soon__h svg{color:var(--sd-ink-mute);}
    .s2-soon__list{margin-top:16px;display:flex;flex-direction:column;gap:13px;}
    .s2-soon__it{display:flex;gap:12px;align-items:flex-start;font-size:14px;color:var(--sd-ink-sub);line-height:1.4;}
    .s2-soon__dot{flex:0 0 6px;width:6px;height:6px;border-radius:50%;background:rgba(43,143,255,.4);margin-top:7px;}

    /* ── низ: тихая плашка AI по этапу ──────────────────────────────────── */
    .s2-ask{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:26px;
      margin-top:30px;border-radius:20px;padding:24px 28px;
      background:linear-gradient(150deg,rgba(255,255,255,.66),rgba(241,245,255,.5));border:1px solid rgba(43,111,224,.14);
      -webkit-backdrop-filter:blur(20px) saturate(140%);backdrop-filter:blur(20px) saturate(140%);
      box-shadow:inset 0 1px 0 rgba(255,255,255,.92);}
    .s2-ask__l{display:flex;align-items:center;gap:17px;min-width:0;}
    .s2-ask__ic{width:46px;height:46px;flex:0 0 46px;border-radius:14px;display:grid;place-items:center;color:#fff;
      background:linear-gradient(150deg,var(--sd-acc-2),var(--sd-acc-deep));
      box-shadow:inset 0 0 16px rgba(175,215,255,.7),inset 0 1px 0 rgba(255,255,255,.5),0 6px 16px rgba(43,111,224,.26);}
    .s2-ask__t{font-size:16.5px;font-weight:700;color:var(--sd-ink);letter-spacing:-.35px;line-height:1.2;}
    .s2-ask__d{font-size:13px;color:var(--sd-ink-sub);line-height:1.5;margin-top:4px;max-width:54ch;}
    .s2-ask__act{flex:0 0 auto;}

    @media (max-width:1080px){
      .s2-grid{grid-template-columns:1fr;gap:24px;}
      .s2-st__caret{display:none !important;}
      .s2-panel__head{max-width:100%;}
      .s2-panel__art{opacity:.5;width:180px;}
      .s2-head__title{font-size:30px;}
    }
    @media (max-width:640px){
      .s2-task{flex-wrap:wrap;gap:12px;}
      .s2-task.current{flex-wrap:wrap;}
    }`;
    document.head.appendChild(el);
  }

  /* ── ЛЕВО: рейл этапов ───────────────────────────────────────────────── */
  function Rail(props) {
    const sel = props.sel;
    // заливка линии — до центра активного этапа
    const activeIdx = STAGES.findIndex((s) => s.status === 'active');
    const fill = Math.round(((activeIdx + 0.5) / STAGES.length) * 100);
    return h('div', { className: 's2-rail', style: { '--s2-fill': fill + '%' } },
      STAGES.map((s, i) => {
        const isSel = s.n === sel;
        const node = s.status === 'done'
          ? (ic('Check', { size: 17, strokeWidth: 2.7 }) || '+')
          : s.status === 'locked'
            ? (ic('Lock', { size: 15 }) || s.n)
            : s.n;
        return h('button', {
          key: s.n, type: 'button',
          className: 's2-st ' + s.status + (isSel ? ' is-sel' : ''),
          onClick: () => props.onSel(s.n),
        },
          h('span', { className: 's2-node' }, node),
          h('span', { className: 's2-st__b' },
            h('span', { className: 's2-st__n' }, 'Этап ' + s.n),
            h('span', { className: 's2-st__t' }, s.title),
            isSel && s.status !== 'done'
              ? h('span', { className: 's2-st__s' }, s.sub)
              : null,
            s.status === 'done'
              ? h('span', { className: 's2-st__done' }, ic('Check', { size: 13, strokeWidth: 2.6 }), 'Завершено')
              : null),
          h('span', { className: 's2-st__caret' }, ic('ChevronRight', { size: 22, strokeWidth: 2.4 }) || '>'));
      }));
  }

  /* ── ПРАВО: детальная панель этапа ───────────────────────────────────── */
  function TaskRow(s, t, idx) {
    const num = s.n + '.' + (idx + 1);
    if (t.state === 'done') {
      return h('div', { key: idx, className: 's2-task done' },
        h('span', { className: 's2-task__mk' }, ic('Check', { size: 17, strokeWidth: 2.6 }) || '+'),
        h('div', { className: 's2-task__b' },
          h('div', { className: 's2-task__n' }, num),
          h('div', { className: 's2-task__t' }, t.title),
          t.meta ? h('div', { className: 's2-task__m' }, t.meta) : null),
        h('span', { className: 's2-task__done' }, ic('Check', { size: 14, strokeWidth: 2.6 }), 'Завершено'));
    }
    if (t.state === 'current') {
      const you = t.owner === 'you';
      const lateCls = t.heat === 'late' ? ' heat-late' : '';
      const meta = h('div', { className: 's2-meta' },
        t.heat === 'late'
          ? h('span', { className: 's2-meta__heat' }, ic('AlertTriangle', { size: 14 }) || '!', 'Горит')
          : null,
        t.heat === 'late' && t.dl ? h('span', { className: 's2-meta__sep' }) : null,
        t.dl ? h('span', null, 'Срок: ', h('b', { className: t.heat === 'late' ? 'late' : '' }, t.dl)) : null,
        t.prio ? h('span', { className: 's2-meta__sep' }) : null,
        t.prio ? h('span', null, 'Приоритет: ', h('b', null, t.prio)) : null);
      return h('div', {
        key: idx, className: 's2-task current' + lateCls,
        onClick: () => SH.openTask(taskOf(t)),
      },
        h('span', { className: 's2-task__mk' }, num),
        h('div', { className: 's2-task__b' },
          h('div', { className: 's2-task__t' }, t.title),
          meta),
        h('div', { className: 's2-task__cta' },
          h('button', {
            type: 'button', className: 'sd-btn sd-btn--primary',
            onClick: (e) => { e.stopPropagation(); SH.openTask(taskOf(t)); },
          }, t.cta || 'Перейти к задаче', arr(15))));
    }
    // upcoming
    const tail = t.us ? 'Наша задача · ' + t.us : t.dl ? 'Срок ' + t.dl : null;
    return h('div', { key: idx, className: 's2-task upcoming' },
      h('span', { className: 's2-task__mk' }, ic('Lock', { size: 15 }) || '·'),
      h('div', { className: 's2-task__b' },
        h('div', { className: 's2-task__n' }, num),
        h('div', { className: 's2-task__t' }, t.title),
        t.meta ? h('div', { className: 's2-task__m' }, t.meta) : null),
      tail ? h('div', { style: { flex: '0 0 auto', fontSize: '12.5px', fontWeight: 600, color: 'var(--sd-ink-mute)', fontVariantNumeric: 'tabular-nums' } }, tail) : null);
  }

  function Detail(props) {
    const s = STAGES.find((x) => x.n === props.sel) || STAGES[0];
    const art = s.status === 'locked' ? 'assets/mountain-peak.png' : 'assets/folder-glass.png';
    const eyebrow = s.status === 'active' ? 'Текущий этап' : s.status === 'done' ? 'Этап завершен' : 'Скоро';
    const head = h('div', { className: 's2-panel__head' },
      h('div', { className: 's2-eyebrow ' + s.status },
        h('span', { className: 's2-eyebrow__dot' }), eyebrow),
      h('h2', { className: 's2-panel__title' }, s.title),
      h('p', { className: 's2-panel__lead' }, s.lead));

    if (s.status === 'locked') {
      return h('section', { className: 's2-panel' },
        h('img', { className: 's2-panel__art locked', src: art, alt: '' }),
        head,
        h('div', { className: 's2-soon' },
          h('div', { className: 's2-soon__h' },
            ic('Lock', { size: 16 }),
            'Откроется после этапа ' + s.after + ' · «' + (STAGES[s.after - 1] ? STAGES[s.after - 1].title : '') + '»'),
          h('div', { className: 's2-soon__list' },
            (s.will || []).map((w, i) => h('div', { key: i, className: 's2-soon__it' },
              h('span', { className: 's2-soon__dot' }), w)))));
    }

    const pct = pctOf(s);
    const tot = (s.tasks || []).length;
    const dn = doneCount(s);
    const progDone = s.status === 'done';
    return h('section', { className: 's2-panel' },
      h('img', { className: 's2-panel__art', src: art, alt: '' }),
      head,
      h('div', { className: 's2-prog' + (progDone ? ' done' : '') },
        h('div', { className: 's2-prog__top' },
          h('div', null,
            h('div', { className: 's2-prog__lab' }, 'Прогресс этапа'),
            h('div', { className: 's2-prog__val' }, pct + '%')),
          h('div', { className: 's2-prog__cnt' }, dn + ' из ' + tot + (tot === 1 ? ' задачи' : ' задач'))),
        h('div', { className: 's2-prog__track' },
          h('div', { className: 's2-prog__fill', style: { width: pct + '%' } }))),
      h('div', { className: 's2-tasks' },
        (s.tasks || []).map((t, i) => TaskRow(s, t, i))));
  }

  /* ── AI по этапу — тихая плашка ──────────────────────────────────────── */
  function AskAi(props) {
    const s = STAGES.find((x) => x.n === props.sel) || STAGES[0];
    return h('section', { className: 's2-ask' },
      h('div', { className: 's2-ask__l' },
        h('div', { className: 's2-ask__ic' }, ic('Spark', { size: 21 }) || 'AI'),
        h('div', null,
          h('div', { className: 's2-ask__t' }, 'Вопрос по этапу?'),
          h('div', { className: 's2-ask__d' }, 'Подскажу по любому документу: что нужно, как оформить, почему могут отклонить и что делать прямо сейчас. Без ожидания куратора.'))),
      h('div', { className: 's2-ask__act' },
        h('button', {
          type: 'button', className: 'sd-btn sd-btn--primary',
          onClick: () => SH.openChat({ label: 'Этап: ' + s.title }),
        }, ic('Spark', { size: 16 }), 'Спросить AI')));
  }

  function StudentStage() {
    if (!SH) return h('div', { style: { padding: 40, color: '#fff' } }, 'Скелет ученика не загружен');
    injectCSS();
    const initial = (STAGES.find((s) => s.status === 'active') || STAGES[0]).n;
    const [sel, setSel] = useState(initial);
    const total = STAGES.length;
    const cur = STAGES.find((s) => s.status === 'active');
    return h(SH.Shell, { active: 'home', surface: 'light', hideTopBar: true },
      h('div', { className: 's2-root' },
        h('button', { type: 'button', className: 's2-back', onClick: goHome },
          ic('ArrowLeft', { size: 16 }) || '<', 'На главную'),
        h('div', { className: 's2-head' },
          h('div', { className: 's2-head__l' },
            h('div', { className: 's2-head__eyebrow' },
              ic('Route', { size: 13 }) || null, 'Маршрут поступления',
              h('span', { className: 's2-head__kdot' }), 'Грант CSC'),
            h('h1', { className: 's2-head__title' }, 'Твой путь в Китай')),
          h('div', { className: 's2-head__count' },
            'Этап ', h('b', null, (cur ? cur.n : 1)), ' из ', h('b', null, total))),
        h('div', { className: 's2-grid' },
          h(Rail, { sel: sel, onSel: setSel }),
          h('div', null,
            h(Detail, { sel: sel }),
            h(AskAi, { sel: sel })))));
  }

  EScreens.StudentStage = StudentStage;
})();
