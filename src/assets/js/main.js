/* Optimax website — small, dependency-free interactions (every page) */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Site may live under a sub-path (GitHub Pages /repo/); the logo link tells us the root
  const root = (document.querySelector('.brand') || {}).getAttribute?.('href') || '/';
  const withBase = u => (u && u.startsWith('/') && !u.startsWith('//')) ? root.replace(/\/$/, '') + u : u;

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
  const fdata = $('#finder-data');
  if (fdata) {
  const data = JSON.parse(fdata.textContent);
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
    const lm = $('[data-f=url]', result); if (lm && o.url) lm.setAttribute('href', withBase(o.url));
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
  }

  // Doctors scroller buttons
  const sc = $('#doctor-scroller');
  if (sc) $$('[data-scroll]').forEach(b => b.addEventListener('click', () => {
    sc.scrollBy({ left: Number(b.dataset.scroll) * sc.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  }));

  // Booking form
  const form = $('#booking-form'), ok = $('#booking-success');
  if (form) {
  // Pre-select branch / service set by the page (e.g. a branch or treatment page)
  const pre = (sel, want) => { if (!sel || !want) return; const o = [...sel.options].find(o => o.text === want || o.value === want); if (o) sel.value = o.value; };
  pre($('#f-branch'), form.dataset.branch); pre($('#f-service'), form.dataset.service);
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
  const parse = t => { const m = t.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/s); return m && !/\d/.test(m[3]) && m[1].length < 2 && m[3].length < 4 ? { pre: m[1], num: parseFloat(m[2]), dec: (m[2].split('.')[1] || '').length, post: m[3] } : null; };
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
  // Treatments mega menu: click/tap toggles (hover + focus handled in CSS)
  $$('[data-mega]').forEach(m => {
    const trig = $('.mega__trigger', m);
    trig.addEventListener('click', e => {
      if (matchMedia('(hover: hover)').matches && !m.classList.contains('is-open') && e.detail) return; // mouse users: link works
      e.preventDefault();
      const open = !m.classList.contains('is-open');
      m.classList.toggle('is-open', open); trig.setAttribute('aria-expanded', open);
    });
    m.addEventListener('mouseenter', () => trig.setAttribute('aria-expanded', 'true'));
    m.addEventListener('mouseleave', () => { m.classList.remove('is-open'); trig.setAttribute('aria-expanded', 'false'); });
    document.addEventListener('click', e => { if (!m.contains(e.target)) { m.classList.remove('is-open'); trig.setAttribute('aria-expanded', 'false'); } });
    addEventListener('keydown', e => { if (e.key === 'Escape') { m.classList.remove('is-open'); trig.setAttribute('aria-expanded', 'false'); } });
  });

  // Chip groups behave like radio buttons
  const chipGroup = (btns, onPick) => btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.setAttribute('aria-pressed', x === b)); onPick(b);
  }));

  // Doctors page: filter by branch + language
  const dlist = $('[data-filter-list]');
  if (dlist) {
    const cards = $$('.doc--link', dlist), sel = $('[data-filter=branch]'), langBtns = $$('[data-lang]');
    const count = $('[data-count]'), empty = $('[data-empty]');
    let lang = '';
    const params = new URLSearchParams(location.search);
    if (params.get('branch') && sel) sel.value = params.get('branch');
    const apply = () => {
      const br = sel ? sel.value : ''; let n = 0;
      cards.forEach(c => {
        const ok = (!br || c.dataset.branches.split(' ').includes(br)) && (!lang || c.dataset.langs.split('|').includes(lang));
        c.classList.toggle('is-hidden', !ok); if (ok) n++;
      });
      if (count) count.textContent = n; if (empty) empty.hidden = n > 0;
    };
    sel && sel.addEventListener('change', apply);
    chipGroup(langBtns, b => { lang = b.dataset.lang; apply(); });
    const reset = $('[data-reset]'); reset && reset.addEventListener('click', () => { if (sel) sel.value = ''; lang = ''; langBtns.forEach((x, i) => x.setAttribute('aria-pressed', i === 0)); apply(); });
    apply();
  }

  // Branches page: search + region chips
  const bq = $('[data-branch-search]');
  if (bq) {
    const blocks = $$('[data-region-block]'), empty = $('[data-empty]'); let region = '';
    const apply = () => {
      const q = bq.value.trim().toLowerCase(); let total = 0;
      blocks.forEach(bl => {
        let n = 0;
        $$('.bcard', bl).forEach(c => { const ok = (!q || c.dataset.search.includes(q)); c.classList.toggle('is-hidden', !ok); if (ok) n++; });
        const show = n > 0 && (!region || bl.dataset.regionBlock === region);
        bl.classList.toggle('is-hidden', !show); if (show) total += n;
      });
      if (empty) { empty.hidden = total > 0; const qs = $('[data-q]', empty); if (qs) qs.textContent = bq.value; }
    };
    bq.addEventListener('input', apply);
    chipGroup($$('[data-region]'), b => { region = b.dataset.region; apply(); });
  }

  // Blog: filter by topic
  const pf = $('[data-post-filter]');
  if (pf) {
    const posts = $$('.posts .post');
    chipGroup($$('[data-cat]', pf), b => {
      const c = b.dataset.cat;
      posts.forEach(p => p.classList.toggle('is-hidden', !!c && !p.dataset.cats.split('|').includes(c)));
    });
  }
})();
