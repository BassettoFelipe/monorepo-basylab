# Gradely - Checklist de Desenvolvimento

> Marque com `[x]` conforme for completando cada item.

---

## Fase 1 - Fundação

### 1.1 Setup do Monorepo
- [ ] Criar pasta `apps/gradely/api`
- [ ] Criar pasta `apps/gradely/web`
- [ ] Criar pasta `apps/gradely/scheduler`
- [ ] Criar pasta `apps/gradely/shared`
- [ ] Configurar `package.json` raiz do gradely
- [ ] Configurar workspaces do monorepo
- [ ] Configurar TypeScript (tsconfig base + extends)
- [ ] Configurar ESLint + Prettier
- [ ] Configurar scripts de build/dev/test

### 1.2 Setup do Backend (API)
- [ ] Inicializar projeto Fastify + TypeScript
- [ ] Configurar estrutura de pastas (controllers, services, repositories, use-cases)
- [ ] Configurar Drizzle ORM
- [ ] Configurar conexão com PostgreSQL (Supabase)
- [ ] Configurar Zod para validação
- [ ] Configurar variáveis de ambiente (.env)
- [ ] Criar script de migrations
- [ ] Configurar CORS
- [ ] Configurar tratamento de erros global

### 1.3 Modelagem do Banco de Dados
- [ ] Schema: `schools` (escolas)
- [ ] Schema: `academic_years` (anos letivos)
- [ ] Schema: `teachers` (professores)
- [ ] Schema: `subjects` (disciplinas)
- [ ] Schema: `classes` (turmas)
- [ ] Schema: `rooms` (salas)
- [ ] Schema: `assignments` (vinculações professor-disciplina-turma)
- [ ] Schema: `teacher_availability` (disponibilidade)
- [ ] Schema: `users` (usuários do sistema)
- [ ] Criar relacionamentos e índices
- [ ] Rodar primeira migration

### 1.4 Autenticação
- [ ] Endpoint: POST `/auth/register` (criar conta)
- [ ] Endpoint: POST `/auth/login` (entrar)
- [ ] Endpoint: POST `/auth/logout` (sair)
- [ ] Endpoint: POST `/auth/forgot-password` (recuperar senha)
- [ ] Endpoint: POST `/auth/reset-password` (redefinir senha)
- [ ] Middleware de autenticação (JWT)
- [ ] Middleware de autorização (roles)
- [ ] Hash de senha (bcrypt)
- [ ] Refresh token

### 1.5 Setup do Frontend (Web)
- [ ] Inicializar projeto React + Vite + TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Configurar Radix UI
- [ ] Configurar React Router
- [ ] Configurar TanStack Query
- [ ] Configurar Zustand
- [ ] Criar estrutura de pastas (components, pages, hooks, stores, services)
- [ ] Configurar cliente HTTP (fetch wrapper ou axios)
- [ ] Configurar variáveis de ambiente

### 1.6 Layout Base
- [ ] Componente: Layout principal (sidebar + header + content)
- [ ] Componente: Sidebar com navegação
- [ ] Componente: Header com user menu
- [ ] Componente: Breadcrumb
- [ ] Página: Login
- [ ] Página: Registro
- [ ] Página: Recuperar senha
- [ ] Página: Dashboard (placeholder)
- [ ] Configurar rotas protegidas
- [ ] Configurar tema (cores, fontes)

---

## Fase 2 - Cadastros Básicos

### 2.1 CRUD de Escola
**Backend:**
- [ ] Endpoint: GET `/schools` (listar escolas do usuário)
- [ ] Endpoint: GET `/schools/:id` (detalhes da escola)
- [ ] Endpoint: POST `/schools` (criar escola)
- [ ] Endpoint: PUT `/schools/:id` (atualizar escola)
- [ ] Endpoint: DELETE `/schools/:id` (deletar escola)
- [ ] Validação dos dados com Zod
- [ ] Testes unitários

