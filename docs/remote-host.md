# Remote worker host — setup checklist

A second machine (a Linux VM, a desk box, a cloud instance) that runs **workers** — and optionally a whole
second control room — so long jobs survive your laptop sleeping, closing, or losing Wi-Fi. The Herdr server on
that machine owns the panes; your laptop just talks to it over SSH with `herdr --machine <label> …`.

Everything below is user-local (no sudo) and idempotent: run a step again and it changes nothing.
`controlroom host-setup <ssh-target>` prints this list and runs the parts marked **(auto)**.

## 0. Prerequisites on the laptop
- Herdr ≥ 0.9 with the machine saved: `herdr machine add <ssh-target> --label <label>` (installs/starts the remote
  Herdr server and saves the SSH target; `herdr machine list` shows it, `herdr machine status` checks it).
- SSH to `<ssh-target>` works non-interactively (key or agent).

## 1. Node (user-local)
pi needs the same Node major your laptop's pi uses (`node --version` next to `pi --version`). Official tarball, no sudo:
```bash
V=v22.x.y; A=linux-x64   # match your laptop's major; arch from `uname -m`
mkdir -p ~/.local/lib ~/.local/bin && curl -fsSL https://nodejs.org/dist/$V/node-$V-$A.tar.xz | tar -xJ -C ~/.local/lib
ln -sfn ~/.local/lib/node-$V-$A ~/.local/lib/node && for b in node npm npx corepack; do ln -sf ~/.local/lib/node/bin/$b ~/.local/bin/$b; done
```
Add `pnpm`/`uv`/whatever your repo's `make test` needs the same way (`corepack enable --install-directory ~/.local/bin pnpm`,
the `uv` installer with `INSTALLER_NO_MODIFY_PATH=1`).

## 2. pi — same version as the laptop
`npm i -g @earendil-works/pi-coding-agent` works when the public package matches your laptop's version. **If your pi is
a private or internal build** (`pi --version` newer than npm, or installed via nix/a monorepo), the public package
will be stale or missing — **mirror the package root instead**:
```bash
# on the laptop: find the directory that holds package.json + dist/ for the running pi, then
rsync -az --delete --no-perms --no-owner --no-group --chmod=u+rwX "<pi-package-root>/" <ssh-target>:.local/lib/pi-<version>/
```
and write a wrapper on the remote (`~/.local/bin/pi`, `chmod +x`):
```bash
#!/usr/bin/env bash
[ -f ~/.pi-env ] && . ~/.pi-env
exec ~/.local/lib/node/bin/node ~/.local/lib/pi-<version>/dist/bundle/cli.js "$@"
```
Check: `ssh <ssh-target> 'pi --version'` matches the laptop. Make sure the mirrored package contains prebuilt
native modules for the remote's platform (e.g. `linux-x64`), or run `npm rebuild` inside it.

## 3. pi config sync
Copy `~/.pi/agent/` **selectively**: `settings.json`, `extensions/` (dereference symlinks: `rsync -L`), `agents/`,
`skills/`, `prompts/`, `git/` (installed packages), `models-store.json`. **Do not copy** `auth.json`, `mcp-auth.json`
or `sessions/` — credentials and history stay per machine. Review `mcp.json`: anything pointing at a laptop-only
binary (an absolute macOS path, a local Python) should be dropped or replaced on the remote.

If `settings.json` references packages by **relative path** (e.g. `../../src/github.com/<you>/pi-controlroom`),
the same path must exist on the remote — mirror that checkout too (`rsync -az --exclude node_modules`).

**Provider environment.** Put the API/proxy variables pi needs in `~/.pi-env` (mode 600) on the remote, by *name*:
`controlroom host-setup` prints the names it finds in your laptop environment; copy the values yourself
(`ssh <ssh-target> 'cat >> ~/.pi-env'` from a secure source — never paste them into a brief or a commit).

## 4. PATH for Herdr panes **(auto)**
Herdr panes are **non-login interactive shells**: `~/.profile` is not read, so `~/.local/bin` may be missing and
`herdr agent start … --kind pi` times out with no visible error. Append to `~/.bashrc` (and `~/.zshrc` if zsh):
```bash
[ -f ~/.pi-env ] && . ~/.pi-env
case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) export PATH="$HOME/.local/bin:$PATH";; esac
```
Verify from a Herdr pane on the remote, not from `ssh … 'echo $PATH'` (which is a different shell).

## 5. Herdr pi integration **(auto)**
`ssh <ssh-target> 'herdr integration install pi'` → `herdr integration status` shows `pi: current`. Without it the
remote agents show `unknown` instead of `working/idle/done/blocked`, and nothing controlroom does works.

## 6. Repo + project environment
Clone (or mirror) the project repo to the **same relative layout** as the laptop so briefs' paths resolve; build its
venv/node_modules; run its tests once. Note the identity differences: cloud credentials on a VM are usually a
**service account**, not you — anything your repo does against a warehouse or API from there runs as that account.

If the remote has no way to push (HTTPS remote, no stored credential) that is fine — see
[two-controller-protocol.md](two-controller-protocol.md) §5 for the token-over-stdin pull/push pattern. Set a
repo-local git identity (`git config user.name/user.email`, not `--global`) so commits there don't fail with
`empty ident name`.

## 7. controlroom on the remote **(auto)**
Both symlinks, or the strip dies with `exec: controlroom-pager: not found`:
```bash
ln -sf <pi-controlroom>/bin/controlroom ~/.local/bin/controlroom
ln -sf <pi-controlroom>/bin/controlroom-pager ~/.local/bin/controlroom-pager
```
`controlroom tick-install` is launchd-only (macOS). On Linux run **`controlroom tick --loop`** in a pane beside the
strip (the strip also starts one if the heartbeat is stale). `controlroom init` may land the strip at 4 rows — fix
with `herdr pane resize --pane <strip> --direction up --amount 0.13`.

## 8. Smoke test (from the laptop)
```bash
M="herdr --machine <label>"; REPO=<repo path on the remote>
P=$($M tab create --workspace <ws> --cwd "$REPO" --label smoke --no-focus | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"]["root_pane"]["pane_id"])')
$M agent start smoke --kind pi --pane "$P" --timeout 60000
$M agent prompt smoke "Reply with exactly: REMOTE OK" --wait --timeout 120000 && $M agent read smoke --lines 10
$M tab close "${P/:p/:t}"
```
`agent start` timing out → step 4. `401/403` from the provider → step 3's env file is missing or stale.
An MCP server that fails at startup with 403 because its auth file wasn't copied is expected — pi warns and continues.

## What to keep on the laptop
Anything that needs **the human's identity or browser**: chat/Slack tooling behind an SSO'd gateway, publishing
to internal doc sites, Drive/GDocs mirrors, OAuth flows, anything with a login popup. Tag those briefs for the local
controller (`host: local`); see the two-controller protocol.
