/* ============================================================================
   EastSide UI — Примитивы: Button, IconButton, Badge, Tag, Pill, Avatar,
   AvatarGroup, Tooltip, Spinner.
   Регистрируются в window.EUI. Только токены/классы из styles.css.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h } = React;
  const EUI = (window.EUI = window.EUI || {});

  function cx() {
    return Array.prototype.filter.call(arguments, Boolean).join(' ');
  }

  // --- Button -------------------------------------------------------------
  // props: variant primary|secondary|ghost|danger|jade, size sm|md|lg,
  //        block, pill, solid, loading, iconLeft, iconRight, as
  function Button(props) {
    const {
      variant = 'primary', size = 'md', block, pill, solid, loading, disabled,
      iconLeft, iconRight, children, className, as = 'button', ...rest
    } = props;
    const cls = cx(
      'e-btn', 'e-btn--' + variant,
      size !== 'md' && 'e-btn--' + size,
      block && 'e-btn--block', pill && 'e-btn--pill', solid && 'e-btn--solid',
      loading && 'is-loading', className
    );
    return h(
      as, Object.assign({ className: cls, disabled: disabled || loading }, as === 'button' ? { type: rest.type || 'button' } : null, rest),
      iconLeft ? h(iconLeft, { size: size === 'lg' ? 20 : 18, key: 'l' }) : null,
      children != null ? h('span', { key: 's' }, children) : null,
      iconRight ? h(iconRight, { size: size === 'lg' ? 20 : 18, key: 'r' }) : null
    );
  }

  // --- IconButton ---------------------------------------------------------
  function IconButton(props) {
    const { icon, label, solid, size = 'md', className, ...rest } = props;
    return h(
      'button',
      Object.assign({ type: 'button', className: cx('e-icon-btn', solid && 'e-icon-btn--solid', size === 'sm' && 'e-icon-btn--sm', className), 'aria-label': label, title: label }, rest),
      icon ? h(icon, { size: size === 'sm' ? 16 : 19 }) : null
    );
  }

  // --- Badge / Tag --------------------------------------------------------
  function Badge(props) {
    const { tone, solid, num, tag, icon, children, className, ...rest } = props;
    const cls = cx('e-badge', tag && 'e-tag', tone && 'e-badge--' + tone, solid && 'e-badge--solid', num && 'e-badge--num', className);
    return h('span', Object.assign({ className: cls }, rest), icon ? h(icon, { size: 12, key: 'i' }) : null, children);
  }

  // --- Pill (status, точка слева) ----------------------------------------
  function Pill(props) {
    const { tone = 'neutral', children, className, ...rest } = props;
    return h('span', Object.assign({ className: cx('e-pill', 'e-pill--' + tone, className) }, rest),
      h('span', { className: 'e-pill__dot', key: 'd' }), h('span', { key: 't' }, children));
  }

  // --- Avatar -------------------------------------------------------------
  function Avatar(props) {
    const { src, name = '', initials, size = 'md', status, className, ...rest } = props;
    const ini = initials || (name ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() : '?');
    return h('span', Object.assign({ className: cx('e-avatar', 'e-avatar--' + size, className) }, rest),
      src ? h('img', { src, alt: name, key: 'i' }) : h('span', { key: 'n' }, ini),
      status ? h('span', { className: 'e-avatar__status', key: 's' }) : null);
  }

  function AvatarGroup(props) {
    const { items = [], size = 'sm' } = props;
    return h('span', { className: 'e-avatar-group' }, items.map((it, i) => h(Avatar, Object.assign({ key: i, size }, it))));
  }

  // --- Tooltip ------------------------------------------------------------
  function Tooltip(props) {
    const { label, children } = props;
    return h('span', { className: 'e-tooltip-wrap', tabIndex: 0 },
      children, h('span', { className: 'e-tooltip', role: 'tooltip', key: 't' }, label));
  }

  // --- Spinner ------------------------------------------------------------
  function Spinner(props) {
    const { size = 18 } = props || {};
    return h('span', { className: 'e-spinner', style: { display: 'inline-block', width: size, height: size, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: 'var(--r-pill)', animation: 'e-spin .7s linear infinite' }, 'aria-hidden': 'true' });
  }

  Object.assign(EUI, { Button, IconButton, Badge, Pill, Avatar, AvatarGroup, Tooltip, Spinner, cx });
})();
