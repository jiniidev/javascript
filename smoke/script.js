const container = document.getElementById('cigarContainer');
const cigarBody = document.getElementById('cigarBody');
const tip = document.getElementById('tip');
const statusText = document.getElementById('status');

let isDragging = false;
let offset = { x: 0, y: 0 };
let smokeInterval = 150;
let timer;

let currentWidth = 250;
let ashAmount = 0;
const burnSpeed = 0.01;

// 초기 위치 설정
container.style.left = '40%';
container.style.top = '50%';

container.addEventListener('mousedown', (e) => {
    isDragging = true;
    offset.x = e.clientX - container.offsetLeft;
    offset.y = e.clientY - container.offsetTop;

    if (ashAmount > 0.5) {
        spawnAsh(Math.floor(ashAmount * 6));
        ashAmount = 0;
    }
});

window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    container.style.left = (e.clientX - offset.x) + 'px';
    container.style.top = (e.clientY - offset.y) + 'px';
});

window.addEventListener('mouseup', () => {
    if (isDragging) {
        burstSmoke();
        isDragging = false;
    }
});

function spawnAsh(count) {
    const rect = tip.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
        const ash = document.createElement('div');
        ash.className = 'ash';
        const size = Math.random() * 6 + 2;
        ash.style.width = size + 'px';
        ash.style.height = size + 'px';
        ash.style.left = rect.left + 'px';
        ash.style.top = rect.top + 'px';
        document.body.appendChild(ash);

        let opacity = 1;
        let vx = (Math.random() - 0.5) * 3;
        let vy = Math.random() * 2;
        let top = rect.top;
        let left = rect.left;

        const fall = setInterval(() => {
            vy += 0.2;
            top += vy; left += vx; opacity -= 0.02;
            ash.style.top = top + 'px';
            ash.style.left = left + 'px';
            ash.style.opacity = opacity;
            if (opacity <= 0) { clearInterval(fall); ash.remove(); }
        }, 30);
    }
}

function update() {
    if (currentWidth > 0) {
        currentWidth -= burnSpeed;
        ashAmount += burnSpeed * 0.5;
        cigarBody.style.width = currentWidth + 'px';

        if (ashAmount > 30) {
            spawnAsh(8);
            ashAmount = 10;
        }
    } else {
        currentWidth = 0;
        cigarBody.style.width = '0px';
        tip.style.boxShadow = "none";
        tip.style.background = "#333";
    }
    requestAnimationFrame(update);
}

function refill() {
    currentWidth = 250;
    ashAmount = 0;
    cigarBody.style.width = currentWidth + 'px';
    tip.style.boxShadow = "0 0 20px #ff4500";
    tip.style.background = "radial-gradient(circle at center, #ff6a00, #ff4500, #222)";
}

function createSmoke(isBurst = false) {
    if (currentWidth <= 0) return;
    const smoke = document.createElement('div');
    smoke.className = 'smoke';
    const rect = tip.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2 - 25;

    const rndW = isBurst ? Math.random() * 80 + 50 : Math.random() * 40 + 30;
    const rndH = rndW * (Math.random() * 0.5 + 0.5);

    smoke.style.width = rndW + 'px';
    smoke.style.height = rndH + 'px';
    smoke.style.borderRadius = `${Math.random() * 50 + 20}% ${Math.random() * 50 + 20}% ${Math.random() * 50 + 20}% ${Math.random() * 50 + 20}%`;
    smoke.style.left = startX + 'px';
    smoke.style.top = startY + 'px';
    document.body.appendChild(smoke);

    let opacity = isBurst ? 0.3 : 0.1;

    let posX = startX;
    let posY = startY;
    let rotation = Math.random() * 360;
    let rotateSpeed = (Math.random() - 0.5) * 2;
    let drift = (Math.random() - 0.5) * (isBurst ? 12 : 4);
    let vSpeed = isBurst ? Math.random() * 4 + 2 : 1.8;

    const interval = setInterval(() => {
        posY -= vSpeed; posX += drift; rotation += rotateSpeed;
        let currentW = parseFloat(smoke.style.width) + 0.6;
        let currentH = parseFloat(smoke.style.height) + 0.5;

        opacity -= 0.005;

        smoke.style.top = posY + 'px';
        smoke.style.left = posX + 'px';
        smoke.style.width = currentW + 'px';
        smoke.style.height = currentH + 'px';
        smoke.style.transform = `rotate(${rotation}deg)`;
        smoke.style.opacity = opacity;
        if (opacity <= 0) { clearInterval(interval); smoke.remove(); }
    }, 20);
}

function burstSmoke() {
    for (let i = 0; i < 15; i++) { setTimeout(() => createSmoke(true), i * 10); }
}

function spawnDonut() {
    if (currentWidth <= 0) return;
    const donut = document.createElement('div');
    donut.className = 'smoke-donut';
    const rect = tip.getBoundingClientRect();

    const startX = rect.left + rect.width / 2 + 5;
    const startY = rect.top + rect.height / 2 - 15;

    let size = 20;
    donut.style.width = size + 'px';
    donut.style.height = size + 'px';
    donut.style.left = (startX - size / 2) + 'px';
    donut.style.top = (startY - size / 2) + 'px';
    document.body.appendChild(donut);

    let opacity = 0.55;
    let vSpeed = 2.8;
    let expansion = 1.3;

    const interval = setInterval(() => {
        size += expansion;
        vSpeed *= 0.99;
        opacity -= 0.005;

        const currentTop = parseFloat(donut.style.top) - vSpeed;
        const currentLeft = parseFloat(donut.style.left) - expansion / 2;

        donut.style.top = currentTop + 'px';
        donut.style.left = currentLeft + 'px';
        donut.style.width = size + 'px';
        donut.style.height = size + 'px';
        donut.style.opacity = opacity;

        donut.style.borderWidth = (10 + size / 20) + 'px';

        if (opacity <= 0) { clearInterval(interval); donut.remove(); }
    }, 20);
}

function startLoop() {
    clearInterval(timer);
    timer = setInterval(() => createSmoke(false), smokeInterval);
}

window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0) smokeInterval = Math.min(1000, smokeInterval + 20);
    else smokeInterval = Math.max(10, smokeInterval - 20);
    statusText.innerText = `연기 간격: ${smokeInterval}ms`;
    startLoop();
});

startLoop();
update();