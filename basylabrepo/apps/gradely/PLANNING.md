# Gradely - Sistema de Horários Escolares

> "Monte o horário escolar perfeito em minutos, não em dias."

---

## 1. Visão Geral

### O Problema

Coordenadores e diretores de escolas passam **dias ou semanas** montando horários manualmente. O processo envolve:

- Conciliar disponibilidade de dezenas de professores
- Respeitar carga horária de cada disciplina por turma
- Evitar conflitos (mesmo professor em duas salas)
- Considerar restrições físicas (labs, quadras, salas especiais)
- Refazer tudo quando algo muda
- **Professores ficam com "janelas" (horários vagos entre aulas)**

### A Solução

**Gradely** é um sistema web que automatiza a geração de horários escolares usando algoritmos avançados de otimização. O sistema não apenas gera horários válidos, mas busca o **horário ótimo** que:

- Minimiza janelas dos professores
- Compacta a jornada de cada docente
- Distribui aulas de forma equilibrada
- Respeita todas as restrições pedagógicas

### Público-Alvo

- Diretores de escolas
- Coordenadores pedagógicos
- Secretarias de educação (redes de escolas)

### Diferencial Competitivo

A maioria dos sistemas apenas gera "um horário válido". O **Gradely** gera o **melhor horário possível**, otimizando múltiplos objetivos simultaneamente através de algoritmos genéticos e busca local.

---

## 2. Checklist de Aprovação

- [ ] **Parte 1**: Visão Geral
- [ ] **Parte 2**: Entidades e Cadastros
- [ ] **Parte 3**: Regras e Restrições
- [ ] **Parte 4**: Algoritmo de Geração (Avançado)
- [ ] **Parte 5**: Interface e Experiência
- [ ] **Parte 6**: Modelo de Negócio
- [ ] **Parte 7**: Stack Técnica
- [ ] **Parte 8**: Roadmap de Desenvolvimento

---

## 3. Entidades e Cadastros

### 3.1 Escola

A entidade raiz do sistema. Cada escola tem suas próprias configurações.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| nome | string | Nome da escola |
| turnos | enum[] | Manhã, Tarde, Noite |
| dias_semana | enum[] | Seg, Ter, Qua, Qui, Sex, Sab |
| duracao_aula | number | Duração em minutos (ex: 50) |
| intervalo | number | Duração do intervalo em minutos |
| aulas_por_turno | number | Quantidade de aulas por turno (ex: 5) |
| horario_inicio | time | Horário de início do primeiro turno |

**Exemplo:**
```
Escola Municipal João da Silva
- Turnos: Manhã (7h-12h), Tarde (13h-18h)
- Dias: Segunda a Sexta
- Aulas por turno: 5 aulas de 50 min
- Intervalo: 20 min (após 3ª aula)
```

---

### 3.2 Ano Letivo

Permite manter histórico e separar configurações por ano.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| escola_id | UUID | FK para escola |
| ano | number | Ex: 2025, 2026 |
| status | enum | Planejamento, Ativo, Arquivado |
| data_inicio | date | Início do ano letivo |
| data_fim | date | Fim do ano letivo |

---

### 3.3 Professor

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| escola_id | UUID | FK para escola |
| nome | string | Nome completo |
| email | string | Email (opcional, para login) |
| telefone | string | Telefone (opcional) |
| carga_horaria_max | number | Máximo de aulas por semana |
| carga_horaria_min | number | Mínimo de aulas por semana (contrato) |
| prioridade | number | 1-10, professores mais antigos/importantes primeiro |
| ativo | boolean | Se está ativo na escola |

---

### 3.4 Disciplina

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| escola_id | UUID | FK para escola |
| nome | string | Ex: Matemática, Português |
| abreviacao | string | Ex: MAT, PORT (para grade) |
| cor | string | Cor hex para visualização |
| peso_cognitivo | enum | Leve, Médio, Pesado (para distribuição) |
| requer_sala_tipo | enum | Regular, Laboratório, Quadra, etc. |

---

### 3.5 Turma

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| ano_letivo_id | UUID | FK para ano letivo |
| nome | string | Ex: 6º A, 9º B, 1º EM |
| turno | enum | Manhã, Tarde, Noite |
| sala_fixa_id | UUID | FK para sala (opcional) |
| qtd_alunos | number | Quantidade de alunos |
| nivel | enum | Fundamental I, Fundamental II, Médio |

---

### 3.6 Sala

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| escola_id | UUID | FK para escola |
| nome | string | Ex: Sala 101, Lab. Informática |
| capacidade | number | Quantidade máxima de alunos |
| tipo | enum | Regular, Laboratório, Quadra, Auditório |
| recursos | string[] | Ex: ["projetor", "ar-condicionado"] |
| turnos_disponiveis | enum[] | Em quais turnos a sala está disponível |

---

### 3.7 Vinculação Professor-Disciplina-Turma

Define quem ensina o quê para quem, e quantas aulas por semana.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| ano_letivo_id | UUID | FK para ano letivo |
| professor_id | UUID | FK para professor |
| disciplina_id | UUID | FK para disciplina |
| turma_id | UUID | FK para turma |
| aulas_semana | number | Quantidade de aulas por semana |
| aulas_geminadas | number | Quantas aulas devem ser consecutivas (0, 2, 3) |
| sala_especifica_id | UUID | Se precisa de sala específica (opcional) |

