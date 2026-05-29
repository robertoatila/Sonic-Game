// script.js

const STEP_COUNT = 8;
const STEP_WIDTH = 150;
const STEP_HEIGHT = 75;
const STEP_BASE_Y = 75;
const STEP_PLATFORM_HEIGHT = 40;
const STEP_PLATFORM_OFFSET = 35;
const SONIC_SIZE = 40;
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 750;
const LEVEL_TIME = 40;
const MAX_LIVES = 4;
const INVULNERABLE_TIME = 2200;
const PHASE_MESSAGE_TIME = 1800;

const SPIKE_SIZE = 48;
const SPIKE_COLLISION_MARGIN = 4;
const COIN_SIZE = 40;
const ENEMY_WIDTH = 72;
const ENEMY_HEIGHT = 72;
const BLASTER_WIDTH = 34;
const BLASTER_HEIGHT = 10;

const PHASES = [
    {
        number: 1,
        cssClass: 'phase-1',
        spikeSteps: [3, 6],
        enemySpeed: 1.25,
        blasterSpeed: 2.4,
        blasterCooldown: 2100,
        spikeToggleInterval: 1300,
        message: 'Fase 1 concluída! Prepare-se: Robotnik vai atirar mais rápido.'
    },
    {
        number: 2,
        cssClass: 'phase-2',
        spikeSteps: [2, 4, 6],
        enemySpeed: 2,
        blasterSpeed: 3.1,
        blasterCooldown: 1700,
        spikeToggleInterval: 1000,
        message: 'Fase 2: dificuldade aumentada!'
    }
];

let sonicX = 10;
let sonicY = STEP_BASE_Y;
let jumpY = 0;
let currentStep = 0;
let maxStepReached = 0;
let score = 0;
let timeLeft = LEVEL_TIME;
let phaseIndex = 0;
let lives = MAX_LIVES;

let gameActive = false;
let isJumping = false;
let isClimbing = false;
let isInvulnerable = false;
let timerInterval;
let spikeInterval;
let invulnerabilityTimeout;
let phaseMessageTimeout;

const keys = {};
let jumpVelocity = 0;
const gravity = -0.8;
let climbProgress = 0;
let startX = 0;
let targetX = 0;
let diffX = 0;
let lastTime = 0;
let animationFrameId;

const obstacles = [];
let loweredSpikeIndex = 0;
let coinBounds = null;
let coinEl = null;
const blasterShots = [];
let lastBlasterShot = 0;
const enemy = {
    x: GAME_WIDTH - ENEMY_WIDTH - 35,
    y: GAME_HEIGHT - ENEMY_HEIGHT - 70,
    width: ENEMY_WIDTH,
    height: ENEMY_HEIGHT
};

const gameContainer = document.getElementById('game-container');
const sonicEl = document.getElementById('sonic');
const enemyEl = document.getElementById('enemy');
const phaseMessageEl = document.getElementById('phase-message');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const phaseEl = document.getElementById('phase');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const endTitle = document.getElementById('end-title');
const endMessage = document.getElementById('end-message');

function currentPhase() {
    return PHASES[phaseIndex];
}

function initializeRun() {
    stopTimers();
    phaseIndex = 0;
    score = 0;
    lives = MAX_LIVES;
    timeLeft = LEVEL_TIME;
    maxStepReached = 0;
    gameActive = false;
    isInvulnerable = false;
    sonicEl.classList.remove('invulnerable');
    buildWorld();
    hidePhaseMessage();
    updateHud();
}

