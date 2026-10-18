// Live pace calculator (/tools/pace-calculator/). Vanilla JS, no dependencies; math in pace.js.
(function () {
  var P = window.Pace, f = document.getElementById('pcf'); if (!P || !f) return;
  var $ = function (id) { return document.getElementById(id); };
  var byId = {}; P.D.forEach(function (d) { byId[d.id] = d; });
  var unit = 'mi';
  function num(id) { var v = $(id).value.trim(); return v === '' ? 0 : Number(v); }
  function dist() {
    var v = $('pd').value;
    if (v !== 'custom') return { mi: byId[v].mi, label: byId[v].label, id: v };
    var n = num('pcd'), u = $('pcu').value;
    return { mi: u === 'km' ? n * P.KM : n, label: n + (u === 'km' ? ' km' : (n === 1 ? ' mile' : ' miles')), id: 'custom' };
  }
  function row(a, b, c) { var tr = document.createElement('tr'), th = document.createElement('th'); th.scope = 'row'; th.textContent = a; tr.appendChild(th); [b, c].forEach(function (x) { if (x == null) return; var td = document.createElement('td'); td.textContent = x; tr.appendChild(td); }); return tr; }
  function fill(id, rows) { var tb = $(id); tb.textContent = ''; rows.forEach(function (r) { tb.appendChild(r); }); }
  function err(msg) { var e = $('pce'); e.hidden = !msg; e.textContent = msg || ''; }
  function run() {
    var mode = f.querySelector('input[name=m]:checked').value;
    $('pct').hidden = mode !== 'time'; $('pcp').hidden = mode !== 'pace'; $('pcc').hidden = $('pd').value !== 'custom';
    var d = dist();
    if (!(d.mi > 0) || d.mi > 250) return err('Enter a distance between 0.1 and 250.');
    var sec;
    if (mode === 'time') sec = num('th') * 3600 + num('tm') * 60 + num('ts');
    else { var p = num('pm') * 60 + num('ps'); sec = $('pu').value === 'km' ? p * (d.mi / P.KM) : p * d.mi; }
    if (!(sec > 0) || isNaN(sec)) return err(mode === 'time' ? 'Enter a finish time.' : 'Enter a pace.');
    err('');
    var r = P.solve(d.mi, sec), T = P.hms(sec, sec >= 3600);
    $('o-lab').textContent = d.label + ' in ' + T;
    $('o-t').textContent = T; $('o-mi').textContent = P.hms(r.perMi); $('o-km').textContent = P.hms(r.perKm);
    $('o-sp').textContent = r.mph.toFixed(2) + ' mph';
    fill('o-pred', P.D.map(function (x) { var t = P.riegel(sec, d.mi, x.mi); return row(x.label, P.hms(t, t >= 3600), P.hms(t / x.mi)); }));
    var sp = P.splits(d.mi, sec, unit);
    $('o-su').textContent = unit === 'km' ? 'Km' : 'Mile';
    $('o-scap').textContent = (unit === 'km' ? 'Km' : 'Mile') + ' splits for a ' + T + ' ' + d.label.toLowerCase();
    fill('o-spl', sp.slice(0, 400).map(function (s) { return row(String(s.at), P.hms(s.t, sec >= 3600)); }));
    document.querySelectorAll('.pc-fd').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-d') === d.id); });
  }
  f.addEventListener('input', run); f.addEventListener('change', run);
  f.addEventListener('submit', function (e) { e.preventDefault(); run(); });
  document.querySelectorAll('.pc-sb').forEach(function (b) { b.addEventListener('click', function () { unit = b.getAttribute('data-u'); document.querySelectorAll('.pc-sb').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); run(); }); });
  run();
})();
