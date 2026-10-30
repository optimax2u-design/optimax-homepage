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
  const setMenu = open => {
    toggle.setAttribute('aria-expanded', open); toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    sheet.style.top = open ? Math.max(0, nav.getBoundingClientRect().bottom) + 'px' : '';
    document.documentElement.classList.toggle('menu-open', open); sheet.hidden = !open;
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  const placeSheet = () => { if (!sheet.hidden) sheet.style.top = Math.max(0, nav.getBoundingClientRect().bottom) + 'px'; };
  addEventListener('resize', placeSheet); addEventListener('scroll', placeSheet, { passive: true });
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
    const sel = $('#f-service'); if (!sel) return;
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
  if (form) {
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
  }

  // Hero badge: smooth rolling counter from 1s to the final value (e.g. 8s).
  // Digits glide upward like an odometer while the yellow ring sweeps round in sync.
  const badge = $('.badge'), bnum = badge && $('.badge__num', badge), ring = badge && $('.badge__ring circle', badge);
  if (badge && bnum && !reduce && 'IntersectionObserver' in window) {
    const final = bnum.textContent.trim(), m = final.match(/^(\D*?)(\d+)(.*)$/s);
    const target = m ? parseInt(m[2], 10) : 0;
    if (target >= 2 && target <= 30) {
      const C = 553, DUR = 650 * (target - 1) + 700;   // ~5.3s for 1→8: smooth, every number readable
      const nums = Array.from({ length: target }, (_, i) => `<span>${i + 1}</span>`).join('');
      bnum.innerHTML = `${m[1] ? `<span>${m[1]}</span>` : ''}<span class="roll" aria-hidden="true"><span class="roll__col">${nums}</span></span><span class="roll__suf" aria-hidden="true">${m[3]}</span>`;
      const col = $('.roll__col', bnum);
      badge.classList.add('is-counting');
      if (ring) ring.style.strokeDashoffset = String(C * (1 - 1 / target));
      // gentle ease-in-out: starts softly, glides, settles softly on the final number
      const ease = t => -(Math.cos(Math.PI * t) - 1) / 2;   // even glide: no number rushes past
      const frame = v => {                       // v: 0 → target-1 (continuous)
        col.style.transform = `translate3d(0, ${-v / target * 100}%, 0)`;
        if (ring) ring.style.strokeDashoffset = String(C * (1 - (1 + v) / target));
      };
      frame(0);
      const bio = new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting)) return;
        bio.disconnect();
        setTimeout(() => {
          let t0;
          const tick = t => {
            t0 ??= t; const k = Math.min(1, (t - t0) / DUR);
            frame(ease(k) * (target - 1));
            if (k < 1) requestAnimationFrame(tick);
            else { bnum.classList.add('done'); }
          };
          requestAnimationFrame(tick);
        }, 600);
      }, { threshold: 0.6 });
      bio.observe(badge);
    }
  }

  // Carousels (phones): a small progress track under each swipeable row
  $$('[data-carousel]').forEach(el => {
    const track = document.createElement('div'); track.className = 'cprog'; track.setAttribute('aria-hidden', 'true');
    const thumb = document.createElement('span'); track.appendChild(thumb); el.after(track);
    const upd = () => {
      const sw = el.scrollWidth, cw = el.clientWidth, over = sw - cw > 4;
      track.classList.toggle('on', over); if (!over) return;
      thumb.style.width = (cw / sw * 100) + '%';
      thumb.style.transform = `translateX(${el.scrollLeft / cw * 100}%)`;
    };
    el.addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd); upd();
    new ResizeObserver(upd).observe(el);
  });

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
