window.setupPianiPage = function() {
    console.log("Setup Piani Page (Nuova Struttura)");
    const listaPiani = document.querySelector('#lista-piani-esistenti');
    
    // Modal elements
    const modal = document.getElementById('create-plan-modal');
    const btnOpenModal = document.getElementById('btn-open-create-plan-modal');
    const spanClose = modal ? modal.querySelector('.close-modal') : null;
    const formCreaPiano = document.getElementById('piani-form-crea-piano-modal');

    renderPiani();

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

    if (formCreaPiano) {
        formCreaPiano.addEventListener('submit', (event) => {
            event.preventDefault();
            const nomePianoInput = document.getElementById('nome-piano-modal');
            const nomePiano = nomePianoInput.value.trim();

            if (nomePiano) {
                let piani = getFromLocalStorage('pianiDiAllenamento') || [];
                const nuovoPiano = { id: Date.now().toString(), nome: nomePiano, routine: [] };
                piani.push(nuovoPiano);
                saveToLocalStorage('pianiDiAllenamento', piani);
                nomePianoInput.value = '';
                if (modal) modal.style.display = "none";
                renderPiani();
            } else {
                showConfirmModal("Attenzione", "Inserisci un nome per il piano di allenamento.", () => {});
            }
        });
    }

    function renderPiani() {
        const piani = getFromLocalStorage('pianiDiAllenamento') || [];
        listaPiani.innerHTML = '';

        if (piani.length === 0) {
            listaPiani.innerHTML = '<p>Nessun piano di allenamento creato. Inizia ora!</p>';
            return;
        }

        piani.forEach(piano => {
            const activePianoId = getFromLocalStorage('activePianoId');
            const isSelected = piano.id === activePianoId;
            const pianoDiv = document.createElement('div');
            pianoDiv.className = 'list-item-container';

            const routineNames = piano.routine && piano.routine.length > 0 
                ? piano.routine.map(r => r.nome).join(', ')
                : 'Nessuna routine';

            pianoDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; flex-grow: 1; min-width: 0; overflow: hidden;">
                    <input type="checkbox" class="plan-selector" data-id="${piano.id}" ${isSelected ? 'checked' : ''} style="transform: scale(1.3);">
                    <a href="routine.html?pianoId=${piano.id}" class="title-link">
                        <h3>${piano.nome}</h3>
                        <span class="routine-list-preview">${routineNames}</span>
                    </a>
                </div>
                <div style="display: flex; align-items: center;">
                    <button class="btn-edit-piano" data-id="${piano.id}" style="background:none; border:none; padding:5px; cursor:pointer; color: var(--accent);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg></button>
                    <button class="btn-delete-piano" data-id="${piano.id}" style="background:none; border:none; padding:5px; cursor:pointer; color: var(--danger);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>
                </div>`;
            listaPiani.appendChild(pianoDiv);
            animateTitleIfLong(pianoDiv.querySelector('h3'));
        });

        listaPiani.querySelectorAll('.plan-selector').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                if (event.target.checked) saveToLocalStorage('activePianoId', event.target.dataset.id);
                else if (getFromLocalStorage('activePianoId') === event.target.dataset.id) localStorage.removeItem('activePianoId');
                renderPiani();
            });
        });

        listaPiani.querySelectorAll('.btn-edit-piano').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const piani = getFromLocalStorage('pianiDiAllenamento') || [];
                const piano = piani.find(p => p.id === id);
                if (piano) {
                    showPromptModal("Modifica Piano", "Modifica nome del piano:", piano.nome, (newName) => {
                        if (newName && newName.trim()) { piano.nome = newName.trim(); saveToLocalStorage('pianiDiAllenamento', piani); renderPiani(); }
                    });
                }
            });
        });

        listaPiani.querySelectorAll('.btn-delete-piano').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;

                const activeWorkout = getFromLocalStorage('activeWorkout');
                if (activeWorkout && activeWorkout.pianoId === id) {
                    // Mostra modale informativo senza azione di conferma
                    const modal = document.getElementById('confirmation-modal');
                    if (modal) {
                        modal.querySelector('#confirm-title').textContent = "Impossibile Eliminare";
                        modal.querySelector('#confirm-message').textContent = "Impossibile eliminare il piano mentre è in corso un allenamento basato su una sua routine.";
                        modal.querySelector('#btn-confirm-ok').style.display = 'none'; // Nascondi tasto conferma
                        modal.querySelector('#btn-confirm-cancel').textContent = "Chiudi";
                        modal.style.display = 'flex';
                        modal.querySelector('#btn-confirm-cancel').onclick = () => { modal.style.display = 'none'; };
                    }
                    return;
                }

                showConfirmModal("Elimina Piano", "Sei sicuro di voler eliminare questo piano? L'azione è irreversibile.", () => {
                    let piani = getFromLocalStorage('pianiDiAllenamento') || [];
                    piani = piani.filter(p => p.id !== id);
                    saveToLocalStorage('pianiDiAllenamento', piani);
                    if (getFromLocalStorage('activePianoId') === id) localStorage.removeItem('activePianoId');
                    renderPiani();
                });
            });
        });
    }
};