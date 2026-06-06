# Verve

**Presença que gera oportunidades.**

Atendimento inteligente para pequenos negócios que atendem pelo WhatsApp.

A Verve mantém o negócio presente, acessível e responsivo — mesmo quando a pessoa não pode estar ali. A tecnologia fica nos bastidores. O que o cliente percebe é presença.

---

## O que é

A Verve não se posiciona como chatbot, automação ou ferramenta de IA.

É um serviço de atendimento inteligente: cada cliente recebe um agente configurado com o nome, tom e regras do próprio negócio, que responde no WhatsApp 24h por dia sem perder nenhuma oportunidade.

**Frase central:** Presença que gera oportunidades.  
**Promessa:** Seu negócio merece estar presente mesmo quando você não pode estar.  
**Categoria:** Atendimento inteligente para pequenos negócios.

---

## Status do projeto

A Verve está em produção com clientes reais pagantes.

Este repositório reúne os dois produtos construídos para viabilizar o serviço: a landing page institucional e o painel administrativo interno. Ambos foram desenvolvidos integralmente por mim — da concepção ao deploy.

---

## O que foi construído

### Landing page — `landing/`
Site institucional em HTML e CSS puro, sem frameworks. Desenvolvido com foco em design editorial, copywriting e conversão. Inclui SEO semântico completo, responsividade para todos os dispositivos e identidade visual própria.

→ [README da landing](./landing/README.md)

### Painel administrativo — `admin/`
Aplicação React para gestão operacional do serviço. Permite cadastrar clientes, editar prompts dos agentes de IA, acompanhar métricas de MRR, churn e LTV, registrar pagamentos e monitorar alertas de vencimento. Consome uma API REST construída em n8n com dados em PostgreSQL.

→ [README do admin](./admin/README.md)

---

## Para quem é

- MEIs e pequenas empresas com até 10 funcionários
- Negócios que recebem pelo menos 20 mensagens por dia no WhatsApp
- Salões, clínicas, academias, pet shops, ateliês e consultórios
- Donos que ainda centralizam o atendimento
- Empresas que perdem oportunidades fora do horário comercial

---

## Planos

| Plano | Mensalidade |
|---|---|
| Essencial | R$ 297/mês |
| Crescimento | R$ 597/mês |

Sem contrato. Sem fidelidade. Cancelamento com 15 dias de antecedência.

---

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Automação / backend | n8n (Railway) |
| Gateway WhatsApp | Evolution API |
| Banco de dados | PostgreSQL (Railway) |
| IA generativa | Claude Sonnet (Anthropic) |
| Painel admin | React (Vercel) |
| Landing page | HTML/CSS (Netlify) |

---

## Estrutura do repositório

```
verve/
├── landing/          # Site institucional (HTML/CSS)
│   ├── index.html
│   └── README.md
├── admin/            # Painel de gestão (React)
│   ├── src/
│   └── README.md
├── docs/             # Documentação do produto
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
└── README.md
```

---

## Links

- **Landing page:** [madebyverve.netlify.app](https://madebyverve.netlify.app)
- **Instagram:** [@_madebyverve](https://www.instagram.com/_madebyverve)
- **WhatsApp:** [Falar com a Verve](https://wa.me/message/6BSWD7TOGCXEC1)

---

Desenvolvido por [Isadora Testa](https://github.com/isadoratesta) · 2026
