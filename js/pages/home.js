window.setupHomePage = function() {
    console.log("Setup Home Page (Nuova Struttura)");
    const activePlanNameEl = document.querySelector('#active-plan-name');
    const routineListHomeEl = document.querySelector('#routine-list-home');
    
    // Gestione click su routine: impedisce avvio di nuovi allenamenti se uno è già in corso
    if (routineListHomeEl) {
        routineListHomeEl.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href.includes('allenamento.html')) {
                const activeWorkout = getFromLocalStorage('activeWorkout');
                if (activeWorkout) {
                    const url = new URL(link.href);
                    const clickedRoutineId = url.searchParams.get('routineId');
                    const clickedPianoId = url.searchParams.get('pianoId');

                    if (activeWorkout.routineId !== clickedRoutineId || activeWorkout.pianoId !== clickedPianoId) {
                        e.preventDefault();
                        window.location.replace(`allenamento.html?pianoId=${clickedPianoId}&routineId=${clickedRoutineId}&mode=preview`);
                    }
                }
            }
        });
    }

    // --- Setup Banner Listeners (Una sola volta all'avvio) ---
    const workoutBanner = document.querySelector('#active-workout-banner');
    if (workoutBanner) {
        const bannerLink = workoutBanner.querySelector('.workout-banner-link');
        const recoveryContainer = workoutBanner.querySelector('.recovery-timer');

        // 1. Gestione click sul banner (Navigazione)
        bannerLink.addEventListener('click', (e) => {
            // Se il click è avvenuto su un pulsante, ignoralo (lascia gestire al listener dei pulsanti)
            if (e.target.closest('button')) return;

            const activeWorkout = getFromLocalStorage('activeWorkout');
            if (activeWorkout) {
                const { pianoId, routineId } = activeWorkout;
                window.location.replace(`allenamento.html?pianoId=${pianoId}&routineId=${routineId}`);
            }
        });

        // 2. Gestione click sui pulsanti del timer (Event Delegation)
        recoveryContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            // Ferma la propagazione per sicurezza (anche se il controllo sopra gestisce già la navigazione)
            e.stopPropagation();

            const adjustment = btn.dataset.adjust;
            if (adjustment) {
                const adjustmentMs = parseInt(adjustment, 10) * 1000;
                let recoveryEndTime = getFromLocalStorage('recoveryEndTime') || Date.now();
                if (recoveryEndTime < Date.now()) recoveryEndTime = Date.now();
                
                recoveryEndTime += adjustmentMs;
                saveToLocalStorage('recoveryEndTime', recoveryEndTime);
            } else if (btn.classList.contains('btn-timer-skip')) {
                localStorage.removeItem('recoveryEndTime');
                recoveryContainer.classList.remove('timer-finished');
                workoutBanner.classList.remove('timer-finished');
            }
            localStorage.removeItem('recoverySoundPlayed');
        });
    }

    renderHomePage();

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            console.log("Pagina ripristinata dalla cache. Rirenderizzo la Home.");
            renderHomePage();
        }
    });

    function renderHomePage() {
        const activePianoId = getFromLocalStorage('activePianoId');
        const piani = getFromLocalStorage('pianiDiAllenamento') || [];
        const activePiano = piani.find(p => p.id === activePianoId);

        if (activePiano) {
            activePlanNameEl.textContent = activePiano.nome;
            animateTitleIfLong(activePlanNameEl);
            routineListHomeEl.innerHTML = '';
            if (activePiano.routine.length > 0) {
                const storico = getFromLocalStorage('storicoAllenamenti') || [];

                // Palette di colori accesi e ben distinguibili
                const routineColors = [
                    '#FF3B30', // Rosso
                    '#FF9500', // Arancione
                    '#FFCC00', // Giallo
                    '#34C759', // Verde
                    '#5AC8FA', // Azzurro
                    '#007AFF', // Blu
                    '#5856D6', // Indaco
                    '#AF52DE', // Viola
                    '#ff65a5ff'  // Rosa
                ];

                // Assegna e salva i colori se mancano (per coerenza futura nel calendario)
                let colorsUpdated = false;
                activePiano.routine.forEach((r, index) => {
                    if (!r.color) {
                        r.color = routineColors[index % routineColors.length];
                        colorsUpdated = true;
                    }
                });

                if (colorsUpdated) {
                    saveToLocalStorage('pianiDiAllenamento', piani);
                }

                activePiano.routine.forEach((r, index) => {
                    const ultimoAllenamento = storico.find(log => log.routineId === r.id);
                    let testoUltimoAllenamento = '';

                    if (ultimoAllenamento) {
                        const oggi = new Date();
                        const dataAllenamento = new Date(ultimoAllenamento.data);
                        oggi.setHours(0, 0, 0, 0);
                        dataAllenamento.setHours(0, 0, 0, 0);

                        const diffTime = oggi - dataAllenamento;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays === 0) testoUltimoAllenamento = 'Oggi';
                        else if (diffDays === 1) testoUltimoAllenamento = 'Ieri';
                        else testoUltimoAllenamento = `${diffDays} gg fa`;
                    }

                    const color = r.color; // Usa il colore salvato

                    const routineDiv = document.createElement('div');
                    routineDiv.dataset.routineId = r.id;
                    routineDiv.className = 'list-item-container';
                    routineDiv.innerHTML = `
                        <span class="routine-dot" style="width: 18px; height: 18px; background-color: ${color}; border-radius: 50%; display: inline-block; margin-right: 15px; flex-shrink: 0;"></span>
                        <a href="allenamento.html?pianoId=${activePiano.id}&routineId=${r.id}" class="title-link">
                            <h3>${r.nome}</h3></a>
                        <span class="last-workout-date">${testoUltimoAllenamento}</span>
                    `;
                    routineListHomeEl.appendChild(routineDiv);
                    animateTitleIfLong(routineDiv.querySelector('h3'));
                });
            } else {
                routineListHomeEl.innerHTML = '<p>Questo piano di allenamento non ha ancora nessuna routine.</p>';
            }
        } else {
            activePlanNameEl.textContent = 'Nessun piano di allenamento attivo';
            routineListHomeEl.innerHTML = '<p>Crea un piano di allenamento per iniziare.</p>';
        }

        // Banner Allenamento Attivo
        const activeWorkout = getFromLocalStorage('activeWorkout');

        if (activeWorkout && workoutBanner) {
            const { pianoId, routineId } = activeWorkout;
            const piani = getFromLocalStorage('pianiDiAllenamento') || [];
            const piano = piani.find(p => p.id === pianoId);
            const routine = piano?.routine.find(r => r.id === routineId);

            if (routine) {
                workoutBanner.style.display = 'block';
                workoutBanner.querySelector('.routine-title').textContent = routine.nome;
                animateTitleIfLong(workoutBanner.querySelector('.routine-title'));
                
                // --- Calcolo Prossimo Set ---
                const workoutState = getFromLocalStorage('activeWorkoutState');
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

                const nextSetEl = workoutBanner.querySelector('.next-set-info');
                if (nextSetEl) nextSetEl.textContent = nextSetText;
                // ---------------------------

                // Calcoliamo l'altezza e il padding DOPO aver aggiornato il contenuto per precisione
                const bannerHeight = workoutBanner.offsetHeight;
                const navHeight = document.querySelector('.bottom-nav')?.offsetHeight || 90;
                // Aggiungiamo un buffer di 20px per estetica
                document.body.style.paddingBottom = `${bannerHeight + navHeight + 20}px`;

                const bannerTimerEl = workoutBanner.querySelector('.workout-timer');

                // Avvia il timer nel banner
                const startTime = getFromLocalStorage('workoutStartTime');
                if (startTime) {
                    if (window.bannerWorkoutTimer) clearInterval(window.bannerWorkoutTimer);
                    const updateBannerTimer = () => {
                        const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
                        const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
                        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
                        if (bannerTimerEl) bannerTimerEl.textContent = `${hours}:${minutes}`;
                    };
                    updateBannerTimer();
                    window.bannerWorkoutTimer = setInterval(updateBannerTimer, 1000);
                }

                // Timer Recupero Banner
                const recoveryContainer = workoutBanner.querySelector('.recovery-timer');
                const recoveryDisplay = recoveryContainer.querySelector('.timer-display');
                const updateRecoveryBanner = () => {
                    const recoveryEndTime = getFromLocalStorage('recoveryEndTime');
                    if (recoveryEndTime) {                    
                        const remainingMs = recoveryEndTime - Date.now();
                        if (remainingMs > 0) {
                            const remainingSeconds = Math.ceil(remainingMs / 1000);
                            const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
                            const seconds = String(remainingSeconds % 60).padStart(2, '0');
                            recoveryDisplay.textContent = `${minutes}:${seconds}`;                        
                            recoveryContainer.classList.remove('timer-finished');
                            workoutBanner.classList.remove('timer-finished');
                        } else {
                            recoveryDisplay.textContent = '00:00';
                            recoveryContainer.classList.add('timer-finished');
                            workoutBanner.classList.add('timer-finished');
                        }
                    } else {
                        recoveryDisplay.textContent = '00:00';
                        recoveryContainer.classList.remove('timer-finished');
                        workoutBanner.classList.remove('timer-finished');
                    }
                };
                if (window.bannerRecoveryTimer) clearInterval(window.bannerRecoveryTimer);
                window.bannerRecoveryTimer = setInterval(updateRecoveryBanner, 500);
                updateRecoveryBanner();
            } else {
                workoutBanner.style.display = 'none';
                document.body.style.paddingBottom = '100px'; // Ripristina il padding di default per la sola navbar
            }
        } else if (workoutBanner) {
            workoutBanner.style.display = 'none';
            document.body.style.paddingBottom = '100px'; // Ripristina il padding di default per la sola navbar
        }
    }
};