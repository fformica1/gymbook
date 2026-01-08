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

    // Gestione Installazione PWA
    const btnInstall = document.getElementById('btn-install-app');
    const installContainer = document.getElementById('install-app-container');

    window.updateInstallButton = () => {
        if (!installContainer) return;

        // 1. Se l'app è già installata (Standalone), nascondi tutto
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone) {
            installContainer.style.display = 'none';
            return;
        }

        // 2. Se abbiamo l'evento di installazione (Android/Chrome), mostra il pulsante
        if (window.deferredInstallPrompt) {
            installContainer.style.display = 'block';
            btnInstall.style.display = 'block';
            const p = installContainer.querySelector('p');
            if (p) p.textContent = "Aggiungi l'app alla schermata home per usarla offline come un'app nativa.";
        } 
        // 3. Altrimenti (iOS o evento non scattato), mostra istruzioni manuali
        else {
            installContainer.style.display = 'block';
            btnInstall.style.display = 'none'; // Nascondi il pulsante perché non funzionerebbe
            
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            const p = installContainer.querySelector('p');
            if (p) {
                if (isIOS) {
                    p.innerHTML = "Per installare su iOS:<br>1. Premi il tasto <strong>Condividi</strong> (icona centrale in basso)<br>2. Scorri e seleziona <strong>'Aggiungi alla schermata Home'</strong>";
                } else {
                    p.innerHTML = "Per installare l'app:<br>Apri il menu del browser (tre puntini) e seleziona <strong>'Installa app'</strong> o <strong>'Aggiungi a schermata Home'</strong>.";
                }
                p.style.color = "var(--text)";
                p.style.lineHeight = "1.5";
            }
        }
    };

    if (btnInstall) {
        btnInstall.addEventListener('click', async () => {
            if (window.deferredInstallPrompt) {
                window.deferredInstallPrompt.prompt();
                const { outcome } = await window.deferredInstallPrompt.userChoice;
                window.deferredInstallPrompt = null;
                window.updateInstallButton();
            }
        });
    }
    window.updateInstallButton(); // Check iniziale

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