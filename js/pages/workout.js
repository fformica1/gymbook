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
        
        // Container per il titolo per mascherare lo scorrimento ed evitare sovrapposizioni
        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = 'flex: 1; min-width: 0; overflow: hidden; display: flex;';

        titleElement.parentNode.insertBefore(wrapper, titleElement);
        wrapper.appendChild(backBtn);
        wrapper.appendChild(titleContainer);
        titleContainer.appendChild(titleElement);
    }

    const ICON_CHECKED = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px; height:24px;"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" /></svg>`;
    const ICON_UNCHECKED = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`;

    // UI Elements
    document.querySelector('.routine-title').textContent = routine.nome;
    animateTitleIfLong(document.querySelector('.routine-title'));
    const workoutTimerEl = document.querySelector('.workout-timer');
    const btnEndWorkout = document.querySelector('.btn-end-workout');
    const recoveryTimerEl = document.querySelector('.recovery-timer .timer-display');
    const recoveryTimerContainer = document.querySelector('.recovery-timer');
    const workoutHeader = document.querySelector('.workout-header');
    const workoutStickyHeader = document.querySelector('.workout-sticky-header');
    const updateRoutineToggle = document.querySelector('#update-routine-toggle');
    const container = document.querySelector('#lista-esercizi-allenamento .content-wrapper');
    const workoutSettingsContainer = document.querySelector('.workout-settings-container');
    
    let workoutState = getFromLocalStorage('activeWorkoutState') || null;
    const storico = getFromLocalStorage('storicoAllenamenti') || [];

    // Loop locale per aggiornare la UI (il background è gestito da main.js)
    // Usiamo setInterval standard perché siamo in primo piano
    const uiInterval = setInterval(() => {
        if (getFromLocalStorage('workoutStartTime')) updateWorkoutTimerUI();
        if (getFromLocalStorage('recoveryEndTime')) updateRecoveryTimerUI();
    }, 1000);

    // Controllo Modalità Anteprima (se c'è un allenamento attivo ma stiamo visualizzando un'altra routine)
    const activeWorkout = getFromLocalStorage('activeWorkout');
    const isPreviewMode = activeWorkout && (activeWorkout.pianoId !== pianoId || activeWorkout.routineId !== routineId);

    if (isPreviewMode) {
        workoutState = null; // Non caricare lo stato dell'allenamento attivo
        if (recoveryTimerContainer) recoveryTimerContainer.style.display = 'none';
        document.body.style.scrollSnapType = 'none'; // Rimuovi magnetismo in anteprima
        if (workoutSettingsContainer) workoutSettingsContainer.style.display = 'none';
    }

    // Funzione per aggiornare lo stato del pulsante (AVVIA / FINE)
    function updateWorkoutButton() {
        if (isPreviewMode) {
            btnEndWorkout.style.display = 'none';
            return;
        }
        const isRunning = !!getFromLocalStorage('workoutStartTime');
        if (isRunning) {
            btnEndWorkout.textContent = "FINE";
            btnEndWorkout.classList.remove('btn-avvia');
            btnEndWorkout.classList.add('btn-elimina');
        } else {
            btnEndWorkout.textContent = "AVVIA";
            btnEndWorkout.classList.remove('btn-elimina');
            btnEndWorkout.classList.add('btn-avvia');
        }
    }

    // Gestione Toggle Aggiorna Routine
    if (updateRoutineToggle) {
        updateRoutineToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const isChecked = updateRoutineToggle.dataset.checked === 'true';
            const newState = !isChecked;
            updateRoutineToggle.dataset.checked = newState ? 'true' : 'false';
            updateRoutineToggle.innerHTML = newState ? ICON_CHECKED : ICON_UNCHECKED;
            updateRoutineToggle.style.color = newState ? 'var(--accent)' : 'var(--text-dim)';
        });
    }

    container.innerHTML = '';

    // Render Esercizi
    routine.esercizi.forEach(esercizio => {
        // Filtra lo storico per considerare solo esecuzioni avvenute in QUESTA routine
        const logsDiQuestaRoutine = storico.filter(log => log.routineId === routineId);
        const allPerformances = logsDiQuestaRoutine.flatMap(log => log.esercizi).filter(e => e.esercizioId === esercizio.esercizioId);
        const lastPerformance = allPerformances[0];
        const card = document.createElement('article');
        card.className = 'esercizio-card';
        card.dataset.esercizioId = esercizio.id;

        const serieDaRenderizzare = workoutState?.esercizi[esercizio.id]?.serie || esercizio.serie;
        const serieHtml = serieDaRenderizzare.map((s, index) => {
            const prevData = lastPerformance && lastPerformance.serie[index] ? `${lastPerformance.serie[index].kg}kg x ${lastPerformance.serie[index].reps}` : '-';
            const checkIcon = s.completed ? ICON_CHECKED : ICON_UNCHECKED;
            const btnColor = s.completed ? 'var(--accent)' : 'var(--text-dim)';
            const rowClass = s.completed ? 'set-row completed' : 'set-row';
            
            const disabledAttr = isPreviewMode ? 'disabled' : '';
            const hideStyle = isPreviewMode ? 'style="display:none"' : '';

            return `
                <div class="${rowClass}">
                    <span class="set-number">${index + 1}</span>
                    <span class="set-previous clickable-history" data-exercise-id="${esercizio.id}" data-set-index="${index}">${prevData}</span>
                    <div class="set-inputs">
                        <div class="adjust-control">
                            <button class="btn-weight-adjust" data-adjust="-2.5" ${hideStyle}>-</button>
                            <input type="number" class="set-input weight-input" value="${s.kg}" inputmode="decimal" step="any" ${disabledAttr}>
                            <button class="btn-weight-adjust" data-adjust="2.5" ${hideStyle}>+</button>
                        </div>
                        <div class="adjust-control">
                            <button class="btn-reps-adjust" data-adjust="-1" ${hideStyle}>-</button>
                            <input type="number" class="set-input reps-input" value="${s.reps}" inputmode="numeric" ${disabledAttr}>
                            <button class="btn-reps-adjust" data-adjust="1" ${hideStyle}>+</button>
                        </div>
                    </div>
                    <button type="button" class="btn-check-set" data-completed="${s.completed ? 'true' : 'false'}" style="background:none; border:none; padding:0; cursor:pointer; color: ${btnColor}; display: flex; align-items: center; justify-content: center;" ${disabledAttr}>${checkIcon}</button>
                </div>`;
        }).join('');

        // HTML per la riga di regolazione rapida (Quick Adjust)
        const quickAdjustHtml = isPreviewMode ? '' : `
            <div class="quick-adjust-row">
                <button class="btn-remove-set btn-inline-set btn-remove-set-inline" title="Rimuovi ultima serie">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" /></svg>
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
            <div class="exercise-details"><textarea placeholder="Note" rows="1" class="auto-expand" ${isPreviewMode ? 'disabled' : ''}>${workoutState?.esercizi[esercizio.id]?.note || esercizio.note}</textarea></div>
            <div class="recovery-time-display"><span>Tempo di Recupero: <input type="number" class="recovery-input" value="${workoutState?.esercizi[esercizio.id]?.recupero || esercizio.recupero}" inputmode="numeric" ${isPreviewMode ? 'disabled' : ''}> s</span></div>
            <div class="sets-header"><span class="set-number-header">Set</span><span class="set-previous-header">Prec</span><div class="set-inputs-header"><span>Kg</span><span>Reps</span></div><span class="set-check-header">✓</span></div>
            <div class="sets-container">${serieHtml}</div>
            ${quickAdjustHtml}
        `;
        container.appendChild(card);
        container.appendChild(document.createElement('hr'));

        // Listeners locali per card
        const setsContainer = card.querySelector('.sets-container');
        const btnAddSet = card.querySelector('.btn-add-set');
        if (btnAddSet) {
            btnAddSet.addEventListener('click', () => {
                const rowCount = setsContainer.children.length;
                const lastRow = setsContainer.lastElementChild;
                const kgValue = lastRow ? lastRow.querySelectorAll('.set-input')[0].value : '';
                const repsValue = lastRow ? lastRow.querySelectorAll('.set-input')[1].value : '';
                const newRow = document.createElement('div');
                newRow.className = 'set-row';
                newRow.innerHTML = `<span class="set-number">${rowCount + 1}</span><span class="set-previous">-</span><div class="set-inputs"><div class="adjust-control"><button class="btn-weight-adjust" data-adjust="-2.5">-</button><input type="number" class="set-input weight-input" value="${kgValue}" inputmode="decimal" step="any"><button class="btn-weight-adjust" data-adjust="2.5">+</button></div><div class="adjust-control"><button class="btn-reps-adjust" data-adjust="-1">-</button><input type="number" class="set-input reps-input" value="${repsValue}" inputmode="numeric"><button class="btn-reps-adjust" data-adjust="1">+</button></div></div><button type="button" class="btn-check-set" data-completed="false" style="background:none; border:none; padding:0; cursor:pointer; color: var(--text-dim); display: flex; align-items: center; justify-content: center;">${ICON_UNCHECKED}</button>`;
                setsContainer.appendChild(newRow);
            });
        }
        const btnRemoveSet = card.querySelector('.btn-remove-set');
        if (btnRemoveSet) {
            btnRemoveSet.addEventListener('click', () => {
                if (setsContainer.children.length > 0) { setsContainer.lastElementChild.remove(); saveCurrentWorkoutState(); }
            });
        }
    });

    // Ridimensiona inizialmente tutte le textarea per adattarle al contenuto esistente
    container.querySelectorAll('textarea.auto-expand').forEach(textarea => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });

    // --- Funzione Focus Mode (Oscura esercizi non attivi) ---
    let currentActiveCard = null;

    function updateExerciseFocus(forceCard = null) {
        if (isPreviewMode) return;

        const cards = container.querySelectorAll('.esercizio-card');
        
        if (forceCard) {
            currentActiveCard = forceCard;
        }

        // Se non c'è un esercizio attivo (es. avvio), trova il primo non completato
        if (!currentActiveCard) {
            for (const card of cards) {
                const allSets = card.querySelectorAll('.btn-check-set');
                const isComplete = Array.from(allSets).every(btn => btn.dataset.completed === 'true');
                if (!isComplete) {
                    currentActiveCard = card;
                    break;
                }
            }
        }

        cards.forEach(card => {
            if (currentActiveCard) {
                if (card === currentActiveCard) {
                    card.classList.remove('dimmed');
                } else {
                    card.classList.add('dimmed');
                }
            } else {
                // Fallback se tutto è completo o nessun attivo trovato
                card.classList.remove('dimmed');
            }
        });
    }
    updateExerciseFocus(); // Esegui all'avvio

    // Scroll automatico all'esercizio in corso quando si rientra nella pagina
    setTimeout(() => {
        if (isPreviewMode) return;
        const activeCard = container.querySelector('.esercizio-card:not(.dimmed)');
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 300);

    // --- Consolidated Event Delegation for the entire workout container ---
    container.addEventListener('click', (e) => {
        const checkBtn = e.target.closest('.btn-check-set');
        const weightAdjustBtn = e.target.closest('.btn-weight-adjust');
        const repsAdjustBtn = e.target.closest('.btn-reps-adjust');
        const quickAdjustBtn = e.target.closest('.btn-quick-adjust');
        const card = e.target.closest('.esercizio-card');
        const historySpan = e.target.closest('.clickable-history');

        // 1. Handle Set Completion Check
        if (checkBtn) {
            e.preventDefault();
            if (checkBtn.disabled) return;

            const isCompleted = checkBtn.dataset.completed === 'true';
            const newState = !isCompleted;

            if (!getFromLocalStorage('workoutStartTime')) {
                saveToLocalStorage('workoutStartTime', Date.now());
                saveToLocalStorage('activeWorkout', { pianoId, routineId });
                startWorkoutTimer();
                updateWorkoutButton();
            }

            checkBtn.dataset.completed = newState ? 'true' : 'false';
            checkBtn.innerHTML = newState ? ICON_CHECKED : ICON_UNCHECKED;
            checkBtn.style.color = newState ? 'var(--accent)' : 'var(--text-dim)';

            saveCurrentWorkoutState();
            const row = checkBtn.closest('.set-row');
            if (newState) {
                row.classList.add('completed');
                startRecoveryTimer(parseInt(checkBtn.closest('.esercizio-card').querySelector('.recovery-input').value, 10) || 90);
            } else {
                row.classList.remove('completed');
            }

            const currentCard = checkBtn.closest('.esercizio-card');
            if (currentCard) {
                const allSets = currentCard.querySelectorAll('.btn-check-set');
                const allCompleted = Array.from(allSets).every(b => b.dataset.completed === 'true');

                if (allCompleted) {
                    let nextCard = currentCard.nextElementSibling;
                    while (nextCard && !nextCard.classList.contains('esercizio-card')) {
                        nextCard = nextCard.nextElementSibling;
                    }
                    if (nextCard) {
                        updateExerciseFocus(nextCard);
                        setTimeout(() => {
                            nextCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 500);
                    } else {
                        updateExerciseFocus(currentCard);
                    }
                } else {
                    updateExerciseFocus(currentCard);
                    // Se l'esercizio torna incompleto, riporta il focus e scorri su di esso
                    currentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            return; // Stop further processing
        }

        // 2. Handle +/- buttons for individual sets (hidden by default, but logic is here)
        if (weightAdjustBtn) {
            const input = weightAdjustBtn.closest('.adjust-control').querySelector('.set-input');
            const currentVal = parseFloat(input.value) || 0;
            const direction = parseFloat(weightAdjustBtn.dataset.adjust) > 0 ? 1 : -1;
            const baseIncrement = parseFloat(localStorage.getItem('weightIncrement')) || 2.5;
            let step = baseIncrement;
            if (direction > 0) {
                if (currentVal >= 150) step = 10; else if (currentVal >= 40) step = 5;
            } else {
                if (currentVal > 150) step = 10; else if (currentVal > 40) step = 5;
            }
            input.value = Math.max(0, currentVal + (step * direction));
            saveCurrentWorkoutState();
            return;
        }
        if (repsAdjustBtn) {
            const input = repsAdjustBtn.closest('.adjust-control').querySelector('.set-input');
            input.value = Math.max(0, (parseFloat(input.value) || 0) + parseFloat(repsAdjustBtn.dataset.adjust));
            saveCurrentWorkoutState();
            return;
        }

        // 3. Handle Quick Adjust buttons
        if (quickAdjustBtn) {
            const targetCard = quickAdjustBtn.closest('.esercizio-card');
            const setsContainer = targetCard.querySelector('.sets-container');
            const rows = Array.from(setsContainer.querySelectorAll('.set-row'));
            let targetRow = rows.find(row => row.querySelector('.btn-check-set').dataset.completed !== 'true');
            if (!targetRow && rows.length > 0) targetRow = rows[rows.length - 1];

            if (targetRow) {
                const type = quickAdjustBtn.dataset.type;
                const val = parseFloat(quickAdjustBtn.dataset.val);
                const inputIndex = type === 'kg' ? 0 : 1;
                const input = targetRow.querySelectorAll('.set-input')[inputIndex];
                const currentValue = parseFloat(input.value) || 0;
                let newValue;
                if (type === 'kg') {
                    const direction = val > 0 ? 1 : -1;
                    const baseIncrement = parseFloat(localStorage.getItem('weightIncrement')) || 2.5;
                    let step = baseIncrement;
                    if (direction > 0) {
                        if (currentValue >= 150) step = 10; else if (currentValue >= 40) step = 5;
                    } else {
                        if (currentValue > 150) step = 10; else if (currentValue > 40) step = 5;
                    }
                    newValue = Math.max(0, currentValue + (step * direction));
                } else {
                    newValue = Math.max(0, currentValue + val);
                }
                input.value = newValue;
                saveCurrentWorkoutState();
            }
            return;
        }

        // 5. Handle History Click (Popup storico ultimi 4 allenamenti)
        if (historySpan && card && !card.classList.contains('dimmed')) {
            const exerciseId = historySpan.dataset.exerciseId;
            
            const exerciseDef = routine.esercizi.find(e => e.id === exerciseId);
            if (!exerciseDef) return;

            // Filtra lo storico per questa routine
            const logsDiQuestaRoutine = storico.filter(log => log.routineId === routineId);
            
            const historyData = [];
            for (const log of logsDiQuestaRoutine) {
                if (historyData.length >= 20) break;
                // Trova l'esercizio nel log usando l'ID globale (esercizioId)
                const logExercise = log.esercizi.find(e => e.esercizioId === exerciseDef.esercizioId);
                
                if (logExercise && logExercise.serie) {
                    logExercise.serie.forEach((s, index) => {
                        if (historyData.length >= 20) return;
                        if (s.completed) {
                            historyData.push({
                                date: new Date(log.data),
                                kg: s.kg,
                                reps: s.reps,
                                setIndex: index + 1
                            });
                        }
                    });
                }
            }
            showHistoryModal(exerciseDef.nome, historyData);
            return;
        }

        // 4. Handle click on the card itself for Focus Mode
        if (card) {
            updateExerciseFocus(card);
            if (!isPreviewMode) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    // Funzione per mostrare il modale dello storico
    function showHistoryModal(exerciseName, historyData) {
        let modal = document.getElementById('history-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'history-modal';
            modal.className = 'modal';
            document.body.appendChild(modal);
        }

        let content = '';
        if (historyData.length === 0) {
            content = '<p style="text-align:center; color: var(--text-dim); padding: 20px;">Nessun dato storico disponibile.</p>';
        } else {
            // Raggruppa per data
            const groups = {};
            const uniqueDates = [];
            
            historyData.forEach(h => {
                const dateStr = h.date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
                if (!groups[dateStr]) {
                    groups[dateStr] = [];
                    uniqueDates.push(dateStr);
                }
                groups[dateStr].push(h);
            });

            content = uniqueDates.map(dateStr => {
                const setsHtml = groups[dateStr].map(h => `
                    <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-light);">
                        <span style="color: var(--text-dim); font-size: 12px; border: 1px solid var(--border-light); padding: 2px 6px; border-radius: 4px;">Set ${h.setIndex}</span>
                        <span style="font-weight: bold; color: var(--text);">${h.kg}kg x ${h.reps}</span>
                    </div>
                `).join('');

                return `
                    <div style="margin-bottom: 15px;">
                        <div style="padding: 5px 0; border-bottom: 1px solid var(--border-light); margin-bottom: 5px; font-weight: bold; color: var(--accent); font-size: 14px;">
                            ${dateStr}
                        </div>
                        <div style="padding-left: 5px;">
                            ${setsHtml}
                        </div>
                    </div>
                `;
            }).join('');
        }

        modal.innerHTML = `
            <div class="modal-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom: 1px solid var(--border-light); padding-bottom: 10px;">
                    <h3 style="margin:0; font-size: 18px;">Storico Esercizio</h3>
                    <span class="close-modal" style="cursor:pointer; font-size: 24px;">&times;</span>
                </div>
                <p style="margin:0 0 10px 0; color:var(--accent); font-size:14px; font-weight:bold;">${exerciseName}</p>
                <div style="max-height: 400px; overflow-y: auto;">${content}</div>
            </div>
        `;

        modal.style.display = 'flex';
        
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };
    }

    // Funzioni di aggiornamento UI (separate dal loop)
    function updateWorkoutTimerUI() {
        const startTime = getFromLocalStorage('workoutStartTime');
        if (!startTime) return;
        const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
        workoutTimerEl.textContent = `${String(Math.floor(totalSeconds / 3600)).padStart(2, '0')}:${String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')}`;
    }

    function updateRecoveryTimerUI() {
        const endTime = getFromLocalStorage('recoveryEndTime');
        if (!endTime) { recoveryTimerEl.textContent = "00:00"; return; }
        const remainingMs = endTime - Date.now();
        if (remainingMs <= 0) {
            recoveryTimerEl.textContent = "00:00";
            recoveryTimerContainer.classList.add('timer-finished');
            if (workoutHeader) workoutHeader.classList.add('timer-finished');
            if (workoutStickyHeader) workoutStickyHeader.classList.add('timer-finished');
        } else {
            const totalSeconds = Math.ceil(remainingMs / 1000);
            recoveryTimerEl.textContent = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
        }
    }

    // Timer Functions
    function startWorkoutTimer() {
        if (isPreviewMode) {
            workoutTimerEl.textContent = "Anteprima";
            return;
        }

        let startTime = getFromLocalStorage('workoutStartTime');
        
        if (!startTime) {
            workoutTimerEl.textContent = "00:00";
            return;
        }
        
        // Avvia il manager globale (Audio + Worker)
        if (window.globalWorkoutManager) window.globalWorkoutManager.start();
        
        saveToLocalStorage('activeWorkout', { pianoId, routineId });
        updateWorkoutTimerUI(); // Aggiornamento immediato
    }

    function startRecoveryTimer(duration, isSyncing = false) {
        recoveryTimerContainer.classList.remove('timer-finished');
        if (workoutHeader) workoutHeader.classList.remove('timer-finished');
        if (workoutStickyHeader) workoutStickyHeader.classList.remove('timer-finished');
        if (!isSyncing) {
            saveToLocalStorage('recoveryEndTime', Date.now() + duration * 1000);
            localStorage.removeItem('recoverySoundPlayed');
        }
        updateRecoveryTimerUI(); // Aggiornamento immediato
    }

    function saveCurrentWorkoutState() {
        const currentState = { esercizi: {} };
        container.querySelectorAll('.esercizio-card').forEach(card => {
            const serie = [];
            card.querySelectorAll('.set-row').forEach(row => {
                const inputs = row.querySelectorAll('.set-input');
                serie.push({ kg: inputs[0].value, reps: inputs[1].value, completed: row.querySelector('.btn-check-set').dataset.completed === 'true' });
            });
            currentState.esercizi[card.dataset.esercizioId] = {
                note: card.querySelector('textarea').value,
                recupero: card.querySelector('.recovery-input').value,
                serie
            };
        });
        saveToLocalStorage('activeWorkoutState', currentState);
    }

    // Funzione helper per terminare l'allenamento
    function finishWorkout(saveData) {
        if (wakeLock) wakeLock.release();
        clearInterval(uiInterval);
        
        if (window.globalWorkoutManager) window.globalWorkoutManager.stop();
        
        // Pulisce lo stato dell'allenamento attivo
        localStorage.removeItem('activeWorkout');
        localStorage.removeItem('workoutStartTime');
        localStorage.removeItem('recoverySoundPlayed');
        localStorage.removeItem('recoveryEndTime');
        localStorage.removeItem('activeWorkoutState');

        // Rimuovi la notifica persistente
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.getNotifications({tag: 'gymbook-active-workout'}).then(notifications => {
                    notifications.forEach(n => n.close());
                });
            });
        }

        if (saveData) {
            const workoutLog = {
                id: Date.now().toString(),
                data: new Date().toISOString(),
                durata: workoutTimerEl.textContent,
                pianoId, routineId, routineNome: routine.nome, esercizi: []
            };

            // 1. Popola workoutLog per lo STORICO (tutte le serie per mantenere allineamento)
            container.querySelectorAll('.esercizio-card').forEach(card => {
                const seriePerStorico = [];
                card.querySelectorAll('.set-row').forEach(riga => {
                    const inputs = riga.querySelectorAll('input[type="number"]');
                    const isChecked = riga.querySelector('.btn-check-set').dataset.completed === 'true';
                    seriePerStorico.push({ 
                        kg: inputs[0].value || 0, 
                        reps: inputs[1].value || 0,
                        completed: isChecked
                    });
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
                        // Aggiorna sempre le note e il recupero
                        esercizioTarget.note = card.querySelector('textarea').value;
                        esercizioTarget.recupero = card.querySelector('.recovery-input').value;

                        // Se "Aggiorna routine" è spuntato, aggiorna i valori delle serie
                        if (updateRoutineToggle.dataset.checked === 'true') {
                            const nuoveSerie = [];
                            card.querySelectorAll('.set-row').forEach((riga, index) => {
                                const inputs = riga.querySelectorAll('input[type="number"]');
                                const kg = inputs[0].value || 0;
                                const reps = inputs[1].value || 0;
                                
                                // Se la serie è stata completata, usa i nuovi valori
                                if (riga.querySelector('.btn-check-set').dataset.completed === 'true') {
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
        }
        window.location.replace('index.html');
    }

    // Gestione Click Pulsante AVVIA / FINE
    btnEndWorkout.addEventListener('click', () => {
        if (isPreviewMode) return;

        // Se l'allenamento non è avviato, avvialo
        if (!getFromLocalStorage('workoutStartTime')) {
            saveToLocalStorage('workoutStartTime', Date.now());
            saveToLocalStorage('activeWorkout', { pianoId, routineId });
            startWorkoutTimer();
            updateWorkoutButton();
            return;
        }

        // Mostra modale di conferma (Crea dinamicamente se manca per evitare popup di sistema)
        let modal = document.getElementById('end-workout-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'end-workout-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3 style="margin-top: 0;">Allenamento Terminato</h3>
                    <p>Vuoi salvare i progressi nel diario?</p>
                    <div class="modal-actions" style="flex-direction: column; gap: 10px;">
                        <button id="btn-end-save" class="btn-primary">Salva e Termina</button>
                        <button id="btn-end-discard" class="btn-elimina" style="width: 100%;">Non Salvare</button>
                        <button id="btn-end-cancel" class="btn-grigio" style="width: 100%;">Annulla</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        modal.style.display = 'flex';
        
        const btnSave = modal.querySelector('#btn-end-save');
        const btnDiscard = modal.querySelector('#btn-end-discard');
        const btnCancel = modal.querySelector('#btn-end-cancel');

        // Clona per rimuovere vecchi listener
        const newBtnSave = btnSave.cloneNode(true);
        const newBtnDiscard = btnDiscard.cloneNode(true);
        const newBtnCancel = btnCancel.cloneNode(true);
        
        btnSave.parentNode.replaceChild(newBtnSave, btnSave);
        btnDiscard.parentNode.replaceChild(newBtnDiscard, btnDiscard);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);

        newBtnSave.addEventListener('click', () => {
            modal.style.display = 'none';
            finishWorkout(true);
        });

        newBtnDiscard.addEventListener('click', () => {
            modal.style.display = 'none';
            finishWorkout(false);
        });

        newBtnCancel.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; };
    });

    startWorkoutTimer();
    if (!isPreviewMode && getFromLocalStorage('recoveryEndTime')) startRecoveryTimer(0, true);
    updateWorkoutButton(); // Imposta lo stato iniziale del pulsante
};