**Frontend:**
- [ ] Página: Lista de escolas
- [ ] Página: Criar/editar escola
- [ ] Formulário: Dados básicos (nome, turnos, dias)
- [ ] Formulário: Configuração de horários (duração aula, intervalo)
- [ ] Componente: Seletor de turnos
- [ ] Componente: Seletor de dias da semana

### 2.2 CRUD de Ano Letivo
**Backend:**
- [ ] Endpoint: GET `/schools/:schoolId/years` (listar anos)
- [ ] Endpoint: POST `/schools/:schoolId/years` (criar ano)
- [ ] Endpoint: PUT `/years/:id` (atualizar ano)
- [ ] Endpoint: DELETE `/years/:id` (deletar ano)
- [ ] Endpoint: POST `/years/:id/activate` (ativar ano)
- [ ] Endpoint: POST `/years/:id/archive` (arquivar ano)

**Frontend:**
- [ ] Página: Lista de anos letivos
- [ ] Modal: Criar/editar ano letivo
- [ ] Seletor de ano letivo ativo (global)
- [ ] Indicador de status (Planejamento, Ativo, Arquivado)

### 2.3 CRUD de Professores
**Backend:**
- [ ] Endpoint: GET `/years/:yearId/teachers` (listar professores)
- [ ] Endpoint: GET `/teachers/:id` (detalhes do professor)
- [ ] Endpoint: POST `/years/:yearId/teachers` (criar professor)
- [ ] Endpoint: PUT `/teachers/:id` (atualizar professor)
- [ ] Endpoint: DELETE `/teachers/:id` (deletar professor)
- [ ] Endpoint: POST `/teachers/import` (importar Excel)

**Frontend:**
- [ ] Página: Lista de professores (com busca e filtros)
- [ ] Página: Criar/editar professor
- [ ] Formulário: Dados básicos (nome, email, telefone)
- [ ] Formulário: Carga horária (min, max)
- [ ] Formulário: Prioridade
- [ ] Componente: Upload de Excel para importação
- [ ] Componente: Card de professor

### 2.4 CRUD de Disciplinas
**Backend:**
- [ ] Endpoint: GET `/schools/:schoolId/subjects` (listar disciplinas)
- [ ] Endpoint: POST `/schools/:schoolId/subjects` (criar disciplina)
- [ ] Endpoint: PUT `/subjects/:id` (atualizar disciplina)
- [ ] Endpoint: DELETE `/subjects/:id` (deletar disciplina)

**Frontend:**
- [ ] Página: Lista de disciplinas
- [ ] Modal: Criar/editar disciplina
- [ ] Formulário: Nome, abreviação, cor
- [ ] Formulário: Peso cognitivo (Leve, Médio, Pesado)
- [ ] Formulário: Tipo de sala requerida
- [ ] Componente: Seletor de cor

### 2.5 CRUD de Turmas
**Backend:**
- [ ] Endpoint: GET `/years/:yearId/classes` (listar turmas)
- [ ] Endpoint: POST `/years/:yearId/classes` (criar turma)
- [ ] Endpoint: PUT `/classes/:id` (atualizar turma)
- [ ] Endpoint: DELETE `/classes/:id` (deletar turma)

**Frontend:**
- [ ] Página: Lista de turmas (agrupadas por turno)
- [ ] Modal: Criar/editar turma
- [ ] Formulário: Nome, turno, nível, qtd alunos
- [ ] Formulário: Sala fixa (opcional)

### 2.6 CRUD de Salas
**Backend:**
- [ ] Endpoint: GET `/schools/:schoolId/rooms` (listar salas)
- [ ] Endpoint: POST `/schools/:schoolId/rooms` (criar sala)
- [ ] Endpoint: PUT `/rooms/:id` (atualizar sala)
- [ ] Endpoint: DELETE `/rooms/:id` (deletar sala)

**Frontend:**
- [ ] Página: Lista de salas
- [ ] Modal: Criar/editar sala
- [ ] Formulário: Nome, capacidade, tipo
- [ ] Formulário: Recursos (checkboxes)
- [ ] Formulário: Turnos disponíveis

