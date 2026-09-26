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

if (navToggle && navLinks) {
  navToggle.addEventListener('click', function() {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', !isExpanded);
    body.classList.toggle('is-nav-open', !isExpanded);
  });
  
  // Close menu when a link is clicked
  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', function() {
      navToggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('is-nav-open');
    });
  });
  
  // Close menu when clicking the overlay
  document.addEventListener('click', function(event) {
    if (body.classList.contains('is-nav-open') && 
        !navToggle.contains(event.target) && 
        !navLinks.contains(event.target)) {
      navToggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('is-nav-open');
    }
  });
}
