# Abstração Crítica de Elementos do Jogo - Sonic e as Escadas 🦔🪜

Este documento contém uma análise estruturada e crítica dos elementos que constituem o jogo **Sonic e as Escadas**, distinguindo o que é indispensável para o núcleo mecânico da simulação daquilo que serve como camada de balanceamento, estética ou usabilidade (UX).

## Tabela de Abstração

| Elementos do Jogo | Essencial? | Por quê? |
| :--- | :---: | :--- |
| **1. Avatar do Jogador (Sonic)** | **Sim** | Representa o vetor de agência do jogador no mundo digital. Sem um corpo físico simulado sujeito a controles (inputs) e colisões, não há interatividade, o que anula a própria definição de jogo, tornando-o uma animação passiva. |
| **2. Degraus / Plataformas Flutuantes** | **Sim** | Constituem o *level design* espacial e a topologia do jogo. Sem as 8 plataformas, não existe o percurso vertical que caracteriza o gênero de plataforma, e o avatar não teria superfície onde colidir e repousar. |
| **3. Mecânica de Escalada (Climb Jump)** | **Sim** | É o mecanismo central de progressão vertical. O jogo impede que o jogador suba apenas andando em direção à parede lateral; exige o posicionamento na extremidade direita do degrau seguido do pulo coordenado para engajar a parábola programada. Sem ela, o jogo é mecanicamente impossível de ser concluído. |
| **4. Moeda de Ouro Final (Objetivo)** | **Sim** | Funciona como o gatilho da condição de vitória. Sem ela, o jogador alcançaria o último degrau (degrau 7) sem um objetivo finalizador ou recompensa tangível, quebrando o ciclo de *gameplay loop* e impedindo a conclusão formal do jogo. |
| **5. Movimento Horizontal Contínuo** | **Sim** | Permite ao jogador navegar lateralmente pelo degrau atual para desviar de perigos e posicionar-se estrategicamente no gatilho de escalada. Sem este grau de liberdade horizontal, o jogador estaria estático, impossibilitado de alcançar o local correto para a subida. |
| **6. Física de Pulo Normal (Normal Jump)** | **Não** | O pulo livre vertical com gravidade (`gravity = -0.8`) serve como mecânica secundária de mitigação de risco para esquivar dos espinhos no mesmo degrau. O jogo seria tecnicamente vencível sem ele se o jogador usasse apenas o tempo correto (*timing*) de corrida horizontal quando o espinho estivesse inativo. |
| **7. Espinhos Dinâmicos (Obstáculos)** | **Não** | Embora sejam o coração do desafio e criem tensão com seu temporizador de ativação/desativação (900ms), o jogo mecanicamente funcionaria e seria vencível sem eles (apenas seria trivial). Eles são cruciais para o engajamento e a curva de dificuldade, mas não para a integridade do ciclo de movimentação básica. |
| **8. Cronômetro (Limite de 30s)** | **Não** | Adiciona pressão psicológica e ritmo dinâmico, forçando decisões rápidos contra o ciclo dos espinhos. Todavia, a remoção do temporizador não impede o funcionamento técnico do jogo nem a capacidade de vencer, sendo um acessório de balanceamento e dificuldade. |
| **9. Sistema de Pontuação (Score)** | **Não** | É uma ferramenta de feedback quantitativo e incentivo à repetição (*replayability*). O core loop de subir e pegar a moeda continua idêntico se os pontos ganhos ao progredir degraus (+10) ou ao coletar a moeda (+50) fossem ocultados ou excluídos. |
| **10. Sprites e Texturas Visuais (`prota.jfif`, `moeda.png`, `spike.png`)** | **Não** | São puramente cosméticos (a "pele" estética do software). A engine lógica e matemática de colisão baseada em AABB (caixas delimitadoras) operaria perfeitamente se o Sonic, a moeda e os espinhos fossem representados por formas geométricas rudimentares ou blocos de cor sólida. |
| **11. Telas de Menu / Transição (Overlays)** | **Não** | Servem para suavizar o fluxo de experiência do usuário (UX) ao separar os estados de preparação, jogo ativo, derrota e vitória. Tecnicamente, o jogo poderia iniciar imediatamente e dar F5 (recarregamento forçado) na morte, tornando as telas acessórios úteis, mas estruturalmente dispensáveis para a lógica interna de gameplay. |

---

## Conclusão da Análise Crítica
Ao abstrair o jogo a nível de código de sistema, percebemos que o núcleo irredutível do projeto é composto por **apenas 5 elementos essenciais** (Avatar, Degraus, Escalada, Moeda e Movimento Horizontal). Os outros **6 elementos não-essenciais** são, na verdade, ferramentas de design que transformam uma simulação física simples em uma experiência de jogo divertida, desafiadora, punitiva e visualmente familiar ao jogador.