**Exemplo:**
```
Prof. Maria → Matemática → 6º A → 4 aulas/semana (2 geminadas)
Prof. Maria → Matemática → 6º B → 4 aulas/semana (2 geminadas)
Prof. João → Português → 6º A → 5 aulas/semana (0 geminadas)
```

---

### 3.8 Disponibilidade do Professor

Tabela separada para flexibilidade máxima.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| professor_id | UUID | FK para professor |
| ano_letivo_id | UUID | FK para ano letivo |
| dia_semana | enum | Seg, Ter, Qua, Qui, Sex, Sab |
| horario | number | Número do horário (1º, 2º, 3º...) |
| turno | enum | Manhã, Tarde, Noite |
| status | enum | Disponível, Indisponível, Preferencial |

**Status:**
- **Disponível**: Pode dar aula
- **Indisponível**: Não pode (hard constraint)
- **Preferencial**: Prefere dar aula neste horário (soft constraint)

---

### Diagrama de Relacionamentos

```
Escola
  ├── Ano Letivo
  │     ├── Turma
  │     ├── Vinculação (Professor + Disciplina + Turma)
  │     └── Disponibilidade Professor
  │
  ├── Professor
  ├── Disciplina  
  └── Sala
```

---

## 4. Regras e Restrições

O coração do sistema. Divididas em **Hard Constraints** (obrigatórias) e **Soft Constraints** (preferências com pesos).

### 4.1 Hard Constraints (Obrigatórias)

Se violadas, o horário é **inválido**. O sistema nunca gera horários que violem essas regras.

| ID | Regra | Descrição |
|----|-------|-----------|
| H1 | Sem conflito de professor | Professor não pode estar em duas turmas no mesmo horário |
| H2 | Sem conflito de turma | Turma não pode ter duas aulas no mesmo horário |
| H3 | Sem conflito de sala | Sala não pode ser usada por duas turmas no mesmo horário |
| H4 | Disponibilidade | Professor só pode dar aula quando está disponível |
| H5 | Carga horária | Cada disciplina deve ter exatamente X aulas/semana |
| H6 | Capacidade da sala | Turma não pode usar sala menor que seu número de alunos |
| H7 | Tipo de sala | Disciplinas que exigem sala específica devem usar essa sala |
| H8 | Turno correto | Turma da manhã só tem aulas de manhã |

---

### 4.2 Soft Constraints (Preferências com Pesos)

O sistema **otimiza** para minimizar violações. Cada violação tem um **custo/peso** que afeta a pontuação do horário.

| ID | Regra | Peso | Descrição |
|----|-------|------|-----------|
| **PROFESSOR** |
| S1 | Zero janelas | 100 | **CRÍTICO**: Professor não deve ter horários vagos entre aulas |
| S2 | Jornada compacta | 80 | Aulas do professor concentradas (ex: 7h-10h, não 7h e 11h) |
| S3 | Dias compactos | 60 | Minimizar dias que o professor precisa ir à escola |
| S4 | Horário preferencial | 40 | Respeitar preferências de horário do professor |
| S5 | Carga diária equilibrada | 30 | Não sobrecarregar professor num único dia |
| S6 | Prioridade do professor | 50 | Professores mais antigos têm preferências atendidas primeiro |
| **TURMA** |
| S7 | Distribuição semanal | 40 | Não ter 4 aulas de matemática no mesmo dia |
| S8 | Disciplinas pesadas | 35 | Evitar disciplinas pesadas no último horário |
| S9 | Variedade diária | 25 | Alternar tipos de disciplina ao longo do dia |
| **PEDAGÓGICO** |
| S10 | Aulas geminadas | 90 | Respeitar disciplinas que precisam de 2 tempos seguidos |
| S11 | Sequência pedagógica | 20 | Algumas disciplinas funcionam melhor em sequência |
| S12 | Primeiro horário | 30 | Disciplinas que exigem atenção no primeiro horário |

---

### 4.3 Sistema de Pontuação

Cada horário gerado recebe uma **pontuação de qualidade**:

```
Pontuação = 1000 - (Σ violações × peso)

Exemplo:
- 2 janelas de professor (2 × 100 = 200)
- 1 aula geminada quebrada (1 × 90 = 90)
- 3 preferências não atendidas (3 × 40 = 120)

Pontuação = 1000 - 410 = 590 pontos
```

**Classificação:**
| Pontuação | Qualidade | Descrição |
|-----------|-----------|-----------|
| 900-1000 | Excelente | Praticamente perfeito |
| 800-899 | Muito Bom | Poucas concessões |
| 700-799 | Bom | Aceitável para uso |
| 600-699 | Regular | Funciona, mas com ressalvas |
| < 600 | Ruim | Recomenda-se ajustes manuais |

---

### 4.4 Configuração de Disponibilidade

Interface visual para definir disponibilidade:

```
Professor: Maria Silva                    Legenda:
┌─────────┬───────┬───────┬───────┬───────┬───────┐    ██ Preferencial
│ Horário │  Seg  │  Ter  │  Qua  │  Qui  │  Sex  │    ░░ Disponível
├─────────┼───────┼───────┼───────┼───────┼───────┤    ▒▒ Indisponível
│ 1º      │  ██   │  ██   │  ░░   │  ██   │  ░░   │
│ 2º      │  ██   │  ██   │  ░░   │  ██   │  ░░   │
│ 3º      │  ░░   │  ░░   │  ░░   │  ░░   │  ░░   │
│ 4º      │  ▒▒   │  ░░   │  ▒▒   │  ░░   │  ░░   │
│ 5º      │  ▒▒   │  ░░   │  ▒▒   │  ░░   │  ░░   │
└─────────┴───────┴───────┴───────┴───────┴───────┘

Resumo: 21 horários disponíveis, 8 preferenciais, 4 indisponíveis
Carga atual: 18 aulas/semana ✓
```

