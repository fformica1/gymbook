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

    // --- Controllo Aggiornamento Settimanale ---
    if (typeof checkWeeklyUpdate === 'function') checkWeeklyUpdate();

    // --- Inizializzazione Gestore Allenamento Globale ---
    // SPOSTATO QUI (Prima del setup pagine) per garantire che sia pronto all'uso
    try {
        initGlobalWorkoutManager();
    } catch (e) {
        console.error("Errore initGlobalWorkoutManager:", e);
    }

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

function initGlobalWorkoutManager() {
    // Se esiste già, non ricrearlo
    if (window.globalWorkoutManager) return;

    // Worker Blob con Timer Auto-Correttivo (Drift Correction)
    // Questo assicura che il timer non perda colpi anche se il browser rallenta l'esecuzione
    const timerWorkerBlob = new Blob([`
        let expected;
        let timeoutId;

        function step() {
            const dt = Date.now() - expected; // Calcola la deriva temporale
            if (dt > 1000) {
                // Se la deriva è enorme (es. tab sospeso a lungo), resetta l'aspettativa
                expected = Date.now();
            }
            
            self.postMessage('tick');
            
            expected += 1000;
            // Pianifica il prossimo tick sottraendo la deriva per restare sincronizzati
            timeoutId = setTimeout(step, Math.max(0, 1000 - dt));
        }

        self.onmessage = function(e) {
            if (e.data === 'start') {
                expected = Date.now() + 1000;
                step();
            } else if (e.data === 'stop') {
                clearTimeout(timeoutId);
            }
        };
    `], { type: 'text/javascript' });

    window.globalWorkoutManager = {
        audioCtx: null,
        oscillator: null,
        worker: new Worker(URL.createObjectURL(timerWorkerBlob)),
        
        start: function() {
            // Reset variabili notifica per forzare l'aggiornamento immediato
            lastNotificationTitle = null;
            lastNotificationBody = null;

            // Inizializza Web Audio API (Più robusto dell'elemento <audio> per il background)
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioCtx = new AudioContext();
            }

            const resumeAudio = () => {
                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }
                // Crea un oscillatore silenzioso ma attivo per tenere sveglio il thread audio
                if (!this.oscillator) {
                    this.oscillator = this.audioCtx.createOscillator();
                    const gainNode = this.audioCtx.createGain();
                    gainNode.gain.value = 0.001; // Volume quasi zero (non zero per evitare ottimizzazioni)
                    this.oscillator.connect(gainNode);
                    gainNode.connect(this.audioCtx.destination);
                    this.oscillator.start();
                }
                document.removeEventListener('click', resumeAudio);
                document.removeEventListener('touchstart', resumeAudio);
            };

            // Tenta avvio immediato o al primo tocco
            resumeAudio();
            document.addEventListener('click', resumeAudio);
            document.addEventListener('touchstart', resumeAudio);

            // Media Session API
            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: "Allenamento in Corso",
                    artist: "one percent",
                    album: "Timer Attivo",
                    artwork: [{ src: 'icon-browser.png', sizes: '192x192', type: 'image/png' }]
                });
                navigator.mediaSession.playbackState = 'playing';
            }

            // Avvia Worker
            this.worker.postMessage('start');
        },

        stop: function() {
            if (this.oscillator) {
                try { this.oscillator.stop(); } catch(e) {}
                this.oscillator = null;
            }
            this.worker.postMessage('stop');
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
        }
    };

    // Gestione Tick del Worker
    window.globalWorkoutManager.worker.onmessage = function(e) {
        if (e.data === 'tick') {
            // 1. Aggiorna Notifica
            updateGlobalNotification();
            
            // 2. Controlla fine recupero (Audio)
            const recoveryEndTime = localStorage.getItem('recoveryEndTime');
            if (recoveryEndTime) {
                const now = Date.now();
                if (now >= recoveryEndTime && !localStorage.getItem('recoverySoundPlayed')) {
                    if (typeof playNotificationSound === 'function') playNotificationSound();
                    localStorage.setItem('recoverySoundPlayed', 'true');
                }
            }
        }
    };

    // Se c'è un allenamento attivo al caricamento della pagina, riavvia il manager
    if (localStorage.getItem('workoutStartTime')) {
        window.globalWorkoutManager.start();
    }
}

let lastNotificationTitle = null;
let lastNotificationBody = null;

