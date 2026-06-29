/* ═══════════════════════════════════════════════════════════════
   i18n.js — runtime language switcher (English source ↔ French)

   Strategy:
   - Default language is French if navigator.language starts with 'fr',
     OR if the visitor's locale isn't obviously English.
   - User choice (via window.I18N.setLang) persists in localStorage.
   - Two dictionaries:
       window.I18N_FR.KEYS  — keyed by data-i18n / data-i18n-html attr
       window.I18N_FR.TEXT  — keyed by trimmed English source text
   - English source remains canonical in the HTML. French is overlaid.
   - A MutationObserver re-translates dynamically inserted content.

   Usage:
     <script src="i18n.js" defer></script>
     <script src="i18n-fr.js" defer></script>  (or inline)
     window.I18N.setLang('fr' | 'en');
     window.I18N.getLang();
   ════════════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  function detect(){
    var stored = localStorage.getItem('lang');
    if (stored === 'fr' || stored === 'en') return stored;
    var nav = (navigator.language || '').toLowerCase();
    // French if browser is French. If browser is English → English.
    // Anything else (other EU langs, etc.) → French as the host's default.
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('en')) return 'en';
    return 'fr';
  }

  var lang = detect();

  var norm = function(s){ return (s||'').replace(/\s+/g,' ').trim(); };
  var origByNode = new WeakMap();
  var lastWriteByNode = new WeakMap();

  function frForText(en){
    var D = window.I18N_FR && window.I18N_FR.TEXT;
    return D ? D[en] : null;
  }
  function frForKey(k){
    var D = window.I18N_FR && window.I18N_FR.KEYS;
    return D ? D[k] : null;
  }

  function applyTextNode(node){
    if (!origByNode.has(node)) {
      origByNode.set(node, node.nodeValue);
    } else if (lang === 'en') {
      // detect external rewrites while we were in EN — refresh origin
      var last = lastWriteByNode.get(node);
      if (last != null && node.nodeValue !== last) {
        origByNode.set(node, node.nodeValue);
      }
    }
    var orig = origByNode.get(node);
    if (lang === 'en') {
      if (node.nodeValue !== orig) {
        lastWriteByNode.set(node, orig);
        node.nodeValue = orig;
      }
      return;
    }
    var trimmed = norm(orig);
    if (!trimmed) return;
    var fr = frForText(trimmed);
    if (fr == null) return;
    var lead = orig.match(/^\s*/)[0];
    var trail = orig.match(/\s*$/)[0];
    var next = lead + fr + trail;
    if (node.nodeValue !== next) {
      lastWriteByNode.set(node, next);
      node.nodeValue = next;
    }
  }

  function applyKeyedEl(el){
    var keyT = el.getAttribute('data-i18n');
    var keyH = el.getAttribute('data-i18n-html');
    if (keyT) {
      if (!el.hasAttribute('data-i18n-en')) el.setAttribute('data-i18n-en', el.textContent);
      var fr = frForKey(keyT);
      el.textContent = (lang === 'fr' && fr != null) ? fr : el.getAttribute('data-i18n-en');
    }
    if (keyH) {
      if (!el.hasAttribute('data-i18n-en-html')) el.setAttribute('data-i18n-en-html', el.innerHTML);
      var frH = frForKey(keyH);
      el.innerHTML = (lang === 'fr' && frH != null) ? frH : el.getAttribute('data-i18n-en-html');
    }
  }

  function applyAttrs(root){
    var scope = root || document;
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function(el){
      var k = el.getAttribute('data-i18n-placeholder');
      var fr = frForKey(k) || frForText(k);
      el.setAttribute('placeholder', (lang === 'fr' && fr) ? fr : k);
    });
    scope.querySelectorAll('[data-i18n-aria]').forEach(function(el){
      var k = el.getAttribute('data-i18n-aria');
      var fr = frForKey(k) || frForText(k);
      el.setAttribute('aria-label', (lang === 'fr' && fr) ? fr : k);
    });
  }

  function isInKeyedAncestor(node){
    var cur = node.parentNode;
    while (cur && cur.nodeType === 1) {
      if (cur.hasAttribute && (cur.hasAttribute('data-i18n') || cur.hasAttribute('data-i18n-html'))) return true;
      cur = cur.parentNode;
    }
    return false;
  }

  function walkAndTranslate(root){
    if (root.nodeType === 1) {
      if (root.hasAttribute && (root.hasAttribute('data-i18n') || root.hasAttribute('data-i18n-html'))) {
        applyKeyedEl(root);
      }
      var keyed = root.querySelectorAll ? root.querySelectorAll('[data-i18n], [data-i18n-html]') : [];
      keyed.forEach(applyKeyedEl);
    }
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n){
        var p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var t = p.tagName;
        if (t === 'SCRIPT' || t === 'STYLE' || t === 'NOSCRIPT' || t === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        if (isInKeyedAncestor(n)) return NodeFilter.FILTER_REJECT;
        if (!norm(n.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) applyTextNode(n);
  }

  function applyAll(){
    document.documentElement.setAttribute('lang', lang);
    walkAndTranslate(document.body || document.documentElement);
    applyAttrs(document);
  }

  window.I18N = {
    getLang: function(){ return lang; },
    setLang: function(l){
      if (l !== 'fr' && l !== 'en') return;
      localStorage.setItem('lang', l);
      lang = l;
      applyAll();
      window.dispatchEvent(new CustomEvent('i18n:changed', {detail:{lang:l}}));
    },
    apply: applyAll
  };

  function init(){
    applyAll();
    try {
      var mo = new MutationObserver(function(muts){
        for (var i=0; i<muts.length; i++) {
          var m = muts[i];
          for (var j=0; j<m.addedNodes.length; j++) {
            var n = m.addedNodes[j];
            if (n.nodeType === 1) walkAndTranslate(n);
            else if (n.nodeType === 3) applyTextNode(n);
          }
        }
      });
      mo.observe(document.body, {childList:true, subtree:true});
    } catch(e){}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
