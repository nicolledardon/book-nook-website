// Book Nook — main.js
// Every init function checks that its elements exist before doing anything,
// so pages that don't have that markup see no console errors.
// Every event listener is a named function (handleXxx), so each one can be
// found, read and removed by name instead of being an anonymous callback.

function initMobileNav() {
  // Hamburger menu toggle
  // Visibility is driven entirely by CSS (body.is-nav-open .nav__links) —
  // JS only toggles the class and the aria-expanded state

  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  const body = document.body;

  if (!navToggle || !navLinks) return;

  function setNavOpen(isOpen) {
    navToggle.setAttribute('aria-expanded', String(isOpen));
    body.classList.toggle('is-nav-open', isOpen);
  }

  function handleNavToggleClick() {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    setNavOpen(!isExpanded);
  }

  // Close menu when a link is clicked
  function handleNavLinkClick() {
    setNavOpen(false);
  }

  // Close menu when clicking the overlay (anywhere outside the toggle + menu)
  function handleNavOutsideClick(event) {
    if (body.classList.contains('is-nav-open') &&
        !navToggle.contains(event.target) &&
        !navLinks.contains(event.target)) {
      setNavOpen(false);
    }
  }

  navToggle.addEventListener('click', handleNavToggleClick);

  const links = navLinks.querySelectorAll('a');
  links.forEach(function (link) {
    link.addEventListener('click', handleNavLinkClick);
  });

  document.addEventListener('click', handleNavOutsideClick);
}

function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  // Only present on features.html - every other page simply never docks it.
  const anchorNav = document.querySelector('.anchor-nav');

  const MOBILE_MAX_WIDTH = 768; // matches the CSS breakpoint; mobile never hides
  const HIDE_THRESHOLD = 5;     // px scrolled down before hiding
  const SHOW_THRESHOLD = 10;    // px scrolled up before showing again (stops trackpad jitter)

  let lastScrollY = Math.max(window.scrollY, 0);
  let focusInHeader = false;
  let ticking = false;

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

  function updateHeaderVisibility() {
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

  function handleHeaderFocusIn() {
    focusInHeader = true;
  }

  function handleHeaderFocusOut() {
    focusInHeader = false;
  }

  // Scroll fires many times per frame; this only schedules one update per frame.
  function handleHeaderScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderVisibility);
      ticking = true;
    }
  }

  header.addEventListener('focusin', handleHeaderFocusIn);
  header.addEventListener('focusout', handleHeaderFocusOut);
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
}