function updateGlobalNotification() {
    if (localStorage.getItem('notificationsEnabled') === 'false') return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const activeWorkout = JSON.parse(localStorage.getItem('activeWorkout'));
    if (!activeWorkout) return;

    const piani = JSON.parse(localStorage.getItem('pianiDiAllenamento')) || [];
    const piano = piani.find(p => p.id === activeWorkout.pianoId);
    const routine = piano?.routine.find(r => r.id === activeWorkout.routineId);
    if (!routine) return;

    // Calcolo Prossimo Set (Logica identica alla Home)
    const workoutState = JSON.parse(localStorage.getItem('activeWorkoutState'));
    let nextSetText = "Inizio Allenamento";
    let foundNext = false;

    if (routine.esercizi && routine.esercizi.length > 0) {
        for (const ex of routine.esercizi) {
            if (foundNext) break;
            
            // Controlla se esiste uno stato salvato per questo esercizio
            const exState = workoutState?.esercizi?.[ex.id];
            
            if (exState && exState.serie) {
                // Cerca la prima serie non completata nello stato
                const firstIncompleteIndex = exState.serie.findIndex(s => !s.completed);
                if (firstIncompleteIndex !== -1) {
                    const s = exState.serie[firstIncompleteIndex];
                    nextSetText = `→ ${ex.nome}: ${s.kg}kg x ${s.reps}`;
                    foundNext = true;
                }
            } else {
                // Se non c'è stato (es. inizio allenamento), prendi la prima serie della definizione
                if (ex.serie && ex.serie.length > 0) {
                    const s = ex.serie[0];
                    nextSetText = `→ ${ex.nome}: ${s.kg}kg x ${s.reps}`;
                    foundNext = true;
                }
            }
        }
        
        if (!foundNext && workoutState) {
            nextSetText = "Allenamento Completato";
        }
    }

    // Titolo
    let title = routine.nome;
    let body = nextSetText;

    const recoveryEndTime = localStorage.getItem('recoveryEndTime');
    if (recoveryEndTime) {
        const now = Date.now();
        if (recoveryEndTime > now) {
            const remaining = Math.ceil((recoveryEndTime - now) / 1000);
            const min = Math.floor(remaining / 60);
            const sec = String(remaining % 60).padStart(2, '0');
            title = `Recupero: ${min}:${sec}`;
            // body resta nextSetText per sapere cosa fare dopo
        } else {
            title = `RECUPERO TERMINATO!`;
            // body resta nextSetText per sapere cosa fare dopo
        }
    }

    // Ottimizzazione: Non aggiornare se il contenuto è identico (evita wake screen)
    if (title === lastNotificationTitle && body === lastNotificationBody) return;
    
    // Se lastNotificationTitle è null, significa che è la prima notifica della sessione.
    // In questo caso forziamo renotify: true per assicurarci che appaia visibilmente.
    const shouldRenotify = (lastNotificationTitle === null);

    lastNotificationTitle = title;
    lastNotificationBody = body;

    // Invia Notifica
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(title, {
                body: body,
                icon: 'icon-notification.png',
                badge: 'icon-notification.png',
                tag: 'gymbook-active-workout',
                renotify: shouldRenotify, // True solo all'avvio, False per gli aggiornamenti
                silent: true,
                ongoing: true,
                data: { url: 'allenamento.html?pianoId=' + activeWorkout.pianoId + '&routineId=' + activeWorkout.routineId }
            });
        });
    }
}

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
    
    // RIPRISTINO LOGICA v1.15.4: Creazione condizionale del cuscinetto
    if (currentPage === 'home') {
        // Sulla Home forziamo sempre la creazione del cuscinetto per il loop
        history.replaceState(state, '', location.href);
        history.pushState(state, '', location.href);
    } else if (history.state === null) {
        // Sulle altre pagine lo creiamo solo se manca (es. refresh o primo accesso diretto)
        // Se arriviamo da un replace() interno, manteniamo lo stato esistente per non rompere la navigazione
        history.pushState(state, '', location.href);
    }

    // 3. Gestione Evento Indietro (popstate)
    window.addEventListener('popstate', (event) => {
        // Se siamo sulla HOME:
        // L'utente non deve uscire o tornare indietro.
        // Reinseriamo immediatamente lo stato per mantenere il blocco (loop).
        if (currentPage === 'home') {
            history.pushState(state, '', location.href);
            // Forza il ricaricamento/blocco sulla home come richiesto
            window.location.replace('index.html');
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