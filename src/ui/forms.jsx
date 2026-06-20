/* ============================================================================
   EastSide UI — Формы: FormField, Input, Textarea, Select, Switch,
   SegmentedControl, FileUpload/Dropzone.
   Контролируемые и неконтролируемые, все состояния (incl. error/disabled).
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState, useRef, useEffect, useCallback } = React;
  const EUI = (window.EUI = window.EUI || {});
  const cx = EUI.cx || function () { return Array.prototype.filter.call(arguments, Boolean).join(' '); };

  // --- FormField: label + control + hint/error ---------------------------
  function FormField(props) {
    const { label, hint, error, required, htmlFor, children, className } = props;
    const Ic = window.EIcons || {};
    return h('div', { className: cx('e-field', className) },
      label ? h('label', { className: 'e-field__label', htmlFor, key: 'l' }, label, required ? h('span', { className: 'e-field__req', key: 'r' }, '*') : null) : null,
      children,
      error ? h('span', { className: 'e-field__error', key: 'e' }, Ic.AlertCircle ? h(Ic.AlertCircle, { size: 13, key: 'i' }) : null, error)
        : hint ? h('span', { className: 'e-field__hint', key: 'h' }, hint) : null
    );
  }

  // --- Input --------------------------------------------------------------
  function Input(props) {
    const { error, iconLeft, action, className, ...rest } = props;
    const Ic = window.EIcons || {};
    const input = h('input', Object.assign({ className: cx('e-input', error && 'is-error', className) }, rest));
    if (!iconLeft && !action) return input;
    return h('div', { className: 'e-input-wrap' },
      iconLeft ? h('span', { className: 'e-input-wrap__icon', key: 'i' }, h(iconLeft, { size: 18 })) : null,
      input,
      action ? h('span', { className: 'e-input-wrap__action', key: 'a' }, action) : null
    );
  }

  function Textarea(props) {
    const { error, className, ...rest } = props;
    return h('textarea', Object.assign({ className: cx('e-textarea', error && 'is-error', className) }, rest));
  }

  // --- Select (кастомный дропдаун) ---------------------------------------
  // props: options [{value,label}], value, onChange, placeholder, disabled, error
  function Select(props) {
    const { options = [], value, onChange, placeholder = 'Выбери...', disabled, error, className } = props;
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const Ic = window.EIcons || {};
    const current = options.find((o) => o.value === value);

    useEffect(() => {
      if (!open) return;
      const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onKey);
      return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
    }, [open]);

    const pick = (o) => { if (onChange) onChange(o.value, o); setOpen(false); };

    return h('div', { className: cx('e-select', open && 'is-open', className), ref },
      h('button', {
        type: 'button', className: cx('e-select__btn', !current && 'is-placeholder', error && 'is-error'),
        onClick: () => !disabled && setOpen((v) => !v), disabled,
        'aria-haspopup': 'listbox', 'aria-expanded': open, key: 'b'
      },
        h('span', { className: 'u-truncate', key: 't' }, current ? current.label : placeholder),
        Ic.ChevronDown ? h(Ic.ChevronDown, { size: 18, className: 'e-select__caret', key: 'c' }) : null
      ),
      open ? h('div', { className: 'e-select__menu', role: 'listbox', key: 'm' },
        options.map((o) => h('button', {
          key: o.value, type: 'button', role: 'option', 'aria-selected': o.value === value,
          className: cx('e-select__opt', o.value === value && 'is-selected'),
          onClick: () => pick(o)
        }, h('span', { key: 'l' }, o.label),
          o.value === value && Ic.Check ? h(Ic.Check, { size: 16, key: 'k' }) : null))
      ) : null
    );
  }

  // --- Switch -------------------------------------------------------------
  function Switch(props) {
    const { checked, onChange, label, disabled, jade, id, className } = props;
    const toggle = () => { if (!disabled && onChange) onChange(!checked); };
    return h('label', { className: cx('e-switch-row', disabled && 'is-disabled', className) },
      h('input', { type: 'checkbox', className: 'u-sr-only', role: 'switch', 'aria-checked': !!checked, checked: !!checked, onChange: toggle, disabled, id, key: 'i' }),
      h('span', { className: cx('e-switch', checked && 'is-on', jade && 'is-jade'), 'aria-hidden': 'true', key: 's' }),
      label ? h('span', { className: 'e-switch-row__label', key: 'l' }, label) : null
    );
  }

  // --- SegmentedControl ---------------------------------------------------
  // props: options [{value,label,icon}], value, onChange
  function SegmentedControl(props) {
    const { options = [], value, onChange, className, ariaLabel } = props;
    return h('div', { className: cx('e-seg', className), role: 'group', 'aria-label': ariaLabel },
      options.map((o) => h('button', {
        key: o.value, type: 'button', className: cx('e-seg__item', o.value === value && 'is-active'),
        'aria-pressed': o.value === value, onClick: () => onChange && onChange(o.value)
      }, o.icon ? h(o.icon, { size: 16, key: 'i' }) : null, o.label ? h('span', { key: 'l' }, o.label) : null))
    );
  }

  // --- FileUpload / Dropzone ---------------------------------------------
  // props: onFiles(fileList), accept, multiple, files [{name,size,progress,status}]
  function FileUpload(props) {
    const { onFiles, accept, multiple, hint = 'PDF, JPG или PNG, до 10 МБ', files = [], error, onRemove } = props;
    const [drag, setDrag] = useState(false);
    const inputRef = useRef(null);
    const Ic = window.EIcons || {};

    const openPicker = () => inputRef.current && inputRef.current.click();
    const onDrop = (e) => { e.preventDefault(); setDrag(false); if (onFiles) onFiles(e.dataTransfer.files); };
    const onPick = (e) => { if (onFiles) onFiles(e.target.files); };

    return h('div', { className: 'u-stack-3' },
      h('div', {
        className: cx('e-dropzone', drag && 'is-drag', error && 'is-error'), role: 'button', tabIndex: 0,
        onClick: openPicker, onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); } },
        onDragOver: (e) => { e.preventDefault(); setDrag(true); }, onDragLeave: () => setDrag(false), onDrop, key: 'z'
      },
        Ic.Upload ? h(Ic.Upload, { size: 24, className: 'e-dropzone__icon', key: 'i' }) : null,
        h('div', { className: 'e-dropzone__title', key: 't' }, 'Перетащи файл или выбери'),
        h('div', { className: 'e-dropzone__hint', key: 'h' }, error || hint),
        h('input', { ref: inputRef, type: 'file', accept, multiple, onChange: onPick, className: 'u-sr-only', tabIndex: -1, key: 'in' })
      ),
      files.length ? h('div', { className: 'u-stack-2', key: 'list' },
        files.map((f, i) => h('div', { className: 'e-file-chip', key: f.name + i },
          Ic.File ? h(Ic.File, { size: 20, className: 'e-file-chip__icon', key: 'i' }) : null,
          h('div', { className: 'e-file-chip__body', key: 'b' },
            h('div', { className: 'e-file-chip__name' }, f.name),
            h('div', { className: 'e-file-chip__meta' }, f.size || ''),
            typeof f.progress === 'number' && f.progress < 100
              ? h('div', { className: 'e-file-chip__bar' }, h('i', { style: { width: f.progress + '%' } })) : null
          ),
          onRemove ? h('button', { type: 'button', className: 'e-icon-btn e-icon-btn--sm', 'aria-label': 'Удалить', onClick: () => onRemove(f, i), key: 'x' }, Ic.Close ? h(Ic.Close, { size: 16 }) : '×') : null
        ))
      ) : null
    );
  }

  Object.assign(EUI, { FormField, Input, Textarea, Select, Switch, SegmentedControl, FileUpload });
})();
