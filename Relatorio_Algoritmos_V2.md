# ALGORITMO – EVOLUÇÃO DO JOGO – VERSÃO 2.0

**Disciplina:** Algoritmos  
**Instituição:** ETEC  
**Projeto:** Sonic e as Escadas — Jogo de Plataforma em HTML/CSS/JS  
**Equipe:** [NOME 1], [NOME 2], [NOME 3]  
**Turma:** [TURMA]  
**Data:** Junho de 2026

---

## BLOCO 1: Inimigo Inteligente

### Pergunta 1: Como o inimigo identifica a posição do jogador?

O inimigo (Robotnik) identifica a posição do Sonic calculando a **distância euclidiana** entre os centros dos dois personagens. Essa técnica usa o Teorema de Pitágoras para medir a distância real entre dois pontos num plano 2D, considerando tanto a diferença horizontal quanto vertical.

**Trecho de código relevante (`script.js` — função `updateEnemy`):**

```javascript
// Passo 1: Calcular centros dos personagens
const sonicCenterX = sonicX + (SONIC_SIZE / 2);
const sonicCenterY = sonicY + jumpY + (SONIC_SIZE / 2);
const enemyCenterX = enemy.x + (enemy.width / 2);
const enemyCenterY = enemy.y + (enemy.height / 2);

// Passo 2: Calcular distância euclidiana
const deltaX = sonicCenterX - enemyCenterX;
const deltaY = sonicCenterY - enemyCenterY;
const distance = Math.hypot(deltaX, deltaY);
```

**Explicação passo a passo:**

1. `sonicCenterX` e `sonicCenterY` calculam o centro do Sonic somando metade do tamanho (`SONIC_SIZE / 2`) à posição do canto. A variável `jumpY` é incluída para considerar quando o Sonic está no ar.
2. `enemyCenterX` e `enemyCenterY` fazem o mesmo para o Robotnik.
3. `deltaX` e `deltaY` são as diferenças horizontal e vertical entre os centros.
4. `Math.hypot(deltaX, deltaY)` calcula √(deltaX² + deltaY²), ou seja, a distância real em pixels entre os dois personagens.

Essa abordagem é mais precisa que simplesmente comparar posições X e Y separadamente, porque considera a distância diagonal.

---

### Pergunta 2: Quais decisões o algoritmo toma?

O algoritmo utiliza uma **Máquina de Estados Finita** com 3 estados que determinam o comportamento do Robotnik baseado na distância calculada:

| Estado | Condição | Comportamento |
| -------- | ---------- | --------------- |
| `PATROL` | distância > 500px | Patrulha horizontal, sem perseguição |
| `CHASE` | 200 ≤ distância ≤ 500px | Perseguição direta ao Sonic |
| `ATTACK` | distância < 200px | Investida rápida com cooldown |

**Trecho de código relevante:**

```javascript
// Passo 3: Determinar estado com base na distância
if (distance > 500) {
    enemyState = 'PATROL';
} else if (distance >= 200) {
    enemyState = 'CHASE';
} else {
    enemyState = 'ATTACK';
}

// Passo 4: Executar comportamento
switch (enemyState) {
    case 'PATROL':
        // Anda horizontalmente e inverte direção a cada ~120 frames
        patrolTimer += timeScale;
        if (patrolTimer > 120) {
            patrolDir *= -1;
            patrolTimer = 0;
        }
        enemy.x += patrolDir * baseSpeed;
        break;

    case 'CHASE':
        // Persegue diretamente o Sonic normalizando o vetor direção
        enemy.x += (deltaX / distance) * baseSpeed;
        enemy.y += (deltaY / distance) * baseSpeed;
        break;

    case 'ATTACK':
        // Investida com velocidade ×1.8 e cooldown de ~1.2s
        if (attackCooldown <= 0) {
            const attackSpeed = baseSpeed * 1.8;
            enemy.x += (deltaX / distance) * attackSpeed;
            enemy.y += (deltaY / distance) * attackSpeed;
            attackCooldown = 72; // ~1.2s a 60fps
        } else {
            // Recua levemente durante o cooldown
            attackCooldown -= timeScale;
            enemy.x -= (deltaX / distance) * baseSpeed * 0.3;
        }
        break;
}
```

