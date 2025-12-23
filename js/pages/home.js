window.setupHomePage = function() {
    console.log("Setup Home Page (Nuova Struttura)");
    const activePlanNameEl = document.querySelector('#active-plan-name');
    const routineListHomeEl = document.querySelector('#routine-list-home');
    
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
                window.location.href = `allenamento.html?pianoId=${pianoId}&routineId=${routineId}`;
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
            routineListHomeEl.innerHTML = '';
            if (activePiano.routine.length > 0) {
                const storico = getFromLocalStorage('storicoAllenamenti') || [];

                activePiano.routine.forEach(r => {
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
                routineListHomeEl.innerHTML = '<p>Questo piano non ha ancora nessuna routine.</p>';
            }
        } else {
            activePlanNameEl.textContent = 'Nessun piano attivo';
            routineListHomeEl.innerHTML = '<p>Seleziona un piano di allenamento.</p>';
        }

        // Drag and Drop Logic
        let draggedItem = null;
        routineListHomeEl.addEventListener('mousedown', startDrag);
        routineListHomeEl.addEventListener('touchstart', startDrag, { passive: false });

        function startDrag(e) {
            const handle = e.target.closest('.drag-handle');
            if (!handle) return;
            e.preventDefault();
            draggedItem = e.target.closest('.list-item-container');
            if (!draggedItem) return;
            setTimeout(() => draggedItem.classList.add('dragging'), 0);
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('touchmove', onDrag, { passive: false });
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
        }

        function onDrag(e) {
            if (!draggedItem) return;
            e.preventDefault();
            const y = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
            const afterElement = getDragAfterElement(routineListHomeEl, y);
            if (afterElement == null) routineListHomeEl.appendChild(draggedItem);
            else routineListHomeEl.insertBefore(draggedItem, afterElement);
        }

        function endDrag() {
            if (!draggedItem) return;
            draggedItem.classList.remove('dragging');
            const newRoutineOrderIds = Array.from(routineListHomeEl.querySelectorAll('.list-item-container')).map(el => el.dataset.routineId);
            const piani = getFromLocalStorage('pianiDiAllenamento') || [];
            const pianoDaAggiornare = piani.find(p => p.id === activePianoId);
            if (pianoDaAggiornare) {
                pianoDaAggiornare.routine.sort((a, b) => newRoutineOrderIds.indexOf(a.id) - newRoutineOrderIds.indexOf(b.id));
                saveToLocalStorage('pianiDiAllenamento', piani);
            }
            draggedItem = null;
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
                if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
                else return closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;
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
                // Ora che il banner è visibile, ne calcoliamo l'altezza
                const bannerHeight = workoutBanner.offsetHeight;
                const navHeight = document.querySelector('.bottom-nav')?.offsetHeight || 90; // 90 è un fallback sicuro
                // Impostiamo il padding del body per evitare che l'ultimo elemento della lista sia nascosto
                document.body.style.paddingBottom = `${bannerHeight + navHeight}px`;
                workoutBanner.querySelector('.routine-title').textContent = routine.nome;
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
                            const remainingSeconds = Math.round(remainingMs / 1000);
                            const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
                            const seconds = String(remainingSeconds % 60).padStart(2, '0');
                            recoveryDisplay.textContent = `${minutes}:${seconds}`;                        
                            recoveryContainer.classList.remove('timer-finished');
                            workoutBanner.classList.remove('timer-finished');
                        } else {
                            recoveryDisplay.textContent = '00:00';
                            recoveryContainer.classList.add('timer-finished');
                            workoutBanner.classList.add('timer-finished');
                            if (!getFromLocalStorage('recoverySoundPlayed')) {
                                playNotificationSound();
                                saveToLocalStorage('recoverySoundPlayed', true);
                            }
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

    routineListHomeEl.addEventListener('click', (e) => {
        const link = e.target.closest('a.title-link');
        if (!link) return;
        if (getFromLocalStorage('activeWorkout')) e.preventDefault();
    });
};