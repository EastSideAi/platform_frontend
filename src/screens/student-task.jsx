/* ============================================================================
   EastSide — ПОП-АП ЗАДАЧИ (многошаговый визард)  window.ESTaskModal
   ----------------------------------------------------------------------------
   СВЕТЛЫЙ, воздушный мастер (Режим B по design.md). Оверлей рисует PopupHost
   (.sd-ov--center, темное затемнение) — сама модалка светлое молочное стекло:
   чернила #16203B, сапфир #2B8FFF как ЕДИНСТВЕННЫЙ акцент, полупрозрачные
   бордеры, тихие тонированные тени. Крупная, просторная, понятная.

   Каждый шаг держит КРУПНЫЙ 3D-PNG как тихий якорь, подобранный по смыслу:
     интро/знакомство             -> mascot-cut (теплая человеческая нота);
     план/порядок/сроки/что-дальше -> compass (ориентир по пути);
     поток flow                   -> compass;
     документ/загрузка/форма/текст -> folder-glass (стеклянная папка);
     делаем мы                    -> robot-ai;
     успех                        -> mountain-peak (вершина = цель).

   Контракт: window.ESTaskModal({ data, close, openChat }) -> <корневой элемент>.
   PopupHost оборачивает результат в .sd-ov--center, поэтому возвращаем САМУ
   модалку. Закрытие — props.close(). "Спросить AI" — props.openChat({label}).

   data (новый контракт):
     { title, side:'you'|'us', owner, time,
       wizard:[ { title, body:[абзацы], note?:{type:'tip'|'warn'|'info', text},
                  bullets?:[...], flow?:[{t,s,st}] } ],
       action:{ type:'upload'|'form'|'text'|'info', label, hint, heading,
                fields?:[{label,placeholder,type}] } }

   ОБРАТНАЯ СОВМЕСТИМОСТЬ: задачи приходят без wizard/action, но с desc/why,
   how:[...], flow:[{t,s,st}], time, cta, result, side, dl, dlState. Тогда шаги
   и действие синтезируются: wizard нет -> собираем из intro/desc + how + flow,
   dlState:'late' -> деликатная warn-сноска, dl -> info-сноска; action нет ->
   side:'us' дает info (тебе делать нечего), иначе upload.

   Анимации только transform/opacity (150-250ms), без transition:all и переходов
   краски. Текст русский без буквы «е» с точками. Голос на «ты».
   ============================================================================ */
