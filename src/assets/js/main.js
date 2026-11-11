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
  addEventListener('keydown', e => { if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); } });
  // Rotating a tablet / widening the window past the menu breakpoint closes the menu so the page never stays locked
  const wide = matchMedia('(min-width: 961px)');
  (wide.addEventListener ? wide.addEventListener('change', e => e.matches && setMenu(false)) : wide.addListener(e => e.matches && setMenu(false)));

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
        if (!reduce) { result.classList.remove('swap'); void result.offsetWidth; result.classList.add('swap'); }
  };
  chips.forEach((c, i) => {
    c.addEventListener('click', () => select(c));
    c.addEventListener('keydown', e => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); select(chips[(i + k + chips.length) % chips.length], true); }
    });
  });
  // Doctors scroller buttons
  const sc = $('#doctor-scroller');
  $$('[data-scroll]').forEach(b => b.addEventListener('click', () => {
    sc.scrollBy({ left: Number(b.dataset.scroll) * sc.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });
  }));

  // Floating WhatsApp: if the respond.io widget renders its own button, hide our copy so only one shows
  const waFloat = $('.wa-float');
  if (waFloat) {
    let tries = 0;
    const live = () => { const w = document.querySelector('respond-io-widget'); return !!(w && w.shadowRoot && w.shadowRoot.querySelector('.speed-dial')); };
    const t = setInterval(() => { if (live()) { waFloat.hidden = true; clearInterval(t); } else if (++tries > 40) clearInterval(t); }, 250);
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
