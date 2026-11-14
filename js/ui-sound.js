// SUNSHINE portfolio — hover sound.
// Plays when the pointer enters a button or a button-styled link; clicking or
// pressing stays silent.

(() => {
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!canHover.matches) return;

    // Real buttons plus the links that look and behave like buttons.
    const soundTargets = [
        'button',
        'a.action',
        'a.bracket-link',
        '.work-row__foot a',
        'a.profile-row'
    ].join(', ');

    const VOLUME = 0.4;
    const sound = new Audio('audio/on_button.wav?v=1');
    sound.preload = 'auto';
    sound.volume = VOLUME;

    let hasPlayed = false;

    function playHoverSound() {
        try {
            sound.currentTime = 0;
            const playback = sound.play();
            if (playback) {
                // The first hover can be blocked until the page has been
                // interacted with; later hovers retry automatically.
                playback.then(() => {
                    hasPlayed = true;
                }).catch(() => {});
            }
        } catch (error) {
            // The clip may still be loading; the next hover will retry.
        }
    }

    document.querySelectorAll(soundTargets).forEach(target => {
        target.addEventListener('pointerenter', event => {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            playHoverSound();
        });
    });

    // Browsers can block audio before the first user gesture. Warm the element
    // silently during that gesture so later hover sounds are allowed.
    function unlockSound() {
        if (hasPlayed) return;

        sound.volume = 0;
        const playback = sound.play();

        if (!playback) {
            sound.volume = VOLUME;
            return;
        }

        playback.then(() => {
            sound.pause();
            sound.currentTime = 0;
            sound.volume = VOLUME;
            hasPlayed = true;
        }).catch(() => {
            sound.volume = VOLUME;
        });
    }

    document.addEventListener('pointerdown', unlockSound, { once: true, capture: true });
    document.addEventListener('keydown', unlockSound, { once: true, capture: true });
})();
