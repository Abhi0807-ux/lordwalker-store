/* ===================================================================
   Lord Walker — shared site chrome behavior (header, drawer, reveal).
   Included on every page so the nav/footer never fall out of sync.
   Deliberately has NO dependency on product data or cart state —
   pages that need those (index.html, shop.html) define them locally.
   =================================================================== */

/* ===== Desktop "Shop" mega-menu — click-to-toggle fallback alongside hover ===== */
function toggleMegaMenu(e){
  const parent = document.getElementById('shop-mega-parent');
  const isOpen = parent.classList.contains('mega-open');
  // Only intercept the click on desktop widths — on mobile this link isn't visible anyway
  // (nav-links is hidden), but guard just in case.
  if (window.matchMedia('(min-width: 721px)').matches){
    e.preventDefault();
    parent.classList.toggle('mega-open', !isOpen);
    return false;
  }
  return true;
}
function closeMegaMenu(){
  const parent = document.getElementById('shop-mega-parent');
  if (parent) parent.classList.remove('mega-open');
}
document.addEventListener('click', function(e){
  const parent = document.getElementById('shop-mega-parent');
  if (parent && parent.classList.contains('mega-open') && !parent.contains(e.target)){
    parent.classList.remove('mega-open');
  }
});
document.addEventListener('keydown', function(e){
  if (e.key === 'Escape'){
    const parent = document.getElementById('shop-mega-parent');
    if (parent) parent.classList.remove('mega-open');
  }
});

/* ===== Mobile drawer ===== */
function openDrawer(){
  document.getElementById('lw-drawer').classList.add('open');
  document.getElementById('lw-overlay').classList.add('open');
  document.body.classList.add('lw-locked');
}
function closeDrawer(){
  document.getElementById('lw-drawer').classList.remove('open');
  document.getElementById('lw-overlay').classList.remove('open');
  document.body.classList.remove('lw-locked');
}
function showDrawerTab(idx){
  document.querySelectorAll('#lw-sidebar .lw-sidebar__label').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === String(idx));
  });
  document.querySelectorAll('#lw-panel .lw-panel__pane').forEach(pane => {
    pane.classList.toggle('active', pane.dataset.pane === String(idx));
  });
  document.getElementById('lw-panel').scrollTop = 0;
}

/* ===== Desktop inline search bar ===== */
function toggleSearchBar(){
  const bar = document.getElementById('lw-search-bar');
  bar.classList.toggle('open');
  if(bar.classList.contains('open')){
    setTimeout(() => document.getElementById('lw-search-input').focus(), 150);
  }
}

/* ===== Branded toast — for quick, non-blocking confirmations ===== */
let _toastTimer = null;
function showToast(message, duration){
  const el = document.getElementById('lw-toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.classList.remove('show'); }, duration || 2400);
}

/* ===== Scroll-reveal for any .reveal / .reveal-stagger element on the page ===== */
function initReveal(){
  const targets = document.querySelectorAll('.reveal:not(.in), .reveal-stagger:not(.in)');
  if(!('IntersectionObserver' in window)){
    targets.forEach(t => t.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(t => io.observe(t));
}
document.addEventListener('DOMContentLoaded', initReveal);
