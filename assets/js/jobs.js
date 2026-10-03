/* The Guardians — loads vacancies from /api/jobs and renders them (home + vacancies pages). */
(function () {
  'use strict';

  var WHATSAPP = '919869302227';
  var jobs = [];
  // Set only in the static copy of the site (GitHub Pages), which has no server: jobs come from a
  // bundled file, and applying opens an email instead of uploading a CV.
  var STATIC = window.GUARDIANS_STATIC || null;

  function emailApplication(job) {
    var subject = job ? 'Application: ' + job.title : 'CV for future openings';
    var body = 'Hello Guardians team,\n\n' + (job ? 'I would like to apply for the ' + job.title + ' role' +
      (job.location ? ' (' + job.location + ')' : '') + '.' : 'Please keep my CV on file for suitable openings.') +
      '\n\nCurrent CTC: \nExpected CTC: \nNotice period: \n\nMy CV is attached.\n\nRegards,\n';
    return 'mailto:' + STATIC.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  var ICONS = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    case: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18"/></svg>',
    cash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 5h10M7 9h10M7 5c5 0 6 2 6 4s-1 4-6 4l7 7"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function metaRow(job) {
    var out = '';
    if (job.location) out += '<span>' + ICONS.pin + esc(job.location) + '</span>';
    if (job.experience) out += '<span>' + ICONS.case + esc(job.experience) + '</span>';
    if (job.salary) out += '<span>' + ICONS.cash + esc(job.salary) + '</span>';
    return out;
  }

  function jobCard(job) {
    var whatsapp = 'https://wa.me/' + WHATSAPP + '?text=' +
      encodeURIComponent('Hello, I am interested in the ' + job.title + ' role listed on guardiansindia.com.');
    var facts = [
      ['Location', job.location], ['Salary', job.salary], ['Experience', job.experience],
      ['Qualification', job.qualification], ['Openings', job.openings], ['Company', job.company],
      ['Work mode', job.workMode], ['Employment type', job.employmentType], ['Skills', job.skills],
      ['Apply by', formatDate(job.deadline)]
    ];
    Object.keys(job.extras || {}).forEach(function (key) { facts.push([key, job.extras[key]]); });
    if (job.posted) facts.push(['Posted', formatDate(job.posted)]);

    var factsHtml = facts.filter(function (f) { return f[1]; }).map(function (f) {
      return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
    }).join('');

    var summaryHtml = (job.summary || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');

    var sectionsHtml = (job.sections || []).map(function (section) {
      var inner = section.items.length === 1
        ? '<p>' + esc(section.items[0]) + '</p>'
        : '<ul class="bullets">' + section.items.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ul>';
      return '<h4>' + esc(section.heading) + '</h4>' + inner;
    }).join('');

    return '<details class="job" id="' + esc(job.id) + '">' +
      '<summary>' +
        '<div><span class="job-tag">' + esc(job.category) + '</span><h3 class="job-title">' + esc(job.title) + '</h3></div>' +
        '<span class="job-toggle" aria-hidden="true">' + ICONS.chevron + '</span>' +
        '<div class="job-meta">' + metaRow(job) + '</div>' +
      '</summary>' +
      '<div class="job-body">' +
        '<dl class="job-facts">' + factsHtml + '</dl>' +
        summaryHtml + sectionsHtml +
        '<div class="job-apply">' +
          (job.applyLink
            ? '<a class="btn btn-primary" href="' + esc(job.applyLink) + '" target="_blank" rel="noopener">Apply on the employer’s site ' + ICONS.arrow + '</a>'
            : STATIC
              ? '<a class="btn btn-primary" href="' + esc(emailApplication(job)) + '">Apply by email ' + ICONS.arrow + '</a>'
              : '<button class="btn btn-primary" type="button" data-apply="' + esc(job.id) + '">Apply now ' + ICONS.arrow + '</button>') +
          '<a class="btn btn-ghost" href="' + esc(whatsapp) + '" target="_blank" rel="noopener">Ask on WhatsApp</a>' +
        '</div>' +
      '</div>' +
    '</details>';
  }

  /* ---------- Home page: three most recent openings ---------- */
  function renderLatest() {
    var latest = document.getElementById('latest-jobs');
    if (!latest) return;
    latest.innerHTML = jobs.slice(0, 3).map(function (job) {
      return '<a class="card job-mini" href="' + (STATIC ? 'vacancies.html#' : '/vacancies#') + esc(job.id) + '">' +
        '<span class="job-tag">' + esc(job.category) + '</span>' +
        '<h3>' + esc(job.title) + '</h3>' +
        '<div class="job-meta">' + metaRow(job) + '</div>' +
        '<span class="link-arrow">View role ' + ICONS.arrow + '</span>' +
      '</a>';
    }).join('');
  }

  /* ---------- Vacancies page: search + filters ---------- */
  function initList() {
    var list = document.getElementById('job-list');
    if (!list) return;

    var search = document.getElementById('job-search');
    var categorySelect = document.getElementById('job-category');
    var regionSelect = document.getElementById('job-region');
    var count = document.getElementById('job-count');

    function fillSelect(select, key) {
      var counts = {};
      jobs.forEach(function (job) { counts[job[key]] = (counts[job[key]] || 0) + 1; });
      Object.keys(counts).sort().forEach(function (value) {
        var option = document.createElement('option');
        option.value = value;
        option.textContent = value + ' (' + counts[value] + ')';
        select.appendChild(option);
      });
    }
    fillSelect(categorySelect, 'category');
    fillSelect(regionSelect, 'region');

    var index = jobs.map(function (job) {
      return [job.title, job.category, job.location, job.region, job.qualification, job.experience, job.salary]
        .concat(job.summary || [])
        .concat((job.sections || []).reduce(function (all, s) { return all.concat(s.items); }, []))
        .join(' ').toLowerCase();
    });

    function render() {
      var terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
      var category = categorySelect.value;
      var region = regionSelect.value;

      var matches = jobs.filter(function (job, i) {
        if (category && job.category !== category) return false;
        if (region && job.region !== region) return false;
        return terms.every(function (term) { return index[i].indexOf(term) !== -1; });
      });

      count.textContent = matches.length === jobs.length
        ? 'Showing all ' + jobs.length + ' open roles'
        : 'Showing ' + matches.length + ' of ' + jobs.length + ' open roles';

      list.innerHTML = matches.length
        ? matches.map(jobCard).join('')
        : '<div class="empty"><h3>No roles match that search</h3><p>Try a different keyword, or ' +
          '<button class="btn-link" type="button" data-apply="">send us your CV</button> and we will keep you in mind for new openings.</p></div>';
    }

    search.addEventListener('input', render);
    categorySelect.addEventListener('change', render);
    regionSelect.addEventListener('change', render);
    document.getElementById('job-reset').addEventListener('click', function () {
      search.value = '';
      categorySelect.value = '';
      regionSelect.value = '';
      render();
      search.focus();
    });
    render();

    // Deep link from the home page (/vacancies#job-id): open that role and scroll to it.
    function openFromHash() {
      var id = decodeURIComponent(window.location.hash.slice(1));
      var target = id && document.getElementById(id);
      if (target && target.tagName === 'DETAILS') {
        target.open = true;
        target.scrollIntoView({ block: 'start' });
      }
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }

  /* ---------- Apply dialog ---------- */
  function initApply() {
    if (STATIC) {
      // No server to receive an upload: "Send your CV" opens the visitor's email app instead.
      document.addEventListener('click', function (e) {
        if (!e.target.closest('[data-apply]')) return;
        e.preventDefault();
        window.location.href = emailApplication(null);
      });
      return;
    }
    var dialog = document.getElementById('apply-dialog');
    if (!dialog) return;
    var form = document.getElementById('apply-form');
    var status = form.querySelector('.form-status');

    document.addEventListener('click', function (e) {
      var trigger = e.target.closest('[data-apply]');
      if (!trigger) return;
      var job = jobs.filter(function (j) { return j.id === trigger.getAttribute('data-apply'); })[0];
      form.elements.jobId.value = job ? job.id : '';
      document.getElementById('apply-account-link').setAttribute('href', '/employee/jobs' + (job ? '/' + encodeURIComponent(job.id) : ''));
      document.getElementById('apply-role').textContent = job ? job.title : 'General application — we will match you to suitable openings';
      status.className = 'form-status';
      dialog.showModal();
    });

    dialog.addEventListener('click', function (e) {
      // A click on the backdrop lands on the <dialog> element itself.
      if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var file = form.elements.cv.files[0];
      if (file && file.size > 5 * 1024 * 1024) {
        status.className = 'form-status err';
        status.textContent = 'Your CV must be 5 MB or smaller.';
        return;
      }
      window.GuardiansSubmit(form, '/api/apply', new FormData(form),
        'Thank you — your application has been received. Our team will contact you if your profile matches.');
    });
  }

  function showLoadError() {
    var message = '<div class="empty"><h3>Vacancies could not be loaded</h3><p>Please refresh the page, or email your CV to ' +
      '<a href="mailto:hr@guardiansindia.com">hr@guardiansindia.com</a>.</p></div>';
    ['job-list', 'latest-jobs'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.innerHTML = message;
    });
  }

  fetch(STATIC ? STATIC.jobsUrl : '/api/jobs')
    .then(function (res) {
      if (!res.ok) throw new Error('Request failed: ' + res.status);
      return res.json();
    })
    .then(function (data) {
      jobs = data;
      document.querySelectorAll('[data-job-count]').forEach(function (el) { el.textContent = jobs.length; });
      renderLatest();
      initList();
      initApply();
    })
    .catch(showLoadError);
})();
