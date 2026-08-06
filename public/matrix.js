/* ══════════════════════════════════════════════════════════════════════════
   matrix.js — code rain behind a card, for as long as the pointer is on it.

   Columns of programming glyphs fall straight down, like curtains coming
   down, and stop when the pointer leaves. Each column is drawn in one step of
   the *live* accent ladder — one darker, one base, one lighter — so the rain
   is always the site's own colour: the shades come from SmiroTheme.step(),
   the same ladder theme.css derives its variables from, and a swatch click
   repaints them through the `theme:accent` event. There is no colour literal
   in this file.

   The canvas sits at z-index -1 inside a card that isolates itself, so it
   paints over the card's background and under its text without adding a
   single wrapper to the markup — see `.pillar` / `.card-rain` in index.html.

   Nothing is built until a pointer actually arrives, nothing keeps animating
   after it leaves, and nothing is built at all for a visitor who asked for
   less motion or who has no pointer to hover with. One card rains at a time,
   because you can only hover one.
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── the dials ─────────────────────────────────────────────────────────────
  // Blocks that get the rain. Both families are built the same way — relative,
  // overflow hidden, text over a plain panel — so adding another is one entry
  // here plus `isolation:isolate` on its rule.
  var CARDS = '.pillar, .why-card';
  var ROW = 15;                 // px between glyph baselines
  var COL = 14;                 // px between columns
  var SIZE = 12;                // glyph px
  var SPEED = [18, 38];         // fall speed, rows per second, drawn per column
  var TAIL = [7, 20];           // glyphs trailing behind a head
  var HEAD_ALPHA = 0.9;         // alpha at the head, fading to 0 down the tail
  var VEIL = 0.42;             // opacity of the whole layer — the one number
                                // that trades drama for readable body text
  var MUTATE = 0.055;           // chance per frame that a drawn glyph changes
  var FADE_OUT_MS = 260;        // must match the CSS transition on .card-rain

  // Punctuation carries "code" better than letters do, so it is weighted by
  // simply appearing more often in this string.
  var GLYPHS = '{}[]()<>/\\|;:=+-*&^%$#@!?~"\'`{}[]()<>/=;:_.,' +
               '0123456789ABCDEFabcdef';

  var STEPS = ['deep', 'base', 'light'];   // the three shades, same accent hue

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pointer = !window.matchMedia || window.matchMedia('(hover: hover)').matches;
  if (reduced || !pointer) return;

  // ── colour, resolved from the live accent and cached until it changes ──────
  var shades = null;
  function shadeList() {
    if (shades) return shades;
    var T = window.SmiroTheme;
    shades = STEPS.map(function (name) {
      // Without the theme script there is nothing to be the colour *of*, so the
      // rain stays away rather than inventing an orange of its own.
      if (!T || !T.step || !T.oklchToRgb) return null;
      var s = T.step(name);
      var c = T.oklchToRgb(s.l, s.c, s.h);
      return c.r + ',' + c.g + ',' + c.b;
    });
    if (shades.indexOf(null) !== -1) shades = null;
    return shades;
  }
  window.addEventListener('theme:accent', function () { shades = null; });

  var glyph = function () { return GLYPHS.charAt((Math.random() * GLYPHS.length) | 0); };
  var between = function (r) { return r[0] + Math.random() * (r[1] - r[0]); };

  function rain(card) {
    var canvas = null, ctx = null, raf = 0, stop = 0;
    var cols = [], rows = 0, w = 0, h = 0, dpr = 1;

    function build() {
      canvas = document.createElement('canvas');
      canvas.className = 'card-rain';
      canvas.setAttribute('aria-hidden', 'true');
      card.appendChild(canvas);
      ctx = canvas.getContext('2d');
      measure();
      if (window.ResizeObserver) {
        var ro = new ResizeObserver(function () { measure(); });
        ro.observe(card);
      }
    }

    // A column starts above the top edge at a random height, so the first frame
    // is already mid-storm instead of one tidy row marching down together.
    function column(x, seeded) {
      return {
        x: x,
        y: seeded ? Math.random() * rows : -Math.random() * rows * 0.6,
        speed: between(SPEED),
        tail: Math.round(between(TAIL)),
        shade: (Math.random() * STEPS.length) | 0,
        chars: [],
      };
    }

    function measure() {
      var box = card.getBoundingClientRect();
      if (!box.width || !box.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.round(box.width);
      h = Math.round(box.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = '600 ' + SIZE + 'px "Geist Mono", "IBM Plex Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      rows = Math.ceil(h / ROW) + 1;
      var want = Math.ceil(w / COL);
      // keep the columns that already exist so a resize does not restart the
      // storm; only add or drop the difference
      while (cols.length > want) cols.pop();
      for (var i = cols.length; i < want; i++) cols.push(column(i * COL, true));
      for (var j = 0; j < cols.length; j++) cols[j].x = j * COL;
    }

    var last = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      var tint = shadeList();
      if (!tint || !w) return;

      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        var head = Math.floor(c.y);
        for (var t = 0; t <= c.tail; t++) {
          var row = head - t;
          if (row < 0 || row > rows) continue;
          if (!c.chars[row] || Math.random() < MUTATE) c.chars[row] = glyph();
          // brightest at the head, gone by the end of the tail
          var a = HEAD_ALPHA * Math.pow(1 - t / (c.tail + 1), 1.6);
          ctx.fillStyle = 'rgba(' + tint[c.shade] + ',' + a.toFixed(3) + ')';
          ctx.fillText(c.chars[row], c.x, row * ROW);
        }
        c.y += c.speed * dt;
        // once the tail has cleared the bottom the column is recast: new speed,
        // new length, new shade, so the wall never settles into a pattern
        if (c.y - c.tail > rows) cols[i] = column(c.x, false);
      }
    }

    function start() {
      if (!canvas) build();
      if (stop) { clearTimeout(stop); stop = 0; }
      canvas.classList.add('on');
      if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    }

    function end() {
      if (!canvas) return;
      canvas.classList.remove('on');
      // keep drawing until the layer has finished fading, then go quiet: a
      // frozen last frame would show through the tail of the transition
      if (stop) clearTimeout(stop);
      stop = setTimeout(function () {
        cancelAnimationFrame(raf);
        raf = 0;
        stop = 0;
        if (ctx) ctx.clearRect(0, 0, w, h);
      }, FADE_OUT_MS);
    }

    card.addEventListener('pointerenter', start);
    card.addEventListener('pointerleave', end);
    // a card can hold a link; leaving the page mid-hover should not leave a
    // requestAnimationFrame running in a hidden tab
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) end();
    });
  }

  function boot() {
    var list = document.querySelectorAll(CARDS);
    for (var i = 0; i < list.length; i++) rain(list[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
