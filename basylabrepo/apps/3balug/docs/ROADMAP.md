# Roadmap - CRM Imobiliario 3Balug

**Cliente:** Daniel Borges da Silva  
**Periodo:** 02/12/2025 a 30/04/2026  
**Desenvolvedor:** Felipe Silveira Bassetto

---

## Visao Geral

| Fase | Duracao | Valor | Status |
|------|---------|-------|--------|
| **FASE 1** - Plataforma Web | 4 meses | R$ 2.400 | Em andamento |
| **FASE 2** - App Mobile | 1 mes | R$ 800 | Aguardando |
| **Total** | 5 meses | **R$ 3.200** | R$ 525 recebido |

---

## Cronograma FASE 1 (02/12/2025 - 31/03/2026)

| Semana | Periodo | Entrega | Status |
|--------|---------|---------|--------|
| 1 | 02-08/12 | Setup + Auth + Pagamentos | Completo |
| 2 | 09-15/12 | Arquitetura Multi-Usuario | Completo |
| 3 | 16/12-05/01 | Imoveis + Contratos + Upload | Completo |
| 4-6 | 06-26/01 | **Sistema de Leads + Esteira Kanban** | Proximo |
| 7-8 | 27/01-09/02 | Sistema Financeiro + Split | Pendente |
| 9-10 | 10-23/02 | Administracao + Gestao | Pendente |
| 11-12 | 24/02-09/03 | Seguros + Desk Data | Pendente |
| 13-14 | 10-23/03 | BI + Afiliados + Marketplace | Pendente |
| 15-17 | 24-31/03 | Testes + Buffer + Entrega | Pendente |

---

## Semanas Completas (Resumo)

### Semana 1-2: Infraestrutura + Multi-Usuario
- Setup completo (Bun, Elysia, React 19, PostgreSQL, Drizzle)
- Autenticacao JWT + 2FA + Recuperacao de senha
- Integracao Pagarme (tokenizacao + pagamento)
- Sistema de Planos + Checkout
- CRUD de Usuarios com ACL por roles
- 33 testes E2E passando

### Semana 3: Imoveis + Contratos
- CRUD PropertyOwners (28 testes)
- CRUD Tenants (28 testes)
- CRUD Properties com fotos (90 testes)
- CRUD Contracts + Terminate (87 testes)
- Dashboard com stats reais
- Upload de arquivos (MinIO)
- Frontend completo para todas as entidades
- **Total: 550 testes passando**

### Homologacao Pendente
- [ ] Deploy em HOMOLOG
- [ ] Correcao de bugs (Safari, virgulas)
- [ ] Reuniao com cliente
- [ ] **2a Parcela: R$ 960**

---

## Semanas 4-6 (06-26/01) - Sistema de Leads + Esteira Kanban

> **MUDANCA PRINCIPAL:** Inquilino vira etapa final do Lead, nao entidade separada.

### Conceito da Esteira

```
ORIGEM -> ENTRADA -> ANALISE -> DOCUMENTACAO -> SEGURO -> DEVOLUTIVA -> PROPOSTA -> CONTRATO -> ADMINISTRACAO
```

### Backend - Leads

**Schemas:**
- `leads` (name, cpf, email, phone, origin, type, currentStage, assignedTo, propertyId)
- `lead_stages` (leadId, stage, enteredAt, exitedAt, duration, actionBy)
- `lead_documents` (leadId, type, fileId, status, reviewedBy, rejectionReason)
- `lead_timeline` (leadId, action, description, userId, createdAt)

**Use Cases:**
- [ ] CreateLeadUseCase
- [ ] MoveLeadToStageUseCase (muda etapa + registra historico)
- [ ] AssignLeadUseCase
- [ ] UploadLeadDocumentUseCase
- [ ] ReviewLeadDocumentUseCase (aprovar/rejeitar)
- [ ] GetLeadTimelineUseCase
- [ ] GetLeadsByStageUseCase (para Kanban)
- [ ] GetStageMetricsUseCase (tempo medio - acesso master)
- [ ] ConvertLeadToTenantUseCase
- [ ] AddLeadNoteUseCase (observacoes tipo chat)

**Regras de Negocio:**
- DOCUMENTACAO: "seguir sem documento" requer justificativa
- ANALISE DE SEGURO: acesso exclusivo admin master 3balug
- DEVOLUTIVA: parecer APROVADO ou REPROVADO (reprovado volta com historico)
- ADMINISTRACAO: ja vem com imovel, contrato, inquilino vinculados