### 2.7 Vinculações (Professor-Disciplina-Turma)
**Backend:**
- [ ] Endpoint: GET `/years/:yearId/assignments` (listar vinculações)
- [ ] Endpoint: POST `/years/:yearId/assignments` (criar vinculação)
- [ ] Endpoint: PUT `/assignments/:id` (atualizar vinculação)
- [ ] Endpoint: DELETE `/assignments/:id` (deletar vinculação)
- [ ] Endpoint: POST `/years/:yearId/assignments/bulk` (criar em lote)

**Frontend:**
- [ ] Página: Matriz de vinculações
- [ ] Visualização: Tabela Professor × Turma
- [ ] Modal: Criar/editar vinculação
- [ ] Formulário: Professor, disciplina, turma
- [ ] Formulário: Aulas por semana
- [ ] Formulário: Aulas geminadas (0, 2, 3)
- [ ] Formulário: Sala específica (opcional)
- [ ] Validação: Mostrar carga total por professor
- [ ] Validação: Alertar se exceder carga máxima

---

## Fase 3 - Restrições e Disponibilidade

### 3.1 Disponibilidade do Professor
**Backend:**
- [ ] Endpoint: GET `/teachers/:id/availability` (obter disponibilidade)
- [ ] Endpoint: PUT `/teachers/:id/availability` (atualizar disponibilidade)
- [ ] Endpoint: POST `/teachers/:id/availability/copy` (copiar de outro professor)

**Frontend:**
- [ ] Componente: Grid de disponibilidade (dias × horários)
- [ ] Interação: Click para alternar status (Disponível/Indisponível/Preferencial)
- [ ] Interação: Drag para selecionar múltiplos slots
- [ ] Visualização: Cores diferentes por status
- [ ] Visualização: Resumo (X disponíveis, Y preferenciais, Z indisponíveis)
- [ ] Validação: Alertar se disponibilidade < carga necessária
- [ ] Ação: Copiar disponibilidade de outro professor
- [ ] Ação: Marcar todos como disponíveis
- [ ] Ação: Limpar todos

### 3.2 Configuração de Aulas Geminadas
**Frontend:**
- [ ] Incluído no formulário de vinculação
- [ ] Validação: Só permitir 2 ou 3 geminadas se aulas/semana >= valor
- [ ] Visualização: Indicador de geminadas na lista de vinculações

### 3.3 Configuração de Preferências
**Frontend:**
- [ ] Formulário de prioridade do professor (1-10)
- [ ] Ordenação de professores por prioridade na lista

### 3.4 Validação de Consistência
**Backend:**
- [ ] Endpoint: GET `/years/:yearId/validate` (validar dados)
- [ ] Verificar: Todos os professores têm disponibilidade definida
- [ ] Verificar: Carga horária não excede disponibilidade
- [ ] Verificar: Todas as turmas têm disciplinas atribuídas
- [ ] Verificar: Não há vinculações órfãs
- [ ] Retornar lista de warnings e errors

**Frontend:**
- [ ] Página: Relatório de validação
- [ ] Componente: Lista de problemas (errors em vermelho, warnings em amarelo)
- [ ] Link para corrigir cada problema
- [ ] Bloquear geração se houver errors

---

## Fase 4 - Algoritmo Core (Pacote Scheduler)

### 4.1 Estrutura do Pacote
- [ ] Criar `apps/gradely/scheduler/package.json`
- [ ] Configurar TypeScript para o pacote
- [ ] Configurar build (tsup ou esbuild)
- [ ] Configurar testes (vitest)
- [ ] Configurar exports do pacote

### 4.2 Tipos e Interfaces
- [ ] Type: `School` (configurações da escola)
- [ ] Type: `Teacher` (professor com disponibilidade)
- [ ] Type: `Subject` (disciplina)
- [ ] Type: `Class` (turma)
- [ ] Type: `Room` (sala)
- [ ] Type: `Assignment` (vinculação)
- [ ] Type: `TimeSlot` (slot de horário)
- [ ] Type: `Lesson` (aula alocada)
- [ ] Type: `Schedule` (horário completo)
- [ ] Type: `SchedulerConfig` (configurações do algoritmo)
- [ ] Type: `SchedulerResult` (resultado da geração)
- [ ] Type: `Conflict` (conflito detectado)
- [ ] Type: `ProgressEvent` (evento de progresso)

