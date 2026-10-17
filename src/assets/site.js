// Copy-email buttons (.ecopy): clipboard API, then execCommand, then select the visible address. Shows "Copied!" for 2s.
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.ecopy'); if (!b) return;
  const t = b.dataset.email, l = b.dataset.l || (b.dataset.l = b.textContent);
  const ok = () => { b.textContent = 'Copied!'; b.classList.add('done'); clearTimeout(b._t); b._t = setTimeout(() => { b.textContent = l; b.classList.remove('done'); }, 2000); };
  const old = () => {
    const a = document.createElement('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;top:0;left:0;opacity:0'; document.body.appendChild(a); a.select();
    let r = false; try { r = document.execCommand('copy'); } catch (x) {} a.remove();
    if (r) return ok();
    const n = (b.closest('.emo') || document).querySelector('.emaddr'); if (n) { const g = document.createRange(); g.selectNodeContents(n); const w = getSelection(); w.removeAllRanges(); w.addRange(g); }
    b.textContent = 'Press Ctrl+C / ⌘C';
  };
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(ok, old); else old();
});

// Sticky header: shadow once scrolled; expose its height as --hh for anchor offsets.
(() => {
  const bar = document.getElementById('topbar'); if (!bar) return;
  const r = document.documentElement;
  const size = () => r.style.setProperty('--hh', bar.offsetHeight + 'px');
  const tick = () => bar.classList.toggle('scrolled', scrollY > 4);
  size(); tick();
  addEventListener('resize', size, { passive: true });
  addEventListener('scroll', tick, { passive: true });
})();

// Mobile burger menu: toggles #mainnav as a panel under the sticky header.
(() => {
  const bar = document.getElementById('topbar'), btn = document.getElementById('burger'), nav = document.getElementById('mainnav');
  if (!bar || !btn || !nav) return;
  const r = document.documentElement, mq = matchMedia('(max-width:1100px)');
  const isOpen = () => btn.getAttribute('aria-expanded') === 'true';
  const items = () => [...nav.querySelectorAll('a,button')].filter(el => el.offsetParent !== null);
  const set = (o, back) => {
    btn.setAttribute('aria-expanded', o); bar.classList.toggle('open', o); r.classList.toggle('menu-open', o);
    if (o) { const f = items()[0]; if (f) f.focus({ preventScroll: true }); } else if (back) btn.focus();
  };
  btn.addEventListener('click', () => set(!isOpen()));
  nav.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    if (e.key === 'Escape') { set(false, true); return; }
    if (e.key !== 'Tab') return;
    const list = [btn, ...items()], first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  // Tap outside closes. Taps on the dimmed page are swallowed; taps elsewhere in the header still work.
  document.addEventListener('click', e => {
    if (!isOpen() || nav.contains(e.target) || btn.contains(e.target)) return;
    if (!bar.contains(e.target)) { e.preventDefault(); e.stopPropagation(); }
    set(false);
  }, true);
  const off = e => { if (!e.matches && isOpen()) set(false); };
  mq.addEventListener ? mq.addEventListener('change', off) : mq.addListener(off);
})();

// City page filters: distance x area chips over the next-30-days list. Hidden without JS (list shows all).
(() => {
  const f = document.getElementById('filt'); if (!f) return;
  const wrap = f.nextElementSibling, rows = [...wrap.querySelectorAll('.race')], none = wrap.querySelector('.fnone'), cnt = f.querySelector('.fcount');
  const st = { c: '', r: '' };
  const run = () => {
    let n = 0;
    rows.forEach(li => { const ok = (!st.c || li.dataset.c.split(' ').includes(st.c)) && (!st.r || li.dataset.r === st.r); li.hidden = !ok; if (ok) n++; });
    if (none) none.hidden = n > 0; cnt.textContent = `Showing ${n} of ${rows.length} races`;
  };
  f.addEventListener('click', e => {
    const b = e.target.closest('button[data-f]'); if (!b) return;
    st[b.dataset.f] = b.dataset.v;
    f.querySelectorAll(`button[data-f="${b.dataset.f}"]`).forEach(x => x.setAttribute('aria-pressed', x === b));
    run();
  });
  f.hidden = false; run();
})();

// Home city picker: go straight to the chosen city page.
(() => {
  const f = document.getElementById('picker'); if (!f) return;
  f.addEventListener('submit', e => { e.preventDefault(); location.href = f.querySelector('select').value; });
})();
