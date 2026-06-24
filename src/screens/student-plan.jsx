/* ============================================================================
   EastSide — Кабинет ученика · ЭТАПЫ / МОЙ ПЛАН (window.EScreens.StudentPlan · #/plan)
   ----------------------------------------------------------------------------
   Кинематографичная лента всех этапов поступления (реф file_5, карточки лучше).
   Завершённые — зелёный узел, текущий — раскрыт с чек-листом и свечением,
   будущие — под замком и затемнены. Клик по этапу / «Перейти к этапу» → детали
   этапа (#/stage). Картинки этапов — слот image, владелец подменит своими.

   Тёмная раскладка design.md. Каркас/попапы/бот — общий скелет ESStudentShell.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = window.React || React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const Ic = window.EIcons || {};
  const SH = window.ESStudentShell;
  const arr = (s) => Ic.ArrowRight ? h(Ic.ArrowRight, { size: s || 16, className: 'sd-arr' }) : null;
  const goStage = () => SH.onNav({ label: 'Этап', to: '/stage' });

  const PROGRESS = { pct: 40, n: 3, total: 8, title: 'Сбор документов', daysLeft: 7, hero: 'assets/ascent-night.png' };

  const STAGES = [
    { id: 1, status: 'done', title: 'Выбор программы и университета', desc: 'Помогли выбрать подходящую программу и вуз в Китае под твой профиль.', image: 'assets/ascent-lit.png' },
    { id: 2, status: 'done', title: 'Подтвердили уровень языка (HSK)', desc: 'Подтвердили твой уровень и участие в гранте.', image: 'assets/mountain-light.png' },
    {
      id: 3, status: 'active', title: 'Сбор документов',
      desc: 'Собираем все нужные документы и проверяем на соответствие требованиям гранта CSC.',
      image: 'assets/ascent-night.png',
      checks: [
        { name: 'Медицинская справка', state: 'В работе', type: 'work' },
        { name: 'Фото 3x4', state: 'От тебя', type: 'action' },
        { name: 'Скан паспорта', state: 'Ожидает', type: 'wait' },
        { name: 'Аттестат / диплом', state: 'Принят', type: 'done' },
        { name: 'Рекомендательные письма', state: 'Ожидает', type: 'wait' },
        { name: 'Мотивационное письмо', state: 'Ожидает', type: 'wait' },
      ],
    },
    { id: 4, status: 'locked', title: 'Подача документов на грант', desc: 'Подготовим пакет и подадим заявку на грант CSC от твоего университета.', image: 'assets/mountain-dark.png' },
    { id: 5, status: 'locked', title: 'Ожидание результата от CSC', desc: 'CSC рассматривает заявку и принимает решение о гранте.', image: 'assets/cosmos.png' },
    { id: 6, status: 'locked', title: 'Приглашение от университета', desc: 'Вуз присылает официальное приглашение для визы и проживания.', image: 'assets/ascent-night.png' },
    { id: 7, status: 'locked', title: 'Виза и подготовка к поездке', desc: 'Оформляем студенческую визу и готовим тебя к переезду.', image: 'assets/mountain-dark.png' },
    { id: 8, status: 'locked', title: 'Приезд в Китай', desc: 'Заселяешься в кампус и начинаешь обучение.', image: 'assets/cosmos.png' },
  ];

  const BADGE = { done: 'Завершено', active: 'В процессе' };

  function PHero() {
    return h('section', { className: 'sd-phero' },
      h('div', { className: 'sd-phero__bg', style: { backgroundImage: 'url(' + PROGRESS.hero + ')' } }),
      h('div', { className: 'sd-phero__shade' }),
      h('div', { className: 'sd-phero__main' },
        h('div', { className: 'sd-phero__cap' }, 'Твой прогресс'),
        h('div', { className: 'sd-phero__num sd-num' }, PROGRESS.pct + '%'),
        h('div', { className: 'sd-pbar' }, h('div', { className: 'sd-pbar__fill', style: { width: PROGRESS.pct + '%' } })),
        h('div', { className: 'sd-phero__stage' }, 'Этап ' + PROGRESS.n + ' из ' + PROGRESS.total + ' — ' + PROGRESS.title),
        h('div', { className: 'sd-phero__sub' }, 'До подачи на грант осталось: ', h('b', { className: 'sd-num' }, PROGRESS.daysLeft + ' дней'))),
      h('button', { type: 'button', className: 'sd-btn sd-btn--ghost', style: { flex: '0 0 auto' }, onClick: goStage }, 'Открыть текущий этап', arr()));
  }

  function StageRow(props) {
    const s = props.stage;
    const [open, setOpen] = useState(s.status === 'active');
    const node = s.status === 'done' ? (Ic.Check ? h(Ic.Check, { size: 17, strokeWidth: 2.6 }) : '✓')
      : s.status === 'locked' ? (Ic.Lock ? h(Ic.Lock, { size: 15 }) : '·') : s.id;
    const clickable = s.status !== 'locked';
    return h('div', { className: 'sd-tlrow ' + s.status },
      h('div', { className: 'sd-tlrail' },
        h('div', { className: 'sd-tlnode sd-num' }, node),
        h('div', { className: 'sd-tlline' })),
      h('div', { className: 'sd-stage ' + s.status, style: clickable ? { cursor: 'pointer' } : null, onClick: clickable ? goStage : null },
        h('div', { className: 'sd-stage__bg', style: { backgroundImage: 'url(' + s.image + ')' } }),
        h('div', { className: 'sd-stage__shade' }),
        h('div', { className: 'sd-stage__in' },
          h('div', { className: 'sd-stage__top' },
            h('div', null,
              s.status !== 'locked' ? h('span', { className: 'sd-stbadge ' + s.status }, BADGE[s.status]) : null,
              h('div', { className: 'sd-stage__title' }, s.title),
              h('div', { className: 'sd-stage__desc' }, s.desc)),
            s.status === 'locked' ? null
              : h('button', {
                type: 'button', className: 'sd-stchev',
                onClick: (e) => { e.stopPropagation(); setOpen(!open); }, 'aria-label': open ? 'Свернуть' : 'Развернуть',
              }, (open ? Ic.ChevronUp : Ic.ChevronDown) ? h(open ? Ic.ChevronUp : Ic.ChevronDown, { size: 17 }) : '▾')),
          (s.checks && open) ? h('div', { className: 'sd-checks' },
            s.checks.map((c, i) => h('div', { key: i, className: 'sd-check ' + c.type },
              h('span', { className: 'sd-check__box' }, (c.type === 'work' || c.type === 'done') && Ic.Check ? h(Ic.Check, { size: 13, strokeWidth: 2.6 }) : null),
              h('span', { className: 'sd-check__name' }, c.name),
              h('span', { className: 'sd-check__st' }, c.state, c.type !== 'wait' ? h('span', { className: 'sd-check__dot' }) : null)))) : null,
          (s.status === 'active' && open) ? h('button', {
            type: 'button', className: 'sd-btn sd-btn--primary sd-stage__cta', onClick: (e) => { e.stopPropagation(); goStage(); },
          }, 'Перейти к этапу', arr()) : null)));
  }

  function StudentPlan() {
    if (!SH) return h('div', { style: { padding: 40, color: '#fff' } }, 'Скелет ученика не загружен');
    return h(SH.Shell, { active: 'plan', surface: 'dark', sub: 'Твой план поступления в Китай — шаг за шагом' },
      h(PHero, null),
      h('section', { className: 'sd-sec' },
        h('div', { className: 'sd-sec__head' }, h('h3', { className: 'sd-sec__title' }, 'Этапы поступления')),
        h('div', { className: 'sd-tl' }, STAGES.map((s) => h(StageRow, { key: s.id, stage: s })))));
  }

  EScreens.StudentPlan = StudentPlan;
})();