### 4.3 Validador de Hard Constraints
- [ ] Função: `validateNoTeacherConflict()` - professor não está em duas turmas
- [ ] Função: `validateNoClassConflict()` - turma não tem duas aulas
- [ ] Função: `validateNoRoomConflict()` - sala não está ocupada
- [ ] Função: `validateTeacherAvailability()` - professor está disponível
- [ ] Função: `validateRoomCapacity()` - sala comporta turma
- [ ] Função: `validateRoomType()` - sala é do tipo correto
- [ ] Função: `validateShift()` - aula está no turno correto
- [ ] Função: `validateAllHardConstraints()` - valida todas
- [ ] Testes unitários para cada validador

### 4.4 Calculador de Fitness (Soft Constraints)
- [ ] Função: `countTeacherGaps()` - contar janelas do professor
- [ ] Função: `calculateJourneySpread()` - dispersão da jornada
- [ ] Função: `countTeacherDays()` - dias que professor trabalha
- [ ] Função: `checkPreferredSlots()` - slots preferenciais atendidos
- [ ] Função: `checkDailyBalance()` - equilíbrio de carga diária
- [ ] Função: `checkSubjectDistribution()` - distribuição semanal
- [ ] Função: `checkHeavySubjectsPlacement()` - disciplinas pesadas
- [ ] Função: `checkConsecutiveLessons()` - aulas geminadas
- [ ] Função: `calculateFitness()` - fitness total (0-1000)
- [ ] Configuração de pesos customizáveis
- [ ] Testes unitários para cada cálculo

### 4.5 Algoritmo Greedy
- [ ] Função: `calculateAssignmentDifficulty()` - dificuldade da vinculação
- [ ] Função: `sortAssignmentsByDifficulty()` - ordenar por dificuldade
- [ ] Função: `findValidSlots()` - slots válidos para uma aula
- [ ] Função: `findConsecutiveSlots()` - slots para aulas geminadas
- [ ] Função: `calculateSlotCost()` - custo de alocar em um slot
- [ ] Função: `allocateLesson()` - alocar uma aula
- [ ] Função: `backtrack()` - desfazer e tentar alternativa
- [ ] Função: `greedyGenerate()` - gerar horário inicial
- [ ] Testes com cenários simples
- [ ] Testes com cenários com conflitos

### 4.6 Algoritmo Genético
- [ ] Função: `encodeSchedule()` - schedule → cromossomo
- [ ] Função: `decodeSchedule()` - cromossomo → schedule
- [ ] Função: `initializePopulation()` - população inicial
- [ ] Função: `crossover()` - cruzamento de dois indivíduos
- [ ] Função: `repairSchedule()` - corrigir violações após crossover
- [ ] Função: `mutate()` - mutação inteligente
- [ ] Função: `selectParent()` - seleção por torneio
- [ ] Função: `evolve()` - uma geração
- [ ] Função: `geneticOptimize()` - loop principal do AG
- [ ] Configuração: tamanho população, gerações, taxas
- [ ] Callback de progresso
- [ ] Early termination se fitness > threshold
- [ ] Testes de convergência

### 4.7 Busca Local
- [ ] Função: `findSwapMoves()` - movimentos de troca possíveis
- [ ] Função: `findMoveMoves()` - movimentos de realocação
- [ ] Função: `evaluateMove()` - avaliar impacto de um movimento
- [ ] Função: `applyMove()` - aplicar movimento
- [ ] Função: `hillClimbing()` - subida de encosta
- [ ] Função: `localSearch()` - busca local com múltiplos restarts
- [ ] Testes de melhoria de fitness