function initWaitlistForm() {
  const form = document.querySelector('.signup__form');
  if (!form) return;

  const input = document.getElementById('email');
  const error = document.getElementById('email-error');
  const submitButton = form.querySelector('.signup__submit');
  const badgeLabel = document.querySelector('.ticket__badge-label');
  const badgeCount = document.querySelector('.ticket__count');
  const ticket = document.querySelector('.ticket');
  const ticketBarcode = document.querySelector('.ticket__barcode');
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

  function handleWaitlistSubmit(event) {
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

    // The screen-reader label gets the final text at once; the visible badge
    // counts up from 0 (see printTicket below), so nobody hears a half-way number.
    if (badgeLabel) {
      badgeLabel.textContent = "You're #" + queueNumber.toLocaleString('en-US') + ' in line';
    }
    if (ticketCode) {
      ticketCode.textContent = 'BN-' + year + '-' + queueNumber;
    }
    if (ticketBarcode) {
      drawBarcode(ticketBarcode, queueNumber);
    }

    if (signupPanel) signupPanel.hidden = true;
    if (confirmationPanel) confirmationPanel.hidden = false;

    window.scrollTo(0, 0);
    if (ticketHeading) ticketHeading.focus();
    printTicket(queueNumber);
  }

  // Barcode (J7): one <rect> per bar, with widths and gaps drawn from a small
  // seeded random generator, so the same queue number always gives the same
  // barcode. Lives in the viewBox 0 0 88 48 the old static barcode used.
  function drawBarcode(svg, seed) {
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const WIDTH = 88;
    let state = seed;

    function nextRandom() {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    }

    while (svg.firstChild) svg.removeChild(svg.firstChild);

    let x = 0;
    while (x < WIDTH) {
      const barWidth = 1 + Math.floor(nextRandom() * 3);  // 1 to 3 units
      const gapWidth = 1 + Math.floor(nextRandom() * 2);  // 1 to 2 units
      if (x + barWidth > WIDTH) break;
      const bar = document.createElementNS(SVG_NS, 'rect');
      bar.setAttribute('x', String(x));
      bar.setAttribute('width', String(barWidth));
      bar.setAttribute('height', '48');
      svg.appendChild(bar);
      x += barWidth + gapWidth;
    }
  }

  // Ticket print (J7): the CSS animation reveals the ticket; this counts the
  // queue number up from 0 in step with it. With reduced motion the final
  // number is shown straight away and nothing animates.
  function printTicket(queueNumber) {
    if (!badgeCount) return;
    const finalText = queueNumber.toLocaleString('en-US');

    if (prefersReducedMotion() || !ticket) {
      badgeCount.textContent = finalText;
      return;
    }

    const DURATION_MS = 1100;
    const startTime = performance.now();
    badgeCount.textContent = '0';

    function handleCountFrame(now) {
      const progress = Math.min(1, (now - startTime) / DURATION_MS);
      const eased = 1 - Math.pow(1 - progress, 3); // fast start, slow finish
      badgeCount.textContent = Math.round(queueNumber * eased).toLocaleString('en-US');
      if (progress < 1) window.requestAnimationFrame(handleCountFrame);
    }

    function handleTicketAnimationEnd() {
      ticket.classList.remove('is-printing');
      ticket.removeEventListener('animationend', handleTicketAnimationEnd);
    }

    ticket.addEventListener('animationend', handleTicketAnimationEnd);
    ticket.classList.remove('is-printing');
    void ticket.offsetWidth; // restart the animation if the ticket was printed before
    ticket.classList.add('is-printing');
    window.requestAnimationFrame(handleCountFrame);
  }

  // Only re-check while typing after a failed attempt, so someone isn't
  // shown "please enter your email" while they're still typing it the
  // first time around.
  function handleEmailInput() {
    if (!hasAttemptedSubmit) return;
    revalidate();
  }

  form.addEventListener('submit', handleWaitlistSubmit);
  input.addEventListener('input', handleEmailInput);
}

function setFilterClass(container, prefix, value) {
  // Container pattern: a filter is ONE class on the grid, e.g.
  // .book-row--mood-cozy, and CSS hides the cards that don't match it
  // (see "FILTER MODIFIERS" in layout.css). JS never touches the cards.
  // Removes whichever "<prefix>-*" class was set before, then adds the new
  // one; passing a falsy value clears the filter (all cards show).
  Array.prototype.slice.call(container.classList).forEach(function (name) {
    if (name.indexOf(prefix + '-') === 0) container.classList.remove(name);
  });
  if (value) container.classList.add(prefix + '-' + value);
}

