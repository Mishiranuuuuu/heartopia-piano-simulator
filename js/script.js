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

const SNAP_TO_WHITE = {
    0: 0,    // C  -> C
    1: 0,    // C# -> C
    2: 2,    // D  -> D
    3: 2,    // D# -> D
    4: 4,    // E  -> E
    5: 5,    // F  -> F
    6: 5,    // F# -> F
    7: 7,    // G  -> G
    8: 7,    // G# -> G
    9: 9,    // A  -> A
    10: 9,   // A# -> A
    11: 11   // B  -> B
};

const MIDI_KEY_MAPS = {
    '36': {
        48: ',', 49: 'l', 50: '.', 51: ';', 52: '/',
        53: 'o', 54: '0', 55: 'p', 56: '-', 57: '[', 58: '=', 59: ']',
        60: 'z', 61: 's', 62: 'x', 63: 'd', 64: 'c',
        65: 'v', 66: 'g', 67: 'b', 68: 'h', 69: 'n', 70: 'j', 71: 'm',
        72: 'q', 73: '2', 74: 'w', 75: '3', 76: 'e',
        77: 'r', 78: '5', 79: 't', 80: '6', 81: 'y', 82: '7', 83: 'u',
        84: 'i'
    },
    '21': {
        72: 'q', 74: 'w', 76: 'e', 77: 'r',
        79: 't', 81: 'y', 83: 'u', 84: 'i',
        60: 'z', 62: 'x', 64: 'c', 65: 'v',
        67: 'b', 69: 'n', 71: 'm',
        48: ',', 50: '.', 52: '/', 53: 'o',
        55: 'p', 57: '[', 59: ']'
    },
    '15': {
        60: 'y', 62: 'u', 64: 'i', 65: 'o', 67: 'p',
        69: 'h', 71: 'j', 72: 'k', 74: 'l', 76: ';',
        77: 'n', 79: 'm', 81: ',', 83: '.', 84: '/'
    }
};

const NOTE_RANGES = {
    '36': { min: 48, max: 84 },
    '21': { min: 48, max: 84 },
    '15': { min: 60, max: 84 }
};

function getMappedKey(note, layoutKey) {
    const range = NOTE_RANGES[layoutKey];
    const keyMap = MIDI_KEY_MAPS[layoutKey];

    while (note < range.min) note += 12;
    while (note > range.max) note -= 12;

    if (layoutKey === '36') {
        return keyMap[note] || null;
    }

    const octaveBase = Math.floor(note / 12) * 12;
    const noteInOctave = note % 12;
    const snappedNote = octaveBase + SNAP_TO_WHITE[noteInOctave];

    return keyMap[snappedNote] || null;
}


let loadedMidi = null;
let isPlaying = false;
let stopRequested = false;
let activeTimeouts = [];
let activeNotes = new Set();

const midiFileInput = document.getElementById('midiFileInput');
const midiDropZone = document.getElementById('midiDropZone');
const uploadContent = document.getElementById('uploadContent');
const uploadLoaded = document.getElementById('uploadLoaded');
const midiFileName = document.getElementById('midiFileName');
const midiClearBtn = document.getElementById('midiClearBtn');
const midiSpeed = document.getElementById('midiSpeed');
const speedValue = document.getElementById('speedValue');
const midiCountdown = document.getElementById('midiCountdown');
const midiPlayBtn = document.getElementById('midiPlayBtn');
const midiStopBtn = document.getElementById('midiStopBtn');
const midiStatus = document.getElementById('midiStatus');
const midiProgressFill = document.getElementById('midiProgressFill');
const midiStatusText = document.getElementById('midiStatusText');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = document.getElementById('countdownNumber');


midiDropZone.addEventListener('click', (e) => {
    if (e.target !== midiClearBtn && !midiClearBtn.contains(e.target)) {
        midiFileInput.click();
    }
});

midiFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleMidiFile(e.target.files[0]);
});

midiDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    midiDropZone.classList.add('drag-over');
});
midiDropZone.addEventListener('dragleave', () => {
    midiDropZone.classList.remove('drag-over');
});
midiDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    midiDropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleMidiFile(files[0]);
});

function handleMidiFile(file) {
    if (!file.name.match(/\.(mid|midi)$/i)) {
        alert('Please select a valid MIDI file (.mid or .midi)');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const midi = new Midi(e.target.result);
            loadedMidi = midi;
            midiFileName.textContent = file.name;
            uploadContent.style.display = 'none';
            uploadLoaded.style.display = 'flex';
            midiPlayBtn.disabled = false;
            console.log(`[MIDI] Loaded: ${file.name} — ${midi.tracks.length} tracks, duration: ${midi.duration.toFixed(1)}s`);
        } catch (err) {
            alert('Error parsing MIDI file: ' + err.message);
            console.error('[MIDI] Parse error:', err);
        }
    };
    reader.readAsArrayBuffer(file);
}

midiClearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    loadedMidi = null;
    midiFileInput.value = '';
    uploadContent.style.display = 'flex';
    uploadLoaded.style.display = 'none';
    midiPlayBtn.disabled = true;
    midiStatus.style.display = 'none';
});

midiSpeed.addEventListener('input', () => {
    speedValue.textContent = parseFloat(midiSpeed.value).toFixed(2) + 'x';
});

midiPlayBtn.addEventListener('click', () => {
    if (!loadedMidi || isPlaying) return;
    startMidiPlayback();
});

midiStopBtn.addEventListener('click', () => {
    emergencyStop();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPlaying) {
        emergencyStop();
    }
});

async function startMidiPlayback() {
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    isPlaying = true;
    stopRequested = false;
    activeTimeouts = [];
    activeNotes.clear();

    midiPlayBtn.style.display = 'none';
    midiStopBtn.style.display = 'inline-flex';
    midiStatus.style.display = 'flex';
    midiProgressFill.style.width = '0%';

    const countdownTime = parseInt(midiCountdown.value);
    if (countdownTime > 0) {
        await runCountdown(countdownTime);
        if (stopRequested) { resetPlayUI(); return; }
    }

    midiStatusText.textContent = `Playing at ${parseFloat(midiSpeed.value).toFixed(2)}x speed...`;

    const layoutKey = document.getElementById('layoutSwitcher').value;
    const speedMultiplier = parseFloat(midiSpeed.value);

    const events = [];
    for (const track of loadedMidi.tracks) {
        for (const note of track.notes) {
            events.push({
                type: 'noteOn',
                midi: note.midi,
                time: note.time,
                velocity: note.velocity
            });
            events.push({
                type: 'noteOff',
                midi: note.midi,
                time: note.time + note.duration
            });
        }
    }

    events.sort((a, b) => a.time - b.time || (a.type === 'noteOff' ? -1 : 1));

    if (events.length === 0) {
        midiStatusText.textContent = 'No notes found in this MIDI file.';
        setTimeout(() => resetPlayUI(), 2000);
        return;
    }

    const totalDuration = loadedMidi.duration / speedMultiplier;
    const startTime = performance.now();

    for (const event of events) {
        const delay = (event.time / speedMultiplier) * 1000;
        const timeout = setTimeout(() => {
            if (stopRequested) return;

            const mappedChar = getMappedKey(event.midi, layoutKey);
            if (!mappedChar) return;

            const keyData = keyElements[mappedChar];
            if (!keyData) return;

            if (event.type === 'noteOn') {
                keyData.element.classList.add('active');
                playNote(keyData.midi);
                activeNotes.add(mappedChar);
            } else {
                keyData.element.classList.remove('active');
                activeNotes.delete(mappedChar);
            }

            const elapsed = (performance.now() - startTime) / 1000;
            const progress = Math.min(100, (elapsed / totalDuration) * 100);
            midiProgressFill.style.width = progress + '%';
        }, delay);

        activeTimeouts.push(timeout);
    }

    const endTimeout = setTimeout(() => {
        if (!stopRequested) {
            midiStatusText.textContent = 'Finished! 🎉';
            releaseAllNotes();
            setTimeout(() => resetPlayUI(), 2500);
        }
    }, (totalDuration * 1000) + 200);

    activeTimeouts.push(endTimeout);
}

function runCountdown(seconds) {
    return new Promise((resolve) => {
        countdownOverlay.style.display = 'flex';
        let remaining = seconds;

        function tick() {
            if (stopRequested) {
                countdownOverlay.style.display = 'none';
                resolve();
                return;
            }
            if (remaining <= 0) {
                countdownOverlay.style.display = 'none';
                resolve();
                return;
            }
            countdownNumber.textContent = remaining;
            countdownNumber.style.animation = 'none';
            void countdownNumber.offsetWidth;
            countdownNumber.style.animation = 'countdownPop 1s ease-out';

            remaining--;
            const tid = setTimeout(tick, 1000);
            activeTimeouts.push(tid);
        }
        tick();
    });
}

function emergencyStop() {
    console.log('[MIDI] Emergency stop triggered!');
    stopRequested = true;
    countdownOverlay.style.display = 'none';

    for (const tid of activeTimeouts) clearTimeout(tid);
    activeTimeouts = [];

    releaseAllNotes();

    midiStatusText.textContent = 'Stopped! 🛑';
    setTimeout(() => resetPlayUI(), 1500);
}

function releaseAllNotes() {
    for (const char of activeNotes) {
        const keyData = keyElements[char];
        if (keyData) keyData.element.classList.remove('active');
    }
    for (const char of Object.keys(keyElements)) {
        keyElements[char].element.classList.remove('active');
    }
    activeNotes.clear();
}

function resetPlayUI() {
    isPlaying = false;
    stopRequested = false;
    midiPlayBtn.style.display = 'inline-flex';
    midiStopBtn.style.display = 'none';
    midiProgressFill.style.width = '0%';
    setTimeout(() => {
        midiStatus.style.display = 'none';
    }, 300);
}