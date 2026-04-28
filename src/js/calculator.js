/**
 * Calcolatore Canone Concordato - Core Logic
 * Gestisce l'inizializzazione dell'interfaccia e la logica di calcolo del canone.
 */

// Inizializza le icone Lucide
lucide.createIcons();

// Popola la select delle microzone nel DOM
function populateMicrozones() {
    const mzSelect = document.getElementById('mzId');
    if (!mzSelect) return;
    
    microzone.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.id} - ${m.nome} (Min: ${m.min.toFixed(3)} - Max: ${m.max.toFixed(3)})`;
        // Default: Centro Storico (ID 25)
        if (m.id === 25) opt.selected = true;
        mzSelect.appendChild(opt);
    });
}

/**
 * Funzione principale di calcolo
 * Legge gli input dal DOM e aggiorna i risultati in tempo reale.
 */
function calculate() {
    // --- 1. Recupero Valori Input ---
    const mzId = Number(document.getElementById('mzId').value);
    const ubicazione = Number(document.getElementById('ubicazione').value);

    // Superfici (con fallback a 0 se l'input è vuoto)
    const areaPrincipale = Number(document.getElementById('areaPrincipale').value) || 0;
    const accCom = Number(document.getElementById('accCom').value) || 0;
    const accNon = Number(document.getElementById('accNon').value) || 0;
    const balCom = Number(document.getElementById('balCom').value) || 0;
    const balNon = Number(document.getElementById('balNon').value) || 0;
    const giardino = Number(document.getElementById('giardino').value) || 0;

    // Caratteristiche (Allegato B)
    const catA = Number(document.getElementById('catA').value);
    const catB = Number(document.getElementById('catB').value);
    const catC = Number(document.getElementById('catC').value);
    const catD = Number(document.getElementById('catD').value);
    const catE_asc = document.getElementById('catE_asc').checked;
    const catE_blind = document.getElementById('catE_blind').checked;
    const catE_risc = document.getElementById('catE_risc').checked;
    const catF = Number(document.getElementById('catF').value);
    const catG = Number(document.getElementById('catG').value);

    // Maggiorazioni finali
    const catH = Number(document.getElementById('catH').value);
    const art5 = Number(document.getElementById('art5').value);

    // Tipo di contratto e opzioni extra
    const art6bisSelect = document.getElementById('art6bis');
    const art6bis = Number(art6bisSelect.value);
    const contractType = art6bisSelect.options[art6bisSelect.selectedIndex].getAttribute('data-type');

    const derogaCheckbox = document.getElementById('derogaTransitorio');
    const numStanze = Math.max(1, Number(document.getElementById('numStanze').value) || 1);

    // --- 2. Gestione Interfaccia Dinamica ---
    const derogaContainer = document.getElementById('derogaTransitorioContainer');
    const istatAlert = document.getElementById('alert-istat');

    if (contractType === 'transitorio') {
        derogaContainer.classList.remove('hidden');
        istatAlert.classList.add('hidden');
    } else if (contractType === '3+2') {
        derogaContainer.classList.add('hidden');
        derogaCheckbox.checked = false; // Reset deroga se si cambia tipo contratto
        istatAlert.classList.remove('hidden');
    } else {
        derogaContainer.classList.add('hidden');
        derogaCheckbox.checked = false;
        istatAlert.classList.add('hidden');
    }

    // --- 3. Calcolo Superficie Convenzionale (Allegato C) ---
    // Calcolo coefficienti per pertinenze
    let b_com = accCom * 0.50;
    let b_non = accNon * 0.25;

    // Balconi: 30% fino a 25mq, 10% eccedenza
    let c_com_val = Math.min(balCom, 25) * 0.30 + Math.max(0, balCom - 25) * 0.10;
    // Balconi non com: 15% fino a 25mq, 5% eccedenza
    let c_non_val = Math.min(balNon, 25) * 0.15 + Math.max(0, balNon - 25) * 0.05;

    // Giardino: 10% fino alla superficie principale, 2% eccedenza
    let d_giar_val = Math.min(giardino, areaPrincipale) * 0.10 + Math.max(0, giardino - areaPrincipale) * 0.02;

    let pertinenzeTotali = b_com + b_non + c_com_val + c_non_val + d_giar_val;

    // Limite invalicabile: le pertinenze non possono superare il 50% della sup. principale
    let pertinenzeAmmesse = Math.min(pertinenzeTotali, areaPrincipale / 2);

    let mqIniziale = areaPrincipale + pertinenzeAmmesse;

    // Calcolo area base
    let mqBase = mqIniziale;
    let isBonusPiccoli = false;

    // Bonus per piccoli immobili (< 50mq convenzionali)
    if (mqBase > 0 && mqBase < 50) {
        isBonusPiccoli = true;
        mqBase = mqBase * 1.20;
    }

    // Coefficiente ubicazione (Centro/Semi-periferia/Periferia)
    let mqFinali = mqBase * ubicazione;

    // --- 4. Calcolo Valore Unitario (€/mq) ---
    const mz = microzone.find(m => m.id === mzId);
    let currentMin = mz.min;
    let currentMax = mz.max;

    // Deroga transitori (-20% sui valori di zona)
    if (derogaCheckbox.checked) {
        currentMin *= 0.80;
        currentMax *= 0.80;
    }

    const diffMz = currentMax - currentMin;

    // Somma incrementi caratteristiche (Allegato B)
    let e_tot = (catE_asc ? 0.10 : 0) + (catE_blind ? 0.10 : 0) + (catE_risc ? 0.10 : 0);
    let percAG = catA + catB + catC + catD + e_tot + catF + catG;

    // Interpolazione valore basata sulle caratteristiche
    let valSqm = currentMin + (diffMz * percAG);

    // Incremento per rendita catastale (Art 5 Bis)
    valSqm = valSqm * (1 + catH);

    let isMax = false;
    // Controllo tetto massimo (non può superare il max della microzona)
    if (valSqm >= currentMax) {
        valSqm = currentMax;
        isMax = true;
    }

    // Penalità assenza riscaldamento se al tetto massimo (Art 5)
    let penalita = false;
    if (!catE_risc && isMax) {
        valSqm = valSqm * 0.95;
        penalita = true;
    }

    // Canone prima delle maggiorazioni contrattuali
    let canoneIniziale = valSqm * mqFinali;

    // --- 5. Maggiorazioni Finali (Art. 5, 6 Bis) ---
    let maggiorazioniTot = art5 + art6bis;
    let canoneDefinitivo = canoneIniziale * (1 + maggiorazioniTot);

    // Calcolo forbice di tolleranza (+/- 10%) e quota stanza
    const tolleranzaMin = canoneDefinitivo * 0.90;
    const tolleranzaMax = canoneDefinitivo * 1.10;
    const canoneStanza = canoneDefinitivo / numStanze;

    // --- 6. Aggiornamento Interfaccia (DOM) ---
    document.getElementById('res-mqUtiliBase').innerText = mqBase.toFixed(2) + ' mq';
    document.getElementById('res-mqUtiliFinali').innerText = mqFinali.toFixed(2) + ' mq';

    const alertBonus = document.getElementById('alert-bonusPiccoli');
    if(isBonusPiccoli) alertBonus.classList.remove('hidden'); else alertBonus.classList.add('hidden');

    document.getElementById('res-percAG').innerText = '+' + (percAG * 100).toFixed(0) + '%';
    document.getElementById('res-valoreMqCalc').innerText = '€ ' + valSqm.toFixed(3);

    const alertTetto = document.getElementById('alert-isMaxTetto');
    if(isMax) {
        alertTetto.classList.remove('hidden');
        alertTetto.classList.add('flex');
    } else {
        alertTetto.classList.add('hidden');
        alertTetto.classList.remove('flex');
    }
    document.getElementById('res-valoreMqMax').innerText = currentMax.toFixed(3);

    document.getElementById('res-canoneBase').innerText = '€ ' + canoneIniziale.toFixed(2);
    document.getElementById('res-maggiorazioniPerc').innerText = '+' + (maggiorazioniTot * 100).toFixed(0) + '%';

    const alertRisc = document.getElementById('alert-penalitaRisc');
    if(penalita) alertRisc.classList.remove('hidden'); else alertRisc.classList.add('hidden');

    // Risultati finali
    document.getElementById('res-canoneFinale').innerText = '€ ' + canoneDefinitivo.toFixed(2);
    document.getElementById('res-tolleranzaMin').innerText = '€ ' + tolleranzaMin.toFixed(2);
    document.getElementById('res-tolleranzaMax').innerText = '€ ' + tolleranzaMax.toFixed(2);

    const boxStanza = document.getElementById('box-stanza');
    if(numStanze > 1) {
        boxStanza.classList.remove('hidden');
        document.getElementById('res-canoneStanza').innerText = '€ ' + canoneStanza.toFixed(2);
    } else {
        boxStanza.classList.add('hidden');
    }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    populateMicrozones();
    
    // Aggiungi listener a tutti gli input per aggiornamento live
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('input', calculate);
        input.addEventListener('change', calculate);
    });

    // Calcolo iniziale
    calculate();
});
