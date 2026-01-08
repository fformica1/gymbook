window.setupRoutinePage = function() {
    const params = new URLSearchParams(window.location.search);
    const pianoId = params.get('pianoId');
    const routineId = params.get('routineId');

    if (window.location.pathname.includes('routine-dettaglio.html')) {
        setupRoutineDettaglio(pianoId, routineId);
    } else {
        setupRoutineList(pianoId);
    }
};

function setupRoutineList(pianoId) {
    console.log("Setup Routine List Page");
    if (!pianoId) return;

    const listaRoutine = document.querySelector('#lista-routine-esistenti');
    const titoloPagina = document.querySelector('#nome-piano-titolo');
    
    // Modal elements
    const modal = document.getElementById('create-routine-modal');
    const btnOpenModal = document.getElementById('btn-open-create-routine-modal');
    const spanClose = modal ? modal.querySelector('.close-modal') : null;
    const formCreaRoutine = document.getElementById('routine-form-crea-modal');

    renderRoutines();
    initRoutineDragAndDrop();

    // Modal Logic
    if (btnOpenModal && modal) {
        btnOpenModal.addEventListener('click', () => {
            modal.style.display = "flex";
            const input = modal.querySelector('input');
            if(input) input.focus();
        });
    }

    if (spanClose && modal) {
        spanClose.addEventListener('click', () => {
            modal.style.display = "none";
        });
    }

    if (modal) {
        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });
    }

    if (formCreaRoutine) {
        formCreaRoutine.addEventListener('submit', (event) => {
            event.preventDefault();
            const nomeRoutineInput = document.getElementById('nome-routine-modal');
            const nomeRoutine = nomeRoutineInput.value.trim();

            if (nomeRoutine) {
                let piani = getFromLocalStorage('pianiDiAllenamento') || [];
                const pianoCorrente = piani.find(p => p.id === pianoId);
                if (pianoCorrente) {
                    pianoCorrente.routine.push({ id: Date.now().toString(), nome: nomeRoutine, esercizi: [] });
                    saveToLocalStorage('pianiDiAllenamento', piani);
                    nomeRoutineInput.value = '';
                    if (modal) modal.style.display = "none";
                    renderRoutines();
                }
            }
        });
    }

    function renderRoutines() {
        let piani = getFromLocalStorage('pianiDiAllenamento') || [];
        const piano = piani.find(p => p.id === pianoId);
        if (!piano) return;

        titoloPagina.innerHTML = piano.nome;
        animateTitleIfLong(titoloPagina);

        listaRoutine.innerHTML = '';
        if (piano.routine.length === 0) { listaRoutine.innerHTML = '<p>Nessuna routine creata.</p>'; return; }
        piano.routine.forEach(r => {
            const routineDiv = document.createElement('div');
            routineDiv.className = 'list-item-container';
            routineDiv.dataset.id = r.id;

            const exerciseNames = r.esercizi && r.esercizi.length > 0
                ? r.esercizi.map(e => e.nome).join(', ')
                : 'Nessun esercizio';

            routineDiv.innerHTML = `
                <span class="drag-handle"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg></span>
                <a href="routine-dettaglio.html?pianoId=${pianoId}&routineId=${r.id}" class="title-link">
                    <h3>${r.nome}</h3>
                    <span class="routine-list-preview">${exerciseNames}</span>
                </a>
                <div style="display: flex; align-items: center;">
                    <button class="btn-edit-routine" data-id="${r.id}" style="background:none; border:none; padding:5px; cursor:pointer; color: var(--accent);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px; height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg></button>
                    <button class="btn-delete-routine" data-id="${r.id}" style="background:none; border:none; padding:5px; cursor:pointer; color: var(--danger);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:20px; height:20px;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                </div>`;
            listaRoutine.appendChild(routineDiv);
            animateTitleIfLong(routineDiv.querySelector('h3'));
        });

        listaRoutine.querySelectorAll('.btn-edit-routine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const r = piano.routine.find(rt => rt.id === id);
                if (r) {
                    showPromptModal("Modifica Routine", "Modifica nome routine:", r.nome, (newName) => {
                        if (newName && newName.trim()) { r.nome = newName.trim(); saveToLocalStorage('pianiDiAllenamento', piani); renderRoutines(); }
                    });
                }
            });
        });

        listaRoutine.querySelectorAll('.btn-delete-routine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const activeWorkout = getFromLocalStorage('activeWorkout');
                if (activeWorkout && activeWorkout.pianoId === pianoId && activeWorkout.routineId === id) {
                    // Mostra modale informativo senza azione di conferma
                    const modal = document.getElementById('confirmation-modal');
                    if (modal) {
                        modal.querySelector('#confirm-title').textContent = "Impossibile Eliminare";
                        modal.querySelector('#confirm-message').textContent = "Impossibile eliminare la routine mentre è in corso un allenamento basato su di essa.";
                        modal.querySelector('#btn-confirm-ok').style.display = 'none'; // Nascondi tasto conferma
                        modal.querySelector('#btn-confirm-cancel').textContent = "Chiudi";
                        modal.style.display = 'flex';
                        modal.querySelector('#btn-confirm-cancel').onclick = () => { modal.style.display = 'none'; };
                    }
                    return;
                }
                showConfirmModal("Elimina Routine", "Sei sicuro di voler eliminare questa routine?", () => {
                    piano.routine = piano.routine.filter(r => r.id !== id);
                    saveToLocalStorage('pianiDiAllenamento', piani);
                    renderRoutines();
                });
            });
        });
    }

    function initRoutineDragAndDrop() {
        const list = listaRoutine;
        let draggingItem = null;
        let placeholder = null;
        let isDragging = false;
        let currentClientY = 0;
        let dragOffsetY = 0;
        const scrollThreshold = 100;
        const maxScrollSpeed = 20;

        const updateOrder = (clientY) => {
            if (!placeholder) return;
            const siblings = [...list.querySelectorAll('.list-item-container:not(.dragging)')];
            const nextSibling = siblings.find(sibling => {
                const box = sibling.getBoundingClientRect();
                return clientY <= box.top + box.height / 2;
            });
            list.insertBefore(placeholder, nextSibling || null);
        };

        const autoScroll = () => {
            if (!isDragging) return;
            const viewportHeight = window.innerHeight;
            let scrollAmount = 0;
            if (currentClientY < scrollThreshold) {
                scrollAmount = -maxScrollSpeed * ((scrollThreshold - currentClientY) / scrollThreshold);
            } else if (currentClientY > viewportHeight - scrollThreshold) {
                scrollAmount = maxScrollSpeed * ((currentClientY - (viewportHeight - scrollThreshold)) / scrollThreshold);
            }
            if (scrollAmount !== 0) {
                document.body.scrollBy(0, scrollAmount);
                if (draggingItem) draggingItem.style.top = `${currentClientY - dragOffsetY}px`;
                updateOrder(currentClientY);
            }
            requestAnimationFrame(autoScroll);
        };

        const cleanup = () => {
            isDragging = false;
            if (draggingItem) {
                draggingItem.classList.remove('dragging');
                draggingItem.style.position = '';
                draggingItem.style.top = '';
                draggingItem.style.left = '';
                draggingItem.style.width = '';
                draggingItem.style.zIndex = '';
                draggingItem.style.boxSizing = '';
                draggingItem = null;
            }
            if (placeholder && placeholder.parentNode) placeholder.remove();
            placeholder = null;
            list.style.minHeight = '';
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
            document.removeEventListener('touchcancel', handleEnd);
        };

        const handleStart = (e) => {
            if (isDragging) return;
            const handle = e.target.closest('.drag-handle');
            if (!handle) return;
            if (e.type === 'touchstart' && e.cancelable) e.preventDefault();
            const card = handle.closest('.list-item-container');
            if (!card) return;

            try {
                draggingItem = card;
                isDragging = true;
                list.style.minHeight = `${list.offsetHeight}px`;
                const startRect = card.getBoundingClientRect();
                const touch = e.touches ? e.touches[0] : e;
                const touchY = touch.clientY;
                dragOffsetY = touchY - startRect.top;
                const rect = card.getBoundingClientRect();
                placeholder = document.createElement('div');
                placeholder.className = 'sortable-placeholder';
                placeholder.style.height = `${rect.height}px`;
                placeholder.style.marginBottom = window.getComputedStyle(card).marginBottom;
                card.parentNode.insertBefore(placeholder, card);
                card.style.position = 'fixed';
                card.style.top = `${touchY - dragOffsetY}px`;
                card.style.left = `${rect.left}px`;
                card.style.width = `${rect.width}px`;
                card.style.boxSizing = 'border-box';
                card.style.zIndex = '9999';
                card.classList.add('dragging');
                document.body.scrollTop = 0;
                currentClientY = touchY;
                requestAnimationFrame(autoScroll);
                document.addEventListener('mousemove', handleMove);
                document.addEventListener('touchmove', handleMove, { passive: false });
                document.addEventListener('mouseup', handleEnd);
                document.addEventListener('touchend', handleEnd);
                document.addEventListener('touchcancel', handleEnd);
            } catch (err) {
                console.error("Errore avvio drag:", err);
                cleanup();
            }
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            currentClientY = clientY;
            if (draggingItem) draggingItem.style.top = `${clientY - dragOffsetY}px`;
            updateOrder(clientY);
        };

        const handleEnd = () => {
            if (!isDragging) return;
            if (draggingItem && placeholder && placeholder.parentNode) {
                placeholder.parentNode.insertBefore(draggingItem, placeholder);
            }
            const newOrderIds = [...list.querySelectorAll('.list-item-container')].map(c => c.dataset.id);
            let piani = getFromLocalStorage('pianiDiAllenamento');
            const piano = piani.find(p => p.id === pianoId);
            const newRoutines = [];
            newOrderIds.forEach(id => {
                const r = piano.routine.find(rt => rt.id === id);
                if (r) newRoutines.push(r);
            });
            if (newRoutines.length === piano.routine.length) {
                piano.routine = newRoutines;
                saveToLocalStorage('pianiDiAllenamento', piani);
            }
            cleanup();
        };

        list.addEventListener('mousedown', handleStart);
        list.addEventListener('touchstart', handleStart, { passive: false });
    }
}

