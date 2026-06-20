/* ============================================================================
   EastSide UI — SHELL трёхслойки + общие компоненты dark-языка.
   ----------------------------------------------------------------------------
   Регистрируются в window.EUI. Только токены/классы из styles.css — ни одного
   хардкод-цвета/тени/размера в JSX (SVG-горы — единственное исключение: это
   векторный ассет дизайн-системы, ridge/dots/star тянут цвет из токенов).

   Состав:
     AppShell  — каркас: сайдбар (рейл) + светлая плашка + опц. панель-спутник.
                 Мобайл: сайдбар → верхний бар (бренд+чипы), нав в drawer,
                 панель падает ПОД контент.
     Mountain  — единый SVG горы (viewBox 0 0 280 142): точки по гребню (прогресс
                 через opacity), звезда на вершине по статусу.
     PathPanel — готовая панель-спутник (kicker+title+гора+gleam+steps+widget).
     Banner    — маркетинговый баннер без давления (kicker+title+sub+cta).
     Sheet     — алиас Modal (bottom-sheet на мобиле уже встроен в .e-modal).
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = React;
  const EUI = (window.EUI = window.EUI || {});
  const cx = EUI.cx || function () { return Array.prototype.filter.call(arguments, Boolean).join(' '); };
  const Link = (window.ERouter && window.ERouter.Link) || null;

  // ── Sidebar трёхслойки (рейл) ──────────────────────────────────────────
  // props: brand {name, sub, to}, profile {name, role, mascot, online},
  //        items [{icon,label,to,onClick,active,done,badge}], footer (массив чипов),
  //        onLogout, drawer (bool — рендер для мобильного drawer)
  function Rail(props) {
    const { brand, profile, items = [], onLogout, footer, drawer, onMenu, className } = props;
    const Ic = window.EIcons || {};
    const navItem = (it, i) => {
      const inner = [
        it.icon ? h(it.icon, { size: 19, key: 'i' }) : null,
        h('span', { key: 'l' }, it.label),
        it.done ? h('span', { className: 'e-sb__tick', key: 't' }, Ic.Check ? h(Ic.Check, { size: 16 }) : '✓') : null,
        it.badge != null ? h('span', { className: 'e-sb__badge', key: 'b' }, h(EUI.Badge, { num: true, tone: 'jade' }, it.badge)) : null,
      ];
      const cls = cx('e-sb__item', it.active && 'is-active');
      if (it.to && Link) return h(Link, { key: i, to: it.to, className: cls, onClick: it.onClick }, inner);
      return h('button', { key: i, type: 'button', className: cls, onClick: it.onClick, 'aria-current': it.active ? 'page' : undefined }, inner);
    };
    return h('aside', { className: cx('e-sb', drawer && 'e-sb-drawer', className), 'aria-label': 'Основная навигация' },
      brand ? h('div', { className: 'e-sb__brand', key: 'br' },
        h('span', { className: 'e-sb__brand-mark', key: 'm' }, brand.mark || 'E'),
        h('div', { key: 'd' },
          h('div', { className: 'e-sb__brand-name' }, brand.name || 'EastSide'),
          brand.sub ? h('div', { className: 'e-sb__brand-sub' }, brand.sub) : null)) : null,
      h('nav', { className: 'e-sb__nav', key: 'nav' }, items.map(navItem)),
      profile ? h('div', { className: 'e-sb__profile', key: 'pf' },
        profile.mascot ? h('span', { className: 'e-sb__mascot', key: 'mc' }, h('img', { src: profile.mascot, alt: '' })) : null,
        h('div', { key: 'd' },
          h('span', { className: 'e-sb__name' }, profile.name),
          h('span', { className: 'e-sb__role' }, profile.role))) : null,
      h('div', { className: 'e-sb__foot', key: 'ft' },
        (footer || []).map((f, i) => h('button', { key: i, type: 'button', className: 'e-sb__mini', onClick: f.onClick },
          h('span', { className: 'e-sb__chip', key: 'c' }, f.icon ? h(f.icon, { size: 15 }) : null), f.label)),
        onLogout ? h('button', { type: 'button', className: 'e-sb__mini is-exit', onClick: onLogout, key: 'x' },
          h('span', { className: 'e-sb__chip', key: 'c' }, Ic.LogOut ? h(Ic.LogOut, { size: 15 }) : '→'), 'Выйти') : null,
        // бургер — только на мобиле (открывает drawer-нав)
        onMenu ? h('button', { type: 'button', className: 'e-sb__mini u-hide-desktop', onClick: onMenu, key: 'menu', 'aria-label': 'Меню', style: { flex: '0 0 auto' } },
          h('span', { className: 'e-sb__chip', key: 'c' }, Ic.Menu ? h(Ic.Menu, { size: 15 }) : '≡')) : null)
    );
  }

  // ── AppShell — трёхслойка целиком ──────────────────────────────────────
  // props: rail {…см. Rail}, panel (ReactNode — содержимое панели-спутника),
  //        children (контент плашки), title (моб. заголовок), className
  function AppShell(props) {
    const { rail, panel, children, className } = props;
    const [navOpen, setNavOpen] = useState(false);

    return h('div', { className: cx('e-shell u-animate-fade', className) },
      // сайдбар (десктоп — рейл; мобайл — строка бренд + чипы + бургер)
      h(Rail, Object.assign({ key: 'rail', onMenu: () => setNavOpen(true) }, rail)),
      // тело: плашка + панель-спутник
      h('div', { className: 'e-shell__body', key: 'body' },
        h('main', { id: 'main', className: 'e-plate' + (panel ? '' : ' e-plate--solo'), key: 'plate' },
          h('div', { className: 'e-plate__scroll' },
            h('div', { className: 'e-plate__col' }, children))),
        panel || null
      ),
      // мобильный drawer с полной навигацией
      h(EUI.Drawer, { open: navOpen, onClose: () => setNavOpen(false), side: 'left', title: (rail && rail.brand && rail.brand.name) || 'Меню', key: 'drawer' },
        h(Rail, Object.assign({}, rail, { drawer: true, brand: null, onMenu: null })))
    );
  }

  // ── Mountain — единый SVG (viewBox 0 0 280 142) ────────────────────────
  // props: progress (0..1 — доля горящих точек), reached (bool — звезда зажжена)
  function Mountain(props) {
    const { progress = 0, reached = false } = props || {};
    const DOTS = 7;
    const lit = Math.round(progress * DOTS);
    const dot = (i, cx0, cy0, r) => h('circle', {
      key: 'd' + i, cx: cx0, cy: cy0, r,
      fill: i < lit - 1 ? 'var(--mtn-dot)' : i < lit ? 'var(--mtn-dot-hi)' : 'var(--mtn-dot)',
      opacity: i < lit ? 1 : 0.28,
    });
    return h('div', { className: 'e-mtn' },
      h('svg', { viewBox: '0 0 280 142', preserveAspectRatio: 'none', fill: 'none' },
        h('defs', null,
          h('filter', { id: 'eGlowDot', x: '-220%', y: '-220%', width: '540%', height: '540%' },
            h('feGaussianBlur', { stdDeviation: '2.2', result: 'b' }),
            h('feMerge', null, h('feMergeNode', { in: 'b' }), h('feMergeNode', { in: 'SourceGraphic' }))),
          h('radialGradient', { id: 'eStarHalo' },
            h('stop', { offset: '0', stopColor: 'rgba(190,218,255,.98)' }),
            h('stop', { offset: '.4', stopColor: 'rgba(55,140,248,.42)' }),
            h('stop', { offset: '1', stopColor: 'rgba(55,140,248,0)' })),
          h('radialGradient', { id: 'ePeakGlow', cx: '50%', cy: '20%', r: '80%' },
            h('stop', { offset: '0', stopColor: 'rgba(60,150,250,.5)' }),
            h('stop', { offset: '1', stopColor: 'rgba(60,150,250,0)' }))),
        h('ellipse', { cx: 212, cy: 40, rx: 74, ry: 60, fill: 'url(#ePeakGlow)' }),
        h('g', { fill: '#CDD2FF' },
          h('circle', { cx: 40, cy: 28, r: 1.1, opacity: '.55' }), h('circle', { cx: 92, cy: 18, r: .8, opacity: '.4' }),
          h('circle', { cx: 150, cy: 34, r: 1, opacity: '.5' }), h('circle', { cx: 64, cy: 58, r: .7, opacity: '.4' }),
          h('circle', { cx: 118, cy: 50, r: .7, opacity: '.4' }), h('circle', { cx: 258, cy: 46, r: 1, opacity: '.5' }),
          h('circle', { cx: 244, cy: 92, r: .7, opacity: '.35' }), h('circle', { cx: 20, cy: 84, r: .8, opacity: '.4' })),
        // low-poly склон (сапфировые фасеты)
        h('path', { d: 'M0 132 L34 126 L34 142 Z', fill: '#1A3A9C' }), h('path', { d: 'M0 132 L34 142 L0 142 Z', fill: '#122A5C' }),
        h('path', { d: 'M34 126 L66 120 L66 142 Z', fill: '#2043AE' }), h('path', { d: 'M34 126 L66 142 L34 142 Z', fill: '#163066' }),
        h('path', { d: 'M66 120 L96 112 L96 142 Z', fill: '#1B3CA0' }), h('path', { d: 'M66 120 L96 142 L66 142 Z', fill: '#132B5E' }),
        h('path', { d: 'M96 112 L124 98 L124 142 Z', fill: '#2246B2' }), h('path', { d: 'M96 112 L124 142 L96 142 Z', fill: '#173268' }),
        h('path', { d: 'M124 98 L150 84 L150 142 Z', fill: '#1D3EA6' }), h('path', { d: 'M124 98 L150 142 L124 142 Z', fill: '#142C60' }),
        h('path', { d: 'M150 84 L176 62 L176 142 Z', fill: '#2449B6' }), h('path', { d: 'M150 84 L176 142 L150 142 Z', fill: '#18346C' }),
        h('path', { d: 'M176 62 L196 46 L196 142 Z', fill: '#1E40A8' }), h('path', { d: 'M176 62 L196 142 L176 142 Z', fill: '#142A60' }),
        h('path', { d: 'M196 46 L212 30 L212 142 Z', fill: '#2A52C2' }), h('path', { d: 'M196 46 L212 142 L196 142 Z', fill: '#1B3CA0' }),
        h('path', { d: 'M212 30 L232 54 L232 142 Z', fill: '#102E64' }), h('path', { d: 'M212 30 L232 142 L212 142 Z', fill: '#0A2358' }),
        h('path', { d: 'M232 54 L252 80 L252 142 Z', fill: '#0C275E' }), h('path', { d: 'M232 54 L252 142 L232 142 Z', fill: '#091F52' }),
        h('path', { d: 'M252 80 L272 104 L272 142 Z', fill: '#0A2358' }), h('path', { d: 'M252 80 L272 142 L252 142 Z', fill: '#07194C' }),
        h('path', { d: 'M272 104 L280 112 L280 142 Z', fill: '#0A2256' }), h('path', { d: 'M272 104 L280 142 L272 142 Z', fill: '#071846' }),
        h('path', { d: 'M212 30 L201 47 L212 50 L223 47 Z', fill: '#79A6F2', opacity: '.85' }),
        h('path', { d: 'M212 30 L212 50 L223 47 Z', fill: '#2A52C2', opacity: '.8' }),
        h('path', { d: 'M0 142 L40 132 L78 137 L112 128 L150 135 L150 142 Z', fill: '#0E2A60', opacity: '.9' }),
        h('path', { d: 'M150 142 L150 135 L186 127 L214 134 L246 126 L280 134 L280 142 Z', fill: '#0A1E50', opacity: '.9' }),
        h('g', { stroke: '#091540', strokeWidth: '.7', opacity: '.5' },
          h('path', { d: 'M34 126 L34 142M66 120 L66 142M96 112 L96 142M124 98 L124 142M150 84 L150 142M176 62 L176 142M196 46 L196 142M232 54 L232 142M252 80 L252 142' })),
        // светящийся гребень (цвет из токена)
        h('path', { d: 'M0 132 L34 126 L66 120 L96 112 L124 98 L150 84 L176 62 L196 46 L212 30', stroke: 'var(--mtn-ridge)', strokeWidth: '1.4', strokeLinejoin: 'round', filter: 'url(#eGlowDot)' }),
        // маршрут-пунктир
        h('path', { d: 'M20 128 C 52 122, 82 115, 110 104 C 142 91, 170 66, 196 46', stroke: 'var(--mtn-ridge)', strokeWidth: '1.3', strokeDasharray: '1 5', strokeLinecap: 'round', opacity: '.7' }),
        // точки по гребню — прогресс через opacity
        h('g', { filter: 'url(#eGlowDot)' },
          dot(0, 20, 128, 3.8), dot(1, 48, 122, 3.1), dot(2, 78, 116, 3.2), dot(3, 108, 105, 3.3),
          dot(4, 136, 91, 3.3), dot(5, 164, 70, 3.4), dot(6, 190, 50, 3.3)),
        // звезда на вершине — по статусу
        h('g', { opacity: reached ? 1 : 0.45 },
          h('circle', { cx: 212, cy: 28, r: 19, fill: 'url(#eStarHalo)' }),
          h('g', { filter: 'url(#eGlowDot)' },
            h('path', { d: 'M212 12l3.3 12.7 12.7 3.3-12.7 3.3-3.3 12.7-3.3-12.7-12.7-3.3 12.7-3.3 3.3-12.7z', fill: 'var(--mtn-star)' }),
            h('path', { d: 'M212 5v46M189 28h46', stroke: 'rgba(244,241,255,.45)', strokeWidth: '.8' })))
      )
    );
  }

  // ── PathPanel — готовая панель-спутник ─────────────────────────────────
  // props: kicker, title, progress (0..1), reached, pct (число), gleamCap,
  //        steps [{n|icon, label, val, status: done|active|upcoming, onClick}],
  //        widget {head, text, go, onClick}, children (любой доп. контент сверху)
  function PathPanel(props) {
    const { kicker, title, progress = 0, reached, pct, gleamCap = 'Готовность', steps = [], widget, children, className } = props;
    const Ic = window.EIcons || {};
    const pctVal = pct != null ? pct : Math.round(progress * 100);
    return h('aside', { className: cx('e-panel', className), 'aria-label': title || 'Панель пути' },
      kicker ? h('div', { className: 'e-panel__kicker', key: 'k' }, kicker) : null,
      title ? h('div', { className: 'e-panel__title', key: 't' }, title) : null,
      children || null,
      h(Mountain, { progress, reached, key: 'mtn' }),
      h('div', { className: 'e-gleam', key: 'gl' },
        h('span', { className: 'e-gleam__cap' }, gleamCap),
        h('div', { className: 'e-gleam__track' }, h('div', { className: 'e-gleam__fill', style: { width: pctVal + '%' } })),
        h('span', { className: 'e-gleam__pct' }, pctVal + '%')),
      steps.length ? h('div', { className: 'e-steps', key: 'st' },
        steps.map((s, i) => h(s.onClick ? 'button' : 'div', {
          key: i, type: s.onClick ? 'button' : undefined,
          className: cx('e-step', s.status === 'done' && 'is-done', s.status === 'active' && 'is-active'),
          onClick: s.onClick,
        },
          h('span', { className: 'e-step__n', key: 'n' }, s.icon ? h(s.icon, { size: 14 }) : (s.n != null ? s.n : i + 1)),
          h('span', { className: 'e-step__label', key: 'l' }, s.label),
          s.val != null ? h('span', { className: 'e-step__val', key: 'v' }, s.val) : null))) : null,
      widget ? h(widget.onClick && Link && widget.to ? Link : 'button', Object.assign(
        { className: 'e-widget', style: { marginTop: 'auto' }, key: 'w' },
        widget.to && Link ? { to: widget.to } : { type: 'button', onClick: widget.onClick }),
        h('div', { className: 'e-widget__head', key: 'h' }, Ic.Star ? h(Ic.Star, { size: 14 }) : null, widget.head),
        widget.text ? h('p', { key: 'p' }, widget.text) : null,
        widget.go ? h('span', { className: 'e-widget__go', key: 'g' }, widget.go, Ic.ArrowRight ? h(Ic.ArrowRight, { size: 13 }) : '→') : null
      ) : null
    );
  }

  // ── Banner — маркетинговый баннер без давления ─────────────────────────
  // props: kicker, title, text, cta (label), onCta, to, tone (plate|dark), icon
  function Banner(props) {
    const { kicker, title, text, cta, onCta, to, tone = 'dark', className } = props;
    const Ic = window.EIcons || {};
    const body = [
      kicker ? h('span', { className: 'e-banner__kick', key: 'k' }, h('i', { className: 'e-banner__pulse' }), kicker) : null,
      h('span', { className: 'e-banner__title', key: 't' }, title),
      text ? h('span', { className: 'e-banner__sub', key: 's' }, text) : null,
      cta ? h('span', { className: 'e-btn e-btn--glow e-banner__cta', key: 'c' }, h('span', null, cta),
        Ic.ArrowRight ? h(Ic.ArrowRight, { size: 15 }) : '→') : null,
    ];
    const cls = cx('e-banner', 'e-banner--' + tone, className);
    if (to && Link) return h(Link, { to, className: cls }, h('span', { className: 'e-banner__body' }, body));
    return h('button', { type: 'button', className: cls, onClick: onCta }, h('span', { className: 'e-banner__body' }, body));
  }

  // Sheet = Modal (bottom-sheet на мобиле уже в .e-modal). Алиас для семантики.
  const Sheet = EUI.Modal;

  Object.assign(EUI, { Rail, AppShell, Mountain, PathPanel, Banner, Sheet });
})();