---

## 5. Algoritmo de Geração (Avançado)

### 5.1 Visão Geral

O problema de geração de horários escolares é **NP-difícil** (não há solução em tempo polinomial garantida). Para resolver isso de forma eficiente, usamos uma combinação de técnicas:

```
┌─────────────────────────────────────────────────────────────┐
│                    PIPELINE DE GERAÇÃO                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. PRÉ-PROCESSAMENTO                                        │
│     └── Validação de dados                                   │
│     └── Análise de viabilidade                               │
│     └── Cálculo de "dificuldade" de cada alocação            │
│                                                              │
│  2. GERAÇÃO INICIAL (Greedy + Heurísticas)                   │
│     └── Ordenar por restritividade                           │
│     └── Alocar aulas mais difíceis primeiro                  │
│     └── Backtracking quando necessário                       │
│                                                              │
│  3. OTIMIZAÇÃO (Algoritmo Genético)                          │
│     └── População de soluções                                │
│     └── Crossover + Mutação                                  │
│     └── Seleção por fitness                                  │
│     └── Múltiplas gerações                                   │
│                                                              │
│  4. REFINAMENTO (Busca Local)                                │
│     └── Hill Climbing                                        │
│     └── Simulated Annealing                                  │
│     └── Trocas locais para melhorar score                    │
│                                                              │
│  5. VALIDAÇÃO E RESULTADO                                    │
│     └── Verificar todas as hard constraints                  │
│     └── Calcular score final                                 │
│     └── Gerar relatório de qualidade                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.2 Fase 1: Pré-Processamento

Antes de gerar, validamos e preparamos os dados:

```typescript
interface PreProcessamento {
  // 1. Validações básicas
  validarDadosCompletos(): ValidationResult;
  
  // 2. Análise de viabilidade
  calcularSlotsNecessarios(): number;      // Total de aulas a alocar
  calcularSlotsDisponiveis(): number;      // Total de slots disponíveis
  detectarConflitosImpossiveis(): Conflict[];
  
  // 3. Métricas de dificuldade
  calcularDificuldadeProfessor(prof: Professor): number;
  calcularDificuldadeVinculacao(vinc: Vinculacao): number;
  
  // 4. Ordenação por restritividade
  ordenarVinculacoes(): Vinculacao[];  // Mais restritivas primeiro
}
```

**Cálculo de Dificuldade do Professor:**
```
Dificuldade = (carga_horaria / slots_disponiveis) × 100

Prof. Maria: 20 aulas / 25 slots = 80% (difícil)
Prof. João:  15 aulas / 25 slots = 60% (médio)
Prof. Pedro: 10 aulas / 25 slots = 40% (fácil)
```

Professores mais "difíceis" são alocados primeiro.

---

### 5.3 Fase 2: Geração Inicial (Greedy Construtivo)

Algoritmo guloso com heurísticas inteligentes:

```
ALGORITMO GeraçãoInicial:
  1. Ordenar vinculações por dificuldade (decrescente)
  2. Para cada vinculação V:
     a. Listar todos os slots válidos (respeitam hard constraints)
     b. Se V tem aulas geminadas:
        - Filtrar apenas slots consecutivos
     c. Calcular "custo" de cada slot (soft constraints)
     d. Escolher slot com menor custo
     e. Se não há slot válido:
        - Tentar backtracking
        - Se falhar, marcar como conflito
  3. Retornar horário inicial + lista de conflitos
```

**Heurística de Escolha de Slot:**
```
CustoSlot(slot, professor) =
  + (janelas_criadas × 100)           // Penaliza criar janelas
  + (extensao_jornada × 80)           // Penaliza espalhar jornada
  + (dias_extras × 60)                // Penaliza adicionar dias
  + (preferencia_violada × 40)        // Penaliza ignorar preferência
  + (disciplina_pesada_tarde × 35)    // Penaliza pesada no final
```

---

### 5.4 Fase 3: Otimização (Algoritmo Genético)

Usamos algoritmo genético para explorar o espaço de soluções:

```
┌─────────────────────────────────────────────────────────────┐
│                   ALGORITMO GENÉTICO                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Configuração:                                               │
│  - População: 50 indivíduos                                  │
│  - Gerações: 100-500 (dependendo do tamanho)                 │
│  - Taxa de crossover: 70%                                    │
│  - Taxa de mutação: 10%                                      │
│  - Elitismo: 10% (melhores passam direto)                    │
│                                                              │
│  Representação do Cromossomo:                                │
│  [slot_aula1, slot_aula2, slot_aula3, ..., slot_aulaN]       │
│                                                              │
│  Exemplo:                                                    │
│  Aula: Prof.Maria-Mat-6A-1                                   │
│  Slot: Seg-1º-Manhã (codificado como número)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Operadores Genéticos:**

```
CROSSOVER (dois pontos):
  Pai1: [A B C | D E F | G H]
  Pai2: [X Y Z | W V U | T S]
  Filho: [A B C | W V U | G H]
  
  * Após crossover, reparar violações de hard constraints

MUTAÇÃO (troca inteligente):
  1. Selecionar uma aula aleatória
  2. Encontrar slots alternativos válidos
  3. Escolher slot que melhora score
  4. Se não houver melhoria, trocar aleatoriamente

SELEÇÃO (torneio):
  1. Selecionar 3 indivíduos aleatórios
  2. Retornar o de maior fitness
```

