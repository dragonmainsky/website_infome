(() => {
    'use strict';

    const toast = document.querySelector('.toast');
    const year = document.getElementById('year');
    let toastTimer = 0;

    const showToast = (message) => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 2400);
    };

    document.querySelectorAll('[data-copy]').forEach((swatch) => {
        swatch.addEventListener('click', async () => {
            const hex = swatch.dataset.copy;
            try {
                await navigator.clipboard.writeText(hex);
                showToast(`${hex} copied to clipboard`);
            } catch {
                showToast(`${hex} — clipboard blocked, copy it manually`);
            }
        });
    });

    document.querySelectorAll('[data-specimen]').forEach((specimen) => {
        specimen.addEventListener('click', () => {
            showToast('Visual specimen — this control is wired in Part 2.');
        });
    });

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    if (navigator.userAgentData?.brands?.some(b => b.brand === 'Chromium')) {
        root.classList.add('lg-refract');
    }
})();
