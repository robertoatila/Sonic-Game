// script.js

let sonicX = 10;
let sonicY = 75;
let jumpY = 0; // Altura relativa do pulo

let currentStep = 0;
let maxStepReached = 0;
let score = 0;
let timeLeft = 30;

let gameActive = false;
let isJumping = false;
let isClimbing = false;
let timerInterval;

// NOVAS VARIÁVEIS PARA MOVIMENTO CONTÍNUO
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
let coinBounds = null; // Guardar a posição da moeda
let coinEl = null;

const gameContainer = document.getElementById('game-container');
const sonicEl = document.getElementById('sonic');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const startScreen = document.getElementById('start-screen');
const endScreen = document.getElementById('end-screen');
const endTitle = document.getElementById('end-title');
const endMessage = document.getElementById('end-message');

// Constrói o mundo inicial (degraus e obstáculos) e reseta status
function buildWorld() {
    // Remove tudo do container, menos o Sonic, as telas de menu e etc
    // É mais fácil recriar tudo e adicionar novamente os painéis estáticos
    gameContainer.innerHTML = '';
    gameContainer.appendChild(sonicEl);
    gameContainer.appendChild(startScreen);
    gameContainer.appendChild(endScreen);
    obstacles.length = 0;
    
    // Configurações e limites iniciais
    sonicX = 10;
    sonicY = 75; // Altura do primeiro degrau
    jumpY = 0;
    currentStep = 0;
    maxStepReached = 0;
    score = 0;
    timeLeft = 30;
    gameActive = false;
    isJumping = false;
    isClimbing = false;
    
    updateSonicPosition();
    updateScore();
    timeEl.innerText = timeLeft;
    sonicEl.style.backgroundImage = "url('prota.jfif')";
    
    // Geração do Cenário com plataformas voadoras (estilo Kong Run)
    for (let i = 0; i < 8; i++) {
        let degrau = document.createElement('div');
        degrau.className = 'degrau';
        degrau.style.left = (i * 150) + 'px';
        // A base do degrau fica um pouco abaixo para a grama ficar exatamente onde o Sonic pisa
        degrau.style.bottom = ((i * 75) + 35) + 'px';
        degrau.style.width = '150px';
        degrau.style.height = '40px'; // Altura fixa de plataforma flutuante
        gameContainer.appendChild(degrau);
        
        // Espinhos nos degraus 2, 4 e 6 (lembrando que começa no 0, então i=2 é o 3º visualmente)
        if (i === 2 || i === 4 || i === 6) {
            let spike = document.createElement('div');
            spike.className = 'spike';
            // Posiciona no meio do degrau atual
            let spikeX = (i * 150) + (150 / 2) - 15; 
            let spikeY = (i * 75) + 75; 
            spike.style.left = spikeX + 'px';
            spike.style.bottom = spikeY + 'px';
            gameContainer.appendChild(spike);
            
            obstacles.push({ x: spikeX, y: spikeY, width: 30, height: 30 });
        }
    }
    
    // Adiciona a Moeda no último degrau (índice 7)
    let coinX = (7 * 150) + (150 / 2) - 20; // Centralizado no último degrau
    let coinY = (7 * 75) + 75 + 15; // Flutuando um pouco acima do chão
    coinEl = document.createElement('div');
    coinEl.className = 'coin';
    coinEl.style.left = coinX + 'px';
    coinEl.style.bottom = coinY + 'px';
    gameContainer.appendChild(coinEl);
    
    coinBounds = { x: coinX, y: coinY, width: 40, height: 40 };
}

// Inicia o Jogo (Botão "Começar Jogo")
function startGame() {
    startScreen.style.display = 'none';
    gameActive = true;
    lastTime = performance.now();
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (!gameActive) return;
        timeLeft--;
        timeEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            endGame(false, "O tempo acabou!");
        }
    }, 1000);
}

// Volta ao estado inicial a partir do End Screen
function resetToStart() {
    endScreen.style.display = 'none';
    startScreen.style.display = 'flex';
    buildWorld();
}

// Atualiza a posição CSS do Sonic
function updateSonicPosition() {
    sonicEl.style.left = sonicX + 'px';
    sonicEl.style.bottom = (sonicY + jumpY) + 'px';
}

function updateScore() {
    scoreEl.innerText = score;
}

// Função de Vitória ou Derrota
function endGame(win, message) {
    if (!gameActive) return;
    gameActive = false;
    clearInterval(timerInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    if (win) {
        endTitle.innerText = "Você Venceu!";
        endTitle.style.color = "#2ecc71";
    } else {
        endTitle.innerText = "Game Over!";
        endTitle.style.color = "#e74c3c";
    }
    
    endMessage.innerText = message;
    endScreen.style.display = 'flex';
}

// Colisão com espinhos
function checkCollisions() {
    if (!gameActive) return;
    
    let sX = sonicX;
    let sY = sonicY + jumpY;
    let sW = 40;
    let sH = 40;
    
    // Checa colisão com a moeda (Vitória)
    if (coinBounds && currentStep === 7) {
        if (sX < coinBounds.x + coinBounds.width &&
            sX + sW > coinBounds.x &&
            sY < coinBounds.y + coinBounds.height &&
            sY + sH > coinBounds.y) {
            
            coinEl.style.display = 'none'; // Esconde a moeda
            coinBounds = null; // Evita múltiplas colisões
            score += 50; // Bônus Extra
            updateScore();
            endGame(true, "Parabéns, você pegou a moeda e venceu!");
            return;
        }
    }
    
    // Checa colisão com espinhos (Derrota)
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        if (sX < obs.x + obs.width &&
            sX + sW > obs.x &&
            sY < obs.y + obs.height &&
            sY + sH > obs.y) {
            endGame(false, "Você tocou em um espinho mortal!");
        }
    }
}