**Função de Fitness:**
```
Fitness(horario) = 1000 - Σ(violações × pesos)

// Fitness maior = horário melhor
```

---

### 5.5 Fase 4: Refinamento (Busca Local)

Após o algoritmo genético, aplicamos busca local para polir a solução:

```
ALGORITMO HillClimbing:
  melhor = solução_atual
  melhorou = true
  
  enquanto melhorou:
    melhorou = false
    para cada par de aulas (A, B):
      se trocar(A, B) é válido:
        novo_score = calcular_score(horario_trocado)
        se novo_score > score_atual:
          aplicar_troca(A, B)
          melhorou = true
          
  retornar melhor
```

**Movimentos de Busca Local:**

| Movimento | Descrição |
|-----------|-----------|
| Swap | Trocar duas aulas de lugar |
| Move | Mover uma aula para slot vazio |
| Chain Swap | Trocar 3+ aulas em cadeia |
| Block Move | Mover bloco de aulas geminadas |

---

### 5.6 Otimização Específica: Zero Janelas

O grande diferencial do Gradely. Algoritmo específico para eliminar janelas:

```
ALGORITMO EliminaJanelas:
  para cada professor P:
    janelas = detectar_janelas(P)
    
    para cada janela J em P:
      // Estratégia 1: Puxar aula posterior
      aula_depois = primeira_aula_apos(J)
      se pode_mover(aula_depois, J):
        mover(aula_depois, J)
        continuar
      
      // Estratégia 2: Empurrar aula anterior  
      aula_antes = ultima_aula_antes(J)
      slots_alternativos = buscar_slots(aula_antes)
      se existe slot_que_elimina_janela:
        mover(aula_antes, slot_alternativo)
        continuar
      
      // Estratégia 3: Swap com outro professor
      para cada professor P2:
        se P2 tem aula no slot da janela:
          se pode_trocar(P, P2):
            trocar()
            continuar
      
      // Estratégia 4: Aceitar janela (último recurso)
      registrar_janela_inevitavel(P, J)
```

**Visualização de Janela:**
```
ANTES (com janela):
Prof. Maria - Segunda
  7:00  ██ Aula 6ºA
  7:50  ██ Aula 6ºB
  8:40  ░░ JANELA ← problema!
  9:50  ██ Aula 7ºA
  10:40 ██ Aula 7ºB

DEPOIS (sem janela):
Prof. Maria - Segunda
  7:00  ██ Aula 6ºA
  7:50  ██ Aula 6ºB
  8:40  ██ Aula 7ºA ← movida
  9:50  ██ Aula 7ºB ← movida
  10:40 ░░ livre (fim da jornada, não é janela)
```

---

### 5.7 Compactação de Jornada

Além de eliminar janelas, compactamos a jornada:

```
ALGORITMO CompactaJornada:
  para cada professor P:
    para cada dia D:
      aulas = aulas_do_professor(P, D)
      
      // Calcular bloco ideal
      n_aulas = count(aulas)
      bloco_ideal = encontrar_bloco_consecutivo(n_aulas, disponibilidade_P)
      
      // Tentar mover para bloco compacto
      se todas_aulas_podem_mover(aulas, bloco_ideal):
        mover_todas(aulas, bloco_ideal)
```

**Métrica de Compactação:**
```
Dispersão = (último_horário - primeiro_horário) - (n_aulas - 1)

Prof. Maria - Segunda:
  Aulas: 1º, 2º, 4º, 5º (4 aulas)
  Dispersão = (5 - 1) - (4 - 1) = 4 - 3 = 1 (tem 1 janela)

  Aulas: 1º, 2º, 3º, 4º (4 aulas) 
  Dispersão = (4 - 1) - (4 - 1) = 3 - 3 = 0 (perfeito!)
```

---

### 5.8 Minimização de Dias

Reduzir quantos dias o professor precisa comparecer:

```
ALGORITMO MinimizaDias:
  para cada professor P:
    dias_atuais = dias_com_aula(P)
    carga = total_aulas(P)
    
    // Calcular mínimo teórico de dias
    aulas_por_dia_max = aulas_por_turno  // ex: 5
    dias_minimos = ceil(carga / aulas_por_dia_max)
    
    se dias_atuais > dias_minimos:
      // Tentar consolidar
      dia_menos_aulas = min(aulas_por_dia)
      aulas_a_mover = aulas_no_dia(dia_menos_aulas)
      
      para cada aula A em aulas_a_mover:
        para cada outro_dia D:
          se pode_mover(A, D) e nao_cria_janela:
            mover(A, D)
```

---

### 5.9 Tratamento de Conflitos

Quando não é possível resolver:

