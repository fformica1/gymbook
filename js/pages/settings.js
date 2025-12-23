window.setupImpostazioniPage = function() {
    console.log("Setup Impostazioni Page (Nuova Struttura)");
    const themeSelect = document.getElementById('theme-select');
    
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (themeSelect) {
        themeSelect.value = currentTheme;
        themeSelect.addEventListener('change', (e) => {
            localStorage.setItem('theme', e.target.value);
            if (typeof applyTheme === 'function') applyTheme();
        });
    }
};