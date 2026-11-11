/* Quiz: answer by tapping, score bar, quick round from all questions, team scoreboard. Needs site.js (window.SYG). */
(function () {
  'use strict';
  var d = document, $ = function (s, r) { return (r || d).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || d).querySelectorAll(s)); };
  var esc = function (s) { return window.SYG ? SYG.esc(s) : String(s); };

  /* ---- answering a list of questions ---- */
  function score(list) {
    var qs = $$('.q', list), done = qs.filter(function (q) { return q.classList.contains('done'); }).length;
    var ok = qs.filter(function (q) { return q.classList.contains('ok'); }).length;
    var bar = $('.bar');
    if (!bar) return;
    bar.hidden = false;
    $('b', bar).textContent = done < qs.length ? 'Score: ' + ok + ' of ' + done + ' answered' : 'Final score: ' + ok + ' out of ' + qs.length;
    var wa = $('[data-wa]', bar);
    if (wa) {
      wa.hidden = done < qs.length;
      wa.setAttribute('data-wa', 'I scored ' + ok + ' out of ' + qs.length + ' in "' + (list.getAttribute('data-name') || 'a quiz round') + '". Can you beat me? ' + (list.getAttribute('data-url') || location.href));
    }
    if (done === qs.length && window.SYG) SYG.toast(ok === qs.length ? 'Full marks!' : ok >= qs.length * 0.7 ? 'Well played: ' + ok + ' right' : 'Round over: ' + ok + ' right');
  }
  d.addEventListener('click', function (e) {
    var b = e.target.closest('.opts button');
    if (b) {
      var q = b.closest('.q');
      if (q.classList.contains('done')) return;
      q.classList.add('done');
      var right = b.hasAttribute('data-ok');
      if (right) q.classList.add('ok');
      b.classList.add(right ? 'right' : 'wrong');
      b.setAttribute('aria-pressed', 'true');
      var good = $('.opts [data-ok]', q); if (good) good.classList.add('right');
      $$('.opts button', q).forEach(function (x) { x.setAttribute('aria-disabled', 'true'); });
      var det = $('details', q); if (det) det.open = true;
      score(q.closest('.qs'));
      return;
    }
    if (e.target.closest('[data-print]')) { $$('.q details').forEach(function (x) { x.open = true; }); window.print(); return; }
    var r = e.target.closest('[data-reset]');
    if (r) {
      $$('.q').forEach(function (q) {
        q.classList.remove('done', 'ok');
        $$('.opts button', q).forEach(function (x) { x.classList.remove('right', 'wrong'); x.removeAttribute('aria-disabled'); x.removeAttribute('aria-pressed'); });
        var det = $('details', q); if (det) det.open = false;
      });
      var bar = $('.bar'); if (bar) bar.hidden = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  /* ---- quick round: random questions from the chosen topics ---- */
  var play = $('#play');
  if (play) {
    var DATA = null, L = 'ABCD';
    var shuffle = function (a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    var start = function () {
      var ids = $$('#topics button[aria-pressed=true]').map(function (b) { return b.value; });
      if (!ids.length) { SYG.toast('Choose at least one topic'); return; }
      var n = +($('#num button[aria-pressed=true]') || {}).value || 10, pool = [];
      DATA.forEach(function (t) { if (ids.indexOf(t.id) > -1) t.q.forEach(function (q) { pool.push([t.name].concat(q)); }); });
      var pick = shuffle(pool).slice(0, n), text = [], key = [];
      var html = pick.map(function (q, i) {
        var opts = shuffle(q[2].map(function (o, k) { return [o, k === 0]; }));
        text.push((i + 1) + '. ' + q[1] + '\n' + opts.map(function (o, k) { return L[k] + ') ' + o[0]; }).join('\n'));
        opts.forEach(function (o, k) { if (o[1]) key.push((i + 1) + '. ' + L[k] + ') ' + o[0]); });
        return '<li class="q"><p>' + esc(q[1]) + '</p><div class="opts">' + opts.map(function (o, k) {
          return '<button type="button"' + (o[1] ? ' data-ok' : '') + '><b>' + L[k] + '</b>' + esc(o[0]) + '</button>'; }).join('') +
          '</div><details><summary>Show answer</summary><p><b>' + esc(q[2][0]) + '.</b> ' + esc(q[3]) + ' <small>(' + esc(q[0]) + ')</small></p></details></li>';
      }).join('');
      var out = $('#round');
      out.innerHTML = '<div class="tools"><button class="btn sm" type="button" id="cq">Copy questions</button><button class="btn sm ghost" type="button" id="wq">Send questions on WhatsApp</button>' +
        '<button class="btn sm ghost" type="button" id="ck">Copy answer key</button></div><ol class="qs rise" data-name="a quick quiz round" data-url="' + location.origin + '/play/">' + html + '</ol>';
      var head = 'Quiz time! ' + pick.length + ' questions. Reply with your answers, like 1A 2C 3B.\n\n';
      $('#cq').setAttribute('data-copy', head + text.join('\n\n'));
      $('#wq').setAttribute('data-wa', head + text.join('\n\n'));
      $('#ck').setAttribute('data-copy', 'Answers\n' + key.join('\n'));
      var bar = $('.bar'); if (bar) bar.hidden = true;
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    d.addEventListener('click', function (e) {
      var c = e.target.closest('#topics button,#num button');
      if (c) {
        if (c.parentNode.id === 'num') $$('#num button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        c.setAttribute('aria-pressed', c.parentNode.id === 'num' ? 'true' : c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
        return;
      }
      if (e.target.closest('#all')) { var on = $$('#topics button[aria-pressed=false]').length > 0; $$('#topics button').forEach(function (x) { x.setAttribute('aria-pressed', on ? 'true' : 'false'); }); return; }
      if (e.target.closest('#go')) {
        if (DATA) return start();
        $('#go').disabled = true;
        SYG.json('/data/all.json').then(function (j) { DATA = j; $('#go').disabled = false; start(); }, function () { $('#go').disabled = false; SYG.toast('Could not load the questions. Check your connection.'); });
      }
    });
  }

  /* ---- team scoreboard, kept in this browser ---- */
  var sb = $('#sb');
  if (sb) {
    var KEY = 'syg-quiz-board', teams = [];
    try { teams = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(teams)); } catch (e) {} };
    var summary = function () {
      var s = teams.slice().sort(function (a, b) { return b.p - a.p; });
      return 'Scoreboard\n' + s.map(function (t, i) { return (i + 1) + '. ' + t.n + ': ' + t.p; }).join('\n');
    };
    var draw = function () {
      var top = teams.length ? Math.max.apply(null, teams.map(function (t) { return t.p; })) : 0;
      sb.innerHTML = teams.map(function (t, i) {
        return '<li class="' + (t.p === top && top > 0 ? 'lead' : '') + '"><span class="nm">' + esc(t.n) + '</span>' +
          '<button type="button" data-i="' + i + '" data-d="-5" aria-label="Take 5 points from ' + esc(t.n) + '">−5</button><button type="button" data-i="' + i + '" data-d="-1" aria-label="Take 1 point from ' + esc(t.n) + '">−1</button>' +
          '<span class="pt" aria-live="polite">' + t.p + '</span><button type="button" data-i="' + i + '" data-d="1" aria-label="Give 1 point to ' + esc(t.n) + '">+1</button>' +
          '<button type="button" data-i="' + i + '" data-d="5" aria-label="Give 5 points to ' + esc(t.n) + '">+5</button><button type="button" data-i="' + i + '" data-x aria-label="Remove ' + esc(t.n) + '">✕</button></li>';
      }).join('') || '<li>No teams yet. Add the first name above.</li>';
      $('#sb-acts').hidden = !teams.length;
      $('#sb-copy').setAttribute('data-copy', summary()); $('#sb-wa').setAttribute('data-wa', summary());
    };
    var add = function () {
      var inp = $('#team'), n = inp.value.trim().slice(0, 30);
      if (!n) { inp.focus(); return; }
      if (teams.length >= 12) { SYG.toast('12 teams is the limit'); return; }
      teams.push({ n: n, p: 0 }); inp.value = ''; save(); draw(); inp.focus();
    };
    $('#add').addEventListener('click', add);
    $('#team').addEventListener('keydown', function (e) { if (e.key === 'Enter') add(); });
    sb.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var i = +b.getAttribute('data-i');
      if (b.hasAttribute('data-x')) teams.splice(i, 1); else teams[i].p += +b.getAttribute('data-d');
      save(); draw();
    });
    $('#sb-zero').addEventListener('click', function () { teams.forEach(function (t) { t.p = 0; }); save(); draw(); });
    $('#sb-clear').addEventListener('click', function () { if (confirm('Remove all teams and scores?')) { teams = []; save(); draw(); } });
    draw();
  }
})();
