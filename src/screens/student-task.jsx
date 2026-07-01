/* ============================================================================
   EastSide — ПОП-АП ЗАДАЧИ (многошаговый визард)  window.ESTaskModal
   ----------------------------------------------------------------------------
   ТЁМНЫЙ, предельно чистый мастер. Никаких картинок-якорей, чипов, фоновых
   градиентов и лишних кнопок — только суть: заголовок задачи -> шаги-инструкция
   -> действие. Плоская тёмная поверхность (#0C1330) с тонкой белой обводкой,
   сапфир #2B8FFF — единственный акцент, jade #3EE08F — «готово/наша сторона»,
   rose #FF6B6B — просроченный срок. Свет тихий, заливки плоские, воздуха много.

   Контракт: window.ESTaskModal({ data, close, openChat }) -> <корневой элемент>.
   PopupHost оборачивает результат в .sd-ov--center, поэтому возвращаем САМУ
   модалку. Закрытие — props.close().

   data (новый контракт):
     { title, side:'you'|'us', owner, time, dl, dlState,
       wizard:[ { title, body:[абзацы], note?:{type:'tip'|'warn'|'info', text},
                  bullets?:[...], flow?:[{t,s,st}], materials?:[{kind,name,meta}] } ],
       action:{ type:'upload'|'form'|'text'|'info', label, hint, heading,
                fields?:[{label,placeholder,type}] } }

   ОБРАТНАЯ СОВМЕСТИМОСТЬ: задачи без wizard/action, но с desc/why, how:[...],
   flow:[{t,s,st}], cta, side, dl, dlState — шаги и действие синтезируются.

   Анимации только transform/opacity (150-250ms). Текст без буквы «е». Голос «ты».
   ============================================================================ */
