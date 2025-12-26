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

    // Gestione Aggiornamento App (Cache Busting Manuale)
    const btnUpdate = document.getElementById('btn-update-app');
    if (btnUpdate) {
        btnUpdate.addEventListener('click', async () => {
            showConfirmModal("Aggiornamento", "Vuoi scaricare l'ultima versione dell'app?<br><br>Nota: dopo aver premuto conferma, sarà necessario chiudere e riaprire l'app manualmente.", async () => {
                const originalText = btnUpdate.textContent;
                btnUpdate.textContent = "Aggiornamento in corso...";
                btnUpdate.disabled = true;

                try {
                    // 1. Rimuovi Service Worker (Smette di intercettare le richieste)
                    if ('serviceWorker' in navigator) {
                        const registrations = await navigator.serviceWorker.getRegistrations();
                        for (const registration of registrations) {
                            await registration.unregister();
                        }
                    }

                    // 2. Pulisci Cache Storage (Elimina i file vecchi salvati)
                    if ('caches' in window) {
                        const keys = await caches.keys();
                        await Promise.all(keys.map(key => caches.delete(key)));
                    }

                    // 3. Ricarica la pagina (Forza il browser a riscaricare tutto)
                    window.location.reload();
                } catch (error) {
                    console.error("Errore durante l'aggiornamento:", error);
                    showConfirmModal("Errore", "Errore durante l'aggiornamento. Riprova.", () => {});
                    btnUpdate.textContent = originalText;
                    btnUpdate.disabled = false;
                }
            }, 'btn-modal-confirm'); // Usa il pulsante verde per l'aggiornamento
        });
    }
};