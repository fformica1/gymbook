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

    // Gestione Backup
    const btnBackup = document.getElementById('btn-backup');
    if (btnBackup) {
        btnBackup.addEventListener('click', () => {
            performBackup();
        });
    }

    // Gestione Ripristino
    const btnRestore = document.getElementById('btn-restore');
    const fileInput = document.getElementById('file-restore');
    if (btnRestore && fileInput) {
        btnRestore.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                showConfirmModal("Ripristino Dati", "ATTENZIONE: Questa operazione sovrascriverà TUTTI i dati attuali con quelli del backup.<br><br>Vuoi procedere?", async () => {
                    try {
                        await importBackup(file);
                        alert("Ripristino completato con successo! L'app verrà ricaricata.");
                        window.location.reload();
                    } catch (err) {
                        console.error(err);
                        alert("Errore durante il ripristino: " + err.message);
                    }
                });
            }
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
                    await performAppUpdate();
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