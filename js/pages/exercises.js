window.setupEserciziPage = function() {
    console.log("Setup Esercizi Page (Nuova Struttura)");
    const listaEserciziDiv = document.querySelector('#lista-esercizi');
    const filterSelect = document.querySelector('#filter-gruppo');
    
    // --- Gestione Parametri URL e Stato ---
    const params = new URLSearchParams(window.location.search);
    const selectionMode = params.get('mode') === 'selection';
    const pianoId = params.get('pianoId');
    const routineId = params.get('routineId');
    const selectedExercises = new Set();

    // Modals
    const createModal = document.querySelector('#create-exercise-modal');
    const btnOpenCreate = document.querySelector('#btn-open-create-modal');
    const editModal = document.querySelector('#edit-exercise-modal');
    const editForm = document.querySelector('#form-modifica-esercizio');

    // Configurazione UI per Modalità Selezione
    if (selectionMode && pianoId && routineId) {
        // 1. Nascondi la barra di navigazione inferiore
        const bottomNav = document.querySelector('.bottom-nav');
        if (bottomNav) bottomNav.style.display = 'none';

        // 2. Cambia il tasto indietro per tornare alla routine
        const backBtn = document.querySelector('.header-icon-left');
        if (backBtn) backBtn.href = `routine-dettaglio.html?pianoId=${pianoId}&routineId=${routineId}`;

        // 3. Aggiungi Footer per la conferma (fisso in basso)
        const footer = document.createElement('div');
        footer.id = 'selection-footer';
        footer.style.cssText = "position: fixed; bottom: 0; left: 0; right: 0; padding: 20px; background: var(--card-bg); border-top: 1px solid var(--border-light); z-index: 1001; display: none; box-shadow: 0 -5px 15px rgba(0,0,0,0.2);";
        footer.innerHTML = `<button id="confirm-selection" class="btn-primary" style="width: 100%;">Aggiungi Esercizi</button>`;
        document.body.appendChild(footer);

        // 4. Logica di conferma aggiunta
        document.getElementById('confirm-selection').addEventListener('click', () => {
            let piani = getFromLocalStorage('pianiDiAllenamento');
            const routine = piani.find(p => p.id === pianoId).routine.find(r => r.id === routineId);
            const allExercises = getFromLocalStorage('elencoEsercizi') || [];
            
            selectedExercises.forEach(id => {
                const ex = allExercises.find(e => e.id === id);
                if (ex) {
                    routine.esercizi.push({
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        esercizioId: ex.id,
                        nome: ex.nome,
                        note: "",
                        recupero: 90,
                        serie: [{ kg: '', reps: '' }]
                    });
                }
            });
            saveToLocalStorage('pianiDiAllenamento', piani);
            window.location.replace(`routine-dettaglio.html?pianoId=${pianoId}&routineId=${routineId}`);
        });
    }

    renderEsercizi();

    // Gestione Creazione
    if (btnOpenCreate && createModal) {
        btnOpenCreate.addEventListener('click', () => createModal.style.display = 'flex');
        createModal.querySelector('.close-modal').addEventListener('click', () => createModal.style.display = 'none');
        
        createModal.querySelector('#form-crea-esercizio-modal').addEventListener('submit', (event) => {
            event.preventDefault();
            const nome = document.querySelector('#nome-esercizio-modal').value.trim();
            const gruppo = document.querySelector('#gruppo-muscolare-modal').value;
            if (nome) {
                let esercizi = getFromLocalStorage('elencoEsercizi') || [];
                esercizi.push({ id: Date.now().toString(), nome, gruppo });
                saveToLocalStorage('elencoEsercizi', esercizi);
                document.querySelector('#nome-esercizio-modal').value = '';
                createModal.style.display = 'none';
                renderEsercizi();
            }
        });
    }

    if (filterSelect) filterSelect.addEventListener('change', renderEsercizi);

    if (editModal) {
        editModal.querySelector('.close-modal').addEventListener('click', () => editModal.style.display = 'none');
        window.addEventListener('click', (e) => { if (e.target === editModal) editModal.style.display = 'none'; });
        editForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.querySelector('#edit-esercizio-id').value;
            const newName = document.querySelector('#edit-nome-esercizio').value.trim();
            const newGroup = document.querySelector('#edit-gruppo-muscolare').value;
            if (newName) {
                let esercizi = getFromLocalStorage('elencoEsercizi') || [];
                const idx = esercizi.findIndex(ex => ex.id === id);
                if (idx !== -1) {
                    esercizi[idx].nome = newName;
                    esercizi[idx].gruppo = newGroup;
                    saveToLocalStorage('elencoEsercizi', esercizi);

                    // --- PROPAGAZIONE MODIFICA ALLE ROUTINE ---
                    let piani = getFromLocalStorage('pianiDiAllenamento') || [];
                    let pianiModificati = false;

                    piani.forEach(piano => {
                        if (piano.routine) {
                            piano.routine.forEach(r => {
                                if (r.esercizi) {
                                    r.esercizi.forEach(exRoutine => {
                                        if (exRoutine.esercizioId === id) {
                                            exRoutine.nome = newName;
                                            pianiModificati = true;
                                        }
                                    });
                                }
                            });
                        }
                    });
                    if (pianiModificati) saveToLocalStorage('pianiDiAllenamento', piani);
                    // ------------------------------------------

                    renderEsercizi();
                    editModal.style.display = 'none';
                }
            }
        });
    }

    function renderEsercizi() {
        let esercizi = getFromLocalStorage('elencoEsercizi') || [];
        listaEserciziDiv.innerHTML = '';
        esercizi.sort((a, b) => a.nome.localeCompare(b.nome));
        if (filterSelect && filterSelect.value) esercizi = esercizi.filter(e => e.gruppo === filterSelect.value);

        if (esercizi.length === 0) { listaEserciziDiv.innerHTML = '<p>Nessun esercizio trovato.</p>'; return; }

        esercizi.forEach(ex => {
            const isChecked = selectedExercises.has(ex.id);
            const checkIcon = isChecked 
                ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px; height:24px;"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" /></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`;
            const btnColor = isChecked ? 'var(--accent)' : 'var(--text-dim)';

            const div = document.createElement('div');
            div.className = 'list-item-container';
            div.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 6px 10px;";
            div.innerHTML = `
                <label style="display: flex; align-items: center; flex-grow: 1; margin: 0; cursor: ${selectionMode ? 'pointer' : 'default'}; overflow: hidden;">
                    ${selectionMode ? `<button type="button" class="btn-select-exercise" data-id="${ex.id}" style="background:none; border:none; padding:0; margin-right: 12px; cursor:pointer; color: ${btnColor}; display: flex; align-items: center;">${checkIcon}</button>` : ''}
                    <div style="display: flex; flex-direction: column; overflow: hidden; min-width: 0; flex: 1;">
                        <span class="exercise-name">${ex.nome}</span>
                        <span class="exercise-group">${ex.gruppo}</span>
                    </div>
                </label>
                <div class="item-actions" style="display: flex; align-items: center; gap: 0px; flex-shrink: 0;">
                    <button data-id="${ex.id}" class="btn-icon btn-edit-esercizio" style="background:none; border:none; cursor:pointer; color: var(--accent); padding: 5px;">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:22px; height:22px;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                    </button>
                    <button data-id="${ex.id}" class="btn-icon btn-elimina-esercizio" style="background:none; border:none; cursor:pointer; color: var(--danger); padding: 5px;">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:22px; height:22px; pointer-events: none;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    </button>
                </div>
            `;
            
            // Gestione Checkbox (solo in selection mode)
            if (selectionMode) {
                const btnSelect = div.querySelector('.btn-select-exercise');
                // Gestisce il click sia sul pulsante che sull'intera riga (label)
                div.querySelector('label').addEventListener('click', (e) => {
                    e.preventDefault(); // Previene il comportamento di default della label
                    
                    if (selectedExercises.has(ex.id)) {
                        selectedExercises.delete(ex.id);
                        btnSelect.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>`;
                        btnSelect.style.color = 'var(--text-dim)';
                    } else {
                        selectedExercises.add(ex.id);
                        btnSelect.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:24px; height:24px;"><path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clip-rule="evenodd" /></svg>`;
                        btnSelect.style.color = 'var(--accent)';
                    }
                    
                    const footer = document.getElementById('selection-footer');
                    const btn = document.getElementById('confirm-selection');
                    footer.style.display = selectedExercises.size > 0 ? 'block' : 'none';
                    if (btn) {
                        const count = selectedExercises.size;
                        const label = count === 1 ? 'esercizio' : 'esercizi';
                        btn.textContent = `Aggiungi ${count} ${label}`;
                    }
                });
            }

            div.querySelector('.btn-edit-esercizio').addEventListener('click', () => {
                document.querySelector('#edit-esercizio-id').value = ex.id;
                document.querySelector('#edit-nome-esercizio').value = ex.nome;
                document.querySelector('#edit-gruppo-muscolare').value = ex.gruppo;
                editModal.style.display = 'flex';
            });
            div.querySelector('.btn-elimina-esercizio').addEventListener('click', (e) => {
                showConfirmModal("Elimina Esercizio", "Sei sicuro di voler eliminare questo esercizio dall'elenco globale?", () => {
                    let all = getFromLocalStorage('elencoEsercizi');
                    saveToLocalStorage('elencoEsercizi', all.filter(x => x.id !== ex.id));
                    renderEsercizi();
                });
            });
            listaEserciziDiv.appendChild(div);
            animateTitleIfLong(div.querySelector('.exercise-name'));
        });
    }
};