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
            requestNotificationPermission();
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
    // Sulla Home NON intercettiamo il tasto indietro.
    // Lasciamo che il browser gestisca l'azione (chiusura app o ritorno alla pagina precedente),
    // evitando il loop infinito causato dal pushState continuo.
    if (currentPage === 'home') return;

    // Inseriamo uno stato fittizio nella history per intercettare il "back"
    // Usiamo un oggetto state per identificare che è uno stato gestito da noi
    const state = { page: currentPage, gymbook: true };
    
    // Imposta il ripristino dello scroll manuale per evitare salti
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    // Spingiamo lo stato per creare il "cuscinetto" di navigazione
    history.pushState(state, '', location.href);

    window.addEventListener('popstate', (event) => {
        // Impediamo al browser di tornare indietro nella history reale
        // e reinseriamo lo stato per mantenere il blocco se l'utente preme ancora back
        history.pushState(state, '', location.href);

        const params = new URLSearchParams(window.location.search);
        const pianoId = params.get('pianoId');
        const routineId = params.get('routineId');
        const mode = params.get('mode');
        const from = params.get('from');

        // Logica ad albero: definisce il "Genitore" di ogni pagina
        switch (currentPage) {
            case 'home':
                // Rimaniamo sulla home. Il pushState all'inizio del listener ha già annullato l'azione.
                return; 
            case 'piani':
                window.location.replace('index.html');
                break;
            case 'routine':
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
                const activeWorkout = getFromLocalStorage('activeWorkout');
                const isPreviewMode = activeWorkout && (activeWorkout.pianoId !== pianoId || activeWorkout.routineId !== routineId);

                // Se siamo in modalità anteprima ("allenamento-anteprima"), torniamo alla home.
                // Anche dall'allenamento attivo, il comportamento di default è tornare alla home.
                window.location.replace('index.html');
                break;
        }
    });
}