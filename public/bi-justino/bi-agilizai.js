(function () {
  var BAR_ID = 'biAgilizaiBar';
  var INTERVAL_MS = 60000;
  var started = false;
  var ALLOWED = {
    'jeffinho_ns@hotmail.com': true,
    'luisfelipe@ideiaum.com.br': true,
    'coordenadora.reservas@ideiaum.com.br': true,
    'renatocury@ideiaum.com.br': true,
    'renato@seujustino.com.br': true
  };

  function apiBase() {
    var host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3001';
    return 'https://api.agilizaiapp.com.br';
  }

  function onAgilizaiSite() {
    var host = location.hostname;
    return host === 'agilizaiapp.com.br' || host === 'www.agilizaiapp.com.br' || host === 'localhost' || host === '127.0.0.1';
  }

  function readCookie(name) {
    var parts = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].replace(/^\s+/, '');
      if (part.indexOf(name + '=') === 0) {
        var value = part.slice(name.length + 1);
        try { return decodeURIComponent(value); } catch (e) { return value; }
      }
    }
    return '';
  }

  function agilizaiToken() {
    try { return localStorage.getItem('authToken') || readCookie('authToken'); }
    catch (e) { return readCookie('authToken'); }
  }

  function agilizaiEmail() {
    try { return (localStorage.getItem('userEmail') || readCookie('userEmail') || '').trim().toLowerCase(); }
    catch (e) { return (readCookie('userEmail') || '').trim().toLowerCase(); }
  }

  function gateStillOpen() {
    var gate = document.getElementById('loginGate');
    return !!(gate && !gate.classList.contains('hidden'));
  }

  function explain(email) {
    var title = document.querySelector('#loginGate h1');
    if (title) title.textContent = 'Conta do Agilizai liberada';
    var emailInput = document.getElementById('gateEmail');
    if (emailInput && email) emailInput.value = email;
    var password = document.getElementById('gatePassword');
    if (password) password.placeholder = 'Senha do painel';
    var status = document.getElementById('gateStatus');
    if (status) {
      status.textContent = 'Sua conta do Agilizai já pode abrir este BI. Se ele não entrar sozinho, use a senha do painel nesta tela.';
    }
  }

  function saveAgilizaiSession(email, data) {
    var normalized = String(email || '').trim().toLowerCase();
    try {
      localStorage.setItem('authToken', data.token);
      if (data.userId != null) localStorage.setItem('userId', String(data.userId));
      if (data.role) localStorage.setItem('role', data.role);
      if (data.nome) localStorage.setItem('userName', data.nome);
      localStorage.setItem('userEmail', normalized);
    } catch (e) {}
    var maxAge = 60 * 60 * 24 * 30;
    document.cookie = 'authToken=' + data.token + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
    if (data.role) document.cookie = 'role=' + encodeURIComponent(data.role) + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
    document.cookie = 'userEmail=' + encodeURIComponent(normalized) + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
  }

  function openWithProof(data) {
    if (typeof apiPost !== 'function' || typeof startApp !== 'function') {
      explain(data.email);
      return Promise.resolve();
    }
    return apiPost('loginAgilizai', { proof: data.proof }, true, false).then(function (r) {
      if (!r || !r.ok || !r.token) {
        explain(data.email);
        return;
      }
      var session = {
        token: r.token,
        email: data.email,
        role: r.role,
        expiresAt: r.expiresAt,
        areas: r.areas,
        layouts: r.layouts || {}
      };
      try { localStorage.setItem('sjBIv2Session', JSON.stringify(session)); } catch (e) {}
      startApp(session);
    }).catch(function () {
      explain(data.email);
    });
  }

  function enterFromAgilizai() {
    if (!onAgilizaiSite() || !gateStillOpen()) return Promise.resolve();
    var token = agilizaiToken();
    var email = agilizaiEmail();
    if (!token) return Promise.resolve();
    if (email && !ALLOWED[email]) {
      location.href = '/acesso-negado';
      return Promise.resolve();
    }
    return fetch(apiBase() + '/api/bi/justino/acesso', {
      method: 'GET',
      cache: 'no-store',
      headers: { Authorization: 'Bearer ' + token }
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { res: res, data: data || {} };
      });
    }).then(function (result) {
      if (result.res.status === 403 && result.data.error === 'sem_acesso') {
        location.href = '/acesso-negado';
        return;
      }
      if (!result.res.ok || !result.data.ok) {
        explain(email);
        return;
      }
      if (!result.data.proof) {
        explain(result.data.email || email);
        return;
      }
      return openWithProof(result.data);
    }).catch(function () {
      explain(email);
    });
  }

  function loginWithAgilizaiPassword() {
    var emailInput = document.getElementById('gateEmail');
    var passwordInput = document.getElementById('gatePassword');
    var status = document.getElementById('gateStatus');
    var email = emailInput ? String(emailInput.value || '').trim() : '';
    var password = passwordInput ? passwordInput.value || '' : '';
    if (!email || !password) return Promise.resolve();
    if (status) status.textContent = 'Conferindo a conta do Agilizai…';
    return fetch(apiBase() + '/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access: email, password: password })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { res: res, data: data || {} };
      });
    }).then(function (result) {
      if (!result.res.ok || !result.data.token) {
        if (status) status.textContent = 'E-mail ou senha incorretos.';
        return;
      }
      var normalized = email.toLowerCase();
      if (!ALLOWED[normalized]) {
        if (status) status.textContent = 'Essa conta do Agilizai não abre o BI do Seu Justino.';
        return;
      }
      saveAgilizaiSession(normalized, result.data);
      if (passwordInput) passwordInput.value = '';
      return enterFromAgilizai();
    }).catch(function () {
      if (status) status.textContent = 'Não consegui confirmar a conta do Agilizai agora.';
    });
  }

  function hookPanelLogin() {
    if (!onAgilizaiSite() || typeof doLogin !== 'function' || doLogin.__agilizaiHook) return;
    var nativeDoLogin = doLogin;
    var wrapped = async function () {
      await nativeDoLogin();
      if (!gateStillOpen()) return;
      await loginWithAgilizaiPassword();
    };
    wrapped.__agilizaiHook = true;
    window.doLogin = wrapped;
  }

  function ensureBar() {
    var bar = document.getElementById(BAR_ID);
    if (bar) return bar;
    bar = document.createElement('div');
    bar.id = BAR_ID;
    bar.setAttribute('role', 'status');
    bar.style.cssText = [
      'box-sizing:border-box',
      'flex:1 0 100%',
      'width:100%',
      'margin:0 0 12px',
      'padding:7px 12px',
      'border-radius:8px',
      'background:#14110e',
      'border:1px solid #332b24',
      'color:#a39686',
      'font:500 12px/1.4 "Plus Jakarta Sans",Arial,sans-serif',
      'letter-spacing:.01em'
    ].join(';');
    var header = document.querySelector('header');
    var parent = header || document.body;
    if (!parent) return null;
    parent.insertBefore(bar, parent.firstChild);
    return bar;
  }

  function show(text) {
    try {
      var bar = ensureBar();
      if (bar) bar.textContent = text;
    } catch (e) {}
  }

  function asCount(value) {
    if (typeof value === 'boolean' || value == null) return null;
    var n = typeof value === 'number' ? value : Number(String(value).trim());
    if (!isFinite(n) || n < 0) return null;
    return String(Math.round(n));
  }

  function refresh() {
    var url = apiBase() + '/api/bi/justino/resumo';
    fetch(url, { method: 'GET', cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('status');
        return res.json();
      })
      .then(function (data) {
        var reservations = data && data.reservations;
        var total = asCount(reservations && reservations.total);
        var people = asCount(reservations && reservations.people);
        if (total == null || people == null) throw new Error('shape');
        show('Agilizai · reservas de hoje: ' + total + ' · ' + people + ' pessoas');
      })
      .catch(function () {
        show('Agilizai · reservas indisponíveis agora');
      });
  }

  function start() {
    if (started) return;
    started = true;
    try {
      show('Agilizai · reservas de hoje: …');
      refresh();
      setInterval(function () {
        try { refresh(); } catch (e) { show('Agilizai · reservas indisponíveis agora'); }
      }, INTERVAL_MS);
    } catch (e) {
      show('Agilizai · reservas indisponíveis agora');
    }
    try {
      hookPanelLogin();
      enterFromAgilizai();
    } catch (e) {}
  }

  try {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  } catch (e) {}
})();
