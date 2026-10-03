/* Applies the saved theme before the page paints (loaded in <head>, not deferred). */
(function () {
  'use strict';
  var root = document.documentElement;
  var mode = 'auto';
  var PALETTES = ['classic', 'forest', 'burgundy'];
  var palette = PALETTES[0];
  try {
    mode = localStorage.getItem('guardians-mode') || mode;
    palette = localStorage.getItem('guardians-palette') || palette;
  } catch (e) { /* storage blocked: fall back to defaults */ }
  if (PALETTES.indexOf(palette) === -1) palette = PALETTES[0]; // e.g. a name saved by an older version of the site

  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function apply() {
    root.setAttribute('data-theme', mode === 'auto' ? (prefersDark.matches ? 'dark' : 'light') : mode);
    root.setAttribute('data-palette', palette);
  }
  apply();
  prefersDark.addEventListener('change', apply);

  window.GuardiansTheme = {
    get: function () { return { mode: mode, palette: palette }; },
    set: function (next) {
      if (next.mode) mode = next.mode;
      if (next.palette) palette = next.palette;
      try {
        localStorage.setItem('guardians-mode', mode);
        localStorage.setItem('guardians-palette', palette);
      } catch (e) { /* not persisted, still applied for this page */ }
      apply();
    }
  };
})();
