// Tab switching (Home / My Certificate / About me / Info Me).
// Called from onclick attributes in index.html, so it must stay a global function.

const decodeMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const DECODE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/+';
let decodeTimer = 0;
const revealFallbackTimers = new WeakMap();

// ---------------------------------------------------------------------------
// Full-page 3D entrance. Plays on every page load; after it ends the page
// behaves exactly like before and every tab keeps its normal reveal.
// ---------------------------------------------------------------------------
const INTRO_MS = 3200; // keep in sync with the CSS animation timings
const introMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const introRoot = document.documentElement;
const introSkip = document.getElementById('intro-skip');
let introPlaying = false;
let introTimer = 0;

function onIntroKey(event) {
    if (event.key === 'Escape') finishIntro();
}

function finishIntro() {
    if (!introPlaying) return;

    introPlaying = false;
    window.clearTimeout(introTimer);
    document.removeEventListener('keydown', onIntroKey);

    const skipFocused = document.activeElement === introSkip;
    introRoot.classList.add('intro-out');
    introRoot.classList.remove('intro');
    window.setTimeout(() => introRoot.classList.remove('intro-out'), 360);

    if ('scrollRestoration' in history) history.scrollRestoration = 'auto';

    const active = document.querySelector('.tab-content.active');
    if (active) {
        active.classList.remove('is-entering', 'is-revealing');
        active.classList.add('is-revealed');
    }

    if (skipFocused) {
        const main = document.getElementById('main-content');
        if (main) main.focus({ preventScroll: true });
    }

    scheduleActiveDecode(160);
}

function startIntro() {
    introRoot.classList.remove('intro-pending');

    if (introMotion.matches) return false;

    introPlaying = true;
    introRoot.classList.add('intro');
    window.scrollTo(0, 0);
    requestAnimationFrame(() => window.scrollTo(0, 0));
    window.addEventListener('load', () => {
        if (introPlaying) window.scrollTo(0, 0);
    }, { once: true });
    introTimer = window.setTimeout(finishIntro, INTRO_MS);
    document.addEventListener('keydown', onIntroKey);

    if (introSkip) introSkip.addEventListener('click', finishIntro);
    return true;
}

// Briefly replace a heading with fixed-width scrambled glyphs, then lock it in.
function decodeHeading(el, { delay = 0, duration = 640 } = {}) {
    if (!el || el.dataset.decoded === 'true' || decodeMotion.matches) return;
    if (el.offsetParent === null) return;

    const original = el.textContent;
    if (!original.trim()) return;

    el.dataset.decoded = 'true';
    el.setAttribute('aria-label', original);

    const chars = Array.from(original);
    const nodes = [];
    el.textContent = '';

    chars.forEach(char => {
        if (char === ' ') {
            el.appendChild(document.createTextNode(' '));
            nodes.push(null);
            return;
        }
        const span = document.createElement('span');
        span.className = 'decode-char';
        span.textContent = char;
        el.appendChild(span);
        nodes.push(span);
    });

    nodes.forEach(span => {
        if (span) span.style.width = `${span.getBoundingClientRect().width}px`;
    });

    el.classList.add('is-decoding');
    const start = performance.now() + delay;
    let lastPaint = 0;

    function finish() {
        el.textContent = original;
        el.removeAttribute('aria-label');
        el.classList.remove('is-decoding');
    }

    function frame(now) {
        if (decodeMotion.matches) {
            finish();
            return;
        }
        if (now < start) {
            requestAnimationFrame(frame);
            return;
        }

        const progress = Math.min(1, (now - start) / duration);
        if (now - lastPaint > 38 || progress === 1) {
            lastPaint = now;
            const reveal = Math.floor(progress * (chars.length + 1) * 1.08);

            nodes.forEach((span, index) => {
                if (!span) return;
                const char = chars[index];
                if (!/[A-Za-z0-9]/.test(char) || index < reveal) {
                    span.textContent = char;
                    span.style.color = '';
                } else {
                    span.textContent = DECODE_GLYPHS[Math.floor(Math.random() * DECODE_GLYPHS.length)];
                    span.style.color = 'var(--lime)';
                }
            });
        }

        if (progress < 1) requestAnimationFrame(frame);
        else finish();
    }

    requestAnimationFrame(frame);
}

