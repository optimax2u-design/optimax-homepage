/* Optimax — Welcome screen. Standalone; touches nothing outside this page. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Start the entrance once fonts are ready (or after 700ms at most) so nothing jumps
  const go = () => requestAnimationFrame(() => root.classList.add('wl-ready'));
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 700))]).then(go);

  // "8s": smooth odometer-style roll from 1 to 8 (the HTML already shows 8 if this never runs)
  const col = document.querySelector('.wl-roll__col');
  if (!col || reduce) return;
  const target = 8;
  col.innerHTML = Array.from({ length: target }, (_, i) => `<span>${i + 1}</span>`).join('');
  const set = v => { col.style.transform = `translate3d(0, ${-v / target * 100}%, 0)`; };
  set(0);
  const ease = t => -(Math.cos(Math.PI * t) - 1) / 2;   // even glide so every number is readable
  const DUR = 2600;
  setTimeout(() => {
    let t0;
    const tick = t => {
      t0 ??= t;
      const k = Math.min(1, (t - t0) / DUR);
      set(ease(k) * (target - 1));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, 450);
})();