function countMatches(container, itemSelector, attribute, value) {
  // Read-only: counts the cards CSS is currently showing, for the
  // screen-reader announcement. Space-separated attribute lists work
  // because [attr~="value"] matches one whole word in the list.
  return container.querySelectorAll(itemSelector + '[' + attribute + '~="' + value + '"]').length;
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

function initMoodFilter() {
  // mood-based Explore filter.
  const chips = document.querySelectorAll('.mood-chip');
  const grid = document.querySelector('.mood-browse .book-row');
  const status = document.querySelector('.mood-browse__status');

  if (!chips.length || !grid) return;

  const chipList = Array.prototype.slice.call(chips);
  const totalCount = grid.querySelectorAll('.book-card').length;

  // FLIP mood filter (J5). Keeping the one-class-on-the-grid pattern, the
  // motion is added around it with the Web Animations API:
  //   1. cards that don't match shrink and fade out (still in place),
  //   2. the filter class is applied, so CSS removes them and the grid reflows,
  //   3. cards that stay glide from their old position to the new one (FLIP:
  //      First rect, Last rect, Invert with a transform, Play it back),
  //   4. cards that come back fade in.
  // A new click cancels whatever is still running. Reduced motion skips it.
  const EXIT_MS = 160;
  const MOVE_MS = 380;
  const ENTER_MS = 260;
  let runId = 0;
  let runningAnimations = [];

  function isShown(card) {
    return window.getComputedStyle(card).display !== 'none';
  }

  function cardMatches(card, mood) {
    return !mood || card.dataset.moods.split(' ').indexOf(mood) !== -1;
  }

  function track(animation) {
    runningAnimations.push(animation);
    return animation;
  }

  function cancelRunningAnimations() {
    runningAnimations.forEach(function (animation) {
      animation.cancel();
    });
    runningAnimations = [];
  }

  function setMoodFilter(mood, animate) {
    runId += 1;
    const thisRun = runId;
    cancelRunningAnimations();

    if (!animate || prefersReducedMotion() || !grid.animate) {
      setFilterClass(grid, 'book-row--mood', mood);
      return;
    }

    const cards = Array.prototype.slice.call(grid.querySelectorAll('.book-card'));
    const shown = cards.filter(isShown);
    const leaving = shown.filter(function (card) { return !cardMatches(card, mood); });
    const staying = shown.filter(function (card) { return cardMatches(card, mood); });
    const entering = cards.filter(function (card) {
      return !isShown(card) && cardMatches(card, mood);
    });
    const firstRects = staying.map(function (card) { return card.getBoundingClientRect(); });

    const exits = leaving.map(function (card) {
      return track(card.animate(
        [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.92)' }],
        { duration: EXIT_MS, easing: 'ease-in', fill: 'forwards' }
      ));
    });

    function handleExitsDone() {
      if (thisRun !== runId) return; // a newer click took over
      exits.forEach(function (animation) { animation.cancel(); });
      setFilterClass(grid, 'book-row--mood', mood);

      staying.forEach(function (card, index) {
        const last = card.getBoundingClientRect();
        const dx = firstRects[index].left - last.left;
        const dy = firstRects[index].top - last.top;
        if (!dx && !dy) return;
        track(card.animate(
          [{ transform: 'translate(' + dx + 'px, ' + dy + 'px)' }, { transform: 'none' }],
          { duration: MOVE_MS, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' }
        ));
      });

      entering.forEach(function (card) {
        track(card.animate(
          [{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'scale(1)' }],
          { duration: ENTER_MS, delay: 120, easing: 'ease-out', fill: 'backwards' }
        ));
      });
    }

    Promise.all(exits.map(function (animation) { return animation.finished; }))
      .then(handleExitsDone, handleExitsDone);
  }

  function applyMoodFilter(chip, animate) {
    // Shared by the click handler and the on-load default below, so the
    // "select a chip, filter the cards, announce the result" sequence only
    // has to be written (and fixed, if it ever needs fixing) once.
    const mood = chip.dataset.mood;
    setSelectedChip(chipList, chip);
    setMoodFilter(mood, animate);

    if (status) {
      const visibleCount = countMatches(grid, '.book-card', 'data-moods', mood);
      const label = chip.textContent.trim();
      const bookWord = visibleCount === 1 ? 'book' : 'books';
      announce(status, `Showing ${visibleCount} ${bookWord} for ${label}`);
    }
  }

  function clearMoodFilter() {
    // Counterpart to applyMoodFilter() — used when the already-selected chip
    // is clicked again. Passing null reuses setSelectedChip's own loop to
    // deselect every chip, since chip === null is never true for any chip.
    setSelectedChip(chipList, null);
    setMoodFilter(null, true);

    if (status) {
      announce(status, `Showing all ${totalCount} books`);
    }
  }

  function handleMoodChipClick(event) {
    const chip = event.currentTarget;
    if (chip.classList.contains('is-selected')) {
      clearMoodFilter();
    } else {
      applyMoodFilter(chip, true);
    }
  }

  chipList.forEach(function (chip) {
    chip.addEventListener('click', handleMoodChipClick);
  });

  // The HTML ships with the Cozy chip already marked is-selected /
  // aria-pressed="true" and the grid already carrying .book-row--mood-cozy,
  // so the page is correct before this script runs. Re-applying here keeps
  // the screen-reader status text in sync, and reads the default from the
  // markup rather than hardcoding 'cozy'.
  const defaultChip = chipList.find(function (chip) {
    return chip.classList.contains('is-selected');
  });

  if (defaultChip) {
    applyMoodFilter(defaultChip, false);
  }
}

function initAnchorNav() {
  // Features anchor navigation.
  const blocks = document.querySelectorAll('.feature-block');
  const anchorLinks = document.querySelectorAll('.anchor-nav__link');

  if (!blocks.length || !anchorLinks.length) return;

  const linkList = Array.prototype.slice.call(anchorLinks);

  // Phone layout: the links live in a dropdown opened by a toggle button
  // (CSS shows the toggle at <=768px; on desktop it is hidden and these
  // handlers never fire). The toggle's label mirrors the section in view.
  const nav = document.querySelector('.anchor-nav');
  const toggle = document.getElementById('anchor-toggle');
  const currentLabel = document.querySelector('.anchor-nav__current');

  function setMenuOpen(isOpen) {
    if (!nav || !toggle) return;
    nav.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  }

  function handleAnchorToggleClick() {
    setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true');
  }

  function handleAnchorOutsideClick(event) {
    if (nav.classList.contains('is-open') && !nav.contains(event.target)) {
      setMenuOpen(false);
    }
  }

  function handleAnchorEscape(event) {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setMenuOpen(false);
      toggle.focus();
    }
  }

  function setActiveLink(id) {
    linkList.forEach(function (link) {
      const isActive = link.getAttribute('href') === '#' + id;
      link.classList.toggle('is-active', isActive);
      if (isActive) {
        if (currentLabel) currentLabel.textContent = link.textContent.trim();
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function handleAnchorLinkClick(event) {
    // Instant feedback on click, rather than waiting for the smooth
    // scroll to finish and the observer below to catch up - also
    // covers the edge case where the last block might never fully
    // cross the observer's center-crossing zone on a short viewport.
    const targetId = event.currentTarget.getAttribute('href').slice(1);
    setActiveLink(targetId);
    setMenuOpen(false);
  }

  function handleBlockIntersect(entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        setActiveLink(entry.target.id);
      }
    });
  }

  if (nav && toggle) {
    toggle.addEventListener('click', handleAnchorToggleClick);
    document.addEventListener('click', handleAnchorOutsideClick);
    document.addEventListener('keydown', handleAnchorEscape);
  }

  linkList.forEach(function (link) {
    link.addEventListener('click', handleAnchorLinkClick);
  });

  const observer = new IntersectionObserver(handleBlockIntersect, {
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

function initJournalFilter() {
  // tabs retrofit: real ARIA tabs (role="tablist"/"tab",
  // aria-selected, roving tabindex, arrow-key navigation) instead of
  // toggle buttons. The Explore mood chips are a genuine filter, not
  // tabs, and are untouched -- they keep aria-pressed and setSelectedChip().
  const tablist = document.querySelector('.category-tabs');
  const tabs = document.querySelectorAll('.category-tabs__tab');
  const grid = document.querySelector('.post-grid__list');
  const status = document.querySelector('.journal__status');
  const panel = document.querySelector('.post-grid');

  if (!tablist || !tabs.length || !grid) return;

  const tabList = Array.prototype.slice.call(tabs);
  const totalCount = grid.querySelectorAll('.post-card').length;

  // Sliding pill (J6): measure the selected tab and hand the numbers to CSS
  // as custom properties on the bar. CSS does the actual sliding.
  function movePill(tab) {
    tablist.style.setProperty('--pill-x', tab.offsetLeft + 'px');
    tablist.style.setProperty('--pill-width', tab.offsetWidth + 'px');
    tablist.classList.add('has-pill');
  }

  function handleTabResize() {
    const selected = tabList.find(function (tab) {
      return tab.classList.contains('is-selected');
    });
    if (selected) movePill(selected);
  }

  function applyJournalFilter(tab) {
    // Same container pattern as the mood filter: one class on the grid
    // (.post-grid__list--category-design), CSS does the hiding. "All" has no
    // matching data-category on any post, so it simply clears the class.
    const category = tab.dataset.category;
    const isAll = category === 'all';
    setSelectedTab(tabList, tab, panel);
    movePill(tab);
    setFilterClass(grid, 'post-grid__list--category', isAll ? null : category);

    if (status) {
      const visibleCount = isAll
        ? totalCount
        : countMatches(grid, '.post-card', 'data-category', category);
      const label = tab.textContent.trim();
      const postWord = visibleCount === 1 ? 'post' : 'posts';
      announce(status, `Showing ${visibleCount} ${postWord} in ${label}`);
    }
  }

  function handleTabClick(event) {
    applyJournalFilter(event.currentTarget);
  }

  // Roving-tabindex arrow-key navigation, per the WAI-ARIA Tabs pattern:
  // Left/Right cycle through tabs (wrapping at the ends), Home/End jump to
  // the first/last tab, and moving focus also activates the tab immediately
  // ("automatic activation") - matches the existing click-to-filter
  // behavior instead of requiring a separate Enter/Space press.
  function handleTabKeydown(event) {
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
    applyJournalFilter(targetTab);
  }

  tabList.forEach(function (tab) {
    tab.addEventListener('click', handleTabClick);
  });
  tablist.addEventListener('keydown', handleTabKeydown);
  window.addEventListener('resize', handleTabResize);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(handleTabResize); // web-font widths differ from the fallback font's
  }

  // "All" ships pre-selected in the HTML - apply it on load so the status
  // text and aria state match what the tab bar already shows, same
  // reasoning as the mood filter's default-to-Cozy.
  const defaultTab = tabList.find(function (tab) {
    return tab.classList.contains('is-selected');
  });

  if (defaultTab) {
    applyJournalFilter(defaultTab);
  }
}

function initFaqAccordion() {
  // About page FAQ. Single-open: opening one item closes whichever other
  // one was open, same pattern as the mood chips / journal tabs above.
  // The open/closed look is one class on the item (.is-open); CSS animates
  // the answer's height with grid-template-rows, so JS never touches styles.
  const questions = document.querySelectorAll('.faq__question');
  if (!questions.length) return;

  const questionList = Array.prototype.slice.call(questions);

  function setFaqItemOpen(question, isOpen) {
    question.setAttribute('aria-expanded', String(isOpen));
    const item = question.closest('.faq__item');
    if (item) item.classList.toggle('is-open', isOpen);
  }

  function handleFaqClick(event) {
    const question = event.currentTarget;
    const wasOpen = question.getAttribute('aria-expanded') === 'true';

    questionList.forEach(function (other) {
      if (other !== question) setFaqItemOpen(other, false);
    });

    setFaqItemOpen(question, !wasOpen);
  }

  questionList.forEach(function (question) {
    question.addEventListener('click', handleFaqClick);
  });
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initHeroHeadline() {
  // Home hero (J10): wrap every word of the h1 in a span so CSS can stagger
  // them. Spaces stay as plain text nodes, so wrapping and screen-reader
  // output are unchanged.
  const title = document.querySelector('.intro__title');
  if (!title || prefersReducedMotion()) return;

  const walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  let wordIndex = 0;
  textNodes.forEach(function (node) {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        return;
      }
      const word = document.createElement('span');
      word.className = 'intro__word';
      word.style.setProperty('--word-index', wordIndex);
      word.textContent = part;
      wordIndex += 1;
      fragment.appendChild(word);
    });
    node.parentNode.replaceChild(fragment, node);
  });
}

function initScrollReveal() {
  // Scroll reveal (J1). Only sections that start below the fold are touched,
  // so nothing the visitor sees on load is ever hidden (no flash, no LCP hit).
  // Each such section gets .reveal and its children (or, for a list, its
  // items) get .reveal-item with an --i stagger index; one IntersectionObserver
  // adds .is-revealed to the section when it scrolls into view.
  if (!('IntersectionObserver' in window) || prefersReducedMotion()) return;

  const MAX_STAGGER = 6;
  const CLEANUP_MS = 1400; // longer than the slowest transition + stagger

  const sections = Array.prototype.filter.call(
    document.querySelectorAll('main > section'),
    function (section) {
      return section.getBoundingClientRect().top >= window.innerHeight;
    }
  );
  if (!sections.length) return;

  function finishReveal(section) {
    section.classList.remove('reveal');
    Array.prototype.forEach.call(section.querySelectorAll('.reveal-item'), function (item) {
      item.classList.remove('reveal-item');
      item.style.removeProperty('--i');
    });
  }

  function handleRevealIntersect(entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const section = entry.target;
      observer.unobserve(section);
      section.classList.add('is-revealed');
      window.setTimeout(function () {
        finishReveal(section);
      }, CLEANUP_MS);
    });
  }

  const observer = new IntersectionObserver(handleRevealIntersect, {
    threshold: 0.1,
    rootMargin: '0px 0px -8% 0px'
  });

  sections.forEach(function (section) {
    const targets = [];
    Array.prototype.forEach.call(section.children, function (child) {
      if (child.tagName === 'UL') {
        Array.prototype.push.apply(targets, child.children);
      } else {
        targets.push(child);
      }
    });

    targets.forEach(function (target, index) {
      target.classList.add('reveal-item');
      target.style.setProperty('--i', Math.min(index, MAX_STAGGER));
    });

    section.classList.add('reveal');
    observer.observe(section);
  });
}