// Constrói o mundo da fase atual e recria plataformas, espinhos, moeda e Robotnik.
function buildWorld() {
    clearInterval(spikeInterval);
    clearBlasterShots();
    obstacles.length = 0;
    loweredSpikeIndex = 0;
    coinBounds = null;

    gameContainer.innerHTML = '';
    gameContainer.classList.remove('phase-1', 'phase-2');
    gameContainer.classList.add(currentPhase().cssClass);
    gameContainer.appendChild(sonicEl);
    gameContainer.appendChild(enemyEl);
    gameContainer.appendChild(phaseMessageEl);
    gameContainer.appendChild(startScreen);
    gameContainer.appendChild(endScreen);

    resetPlayerPosition();
    spawnEnemyFarFromSonic();

    for (let i = 0; i < STEP_COUNT; i++) {
        const step = document.createElement('div');
        step.className = 'degrau';
        step.style.left = (i * STEP_WIDTH) + 'px';
        step.style.bottom = ((i * STEP_HEIGHT) + STEP_PLATFORM_OFFSET) + 'px';
        step.style.width = STEP_WIDTH + 'px';
        step.style.height = STEP_PLATFORM_HEIGHT + 'px';
        gameContainer.appendChild(step);

        if (currentPhase().spikeSteps.includes(i)) {
            createSpike(i);
        }
    }

    createCoin();
    updateSonicPosition();
    updateEnemyPosition();
    updateHud();
}

function createSpike(stepIndex) {
    const spike = document.createElement('div');
    spike.className = 'spike';
    const spikeX = (stepIndex * STEP_WIDTH) + (STEP_WIDTH / 2) - (SPIKE_SIZE / 2);
    const spikeY = (stepIndex * STEP_HEIGHT) + STEP_BASE_Y;
    spike.style.left = spikeX + 'px';
    spike.style.bottom = spikeY + 'px';
    gameContainer.appendChild(spike);

    obstacles.push({
        el: spike,
        x: spikeX + SPIKE_COLLISION_MARGIN,
        y: spikeY + SPIKE_COLLISION_MARGIN,
        width: SPIKE_SIZE - (SPIKE_COLLISION_MARGIN * 2),
        height: SPIKE_SIZE - (SPIKE_COLLISION_MARGIN * 2),
        active: true
    });
}

function createCoin() {
    const coinX = ((STEP_COUNT - 1) * STEP_WIDTH) + (STEP_WIDTH / 2) - (COIN_SIZE / 2);
    const coinY = ((STEP_COUNT - 1) * STEP_HEIGHT) + STEP_BASE_Y + 15;
    coinEl = document.createElement('div');
    coinEl.className = 'coin';
    coinEl.style.left = coinX + 'px';
    coinEl.style.bottom = coinY + 'px';
    gameContainer.appendChild(coinEl);
    coinBounds = { x: coinX, y: coinY, width: COIN_SIZE, height: COIN_SIZE };
}

function startGame() {
    initializeRun();
    startScreen.style.display = 'none';
    endScreen.style.display = 'none';
    gameActive = true;
    lastTime = performance.now();
    lastBlasterShot = performance.now();
    startSpikeCycle();
    startTimer();

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
}

function resetToStart() {
    endScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    initializeRun();
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameActive) return;
        timeLeft--;
        updateHud();
        if (timeLeft <= 0) {
            endGame(false, 'O tempo acabou!');
        }
    }, 1000);
}

function stopTimers() {
    clearInterval(timerInterval);
    clearInterval(spikeInterval);
    clearTimeout(invulnerabilityTimeout);
    clearTimeout(phaseMessageTimeout);
    clearBlasterShots();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
}

function resetPlayerPosition() {
    sonicX = 10;
    sonicY = STEP_BASE_Y;
    jumpY = 0;
    currentStep = 0;
    isJumping = false;
    isClimbing = false;
    jumpVelocity = 0;
    climbProgress = 0;
    sonicEl.style.backgroundImage = "url('prota.jfif')";
}

function updateSonicPosition() {
    sonicEl.style.left = sonicX + 'px';
    sonicEl.style.bottom = (sonicY + jumpY) + 'px';
}

function updateEnemyPosition() {
    enemyEl.style.left = enemy.x + 'px';
    enemyEl.style.bottom = enemy.y + 'px';
}

function updateHud() {
    scoreEl.innerText = score;
    timeEl.innerText = timeLeft;
    phaseEl.innerText = currentPhase().number;
    livesEl.innerText = lives;
}

