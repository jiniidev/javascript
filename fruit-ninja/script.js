/**
 * 설정 및 상수
 */
const CONFIG = {
    W: 800,
    H: 600,
    GRAVITY: 0.25,        // 중력 가속도
    SPAWN_INTERVAL: 70,   // 과일 생성 주기 (낮을수록 자주 나옴)
    MAX_TRAIL_LEN: 5,     // trail 길이
    COLORS: { bg: '#0a0a1a', trail: '#fff' }
};

const FRUITS_DATA = [
    { emoji: '🍉', color: '#4CAF50', score: 3, r: 50 },
    { emoji: '🍎', color: '#f44336', score: 1, r: 40 },
    { emoji: '🍊', color: '#FF9800', score: 1, r: 40 },
    { emoji: '🍋', color: '#FFEB3B', score: 2, r: 40 },
    { emoji: '🍇', color: '#9C27B0', score: 2, r: 45 },
];

/**
 * DOM 요소
 */
const el = {
    canvas: document.getElementById('gameCanvas'),
    video: document.getElementById('videoEl'),
    score: document.getElementById('scoreVal'),
    best: document.getElementById('bestVal'),
    lives: document.getElementById('livesBox'),
    screens: {
        start: document.getElementById('startScreen'),
        ready: document.getElementById('readyScreen'),
        gameOver: document.getElementById('gameOverScreen')
    },
    status: document.getElementById('statusMsg'),
    finalScore: document.getElementById('finalScore'),
    resetBtn: document.getElementById('resetBtn')
};

const ctx = el.canvas.getContext('2d');
el.canvas.width = CONFIG.W;
el.canvas.height = CONFIG.H;

/**
 * 게임 상태 변수
 */
let state = {
    score: 0,
    bestScore: localStorage.getItem('ninjaBest') || 0,
    lives: 3,
    gameState: 'start', 
    fruits: [],
    particles: [],
    handTrail: [],
    mouseTrail: [],
    useCamera: false,
    cameraStarted: false,
    isHandDetected: false,
    spawnTimer: 0
};

let animFrame = null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * 유틸리티 함수
 */
function updateUI() {
    el.score.textContent = state.score;
    el.best.textContent = state.bestScore;
    el.lives.textContent = '❤️'.repeat(Math.max(0, state.lives));
}

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);

    if (type === 'fruit') {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    }
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
}

/**
 * 핵심 게임 로직
 */
function spawnFruit() {
    const isBomb = Math.random() < 0.15;
    const side = Math.floor(Math.random() * 3);
    let x, y, vx, vy;

    if (side === 0) {
        x = 100 + Math.random() * (CONFIG.W - 200);
        y = CONFIG.H + 50;
        vx = (x < CONFIG.W / 2 ? 1 : -1) * (1 + Math.random() * 2);
        vy = -(14 + Math.random() * 4);
    } else {
        x = side === 1 ? -50 : CONFIG.W + 50;
        y = 100 + Math.random() * (CONFIG.H - 300);
        vx = (side === 1 ? 1 : -1) * (8 + Math.random() * 5);
        vy = -(5 + Math.random() * 5);
    }

    const base = isBomb ? { emoji: '💣', r: 40, isBomb: true, color: '#333' } : FRUITS_DATA[Math.floor(Math.random() * FRUITS_DATA.length)];
    state.fruits.push({
        ...base, x, y, vx, vy,
        rot: 0, rotV: (Math.random() - 0.5) * 0.2,
        cut: null, score: base.score || 0
    });
}

function checkSlash(trail) {
    if (trail.length < 2 || state.gameState !== 'playing') return;
    
    const pCurrent = trail[trail.length - 1];
    const pPrev = trail[trail.length - 2];

    const distFromLast = Math.hypot(pCurrent.x - pPrev.x, pCurrent.y - pPrev.y);
    if (distFromLast > 300) { 
        trail.splice(0, trail.length - 1); 
        return; 
    }

    state.fruits.forEach(f => {
        if (f.cut) return;
        if (Math.hypot(f.x - pCurrent.x, f.y - pCurrent.y) < f.r + 20) {
            slashFruit(f);
        }
    });
}

function slashFruit(f) {
    if (f.isBomb) {
        playSound('bomb');
        loseLife();
        f.cut = { alpha: 1 };
    } else {
        playSound('fruit');
        state.score += f.score;
        if (state.score > state.bestScore) {
            state.bestScore = state.score;
            localStorage.setItem('ninjaBest', state.bestScore);
        }
        updateUI();
        addParticles(f.x, f.y, f.color);
        f.cut = {
            alpha: 1,
            l: { vx: -5, vy: -3, rot: f.rot, rotV: -0.1 },
            r: { vx: 5, vy: -3, rot: f.rot, rotV: 0.1 }
        };
    }
}

function addParticles(x, y, color) {
    for (let i = 0; i < 10; i++) {
        state.particles.push({
            x, y, color,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1, decay: 0.03
        });
    }
}

function loseLife() {
    state.lives--;
    updateUI();
    if (state.lives <= 0) endGame();
}

/**
 * 렌더링 루프
 */
function drawFruit(f) {
    if (!f.cut) {
        ctx.save();
        ctx.font = `${f.r * 1.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.fillText(f.emoji, 0, 0);
        ctx.restore();
    } else if (!f.isBomb) {
        ctx.save();
        ctx.globalAlpha = f.cut.alpha;
        ctx.font = `${f.r * 1.5}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ['l', 'r'].forEach(side => {
            const part = f.cut[side];
            const offset = 5 * (1 - f.cut.alpha);
            ctx.save();
            ctx.translate(f.x + part.vx * offset, f.y + part.vy * offset);
            ctx.rotate(part.rot);
            ctx.beginPath();
            side === 'l' ? ctx.rect(-100, -100, 100, 200) : ctx.rect(0, -100, 100, 200);
            ctx.clip();
            ctx.fillText(f.emoji, 0, 0);
            ctx.restore();
        });
        ctx.restore();
    }
}

