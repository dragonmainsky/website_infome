// SUNSHINE — live ASCII.
// Mounts the animated pieces and honours the reduced-motion preference.
// Pieces are vendored from ascii.rest by @bas3line (MIT); see
// js/vendor/ascii/LICENSE.

import { banner } from "./vendor/ascii/banner.js";
import fox, { meta as foxMeta } from "./vendor/ascii/fox.js";

const bannerPiece = banner("MOS", { effect: "glint", speed: 1 });

const pieces = {
    banner: {
        make: bannerPiece.default,
        meta: bannerPiece.meta,
        options: {},
        fps: bannerPiece.meta.fps
    },
    fox: {
        make: fox,
        meta: foxMeta,
        options: {},
        fps: foxMeta.fps
    }
};

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let paused = reducedMotion.matches;
const players = [];

// ---------------------------------------------------------------------------
// One piece in one <pre>. Frames use the piece's own clock, so pausing freezes
// the current moment instead of restarting it.
// ---------------------------------------------------------------------------
function createPlayer(el, definition) {
    const meta = definition.meta || {};
    const options = { ...(meta.options || {}), ...definition.options };
    const frame = definition.make(options);
    const fps = definition.fps || meta.fps || 24;
    const still = meta.still ?? 0;

    let time = still;
    let frameRequest = 0;
    let lastFrame = 0;
    let visible = false;
    let isPaused = true;

    function draw() {
        el.textContent = frame(time);
    }

    function stop() {
        if (frameRequest) {
            cancelAnimationFrame(frameRequest);
            frameRequest = 0;
        }
    }

    function tick(now) {
        frameRequest = requestAnimationFrame(tick);
        const delta = now - lastFrame;
        if (delta < 1000 / fps - 2) return;
        lastFrame = now;
        time += Math.min(delta, 100) / 1000;
        draw();
    }

    function run() {
        const shouldRun = visible && !document.hidden && !isPaused;
        if (shouldRun && !frameRequest) {
            lastFrame = performance.now();
            frameRequest = requestAnimationFrame(tick);
        } else if (!shouldRun) {
            stop();
        }
    }

    function setPaused(value) {
        isPaused = value;
        if (isPaused) {
            stop();
        } else {
            run();
        }
    }

    const observer = new IntersectionObserver(entries => {
        visible = entries[entries.length - 1].isIntersecting;
        run();
    });
    observer.observe(el);

    document.addEventListener("visibilitychange", run);

    draw();

    return {
        setPaused,
        get element() {
            return el;
        }
    };
}

// ---------------------------------------------------------------------------
// Mount the tags. The static frame already inside each <pre> is the no-JS
// fallback and the first frame.
// ---------------------------------------------------------------------------
document.querySelectorAll("[data-live]").forEach(el => {
    const definition = pieces[el.dataset.live];
    if (!definition) return;

    try {
        players.push(createPlayer(el, definition));
    } catch (error) {
        console.warn(`Could not start the ${el.dataset.live} ascii piece:`, error);
    }
});

function applyPaused() {
    players.forEach(player => player.setPaused(paused));
}

// Reading the system preference initially pauses everything. If it turns on
// while the page is open, pause too.
reducedMotion.addEventListener("change", event => {
    if (event.matches) {
        paused = true;
        applyPaused();
    }
});

applyPaused();