function endGame(win, message) {
    if (!gameActive) return;
    gameActive = false;
    stopTimers();
    sonicEl.classList.remove('invulnerable');

    if (win) {
        endTitle.innerText = 'Você Venceu!';
        endTitle.style.color = '#2ecc71';
    } else {
        endTitle.innerText = 'Game Over!';
        endTitle.style.color = '#e74c3c';
    }

    endMessage.innerText = message;
    endScreen.style.display = 'flex';
}

function startSpikeCycle() {
    clearInterval(spikeInterval);
    loweredSpikeIndex = 0;
    updateSpikeStates();

    spikeInterval = setInterval(() => {
        if (!gameActive || obstacles.length === 0) return;
        loweredSpikeIndex = (loweredSpikeIndex + 1) % obstacles.length;
        updateSpikeStates();
    }, currentPhase().spikeToggleInterval);
}

function updateSpikeStates() {
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const isLowered = i === loweredSpikeIndex;
        obs.active = !isLowered;
        obs.el.classList.toggle('spike-lowered', isLowered);
    }
}

function showPhaseMessage(message) {
    clearTimeout(phaseMessageTimeout);
    phaseMessageEl.innerText = message;
    phaseMessageEl.style.display = 'flex';
    phaseMessageTimeout = setTimeout(hidePhaseMessage, PHASE_MESSAGE_TIME);
}

function hidePhaseMessage() {
    phaseMessageEl.innerText = '';
    phaseMessageEl.style.display = 'none';
}

function collectCoin() {
    if (!coinBounds) return;

    coinEl.style.display = 'none';
    coinBounds = null;
    score += 50;
    updateHud();

    if (phaseIndex === PHASES.length - 1) {
        endGame(true, 'Parabéns, você pegou a moeda final e venceu!');
        return;
    }

    phaseIndex++;
    maxStepReached = 0;
    timeLeft = LEVEL_TIME;
    buildWorld();
    lastBlasterShot = performance.now();
    startSpikeCycle();
    setInvulnerable();
    showPhaseMessage(currentPhase().message);
}

function handleDamage(message) {
    if (!gameActive || isInvulnerable) return;

    lives--;
    updateHud();

    if (lives <= 0) {
        endGame(false, message + ' Suas vidas acabaram.');
        return;
    }

    resetPlayerPosition();
    spawnEnemyFarFromSonic();
    clearBlasterShots();
    lastBlasterShot = performance.now();
    updateSonicPosition();
    updateEnemyPosition();
    setInvulnerable();
    showPhaseMessage(message + ' Você perdeu uma vida.');
}

function setInvulnerable() {
    clearTimeout(invulnerabilityTimeout);
    isInvulnerable = true;
    sonicEl.classList.add('invulnerable');
    invulnerabilityTimeout = setTimeout(() => {
        isInvulnerable = false;
        sonicEl.classList.remove('invulnerable');
    }, INVULNERABLE_TIME);
}

function spawnEnemyFarFromSonic() {
    if (sonicX < GAME_WIDTH / 2) {
        enemy.x = GAME_WIDTH - enemy.width - 35;
        enemy.y = GAME_HEIGHT - enemy.height - 70;
    } else {
        enemy.x = 35;
        enemy.y = GAME_HEIGHT - enemy.height - 70;
    }
}

function updateEnemy(timeScale) {
    if (!gameActive) return;

    const sonicCenterX = sonicX + (SONIC_SIZE / 2);
    const sonicCenterY = sonicY + jumpY + (SONIC_SIZE / 2);
    const hoverDirection = sonicCenterX < GAME_WIDTH - 340 ? 1 : -1;
    const targetX = sonicCenterX + (hoverDirection * 260) - (enemy.width / 2);
    const targetY = clamp(sonicCenterY + 145, 135, GAME_HEIGHT - enemy.height - 35);
    const deltaX = targetX - enemy.x;
    const deltaY = targetY - enemy.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > 1) {
        const speed = currentPhase().enemySpeed * timeScale;
        enemy.x += (deltaX / distance) * speed;
        enemy.y += (deltaY / distance) * speed;
    }

    enemy.x = clamp(enemy.x, 0, GAME_WIDTH - enemy.width);
    enemy.y = clamp(enemy.y, 35, GAME_HEIGHT - enemy.height);
    updateEnemyPosition();
}

