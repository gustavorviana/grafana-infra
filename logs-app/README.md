# Logs App

Plataforma de ingestão de logs com interface web para gerenciamento de aplicações, tokens e usuários. Atua como proxy autenticado entre seus serviços e o Grafana Loki.

## Como funciona

```
Seu serviço → POST /api/log (token) → Logs App → Loki → Grafana
```

O app valida o token, identifica a aplicação e encaminha os logs ao Loki com os labels corretos.

## Rodando com Docker

```bash
docker compose up logs-app
```

Acesse em `http://localhost:3002`. Login padrão: `admin` / `admin`.

## Enviando logs

### 1. Crie uma aplicação e gere um token

No painel web: **Aplicações → Nova aplicação → Tokens → Gerar token**

O token tem formato `lgt_<48 hex chars>`.

### 2. POST /api/log

**Headers:**
```
Authorization: Bearer lgt_seu_token_aqui
Content-Type: application/json
```

**Body:**
```json
[
  {
    "level": "INFO",
    "host": "meu-servidor",
    "logs": [
      {
        "time": "2025-01-15T10:30:00Z",
        "content": "Usuário autenticado com sucesso",
        "metadata": {
          "userId": "123",
          "ip": "192.168.1.1"
        }
      }
    ]
  }
]
```

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `level` | `INFO` \| `WARNING` \| `ERROR` \| `CRITICAL` | Sim | Nível do log |
| `host` | string | Não | Label de hostname no Loki |
| `logs[].time` | ISO 8601 ou nanosegundos | Não | Timestamp (padrão: agora) |
| `logs[].content` | string ou objeto | Sim | Conteúdo do log |
| `logs[].metadata` | `Record<string, string>` | Não | Labels extras no Loki |

**Exemplo com curl:**
```bash
curl -X POST http://localhost:3002/api/log \
  -H "Authorization: Bearer lgt_seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '[{"level":"ERROR","logs":[{"content":"Falha na conexão com banco de dados"}]}]'
```

**Resposta:** repassa o status do Loki diretamente (`204 No Content` em caso de sucesso).

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `LOKI_URL` | `http://localhost:3100` | URL base do Loki |
| `DATABASE_PATH` | `data/logs.db` | Caminho do banco SQLite |
| `ADMIN_USERNAME` | `admin` | Usuário admin inicial |
| `ADMIN_PASSWORD_HASH` | — | Hash bcrypt da senha admin |
