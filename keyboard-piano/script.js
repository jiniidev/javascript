// script.js
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const piano = document.getElementById('piano');
const oscType = document.getElementById('oscType');

const notes = [
    { key: 'A', freq: 261.63, type: 'white' },
    { key: 'W', freq: 277.18, type: 'black' },
    { key: 'S', freq: 293.66, type: 'white' },
    { key: 'E', freq: 311.13, type: 'black' },
    { key: 'D', freq: 329.63, type: 'white' },
    { key: 'F', freq: 349.23, type: 'white' },
    { key: 'T', freq: 369.99, type: 'black' },
    { key: 'G', freq: 392.00, type: 'white' },
    { key: 'Y', freq: 415.30, type: 'black' },
    { key: 'H', freq: 440.00, type: 'white' },
    { key: 'U', freq: 466.16, type: 'black' },
    { key: 'J', freq: 493.88, type: 'white' },
    { key: 'K', freq: 523.25, type: 'white' },
    { key: 'O', freq: 554.37, type: 'black' },
    { key: 'L', freq: 587.33, type: 'white' },
    { key: 'P', freq: 622.25, type: 'black' },
    { key: ';', freq: 659.25, type: 'white' }
];

notes.forEach(n => {
    const div = document.createElement('div');
    div.className = `key ${n.type}`;
    div.dataset.key = n.key;
    div.dataset.freq = n.freq;
    div.innerText = n.key;
    piano.appendChild(div);
});

function playNote(freq) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = oscType.value;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 1.5);
}

const activeKeys = new Set();

window.addEventListener('keydown', (e) => {
    const keyName = e.key === ';' ? ';' : e.key.toUpperCase();
    if (activeKeys.has(keyName)) return;
    const note = notes.find(n => n.key === keyName);
    if (note) {
        activeKeys.add(keyName);
        playNote(note.freq);
        const el = document.querySelector(`[data-key="${keyName}"]`);
        if(el) el.classList.add('active');
    }
});

window.addEventListener('keyup', (e) => {
    const keyName = e.key === ';' ? ';' : e.key.toUpperCase();
    activeKeys.delete(keyName);
    const el = document.querySelector(`[data-key="${keyName}"]`);
    if (el) el.classList.remove('active');
});