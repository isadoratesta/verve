# Verve — Automação e Backend

Documentação técnica do sistema de atendimento inteligente da Verve: arquitetura, workflows e integrações.

---

## Visão geral

O backend da Verve é construído sobre **n8n** hospedado no Railway, responsável por orquestrar toda a lógica de atendimento: receber mensagens do WhatsApp, consultar o contexto do cliente, chamar a API do Claude e devolver respostas em tempo real.

O sistema é **multi-tenant**: cada cliente da Verve tem sua própria instância no Evolution API, seu próprio prompt armazenado no PostgreSQL e seu próprio agente com nome, tom e regras configurados individualmente.

---

## Arquitetura

```
WhatsApp (usuário final)
        ↓
Evolution API (gateway WhatsApp)
        ↓
n8n Webhook (Railway)
        ↓
[Workflow: Assistente de Atendimento]
        ↓
PostgreSQL (Railway) ←→ Claude Sonnet API (Anthropic)
        ↓
Evolution API → WhatsApp (resposta)
```

---

## Workflow principal — Assistente de Atendimento

O workflow principal possui **17 nós** e processa cada mensagem recebida no WhatsApp seguindo este fluxo:

### 1. Entrada
**Webhook** recebe o payload da Evolution API com a mensagem do usuário.

### 2. Validações
- **If (Horário de Atendimento)** — verifica se a mensagem chegou dentro do horário configurado (7h–23h, fuso América/São_Paulo). Fora do horário, envia mensagem automática informando indisponibilidade.
- **If (Limite de Mensagem por Contato)** — anti-spam: bloqueia contatos que enviam mais de 10 mensagens em 5 minutos.

### 3. Contexto
- **Execute a SQL (Busca Cliente)** — identifica o cliente da Verve pela instância Evolution API que recebeu a mensagem. Retorna o prompt personalizado daquele negócio.
- **Execute a SQL (Busca/Cria Contato)** — busca o contato no banco ou cria um novo registro se for o primeiro contato.
- **Execute a SQL query (Histórico de Conversa)** — recupera as últimas 5 mensagens da conversa para enviar como contexto ao modelo.

### 4. Geração de resposta
**Message a model (Claude)** — chama a API do Claude Sonnet (Anthropic) com:
- System prompt dinâmico do cliente (carregado do PostgreSQL)
- Histórico das últimas 5 mensagens
- Mensagem atual do usuário

### 5. Verificação de escalação
**If (Solicitação de Atendimento Humano)** — analisa a resposta do Claude para detectar se o cliente quer falar com um humano. Se sim, envia notificação via WhatsApp para a responsável pelo negócio.

### 6. Envio da resposta
- **HTTP Request (Writing)** — ativa o indicador de digitação no WhatsApp
- **Wait** — aguarda entre 3 e 8 segundos (delay humanizado)
- **HTTP Request (Typing)** — mantém o indicador ativo durante o delay
- **HTTP Request** — envia a resposta final via Evolution API

### 7. Persistência
**Execute a SQL (Salva Mensagem)** — salva a mensagem do usuário e a resposta do agente no PostgreSQL para histórico e métricas.

---

## API REST — Workflows auxiliares

Além do workflow principal de atendimento, dois workflows expõem uma API REST consumida pelo painel administrativo React:

### Flow IA API — Parte I

| Método | Endpoint | Função |
|---|---|---|
| GET | `/clientes` | Lista todos os clientes com métricas de mensagens e pagamentos |
| POST | `/clientes` | Cadastra novo cliente |
| PUT | `/clientes/atualizar` | Atualiza dados do cliente (status, prompt, contato, plano) |

### Flow IA API — Parte II

| Método | Endpoint | Função |
|---|---|---|
| POST | `/pagamentos` | Registra novo pagamento |
| GET | `/mensagens` | Retorna histórico de mensagens por cliente |
| POST | `/clientes/cancelar` | Cancela cliente e registra data de suspensão |

---

## Banco de dados — PostgreSQL

Principais tabelas:

| Tabela | Descrição |
|---|---|
| `clientes` | Dados dos clientes da Verve: nome, instância, plano, prompt, status, vencimento |
| `contatos` | Usuários finais que interagiram com cada agente |
| `mensagens` | Histórico completo de conversas por cliente e contato |
| `pagamentos` | Registro de pagamentos por cliente |

O campo `prompt` da tabela `clientes` armazena as instruções individuais de cada agente — é o que garante que cada negócio tenha uma IA com identidade própria.

---

## Integração com Claude API

O modelo utilizado é o **Claude Sonnet** (Anthropic), chamado diretamente via nó nativo do n8n (`@n8n/n8n-nodes-langchain.anthropic`).

Cada chamada envia:
- **System prompt** dinâmico carregado do PostgreSQL por cliente
- **Histórico** das últimas 5 mensagens da conversa
- **Mensagem atual** do usuário

Isso garante que o modelo responda sempre dentro do contexto e das regras definidas para cada negócio.

---

## Decisões técnicas

**Delay humanizado:** a resposta não é enviada imediatamente — o sistema aguarda entre 3 e 8 segundos com indicador de digitação ativo, simulando um atendimento humano e evitando parecer um bot.

**Multi-tenant por instância:** o roteamento entre clientes é feito pelo campo `instancia_evolution` — cada negócio tem uma instância própria no Evolution API, e o webhook identifica qual cliente servir pela instância que recebeu a mensagem.

**Prompt dinâmico:** o prompt não é hardcoded no workflow — é carregado do banco a cada execução, permitindo que o painel admin atualize o comportamento do agente em tempo real sem nenhuma mudança no n8n.

**Timezone explícito:** o Railway roda em UTC. Todas as comparações de horário usam conversão explícita para `America/Sao_Paulo` para evitar erros no bloqueio fora do horário.

**Always Output Data:** nós de SQL que podem retornar zero linhas têm `Always Output Data = true` para evitar que o workflow quebre silenciosamente.

---

## Stack

| Componente | Tecnologia |
|---|---|
| Orquestração | n8n (Railway) |
| Gateway WhatsApp | Evolution API |
| Banco de dados | PostgreSQL (Railway) |
| IA generativa | Claude Sonnet — Anthropic |
| Painel admin | React (Vercel) |
| Landing page | HTML/CSS (Netlify) |

---

## Arquivos de workflow

Os workflows exportados do n8n estão disponíveis nesta pasta para referência e importação:

- `Assistente_de_Atendimento.json` — workflow principal de atendimento
- `Flow_IA_API_Parte_I.json` — API REST: clientes (listar, cadastrar, atualizar)
- `Flow_IA_API_Parte_II.json` — API REST: pagamentos, mensagens, cancelamento
- `Execute_a_SQL_query_Prompt_Exemplo.json` — exemplo de prompt configurado para um cliente fictício

---

## Exemplo de prompt — Bella Studio (fictício)

O arquivo `Execute_a_SQL_query_Prompt_Exemplo.json` contém um exemplo completo de como um prompt de cliente é estruturado e armazenado no PostgreSQL.

O **Bella Studio** é um salão de beleza fictício criado exclusivamente para fins de demonstração. O prompt de exemplo inclui:

- Nome e personalidade do agente (`Luna`)
- Endereço, horários e serviços do negócio
- Tabela de preços
- Equipe e especialidades
- Regras de atendimento e tom de comunicação
- Instruções sobre agendamento e escalação humana

Este exemplo ilustra como cada cliente da Verve recebe um agente com identidade própria, configurado individualmente sem nenhuma mudança no workflow principal.
