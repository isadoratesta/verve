# Verve — Painel Administrativo

Painel de gestão desenvolvido em **React** para operação interna da Verve, um serviço de atendimento inteligente para pequenos negócios via WhatsApp.

O sistema permite gerenciar clientes, acompanhar métricas de negócio e configurar os agentes de IA em produção — tudo em uma interface construída do zero, sem bibliotecas de UI.

---

## Sobre o projeto

A Verve opera um modelo SaaS onde cada cliente possui um agente de IA configurado individualmente no WhatsApp. Este painel foi criado para centralizar a gestão operacional do serviço: onboarding de novos clientes, acompanhamento de pagamentos, edição de prompts e monitoramento de métricas.

O painel consome uma API REST construída em n8n, com dados persistidos em PostgreSQL.

---

## Tecnologias

- React (Create React App)
- JavaScript (ES2021+)
- CSS-in-JS via inline styles
- Google Fonts — Cormorant Garamond + Inter
- Vercel (deploy)
- Variáveis de ambiente para credenciais sensíveis

---

## Funcionalidades

### Dashboard com três níveis de análise

| Aba | Métricas |
|---|---|
| Prioritárias | MRR, churn, pagamentos atrasados, agentes ativos, alertas de vencimento |
| Semanais | Mensagens respondidas, taxa de renovação, novos clientes, receita por plano |
| Mensais | LTV médio, clientes fiéis (+3 meses), solicitações de atendente humano, origem dos clientes |

Inclui gráfico de barras de evolução do MRR construído sem biblioteca de charts.

### Gestão de clientes

- Listagem com busca em tempo real
- Cadastro de novos clientes com validação
- Visualização individual com abas por contexto
- Atualização inline com `onBlur` — sem botão de salvar explícito
- Ações rápidas: suspender, reativar, cancelar

### Editor de prompt

Cada cliente possui um prompt individualizado que define o comportamento do agente de IA no WhatsApp. O painel permite editar e salvar esse prompt diretamente, sem necessidade de acesso ao backend.

### Onboarding checklist

Checklist interativo com 5 etapas de ativação por cliente, com barra de progresso e persistência via API.

### Registro de pagamentos

Histórico de pagamentos por cliente com registro manual de novas entradas e atualização automática do status de adimplência.

### Alertas automáticos

O dashboard sinaliza automaticamente clientes com vencimento nos próximos 7 dias e pagamentos em atraso, com link direto para o WhatsApp do cliente.

---

## Arquitetura e decisões técnicas

**Autenticação por sessão:** login com senha via `sessionStorage`, sem dependência de serviço externo de auth. Adequado para uso interno com usuário único.

**Atualização otimista:** o estado local é atualizado imediatamente após cada ação, sem aguardar confirmação da API, para garantir uma experiência fluida.

**Normalização de dados:** função `normalize()` que padroniza os campos retornados pela API independente de variações de nomenclatura no banco.

**Sem biblioteca de UI:** todos os componentes — cards, badges, tabelas, modais, barras de progresso — foram construídos manualmente com inline styles, garantindo controle total sobre o design.

**Identidade visual consistente:** paleta, tipografia e espaçamentos alinhados à landing page institucional da Verve, definidos em constantes reutilizáveis no topo do arquivo.

**Variáveis de ambiente:** credenciais e endpoints sensíveis isolados via `process.env`, sem exposição no repositório público.

---

## Identidade visual

Mesma linguagem da landing page institucional.

| Elemento | Valor |
|---|---|
| Preto editorial | `#1B1B1B` |
| Creme principal | `#F7F4EE` |
| Dourado | `#A88A55` |
| Cinza pedra | `#8B8378` |

---

## Integração com o backend

O painel consome uma API REST via webhooks do n8n:

| Endpoint | Método | Função |
|---|---|---|
| `/clientes` | GET | Listar todos os clientes |
| `/clientes` | POST | Cadastrar novo cliente |
| `/clientes/atualizar` | PUT | Atualizar dados do cliente |
| `/clientes/cancelar` | POST | Cancelar cliente |
| `/pagamentos` | POST | Registrar pagamento |

---

## Meu papel

Desenvolvi o painel integralmente, desde a concepção até o deploy:

- Definição das funcionalidades e fluxos de uso
- Arquitetura dos componentes React
- Implementação de todas as telas e interações
- Integração com a API REST do n8n
- Identidade visual alinhada à marca Verve
- Configuração de variáveis de ambiente e segurança
- Deploy e configuração no Vercel

---

## Status

Em produção, utilizado ativamente na operação da Verve com clientes reais.

---

## Possíveis evoluções

- Autenticação com múltiplos usuários e níveis de acesso
- Notificações por e-mail para alertas de vencimento
- Exportação de relatórios em CSV
- Gráficos com biblioteca dedicada (Recharts ou Chart.js)
- Componentização em arquivos separados
- Testes automatizados

---

## Licença

Todos os direitos reservados à Verve. Projeto proprietário — não deve ser copiado, distribuído ou reutilizado sem autorização.