```
┌─────────────────────────────────────────────────────────────┐
│                    RELATÓRIO DE CONFLITOS                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ❌ CONFLITO CRÍTICO                                         │
│  Prof. Maria tem 30 aulas/semana mas só 25 slots disponíveis │
│                                                              │
│  Sugestões:                                                  │
│  1. Aumentar disponibilidade (adicionar 5+ horários)         │
│  2. Redistribuir 5 aulas para Prof. João (mesmo disciplina)  │
│  3. Reduzir carga de Matemática 6ºA de 4 para 3 aulas        │
│                                                              │
│  ⚠️  CONFLITO PARCIAL                                        │
│  Prof. Pedro terá 2 janelas inevitáveis                      │
│                                                              │
│  Motivo: Única forma de atender aulas geminadas de Ed.Física │
│  Impacto: Score reduzido em 200 pontos                       │
│                                                              │
│  Aceitar mesmo assim? [Sim] [Tentar alternativas]            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.10 Performance e Paralelização

```
┌─────────────────────────────────────────────────────────────┐
│                    ESTRATÉGIA DE PERFORMANCE                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Web Worker (Frontend)                                    │
│     - Algoritmo roda em thread separada                      │
│     - UI permanece responsiva                                │
│     - Progresso em tempo real                                │
│                                                              │
│  2. Cache de Cálculos                                        │
│     - Pré-computar slots válidos por vinculação              │
│     - Memoizar cálculos de conflito                          │
│     - Atualização incremental ao modificar                   │
│                                                              │
│  3. Early Termination                                        │
│     - Parar se encontrar solução com score > 950             │
│     - Timeout configurável (padrão: 60s)                     │
│     - Retornar melhor solução encontrada até o momento       │
│                                                              │
│  4. Paralelização do AG                                      │
│     - Múltiplas populações independentes (ilhas)             │
│     - Migração periódica entre ilhas                         │
│     - Melhor uso de múltiplos cores                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Tempos Estimados:**

| Tamanho | Professores | Turmas | Aulas | Tempo |
|---------|-------------|--------|-------|-------|
| Pequena | até 15 | até 8 | ~200 | 5-10s |
| Média | até 40 | até 20 | ~600 | 20-40s |
| Grande | até 80 | até 40 | ~1500 | 1-2min |
| Muito Grande | 100+ | 60+ | 2500+ | 2-5min |

---

### 5.11 Comparação de Múltiplas Soluções

O sistema pode gerar múltiplas soluções para o usuário escolher:

```
┌─────────────────────────────────────────────────────────────┐
│                    SOLUÇÕES GERADAS                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SOLUÇÃO A - Score: 945/1000 ⭐ Recomendada                  │
│  ├── Janelas: 0                                              │
│  ├── Preferências atendidas: 95%                             │
│  ├── Dias médios por professor: 4.2                          │
│  └── Aulas geminadas: 100% respeitadas                       │
│                                                              │
│  SOLUÇÃO B - Score: 920/1000                                 │
│  ├── Janelas: 2 (Prof. Maria, Prof. João)                    │
│  ├── Preferências atendidas: 98%                             │
│  ├── Dias médios por professor: 3.8 ← menos dias!            │
│  └── Aulas geminadas: 100% respeitadas                       │
│                                                              │
│  SOLUÇÃO C - Score: 890/1000                                 │
│  ├── Janelas: 0                                              │
│  ├── Preferências atendidas: 85%                             │
│  ├── Dias médios por professor: 4.5                          │
│  └── Aulas geminadas: 95% respeitadas                        │
│                                                              │
│  [Comparar lado a lado] [Detalhes] [Selecionar]              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

### 5.12 Resumo do Algoritmo

```
┌─────────────────────────────────────────────────────────────┐
│                 FLUXO COMPLETO DE GERAÇÃO                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ENTRADA                                                     │
│  └── Professores, Turmas, Disciplinas, Vinculações           │
│  └── Disponibilidades e Preferências                         │
│  └── Configurações de otimização                             │
│                                                              │
│           ▼                                                  │
│                                                              │
│  PRÉ-PROCESSAMENTO (< 1s)                                    │
│  └── Validar dados                                           │
│  └── Calcular viabilidade                                    │
│  └── Ordenar por dificuldade                                 │
│                                                              │
│           ▼                                                  │
│                                                              │
│  GERAÇÃO INICIAL - Greedy (2-5s)                             │
│  └── Alocar aulas mais difíceis primeiro                     │
│  └── Usar heurísticas para minimizar custo                   │
│  └── Backtracking quando necessário                          │
│                                                              │
│           ▼                                                  │
│                                                              │
│  OTIMIZAÇÃO - Algoritmo Genético (10-60s)                    │
│  └── População de 50 soluções                                │
│  └── 100-500 gerações                                        │
│  └── Crossover + Mutação + Seleção                           │
│                                                              │
│           ▼                                                  │
│                                                              │
│  REFINAMENTO - Busca Local (5-20s)                           │
│  └── Hill Climbing                                           │
│  └── Eliminação de janelas                                   │
│  └── Compactação de jornada                                  │
│                                                              │
│           ▼                                                  │
│                                                              │
│  SAÍDA                                                       │
│  └── Horário otimizado (ou múltiplas opções)                 │
│  └── Score de qualidade                                      │
│  └── Relatório de trade-offs                                 │
│  └── Conflitos inevitáveis (se houver)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Interface e Experiência

### 6.1 Fluxo Principal

```
1. Cadastro/Login
   └── Criar conta ou entrar
   └── Criar/selecionar escola

2. Configuração Inicial (wizard)
   └── Dados da escola (turnos, horários)
   └── Importar ou cadastrar professores
   └── Importar ou cadastrar disciplinas
   └── Criar turmas
   └── Definir vinculações

3. Configurar Restrições
   └── Disponibilidade de cada professor (interface visual)
   └── Preferências de horário
   └── Aulas geminadas
   └── Prioridades

4. Gerar Horário
   └── Configurar pesos de otimização (opcional)
   └── Clicar em "Gerar"
   └── Acompanhar progresso em tempo real
   └── Comparar múltiplas soluções
   └── Selecionar a melhor

5. Ajustar Manualmente
   └── Drag & drop para trocar aulas
   └── Sistema valida e mostra impacto em tempo real
   └── Sugestões automáticas de melhoria

6. Exportar/Compartilhar
   └── PDF por turma
   └── PDF por professor
   └── Excel completo
   └── Link público para consulta
```

