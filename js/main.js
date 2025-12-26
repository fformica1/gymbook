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
});

function manageNativeBackButton(currentPage) {
    // Inseriamo uno stato fittizio nella history per intercettare il "back"
    // Lo facciamo su TUTTE le pagine, inclusa la Home, per evitare che dalla Home si torni a pagine interne
    history.pushState(null, null, location.href);

    window.addEventListener('popstate', (event) => {
        // Impediamo al browser di tornare indietro nella history reale
        // e reinseriamo lo stato per mantenere il blocco se l'utente preme ancora back
        history.pushState(null, null, location.href);

        const params = new URLSearchParams(window.location.search);
        const pianoId = params.get('pianoId');
        const routineId = params.get('routineId');
        const mode = params.get('mode');
        const from = params.get('from');

        // Logica ad albero: definisce il "Genitore" di ogni pagina
        switch (currentPage) {
            case 'home':
                // Rimaniamo sulla home (blocco navigazione all'indietro)
                break;
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