# Observability Lab

Stack Docker Compose de laboratorio/MVP para logs com Grafana e Loki.

> Esta configuracao e para laboratorio/MVP, nao para producao. Revise seguranca, retencao, autenticacao, limites, backups e exposicao de rede antes de usar em ambientes reais.

## Servicos

- Grafana: interface para consultar logs no Explore em <http://localhost:3000>
- Loki: armazenamento e consulta de logs, acessivel apenas pela rede Docker
- Cloudflared: opcional, somente para expor o Grafana

## Como subir

```sh
docker compose up -d
```

Depois acesse o Grafana:

- URL: <http://localhost:3000>
- Usuario: `admin`
- Senha: `admin`

O datasource Loki e provisionado automaticamente.

## Consultar logs no Explore

1. Abra <http://localhost:3000>.
2. Entre com `admin` / `admin`.
3. Va em Explore.
4. Selecione o datasource `Loki`.
5. Consulte logs com LogQL, por exemplo:

```logql
{container=~".+"}
```

## Cloudflared opcional

Para criar um tunnel temporario expondo somente o Grafana:

```sh
docker compose --profile tunnel up -d
```

Nao exponha o Loki diretamente na internet. Nesta stack, ele fica sem porta publicada; apenas o Grafana e vinculado ao localhost.