### 6.2 Telas Principais

| Tela | Descrição |
|------|-----------|
| Dashboard | Visão geral, métricas do horário, alertas |
| Professores | CRUD + interface visual de disponibilidade |
| Disciplinas | CRUD de disciplinas + configurações |
| Turmas | CRUD de turmas |
| Vinculações | Matriz interativa professor × disciplina × turma |
| Gerador | Configurar, executar e comparar soluções |
| Horário - Turma | Grade semanal de uma turma |
| Horário - Professor | Grade semanal + métricas (janelas, carga) |
| Horário - Geral | Visão consolidada de todas as turmas |
| Relatórios | Estatísticas, qualidade, comparações |

### 6.3 Visualização da Grade

```
┌─────────────────────────────────────────────────────────────────────┐
│  6º ANO A - MANHÃ                           Score: 945 ⭐           │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────┤
│ Horário │   Seg   │   Ter   │   Qua   │   Qui   │   Sex   │        │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 7:00    │  ████   │  ████   │  ░░░░   │  ████   │  ████   │        │
│         │   MAT   │  PORT   │  HIST   │   GEO   │   MAT   │        │
│         │  Maria  │  João   │  Pedro  │   Ana   │  Maria  │        │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 7:50    │  ████   │  ████   │  ░░░░   │  ░░░░   │  ████   │        │
│         │   MAT   │  PORT   │   ING   │  CIEN   │  PORT   │ Geminada
│         │  Maria  │  João   │  Lucas  │  Carla  │  João   │        │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 8:40    │  ░░░░   │  ▓▓▓▓   │  ████   │  ████   │  ░░░░   │        │
│         │  CIEN   │  ED.F   │  PORT   │   MAT   │  HIST   │        │
│         │  Carla  │  Bruno  │  João   │  Maria  │  Pedro  │        │
├─────────┼─────────┴─────────┴─────────┴─────────┴─────────┼────────┤
│  9:30   │                    INTERVALO                     │        │
├─────────┼─────────┬─────────┬─────────┬─────────┬─────────┼────────┤
│ 9:50    │  ░░░░   │  ▓▓▓▓   │  ████   │  ░░░░   │  ░░░░   │        │
│         │   GEO   │  ED.F   │   MAT   │   ART   │   ING   │ Geminada
│         │   Ana   │  Bruno  │  Maria  │  Julia  │  Lucas  │        │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 10:40   │  ░░░░   │  ░░░░   │  ░░░░   │  ████   │  ░░░░   │        │
│         │   ART   │  CIEN   │   GEO   │  PORT   │  CIEN   │        │
│         │  Julia  │  Carla  │   Ana   │  João   │  Carla  │        │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┘

████ = Disciplina pesada (Matemática)    ░░░░ = Disciplina leve
▓▓▓▓ = Aula especial (Ed. Física)        
```

### 6.4 Visão do Professor

```
┌─────────────────────────────────────────────────────────────────────┐
│  PROF. MARIA SILVA                                                  │
│  Matemática | Carga: 20 aulas/semana                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MÉTRICAS                                                           │
│  ├── Janelas: 0 ✓                                                   │
│  ├── Dias na escola: 4 (Seg, Ter, Qua, Qui)                         │
│  ├── Jornada média: 4h/dia                                          │
│  ├── Preferências atendidas: 95%                                    │
│  └── Aulas geminadas: 100%                                          │
│                                                                      │
├─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬────────┤
│ Horário │   Seg   │   Ter   │   Qua   │   Qui   │   Sex   │        │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 7:00    │   6ºA   │   7ºA   │   6ºB   │   8ºA   │    -    │        │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 7:50    │   6ºA   │   7ºA   │   6ºB   │   8ºA   │    -    │ Geminada
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 8:40    │   7ºB   │   8ºB   │   7ºB   │   9ºA   │    -    │        │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 9:50    │   7ºB   │   8ºB   │    -    │   9ºA   │    -    │ Geminada
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┼────────┤
│ 10:40   │    -    │    -    │    -    │    -    │    -    │        │
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┴────────┘

                ██ Aula    ░░ Disponível    ▒▒ Indisponível
```

### 6.5 Recursos de UX

- **Drag & Drop**: Arrastar aulas com preview de impacto
- **Validação em tempo real**: Mostra conflitos e alteração no score
- **Cores por disciplina**: Identificação visual rápida
- **Indicadores visuais**: Janelas, aulas geminadas, conflitos
- **Filtros avançados**: Por turma, professor, disciplina, dia
- **Busca inteligente**: "Onde Prof. Maria está na quarta?"
- **Undo/Redo ilimitado**: Histórico completo de alterações
- **Modo comparação**: Ver duas soluções lado a lado
- **Modo escuro**: Interface adaptativa

---

## 7. Modelo de Negócio

### 7.1 Planos

| Plano | Preço | Recursos |
|-------|-------|----------|
| **Gratuito** | R$ 0 | 1 escola, até 5 turmas, 10 professores, algoritmo básico |
| **Básico** | R$ 49/mês | 1 escola, até 20 turmas, 40 professores, algoritmo completo |
| **Profissional** | R$ 99/mês | 1 escola, ilimitado, múltiplas soluções, suporte prioritário |
| **Rede** | R$ 249/mês | Até 5 escolas, dashboard consolidado, API |
| **Enterprise** | Sob consulta | Ilimitado, customizações, SLA, treinamento |