### 4.8 Pipeline Completo
- [ ] Função: `preprocess()` - pré-processamento e validação
- [ ] Função: `generate()` - pipeline completo
- [ ] Integração: Greedy → AG → Busca Local
- [ ] Callback de progresso unificado
- [ ] Timeout configurável
- [ ] Retornar múltiplas soluções
- [ ] Retornar conflitos inevitáveis
- [ ] Testes de integração

---

## Fase 5 - Otimizadores Avançados

### 5.1 Eliminador de Janelas
- [ ] Função: `detectGaps()` - detectar janelas de um professor
- [ ] Função: `tryPullForward()` - puxar aula posterior para janela
- [ ] Função: `tryPushBack()` - empurrar aula anterior
- [ ] Função: `trySwapWithOther()` - trocar com outro professor
- [ ] Função: `eliminateGaps()` - eliminar todas as janelas possíveis
- [ ] Testes: Cenário com janela simples
- [ ] Testes: Cenário com janela complexa
- [ ] Testes: Cenário com janela inevitável

### 5.2 Compactador de Jornada
- [ ] Função: `calculateSpread()` - calcular dispersão
- [ ] Função: `findCompactBlock()` - encontrar bloco ideal
- [ ] Função: `tryCompact()` - tentar compactar jornada de um dia
- [ ] Função: `compactAllJourneys()` - compactar todos os professores
- [ ] Testes de compactação

### 5.3 Minimizador de Dias
- [ ] Função: `countWorkDays()` - contar dias de trabalho
- [ ] Função: `calculateMinDays()` - calcular mínimo teórico
- [ ] Função: `tryConsolidateDays()` - tentar reduzir dias
- [ ] Função: `minimizeDays()` - minimizar dias de todos
- [ ] Testes de minimização

### 5.4 Integração dos Otimizadores
- [ ] Função: `optimize()` - pipeline de otimização
- [ ] Ordem: Janelas → Compactação → Dias
- [ ] Verificar melhoria após cada etapa
- [ ] Rollback se piorar
- [ ] Testes de integração

### 5.5 Testes com Cenários Reais
- [ ] Fixture: Escola pequena (10 profs, 5 turmas)
- [ ] Fixture: Escola média (30 profs, 15 turmas)
- [ ] Fixture: Escola grande (60 profs, 30 turmas)
- [ ] Teste: Tempo de execução < limites
- [ ] Teste: Fitness > 800 para todos os cenários
- [ ] Teste: Zero janelas quando possível

---

## Fase 6 - Integração Web Worker

### 6.1 Setup do Web Worker
- [ ] Criar `web/src/workers/scheduler.worker.ts`
- [ ] Configurar Vite para Web Workers
- [ ] Importar pacote `@gradely/scheduler`
- [ ] Definir protocolo de mensagens (start, progress, result, cancel)

### 6.2 Comunicação com UI
- [ ] Hook: `useScheduler()` - interface com o worker
- [ ] Função: `startGeneration()` - iniciar geração
- [ ] Função: `cancelGeneration()` - cancelar
- [ ] Estado: `isGenerating`, `progress`, `result`
- [ ] Callback: `onProgress` - atualizar UI

### 6.3 UI de Progresso
- [ ] Componente: Modal de geração
- [ ] Componente: Barra de progresso
- [ ] Componente: Etapa atual (Greedy, AG, Otimização)
- [ ] Componente: Fitness atual
- [ ] Botão: Cancelar
- [ ] Animação de loading

### 6.4 Fallback para Servidor
- [ ] Endpoint: POST `/years/:yearId/generate` (gerar no servidor)
- [ ] Endpoint: GET `/generations/:id/status` (status da geração)
- [ ] Endpoint: GET `/generations/:id/result` (resultado)
- [ ] Detectar: Web Worker não suportado
- [ ] Detectar: Escola muito grande
- [ ] UI: Mostrar que está gerando no servidor
- [ ] Polling para status

---

## Fase 7 - Visualização de Horários

