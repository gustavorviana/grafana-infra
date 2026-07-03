# Deploy — logs-app

## Sumário

- [Build da imagem](#build-da-imagem)
- [Múltiplas instâncias](#múltiplas-instâncias)
- [Atualizar para nova versão](#atualizar-para-nova-versão)
- [Listar imagens disponíveis](#listar-imagens-disponíveis)

---

## Build da imagem

Execute a partir da raiz do projeto (onde fica o `docker-compose.yml`):

```bash
docker build -t logs-app ./logs-app
```

Ou de dentro da pasta `logs-app`:

```bash
docker build -t logs-app .
```

> Sem tag explícita, usa `:latest`. Rebuildar substitui a imagem existente; a anterior vira dangling (`<none>`).

---

## Atualizar para nova versão

### 1. Build da nova imagem

```bash
docker build -t logs-app ./logs-app
```

### 2. Reiniciar só o serviço

```bash
docker compose up -d --no-deps logs-app
```

> `--no-deps` garante que Loki e Grafana não são derrubados.

### 3. Verificar que subiu

```bash
docker compose ps
```

### 4. Limpar imagens dangling (antigas sem tag)

```bash
docker image prune
```

---

## Listar imagens disponíveis

```bash
docker images logs-app
```
