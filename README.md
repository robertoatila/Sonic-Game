# Sonic e as Escadas 🦔🪜

Um projeto didático de um jogo de plataformas desenvolvido inteiramente com **HTML5, CSS3 e JavaScript (Vanilla)**. O jogo desafia o jogador a guiar a personagem até ao topo de uma escadaria de plataformas flutuantes, desviando-se de obstáculos mortais e apanhando a moeda final num limite de 30 segundos.

## 🎮 Jogabilidade e Regras

* **Mecânica de Subida:** Só é possível subir para o próximo degrau se o jogador saltar quando estiver posicionado na extremidade direita do degrau atual. Não é possível subir simplesmente correndo contra a parede da plataforma.
* **Obstáculos:** O caminho contém espinhos mortais nos degraus 2, 4 e 6. Tocar neles resulta em *Game Over* imediato.
* **Vitória:** Chegar ao último degrau (8º) e apanhar a moeda dourada antes que o cronómetro chegue a zero.
* **Tempo:** O jogador tem exatamente 30 segundos para concluir o desafio.

## ⌨️ Controlos

* **Saltar / Subir Degrau:** `W`, `Seta para Cima (↑)` ou `Espaço`
* **Mover para a Direita:** `D` ou `Seta Direita (→)`
* **Mover para a Esquerda:** `A` ou `Seta Esquerda (←)`

## 🚀 Como Executar o Projeto

Como se trata de um projeto *front-end* estático, não é necessário instalar dependências ou servidores complexos.

1.  Faça o clone do repositório para a sua máquina local:
    ```bash
    git clone [https://github.com/robertoatila/Sonic-Game.git](https://github.com/robertoatila/Sonic-Game.git)
    ```
2.  Navegue até à pasta do projeto e abra o ficheiro `index.html` no seu navegador web preferido.

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Estrutura semântica do jogo, contentores principais, ecrã de início e ecrã de fim.
* **CSS3:** Estilização retro com *pixel art*, animações em *keyframes* (como o movimento da moeda) e posicionamento absoluto para a renderização da HUD e do cenário.
* **JavaScript (ES6):**
    * Lógica central do jogo orientada a eventos.
    * Ciclo de jogo contínuo (*Game Loop*) a 60 FPS utilizando `requestAnimationFrame` para uma movimentação suave.
    * Sistema de deteção de colisões (AABB - *Axis-Aligned Bounding Box*) para os espinhos e para a moeda.
    * Física de saltos baseada em cálculos de velocidade, gravidade e equações parabólicas para criar transições precisas entre os degraus.

## 👨‍💻 Autor

Desenvolvido por **Roberto Átila e Pietro Ferreira**.
