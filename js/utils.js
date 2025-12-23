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