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
function showConfirmModal(title, message, onConfirm, confirmBtnClass = 'btn-elimina') {
    const modal = document.getElementById('confirmation-modal');
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    const btnOk = document.getElementById('btn-confirm-ok');
    const btnCancel = document.getElementById('btn-confirm-cancel');

    if (!modal || !titleEl || !messageEl || !btnOk || !btnCancel) {
        // Fallback se il modale non è presente nell'HTML
        if (confirm(message)) onConfirm();
        return;
    }

    titleEl.textContent = title;
    messageEl.innerHTML = message; // Usa innerHTML per permettere <br>
    
    // Reset stato pulsanti (nel caso fossero stati nascosti da logiche specifiche)
    btnOk.style.display = ''; 
    btnOk.className = confirmBtnClass; // Imposta la classe del pulsante (default: rosso)
    btnCancel.textContent = "Annulla";

    modal.style.display = 'flex';

    // Rimuovi vecchi listener per evitare duplicazioni
    const newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    
    newBtnOk.addEventListener('click', () => {
        modal.style.display = 'none';
        onConfirm();
    });

    btnCancel.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };
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

// --- Controllo Aggiornamento Settimanale ---
function checkWeeklyUpdate() {
    // Evita aggiornamenti se offline per non rompere la PWA
    if (!navigator.onLine) return;

    // Calcolo numero settimana ISO 8601
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); // Imposta al Giovedì corrente
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    
    const currentWeekKey = `${d.getFullYear()}-W${weekNumber}`;
    const lastUpdateKey = localStorage.getItem('lastAutoUpdateWeek');

    if (lastUpdateKey !== currentWeekKey) {
        console.log(`Nuova settimana (${currentWeekKey}). Eseguo aggiornamento automatico...`);
        localStorage.setItem('lastAutoUpdateWeek', currentWeekKey);
        performAppUpdate();
    }
}