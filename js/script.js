const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let grandPiano;
const statusBadge = document.getElementById('status');

if (typeof Soundfont !== 'undefined') {
    Soundfont.instrument(audioCtx, 'acoustic_grand_piano').then(function (piano) {
        grandPiano = piano;
        statusBadge.innerHTML = '<span class="status-dot"></span><span>Simulator Ready!</span>';
        statusBadge.classList.add('ready');
    }).catch(e => {
        statusBadge.innerHTML = '<span class="status-dot"></span><span>Error loading piano.</span>';
    });
}

const solfegeMap = {
    0: { num: '1', th: 'โด', en_sol: 'Do', en_notes: 'C' },
    2: { num: '2', th: 'เร', en_sol: 'Re', en_notes: 'D' },
    4: { num: '3', th: 'มี', en_sol: 'Mi', en_notes: 'E' },
    5: { num: '4', th: 'ฟา', en_sol: 'Fa', en_notes: 'F' },
    7: { num: '5', th: 'ซอล', en_sol: 'Sol', en_notes: 'G' },
    9: { num: '6', th: 'ลา', en_sol: 'La', en_notes: 'A' },
    11: { num: '7', th: 'ที', en_sol: 'Ti', en_notes: 'B' }
};

const layouts = {
    '36': [
        [['72', 'q'], ['73', '2'], ['74', 'w'], ['75', '3'], ['76', 'e'], ['77', 'r'], ['78', '5'], ['79', 't'], ['80', '6'], ['81', 'y'], ['82', '7'], ['83', 'u'], ['84', 'i']],
        [['60', 'z'], ['61', 's'], ['62', 'x'], ['63', 'd'], ['64', 'c'], ['65', 'v'], ['66', 'g'], ['67', 'b'], ['68', 'h'], ['69', 'n'], ['70', 'j'], ['71', 'm']],
        [['48', ','], ['49', 'l'], ['50', '.'], ['51', ';'], ['52', '/'], ['53', 'o'], ['54', '0'], ['55', 'p'], ['56', '-'], ['57', '['], ['58', '='], ['59', ']']]
    ],
    '21': [
        [['72', 'q'], ['74', 'w'], ['76', 'e'], ['77', 'r'], ['79', 't'], ['81', 'y'], ['83', 'u'], ['84', 'i']],
        [['60', 'z'], ['62', 'x'], ['64', 'c'], ['65', 'v'], ['67', 'b'], ['69', 'n'], ['71', 'm']],
        [['48', ','], ['50', '.'], ['52', '/'], ['53', 'o'], ['55', 'p'], ['57', '['], ['59', ']']]
    ],
    '15': [
        [['60', 'y'], ['62', 'u'], ['64', 'i'], ['65', 'o'], ['67', 'p']],
        [['69', 'h'], ['71', 'j'], ['72', 'k'], ['74', 'l'], ['76', ';']],
        [['77', 'n'], ['79', 'm'], ['81', ','], ['83', '.'], ['84', '/']]
    ]
};

const container = document.getElementById('keyboard');
let keyElements = {};

function buildKeyboard() {
    const layoutKey = document.getElementById('layoutSwitcher').value;
    const currentLang = document.getElementById('langSwitcher').value;

    container.innerHTML = '';
    keyElements = {};
    const rows = layouts[layoutKey];

    rows.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        row.forEach(([midiStr, char], keyIndex) => {
            const midi = parseInt(midiStr);
            const noteInOctave = midi % 12;
            const isBlackKey = [1, 3, 6, 8, 10].includes(noteInOctave);

            const keyDiv = document.createElement('div');
            keyDiv.className = `key ${isBlackKey ? 'black' : 'white'}`;
            keyDiv.style.animationDelay = `${(rowIndex * 0.05) + (keyIndex * 0.02)}s`;

            if (!isBlackKey) {
                const solData = solfegeMap[noteInOctave];
                const labelText = solData[currentLang];

                let displayNum = solData.num;
                if (midi < 60) displayNum = solData.num + '<span class="octave-dot dot-below">•</span>';
                else if (midi >= 72 && midi < 84) displayNum = '<span class="octave-dot dot-above">•</span>' + solData.num;
                else if (midi === 84) displayNum = '<span class="octave-dot dot-above dot-double">•<br>•</span>' + solData.num;

                keyDiv.innerHTML = `
                    <div class="key-num" style="position:relative">${displayNum}</div>
                    <div class="key-label">${labelText}</div>
                    <div class="key-letter-tab">${char.toUpperCase()}</div>
                `;
            } else {
                keyDiv.innerHTML = `<div class="key-letter-tab">${char.toUpperCase()}</div>`;
            }

            // Click/touch support
            keyDiv.addEventListener('mousedown', (e) => {
                e.preventDefault();
                keyDiv.classList.add('active');
                if (audioCtx.state === 'suspended') audioCtx.resume();
                playNote(midi);
            });
            keyDiv.addEventListener('mouseup', () => keyDiv.classList.remove('active'));
            keyDiv.addEventListener('mouseleave', () => keyDiv.classList.remove('active'));
            keyDiv.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keyDiv.classList.add('active');
                if (audioCtx.state === 'suspended') audioCtx.resume();
                playNote(midi);
            }, { passive: false });
            keyDiv.addEventListener('touchend', () => keyDiv.classList.remove('active'));

            rowDiv.appendChild(keyDiv);
            keyElements[char] = { element: keyDiv, midi: midi };
        });
        container.appendChild(rowDiv);
    });
}

buildKeyboard();

document.getElementById('layoutSwitcher').addEventListener('change', buildKeyboard);
document.getElementById('langSwitcher').addEventListener('change', buildKeyboard);

document.getElementById('themeSwitcher').addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.target.value);
});

function playNote(midiNote) {
    if (grandPiano) grandPiano.play(midiNote, audioCtx.currentTime, { duration: 2.5, gain: 2.0 });
}

window.addEventListener('keydown', (e) => {
    const keyData = keyElements[e.key.toLowerCase()];
    if (keyData && !e.repeat) {
        keyData.element.classList.add('active');
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playNote(keyData.midi);
    }
});

window.addEventListener('keyup', (e) => {
    const keyData = keyElements[e.key.toLowerCase()];
    if (keyData) keyData.element.classList.remove('active');
});