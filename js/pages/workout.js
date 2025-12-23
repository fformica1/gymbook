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

        card.innerHTML = `
            <div class="esercizio-card-header"><h2>${esercizio.nome}</h2></div>
            <div class="exercise-details"><textarea placeholder="Note" rows="1" class="auto-expand">${workoutState?.esercizi[esercizio.id]?.note || esercizio.note}</textarea></div>
            <div class="recovery-time-display"><span>Tempo di Recupero: <input type="number" class="recovery-input" value="${workoutState?.esercizi[esercizio.id]?.recupero || esercizio.recupero}" inputmode="numeric"> s</span></div>
            <div class="sets-header"><span class="set-number-header">Set</span><span class="set-previous-header">Precedente</span><div class="set-inputs-header"><span>Kg</span><span>Reps</span></div><span class="set-check-header">✓</span></div>
            <div class="sets-container">${serieHtml}</div>
            <div class="action-buttons-container"><button class="btn-remove-set btn-elimina">Rimuovi Serie</button><button class="btn-add-set btn-blu">Aggiungi Serie</button></div>
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

    // Event Delegation
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-weight-adjust') || e.target.classList.contains('btn-reps-adjust')) {
            const input = e.target.closest('.adjust-control').querySelector('.set-input');
            input.value = Math.max(0, (parseFloat(input.value) || 0) + parseFloat(e.target.dataset.adjust));
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

        container.querySelectorAll('.esercizio-card').forEach(card => {
            const serieCompletate = [];
            card.querySelectorAll('.set-row').forEach(riga => {
                const inputs = riga.querySelectorAll('input[type="number"]');
                serieCompletate.push({ kg: inputs[0].value || 0, reps: inputs[1].value || 0 });
            });
            workoutLog.esercizi.push({
                esercizioId: routine.esercizi.find(e => e.id === card.dataset.esercizioId).esercizioId,
                instanceId: card.dataset.esercizioId,
                nome: routine.esercizi.find(e => e.id === card.dataset.esercizioId).nome,
                serie: serieCompletate,
                note: card.querySelector('textarea').value
            });
        });

        let storicoCompleto = getFromLocalStorage('storicoAllenamenti') || [];
        storicoCompleto.unshift(workoutLog);
        saveToLocalStorage('storicoAllenamenti', storicoCompleto);

        let pianiDaAggiornare = getFromLocalStorage('pianiDiAllenamento');
        const routineDaAggiornare = pianiDaAggiornare.find(p => p.id === pianoId).routine.find(r => r.id === routineId);
        if (routineDaAggiornare) {
            workoutLog.esercizi.forEach(logged => {
                const target = routineDaAggiornare.esercizi.find(e => (logged.instanceId && e.id === logged.instanceId) || (!logged.instanceId && e.esercizioId === logged.esercizioId));
                if (target) {
                    target.note = logged.note;
                    if (updateRoutineToggle.checked) target.serie = logged.serie;
                }
            });
            saveToLocalStorage('pianiDiAllenamento', pianiDaAggiornare);
        }
        window.location.href = 'index.html';
    });

    startWorkoutTimer();
    if (getFromLocalStorage('recoveryEndTime')) startRecoveryTimer(0, true);
};