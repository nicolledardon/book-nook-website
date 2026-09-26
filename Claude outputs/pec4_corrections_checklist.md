# PEC 4 — Corrections Checklist (from 11/20 feedback)

Built from a read-only scan of `book_nook_website/`. Ordered by points at stake: Design (−3), Responsive (−2), HTML-SEO (−2), CSS (−2).

The root cause behind most of the lost points: **the whole site has one media query** (hiding the nav at 768px), **~88% of measurements are in px** (148 px vs 21 %/vh), and several layouts use fixed widths/heights that can't shrink. Fixing those three things fixes most of Design + Responsive + the REM criterion at once.

---

## 1. CSS — REM/EM (do this first, it touches everything)

Currently: 148 `px` values vs 20 `%` + 1 `vh` → ~12% relative. Needs **>80%** in rem/em/%/vh/vw, and **px only inside `@media`**.

- [ ] In `variables.css`, convert the type scale: `--fs-h1: 2.25rem`, `--fs-h2: 2rem`, `--fs-h3: 1.5rem`, `--fs-h4: 1.25rem`, `--fs-body-1/2: 1rem` (px ÷ 16)
- [ ] Add spacing tokens so you convert once, not 100 times: e.g. `--space-xs: 0.5rem` (8), `--space-sm: 0.75rem` (12), `--space-md: 1.5rem` (24), `--space-lg: 3rem` (48), `--space-xl: 6rem` (96)
- [ ] Replace every `padding`, `margin`, `gap` px in `layout.css` and `components.css` with those tokens
- [ ] Convert remaining hard-coded font sizes (14px, 13px, 24px on `.logo` / `.footer-about h2`, 16px on book card, etc.) to rem
- [ ] Convert `border-radius` (8/10/12/16/24px) to rem
- [ ] `line-height: 29px / 22px / 20px` → unitless (e.g. `1.2`, `1.375`, `1.43`)
- [ ] `max-width: 1440px / 960px / 720px` → rem (`90rem`, `60rem`, `45rem`)
- [ ] Leave px only for 1–2px borders (acceptable) and inside `@media (max-width: …px)`
- [ ] Recount: `grep -ohE '[0-9.]+(px|rem|em|vh|vw|%)' css/*.css | sed -E 's/[0-9.]+//' | sort | uniq -c` → rem+em+%+vh+vw must be >80%

## 2. Responsive General (−2) and Design "Height" (both same fixes)

**Phones are broken right now.** Test every page at 375px and 768px in DevTools after each fix.

- [ ] **Hamburger is invisible**: `<button class="nav-toggle"></button>` has no content and no size, and the media query hides the links + CTA → on mobile there is *no navigation at all*. Give it an icon/“Menu” text, a size, `aria-label="Open menu"`, `aria-expanded="false"`, `aria-controls="…"` (and an `id` on `.nav-links`)
- [ ] **Horizontal scroll under ~400px**: `.book-row` uses `minmax(300px, 1fr)` + 48px side padding. Use `minmax(min(100%, 18.75rem), 1fr)`
- [ ] **Feature blocks don't stack**: `.feature-block` is a flex row forever. Add `@media (max-width: 768px) { flex-direction: column; }` (and for `.feature-block-reverse` too)
- [ ] **Fixed height**: `.feature-block > div:first-child { height: 360px }` → use `aspect-ratio: 14 / 9` (or `min-height` in rem) instead of a hard height — this is exactly the “Height en elementos estructurales” item
- [ ] **Highlights grid** is always 4 columns → 2 columns at tablet, 1 at mobile (or `repeat(auto-fit, minmax(min(100%, 15rem), 1fr))`)
- [ ] **Footer** is a 4-column flex row with no wrap → `flex-wrap: wrap` or stack in a column at mobile
- [ ] **Waitlist form**: input `width: 320px` + button in a row overflows a 375px phone → `width: 100%; max-width: 20rem`, and `flex-direction: column` on mobile
- [ ] **Ticket** (the "You're on the list!" confirmation card in `waitlist.html`, styled by `.ticket` in `layout.css`): `width: 480px` is wider than a phone, so the card overflows. Change to `width: 100%; max-width: 30rem` (card shrinks on phones, stays 480px on desktop). It's hidden right now, so remove `hidden` from `.confirmation-panel` temporarily to test it
- [ ] Reduce side padding on mobile: `main > section` and `header` use 48px everywhere → e.g. 1rem at ≤768px
- [ ] Reduce the 96px section gap and 96–128px hero padding on mobile
- [ ] Scale H1/H2 down on mobile (or use `clamp()`)
- [ ] Check `.nav-links` at 769–1000px (5 links + CTA + logo) doesn't collide
- [ ] Add at least 2 breakpoints consistently (e.g. 768px and 480px)

## 3. Diseño en general (−3)

### Espacios (margin/padding)
- [ ] Unstyled sections have no spacing/alignment at all: `.recent-releases`, `.popular-shelves`, `.user-shelves-cta` (Explore), `.cta` (Features), `.journal`, `.category-tabs`, `.tab`, `.post-grid` (Journal) — give each the gap/padding from Figma
- [ ] `.popular` on Home has no heading and no gap between search bar and books row — compare with Figma
- [ ] Put the spacing tokens from section 1 on everything so spacing is consistent site-wide

