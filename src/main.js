/* ============================================================================
   EastSide — точка входа платформы (Vite)
   ----------------------------------------------------------------------------
   Заменяет старый ELoad из index.html. Порядок СТРОГО последовательный и
   совпадает со старым списком: lib -> ui -> screens -> app. Каждый модуль —
   side-effect: регистрирует себя в window.E* (EUI / ERouter / EScreens / ...).
   Vite/Rollup сохраняет порядок side-effect импортов, поэтому зависимости через
   window отрабатывают как раньше. Babel в браузере больше не нужен — JSX в коде
   нет, всё на h()/React.createElement.

   CSS НЕ импортируем здесь намеренно: tokens.css/styles.css подключены <link> в
   <head> — грузятся сразу, параллельно с JS, без вспышки нестилизованного контента.
   ============================================================================ */
import './runtime-globals.js';

// lib
import './lib/icons.jsx';
import './lib/mock.jsx';
import './lib/lessons.jsx';
import './lib/api.jsx';
import './lib/router.jsx';
import './lib/theme.jsx';

// ui
import './ui/primitives.jsx';
import './ui/forms.jsx';
import './ui/surfaces.jsx';
import './ui/overlays.jsx';
import './ui/navigation.jsx';
import './ui/shell.jsx';
import './ui/dashboard.jsx';

// screens
import './screens/landing.jsx';
import './screens/anketa.jsx';
import './screens/result.jsx';
import './screens/auth.jsx';
import './screens/diagnostics.jsx';
import './screens/documents.jsx';
import './screens/payments.jsx';
import './screens/partner.jsx';
import './screens/assistant.jsx';
import './screens/home.jsx';
import './screens/cabinet-parent.jsx';
import './screens/student-shell.jsx';
import './screens/student-task.jsx';
import './screens/cabinet-student.jsx';
import './screens/student-plan.jsx';
import './screens/student-stage.jsx';
import './screens/student-stage-b.jsx';
import './screens/crm-clients.jsx';
import './screens/crm-client.jsx';
import './screens/crm-funnel.jsx';
import './screens/learn-hub.jsx';
import './screens/learn-home.jsx';        // пересобранная «Обучение» (#/learn), живёт в ESStudentShell
import './screens/learn-lesson.jsx';
import './screens/learn-build.jsx';

// оркестратор каркаса — монтирует приложение в #app (ReactDOM.createRoot)
import './app.jsx';
