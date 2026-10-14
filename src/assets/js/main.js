/* Optimax homepage — small, dependency-free interactions */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Load-in animation once fonts are ready (or after 600ms, whichever is first)
  const loaded = () => document.documentElement.classList.add('is-loaded');
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 600))]).then(() => requestAnimationFrame(loaded));

  // Scroll reveals
  // Only elements below the first screen start hidden, so the first frame is always complete
  if ('IntersectionObserver' in window && !reduce) {
    $$('.reveal').forEach(el => { if (el.getBoundingClientRect().top > innerHeight * 0.92) el.classList.add('pre'); });
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal.pre').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('in'));
  }

  // Sticky nav border + mobile menu
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const toggle = $('.nav__toggle'), sheet = $('#mobile-menu');
  const setMenu = open => { toggle.setAttribute('aria-expanded', open); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); sheet.hidden = !open; };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  sheet.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // Treatment finder
  const data = JSON.parse($('#finder-data').textContent);
  const result = $('#finder-result');
  const chips = $$('.finder__options .chip');
  const select = (chip, focus) => {
    const o = data.find(d => d.id === chip.dataset.id); if (!o) return;
    chips.forEach(c => { const on = c === chip; c.setAttribute('aria-checked', on); c.tabIndex = on ? 0 : -1; });
    if (focus) chip.focus();
    result.className = `finder__result c-${o.color}`;
    $('[data-f=recommended]', result).textContent = o.recommended;
    $('[data-f=summary]', result).textContent = o.summary;
    $('[data-f=alternatives]', result).innerHTML = o.alternatives.map(a => `<li>${a.replace(/</g, '&lt;')}</li>`).join('');
    $('[data-f=book]', result).dataset.service = o.recommended;
    if (!reduce) { result.classList.remove('swap'); void result.offsetWidth; result.classList.add('swap'); }
  };
  chips.forEach((c, i) => {
    c.addEventListener('click', () => select(c));
    c.addEventListener('keydown', e => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); select(chips[(i + k + chips.length) % chips.length], true); }
    });
  });
  // "Book" from the finder pre-selects the closest service in the form
  $('[data-f=book]', result).addEventListener('click', e => {
    const want = (e.currentTarget.dataset.service || $('[data-f=recommended]', result).textContent).toLowerCase();
    const sel = $('#f-service');
    const match = [...sel.options].find(o => { const t = o.text.toLowerCase(); return t.includes(want) || want.includes(t.split(' (')[0]); });
    if (match) sel.value = match.value;
  });

  // Doctors scroller buttons
  const sc = $('#doctor-scroller');
  $$('[data-scroll]').forEach(b => b.addEventListener('click', () => {
    sc.scrollBy({ left: Number(b.dataset.scroll) * sc.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  }));

  // Booking form
  const form = $('#booking-form'), ok = $('#booking-success');
  const check = f => { const valid = f.querySelector('input,select').checkValidity(); f.classList.toggle('invalid', !valid); return valid; };
  $$('.field', form).forEach(f => { const el = f.querySelector('input,select'); ['input','change'].forEach(t => el.addEventListener(t, () => f.classList.contains('invalid') && check(f))); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const fields = $$('.field', form);
    const bad = fields.filter(f => !check(f));
    if (bad.length) { bad[0].querySelector('input,select').focus(); return; }
    const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'Sending…';
    try {
      if (form.action && form.getAttribute('action')) {
        await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      }
    } catch (_) { /* still confirm; the team follows up by phone */ }
    form.hidden = true; ok.hidden = false; ok.focus();
  });

  // Hero badge: step from 1s up to the final value (e.g. 8s), one clear number at a time,
  // with the yellow ring filling in step. Starts when the badge is on screen.
  const badge = $('.badge'), bnum = badge && $('.badge__num', badge), ring = badge && $('.badge__ring circle', badge);
  if (badge && bnum && !reduce && 'IntersectionObserver' in window) {
    const final = bnum.textContent.trim(), m = final.match(/^(\D*?)(\d+)(.*)$/s);
    const target = m ? parseInt(m[2], 10) : 0;
    if (target >= 2 && target <= 30) {
      const C = 553, STEP = 560;               // ms per number: slow enough to read each one
      badge.classList.add('is-counting');
      const show = n => {
        bnum.textContent = m[1] + n + m[3];
        bnum.classList.remove('tick', 'done'); void bnum.offsetWidth;
        bnum.classList.add(n === target ? 'done' : 'tick');
        if (ring) ring.style.strokeDashoffset = String(C * (1 - n / target));
      };
      bnum.textContent = m[1] + '1' + m[3];
      if (ring) ring.style.strokeDashoffset = String(C * (1 - 1 / target));
      const bio = new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting)) return;
        bio.disconnect();
        let n = 1;
        setTimeout(function next() {
          show(n);
          if (n < target) { n++; setTimeout(next, STEP); }
        }, 700);
      }, { threshold: 0.6 });
      bio.observe(badge);
    }
  }

  // Stat tiles: count up to the number shown, once, when each tile scrolls into view.
  // The final value is already in the HTML, so search engines, screen readers and
  // visitors who prefer reduced motion simply see the real number.
  const tiles = $$('.tile__value');
  const parse = t => { const m = t.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/s); return m && { pre: m[1], num: parseFloat(m[2]), dec: (m[2].split('.')[1] || '').length, post: m[3] }; };
  const ease = x => 1 - Math.pow(1 - x, 4);
  const run = el => {
    const p = parse(el.dataset.final); if (!p) return;
    const dur = 1600 + Math.min(p.num, 40) * 12; let t0;
    const step = t => {
      t0 ??= t; const k = Math.min(1, (t - t0) / dur);
      el.textContent = p.pre + (p.num * ease(k)).toFixed(p.dec) + p.post;
      if (k < 1) requestAnimationFrame(step); else el.textContent = el.dataset.final;
    };
    requestAnimationFrame(step);
  };
  if (!reduce && 'IntersectionObserver' in window) {
    tiles.forEach(el => {
      el.dataset.final = el.textContent.trim();
      el.setAttribute('aria-label', el.dataset.final);
      const p = parse(el.dataset.final); if (p) el.textContent = p.pre + (0).toFixed(p.dec) + p.post;
    });
    const tio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { tio.unobserve(e.target); run(e.target); }
    }), { threshold: 0.6 });
    tiles.forEach(el => tio.observe(el));
  }
})();
