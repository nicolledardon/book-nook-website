// Hamburger menu toggle
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');
const body = document.body;

if (navToggle && navLinks) {
  navToggle.addEventListener('click', function() {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', !isExpanded);
    
    // Toggle visibility of nav-links and overlay
    if (isExpanded) {
      navLinks.style.display = 'none';
      body.classList.remove('nav-open');
    } else {
      navLinks.style.display = 'flex';
      body.classList.add('nav-open');
    }
  });
  
  // Close menu when a link is clicked
  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', function() {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.style.display = 'none';
      body.classList.remove('nav-open');
    });
  });
  
  // Close menu when clicking the overlay
  document.addEventListener('click', function(event) {
    if (body.classList.contains('nav-open') && 
        !navToggle.contains(event.target) && 
        !navLinks.contains(event.target)) {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.style.display = 'none';
      body.classList.remove('nav-open');
    }
  });
}
