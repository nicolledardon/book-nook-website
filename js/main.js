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

  // Only present on features.html -- every other page simply never docks it.
  const anchorNav = document.querySelector('.anchor-buttons');

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
    if (anchorNav) anchorNav.classList.remove('is-docked');
  }

  function hide() {
    header.classList.add('header--hidden');
    // Moves the sticky anchor nav up by the header's own height so it
    // closes the gap left behind, instead of floating with empty space
    // above it where the header used to be.
    if (anchorNav) anchorNav.classList.add('is-docked');
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
      hide();
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
  const form = document.querySelector('.signup__form');
  if (!form) return;

  const input = document.getElementById('email');
  const error = document.getElementById('email-error');
  const submitButton = form.querySelector('.signup__submit');
  const queueBadge = document.querySelector('.queue-badge');
  const ticketCode = document.querySelector('.ticket__code');
  const signupPanel = document.querySelector('.signup__panel');
  const confirmationPanel = document.querySelector('.confirmation-panel');
  const ticketHeading = document.querySelector('.ticket__heading');
  let hasAttemptedSubmit = false;

  function getError() {
    const value = input.value;
    if (value === '') {
      return 'Please enter your email address';
    }
    // A simple shape check (something@something.something), not a full
    // RFC 5322 regex — good enough to catch typos without being
    // stricter than real-world email addresses actually are.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "That doesn't look like an email address";
    }
    return '';
  }

  function showError(message) {
    error.textContent = message;
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    input.setAttribute('aria-invalid', 'true');
  }

  function showValid() {
    error.textContent = '';
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    input.setAttribute('aria-invalid', 'false');
  }

  function revalidate() {
    const message = getError();
    if (message) {
      showError(message);
    } else {
      showValid();
    }
    return message === '';
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    input.value = input.value.trim();
    hasAttemptedSubmit = true;

    const isValid = revalidate();
    if (!isValid) return;

    if (submitButton) {
      submitButton.disabled = true;
    }

    // Generate one random queue number (1,000-3,000) that drives both
    // the queue badge and the ticket code, e.g. #1,847 and BN-2026-1847.
    // queueBadge/ticketCode/signupPanel/confirmationPanel/ticketHeading are
    // cached once above with input/error/submitButton, rather than queried
    // fresh on every submit -- they never change between calls.
    const queueNumber = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
    const year = new Date().getFullYear();

    if (queueBadge) {
      queueBadge.textContent = "You're #" + queueNumber.toLocaleString('en-US') + ' in line';
    }
    if (ticketCode) {
      ticketCode.textContent = 'BN-' + year + '-' + queueNumber;
    }

    if (signupPanel) signupPanel.hidden = true;
    if (confirmationPanel) confirmationPanel.hidden = false;

    window.scrollTo(0, 0);
    if (ticketHeading) ticketHeading.focus();
  });

  // Only re-check while typing after a failed attempt, so someone isn't
  // shown "please enter your email" while they're still typing it the
  // first time around.
  input.addEventListener('input', function () {
    if (!hasAttemptedSubmit) return;
    revalidate();
  });
}

function filterCards(cardList, datasetKey, value) {
  // Generic show/hide filter — takes the dataset key as a parameter (rather
  // than hardcoding .dataset.moods) so Phase 6's Journal filter can reuse
  // this same function with a different attribute (e.g. "category").
  // Toggles the native `hidden` attribute instead of a CSS class, so the
  // accessibility tree skips hidden cards automatically — no extra
  // aria-hidden bookkeeping needed on top of it.
  let visibleCount = 0;
  cardList.forEach(function (card) {
    const values = (card.dataset[datasetKey] || '').split(' ');
    const matches = values.includes(value);
    card.hidden = !matches;
    if (matches) visibleCount += 1;
  });
  return visibleCount;
}

function setSelectedChip(chipList, selectedChip) {
  // Single-select behaviour: clicking a chip selects only that one and
  // resets every other chip in the group. aria-pressed reports the toggle
  // state to assistive tech; is-selected drives the visual highlight.
  chipList.forEach(function (chip) {
    const isSelected = chip === selectedChip;
    chip.classList.toggle('is-selected', isSelected);
    chip.setAttribute('aria-pressed', String(isSelected));
  });
}

function announce(liveRegion, message) {
  // Writes into the sr-only aria-live="polite" region so screen reader
  // users hear the filter result — sighted users already see the book
  // grid change, but that visual-only change is invisible without this.
  liveRegion.textContent = message;
}

