// SUNSHINE / Aero world
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
        if (toTop) toTop.classList.toggle('is-visible', y > 480);
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
