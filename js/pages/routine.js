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

    const formCreaRoutine = document.querySelector('#routine-form-crea');
    const listaRoutine = document.querySelector('#lista-routine-esistenti');
    const titoloPagina = document.querySelector('#nome-piano-titolo');

    renderRoutines();

    formCreaRoutine.addEventListener('submit', (event) => {
        event.preventDefault();
        const nomeRoutine = document.querySelector('#nome-routine').value.trim();
        if (nomeRoutine) {
            let piani = getFromLocalStorage('pianiDiAllenamento') || [];
            const pianoCorrente = piani.find(p => p.id === pianoId);
            if (pianoCorrente) {
                pianoCorrente.routine.push({ id: Date.now().toString(), nome: nomeRoutine, esercizi: [] });
                saveToLocalStorage('pianiDiAllenamento', piani);
                document.querySelector('#nome-routine').value = '';
                renderRoutines();
            }
        }
    });

    function renderRoutines() {
        let piani = getFromLocalStorage('pianiDiAllenamento') || [];
        const piano = piani.find(p => p.id === pianoId);
        if (!piano) return;

        titoloPagina.innerHTML = `${piano.nome} <span style="white-space: nowrap;"><button id="btn-edit-piano-name" style="background:none; border:none; padding:0; cursor:pointer; vertical-align: middle; margin-left: 8px; color: var(--accent);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg></button><button id="btn-delete-piano" style="background:none; border:none; padding:0; cursor:pointer; vertical-align: middle; margin-left: 8px; color: var(--danger);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button></span>`;

        document.querySelector('#btn-edit-piano-name').addEventListener('click', () => {
            const newName = prompt("Modifica nome del piano:", piano.nome);
            if (newName && newName.trim()) { piano.nome = newName.trim(); saveToLocalStorage('pianiDiAllenamento', piani); renderRoutines(); }
        });
        document.querySelector('#btn-delete-piano').addEventListener('click', () => {
            if (confirm("Eliminare piano?")) {
                piani = piani.filter(p => p.id !== pianoId);
                saveToLocalStorage('pianiDiAllenamento', piani);
                if (getFromLocalStorage('activePianoId') === pianoId) localStorage.removeItem('activePianoId');
                window.location.href = 'piani.html';
            }
        });

        listaRoutine.innerHTML = '';
        if (piano.routine.length === 0) { listaRoutine.innerHTML = '<p>Nessuna routine creata.</p>'; return; }
        piano.routine.forEach(r => {
            const routineDiv = document.createElement('div');
            routineDiv.className = 'list-item-container';
            routineDiv.innerHTML = `<a href="routine-dettaglio.html?pianoId=${pianoId}&routineId=${r.id}" class="title-link"><h3>${r.nome}</h3></a>`;
            listaRoutine.appendChild(routineDiv);
        });
    }
}