### 7.2 Funcionalidades por Plano

| Funcionalidade | Free | Básico | Pro | Rede |
|----------------|------|--------|-----|------|
| Geração automática | Básica | Completa | Completa | Completa |
| Algoritmo genético | ✗ | ✓ | ✓ | ✓ |
| Múltiplas soluções | ✗ | 2 | 5 | 10 |
| Otimização de janelas | ✗ | ✓ | ✓ | ✓ |
| Exportar PDF | ✓ | ✓ | ✓ | ✓ |
| Exportar Excel | ✗ | ✓ | ✓ | ✓ |
| Histórico de anos | 1 ano | 3 anos | Ilimitado | Ilimitado |
| Ajustes manuais | ✓ | ✓ | ✓ | ✓ |
| Link público | ✗ | ✓ | ✓ | ✓ |
| Múltiplos usuários | 1 | 2 | 5 | 20 |
| Suporte | Docs | Email | Chat | Dedicado |
| Importar Excel | ✗ | ✓ | ✓ | ✓ |
| API | ✗ | ✗ | ✗ | ✓ |
| Relatórios avançados | ✗ | ✗ | ✓ | ✓ |

### 7.3 Estratégia de Aquisição

1. **SEO**: "gerador de horário escolar", "software grade horária", "montar horário professor"
2. **Conteúdo**: Blog com dicas para coordenadores, templates gratuitos
3. **Google Ads**: Campanhas sazonais (início do ano letivo)
4. **Parcerias**: Sindicatos de professores, associações de escolas
5. **Indicação**: 1 mês grátis para quem indicar escola que converter
6. **Freemium**: Converter escolas pequenas conforme crescem

### 7.4 Métricas de Sucesso

| Métrica | Meta 6 meses | Meta 12 meses |
|---------|--------------|---------------|
| Escolas cadastradas | 200 | 1.000 |
| Escolas pagas | 20 | 100 |
| MRR | R$ 2.000 | R$ 10.000 |
| Churn mensal | < 5% | < 3% |
| NPS | > 50 | > 60 |
| Score médio dos horários | > 850 | > 900 |

---

## 8. Stack Técnica

### 8.1 Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTE                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  React + TypeScript + Vite                          │    │
│  │  TanStack Query + Zustand + React Router            │    │
│  │  Tailwind CSS + Radix UI                            │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  Web Worker (Algoritmo de Geração)          │    │    │
│  │  │  - Roda em thread separada                  │    │    │
│  │  │  - UI responsiva durante geração            │    │    │
│  │  │  - Progresso em tempo real                  │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         SERVIDOR                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Node.js + Fastify + TypeScript                     │    │
│  │  Drizzle ORM + Zod                                  │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  Scheduler Engine (Algoritmo)               │    │    │
│  │  │  - Módulo isolado e testável                │    │    │
│  │  │  - Pode rodar no servidor para escolas      │    │    │
│  │  │    muito grandes                            │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      INFRAESTRUTURA                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │    Redis     │  │   Storage    │       │
│  │  (Supabase)  │  │   (Cache)    │  │  (S3/R2)     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Tecnologias

| Camada | Tecnologia | Justificativa |
|--------|------------|---------------|
| Frontend | React 18 + TypeScript | Você já domina, ecossistema maduro |
| Build | Vite | Rápido, moderno, suporte a Web Workers |
| Estilo | Tailwind + Radix UI | Produtividade + acessibilidade |
| Drag & Drop | dnd-kit | Melhor lib para React, acessível |
| Estado | Zustand + TanStack Query | Simples e poderoso |
| Gráficos | Recharts | Para relatórios e métricas |
| PDF | @react-pdf/renderer | Gerar PDFs no cliente |
| Backend | Fastify + TypeScript | Performance, igual 3balug |
| ORM | Drizzle | Type-safe, leve |
| Validação | Zod | Schemas compartilhados front/back |
| Banco | PostgreSQL (Supabase) | Robusto, bom tier gratuito |
| Auth | Supabase Auth ou próprio | Simples para MVP |
| Jobs | BullMQ + Redis | Para geração assíncrona (escolas grandes) |
| Deploy FE | Vercel | CI/CD automático |
| Deploy BE | Railway ou Render | Fácil, bom custo |

### 8.3 Estrutura do Monorepo

```
apps/gradely/
├── api/                        # Backend Fastify
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── use-cases/
│   │   └── infra/
│   └── package.json
│
├── web/                        # Frontend React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   └── workers/            # Web Workers
│   │       └── scheduler.worker.ts
│   └── package.json
│
├── scheduler/                  # Algoritmo (pacote isolado)
│   ├── src/
│   │   ├── core/
│   │   │   ├── types.ts
│   │   │   ├── constraints.ts
│   │   │   └── fitness.ts
│   │   ├── algorithms/
│   │   │   ├── greedy.ts
│   │   │   ├── genetic.ts
│   │   │   └── local-search.ts
│   │   ├── optimizers/
│   │   │   ├── gap-eliminator.ts
│   │   │   ├── compactor.ts
│   │   │   └── day-minimizer.ts
│   │   └── index.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── package.json
│
├── shared/                     # Código compartilhado
│   ├── types/
│   ├── schemas/
│   └── utils/
│
└── PLANNING.md
```

### 8.4 Algoritmo como Pacote Isolado