function loop() {
    if (state.gameState !== 'playing') return;
    animFrame = requestAnimationFrame(loop);

    ctx.fillStyle = CONFIG.COLORS.bg;
    ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);

    if (++state.spawnTimer > CONFIG.SPAWN_INTERVAL) {
        state.spawnTimer = 0;
        spawnFruit();
    }

    // [최적화] 카메라 모드일 때 루프 안에서 한 번만 충돌 검사
    if (state.useCamera && state.handTrail.length > 0) {
        checkSlash(state.handTrail);
    }

    for (let i = state.fruits.length - 1; i >= 0; i--) {
        const f = state.fruits[i];
        f.x += f.vx; f.y += f.vy; f.vy += CONFIG.GRAVITY;

        if (f.cut) {
            if (!f.isBomb) f.cut.alpha -= 0.03;
            if (f.isBomb || f.cut.alpha <= 0) { state.fruits.splice(i, 1); continue; }
        } else {
            f.rot += f.rotV;
            if (f.y > CONFIG.H + 100) {
                if (!f.isBomb) loseLife();
                state.fruits.splice(i, 1);
                continue;
            }
        }
        drawFruit(f);
    }

    state.particles = state.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= p.decay;
        if (p.life > 0) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
            return true;
        }
        return false;
    });

    ctx.globalAlpha = 1.0;
    const trail = state.useCamera ? state.handTrail : state.mouseTrail;
    if (trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
            ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.stroke();
    }
}

/**
 * 카메라 및 초기화
 */
const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({ 
    maxNumHands: 1, 
    modelComplexity: 0, // [최적화] 연산량을 대폭 줄인 경량 모델 사용
    minDetectionConfidence: 0.7, 
    minTrackingConfidence: 0.7 
});

hands.onResults((res) => {
    if (res.multiHandLandmarks?.length > 0) {
        state.isHandDetected = true;
        const lm = res.multiHandLandmarks[0][8]; 
        const x = (1 - lm.x) * CONFIG.W; 
        const y = lm.y * CONFIG.H;
        state.handTrail.push({ x, y });
        if (state.handTrail.length > CONFIG.MAX_TRAIL_LEN) state.handTrail.shift();
        // checkSlash는 이제 loop()에서 수행합니다.
    } else {
        state.isHandDetected = false;
        state.handTrail = [];
    }
});

async function initCamera() {
    if (state.cameraStarted) return true;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 320 } });
        el.video.srcObject = stream;
        const camera = new Camera(el.video, {
            onFrame: async () => await hands.send({ image: el.video }),
            width: 640, height: 320 // 카메라 해상도
        });
        camera.start();
        state.cameraStarted = true;
        return true;
    } catch (e) { return false; }
}

async function prepareGame(cam) {
    state.useCamera = cam;
    Object.values(el.screens).forEach(s => s.style.display = 'none');
    
    if (cam) {
        el.screens.ready.style.display = 'flex';
        el.status.textContent = "카메라 연결 중...";
        if (!(await initCamera())) { showStartScreen(); return; }
        
        state.gameState = 'ready';
        const checkHand = () => {
            if (state.gameState !== 'ready') return;
            if (state.isHandDetected) startGameNow();
            else {
                el.status.textContent = "카메라에 손을 보여주세요!";
                requestAnimationFrame(checkHand);
            }
        };
        checkHand();
    } else {
        startGameNow();
    }
}

function startGameNow() {
    if (animFrame) cancelAnimationFrame(animFrame);
    state = { ...state, score: 0, lives: 3, fruits: [], particles: [], gameState: 'playing', spawnTimer: 60 };
    el.screens.ready.style.display = 'none';
    el.resetBtn.style.display = 'block';
    updateUI();
    loop();
}

function endGame() {
    state.gameState = 'gameover';
    el.finalScore.textContent = `SCORE ${state.score}`;
    el.screens.gameOver.style.display = 'flex';
    el.resetBtn.style.display = 'none';
}

function showStartScreen() {
    state.gameState = 'start';
    if (animFrame) cancelAnimationFrame(animFrame);
    el.screens.start.style.display = 'flex';
    el.screens.ready.style.display = 'none';
    el.screens.gameOver.style.display = 'none';
    el.resetBtn.style.display = 'none';
    ctx.clearRect(0, 0, CONFIG.W, CONFIG.H);
}

/**
 * 이벤트 리스너
 */
el.canvas.addEventListener('mousemove', (e) => {
    if (state.useCamera || state.gameState !== 'playing') return;
    const rect = el.canvas.getBoundingClientRect();
    const newX = e.clientX - rect.left;
    const newY = e.clientY - rect.top;
    state.mouseTrail.push({ x: newX, y: newY });
    if (state.mouseTrail.length > CONFIG.MAX_TRAIL_LEN) state.mouseTrail.shift();
    checkSlash(state.mouseTrail);
});

document.getElementById('startBtn').onclick = () => { audioCtx.resume(); prepareGame(true); };
document.getElementById('mouseBtn').onclick = () => { audioCtx.resume(); prepareGame(false); };
document.getElementById('restartBtn').onclick = () => prepareGame(state.useCamera);
el.resetBtn.onclick = showStartScreen;

updateUI();