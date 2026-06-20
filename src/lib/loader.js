/* ============================================================================
   EastSide — загрузчик .jsx для no-build режима (window.ELoad)
   ----------------------------------------------------------------------------
   Почему так, а не <script type="text/babel" src=...>:
   Babel-standalone компилирует каждый внешний babel-скрипт отдельно и поднимает
   свои вспомогательные объявления (helpers вроде _excluded/_extends) в начало
   ГЛОБАЛЬНОЙ области. Несколько файлов -> повторное объявление одного и того же
   идентификатора -> "Identifier '_excluded' has already been declared" -> весь
   фронт падает (виден пустой экран).

   Решение: каждый файл компилируем сами и запускаем через new Function(code)().
   Тогда helpers и любой локальный код живут в СОБСТВЕННОЙ области файла и не
   сталкиваются. Файлы как и раньше: каждый — IIFE, регистрирует себя в window
   (window.EUI / ERouter / ETheme / EScreens / ...). Порядок строго последовательный.

   Запуск только по HTTP (статик-сервер). По file:// fetch локальных файлов
   блокируется CORS — это ограничение браузера, не кода.
   ============================================================================ */
(function () {
  'use strict';

  function fail(file, err) {
    console.error('[ELoad] не удалось загрузить ' + file, err);
    var app = document.getElementById('app') || document.body;
    var box = document.createElement('pre');
    box.style.cssText =
      'margin:24px;padding:16px 18px;border-radius:12px;white-space:pre-wrap;' +
      'font:13px/1.5 ui-monospace,monospace;background:var(--danger-soft,#f7e9e4);' +
      'color:var(--danger-ink,#8a3019);border:1px solid rgba(172,62,38,.3)';
    box.textContent =
      'Ошибка загрузки модуля:\n' + file + '\n\n' + (err && err.message ? err.message : err) +
      '\n\nОткрывай через http (python -m http.server), не через file://.';
    app.appendChild(box);
  }

  window.ELoad = function (files, onReady) {
    var i = 0;
    function next() {
      if (i >= files.length) {
        if (typeof onReady === 'function') {
          try { onReady(); } catch (e) { fail('(onReady)', e); }
        }
        return;
      }
      var file = files[i++];
      // bust cache в деве, чтобы правки подхватывались сразу
      fetch(file, { cache: 'no-store' })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status + ' для ' + file);
          return r.text();
        })
        .then(function (src) {
          var out = Babel.transform(src, {
            presets: ['react'],
            filename: file,
            sourceMaps: false,
            compact: false,
          });
          // Своя область видимости на файл: helpers Babel не утекают в глобал.
          var run = new Function(out.code + '\n//# sourceURL=' + file);
          run();
          next();
        })
        .catch(function (e) { fail(file, e); });
    }
    next();
  };
})();
