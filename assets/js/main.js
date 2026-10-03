/* The Guardians — shared behaviour for every page. */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  // Set only in the static copy of the site (GitHub Pages), which has no server behind it.
  var STATIC = window.GUARDIANS_STATIC || null;

  /* ---------- Shared form helper: POST to the API and show the result ---------- */
  // `body` is either a plain object (sent as JSON) or FormData (sent as multipart, for file uploads).
  window.GuardiansSubmit = function (form, url, body, successMessage) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    var show = function (kind, message) {
      status.className = 'form-status ' + kind;
      status.textContent = message;
    };
    var isJson = !(body instanceof FormData);

    button.disabled = true;
    return fetch(url, {
      method: 'POST',
      headers: isJson ? { 'Content-Type': 'application/json' } : undefined,
      body: isJson ? JSON.stringify(body) : body
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok || !data.ok) throw new Error(data.error || 'Sorry, that could not be sent. Please try again.');
        form.reset();
        show('ok', successMessage);
        return true;
      });
    }).catch(function (err) {
      var offline = err instanceof TypeError; // fetch itself failed: no connection or server down
      show('err', offline
        ? 'We could not reach the server. Please check your connection, or email hr@guardiansindia.com.'
        : err.message);
      return false;
    }).then(function (ok) {
      button.disabled = false;
      return ok;
    });
  };

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
  }

  /* ---------- Theme menu (light / dark / auto + colour palette) ---------- */
  var themeMenu = document.querySelector('.theme-menu');
  if (themeMenu && window.GuardiansTheme) {
    var syncTheme = function () {
      var current = window.GuardiansTheme.get();
      themeMenu.querySelectorAll('[data-mode]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === current.mode));
      });
      themeMenu.querySelectorAll('[data-palette]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-palette') === current.palette));
      });
    };
    themeMenu.addEventListener('click', function (e) {
      var button = e.target.closest('[data-mode], [data-palette]');
      if (!button) return;
      window.GuardiansTheme.set({ mode: button.getAttribute('data-mode'), palette: button.getAttribute('data-palette') });
      syncTheme();
    });
    document.addEventListener('click', function (e) {
      if (themeMenu.open && !themeMenu.contains(e.target)) themeMenu.open = false;
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && themeMenu.open) {
        themeMenu.open = false;
        themeMenu.querySelector('summary').focus();
      }
    });
    syncTheme();
  }

  /* ---------- Header shadow + reading-progress bar ---------- */
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.progress');
  var onScroll = function () {
    if (header) header.classList.toggle('is-stuck', window.scrollY > 8);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Hero background video ---------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var video = document.querySelector('.hero-video');
  var videoToggle = document.querySelector('.video-toggle');
  if (video && videoToggle) {
    var saveData = navigator.connection && navigator.connection.saveData;
    var setPaused = function (paused) {
      videoToggle.classList.toggle('is-paused', paused);
      videoToggle.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
    };
    // The video only starts by script, so visitors on a data-saver connection get the still poster.
    // It is slow, silent footage with a pause button, so it also plays when "reduce motion" is on.
    if (!saveData) {
      video.play().then(function () { setPaused(false); }).catch(function () { setPaused(true); });
    } else {
      setPaused(true);
    }
    videoToggle.addEventListener('click', function () {
      if (video.paused) video.play().then(function () { setPaused(false); }).catch(function () {});
      else { video.pause(); setPaused(true); }
    });
  }

  /* ---------- Reveal on scroll + count-up numbers ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion || isNaN(target)) return;
    var start = null;
    var duration = 1400;
    function tick(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var revealEls = document.querySelectorAll('.reveal');
  var countEls = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        if (el.hasAttribute('data-count')) countUp(el);
        else el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
    countEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- "Sign in" becomes "Dashboard" for someone already signed in ---------- */
  var accountLinks = document.querySelectorAll('[data-account-link]');
  if (accountLinks.length && !STATIC) {
    fetch('/api/auth/me').then(function (res) { return res.json(); }).then(function (me) {
      if (!me.user) return;
      accountLinks.forEach(function (a) {
        a.textContent = 'Dashboard';
        a.setAttribute('href', me.home);
      });
    }).catch(function () { /* signed-out links are already correct */ });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    // Arriving from a "Hire talent" link can pre-select the audience and subject.
    var params = new URLSearchParams(window.location.search);
    if (params.get('subject')) form.elements.subject.value = params.get('subject');
    if (params.get('i-am')) {
      var radio = form.querySelector('input[name="iam"][value="' + params.get('i-am') + '"]');
      if (radio) radio.checked = true;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (STATIC) {
        // No server: hand the message to the visitor's email app, already filled in.
        var body = form.elements.message.value + '\n\n—\n' + form.elements.name.value + ' (' + form.elements.iam.value + ')' +
          '\nPhone: ' + form.elements.phone.value + '\nEmail: ' + form.elements.email.value;
        window.location.href = 'mailto:' + STATIC.email + '?subject=' + encodeURIComponent(form.elements.subject.value) +
          '&body=' + encodeURIComponent(body);
        var status = form.querySelector('.form-status');
        status.className = 'form-status ok';
        status.textContent = 'Your email app should now be open with this message ready to send. If nothing happened, email us at ' + STATIC.email + '.';
        return;
      }
      window.GuardiansSubmit(form, '/api/contact', {
        name: form.elements.name.value,
        phone: form.elements.phone.value,
        email: form.elements.email.value,
        iam: form.elements.iam.value,
        subject: form.elements.subject.value,
        message: form.elements.message.value,
        website: form.elements.website.value // honeypot: people never see this field
      }, 'Thank you — your message has been sent. We reply within 24 hours.');
    });
  }
})();