### 7.1 Grade Horária por Turma
- [ ] Página: `/schedules/:yearId/classes/:classId`
- [ ] Componente: Grade semanal (dias × horários)
- [ ] Célula: Disciplina + Professor
- [ ] Cores: Por disciplina
- [ ] Indicador: Aulas geminadas (borda conectada)
- [ ] Indicador: Sala especial
- [ ] Linha: Intervalo
- [ ] Header: Nome da turma + turno
- [ ] Responsivo: Scroll horizontal em mobile

### 7.2 Grade Horária por Professor
- [ ] Página: `/schedules/:yearId/teachers/:teacherId`
- [ ] Componente: Grade semanal
- [ ] Célula: Turma + Sala
- [ ] Métricas: Card com estatísticas
  - [ ] Janelas (com indicador verde/vermelho)
  - [ ] Dias na escola
  - [ ] Jornada média
  - [ ] Preferências atendidas (%)
  - [ ] Aulas geminadas (%)
- [ ] Indicador: Slots indisponíveis (cinza)
- [ ] Indicador: Slots preferenciais não usados

### 7.3 Visão Geral
- [ ] Página: `/schedules/:yearId/overview`
- [ ] Visualização: Mini-grades de todas as turmas
- [ ] Filtro: Por turno
- [ ] Filtro: Por nível (Fund I, Fund II, Médio)
- [ ] Click: Expandir para ver detalhes
- [ ] Resumo: Métricas gerais do horário
  - [ ] Score total
  - [ ] Total de janelas
  - [ ] % de preferências atendidas
  - [ ] % de geminadas respeitadas

### 7.4 Indicadores Visuais
- [ ] Componente: Badge de janela (vermelho)
- [ ] Componente: Badge de geminada (azul)
- [ ] Componente: Badge de conflito (laranja)
- [ ] Componente: Tooltip com detalhes
- [ ] Legenda de cores

### 7.5 Comparador de Soluções
- [ ] Página: `/schedules/:yearId/compare`
- [ ] Seletor: Escolher 2 soluções
- [ ] Visualização: Lado a lado
- [ ] Diff: Destacar diferenças
- [ ] Métricas: Comparar scores
- [ ] Ação: Selecionar uma como principal

---

## Fase 8 - Edição Manual

### 8.1 Drag & Drop
- [ ] Instalar e configurar dnd-kit
- [ ] Componente: Célula arrastável (Draggable)
- [ ] Componente: Slot de destino (Droppable)
- [ ] Visual: Preview durante arraste
- [ ] Visual: Highlight de destinos válidos
- [ ] Visual: Indicador de destino inválido

### 8.2 Validação em Tempo Real
- [ ] Ao iniciar arraste: Calcular destinos válidos
- [ ] Ao hover: Mostrar impacto no score
- [ ] Ao soltar: Validar hard constraints
- [ ] Se inválido: Mostrar motivo e cancelar
- [ ] Se válido: Aplicar e atualizar score

### 8.3 Preview de Impacto
- [ ] Componente: Tooltip de impacto
- [ ] Mostrar: Novo score
- [ ] Mostrar: Janelas criadas/eliminadas
- [ ] Mostrar: Geminadas quebradas
- [ ] Cor: Verde se melhora, vermelho se piora

### 8.4 Undo/Redo
- [ ] Store: Histórico de alterações
- [ ] Função: `undo()` - desfazer última
- [ ] Função: `redo()` - refazer
- [ ] Atalho: Ctrl+Z / Ctrl+Shift+Z
- [ ] UI: Botões de undo/redo no header
- [ ] Limite: Últimas 50 alterações

### 8.5 Outras Ações
- [ ] Ação: Remover aula do slot (mover para "não alocadas")
- [ ] Ação: Trocar duas aulas
- [ ] Ação: Bloquear slot (não pode alocar)
- [ ] Menu: Contexto com ações (right-click)

---

## Fase 9 - Exportação

### 9.1 Exportar PDF por Turma
- [ ] Função: Gerar PDF de uma turma
- [ ] Layout: Grade semanal com cores
- [ ] Header: Nome da escola + turma + ano
- [ ] Footer: Data de geração
- [ ] Qualidade: Pronto para impressão (A4)