function initCardTilt() {
  // 3D tilt + glare on book cards (J8). One pair of listeners per book row
  // (event delegation); the card under the pointer gets .is-tilting and its
  // --tilt-x / --tilt-y / --glare-x / --glare-y custom properties. CSS does
  // the rest. Skipped on touch screens and for reduced motion.
  const rows = document.querySelectorAll('.book-row');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!rows.length || !canHover || prefersReducedMotion()) return;

  const MAX_TILT_DEG = 8;
  let activeCard = null;

  function resetCard(card) {
    if (!card) return;
    card.classList.remove('is-tilting');
    ['--tilt-x', '--tilt-y', '--glare-x', '--glare-y'].forEach(function (name) {
      card.style.removeProperty(name);
    });
  }

  function handleBookRowPointerMove(event) {
    const card = event.target.closest('.book-card');
    if (card !== activeCard) {
      resetCard(activeCard);
      activeCard = card;
    }
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;  // 0 (left) to 1 (right)
    const y = (event.clientY - rect.top) / rect.height;  // 0 (top) to 1 (bottom)

    card.style.setProperty('--tilt-y', ((x - 0.5) * 2 * MAX_TILT_DEG).toFixed(2) + 'deg');
    card.style.setProperty('--tilt-x', ((0.5 - y) * 2 * MAX_TILT_DEG).toFixed(2) + 'deg');
    card.style.setProperty('--glare-x', (x * 100).toFixed(1) + '%');
    card.style.setProperty('--glare-y', (y * 100).toFixed(1) + '%');
    card.classList.add('is-tilting');
  }

  function handleBookRowPointerLeave() {
    resetCard(activeCard);
    activeCard = null;
  }

  rows.forEach(function (row) {
    row.addEventListener('pointermove', handleBookRowPointerMove);
    row.addEventListener('pointerleave', handleBookRowPointerLeave);
  });
}