### Tamaño de iconos y botones
- [ ] Highlight icons are empty 48px coloured squares (`.highlight > div:first-child`) — add the real icons at Figma size
- [ ] `.footer-social` is empty — add the social icons at Figma size
- [ ] `.search-bar` on Home is an empty div — build it or remove it
- [ ] Feature-block images are grey placeholder boxes — add images/illustrations
- [ ] `.btn` has `padding: 10px` all round — check in Figma inspect: buttons usually have larger horizontal than vertical padding (e.g. `0.75rem 1.5rem`); match height/width of Primary/Secondary/Tertiary exactly
- [ ] Explore book cards have **empty** `.book-card__rating` divs (no stars) while Home has stars — make them consistent
- [ ] Verify star size (22×21) against Figma

### Estructura centrada
- [ ] Features `.cta` button is not centered (no styles) — center it
- [ ] Explore `.user-shelves-cta` — center like Figma
- [ ] Journal heading/tabs — check alignment against Figma
- [ ] Header: logo / links / CTA should align to the same max-width container as the page content (header has no max-width, sections are capped at 1440px)
- [ ] Footer: same max-width container as content
- [ ] Side-by-side check each page vs its Figma frame at 1440px

### Empty/unfinished pages
- [ ] `journal.html` is basically empty (`.post-grid` has nothing) — add post cards
- [ ] `index.html` has an empty `<section class="books"></section>` — fill or delete

## 4. HTML-SEO (−2)

### Meta / Open Graph / favicon (missing on all 6 pages)
- [ ] `<meta name="description" content="…">` — unique per page
- [ ] `<meta property="og:title">`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`
- [ ] Optional but cheap: `twitter:card`
- [ ] Favicon: create `assets/favicon.png` (or .svg/.ico) and add `<link rel="icon" href="assets/favicon.png">` to every page
- [ ] Better `<title>`s: "Explore | Book Nook" instead of "Explore"

### Headings
- [ ] `about.html` has **no h1** — change "Meet the creator" to `<h1>`
- [ ] `features.html` jumps h1 → h3 (feature blocks) — make them `<h2>`
- [ ] Footer "Book Nook" is an `<h2>` on every page — make it a `<p class="…">` (it's a logo, not a section heading)
- [ ] Explore's `h1` is styled as h3 via CSS — fine, but check its h2s follow in order

### Sections / articles must contain a heading or paragraph
- [ ] `index.html` `<section class="books"></section>` — empty
- [ ] `index.html` `<section class="popular">` — no heading (add “Popular right now” h2)
- [ ] `features.html` `<section class="cta">` — only a link; add a heading/paragraph or make it a `<div>`

### Button / link
- [ ] No nesting found ✔ — keep it that way
- [ ] `.anchor-button` links have `href=""` (reload the page) → point to ids: `href="#genre-tracking"` and add matching `id`s to each feature block
- [ ] Mood chips / journal tabs: add `type="button"`

### Header + nav
- [x] Already correct ✔ — nothing to do

## 5. CSS (−2)

### Custom properties
- [ ] `components.css:128` `box-shadow: … rgba(0, 0, 0, 0.14)` → move to `--shadow-card` in `variables.css`
- [ ] Sweep: `grep -rnE '#[0-9a-fA-F]{3,6}|rgba?\(' css/ | grep -v variables.css` should return nothing

### Metodología (BEM) — currently mixed, this is likely the main loss
- [ ] Pick BEM and apply it everywhere; right now only `.book-card__*`, `.star--*`, `.barcode__bar` follow it
- [ ] Modifiers use `--`: `.feature-block-reverse` → `.feature-block--reverse`; `.btn-primary` → `.btn--primary` (same for secondary/tertiary); `.mood-chip.is-selected` → `.mood-chip--selected` (or keep `is-` state classes and document it as SUIT-style state)
- [ ] Elements use `__`: `.intro-subtitle` → `.intro__subtitle`, `.nav-links` → `.nav__links`, `.footer-about` → `.footer__about`, `.signup-form` → `.signup__form`, `.ticket-subtitle` → `.ticket__subtitle`, etc.
- [ ] Replace structural selectors with classes: `.highlight > div:first-child` → `.highlight__icon`; `.highlight > div:last-child` → `.highlight__body`; same for `.feature-block > div:first-child/last-child` → `.feature-block__media` / `.feature-block__text`
- [ ] Remove element-descendant selectors: `.highlight h3`, `.ticket h2`, `.meet-creator p`, `.footer-about h2`, `header nav`, `main > section`, `.signup-form input[type="email"]` → give those elements their own class
- [ ] Note the chosen methodology in the README

### Especificidad (<100 on 90% of selectors)
- [ ] Watch `.signup-form input[type="email"]:focus-visible` (0,3,1) and `.anchor-buttons .btn-tertiary` — BEM classes flatten these

---

## Final QA before resubmitting
- [ ] DevTools at 375 / 768 / 1024 / 1440 on all 6 pages — no horizontal scroll, nothing overlapping
- [ ] Real phone test via Live Server on local network
- [ ] Unit recount >80% relative
- [ ] Share preview check (e.g. paste URL into opengraph.xyz once deployed)
- [ ] Validate HTML at validator.w3.org
- [ ] Side-by-side vs Figma for every page
- [ ] Heads-up: the PEC is titled "HTML, CSS **y Sass**" and the project is plain CSS. It wasn't in the rubric you got marked on, but moving to SCSS (partials + variables + nesting for BEM) would make the BEM rename easier and removes the risk if it's checked later