### 9.2 Exportar PDF por Professor
- [ ] Função: Gerar PDF de um professor
- [ ] Layout: Grade semanal + métricas
- [ ] Todas as turmas do professor

### 9.3 Exportar PDF Geral
- [ ] Função: Gerar PDF com todas as turmas
- [ ] Uma turma por página
- [ ] Índice no início
- [ ] Numeração de páginas

### 9.4 Exportar Excel
- [ ] Instalar xlsx ou exceljs
- [ ] Aba: Uma por turma
- [ ] Aba: Visão por professor
- [ ] Aba: Resumo de métricas
- [ ] Formatação: Cores, bordas

### 9.5 Link Público
- [ ] Endpoint: POST `/schedules/:id/publish` (gerar link)
- [ ] Endpoint: GET `/public/:token` (acessar horário)
- [ ] Página: Visualização pública (read-only)
- [ ] UI: Botão de copiar link
- [ ] UI: Opção de revogar link

---

## Fase 10 - Polish e Lançamento

### 10.1 Testes de Usabilidade
- [ ] Testar com 3+ usuários reais (diretores/coordenadores)
- [ ] Documentar problemas encontrados
- [ ] Priorizar correções

### 10.2 Ajustes de UX
- [ ] Implementar correções dos testes
- [ ] Revisar textos e labels
- [ ] Adicionar tooltips explicativos
- [ ] Melhorar mensagens de erro
- [ ] Adicionar empty states
- [ ] Adicionar loading states

### 10.3 Página de Landing
- [ ] Criar página em `/` (não logado)
- [ ] Seção: Hero com proposta de valor
- [ ] Seção: Funcionalidades principais
- [ ] Seção: Como funciona (3 passos)
- [ ] Seção: Planos e preços
- [ ] Seção: FAQ
- [ ] Seção: CTA final
- [ ] SEO: Meta tags, OG, sitemap

### 10.4 Pagamentos
- [ ] Configurar Stripe
- [ ] Endpoint: Criar checkout session
- [ ] Endpoint: Webhook de pagamento
- [ ] Página: Escolher plano
- [ ] Página: Sucesso/erro de pagamento
- [ ] Lógica: Limitar funcionalidades por plano
- [ ] UI: Indicador de plano atual
- [ ] UI: Upgrade/downgrade

### 10.5 Deploy de Produção
- [ ] Configurar domínio (gradely.com.br ou similar)
- [ ] Deploy frontend na Vercel
- [ ] Deploy backend na Railway/Render
- [ ] Configurar banco de produção (Supabase)
- [ ] Configurar SSL
- [ ] Configurar monitoramento (Sentry)
- [ ] Configurar analytics (Plausible/Posthog)
- [ ] Testar fluxo completo em produção

### 10.6 Documentação
- [ ] Help center: Primeiros passos
- [ ] Help center: Cadastrar professores
- [ ] Help center: Configurar disponibilidade
- [ ] Help center: Gerar horário
- [ ] Help center: Editar manualmente
- [ ] Help center: Exportar
- [ ] Help center: FAQ
- [ ] Vídeos tutoriais (opcional)

---

## Pós-Lançamento (Backlog)

### Melhorias Futuras
- [ ] Importação de dados do ano anterior
- [ ] Templates de horário pré-definidos
- [ ] Notificações por email
- [ ] App mobile (React Native)
- [ ] API pública para integrações
- [ ] Relatórios avançados de analytics
- [ ] Multi-idioma (internacionalização)
- [ ] Suporte a múltiplos turnos por turma
- [ ] Substituições temporárias de professor
- [ ] Integração com calendário (Google, Outlook)

---

## Notas

- Marque `[x]` ao completar cada item
- Adicione data de conclusão se quiser: `[x] Item (2024-01-15)`
- Risque itens que não serão feitos: `~~[ ] Item cancelado~~`
- Adicione itens extras conforme necessário
