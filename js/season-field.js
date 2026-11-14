// SUNSHINE — seasonal field.
// Picks an animated piece from ascii.rest by the visitor's real-world season.
// The field freezes when the visitor prefers reduced motion and when the tab
// is hidden.
//
// Meteorological seasons, northern hemisphere:
//   spring  Mar–May   cherry-blossom
//   summer  Jun–Aug   sunrise
//   autumn  Sep–Nov   wind
//   winter  Dec–Feb   snowfall
//
// Vendored from ascii.rest by @bas3line (MIT); see js/vendor/ascii/LICENSE.

import cherryBlossom, { meta as cherryMeta } from "./vendor/ascii/cherry-blossom.js";
import sunrise, { meta as sunriseMeta } from "./vendor/ascii/sunrise.js";
import wind, { meta as windMeta } from "./vendor/ascii/wind.js";
import snowfall, { meta as snowfallMeta } from "./vendor/ascii/snowfall.js";

const seasons = [
    {
        key: "spring",
        field: "cherry-blossom",
        months: [2, 3, 4],
        make: cherryBlossom,
        meta: cherryMeta,
        at: 3
    },
    {
        key: "summer",
        field: "sunrise",
        months: [5, 6, 7],
        make: sunrise,
        meta: sunriseMeta,
        at: 3
    },
    {
        key: "autumn",
        field: "wind",
        months: [8, 9, 10],
        make: wind,
        meta: windMeta,
        at: 3
    },
    {
        key: "winter",
        field: "snowfall",
        months: [11, 0, 1],
        make: snowfall,
        meta: snowfallMeta,
        at: 3
    }
];

const month = new Date().getMonth();
const season = seasons.find(item => item.months.includes(month)) || seasons[2];

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let paused = reducedMotion.matches;

const art = document.getElementById("season-art");
if (art) {
    try {
        const frame = season.make();
        const fps = season.meta.fps || 15;
        let time = season.at;
        let frameRequest = 0;
        let lastFrame = 0;

        function draw() {
            const next = frame(time)
                .replace(/[ \t]+$/gm, "")
                .replace(/\n+$/, "");
            if (next.trim()) art.textContent = next;
        }

        function stop() {
            if (!frameRequest) return;
            cancelAnimationFrame(frameRequest);
            frameRequest = 0;
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
            if (paused || document.hidden) {
                stop();
                return;
            }
            if (!frameRequest) {
                lastFrame = performance.now();
                frameRequest = requestAnimationFrame(tick);
            }
        }

        // The static autumn frame in index.html remains the no-JS fallback.
        draw();

        reducedMotion.addEventListener("change", event => {
            paused = event.matches;
            run();
        });
        document.addEventListener("visibilitychange", run);

        run();
    } catch (error) {
        console.warn("Could not draw the seasonal field:", error);
    }
}

document.documentElement.dataset.season = season.key;