function initGenreDonut() {
  // Genre chart draw-in (J3). Without JS the donut is simply drawn in full.
  // With JS, .js-draw collapses the segments and .is-drawn (added when the
  // panel is mostly on screen) lets CSS grow them one after another.
  const panel = document.querySelector('.mock--genre');
  if (!panel || !('IntersectionObserver' in window) || prefersReducedMotion()) return;

  function handleDonutIntersect(entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      panel.classList.add('is-drawn');
      observer.unobserve(panel);
    });
  }

  const observer = new IntersectionObserver(handleDonutIntersect, { threshold: 0.5 });
  panel.classList.add('js-draw');
  observer.observe(panel);
}

function initHalfStarRater() {
  // Half-star rater (J2). The ten radios are a native group, so keyboard
  // users get arrow keys for free; this code only paints the stars, updates
  // the readout, announces the choice and plays the sparkle.
  const rater = document.querySelector('.rater');
  if (!rater) return;

  const stars = Array.prototype.slice.call(rater.querySelectorAll('.rater__star'));
  const inputs = Array.prototype.slice.call(rater.querySelectorAll('.rater__input'));
  const number = rater.querySelector('.rater__number');
  const status = rater.querySelector('.rater__status');
  const SPARK_COUNT = 6;

  const checkedInput = inputs.find(function (input) {
    return input.checked;
  });
  let committed = checkedInput ? Number(checkedInput.value) : 0;

  function paint(value) {
    stars.forEach(function (star, index) {
      star.style.setProperty('--fill', String(Math.min(1, Math.max(0, value - index))));
    });
    number.textContent = value ? String(value) : '0';
  }

  function sparkle(value) {
    const star = stars[Math.ceil(value) - 1];
    if (!star) return;

    star.classList.remove('is-popping');
    void star.offsetWidth; // restart the animation if it is already running
    star.classList.add('is-popping');

    for (let i = 0; i < SPARK_COUNT; i += 1) {
      const angle = (Math.PI * 2 * i) / SPARK_COUNT;
      const spark = document.createElement('span');
      spark.className = 'rater__spark';
      spark.style.setProperty('--dx', (Math.cos(angle) * 22).toFixed(1) + 'px');
      spark.style.setProperty('--dy', (Math.sin(angle) * 22).toFixed(1) + 'px');
      spark.addEventListener('animationend', handleSparkEnd);
      star.appendChild(spark);
    }
  }

  function handleSparkEnd(event) {
    event.currentTarget.remove();
  }

  function handleStarAnimationEnd(event) {
    if (event.animationName === 'star-pop') event.currentTarget.classList.remove('is-popping');
  }

  // Hover preview: the stars follow the pointer, and snap back on leave.
  function handleRaterPointerOver(event) {
    const half = event.target.closest('.rater__half');
    if (half && half.control) paint(Number(half.control.value));
  }

  function handleRaterPointerLeave() {
    paint(committed);
  }

  function handleRaterChange(event) {
    committed = Number(event.target.value);
    paint(committed);
    announce(status, 'Rated ' + committed + ' out of 5 stars');
    if (!prefersReducedMotion()) sparkle(committed);
  }

  rater.addEventListener('pointerover', handleRaterPointerOver);
  rater.addEventListener('pointerleave', handleRaterPointerLeave);
  rater.addEventListener('change', handleRaterChange);
  stars.forEach(function (star) {
    star.addEventListener('animationend', handleStarAnimationEnd);
  });

  paint(committed);
}

initMobileNav();
initHeaderScroll();
initWaitlistForm();
initMoodFilter();
initAnchorNav();
initJournalFilter();
initFaqAccordion();
initHeroHeadline();
initScrollReveal();
initCardTilt();
initGenreDonut();
initHalfStarRater();
