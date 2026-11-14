// SUNSHINE portfolio — hash routing for the four sections.
// switchTab() is called from inline onclick attributes in index.html,
// so it must stay a global function.

// ---------------------------------------------------------------------------
// Tabs — Home / Certificate / About / Info.
// The active tab is kept in the URL hash so refresh and shared links work.
// ---------------------------------------------------------------------------
function switchTab(tabName, updateHistory = true) {
    const target = document.getElementById('tab-' + tabName);
    if (!target) return;

    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.toggle('active', section === target);
    });

    document.querySelectorAll('.nav-btn').forEach(button => {
        const isActive = button.id === 'nav-' + tabName;
        button.classList.toggle('is-active', isActive);
        if (isActive) {
            button.setAttribute('aria-current', 'page');
        } else {
            button.removeAttribute('aria-current');
        }
    });

    if (updateHistory) {
        const url = new URL(location.href);
        url.hash = tabName === 'home' ? '' : tabName;

        if (url.href !== location.href) {
            try {
                history.pushState({ tab: tabName }, '', url.href);
            } catch (error) {
                // Some contexts (e.g. file://) block History API updates.
                location.hash = tabName === 'home' ? '' : tabName;
            }
        }
    }

    window.scrollTo(0, 0);
}

// Map the current URL hash to a tab name, falling back to home.
function tabFromHash() {
    const name = location.hash.slice(1);
    return name && document.getElementById('tab-' + name) ? name : 'home';
}

// Open the tab named in the URL hash (e.g. index.html#certificate).
window.addEventListener('DOMContentLoaded', () => {
    const name = tabFromHash();
    if (name !== 'home') switchTab(name, false);
});

// Handle Back/Forward and manual changes to the hash.
// Ignore in-page anchors such as the skip link; only tab hashes switch views.
function syncTabFromHash() {
    const name = location.hash.slice(1);
    if (name && !document.getElementById('tab-' + name)) return;
    switchTab(tabFromHash(), false);
}

window.addEventListener('hashchange', syncTabFromHash);
window.addEventListener('popstate', syncTabFromHash);
