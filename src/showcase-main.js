/* ============================================================================
   EastSide — точка входа витрины компонентов (Vite). Зеркалит старый ELoad из
   showcase.html: те же lib + ui, затем showcase-gallery (рендерит свою галерею
   в #app через ReactDOM.createRoot). Babel в браузере не нужен.
   ============================================================================ */
import './runtime-globals.js';

import './lib/icons.jsx';
import './lib/mock.jsx';
import './lib/api.jsx';
import './lib/router.jsx';
import './lib/theme.jsx';

import './ui/primitives.jsx';
import './ui/forms.jsx';
import './ui/surfaces.jsx';
import './ui/overlays.jsx';
import './ui/navigation.jsx';

import './showcase-gallery.jsx';
