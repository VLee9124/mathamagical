// Page chrome: links, scroll progress, reveal-on-scroll, BibTeX copy.
(function () {
  // Fill these in as they go live. An empty string renders the button as "soon".
  const LINKS = {
    paper: 'https://arxiv.org/pdf/2611.19692',   // the PDF served by arXiv
    arxiv: 'https://arxiv.org/abs/2611.19692',
    poster: '',       // e.g. 'static/poster.pdf'
    code: '',         // 'https://github.com/HCAI-Lab-GT/mathamagical' once the repo is public
    checkpoints: 'https://huggingface.co/leejason2025/mathamagical-checkpoints',
    corpus: 'https://huggingface.co/datasets/leejason2025/mathamagical-3b-data',
  };

  document.querySelectorAll('[data-link]').forEach((a) => {
    const url = LINKS[a.dataset.link];
    if (url) { a.href = url; return; }
    a.setAttribute('aria-disabled', 'true');
    a.removeAttribute('href');
    const s = document.createElement('small');
    s.textContent = 'soon';
    a.append(s);
  });

  // Scroll progress + active nav link.
  const bar = document.getElementById('progress');
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href')));
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const frac = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    bar.style.width = frac * 100 + '%';
    let current = 0;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.4) current = i; });
    navLinks.forEach((a, i) => a.classList.toggle('active', i === current && scrollY > 200));
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal on scroll.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // BibTeX copy.
  const copy = document.getElementById('copy-bib');
  copy.addEventListener('click', async () => {
    const text = document.getElementById('bib').textContent;
    try { await navigator.clipboard.writeText(text); copy.textContent = 'Copied'; }
    catch (e) { copy.textContent = 'Select and copy'; }
    setTimeout(() => { copy.textContent = 'Copy BibTeX'; }, 1600);
  });
})();
