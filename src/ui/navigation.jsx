/* ============================================================================
   EastSide UI — Навигация: NavItem, Sidebar (десктоп рейл), Topbar,
   BottomNav (моб), Milestones/Stepper, HStepper.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h } = React;
  const EUI = (window.EUI = window.EUI || {});
  const cx = EUI.cx || function () { return Array.prototype.filter.call(arguments, Boolean).join(' '); };
  const Link = (window.ERouter && window.ERouter.Link) || null;

  // --- NavItem ------------------------------------------------------------
  function NavItem(props) {
    const { icon, label, active, to, onClick, dot, badge, className } = props;
    const Ic = window.EIcons || {};
    const inner = [
      icon ? h(icon, { size: 19, className: 'e-nav-item__ic', key: 'i' }) : null,
      h('span', { className: 'u-grow u-truncate', key: 'l' }, label),
      dot ? h('span', { className: 'e-nav-item__dot', key: 'd' }) : null,
      badge != null ? h('span', { className: 'e-nav-item__badge', key: 'b' }, h(EUI.Badge, { num: true, tone: 'jade' }, badge)) : null,
    ];
    const cls = cx('e-nav-item', active && 'is-active', className);
    if (to && Link) return h(Link, { to, className: cls, onClick }, inner);
    return h('button', { type: 'button', className: cls, onClick, 'aria-current': active ? 'page' : undefined }, inner);
  }

  // --- Sidebar (десктоп рейл) ---------------------------------------------
  // props: brand {name,mark}, sections [{label, items:[{icon,label,to,active,dot,badge}]}],
  //        user {name,role,initials,avatar}, footer
  function Sidebar(props) {
    const { brand, sections = [], user, footer, className } = props;
    return h('nav', { className: cx('e-rail', className), 'aria-label': 'Основная навигация' },
      brand ? h('div', { className: 'e-rail__brand', key: 'br' },
        h('span', { className: 'e-rail__brand-mark', key: 'm' }, brand.mark || 'E'),
        h('span', { className: 'e-rail__brand-name', key: 'n' }, brand.name || 'EastSide')) : null,
      sections.map((s, si) => h('div', { className: 'e-rail__section', key: si },
        s.label ? h('div', { className: 'e-rail__section-label' }, s.label) : null,
        (s.items || []).map((it, ii) => h(NavItem, Object.assign({ key: ii }, it))))),
      h('div', { className: 'e-rail__foot', key: 'foot' },
        user ? h('div', { className: 'e-rail__user', key: 'u' },
          h(EUI.Avatar, { name: user.name, initials: user.initials, src: user.avatar, size: 'md', key: 'a' }),
          h('div', { className: 'u-grow', style: { minWidth: 0 }, key: 'd' },
            h('div', { className: 'e-rail__user-name u-truncate' }, user.name),
            h('div', { className: 'e-rail__user-role u-truncate' }, user.role))) : null,
        footer || null
      )
    );
  }

  // --- Topbar -------------------------------------------------------------
  function Topbar(props) {
    const { title, left, right, onMenu, className } = props;
    const Ic = window.EIcons || {};
    return h('header', { className: cx('e-topbar', className) },
      onMenu ? h('button', { type: 'button', className: 'e-icon-btn u-hide-desktop', 'aria-label': 'Меню', onClick: onMenu, key: 'm' }, Ic.Menu ? h(Ic.Menu, { size: 20 }) : '≡') : null,
      left || null,
      title ? h('div', { className: 'e-topbar__title u-truncate', key: 't' }, title) : null,
      h('div', { className: 'e-topbar__spacer', key: 'sp' }),
      right || null
    );
  }

  // --- BottomNav (моб) ----------------------------------------------------
  // props: items [{icon,label,to,active,onClick}]
  function BottomNav(props) {
    const { items = [], className } = props;
    return h('nav', { className: cx('e-bottomnav', className), 'aria-label': 'Нижняя навигация' },
      items.map((it, i) => {
        const inner = [
          it.icon ? h(it.icon, { size: 22, key: 'i' }) : null,
          h('span', { key: 'l' }, it.label),
        ];
        const cls = cx('e-bottomnav__item', it.active && 'is-active');
        if (it.to && Link) return h(Link, { key: i, to: it.to, className: cls, onClick: it.onClick, 'aria-current': it.active ? 'page' : undefined }, inner);
        return h('button', { key: i, type: 'button', className: cls, onClick: it.onClick, 'aria-current': it.active ? 'page' : undefined }, inner);
      }));
  }

  // --- Milestones (дорожная карта) ----------------------------------------
  // props: items [{title, period, status: done|current|upcoming, summary,
  //                owner, tasks:[{title,status}]}]
  function Milestones(props) {
    const { items = [], className } = props;
    const Ic = window.EIcons || {};
    const taskIcon = (st) => st === 'done' ? Ic.CheckCircle : st === 'in_review' ? Ic.Hourglass : Ic.Clock;
    return h('div', { className: cx('e-milestones', className) },
      items.map((m, i) => h('div', { className: cx('e-ms', 'e-ms--' + (m.status || 'upcoming')), key: m.id || i },
        h('div', { className: 'e-ms__spine', key: 's' },
          h('div', { className: 'e-ms__node', key: 'n' },
            m.status === 'done' ? (Ic.Check ? h(Ic.Check, { size: 18 }) : '✓') : (i + 1)),
          h('div', { className: 'e-ms__line', key: 'ln' })),
        h('div', { className: 'e-ms__body', key: 'b' },
          m.period ? h('div', { className: 'e-ms__period' }, m.period) : null,
          h('div', { className: 'e-ms__title' }, m.title),
          m.summary ? h('div', { className: 'e-ms__summary' }, m.summary) : null,
          m.owner ? h('div', { className: 'e-ms__owner' },
            h(EUI.Pill, { tone: m.status === 'current' ? 'info' : 'neutral' }, m.owner + (m.status === 'current' ? ' — следующий шаг' : ''))) : null,
          m.tasks && m.tasks.length ? h('div', { className: 'e-ms__tasks' },
            m.tasks.map((t, ti) => {
              const TI = taskIcon(t.status);
              return h('div', { className: cx('e-ms__task', t.status === 'done' && 'e-ms__task--done'), key: ti },
                TI ? h(TI, { size: 15, className: 'e-ms__task-ic', key: 'i' }) : null,
                h('span', { key: 'l' }, t.title));
            })) : null
        )
      ))
    );
  }

  // --- HStepper (горизонтальный, для анкеты) ------------------------------
  // props: steps (число), current (0-based)
  function HStepper(props) {
    const { steps = 1, current = 0, className } = props;
    return h('div', { className: cx('e-stepper', className), 'aria-label': 'Шаг ' + (current + 1) + ' из ' + steps },
      Array.from({ length: steps }).map((_, i) =>
        h('span', { key: i, className: cx('e-stepper__seg', i < current && 'is-done', i === current && 'is-current') })));
  }

  Object.assign(EUI, { NavItem, Sidebar, Topbar, BottomNav, Milestones, HStepper });
})();
