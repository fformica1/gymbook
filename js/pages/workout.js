window.setupAllenamentoPage = function() {
    console.log("Setup Allenamento Page (Nuova Struttura)");
    document.body.classList.add('page-allenamento');

    const params = new URLSearchParams(window.location.search);
    const pianoId = params.get('pianoId');
    const routineId = params.get('routineId');

    if (!pianoId || !routineId) {
        document.querySelector('.content-wrapper').innerHTML = '<h1>Errore: Dati mancanti.</h1><a href="index.html">Torna alla Home</a>';
        return;
    }

    const piani = getFromLocalStorage('pianiDiAllenamento') || [];
    const piano = piani.find(p => p.id === pianoId);
    const routine = piano?.routine.find(r => r.id === routineId);

    if (!routine) {
        document.querySelector('.content-wrapper').innerHTML = '<h1>Errore: Routine non trovata.</h1><a href="index.html">Torna alla Home</a>';
        return;
    }

    // Wake Lock
    let wakeLock = null;
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) { console.error(err); }
    };
    requestWakeLock();
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') await requestWakeLock();
    });

    // --- Inject Back Button (Header) ---
    const titleElement = document.querySelector('.routine-title');
    if (titleElement && !titleElement.parentNode.classList.contains('header-title-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'header-title-wrapper';
        
        const backBtn = document.createElement('a');
        backBtn.href = 'index.html';
        backBtn.className = 'btn-back-arrow';
        backBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>`;
        
        titleElement.parentNode.insertBefore(wrapper, titleElement);
        wrapper.appendChild(backBtn);
        wrapper.appendChild(titleElement);
    }

    // UI Elements
    document.querySelector('.routine-title').textContent = routine.nome;
    const workoutTimerEl = document.querySelector('.workout-timer');
    const btnEndWorkout = document.querySelector('.btn-end-workout');
    const recoveryTimerEl = document.querySelector('.recovery-timer .timer-display');
    const recoveryTimerContainer = document.querySelector('.recovery-timer');
    const workoutHeader = document.querySelector('.workout-header');
    const workoutStickyHeader = document.querySelector('.workout-sticky-header');
    const updateRoutineToggle = document.querySelector('#update-routine-toggle');
    const container = document.querySelector('#lista-esercizi-allenamento .content-wrapper');
    
    let workoutInterval;
    let recoveryTimerInterval;
    let workoutState = getFromLocalStorage('activeWorkoutState') || null;
    const storico = getFromLocalStorage('storicoAllenamenti') || [];

    container.innerHTML = '';

    // Render Esercizi
    routine.esercizi.forEach(esercizio => {
        const allPerformances = storico.flatMap(log => log.esercizi).filter(e => e.esercizioId === esercizio.esercizioId);
        const lastPerformance = allPerformances[0];
        const card = document.createElement('article');
        card.className = 'esercizio-card';
        card.dataset.esercizioId = esercizio.id;

        const serieDaRenderizzare = workoutState?.esercizi[esercizio.id]?.serie || esercizio.serie;
        const serieHtml = serieDaRenderizzare.map((s, index) => {
            const prevData = lastPerformance && lastPerformance.serie[index] ? `${lastPerformance.serie[index].kg}kg x ${lastPerformance.serie[index].reps}` : '-';
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
                </div>`;
        }).join('');

        // HTML per la riga di regolazione rapida (Quick Adjust)
        const quickAdjustHtml = `
            <div class="quick-adjust-row">
                <button class="btn-remove-set btn-inline-set btn-remove-set-inline" title="Rimuovi ultima serie">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                </button>
                <button class="btn-add-set btn-inline-set btn-add-set-inline" title="Aggiungi serie">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
                <div class="quick-adjust-controls">
                    <div class="quick-adjust-group">
                        <button class="btn-quick-adjust" data-type="kg" data-val="-2.5">−</button>
                        <button class="btn-quick-adjust" data-type="kg" data-val="2.5">+</button>
                    </div>
                    <div class="quick-adjust-group">
                        <button class="btn-quick-adjust" data-type="reps" data-val="-1">−</button>
                        <button class="btn-quick-adjust" data-type="reps" data-val="1">+</button>
                    </div>
                </div>
                <div class="quick-adjust-spacer-end"></div>
            </div>`;

        card.innerHTML = `
            <div class="esercizio-card-header"><h2>${esercizio.nome}</h2></div>
            <div class="exercise-details"><textarea placeholder="Note" rows="1" class="auto-expand">${workoutState?.esercizi[esercizio.id]?.note || esercizio.note}</textarea></div>
            <div class="recovery-time-display"><span>Tempo di Recupero: <input type="number" class="recovery-input" value="${workoutState?.esercizi[esercizio.id]?.recupero || esercizio.recupero}" inputmode="numeric"> s</span></div>
            <div class="sets-header"><span class="set-number-header">Set</span><span class="set-previous-header">Precedente</span><div class="set-inputs-header"><span>Kg</span><span>Reps</span></div><span class="set-check-header">✓</span></div>
            <div class="sets-container">${serieHtml}</div>
            ${quickAdjustHtml}
        `;
        container.appendChild(card);
        container.appendChild(document.createElement('hr'));

        // Listeners locali per card
        const setsContainer = card.querySelector('.sets-container');
        card.querySelector('.btn-add-set').addEventListener('click', () => {
            const rowCount = setsContainer.children.length;
            const lastRow = setsContainer.lastElementChild;
            const kgValue = lastRow ? lastRow.querySelectorAll('.set-input')[0].value : '';
            const repsValue = lastRow ? lastRow.querySelectorAll('.set-input')[1].value : '';
            const newRow = document.createElement('div');
            newRow.className = 'set-row';
            newRow.innerHTML = `<span class="set-number">${rowCount + 1}</span><span class="set-previous">-</span><div class="set-inputs"><div class="adjust-control"><button class="btn-weight-adjust" data-adjust="-2.5">-</button><input type="number" class="set-input weight-input" value="${kgValue}" inputmode="decimal" step="any"><button class="btn-weight-adjust" data-adjust="2.5">+</button></div><div class="adjust-control"><button class="btn-reps-adjust" data-adjust="-1">-</button><input type="number" class="set-input reps-input" value="${repsValue}" inputmode="numeric"><button class="btn-reps-adjust" data-adjust="1">+</button></div></div><input type="checkbox" class="set-check">`;
            setsContainer.appendChild(newRow);
        });
        card.querySelector('.btn-remove-set').addEventListener('click', () => {
            if (setsContainer.children.length > 0) { setsContainer.lastElementChild.remove(); saveCurrentWorkoutState(); }
        });
    });

    // Ridimensiona inizialmente tutte le textarea per adattarle al contenuto esistente
    container.querySelectorAll('textarea.auto-expand').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });

    // --- Funzione Focus Mode (Oscura esercizi non attivi) ---
    function updateExerciseFocus() {
        const cards = container.querySelectorAll('.esercizio-card');
        let activeFound = false;

        cards.forEach(card => {
            if (activeFound) {
                // Esercizi futuri (dopo quello attivo) -> Oscurati
                card.classList.add('dimmed');
            } else {
                const allSets = card.querySelectorAll('.set-check');
                const isComplete = Array.from(allSets).every(cb => cb.checked);

                if (!isComplete) {
                    // Primo esercizio non completo -> ATTIVO (Visibile)
                    card.classList.remove('dimmed');
                    activeFound = true;
                } else {
                    // Esercizi completati (prima di quello attivo) -> Oscurati
                    card.classList.add('dimmed');
                }
            }
        });
    }
    updateExerciseFocus(); // Esegui all'avvio

    // Scroll automatico all'esercizio in corso quando si rientra nella pagina
    setTimeout(() => {
        const activeCard = container.querySelector('.esercizio-card:not(.dimmed)');
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);

    // Event Delegation
    container.addEventListener('click', (e) => {
        // Gestione pulsanti nascosti (vecchia implementazione, mantenuta per sicurezza)
        if (e.target.classList.contains('btn-weight-adjust')) {
            const input = e.target.closest('.adjust-control').querySelector('.set-input');
            const currentVal = parseFloat(input.value) || 0;
            const direction = parseFloat(e.target.dataset.adjust) > 0 ? 1 : -1;
            
            // Logica Incremento Dinamico
            const baseIncrement = parseFloat(localStorage.getItem('weightIncrement')) || 2.5;
            let step = baseIncrement;
            
            if (direction > 0) {
                if (currentVal >= 150) step = 10;
                else if (currentVal >= 40) step = 5;
            } else {
                if (currentVal > 150) step = 10;
                else if (currentVal > 40) step = 5;
            }
            
            input.value = Math.max(0, currentVal + (step * direction));
            saveCurrentWorkoutState(); 
        } else if (e.target.classList.contains('btn-reps-adjust')) {
            const input = e.target.closest('.adjust-control').querySelector('.set-input');
            input.value = Math.max(0, (parseFloat(input.value) || 0) + parseFloat(e.target.dataset.adjust));
            saveCurrentWorkoutState(); // Salva dopo la modifica
        }

        // Gestione NUOVI pulsanti Quick Adjust (sotto la lista)
        if (e.target.classList.contains('btn-quick-adjust')) {
            const card = e.target.closest('.esercizio-card');
            const setsContainer = card.querySelector('.sets-container');
            
            // Trova la prima serie non completata (serie in corso)
            const rows = Array.from(setsContainer.querySelectorAll('.set-row'));
            let targetRow = rows.find(row => !row.querySelector('.set-check').checked);
            // Se tutte sono completate, usa l'ultima come fallback per eventuali correzioni
            if (!targetRow && rows.length > 0) targetRow = rows[rows.length - 1];

            if (targetRow) {
                const type = e.target.dataset.type; // 'kg' o 'reps'
                const val = parseFloat(e.target.dataset.val);
                // Seleziona l'input corretto: 0 per kg, 1 per reps
                const inputIndex = type === 'kg' ? 0 : 1;
                const input = targetRow.querySelectorAll('.set-input')[inputIndex];
                
                const currentValue = parseFloat(input.value) || 0;
                let newValue;

                if (type === 'kg') {
                    const direction = val > 0 ? 1 : -1;
                    const baseIncrement = parseFloat(localStorage.getItem('weightIncrement')) || 2.5;
                    let step = baseIncrement;
                    
                    if (direction > 0) {
                        if (currentValue >= 150) step = 10;
                        else if (currentValue >= 40) step = 5;
                    } else {
                        if (currentValue > 150) step = 10;
                        else if (currentValue > 40) step = 5;
                    }
                    newValue = Math.max(0, currentValue + (step * direction));
                } else {
                    newValue = Math.max(0, currentValue + val);
                }
                
                // Aggiorna il valore e forza l'aggiornamento visivo se necessario
                input.value = newValue;
                
                // Salva lo stato
                saveCurrentWorkoutState();
            }
        }
    });

    container.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('set-input') || e.target.classList.contains('recovery-input')) {
            e.target.dataset.originalValue = e.target.value;
            e.target.value = '';
        }
    });
    container.addEventListener('focusout', (e) => {
        if ((e.target.classList.contains('set-input') || e.target.classList.contains('recovery-input')) && e.target.value === '') {
            e.target.value = e.target.dataset.originalValue || '';
        }
    });
    container.addEventListener('input', (e) => {
        if (e.target.classList.contains('set-input') || e.target.tagName === 'TEXTAREA' || e.target.classList.contains('recovery-input')) {
            saveCurrentWorkoutState();
        }
        // Logica auto-resize per textarea
        if (e.target.tagName === 'TEXTAREA' && e.target.classList.contains('auto-expand')) {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        }
    });
    container.addEventListener('change', (e) => {
        if (e.target.classList.contains('set-check')) {
            saveCurrentWorkoutState();
            const row = e.target.closest('.set-row');
            if (e.target.checked) {
                row.classList.add('completed');
                startRecoveryTimer(parseInt(e.target.closest('.esercizio-card').querySelector('.recovery-input').value, 10) || 90);
            } else {
                row.classList.remove('completed');
            }

            // Scorrimento automatico al prossimo esercizio se completato
            const card = e.target.closest('.esercizio-card');
            if (card) {
                const allSets = card.querySelectorAll('.set-check');
                const allCompleted = Array.from(allSets).every(cb => cb.checked);

                if (allCompleted) {
                    let nextCard = card.nextElementSibling;
                    while (nextCard && !nextCard.classList.contains('esercizio-card')) {
                        nextCard = nextCard.nextElementSibling;
                    }
                    if (nextCard) {
                        setTimeout(() => {
                            nextCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 500);
                    }
                }
                
                // Aggiorna il focus visivo (oscura/rivela esercizi)
                updateExerciseFocus();
            }
        }
    });

    // --- Logica Pulsanti Timer (Replica dalla Home) ---
    recoveryTimerContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const adjustment = btn.dataset.adjust;
        if (adjustment) {
            const adjustmentMs = parseInt(adjustment, 10) * 1000;
            let recoveryEndTime = getFromLocalStorage('recoveryEndTime') || Date.now();
            if (recoveryEndTime < Date.now()) recoveryEndTime = Date.now();
            
            recoveryEndTime += adjustmentMs;
            saveToLocalStorage('recoveryEndTime', recoveryEndTime);
            startRecoveryTimer(0, true); // Aggiorna il timer
        } else if (btn.classList.contains('btn-timer-skip')) {
            localStorage.removeItem('recoveryEndTime');
            startRecoveryTimer(0, true); // Resetta il timer
        }
        localStorage.removeItem('recoverySoundPlayed');
    });

    // Timer Functions
    function startWorkoutTimer() {
        let startTime = getFromLocalStorage('workoutStartTime');
        if (!startTime) { startTime = Date.now(); saveToLocalStorage('workoutStartTime', startTime); }
        saveToLocalStorage('activeWorkout', { pianoId, routineId });
        const updateTimer = () => {
            const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
            workoutTimerEl.textContent = `${String(Math.floor(totalSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')}`;
        };
        updateTimer();
        workoutInterval = setInterval(updateTimer, 1000);
    }

    function startRecoveryTimer(duration, isSyncing = false) {
        clearInterval(recoveryTimerInterval);
        recoveryTimerContainer.classList.remove('timer-finished');
        if (workoutHeader) workoutHeader.classList.remove('timer-finished');
        if (workoutStickyHeader) workoutStickyHeader.classList.remove('timer-finished');
        if (!isSyncing) {
            saveToLocalStorage('recoveryEndTime', Date.now() + duration * 1000);
            localStorage.removeItem('recoverySoundPlayed');
        }
        const updateRecovery = () => {
            const endTime = getFromLocalStorage('recoveryEndTime');
            if (!endTime) { clearInterval(recoveryTimerInterval); recoveryTimerEl.textContent = "00:00"; return; }
            const remainingMs = endTime - Date.now();
            if (remainingMs <= 0) {
                clearInterval(recoveryTimerInterval);
                recoveryTimerEl.textContent = "00:00";
                recoveryTimerContainer.classList.add('timer-finished');
                if (workoutHeader) workoutHeader.classList.add('timer-finished');
                if (workoutStickyHeader) workoutStickyHeader.classList.add('timer-finished');
                if (!getFromLocalStorage('recoverySoundPlayed')) { playNotificationSound(); saveToLocalStorage('recoverySoundPlayed', true); }
            } else {
                recoveryTimerEl.textContent = `${String(Math.floor(Math.round(remainingMs / 1000) / 60)).padStart(2, '0')}:${String(Math.round(remainingMs / 1000) % 60).padStart(2, '0')}`;
            }
        };
        recoveryTimerInterval = setInterval(updateRecovery, 1000);
        updateRecovery();
    }

    function saveCurrentWorkoutState() {
        const currentState = { esercizi: {} };
        container.querySelectorAll('.esercizio-card').forEach(card => {
            const serie = [];
            card.querySelectorAll('.set-row').forEach(row => {
                const inputs = row.querySelectorAll('.set-input');
                serie.push({ kg: inputs[0].value, reps: inputs[1].value, completed: row.querySelector('.set-check').checked });
            });
            currentState.esercizi[card.dataset.esercizioId] = {
                note: card.querySelector('textarea').value,
                recupero: card.querySelector('.recovery-input').value,
                serie
            };
        });
        saveToLocalStorage('activeWorkoutState', currentState);
    }

    btnEndWorkout.addEventListener('click', () => {
        if (wakeLock) wakeLock.release();
        clearInterval(workoutInterval);
        // Pulisce lo stato dell'allenamento attivo
        localStorage.removeItem('activeWorkout');
        localStorage.removeItem('workoutStartTime');
        localStorage.removeItem('recoverySoundPlayed');
        localStorage.removeItem('recoveryEndTime');
        localStorage.removeItem('activeWorkoutState');

        const workoutLog = {
            id: Date.now().toString(),
            data: new Date().toISOString(),
            durata: workoutTimerEl.textContent,
            pianoId, routineId, routineNome: routine.nome, esercizi: []
        };

        // 1. Popola workoutLog per lo STORICO con solo le serie COMPLETATE
        container.querySelectorAll('.esercizio-card').forEach(card => {
            const seriePerStorico = [];
            card.querySelectorAll('.set-row').forEach(riga => {
                if (riga.querySelector('.set-check').checked) {
                    const inputs = riga.querySelectorAll('input[type="number"]');
                    seriePerStorico.push({ kg: inputs[0].value || 0, reps: inputs[1].value || 0 });
                }
            });
            workoutLog.esercizi.push({
                esercizioId: routine.esercizi.find(e => e.id === card.dataset.esercizioId).esercizioId,
                instanceId: card.dataset.esercizioId,
                nome: routine.esercizi.find(e => e.id === card.dataset.esercizioId).nome,
                serie: seriePerStorico,
                note: card.querySelector('textarea').value
            });
        });

        // 2. Salva lo storico
        let storicoCompleto = getFromLocalStorage('storicoAllenamenti') || [];
        storicoCompleto.unshift(workoutLog);
        saveToLocalStorage('storicoAllenamenti', storicoCompleto);

        // 3. Aggiorna la routine (se richiesto) o solo le note
        let pianiDaAggiornare = getFromLocalStorage('pianiDiAllenamento');
        const routineDaAggiornare = pianiDaAggiornare.find(p => p.id === pianoId).routine.find(r => r.id === routineId);
        if (routineDaAggiornare) {
            container.querySelectorAll('.esercizio-card').forEach(card => {
                const esercizioTarget = routineDaAggiornare.esercizi.find(e => e.id === card.dataset.esercizioId);
                if (esercizioTarget) {
                    // Aggiorna sempre le note
                    esercizioTarget.note = card.querySelector('textarea').value;

                    // Se "Aggiorna routine" è spuntato, aggiorna i valori delle serie
                    if (updateRoutineToggle.checked) {
                        const nuoveSerie = [];
                        card.querySelectorAll('.set-row').forEach((riga, index) => {
                            const inputs = riga.querySelectorAll('input[type="number"]');
                            const kg = inputs[0].value || 0;
                            const reps = inputs[1].value || 0;
                            
                            // Se la serie è stata completata, usa i nuovi valori
                            if (riga.querySelector('.set-check').checked) {
                                nuoveSerie.push({ kg, reps });
                            } else {
                                // Altrimenti, mantieni i vecchi valori dalla routine originale
                                if (esercizioTarget.serie[index]) {
                                    nuoveSerie.push(esercizioTarget.serie[index]);
                                }
                            }
                        });
                        esercizioTarget.serie = nuoveSerie;
                    }
                }
            });
            saveToLocalStorage('pianiDiAllenamento', pianiDaAggiornare);
        }
        window.location.href = 'index.html';
    });

    startWorkoutTimer();
    if (getFromLocalStorage('recoveryEndTime')) startRecoveryTimer(0, true);
};