function setupRoutineDettaglio(pianoId, routineId) {
    console.log("Setup Dettaglio Routine");
    if (!pianoId || !routineId) return;

    const listaEserciziRoutineDiv = document.querySelector('#lista-esercizi-routine');
    const containerSelezione = document.querySelector('#container-selezione-esercizi');
    const modal = document.querySelector('#exercise-modal');

    aggiornaTitolo();
    renderEserciziRoutine();

    document.querySelector('#btn-open-exercise-modal').addEventListener('click', () => {
        const esercizi = getFromLocalStorage('elencoEsercizi') || [];
        containerSelezione.innerHTML = '';
        esercizi.forEach(e => {
            containerSelezione.innerHTML += `<div class="exercise-selection-item"><label style="display: flex; align-items: center; width: 100%; cursor: pointer;"><input type="checkbox" value="${e.id}"> ${e.nome} <small style="color: var(--text-dim); margin-left: 5px;">(${e.gruppo})</small></label></div>`;
        });
        modal.style.display = 'flex';
    });

    document.querySelector('.close-modal').addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    document.querySelector('#btn-confirm-add-exercises').addEventListener('click', () => {
        const checkboxes = containerSelezione.querySelectorAll('input:checked');
        if (checkboxes.length === 0) return;
        let piani = getFromLocalStorage('pianiDiAllenamento');
        const routine = piani.find(p => p.id === pianoId).routine.find(r => r.id === routineId);
        const elenco = getFromLocalStorage('elencoEsercizi');
        
        checkboxes.forEach((cb, idx) => {
            const orig = elenco.find(e => e.id === cb.value);
            routine.esercizi.push({ id: Date.now().toString() + idx, esercizioId: orig.id, nome: orig.nome, note: "", recupero: 90, serie: [{ kg: '', reps: '' }] });
        });
        saveToLocalStorage('pianiDiAllenamento', piani);
        renderEserciziRoutine();
        modal.style.display = 'none';
    });

    listaEserciziRoutineDiv.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add-set')) {
            const setsContainer = e.target.closest('.esercizio-card').querySelector('.sets-container');
            const lastRow = setsContainer.lastElementChild;
            const kg = lastRow ? lastRow.querySelectorAll('input')[0].value : '';
            const reps = lastRow ? lastRow.querySelectorAll('input')[1].value : '';
            const newSetHtml = `<div class="set-row"><span class="set-number">${setsContainer.children.length + 1}</span><div class="set-inputs"><div class="adjust-control"><button class="btn-weight-adjust" data-adjust="-2.5">-</button><input type="number" class="set-input weight-input" value="${kg}" inputmode="decimal" step="any"><button class="btn-weight-adjust" data-adjust="2.5">+</button></div><div class="adjust-control"><button class="btn-reps-adjust" data-adjust="-1">-</button><input type="number" class="set-input reps-input" value="${reps}" inputmode="numeric"><button class="btn-reps-adjust" data-adjust="1">+</button></div></div></div>`;
            setsContainer.insertAdjacentHTML('beforeend', newSetHtml);
            saveRoutineState();
        }
        if (e.target.classList.contains('btn-remove-set')) {
            const c = e.target.closest('.esercizio-card').querySelector('.sets-container');
            if (c.children.length > 0) { c.lastElementChild.remove(); saveRoutineState(); }
        }
        if (e.target.classList.contains('btn-elimina') && !e.target.classList.contains('btn-remove-set')) {
            if (confirm("Rimuovere esercizio?")) {
                let piani = getFromLocalStorage('pianiDiAllenamento');
                const r = piani.find(p => p.id === pianoId).routine.find(r => r.id === routineId);
                r.esercizi = r.esercizi.filter(ex => ex.id !== e.target.dataset.id);
                saveToLocalStorage('pianiDiAllenamento', piani);
                renderEserciziRoutine();
            }
        }
    });

    listaEserciziRoutineDiv.addEventListener('input', (e) => {
        if (e.target.classList.contains('set-input') || e.target.classList.contains('recovery-input') || e.target.tagName === 'TEXTAREA') saveRoutineState();
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
            const card = document.createElement('article');
            card.className = 'esercizio-card';
            card.dataset.id = ex.id;
            card.innerHTML = `<div class="esercizio-card-header"><div style="display: flex; align-items: center;"><span class="drag-handle"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg></span><h2>${ex.nome}</h2></div><button class="btn-elimina" data-id="${ex.id}" style="background:none; border:none; padding:0; cursor:pointer; color: var(--danger);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px; pointer-events: none;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button></div><div class="exercise-details"><textarea placeholder="Note">${ex.note}</textarea></div><div class="recovery-time-display"><span>Tempo di Recupero: <input type="number" class="recovery-input" value="${ex.recupero}" inputmode="numeric"> s</span></div><div class="sets-header"><span class="set-number-header">Set</span><div class="set-inputs-header"><span>Kg</span><span>Reps</span></div></div><div class="sets-container">${serieHtml}</div><div class="action-buttons-container"><button class="btn-remove-set btn-elimina">Rimuovi Serie</button><button class="btn-add-set btn-blu">Aggiungi Serie</button></div>`;
            listaEserciziRoutineDiv.appendChild(card);
            listaEserciziRoutineDiv.appendChild(document.createElement('hr'));
        });
        // Drag logic (omessa per brevità, identica a home.js ma su listaEserciziRoutineDiv)
    }

    function aggiornaTitolo() {
        const piani = getFromLocalStorage('pianiDiAllenamento');
        const routine = piani.find(p => p.id === pianoId).routine.find(r => r.id === routineId);
        document.querySelector('#titolo-dettaglio-routine').innerHTML = `${routine.nome} <span style="white-space: nowrap;"><button id="btn-edit-routine-name" style="background:none; border:none; padding:0; cursor:pointer; vertical-align: middle; margin-left: 8px; color: var(--accent);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg></button><button id="btn-delete-routine" style="background:none; border:none; padding:0; cursor:pointer; vertical-align: middle; margin-left: 8px; color: var(--danger);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button></span>`;
        
        document.querySelector('#btn-edit-routine-name').addEventListener('click', () => {
            const newName = prompt("Modifica nome routine:", routine.nome);
            if (newName && newName.trim()) { routine.nome = newName.trim(); saveToLocalStorage('pianiDiAllenamento', piani); aggiornaTitolo(); }
        });
        document.querySelector('#btn-delete-routine').addEventListener('click', () => {
            if (confirm("Eliminare routine?")) {
                const p = piani.find(p => p.id === pianoId);
                p.routine = p.routine.filter(r => r.id !== routineId);
                saveToLocalStorage('pianiDiAllenamento', piani);
                window.location.href = `routine.html?pianoId=${pianoId}`;
            }
        });
    }
}