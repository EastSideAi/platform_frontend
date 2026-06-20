/* ============================================================================
   EastSide — Кабинет ученика · ГЛАВНАЯ (window.EScreens.CabinetStudent · #/student)
   РЕБИЛД 3: Light Premium Dashboard + Dark Roadmap
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h } = window.React || React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const U = window.EUI, Ic = window.EIcons;

  const dashboardStyles = `
    /* Глобальный сброс для этого экрана */
    .ds-layout {
      min-height: 100vh;
      display: flex;
      background-color: #F4F6F9; /* Дорогой светлый фон */
      color: #1C1C28;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* Сайдбар (тёмный) */
    .ds-sidebar {
      width: 260px;
      flex-shrink: 0;
      background: #110F19;
      border-right: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      flex-direction: column;
      padding: 24px;
      position: sticky;
      top: 0;
      height: 100vh;
      box-sizing: border-box;
      color: #FFF;
    }
    .ds-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 40px;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .ds-logo-box {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #613EEA 0%, #A282FF 100%);
      border-radius: 8px;
    }
    .ds-nav {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ds-nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 12px;
      color: #8C8A97;
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      background: transparent;
      border: none;
      text-align: left;
    }
    .ds-nav-item:hover {
      color: #FFF;
      background: rgba(255, 255, 255, 0.03);
    }
    .ds-nav-item.is-active {
      color: #FFF;
      background: rgba(97, 62, 234, 0.15);
    }
    .ds-nav-item.is-active .ds-nav-icon {
      color: #A282FF;
    }
    .ds-badge {
      margin-left: auto;
      background: #613EEA;
      color: #FFF;
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 100px;
    }

    /* Основной контент (светлый) */
    .ds-main {
      flex: 1;
      overflow-y: auto;
      padding: 40px 0;
      position: relative;
    }
    .ds-container {
      max-width: 950px;
      margin: 0 auto;
      padding: 0 40px;
      display: flex;
      flex-direction: column;
      gap: 40px;
    }

    /* Общие компоненты */
    .ds-block-title {
      font-size: 18px;
      color: #1C1C28;
      margin: 0 0 16px 0;
      font-weight: 700;
    }
    .ds-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }
    .ds-btn.primary {
      background: #E8EDFF;
      color: #4361EE;
    }
    .ds-btn.primary:hover {
      background: #D4DFFF;
      transform: translateY(-1px);
    }
    .ds-btn.white {
      background: #FFF;
      color: #1C1C28;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .ds-btn.white:hover {
      box-shadow: 0 6px 16px rgba(0,0,0,0.08);
      transform: translateY(-1px);
    }

    /* BLOCK 1: TODAY (Что нужно от тебя) */
    .ds-today-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .ds-tcard {
      position: relative;
      background: linear-gradient(145deg, #FFFFFF, #F8FAFF);
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 12px 30px rgba(67, 97, 238, 0.08);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.8);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .ds-tcard:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(67, 97, 238, 0.12);
    }
    .ds-tcard-bg {
      position: absolute;
      top: -20px;
      right: -20px;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(67,97,238,0.1) 0%, rgba(255,255,255,0) 70%);
      border-radius: 50%;
      z-index: 0;
    }
    .ds-tcard.is-purple .ds-tcard-bg {
      background: radial-gradient(circle, rgba(162,130,255,0.15) 0%, rgba(255,255,255,0) 70%);
    }
    .ds-tcard-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .ds-tcard-top {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .ds-tcard-num {
      width: 32px;
      height: 32px;
      background: #E8EDFF;
      color: #4361EE;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }
    .ds-tcard.is-purple .ds-tcard-num {
      background: #F3EFFF;
      color: #8C52FF;
    }
    .ds-tcard-icon-l {
      color: #4361EE;
    }
    .ds-tcard.is-purple .ds-tcard-icon-l {
      color: #8C52FF;
    }
    .ds-tcard h3 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px 0;
      color: #1C1C28;
    }
    .ds-tcard p {
      font-size: 14px;
      color: #6C6A7B;
      margin: 0 0 24px 0;
      line-height: 1.4;
    }
    .ds-tcard-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #8C8A97;
      margin-bottom: 16px;
    }

    /* ROW 2: PREPARATION & CONTINUE */
    .ds-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .ds-pcard {
      background: #FFFFFF;
      border-radius: 24px;
      padding: 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.04);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
    }
    .ds-pcard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    .ds-pcard-tag {
      background: #613EEA;
      color: #FFF;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
    }
    .ds-pcard-stat {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }
    .ds-pcard-num {
      font-size: 42px;
      font-weight: 800;
      color: #1C1C28;
      letter-spacing: -1px;
    }
    .ds-pcard-lbl {
      color: #8C8A97;
      font-size: 14px;
      font-weight: 500;
    }
    /* Декоративный график для HSK */
    .ds-pcard-graph {
      position: absolute;
      bottom: 0; left: 0; right: 0; height: 80px;
      background: linear-gradient(180deg, rgba(162,130,255,0.1) 0%, rgba(255,255,255,0) 100%);
      border-top: 2px solid #D9CBFF;
      border-radius: 100% 100% 0 0 / 100% 100% 0 0;
      transform: scaleX(1.2) translateY(20px);
    }
    .ds-pcard-footer {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: auto;
    }
    .ds-pcard-meta {
      font-size: 13px;
      color: #6C6A7B;
      display: flex;
      justify-content: space-between;
    }

    .ds-ccard-icon {
      width: 48px;
      height: 48px;
      background: #F3EFFF;
      color: #8C52FF;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }
    .ds-ccard-title {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }
    .ds-ccard-desc {
      color: #6C6A7B;
      font-size: 14px;
      margin: 0 0 20px 0;
    }

    /* BLOCK: HELP */
    .ds-help-banner {
      background: linear-gradient(135deg, #1C153B 0%, #302070 100%);
      border-radius: 24px;
      padding: 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #FFF;
      box-shadow: 0 16px 32px rgba(28, 21, 59, 0.2);
      position: relative;
      overflow: hidden;
    }
    .ds-help-banner::before {
      content: '';
      position: absolute;
      top: -50px; right: 10%;
      width: 150px; height: 150px;
      background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
      border-radius: 50%;
    }
    .ds-help-info h3 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 700;
    }
    .ds-help-info p {
      margin: 0;
      font-size: 15px;
      color: #B5B3C0;
    }
    .ds-help-actions {
      display: flex;
      gap: 16px;
      position: relative;
      z-index: 1;
    }

    /* ROADMAP (ТЁМНЫЙ ЭМОЦИОНАЛЬНЫЙ ЦЕНТР) */
    .ds-roadmap {
      display: flex;
      flex-direction: column;
      margin-top: 20px;
      padding-bottom: 80px;
    }
    .ds-rm-row {
      display: flex;
      gap: 24px;
      min-height: 80px;
      position: relative;
    }
    .ds-rm-timeline {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 32px;
      position: relative;
      flex-shrink: 0;
    }
    .ds-rm-node {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      z-index: 2;
      box-sizing: border-box;
      margin-top: 24px;
    }
    /* Завершено */
    .ds-rm-row.completed .ds-rm-node {
      background: #34C759;
      color: #FFF;
      box-shadow: 0 0 0 4px #F4F6F9;
    }
    /* Активный */
    .ds-rm-row.active .ds-rm-node {
      background: #613EEA;
      color: #FFF;
      box-shadow: 0 0 0 4px #F4F6F9, 0 0 24px rgba(97, 62, 234, 0.6);
    }
    /* Заблокировано */
    .ds-rm-row.locked .ds-rm-node {
      background: #E2E4EB;
      color: #8C8A97;
      box-shadow: 0 0 0 4px #F4F6F9;
    }
    .ds-rm-subnode {
      width: 16px;
      height: 16px;
      background: #34C759;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FFF;
      z-index: 2;
      margin-top: 16px;
      box-shadow: 0 0 0 4px #F4F6F9;
    }
    .ds-rm-line {
      position: absolute;
      top: 56px;
      bottom: -24px;
      width: 2px;
      background: #E2E4EB;
      z-index: 1;
    }
    .ds-rm-row.completed .ds-rm-line {
      background: #34C759;
    }
    .ds-rm-row:last-child .ds-rm-line {
      display: none;
    }

    /* Карточка Roadmap (Темная) */
    .ds-rm-card {
      flex: 1;
      background: #161423; /* Темный фон карточки на светлом фоне страницы */
      border-radius: 20px;
      overflow: hidden;
      position: relative;
      margin-bottom: 24px;
      border: 1px solid rgba(0,0,0,0.1);
      box-shadow: 0 16px 32px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      color: #FFF; /* Текст внутри карточки белый */
    }
    .ds-rm-row.active .ds-rm-card {
      border: 1px solid #613EEA;
      box-shadow: 0 20px 40px rgba(97, 62, 234, 0.2);
    }
    .ds-rm-bg {
      position: absolute;
      top: 0; right: 0; bottom: 0; left: 0;
      background-size: cover;
      background-position: center;
      z-index: 0;
      opacity: 0.4;
      filter: grayscale(80%) contrast(120%);
      transition: all 0.4s ease;
    }
    .ds-rm-row.active .ds-rm-bg {
      opacity: 0.8;
      filter: none;
    }
    .ds-rm-overlay {
      position: absolute;
      top: 0; right: 0; bottom: 0; left: 0;
      background: linear-gradient(90deg, #161423 40%, rgba(22, 20, 35, 0.7) 70%, transparent 100%);
      z-index: 1;
    }
    .ds-rm-row.active .ds-rm-overlay {
      background: linear-gradient(90deg, #1C153B 35%, rgba(28, 21, 59, 0.6) 70%, transparent 100%);
    }

    .ds-rm-content {
      position: relative;
      z-index: 2;
      padding: 24px 32px;
      width: 65%;
    }
    .ds-rm-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      width: 100%;
    }
    .ds-rm-badge {
      font-size: 11px;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .ds-rm-badge.completed { background: rgba(52, 199, 89, 0.15); color: #34C759; }
    .ds-rm-badge.active { background: #613EEA; color: #FFF; }
    .ds-rm-badge.locked { background: transparent; color: transparent; }
    
    .ds-rm-toggle {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #FFF;
      width: 32px; height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: absolute;
      right: -40%;
    }

    .ds-rm-title {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #FFF;
    }
    .ds-rm-row.locked .ds-rm-title {
      color: #A4A1B5;
    }
    .ds-rm-desc {
      font-size: 14px;
      color: #8C8A97;
      margin: 0;
      line-height: 1.5;
    }

    .ds-rm-tasks {
      margin-top: 32px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ds-rm-task {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    }
    .ds-rm-ticon {
      width: 20px; height: 20px;
      border-radius: 50%;
      border: 1px solid rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      color: transparent;
    }
    .ds-rm-ticon.done {
      background: #613EEA; border-color: #613EEA; color: #FFF;
    }
    .ds-rm-ticon.waiting {
      border-color: rgba(255,255,255,0.2);
    }
    .ds-rm-tname {
      color: #E2E0EB;
      flex: 1;
    }
    .ds-rm-tstate {
      font-size: 12px;
      color: #8C8A97;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ds-rm-tstate.done { color: #A282FF; }
    .ds-rm-tstate.action { color: #FF453A; font-weight: 600; }
    
    .ds-rm-tdot {
      width: 6px; height: 6px; border-radius: 50%;
    }
    .ds-rm-tstate.done .ds-rm-tdot { background: #A282FF; box-shadow: 0 0 8px #A282FF; }
    .ds-rm-tstate.action .ds-rm-tdot { background: #FF453A; box-shadow: 0 0 8px #FF453A; }

    .ds-rm-cta {
      margin-top: 24px;
      align-self: flex-start;
      background: #613EEA;
      color: #FFF;
    }
    .ds-rm-cta:hover { background: #7353F5; color: #FFF; }
  `;

  // Подключение стилей в head (один раз)
  if (!document.getElementById('cabinet-student-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'cabinet-student-styles';
    styleEl.innerHTML = dashboardStyles;
    document.head.appendChild(styleEl);
  }

  const roadmapStages = [
    {
      id: 1, title: 'Выбор программы и университета', desc: 'Мы помогли выбрать подходящую программу и университет в Китае',
      status: 'completed', image: 'https://images.unsplash.com/photo-1543097692-fa13c6cd8595?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 2, title: 'Подтвердили уровень языка (HSK)', desc: 'Подтвердили ваш уровень и участие в гранте',
      status: 'completed', image: 'https://images.unsplash.com/photo-1546525848-3ce03ca516f6?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 3, title: 'Сбор документов', desc: 'Собираем все необходимые документы и проверяем их на соответствие требованиям гранта CSC.',
      status: 'active', image: 'https://images.unsplash.com/photo-1522228115018-d838bcce5c3a?auto=format&fit=crop&q=80&w=1200',
      tasks: [
        { id: 1, name: 'Медицинская справка', state: 'В работе', type: 'done' },
        { id: 2, name: 'Фото 3x4', state: 'От тебя', type: 'action' },
        { id: 3, name: 'Скан паспорта', state: 'Ожидает', type: 'waiting' },
        { id: 4, name: 'Аттестат / диплом', state: 'Ожидает', type: 'waiting' },
        { id: 5, name: 'Рекомендательные письма', state: 'Ожидает', type: 'waiting' },
        { id: 6, name: 'Мотивационное письмо', state: 'Ожидает', type: 'waiting' },
        { id: 7, name: 'Справка о несудимости', state: 'Ожидает', type: 'waiting' },
      ]
    },
    {
      id: 4, title: 'Подача документов на грант', desc: 'Подготовим ваш пакет документов и отправим заявку на грант CSC от вашего университета',
      status: 'locked', image: 'https://images.unsplash.com/photo-1508804185872-d7bad80009e9?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 5, title: 'Ожидание результата от CSC', desc: 'CSC рассматривает вашу заявку и принимает решение о предоставлении гранта',
      status: 'locked', image: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 6, title: 'Получение приглашения от университета', desc: 'Университет отправляет вам официальное приглашение для оформления визы и проживания',
      status: 'locked', image: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 7, title: 'Оформление визы и подготовка к поездке', desc: 'Оформляем студенческую визу и готовим вас к переезду в Китай',
      status: 'locked', image: 'https://images.unsplash.com/photo-1551009175-15bdf9dcb580?auto=format&fit=crop&q=80&w=1200'
    },
    {
      id: 8, title: 'Приезд в Китай 🇨🇳', desc: 'Вы приезжаете в Китай, заселяетесь в кампус и начинаете обучение',
      status: 'locked', image: 'https://images.unsplash.com/photo-1505440484611-23c171ad6e96?auto=format&fit=crop&q=80&w=1200'
    }
  ];

  // --- КОМПОНЕНТЫ БЛОКОВ ---

  function BlockToday() {
    return h('div', { className: 'ds-block ds-block-today' },
      h('h2', { className: 'ds-block-title' }, 'Что нужно от тебя'),
      h('div', { className: 'ds-today-grid' },
        h('div', { className: 'ds-tcard' },
          h('div', { className: 'ds-tcard-bg' }),
          h('div', { className: 'ds-tcard-content' },
            h('div', { className: 'ds-tcard-top' },
              h('div', { className: 'ds-tcard-num' }, '1'),
              h('div', { className: 'ds-tcard-icon-l' }, h(Ic.User, { size: 36 }))
            ),
            h('h3', null, 'Фото 33x48'),
            h('p', null, 'Строго белый фон, без улыбки и аксессуаров'),
            h('div', { className: 'ds-tcard-meta' }, h(Ic.Clock, { size: 14 }), '≈ 5 минут'),
            h('div', { style: { marginTop: 'auto' } },
              h('button', { className: 'ds-btn primary', style: { width: '100%' } }, 'Загрузить фото', h(Ic.ArrowUpRight, { size: 16 }))
            )
          )
        ),
        h('div', { className: 'ds-tcard is-purple' },
          h('div', { className: 'ds-tcard-bg' }),
          h('div', { className: 'ds-tcard-content' },
            h('div', { className: 'ds-tcard-top' },
              h('div', { className: 'ds-tcard-num' }, '2'),
              h('div', { className: 'ds-tcard-icon-l' }, h(Ic.Doc, { size: 36 }))
            ),
            h('h3', null, 'Медицинская справка'),
            h('p', null, 'Требуется переоформление или дополнение'),
            h('div', { className: 'ds-tcard-meta' }, h(Ic.Clock, { size: 14 }), 'Дедлайн: 1 день'),
            h('div', { style: { marginTop: 'auto' } },
              h('button', { className: 'ds-btn primary', style: { width: '100%', background: '#F3EFFF', color: '#8C52FF' } }, 'Что делать?', h(Ic.ArrowRight, { size: 16 }))
            )
          )
        )
      )
    );
  }

  function BlockPreparation() {
    return h('div', { className: 'ds-block ds-block-prep' },
      h('h2', { className: 'ds-block-title' }, 'Твоя подготовка'),
      h('div', { className: 'ds-pcard' },
        h('div', { className: 'ds-pcard-header' },
          h('span', { className: 'ds-pcard-tag' }, 'HSK 4')
        ),
        h('div', { className: 'ds-pcard-stat' },
          h('span', { className: 'ds-pcard-num' }, '82'),
          h('span', { className: 'ds-pcard-lbl' }, '% прогресс')
        ),
        h('div', { className: 'ds-pcard-graph' }),
        h('div', { className: 'ds-pcard-footer' },
          h('div', { className: 'ds-pcard-meta' },
            h('span', null, 'До экзамена: ', h('b', { style: { color: '#1C1C28' } }, '24 дня')),
            h('span', null, 'След. урок: Тоны')
          ),
          h('button', { className: 'ds-btn primary' }, 'Открыть обучение', h(Ic.ArrowRight, { size: 16 }))
        )
      )
    );
  }

  function BlockContinue() {
    return h('div', { className: 'ds-block ds-block-cont' },
      h('h2', { className: 'ds-block-title' }, 'Текущий этап'),
      h('div', { className: 'ds-pcard' },
        h('div', null,
          h('div', { className: 'ds-ccard-icon' }, h(Ic.Target, { size: 24 })),
          h('h3', { className: 'ds-ccard-title' }, 'Сбор документов'),
          h('p', { className: 'ds-ccard-desc' }, '5 из 7 документов одобрено. Нужно загрузить медицинскую справку.')
        ),
        h('div', { className: 'ds-pcard-footer' },
          h('button', { className: 'ds-btn primary', style: { alignSelf: 'flex-start' } }, 'Продолжить', h(Ic.ArrowRight, { size: 16 }))
        )
      )
    );
  }

  function BlockHelp() {
    return h('div', { className: 'ds-help-banner' },
      h('div', { className: 'ds-help-info' },
        h('h3', null, 'Возник вопрос?'),
        h('p', null, 'Мы рядом и готовы помочь!')
      ),
      h('div', { className: 'ds-help-actions' },
        h('button', { className: 'ds-btn white' }, h(Ic.Spark, { size: 18 }), 'Спросить AI'),
        h('button', { className: 'ds-btn white', style: { background: 'rgba(255,255,255,0.15)', color: '#FFF' } }, h(Ic.Chat, { size: 18 }), 'Написать куратору')
      )
    );
  }

  function Roadmap() {
    return h('div', { className: 'ds-roadmap' },
      h('h2', { className: 'ds-block-title', style: { marginTop: 20, marginBottom: 30 } }, 'Твой путь в Китай'),
      roadmapStages.map((stage, i) => {
        const isLast = i === roadmapStages.length - 1;
        return h('div', { className: 'ds-rm-row ' + stage.status, key: stage.id },
          h('div', { className: 'ds-rm-timeline' },
            h('div', { className: 'ds-rm-node' }, 
              stage.status === 'locked' ? h(Ic.Lock, { size: 14 }) : stage.id
            ),
            stage.status === 'completed' && h('div', { className: 'ds-rm-subnode' }, h(Ic.Check, { size: 10, strokeWidth: 3 })),
            !isLast && h('div', { className: 'ds-rm-line' })
          ),
          h('div', { className: 'ds-rm-card' },
            h('div', { className: 'ds-rm-bg', style: { backgroundImage: 'url(' + stage.image + ')' } }),
            h('div', { className: 'ds-rm-overlay' }),
            h('div', { className: 'ds-rm-content' },
              h('div', { className: 'ds-rm-header' },
                stage.status !== 'locked' && h('div', { className: 'ds-rm-badge ' + stage.status }, 
                  stage.status === 'completed' ? 'Завершено' : 'В процессе'
                ),
                h('button', { className: 'ds-rm-toggle' }, h(Ic.ChevronDown, { size: 18 }))
              ),
              h('h3', { className: 'ds-rm-title' }, stage.title),
              h('p', { className: 'ds-rm-desc' }, stage.desc),
              
              stage.status === 'active' && h('div', { className: 'ds-rm-tasks' },
                stage.tasks.map(t => h('div', { className: 'ds-rm-task', key: t.id },
                  h('div', { className: 'ds-rm-ticon ' + t.type }, 
                    t.type === 'done' ? h(Ic.Check, { size: 12, strokeWidth: 3 }) : null
                  ),
                  h('span', { className: 'ds-rm-tname' }, t.name),
                  h('span', { className: 'ds-rm-tstate ' + t.type }, t.state,
                    t.type !== 'waiting' && h('span', { className: 'ds-rm-tdot' })
                  )
                )),
                h('button', { className: 'ds-btn ds-rm-cta' }, 'Перейти к этапу', h(Ic.ArrowRight, { size: 16 }))
              )
            )
          )
        );
      })
    );
  }

  function Sidebar() {
    const navItems = [
      { icon: Ic.Home, label: 'Главная', active: true },
      { icon: Ic.Map, label: 'Мой путь' },
      { icon: Ic.CheckCircle, label: 'Задачи', badge: 2 },
      { icon: Ic.Doc, label: 'Документы' },
      { icon: Ic.Book, label: 'Обучение' },
      { icon: Ic.Star, label: 'Гранты' },
      { icon: Ic.Users, label: 'Куратор' },
      { icon: Ic.Chat, label: 'Сообщество' },
    ];
    return h('aside', { className: 'ds-sidebar' },
      h('div', { className: 'ds-logo' },
        h('div', { className: 'ds-logo-box' }),
        h('span', null, 'EastSide')
      ),
      h('div', { className: 'ds-nav' },
        navItems.map((it, i) => h('button', { key: i, className: 'ds-nav-item' + (it.active ? ' is-active' : '') },
          h('span', { className: 'ds-nav-icon' }, h(it.icon, { size: 20 })),
          h('span', null, it.label),
          it.badge && h('span', { className: 'ds-badge' }, it.badge)
        ))
      ),
      h('div', { style: { marginTop: 'auto' } },
        h('div', { className: 'ds-nav-item', style: { background: 'rgba(255,255,255,0.03)', marginTop: 10 } },
          h('div', { style: { width: 32, height: 32, borderRadius: '50%', background: '#613EEA', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 14, fontWeight: 'bold' } }, 'Д'),
          h('div', { style: { display: 'flex', flexDirection: 'column' } },
            h('span', { style: { color: '#FFF', fontSize: 14 } }, 'Дима Соколов'),
            h('span', { style: { color: '#8C8A97', fontSize: 12 } }, 'ID: 4892')
          )
        )
      )
    );
  }

  // --- ГЛАВНЫЙ РЕНДЕР ---
  function CabinetStudent() {
    return h('div', { className: 'ds-layout' },
      h(Sidebar, null),
      h('main', { className: 'ds-main' },
        h('div', { className: 'ds-container' },
          h(BlockToday, null),
          h('div', { className: 'ds-grid-2' },
            h(BlockPreparation, null),
            h(BlockContinue, null)
          ),
          h(BlockHelp, null),
          h(Roadmap, null)
        )
      )
    );
  }

  // Регистрируем экран в глобальном объекте
  EScreens.CabinetStudent = CabinetStudent;
})();