function applyMoodFilter(chip, chipList, cardList, status) {
  // Shared by the click handler and the on-load default below, so the
  // "select a chip, filter the cards, announce the result" sequence only
  // has to be written (and fixed, if it ever needs fixing) once.
  const mood = chip.dataset.mood;
  setSelectedChip(chipList, chip);
  const visibleCount = filterCards(cardList, 'moods', mood);

  if (status) {
    const label = chip.textContent.trim();
    const bookWord = visibleCount === 1 ? 'book' : 'books';
    announce(status, `Showing ${visibleCount} ${bookWord} for ${label}`);
  }
}

function clearMoodFilter(chipList, cardList, status) {
  // Counterpart to applyMoodFilter() — used when the already-selected chip
  // is clicked again. Passing null reuses setSelectedChip's own loop to
  // deselect every chip, since chip === null is never true for any chip.
  setSelectedChip(chipList, null);
  cardList.forEach(function (card) {
    card.hidden = false;
  });

  if (status) {
    announce(status, `Showing all ${cardList.length} books`);
  }
}

function initMoodFilter() {
  // Phase 4: mood-based Explore filter.
  const chips = document.querySelectorAll('.mood-chip');
  const cards = document.querySelectorAll('.mood-browse .book-card');
  const status = document.querySelector('.mood-browse__status');

  if (!chips.length || !cards.length) return;

  const chipList = Array.prototype.slice.call(chips);
  const cardList = Array.prototype.slice.call(cards);

  chipList.forEach(function (chip) {
    chip.addEventListener('click', function () {
      if (chip.classList.contains('is-selected')) {
        clearMoodFilter(chipList, cardList, status);
      } else {
        applyMoodFilter(chip, chipList, cardList, status);
      }
    });
  });

  // The HTML ships with the Cozy chip already marked is-selected /
  // aria-pressed="true" — apply that filter on load so the grid matches
  // what the chip visually claims, instead of showing all 9 cards under a
  // chip that looks active. Reads the default from the markup rather than
  // hardcoding 'cozy', so changing which chip ships pre-selected needs no
  // JS edit.
  const defaultChip = chipList.find(function (chip) {
    return chip.classList.contains('is-selected');
  });

  if (defaultChip) {
    applyMoodFilter(defaultChip, chipList, cardList, status);
  }
}

function initAnchorNav() {
  // Phase 5: Features anchor navigation.
  const blocks = document.querySelectorAll('.feature-block');
  const anchorButtons = document.querySelectorAll('.anchor-button');

  if (!blocks.length || !anchorButtons.length) return;

  const buttonList = Array.prototype.slice.call(anchorButtons);

  function setActiveButton(id) {
    buttonList.forEach(function (button) {
      const isActive = button.getAttribute('href') === '#' + id;
      button.classList.toggle('is-active', isActive);
      if (isActive) {
        button.setAttribute('aria-current', 'location');
      } else {
        button.removeAttribute('aria-current');
      }
    });
  }

  buttonList.forEach(function (button) {
    button.addEventListener('click', function () {
      // Instant feedback on click, rather than waiting for the smooth
      // scroll to finish and the observer below to catch up -- also
      // covers the edge case where the last block might never fully
      // cross the observer's center-crossing zone on a short viewport.
      const targetId = button.getAttribute('href').slice(1);
      setActiveButton(targetId);
    });
  });

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        setActiveButton(entry.target.id);
      }
    });
  }, {
    // Shrinks the effective viewport to its middle 20% (-40% off the top
    // and bottom), so a block only counts as "current" once it crosses
    // near the center of the screen -- not the instant its edge appears,
    // which would flicker between two adjacent blocks near the boundary.
    rootMargin: '-40% 0px -40% 0px'
  });

  blocks.forEach(function (block) {
    observer.observe(block);
  });
}

function setSelectedTab(tabList, selectedTab, panel) {
  // Tabs-specific counterpart to setSelectedChip(): uses aria-selected (the
  // correct attribute for role="tab", vs. aria-pressed for toggle buttons
  // like the mood chips) and roving tabindex (selected tab gets tabindex=0,
  // the rest -1), and repoints the shared results panel's aria-labelledby
  // at whichever tab is now active.
  tabList.forEach(function (tab) {
    const isSelected = tab === selectedTab;
    tab.classList.toggle('is-selected', isSelected);
    tab.setAttribute('aria-selected', String(isSelected));
    tab.setAttribute('tabindex', isSelected ? '0' : '-1');
  });

  if (panel && selectedTab) {
    panel.setAttribute('aria-labelledby', selectedTab.id);
  }
}

