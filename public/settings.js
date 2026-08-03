/* ═══════════════════════════════════════════════════════════════
   settings.js — shared site-wide settings panel
   - Floating gear icon (bottom-right)
   - Panel lets user pick accent color + background color
   - This file is the *UI only*. The accent list, the persistence and the
     application to :root all live in theme.js (window.SmiroTheme), which
     loads blocking in <head> so the first paint is already correct.
   ═══════════════════════════════════════════════════════════════ */
(function(){
  if (window.__smiroSettingsInited) return;
  window.__smiroSettingsInited = true;

  const T = window.SmiroTheme;
  if (!T) { console.warn('[settings] theme.js must load before settings.js'); return; }

  const ACCENTS     = T.ACCENTS;
  const BACKGROUNDS = T.BACKGROUNDS;

  // swatch preview colour — built from the same l/c/h the accent applies, so a
  // swatch can never drift from what clicking it actually does
  const accentSwatch = (a) => `oklch(${a.l} ${a.c} ${a.h})`;

  function styles(){
    const css = `
      .ss-fab{
        /* en haut à droite : le coin d'en bas revient à l'avatar. Les réglages
           sont un geste rare, ils peuvent vivre près de la navigation. */
        position:fixed;top:96px;right:24px;z-index:120;
        width:38px;height:38px;border-radius:50%;
        display:grid;place-items:center;cursor:pointer;
        background:var(--bg, #f4f1e8);
        border:1px solid rgba(27,26,24,.18);
        color:#1b1a18;
        box-shadow:0 4px 10px -4px rgba(27,26,24,.18);
        transition:transform .25s ease, box-shadow .25s, border-color .2s;
        font-family:inherit;
        padding:0;
      }
      .ss-fab:hover{
        border-color:#1b1a18;
        box-shadow:0 8px 18px -6px rgba(27,26,24,.28);
      }
      .ss-fab.open{
        background:#1b1a18;color:#f4f1e8;border-color:#1b1a18;
        transform:rotate(60deg);
      }
      .ss-fab svg{width:18px;height:18px;display:block}

      .ss-panel{
        /* le panneau s'ouvre vers le bas, puisque le bouton est désormais en haut */
        position:fixed;top:142px;right:24px;z-index:119;
        transform-origin:top right;
        width:300px;max-width:calc(100vw - 28px);
        background:#fbf8f0;
        color:#1b1a18;
        border:1px solid rgba(27,26,24,.18);
        border-radius:14px;
        padding:16px 16px 14px;
        box-shadow:0 24px 48px -12px rgba(27,26,24,.32), 0 4px 10px -3px rgba(27,26,24,.14);
        font-family: 'Quicksand', ui-sans-serif, system-ui, sans-serif;
        opacity:0;transform:translateY(6px) scale(.98);
        pointer-events:none;
        transition:opacity .2s ease, transform .25s cubic-bezier(.22,1,.36,1);
      }
      .ss-panel.open{opacity:1;transform:none;pointer-events:auto}

      .ss-head{
        display:flex;align-items:center;justify-content:space-between;
        padding-bottom:10px;margin-bottom:12px;
        border-bottom:1px dashed rgba(27,26,24,.18);
      }
      .ss-title{
        font-family:'Geist Mono','IBM Plex Mono',ui-monospace,monospace;
        font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;
        color:#3a3630;font-weight:600;
        display:flex;align-items:center;gap:8px;
      }
      .ss-title::before{
        content:"";width:6px;height:6px;border-radius:50%;
        background: var(--accent);
      }
      .ss-close{
        appearance:none;border:none;background:transparent;cursor:pointer;
        width:22px;height:22px;border-radius:50%;
        display:grid;place-items:center;color:#6b655a;
        font-family:'Geist Mono',monospace;font-size:14px;line-height:1;
      }
      .ss-close:hover{background:rgba(27,26,24,.08);color:#1b1a18}

      .ss-section{margin-bottom:14px}
      .ss-section:last-child{margin-bottom:0}
      .ss-label{
        font-family:'Geist Mono','IBM Plex Mono',ui-monospace,monospace;
        font-size:10px;letter-spacing:.14em;text-transform:uppercase;
        color:#6b655a;margin-bottom:8px;
        display:flex;align-items:center;justify-content:space-between;
      }
      .ss-label .v{
        color:#1b1a18;letter-spacing:.06em;text-transform:none;
        font-weight:500;
      }
      .ss-swatches{
        display:grid;grid-template-columns:repeat(5,1fr);gap:6px;
      }
      .ss-sw{
        position:relative;aspect-ratio:1/1;border-radius:8px;cursor:pointer;
        border:1.5px solid rgba(27,26,24,.12);
        transition:transform .15s, border-color .15s, box-shadow .15s;
        padding:0;
        background:transparent;
      }
      .ss-sw:hover{transform:translateY(-1px);border-color:rgba(27,26,24,.4)}
      .ss-sw.on{
        border-color:#1b1a18;
        box-shadow:0 0 0 2px #fbf8f0, 0 0 0 3.5px #1b1a18;
      }
      .ss-sw .ss-fill{
        position:absolute;inset:3px;border-radius:5px;
      }
      .ss-foot{
        margin-top:14px;padding-top:10px;
        border-top:1px dashed rgba(27,26,24,.18);
        display:flex;align-items:center;justify-content:space-between;
        font-family:'Geist Mono',monospace;font-size:10px;color:#6b655a;letter-spacing:.04em;
      }
      .ss-reset{
        appearance:none;border:1px solid rgba(27,26,24,.18);
        background:transparent;cursor:pointer;
        font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:.08em;
        color:#3a3630;
        padding:5px 10px;border-radius:6px;
      }
      .ss-reset:hover{background:#1b1a18;color:#fbf8f0;border-color:#1b1a18}

      @media (max-width:560px){
        .ss-panel{right:8px;top:118px;bottom:auto;width:calc(100vw - 16px)}
        .ss-fab{top:72px;right:14px}
      }

      .ss-lang{
        display:grid;grid-template-columns:1fr 1fr;gap:6px;
      }
      .ss-lang-btn{
        appearance:none;cursor:pointer;
        border:1.5px solid rgba(27,26,24,.12);
        background:transparent;
        font-family:'Geist Mono','IBM Plex Mono',ui-monospace,monospace;
        font-size:10.5px;letter-spacing:.08em;
        color:#3a3630;
        padding:8px 10px;border-radius:8px;
        transition:border-color .15s, background .15s, color .15s, transform .15s;
      }
      .ss-lang-btn:hover{transform:translateY(-1px);border-color:rgba(27,26,24,.4)}
      .ss-lang-btn.on{
        background:#1b1a18;color:#fbf8f0;border-color:#1b1a18;
        box-shadow:0 0 0 2px #fbf8f0, 0 0 0 3.5px #1b1a18;
      }
    `;
    const s = document.createElement('style');
    s.id = 'ss-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function buildSwatches(items, type){
    const st = T.state;
    return items.map(it => {
      const active = (type === 'accent' ? st.accent : st.background) === it.id;
      const fill = type === 'accent' ? accentSwatch(it) : it.value;
      return `
        <button type="button"
                class="ss-sw ${active ? 'on':''}"
                data-type="${type}" data-id="${it.id}"
                title="${it.label}"
                aria-label="${it.label}">
          <span class="ss-fill" style="background:${fill}"></span>
        </button>`;
    }).join('');
  }

  function build(){
    styles();

    const fab = document.createElement('button');
    fab.className = 'ss-fab';
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Open theme settings');
    fab.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
      </svg>
    `;

    const panel = document.createElement('div');
    panel.className = 'ss-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Theme settings');
    panel.innerHTML = `
      <div class="ss-head">
        <div class="ss-title">Theme · Settings</div>
        <button class="ss-close" type="button" aria-label="Close">×</button>
      </div>
      <div class="ss-section">
        <div class="ss-label"><span>Accent color</span><span class="v" id="ss-accent-name"></span></div>
        <div class="ss-swatches" data-group="accent">${buildSwatches(ACCENTS, 'accent')}</div>
      </div>
      <div class="ss-section">
        <div class="ss-label"><span>Background</span><span class="v" id="ss-bg-name"></span></div>
        <div class="ss-swatches" data-group="background">${buildSwatches(BACKGROUNDS, 'background')}</div>
      </div>
      <div class="ss-section" id="ss-lang-section">
        <div class="ss-label"><span>Language</span><span class="v" id="ss-lang-name"></span></div>
        <div class="ss-lang" role="group" aria-label="Language">
          <button type="button" class="ss-lang-btn" data-lang="fr">FR · français</button>
          <button type="button" class="ss-lang-btn" data-lang="en">EN · english</button>
        </div>
      </div>
      <div class="ss-foot">
        <span>changes persist on this device</span>
        <button class="ss-reset" type="button">reset</button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    function syncLabels(){
      const st = T.state;
      const a = ACCENTS.find(x=>x.id===st.accent);
      const b = BACKGROUNDS.find(x=>x.id===st.background) || BACKGROUNDS[0];
      const aEl = panel.querySelector('#ss-accent-name');
      const bEl = panel.querySelector('#ss-bg-name');
      // st.accent is 'custom' when edit mode's colour picker set it — there is
      // no swatch to name, so say so rather than mislabel it as Terracotta.
      if (aEl) aEl.textContent = a ? a.label : 'custom';
      if (bEl) bEl.textContent = b.label;
    }
    function syncActive(){
      const st = T.state;
      panel.querySelectorAll('.ss-sw').forEach(sw=>{
        const t = sw.dataset.type, id = sw.dataset.id;
        const isOn = (t==='accent' ? st.accent : st.background) === id;
        sw.classList.toggle('on', isOn);
      });
    }
    syncLabels();

    function syncLang(){
      const lng = (window.I18N && window.I18N.getLang) ? window.I18N.getLang() : 'en';
      panel.querySelectorAll('.ss-lang-btn').forEach(b=>{
        b.classList.toggle('on', b.dataset.lang === lng);
      });
      const lblEl = panel.querySelector('#ss-lang-name');
      if (lblEl) lblEl.textContent = lng === 'fr' ? 'français' : 'english';
    }
    syncLang();

    function open(){
      panel.classList.add('open');
      fab.classList.add('open');
      fab.setAttribute('aria-expanded', 'true');
    }
    function close(){
      panel.classList.remove('open');
      fab.classList.remove('open');
      fab.setAttribute('aria-expanded', 'false');
    }
    function toggle(){
      panel.classList.contains('open') ? close() : open();
    }

    fab.addEventListener('click', (e)=>{ e.stopPropagation(); toggle(); });
    panel.querySelector('.ss-close').addEventListener('click', close);
    panel.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', e => {
      if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== fab) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    // swatch clicks
    panel.querySelectorAll('.ss-sw').forEach(sw => {
      sw.addEventListener('click', () => {
        const t = sw.dataset.type, id = sw.dataset.id;
        // SmiroTheme owns apply + persist, and fires theme:accent so the canvas
        // orb and the Three.js laptop recolour along with the CSS.
        if (t === 'accent')     T.setAccent(id);
        if (t === 'background') T.setBackground(id);
        syncActive();
        syncLabels();
      });
    });

    // reset
    panel.querySelector('.ss-reset').addEventListener('click', () => {
      T.reset();
      syncActive();
      syncLabels();
    });

    // language toggle
    panel.querySelectorAll('.ss-lang-btn').forEach(b=>{
      b.addEventListener('click', ()=>{
        if (window.I18N && window.I18N.setLang) window.I18N.setLang(b.dataset.lang);
        syncLang();
      });
    });
    window.addEventListener('i18n:changed', syncLang);
    // the edit-mode colour picker also goes through SmiroTheme
    T.onChange(()=>{ syncActive(); syncLabels(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