function decodeActiveTab(delay = 0) {
    if (decodeMotion.matches) return;

    const active = document.querySelector('.tab-content.active');
    if (!active) return;

    active.querySelectorAll('[data-decode]').forEach((el, index) => {
        decodeHeading(el, { delay: delay + index * 80 });
    });
}

function scheduleActiveDecode(delay = 180) {
    window.clearTimeout(decodeTimer);
    decodeTimer = window.setTimeout(() => decodeActiveTab(), delay);
}

function switchTab(tabName, updateHistory = true, options = {}) {
    const target = document.getElementById('tab-' + tabName);
    if (!target) return;

    // While the 3D intro owns the screen, the panel animates through the
    // intro keyframes instead of replaying the small tab reveal.
    const reveal = options.reveal !== false && !introPlaying;

    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

    // Prepare the incoming tab while it is still hidden, then show it.
    target.classList.add('is-entering');
    if (reveal) prepareReveal(target, true);
    target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('is-active');
        btn.removeAttribute('aria-current');
    });

    const activeBtn = document.getElementById('nav-' + tabName);
    if (activeBtn) {
        activeBtn.classList.add('is-active');
        activeBtn.setAttribute('aria-current', 'page');
    }

    // Keep the tab in the URL so a refresh or shared link opens the same page.
    // pushState adds a history entry, so Back/Forward move between tabs.
    if (updateHistory) {
        const url = new URL(location.href);
        url.hash = tabName === 'home' ? '' : tabName;

        if (url.href !== location.href) {
            try {
                history.pushState({ tab: tabName }, '', url.href);
            } catch (err) {
                // Some contexts (e.g. file://) block History API updates.
                location.hash = tabName === 'home' ? '' : tabName;
            }
        }
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });

    if (reveal) scheduleActiveDecode(180);
}

// Map the current URL hash to a tab name, falling back to home.
function tabFromHash() {
    const name = location.hash.slice(1);
    return name && document.getElementById('tab-' + name) ? name : 'home';
}

// Give every revealable block in a tab its own stagger delay.
// Facts rows are marked here, so new rows animate automatically.
function prepareReveal(section, restart) {
    if (!section) return;

    section.querySelectorAll('.facts > div').forEach(el => {
        if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', 'soft');
    });

    const items = section.querySelectorAll('[data-reveal]');
    items.forEach((el, index) => el.style.setProperty('--reveal-index', index));

    if (restart) {
        section.classList.remove('is-revealing');
        void section.offsetWidth; // force a reflow so the animation replays
    }

    section.classList.remove('is-revealed');
    section.classList.add('is-revealing');

    // Some environments pause or skip CSS animations (background tabs,
    // reduced-motion tools, headless screenshots). Never leave the copy at
    // opacity 0: force the finished state once the choreography is over.
    window.clearTimeout(revealFallbackTimers.get(section));
    const animationWindow = items.length * 70 + 600;
    revealFallbackTimers.set(section, window.setTimeout(() => {
        section.classList.add('is-revealed');
    }, animationWindow));
}

// Open the tab named in the URL hash (e.g. index.html#certificate).
window.addEventListener('DOMContentLoaded', () => {
    const introStarted = startIntro();
    const name = tabFromHash();

    if (name !== 'home') {
        switchTab(name, false, { reveal: !introStarted });
    } else if (!introStarted) {
        prepareReveal(document.getElementById('tab-home'), false);
        scheduleActiveDecode(120);
    }
});

// Handle Back/Forward and manual changes to the hash.
// Ignore in-page anchors such as the skip link; only tab hashes switch views.
window.addEventListener('hashchange', () => {
    const name = location.hash.slice(1);
    if (name && !document.getElementById('tab-' + name)) return;
    switchTab(tabFromHash(), false);
});

// Split the hero heading into individual letters so each one can wiggle.
function splitWiggleText() {
    const target = document.querySelector('[data-wiggle]');
    if (!target || target.dataset.wiggleReady === 'true') return;
    target.dataset.wiggleReady = 'true';

    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    let index = 0;
    nodes.forEach(node => {
        if (!node.nodeValue) return;
        const fragment = document.createDocumentFragment();

        for (const char of node.nodeValue) {
            if (/\s/.test(char)) {
                fragment.appendChild(document.createTextNode(char));
                continue;
            }

            const span = document.createElement('span');
            span.className = 'wg';
            span.style.setProperty('--wg-i', index);
            span.textContent = char;
            fragment.appendChild(span);
            index += 1;
        }

        node.replaceWith(fragment);
    });
}

