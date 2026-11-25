#!/usr/bin/env bash
set -euo pipefail
# Publish existing public-facing pages and assets, not the entire working tree.
out="${1:-_site}"
mkdir -p "$out"
for path in *.html .nojekyll CNAME robots.txt sitemap.xml feed.xml favicon.ico; do
  [ -f "$path" ] || continue
  cp -- "$path" "$out/"
done
for dir in css js img images assets fonts blog files data pagefind admin growth; do
  [ -d "$dir" ] || continue
  mkdir -p "$out/$dir"
  rsync -a --exclude='.*' --exclude='*.bak' --exclude='*.backup' --exclude='*.backup.*' --exclude='*-test.json' --exclude='*.tmp' --exclude='*.temp' --exclude='*-optimized.html' --exclude='*.original' --exclude='*.log' --exclude='*.env' --exclude='*~' --exclude='backups/' --exclude='drafts/' --exclude='*.pem' --exclude='*.key' --exclude='node_modules/' "$dir/" "$out/$dir/"
done
# Public repository contents remain public even if excluded here.
test -s "$out/index.html"
test -s "$out/growth/index.html"
touch "$out/.nojekyll"
printf '{"commit":"%s","built_at":"%s"}\n' "$(git rev-parse HEAD)" "$(date -u +%FT%TZ)" > "$out/deployment.json"
