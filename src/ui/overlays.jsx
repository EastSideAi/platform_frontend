/* ============================================================================
   EastSide UI — Оверлеи и обратная связь: Modal/Dialog, Drawer, Alert,
   Toast + ToastHost (window.EToast.push).
   Фокус-ловушка, возврат фокуса, Esc, клик по оверлею. ARIA.
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useEffect, useRef, useState, useCallback } = React;
  const EUI = (window.EUI = window.EUI || {});
  const cx = EUI.cx || function () { return Array.prototype.filter.call(arguments, Boolean).join(' '); };

  // фокус-ловушка внутри узла
  function useFocusTrap(active, ref, restoreRef) {
    useEffect(() => {
      if (!active) return;
      const prev = document.activeElement;
      if (restoreRef) restoreRef.current = prev;
      const node = ref.current;
      const sel = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';
      const focusFirst = () => {
        if (!node) return;
        const f = node.querySelector(sel);
        if (f) f.focus(); else node.focus();
      };
      const t = setTimeout(focusFirst, 20);
      const onKey = (e) => {
        if (e.key !== 'Tab' || !node) return;
        const els = Array.prototype.slice.call(node.querySelectorAll(sel)).filter((el) => el.offsetParent !== null);
        if (!els.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      };
      document.addEventListener('keydown', onKey);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        clearTimeout(t);
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prevOverflow;
        if (prev && prev.focus) try { prev.focus(); } catch (e) {}
      };
    }, [active]);
  }

  // --- Modal --------------------------------------------------------------
  function Modal(props) {
    const { open, onClose, title, children, footer, className } = props;
    const ref = useRef(null);
    const Ic = window.EIcons || {};
    useFocusTrap(open, ref);
    useEffect(() => {
      if (!open) return;
      const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    return h('div', { className: 'e-overlay', onMouseDown: (e) => { if (e.target === e.currentTarget && onClose) onClose(); } },
      h('div', { className: cx('e-modal', className), role: 'dialog', 'aria-modal': 'true', 'aria-label': typeof title === 'string' ? title : undefined, ref, tabIndex: -1 },
        h('div', { className: 'e-modal__handle', 'aria-hidden': 'true', key: 'hd' }),
        h('div', { className: 'e-modal__head', key: 'h' },
          h('div', { className: 'e-modal__title' }, title),
          onClose ? h('button', { type: 'button', className: 'e-icon-btn', 'aria-label': 'Закрыть', onClick: onClose, key: 'x' }, Ic.Close ? h(Ic.Close, { size: 18 }) : '×') : null),
        h('div', { className: 'e-modal__body', key: 'b' }, children),
        footer ? h('div', { className: 'e-modal__foot', key: 'f' }, footer) : null
      )
    );
  }

  // --- Drawer -------------------------------------------------------------
  function Drawer(props) {
    const { open, onClose, side = 'left', title, children, className } = props;
    const ref = useRef(null);
    const Ic = window.EIcons || {};
    useFocusTrap(open, ref);
    useEffect(() => {
      if (!open) return;
      const onKey = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);
    if (!open) return null;
    return h('div', { className: 'e-drawer-overlay', onMouseDown: (e) => { if (e.target === e.currentTarget && onClose) onClose(); } },
      h('aside', { className: cx('e-drawer', 'e-drawer--' + side, className), role: 'dialog', 'aria-modal': 'true', ref, tabIndex: -1 },
        h('div', { className: 'e-drawer__head', key: 'h' },
          h('div', { className: 'e-modal__title' }, title),
          onClose ? h('button', { type: 'button', className: 'e-icon-btn', 'aria-label': 'Закрыть', onClick: onClose, key: 'x' }, Ic.Close ? h(Ic.Close, { size: 18 }) : '×') : null),
        children
      )
    );
  }

  // --- Alert (встроенный) -------------------------------------------------
  function Alert(props) {
    const { tone = 'info', title, children, icon, action, className } = props;
    const Ic = window.EIcons || {};
    const def = { success: Ic.CheckCircle, warning: Ic.AlertTriangle, danger: Ic.AlertCircle, info: Ic.Info }[tone];
    const I = icon || def;
    return h('div', { className: cx('e-alert', 'e-alert--' + tone, className), role: tone === 'danger' ? 'alert' : 'status' },
      I ? h(I, { size: 19, className: 'e-alert__icon', key: 'i' }) : null,
      h('div', { className: 'u-grow', key: 'b' },
        title ? h('div', { className: 'e-alert__title' }, title) : null,
        children ? h('div', { className: 'e-alert__text' }, children) : null),
      action ? h('div', { key: 'a', style: { flexShrink: 0 } }, action) : null
    );
  }

  // --- Toast --------------------------------------------------------------
  function Toast(props) {
    const { tone = 'info', title, children, onClose } = props;
    const Ic = window.EIcons || {};
    const def = { success: Ic.CheckCircle, warning: Ic.AlertTriangle, danger: Ic.AlertCircle, info: Ic.Info }[tone];
    return h('div', { className: cx('e-toast', 'e-toast--' + tone), role: 'status', 'aria-live': 'polite' },
      def ? h(def, { size: 19, className: 'e-toast__icon', key: 'i' }) : null,
      h('div', { className: 'e-toast__body', key: 'b' },
        title ? h('div', { className: 'e-toast__title' }, title) : null,
        children ? h('div', { className: 'e-toast__text' }, children) : null),
      onClose ? h('button', { type: 'button', className: 'e-icon-btn e-icon-btn--sm', 'aria-label': 'Закрыть', onClick: onClose, key: 'x' }, Ic.Close ? h(Ic.Close, { size: 15 }) : '×') : null
    );
  }

  // --- ToastHost: глобальный стек, window.EToast.push({tone,title,text}) ---
  let pushFn = null;
  function ToastHost() {
    const [items, setItems] = useState([]);
    useEffect(() => {
      pushFn = (t) => {
        const id = Date.now() + Math.random();
        const item = Object.assign({ id, tone: 'info', duration: 5000 }, t);
        setItems((arr) => arr.concat(item));
        if (item.duration) setTimeout(() => setItems((arr) => arr.filter((x) => x.id !== id)), item.duration);
      };
      return () => { pushFn = null; };
    }, []);
    const remove = (id) => setItems((arr) => arr.filter((x) => x.id !== id));
    if (!items.length) return null;
    return h('div', { className: 'e-toast-host' },
      items.map((it) => h(Toast, { key: it.id, tone: it.tone, title: it.title, onClose: () => remove(it.id) }, it.text)));
  }
  window.EToast = { push: (t) => pushFn && pushFn(t) };

  Object.assign(EUI, { Modal, Drawer, Alert, Toast, ToastHost });
})();
