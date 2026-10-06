#!/usr/bin/env bash
set -euo pipefail
# Invoke with a tested immutable image tag. Does not initialize/reset accounting.
image=${1:?Usage: run-container.sh IMAGE}
test -s /srv/isnadlens/runtime.env
test -s /srv/isnadlens/private/api-spend.json
test -s /srv/isnadlens/private/speech/quota.json
if sudo docker container inspect isnadlens >/dev/null 2>&1; then
  sudo docker stop --time 260 isnadlens
  sudo docker rename isnadlens "isnadlens-previous-$(date -u +%Y%m%dT%H%M%SZ)"
fi
sudo docker run -d --name isnadlens --restart unless-stopped \
  --memory 2800m --memory-swap 3500m --cpus 1.75 --pids-limit 256 \
  --shm-size 256m --security-opt no-new-privileges \
  --log-opt max-size=10m --log-opt max-file=3 \
  -p 127.0.0.1:3100:3100 \
  --env-file /srv/isnadlens/runtime.env \
  --mount type=bind,src=/srv/isnadlens/private,dst=/app-private \
  "$image"
