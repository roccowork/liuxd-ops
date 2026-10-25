#!/usr/bin/env bash
# 分段渲染（每段 450 帧），中断后重跑会跳过已完成的段；最后拼接并混入配乐
set -euo pipefail
cd "$(dirname "$0")"
B=${BROWSER:-/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell}
OUT=../site/public/video
mkdir -p out "$OUT"
for i in 0 1 2 3 4 5; do
  f=out/part$i.mp4
  [ -s "$f" ] && { echo "skip $f"; continue; }
  s=$((i * 450)); e=$((s + 449))
  ./node_modules/.bin/remotion render src/index.ts Showreel "$f.tmp.mp4" --frames=$s-$e --codec h264 --crf 27 --muted \
    --gl=swangle --browser-executable "$B" --concurrency 4 --log=error
  mv "$f.tmp.mp4" "$f"
  echo "done $f"
done
printf "file 'part%d.mp4'\n" 0 1 2 3 4 5 > out/list.txt
FF=./node_modules/.bin/remotion
$FF ffmpeg -y -f concat -safe 0 -i out/list.txt -i public/music.mp3 \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 128k \
  -af "volume=0.85,afade=t=in:d=1,afade=t=out:st=88:d=2" -t 90 -movflags +faststart "$OUT/showreel.mp4"
./node_modules/.bin/remotion still src/index.ts Showreel "$OUT/poster.jpg" --frame 470 --image-format jpeg --jpeg-quality 85 \
  --gl=swangle --browser-executable "$B" --log=error
ls -la "$OUT"