**Decisões algorítmicas importantes:**

- **Normalização do vetor**: `deltaX / distance` cria um vetor unitário (comprimento 1), garantindo que o inimigo se mova na direção correta independente da distância.
- **Cooldown no ATTACK**: Evita que o Robotnik seja invencível; dá ao jogador uma janela de ~1.2 segundos para escapar após cada investida.
- **Clamp**: `clamp(enemy.x, 0, GAME_WIDTH - enemy.width)` impede que o Robotnik saia dos limites do mapa.

---

### Pergunta 3: Quais variáveis são necessárias?

| Variável | Tipo | Descrição |
| ---------- | ------ | ----------- |
| `enemyState` | `string` | Estado atual: `'PATROL'`, `'CHASE'` ou `'ATTACK'` |
| `patrolDir` | `number` | Direção da patrulha: `1` (direita) ou `-1` (esquerda) |
| `patrolTimer` | `number` | Contador de frames para inverter a direção |
| `attackCooldown` | `number` | Frames restantes antes de nova investida |
| `enemy.x`, `enemy.y` | `number` | Posição atual do Robotnik no mapa |
| `enemy.width`, `enemy.height` | `number` | Dimensões para cálculo de centro e colisão |
| `currentPhase().enemySpeed` | `number` | Velocidade base que muda por fase |
| `sonicX`, `sonicY`, `jumpY` | `number` | Posição do Sonic em tempo real |
| `timeScale` | `number` | Fator de normalização para framerate independente |

**Velocidade por fase:**

- Fase 1: `enemySpeed = 1.25`
- Fase 2: `enemySpeed = 2.0`
- Fase 3: `enemySpeed = 3.2`

---

## BLOCO 2: Sistema de Fases

### Pergunta 1: Qual evento faz o jogo mudar de fase?

O evento que dispara a mudança de fase é a **colisão entre o Sonic e a moeda dourada** posicionada no último degrau (step 7, o degrau mais alto da escada).

**Trecho de código (`checkCollisions`):**

```javascript
function checkCollisions() {
    const sonicBounds = {
        x: sonicX,
        y: sonicY + jumpY,
        width: SONIC_SIZE,
        height: SONIC_SIZE
    };

    // Verifica se Sonic está no último degrau E colidiu com a moeda
    if (coinBounds && currentStep === STEP_COUNT - 1 && boxesOverlap(sonicBounds, coinBounds)) {
        collectCoin();  // ← AQUI dispara a mudança de fase
        return;
    }
}
```

**Explicação:** A função `boxesOverlap()` implementa a detecção de colisão AABB (Axis-Aligned Bounding Box), verificando se dois retângulos se sobrepõem comparando suas bordas:

```javascript
function boxesOverlap(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}
```

A condição `currentStep === STEP_COUNT - 1` garante que a moeda só pode ser coletada no topo da escada.

---

### Pergunta 2: O que acontece quando a fase muda?

A função `collectCoin()` executa uma sequência de ações:

```javascript
function collectCoin() {
    coinEl.style.display = 'none';   // 1. Esconde a moeda coletada
    coinBounds = null;                // 2. Remove hitbox da moeda
    score += 50;                      // 3. Adiciona 50 pontos

    // Se for a última fase, o jogador venceu
    if (phaseIndex === PHASES.length - 1) {
        endGame(true, 'Parabéns, você pegou a moeda final e venceu!');
        return;
    }

    phaseIndex++;                     // 4. Avança o índice no array PHASES
    showSpeedUpEffect();              // 5. Mostra "⚡ VELOCIDADE +" sobre o Robotnik
    maxStepReached = 0;               // 6. Reseta progresso da escada
    timeLeft = LEVEL_TIME;            // 7. Reinicia o timer (40 segundos)
    buildWorld();                     // 8. Reconstrói TODA a cena
    startSpikeCycle();                // 9. Inicia novo ciclo de espinhos
    setInvulnerable();                // 10. Dá 2.2s de invulnerabilidade
    showPhaseMessage(currentPhase().message);  // 11. Exibe texto de transição
}
```

**Detalhes de `buildWorld()`:**

