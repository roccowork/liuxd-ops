#!/usr/bin/env bash
# 用 Edge 无头模式把 resume.html 打印成 PDF：
#   完整版（带手机号，投递用）→ resume/刘晓东-运维工程师.pdf
#   公开版（不带手机号，网站下载用）→ site/public/resume/liuxiaodong-resume.pdf
set -euo pipefail
cd "$(dirname "$0")"

EDGE="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
SRC="file:///$(cygpath -m "$PWD/resume.html")"
PUB_DIR="../site/public/resume"
mkdir -p "$PUB_DIR"

print() { # $1=url  $2=输出文件
  "$EDGE" --headless --disable-gpu --no-pdf-header-footer \
    --user-data-dir="$(cygpath -w "${TMP:-/tmp}")\\edge-pdf" \
    --print-to-pdf="$(cygpath -w "$2")" "$1" 2>/dev/null
  echo "生成：$2"
}

print "$SRC" "$PWD/刘晓东-运维工程师.pdf"
print "$SRC?public" "$(cd "$PUB_DIR" && pwd)/liuxiaodong-resume.pdf"
