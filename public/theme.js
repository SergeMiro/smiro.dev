/* ═══════════════════════════════════════════════════════════════
   theme.js — the JS half of the accent system (see theme.css).

   Loaded *blocking in <head>* so the persisted accent is on :root before
   the first paint. Owns three things:

     1. the accent list + persistence (localStorage, shared with settings.js)
     2. oklch ⇄ sRGB maths, so consumers that cannot parse oklch
        (canvas 2D, THREE.Color, <input type=color>) get real hex
     3. one event — `theme:accent` — every non-CSS consumer listens to

   Nothing here touches the DOM beyond :root's inline style, so it is safe
   to run before <body> exists.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  if (window.SmiroTheme) return;

  var LS_KEY = 'smiro.theme.v1';

  // Curated muted accents — chroma stays moderate (.11–.16), lightness ~.55–.62
  // so the whole derived ladder in theme.css lands in a usable range.
  var ACCENTS = [
    { id: 'terracotta', label: 'Terracotta', l: 0.62, c: 0.16, h: 38 },
    { id: 'rust', label: 'Rust', l: 0.55, c: 0.13, h: 28 },
    { id: 'olive', label: 'Olive', l: 0.58, c: 0.11, h: 115 },
    { id: 'denim', label: 'Denim', l: 0.55, c: 0.11, h: 245 },
    { id: 'mustard', label: 'Mustard', l: 0.62, c: 0.12, h: 85 },
  ];

  var BACKGROUNDS = [
    { id: 'cream', label: 'Cream', value: '#f4f1e8' },
    { id: 'paper', label: 'Paper', value: '#f7f4ec' },
    { id: 'ivory', label: 'Ivory', value: '#fbf7ec' },
    { id: 'linen', label: 'Linen', value: '#efebe1' },
    { id: 'sand', label: 'Sand', value: '#ece4d2' },
  ];

  var DEFAULTS = { accent: 'terracotta', background: 'cream' };

  // The ladder from theme.css, mirrored. dl is added to L, kc multiplies C,
  // dh is added to H. Keep in sync with the :root block over there.
  var STEPS = {
    darkest: { dl: -0.20, kc: 1.00, dh: -6 },
    deep:    { dl: -0.10, kc: 1.12, dh: -4 },
    base:    { dl:  0.00, kc: 1.00, dh:  0 },
    mid:     { dl:  0.08, kc: 1.00, dh:  7 },
    light:   { dl:  0.16, kc: 0.94, dh: 11 },
    glow:    { dl:  0.21, kc: 1.00, dh: 15 },
    pale:    { dl:  0.31, kc: 0.65, dh: 22 },
    wash:    { dl:  0.33, kc: 0.15, dh: 26 },
  };

  // ─────────────────────────────────────────── oklch ⇄ sRGB
  var clamp01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
  var gamma = function (x) {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };
  var degamma = function (x) {
    return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };

  // oklch → {r,g,b} in 0…255. Out-of-gamut colours are clipped per channel,
  // which is what the browser does for `oklch()` on an sRGB display anyway.
  function oklchToRgb(L, C, H) {
    var hr = (H * Math.PI) / 180;
    var a = Math.cos(hr) * C, b = Math.sin(hr) * C;
    var l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    var m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    var s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    var l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
    return {
      r: Math.round(255 * clamp01(gamma( 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s))),
      g: Math.round(255 * clamp01(gamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s))),
      b: Math.round(255 * clamp01(gamma(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s))),
    };
  }

  function oklchToHex(L, C, H) {
    var o = oklchToRgb(L, C, H);
    return '#' + ((1 << 24) + (o.r << 16) + (o.g << 8) + o.b).toString(16).slice(1);
  }

  // 0xRRGGBB — what THREE.Color and material.color.set() want
  function oklchToInt(L, C, H) {
    var o = oklchToRgb(L, C, H);
    return (o.r << 16) | (o.g << 8) | o.b;
  }

  function rgbToOklch(r, g, b) {
    var lr = degamma(r / 255), lg = degamma(g / 255), lb = degamma(b / 255);
    var l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    var m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    var s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    var H = (Math.atan2(B, A) * 180) / Math.PI;
    return { l: L, c: Math.sqrt(A * A + B * B), h: H < 0 ? H + 360 : H };
  }

  // Accepts "#abc", "#aabbcc", "rgb(…)" or "oklch(L C H)" and returns {l,c,h}.
  // Returns null on anything it cannot read, so callers can fall back.
  function parseColor(str) {
    if (!str) return null;
    var s = String(str).trim();
    var ok = s.match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([-\d.]+)/i);
    if (ok) {
      var pl = ok[1].indexOf('%') >= 0 ? parseFloat(ok[1]) / 100 : parseFloat(ok[1]);
      var pc = ok[2].indexOf('%') >= 0 ? (parseFloat(ok[2]) / 100) * 0.4 : parseFloat(ok[2]);
      return { l: pl, c: pc, h: parseFloat(ok[3]) };
    }
    var hex = s.match(/^#([0-9a-f]{3,8})$/i);
    if (hex) {
      var d = hex[1];
      if (d.length === 3 || d.length === 4) d = d[0] + d[0] + d[1] + d[1] + d[2] + d[2];
      var n = parseInt(d.slice(0, 6), 16);
      if (isNaN(n)) return null;
      return rgbToOklch((n >> 16) & 255, (n >> 8) & 255, n & 255);
    }
    var rgb = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    if (rgb) return rgbToOklch(+rgb[1], +rgb[2], +rgb[3]);
    return null;
  }

  // ─────────────────────────────────────────── state
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        return {
          accent: o.accent || DEFAULTS.accent,
          background: o.background || DEFAULTS.background,
          custom: o.custom || null,   // {l,c,h} set by the edit-mode colour picker
        };
      }
    } catch (e) { /* private mode / disabled storage — fall through to defaults */ }
    return { accent: DEFAULTS.accent, background: DEFAULTS.background, custom: null };
  }
  function save(s) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }

  var state = load();

  function accentLCH() {
    if (state.accent === 'custom' && state.custom) return state.custom;
    var a = null;
    for (var i = 0; i < ACCENTS.length; i++) if (ACCENTS[i].id === state.accent) a = ACCENTS[i];
    if (!a) a = ACCENTS[0];
    return { l: a.l, c: a.c, h: a.h };
  }

  function bgValue() {
    for (var i = 0; i < BACKGROUNDS.length; i++) {
      if (BACKGROUNDS[i].id === state.background) return BACKGROUNDS[i].value;
    }
    return BACKGROUNDS[0].value;
  }

  // one step of the ladder, resolved against the live accent
  function step(name) {
    var a = accentLCH();
    var d = STEPS[name] || STEPS.base;
    var l = Math.max(0, Math.min(1, a.l + d.dl));
    var c = Math.max(0, a.c * d.kc);
    var h = a.h + d.dh;
    return { l: l, c: c, h: h, hex: oklchToHex(l, c, h), int: oklchToInt(l, c, h) };
  }

  function apply() {
    var a = accentLCH();
    var css = document.documentElement.style;
    // Only the three source numbers are written — theme.css derives the rest,
    // so a swatch click can never leave half the ladder on the old hue.
    css.setProperty('--accent-l', String(a.l));
    css.setProperty('--accent-c', String(a.c));
    css.setProperty('--accent-h', String(a.h));
    css.setProperty('--accent-hex', oklchToHex(a.l, a.c, a.h));
    css.setProperty('--bg', bgValue());
    // --brick / --accent stay as the var() aliases from theme.css: writing
    // them here would freeze them and break the derivation above.
    css.removeProperty('--brick');
    css.removeProperty('--accent');
    try {
      window.dispatchEvent(new CustomEvent('theme:accent', { detail: { l: a.l, c: a.c, h: a.h } }));
    } catch (e) { /* CustomEvent missing — CSS still updated */ }
  }

  window.SmiroTheme = {
    ACCENTS: ACCENTS,
    BACKGROUNDS: BACKGROUNDS,
    DEFAULTS: DEFAULTS,
    STEPS: STEPS,

    get state() { return { accent: state.accent, background: state.background, custom: state.custom }; },
    get accent() {
      var a = accentLCH();
      return { l: a.l, c: a.c, h: a.h, hex: oklchToHex(a.l, a.c, a.h), int: oklchToInt(a.l, a.c, a.h) };
    },
    step: step,

    /* pick a named accent from ACCENTS */
    setAccent: function (id) {
      state.accent = id;
      apply(); save(state);
    },
    setBackground: function (id) { state.background = id; apply(); save(state); },

    /* arbitrary colour (edit-mode colour picker) — hex / rgb() / oklch() */
    setCustomAccent: function (color) {
      var lch = parseColor(color);
      if (!lch) return false;
      state.custom = lch; state.accent = 'custom';
      apply(); save(state);
      return true;
    },
    reset: function () {
      state = { accent: DEFAULTS.accent, background: DEFAULTS.background, custom: null };
      apply(); save(state);
    },

    /* colour maths, shared with pc3d.js */
    oklchToRgb: oklchToRgb,
    oklchToHex: oklchToHex,
    oklchToInt: oklchToInt,
    rgbToOklch: rgbToOklch,
    parseColor: parseColor,

    /* subscribe to accent changes; returns an unsubscribe fn */
    onChange: function (fn) {
      var h = function (e) { fn(e.detail); };
      window.addEventListener('theme:accent', h);
      return function () { window.removeEventListener('theme:accent', h); };
    },
  };

  apply();
})();
