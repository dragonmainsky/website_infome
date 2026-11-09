// Tab switching (Home / My Certificate / About me / Info Me).
// Called from onclick attributes in index.html, so it must stay a global function.

const decodeMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const DECODE_GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/+';
let decodeTimer = 0;
const revealFallbackTimers = new WeakMap();

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

function switchTab(tabName, updateHistory = true) {
    const target = document.getElementById('tab-' + tabName);
    if (!target) return;

    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));

    // Prepare the incoming tab while it is still hidden, then show it.
    target.classList.add('is-entering');
    prepareReveal(target, true);
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

    scheduleActiveDecode(180);
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
    const name = tabFromHash();
    if (name !== 'home') {
        switchTab(name, false);
    } else {
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

// Scatter random Frutiger Metro arrows that slide in toward the page on arrival.
function spawnArrows() {
    const layer = document.querySelector('.arrow-rain');
    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const colors = ['#a6ce39', '#ec008c', '#111111', '#00c8ff', '#f7941d'];
    const cx = innerWidth / 2;
    const cy = innerHeight / 2;
    const count = innerWidth > 1200 ? 9 : 7;

    for (let i = 0; i < count; i += 1) {
        const xPct = 4 + Math.random() * 92;
        const yPct = 8 + Math.random() * 84;
        const x = innerWidth * (xPct / 100);
        const y = innerHeight * (yPct / 100);
        const dx = x - cx;
        const dy = y - cy;
        const len = Math.hypot(dx, dy) || 1;
        const push = 110 + Math.random() * 150;
        const angle = Math.atan2(cy - y, cx - x) * (180 / Math.PI) + (Math.random() * 36 - 18);
        const size = 42 + Math.random() * 46;
        const arrow = document.createElement('div');

        arrow.className = 'fm-arrow';
        arrow.style.setProperty('--x', `${xPct}%`);
        arrow.style.setProperty('--y', `${yPct}%`);
        arrow.style.setProperty('--size', `${size.toFixed(0)}px`);
        arrow.style.setProperty('--color', colors[i % colors.length]);
        arrow.style.setProperty('--rot', `${angle.toFixed(1)}deg`);
        arrow.style.setProperty('--sx', `${(dx / len * push).toFixed(0)}px`);
        arrow.style.setProperty('--sy', `${(dy / len * push).toFixed(0)}px`);
        arrow.style.setProperty('--opacity', (0.35 + Math.random() * 0.35).toFixed(2));
        arrow.style.setProperty('--dur', `${(0.9 + Math.random() * 0.4).toFixed(2)}s`);
        arrow.style.setProperty('--delay', `${(0.1 + Math.random() * 0.6).toFixed(2)}s`);
        arrow.innerHTML = '<svg viewBox="0 0 120 80" focusable="false" aria-hidden="true"><path d="M4 30 H62 V8 L116 40 L62 72 V50 H4 Z" fill="currentColor" stroke="#111" stroke-width="6" stroke-linejoin="round"></path></svg>';
        layer.appendChild(arrow);
    }
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
