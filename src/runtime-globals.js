/* ============================================================================
   EastSide — глобальный React для модулей (Vite-сборка)
   ----------------------------------------------------------------------------
   Экраны и UI написаны как IIFE, которые читают ГЛОБАЛЬНЫЙ `React`/`ReactDOM`
   (раньше их давали UMD-теги с unpkg). В сборке мы импортируем React настоящим
   путём и кладём на window — тогда обращения вида `const { createElement: h } =
   React` и `ReactDOM.createRoot(...)` продолжают работать без правки 50 файлов.

   ВАЖНО: этот модуль импортируется ПЕРВЫМ в src/main.js. ES-импорты выполняются
   в порядке записи, поэтому к моменту загрузки остальных модулей window.React уже
   определён.
   ============================================================================ */
import React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

window.React = React;
// createRoot живёт в react-dom/client (React 18); остальное (createPortal, flushSync)
// берём из react-dom на случай, если понадобится в будущих экранах.
window.ReactDOM = Object.assign({}, ReactDOM, ReactDOMClient);
