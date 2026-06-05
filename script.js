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
const ENEMY_SKY_PATROL_MIN_X = (GAME_WIDTH / 2) - (ENEMY_WIDTH / 2);
const ENEMY_SKY_PATROL_MAX_X = 930;
const ENEMY_SKY_PATROL_Y = 650;

const PHASES = [
    {
        number: 1,
        cssClass: 'phase-1',
        spikeSteps: [3, 6],
        enemyMode: 'patrol',
        enemyCanDamage: true,
        enemyCanShoot: true,
        enemyPatrolMinX: ENEMY_SKY_PATROL_MIN_X,
        enemyPatrolMaxX: ENEMY_SKY_PATROL_MAX_X,
        enemyPatrolY: ENEMY_SKY_PATROL_Y,
        enemySpeed: 1.25,
        blasterSpeed: 2.4,
        blasterCooldown: 3000,
        spikeToggleInterval: 1300,
        message: 'Fase 1 concluída! Prepare-se: Robotnik vai voar e mirar melhor.'
    },
    {
        number: 2,
        cssClass: 'phase-2',
        spikeSteps: [2, 4, 6],
        enemyMode: 'patrol',
        enemyCanDamage: true,
        enemyCanShoot: true,
        enemyPatrolMinX: ENEMY_SKY_PATROL_MIN_X,
        enemyPatrolMaxX: ENEMY_SKY_PATROL_MAX_X,
        enemyPatrolY: ENEMY_SKY_PATROL_Y,
        enemySpeed: 2,
        blasterSpeed: 3.1,
        blasterCooldown: 3000,
        spikeToggleInterval: 1000,
        message: 'Fase 2 concluída! Prepare-se para a FASE FINAL!'
    },
    // ========== FASE 3 — Dificuldade Máxima ==========
    // Evento de mudança: coleta da moeda no step 7 dispara collectCoin()
    // buildWorld() reconstrói a cena inteira com os novos parâmetros
    // A dificuldade cresce em 4 eixos: velocidade do inimigo, velocidade do
    // blaster, cooldown do blaster (menor = mais tiros) e intervalo dos
    // espinhos (menor = pisca mais rápido)
    {
        number: 3,
        cssClass: 'phase-3',
        spikeSteps: [1, 3, 5, 7],       // quase todos os degraus têm espinhos
        enemyMode: 'patrol',
        enemyCanDamage: true,
        enemyCanShoot: true,
        enemyPatrolMinX: ENEMY_SKY_PATROL_MIN_X,
        enemyPatrolMaxX: ENEMY_SKY_PATROL_MAX_X,
        enemyPatrolY: ENEMY_SKY_PATROL_Y,
        enemySpeed: 3.2,                 // velocidade do Robotnik 2.56× a da fase 1
        blasterSpeed: 4.0,               // projétil mais rápido
        blasterCooldown: 1800,           // dispara a cada 1.8s (era 3s)
        spikeToggleInterval: 700,        // espinhos alternam a cada 0.7s
        message: 'FASE FINAL! Robotnik está furioso!'
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

// Direção horizontal da patrulha do Robotnik: 1 = direita, -1 = esquerda.
let patrolDir = 1;
let animationFrameId;

const obstacles = [];
let loweredSpikeIndex = 0;
let coinBounds = null;
let coinEl = null;
const blasterShots = [];
let lastBlasterShot = 0;
const enemy = {
    x: ENEMY_SKY_PATROL_MAX_X,
    y: ENEMY_SKY_PATROL_Y,
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
const touchControlsEl = document.getElementById('touch-controls');

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
    gameContainer.classList.remove('phase-1', 'phase-2', 'phase-3');
    gameContainer.classList.add(currentPhase().cssClass);
    gameContainer.appendChild(sonicEl);
    gameContainer.appendChild(enemyEl);
    gameContainer.appendChild(phaseMessageEl);
    gameContainer.appendChild(startScreen);
    gameContainer.appendChild(endScreen);
    if (touchControlsEl) gameContainer.appendChild(touchControlsEl);

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

    patrolDir = 1;
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

    // Feedback visual: mostra "⚡ VELOCIDADE +" sobre o Robotnik
    showSpeedUpEffect();

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
    const phase = currentPhase();

    enemy.x = phase.enemyPatrolMaxX;
    enemy.y = phase.enemyPatrolY;
    patrolDir = -1;
}

// Robotnik sempre fica no ceu: nasce pela direita e patrulha na horizontal.
function updateEnemy(timeScale) {
    if (!gameActive) return;

    const phase = currentPhase();
    const baseSpeed = phase.enemySpeed * timeScale;

    enemy.x += patrolDir * baseSpeed;

    if (enemy.x <= phase.enemyPatrolMinX) {
        enemy.x = phase.enemyPatrolMinX;
        patrolDir = 1;
    } else if (enemy.x >= phase.enemyPatrolMaxX) {
        enemy.x = phase.enemyPatrolMaxX;
        patrolDir = -1;
    }

    enemy.y = phase.enemyPatrolY;
    updateEnemyPosition();
}

function updateBlasterShots(timeScale, timestamp) {
    if (!gameActive) return;

    const phase = currentPhase();

    if (phase.enemyCanShoot && timestamp - lastBlasterShot >= phase.blasterCooldown) {
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
    if (!currentPhase().enemyCanShoot) return;

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

// ========== Feedback Visual de Velocidade ==========
// Cria um popup animado "⚡ VELOCIDADE +" que aparece sobre o Robotnik
// sempre que o jogador avança de fase, indicando que o inimigo ficou mais rápido.
function showSpeedUpEffect() {
    const popup = document.createElement('div');
    popup.className = 'speed-up-popup';
    popup.textContent = '⚡ VELOCIDADE +';

    // Posiciona acima do Robotnik
    popup.style.left = enemy.x + 'px';
    popup.style.bottom = (enemy.y + enemy.height + 10) + 'px';

    gameContainer.appendChild(popup);

    // Remove o elemento do DOM quando a animação terminar (1.5s)
    popup.addEventListener('animationend', () => {
        if (popup.parentNode) popup.parentNode.removeChild(popup);
    });
}

function boxesOverlap(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

function checkCollisions() {
    if (!gameActive) return;

    const phase = currentPhase();
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

    if (phase.enemyCanDamage) {
        const enemyBounds = {
            x: enemy.x + 10,
            y: enemy.y + 8,
            width: enemy.width - 20,
            height: enemy.height - 16
        };

        if (boxesOverlap(sonicBounds, enemyBounds)) {
            handleDamage('Você encostou no Robotnik!');
            return;
        }
    }

    if (phase.enemyCanShoot) {
        for (let i = blasterShots.length - 1; i >= 0; i--) {
            if (boxesOverlap(sonicBounds, blasterShots[i])) {
                removeBlasterShot(i);
                handleDamage('Você foi atingido pelo blaster do Robotnik!');
                return;
            }
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
    initTouchControls();
};

// ========== Controles Touch para Mobile ==========
// Detecta dispositivos com tela sensível ao toque e exibe botões de controle.
// Cada botão simula o pressionamento/liberação de uma tecla no objeto global `keys`,
// permitindo que o gameLoop (via handleMovement) funcione sem alterações.
function initTouchControls() {
    const touchControls = document.getElementById('touch-controls');
    if (!touchControls) return;

    // Detecta se é um dispositivo touch (celular/tablet)
    if ('ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches) {
        touchControls.style.display = 'flex';
    }

    // Mapeia cada botão para a tecla correspondente
    const mapping = {
        'touch-left': 'arrowleft',
        'touch-right': 'arrowright',
        'touch-jump': 'arrowup'
    };

    Object.entries(mapping).forEach(([btnId, keyName]) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;

        // touchstart → simula tecla pressionada
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Previne scrolling da página
            keys[keyName] = true;
        }, { passive: false });

        // touchend → simula tecla liberada
        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            keys[keyName] = false;
        }, { passive: false });

        // touchcancel → garante que a tecla seja liberada se o touch for cancelado
        btn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            keys[keyName] = false;
        }, { passive: false });
    });
}

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
