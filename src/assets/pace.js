// Pace math shared by the pace calculator page (browser) and its build-time data file (Node).
// Distances in miles. Riegel: T2 = T1 x (D2 / D1)^1.06.
(function (root, f) { if (typeof module === 'object' && module.exports) module.exports = f(); else root.Pace = f(); })(this, function () {
  var KM = 0.621371192;
  var D = [
    { id: '5k', label: '5K', mi: 5 * KM, km: 5 },
    { id: '10k', label: '10K', mi: 10 * KM, km: 10 },
    { id: '10mi', label: '10 miles', mi: 10, km: 10 / KM },
    { id: 'half', label: 'Half marathon', mi: 21.0975 * KM, km: 21.0975 },
    { id: 'marathon', label: 'Marathon', mi: 42.195 * KM, km: 42.195 }
  ];
  function hms(sec, keepH) {
    sec = Math.round(sec); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return h || keepH ? h + ':' + p(m) + ':' + p(s) : m + ':' + p(s);
  }
  // "4:00:00", "45:30", "28" (minutes) -> seconds
  function parse(str) {
    var a = String(str || '').trim().split(':').map(Number);
    if (!a.length || a.some(function (x) { return isNaN(x) || x < 0; })) return NaN;
    if (a.length === 1) return a[0] * 60;
    if (a.length === 2) return a[0] * 60 + a[1];
    if (a.length === 3) return a[0] * 3600 + a[1] * 60 + a[2];
    return NaN;
  }
  function riegel(t1, d1, d2) { return t1 * Math.pow(d2 / d1, 1.06); }
  // Everything the page shows for a distance (miles) and finish time (seconds).
  function solve(mi, sec) {
    var perMi = sec / mi, perKm = sec / (mi / KM);
    return { mi: mi, km: mi / KM, sec: sec, perMi: perMi, perKm: perKm, mph: mi / (sec / 3600), kph: mi / KM / (sec / 3600) };
  }
  function splits(mi, sec, unit) {
    var len = unit === 'km' ? KM : 1, n = mi / len, out = [], per = sec / n;
    for (var i = 1; i <= Math.floor(n + 1e-9); i++) out.push({ at: i, t: per * i });
    if (n - Math.floor(n + 1e-9) > 0.01) out.push({ at: +n.toFixed(2), t: sec });
    return out;
  }
  return { KM: KM, D: D, hms: hms, parse: parse, riegel: riegel, solve: solve, splits: splits };
});
