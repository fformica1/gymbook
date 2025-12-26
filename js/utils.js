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
    const btnCancel = document.getElementById('btn-prompt-cancel');

    if (!modal || !titleEl || !messageEl || !inputEl || !btnOk || !btnCancel) {
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
    
    btnCancel.onclick = closeModal;
    window.onclick = (e) => { 
        if (e.target == modal) {
            closeModal();
        }
    };
}