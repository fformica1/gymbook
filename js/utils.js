// js/utils.js - Funzioni di utilità condivise

// Funzione per ottenere dati da localStorage
const getFromLocalStorage = (key) => {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error(`Errore nel recupero da localStorage per ${key}:`, e);
        return null;
    }
};

// Funzione per salvare dati in localStorage
const saveToLocalStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Errore nel salvataggio in localStorage per ${key}:`, e);
    }
};

// Funzione per applicare il tema
const applyTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default scuro
    document.documentElement.setAttribute('data-theme', savedTheme);
};

// --- Gestione Permessi Notifiche ---
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log("Permesso notifiche concesso");
            }
        });
    }
}

// --- Funzione per l'avviso acustico ---
let notificationAudio; // Variabile per l'elemento audio

function playNotificationSound() {
    // Inizializza l'oggetto Audio al primo utilizzo
    if (!notificationAudio) {
        notificationAudio = new Audio('notification.mp3'); 
    }

    notificationAudio.play().catch(error => {
        console.error("Errore nella riproduzione dell'audio:", error);
    });

    // NOTA: La notifica visiva è ora gestita interamente da updateSilentNotification in workout.js
    // per evitare duplicati e mantenere una singola notifica persistente.
    // Qui gestiamo solo l'audio.
}

// --- Funzione Modale di Conferma Personalizzato ---
function showConfirmModal(title, message, onConfirm, confirmBtnClass = 'btn-elimina', onCancel = null) {
    let modal = document.getElementById('confirmation-modal');

    // FIX: Se il modale non esiste nel DOM, crealo dinamicamente per evitare il fallback al popup di sistema
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'confirmation-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3 id="confirm-title"></h3>
                <p id="confirm-message"></p>
                <div class="modal-actions">
                    <button id="btn-confirm-cancel" class="btn-grigio">Annulla</button>
                    <button id="btn-confirm-ok" class="">Conferma</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const btnOk = document.getElementById('btn-confirm-ok');
    const btnCancel = document.getElementById('btn-confirm-cancel');


    titleEl.textContent = title;
    messageEl.innerHTML = message; // Usa innerHTML per permettere <br>
    
    // Reset stato pulsanti (nel caso fossero stati nascosti da logiche specifiche)
    btnOk.style.display = ''; 
    // Rimuove tutte le classi e aggiunge quella base + quella specifica
    btnOk.className = ''; 
    btnOk.classList.add(confirmBtnClass);
    btnCancel.textContent = "Annulla";

    modal.style.display = 'flex';

    // Rimuovi vecchi listener per evitare duplicazioni
    const newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    
    newBtnOk.addEventListener('click', () => {
        modal.style.display = 'none';
        onConfirm();
    });

    const handleCancel = () => {
        modal.style.display = 'none';
        if (onCancel) onCancel();
    };

    btnCancel.onclick = handleCancel;
    window.onclick = (e) => { if (e.target == modal) handleCancel(); };
}

// --- Funzione Animazione Titolo Header (Marquee) ---
function animateTitleIfLong(titleElement) {
    if (!titleElement) return;

    // Usa un timeout per assicurare che il rendering sia completo
    setTimeout(() => {
        if (titleElement.scrollWidth > titleElement.clientWidth) {
            const distance = titleElement.scrollWidth - titleElement.clientWidth;
            const duration = distance / 30; // Velocità: 30px al secondo
            const parent = titleElement.parentElement;
            const originalJustify = parent.style.justifyContent;

            // Prepara per l'animazione
            titleElement.style.textOverflow = 'clip'; 
            titleElement.style.overflow = 'visible';
            titleElement.style.maxWidth = 'none';
            titleElement.style.textAlign = 'left';
            parent.style.justifyContent = 'flex-start';
            
            setTimeout(() => {
                titleElement.style.transition = `transform ${duration}s linear`;
                titleElement.style.transform = `translateX(-${distance}px)`;
                
                setTimeout(() => {
                    titleElement.style.transition = 'transform 0.5s ease';
                    titleElement.style.transform = 'translateX(0)';
                    setTimeout(() => {
                        titleElement.style.cssText = ''; // Resetta tutti gli stili inline
                        parent.style.justifyContent = originalJustify;
                    }, 500);
                }, duration * 1000 + 1500);
            }, 1000);
        }
    }, 100); // Breve ritardo per il rendering
}

// --- Funzione Modale di Input (Prompt) Personalizzato ---
function showPromptModal(title, message, defaultValue, onConfirm) {
    const modal = document.getElementById('prompt-modal');
    const titleEl = document.getElementById('prompt-title');
    const messageEl = document.getElementById('prompt-message');
    const inputEl = document.getElementById('prompt-input'); // This is a textarea
    const btnOk = document.getElementById('btn-prompt-ok');

    if (!modal || !titleEl || !messageEl || !inputEl || !btnOk) {
        // Fallback se il modale non è presente nell'HTML
        const result = prompt(message, defaultValue);
        if (result !== null) onConfirm(result);
        return;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    inputEl.value = defaultValue || '';
    modal.style.display = 'flex';

    // Auto-expand logic for textarea
    const autoExpand = () => {
        inputEl.style.height = 'auto';
        inputEl.style.height = (inputEl.scrollHeight) + 'px';
    };
    
    setTimeout(autoExpand, 10); // Set initial height after display
    inputEl.addEventListener('input', autoExpand);

    inputEl.focus();
    inputEl.select(); // Seleziona tutto il testo per facilitare la modifica

    // Rimuovi vecchi listener per evitare duplicazioni
    const newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    
    const confirmAction = () => {
        const value = inputEl.value;
        closeModal();
        onConfirm(value);
    };

    newBtnOk.addEventListener('click', confirmAction);
    
    // Supporto tasto Invio
    inputEl.onkeydown = (e) => { 
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent new line
            confirmAction(); 
        }
    };

    const closeModal = () => {
        modal.style.display = 'none';
        inputEl.removeEventListener('input', autoExpand); // Cleanup
        inputEl.style.height = ''; // Reset height
    };
    
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
    window.onclick = (e) => { 
        if (e.target == modal) {
            closeModal();
        }
    };
}

// --- Loop Globale Controllo Timer ---
// Questo assicura che il timer venga controllato su QUALSIASI pagina
function startGlobalTimerCheck() {
    setInterval(() => {
        const recoveryEndTime = getFromLocalStorage('recoveryEndTime');
        if (recoveryEndTime) {
            const now = Date.now();
            // Se il tempo è scaduto
            if (now >= recoveryEndTime) {
                const played = getFromLocalStorage('recoverySoundPlayed');
                if (!played) {
                    playNotificationSound();
                    saveToLocalStorage('recoverySoundPlayed', true);
                }
            }
        }
    }, 1000);
}

// --- Funzione Aggiornamento App (Cache Busting) ---
async function performAppUpdate() {
    console.log("Esecuzione aggiornamento app...");
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
        // Non mostriamo alert bloccanti nel flusso automatico, ma logghiamo
        throw error; // Rilancia per permettere la gestione errori nelle chiamate manuali
    }
}

// --- Controllo Aggiornamento Giornaliero (Safe) ---
async function checkDailyUpdate() {
    // Evita aggiornamenti se offline per non rompere la PWA
    if (!navigator.onLine) return;

    const today = new Date().toISOString().split('T')[0];
    const lastUpdate = localStorage.getItem('lastAutoUpdateDate');

    if (lastUpdate !== today) {
        console.log("Controllo connessione per aggiornamento giornaliero...");
        try {
            // Verifica connessione reale con timeout breve (3s) per evitare blocchi su reti lente
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch('./manifest.json?cb=' + Date.now(), { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
            clearTimeout(timeoutId);

            if (response.ok) {
                console.log("Connessione stabile. Eseguo aggiornamento...");
                localStorage.setItem('lastAutoUpdateDate', today);
                performAppUpdate();
            }
        } catch (e) {
            console.log("Connessione instabile. Salto aggiornamento.", e);
        }
    }
}

// --- GESTIONE BACKUP E RIPRISTINO ---

// Genera il JSON con tutti i dati
function getBackupData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }
    return JSON.stringify(data, null, 2);
}

// Esegue il backup (Condivisione Nativa o Download)
async function performBackup() {
    const data = getBackupData();
    const date = new Date().toISOString().slice(0, 10);
    const filename = `OnePercent_Backup_${date}.json`;
    const file = new File([data], filename, { type: 'application/json' });

    // Salva il mese corrente come "Backup Eseguito"
    const d = new Date();
    const currentMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    localStorage.setItem('lastBackupMonth', currentMonthKey);

    // Prova a usare la condivisione nativa (Drive, iCloud, ecc.)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: 'Backup OnePercent',
                text: `Backup dati allenamento del ${date}`
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Errore condivisione, fallback su download:', error);
                downloadBackup(file);
            }
        }
    } else {
        // Fallback: Download classico
        downloadBackup(file);
    }
}

function downloadBackup(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Importa i dati da un file JSON
async function importBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data || typeof data !== 'object') throw new Error("Formato file non valido");
                
                localStorage.clear();
                for (const key in data) {
                    localStorage.setItem(key, data[key]);
                }
                resolve();
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// Controlla se serve un backup (Promemoria Mensile)
function checkBackupReminder() {
    const d = new Date();
    const currentMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const lastBackup = localStorage.getItem('lastBackupMonth');
    const lastSkipped = localStorage.getItem('lastBackupSkippedMonth');
    
    if (lastBackup === currentMonthKey) return false;
    if (lastSkipped === currentMonthKey) return false;
    
    return true;
}