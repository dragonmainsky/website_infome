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
                    span.style.color = 'var(--aero-sun-500)';
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

// Gentle pointer parallax for the cloud and bubble layers, plus lightweight
// header and back-to-top state. All motion is disabled for reduced motion.
(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    const header = document.getElementById('site-header');
    const toTop = document.getElementById('to-top');

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId = 0;

    function resetParallax() {
        targetX = 0;
        targetY = 0;
        currentX = 0;
        currentY = 0;
        root.style.setProperty('--aero-px', '0');
        root.style.setProperty('--aero-py', '0');
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
    }

    function paintParallax() {
        rafId = 0;
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        root.style.setProperty('--aero-px', currentX.toFixed(3));
        root.style.setProperty('--aero-py', currentY.toFixed(3));

        if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
            rafId = requestAnimationFrame(paintParallax);
        }
    }

    function onPointerMove(event) {
        if (!finePointer.matches || reduceMotion.matches) return;

        targetX = Math.max(-1, Math.min(1, (event.clientX / Math.max(1, innerWidth) - 0.5) * 2));
        targetY = Math.max(-1, Math.min(1, (event.clientY / Math.max(1, innerHeight) - 0.5) * 2));

        if (!rafId) rafId = requestAnimationFrame(paintParallax);
    }

    function onPointerLeave() {
        targetX = 0;
        targetY = 0;
        if (!rafId && !reduceMotion.matches) rafId = requestAnimationFrame(paintParallax);
    }

    let scrollQueued = false;

    function paintChrome() {
        scrollQueued = false;
        const y = window.scrollY || window.pageYOffset || 0;

        if (header) header.classList.toggle('is-scrolled', y > 24);
        if (toTop) toTop.classList.toggle('is-visible', y > 240);
    }

    function onScroll() {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(paintChrome);
    }

    function onMotionPreferenceChange() {
        resetParallax();
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onPointerLeave, { passive: true });
    window.addEventListener('load', paintChrome, { once: true });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) resetParallax();
    });

    if (reduceMotion.addEventListener) {
        reduceMotion.addEventListener('change', onMotionPreferenceChange);
    } else if (reduceMotion.addListener) {
        reduceMotion.addListener(onMotionPreferenceChange);
    }

    resetParallax();
    paintChrome();
})();