O `scheduler` é um pacote npm separado que:
- Pode ser testado independentemente
- Funciona no navegador (Web Worker) e no servidor
- É puro (sem dependências externas)
- Tem tipagem forte com TypeScript

```typescript
// Uso no Web Worker
import { Scheduler } from '@gradely/scheduler';

const scheduler = new Scheduler({
  maxGenerations: 100,
  populationSize: 50,
  weights: {
    gaps: 100,
    compactness: 80,
    preferences: 40
  }
});

const result = await scheduler.generate(input, (progress) => {
  postMessage({ type: 'progress', data: progress });
});

postMessage({ type: 'result', data: result });
```

---

## 9. Roadmap de Desenvolvimento

### Fase 1 - Fundação (2 semanas)

- [ ] Setup do projeto (monorepo, configs, CI/CD)
- [ ] Modelagem do banco de dados
- [ ] Autenticação (registro, login, recuperar senha)
- [ ] CRUD de Escola (configurações básicas)
- [ ] Layout base do frontend (sidebar, header, navegação)

### Fase 2 - Cadastros (2 semanas)

- [ ] CRUD de Professores
- [ ] CRUD de Disciplinas (com peso cognitivo)
- [ ] CRUD de Turmas
- [ ] CRUD de Salas
- [ ] CRUD de Ano Letivo
- [ ] Tela de Vinculações (matriz interativa)
- [ ] Importação de Excel (professores, disciplinas)

### Fase 3 - Restrições (1 semana)

- [ ] Interface visual de disponibilidade do professor
- [ ] Configuração de aulas geminadas
- [ ] Configuração de preferências e prioridades
- [ ] Validação de consistência dos dados

### Fase 4 - Algoritmo Core (3 semanas)

- [ ] Estrutura do pacote `scheduler`
- [ ] Tipos e interfaces
- [ ] Validador de hard constraints
- [ ] Calculador de fitness (soft constraints)
- [ ] Algoritmo Greedy inicial
- [ ] Algoritmo Genético (crossover, mutação, seleção)
- [ ] Busca local (hill climbing)
- [ ] Testes unitários extensivos

### Fase 5 - Otimizadores Avançados (2 semanas)

- [ ] Eliminador de janelas
- [ ] Compactador de jornada
- [ ] Minimizador de dias
- [ ] Integração dos otimizadores no pipeline
- [ ] Testes com cenários reais

### Fase 6 - Integração Web Worker (1 semana)

- [ ] Setup do Web Worker
- [ ] Comunicação de progresso
- [ ] Cancelamento de geração
- [ ] Fallback para servidor (escolas grandes)

### Fase 7 - Visualização (2 semanas)

- [ ] Grade horária por turma (com cores)
- [ ] Grade horária por professor (com métricas)
- [ ] Visão geral (todas as turmas)
- [ ] Indicadores visuais (janelas, geminadas)
- [ ] Comparador de soluções

### Fase 8 - Edição Manual (1 semana)

- [ ] Drag & drop com dnd-kit
- [ ] Validação em tempo real
- [ ] Preview de impacto no score
- [ ] Undo/redo

### Fase 9 - Exportação (1 semana)

- [ ] Exportar PDF por turma
- [ ] Exportar PDF por professor
- [ ] Exportar Excel completo
- [ ] Link público de visualização

### Fase 10 - Polish e Lançamento (1 semana)

- [ ] Testes de usabilidade
- [ ] Ajustes de UX
- [ ] Página de landing
- [ ] Configurar planos/pagamentos (Stripe)
- [ ] Deploy de produção
- [ ] Documentação para usuários

---

## 10. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Algoritmo não converge em tempo razoável | Média | Alto | Early termination, timeout, mostrar melhor solução parcial |
| Algoritmo não elimina todas as janelas | Baixa | Alto | Permitir trade-offs configuráveis, sugerir ajustes manuais |
| UX complicada para usuários não-técnicos | Média | Alto | Wizard, tutoriais, templates, testes com usuários reais |
| Web Worker não suportado em browsers antigos | Baixa | Médio | Fallback para geração no servidor |
| Concorrência com soluções estabelecidas | Alta | Médio | Focar em UX moderna, preço acessível, algoritmo superior |
| Performance ruim em escolas muito grandes | Baixa | Médio | Geração no servidor, algoritmo incremental |

---

## 11. Próximos Passos

Após aprovação deste documento:

1. **Criar estrutura do projeto** (pastas, configs, package.json)
2. **Setup do banco de dados** (schema com Drizzle)
3. **Implementar autenticação**
4. **CRUD de Escola**
5. **Começar o pacote `scheduler`** com tipos e testes

---

## 12. Glossário

| Termo | Definição |
|-------|-----------|
| Janela | Horário vago entre duas aulas do mesmo professor no mesmo turno |
| Aula geminada | Duas ou mais aulas consecutivas da mesma disciplina |
| Vinculação | Relação professor-disciplina-turma com carga horária |
| Hard constraint | Regra que não pode ser violada (horário inválido se violar) |
| Soft constraint | Preferência que o sistema tenta respeitar (viola se necessário) |
| Fitness | Pontuação de qualidade do horário (maior = melhor) |
| Slot | Posição no horário (ex: Segunda-1º horário-Manhã) |
| Backtracking | Técnica de desfazer alocações para tentar outras opções |
| Algoritmo Genético | Técnica de otimização inspirada na evolução biológica |

---

## Histórico de Aprovações

| Data | Parte | Status | Observações |
|------|-------|--------|-------------|
| - | Documento completo | Pendente | - |