(function () {
  'use strict';
  const R = window.React || React;
  const { createElement: h, useState, useEffect, useRef } = R;
  const Ic = window.EIcons || {};

  /* ── Иконка с защитой (имена — из src/lib/icons.jsx) ──────────────────── */
  const icon = (name, props) => (Ic[name] ? h(Ic[name], props || {}) : null);

  /* ─────────────────────────────────────────────────────────────────────────
     СТИЛИ — инжектятся один раз. Префикс .et- (everest task), не трогает .sd-.
     Цвета строго из токенов: сапфир #2B8FFF/#5CB4FF/#2073E6/#1763C8, чернила
     #16203B, jade #2EA06E/#3EE08F/#1C7E52, rose #D2604F. Золото — только цель.
  ───────────────────────────────────────────────────────────────────────── */
  const STYLE_ID = 'es-task-modal-light-css';
  const CSS = `
  .et{
    --et-acc:#2B8FFF; --et-acc2:#5CB4FF; --et-deep:#2073E6; --et-ink-acc:#1763C8;
    --et-ink:#16203B; --et-sub:rgba(22,32,59,.62); --et-mute:rgba(22,32,59,.44);
    --et-line:rgba(22,32,59,.09); --et-line-acc:rgba(43,111,224,.16);
    --et-jade:#2EA06E; --et-jade-hi:#3EE08F; --et-jade-deep:#1C7E52;
    --et-rose:#D2604F; --et-rose-ink:#B23B2A; --et-gold:#C9923E;
    width:100%; max-width:768px; max-height:92vh; display:flex; flex-direction:column;
    position:relative; border-radius:28px; overflow:hidden;
    font-family:'Onest','Segoe UI',system-ui,-apple-system,sans-serif;
    color:var(--et-ink);
    background:
      radial-gradient(660px 440px at 90% -10%, rgba(43,143,255,.16), transparent 62%),
      radial-gradient(520px 380px at -4% 110%, rgba(43,111,224,.09), transparent 60%),
      linear-gradient(180deg,#FBFCFF 0%,#F5F7FD 58%,#EEF1FA 100%);
    border:1px solid rgba(255,255,255,.9);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.95),
      inset 0 0 70px rgba(255,255,255,.4),
      0 36px 96px rgba(8,16,44,.42),
      0 2px 8px rgba(8,16,44,.16);
    animation:etRise .26s cubic-bezier(.16,1,.3,1);
    -webkit-font-smoothing:antialiased;
  }
  @keyframes etRise{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
  .et *{box-sizing:border-box;}
  .et__num{font-variant-numeric:tabular-nums;}

  /* ── Шапка: принадлежность (цветом) + срок + закрытие ─────────────────── */
  .et__head{position:relative;z-index:2;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;
    padding:32px 40px 0;}
  .et__headl{min-width:0;flex:1 1 auto;}
  .et__meta{display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:13px;}
  .et__owner{display:inline-flex;align-items:center;gap:10px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;}
  .et__owner--you{color:var(--et-ink-acc);}
  .et__owner--us{color:var(--et-jade-deep);}
  .et__ownic{width:27px;height:27px;flex:0 0 27px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;}
  .et__owner--you .et__ownic{background:linear-gradient(150deg,var(--et-acc2),var(--et-deep));
    box-shadow:inset 0 0 12px rgba(175,215,255,.7),inset 0 1px 0 rgba(255,255,255,.55),0 4px 12px rgba(43,143,255,.28);}
  .et__owner--us .et__ownic{background:linear-gradient(150deg,var(--et-jade-hi),var(--et-jade-deep));
    box-shadow:inset 0 0 12px rgba(190,255,225,.6),inset 0 1px 0 rgba(255,255,255,.5),0 4px 12px rgba(28,126,82,.26);}
  .et__time{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:500;color:var(--et-mute);}
  .et__time svg{color:var(--et-mute);}
  .et__time.is-late{color:var(--et-rose);font-weight:600;}
  .et__time.is-late svg{color:var(--et-rose);}
  .et__title{font-weight:700;font-size:27px;letter-spacing:-.8px;line-height:1.1;color:var(--et-ink);text-wrap:balance;max-width:94%;}
  .et__x{width:40px;height:40px;flex:0 0 40px;border-radius:13px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--et-mute);
    background:rgba(255,255,255,.7);border:1px solid rgba(22,32,59,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.9);transition:transform .15s;}
  .et__x:hover{transform:translateY(-1px);color:var(--et-ink);}
  .et__x:active{transform:scale(.94);}

  /* ── Тонкий степпер: пройдено / сейчас / впереди ──────────────────────── */
  .et__steps{position:relative;z-index:2;display:flex;align-items:center;gap:8px;padding:26px 40px 0;}
  .et__seg{flex:1 1 0;height:4px;border-radius:99px;background:rgba(22,32,59,.10);overflow:hidden;}
  .et__seg i{display:block;height:100%;width:100%;border-radius:99px;background:rgba(22,32,59,.10);
    transform:scaleX(0);transform-origin:left center;transition:transform .35s cubic-bezier(.16,1,.3,1);}
  .et__seg.is-done i{transform:scaleX(1);background:linear-gradient(90deg,var(--et-deep),var(--et-acc));}
  .et__seg.is-now i{transform:scaleX(1);background:linear-gradient(90deg,var(--et-acc2),var(--et-acc));
    box-shadow:0 0 10px rgba(43,143,255,.45);}
  .et__stepmeta{position:relative;z-index:2;display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:14px 40px 0;}
  .et__stepcap{font-size:10.5px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:var(--et-ink-acc);}
  .et__stepcount{font-size:12.5px;font-weight:600;color:var(--et-mute);}

  /* ── Тело: скролл-контент шага ────────────────────────────────────────── */
  .et__body{position:relative;z-index:2;flex:1 1 auto;overflow-y:auto;padding:6px 0 0;}
  .et__body::-webkit-scrollbar{width:9px;}
  .et__body::-webkit-scrollbar-thumb{background:rgba(22,32,59,.16);border-radius:99px;border:3px solid transparent;background-clip:padding-box;}
  .et__pane{animation:etPane .26s cubic-bezier(.16,1,.3,1);}
  @keyframes etPane{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}

  /* якорь-PNG шага: PNG на стеклянном медальоне со свечением-ядром позади,
     отражением-полом (картинка «стоит», а не висит), верхним бликом-гранью и
     чипом-номером шага в углу — кадр, а не пустой квадрат. Рядом — эйбрау-метка
     контекста, заголовок, лид и компактные плашки-факты шага. */
  .et__anchor{position:relative;display:flex;align-items:center;gap:30px;padding:32px 40px 12px;}
  .et__anchor::before{content:'';position:absolute;z-index:0;left:14px;top:4px;width:216px;height:216px;border-radius:50%;pointer-events:none;
    background:radial-gradient(circle at 50% 42%, rgba(43,143,255,.18), transparent 64%);}
  .et__anchor--jade::before{background:radial-gradient(circle at 50% 42%, rgba(46,160,110,.17), transparent 64%);}

  .et__orbwrap{position:relative;z-index:1;flex:0 0 156px;width:156px;height:156px;}
  .et__orb{position:relative;width:156px;height:156px;border-radius:42px;display:grid;place-items:center;overflow:hidden;
    background:
      radial-gradient(82% 76% at 50% 24%, rgba(255,255,255,.99), rgba(229,238,255,.55) 68%, rgba(212,224,250,.42) 100%),
      linear-gradient(158deg, rgba(43,143,255,.12), rgba(43,143,255,.02));
    border:1px solid rgba(43,111,224,.2);
    box-shadow:inset 0 1px 0 rgba(255,255,255,1),inset 0 0 44px rgba(43,143,255,.16),0 18px 38px rgba(43,90,200,.16);}
  /* отражение-пол: мягкая сапфировая тень-эллипс под фигурой */
  .et__orb::before{content:'';position:absolute;z-index:0;left:50%;bottom:15px;width:108px;height:30px;transform:translateX(-50%);
    border-radius:50%;background:radial-gradient(closest-side, rgba(43,90,200,.24), transparent 80%);}
  /* верхний блик-грань стекла */
  .et__orb::after{content:'';position:absolute;z-index:2;inset:0;pointer-events:none;border-radius:inherit;
    background:linear-gradient(177deg, rgba(255,255,255,.72) 0%, rgba(255,255,255,0) 32%);}
  .et__orb--jade{background:radial-gradient(82% 76% at 50% 24%, rgba(255,255,255,.99), rgba(227,247,237,.55) 68%, rgba(208,238,224,.42) 100%),linear-gradient(158deg, rgba(46,160,110,.12), rgba(46,160,110,.02));
    border-color:rgba(28,126,82,.22);box-shadow:inset 0 1px 0 rgba(255,255,255,1),inset 0 0 44px rgba(46,160,110,.16),0 18px 38px rgba(28,126,82,.16);}
  .et__orb--jade::before{background:radial-gradient(closest-side, rgba(28,126,82,.22), transparent 80%);}
  .et__orb img{position:relative;z-index:1;width:122px;height:122px;object-fit:contain;filter:drop-shadow(0 14px 22px rgba(40,60,140,.24));}
  .et__orb--jade img{filter:drop-shadow(0 12px 18px rgba(40,55,90,.2));}
  /* маскот — фигура целиком, низом упирается в дно медальона (живее, чем по центру) */
  .et__orb--mascot img{width:136px;height:168px;object-fit:contain;object-position:bottom;margin-bottom:-16px;align-self:end;}
  /* компас — крупнее, как ориентир */
  .et__orb--compass img{width:130px;height:130px;}
  /* чип-номер шага в углу медальона — узел восхождения */
  .et__orbstep{position:absolute;z-index:3;right:-9px;bottom:-9px;min-width:34px;height:34px;padding:0 9px;border-radius:13px;
    display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums;letter-spacing:.01em;
    background:linear-gradient(150deg,var(--et-acc2),var(--et-deep));
    box-shadow:inset 0 0 12px rgba(175,215,255,.6),inset 0 1px 0 rgba(255,255,255,.55),0 7px 16px rgba(43,143,255,.42),0 0 0 4.5px #FBFCFF;}
  .et__anchor--jade .et__orbstep{background:linear-gradient(150deg,var(--et-jade-hi),var(--et-jade-deep));
    box-shadow:inset 0 0 12px rgba(190,255,225,.55),inset 0 1px 0 rgba(255,255,255,.5),0 7px 16px rgba(28,126,82,.4),0 0 0 4.5px #FBFCFF;}

  .et__anchortx{position:relative;z-index:1;flex:1 1 auto;min-width:0;}
  /* эйбрау-метка контекста шага — editorial, с тонкой ведущей чертой */
  .et__eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:10.5px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;
    color:var(--et-ink-acc);margin-bottom:12px;}
  .et__eyebrow::before{content:'';width:16px;height:1.5px;border-radius:2px;background:linear-gradient(90deg,var(--et-acc),rgba(43,143,255,0));}
  .et__anchor--jade .et__eyebrow{color:var(--et-jade-deep);}
  .et__anchor--jade .et__eyebrow::before{background:linear-gradient(90deg,var(--et-jade),rgba(46,160,110,0));}
  .et__h{font-weight:700;font-size:24px;letter-spacing:-.6px;line-height:1.16;color:var(--et-ink);text-wrap:balance;}
  .et__lead{font-size:15px;line-height:1.6;color:var(--et-sub);margin-top:11px;}
  /* плашки-факты шага — компактные подписи рядом с якорем */
  .et__facts{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;}
  .et__fact{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:10px;
    font-size:12px;font-weight:600;color:var(--et-sub);white-space:nowrap;
    background:rgba(255,255,255,.66);border:1px solid var(--et-line);box-shadow:inset 0 1px 0 rgba(255,255,255,.85);}
  .et__fact svg{flex:0 0 auto;color:var(--et-ink-acc);}
  .et__fact b{color:var(--et-ink);font-weight:700;}
  .et__anchor--jade .et__fact svg{color:var(--et-jade-deep);}

  /* контент-секция шага под якорем — много воздуха */
  .et__sect{padding:22px 40px 36px;}
  .et__p{font-size:15px;line-height:1.66;color:var(--et-sub);margin:0 0 15px;}
  .et__p:last-child{margin-bottom:0;}

  /* буллеты «что важно знать» — узел-галочка вместо безликой точки */
  .et__bullets{display:flex;flex-direction:column;gap:14px;margin:6px 0 2px;}
  .et__bullet{display:flex;gap:15px;align-items:flex-start;}
  .et__bnode{width:28px;height:28px;flex:0 0 28px;border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--et-deep);margin-top:1px;
    background:rgba(43,143,255,.10);box-shadow:inset 0 0 0 1px rgba(43,143,255,.2),inset 0 0 12px rgba(43,143,255,.12);}
  .et__btext{flex:1 1 auto;min-width:0;font-size:14.5px;line-height:1.55;color:var(--et-ink);}

  /* приложенные материалы — стеклянные карточки-вложения с сапфировым медальоном */
  .et__mats{margin-top:24px;display:flex;flex-direction:column;gap:10px;}
  .et__mats-h{font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--et-mute);margin-bottom:2px;}
  .et__mat{display:flex;align-items:center;gap:14px;width:100%;text-align:left;cursor:pointer;font-family:inherit;
    padding:14px 15px;border-radius:15px;background:rgba(255,255,255,.66);border:1px solid var(--et-line);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.85);transition:transform .15s,border-color .15s,box-shadow .15s;}
  .et__mat:hover{transform:translateY(-1px);border-color:rgba(43,143,255,.4);box-shadow:inset 0 1px 0 rgba(255,255,255,.9),0 9px 24px rgba(43,90,200,.1);}
  .et__mat:active{transform:translateY(0);}
  .et__mat-ic{flex:0 0 42px;width:42px;height:42px;border-radius:13px;display:grid;place-items:center;color:#fff;
    background:linear-gradient(150deg,var(--et-acc2),var(--et-deep));
    box-shadow:inset 0 0 12px rgba(175,215,255,.55),inset 0 1px 0 rgba(255,255,255,.5),0 5px 14px rgba(43,143,255,.26);}
  .et__mat-b{flex:1 1 auto;min-width:0;}
  .et__mat-t{font-size:14px;font-weight:600;color:var(--et-ink);line-height:1.32;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .et__mat-m{font-size:12px;color:var(--et-mute);margin-top:2px;}
  .et__mat-go{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;color:var(--et-ink-acc);
    background:rgba(43,143,255,.08);box-shadow:inset 0 0 0 1px rgba(43,143,255,.16);transition:background .15s;}
  .et__mat:hover .et__mat-go{background:rgba(43,143,255,.16);}

  /* лента «как это происходит» — метафора восхождения по шагам */
  .et__flow{display:flex;flex-direction:column;margin:4px 0 2px;}
  .et__fstep{display:flex;gap:17px;position:relative;padding-bottom:20px;}
  .et__fstep:last-child{padding-bottom:0;}
  .et__fmk{width:31px;height:31px;flex:0 0 31px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;z-index:1;
    font-variant-numeric:tabular-nums;background:#fff;color:var(--et-mute);border:1.5px solid rgba(22,32,59,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.9);}
  .et__fstep.done .et__fmk{background:linear-gradient(150deg,var(--et-acc2),var(--et-deep));color:#fff;border:0;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 4px 10px rgba(43,143,255,.3);}
  .et__fstep.current .et__fmk{background:linear-gradient(150deg,var(--et-acc2),var(--et-deep));color:#fff;border:0;
    box-shadow:0 0 0 5px rgba(43,143,255,.13),inset 0 0 11px rgba(175,215,255,.6),inset 0 1px 0 rgba(255,255,255,.5),0 6px 16px rgba(43,143,255,.36);}
  .et__fline{position:absolute;left:14.5px;top:33px;bottom:2px;width:2.5px;border-radius:2px;background:rgba(22,32,59,.12);}
  .et__fstep.done .et__fline{background:linear-gradient(180deg,var(--et-acc),rgba(43,143,255,.3));}
  .et__fstep:last-child .et__fline{display:none;}
  .et__ft{font-size:14.5px;font-weight:600;color:var(--et-ink);line-height:1.35;margin-top:5px;}
  .et__fstep.upcoming .et__ft{color:var(--et-mute);font-weight:500;}
  .et__fs{font-size:13px;color:var(--et-mute);margin-top:4px;line-height:1.5;}

  /* сноска tip/warn/info — светлое стекло с тинтом токена, без пилюль */
  .et__note{display:flex;gap:15px;align-items:flex-start;margin-top:24px;padding:17px 19px;border-radius:16px;
    border:1px solid;box-shadow:inset 0 1px 0 rgba(255,255,255,.7);}
  .et__note--info{background:rgba(43,143,255,.07);border-color:rgba(43,143,255,.22);}
  .et__note--tip{background:rgba(46,160,110,.08);border-color:rgba(46,160,110,.26);}
  .et__note--warn{background:rgba(210,96,79,.08);border-color:rgba(210,96,79,.28);}
  .et__noteic{width:33px;height:33px;flex:0 0 33px;border-radius:11px;display:flex;align-items:center;justify-content:center;margin-top:1px;color:#fff;}
  .et__note--info .et__noteic{background:linear-gradient(150deg,var(--et-acc2),var(--et-deep));box-shadow:inset 0 0 12px rgba(175,215,255,.6),0 4px 12px rgba(43,143,255,.26);}
  .et__note--tip .et__noteic{background:linear-gradient(150deg,var(--et-jade-hi),var(--et-jade-deep));box-shadow:inset 0 0 12px rgba(190,255,225,.55),0 4px 12px rgba(28,126,82,.24);}
  .et__note--warn .et__noteic{background:linear-gradient(150deg,#E8806F,var(--et-rose-ink));box-shadow:inset 0 0 12px rgba(255,205,196,.55),0 4px 12px rgba(178,59,42,.26);}
  .et__notetx{flex:1 1 auto;min-width:0;font-size:13.5px;line-height:1.6;color:var(--et-sub);}
  .et__notek{font-weight:700;color:var(--et-ink);}
  .et__note--warn .et__notek{color:var(--et-rose-ink);}

  /* ── Финальный шаг: ДЕЙСТВИЕ ──────────────────────────────────────────── */
  /* дропзона — светлое морозное стекло, не серый прямоугольник */
  .et__drop{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;
    padding:42px 28px;border-radius:22px;cursor:pointer;
    background:radial-gradient(400px 240px at 50% -30%,rgba(43,143,255,.12),transparent 70%),rgba(255,255,255,.62);
    border:1.5px dashed rgba(43,111,224,.4);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.9),inset 0 0 48px rgba(43,143,255,.05);transition:transform .15s;}
  .et__drop::after{content:'';position:absolute;inset:-1.5px;border-radius:22px;pointer-events:none;opacity:0;transition:opacity .18s;
    box-shadow:inset 0 0 0 1.5px rgba(43,143,255,.5),inset 0 0 40px rgba(43,143,255,.10);}
  .et__drop:hover{transform:translateY(-1px);}
  .et__drop:hover::after{opacity:1;}
  .et__drop.is-over{border-color:var(--et-acc);border-style:solid;
    background:radial-gradient(420px 260px at 50% -20%,rgba(43,143,255,.22),transparent 70%),rgba(43,143,255,.07);}
  .et__drop.is-over::after{opacity:0;}
  .et__dropic{width:62px;height:62px;border-radius:19px;display:flex;align-items:center;justify-content:center;color:#fff;margin-bottom:9px;
    background:linear-gradient(150deg,var(--et-acc2),var(--et-deep));box-shadow:inset 0 0 18px rgba(180,220,255,.65),inset 0 1px 0 rgba(255,255,255,.55),0 12px 28px rgba(43,143,255,.34);}
  .et__dropt{font-size:16px;font-weight:600;color:var(--et-ink);}
  .et__dropt b{color:var(--et-deep);font-weight:700;}
  .et__droph{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;color:var(--et-mute);line-height:1.5;max-width:400px;margin-top:4px;}
  .et__droph svg{flex:0 0 auto;color:var(--et-mute);}
  /* состояние «файл выбран» — единый jade */
  .et__file{display:flex;align-items:center;gap:15px;padding:17px 19px;border-radius:16px;margin-top:15px;
    background:linear-gradient(150deg,rgba(46,160,110,.10),rgba(46,160,110,.03));border:1px solid rgba(46,160,110,.3);
    box-shadow:inset 0 1px 0 rgba(255,255,255,.7),inset 0 0 26px rgba(46,160,110,.07);}
  .et__fileic{width:42px;height:42px;flex:0 0 42px;border-radius:13px;display:flex;align-items:center;justify-content:center;color:#fff;
    background:linear-gradient(150deg,var(--et-jade-hi),var(--et-jade-deep));box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 6px 16px rgba(28,126,82,.32);}
  .et__fileb{flex:1 1 auto;min-width:0;}
  .et__filen{font-size:14.5px;font-weight:600;color:var(--et-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .et__files{font-size:12px;color:var(--et-jade-deep);margin-top:2px;}
  .et__filex{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--et-mute);
    background:rgba(255,255,255,.7);border:1px solid rgba(46,160,110,.24);transition:transform .15s;}
  .et__filex:hover{color:var(--et-ink);transform:translateY(-1px);}
  .et__filex:active{transform:scale(.94);}

  /* поля формы / текст */
  .et__form{display:flex;flex-direction:column;gap:17px;}
  .et__field{display:flex;flex-direction:column;gap:9px;}
  .et__lab{font-size:12.5px;font-weight:600;letter-spacing:.01em;color:var(--et-sub);}
  .et__inp,.et__area{width:100%;background:rgba(255,255,255,.7);border:1.5px solid rgba(22,32,59,.12);border-radius:14px;
    padding:14px 16px;color:var(--et-ink);font-size:14.5px;font-family:inherit;outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.8);transition:border-color .15s,box-shadow .15s;}
  .et__area{min-height:130px;resize:vertical;line-height:1.55;}
  .et__inp::placeholder,.et__area::placeholder{color:var(--et-mute);}
  .et__inp:focus,.et__area:focus{border-color:var(--et-acc);box-shadow:inset 0 0 16px rgba(43,143,255,.08),0 0 0 4px rgba(43,143,255,.12);}

  /* ── Низ: плашка-док навигации (Назад / AI / Далее) ───────────────────── */
  .et__foot{position:relative;z-index:2;display:flex;align-items:center;gap:11px;padding:17px 28px;
    border-top:1px solid rgba(22,32,59,.1);
    background:linear-gradient(180deg,rgba(244,247,253,.45),rgba(244,247,253,.9));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.92);}
  .et__btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;border:0;white-space:nowrap;
    font-family:inherit;font-size:14.5px;font-weight:600;padding:14px 22px;border-radius:14px;transition:transform .15s,background .15s,box-shadow .15s,color .15s,opacity .15s;}
  .et__btn:disabled{opacity:.4;cursor:not-allowed;}
  .et__btn--ghost svg:first-child{transition:transform .15s;}
  .et__btn--ghost:not(:disabled):hover svg:first-child{transform:translateX(-2px);}
  .et__btn--primary{background:var(--et-deep);color:#fff;font-weight:700;
    box-shadow:inset 0 0 24px rgba(175,215,255,.95),inset 0 0 8px rgba(255,255,255,.5),inset 0 1px 0 rgba(255,255,255,.5);}
  .et__btn--primary:hover:not(:disabled){background:#3A85F0;transform:translateY(-1px);}
  .et__btn--primary:active:not(:disabled){transform:translateY(1px);}
  .et__btn--primary:disabled{box-shadow:inset 0 1px 0 rgba(255,255,255,.4);}
  .et__btn--primary svg{transform:rotate(-45deg);transition:transform .15s;}
  .et__btn--primary:hover:not(:disabled) svg{transform:rotate(-45deg) translateX(2px);}
  .et__btn--ghost{background:rgba(255,255,255,.7);color:var(--et-ink);border:1px solid rgba(22,32,59,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.85);}
  .et__btn--ghost:hover{transform:translateY(-1px);}
  .et__btn--ai{background:transparent;color:var(--et-mute);padding:14px 15px;}
  .et__btn--ai:hover{color:var(--et-ink-acc);}
  .et__btn--ai svg{color:var(--et-acc);}
  .et__spacer{flex:1 1 auto;}

  /* финальный успех — вершина горы как якорь (цель/вершина) */
  .et__done{display:flex;flex-direction:column;align-items:center;text-align:center;gap:9px;padding:34px 40px 24px;}
  .et__donemt{position:relative;width:184px;height:158px;margin-bottom:6px;display:grid;place-items:end center;}
  .et__donemt::before{content:'';position:absolute;z-index:0;left:50%;top:6px;width:208px;height:208px;transform:translateX(-50%);border-radius:50%;pointer-events:none;
    background:radial-gradient(circle at 50% 46%, rgba(43,143,255,.14), transparent 64%);}
  .et__donemt img{position:relative;z-index:1;width:184px;height:auto;object-fit:contain;filter:drop-shadow(0 16px 30px rgba(40,55,90,.22));}
  .et__donebadge{position:absolute;z-index:2;top:2px;right:10px;width:46px;height:46px;border-radius:15px;display:flex;align-items:center;justify-content:center;color:#fff;
    background:linear-gradient(150deg,var(--et-jade-hi),var(--et-jade-deep));box-shadow:inset 0 0 16px rgba(190,255,225,.5),inset 0 1px 0 rgba(255,255,255,.5),0 10px 24px rgba(28,126,82,.34);}
  .et__doneh{font-size:24px;font-weight:700;letter-spacing:-.5px;color:var(--et-ink);text-wrap:balance;}
  .et__dones{font-size:14.5px;color:var(--et-sub);line-height:1.62;max-width:44ch;}

  @media (prefers-reduced-motion: reduce){
    .et,.et__pane{animation:none;}
    .et__seg i{transition:none;}
    .et__btn,.et__btn--primary svg,.et__drop,.et__inp,.et__area,.et__x,.et__filex{transition:none;}
  }
  @media (max-width:700px){
    .et{max-width:100%;border-radius:22px;}
    .et__head,.et__steps,.et__stepmeta,.et__anchor,.et__sect,.et__foot,.et__done{padding-left:24px;padding-right:24px;}
    .et__anchor{gap:20px;}
    .et__anchor::before{display:none;}
    .et__orbwrap{flex:0 0 106px;width:106px;height:106px;}
    .et__orb{width:106px;height:106px;border-radius:30px;}
    .et__orb img{width:84px;height:84px;}
    .et__orb--compass img{width:90px;height:90px;}
    .et__orb--mascot img{width:94px;height:116px;}
    .et__orbstep{min-width:30px;height:30px;font-size:13px;right:-7px;bottom:-7px;border-radius:11px;}
    .et__facts{margin-top:13px;}
    .et__title{font-size:22px;max-width:100%;}
    .et__h{font-size:21px;}
    .et__foot{flex-wrap:wrap;}
  }
  `;

  if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  /* ─────────────────────────────────────────────────────────────────────────
     ПОДБОР PNG-ЯКОРЯ ПО СМЫСЛУ ШАГА
       upload/form/text -> стеклянная папка с документами;
       flow «что дальше» -> компас (ориентир на пути);
       intro/explain про порядок/план/сроки -> компас; иначе маскот
       (для «делаем мы» — робот).
  ───────────────────────────────────────────────────────────────────────── */
  function planLike(step) {
    const txt = ((step && step.title) || '') + ' ' +
      (((step && step.body) || []).join(' ')) + ' ' +
      (((step && step.bullets) || []).join(' '));
    return /план|порядок|шаг|сначала|сперва|сроки|срок|когда|очеред|подготов|собер|ориент|маршрут|этап/i.test(txt);
  }

  function anchorForStep(step, kind, ownerUs) {
    if (kind === 'upload' || kind === 'form' || kind === 'text') {
      return { img: 'assets/folder-glass.png', tone: '' };
    }
    if (kind === 'info') {
      // «делаем мы» — наш робот ведет процесс
      return { img: 'assets/robot-ai.png', tone: 'jade' };
    }
    if (kind === 'flow') {
      return ownerUs ? { img: 'assets/robot-ai.png', tone: '' } : { img: 'assets/compass.png', tone: 'compass' };
    }
    // intro / explain
    if (planLike(step)) {
      return ownerUs ? { img: 'assets/robot-ai.png', tone: '' } : { img: 'assets/compass.png', tone: 'compass' };
    }
    return ownerUs
      ? { img: 'assets/robot-ai.png', tone: '' }
      : { img: 'assets/mascot-cut.png', tone: 'mascot' };
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
    const time = d.time || '';

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

      // сноску по сроку строим один раз — для первого шага
      let firstNote = null;
      if (d.dlState === 'late' || /просроч|горит/i.test(String(d.dl || ''))) {
        firstNote = { type: 'warn', text: h(R.Fragment, null,
          h('span', { className: 'et__notek' }, 'Срок поджимает. '),
          'Лучше закрыть это сегодня. Если что-то непонятно по пунктам, спроси AI прямо отсюда.') };
      } else if (d.dlState === 'urgent' || d.dlState === 'warn') {
        firstNote = { type: 'warn', text: h(R.Fragment, null,
          h('span', { className: 'et__notek' }, (d.dl ? 'Срок: ' + d.dl + '. ' : 'Срок близко. ')),
          'Стоит заняться на этой неделе, чтобы не сбить график.') };
      } else if (d.dl) {
        firstNote = { type: 'info', text: h(R.Fragment, null,
          h('span', { className: 'et__notek' }, 'Срок: ' + d.dl + '. '),
          'Времени хватает, главное не откладывать.') };
      } else if (owner === 'you') {
        firstNote = { type: 'info', text: 'Разберем по шагам. В любой момент можно спросить AI прямо отсюда.' };
      }

      if (intro) {
        steps.push({ kind: 'intro', title: 'Что это за задача', body: [intro], note: firstNote, bullets: null, flow: null });
        firstNote = null;
      }
      if (how.length) {
        steps.push({ kind: 'explain', title: 'Как это сделать', body: ['Несколько шагов по порядку, ничего лишнего.'], note: firstNote, bullets: how, flow: null });
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
          : { kind: 'intro', title: 'Что нужно сделать', body: [d.desc || 'Открой задачу и следуй подсказкам. Мы рядом на каждом шаге.'], note: firstNote, bullets: null, flow: null });
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
        hint: d.usNote || 'Эту задачу берет на себя твой куратор. Как только будет результат — увидишь его здесь, мы сообщим.',
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

    return { owner: owner, title: title, time: time, steps: steps, action: action,
      dlState: d.dlState || '' };
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
    const openChat = (props && props.openChat) || function () {};
    const model = normalize(props && props.data);
    const act = model.action;
    const ownerUs = model.owner === 'us';

    const total = model.steps.length + 1;   // объяснения + действие
    const lastIndex = total - 1;            // индекс шага-действия
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

    /* ── степпер ──────────────────────────────────────────────────────── */
    function Stepper() {
      const segs = [];
      for (let i = 0; i < total; i++) {
        const cls = i < idx ? 'is-done' : (i === idx ? 'is-now' : '');
        segs.push(h('span', { key: i, className: 'et__seg ' + cls }, h('i')));
      }
      return h(R.Fragment, null,
        h('div', { className: 'et__steps' }, segs),
        h('div', { className: 'et__stepmeta' },
          h('span', { className: 'et__stepcount et__num' }, 'Шаг ' + (idx + 1) + ' из ' + total)));
    }

    /* русское склонение «шаг/шага/шагов» по числу */
    function numWord(n, one, few, many) {
      const m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return n + ' ' + one;
      if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return n + ' ' + few;
      return n + ' ' + many;
    }

    /* эйбрау-метка контекста шага (несет смысл якоря, не дублирует прогресс) */
    function eyebrowFor(kind) {
      if (kind === 'upload') return 'Загрузка документа';
      if (kind === 'form' || kind === 'text') return 'Заполнение';
      if (kind === 'info') return 'На нашей стороне';
      if (kind === 'flow') return ownerUs ? 'Наш процесс' : 'Путь задачи';
      if (kind === 'explain') return 'Порядок действий';
      return ownerUs ? 'Что делаем мы' : 'Знакомство с задачей';
    }

    /* плашки-факты шага — только реальные данные, без выдумок */
    function factsFor(step, kind) {
      const out = [];
      if (kind === 'intro') {
        if (total > 1) out.push({ ic: 'Flag', text: numWord(total, 'шаг', 'шага', 'шагов') });
        out.push(act.type === 'upload' ? { ic: 'Upload', text: 'В конце — загрузка' }
          : act.type === 'info' ? { ic: 'Check', text: 'Делаем сами' }
            : { ic: 'Edit', text: 'В конце — пара полей' });
      } else if (kind === 'flow') {
        const n = (step && step.flow && step.flow.length) || 0;
        if (n) out.push({ ic: 'Route', text: numWord(n, 'шаг', 'шага', 'шагов') });
        out.push(ownerUs ? { ic: 'Check', text: 'На нашей стороне' } : { ic: 'User', text: 'Твой ход' });
      } else if (kind === 'upload') {
        out.push({ ic: 'Paperclip', text: 'JPG · PNG · PDF' });
        out.push({ ic: 'File', text: 'до 20 МБ' });
      } else if (kind === 'form' || kind === 'text') {
        out.push({ ic: 'Edit', text: 'Пара коротких полей' });
      } else if (kind === 'info') {
        out.push({ ic: 'Check', text: 'Без действий с твоей стороны' });
      }
      return out;
    }

    /* ── якорь шага: PNG-медальон (свечение, пол, номер) + эйбрау/заголовок/
       лид/плашки-факты ─────────────────────────────────────────────────── */
    function Anchor(step, kind, heading, lead) {
      const a = anchorForStep(step, kind, ownerUs);
      const jade = a.tone === 'jade';
      const toneCls = (a.tone && a.tone !== 'jade') ? ' et__orb--' + a.tone : '';
      const facts = factsFor(step, kind);
      return h('div', { className: 'et__anchor' + (jade ? ' et__anchor--jade' : '') },
        h('div', { className: 'et__orbwrap' },
          h('div', { className: 'et__orb' + toneCls + (jade ? ' et__orb--jade' : '') },
            h('img', { src: a.img, alt: '', draggable: false })),
          h('span', { className: 'et__orbstep et__num' }, idx + 1)),
        h('div', { className: 'et__anchortx' },
          h('div', { className: 'et__eyebrow' }, eyebrowFor(kind)),
          h('div', { className: 'et__h' }, heading),
          lead ? h('div', { className: 'et__lead' }, lead) : null,
          facts.length
            ? h('div', { className: 'et__facts' },
                facts.map((f, i) => h('span', { className: 'et__fact', key: 'fa' + i },
                  icon(f.ic, { size: 13 }), f.text)))
            : null));
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
        Anchor(step, step.kind, step.title, lead),
        h('div', { className: 'et__sect' },
          rest.map((p, i) => h('p', { className: 'et__p', key: 'p' + i }, p)),
          step.bullets && step.bullets.length
            ? h('div', { className: 'et__bullets' },
                step.bullets.filter(Boolean).map((b, i) => h('div', { className: 'et__bullet', key: 'b' + i },
                  h('span', { className: 'et__bnode' }, icon('Check', { size: 15, strokeWidth: 2.6 })),
                  h('span', { className: 'et__btext' }, b))))
            : null,
          step.materials && step.materials.length
            ? h('div', { className: 'et__mats' },
                h('div', { className: 'et__mats-h' }, 'Материалы к задаче'),
                step.materials.filter(Boolean).map((m, i) => {
                  const mi = m.kind === 'guide' ? 'Book' : 'Doc';
                  const go = m.kind === 'pdf' ? 'Download' : 'ArrowRight';
                  return h('button', { className: 'et__mat', type: 'button', key: 'm' + i },
                    h('span', { className: 'et__mat-ic' }, icon(mi, { size: 18 })),
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
                      st === 'done' ? icon('Check', { size: 14, strokeWidth: 2.6 }) : (i + 1)),
                    h('span', { className: 'et__fline' }),
                    h('div', { style: { minWidth: 0 } },
                      h('div', { className: 'et__ft' }, f.t),
                      f.s ? h('div', { className: 'et__fs' }, f.s) : null));
                }))
            : null,
          step.note
            ? h('div', { className: 'et__note et__note--' + step.note.type },
                h('span', { className: 'et__noteic' }, icon(noteIc, { size: 17 })),
                h('div', { className: 'et__notetx' }, step.note.text))
            : null));
    }

    /* ── шаг-действие ─────────────────────────────────────────────────── */
    function ActionPane() {
      if (act.type === 'info') {
        return h('div', { className: 'et__pane', key: 'act' },
          Anchor(null, 'info', act.heading || 'Тебе делать ничего не нужно',
            'Спокойно, эта задача на нас. Можно закрыть окно и заняться своими шагами.'),
          h('div', { className: 'et__sect' },
            h('div', { className: 'et__note et__note--tip', style: { marginTop: 0 } },
              h('span', { className: 'et__noteic' }, icon('Check', { size: 18, strokeWidth: 2.4 })),
              h('div', { className: 'et__notetx' }, act.hint || 'Это делаем мы. Сообщим, когда будет готово.'))));
      }
      if (act.type === 'upload') {
        return h('div', { className: 'et__pane', key: 'act' },
          Anchor(null, 'upload', act.heading || 'Загрузи документ', act.hint || ''),
          h('div', { className: 'et__sect' },
            h('div', {
              className: 'et__drop' + (over ? ' is-over' : ''),
              onClick: () => fileInput.current && fileInput.current.click(),
              onDragOver: (e) => { e.preventDefault(); setOver(true); },
              onDragLeave: () => setOver(false),
              onDrop: (e) => { e.preventDefault(); setOver(false); pickFile(e.dataTransfer.files && e.dataTransfer.files[0]); },
              role: 'button', tabIndex: 0,
              onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.current && fileInput.current.click(); } },
            },
              h('span', { className: 'et__dropic' }, icon('Upload', { size: 27 })),
              h('div', { className: 'et__dropt' }, 'Перетащи сюда или ', h('b', null, 'выбери файл')),
              h('div', { className: 'et__droph' },
                icon('Paperclip', { size: 14 }),
                act.formats || 'Сделай так, чтобы текст и печати на документе читались.'),
              h('input', {
                ref: fileInput, type: 'file', style: { display: 'none' },
                accept: act.accept || 'image/*,.pdf',
                onChange: (e) => pickFile(e.target.files && e.target.files[0]),
              })),
            file
              ? h('div', { className: 'et__file' },
                  h('span', { className: 'et__fileic' }, icon('File', { size: 19 })),
                  h('div', { className: 'et__fileb' },
                    h('div', { className: 'et__filen' }, file.name),
                    h('div', { className: 'et__files et__num' }, (fileSize(file.size) ? fileSize(file.size) + ' · ' : '') + 'готов к отправке')),
                  h('button', { className: 'et__filex', type: 'button', onClick: () => setFile(null), 'aria-label': 'Убрать файл' },
                    icon('Close', { size: 16 })))
              : null));
      }
      // form / text
      const asText = act.type === 'text' || !fieldsList || !fieldsList.length;
      return h('div', { className: 'et__pane', key: 'act' },
        Anchor(null, 'form', act.heading || 'Заполни данные', act.hint || ''),
        h('div', { className: 'et__sect' },
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
                      })))))));
    }

    /* ── успех — вершина горы ─────────────────────────────────────────── */
    function DonePane() {
      return h('div', { className: 'et__pane', key: 'done' },
        h('div', { className: 'et__done' },
          h('div', { className: 'et__donemt' },
            h('img', { src: 'assets/mountain-peak.png', alt: '', draggable: false }),
            h('span', { className: 'et__donebadge' }, icon('Check', { size: 24, strokeWidth: 2.6 }))),
          h('div', { className: 'et__doneh' }, act.type === 'upload' ? 'Файл отправлен' : 'Ответ отправлен'),
          h('div', { className: 'et__dones' }, act.doneText ||
            'Спасибо, еще один шаг к вершине закрыт. Мы проверим и дадим знать, если что-то нужно поправить, обычно это занимает 1-2 дня. Можно закрыть окно.')));
    }

    const currentStep = !onAction ? model.steps[idx] : null;
    const primaryLabel = onAction
      ? (act.type === 'info' ? (act.label || 'Понятно') : (act.label || 'Отправить'))
      : 'Далее';
    const lateTime = model.dlState === 'late';

    return h('div', {
      className: 'et', ref: rootRef, tabIndex: -1,
      onMouseDown: (e) => e.stopPropagation(),
      role: 'dialog', 'aria-modal': 'true', 'aria-label': model.title,
    },
      /* шапка */
      h('div', { className: 'et__head' },
        h('div', { className: 'et__headl' },
          h('div', { className: 'et__meta' },
            h('span', { className: 'et__owner et__owner--' + model.owner },
              model.owner === 'us' ? 'Делаем мы' : 'Твоя задача'),
            model.time ? h('span', { className: 'et__time' + (lateTime ? ' is-late' : '') },
              icon(lateTime ? 'AlertTriangle' : 'Clock', { size: 14 }), model.time) : null),
          h('div', { className: 'et__title' }, model.title)),
        h('button', { className: 'et__x', type: 'button', onClick: close, 'aria-label': 'Закрыть' },
          icon('Close', { size: 18 }) || '×')),

      /* степпер (прячем на экране успеха) */
      done ? null : Stepper(),

      /* тело */
      h('div', { className: 'et__body', ref: bodyRef },
        done ? DonePane() : (onAction ? ActionPane() : ExplainPane(currentStep))),

      /* низ */
      h('div', { className: 'et__foot' },
        done
          ? h(R.Fragment, null,
              h('span', { className: 'et__spacer' }),
              h('button', { className: 'et__btn et__btn--primary', type: 'button', onClick: close },
                'Закрыть', icon('Check', { size: 16 })))
          : h(R.Fragment, null,
              h('button', { className: 'et__btn et__btn--ghost', type: 'button', onClick: back, disabled: idx === 0 },
                icon('ChevronLeft', { size: 16 }), 'Назад'),
              h('button', { className: 'et__btn et__btn--ai', type: 'button', onClick: () => { close(); openChat({ label: model.title }); } },
                icon('Spark', { size: 16 }), 'Спросить AI'),
              h('span', { className: 'et__spacer' }),
              onAction
                ? h('button', {
                    className: 'et__btn et__btn--primary',
                    type: 'button', disabled: !actionReady, onClick: submit,
                  }, primaryLabel, icon(act.type === 'info' ? 'Check' : 'ArrowRight', { size: 16 }))
                : h('button', { className: 'et__btn et__btn--primary', type: 'button', onClick: next },
                    'Далее', icon('ArrowRight', { size: 16 })))));
  }

  window.ESTaskModal = ESTaskModal;
})();
