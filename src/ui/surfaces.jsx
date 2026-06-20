/* ============================================================================
   EastSide UI — Поверхности и данные: Card, Stat, Table, Tabs, ProgressBar,
   RingProgress, EmptyState, Skeleton, Pagination, Breadcrumbs.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = React;
  const EUI = (window.EUI = window.EUI || {});
  const cx = EUI.cx || function () { return Array.prototype.filter.call(arguments, Boolean).join(' '); };

  // --- Card ---------------------------------------------------------------
  function Card(props) {
    const { variant, clickable, title, action, head, children, className, as, ...rest } = props;
    const cls = cx('e-card',
      variant === 'hero' && 'e-card--hero',
      variant === 'inset' && 'e-card--inset',
      variant === 'flat' && 'e-card--flat',
      variant === 'xl' && 'e-card--xl',
      variant === 'pad-sm' && 'e-card--pad-sm',
      clickable && 'e-card--clickable', className);
    const Tag = as || (clickable ? 'button' : 'div');
    const extra = Tag === 'button' ? { type: 'button' } : null;
    return h(Tag, Object.assign({ className: cls }, extra, rest),
      (title || head || action) ? h('div', { className: 'e-card__head', key: 'h' },
        head || (title ? h('h3', { className: 'e-card__title' }, title) : h('span')),
        action || null) : null,
      children
    );
  }

  // --- Stat ---------------------------------------------------------------
  function Stat(props) {
    const { label, value, unit, delta, deltaTone, bordered, tone, className } = props;
    return h('div', { className: cx('e-stat', bordered && 'e-stat--bordered', tone && 'e-stat--' + tone, className) },
      label ? h('div', { className: 'e-stat__label', key: 'l' }, label) : null,
      h('div', { className: 'e-stat__value', key: 'v' }, value, unit ? h('small', { key: 'u' }, unit) : null),
      delta ? h('div', { className: cx('e-stat__delta', deltaTone === 'neg' ? 'e-stat__delta--neg' : 'e-stat__delta--pos'), key: 'd' }, delta) : null
    );
  }

  // --- Table --------------------------------------------------------------
  // props: columns [{key,title,num,render}], rows [], empty
  function Table(props) {
    const { columns = [], rows = [], compact, empty, className, rowKey } = props;
    if (!rows.length && empty) {
      return h('div', { className: 'e-table-wrap' }, empty);
    }
    return h('div', { className: 'e-table-wrap' },
      h('table', { className: cx('e-table', compact && 'e-table--compact', className) },
        h('thead', { key: 'h' }, h('tr', null, columns.map((c) =>
          h('th', { key: c.key, className: c.num ? 'is-num' : null }, c.title)))),
        h('tbody', { key: 'b' }, rows.map((r, i) =>
          h('tr', { key: rowKey ? r[rowKey] : i }, columns.map((c) =>
            h('td', { key: c.key, className: c.num ? 'is-num' : null }, c.render ? c.render(r, i) : r[c.key])))))
      )
    );
  }

  // --- Tabs ---------------------------------------------------------------
  // props: tabs [{key,label}], active, onChange  (controlled or self)
  function Tabs(props) {
    const { tabs = [], active, onChange, className } = props;
    const [self, setSelf] = useState(tabs[0] && tabs[0].key);
    const cur = active != null ? active : self;
    const set = (k) => { if (onChange) onChange(k); if (active == null) setSelf(k); };
    return h('div', { className: cx('e-tabs', className), role: 'tablist' },
      tabs.map((t) => h('button', {
        key: t.key, type: 'button', role: 'tab', 'aria-selected': cur === t.key,
        className: cx('e-tabs__tab', cur === t.key && 'is-active'), onClick: () => set(t.key)
      }, t.label)));
  }

  // --- ProgressBar --------------------------------------------------------
  function ProgressBar(props) {
    const { value = 0, label, showPct, tone, size, className } = props;
    const v = Math.max(0, Math.min(100, Math.round(value)));
    return h('div', { className: cx('e-progress', tone === 'jade' && 'e-progress--jade', size && 'e-progress--' + size, className) },
      (label || showPct) ? h('div', { className: 'e-progress__head', key: 'h' },
        label ? h('span', { className: 'e-progress__label' }, label) : h('span'),
        showPct ? h('span', { className: 'e-progress__pct u-tnum' }, v + '%') : null) : null,
      h('div', { className: 'e-progress__track', role: 'progressbar', 'aria-valuenow': v, 'aria-valuemin': 0, 'aria-valuemax': 100, key: 't' },
        h('div', { className: 'e-progress__fill', style: { width: v + '%' } }))
    );
  }

  // --- RingProgress (кольцевой) ------------------------------------------
  function RingProgress(props) {
    const { value = 0, size = 88, stroke = 8, label } = props;
    const v = Math.max(0, Math.min(100, Math.round(value)));
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const off = c * (1 - v / 100);
    return h('div', { className: 'e-ring-wrap', style: { width: size, height: size } },
      h('svg', { className: 'e-ring', width: size, height: size, key: 's' },
        h('circle', { className: 'e-ring__bg', cx: size / 2, cy: size / 2, r, strokeWidth: stroke, key: 'bg' }),
        h('circle', { className: 'e-ring__fg', cx: size / 2, cy: size / 2, r, strokeWidth: stroke, strokeDasharray: c, strokeDashoffset: off, key: 'fg' })),
      h('span', { className: 'e-ring-wrap__val', style: { fontSize: size * 0.26 }, key: 'v' }, label != null ? label : v + '%')
    );
  }

  // --- EmptyState ---------------------------------------------------------
  function EmptyState(props) {
    const { icon, title, text, action, className } = props;
    const Ic = window.EIcons || {};
    const I = icon || Ic.Ghost;
    return h('div', { className: cx('e-empty', className) },
      I ? h(I, { size: 44, className: 'e-empty__icon', key: 'i' }) : null,
      title ? h('div', { className: 'e-empty__title', key: 't' }, title) : null,
      text ? h('p', { className: 'e-empty__text', key: 'x' }, text) : null,
      action ? h('div', { style: { marginTop: 'var(--sp-2)' }, key: 'a' }, action) : null
    );
  }

  // --- Skeleton -----------------------------------------------------------
  function Skeleton(props) {
    const { variant = 'line', width, height, lines, className, style } = props;
    if (variant === 'text' && lines) {
      return h('div', { className: 'u-stack-2' },
        Array.from({ length: lines }).map((_, i) =>
          h('div', { key: i, className: 'e-skel e-skel--text', style: { width: i === lines - 1 ? '70%' : '100%' } })));
    }
    return h('div', { className: cx('e-skel', 'e-skel--' + variant, className), style: Object.assign({ width, height }, style) });
  }

  // --- Pagination ---------------------------------------------------------
  function Pagination(props) {
    const { page = 1, pages = 1, onChange, className } = props;
    const Ic = window.EIcons || {};
    const go = (p) => { if (p >= 1 && p <= pages && p !== page && onChange) onChange(p); };
    // диапазон с эллипсисами
    const nums = [];
    const push = (n) => nums.push(n);
    const win = 1;
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - win && i <= page + win)) push(i);
      else if (nums[nums.length - 1] !== '…') push('…');
    }
    return h('nav', { className: cx('e-pagination', className), 'aria-label': 'Страницы' },
      h('button', { type: 'button', className: 'e-page-btn', disabled: page <= 1, onClick: () => go(page - 1), 'aria-label': 'Назад', key: 'p' }, Ic.ChevronLeft ? h(Ic.ChevronLeft, { size: 18 }) : '‹'),
      nums.map((n, i) => n === '…'
        ? h('span', { className: 'e-page-ellipsis', key: 'e' + i }, '…')
        : h('button', { type: 'button', key: n, className: cx('e-page-btn', n === page && 'is-active'), 'aria-current': n === page ? 'page' : undefined, onClick: () => go(n) }, n)),
      h('button', { type: 'button', className: 'e-page-btn', disabled: page >= pages, onClick: () => go(page + 1), 'aria-label': 'Вперед', key: 'n' }, Ic.ChevronRight ? h(Ic.ChevronRight, { size: 18 }) : '›')
    );
  }

  // --- Breadcrumbs --------------------------------------------------------
  // props: items [{label, to}]  (last = current)
  function Breadcrumbs(props) {
    const { items = [], className } = props;
    const Ic = window.EIcons || {};
    const Link = (window.ERouter && window.ERouter.Link) || (function (p) { return h('a', { href: p.to }, p.children); });
    return h('nav', { className: cx('e-crumbs', className), 'aria-label': 'Хлебные крошки' },
      items.map((it, i) => {
        const last = i === items.length - 1;
        return h(React.Fragment, { key: i },
          h('span', { className: cx('e-crumbs__item', last && 'is-current') },
            last || !it.to ? it.label : h(Link, { to: it.to }, it.label)),
          !last ? h('span', { className: 'e-crumbs__sep', key: 's' }, Ic.ChevronRight ? h(Ic.ChevronRight, { size: 14 }) : '/') : null
        );
      }));
  }

  Object.assign(EUI, { Card, Stat, Table, Tabs, ProgressBar, RingProgress, EmptyState, Skeleton, Pagination, Breadcrumbs });
})();
