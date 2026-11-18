# 015 — judge · docs/briefs/015-status-page.md vs docs/briefs/results/015-status-page.md

2026-11-17 16:08 · model `openai/gpt-6.1-sol` · `controlroom judge 015` · 30 s · 1 file read(s)

## Requirements
| requirement | source | verdict | evidence |
|---|---|---|---|
| Status-page command and rendered files | Objective: “Add `controlroom status-page [--publish] [--snapshot]`: render `docs/status/latest.md` (+ `.html`)” | PASS | “wrote `latest.md latest.html preamble.md`” |
| Room-owned preamble and board sections | Objective: “STATUS.md (MODE, Workers, Decisions waiting, Landed, Retired)” | PASS | “MODE line → Workers (agent · brief · state · result) → Decisions waiting” |
| Live workers without default costs | Memory that applies: “D004 $/tokens stay out of the default view” | PASS | “**no $/tokens** unless `--cost`” |
| GitHub brief links | Objective: “with brief numbers turned into GitHub links” | PARTIAL | “inline `NNN` in prose → number only” |
| Publish to Pages and enable it | Objective: “`--publish` pushes it to GitHub Pages (always; enable Pages if absent)” | PASS | “Pages was 404 → **enabled now** (`gh api … pages` → `status: building`, source master:/docs)” |
| Extra publishers | Objective: “and to any extra publishers in `docs/status/publishers.sh` (lancedocs is one).” | PASS | “`publishers.sh` = two `echo "published fake-X"` lines, `chmod +x`” |
| Automatic event hooks and opt-out | Objective: “`launch` and `land` call it automatically (opt-out by D-line). Event-driven, never on a clock.” | PASS | “publish.log 6 → 6 → 6 → 7 lines; `land returned after 0s`” |
| Autonomous execution | Objective: “Lance is travelling — run autonomously, no questions back.” | N-A | none found |
| Safe live-script saves | Memory that applies: “**WIP copy → `bash -n` → `controlroom tick --once --dry-run` → atomic `mv`**” | N-A | “`bash -n` ✓ → `/tmp/controlroom.wip tick --once --dry-run` in this repo → `tick: nothing to do` rc=0 → `mv`” |
| Scratch testing | Memory that applies: “L011 test-in-scratch-repo” | N-A | “in `mktemp` repo with this room's STATUS.md + brief/result stubs, bare origin” |
| No full init or other-room interference | Memory that applies: “L009 never full `init` from a worker pane · L037 never touch another room's UI/state” | N-A | none found |
| Bounded subprocesses | Memory that applies: “L001 `perl -e 'alarm N; exec @ARGV' --`” | PASS | “`( perl -e 'alarm 60; exec @ARGV' -- "$0" status-page --publish --quiet & )`” |
| Mechanism evidence | Memory that applies: “L028 a claim about a mechanism needs a log line from that mechanism” | PASS | “`agents.log`: `[11-08 14:37] status page — pushed master`” |
| Early partial results | Memory that applies: “L002 partial results early.” | N-A | none found |
| Ledger, pane and workspace policies | Memory that applies: “D021 ledger never hand-edited · D015 controller by pane id · D011 one room per workspace” | N-A | none found |
| Memory via briefs | Memory that applies: “D007 memory reaches workers via briefs.” | N-A | none found |
| Snapshot placement convention | Memory that applies: “a page snapshot before overwrite goes to an archive dir, never where an index generator lists it.” | PARTIAL | “nothing indexes that dir, so it is harmless.” |
| Bash/std­lib implementation | Constraints: “bash 3.2 + python3 stdlib” | PARTIAL | “`bin/controlroom-md2html` (new, python3 stdlib, 196 lines)” |
| Every new line marked | Constraints: “`(015)` markers on every new line” | FAIL | “the Python body sits inside the marked `status_py` heredoc, not line-by-line” |
| Controlroom line budget and heredoc | Constraints: “≤ 220 lines net in `bin/controlroom` — put the generator in a `status_py` heredoc function” | PASS | “`bin/controlroom` **+163 lines** (1316 → 1479): `status_py` heredoc” |
| Vendored renderer and symlink | Constraints: “vendored md2html is a separate file (`bin/controlroom-md2html`, symlinked like the pager” | PASS | “Symlinked into `~/.local/bin` like the pager.” |
| Install documentation | Constraints: “add to README install + SKILL install line” | PASS | “`README.md` (install line · CLI row · "## Status page" · Layout) · `skills/controlroom/SKILL.md` (install line · row)” |
| Syntax check each save | Constraints: “Every save of `bin/controlroom` per L032. `bash -n` on each” | N-A | “L032 save: `bash -n` ✓” |
| Renderer compilation check | Constraints: “`python3 -m py_compile` on the md2html file.” | N-A | none found |
| Restricted commits and pushes | Constraints: “No commits in this repo except the ones `--publish` itself makes” | N-A | “Not committed by me: everything outside 4ca15cc (brief constraint).” |
| Two-hour time box | Constraints: “Time-box 2 h” | N-A | “~1 h 10 min of work” |
| Early result skeleton | Constraints: “write `docs/briefs/results/015-status-page.md` skeleton in the first 10 min and fill as you go.” | N-A | none found |
| Design-as-built section | Deliverable: “design as built” | PASS | “## Design as built” |
| Finding/fix table with locations | Deliverable: “finding/fix table (`file:line`)” | PARTIAL | “`bin/controlroom` status_py render, `m2h` block” |
| Scratch and live command/evidence table | Deliverable: “proof table (command + evidence, scratch and live)” | PASS | “## Proof table” |
| Preamble preservation and snapshot proof | Design: “preamble survives a second run; `--snapshot` makes one dated file” | PASS | “`latest.md` contains it; `docs/status/2026-11-08-latest.md` created (one file)” |
| Scoped commit and unrelated dirty file proof | Design: “`--publish` commits only `docs/status/**` and leaves a dirty unrelated file untracked” | PASS | “`git status`: `A UNRELATED2.txt` still staged, `?? UNRELATED.txt`” |
| Missing-gh graceful degradation | Design: “`gh`-less path degrades to "Pages: gh not available" without failing.” | PASS | “`ghpages=pushed publishers=0 url=- (Pages: gh not available … — not enabled)`; rc=0” |
| Live publish proof and URL/log | Deliverable: “the live page URL + `publish.log` line” | PASS | “url=https://lanceriedel.github.io/pi-controlroom/status/latest.html” |
| Actual live serving | Objective: “a human-readable project status page, rendered from the room's files and published on events” | PARTIAL | “the page is **not served** — finding 5 (symlink).” |
| Scratch hook proof, no live worker launch | Design: “don't launch workers into the live room; instead confirm the hook path” | PASS | “hook: `land` with D-line `**status-page-off**` → `land` with `CONTROLROOM_STATUS_PAGE=0` → `land` with `=1`” |
| Other-room publishing prohibition | Design: “Do **not** run `--publish` in graph-search / psd / lookbook (L037)” | N-A | none found |
| Graph-search migration guidance | Design: “mention in the result how gs-controller can switch from `bin/publish-latest.sh` to the built-in” | PASS | “Then stop calling `bin/publish-latest.sh` by hand: `launch`/`land` republish.” |
| Deviations and still-open sections | Deliverable: “deviations → "still open"” | PASS | “## Still open” |
| Recorded decision and lesson attribution | Deliverable: “the `decide`/`lesson` lines you recorded (`--from` this file; one D-line for the feature: `status-page-on-events`)” | PARTIAL | “`D029 status-page-on-events` — status page is event-driven: launch/land republish … never on a clock” |
| Completion sentinel and idle | Deliverable: “`DONE 015`; then go idle.” | PARTIAL | “DONE 015” |

## Undeclared deviations
- Per-line markers: “`(015)` markers on every new line”; instead, “the Python body sits inside the marked `status_py` heredoc, not line-by-line”.
- Full table-cell linking: “any `NNN` or `NNN-slug` brief reference in a table cell”; instead, “the full `· result · design` form only when the whole cell is a brief ref”.
- Finding locations: “finding/fix table (`file:line`)”; instead, “`bin/controlroom` status_py render, `m2h` block” supplies a block name without line numbers.
- Snapshot archive convention is discussed under Still open, not Deviations: “a page snapshot before overwrite goes to an archive dir”; instead, “snapshots live in `docs/status/` as the brief asked”.

## Unsupported claims
- “Everything else about Pages is done and verified via `gh api`.”
- “it will serve once the symlink is removed”

## Verdict
ACCEPT WITH NOTES
The command, scoped publishing, event hooks and required live attempt have evidence; the unavailable live page is reported honestly.
Fix per-line markers and linker coverage, supply precise locations and recorded command attribution, and qualify predictions about Pages serving.

## Cost
25,397 in · 2,366 out (cache r 8,631 / w 16,760) · $0.0664 · openai/gpt-6.1-sol · 30 s