function updateBlasterShots(timeScale, timestamp) {
    if (!gameActive) return;

    if (timestamp - lastBlasterShot >= currentPhase().blasterCooldown) {
        shootBlaster();
        lastBlasterShot = timestamp;
    }

    for (let i = blasterShots.length - 1; i >= 0; i--) {
        const shot = blasterShots[i];
        shot.x += shot.vx * timeScale;
        shot.y += shot.vy * timeScale;
        shot.el.style.left = shot.x + 'px';
        shot.el.style.bottom = shot.y + 'px';

        if (shot.x < -80 || shot.x > GAME_WIDTH + 80 || shot.y < -80 || shot.y > GAME_HEIGHT + 80) {
            removeBlasterShot(i);
        }
    }
}

function shootBlaster() {
    const sonicCenterX = sonicX + (SONIC_SIZE / 2);
    const sonicCenterY = sonicY + jumpY + (SONIC_SIZE / 2);
    const robotnikCenterX = enemy.x + (enemy.width / 2);
    const robotnikCenterY = enemy.y + (enemy.height / 2);
    const deltaX = sonicCenterX - robotnikCenterX;
    const deltaY = sonicCenterY - robotnikCenterY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance <= 1) return;

    const shotEl = document.createElement('div');
    shotEl.className = 'blaster-shot';

    const speed = currentPhase().blasterSpeed;
    const vx = (deltaX / distance) * speed;
    const vy = (deltaY / distance) * speed;
    const angle = Math.atan2(-vy, vx) * (180 / Math.PI);
    const shot = {
        el: shotEl,
        x: robotnikCenterX - (BLASTER_WIDTH / 2),
        y: robotnikCenterY - (BLASTER_HEIGHT / 2),
        width: BLASTER_WIDTH,
        height: BLASTER_HEIGHT,
        vx,
        vy
    };

    shotEl.style.left = shot.x + 'px';
    shotEl.style.bottom = shot.y + 'px';
    shotEl.style.transform = `rotate(${angle}deg)`;
    gameContainer.appendChild(shotEl);
    blasterShots.push(shot);
}

function removeBlasterShot(index) {
    const shot = blasterShots[index];
    if (shot && shot.el.parentNode) {
        shot.el.parentNode.removeChild(shot.el);
    }
    blasterShots.splice(index, 1);
}

function clearBlasterShots() {
    for (let i = blasterShots.length - 1; i >= 0; i--) {
        removeBlasterShot(i);
    }
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function boxesOverlap(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function checkCollisions() {
    if (!gameActive) return;

    const sonicBounds = {
        x: sonicX,
        y: sonicY + jumpY,
        width: SONIC_SIZE,
        height: SONIC_SIZE
    };

    if (coinBounds && currentStep === STEP_COUNT - 1 && boxesOverlap(sonicBounds, coinBounds)) {
        collectCoin();
        return;
    }

    if (isInvulnerable) return;

    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (obs.active && boxesOverlap(sonicBounds, obs)) {
            handleDamage('Você tocou em um espinho mortal!');
            return;
        }
    }

    for (let i = blasterShots.length - 1; i >= 0; i--) {
        if (boxesOverlap(sonicBounds, blasterShots[i])) {
            removeBlasterShot(i);
            handleDamage('Você foi atingido pelo blaster do Robotnik!');
            return;
        }
    }
}

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    keys[e.code] = true;

    if (e.code === 'Space' || key === 'arrowup') e.preventDefault();
});

document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
    keys[e.code] = false;
});

