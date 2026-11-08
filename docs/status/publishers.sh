#!/bin/bash
# docs/status/publishers.sh — extra publishers for `controlroom status-page --publish` (015). chmod +x to enable. Env: STATUS_MD STATUS_HTML STATUS_URL ROOT.
# Each publisher prints one line `published <name>` on success (counted in logs/publish.log).
# GitHub Pages itself is handled by `controlroom-pages push` (016: orphan gh-pages branch, one commit) — not here.
# lancedocs example (Lance's laptop):
#   D=$HOME/.brain/memory-bank/personal/docs/$(basename "$ROOT"); mkdir -p "$D" && cp "$STATUS_HTML" "$D/where-we-stand-latest.html" \
#     && BRAIN_ROOT=$HOME/.brain bash ~/.brain/memory-bank/personal/docs/deploy-lancedocs.sh </dev/null >/dev/null 2>&1 && echo "published lancedocs"
