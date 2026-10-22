(function () {
  var REFRESH_MS = 60000;
  var UNAVAILABLE = 'Agilizai · reservas indisponíveis agora';

  function apiBase() {
    var host = (location.hostname || '').toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    return 'https://api.agilizaiapp.com.br';
  }

  function formatDate(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || '').trim());
    if (!match) return '';
    return match[3] + '/' + match[2] + '/' + match[1];
  }

  function count(value) {
    if (typeof value === 'number' && isFinite(value)) return String(value);
    if (typeof value === 'string' && value.trim() !== '' && isFinite(Number(value))) {
      return String(Number(value));
    }
    return '';
  }

  function ensureBar() {
    var bar = document.getElementById('biAgilizaiBar');
    if (bar) return bar;

    bar = document.createElement('div');
    bar.id = 'biAgilizaiBar';
    bar.setAttribute('role', 'status');
    bar.style.cssText = [
      'flex:0 0 100%',
      'width:100%',
      'box-sizing:border-box',
      'margin:0 0 12px',
      'padding:6px 12px',
      'background:#14110f',
      'color:#f7f4f1',
      'border:1px solid #332b24',
      'border-radius:8px',
      'font:12px/1.4 "Plus Jakarta Sans",Segoe UI,sans-serif',
      'letter-spacing:0'
    ].join(';');

    var header = document.querySelector('header');
    if (header) {
      header.insertBefore(bar, header.firstChild);
    } else if (document.body) {
      document.body.insertBefore(bar, document.body.firstChild);
    }
    return bar;
  }

  function show(text) {
    var bar = ensureBar();
    if (bar) bar.textContent = text;
  }

  function summaryText(data) {
    var reservations = data && data.reservations;
    var total = count(reservations && reservations.total);
    var people = count(reservations && reservations.people);
    if (!reservations || total === '' || people === '') return UNAVAILABLE;

    var dateLabel = formatDate(data && data.date);
    var label = dateLabel ? 'reservas de hoje (' + dateLabel + ')' : 'reservas de hoje';
    return 'Agilizai · ' + label + ': ' + total + ' · ' + people + ' pessoas';
  }

  function refresh() {
    fetch(apiBase() + '/api/bi/justino/resumo')
      .then(function (response) {
        if (!response.ok) throw new Error('status');
        return response.json();
      })
      .then(function (data) {
        if (!data || data.ok === false) throw new Error('payload');
        show(summaryText(data));
      })
      .catch(function () {
        show(UNAVAILABLE);
      });
  }

  function boot() {
    refresh();
    window.setInterval(refresh, REFRESH_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
