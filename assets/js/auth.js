/* Sign-in and register pages. */
(function () {
  'use strict';

  // After signing in, return to the page that asked for it — but only to a path on this site.
  function destination(fallback) {
    var next = new URLSearchParams(window.location.search).get('next') || '';
    return /^\/[a-z]/i.test(next) && next.indexOf('//') === -1 ? next : fallback;
  }

  function submit(form, url, body) {
    var status = form.querySelector('.form-status');
    var button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.className = 'form-status';
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
          window.location.href = destination(data.home);
        });
      })
      .catch(function (err) {
        status.className = 'form-status err';
        status.textContent = err instanceof TypeError ? 'We could not reach the server. Please check your connection.' : err.message;
        button.disabled = false;
      });
  }

  var login = document.getElementById('login-form');
  if (login) {
    login.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!login.reportValidity()) return;
      submit(login, '/api/auth/login', { email: login.elements.email.value, password: login.elements.password.value });
    });
    // Keep the "next" page when moving between sign-in and register.
    var toRegister = login.querySelector('a[href^="/register"]');
    if (toRegister && window.location.search) toRegister.setAttribute('href', '/register' + window.location.search);
  }

  var register = document.getElementById('register-form');
  if (register) {
    var orgField = document.getElementById('org-field');
    var orgInput = document.getElementById('r-org');
    var COPY = {
      EMPLOYEE: { hint: 'Find jobs, get your resume reviewed and track your applications.', name: 'Full name' },
      COLLEGE: { hint: 'Request campus placement drives. College accounts are approved by our team before requests can be submitted.', name: 'Your name (contact person)', org: 'College name' },
      COMPANY: { hint: 'Request employees and manage hiring documents. Company accounts are approved by our team before requests can be submitted.', name: 'Your name (HR contact)', org: 'Company name' }
    };
    var syncRole = function () {
      var role = register.elements.role.value;
      var copy = COPY[role];
      document.getElementById('role-hint').textContent = copy.hint;
      document.getElementById('name-label').textContent = copy.name;
      orgField.hidden = !copy.org;
      orgInput.required = Boolean(copy.org);
      if (copy.org) document.getElementById('org-label').textContent = copy.org;
    };

    var preset = (new URLSearchParams(window.location.search).get('role') || '').toUpperCase();
    var radio = register.querySelector('input[name="role"][value="' + preset + '"]');
    if (radio) radio.checked = true;
    register.addEventListener('change', function (e) { if (e.target.name === 'role') syncRole(); });
    syncRole();

    register.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!register.reportValidity()) return;
      submit(register, '/api/auth/register', {
        role: register.elements.role.value,
        name: register.elements.name.value,
        organization: orgInput.value,
        email: register.elements.email.value,
        phone: register.elements.phone.value,
        password: register.elements.password.value
      });
    });
  }
})();