splitWiggleText();

// Frutiger Metro arrows gathered around the screen edges, sliding inward on arrival.
function spawnArrows() {
    const layer = document.querySelector('.arrow-rain');
    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const shapes = [
        '<svg viewBox="0 0 120 80" focusable="false" aria-hidden="true"><path d="M2 28 H60 V8 L118 40 L60 72 V52 H2 Z" fill="currentColor" stroke="#111" stroke-width="6" stroke-linejoin="round"></path></svg>',
        '<svg viewBox="0 0 120 80" focusable="false" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="square"><path d="M4 8 L36 40 L4 72"></path><path d="M44 8 L76 40 L44 72"></path><path d="M84 8 L116 40 L84 72"></path></g></svg>',
        '<svg viewBox="0 0 140 80" focusable="false" aria-hidden="true"><g fill="currentColor"><circle cx="10" cy="40" r="6"></circle><circle cx="30" cy="40" r="6"></circle><circle cx="50" cy="40" r="6"></circle><circle cx="70" cy="40" r="6"></circle></g><path d="M86 22 L134 40 L86 58 Z" fill="currentColor" stroke="#111" stroke-width="5" stroke-linejoin="round"></path></svg>',
        '<svg viewBox="0 0 120 90" focusable="false" aria-hidden="true"><path d="M4 82 C40 82 26 20 78 20" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round"></path><path d="M70 2 L108 20 L70 38 Z" fill="currentColor" stroke="#111" stroke-width="5" stroke-linejoin="round"></path></svg>'
    ];
    const colors = ['#111111', '#2d7fa1', '#111111', '#4f97b5', '#2d7fa1', '#111111'];
    const slots = [
        { side: 'left', x: 3.5, y: 14 },
        { side: 'left', x: 5, y: 32 },
        { side: 'left', x: 4.5, y: 50 },
        { side: 'left', x: 6, y: 68 },
        { side: 'left', x: 5.5, y: 86 },
        { side: 'right', x: 94, y: 18 },
        { side: 'right', x: 95, y: 36 },
        { side: 'right', x: 93.5, y: 54 },
        { side: 'right', x: 94.5, y: 72 },
        { side: 'right', x: 93, y: 90 }
    ];

    slots.forEach((slot, index) => {
        const type = Math.floor(Math.random() * shapes.length);
        const rot = (slot.side === 'left' ? 0 : 180) + (Math.random() * 12 - 6);
        const size = (type === 1 ? 66 : 56) + Math.random() * 40;
        const push = 240 + Math.random() * 140;
        const jitter = Math.random() * 24 - 12;
        const arrow = document.createElement('div');
        const color = colors[index % colors.length];
        const opacity = color === '#111111'
            ? 0.8 + Math.random() * 0.15
            : 0.62 + Math.random() * 0.18;

        arrow.className = 'fm-arrow';
        arrow.style.setProperty('--x', `${(slot.x + (Math.random() * 3 - 1.5)).toFixed(2)}%`);
        arrow.style.setProperty('--y', `${(slot.y + (Math.random() * 3 - 1.5)).toFixed(2)}%`);
        arrow.style.setProperty('--size', `${size.toFixed(0)}px`);
        arrow.style.setProperty('--color', color);
        arrow.style.setProperty('--rot', `${rot.toFixed(1)}deg`);
        arrow.style.setProperty('--sx', `${(slot.side === 'left' ? -push : push).toFixed(0)}px`);
        arrow.style.setProperty('--sy', `${jitter.toFixed(0)}px`);
        arrow.style.setProperty('--opacity', opacity.toFixed(2));
        arrow.style.setProperty('--dur', `${(3.4 + Math.random() * 1.4).toFixed(2)}s`);
        arrow.style.setProperty('--delay', `${(0.1 + Math.random() * 1.2).toFixed(2)}s`);
        arrow.innerHTML = shapes[type];
        layer.appendChild(arrow);
    });
}

spawnArrows();

// Show the back-to-top button once the page has scrolled a little.
(() => {
    const toTop = document.getElementById('to-top');
    let scrollQueued = false;

    function paintChrome() {
        scrollQueued = false;
        const y = window.scrollY || window.pageYOffset || 0;
        if (toTop) toTop.classList.toggle('is-visible', y > 240);
    }

    function onScroll() {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(paintChrome);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('load', paintChrome, { once: true });
    paintChrome();
})();
