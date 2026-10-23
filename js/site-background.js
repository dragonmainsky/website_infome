// Layered technical background with slow looping drift and pointer/scroll parallax.
// The layers are painted to one fixed canvas so the backdrop stays behind content
// without creating clipped DOM shape layers.
(() => {
    const canvas = document.getElementById('site-bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    const layers = [
        {
            src: 'images/bg-far.svg',
            depthX: 7,
            depthY: 5,
            scrollX: 8,
            scrollY: 12,
            driftX: 5,
            driftY: 3,
            speed: 0.16,
            phase: 0.4,
            baseScale: 1.025,
            rotation: 0.0015
        },
        {
            src: 'images/bg-mid.svg',
            depthX: 14,
            depthY: 9,
            scrollX: 18,
            scrollY: 24,
            driftX: 9,
            driftY: 6,
            speed: 0.13,
            phase: 1.7,
            baseScale: 1.04,
            rotation: 0.002
        },
        {
            src: 'images/bg-near.svg',
            depthX: 24,
            depthY: 15,
            scrollX: 30,
            scrollY: 38,
            driftX: 14,
            driftY: 9,
            speed: 0.10,
            phase: 2.8,
            baseScale: 1.055,
            rotation: 0.0025
        }
    ];

    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let lastFrame = 0;
    let resizeTimer = 0;
    let pointerTargetX = 0;
    let pointerTargetY = 0;
    let pointerX = 0;
    let pointerY = 0;
    let scrollTarget = 0;
    let scrollCurrent = 0;

    function loadLayers() {
        for (const layer of layers) {
            const image = new Image();
            layer.image = image;
            layer.loaded = false;
            image.decoding = 'async';
            image.onload = () => {
                layer.loaded = true;
                if (reduceMotion.matches) drawScene(0, true);
            };
            image.src = layer.src;
        }
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        width = Math.max(1, Math.round(rect.width));
        height = Math.max(1, Math.round(rect.height));
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        if (reduceMotion.matches) drawScene(0, true);
    }

    function updateScrollTarget() {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        scrollTarget = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    }

    function drawVignette() {
        const radius = Math.max(width, height) * 0.72;
        const gradient = ctx.createRadialGradient(
            width * 0.5,
            height * 0.42,
            Math.min(width, height) * 0.18,
            width * 0.5,
            height * 0.42,
            radius
        );
        gradient.addColorStop(0, 'rgba(10, 10, 10, 0)');
        gradient.addColorStop(0.72, 'rgba(10, 10, 10, 0.08)');
        gradient.addColorStop(1, 'rgba(10, 10, 10, 0.34)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    function drawScene(time, still = false) {
        if (!width || !height) return;

        const seconds = time / 1000;
        const fit = Math.max(width / 1600, height / 1000);

        ctx.clearRect(0, 0, width, height);

        for (const layer of layers) {
            if (!layer.loaded) continue;

            const driftX = still
                ? 0
                : (Math.sin(seconds * layer.speed + layer.phase) - Math.sin(layer.phase)) * layer.driftX;
            const driftY = still
                ? 0
                : (Math.cos(seconds * layer.speed * 0.82 + layer.phase) - Math.cos(layer.phase)) * layer.driftY;
            const scaleDrift = still
                ? 0
                : (Math.sin(seconds * 0.08 + layer.phase) - Math.sin(layer.phase)) * 0.004;
            const rotation = still
                ? 0
                : pointerX * layer.rotation + (Math.sin(seconds * 0.06 + layer.phase) - Math.sin(layer.phase)) * 0.0008;

            const offsetX = still ? 0 : pointerX * layer.depthX + scrollCurrent * layer.scrollX + driftX;
            const offsetY = still ? 0 : pointerY * layer.depthY + scrollCurrent * layer.scrollY + driftY;
            const scale = layer.baseScale + scaleDrift;
            const drawWidth = 1600 * fit * scale;
            const drawHeight = 1000 * fit * scale;

            ctx.save();
            ctx.translate(width * 0.5 + offsetX, height * 0.5 + offsetY);
            if (rotation) ctx.rotate(rotation);
            ctx.drawImage(layer.image, -drawWidth * 0.5, -drawHeight * 0.5, drawWidth, drawHeight);
            ctx.restore();
        }

        drawVignette();
    }

    function animate(time) {
        rafId = requestAnimationFrame(animate);

        if (!lastFrame) lastFrame = time;
        const elapsed = time - lastFrame;
        if (elapsed < 1000 / 30) return;
        lastFrame = time;

        const ease = 1 - Math.exp(-elapsed / 180);
        pointerX += (pointerTargetX - pointerX) * ease;
        pointerY += (pointerTargetY - pointerY) * ease;
        scrollCurrent += (scrollTarget - scrollCurrent) * (1 - Math.exp(-elapsed / 280));

        drawScene(time);
    }

    function start() {
        if (reduceMotion.matches || document.hidden || rafId) return;
        if (!width || !height) resizeCanvas();
        if (!width || !height) return;

        lastFrame = 0;
        rafId = requestAnimationFrame(animate);
    }

    function stop() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        lastFrame = 0;
    }

    function setMotionState() {
        stop();

        if (reduceMotion.matches) {
            pointerX = 0;
            pointerY = 0;
            pointerTargetX = 0;
            pointerTargetY = 0;
            scrollCurrent = 0;
            drawScene(0, true);
        } else {
            updateScrollTarget();
            scrollCurrent = scrollTarget;
            start();
        }
    }

    function onPointerMove(event) {
        if (!finePointer.matches || reduceMotion.matches) return;

        pointerTargetX = Math.max(-1, Math.min(1, (event.clientX / Math.max(1, width) - 0.5) * 2));
        pointerTargetY = Math.max(-1, Math.min(1, (event.clientY / Math.max(1, height) - 0.5) * 2));
    }

    function onPointerLeave() {
        pointerTargetX = 0;
        pointerTargetY = 0;
    }

    loadLayers();
    resizeCanvas();
    updateScrollTarget();
    scrollCurrent = scrollTarget;
    drawScene(0, true);
    start();

    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            stop();
            resizeCanvas();
            updateScrollTarget();
            if (reduceMotion.matches) drawScene(0, true);
            else start();
        }, 140);
    });

    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave, { passive: true });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
    });

    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', setMotionState);
    else if (reduceMotion.addListener) reduceMotion.addListener(setMotionState);

    if (finePointer.addEventListener) {
        finePointer.addEventListener('change', () => {
            if (!finePointer.matches) onPointerLeave();
        });
    }
})();
