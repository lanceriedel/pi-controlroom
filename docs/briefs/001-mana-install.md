# 001 — Install Mana (Shopify) into the Obsidian vault at ~/Documents/mana

## Objective
Get Mana (Shopify's Obsidian-based management sidekick) installed and linked into the Obsidian vault at `~/Documents/mana`, following the project README, so the human can enable the plugin in Obsidian and run the bootstrap prompt. Report exactly what was done, what was verified, and what manual steps remain.

## Inputs
- README (authoritative): `~/src/github.com/Shopify/mana/README.md` (clone already present; also mirrored at `/tmp/mana-readme/README.md`). Upstream: https://github.com/Shopify/mana
- Already true on this machine (verify, don't redo):
  - Obsidian installed: `/Applications/Obsidian.app`
  - Vault dir exists with `.obsidian/`: `~/Documents/mana/.obsidian/` (currently empty — that is fine; the README only requires the dir to exist before `dev link-to-vault`)
  - `dev` CLI on PATH: `~/.local/state/tec/toolchain/base_profile/share/dev/bin/user/dev`
  - `mana` CLI is **not** yet on PATH
- Reference docs if needed: `~/src/github.com/Shopify/mana/docs/CLI.md`, `docs/SETTINGS.md`

## Steps (from the README "Manual install" section)
```bash
cd "$(dev cd -n mana)"                  # should resolve to ~/src/github.com/Shopify/mana; if not, run `dev clone mana` first
dev up                                  # install deps
dev install-cli                         # build + link `mana` CLI globally
mana init --vault ~/Documents/mana      # scaffold Mana files into the vault
dev link-to-vault ~/Documents/mana      # symlink plugin into the vault
```
Then verify:
- `which mana && mana --version` (or `mana --help`)
- `ls -la ~/Documents/mana` shows scaffolded files (expect e.g. `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`, `ONDECK.md`, `DREAMS.md`, `MEMORY.md`, `knowledge/`)
- `ls -la ~/Documents/mana/.obsidian/plugins/` shows a `mana` symlink pointing into the repo, containing `main.js` + `manifest.json`
- Do **not** attempt to drive the Obsidian GUI (enabling community plugins, toggling Mana, connecting services) — those are the human's manual steps.

## Constraints
- Time-box every command: wrap each in `timeout 900 …` (`gtimeout` if `timeout` is missing — `brew install coreutils` is acceptable — or `perl -e 'alarm 900; exec @ARGV' -- cmd`). If a step hangs or fails, capture the last ~40 lines of output, write partial results, and continue to the next step only if it is independent; otherwise stop and report.
- Do not delete or overwrite anything already in `~/Documents/mana`. If `mana init` prompts about existing files, choose the non-destructive option.
- Do not `git pull`/modify the mana repo beyond what `dev up`/`dev install-cli` do themselves.
- Do not touch Obsidian's running state (don't kill/restart it).
- No pushes, no commits.

## Deliverable
`docs/briefs/results/001-mana-install.md` (in this repo, `~/src/github.com/lanceriedel/pi-controlroom`) containing:
1. **Status**: `done` / `partial` / `blocked` with one line why.
2. **What ran**: each command, rc, and 3–5 line output summary (full logs go to `logs/scratch/001-mana-*.log` in this repo).
3. **Verification**: the three checks above with actual output.
4. **Remaining manual steps for the human**: copy the README's "Enable Mana in Obsidian" steps 1–5 and 7–8 verbatim-ish, adapted to what you observed.
5. **Bootstrap prompt** — reproduce verbatim from the README so the controller can hand it to the human:
   > Please read `BOOTSTRAP.md` and run first-time setup for this vault. Look me up in Vault, discover my team, likely Slack channels, and relevant GitHub repos, then show me what you found before updating `IDENTITY.md`, `USER.md`, `ONDECK.md`, `DREAMS.md`, `MEMORY.md`, and `knowledge/`.
6. **Gotchas** encountered (auth prompts, version mismatches, etc.).

When finished, print the sentinel line `DONE 001` and go idle.