1. Remove todos os elementos do `#game-container`
2. Troca a classe CSS (`phase-1` → `phase-2` → `phase-3`)
3. Recria plataformas (degraus), espinhos e moeda com os parâmetros da nova fase
4. Reposiciona o Sonic e o Robotnik

---

### Pergunta 3: Como a dificuldade é aumentada?

A dificuldade cresce em **4 eixos**, todos configurados no array `PHASES`:

```javascript
const PHASES = [
    { // Fase 1
        spikeSteps: [3, 6],           // 2 espinhos
        enemySpeed: 1.25,              // Robotnik lento
        blasterSpeed: 2.4,             // Tiro lento
        blasterCooldown: 3000,         // Dispara a cada 3s
        spikeToggleInterval: 1300      // Espinhos piscam devagar
    },
    { // Fase 2
        spikeSteps: [2, 4, 6],        // 3 espinhos
        enemySpeed: 2.0,               // Robotnik 60% mais rápido
        blasterSpeed: 3.1,             // Tiro mais rápido
        blasterCooldown: 3000,         // Ainda 3s
        spikeToggleInterval: 1000      // Espinhos piscam mais rápido
    },
    { // Fase 3
        spikeSteps: [1, 3, 5, 7],     // 4 espinhos (quase todos os degraus!)
        enemySpeed: 3.2,               // Robotnik 2.56× mais rápido que fase 1
        blasterSpeed: 4.0,             // Tiro muito rápido
        blasterCooldown: 1800,         // Dispara a cada 1.8s (quase 2× mais)
        spikeToggleInterval: 700       // Espinhos piscam muito rápido
    }
];
```

**Tabela comparativa de progressão:**

| Parâmetro | Fase 1 | Fase 2 | Fase 3 | Efeito |
| ----------- | -------- | -------- | -------- | -------- |
| `enemySpeed` | 1.25 | 2.0 | 3.2 | Robotnik mais rápido |
| `blasterSpeed` | 2.4 | 3.1 | 4.0 | Projéteis mais velozes |
| `blasterCooldown` | 3000ms | 3000ms | 1800ms | Tiros mais frequentes |
| `spikeToggleInterval` | 1300ms | 1000ms | 700ms | Espinhos piscam mais rápido |
| `spikeSteps` | 2 espinhos | 3 espinhos | 4 espinhos | Mais obstáculos |

**Princípio algorítmico:** A dificuldade é controlada por **dados**, não por código diferente. A mesma lógica (`updateEnemy`, `updateBlasterShots`, `startSpikeCycle`) é executada em todas as fases — o que muda são os **parâmetros numéricos** no array `PHASES`. Isso é um exemplo do princípio de **separação entre dados e lógica**, fundamental em programação.

---

## Conclusão

O desenvolvimento deste projeto nos permitiu aplicar diversos conceitos de algoritmos e lógica de programação de forma prática:

1. **Máquina de Estados Finita**: O inimigo inteligente demonstra como decisões algorítmicas podem criar comportamentos complexos a partir de regras simples. Cada estado (PATROL, CHASE, ATTACK) é uma "decisão" do algoritmo baseada em dados numéricos.

2. **Matemática aplicada**: O uso de `Math.hypot()` para distância euclidiana e normalização de vetores mostra como conceitos matemáticos do ensino médio (Teorema de Pitágoras, vetores unitários) são diretamente aplicados em programação de jogos.

3. **Separação dados/lógica**: O sistema de fases usa um array de configuração (`PHASES`) para controlar a dificuldade, demonstrando que bons algoritmos operam sobre dados — facilitando manutenção e extensão (bastou adicionar um objeto ao array para criar a Fase 3).

4. **Detecção de colisão AABB**: A função `boxesOverlap()` implementa o algoritmo clássico de interseção de retângulos, usado profissionalmente em engines de jogos como Unity e Godot.

5. **Controle de framerate**: A variável `timeScale` normaliza o movimento para funcionar independente da taxa de frames do computador, conceito essencial em desenvolvimento de jogos.

O projeto demonstra que jogos, mesmo simples, são excelentes ferramentas para o aprendizado de algoritmos, pois combinam lógica condicional, estruturas de dados, matemática e engenharia de software num contexto visual e interativo.
