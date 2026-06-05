# Sonic e as Escadas - Versao 2.0

Projeto didatico de jogo de plataformas feito com **HTML5, CSS3 e JavaScript Vanilla**. Nesta versao, o jogador precisa subir as plataformas, desviar dos espinhos, escapar dos tiros de blaster do Robotnik e vencer tres fases com dificuldade crescente.

## Jogabilidade e Regras

* **Objetivo:** pegar a moeda de cada fase para avancar; a moeda da fase 3 vence o jogo.
* **Tempo:** cada fase comeca com 40 segundos.
* **Vidas:** o jogador inicia com 4 vidas.
* **Colisoes:** tocar em um espinho ativo sempre retira 1 vida. Em todas as fases, tocar no corpo do Robotnik ou em um tiro de blaster tambem retira 1 vida.
* **Subida:** so e possivel subir para o proximo degrau pulando na borda direita da plataforma atual.
* **Dificuldade crescente:** Robotnik vem da direita, patrulha e dispara desde a fase 1. As fases seguintes aumentam velocidade, espinhos e agressividade.

## Controles

* **Pular / Subir degrau:** `W`, `Seta para Cima` ou `Espaco`
* **Mover para a direita:** `D` ou `Seta Direita`
* **Mover para a esquerda:** `A` ou `Seta Esquerda`

## Algoritmos Utilizados

### Robotnik no ceu e tiros de blaster

Em todas as fases, Robotnik nasce pelo lado direito e usa uma patrulha aerea simples entre `x=760` e `x=930`, em `y=650`. Ele dispara blaster e tira vida ao tocar no Sonic, mas nao fica em cima dos degraus nem da moeda.

Para disparar, Robotnik identifica a posicao do Sonic usando o centro do personagem como alvo:

```text
deltaX = sonicCentroX - robotnikCentroX
deltaY = sonicCentroY - robotnikCentroY
distancia = raiz(deltaX^2 + deltaY^2)
```

Depois disso, o vetor e normalizado para que o tiro voe na direcao correta sem depender de valores fixos para cima, baixo, esquerda ou direita. A velocidade vem da fase atual:

```text
tiroX += (deltaX / distancia) * velocidadeDoTiro
tiroY += (deltaY / distancia) * velocidadeDoTiro
```

Na fase 1, a velocidade de patrulha e `1.25`. Na fase 2, a velocidade da patrulha passa para `2.0`. Na fase 3, ela passa para `3.2`, tornando o final mais dificil sem tirar Robotnik do ceu.

Os tiros de blaster ficam ativos desde a fase 1. Eles usam vetor normalizado: o jogo cria um projetil na posicao do Robotnik, calcula a direcao ate o Sonic e move o tiro lentamente. Na fase 1 o tiro se move com velocidade `2.4`, na fase 2 com `3.1` e na fase 3 com `4.0`. Cada tiro que acerta o Sonic retira uma vida.

### Sistema de fases

O jogo possui uma lista de configuracoes chamada `PHASES`. Cada fase define:

* numero da fase;
* classe visual do cenario;
* degraus que recebem espinhos;
* modo do Robotnik: patrulha aerea;
* permissao para Robotnik causar dano e disparar;
* velocidade do Robotnik;
* velocidade e intervalo dos tiros de blaster;
* intervalo de ativacao/desativacao dos espinhos.

Quando o jogador coleta a moeda, o jogo incrementa `phaseIndex`, recria o mundo com a configuracao da proxima fase, mostra uma mensagem de mudanca de fase e reinicia o cronometro para 40 segundos. Quando a moeda e coletada na fase 3, o jogo termina com vitoria.

### Sistema de vidas e colisao

As colisoes usam AABB (*Axis-Aligned Bounding Box*), comparando os retangulos do Sonic, dos espinhos, da moeda, do corpo do Robotnik e dos tiros de blaster. Quando ha colisao com perigo:

* o jogo verifica se o Sonic esta invulneravel;
* se nao estiver, subtrai 1 vida;
* se vidas ainda forem maiores que 0, o Sonic volta ao inicio da fase;
* se vidas chegarem a 0, o jogo mostra Game Over.

A invulnerabilidade temporaria evita que uma unica colisao seja contada varias vezes seguidas.

## Demonstracao Pratica

1. Abra `index.html` no navegador.
2. Clique em **Comecar Jogo**.
3. Mostre o HUD com pontos, tempo, fase e vidas.
4. Na fase 1, mostre o Robotnik vindo da direita, patrulhando, atirando e causando dano ao encostar.
5. Pegue a moeda da fase 1 para demonstrar a troca automatica de fase.
6. Na fase 2 e na fase 3, mostre o Robotnik com a mesma patrulha pelo ceu, sem ficar em cima dos degraus nem da moeda.
7. Encoste em um espinho, no Robotnik ou em um tiro para mostrar a perda de vida e o respawn.
8. Avance ate a fase 3 e pegue a moeda final para vencer.

## Como Executar

O projeto e estatico e nao precisa de instalacao de dependencias.

1. Abra a pasta do projeto.
2. Execute o arquivo `index.html` em um navegador moderno.

## Tecnologias

* **HTML5:** estrutura do jogo, HUD, telas de inicio/fim e elementos principais.
* **CSS3:** cenario, sprites, Robotnik visual, tiros de blaster, animacoes e estados de fase.
* **JavaScript:** loop principal, movimento continuo, fisica de pulo, Robotnik voador, tiros de blaster, fases, temporizador, vidas e colisoes.

## Autores

Desenvolvido por **Roberto Atila** e **Pietro Ferreira**.
