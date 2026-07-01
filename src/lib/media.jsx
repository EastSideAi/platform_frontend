/* ============================================================================
   EastSide — Медиа-загрузчик (window.EMedia)
   ----------------------------------------------------------------------------
   ОПТИМИСТИЧНАЯ загрузка файлов: сразу отдаём мгновенную локальную ссылку
   (blob) для показа, а заливка в бэкенд (bytea в Supabase Postgres,
   POST /api/learning/media) идёт В ФОНЕ. Как только файл сохранён — вызывающий
   подменяет blob на постоянную ссылку (GET /api/learning/media/{id}).

   База — window.ES_LESSONS_BASE (или ES_API_BASE). Пусто = локальный режим:
   preview-ссылка работает в текущей вкладке, но не персистится.

   Типовое использование (оптимистично):
     const p = EMedia.previewUpload(file, function (st) {
       // st = { url, uploading, persisted, error } — зовётся 2 раза:
       //   1) сразу: { url: blob, uploading: true }
       //   2) после фона: { url: <постоянная|blob>, uploading: false, persisted }
       applyToState(st);
     });
   ============================================================================ */
(function () {
  'use strict';

  const BASE = (window.ES_LESSONS_BASE || window.ES_API_BASE || '').replace(/\/+$/, '');
  const MAX = 20 * 1024 * 1024; // 20 МБ — крупнее (видео) кладём ссылкой, не файлом

  function readDataUrl(file) {
    return new Promise(function (res, rej) {
      const r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  // Фоновая заливка. Промис с постоянной АБСОЛЮТНОЙ ссылкой, либо null
  // (нет бэка / слишком большой / ошибка) — тогда остаётся blob (не персистится).
  async function upload(file) {
    if (!file || !BASE || file.size > MAX) return null;
    try {
      const dataUrl = await readDataUrl(file);
      const res = await fetch(BASE + '/api/learning/media', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, mime: file.type || 'application/octet-stream', data: dataUrl }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const d = await res.json();
      return BASE + (d.url || '');
    } catch (e) {
      if (window.console) console.warn('[EMedia] upload fail:', e && e.message);
      return null;
    }
  }

  // Мгновенная локальная ссылка для оптимистичного показа.
  function preview(file) { try { return URL.createObjectURL(file); } catch (e) { return ''; } }
  function isBlob(url) { return !!url && String(url).indexOf('blob:') === 0; }
  function tooBig(file) { return !!(file && file.size > MAX); }

  // Оптимистичный хелпер: сразу зовёт onState({url:blob,uploading:true}),
  // потом (после фона) onState({url:<постоянная|blob>,uploading:false,persisted,error}).
  // Возвращает мгновенную blob-ссылку.
  function previewUpload(file, onState) {
    const blob = preview(file);
    if (onState) onState({ url: blob, uploading: true, persisted: false });
    if (!BASE || tooBig(file)) {
      if (onState) onState({ url: blob, uploading: false, persisted: false, error: tooBig(file) ? 'too_big' : 'no_backend' });
      return blob;
    }
    upload(file).then(function (url) {
      if (onState) onState({ url: url || blob, uploading: false, persisted: !!url, error: url ? null : 'upload_failed' });
    });
    return blob;
  }

  window.EMedia = { base: BASE, max: MAX, upload: upload, preview: preview, previewUpload: previewUpload, isBlob: isBlob, tooBig: tooBig };
})();
