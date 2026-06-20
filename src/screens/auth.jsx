/* ============================================================================
   EastSide — Авторизация (window.EScreens.Auth · route #/auth)
   ----------------------------------------------------------------------------
   «EastSide Dark» split-stage: слева тёмная сапфировая сцена с горой и тропой
   (тот же мотив, что панель-спутник кабинета), справа — светлая молочная плашка
   с формой. Один экран, четыре режима через внутренний state (роутер знает
   только /auth, под-маршрутов нет):
     login    — вход (почта + пароль, «забыл пароль?»)
     register — регистрация (+ согласие ФЗ-152)
     recover  — восстановление: запрос по почте → экран «письмо отправлено»
                → ввод нового пароля
     change   — смена пароля вошедшего (старый → новый)
   OAuth-кнопки Telegram / ВКонтакте / Яндекс ID — остаются.

   Только компоненты window.EUI и токены: ни одного хардкод-цвета/тени/размера,
   всё через var(--token) и утилиты styles.css. Свет + тёмная читаются одной
   семьёй с эталоном-кабинетом. Данные — локальный mock в этом файле (общий слой
   src/lib/mock.jsx не трогаем, чтобы не было коллизий).
   ============================================================================ */
(function () {
  'use strict';
  const { createElement: h, useState } = React;
  const EScreens = (window.EScreens = window.EScreens || {});
  const nav = (window.ERouter && window.ERouter.navigate) || function () {};
  const toast = (t) => (window.EToast && window.EToast.push ? window.EToast.push(t) : null);

  // --- Локальный mock (только этот экран) ----------------------------------
  const MOCK = (window.EMock && window.EMock.authStub) || {
    consentVersion: '2025-01',
    knownEmail: 'dima@mail.ru',
  };
  // имитация запросов к /api/auth — без реального бэка
  const wait = (ms) => new Promise((r) => setTimeout(r, ms || 600));
  const api = {
    login: () => wait(600).then(() => ({ ok: true })),
    register: () => wait(700).then(() => ({ ok: true })),
    sendReset: () => wait(600).then(() => ({ ok: true })),
    resetPassword: () => wait(600).then(() => ({ ok: true })),
    changePassword: () => wait(600).then(() => ({ ok: true })),
    oauth: () => wait(450).then(() => ({ ok: true })),
  };

  // --- Бренд-марки провайдеров (line-стиль, stroke=currentColor) ------------
  function Svg(children, extra) {
    return h('svg', Object.assign({
      width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round',
      strokeLinejoin: 'round', 'aria-hidden': 'true', focusable: 'false',
    }, extra), children);
  }
  const MarkVK = () => Svg([
    h('path', { key: 'a', d: 'M3.6 8.2c.4 4.4 2.9 7.3 6.7 7.3h.5v-2.6c1.3.14 2.3.9 2.8 2.6H16c-.5-1.6-1.4-2.6-2.4-3.1.9-.6 1.8-1.7 2.4-3.5h-2.2c-.5 1.5-1.3 2.4-2.5 2.6V8.2H9.2v3.7c-1.3-.5-2.3-1.9-2.9-3.7H3.6Z' }),
    h('path', { key: 'b', d: 'M16.4 12.5c1 .5 1.9 1.5 2.4 3.1' }),
  ]);
  const MarkYandex = () => Svg([
    h('circle', { key: 'c', cx: 12, cy: 12, r: 9 }),
    h('path', { key: 'p', d: 'M13.2 7.5h-1.1c-1.6 0-2.6 1-2.6 2.5 0 1.1.5 1.8 1.6 2.4l-2 4.1h1.5l1.8-3.9h.9v3.9h1.4V7.5Zm-1.4 4.3h-.5c-.8 0-1.3-.5-1.3-1.5s.5-1.6 1.4-1.6h.4v3.1Z' }),
  ]);

  // --- Валидация (по режиму) ------------------------------------------------
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validate(mode, f) {
    const e = {};
    if (mode === 'login' || mode === 'register' || mode === 'recover') {
      if (!f.email) e.email = 'Укажи почту';
      else if (!EMAIL_RE.test(f.email)) e.email = 'Похоже на опечатку в адресе';
    }
    if (mode === 'login') {
      if (!f.password) e.password = 'Введи пароль';
    }
    if (mode === 'register') {
      if (!f.name.trim()) e.name = 'Как тебя зовут';
      if (!f.password) e.password = 'Придумай пароль';
      else if (f.password.length < 8) e.password = 'Не короче 8 символов';
      if (!f.consent) e.consent = 'Без согласия не сможем продолжить';
    }
    if (mode === 'reset') {
      if (!f.password) e.password = 'Придумай новый пароль';
      else if (f.password.length < 8) e.password = 'Не короче 8 символов';
      if (!f.password2) e.password2 = 'Повтори пароль';
      else if (f.password2 !== f.password) e.password2 = 'Пароли не совпадают';
    }
    if (mode === 'change') {
      if (!f.oldPassword) e.oldPassword = 'Введи текущий пароль';
      if (!f.password) e.password = 'Придумай новый пароль';
      else if (f.password.length < 8) e.password = 'Не короче 8 символов';
      else if (f.password === f.oldPassword) e.password = 'Новый пароль совпадает со старым';
      if (!f.password2) e.password2 = 'Повтори новый пароль';
      else if (f.password2 !== f.password) e.password2 = 'Пароли не совпадают';
    }
    return e;
  }

  // ── Поле пароля с глазом (общий конструктор) ──────────────────────────────
  function passField(opts) {
    const U = window.EUI, Ic = window.EIcons;
    const { FormField, Input, IconButton } = U;
    return h(FormField, {
      label: opts.label, htmlFor: opts.id, hint: opts.hint,
      error: opts.touched && opts.error, key: opts.id,
    },
      h(Input, {
        id: opts.id, type: opts.show ? 'text' : 'password',
        value: opts.value, onChange: opts.onChange, onBlur: opts.onBlur,
        placeholder: '••••••••', autoComplete: opts.autoComplete,
        error: opts.touched && opts.error, iconLeft: Ic.Lock,
        action: h(IconButton, {
          icon: opts.show ? Ic.EyeOff : Ic.Eye, size: 'sm',
          label: opts.show ? 'Скрыть пароль' : 'Показать пароль',
          onClick: opts.onToggle,
        }),
      }));
  }

  // ── OAuth-ряд ─────────────────────────────────────────────────────────────
  function OAuthRow(props) {
    const { onPick, busy } = props;
    const U = window.EUI, Ic = window.EIcons;
    const providers = [
      { id: 'telegram', label: 'Telegram', icon: Ic.Telegram },
      { id: 'vk', label: 'ВКонтакте', icon: MarkVK },
      { id: 'yandex', label: 'Яндекс ID', icon: MarkYandex },
    ];
    return h('div', { className: 'u-stack-4' },
      h('div', { className: 'es-auth__divider', key: 'd' },
        h('span', { className: 'es-auth__divider-line', 'aria-hidden': 'true', key: 'l' }),
        h('span', { className: 'es-auth__divider-cap', key: 's' }, 'или быстрее'),
        h('span', { className: 'es-auth__divider-line', 'aria-hidden': 'true', key: 'r' })),
      h('div', { className: 'es-auth__oauth', key: 'o' },
        providers.map((p) => h(U.Button, {
          key: p.id, variant: 'secondary', block: true, iconLeft: p.icon,
          disabled: !!busy, loading: busy === p.id, onClick: () => onPick && onPick(p.id),
          'aria-label': 'Войти через ' + p.label,
        }, p.label)))
    );
  }

  // ── Левая сцена: гора + бренд + ценность (тёмная сапфировая панель) ────────
  function Stage(props) {
    const U = window.EUI, Ic = window.EIcons;
    const { Mountain } = U;
    const points = props.points || [];
    return h('aside', { className: 'es-auth__stage', 'aria-hidden': 'true' },
      h('div', { className: 'es-auth__stage-glow' }),
      h('div', { className: 'es-auth__brand' },
        h('span', { className: 'e-sb__brand-mark' }, 'E'),
        h('span', { className: 'es-auth__brand-name' }, 'EastSide')),
      h('div', { className: 'es-auth__stage-body' },
        h('div', { className: 'es-auth__kicker' }, 'Путь к поступлению'),
        h('div', { className: 'es-auth__stage-title u-arkhip' }, props.headline),
        h('p', { className: 'es-auth__stage-sub' }, props.sub)),
      h('div', { className: 'es-auth__mtn-wrap' },
        // маскот выглядывает из-за горы — тот же мотив, что профиль-карточка кабинета
        h('img', { className: 'es-auth__mascot', src: 'assets/mascot-cut.png', alt: '' }),
        h(Mountain, { progress: 0.62, reached: false })),
      h('ul', { className: 'es-auth__points' },
        points.map((p, i) => h('li', { key: i, className: 'es-auth__point' },
          h('span', { className: 'es-auth__point-ic e-chip-glow' }, h(Ic.Check, { size: 13 })),
          h('span', null, p))))
    );
  }

  // ── Экран ─────────────────────────────────────────────────────────────────
  function Auth() {
    const U = window.EUI, Ic = window.EIcons;
    const { FormField, Input, Tabs, Button, Switch, Alert } = U;

    // mode: login | register | recover | reset | change
    const [mode, setMode] = useState('login');
    const [form, setForm] = useState({
      name: '', email: '', password: '', password2: '', oldPassword: '', consent: false,
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [show, setShow] = useState({ pass: false, pass2: false, old: false });
    const [busy, setBusy] = useState(false);
    const [oauthBusy, setOauthBusy] = useState(null);
    const [notice, setNotice] = useState(null); // {tone,title,text}
    const [sentTo, setSentTo] = useState(''); // адрес, на который ушло письмо восстановления

    const set = (k) => (e) => {
      const v = k === 'consent' ? e : (e && e.target ? e.target.value : e);
      setForm((f) => Object.assign({}, f, { [k]: v }));
      if (touched[k]) setErrors((er) => Object.assign({}, er, validate(mode, Object.assign({}, form, { [k]: v }))));
    };
    const markTouched = (k) => () => {
      setTouched((t) => Object.assign({}, t, { [k]: true }));
      setErrors(validate(mode, form));
    };
    const toggle = (k) => () => setShow((s) => Object.assign({}, s, { [k]: !s[k] }));

    const goMode = (m) => {
      setMode(m);
      setErrors({});
      setTouched({});
      setNotice(null);
    };

    const onSubmit = (e) => {
      e.preventDefault();
      const er = validate(mode, form);
      setErrors(er);
      setTouched({ name: true, email: true, password: true, password2: true, oldPassword: true, consent: true });
      if (Object.keys(er).length) return;
      setBusy(true);
      setNotice(null);

      if (mode === 'login') {
        api.login().then(() => {
          setBusy(false);
          toast({ tone: 'success', title: 'С возвращением', text: 'Открываем твой кабинет.' });
          nav('/student');
        });
      } else if (mode === 'register') {
        api.register().then(() => {
          setBusy(false);
          toast({ tone: 'success', title: 'Аккаунт создан', text: 'Сейчас откроем кабинет — пройди диагностику.' });
          nav('/student');
        });
      } else if (mode === 'recover') {
        api.sendReset().then(() => {
          setBusy(false);
          setSentTo(form.email);
          goMode('sent');
        });
      } else if (mode === 'reset') {
        api.resetPassword().then(() => {
          setBusy(false);
          setForm((f) => Object.assign({}, f, { password: '', password2: '' }));
          toast({ tone: 'success', title: 'Пароль обновлен', text: 'Войди с новым паролем.' });
          goMode('login');
        });
      } else if (mode === 'change') {
        api.changePassword().then(() => {
          setBusy(false);
          setForm((f) => Object.assign({}, f, { oldPassword: '', password: '', password2: '' }));
          setTouched({});
          setNotice({ tone: 'success', title: 'Готово', text: 'Пароль сменили. В следующий раз входи с новым.' });
          toast({ tone: 'success', title: 'Пароль сменен', text: 'Изменения сохранены.' });
        });
      }
    };

    const onOAuth = (provider) => {
      setOauthBusy(provider);
      setNotice(null);
      const label = { telegram: 'Telegram', vk: 'ВКонтакте', yandex: 'Яндекс ID' }[provider] || provider;
      api.oauth().then(() => {
        setOauthBusy(null);
        toast({ tone: 'info', title: 'Подключаем ' + label, text: 'Откроется окно провайдера для подтверждения.' });
      });
    };

    // ── Сцена слева — текст под режим ──────────────────────────────────────
    const stageCopy = {
      login: { headline: 'С возвращением на маршрут', sub: 'Войди, чтобы вернуться к своей дорожной карте и увидеть, что делать дальше.' },
      register: { headline: 'Начни восхождение', sub: 'Сохраним прогресс и диагностику. Один аккаунт ведет тебя до кампуса в Китае.' },
      recover: { headline: 'Вернем доступ', sub: 'Пришлем ссылку на почту — задашь новый пароль за минуту.' },
      sent: { headline: 'Письмо в пути', sub: 'Проверь почту и перейди по ссылке, чтобы задать новый пароль.' },
      reset: { headline: 'Новый пароль', sub: 'Придумай надежный пароль — и снова в путь.' },
      change: { headline: 'Смена пароля', sub: 'Обнови пароль, чтобы аккаунт оставался под защитой.' },
    }[mode] || {};
    const stagePoints = [
      'Личная диагностика и дорожная карта',
      'Реальные вузы Китая и гранты CSC',
      'Куратор рядом на каждом этапе',
    ];

    // ── Шапка формы (заголовок + лид) ──────────────────────────────────────
    const formHead = {
      login: { title: 'Вход', sub: 'Рады видеть снова.' },
      register: { title: 'Регистрация', sub: 'Это бесплатно и займет минуту.' },
      recover: { title: 'Восстановление пароля', sub: 'Введи почту, на которую регистрировался.' },
      sent: { title: 'Проверь почту', sub: 'Мы отправили ссылку для смены пароля.' },
      reset: { title: 'Новый пароль', sub: 'Задай пароль, с которым будешь входить.' },
      change: { title: 'Смена пароля', sub: 'Текущий пароль — и новый дважды.' },
    }[mode] || { title: '', sub: '' };

    // ── Тело формы по режиму ───────────────────────────────────────────────
    let body;

    if (mode === 'sent') {
      // экран «письмо отправлено» — не форма, а подтверждение + действия
      body = h('div', { className: 'es-auth__stack', key: 'sent' },
        h('div', { className: 'es-auth__sent' },
          h('span', { className: 'es-auth__sent-ic e-chip-glow' }, h(Ic.Mail, { size: 24 })),
          h('div', null,
            h('div', { className: 'es-auth__sent-title' }, 'Письмо отправлено'),
            h('p', { className: 'es-auth__sent-text' },
              'Ссылка ушла на ', h('b', null, sentTo || 'твою почту'),
              '. Перейди по ней, чтобы задать новый пароль. Не пришло — проверь «Спам».'))),
        h('div', { className: 'u-stack-3' },
          // на mock «перейти по ссылке» = открыть шаг ввода нового пароля
          h(Button, {
            block: true, size: 'lg', iconRight: Ic.ArrowRight,
            onClick: () => goMode('reset'),
          }, 'Открыть ссылку из письма'),
          h(Button, {
            variant: 'ghost', block: true,
            onClick: () => { toast({ tone: 'info', title: 'Отправили еще раз', text: 'Письмо снова в пути.' }); },
          }, 'Отправить письмо повторно')),
        h('button', { type: 'button', className: 'es-auth__link es-auth__back', onClick: () => goMode('login') },
          h(Ic.ArrowLeft, { size: 15, key: 'i' }), h('span', { key: 't' }, 'Назад ко входу'))
      );
    } else {
      // обычные формы (login / register / recover / reset / change)
      const fields = [];

      if (mode === 'register') {
        fields.push(h(FormField, {
          label: 'Имя', htmlFor: 'auth-name', error: touched.name && errors.name, key: 'name',
        },
          h(Input, {
            id: 'auth-name', value: form.name, onChange: set('name'), onBlur: markTouched('name'),
            placeholder: 'Как к тебе обращаться', autoComplete: 'name',
            error: touched.name && errors.name, iconLeft: Ic.User,
          })));
      }

      if (mode === 'login' || mode === 'register' || mode === 'recover') {
        fields.push(h(FormField, {
          label: 'Почта', htmlFor: 'auth-email', error: touched.email && errors.email, key: 'email',
        },
          h(Input, {
            id: 'auth-email', type: 'email', value: form.email, onChange: set('email'), onBlur: markTouched('email'),
            placeholder: 'you@mail.ru', autoComplete: 'email', inputMode: 'email',
            error: touched.email && errors.email, iconLeft: Ic.Mail,
          })));
      }

      if (mode === 'change') {
        fields.push(passField({
          id: 'auth-old', label: 'Текущий пароль', autoComplete: 'current-password',
          value: form.oldPassword, onChange: set('oldPassword'), onBlur: markTouched('oldPassword'),
          touched: touched.oldPassword, error: errors.oldPassword,
          show: show.old, onToggle: toggle('old'),
        }));
      }

      if (mode === 'login') {
        fields.push(passField({
          id: 'auth-password', label: 'Пароль', autoComplete: 'current-password',
          value: form.password, onChange: set('password'), onBlur: markTouched('password'),
          touched: touched.password, error: errors.password,
          show: show.pass, onToggle: toggle('pass'),
        }));
      }

      if (mode === 'register' || mode === 'reset' || mode === 'change') {
        fields.push(passField({
          id: 'auth-password', label: mode === 'login' ? 'Пароль' : 'Новый пароль',
          hint: 'Не короче 8 символов', autoComplete: 'new-password',
          value: form.password, onChange: set('password'), onBlur: markTouched('password'),
          touched: touched.password, error: errors.password,
          show: show.pass, onToggle: toggle('pass'),
        }));
      }

      if (mode === 'reset' || mode === 'change') {
        fields.push(passField({
          id: 'auth-password2', label: 'Повтори пароль', autoComplete: 'new-password',
          value: form.password2, onChange: set('password2'), onBlur: markTouched('password2'),
          touched: touched.password2, error: errors.password2,
          show: show.pass2, onToggle: toggle('pass2'),
        }));
      }

      // под полями: «забыл пароль?» (login) или согласие (register)
      let below = null;
      if (mode === 'login') {
        below = h('div', { className: 'es-auth__row-end', key: 'forgot' },
          h('button', { type: 'button', className: 'es-auth__link', onClick: () => goMode('recover') }, 'Забыл пароль?'));
      } else if (mode === 'register') {
        below = h(FormField, { error: touched.consent && errors.consent, key: 'consent' },
          h('div', { className: 'es-auth__consent' },
            h(Switch, {
              checked: form.consent, onChange: set('consent'), id: 'auth-consent',
              label: h('span', null,
                'Согласен на обработку персональных данных по ',
                h('button', { type: 'button', className: 'es-auth__link', onClick: () => toast({ tone: 'info', title: 'ФЗ-152', text: 'Текст согласия откроется отдельной страницей.' }) }, 'ФЗ-152'),
                ' и принимаю ',
                h('button', { type: 'button', className: 'es-auth__link', onClick: () => toast({ tone: 'info', title: 'Условия', text: 'Пользовательское соглашение откроется отдельно.' }) }, 'условия')),
            })));
      }

      // главное действие — текст по режиму
      const ctaLabel = {
        login: 'Войти', register: 'Создать аккаунт', recover: 'Прислать ссылку',
        reset: 'Сохранить пароль', change: 'Сменить пароль',
      }[mode];

      const cta = h(Button, {
        key: 'cta', type: 'submit', block: true, size: 'lg', loading: busy,
        iconRight: busy ? undefined : Ic.ArrowRight,
      }, ctaLabel);

      // recover/reset/change показывают «назад» вместо вкладок/OAuth
      const backRow = (mode === 'recover' || mode === 'reset' || mode === 'change')
        ? h('button', {
          type: 'button', className: 'es-auth__link es-auth__back', key: 'back',
          onClick: () => goMode('login'),
        }, h(Ic.ArrowLeft, { size: 15, key: 'i' }), h('span', { key: 't' }, mode === 'change' ? 'Вернуться' : 'Назад ко входу'))
        : null;

      body = h('div', { className: 'es-auth__stack', key: 'form-body' },
        h('div', { className: 'u-stack-4' }, fields),
        below,
        cta,
        // OAuth только для входа/регистрации
        (mode === 'login' || mode === 'register')
          ? h(OAuthRow, { onPick: onOAuth, busy: oauthBusy, key: 'oauth' })
          : backRow
      );
    }

    // ── Вкладки Вход / Регистрация — только в этих двух режимах ─────────────
    const showTabs = mode === 'login' || mode === 'register';
    const tabs = showTabs ? h(Tabs, {
      key: 'tabs',
      active: mode, onChange: goMode,
      tabs: [{ key: 'login', label: 'Вход' }, { key: 'register', label: 'Регистрация' }],
    }) : null;

    // ── Низ карточки: переключение режима подсказкой (вход/регистрация) ─────
    const swap = showTabs ? h('p', { className: 'es-auth__swap', key: 'swap' },
      mode === 'register'
        ? h('span', null, 'Уже есть аккаунт? ',
          h('button', { type: 'button', className: 'es-auth__link', onClick: () => goMode('login') }, 'Войти'))
        : h('span', null, 'Впервые здесь? ',
          h('button', { type: 'button', className: 'es-auth__link', onClick: () => goMode('register') }, 'Создать аккаунт'))) : null;

    // ── Карточка-форма (молочная плашка) ───────────────────────────────────
    const isStatic = mode === 'sent';
    const cardInner = h('div', { className: 'es-auth__card-inner' },
      // мобильный бренд (на десктопе бренд в сцене слева)
      h('div', { className: 'es-auth__m-brand u-hide-desktop' },
        h('span', { className: 'e-sb__brand-mark' }, 'E'),
        h('span', { className: 'es-auth__brand-name' }, 'EastSide')),
      h('div', { className: 'es-auth__head' },
        h('h1', { className: 'es-auth__title' }, formHead.title),
        h('p', { className: 'es-auth__lead' }, formHead.sub)),
      tabs,
      notice ? h(Alert, { tone: notice.tone, title: notice.title, key: 'notice' }, notice.text) : null,
      body,
      swap
    );

    const card = isStatic
      ? h('div', { className: 'es-auth__card' }, cardInner)
      : h('form', { className: 'es-auth__card', onSubmit, noValidate: true }, cardInner);

    // ── Раскладка: тёмная база → сцена + плашка, переключатель темы в углу ──
    return h('div', { className: 'es-auth u-animate-fade' },
      h('div', { className: 'es-auth__theme' },
        window.ETheme ? h(window.ETheme.ThemeToggle, { variant: 'cycle' }) : null),
      h('div', { className: 'es-auth__split' },
        h(Stage, { headline: stageCopy.headline, sub: stageCopy.sub, points: stagePoints }),
        h('main', { id: 'main', className: 'es-auth__pane' },
          card,
          h('p', { className: 'es-auth__foot' },
            'Защищенный вход. Данные хранятся в России, по ',
            h('button', { type: 'button', className: 'es-auth__link', onClick: () => toast({ tone: 'info', title: 'Конфиденциальность', text: 'Политика обработки данных откроется отдельно.' }) }, 'ФЗ-152'),
            '.'),
          // вход для уже вошедшего: открыть смену пароля (демо-хук, не в основном флоу)
          (mode === 'login') ? h('button', {
            type: 'button', className: 'es-auth__link es-auth__change-hook',
            onClick: () => goMode('change'),
          }, 'Уже вошел и хочешь сменить пароль?') : null)
      ),
      // локальные стили раскладки — только var(--token), без хардкод-цветов
      h('style', null, CSS)
    );
  }

  // ── Локальные классы экрана (раскладка/декор) — значения только из токенов.
  //    Палитра сцены/плашки переключается темой автоматически через переменные.
  const CSS = [
    '.es-auth{position:relative;min-height:100dvh;background:var(--base);background-image:var(--base-glow);display:flex;align-items:center;justify-content:center;padding:var(--shell-pad);}',
    '.es-auth__theme{position:fixed;top:var(--sp-4);right:var(--sp-4);z-index:var(--z-sticky);color:var(--sb-tx);}',
    '.es-auth__split{width:100%;max-width:1040px;min-height:min(680px,calc(100dvh - var(--sp-8)));display:grid;grid-template-columns:1fr 1fr;gap:var(--shell-gap);}',
    // — сцена (тёмная сапфировая панель, как панель-спутник) —
    '.es-auth__stage{position:relative;overflow:hidden;border-radius:var(--r-2xl);background:var(--panel);border:1px solid var(--panel-line);color:var(--panel-tx);padding:var(--sp-10) var(--sp-8) var(--sp-8);display:flex;flex-direction:column;}',
    '.es-auth__stage-glow{position:absolute;inset:0;background:radial-gradient(620px 420px at 100% 0%,rgba(43,143,255,.22),transparent 64%);pointer-events:none;}',
    '.es-auth__brand{position:relative;z-index:1;display:inline-flex;align-items:center;gap:var(--sp-2);}',
    '.es-auth__brand-name{font-family:var(--font-display);font-weight:var(--fw-black);letter-spacing:var(--tracking-tight);color:var(--panel-tx);font-size:var(--fs-lg);}',
    '.es-auth__stage-body{position:relative;z-index:1;margin-top:var(--sp-8);}',
    '.es-auth__kicker{font-size:var(--fs-2xs);font-weight:var(--fw-bold);letter-spacing:var(--tracking-wider);text-transform:uppercase;color:var(--violet-soft);}',
    '.es-auth__stage-title{margin-top:var(--sp-3);font-size:var(--fs-3xl);line-height:var(--lh-tight);letter-spacing:-0.03em;color:var(--panel-tx);}',
    '.es-auth__stage-sub{margin-top:var(--sp-3);font-size:var(--fs-base);line-height:var(--lh-relaxed);color:var(--panel-tx-soft);max-width:34ch;}',
    '.es-auth__mtn-wrap{position:relative;z-index:1;margin-top:auto;}',
    '.es-auth__mtn-wrap .e-mtn{margin:var(--sp-6) 0 0;position:relative;z-index:1;}',
    // маскот выглядывает из-за гребня горы (как в профиль-карточке кабинета); тень — drop-shadow, не box-shadow
    '.es-auth__mascot{position:absolute;right:-2px;bottom:48px;width:96px;height:auto;z-index:2;pointer-events:none;filter:drop-shadow(0 8px 16px rgba(3,8,28,.45));}',
    '.es-auth__points{position:relative;z-index:1;list-style:none;margin:var(--sp-6) 0 0;padding:0;display:flex;flex-direction:column;gap:var(--sp-3);}',
    '.es-auth__point{display:flex;align-items:center;gap:var(--sp-3);font-size:var(--fs-sm);color:var(--panel-tx-soft);}',
    '.es-auth__point-ic{width:24px;height:24px;flex:0 0 auto;}',
    // — плашка с формой (молочная, светлая в обеих темах) —
    '.es-auth__pane{display:flex;flex-direction:column;align-items:center;gap:var(--sp-4);justify-content:center;min-width:0;}',
    '.es-auth__card{width:100%;max-width:420px;background:var(--plate-bg);border:1px solid var(--plate-card-br);border-radius:var(--r-2xl);box-shadow:var(--sh-lg);padding:var(--sp-8);}',
    '.es-auth__card-inner{display:flex;flex-direction:column;gap:var(--sp-6);}',
    '.es-auth__stack>*+*{margin-top:var(--sp-5);}',
    '.es-auth__m-brand{display:inline-flex;align-items:center;gap:var(--sp-2);}',
    '.es-auth__m-brand .es-auth__brand-name{color:var(--plate-ink);}',
    '.es-auth__head .es-auth__title{font-family:var(--font-arkhip);font-size:var(--fs-3xl);font-weight:400;letter-spacing:-0.04em;line-height:var(--lh-tight);color:var(--plate-ink);}',
    '.es-auth__lead{margin-top:var(--sp-2);font-size:var(--fs-base);line-height:var(--lh-normal);color:var(--plate-ink-sub);}',
    // поля внутри плашки — наследуют светлую тему через .e-plate-подобные правила нет,
    // поэтому держим контролы на токенах (они уже читаемы: плашка светлая в обе темы)
    '.es-auth__card .e-field__label{color:var(--plate-ink);}',
    '.es-auth__card .e-field__hint{color:var(--plate-ink-sub);}',
    '.es-auth__card .e-input{background:var(--glow-sel-bg);border-color:var(--plate-card-br);color:var(--plate-ink);}',
    '.es-auth__card .e-input::placeholder{color:var(--plate-ink-sub);opacity:.7;}',
    '.es-auth__card .e-input-wrap__icon{color:var(--plate-ink-sub);}',
    '.es-auth__card .e-tabs{background:rgba(36,40,90,.06);border-radius:var(--r-pill);padding:3px;}',
    '.es-auth__card .e-tabs__tab{color:var(--plate-ink-sub);}',
    '.es-auth__card .e-tabs__tab.is-active{color:var(--plate-ink);}',
    '.es-auth__card .e-btn--primary{background:var(--pri-bg);color:var(--pri-tx);box-shadow:var(--pri-glow);}',
    '.es-auth__card .e-btn--primary:hover{background:var(--pri-bg-hi);}',
    '.es-auth__card .e-btn--secondary{background:var(--glow-sel-bg);color:var(--plate-ink);border-color:var(--plate-card-br);}',
    '.es-auth__card .e-switch-row__label{color:var(--plate-ink-sub);}',
    '.es-auth__divider{display:flex;align-items:center;gap:var(--sp-3);}',
    '.es-auth__divider-line{flex:1 1 auto;height:1px;background:var(--plate-card-br);}',
    '.es-auth__divider-cap{font-size:var(--fs-xs);color:var(--plate-ink-sub);white-space:nowrap;}',
    '.es-auth__oauth{display:flex;flex-direction:column;gap:var(--sp-3);}',
    '.es-auth__row-end{display:flex;justify-content:flex-end;}',
    '.es-auth__consent{padding-top:var(--sp-1);}',
    '.es-auth__link{background:none;border:0;padding:0;font:inherit;cursor:pointer;color:var(--violet-deep);font-weight:var(--fw-semibold);text-decoration:none;}',
    '.es-auth__link:hover{text-decoration:underline;}',
    '.es-auth__back{display:inline-flex;align-items:center;gap:var(--sp-2);align-self:center;margin-top:var(--sp-1);}',
    '.es-auth__swap{text-align:center;color:var(--plate-ink-sub);font-size:var(--fs-sm);margin:0;}',
    '.es-auth__sent{display:flex;gap:var(--sp-4);align-items:flex-start;}',
    '.es-auth__sent-ic{width:48px;height:48px;flex:0 0 auto;}',
    '.es-auth__sent-title{font-size:var(--fs-lg);font-weight:var(--fw-bold);color:var(--plate-ink);}',
    '.es-auth__sent-text{margin-top:var(--sp-1);font-size:var(--fs-sm);line-height:var(--lh-normal);color:var(--plate-ink-sub);}',
    '.es-auth__foot{color:var(--sb-tx-mute);font-size:var(--fs-xs);text-align:center;max-width:40ch;margin:var(--sp-1) 0 0;line-height:var(--lh-normal);}',
    '.es-auth__foot .es-auth__link{color:var(--violet-soft);}',
    '.es-auth__change-hook{margin-top:var(--sp-2);font-size:var(--fs-xs);color:var(--sb-tx-mute);font-weight:var(--fw-regular);}',
    // — мобильная раскладка: сцена сверху-компактом, плашка ниже —
    '@media (max-width:880px){',
    '  .es-auth__split{grid-template-columns:1fr;max-width:460px;min-height:0;}',
    '  .es-auth__stage{display:none;}',
    '  .es-auth__card{max-width:none;}',
    '}',
  ].join('');

  EScreens.Auth = Auth;
})();
