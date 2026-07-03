#!/bin/sh
set -e

mkdir -p grafana/data loki/data logs-app/data

chown -R 472:472 grafana/data
chown -R 10001:10001 loki/data
chown -R 1001:1001 logs-app/data

echo "Permissoes configuradas. Pode rodar: docker compose up -d"