function gameLoop(timestamp) {
    if (!gameActive) return;

    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    if (deltaTime > 100) deltaTime = 16.66;

    const timeScale = deltaTime / 16.66;
    handleMovement(timeScale);
    updateEnemy(timeScale);
    updateBlasterShots(timeScale, timestamp);
    checkCollisions();

    animationFrameId = requestAnimationFrame(gameLoop);
}

function handleMovement(timeScale) {
    if (!isClimbing) {
        if (keys['arrowright'] || keys['d'] || keys['KeyD']) {
            const stepMaxX = (currentStep * STEP_WIDTH) + STEP_WIDTH - SONIC_SIZE;
            sonicX += 6 * timeScale;

            if (sonicX > stepMaxX) {
                if (isJumping && jumpY >= 60 && currentStep < STEP_COUNT - 1) {
                    currentStep++;
                    sonicY += STEP_HEIGHT;
                    jumpY -= STEP_HEIGHT;
                    addStepScore();
                } else {
                    sonicX = stepMaxX;
                }
            }
        }

        if (keys['arrowleft'] || keys['a'] || keys['KeyA']) {
            const stepMinX = currentStep * STEP_WIDTH;
            sonicX -= 6 * timeScale;

            if (sonicX < stepMinX) {
                if (currentStep > 0) {
                    currentStep--;
                    sonicY -= STEP_HEIGHT;
                    jumpY += STEP_HEIGHT;

                    if (!isJumping) {
                        isJumping = true;
                        jumpVelocity = 0;
                        sonicEl.style.backgroundImage = "url('jump.png')";
                    }
                } else {
                    sonicX = stepMinX;
                }
            }
        }

        if ((keys['arrowup'] || keys['w'] || keys[' '] || keys['Space'] || keys['KeyW']) && !isJumping) {
            const stepMaxX = (currentStep * STEP_WIDTH) + STEP_WIDTH - SONIC_SIZE;
            const isHoldingLeft = keys['arrowleft'] || keys['a'] || keys['KeyA'];

            if (sonicX >= stepMaxX - 5 && !isHoldingLeft && currentStep < STEP_COUNT - 1) {
                isClimbing = true;
                climbProgress = 0;
                startX = sonicX;
                targetX = (currentStep + 1) * STEP_WIDTH + 10;
                diffX = targetX - startX;
                sonicEl.style.backgroundImage = "url('jump.png')";
            } else {
                isJumping = true;
                jumpVelocity = 14;
                sonicEl.style.backgroundImage = "url('jump.png')";
            }
        }
    }

    if (isJumping && !isClimbing) {
        jumpY += jumpVelocity * timeScale;
        jumpVelocity += gravity * timeScale;

        if (jumpY <= 0) {
            jumpY = 0;
            isJumping = false;
            sonicEl.style.backgroundImage = "url('prota.jfif')";
        }
    }

    if (isClimbing) {
        climbProgress += 0.033 * timeScale;
        if (climbProgress > 1) climbProgress = 1;

        const t = climbProgress;
        sonicX = startX + (diffX * t);
        jumpY = -330 * t * t + 405 * t;

        if (climbProgress >= 1) {
            isClimbing = false;
            jumpY = 0;
            sonicY += STEP_HEIGHT;
            currentStep++;
            sonicX = targetX;
            addStepScore();
            sonicEl.style.backgroundImage = "url('prota.jfif')";
        }
    }

    updateSonicPosition();
}

function addStepScore() {
    if (currentStep > maxStepReached) {
        score += 10;
        maxStepReached = currentStep;
        updateHud();
    }
}

window.onload = () => {
    initializeRun();
    startScreen.style.display = 'flex';
    endScreen.style.display = 'none';
    resizeGame();
};

function resizeGame() {
    const wrapper = document.getElementById('game-wrapper');
    if (!wrapper) return;

    const baseWidth = 1250;
    const baseHeight = 850;
    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    wrapper.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', resizeGame);