// --- NOVO SISTEMA DE MOVIMENTO CONTÍNUO ---

// Captura as teclas pressionadas e soltas
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = true;
    keys[e.code] = true;
    // Impede rolagem da página com o espaço ou setas para cima
    if (e.code === 'Space' || key === 'arrowup') e.preventDefault();
});
document.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
    keys[e.code] = false;
});

// O Game Loop roda a 60 frames por segundo (se possível) para manter movimento suave
function gameLoop(timestamp) {
    if (!gameActive) return;
    
    if (!lastTime) lastTime = timestamp;
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Previne saltos bizarros se o jogador mudar de aba
    if (deltaTime > 100) deltaTime = 16.66;
    
    let timeScale = deltaTime / 16.66; // Multiplicador de velocidade baseado no FPS
    
    handleMovement(timeScale);
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

// Processa o movimento baseado nas teclas que estão sendo SEGURADAS
function handleMovement(timeScale) {
    if (!isClimbing) {
        // Movimento Horizontal Contínuo (mesmo pulando)
        if (keys['arrowright'] || keys['d'] || keys['KeyD']) {
            let stepMaxX = (currentStep * 150) + 150 - 40; 
            sonicX += 6 * timeScale; // Velocidade suave
            if (sonicX > stepMaxX) {
                if (isJumping && jumpY >= 60 && currentStep < 7) {
                    currentStep++;
                    sonicY += 75;
                    jumpY -= 75;
                    if (currentStep > maxStepReached) {
                        score += 10;
                        maxStepReached = currentStep;
                        updateScore();
                    }
                } else {
                    sonicX = stepMaxX; 
                }
            }
        }
        if (keys['arrowleft'] || keys['a'] || keys['KeyA']) {
            let stepMinX = currentStep * 150;
            sonicX -= 6 * timeScale;
            if (sonicX < stepMinX) {
                if (currentStep > 0) {
                    currentStep--;
                    sonicY -= 75;
                    jumpY += 75;
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
        
        // Inicialização de Pulo
        if ((keys['arrowup'] || keys['w'] || keys['space'] || keys['Space'] || keys['KeyW']) && !isJumping) {
            let stepMaxX = (currentStep * 150) + 150 - 40;
            let isHoldingLeft = keys['arrowleft'] || keys['a'] || keys['KeyA'];
            if (sonicX >= stepMaxX - 5 && !isHoldingLeft) {
                // Inicia pulo longo (transição de degrau)
                isClimbing = true;
                climbProgress = 0;
                startX = sonicX;
                targetX = (currentStep + 1) * 150 + 10;
                diffX = targetX - startX;
                sonicEl.style.backgroundImage = "url('jump.png')";
            } else {
                // Inicia pulo normal
                isJumping = true;
                jumpVelocity = 14; // Força inicial para cima
                sonicEl.style.backgroundImage = "url('jump.png')";
            }
        }
    }

    // Física do Pulo Normal
    if (isJumping && !isClimbing) {
        jumpY += jumpVelocity * timeScale;
        jumpVelocity += gravity * timeScale; // Gravidade puxando pra baixo
        
        // Pouso
        if (jumpY <= 0) {
            jumpY = 0;
            isJumping = false;
            sonicEl.style.backgroundImage = "url('prota.jfif')";
        }
    }
    
    // Animação do Pulo de Escalada (Scriptado)
    if (isClimbing) {
        // O pulo leva mais ou menos 30 frames (0.033 por frame)
        climbProgress += 0.033 * timeScale;
        if (climbProgress > 1) climbProgress = 1;
        
        let t = climbProgress;
        sonicX = startX + (diffX * t);
        
        // Equação parabólica para fazer a curva perfeita do salto: Max de 120, aterrissa em 75
        jumpY = -330 * t * t + 405 * t;
        
        if (climbProgress >= 1) {
            isClimbing = false;
            jumpY = 0; 
            sonicY += 75; 
            currentStep++;
            sonicX = targetX; 
            
            if (currentStep > maxStepReached) {
                score += 10;
                maxStepReached = currentStep;
                updateScore();
            }
            
            sonicEl.style.backgroundImage = "url('prota.jfif')";
            // A condição de vitória automática foi removida daqui, agora depende de pegar a moeda!
        }
    }
    
    updateSonicPosition();
    checkCollisions();
}

// Ao carregar a página, inicializa o mundo (mas não solta o timer ainda)
window.onload = () => {
    buildWorld();
    resizeGame();
};

// Lógica para redimensionar dinamicamente e caber tudo na tela sem rolagem
function resizeGame() {
    const wrapper = document.getElementById('game-wrapper');
    if (!wrapper) return;
    
    // Dimensões originais necessárias para caber o container e a HUD com folga
    const baseWidth = 1250;
    const baseHeight = 850; 
    
    const scaleX = window.innerWidth / baseWidth;
    const scaleY = window.innerHeight / baseHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Nunca amplia além de 100% para não perder qualidade, apenas reduz
    
    wrapper.style.transform = `scale(${scale})`;
}

// Redimensionar caso o usuário mude o tamanho da janela
window.addEventListener('resize', resizeGame);
