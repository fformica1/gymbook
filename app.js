// app.js - Il cervello della nostra applicazione

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente caricato. Inizializzo l'applicazione.");

    // Funzione per determinare la pagina corrente
    const getCurrentPage = () => {
        const path = window.location.pathname;
        if (path.includes('piani.html')) return 'piani';
        if (path.includes('routine.html')) return 'routine';
        if (path.includes('routine-dettaglio.html')) return 'routine-dettaglio';
        if (path.includes('esercizi.html')) return 'esercizi';
        if (path.includes('allenamento.html')) return 'allenamento';
        if (path.includes('impostazioni.html')) return 'impostazioni';
        return 'home'; // index.html o qualsiasi altra pagina non specificata
    };

    const currentPage = getCurrentPage();
    console.log(`Pagina corrente: ${currentPage}`);

    // Gestione automatica dello spazio per l'header fisso
    const appHeader = document.querySelector('.app-header');
    if (appHeader) {
        document.body.style.paddingTop = `${appHeader.offsetHeight + 20}px`;
    }

    // --- MEMORIA NAVIGAZIONE SEZIONE PIANI ---
    // 1. Se siamo in una pagina della sezione Piani, salviamo l'URL corrente
    if (['piani', 'routine', 'routine-dettaglio'].includes(currentPage)) {
        localStorage.setItem('lastPianiPage', window.location.href);
    }

    // 2. Intercettiamo il click sul link "Piani" nella navbar per ripristinare l'ultima pagina visitata
    const pianiNavLink = document.querySelector('.bottom-nav a[href="piani.html"]');
    if (pianiNavLink) {
        pianiNavLink.addEventListener('click', (e) => {
            // Usa la memoria solo se siamo fuori dalla sezione Piani
            if (!['piani', 'routine', 'routine-dettaglio'].includes(currentPage)) {
                e.preventDefault();
                const lastPianiPage = localStorage.getItem('lastPianiPage');
                window.location.href = lastPianiPage || 'piani.html';
            }
        });
    }

    // Applica il tema salvato all'avvio
    applyTheme();

    // --- FIX CSS: Colore righe completate (tema chiaro) ---
    // Inietta una regola CSS per garantire che le righe completate siano verdi
    // anche sulle righe pari (che spesso hanno un background alternato che sovrascrive il colore).
    const styleFix = document.createElement('style');
    styleFix.innerHTML = `
        [data-theme="light"] .set-row.completed {
            background-color: rgba(40, 167, 69, 0.25) !important;
        }

        /* FIX: Leggibilità Timer Recupero (Tema Scuro) */
        [data-theme="dark"] .recovery-timer .timer-display,
        [data-theme="dark"] .recovery-timer .btn-timer-adjust,
        [data-theme="dark"] .recovery-timer button {
            color: #ffffff !important;
        }
    `;
    document.head.appendChild(styleFix);

    // Inizializza la logica specifica per ogni pagina
    switch (currentPage) {
        case 'home':
            setupHomePage();
            break;
        case 'piani':
            setupPianiPage();
            break;
        case 'routine':
            setupRoutinePage();
            break;
        case 'routine-dettaglio':
            setupRoutineDettaglioPage();
            break;
        case 'esercizi':
            setupEserciziPage();
            break;
        case 'allenamento':
            setupAllenamentoPage();
            break;
        case 'impostazioni':
            setupImpostazioniPage();
            break;
        default:
            console.log("Nessuna logica specifica per questa pagina.");
    }
});

// --- Funzioni di utilità globali ---

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
        // Assumiamo che tu abbia un file chiamato 'notification.mp3' nella cartella del progetto.
        // Puoi cambiare il nome del file se necessario.
        notificationAudio = new Audio('notification.mp3'); 
    }

    // Prova a riprodurre il suono. Il .catch() gestisce eventuali errori
    // dovuti alle policy di autoplay dei browser.
    notificationAudio.play().catch(error => {
        try {
            console.error("Errore nella riproduzione dell'audio:", error);
        } catch (e) {}
    });
}

// --- Logica specifica per ogni pagina ---

function setupImpostazioniPage() {
    console.log("Setup Impostazioni Page");
    const themeSelect = document.getElementById('theme-select');
    
    // Imposta il valore iniziale del selettore
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (themeSelect) {
        themeSelect.value = currentTheme;
        
        themeSelect.addEventListener('change', (e) => {
            const newTheme = e.target.value;
            localStorage.setItem('theme', newTheme);
            applyTheme();
        });
    }
}

