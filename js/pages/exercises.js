window.setupEserciziPage = function() {
    console.log("Setup Esercizi Page (Nuova Struttura)");
    const form = document.querySelector('#form-crea-esercizio');
    const listaEserciziDiv = document.querySelector('#lista-esercizi');
    const filterSelect = document.querySelector('#filter-gruppo');
    const editModal = document.querySelector('#edit-exercise-modal');
    const editForm = document.querySelector('#form-modifica-esercizio');

    renderEsercizi();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const nome = document.querySelector('#nome-esercizio').value.trim();
        const gruppo = document.querySelector('#gruppo-muscolare').value;
        if (nome) {
            let esercizi = getFromLocalStorage('elencoEsercizi') || [];
            esercizi.push({ id: Date.now().toString(), nome, gruppo });
            saveToLocalStorage('elencoEsercizi', esercizi);
            document.querySelector('#nome-esercizio').value = '';
            renderEsercizi();
        }
    });

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
            const div = document.createElement('div');
            div.className = 'list-item-container';
            div.innerHTML = `<div class="title-link" style="cursor: pointer;"><h3>${ex.nome} <small style="color: var(--text-dim); font-size: 0.8em;">(${ex.gruppo})</small></h3></div><button data-id="${ex.id}" class="btn-elimina-esercizio" style="background:none; border:none; padding:0; cursor:pointer; color: var(--danger);"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" style="width:24px; height:24px; pointer-events: none;"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg></button>`;
            div.querySelector('.title-link').addEventListener('click', () => {
                document.querySelector('#edit-esercizio-id').value = ex.id;
                document.querySelector('#edit-nome-esercizio').value = ex.nome;
                document.querySelector('#edit-gruppo-muscolare').value = ex.gruppo;
                editModal.style.display = 'flex';
            });
            div.querySelector('.btn-elimina-esercizio').addEventListener('click', (e) => {
                if (confirm("Eliminare esercizio?")) {
                    let all = getFromLocalStorage('elencoEsercizi');
                    saveToLocalStorage('elencoEsercizi', all.filter(x => x.id !== ex.id));
                    renderEsercizi();
                }
            });
            listaEserciziDiv.appendChild(div);
        });
    }
};