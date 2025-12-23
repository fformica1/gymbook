window.setupPianiPage = function() {
    console.log("Setup Piani Page (Nuova Struttura)");
    const formCreaPiano = document.querySelector('#piani-form-crea-piano');
    const listaPiani = document.querySelector('#lista-piani-esistenti');

    renderPiani();

    if (formCreaPiano) {
        formCreaPiano.addEventListener('submit', (event) => {
            event.preventDefault();
            const nomePianoInput = formCreaPiano.querySelector('#nome-piano');
            const nomePiano = nomePianoInput.value.trim();

            if (nomePiano) {
                let piani = getFromLocalStorage('pianiDiAllenamento') || [];
                const nuovoPiano = { id: Date.now().toString(), nome: nomePiano, routine: [] };
                piani.push(nuovoPiano);
                saveToLocalStorage('pianiDiAllenamento', piani);
                nomePianoInput.value = '';
                renderPiani();
            } else {
                alert("Inserisci un nome per il piano di allenamento.");
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
            pianoDiv.innerHTML = `<div style="display: flex; align-items: center; gap: 15px; flex-grow: 1; min-width: 0;"><input type="checkbox" class="plan-selector" data-id="${piano.id}" ${isSelected ? 'checked' : ''} style="transform: scale(1.3);"><a href="routine.html?pianoId=${piano.id}" class="title-link"><h3>${piano.nome}</h3></a></div>`;
            listaPiani.appendChild(pianoDiv);
        });

        listaPiani.querySelectorAll('.plan-selector').forEach(checkbox => {
            checkbox.addEventListener('change', (event) => {
                if (event.target.checked) saveToLocalStorage('activePianoId', event.target.dataset.id);
                else if (getFromLocalStorage('activePianoId') === event.target.dataset.id) localStorage.removeItem('activePianoId');
                renderPiani();
            });
        });
    }
};