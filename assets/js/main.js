(function(){
  const btn = document.querySelector('[data-menu-btn]');
  const menu = document.querySelector('[data-menu]');
  if(btn && menu){
    btn.addEventListener('click', () => menu.classList.toggle('open'));
  }

  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.menu a').forEach(a=>{
    const href = (a.getAttribute('href') || '').toLowerCase();
    if(href === path) a.classList.add('active');
  });

  const buildEl = document.querySelector('[data-build]');
  if(buildEl){
    const d = new Date();
    const pad = n => String(n).padStart(2,'0');
    buildEl.textContent = `Build ${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // Simple reveal
  const els = document.querySelectorAll('.fade-in');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting) e.target.classList.add('show');
    });
  }, { threshold: 0.08 });
  els.forEach(el=>io.observe(el));
})();
