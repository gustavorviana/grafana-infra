# Observability Lab

Stack Docker Compose de laboratorio/MVP para logs com Grafana, Loki e interface de ingestao.

> Esta configuracao e para laboratorio/MVP, nao para producao. Revise seguranca, retencao, autenticacao, limites, backups e exposicao de rede antes de usar em ambientes reais.

## Servicos

| Servico | URL | Descricao |
|---|---|---|
| Grafana | <http://localhost:3000> | Interface para consultar logs |
| Logs App | <http://localhost:3002> | Plataforma de ingestao de logs |
| Loki | interno (3100) | Armazenamento de logs, sem porta publica |
| Cloudflared | — | Tunnel para expor o Grafana externamente |

## Como subir

```sh
cp .env.example .env  # configure TUNNEL_TOKEN se usar Cloudflared
docker compose up -d
```

## Acessos padrao

| Servico | Usuario | Senha |
|---|---|---|
| Grafana | `admin` | `admin` |
| Logs App | `admin` | `admin` |

O datasource Loki e provisionado automaticamente no Grafana.

## Consultar logs no Grafana

1. Abra <http://localhost:3000>
2. Va em **Explore**
3. Selecione datasource `Loki`
4. Consulte com LogQL:

```logql
{container=~".+"}
```

## Enviar logs via API

Veja [logs-app/README.md](logs-app/README.md) para documentacao completa da API de ingestao.

Exemplo rapido:

```bash
curl -X POST http://localhost:3002/api/log \
  -H "Authorization: Bearer lgt_seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '[{"level":"INFO","logs":[{"content":"Hello from my service"}]}]'
```

## Cloudflared

Requer `TUNNEL_TOKEN` no `.env`. Sobe automaticamente com `docker compose up`.

Nao exponha o Loki diretamente na internet — ele fica sem porta publica nesta stack.