function setupHomePage() {
    console.log("Setup Home Page");
    const activePlanNameEl = document.querySelector('#active-plan-name');
    const routineListHomeEl = document.querySelector('#routine-list-home');
    
    renderHomePage();

    // Aggiungi listener per l'evento pageshow per gestire il ripristino dalla cache (bfcache)
    // Questo assicura che il banner dell'allenamento attivo venga mostrato/nascosto correttamente
    // quando si torna alla home page usando il pulsante "indietro" del browser.
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            console.log("Pagina ripristinata dalla cache (pageshow). Rirenderizzo la Home.");
            renderHomePage();
        }
    });

    function renderHomePage() {
        const activePianoId = getFromLocalStorage('activePianoId');
        const piani = getFromLocalStorage('pianiDiAllenamento') || [];
        const activePiano = piani.find(p => p.id === activePianoId);

        if (activePiano) {
            activePlanNameEl.textContent = activePiano.nome;
            routineListHomeEl.innerHTML = '';
            if (activePiano.routine.length > 0) {
                const storico = getFromLocalStorage('storicoAllenamenti') || [];

                activePiano.routine.forEach(r => {
                    // Trova l'ultimo allenamento per questa routine
                    // Usiamo .find() che trova la prima occorrenza. Dato che lo storico è ordinato
                    // con i più recenti all'inizio (con unshift), questo è corretto.
                    const ultimoAllenamento = storico.find(log => log.routineId === r.id);
                    let testoUltimoAllenamento = '';

                    if (ultimoAllenamento) {
                        const oggi = new Date();
                        const dataAllenamento = new Date(ultimoAllenamento.data);
                        oggi.setHours(0, 0, 0, 0);
                        dataAllenamento.setHours(0, 0, 0, 0);

                        const diffTime = oggi - dataAllenamento;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays === 0) {
                            testoUltimoAllenamento = 'Oggi';
                        } else if (diffDays === 1) {
                            testoUltimoAllenamento = 'Ieri';
                        } else {
                            testoUltimoAllenamento = `${diffDays} gg fa`;
                        }
                    }

                    const routineDiv = document.createElement('div');
                    routineDiv.setAttribute('draggable', 'true');
                    routineDiv.dataset.routineId = r.id;
                    routineDiv.className = 'list-item-container';
                    routineDiv.innerHTML = `
                        <span class="drag-handle">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                        </span>
                        <a href="allenamento.html?pianoId=${activePiano.id}&routineId=${r.id}" class="title-link">
                            <h3>${r.nome}</h3></a>
                        <span class="last-workout-date">${testoUltimoAllenamento}</span>
                    `;
                    routineListHomeEl.appendChild(routineDiv);
                });
            } else {
                routineListHomeEl.innerHTML = '<p>Questo piano non ha ancora nessuna routine. Aggiungine una dalla sezione Piani di Allenamento.</p>';
            }
        } else {
            activePlanNameEl.textContent = 'Nessun piano attivo';
            routineListHomeEl.innerHTML = '<p>Seleziona un piano di allenamento per visualizzare le sue routine.</p>';
        }

        // --- Logica Drag and Drop (compatibile con Mouse e Touch) ---
        let draggedItem = null;

        // Aggiungo i listener a tutto il contenitore per delegare l'evento
        routineListHomeEl.addEventListener('mousedown', startDrag);
        routineListHomeEl.addEventListener('touchstart', startDrag, { passive: false });

        function startDrag(e) {
            // Controlla se l'evento è partito dalla maniglia
            const handle = e.target.closest('.drag-handle');
            if (!handle) return;

            // Impedisce comportamenti di default come la selezione del testo o lo scroll
            e.preventDefault();

            draggedItem = e.target.closest('.list-item-container');
            if (!draggedItem) return;

            // Aggiungi un piccolo ritardo per dare un feedback visivo
            setTimeout(() => draggedItem.classList.add('dragging'), 0);

            // Aggiungi i listener per il movimento e il rilascio
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
        }

        function onDrag(e) {
            if (!draggedItem) return;
            e.preventDefault(); // Previene lo scroll della pagina su touch

            const y = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            const afterElement = getDragAfterElement(routineListHomeEl, y);

            if (afterElement == null) {
                routineListHomeEl.appendChild(draggedItem);
            } else {
                routineListHomeEl.insertBefore(draggedItem, afterElement);
            }
        }

        function endDrag() {
            if (!draggedItem) return;

            draggedItem.classList.remove('dragging');

            // Salva il nuovo ordine nel localStorage
            const newRoutineOrderIds = Array.from(routineListHomeEl.querySelectorAll('.list-item-container')).map(el => el.dataset.routineId);
            const piani = getFromLocalStorage('pianiDiAllenamento') || [];
            const pianoDaAggiornare = piani.find(p => p.id === activePianoId);
            if (pianoDaAggiornare) {
                pianoDaAggiornare.routine.sort((a, b) => newRoutineOrderIds.indexOf(a.id) - newRoutineOrderIds.indexOf(b.id));
                saveToLocalStorage('pianiDiAllenamento', piani);
                console.log("Nuovo ordine delle routine salvato.");
            }

            draggedItem = null;
            // Rimuovi i listener globali
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('touchmove', onDrag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.list-item-container:not(.dragging)')];

            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        // --- Logica per il banner dell'allenamento in corso ---
        const activeWorkout = getFromLocalStorage('activeWorkout');
        const workoutBanner = document.querySelector('#active-workout-banner');

        if (activeWorkout && workoutBanner) {
            const { pianoId, routineId } = activeWorkout;
            const piani = getFromLocalStorage('pianiDiAllenamento') || [];
            const piano = piani.find(p => p.id === pianoId);
            const routine = piano?.routine.find(r => r.id === routineId);

            if (routine) {
                // Popola e mostra il banner
                workoutBanner.style.display = 'block';
                document.body.style.paddingBottom = `${workoutBanner.offsetHeight + 100}px`; // Aggiunge padding per banner + nav

                workoutBanner.querySelector('.routine-title').textContent = routine.nome;
                const bannerTimerEl = workoutBanner.querySelector('.workout-timer');
                const bannerLink = workoutBanner.querySelector('.workout-banner-link');
                
                // Costruisci il link corretto per tornare all'allenamento
                bannerLink.href = `allenamento.html?pianoId=${pianoId}&routineId=${routineId}`;

                // Avvia il timer nel banner
                const startTime = getFromLocalStorage('workoutStartTime');
                if (startTime) {
                    // Evita di creare intervalli multipli se la funzione viene chiamata più volte
                    if (window.bannerWorkoutTimer) {
                        clearInterval(window.bannerWorkoutTimer);
                    }

                    const updateBannerTimer = () => {
                        const currentTime = Date.now();
                        const totalSeconds = Math.floor((currentTime - startTime) / 1000);

                        let hours = Math.floor(totalSeconds / 3600);
                        let minutes = Math.floor((totalSeconds % 3600) / 60);

                        hours = String(hours).padStart(2, '0');
                        minutes = String(minutes).padStart(2, '0');

                        if (bannerTimerEl) {
                            bannerTimerEl.textContent = `${hours}:${minutes}`;
                        }
                    };

                    updateBannerTimer(); // Aggiorna subito senza aspettare 1 secondo
                    window.bannerWorkoutTimer = setInterval(updateBannerTimer, 1000);
                }

                // --- Logica per il TIMER DI RECUPERO nel banner ---
                const recoveryContainer = workoutBanner.querySelector('.recovery-timer');
                const recoveryDisplay = recoveryContainer.querySelector('.timer-display');

                const updateRecoveryBanner = () => {
                    const recoveryEndTime = getFromLocalStorage('recoveryEndTime');
                    if (recoveryEndTime) {                    
                        const remainingMs = recoveryEndTime - Date.now();

                        if (remainingMs > 0) {
                            const remainingSeconds = Math.round(remainingMs / 1000);
                            const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
                            const seconds = String(remainingSeconds % 60).padStart(2, '0');
                            recoveryDisplay.textContent = `${minutes}:${seconds}`;                        
                            recoveryContainer.classList.remove('timer-finished');
                        } else {
                            recoveryDisplay.textContent = '00:00';
                            recoveryContainer.classList.add('timer-finished');
                            // Controlla se il timer è appena scaduto (e non era già scaduto)
                            const wasAlreadyFinished = getFromLocalStorage('recoverySoundPlayed');
                            if (!wasAlreadyFinished) {
                                playNotificationSound();
                                saveToLocalStorage('recoverySoundPlayed', true);
                            }
                        }
                    } else {
                        recoveryDisplay.textContent = '00:00';
                        recoveryContainer.classList.remove('timer-finished');
                    }
                };

                // Avvia un intervallo per aggiornare il timer di recupero nel banner
                if (window.bannerRecoveryTimer) clearInterval(window.bannerRecoveryTimer);
                window.bannerRecoveryTimer = setInterval(updateRecoveryBanner, 500);
                updateRecoveryBanner(); // Chiamata iniziale

                // Aggiungi listener ai pulsanti del timer del banner
                recoveryContainer.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault(); // Impedisce al link di essere seguito
                        e.stopPropagation(); // Ferma la propagazione per non attivare il link del banner

                        const adjustment = e.target.dataset.adjust;
                        if (adjustment) {
                            const adjustmentMs = parseInt(adjustment, 10) * 1000;
                            let recoveryEndTime = getFromLocalStorage('recoveryEndTime') || Date.now();
                            // Se il timer è già scaduto, lo riavvia dal tempo aggiunto
                            if (recoveryEndTime < Date.now()) recoveryEndTime = Date.now();
                            
                            recoveryEndTime += adjustmentMs;
                            saveToLocalStorage('recoveryEndTime', recoveryEndTime);
                        } else if (e.target.classList.contains('btn-timer-skip')) {
                            localStorage.removeItem('recoveryEndTime');
                            // Quando si salta, si ferma anche il suono/vibrazione se attivo
                            recoveryContainer.classList.remove('timer-finished');
                        }
                        localStorage.removeItem('recoverySoundPlayed'); // Resetta il flag del suono
                        updateRecoveryBanner(); // Aggiorna subito la UI
                    });
                });


            } else {
                // Se la routine non viene trovata, nascondi il banner
                workoutBanner.style.display = 'none';
                document.body.style.paddingBottom = ''; // Ripristina il padding CSS
            }
        } else if (workoutBanner) {
            // Nascondi il banner se non ci sono allenamenti attivi
            workoutBanner.style.display = 'none';
            document.body.style.paddingBottom = ''; // Ripristina il padding CSS
        }
    }

    // Aggiungi un listener per impedire l'avvio di una nuova routine se una è già attiva
    routineListHomeEl.addEventListener('click', (e) => {
        const link = e.target.closest('a.title-link');
        if (!link) return; // Se non è stato cliccato un link, non fare nulla

        const activeWorkout = getFromLocalStorage('activeWorkout');
        if (activeWorkout) {
            e.preventDefault(); // Blocca la navigazione
        }
        // Se non ci sono allenamenti attivi, il link funzionerà normalmente
    });
}