### Frontend - Kanban

- [ ] Pagina `/leads` com visualizacao Kanban
- [ ] Colunas arrastaveis (drag & drop)
- [ ] Card de lead: nome, origem, tipo, dias na etapa
- [ ] Cores por tempo (verde < 3d, amarelo 3-7d, vermelho > 7d)
- [ ] Modal de detalhes: dados, timeline, documentos, observacoes
- [ ] Filtros: corretor, origem, tipo, periodo
- [ ] Metricas no topo (acesso master)

---

## Semanas 7-8 (27/01-09/02) - Sistema Financeiro

### Cobrancas (Pagarme)
- [ ] Schema `charges` + `payments`
- [ ] Job mensal: gera cobrancas automaticas
- [ ] Webhook Pagarme: processa pagamentos
- [ ] Multa 2% + juros 1% ao mes
- [ ] Notificacoes: 3 dias antes, no dia, 3 dias depois
- [ ] Notificacao de atraso para imobiliaria E corretor

### Split Financeiro
- [ ] **ANALISE PENDENTE:** conta unica vs divisao com mensalidades
- [ ] Schema `revenue_splits`
- [ ] Split por contrato (corretor, proprietario, plataforma 3%)
- [ ] Gatilho de pagamento com valor

### Painel Financeiro
- [ ] Dashboard: receita, pendente, recebido, atrasado
- [ ] Grafico de fluxo de caixa
- [ ] Correcao: virgulas em valores monetarios

---

## Semanas 9-10 (10-23/02) - Administracao (ex-Contratos)

> **RENOMEACAO:** "Contrato" -> "Administracao" para evitar confusao.

### Template Customizavel
- [ ] Schema `contract_templates` (campos dinamicos [NOME], [CPF], etc)
- [ ] Editor de template
- [ ] Preview antes de gerar
- [ ] Geracao de PDF preenchido

### Administracao em Steps
1. Dados do Contrato (imovel, inquilino, valores)
2. Garantias (Caucao/Deposito | Seguro Fianca | DEIN)
3. Documentos (anexar contratos, laudos)
4. Assinatura

### Melhorias
- [ ] Campos RG/CPF por linha (nao por selecao)
- [ ] Imagem do imovel e inquilino no contrato
- [ ] Observacoes com historico tipo chat
- [ ] Visualizar: tela separada | Criar/Editar: modal
- [ ] Correcao: aluguel com valor invalido

### Assinatura Digital
- [ ] Schema `contract_signatures`
- [ ] Componente SignatureCanvas
- [ ] Pagina publica `/sign/:token`

### Reajuste Automatico
- [ ] Schema `contract_adjustments`
- [ ] Integracao API IBGE (IGP-M/IPCA)
- [ ] Job mensal para contratos 12+ meses

### Auditoria
- [ ] Schema `audit_logs`
- [ ] Middleware automatico
- [ ] Pagina `/audit-logs`

---

## Semanas 11-12 (24/02-09/03) - Seguros + Desk Data

### Area do Analista
- [ ] Schema `insurance_policies` + `insurance_documents`
- [ ] CRUD de apolices
- [ ] Upload de documentos
- [ ] Notificacao de vencimento

### Integracao Desk Data
- [ ] Schema `background_checks`
- [ ] ConsultCPFUseCase, ConsultCNPJUseCase
- [ ] Limite por plano (maxSerasaQueries)
- [ ] Historico de consultas

### Painel do Corretor
- [ ] Dashboard especifico para role "broker"
- [ ] Meus imoveis, contratos, comissoes

---

## Semanas 13-14 (10-23/03) - BI + Afiliados + Marketplace

### Business Intelligence
- [ ] Metricas: ocupacao, receita, inadimplencia
- [ ] Ranking de corretores
- [ ] Analise de imoveis
- [ ] Graficos avancados (Recharts)

### Banner Interno
- [ ] Schema `banners` + `banner_views`
- [ ] Gestao e exibicao no dashboard

### Sistema de Afiliados
- [ ] Schema `affiliates` + `affiliate_referrals`
- [ ] Codigo unico, comissao 10% do primeiro pagamento
- [ ] Dashboard do afiliado

### Marketplace
- [ ] Schema `marketplace_listings` + `marketplace_leads`
- [ ] Pagina publica `/marketplace`
- [ ] Formulario de interesse (cria lead)

