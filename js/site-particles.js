// Slow drifting X particles for the website backdrop.
// This canvas stays behind all page content.
(() => {
    const canvas = document.getElementById('site-particles');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let rafId = 0;
    let lastTime = 0;
    let resizeTimer = 0;

    function createParticles() {
        const count = Math.round(Math.min(46, Math.max(18, width / 30)));

        particles = Array.from({ length: count }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: 1.4 + Math.random() * 3.6,
            speed: 3.5 + Math.random() * 9,
            drift: 4 + Math.random() * 10,
            phase: Math.random() * Math.PI * 2,
            alpha: 0.07 + Math.random() * 0.18,
            spin: (Math.random() - 0.5) * 0.5,
            angle: Math.random() * Math.PI,
            accent: Math.random() < 0.18
        }));
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        width = Math.round(rect.width);
        height = Math.round(rect.height);
        if (!width || !height) return;

        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineWidth = 1;
        createParticles();
    }

    function drawParticle(particle, time) {
        const x = particle.x + Math.sin(time * 0.00022 + particle.phase) * particle.drift;
        const angle = particle.angle + time * 0.00012 * particle.spin;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const size = particle.size;
        const color = particle.accent ? '255, 90, 0' : '247, 243, 234';

        ctx.strokeStyle = `rgba(${color}, ${particle.alpha})`;
        ctx.beginPath();
        ctx.moveTo(x - cos * size, particle.y - sin * size);
        ctx.lineTo(x + cos * size, particle.y + sin * size);
        ctx.moveTo(x + cos * size, particle.y - sin * size);
        ctx.lineTo(x - cos * size, particle.y + sin * size);
        ctx.stroke();
    }

    function frame(time) {
        if (!lastTime) lastTime = time;

        const delta = Math.min(48, time - lastTime);
        lastTime = time;
        ctx.clearRect(0, 0, width, height);

        for (const particle of particles) {
            particle.y -= particle.speed * delta / 1000;

            if (particle.y < -12) {
                particle.y = height + 12;
                particle.x = Math.random() * width;
            }

            drawParticle(particle, time);
        }

        rafId = requestAnimationFrame(frame);
    }

    function startParticles() {
        if (reduceMotion.matches || document.hidden || !width || !height || rafId) return;
        lastTime = 0;
        rafId = requestAnimationFrame(frame);
    }

    function stopParticles() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        lastTime = 0;
    }

    function clearParticles() {
        if (width && height) ctx.clearRect(0, 0, width, height);
    }

    function onMotionChange() {
        stopParticles();
        if (reduceMotion.matches) clearParticles();
        else startParticles();
    }

    resizeCanvas();
    startParticles();

    window.addEventListener('resize', () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
            stopParticles();
            resizeCanvas();
            startParticles();
        }, 140);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopParticles();
        else startParticles();
    });

    if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', onMotionChange);
    else if (reduceMotion.addListener) reduceMotion.addListener(onMotionChange);
})();