(function () {
  'use strict';
  const R = window.React || React;
  const { createElement: h, useState, useEffect, useRef } = R;
  const Ic = window.EIcons || {};

  const icon = (name, props) => (Ic[name] ? h(Ic[name], props || {}) : null);

  /* искры салюта на экране успеха (радиально расходятся) */
  const SPARKS = [
    { tx: -40, ty: -24, d: .16, c: '#5CB4FF' },
    { tx: 36, ty: -32, d: .26, c: '#3EE08F' },
    { tx: -30, ty: 18, d: .32, c: '#9FCBFF' },
    { tx: 42, ty: 6, d: .2, c: '#3EE08F' },
    { tx: -6, ty: -44, d: .36, c: '#F5C84C' },
    { tx: 20, ty: 28, d: .29, c: '#5CB4FF' },
  ];

  /* ─────────────────────────────────────────────────────────────────────────
     СТИЛИ — инжектятся один раз. Префикс .et- (everest task).
     Плоская тёмная поверхность, тонкие полупрозрачные обводки, сапфир-акцент.
  ───────────────────────────────────────────────────────────────────────── */
  const STYLE_ID = 'es-task-modal-dark-css';
  const CSS = `
  .et{
    --acc:#2B8FFF; --acc2:#5CB4FF; --deep:#2073E6; --soft:#9FCBFF;
    --tx:#B7BFDA; --tx2:#DDE3F4; --mute:#7C86A8;
    --line:rgba(255,255,255,.07); --line2:rgba(255,255,255,.12);
    --jade:#3EE08F; --jade-tx:#8FE7C0; --rose:#FF7A7A; --amber:#E9B24A;
    width:100%; max-width:552px; max-height:88vh; display:flex; flex-direction:column;
    position:relative; border-radius:22px; overflow:hidden; color:#fff;
    font-family:'SF Pro Display',-apple-system,BlinkMacSystemFont,system-ui,'Segoe UI',sans-serif;
    background:rgba(13,20,46,.58);
    -webkit-backdrop-filter:blur(34px) saturate(150%); backdrop-filter:blur(34px) saturate(150%);
    border:1px solid rgba(120,160,255,.28);
    box-shadow:0 32px 84px rgba(6,12,36,.5), inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 46px rgba(40,110,240,.1);
    animation:etRise .24s cubic-bezier(.16,1,.3,1);
    -webkit-font-smoothing:antialiased;
  }
  @keyframes etRise{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
  .et *{box-sizing:border-box;}
  .et__num{font-variant-numeric:tabular-nums;}

  /* ── Шапка: заголовок задачи + срок (тихо) + закрытие ─────────────────── */
  .et__top{position:relative;padding:30px 32px 0;}
  .et__title{font-size:25px;font-weight:700;letter-spacing:-.6px;line-height:1.16;color:#fff;max-width:calc(100% - 46px);text-wrap:balance;}
  .et__dl{display:inline-flex;align-items:center;gap:7px;margin-top:15px;height:28px;padding:0 13px 0 12px;border-radius:9px;
    font-size:12px;font-weight:600;color:var(--tx);background:rgba(255,255,255,.05);border:1px solid var(--line2);}
  .et__dl svg{color:currentColor;opacity:.9;}
  .et__dldot{position:relative;width:6px;height:6px;flex:0 0 6px;border-radius:50%;background:currentColor;}
  .et__dl.is-late{color:#FFB9B9;background:rgba(255,122,122,.1);border-color:rgba(255,122,122,.32);}
  .et__dl.is-urgent{color:#F1CE8E;background:rgba(233,178,74,.1);border-color:rgba(233,178,74,.32);}
  .et__dl.is-late .et__dldot::after{content:'';position:absolute;inset:-2px;border-radius:50%;border:1.5px solid currentColor;opacity:0;}
  @media (prefers-reduced-motion:no-preference){.et__dl.is-late .et__dldot::after{animation:etDl 2s cubic-bezier(.23,1,.32,1) infinite;}}
  @keyframes etDl{0%{transform:scale(.6);opacity:.7}70%{transform:scale(2.6);opacity:0}100%{transform:scale(2.6);opacity:0}}
  .et__x{position:absolute;top:20px;right:20px;width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;
    color:var(--mute);background:transparent;border:1px solid transparent;transition:transform .15s,color .15s,background .15s;}
  .et__x:hover{color:#fff;background:rgba(255,255,255,.06);}
  .et__x:active{transform:scale(.94);}

  /* ── Прогресс-дорожка в подвале (как в anketa: «Шаг N из M» + точки) ───── */
  .et__mid{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:13px;min-width:0;}
  .et__stepcap{font-size:12px;font-weight:500;color:var(--mute);white-space:nowrap;}
  .et__dots{display:flex;align-items:center;}
  .et__dots i{display:block;}
  .et__dots .d{width:8px;height:8px;border-radius:50%;flex:none;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.22);}
  .et__dots .d.done{background:var(--acc);box-shadow:none;opacity:.7;}
  .et__dots .d.cur{width:14px;height:14px;background:var(--acc2);box-shadow:0 0 0 4px rgba(43,143,255,.18),0 0 9px rgba(43,143,255,.6);}
  .et__dots .ln{width:6px;height:3px;border-radius:2px;background:rgba(255,255,255,.13);}

  /* ── Тело ─────────────────────────────────────────────────────────────── */
  .et__body{flex:1 1 auto;overflow-y:auto;}
  .et__body::-webkit-scrollbar{width:8px;}
  .et__body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:99px;border:2px solid transparent;background-clip:padding-box;}
  .et__pane{padding:30px 32px 40px;animation:etPane .24s cubic-bezier(.16,1,.3,1);}
  @keyframes etPane{from{transform:translateY(6px);opacity:0}to{transform:translateY(0);opacity:1}}

  .et__h{font-size:22px;font-weight:700;letter-spacing:-.4px;line-height:1.26;color:#fff;text-wrap:balance;}
  .et__lead{font-size:15px;line-height:1.66;color:var(--tx);margin-top:14px;}
  .et__p{font-size:15px;line-height:1.66;color:var(--tx);margin:18px 0 0;}

  /* нумерованные шаги-инструкция */
  .et__bullets{display:flex;flex-direction:column;gap:15px;margin-top:26px;}
  .et__bullet{display:flex;gap:14px;align-items:flex-start;}
  .et__bnum{width:23px;height:23px;flex:0 0 23px;border-radius:7px;display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:700;color:var(--soft);background:rgba(43,143,255,.1);border:1px solid rgba(43,143,255,.22);
    font-variant-numeric:tabular-nums;margin-top:1px;}
  .et__btext{flex:1 1 auto;min-width:0;font-size:14.5px;line-height:1.55;color:var(--tx2);}

  /* приложенные материалы — плоские тёмные строки */
  .et__mats{margin-top:28px;display:flex;flex-direction:column;gap:10px;}
  .et__mats-h{font-size:12px;font-weight:600;color:var(--tx);opacity:.62;margin-bottom:2px;}
  .et__mat{display:flex;align-items:center;gap:12px;width:100%;text-align:left;cursor:pointer;font-family:inherit;
    padding:12px 13px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid var(--line);
    transition:background .15s,border-color .15s;}
  .et__mat:hover{background:rgba(43,143,255,.06);border-color:rgba(43,143,255,.3);}
  .et__mat-ic{flex:0 0 34px;width:34px;height:34px;border-radius:9px;display:grid;place-items:center;color:var(--soft);
    background:rgba(43,143,255,.1);border:1px solid rgba(43,143,255,.18);}
  .et__mat-b{flex:1 1 auto;min-width:0;}
  .et__mat-t{display:block;font-size:13.5px;font-weight:600;color:#fff;line-height:1.32;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .et__mat-m{display:block;font-size:11.5px;color:var(--mute);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .et__mat-go{flex:0 0 auto;color:var(--mute);transition:color .15s,transform .15s;}
  .et__mat:hover .et__mat-go{color:var(--soft);transform:translateX(2px);}

  /* лента «что дальше» — тонкая линия с узлами */
  .et__flow{display:flex;flex-direction:column;margin-top:26px;}
  .et__fstep{display:flex;gap:14px;position:relative;padding-bottom:22px;}
  .et__fstep:last-child{padding-bottom:0;}
  .et__fmk{width:26px;height:26px;flex:0 0 26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;z-index:1;
    font-variant-numeric:tabular-nums;background:rgba(255,255,255,.04);color:var(--mute);border:1px solid var(--line2);}
  .et__fstep.done .et__fmk{background:rgba(43,143,255,.14);color:var(--soft);border-color:rgba(43,143,255,.35);}
  .et__fstep.current .et__fmk{background:rgba(43,143,255,.16);color:#fff;border-color:rgba(60,150,250,.55);box-shadow:0 0 0 4px rgba(43,143,255,.1);}
  .et__fline{position:absolute;left:12.5px;top:28px;bottom:2px;width:1.5px;border-radius:2px;background:rgba(255,255,255,.09);}
  .et__fstep.done .et__fline{background:rgba(43,143,255,.4);}
  .et__fstep:last-child .et__fline{display:none;}
  .et__ft{font-size:14px;font-weight:600;color:#fff;line-height:1.35;margin-top:3px;}
  .et__fstep.upcoming .et__ft{color:var(--mute);font-weight:500;}
  .et__fs{font-size:12.5px;color:var(--mute);margin-top:3px;line-height:1.45;}

  /* сноска tip/warn/info — плоское стекло с тинтом, иконка без коробки */
  .et__note{display:flex;gap:12px;align-items:flex-start;margin-top:28px;padding:16px 18px;border-radius:13px;border:1px solid;}
  .et__note--info{background:rgba(43,143,255,.06);border-color:rgba(43,143,255,.2);}
  .et__note--tip{background:rgba(62,224,143,.06);border-color:rgba(62,224,143,.22);}
  .et__note--warn{background:rgba(255,122,122,.06);border-color:rgba(255,122,122,.24);}
  .et__noteic{flex:0 0 auto;margin-top:1px;}
  .et__note--info .et__noteic{color:var(--soft);}
  .et__note--tip .et__noteic{color:var(--jade);}
  .et__note--warn .et__noteic{color:var(--rose);}
  .et__notetx{flex:1 1 auto;min-width:0;font-size:13px;line-height:1.55;color:var(--tx);}
  .et__notek{font-weight:700;color:#fff;}
  .et__note--warn .et__notek{color:#FFC9C9;}

  /* ── Действие: дропзона ───────────────────────────────────────────────── */
  .et__drop{display:flex;flex-direction:column;align-items:center;text-align:center;gap:5px;margin-top:24px;
    padding:44px 28px;border-radius:16px;cursor:pointer;
    background:rgba(255,255,255,.02);border:1.5px dashed rgba(43,143,255,.35);transition:background .15s,border-color .15s;}
  .et__drop:hover{background:rgba(43,143,255,.05);border-color:rgba(43,143,255,.5);}
  .et__drop.is-over{border-style:solid;border-color:var(--acc);background:rgba(43,143,255,.09);}
  .et__dropic{width:46px;height:46px;border-radius:13px;display:flex;align-items:center;justify-content:center;color:var(--soft);margin-bottom:7px;
    background:rgba(43,143,255,.1);border:1px solid rgba(43,143,255,.22);}
  .et__dropt{font-size:15px;font-weight:600;color:#fff;}
  .et__dropt b{color:var(--soft);font-weight:700;}
  .et__droph{font-size:12px;color:var(--mute);line-height:1.5;max-width:380px;margin-top:3px;}
  .et__file{display:flex;align-items:center;gap:12px;padding:13px 15px;border-radius:12px;margin-top:12px;
    background:rgba(62,224,143,.06);border:1px solid rgba(62,224,143,.26);}
  .et__fileic{width:34px;height:34px;flex:0 0 34px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:var(--jade);
    background:rgba(62,224,143,.1);border:1px solid rgba(62,224,143,.24);}
  .et__fileb{flex:1 1 auto;min-width:0;}
  .et__filen{font-size:14px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .et__files{font-size:11.5px;color:var(--jade-tx);margin-top:1px;}
  .et__filex{flex:0 0 auto;width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--mute);
    background:transparent;border:1px solid var(--line2);transition:color .15s,background .15s;}
  .et__filex:hover{color:#fff;background:rgba(255,255,255,.05);}

  /* ── Действие: форма ──────────────────────────────────────────────────── */
  .et__form{display:flex;flex-direction:column;gap:16px;margin-top:24px;}
  .et__field{display:flex;flex-direction:column;gap:8px;}
  .et__lab{font-size:12.5px;font-weight:600;color:var(--tx);}
  .et__inp,.et__area{width:100%;background:rgba(255,255,255,.03);border:1.5px solid var(--line2);border-radius:11px;
    padding:12px 14px;color:#fff;font-size:14px;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s,background .15s;}
  .et__area{min-height:122px;resize:vertical;line-height:1.55;}
  .et__inp::placeholder,.et__area::placeholder{color:var(--mute);}
  .et__inp:focus,.et__area:focus{border-color:rgba(43,143,255,.5);background:rgba(43,143,255,.04);box-shadow:0 0 0 3px rgba(43,143,255,.1);}

  /* ── Низ: Назад / Далее ───────────────────────────────────────────────── */
  .et__foot{display:flex;align-items:center;gap:14px;padding:16px 22px;border-top:1px solid var(--line);
    background:linear-gradient(180deg,rgba(6,12,36,0),rgba(6,12,36,.35));}
  .et__btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;border:0;white-space:nowrap;flex:0 0 auto;
    font-family:inherit;font-size:14px;font-weight:600;padding:12px 18px;border-radius:11px;transition:transform .15s,background .15s,box-shadow .15s,color .15s,opacity .15s;}
  .et__btn--ghost{background:rgba(255,255,255,.04);color:var(--tx2);border:1px solid var(--line2);}
  .et__btn--ghost:not(:disabled):hover{background:rgba(255,255,255,.08);color:#fff;}
  .et__btn--ghost:disabled{opacity:.32;cursor:not-allowed;}
  .et__btn--ghost svg:first-child{transition:transform .15s;}
  .et__btn--ghost:not(:disabled):hover svg:first-child{transform:translateX(-2px);}
  .et__btn--primary{background:#2073E6;color:#fff;font-weight:700;box-shadow:inset 0 1px 0 rgba(255,255,255,.22);}
  .et__btn--primary:hover:not(:disabled){background:#2B8FFF;}
  .et__btn--primary:active:not(:disabled){transform:translateY(1px);}
  .et__btn--primary:disabled{background:rgba(255,255,255,.06);color:var(--mute);cursor:not-allowed;box-shadow:none;}
  .et__btn--primary .et-arr{transform:rotate(-45deg);transition:transform .15s;}
  .et__btn--primary:hover:not(:disabled) .et-arr{transform:rotate(-45deg) translateX(2px);}
  .et__spacer{flex:1 1 auto;}

  /* ── Успех — салют завершения ─────────────────────────────────────────── */
  .et__done{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:52px 34px 42px;}
  .et__burst{position:relative;width:100px;height:100px;display:grid;place-items:center;margin-bottom:6px;}
  .et__badge{position:relative;z-index:2;width:62px;height:62px;border-radius:20px;display:flex;align-items:center;justify-content:center;color:#C9F7E0;
    background:rgba(62,224,143,.13);border:1px solid rgba(62,224,143,.36);
    box-shadow:inset 0 0 24px rgba(62,224,143,.3),inset 0 1px 0 rgba(255,255,255,.18),0 10px 30px rgba(20,120,70,.34);}
  .et__ring{position:absolute;z-index:1;top:50%;left:50%;width:62px;height:62px;margin:-31px 0 0 -31px;border-radius:20px;border:1.5px solid rgba(62,224,143,.55);opacity:0;}
  .et__ring--2{width:70px;height:70px;margin:-35px 0 0 -35px;border-radius:23px;border-color:rgba(120,190,255,.45);}
  .et__spark{position:absolute;z-index:1;top:50%;left:50%;width:5px;height:5px;margin:-2.5px 0 0 -2.5px;border-radius:50%;opacity:0;}
  @keyframes etBadge{0%{transform:scale(.2);opacity:0}55%{transform:scale(1.12);opacity:1}100%{transform:scale(1);opacity:1}}
  @keyframes etRing{0%{transform:scale(.5);opacity:.75}100%{transform:scale(2.4);opacity:0}}
  @keyframes etSpark{0%{transform:translate(0,0) scale(0);opacity:0}30%{opacity:1}100%{transform:translate(var(--tx),var(--ty)) scale(1);opacity:0}}
  @media (prefers-reduced-motion:no-preference){
    .et__badge{animation:etBadge .55s cubic-bezier(.34,1.56,.64,1) both;}
    .et__ring{animation:etRing .95s ease-out .18s forwards;}
    .et__ring--2{animation-delay:.42s;}
    .et__spark{animation:etSpark .95s ease-out both;}
  }
  .et__doneh{font-size:23px;font-weight:700;letter-spacing:-.5px;color:#fff;text-wrap:balance;margin-top:4px;}
  .et__doneline{font-size:15px;font-weight:600;color:var(--jade-tx);}
  .et__dones{font-size:14px;color:var(--tx);line-height:1.62;max-width:42ch;margin-top:2px;}

  @media (prefers-reduced-motion: reduce){
    .et,.et__pane{animation:none;}
    .et__dl.is-late .et__dldot::after{animation:none;}
    .et__btn,.et__btn--primary .et-arr,.et__drop,.et__inp,.et__area,.et__x,.et__filex{transition:none;}
  }
  @media (max-width:600px){
    .et{max-width:100%;border-radius:18px;}
    .et__top{padding:24px 22px 0;}
    .et__x{top:18px;right:16px;}
    .et__pane{padding:24px 22px 30px;}
    .et__foot{padding:13px 16px;gap:10px;}
    .et__stepcap{display:none;}
    .et__title{font-size:22px;max-width:calc(100% - 42px);}
    .et__h{font-size:20px;}
    .et__done{padding:40px 24px 32px;}
  }
  `;

  if (typeof document !== 'undefined') {
    const prev = document.getElementById(STYLE_ID);
    if (prev) prev.remove();
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     НОРМАЛИЗАЦИЯ ДАННЫХ — новый и старый контракт к единому виду.
  ───────────────────────────────────────────────────────────────────────── */
  function actionTypeFromCta(cta, how) {
    const list = Array.isArray(how)
      ? how.map((x) => (typeof x === 'string' ? x : (x && (x.t || x.text)) || '')) : [];
    const s = ((cta || '') + ' ' + list.join(' ')).toLowerCase();
    if (/загруз|прикреп|скан|фото|справк|документ|файл|снимок|паспорт|аттестат|диплом/.test(s)) return 'upload';
    if (/заполн|ответ|анкет|форм|укаж|введи|напиш/.test(s)) return 'form';
    return 'upload';
  }

  function normalize(data) {
    const d = data || {};
    const owner = (d.side === 'us' || d.owner === 'us') ? 'us' : 'you';
    const title = d.title || 'Задача';

    // ── ШАГИ-ОБЪЯСНЕНИЯ ──────────────────────────────────────────────────
    let steps = [];
    if (Array.isArray(d.wizard) && d.wizard.length) {
      steps = d.wizard.map((w, i) => ({
        kind: w.flow ? 'flow' : (i === 0 ? 'intro' : 'explain'),
        title: w.title || 'Что нужно знать',
        body: Array.isArray(w.body) ? w.body : (w.body ? [w.body] : []),
        note: w.note || null,
        bullets: Array.isArray(w.bullets) ? w.bullets : null,
        flow: Array.isArray(w.flow) ? w.flow : null,
        materials: Array.isArray(w.materials) ? w.materials : null,
      }));
    } else {
      const intro = d.intro || d.desc || d.why || '';
      const flow = Array.isArray(d.flow) ? d.flow : [];
      const how = Array.isArray(d.how)
        ? d.how.map((x) => (typeof x === 'string' ? x : (x && (x.t || x.text)) || '')).filter(Boolean)
        : [];

      let firstNote = null;
      if (d.dlState === 'late' || /просроч|горит/i.test(String(d.dl || ''))) {
        firstNote = { type: 'warn', text: h(R.Fragment, null,
          h('span', { className: 'et__notek' }, 'Срок поджимает. '),
          'Лучше закрыть это сегодня.') };
      } else if (owner === 'you') {
        firstNote = { type: 'info', text: 'Разберем по шагам, ничего сложного.' };
      }

      if (intro) {
        steps.push({ kind: 'intro', title: 'Что это за задача', body: [intro], note: firstNote, bullets: null, flow: null });
        firstNote = null;
      }
      if (how.length) {
        steps.push({ kind: 'explain', title: 'Как это сделать', body: [], note: firstNote, bullets: how, flow: null });
        firstNote = null;
      }
      if (flow.length) {
        steps.push({
          kind: 'flow',
          title: owner === 'us' ? 'Что происходит с нашей стороны' : 'Что будет дальше',
          body: [owner === 'us'
            ? 'Это делаем мы. Вот путь от старта до готового результата.'
            : 'Вот весь путь задачи: где ты сейчас и что идет следом.'],
          note: firstNote, bullets: null, flow: flow,
        });
        firstNote = null;
      }
      if (!steps.length) {
        steps.push(owner === 'us'
          ? { kind: 'intro', title: 'Что делаем мы', body: [d.desc || 'Это наша часть. Сделаем сами и сообщим, когда будет готово.'], note: firstNote, bullets: null, flow: null }
          : { kind: 'intro', title: 'Что нужно сделать', body: [d.desc || 'Открой задачу и следуй подсказкам.'], note: firstNote, bullets: null, flow: null });
      }
    }

    // ── ШАГ-ДЕЙСТВИЕ ─────────────────────────────────────────────────────
    let action;
    if (d.action && d.action.type) {
      action = {
        type: d.action.type,
        label: d.action.label || (d.action.type === 'upload' ? 'Загрузить' : d.action.type === 'info' ? 'Понятно' : 'Отправить'),
        hint: d.action.hint || '',
        heading: d.action.heading || d.action.title || '',
        fields: Array.isArray(d.action.fields) ? d.action.fields : null,
        accept: d.action.accept || 'image/*,.pdf',
        formats: d.action.formats || '',
        doneText: d.action.doneText || '',
      };
    } else if (owner === 'us') {
      action = {
        type: 'info', label: 'Понятно', heading: 'Тебе делать ничего не нужно',
        hint: d.usNote || 'Эту задачу берет на себя твой куратор. Как будет результат — увидишь его здесь.',
        fields: null, accept: '', formats: '', doneText: '',
      };
    } else {
      const type = actionTypeFromCta(d.cta, d.how);
      action = {
        type: type,
        label: d.cta && d.cta !== 'Открыть задачу' ? d.cta : (type === 'upload' ? 'Отправить на проверку' : 'Отправить'),
        heading: type === 'upload' ? 'Загрузи документ' : 'Заполни и отправь',
        hint: type === 'upload'
          ? 'Перетащи файл сюда или выбери на устройстве. Подойдет четкое фото или скан.'
          : 'Заполни поля ниже, мы получим ответ сразу.',
        fields: null, accept: 'image/*,.pdf', formats: '', doneText: '',
      };
    }

    return { owner: owner, title: title, dl: d.dl || '', dlState: d.dlState || '',
      steps: steps, action: action };
  }

  function fileSize(bytes) {
    if (bytes == null) return '';
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' КБ';
    return (bytes / 1048576).toFixed(1).replace('.', ',') + ' МБ';
  }

  /* ─────────────────────────────────────────────────────────────────────────
     КОМПОНЕНТ
  ───────────────────────────────────────────────────────────────────────── */
  function ESTaskModal(props) {
    const close = (props && props.close) || function () {};
    const model = normalize(props && props.data);
    const act = model.action;

    const total = model.steps.length + 1;   // объяснения + действие
    const lastIndex = total - 1;
    const [idx, setIdx] = useState(0);
    const [over, setOver] = useState(false);
    const [file, setFile] = useState(null);
    const [form, setForm] = useState({});
    const [done, setDone] = useState(false);
    const fileInput = useRef(null);
    const rootRef = useRef(null);
    const bodyRef = useRef(null);

    const onAction = idx === lastIndex;

    useEffect(() => {
      const onKey = (e) => { if (e.key === 'Escape') close(); };
      document.addEventListener('keydown', onKey);
      if (rootRef.current) rootRef.current.focus();
      return () => document.removeEventListener('keydown', onKey);
    }, []);
    useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0; }, [idx, done]);

    const go = (n) => { setIdx(Math.max(0, Math.min(lastIndex, n))); };
    const back = () => { if (idx > 0) go(idx - 1); };
    const next = () => { if (!onAction) go(idx + 1); };

    const fieldsList = act.fields;
    const actionReady = (function () {
      if (act.type === 'info') return true;
      if (act.type === 'upload') return !!file;
      if (act.type === 'text') return !!(form.__text && form.__text.trim());
      if (act.type === 'form') {
        if (!fieldsList || !fieldsList.length) return !!(form.__text && form.__text.trim());
        return fieldsList.every((f, i) => f.optional || (form['f' + i] || '').trim());
      }
      return true;
    })();

    const submit = () => {
      if (act.type === 'info') { close(); return; }
      if (actionReady) setDone(true);
    };
    const pickFile = (f) => { if (f) setFile({ name: f.name, size: f.size }); };

    /* ── прогресс в подвале: «Шаг N из M» + точки-дорожка (как в anketa) ── */
    function FootMid() {
      const segs = [];
      for (let i = 0; i < total; i++) {
        const cls = i < idx ? 'd done' : (i === idx ? 'd cur' : 'd');
        segs.push(h('i', { key: 'd' + i, className: cls }));
        if (i < total - 1) segs.push(h('i', { key: 'l' + i, className: 'ln' }));
      }
      return h('div', { className: 'et__mid' },
        h('span', { className: 'et__stepcap et__num' }, 'Шаг ' + (idx + 1) + ' из ' + total),
        h('span', { className: 'et__dots' }, segs));
    }

    /* ── шаг-объяснение ───────────────────────────────────────────────── */
    function ExplainPane(step) {
      const noteIc = step.note
        ? (step.note.type === 'warn' ? 'AlertTriangle' : step.note.type === 'tip' ? 'Bolt' : 'Info')
        : null;
      const body = step.body || [];
      const lead = body.length ? body[0] : '';
      const rest = body.slice(1);
      return h('div', { className: 'et__pane', key: 'ex' + idx },
        h('div', { className: 'et__h' }, step.title),
        lead ? h('div', { className: 'et__lead' }, lead) : null,
        rest.map((p, i) => h('p', { className: 'et__p', key: 'p' + i }, p)),
        step.bullets && step.bullets.length
          ? h('div', { className: 'et__bullets' },
              step.bullets.filter(Boolean).map((b, i) => h('div', { className: 'et__bullet', key: 'b' + i },
                h('span', { className: 'et__bnum et__num' }, i + 1),
                h('span', { className: 'et__btext' }, b))))
          : null,
        step.materials && step.materials.length
          ? h('div', { className: 'et__mats' },
              h('div', { className: 'et__mats-h' }, 'Материалы к задаче'),
              step.materials.filter(Boolean).map((m, i) => {
                const mi = m.kind === 'guide' ? 'Book' : 'Doc';
                const go = m.kind === 'pdf' ? 'Download' : 'ArrowRight';
                return h('button', { className: 'et__mat', type: 'button', key: 'm' + i },
                  h('span', { className: 'et__mat-ic' }, icon(mi, { size: 16 })),
                  h('span', { className: 'et__mat-b' },
                    h('span', { className: 'et__mat-t' }, m.name),
                    m.meta ? h('span', { className: 'et__mat-m et__num' }, m.meta) : null),
                  h('span', { className: 'et__mat-go' }, icon(go, { size: 16 })));
              }))
          : null,
        step.flow && step.flow.length
          ? h('div', { className: 'et__flow' },
              step.flow.map((f, i) => {
                const st = f.st || (i === 0 ? 'current' : 'upcoming');
                return h('div', { className: 'et__fstep ' + st, key: 'f' + i },
                  h('span', { className: 'et__fmk' },
                    st === 'done' ? icon('Check', { size: 13, strokeWidth: 2.6 }) : (i + 1)),
                  h('span', { className: 'et__fline' }),
                  h('div', { style: { minWidth: 0 } },
                    h('div', { className: 'et__ft' }, f.t),
                    f.s ? h('div', { className: 'et__fs' }, f.s) : null));
              }))
          : null,
        step.note
          ? h('div', { className: 'et__note et__note--' + step.note.type },
              h('span', { className: 'et__noteic' }, icon(noteIc, { size: 16 })),
              h('div', { className: 'et__notetx' }, step.note.text))
          : null);
    }

    /* ── шаг-действие ─────────────────────────────────────────────────── */
    function ActionPane() {
      if (act.type === 'info') {
        return h('div', { className: 'et__pane', key: 'act' },
          h('div', { className: 'et__h' }, act.heading || 'Тебе делать ничего не нужно'),
          h('div', { className: 'et__lead' }, 'Эта задача на нас. Можно закрыть окно и заняться своими шагами.'),
          h('div', { className: 'et__note et__note--tip', style: { marginTop: 18 } },
            h('span', { className: 'et__noteic' }, icon('Check', { size: 16, strokeWidth: 2.4 })),
            h('div', { className: 'et__notetx' }, act.hint || 'Сообщим, когда будет готово.')));
      }
      if (act.type === 'upload') {
        return h('div', { className: 'et__pane', key: 'act' },
          h('div', { className: 'et__h' }, act.heading || 'Загрузи документ'),
          act.hint ? h('div', { className: 'et__lead' }, act.hint) : null,
          h('div', {
            className: 'et__drop' + (over ? ' is-over' : ''),
            onClick: () => fileInput.current && fileInput.current.click(),
            onDragOver: (e) => { e.preventDefault(); setOver(true); },
            onDragLeave: () => setOver(false),
            onDrop: (e) => { e.preventDefault(); setOver(false); pickFile(e.dataTransfer.files && e.dataTransfer.files[0]); },
            role: 'button', tabIndex: 0,
            onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.current && fileInput.current.click(); } },
          },
            h('span', { className: 'et__dropic' }, icon('Upload', { size: 22 })),
            h('div', { className: 'et__dropt' }, 'Перетащи сюда или ', h('b', null, 'выбери файл')),
            h('div', { className: 'et__droph' },
              act.formats || 'Сделай так, чтобы текст и печати на документе читались.'),
            h('input', {
              ref: fileInput, type: 'file', style: { display: 'none' },
              accept: act.accept || 'image/*,.pdf',
              onChange: (e) => pickFile(e.target.files && e.target.files[0]),
            })),
          file
            ? h('div', { className: 'et__file' },
                h('span', { className: 'et__fileic' }, icon('File', { size: 17 })),
                h('div', { className: 'et__fileb' },
                  h('div', { className: 'et__filen' }, file.name),
                  h('div', { className: 'et__files et__num' }, (fileSize(file.size) ? fileSize(file.size) + ' · ' : '') + 'готов к отправке')),
                h('button', { className: 'et__filex', type: 'button', onClick: () => setFile(null), 'aria-label': 'Убрать файл' },
                  icon('Close', { size: 15 })))
            : null);
      }
      // form / text
      const asText = act.type === 'text' || !fieldsList || !fieldsList.length;
      return h('div', { className: 'et__pane', key: 'act' },
        h('div', { className: 'et__h' }, act.heading || 'Заполни данные'),
        act.hint ? h('div', { className: 'et__lead' }, act.hint) : null,
        h('div', { className: 'et__form' },
          asText
            ? h('div', { className: 'et__field' },
                h('label', { className: 'et__lab' }, 'Твой ответ'),
                h('textarea', {
                  className: 'et__area',
                  placeholder: 'Напиши здесь...',
                  value: form.__text || '',
                  onChange: (e) => setForm(Object.assign({}, form, { __text: e.target.value })),
                }))
            : fieldsList.map((f, i) => h('div', { className: 'et__field', key: 'fl' + i },
                h('label', { className: 'et__lab' }, f.label || ('Поле ' + (i + 1))),
                (f.type === 'textarea'
                  ? h('textarea', {
                      className: 'et__area',
                      placeholder: f.placeholder || '',
                      value: form['f' + i] || '',
                      onChange: (e) => setForm(Object.assign({}, form, { ['f' + i]: e.target.value })),
                    })
                  : h('input', {
                      className: 'et__inp',
                      type: f.type || 'text',
                      placeholder: f.placeholder || '',
                      value: form['f' + i] || '',
                      onChange: (e) => setForm(Object.assign({}, form, { ['f' + i]: e.target.value })),
                    }))))));
    }

    /* ── успех — салют завершения ─────────────────────────────────────── */
    function DonePane() {
      return h('div', { className: 'et__pane', key: 'done', style: { padding: 0 } },
        h('div', { className: 'et__done' },
          h('div', { className: 'et__burst' },
            h('span', { className: 'et__ring' }),
            h('span', { className: 'et__ring et__ring--2' }),
            SPARKS.map((s, i) => h('span', {
              key: 'sp' + i, className: 'et__spark',
              style: { '--tx': s.tx + 'px', '--ty': s.ty + 'px', animationDelay: s.d + 's',
                background: s.c, boxShadow: '0 0 7px ' + s.c },
            })),
            h('span', { className: 'et__badge' }, icon('Check', { size: 28, strokeWidth: 2.4 }))),
          h('div', { className: 'et__doneh' }, act.type === 'upload' ? 'Файл отправлен' : 'Ответ отправлен'),
          h('div', { className: 'et__doneline' }, 'Скоро вернемся с ответом'),
          h('div', { className: 'et__dones' }, act.doneText ||
            'Обычно это занимает 1-2 дня. Если что-то нужно будет поправить — напишем прямо здесь. Можно закрыть окно.')));
    }

    const currentStep = !onAction ? model.steps[idx] : null;
    const primaryLabel = onAction
      ? (act.type === 'info' ? (act.label || 'Понятно') : (act.label || 'Отправить'))
      : 'Далее';
    const late = model.dlState === 'late';
    const urgent = model.dlState === 'urgent' || model.dlState === 'warn';
    const dlCls = late ? ' is-late' : (urgent ? ' is-urgent' : '');

    return h('div', {
      className: 'et', ref: rootRef, tabIndex: -1,
      onMouseDown: (e) => e.stopPropagation(),
      role: 'dialog', 'aria-modal': 'true', 'aria-label': model.title,
    },
      /* шапка */
      h('div', { className: 'et__top' },
        h('div', { className: 'et__title' }, model.title),
        (model.dl && !done)
          ? h('div', { className: 'et__dl' + dlCls },
              late ? h('span', { className: 'et__dldot' }) : icon('Clock', { size: 13 }),
              'Срок до ' + model.dl)
          : null,
        h('button', { className: 'et__x', type: 'button', onClick: close, 'aria-label': 'Закрыть' },
          icon('Close', { size: 17 }) || '×')),

      /* тело */
      h('div', { className: 'et__body', ref: bodyRef },
        done ? DonePane() : (onAction ? ActionPane() : ExplainPane(currentStep))),

      /* низ */
      h('div', { className: 'et__foot' },
        done
          ? h(R.Fragment, null,
              h('span', { className: 'et__spacer' }),
              h('button', { className: 'et__btn et__btn--primary', type: 'button', onClick: close },
                'Закрыть', icon('Check', { size: 15 })))
          : h(R.Fragment, null,
              h('button', { className: 'et__btn et__btn--ghost', type: 'button', onClick: back, disabled: idx === 0 },
                icon('ChevronLeft', { size: 15 }), 'Назад'),
              FootMid(),
              onAction
                ? h('button', {
                    className: 'et__btn et__btn--primary',
                    type: 'button', disabled: !actionReady, onClick: submit,
                  }, primaryLabel, icon(act.type === 'info' ? 'Check' : 'ArrowRight', { size: 15, className: act.type === 'info' ? '' : 'et-arr' }))
                : h('button', { className: 'et__btn et__btn--primary', type: 'button', onClick: next },
                    'Далее', icon('ArrowRight', { size: 15, className: 'et-arr' })))));
  }

  window.ESTaskModal = ESTaskModal;
})();