### Melhorias de Imoveis
- [ ] Codigo unico por imovel
- [ ] Mapa na tela (Google Maps)
- [ ] Botao compartilhar (captura telefone)
- [ ] Imagem em miniatura na lista
- [ ] Cadastro em 7 Steps
- [ ] Percentual de comissao

---

## Semanas 15-17 (24-31/03) - Testes + Entrega [3a Parcela: R$ 915]

### Melhorias de Proprietario
- [ ] Cadastro por Steps
- [ ] Campos customizados
- [ ] Foto e aniversario
- [ ] Historico completo (rastro de tudo)
- [ ] Historico de documentos excluidos

### Correcoes de Bugs
- [ ] Safari quebrando tela inicial
- [ ] Virgulas em valores monetarios

### Testes e Qualidade
- [ ] Cobertura E2E > 80%
- [ ] Testes de integracao
- [ ] Otimizacoes de performance

### Homologacao Final
- [ ] Deploy em PRODUCAO
- [ ] Documentacao completa
- [ ] Treinamento
- [ ] Termo de aceite FASE 1

---

## FASE 2 - App Mobile (01/04 - 30/04/2026)

| Semana | Periodo | Entrega | Parcela |
|--------|---------|---------|---------|
| 1 | 01-06/04 | Setup + Auth + Layout | R$ 240 |
| 2 | 07-13/04 | Dashboards + Listagens | R$ 320 |
| 3 | 14-20/04 | Financeiro + Marketplace + WhatsApp | - |
| 4 | 21-27/04 | Build + Publicacao | R$ 240 |
| 5 | 28-30/04 | Buffer + Entrega Final | - |

### Funcionalidades Mobile
- Login/Logout com JWT
- Dashboard por role (Owner, Broker, Proprietario, Locatario)
- Listagem de imoveis e contratos
- Extrato financeiro
- Marketplace com leads
- Compartilhamento WhatsApp
- Upload de fotos via camera
- Publicacao Google Play + App Store

---

## Fluxo do Lead (Esteira Completa)

```
1. ORIGEM
   - Instagram, site, indicacao, placa

2. ENTRADA NA PLATAFORMA
   - Dados basicos, tipo (LOCACAO/VENDA)

3. ANALISE
   - Dados completos (nome, CPF, telefone, email)

4. DOCUMENTACAO
   - Upload de docs (RG, CPF, comprovantes)
   - Opcao: COM ou SEM analise
   - Sem docs: justificativa obrigatoria

5. ANALISE DE SEGURO (Admin Master 3Balug)
   - Vincula imovel, carta de credito, laudo
   - Cadastra assessoria de seguro

6. DEVOLUTIVA
   - Parecer: APROVADO ou REPROVADO
   - Reprovado: volta com historico

7. PROPOSTA (Tela Financeira)
   - Sobe proposta
   - Conversa com Administracao

8. ASSINATURA DO CONTRATO
   - Formalizacao + assinatura digital

9. ADMINISTRACAO (se locacao)
   - Lead convertido em Inquilino
   - Imovel na gestao
   - Pode editar valores
```

---

## Cronograma de Pagamentos

| # | Valor | Evento | Status |
|---|-------|--------|--------|
| 1 | R$ 525 | Assinatura (02/12/2025) | PAGO |
| 2 | R$ 960 | Homologacao intermediaria | Pendente |
| 3 | R$ 915 | Entrega FASE 1 (31/03/2026) | Pendente |
| 4 | R$ 240 | Inicio FASE 2 | Pendente |
| 5 | R$ 320 | Etapa FASE 2 | Pendente |
| 6 | R$ 240 | Publicacao lojas | Pendente |

---

## Mudancas da Reuniao (05/01/2026)

### Alteracoes Principais

1. **Inquilino -> Lead com Esteira Kanban**
   - 9 etapas ate virar Inquilino
   - Historico completo, metricas de tempo

2. **Contrato -> Administracao**
   - Template customizavel [NOME], [CPF]
   - Steps, observacoes tipo chat

3. **Imoveis**
   - Codigo unico, mapa, compartilhar com captura de telefone
   - Steps, percentual de comissao

4. **Proprietario**
   - Steps, campos customizados, foto, aniversario
   - Historico completo, docs excluidos

5. **Bugs**
   - Safari quebrando, virgulas em valores

### Analise Pendente
- **Split Pagarme:** conta unica vs divisao com mensalidades

---

**Ultima atualizacao:** 05/01/2026  
**Proximo:** Homologacao + Sistema de Leads