function setupPianiPage() {
    console.log("Setup Piani Page");
    const formCreaPiano = document.querySelector('#piani-form-crea-piano'); // Selettore più specifico
    const listaPiani = document.querySelector('#lista-piani-esistenti');

    // Carica e mostra i piani esistenti all'avvio
    renderPiani();

    if (formCreaPiano) {
        formCreaPiano.addEventListener('submit', (event) => {
            event.preventDefault(); // Impedisce il ricaricamento della pagina
            const nomePianoInput = formCreaPiano.querySelector('#nome-piano');
            const nomePiano = nomePianoInput.value.trim();

            if (nomePiano) {
                let piani = getFromLocalStorage('pianiDiAllenamento') || [];
                const nuovoPiano = { id: Date.now().toString(), nome: nomePiano, routine: [] };
                piani.push(nuovoPiano);
                saveToLocalStorage('pianiDiAllenamento', piani);
                nomePianoInput.value = ''; // Pulisce il campo input
                renderPiani(); // Aggiorna la lista visualizzata
            } else {
                alert("Inserisci un nome per il piano di allenamento.");
            }
        });
    }

    function renderPiani() {
        const piani = getFromLocalStorage('pianiDiAllenamento') || [];
        listaPiani.innerHTML = ''; // Pulisce la lista attuale

        if (piani.length === 0) {
            listaPiani.innerHTML = '<p>Nessun piano di allenamento creato. Inizia ora!</p>';
            return;
        }

        piani.forEach(piano => {
            const activePianoId = getFromLocalStorage('activePianoId'); // Aggiunto per riferimento
            const isSelected = piano.id === activePianoId;

            const pianoDiv = document.createElement('div');
            pianoDiv.className = 'list-item-container';

            pianoDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1; min-width: 0;">
                    <input type="checkbox" class="plan-selector" data-id="${piano.id}" ${isSelected ? 'checked' : ''} style="transform: scale(1.3);">
                    <a href="routine.html?pianoId=${piano.id}" class="title-link"><h3>${piano.nome}</h3></a>
                </div>
            `;
            listaPiani.appendChild(pianoDiv);
        });

        // Aggiungi listener per i checkbox "Seleziona"
        listaPiani.querySelectorAll('.plan-selector').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                const pianoIdToActivate = event.target.dataset.id;
                if (event.target.checked) {
                    saveToLocalStorage('activePianoId', pianoIdToActivate);
                } else {
                    const currentActive = getFromLocalStorage('activePianoId');
                    if (currentActive === pianoIdToActivate) {
                        localStorage.removeItem('activePianoId');
                    }
                }
                renderPiani(); // Ricarica la lista per aggiornare lo stato
            });
        });
    }
}

function setupRoutinePage() {
    console.log("Setup Routine Page");
    const params = new URLSearchParams(window.location.search);
    const pianoId = params.get('pianoId');

    if (!pianoId) {
        document.querySelector('.content-wrapper').innerHTML = '<h1>Errore: Piano non specificato.</h1><a href="piani.html">Torna ai piani</a>';
        return;
    }

    const formCreaRoutine = document.querySelector('#routine-form-crea');
    const listaRoutine = document.querySelector('#lista-routine-esistenti');
    const titoloPagina = document.querySelector('#nome-piano-titolo');

    // Carica e mostra le routine esistenti
    renderRoutines();

    formCreaRoutine.addEventListener('submit', (event) => {
        event.preventDefault();
        const nomeRoutineInput = document.querySelector('#nome-routine');
        const nomeRoutine = nomeRoutineInput.value.trim();

        if (nomeRoutine) {
            let piani = getFromLocalStorage('pianiDiAllenamento') || [];
            const pianoCorrente = piani.find(p => p.id === pianoId);
            if (pianoCorrente) {
                const nuovaRoutine = { id: Date.now().toString(), nome: nomeRoutine, esercizi: [] };
                pianoCorrente.routine.push(nuovaRoutine);
                saveToLocalStorage('pianiDiAllenamento', piani);
                nomeRoutineInput.value = '';
                renderRoutines();
            }
        } else {
            alert("Inserisci un nome per la routine.");
        }
    });

    function renderRoutines() {
        let piani = getFromLocalStorage('pianiDiAllenamento') || [];
        const piano = piani.find(p => p.id === pianoId);

        if (!piano) {
            document.querySelector('.content-wrapper').innerHTML = '<h1>Errore: Piano non trovato.</h1><a href="piani.html">Torna ai piani</a>';
            return;
        }

        // Aggiungi pulsante di modifica e eliminazione al titolo
        titoloPagina.innerHTML = `${piano.nome} 
            <span style="white-space: nowrap;">
                <button id="btn-edit-piano-name" style="background:none; border:none; padding:0; cursor:pointer; vertical-align: middle; margin-left: 8px; color: var(--accent);">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                </button>
                <button id="btn-delete-piano" style="background:none; border:none; padding:0; cursor:pointer; vertical-align: middle; margin-left: 8px; color: var(--danger);">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
            </span>`;

        // Listener per la modifica del nome
        document.querySelector('#btn-edit-piano-name').addEventListener('click', () => {
            const newName = prompt("Modifica nome del piano:", piano.nome);
            if (newName && newName.trim() !== "") {
                piano.nome = newName.trim();
                saveToLocalStorage('pianiDiAllenamento', piani);
                renderRoutines();
            }
        });

        // Listener per l'eliminazione del piano
        document.querySelector('#btn-delete-piano').addEventListener('click', () => {
            if (confirm("Sei sicuro di voler eliminare questo piano e tutte le sue routine?")) {
                let piani = getFromLocalStorage('pianiDiAllenamento') || [];
                piani = piani.filter(p => p.id !== pianoId);
                saveToLocalStorage('pianiDiAllenamento', piani);
                
                const activePianoId = getFromLocalStorage('activePianoId');
                if (activePianoId === pianoId) {
                    localStorage.removeItem('activePianoId');
                }
                
                window.location.href = 'piani.html';
            }
        });

        listaRoutine.innerHTML = '';

        if (piano.routine.length === 0) {
            listaRoutine.innerHTML = '<p>Nessuna routine creata per questo piano.</p>';
            return;
        }

        piano.routine.forEach(r => {
            const routineDiv = document.createElement('div');
            routineDiv.className = 'list-item-container';
            routineDiv.innerHTML = `
                <a href="routine-dettaglio.html?pianoId=${pianoId}&routineId=${r.id}" class="title-link"><h3>${r.nome}</h3></a>
            `;
            listaRoutine.appendChild(routineDiv);
        });
    }
}

function setupEserciziPage() {
    console.log("Setup Esercizi Page");
    const form = document.querySelector('#form-crea-esercizio');
    const listaEserciziDiv = document.querySelector('#lista-esercizi');
    const filterSelect = document.querySelector('#filter-gruppo');
    
    const editModal = document.querySelector('#edit-exercise-modal');
    const closeEditModal = editModal ? editModal.querySelector('.close-modal') : null;
    const editForm = document.querySelector('#form-modifica-esercizio');
    const editIdInput = document.querySelector('#edit-esercizio-id');
    const editNomeInput = document.querySelector('#edit-nome-esercizio');
    const editGruppoSelect = document.querySelector('#edit-gruppo-muscolare');

    // Mostra gli esercizi salvati al caricamento della pagina
    renderEsercizi();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const nomeInput = document.querySelector('#nome-esercizio');
        const gruppoInput = document.querySelector('#gruppo-muscolare');

        const nome = nomeInput.value.trim();
        const gruppo = gruppoInput.value;

        if (nome) {
            let esercizi = getFromLocalStorage('elencoEsercizi') || [];
            const nuovoEsercizio = { id: Date.now().toString(), nome: nome, gruppo: gruppo };
            esercizi.push(nuovoEsercizio);
            saveToLocalStorage('elencoEsercizi', esercizi);

            nomeInput.value = ''; // Pulisce il campo
            renderEsercizi(); // Aggiorna la vista
        } else {
            alert("Inserisci il nome dell'esercizio.");
        }
    });

    // Gestione filtro
    if (filterSelect) {
        filterSelect.addEventListener('change', renderEsercizi);
    }

    // Gestione Modal Modifica
    if (closeEditModal) {
        closeEditModal.addEventListener('click', () => {
            editModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    if (editForm) {
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = editIdInput.value;
            const newName = editNomeInput.value.trim();
            const newGroup = editGruppoSelect.value;

            if (newName) {
                let esercizi = getFromLocalStorage('elencoEsercizi') || [];
                const index = esercizi.findIndex(ex => ex.id === id);
                if (index !== -1) {
                    esercizi[index].nome = newName;
                    esercizi[index].gruppo = newGroup;
                    saveToLocalStorage('elencoEsercizi', esercizi);
                    renderEsercizi();
                    editModal.style.display = 'none';
                }
            } else {
                alert("Il nome dell'esercizio non può essere vuoto.");
            }
        });
    }

    function renderEsercizi() {
        let esercizi = getFromLocalStorage('elencoEsercizi') || [];
        listaEserciziDiv.innerHTML = '';

        // Ordinamento alfabetico
        esercizi.sort((a, b) => a.nome.localeCompare(b.nome));

        // Filtraggio
        const filterValue = filterSelect ? filterSelect.value : '';
        if (filterValue) {
            esercizi = esercizi.filter(e => e.gruppo === filterValue);
        }

        if (esercizi.length === 0) {
            const allExercises = getFromLocalStorage('elencoEsercizi') || [];
            if (allExercises.length === 0) {
                listaEserciziDiv.innerHTML = '<p>Nessun esercizio creato. Aggiungine uno!</p>';
            } else {
                listaEserciziDiv.innerHTML = '<p>Nessun esercizio trovato con questo filtro.</p>';
            }
            return;
        }

        esercizi.forEach(esercizio => {
            const div = document.createElement('div');
            div.className = 'list-item-container';
            div.innerHTML = `
                <div class="title-link" style="cursor: pointer;">
                    <h3>${esercizio.nome} <small style="color: var(--text-dim); font-size: 0.8em;">(${esercizio.gruppo})</small></h3>
                </div>
                <button data-id="${esercizio.id}" class="btn-elimina-esercizio" style="background:none; border:none; padding:0; cursor:pointer; color: var(--danger);">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px; pointer-events: none;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                </button>
            `;
            
            // Aggiungi listener per aprire il modal di modifica
            div.querySelector('.title-link').addEventListener('click', () => {
                editIdInput.value = esercizio.id;
                editNomeInput.value = esercizio.nome;
                editGruppoSelect.value = esercizio.gruppo;
                editModal.style.display = 'flex';
            });

            listaEserciziDiv.appendChild(div);
        });

        // Aggiungi listener per i pulsanti di eliminazione
        listaEserciziDiv.querySelectorAll('.btn-elimina-esercizio').forEach(button => {
            button.addEventListener('click', (e) => {
                if (confirm("Sei sicuro di voler eliminare questo esercizio?")) {
                    const id = e.target.dataset.id;
                    let esercizi = getFromLocalStorage('elencoEsercizi') || [];
                    esercizi = esercizi.filter(ex => ex.id !== id);
                    saveToLocalStorage('elencoEsercizi', esercizi);
                    renderEsercizi();
                }
            });
        });
    }
}

function setupAllenamentoPage() {
    console.log("Setup Allenamento Page");
    const params = new URLSearchParams(window.location.search);
    const pianoId = params.get('pianoId');
    const routineId = params.get('routineId');

    if (!pianoId || !routineId) {
        document.querySelector('.content-wrapper').innerHTML = '<h1>Errore: Dati allenamento mancanti.</h1><a href="index.html">Torna alla Home</a>';
        return;
    }

    const piani = getFromLocalStorage('pianiDiAllenamento') || [];
    const piano = piani.find(p => p.id === pianoId);
    const routine = piano?.routine.find(r => r.id === routineId);

    if (!routine) {
        document.querySelector('.content-wrapper').innerHTML = '<h1>Errore: Routine non trovata.</h1><a href="index.html">Torna alla Home</a>';
        return;
    }

    // --- Screen Wake Lock API (Mantiene lo schermo acceso) ---
    let wakeLock = null;
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen Wake Lock attivo: lo schermo resterà acceso.');
            }
        } catch (err) {
            console.error(`Errore Wake Lock: ${err.name}, ${err.message}`);
        }
    };

    // Richiedi il blocco all'avvio della pagina
    requestWakeLock();

    // Ri-acquisisci il blocco se la pagina torna visibile (il browser lo rilascia quando si cambia tab o si spegne lo schermo)
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            await requestWakeLock();
        }
    });

    // Popola l'header
    document.querySelector('.routine-title').textContent = routine.nome;
    const workoutTimerEl = document.querySelector('.workout-timer');
    const btnEndWorkout = document.querySelector('.btn-end-workout');
    let workoutInterval;

    // Variabile per tenere traccia dello stato dell'allenamento
    let workoutState = getFromLocalStorage('activeWorkoutState') || null;

    // Elementi per il timer di recupero
    const recoveryTimerEl = document.querySelector('.recovery-timer .timer-display');
    const recoveryTimerContainer = document.querySelector('.recovery-timer');
    let recoveryTimerInterval;
    const updateRoutineToggle = document.querySelector('#update-routine-toggle');
    let currentRecoverySeconds = 0;

    let activeExerciseIndex = 0;
    const allExerciseCards = [];

    const storico = getFromLocalStorage('storicoAllenamenti') || [];

    // Renderizza gli esercizi
    const container = document.querySelector('#lista-esercizi-allenamento .content-wrapper');
    container.innerHTML = ''; // Pulisce il contenitore


    // 1. Crea tutte le card degli esercizi in memoria
    routine.esercizi.forEach(esercizio => {
        // Trova l'ultima performance di questo esercizio dallo storico
        const allPerformances = storico
            .flatMap(log => log.esercizi) // Crea un array di tutti gli esercizi eseguiti
            .filter(e => e.esercizioId === esercizio.esercizioId); // Filtra per l'esercizio corrente

        const lastPerformance = allPerformances[0]; // Prende il primo, che è il più recente dato che usiamo unshift

        const card = document.createElement('article');
        card.className = 'esercizio-card';
        card.dataset.esercizioId = esercizio.id; // Aggiungiamo l'ID per ritrovarlo al salvataggio

        const serieDaRenderizzare = workoutState?.esercizi[esercizio.id]?.serie || esercizio.serie;

        const serieHtml = serieDaRenderizzare.map((s, index) => {
            const prevData = lastPerformance && lastPerformance.serie[index] 
                ? `${lastPerformance.serie[index].kg}kg x ${lastPerformance.serie[index].reps}` 
                : '-';
            const isChecked = s.completed ? 'checked' : '';
            const rowClass = s.completed ? 'set-row completed' : 'set-row';
            return `
                <div class="${rowClass}">
                    <span class="set-number">${index + 1}</span>
                    <span class="set-previous">${prevData}</span>
                    <div class="set-inputs">
                        <div class="adjust-control">
                            <button class="btn-weight-adjust" data-adjust="-2.5">-</button>
                        <input type="number" class="set-input weight-input" value="${s.kg}" inputmode="decimal" step="any">
                            <button class="btn-weight-adjust" data-adjust="2.5">+</button>
                        </div>
                        <div class="adjust-control">
                            <button class="btn-reps-adjust" data-adjust="-1">-</button>
                            <input type="number" class="set-input reps-input" value="${s.reps}" inputmode="numeric">
                            <button class="btn-reps-adjust" data-adjust="1">+</button>
                        </div>
                    </div>
                    <input type="checkbox" class="set-check" ${isChecked}>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <div class="esercizio-card-header">
                <h2>${esercizio.nome}</h2>
            </div>
            <div class="exercise-details">
                <textarea placeholder="Note">${workoutState?.esercizi[esercizio.id]?.note || esercizio.note}</textarea>
            </div>
            <div class="recovery-time-display">
                <span>Tempo di Recupero:
                    <input type="number" class="recovery-input" value="${workoutState?.esercizi[esercizio.id]?.recupero || esercizio.recupero}" inputmode="numeric"> s</span>
            </div>
            <div class="sets-header">
                <span class="set-number-header">Set</span>
                <span class="set-previous-header">Precedente</span>
                <div class="set-inputs-header">
                    <span>Kg</span>
                    <span>Reps</span>
                </div>
                <span class="set-check-header">✓</span>
            </div>
            <div class="sets-container">${serieHtml}</div>
            <div class="action-buttons-container">
                <button class="btn-remove-set btn-elimina">Rimuovi Serie</button>
                <button class="btn-add-set btn-blu">Aggiungi Serie</button>
            </div>
        `;
        container.appendChild(card);
        container.appendChild(document.createElement('hr'));


        // Aggiungi listener per il pulsante "Aggiungi Serie" di questa card
        const btnAggiungiSerie = card.querySelector('.btn-add-set');
        const setsContainer = card.querySelector('.sets-container');
        btnAggiungiSerie.addEventListener('click', () => {
            const rowCount = setsContainer.children.length;
            if (rowCount === 0) return; // Non dovrebbe succedere, ma è una sicurezza

            const ultimaRiga = setsContainer.lastElementChild;
            const inputs = ultimaRiga.querySelectorAll('.set-input');
            const kgValue = inputs[0].value;
            const repsValue = inputs[1].value;

            const newRow = document.createElement('div');
            newRow.className = 'set-row';
            newRow.innerHTML = `
                <span class="set-number">${rowCount + 1}</span>
                <span class="set-previous">-</span>
                <div class="set-inputs">
                    <div class="adjust-control">
                        <button class="btn-weight-adjust" data-adjust="-2.5">-</button>
                    <input type="number" class="set-input weight-input" value="${kgValue}" inputmode="decimal" step="any">
                        <button class="btn-weight-adjust" data-adjust="2.5">+</button>
                    </div>
                    <div class="adjust-control">
                        <button class="btn-reps-adjust" data-adjust="-1">-</button>
                        <input type="number" class="set-input reps-input" value="${repsValue}" inputmode="numeric">
                        <button class="btn-reps-adjust" data-adjust="1">+</button>
                    </div>
                </div>
                <input type="checkbox" class="set-check">
            `;
            setsContainer.appendChild(newRow);
        });

        // Aggiungi listener per il pulsante "Rimuovi Serie"
        const btnRimuoviSerie = card.querySelector('.btn-remove-set');
        btnRimuoviSerie.addEventListener('click', () => {
            if (setsContainer.children.length > 0) {
                setsContainer.lastElementChild.remove();
                saveCurrentWorkoutState(); // Salva lo stato dopo la rimozione
            } else {
                alert("Non ci sono serie da rimuovere.");
            }
        });

        allExerciseCards.push(card);
    });

    // --- Logica per i pulsanti di aggiustamento peso e ripetizioni ---
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-weight-adjust') || e.target.classList.contains('btn-reps-adjust')) {
            const adjustment = parseFloat(e.target.dataset.adjust);
            const controlContainer = e.target.closest('.adjust-control');
            const input = controlContainer.querySelector('.set-input');
            
            let currentValue = parseFloat(input.value) || 0;
            let newValue = currentValue + adjustment;

            // Assicura che il valore non sia negativo
            newValue = Math.max(0, newValue);

            input.value = newValue;
        }
    });

    // --- Logica per svuotare gli input al focus (usando event delegation) ---
    container.addEventListener('focusin', (e) => {
        // Controlla se l'elemento che ha ricevuto il focus è un input di una serie o del recupero
        if (e.target.classList.contains('set-input') || e.target.classList.contains('recovery-input')) {
            // Salva il valore originale in un attributo data- prima di svuotarlo
            e.target.dataset.originalValue = e.target.value;
            e.target.value = '';
        }
    });

    container.addEventListener('focusout', (e) => {
        // Controlla se l'elemento che ha perso il focus è un input e se è vuoto
        if ((e.target.classList.contains('set-input') || e.target.classList.contains('recovery-input')) && e.target.value === '') {
            // Ripristina il valore originale se l'input è stato lasciato vuoto
            e.target.value = e.target.dataset.originalValue || '';
        }
    });

    // --- Logica per il salvataggio automatico su input (NOTE, RECUPERO, KG, REPS) ---
    container.addEventListener('input', (e) => {
        // Salva lo stato quando si modifica un input di peso/reps, le note o il tempo di recupero
        if (e.target.classList.contains('set-input') ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.classList.contains('recovery-input')) {
            saveCurrentWorkoutState();
        }
    });


    // --- Logica per i checkbox delle serie (usando event delegation) ---
    container.addEventListener('change', (e) => {
        if (e.target.classList.contains('set-check')) {
            const checkbox = e.target;
            const row = checkbox.closest('.set-row');
            const card = checkbox.closest('.esercizio-card');
            const recoveryInput = card.querySelector('.recovery-input');

            saveCurrentWorkoutState(); // Salva lo stato ad ogni check/uncheck

            if (checkbox.checked) {
                const recoveryTime = parseInt(recoveryInput.value, 10) || 90;
                startRecoveryTimer(recoveryTime);
                row.classList.add('completed');
            } else {
                row.classList.remove('completed');
            }
        }
    });


    // --- Logica Timer e Fine Allenamento ---

    function startWorkoutTimer() {
        let startTime = getFromLocalStorage('workoutStartTime');
        if (!startTime) {
            startTime = Date.now();
            saveToLocalStorage('workoutStartTime', startTime);
        }

        // Salva lo stato dell'allenamento in corso
        saveToLocalStorage('activeWorkout', { pianoId, routineId });

        const updateTimer = () => {
            const currentTime = Date.now();
            const totalSeconds = Math.floor((currentTime - startTime) / 1000);

            let hours = Math.floor(totalSeconds / 3600);
            let minutes = Math.floor((totalSeconds % 3600) / 60);

            // Formattazione per avere sempre due cifre
            hours = String(hours).padStart(2, '0');
            minutes = String(minutes).padStart(2, '0');

            workoutTimerEl.textContent = `${hours}:${minutes}`;
        };

        updateTimer(); // Aggiorna subito senza aspettare 1 secondo
        workoutInterval = setInterval(updateTimer, 1000);
    }

    function startRecoveryTimer(duration, isSyncing = false) {
        clearInterval(recoveryTimerInterval); // Ferma qualsiasi timer precedente
        recoveryTimerContainer.classList.remove('timer-finished'); // Rimuove lo sfondo verde se presente

        // Se non è una sincronizzazione, crea un nuovo timer. Altrimenti, si aggancia a quello esistente.
        if (!isSyncing) {
            const recoveryEndTime = Date.now() + duration * 1000;
            localStorage.removeItem('recoverySoundPlayed'); // Resetta il flag del suono per il nuovo timer
            saveToLocalStorage('recoveryEndTime', recoveryEndTime);
        }

        const updateRecovery = () => {
            const endTime = getFromLocalStorage('recoveryEndTime');
            if (!endTime) {
                clearInterval(recoveryTimerInterval);
                recoveryTimerEl.textContent = "00:00";
                recoveryTimerContainer.classList.remove('timer-finished');
                return;
            }

            const remainingMs = endTime - Date.now();
            if (remainingMs <= 0) {
                clearInterval(recoveryTimerInterval);
                recoveryTimerEl.textContent = "00:00";
                // Controlla se il timer è appena scaduto (e non era già scaduto)
                // per evitare di suonare al caricamento della pagina.
                const wasAlreadyFinished = getFromLocalStorage('recoverySoundPlayed');
                if (!wasAlreadyFinished) {
                    playNotificationSound(); // Suona quando il timer finisce
                    saveToLocalStorage('recoverySoundPlayed', true);
                }
                recoveryTimerContainer.classList.add('timer-finished');
            } else {
                const remainingSeconds = Math.round(remainingMs / 1000);
                const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
                const seconds = String(remainingSeconds % 60).padStart(2, '0');
                recoveryTimerEl.textContent = `${minutes}:${seconds}`;
                recoveryTimerContainer.classList.remove('timer-finished');
            }
        };

        // La logica del timer ora legge sempre da localStorage per rimanere sincronizzata
        recoveryTimerInterval = setInterval(updateRecovery, 1000);
        updateRecovery(); // Aggiorna subito per evitare il flash di 00:00
    }

    function saveCurrentWorkoutState() {
        const currentState = {
            esercizi: {}
        };

        container.querySelectorAll('.esercizio-card').forEach(card => {
            const esercizioId = card.dataset.esercizioId;
            const note = card.querySelector('textarea').value;
            const recupero = card.querySelector('.recovery-input').value;
            const serie = [];

            card.querySelectorAll('.set-row').forEach(row => {
                const inputs = row.querySelectorAll('.set-input');
                const checkbox = row.querySelector('.set-check');
                serie.push({
                    kg: inputs[0].value,
                    reps: inputs[1].value,
                    completed: checkbox.checked
                });
            });

            currentState.esercizi[esercizioId] = {
                note,
                recupero,
                serie
            };
        });

        saveToLocalStorage('activeWorkoutState', currentState);
        console.log("Stato allenamento salvato.");
    }

    // Se esiste uno stato salvato, applica la classe 'completed' alle righe corrette
    document.querySelectorAll('.set-row').forEach(row => {
        if (row.querySelector('.set-check').checked) {
            row.classList.add('completed');
        }
    });

    btnEndWorkout.addEventListener('click', () => {
        // Rilascia il Wake Lock se attivo
        if (wakeLock !== null) {
            wakeLock.release().then(() => {
                wakeLock = null;
            });
        }

        clearInterval(workoutInterval); // Ferma il timer
        // Rimuove lo stato di allenamento in corso
        localStorage.removeItem('activeWorkout');
        localStorage.removeItem('workoutStartTime');
        localStorage.removeItem('recoverySoundPlayed');
        localStorage.removeItem('recoveryEndTime'); // Pulisce anche il timer di recupero
        localStorage.removeItem('activeWorkoutState');

        const tempoAllenamento = workoutTimerEl.textContent;

        // 1. Raccogli i dati dell'allenamento svolto
        const workoutLog = {
            id: Date.now().toString(),
            data: new Date().toISOString(), // Salva la data in formato standard per calcoli più semplici
            durata: tempoAllenamento,
            pianoId: pianoId,
            routineId: routineId,
            routineNome: routine.nome,
            esercizi: []
        };

        container.querySelectorAll('.esercizio-card').forEach(card => {
            const esercizioId = card.dataset.esercizioId;
            const esercizioOriginale = routine.esercizi.find(e => e.id === esercizioId);
            const serieCompletate = [];
            const noteAllenamento = card.querySelector('textarea').value;

            card.querySelectorAll('.set-row').forEach(riga => {
                const inputs = riga.querySelectorAll('input[type="number"]');
                serieCompletate.push({
                    kg: inputs[0].value || 0,
                    reps: inputs[1].value || 0
                });
            });

            workoutLog.esercizi.push({
                esercizioId: esercizioOriginale.esercizioId, // ID globale dell'esercizio
                instanceId: esercizioId, // ID univoco dell'istanza nella routine (FONDAMENTALE per l'aggiornamento)
                nome: esercizioOriginale.nome,
                serie: serieCompletate,
                note: noteAllenamento
            });
        });

        // 2. Salva l'allenamento nello storico (anche se vuoto per ora)
        let storicoCompleto = getFromLocalStorage('storicoAllenamenti') || [];
        storicoCompleto.unshift(workoutLog);
        saveToLocalStorage('storicoAllenamenti', storicoCompleto);

        // 3. Aggiorna la routine di base (note sempre, serie su richiesta)
        let pianiDaAggiornare = getFromLocalStorage('pianiDiAllenamento');
        const pianoDaAggiornare = pianiDaAggiornare.find(p => p.id === pianoId);
        const routineDaAggiornare = pianoDaAggiornare.routine.find(r => r.id === routineId);

        if (routineDaAggiornare) {
            workoutLog.esercizi.forEach(loggedExercise => {
                // Usa instanceId per trovare l'esercizio esatto, fallback su esercizioId solo se necessario
                const esercizioNellaRoutine = routineDaAggiornare.esercizi.find(e => 
                    (loggedExercise.instanceId && e.id === loggedExercise.instanceId) || 
                    (!loggedExercise.instanceId && e.esercizioId === loggedExercise.esercizioId)
                );
                
                if (esercizioNellaRoutine) {
                    // Aggiorna SEMPRE le note
                    esercizioNellaRoutine.note = loggedExercise.note;

                    // Aggiorna le serie SOLO se la checkbox è spuntata
                    if (updateRoutineToggle.checked) {
                        esercizioNellaRoutine.serie = loggedExercise.serie;
                    }
                }
            });
            saveToLocalStorage('pianiDiAllenamento', pianiDaAggiornare);
        }

        // 4. Reindirizza alla homepage
        window.location.href = 'index.html';
    });

    // Avvia il timer principale dell'allenamento
    startWorkoutTimer();

    // Controlla e avvia il timer di recupero se è già attivo al caricamento della pagina
    if (getFromLocalStorage('recoveryEndTime')) {
        startRecoveryTimer(0, true); // Il secondo parametro indica di non creare un nuovo timer, ma di sincronizzarsi
    }

    // Aggiungi listener per i controlli del timer di recupero
    document.querySelector('.btn-timer-adjust[data-adjust="-15"]')?.addEventListener('click', () => {
        const newEndTime = (getFromLocalStorage('recoveryEndTime') || Date.now()) - 15000;
        localStorage.removeItem('recoverySoundPlayed');
        saveToLocalStorage('recoveryEndTime', newEndTime);
    });
    document.querySelector('.btn-timer-adjust[data-adjust="+15"]')?.addEventListener('click', () => {
        const newEndTime = (getFromLocalStorage('recoveryEndTime') || Date.now()) + 15000;
        localStorage.removeItem('recoverySoundPlayed');
        saveToLocalStorage('recoveryEndTime', newEndTime);
    });
    document.querySelector('.btn-timer-skip')?.addEventListener('click', () => {
        clearInterval(recoveryTimerInterval);
        // Rimuovi lo stato dal localStorage
        localStorage.removeItem('recoverySoundPlayed');
        localStorage.removeItem('recoveryEndTime');
        // Aggiorna la UI locale
        recoveryTimerContainer.classList.remove('timer-finished');
        recoveryTimerEl.textContent = "00:00";
    });
}

function setupRoutineDettaglioPage() {
    console.log("Setup Dettaglio Routine Page");
    const params = new URLSearchParams(window.location.search);
    const pianoId = params.get('pianoId');
    const routineId = params.get('routineId');

    if (!pianoId || !routineId) {
        document.querySelector('.content-wrapper').innerHTML = '<h1>Errore: Dati mancanti.</h1><a href="piani.html">Torna ai piani</a>';
        return;
    }

    // Elementi del DOM
    const titoloPagina = document.querySelector('#titolo-dettaglio-routine');
    const containerSelezione = document.querySelector('#container-selezione-esercizi');
    const btnOpenModal = document.querySelector('#btn-open-exercise-modal');
    const modal = document.querySelector('#exercise-modal');
    const closeModal = document.querySelector('.close-modal');
    const btnConfirmAdd = document.querySelector('#btn-confirm-add-exercises');
    const listaEserciziRoutineDiv = document.querySelector('#lista-esercizi-routine');

    // --- Event Delegation per la lista esercizi (Logica stile Allenamento) ---
    listaEserciziRoutineDiv.addEventListener('click', (e) => {
        // 1. Pulsanti di aggiustamento peso/reps (+/-)
        if (e.target.classList.contains('btn-weight-adjust') || e.target.classList.contains('btn-reps-adjust')) {
            e.preventDefault(); // Previene focus indesiderati
            const adjustment = parseFloat(e.target.dataset.adjust);
            const controlContainer = e.target.closest('.adjust-control');
            const input = controlContainer.querySelector('.set-input');
            
            let currentValue = parseFloat(input.value) || 0;
            let newValue = currentValue + adjustment;
            newValue = Math.max(0, newValue); // Evita valori negativi
            input.value = newValue;
            saveRoutineState();
        }

        // 2. Pulsante Aggiungi Serie
        if (e.target.classList.contains('btn-add-set')) {
            const card = e.target.closest('.esercizio-card');
            const setsContainer = card.querySelector('.sets-container');
            const rowCount = setsContainer.children.length;
            
            // Copia i valori dall'ultima serie se esiste
            let kgValue = '';
            let repsValue = '';
            if (rowCount > 0) {
                const lastRow = setsContainer.lastElementChild;
                const inputs = lastRow.querySelectorAll('.set-input');
                kgValue = inputs[0].value;
                repsValue = inputs[1].value;
            }

            const newRow = document.createElement('div');
            newRow.className = 'set-row';
            newRow.innerHTML = `
                <span class="set-number">${rowCount + 1}</span>
                <div class="set-inputs">
                    <div class="adjust-control">
                        <button class="btn-weight-adjust" data-adjust="-2.5">-</button>
                        <input type="number" class="set-input weight-input" value="${kgValue}" inputmode="decimal" step="any">
                        <button class="btn-weight-adjust" data-adjust="2.5">+</button>
                    </div>
                    <div class="adjust-control">
                        <button class="btn-reps-adjust" data-adjust="-1">-</button>
                        <input type="number" class="set-input reps-input" value="${repsValue}" inputmode="numeric">
                        <button class="btn-reps-adjust" data-adjust="1">+</button>
                    </div>
                </div>
            `;
            setsContainer.appendChild(newRow);
            saveRoutineState();
        }

        // 3. Pulsante Rimuovi Serie
        if (e.target.classList.contains('btn-remove-set')) {
            const card = e.target.closest('.esercizio-card');
            const setsContainer = card.querySelector('.sets-container');
            if (setsContainer.children.length > 0) {
                setsContainer.lastElementChild.remove();
                saveRoutineState();
            } else {
                alert("Non ci sono serie da rimuovere.");
            }
        }

        // 4. Pulsante Elimina Esercizio
        if (e.target.classList.contains('btn-elimina') && !e.target.classList.contains('btn-remove-set')) {
            const esercizioIdDaEliminare = e.target.dataset.id;
            if (confirm("Sei sicuro di voler rimuovere questo esercizio dalla routine?")) {
                let piani = getFromLocalStorage('pianiDiAllenamento');
                const piano = piani.find(p => p.id === pianoId);
                const routine = piano.routine.find(r => r.id === routineId);
                
                routine.esercizi = routine.esercizi.filter(ex => ex.id !== esercizioIdDaEliminare);
                saveToLocalStorage('pianiDiAllenamento', piani);
                renderEserciziRoutine();
            }
        }
    });

    // Listener per il salvataggio automatico su modifica input
    listaEserciziRoutineDiv.addEventListener('input', (e) => {
        if (e.target.classList.contains('set-input') || 
            e.target.classList.contains('recovery-input') || 
            e.target.tagName === 'TEXTAREA') {
            saveRoutineState();
        }
    });

    // Logica focus per svuotare/ripristinare input (come in allenamento)
    listaEserciziRoutineDiv.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('set-input') || e.target.classList.contains('recovery-input')) {
            e.target.dataset.originalValue = e.target.value;
            e.target.value = '';
        }
    });

    listaEserciziRoutineDiv.addEventListener('focusout', (e) => {
        if ((e.target.classList.contains('set-input') || e.target.classList.contains('recovery-input')) && e.target.value === '') {
            e.target.value = e.target.dataset.originalValue || '';
        }
    });

    // Funzioni principali
    aggiornaTitolo();
    renderEserciziRoutine(); // Mostra gli esercizi già presenti

    // Gestione Modal
    btnOpenModal.addEventListener('click', () => {
        renderSelezioneEsercizi(); // Carica la lista quando si apre il modal
        modal.style.display = 'flex';
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Chiudi il modal cliccando fuori
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Event Listener per aggiungere gli esercizi selezionati
    btnConfirmAdd.addEventListener('click', () => {
        const checkboxes = containerSelezione.querySelectorAll('input[type="checkbox"]:checked');
        
        if (checkboxes.length === 0) {
            alert("Seleziona almeno un esercizio da aggiungere.");
            return;
        }

        const elencoEsercizi = getFromLocalStorage('elencoEsercizi') || [];
        let piani = getFromLocalStorage('pianiDiAllenamento');
        const piano = piani.find(p => p.id === pianoId);
        const routine = piano.routine.find(r => r.id === routineId);

        checkboxes.forEach((checkbox, index) => {
            const esercizioId = checkbox.value;
            const esercizioOriginale = elencoEsercizi.find(e => e.id === esercizioId);

            if (esercizioOriginale) {
                const nuovoEsercizioRoutine = {
                    id: Date.now().toString() + index, // Assicura ID univoci anche nel loop
                    esercizioId: esercizioId,
                    nome: esercizioOriginale.nome,
                    note: "", // Note vuote di default
                    recupero: 90, // Recupero preimpostato a 90s
                    serie: [{ kg: '', reps: '' }] // Una serie vuota di default
                };
                routine.esercizi.push(nuovoEsercizioRoutine);
            }
        });

        saveToLocalStorage('pianiDiAllenamento', piani);
        
        // Reset e aggiornamento UI
        checkboxes.forEach(cb => cb.checked = false);
        renderEserciziRoutine(); // Aggiorna la vista degli esercizi salvati
        modal.style.display = 'none'; // Chiudi il modal
    });

    // --- Funzioni di supporto ---

    function saveRoutineState() {
        let piani = getFromLocalStorage('pianiDiAllenamento');
        const piano = piani.find(p => p.id === pianoId);
        const routine = piano.routine.find(r => r.id === routineId);

        listaEserciziRoutineDiv.querySelectorAll('.esercizio-card').forEach(card => {
            const esercizioId = card.dataset.id;
            const esercizio = routine.esercizi.find(e => e.id === esercizioId);
            
            if (esercizio) {
                esercizio.note = card.querySelector('textarea').value;
                esercizio.recupero = card.querySelector('.recovery-input').value;
                
                const newSeries = [];
                card.querySelectorAll('.set-row').forEach(row => {
                    const inputs = row.querySelectorAll('.set-input');
                    newSeries.push({
                        kg: inputs[0].value,
                        reps: inputs[1].value
                    });
                });
                esercizio.serie = newSeries;
            }
        });
        saveToLocalStorage('pianiDiAllenamento', piani);
    }

    function renderSelezioneEsercizi() {
        const esercizi = getFromLocalStorage('elencoEsercizi') || [];
        containerSelezione.innerHTML = ''; 

        if (esercizi.length === 0) {
            containerSelezione.innerHTML = '<p style="padding:10px;">Nessun esercizio disponibile. Creane uno nella pagina Esercizi.</p>';
            return;
        }

        esercizi.forEach(esercizio => {
            const div = document.createElement('div');
            div.className = 'exercise-selection-item';
            div.innerHTML = `
                <label style="display: flex; align-items: center; width: 100%; cursor: pointer; margin: 0;">
                    <input type="checkbox" value="${esercizio.id}">
                    ${esercizio.nome} <small style="color: var(--text-dim); margin-left: 5px;">(${esercizio.gruppo})</small>
                </label>
            `;
            containerSelezione.appendChild(div);
        });
    }

    function aggiornaTitolo() {
        const piani = getFromLocalStorage('pianiDiAllenamento') || [];
        const piano = piani.find(p => p.id === pianoId);
        const routine = piano?.routine.find(r => r.id === routineId);
        if (piano && routine) {
            titoloPagina.innerHTML = `${routine.nome} 
                <span style="white-space: nowrap;">
                    <button id="btn-edit-routine-name" style="background:none; border:none; padding:0; cursor:pointer; vertical-align: middle; margin-left: 8px; color: var(--accent);">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                        </svg>
                    </button>
                    <button id="btn-delete-routine" style="background:none; border:none; padding:0; cursor:pointer; vertical-align: middle; margin-left: 8px; color: var(--danger);">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </span>`;

            // Listener per la modifica del nome
            document.querySelector('#btn-edit-routine-name').addEventListener('click', () => {
                const newName = prompt("Modifica nome della routine:", routine.nome);
                if (newName && newName.trim() !== "") {
                    routine.nome = newName.trim();
                    saveToLocalStorage('pianiDiAllenamento', piani);
                    aggiornaTitolo();
                }
            });

            // Listener per l'eliminazione della routine
            document.querySelector('#btn-delete-routine').addEventListener('click', () => {
                if (confirm("Sei sicuro di voler eliminare questa routine?")) {
                    piano.routine = piano.routine.filter(r => r.id !== routineId);
                    saveToLocalStorage('pianiDiAllenamento', piani);
                    window.location.href = `routine.html?pianoId=${pianoId}`;
                }
            });
        }
    }

    function renderEserciziRoutine() {
        const piani = getFromLocalStorage('pianiDiAllenamento') || [];
        const piano = piani.find(p => p.id === pianoId);
        const routine = piano?.routine.find(r => r.id === routineId);

        listaEserciziRoutineDiv.innerHTML = ''; // Pulisce la vista

        if (!routine || routine.esercizi.length === 0) {
            listaEserciziRoutineDiv.innerHTML = '<p>Nessun esercizio in questa routine. Aggiungine uno qui sotto.</p>';
            return;
        }

        routine.esercizi.forEach(esercizio => {
            const card = document.createElement('article');

            card.className = 'esercizio-card';
            card.dataset.id = esercizio.id; // Importante per il salvataggio
            
            const serieHtml = esercizio.serie.map((s, index) => `
                <div class="set-row">
                    <span class="set-number">${index + 1}</span>
                    <div class="set-inputs">
                        <div class="adjust-control">
                            <button class="btn-weight-adjust" data-adjust="-2.5">-</button>
                        <input type="number" class="set-input weight-input" value="${s.kg}" inputmode="decimal" step="any">
                            <button class="btn-weight-adjust" data-adjust="2.5">+</button>
                        </div>
                        <div class="adjust-control">
                            <button class="btn-reps-adjust" data-adjust="-1">-</button>
                            <input type="number" class="set-input reps-input" value="${s.reps}" inputmode="numeric">
                            <button class="btn-reps-adjust" data-adjust="1">+</button>
                        </div>
                    </div>
                </div>
            `).join('');

            card.innerHTML = `
                <div class="esercizio-card-header">
                    <div style="display: flex; align-items: center;">
                        <span class="drag-handle">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
                        </span>
                        <h2>${esercizio.nome}</h2>
                    </div>
                    <button class="btn-elimina" data-id="${esercizio.id}" style="background:none; border:none; padding:0; cursor:pointer; color: var(--danger);">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px; pointer-events: none;">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                </div>
                <div class="exercise-details">
                    <textarea placeholder="Note">${esercizio.note}</textarea>
                </div>
                <div class="recovery-time-display">
                    <span>Tempo di Recupero:
                        <input type="number" class="recovery-input" value="${esercizio.recupero}" inputmode="numeric"> s</span>
                </div>
                <div class="sets-header">
                    <span class="set-number-header">Set</span>
                    <div class="set-inputs-header">
                        <span>Kg</span>
                        <span>Reps</span>
                    </div>
                </div>
                <div class="sets-container">${serieHtml}</div>
                <div class="action-buttons-container">
                    <button class="btn-remove-set btn-elimina">Rimuovi Serie</button>
                    <button class="btn-add-set btn-blu">Aggiungi Serie</button>
                </div>
            `;
            listaEserciziRoutineDiv.appendChild(card);
            listaEserciziRoutineDiv.appendChild(document.createElement('hr'));
        });
    }

    // --- DRAG AND DROP (Logica personalizzata con maniglia) ---
    let draggedItem = null;

    listaEserciziRoutineDiv.addEventListener('mousedown', startDrag);
    listaEserciziRoutineDiv.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
        const handle = e.target.closest('.drag-handle');
        if (!handle) return;

        e.preventDefault(); // Previene selezione testo e scroll
        draggedItem = e.target.closest('.esercizio-card');
        
        if (draggedItem) {
            setTimeout(() => draggedItem.classList.add('dragging'), 0);
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
        }
    }

    function onDrag(e) {
        if (!draggedItem) return;
        e.preventDefault(); // Evita lo scroll su mobile

        const y = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        const afterElement = getDragAfterElement(listaEserciziRoutineDiv, y);
        
        if (afterElement == null) {
            listaEserciziRoutineDiv.appendChild(draggedItem);
        } else {
            listaEserciziRoutineDiv.insertBefore(draggedItem, afterElement);
        }
    }

    function endDrag() {
        if (!draggedItem) return;
        draggedItem.classList.remove('dragging');
        draggedItem = null;

        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);

        // Salva il nuovo ordine
        let piani = getFromLocalStorage('pianiDiAllenamento');
        const piano = piani.find(p => p.id === pianoId);
        const routine = piano.routine.find(r => r.id === routineId);

        const esercizioElements = Array.from(listaEserciziRoutineDiv.querySelectorAll('.esercizio-card'));
        const esercizioOrder = esercizioElements.map(item => item.dataset.id);

        routine.esercizi.sort((a, b) => {
            return esercizioOrder.indexOf(a.id) - esercizioOrder.indexOf(b.id);
        });

        saveToLocalStorage('pianiDiAllenamento', piani);
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.esercizio-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}