function applyJournalFilter(tab, tabList, postList, status, panel) {
  // Reuses filterCards() and announce() from Phase 4's mood filter, but
  // uses setSelectedTab() (not setSelectedChip()) since these are real
  // ARIA tabs now, not toggle buttons.
  const category = tab.dataset.category;
  setSelectedTab(tabList, tab, panel);

  let visibleCount;
  if (category === 'all') {
    // filterCards() expects a real dataset value to match against; no post
    // has data-category="all", so "All" is handled directly here instead.
    postList.forEach(function (post) { post.hidden = false; });
    visibleCount = postList.length;
  } else {
    visibleCount = filterCards(postList, 'category', category);
  }

  if (status) {
    const label = tab.textContent.trim();
    const postWord = visibleCount === 1 ? 'post' : 'posts';
    announce(status, `Showing ${visibleCount} ${postWord} in ${label}`);
  }
}

function initJournalFilter() {
  // Phase 6 + tabs retrofit: real ARIA tabs (role="tablist"/"tab",
  // aria-selected, roving tabindex, arrow-key navigation) instead of
  // toggle buttons. The Explore mood chips are a genuine filter, not
  // tabs, and are untouched -- they keep aria-pressed and setSelectedChip().
  const tablist = document.querySelector('.category-tabs');
  const tabs = document.querySelectorAll('.tab');
  const posts = document.querySelectorAll('.post-card');
  const status = document.querySelector('.journal__status');
  const panel = document.querySelector('.post-grid');

  if (!tablist || !tabs.length || !posts.length) return;

  const tabList = Array.prototype.slice.call(tabs);
  const postList = Array.prototype.slice.call(posts);

  tabList.forEach(function (tab) {
    tab.addEventListener('click', function () {
      applyJournalFilter(tab, tabList, postList, status, panel);
    });
  });

  // Roving-tabindex arrow-key navigation, per the WAI-ARIA Tabs pattern:
  // Left/Right cycle through tabs (wrapping at the ends), Home/End jump to
  // the first/last tab, and moving focus also activates the tab immediately
  // ("automatic activation") -- matches the existing click-to-filter
  // behavior instead of requiring a separate Enter/Space press.
  tablist.addEventListener('keydown', function (event) {
    const currentIndex = tabList.indexOf(document.activeElement);
    if (currentIndex === -1) return;

    let targetIndex = null;
    if (event.key === 'ArrowRight') {
      targetIndex = (currentIndex + 1) % tabList.length;
    } else if (event.key === 'ArrowLeft') {
      targetIndex = (currentIndex - 1 + tabList.length) % tabList.length;
    } else if (event.key === 'Home') {
      targetIndex = 0;
    } else if (event.key === 'End') {
      targetIndex = tabList.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const targetTab = tabList[targetIndex];
    targetTab.focus();
    applyJournalFilter(targetTab, tabList, postList, status, panel);
  });

  // "All" ships pre-selected in the HTML -- apply it on load so the grid
  // matches what the tab bar already shows, same reasoning as Phase 4's
  // default-to-Cozy fix.
  const defaultTab = tabList.find(function (tab) {
    return tab.classList.contains('is-selected');
  });

  if (defaultTab) {
    applyJournalFilter(defaultTab, tabList, postList, status, panel);
  }
}

function initFaqAccordion() {
  // About page FAQ. Single-open: opening one item closes whichever other
  // one was open, same pattern as the mood chips / journal tabs above.
  const questions = document.querySelectorAll('.faq__question');
  if (!questions.length) return;

  const questionList = Array.prototype.slice.call(questions);

  questionList.forEach(function (question) {
    question.addEventListener('click', function () {
      const isOpen = question.getAttribute('aria-expanded') === 'true';

      questionList.forEach(function (other) {
        if (other === question) return;
        other.setAttribute('aria-expanded', 'false');
        const otherAnswer = document.getElementById(other.getAttribute('aria-controls'));
        if (otherAnswer) otherAnswer.hidden = true;
      });

      question.setAttribute('aria-expanded', String(!isOpen));
      const answer = document.getElementById(question.getAttribute('aria-controls'));
      if (answer) answer.hidden = isOpen;
    });
  });
}

initMobileNav();
initHeaderScroll();
initWaitlistForm();
initMoodFilter();
initAnchorNav();
initJournalFilter();
initFaqAccordion();
