// ============================================================
// Book Nook — main.js
// One file, one function per interaction (PEC 5). Every init
// function checks that its elements exist before doing anything,
// so pages that don't have that markup see no console errors.
// ============================================================

function initMobileNav() {
  // Hamburger menu toggle
  // Visibility is driven entirely by CSS (body.is-nav-open .nav-links) —
  // JS only toggles the class and the aria-expanded state. Setting
  // navLinks.style.display directly here would fight the mobile
  // stylesheet's ".nav-links { display: none }" rule on specificity
  // terms (an inline style normally wins on specificity alone, which
  // is exactly why the menu broke before this fix — the class-based
  // approach avoids the fight instead of using !important to force it).
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const body = document.body;

  if (!navToggle || !navLinks) return;

  navToggle.addEventListener('click', function () {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', !isExpanded);
    body.classList.toggle('is-nav-open', !isExpanded);
  });

  // Close menu when a link is clicked
  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', function () {
      navToggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('is-nav-open');
    });
  });

  // Close menu when clicking the overlay
  document.addEventListener('click', function (event) {
    if (body.classList.contains('is-nav-open') &&
        !navToggle.contains(event.target) &&
        !navLinks.contains(event.target)) {
      navToggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('is-nav-open');
    }
  });
}

function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  const MOBILE_MAX_WIDTH = 768; // matches the CSS breakpoint; mobile never hides
  const HIDE_THRESHOLD = 5;     // px scrolled down before hiding
  const SHOW_THRESHOLD = 10;    // px scrolled up before showing again (stops trackpad jitter)

  let lastScrollY = Math.max(window.scrollY, 0);
  let focusInHeader = false;
  let ticking = false;

  header.addEventListener('focusin', function () { focusInHeader = true; });
  header.addEventListener('focusout', function () { focusInHeader = false; });

  function show() {
    header.classList.remove('header--hidden');
  }

  function update() {
    ticking = false;

    // iPhone's rubber-band bounce can report negative scrollY — treat as 0.
    const currentScrollY = Math.max(window.scrollY, 0);
    const delta = currentScrollY - lastScrollY;

    const isMobile = window.innerWidth <= MOBILE_MAX_WIDTH;
    const menuOpen = document.body.classList.contains('is-nav-open');
    const nearTop = currentScrollY <= header.offsetHeight;

    if (isMobile || menuOpen || focusInHeader || nearTop) {
      show();
    } else if (delta > HIDE_THRESHOLD) {
      header.classList.add('header--hidden');
    } else if (delta < -SHOW_THRESHOLD) {
      show();
    }
    // else: movement too small, change nothing

    lastScrollY = currentScrollY;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });
}

function initWaitlistForm() {
  // Phase 3: waitlist validation + confirmation.
}

function initMoodFilter() {
  // Phase 4: mood-based Explore filter.
}

function initAnchorNav() {
  // Phase 5: Features anchor navigation.
}

function initJournalFilter() {
  // Phase 6: Journal category filter.
}

initMobileNav();
initHeaderScroll();
initWaitlistForm();
initMoodFilter();
initAnchorNav();
initJournalFilter();
