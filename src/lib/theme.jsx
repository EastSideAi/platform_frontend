/* ============================================================================
   EastSide AI — Тема (window.ETheme)
   ----------------------------------------------------------------------------
   Три режима: 'light' | 'dark' | 'system'.
   - light/dark — ставят data-theme на <html>.
   - system — снимают data-theme, тему берет prefers-color-scheme (см. tokens.css).
   Выбор хранится в localStorage('es-theme') — это не ПДн, безопасно.
   Инициализация до рендера (в index.html, без мигания) выставляет атрибут;
   здесь — провайдер, хук и переключатель (солнце / луна / системная).
   ============================================================================ */
(function () {
  'use strict';
  const { useState, useEffect, useCallback, useMemo, createContext, useContext, createElement: h } = React;

  const STORAGE_KEY = 'es-theme';
  const VALID = ['light', 'dark', 'system'];

  function readStored() {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return VALID.indexOf(v) >= 0 ? v : 'system';
    } catch (e) {
      return 'system';
    }
  }

  // Применить выбор к <html>: system -> снять атрибут (идет за ОС).
  function applyTheme(mode) {
    const html = document.documentElement;
    if (mode === 'system') {
      html.removeAttribute('data-theme');
    } else {
      html.setAttribute('data-theme', mode);
    }
  }

  // Какая тема реально показана сейчас (для иконки) — учитывает ОС в режиме system.
  function resolveActive(mode) {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  const ThemeContext = createContext(null);

  function ThemeProvider(props) {
    const [mode, setMode] = useState(readStored);
    const [active, setActive] = useState(() => resolveActive(readStored()));

    // применяем при смене режима
    useEffect(() => {
      applyTheme(mode);
      setActive(resolveActive(mode));
      try { localStorage.setItem(STORAGE_KEY, mode); } catch (e) {}
    }, [mode]);

    // в режиме system слушаем смену системной темы
    useEffect(() => {
      if (!window.matchMedia) return;
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onChange = () => { if (mode === 'system') setActive(resolveActive('system')); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
      return () => {
        if (mq.removeEventListener) mq.removeEventListener('change', onChange);
        else if (mq.removeListener) mq.removeListener(onChange);
      };
    }, [mode]);

    const setTheme = useCallback((m) => { if (VALID.indexOf(m) >= 0) setMode(m); }, []);

    // циклический переключатель: light -> dark -> system -> light
    const cycle = useCallback(() => {
      setMode((m) => (m === 'light' ? 'dark' : m === 'dark' ? 'system' : 'light'));
    }, []);

    const value = useMemo(() => ({ mode, active, setTheme, cycle }), [mode, active, setTheme, cycle]);
    return h(ThemeContext.Provider, { value }, props.children);
  }

  function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
      // запасной вариант вне провайдера — не падаем
      return { mode: readStored(), active: resolveActive(readStored()), setTheme: applyTheme, cycle: function () {} };
    }
    return ctx;
  }

  // --- ThemeToggle ------------------------------------------------------
  // variant: 'cycle' (одна кнопка, иконка по активной теме) |
  //          'segmented' (три варианта: свет / темно / системная)
  function ThemeToggle(props) {
    const { variant = 'cycle', size = 18 } = props || {};
    const { mode, active, setTheme, cycle } = useTheme();
    const Ic = window.EIcons || {};

    if (variant === 'segmented') {
      const opts = [
        { key: 'light', label: 'Свет', Icon: Ic.Sun },
        { key: 'dark', label: 'Темно', Icon: Ic.Moon },
        { key: 'system', label: 'Системная', Icon: Ic.Monitor },
      ];
      return h(
        'div',
        { className: 'e-theme-seg', role: 'group', 'aria-label': 'Тема оформления' },
        opts.map((o) =>
          h(
            'button',
            {
              key: o.key,
              type: 'button',
              className: 'e-theme-seg__btn' + (mode === o.key ? ' is-active' : ''),
              'aria-pressed': mode === o.key,
              onClick: () => setTheme(o.key),
              title: o.label,
            },
            o.Icon ? h(o.Icon, { size }) : null,
            h('span', { className: 'e-theme-seg__label' }, o.label)
          )
        )
      );
    }

    // cycle: показываем иконку по активной теме, в title — следующий режим
    const ActiveIcon = mode === 'system' ? Ic.Monitor : active === 'dark' ? Ic.Moon : Ic.Sun;
    const nextLabel = mode === 'light' ? 'переключить на темную' : mode === 'dark' ? 'переключить на системную' : 'переключить на светлую';
    const label = 'Тема: ' + (mode === 'light' ? 'светлая' : mode === 'dark' ? 'темная' : 'системная') + ', ' + nextLabel;
    return h(
      'button',
      {
        type: 'button',
        className: 'e-icon-btn e-icon-btn--ghost',
        onClick: cycle,
        'aria-label': label,
        title: label,
      },
      ActiveIcon ? h(ActiveIcon, { size }) : '◐'
    );
  }

  window.ETheme = { ThemeProvider, useTheme, ThemeToggle, applyTheme, readStored, STORAGE_KEY };
})();
