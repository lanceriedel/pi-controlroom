# 001 — Mana install results

Brief: `docs/briefs/001-mana-install.md` · Run: 2026-10-26 17:31–17:33 EDT
Repo: `~/src/github.com/Shopify/mana` @ `2ec3b7b` ("chore: rebuild artifacts after merge (#338)"), version `2026.1022.1311`
Full logs: `logs/scratch/001-mana-*.log` (this repo)

## 1. Status

**`done`** — all four install steps ran cleanly (rc=0), all three verifications pass; only the Obsidian GUI steps remain for the human.

## 2. What ran

All commands were wrapped in `perl -e 'alarm 900; exec @ARGV' -- …` (neither `timeout` nor `gtimeout` is installed; chose not to `brew install coreutils`). Nothing timed out; longest step was `dev up` (~30s).

| # | Command (cwd `~/src/github.com/Shopify/mana`) | rc | Log |
|---|---|---|---|
| 0 | `dev cd -n mana` → `/Users/lanceriedel/src/github.com/Shopify/mana` (clone already present, no `dev clone` needed; working tree clean) | 0 | — |
| 1 | `dev up` | 0 | `001-mana-dev-up.log`, `001-mana-dev-up-converge-stdout.log` |
| 2 | `dev install-cli` | 0 | `001-mana-install-cli.log` |
| 2b | *(not in brief)* created shim `~/.local/bin/mana` — see Gotchas | 0 | — |
| 3 | `mana init --vault ~/Documents/mana` (stdin `</dev/null`) | 0 | `001-mana-init.log` |
| 4 | `dev link-to-vault ~/Documents/mana` | 0 | `001-mana-link-to-vault.log` |
| 5 | verification commands | 0 | `001-mana-verify.log` |

**1. `dev up`** — Ran the 5 dev phases: nix profile / shadowenv, package deps, Node (`node v23.5.0`, `pnpm@10.28.0`, `pnpm install`), "Hide generated build artifacts" (skipped — already met), Nginx. `node_modules/` now populated (10 top-level packages, 69 in `.pnpm`). Top-level `dev` output only showed "Converge project services; started" — detailed phase log is in dev's artifact dir, copied to `001-mana-dev-up-converge-stdout.log`.

