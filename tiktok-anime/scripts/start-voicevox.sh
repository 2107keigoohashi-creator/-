#!/usr/bin/env bash
# VOICEVOX Engine を起動する（Docker が止まっていれば起動、イメージ取得は 429 に備えて再試行）
set -u
IMAGE=voicevox/voicevox_engine:cpu-latest

if curl -s localhost:50021/version >/dev/null; then echo "VOICEVOX は起動済み"; exit 0; fi

# Docker を起動（containerd の起動が遅いと失敗することがあるので3回まで試す）
for attempt in 1 2 3; do
  docker info >/dev/null 2>&1 && break
  echo "Docker を起動します…（${attempt}回目）"
  pkill dockerd >/dev/null 2>&1; sleep 2
  (dockerd >/tmp/dockerd.log 2>&1 &)
  for i in $(seq 1 60); do docker info >/dev/null 2>&1 && break; sleep 1; done
done
docker info >/dev/null 2>&1 || { echo "Docker を起動できませんでした（/tmp/dockerd.log を確認）" >&2; exit 1; }

if ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  for wait in 0 30 60 120 240; do
    sleep "$wait"
    docker pull "$IMAGE" && break
    echo "取得に失敗。${wait}秒後に再試行…"
  done
fi

docker rm -f voicevox >/dev/null 2>&1
docker run --rm -d --name voicevox -p 50021:50021 "$IMAGE" >/dev/null
for i in $(seq 1 90); do
  v=$(curl -s localhost:50021/version) && [ -n "$v" ] && { echo "VOICEVOX $v 起動しました"; exit 0; }
  sleep 2
done
echo "VOICEVOX の起動に失敗しました" >&2
exit 1