function setupRoutineDettaglio(pianoId, routineId) {
    console.log("Setup Dettaglio Routine with integrated exercise selection v3");
    if (!pianoId || !routineId) return;

    // State management
    const routineDetailsView = document.querySelector('#routine-details-view');
    
    // Configura il tasto indietro per puntare sempre alla lista routine del piano corrente
    const btnBack = document.querySelector('#btn-back');
    if (btnBack) {
        if (new URLSearchParams(window.location.search).get('from') === 'home') {
            btnBack.href = 'index.html';
        } else {
            btnBack.href = `routine.html?pianoId=${pianoId}`;
        }
    }

    // --- Initial UI setup ---
    document.body.classList.add('page-routine-dettaglio');
    const listaEserciziRoutineDiv = document.querySelector('#lista-esercizi-routine');

    // --- Sposta il tasto "Aggiungi Esercizio" in fondo alla lista ---
    const existingBtn = document.getElementById('btn-open-exercise-modal');
    if (existingBtn) {
        const container = existingBtn.closest('.add-exercise-container');
        if (container) container.remove();
        else existingBtn.remove();
    }

    let actionsContainer = document.getElementById('routine-footer-actions');
    if (!actionsContainer) {
        actionsContainer = document.createElement('div');
        actionsContainer.id = 'routine-footer-actions';
        listaEserciziRoutineDiv.parentNode.insertBefore(actionsContainer, listaEserciziRoutineDiv.nextSibling);
    }
    actionsContainer.innerHTML = `
        <div class="add-exercise-container">
            <button id="btn-open-exercise-modal" class="btn-primary">Aggiungi Esercizi</button>
        </div>`;

    aggiornaTitolo();
    renderEserciziRoutine();
    initDragAndDrop();

    // --- Main View Event Listener ---
    routineDetailsView.addEventListener('click', (e) => {
        if (e.target.closest('#btn-open-exercise-modal')) {
            // Reindirizza alla pagina esercizi in modalità selezione
            window.location.href = `esercizi.html?mode=selection&pianoId=${pianoId}&routineId=${routineId}`;
        }
    });

    // --- Routine Details View Logic (existing functions) ---
    listaEserciziRoutineDiv.addEventListener('click', (e) => {
        const btnAddSet = e.target.closest('.btn-add-set');
        const btnRemoveSet = e.target.closest('.btn-remove-set');
        const btnWeightAdjust = e.target.closest('.btn-weight-adjust');
        const btnRepsAdjust = e.target.closest('.btn-reps-adjust');
        const btnQuickAdjust = e.target.closest('.btn-quick-adjust');
        const btnElimina = e.target.closest('.btn-elimina');

        if (btnAddSet) {
            const setsContainer = btnAddSet.closest('.esercizio-card').querySelector('.sets-container');
            const lastRow = setsContainer.lastElementChild;
            const kg = lastRow ? lastRow.querySelectorAll('input')[0].value : '';
            const reps = lastRow ? lastRow.querySelectorAll('input')[1].value : '';
            const newSetHtml = `<div class="set-row"><span class="set-number">${setsContainer.children.length + 1}</span><div class="set-inputs"><div class="adjust-control"><button class="btn-weight-adjust" data-adjust="-2.5">-</button><input type="number" class="set-input weight-input" value="${kg}" inputmode="decimal" step="any"><button class="btn-weight-adjust" data-adjust="2.5">+</button></div><div class="adjust-control"><button class="btn-reps-adjust" data-adjust="-1">-</button><input type="number" class="set-input reps-input" value="${reps}" inputmode="numeric"><button class="btn-reps-adjust" data-adjust="1">+</button></div></div></div>`;
            setsContainer.insertAdjacentHTML('beforeend', newSetHtml);
            saveRoutineState();
            return; 
        }
        
        if (btnRemoveSet) {
            const setsContainer = btnRemoveSet.closest('.esercizio-card').querySelector('.sets-container');
            if (setsContainer.children.length > 0) {
                setsContainer.lastElementChild.remove();
                saveRoutineState();
            }
            return;
        }
        
        if (btnWeightAdjust || btnRepsAdjust) {
            const btn = btnWeightAdjust || btnRepsAdjust;
            const input = btn.closest('.adjust-control').querySelector('.set-input');
            const adjustVal = parseFloat(btn.dataset.adjust);
            const currentVal = parseFloat(input.value) || 0;
            input.value = Math.max(0, currentVal + adjustVal);
            saveRoutineState();
            return;
        }

        if (btnQuickAdjust) {
            const card = btnQuickAdjust.closest('.esercizio-card');
            const type = btnQuickAdjust.dataset.type;
            const val = parseFloat(btnQuickAdjust.dataset.val);
            
            const lastRow = card.querySelector('.set-row:last-child');
            if (lastRow) {
                const inputIndex = type === 'kg' ? 0 : 1;
                const input = lastRow.querySelectorAll('.set-input')[inputIndex];
                const current = parseFloat(input.value) || 0;
                input.value = Math.max(0, current + val);
            }
            saveRoutineState();
            return;
        }

        if (btnElimina) {
             showConfirmModal("Rimuovi Esercizio", "Rimuovere questo esercizio dalla routine?", () => {
                let piani = getFromLocalStorage('pianiDiAllenamento');
                const r = piani.find(p => p.id === pianoId).routine.find(r => r.id === routineId);
                r.esercizi = r.esercizi.filter(ex => ex.id !== btnElimina.dataset.id);
                saveToLocalStorage('pianiDiAllenamento', piani);
                renderEserciziRoutine();
            });
            return;
        }
    });

    listaEserciziRoutineDiv.addEventListener('input', (e) => {
        if (e.target.tagName === 'TEXTAREA') {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        }
        if (e.target.classList.contains('set-input') || e.target.classList.contains('recovery-input') || e.target.tagName === 'TEXTAREA') saveRoutineState();
    });

    listaEserciziRoutineDiv.addEventListener('focusin', (e) => {
        if (e.target.classList.contains('set-input') || e.target.classList.contains('recovery-input')) {
            e.target.dataset.originalValue = e.target.value;
            e.target.value = '';
        }
    });

    listaEserciziRoutineDiv.addEventListener('focusout', (e) => {
        if ((e.target.classList.contains('set-input') || e.target.classList.contains('recovery-input')) && e.target.value === '') {
            e.target.value = e.target.dataset.originalValue || '';
            saveRoutineState();
        }
    });

    function saveRoutineState() {
        let piani = getFromLocalStorage('pianiDiAllenamento');
        const routine = piani.find(p => p.id === pianoId).routine.find(r => r.id === routineId);
        listaEserciziRoutineDiv.querySelectorAll('.esercizio-card').forEach(card => {
            const ex = routine.esercizi.find(e => e.id === card.dataset.id);
            if (ex) {
                ex.note = card.querySelector('textarea').value;
                ex.recupero = card.querySelector('.recovery-input').value;
                ex.serie = Array.from(card.querySelectorAll('.set-row')).map(row => ({ kg: row.querySelectorAll('input')[0].value, reps: row.querySelectorAll('input')[1].value }));
            }
        });
        saveToLocalStorage('pianiDiAllenamento', piani);
    }

    function renderEserciziRoutine() {
        const piani = getFromLocalStorage('pianiDiAllenamento');
        const routine = piani.find(p => p.id === pianoId).routine.find(r => r.id === routineId);

        listaEserciziRoutineDiv.innerHTML = '';
        routine.esercizi.forEach(ex => {
            const serieHtml = ex.serie.map((s, i) => `<div class="set-row"><span class="set-number">${i + 1}</span><div class="set-inputs"><div class="adjust-control"><button class="btn-weight-adjust" data-adjust="-2.5">-</button><input type="number" class="set-input weight-input" value="${s.kg}" inputmode="decimal" step="any"><button class="btn-weight-adjust" data-adjust="2.5">+</button></div><div class="adjust-control"><button class="btn-reps-adjust" data-adjust="-1">-</button><input type="number" class="set-input reps-input" value="${s.reps}" inputmode="numeric"><button class="btn-reps-adjust" data-adjust="1">+</button></div></div></div>`).join('');
            
            const quickAdjustHtml = `
                <div class="quick-adjust-row">
                    <div class="quick-adjust-start">
                        <button class="btn-remove-set btn-inline-set btn-remove-set-inline" title="Rimuovi ultima serie">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" /></svg>
                        </button>
                        <button class="btn-add-set btn-inline-set btn-add-set-inline" title="Aggiungi serie">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        </button>
                    </div>
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
                </div>`;

            const deleteBtnHtml = `<button class="btn-elimina" data-id="${ex.id}" style="background:none; border:none; padding:0; cursor:pointer; color: var(--danger);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px; pointer-events: none;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>`;

            const card = document.createElement('article');
            card.className = 'esercizio-card';
            card.dataset.id = ex.id;
            card.innerHTML = `<div class="esercizio-card-header"><div style="display: flex; align-items: center;"><span class="drag-handle"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg></span><h2>${ex.nome}</h2></div>${deleteBtnHtml}</div><div class="exercise-details"><textarea placeholder="Note" rows="1" class="auto-expand">${ex.note}</textarea></div><div class="recovery-time-display"><span>Tempo di Recupero: <input type="number" class="recovery-input" value="${ex.recupero}" inputmode="numeric"> s</span></div><div class="sets-header"><span class="set-number-header">Set</span><div class="set-inputs-header"><span>Kg</span><span>Reps</span></div></div><div class="sets-container">${serieHtml}</div>${quickAdjustHtml}`;
            listaEserciziRoutineDiv.appendChild(card);
        });
        
        listaEserciziRoutineDiv.querySelectorAll('textarea').forEach(tx => {
            tx.style.height = 'auto';
            tx.style.height = tx.scrollHeight + 'px';
        });
    }

    function aggiornaTitolo() {
        const piani = getFromLocalStorage('pianiDiAllenamento');
        const routine = piani.find(p => p.id === pianoId).routine.find(r => r.id === routineId);
        document.querySelector('#titolo-dettaglio-routine').innerHTML = routine.nome;
        animateTitleIfLong(document.querySelector('#titolo-dettaglio-routine'));
    }

    function initDragAndDrop() {
        const list = listaEserciziRoutineDiv;
        let draggingItem = null;
        let placeholder = null;
        let isDragging = false;
        let currentClientY = 0;
        let dragOffsetY = 0; // Offset per mantenere l'elemento sotto il dito nello stesso punto
        const scrollThreshold = 100; // Distanza dal bordo per attivare lo scroll
        const maxScrollSpeed = 20;   // Velocità massima di scroll

        const updateOrder = (clientY) => {
            if (!placeholder) return;
            // Sposta il placeholder, non l'elemento trascinato
            const siblings = [...list.querySelectorAll('.esercizio-card:not(.dragging)')];
            const nextSibling = siblings.find(sibling => {
                const box = sibling.getBoundingClientRect();
                return clientY <= box.top + box.height / 2;
            });
            list.insertBefore(placeholder, nextSibling || null);
        };

        const autoScroll = () => {
            if (!isDragging) return;

            const viewportHeight = window.innerHeight;
            let scrollAmount = 0;

            if (currentClientY < scrollThreshold) {
                // Scroll verso l'alto
                scrollAmount = -maxScrollSpeed * ((scrollThreshold - currentClientY) / scrollThreshold);
            } else if (currentClientY > viewportHeight - scrollThreshold) {
                // Scroll verso il basso
                scrollAmount = maxScrollSpeed * ((currentClientY - (viewportHeight - scrollThreshold)) / scrollThreshold);
            }

            if (scrollAmount !== 0) {
                document.body.scrollBy(0, scrollAmount);
                // Aggiorna la posizione dell'elemento fluttuante durante lo scroll
                if (draggingItem) {
                    draggingItem.style.top = `${currentClientY - dragOffsetY}px`;
                }
                updateOrder(currentClientY); // Aggiorna l'ordine anche mentre scorre
            }

            requestAnimationFrame(autoScroll);
        };

        const cleanup = () => {
            isDragging = false;
            
            if (draggingItem) {
                draggingItem.classList.remove('dragging');
                draggingItem.style.position = '';
                draggingItem.style.top = '';
                draggingItem.style.left = '';
                draggingItem.style.width = '';
                draggingItem.style.zIndex = '';
                draggingItem.style.boxSizing = '';
                draggingItem = null;
            }

            if (placeholder && placeholder.parentNode) {
                placeholder.remove();
            }
            placeholder = null;

            list.classList.remove('sorting-mode');
            list.style.minHeight = ''; // Rimuove il blocco altezza

            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
            document.removeEventListener('touchcancel', handleEnd);
        };

        const handleStart = (e) => {
            if (isDragging) return;

            const handle = e.target.closest('.drag-handle');
            if (!handle) return;
            
            // Previeni lo scroll nativo solo se è un evento touch cancellabile
            if (e.type === 'touchstart' && e.cancelable) e.preventDefault();

            const card = handle.closest('.esercizio-card');
            if (!card) return;

            try {
                draggingItem = card;
                isDragging = true;
                
                // Blocca l'altezza della lista per evitare salti di scroll quando le card si riducono
                list.style.minHeight = `${list.offsetHeight}px`;

                // 1. Calcola offset PRIMA di collassare
                const startRect = card.getBoundingClientRect();
                const touch = e.touches ? e.touches[0] : e;
                const touchY = touch.clientY;
                dragOffsetY = touchY - startRect.top;

                // 2. Attiva modalità compatta
                list.classList.add('sorting-mode');

                // 3. Ricalcola dimensioni sulla versione collassata
                const rect = card.getBoundingClientRect();

                placeholder = document.createElement('div');
                placeholder.className = 'sortable-placeholder';
                placeholder.style.height = `${rect.height}px`;
                placeholder.style.marginBottom = window.getComputedStyle(card).marginBottom;
                card.parentNode.insertBefore(placeholder, card);

                card.style.position = 'fixed';
                card.style.top = `${touchY - dragOffsetY}px`;
                card.style.left = `${rect.left}px`;
                card.style.width = `${rect.width}px`;
                card.style.boxSizing = 'border-box';
                card.style.zIndex = '9999';
                card.classList.add('dragging');

                // Scroll immediato in alto per mostrare la lista compattata ed evitare schermate nere
                document.body.scrollTop = 0;

                currentClientY = touchY;
                requestAnimationFrame(autoScroll);

                document.addEventListener('mousemove', handleMove);
                document.addEventListener('touchmove', handleMove, { passive: false });
                document.addEventListener('mouseup', handleEnd);
                document.addEventListener('touchend', handleEnd);
                document.addEventListener('touchcancel', handleEnd);
            } catch (err) {
                console.error("Errore avvio drag:", err);
                cleanup();
            }
        };

        const handleMove = (e) => {
            if (!isDragging) return;
            if (e.cancelable) e.preventDefault();

            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            currentClientY = clientY;
            
            // Muove l'elemento visivamente
            if (draggingItem) {
                draggingItem.style.top = `${clientY - dragOffsetY}px`;
            }
            
            updateOrder(clientY);
        };

        const handleEnd = () => {
            if (!isDragging) return;
            
            // Ripristina l'elemento al posto del placeholder
            if (draggingItem && placeholder && placeholder.parentNode) {
                placeholder.parentNode.insertBefore(draggingItem, placeholder);
            }

            // Salva il nuovo ordine
            const newOrderIds = [...list.querySelectorAll('.esercizio-card')].map(c => c.dataset.id);
            let piani = getFromLocalStorage('pianiDiAllenamento');
            const routine = piani.find(p => p.id === pianoId).routine.find(r => r.id === routineId);
            
            const newExercises = [];
            newOrderIds.forEach(id => {
                const ex = routine.esercizi.find(e => e.id === id);
                if (ex) newExercises.push(ex);
            });
            
            if (newExercises.length === routine.esercizi.length) {
                routine.esercizi = newExercises;
                saveToLocalStorage('pianiDiAllenamento', piani);
            }

            cleanup();
        };

        list.addEventListener('mousedown', handleStart);
        list.addEventListener('touchstart', handleStart, { passive: false });
    }
}