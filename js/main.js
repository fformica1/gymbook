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

    // --- Disabilita Menu Contestuale (Pressione prolungata) ---
    window.oncontextmenu = function(event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
    };

    // --- Disabilita Pinch-to-Zoom (iOS Safari ignora user-scalable=no) ---
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });

    // --- Gestione Navigazione Globale (Usa replace per non accumulare history) ---
    // Questo impedisce che si crei una cronologia "indietro" navigando nell'app
    document.body.addEventListener('click', (e) => {
        // Richiedi permesso notifiche al primo click utile nell'app
        if (typeof requestNotificationPermission === 'function') {
            if (localStorage.getItem('notificationsEnabled') !== 'false') {
                requestNotificationPermission();
            }
        }

        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        // Intercetta TUTTI i link interni che portano a pagine HTML (esclusi link esterni, ancore, js)
        if (href && (href.endsWith('.html') || href.includes('.html?')) && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('javascript')) {
            
            e.preventDefault();
            const targetUrl = link.href;
            
            if (window.location.href !== targetUrl) {
                window.location.replace(targetUrl);
            }
        }
    });

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

    // --- Gestione Tasto Indietro Nativo (Tree Navigation) ---
    manageNativeBackButton(currentPage);

    // --- Avvia il controllo globale del timer (Background Check) ---
    if (typeof startGlobalTimerCheck === 'function') startGlobalTimerCheck();
});

function manageNativeBackButton(currentPage) {
    // 1. Configurazione History API
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    // 2. Creazione "Trappola" Immediata
    // Appena la pagina carica, manipoliamo la history per garantire che il tasto indietro
    // sia intercettabile fin dal PRIMO tocco.
    // replaceState: consolida l'URL corrente come "base".
    // pushState: aggiunge un nuovo stato fittizio in cima.
    // Risultato: L'utente è visivamente sulla pagina, ma tecnicamente è "avanti" di 1 step.
    // Premendo indietro, torna allo stato "base" e scatta l'evento 'popstate'.
    const state = { page: currentPage, gymbook: true };
    history.replaceState(state, '', location.href);
    history.pushState(state, '', location.href);

    // 3. Gestione Evento Indietro (popstate)
    window.addEventListener('popstate', (event) => {
        // Se siamo sulla HOME:
        // L'utente non deve uscire o tornare indietro.
        // Reinseriamo immediatamente lo stato per mantenere il blocco (loop).
        if (currentPage === 'home') {
            history.pushState(state, '', location.href);
            return;
        }

        // Se siamo su ALTRE PAGINE:
        // Non usiamo history.back() (che seguirebbe la cronologia temporale).
        // Usiamo location.replace() per navigare forzatamente al GENITORE gerarchico.
        
        // Recuperiamo i parametri per decidere il genitore corretto
        const params = new URLSearchParams(window.location.search);
        const pianoId = params.get('pianoId');
        const routineId = params.get('routineId');
        const mode = params.get('mode');
        const from = params.get('from');

        // Definiamo la destinazione (Genitore)
        switch (currentPage) {
            case 'piani':
                window.location.replace('index.html');
                break;
            case 'routine':
                // Se ho un pianoId torno ai piani, altrimenti home (fallback)
                window.location.replace('piani.html'); 
                break;
            case 'routine-dettaglio':
                if (from === 'home') window.location.replace('index.html');
                else if (pianoId) window.location.replace(`routine.html?pianoId=${pianoId}`);
                else window.location.replace('piani.html');
                break;
            case 'esercizi':
                if (mode === 'selection' && pianoId && routineId) {
                    window.location.replace(`routine-dettaglio.html?pianoId=${pianoId}&routineId=${routineId}`);
                } else {
                    window.location.replace('index.html');
                }
                break;
            case 'impostazioni':
                window.location.replace('index.html');
                break;
            case 'allenamento':
                // Dall'allenamento si torna sempre alla Home
                window.location.replace('index.html');
                break;
            default:
                // Fallback di sicurezza
                window.location.replace('index.html');
        }
    });
}