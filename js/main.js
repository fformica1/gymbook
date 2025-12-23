// js/main.js - Router principale e inizializzazione

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente caricato. Inizializzo l'applicazione (Nuova Struttura).");

    // --- Registrazione Service Worker (PWA) ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker registrato con successo:', registration.scope);
            })
            .catch(error => {
                console.log('Registrazione Service Worker fallita:', error);
            });
    }

    // Funzione per determinare la pagina corrente
    const getCurrentPage = () => {
        const path = window.location.pathname;
        if (path.includes('piani.html')) return 'piani';
        if (path.includes('routine.html')) return 'routine';
        if (path.includes('routine-dettaglio.html')) return 'routine-dettaglio';
        if (path.includes('esercizi.html')) return 'esercizi';
        if (path.includes('allenamento.html')) return 'allenamento';
        if (path.includes('impostazioni.html')) return 'impostazioni';
        if (path.endsWith('/') || path.includes('index.html')) return 'home';
        return 'unknown'; // Pagina non gestita
    };

    const currentPage = getCurrentPage();
    console.log(`Pagina corrente: ${currentPage}`);

    // Gestione automatica dello spazio per l'header fisso (Globale)
    // Nota: Nella pagina allenamento l'header ha una classe diversa, gestita dal CSS specifico
    const appHeader = document.querySelector('.app-header');
    if (appHeader) {
        document.body.style.paddingTop = `${appHeader.offsetHeight + 20}px`;
    }

    // --- MEMORIA NAVIGAZIONE SEZIONE PIANI ---
    if (['piani', 'routine', 'routine-dettaglio'].includes(currentPage)) {
        localStorage.setItem('lastPianiPage', window.location.href);
    }

    const pianiNavLink = document.querySelector('.bottom-nav a[href="piani.html"]');
    if (pianiNavLink) {
        pianiNavLink.addEventListener('click', (e) => {
            if (!['piani', 'routine', 'routine-dettaglio'].includes(currentPage)) {
                e.preventDefault();
                const lastPianiPage = localStorage.getItem('lastPianiPage');
                window.location.href = lastPianiPage || 'piani.html';
            }
        });
    }

    // Applica il tema salvato all'avvio (funzione in utils.js)
    if (typeof applyTheme === 'function') applyTheme();

    // Inizializza la logica specifica per ogni pagina
    // Le funzioni setup... sono definite nei rispettivi file in js/pages/
    switch (currentPage) {
        case 'home':
            if (window.setupHomePage) window.setupHomePage();
            break;
        case 'piani':
            if (window.setupPianiPage) window.setupPianiPage();
            break;
        case 'routine':
        case 'routine-dettaglio':
            if (window.setupRoutinePage) window.setupRoutinePage(); // Gestisce entrambi i casi o separati
            break;
        case 'esercizi':
            if (window.setupEserciziPage) window.setupEserciziPage();
            break;
        case 'allenamento':
            if (window.setupAllenamentoPage) window.setupAllenamentoPage();
            break;
        case 'impostazioni':
            if (window.setupImpostazioniPage) window.setupImpostazioniPage();
            break;
        default:
            if (currentPage !== 'unknown') console.log("Nessuna logica specifica per questa pagina.");
    }
});