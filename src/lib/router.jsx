/* ============================================================================
   EastSide AI — Хеш-роутер (window.ERouter)
   ----------------------------------------------------------------------------
   Маршрутизация по location.hash, чтобы все работало как статика (file:// и
   http) без серверной маршрутизации. Поддержка параметров (/clients/:id) и
   query (?tab=funnel). Экраны регистрируются отдельно (window.EScreens),
   роутер только сопоставляет путь и отдает params/query.
   ============================================================================ */
(function () {
  'use strict';
  const { useState, useEffect, useCallback, createContext, useContext, createElement: h } = React;

  // --- Разбор текущего хеша -> { path, query } ---------------------------
  function parseHash() {
    let raw = window.location.hash || '';
    if (raw.startsWith('#')) raw = raw.slice(1);
    if (raw.startsWith('!')) raw = raw.slice(1); // допускаем #!/path
    if (!raw) raw = '/';
    if (!raw.startsWith('/')) raw = '/' + raw;

    const qIdx = raw.indexOf('?');
    let path = raw;
    const query = {};
    if (qIdx >= 0) {
      path = raw.slice(0, qIdx);
      const qs = raw.slice(qIdx + 1);
      qs.split('&').forEach((pair) => {
        if (!pair) return;
        const [k, v] = pair.split('=');
        query[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    // нормализуем (убираем хвостовой слеш, кроме корня)
    if (path.length > 1) path = path.replace(/\/+$/, '');
    return { path: path || '/', query };
  }

  // --- Сопоставление шаблона "/clients/:id" с реальным путем -------------
  function matchRoute(pattern, path) {
    const pp = pattern.split('/').filter(Boolean);
    const ap = path.split('/').filter(Boolean);
    // wildcard в конце ("/crm/*")
    const hasWild = pp[pp.length - 1] === '*';
    if (!hasWild && pp.length !== ap.length) return null;
    if (hasWild && ap.length < pp.length - 1) return null;

    const params = {};
    for (let i = 0; i < pp.length; i++) {
      const seg = pp[i];
      if (seg === '*') return { params };
      if (seg.startsWith(':')) {
        params[seg.slice(1)] = decodeURIComponent(ap[i]);
      } else if (seg !== ap[i]) {
        return null;
      }
    }
    return { params };
  }

  // --- Навигация ---------------------------------------------------------
  function navigate(to, opts) {
    opts = opts || {};
    let hash = to.startsWith('#') ? to : '#' + (to.startsWith('/') ? to : '/' + to);
    if (opts.replace) {
      const url = window.location.href.split('#')[0] + hash;
      window.history.replaceState(null, '', url);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = hash;
    }
    if (opts.top !== false) {
      try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { window.scrollTo(0, 0); }
    }
  }

  // --- Хук текущего маршрута ---------------------------------------------
  function useRoute() {
    const [route, setRoute] = useState(parseHash);
    useEffect(() => {
      const onChange = () => setRoute(parseHash());
      window.addEventListener('hashchange', onChange);
      // гарантируем стартовый хеш
      if (!window.location.hash) navigate('/', { replace: true });
      return () => window.removeEventListener('hashchange', onChange);
    }, []);
    return route;
  }

  const LinkCtx = createContext(null);

  // <ERouter.Link to="/documents">…</ERouter.Link> — внутренняя ссылка
  function Link(props) {
    const { to, replace, onClick, children, className, ...rest } = props;
    const handle = useCallback(
      (e) => {
        e.preventDefault();
        if (onClick) onClick(e);
        navigate(to, { replace });
      },
      [to, replace, onClick]
    );
    const href = '#' + (to && to.startsWith('/') ? to : '/' + (to || ''));
    return h('a', Object.assign({ href, onClick: handle, className }, rest), children);
  }

  // <ERouter.Routes routes={{ '/': Comp, '/clients/:id': Comp }} fallback={NotFound} />
  function Routes(props) {
    const { routes, fallback } = props;
    const route = useRoute();
    const keys = Object.keys(routes);
    for (let i = 0; i < keys.length; i++) {
      const m = matchRoute(keys[i], route.path);
      if (m) {
        const Comp = routes[keys[i]];
        return h(Comp, { params: m.params, query: route.query, path: route.path });
      }
    }
    if (fallback) return h(fallback, { path: route.path, query: route.query });
    return null;
  }

  window.ERouter = {
    parseHash,
    matchRoute,
    navigate,
    useRoute,
    Link,
    Routes,
    LinkCtx,
  };
})();