**2. `dev install-cli`** — Runs `pnpm run install-cli` → `pnpm link --global`. "Lockfile is up to date, resolution step is skipped." No build step actually happens (despite README's "build + link" wording) — it links the already-committed `dist/mana-cli.js`. Shim landed at `~/.local/share/pnpm/mana`, which is **not on PATH** (see Gotchas).

**3. `mana init --vault ~/Documents/mana`** — No prompts (vault only had an empty `.obsidian/`, nothing pre-existing was touched). Output:
```
✨ Vault initialized at /Users/lanceriedel/Documents/mana
Created:
  IDENTITY.md, USER.md, MEMORY.md, DREAMS.md, ONDECK.md, KNOWLEDGE.md
  SOUL.md, AGENTS.md, BOOTSTRAP.md
  mana/DASHBOARD.md, mana/MIGRATIONS.md
  mana/radars/daily.md, mana/radars/dream.md
  mana/skills/create-skill.md
  mana/inbox/
```
Also created `.mana/`, `knowledge/`, `mana/{memories,people,projects}/`.

**4. `dev link-to-vault ~/Documents/mana`** — `scripts/link-to-vault.sh` checked `.obsidian/` exists, created `.obsidian/plugins/`, and symlinked:
```
✨ Linked /Users/lanceriedel/Documents/mana/.obsidian/plugins/mana -> /Users/lanceriedel/src/github.com/Shopify/mana
```

Post-run `git -C ~/src/github.com/Shopify/mana status --short` is empty — repo untouched. No commits, no pushes, no `git pull`.

## 3. Verification

**(a) `which mana && mana --version`**
```
/Users/lanceriedel/.local/bin/mana
mana 2026.1022.1311
⚠️  1 runtime commit available from origin/main (cfc537a)
   Update: mana update
```

**(b) `ls -la ~/Documents/mana`** — all expected scaffold files present (`BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`, `ONDECK.md`, `DREAMS.md`, `MEMORY.md`, `knowledge/`):
```
drwxr-xr-x@  3 lanceriedel  staff     96 Oct 26 17:32 .mana
drwxr-xr-x@  3 lanceriedel  staff     96 Oct 26 17:32 .obsidian
-rw-r--r--@  1 lanceriedel  staff  14607 Oct 26 17:32 AGENTS.md
-rw-r--r--@  1 lanceriedel  staff   8840 Oct 26 17:32 BOOTSTRAP.md
-rw-r--r--@  1 lanceriedel  staff    144 Oct 26 17:32 DREAMS.md
-rw-r--r--@  1 lanceriedel  staff    167 Oct 26 17:32 IDENTITY.md
drwxr-xr-x@  2 lanceriedel  staff     64 Oct 26 17:32 knowledge
-rw-r--r--@  1 lanceriedel  staff    251 Oct 26 17:32 KNOWLEDGE.md
drwxr-xr-x@ 10 lanceriedel  staff    320 Oct 26 17:32 mana
-rw-r--r--@  1 lanceriedel  staff    126 Oct 26 17:32 MEMORY.md
-rw-r--r--@  1 lanceriedel  staff    355 Oct 26 17:32 ONDECK.md
-rw-r--r--@  1 lanceriedel  staff  22421 Oct 26 17:32 SOUL.md
-rw-r--r--@  1 lanceriedel  staff    221 Oct 26 17:32 USER.md
```
`mana/` contains `DASHBOARD.md`, `MIGRATIONS.md`, `inbox/`, `memories/`, `people/`, `projects/`, `radars/`, `skills/`.

**(c) `ls -la ~/Documents/mana/.obsidian/plugins/`**
```
lrwxr-xr-x@ 1 lanceriedel  staff  46 Oct 26 17:32 mana -> /Users/lanceriedel/src/github.com/Shopify/mana
```
Through the symlink:
```
-rw-r--r--@ 1 lanceriedel  staff  1644477 Oct 22 09:42 .../plugins/mana/main.js
-rw-r--r--@ 1 lanceriedel  staff      227 Oct 22 09:42 .../plugins/mana/manifest.json
-rw-r--r--@ 1 lanceriedel  staff    45021 Oct 22 09:42 .../plugins/mana/styles.css
```
`manifest.json`: `id: mana`, `version: 2026.1022.1311`, `minAppVersion: 1.4.0`, `isDesktopOnly: true`. Installed Obsidian is **1.14.4** → compatible.

**Bonus: `mana --vault ~/Documents/mana status`** (rc=0)
```
Vault:     /Users/lanceriedel/Documents/mana
Scheduler: launchd
Identity:  ✅ configured          (template placeholder — bootstrap will fill it)
Memory:    3 lines
Inbox:     0 open items
Services:
  Tool Gateway: ❌ not connected
  Vault (employee directory): ❌ not connected
Radars: daily / dream / lint — last run: never
Built-in skills: 1/1 enabled (🦉 sky); User skills: 1
```

## 4. Remaining manual steps for the human

Adapted from README "Enable Mana in Obsidian". **Observed:** Obsidian is installed (1.14.4) but was **not running** and has no vault registry (`~/Library/Application Support/obsidian/obsidian.json` doesn't exist) — `~/Documents/mana/.obsidian/` was an empty dir, so Obsidian has never actually opened this vault. Step 1 is therefore "open the vault", not just "restart".

1. **Open Obsidian and open the vault.** Launch `/Applications/Obsidian.app`. In the vault picker choose **Open folder as vault** and pick `~/Documents/mana` (do **not** "Create new vault" — the folder already exists and is scaffolded). If Obsidian was already open with the vault, **restart Obsidian** instead so it picks up the newly linked plugin.

2. **Turn on community plugins.** Open **Settings → Community plugins**. If you're in Restricted Mode, click **Turn on community plugins**.

3. **Enable Mana.** In the same panel, toggle **Mana** on under *Installed plugins*. (It should appear as "Mana 2026.1022.1311"; if it's missing, the symlink at `.obsidian/plugins/mana` is what Obsidian reads — it's in place.)

4. **Open Mana's options.** Click the **gear (Options)** icon next to Mana in the plugin list.

5. **Connect the services you want to use.** In **Settings → Mana → Connected services**:
   - **Tool Gateway** — sign in, then search for a service you want Mana to use. Connect that service if needed and turn on **Use in Mana**. Signing in, connecting a service, and allowing Mana to use it are separate steps; no tokens to paste.
   - **Shopify Vault — employee directory** — connect for employee profiles, teams, and org context. This is a Shopify service, not your local Obsidian vault.

   Connections are optional: you can start with local notes and connect services later. (`mana status` currently shows both as ❌ not connected.) See `docs/SETTINGS.md` in the repo for scope/permissions. CLI alternative: `mana auth login`.

6. **Bootstrap** — see §5 below.

7. **Confirm it's running.** Look at the bottom-right status bar — you should see the green Mana indicator showing the daily radar's last run.

8. **Open the Radars panel.** `Cmd+P` → **Mana: Open radars** (or click the Mana icon in the left ribbon). You'll see your radars listed (`daily`, `dream`, `lint` per `mana status`).

> Stuck? README points to Slack **#help-mana**.

## 5. Bootstrap prompt

Open Mana chat with `Cmd+P` → **Mana: Open chat** (or click the Mana icon in the left ribbon) and paste:

> Please read `BOOTSTRAP.md` and run first-time setup for this vault. Look me up in Vault, discover my team, likely Slack channels, and relevant GitHub repos, then show me what you found before updating `IDENTITY.md`, `USER.md`, `ONDECK.md`, `DREAMS.md`, `MEMORY.md`, and `knowledge/`.

Mana will ask you to confirm what it found before it writes durable notes.

## 6. Gotchas

1. **`mana` not on PATH after `dev install-cli`.** `pnpm link --global` put the shim at `~/.local/share/pnpm/mana`, but `PNPM_HOME` is unset and that dir isn't on PATH in login zsh (`pnpm setup` was never run). **Fix applied:** created a 3-line wrapper `~/.local/bin/mana` → `exec ~/.local/share/pnpm/mana "$@"` (`~/.local/bin` is already on PATH and already holds similar user shims: `controlroom`, `mempalace`, …). A plain symlink would *not* have worked because the pnpm shim resolves `dist/mana-cli.js` relative to `$0`. No dotfiles were modified. To undo: `rm ~/.local/bin/mana`. Alternative permanent fix: `pnpm setup` (adds `PNPM_HOME` to `~/.zshrc`).

2. **`dev install-cli` doesn't build.** Despite "build + link" in README/dev.yml desc, it only runs `pnpm link --global`. It works because `dist/` and `main.js` are committed artifacts (built Oct 22 09:42, matching version `2026.1022.1311`).

3. **Update nag.** Every `mana` invocation prints `⚠️ 1 runtime commit available from origin/main (cfc537a). Run: mana update`. Not applied (brief forbids `git pull`/modifying the repo). Human can run `mana update` or `dev cd mana && dev pull && dev build` later, then restart Obsidian.

4. **No `timeout`/`gtimeout` on this machine.** Used `perl -e 'alarm 900; exec @ARGV' --` per the brief's fallback rather than installing coreutils.

5. **Obsidian has never opened this vault.** `.obsidian/` was empty and Obsidian has no `obsidian.json` registry — so the vault must be opened via "Open folder as vault" (manual step 1), not just a restart. Obsidian was not running during this work; its state was not touched.

6. **No auth prompts, no interactive prompts** encountered in any step (stdin was `</dev/null` for `mana init` / `link-to-vault` as a precaution).

DONE 001
