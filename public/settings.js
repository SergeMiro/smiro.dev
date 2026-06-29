/* ═══════════════════════════════════════════════════════════════
   settings.js — shared site-wide settings panel
   - Floating gear icon (top-left)
   - Panel lets user pick accent color + background color
   - Persists to localStorage, applies on every page that imports it
   ═══════════════════════════════════════════════════════════════ */
(function(){
  if (window.__smiroSettingsInited) return;
  window.__smiroSettingsInited = true;

  const LS_KEY = 'smiro.theme.v1';

  // curated muted accent colors (not too bright, not too light)
  // chroma kept moderate (.10–.14), lightness ~.55–.62
  const ACCENTS = [
    { id: 'terracotta', label: 'Terracotta',  value: 'oklch(0.62 0.16 38)'  },
    { id: 'rust',       label: 'Rust',        value: 'oklch(0.55 0.13 28)'  },
    { id: 'olive',      label: 'Olive',       value: 'oklch(0.58 0.11 115)' },
    { id: 'forest',     label: 'Forest',      value: 'oklch(0.52 0.10 155)' },
    { id: 'teal',       label: 'Teal',        value: 'oklch(0.56 0.10 195)' },
    { id: 'denim',      label: 'Denim',       value: 'oklch(0.55 0.11 245)' },
    { id: 'plum',       label: 'Plum',        value: 'oklch(0.50 0.12 340)' },
    { id: 'mauve',      label: 'Mauve',       value: 'oklch(0.55 0.09 355)' },
    { id: 'mustard',    label: 'Mustard',     value: 'oklch(0.62 0.12 85)'  },
  ];

  // curated light backgrounds (warm/cool/neutral but always soft + light)
  const BACKGROUNDS = [
    { id: 'cream',    label: 'Cream',     value: '#f4f1e8' },
    { id: 'paper',    label: 'Paper',     value: '#f7f4ec' },
    { id: 'ivory',    label: 'Ivory',     value: '#fbf7ec' },
    { id: 'linen',    label: 'Linen',     value: '#efebe1' },
    { id: 'sand',     label: 'Sand',      value: '#ece4d2' },
    { id: 'mist',     label: 'Mist',      value: '#eef0ed' },
    { id: 'sky',      label: 'Sky',       value: '#eaf0f3' },
    { id: 'blush',    label: 'Blush',     value: '#f3ebe6' },
    { id: 'sage',     label: 'Sage',      value: '#e9ede3' },
  ];

  const DEFAULTS = { accent: 'terracotta', background: 'cream' };

  function loadState(){
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return Object.assign({}, DEFAULTS, JSON.parse(raw));
    } catch(e){}
    return Object.assign({}, DEFAULTS);
  }
  function saveState(s){
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch(e){}
  }

  let state = loadState();

  function applyState(){
    const accent = ACCENTS.find(a=>a.id===state.accent) || ACCENTS[0];
    const bg     = BACKGROUNDS.find(b=>b.id===state.background) || BACKGROUNDS[0];
    document.documentElement.style.setProperty('--brick', accent.value);
    document.documentElement.style.setProperty('--bg',    bg.value);
  }

  // apply immediately (even before DOM ready) so paint matches
  applyState();

  function styles(){
    const css = `
      .ss-fab{
        position:fixed;bottom:20px;right:20px;z-index:120;
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
        position:fixed;bottom:68px;right:20px;z-index:119;
        transform-origin:bottom right;
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
        background: var(--brick, #c66a3a);
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
        .ss-panel{right:8px;bottom:60px;width:calc(100vw - 16px)}
        .ss-fab{bottom:14px;right:14px}
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
    return items.map(it => {
      const active = state[type === 'accent' ? 'accent' : 'background'] === it.id;
      return `
        <button type="button"
                class="ss-sw ${active ? 'on':''}"
                data-type="${type}" data-id="${it.id}"
                title="${it.label}"
                aria-label="${it.label}">
          <span class="ss-fill" style="background:${it.value}"></span>
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
      const a = ACCENTS.find(x=>x.id===state.accent) || ACCENTS[0];
      const b = BACKGROUNDS.find(x=>x.id===state.background) || BACKGROUNDS[0];
      const aEl = panel.querySelector('#ss-accent-name');
      const bEl = panel.querySelector('#ss-bg-name');
      if (aEl) aEl.textContent = a.label;
      if (bEl) bEl.textContent = b.label;
    }
    function syncActive(){
      panel.querySelectorAll('.ss-sw').forEach(sw=>{
        const t = sw.dataset.type, id = sw.dataset.id;
        const isOn = (t==='accent' ? state.accent : state.background) === id;
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
        if (t === 'accent')     state.accent = id;
        if (t === 'background') state.background = id;
        applyState();
        saveState(state);
        syncActive();
        syncLabels();
      });
    });

    // reset
    panel.querySelector('.ss-reset').addEventListener('click', () => {
      state = Object.assign({}, DEFAULTS);
      applyState();
      saveState(state);
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
