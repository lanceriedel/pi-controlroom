# Two-controller protocol — `<local>` and `<remote>`

Two control rooms share one repo: one on your laptop (`<local>`, next to you, your identity, your browser) and one
on a remote host (`<remote>`, survives the laptop; see [remote-host.md](remote-host.md)). **Git is the hand-off**;
`STATUS.md` is the shared board; **one controller is primary at a time**. Everything below exists so the two never fight.

Name the controller agents distinctly (`controlroom init` names the first one `controller`; rename the second, e.g.
`herdr agent rename <pane> <project>-remote`) — Herdr agent names are global per server, and a reader of the board
should be able to tell which room a line came from.

## 1. Ownership by host tag
Every brief header carries a `host:` line — `host: local` or `host: <label>` (the Herdr machine label). The controller
on that host launches, watches and integrates it. Default split:
- **`<remote>`** — anything > 30 min, any pipeline / warehouse job (runs as the host's service identity), any
  research that produces only files.
- **`local`** — anything needing the human's identity or browser (chat tooling, publishing, Drive/GDocs, SSO),
  or the human at the desk.

## 2. Modes
The human switches; the current mode is the `MODE:` line at the top of `STATUS.md`.
- **"controller mode: remote"** → `<local>` commits + pushes, writes `MODE: remote since <time>`, and **stops
  launching**. `<remote>` pulls and becomes primary for everything tagged with its host and for new work the human
  sends it.
- **"controller mode: local"** → `<remote>` commits + pushes a `## HANDOFF <time>` block in `STATUS.md` (what landed,
  what sits under `## Pending publish (local)`), writes `MODE: local since <time>`, and stops launching. `<local>`
  pulls, publishes, integrates.

## 3. The board
- **`STATUS.md`**: only the *primary* controller edits it; the other reads. The workers table gets a `host` column.
- **Results** stay per brief in `docs/briefs/results/<same-name>.md`. A result produced remotely that needs a
  local-only step (publish, post, mirror) is listed under `## Pending publish (local)` in `STATUS.md`.
- **Per host, never merged**: `logs/` (untracked) and `docs/briefs/AUTOMATIONS.md` (the tick ledger — `A###` ids are
  per host). If a pull is rejected because of `AUTOMATIONS.md`, `git checkout -- docs/briefs/AUTOMATIONS.md` and pull
  again: the tick re-arms watch rows from `STATUS.md` and Boot re-arms the round wake. Don't commit the ledger from the
  non-primary host.

## 4. Conflict rule
Never edit `STATUS.md` on both hosts between a push and a pull. If it happens anyway: **local wins**; remote resets
its copy (`git checkout --theirs` / re-pull) and re-applies its own lines by hand.

## 5. Syncing
- Local: `git add docs && git commit && git push` (never add `logs/`).
- A remote with an **HTTPS origin and no stored credential** can still pull/push: pass a short-lived token over
  stdin so it never lands in argv, git config, or shell history:
  ```bash
  gh auth token | ssh <ssh-target> 'read -r T; cd <repo> && git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic $(printf "x-access-token:%s" "$T" | base64 -w0)" pull --ff-only'
  ```
  Same shape with `push`. `git -c …extraheader` is per invocation; `git config --list | grep extraheader` on the remote
  stays empty. The remote controller itself cannot push — the human (or `<local>`) runs this line for it.
- Alternative: a deploy key or `gh auth login` on the remote. Pick one and write it in the board's cheat-sheet.

## 6. Launching remote workers from the laptop
Tag the brief `host: <label>`, push, pull on the remote, then either:
```bash
M="herdr --machine <label>"; REPO=<repo path on the remote>
P=$($M tab create --workspace <ws> --cwd "$REPO" --label <name> --no-focus | python3 -c 'import sys,json;print(json.load(sys.stdin)["result"]["root_pane"]["pane_id"])')
$M agent start <name> --kind pi --pane "$P" --timeout 60000
$M agent prompt <name> "Read docs/briefs/NNN-slug.md and execute it end to end …" --wait --timeout 120000
```
or just `herdr --machine <label> agent prompt <remote-controller> "launch <name> for docs/briefs/NNN.md"` and let it run
`controlroom launch` itself. Either way the **remote** controller owns the watch row (its tick re-arms from the board).
`controlroom launch` run on the laptop targets the *local* Herdr — it does not take a `--machine` flag.

## 7. Reaching the remote controller
`herdr --machine <label> agent prompt <remote-controller> "…"` ·
`herdr --machine <label> agent read <remote-controller> --source recent-unwrapped --lines 60` · or click
**`<label>` › CONTROLLER** in the Herdr sidebar. Record the remote room's coordinates (workspace, tab, controller
pane, strip pane, tick pane) at the top of `STATUS.md` so a fresh session can find them.

## 8. What survives what
- Remote **workers** survive the laptop (sleep, lid, Wi-Fi): the remote Herdr server owns their panes.
- The **local controller** does not survive the laptop. If you want a controller that does, run one on the remote —
  this protocol is how the two coexist.
- A Herdr **server restart** on either host keeps tab/pane ids but kills the processes in them: the strip pane comes
  back as a bare shell and the controller pi must be restarted (`herdr agent start <name> --kind pi --pane <pane>`,
  then `pi --resume` the last session if you want its memory). `controlroom strip-check` (run by the tick) relaunches
  the strip; the controller is yours to restart.

## Measured round trip (one project, one afternoon)
brief pushed → pulled on the remote: ~3 s · remote controller prompted → worker launched: ~8 s · worker DONE + result
file: ~15 s · remote commit, token-over-stdin push, local pull: ~7 s · **prompt → verified on the laptop: ~65 s**.
