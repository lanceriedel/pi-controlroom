# 020 — talk-deck: "Running a control room" — Lance's ~25-min talk for ~50 Shopify engineers (Marp → HTML + PDF, speaker notes)

host: local

## Objective
Build the presentation Lance will give on how he works with Herdr + pi + pi-controlroom: 18 slides following the outline below exactly (titles may be sharpened, order and content stay), speaker notes per slide (what he says, 60–120 words), real screenshots/text captures from this machine, and an honest tone — numbers from files, no marketing. Output: `docs/talks/controlroom-talk/deck.md` (Marp), `deck.html`, `deck.pdf`, `notes.md` (notes only, printable), `assets/` (captures). Audience: ~50 engineers, most use pi, many use Herdr, few know the control room.

## Memory that applies (verbatim; `controlroom memory` is the source)
- L028 claims need a source line — every number on a slide traces to a file/command in `notes.md` ("Sources" at the end).
- L037 never touch another room's state — read other rooms' files only; captures via `controlroom status` run from each repo with `NO_COLOR=1` or screenshot of the strip pane via `herdr pane read … --format text` (no clicking around in their UI).
- L002 save partials early · L032/L045 don't edit `bin/`. D004 $ in detail only → cost slide uses the session-jsonl numbers already computed (below), not live `health`.
- From the 11-17 discussion (`STATUS.md`): adherence is now enforced by `check` + `judge` (018/019) — the "brief is a contract" slide must show the Acceptance block.

## Inputs (read these; they contain the facts and the exact wording to reuse)
`docs/exec-overview.md` (the narrative spine) · `README.md` (vocabulary, strip fields, two-controllers section incl. the labels table) · `docs/design/durable-controlroom.md` §0–§2 · `docs/two-controller-protocol.md` · `docs/remote-host.md` · `docs/briefs/results/013-tobi-comparison.md` (Torrent/ULTIMATE comparison; reuse its table) · `docs/briefs/results/009-durability-tests.md` (scenario grades) · `docs/briefs/results/012-close-the-loop.md` (S3/S6 live proofs) · `docs/briefs/results/018-acceptance-checks.md`, `019-judge.md` · `docs/briefs/results/015-status-page.md` and `~/src/github.com/shopify-playground/graph-search/docs/status/publishers.sh` (lancedocs publishing; lancedocs = `~/.brain/memory-bank/personal/docs/` + `deploy-lancedocs.sh`; Google Docs mirror = psd `results/011-gdocs-mirror.md`) · `docs/briefs/memory/DECISIONS.md`, `LESSONS.md` (pick 3 real lines each) · `docs/briefs/STATUS.md` Notes (the 167 % storm, 11-10; model hand-offs 11-13; connection-error re-prompts) · room boards: `~/src/github.com/shopify-playground/{lookbook-research,graph-search,kumo-research,upi-clustering-research,taste-id-research}/docs/briefs/STATUS.md` + `docs/status/preamble.md` and `~/src/github.com/lanceriedel/gsd-reviews/README.md` (one line + one number per project; count briefs with `ls docs/briefs | grep -c '^[0-9]'`).
Model/cost facts (already computed 11-11 from session jsonl, cite as such): graph-search 37 sessions ≈ $1,050 — fable 24 sessions / 3,921 turns / $963 / 10 of 12 DONE; sol 10 / 1,491 / $39; mini 4 / 1,769 / $39 / 0 DONE; controller sol $27/day vs fable $348/day; judge ≈ $0.06/review.
Torrent facts (Slack, in 013): issues → agents → Delta PRs; Objectives (Harry, 10-26): lead agent + charter enforced by a judge agent; "no way to steer" complaints; PII-in-transcripts question.
pi.shopify.io facts (STATUS 11-10, `docs/briefs/inputs/pi-host/README.md`): Pi Durable sessions on Cloud Run/Postgres, tab↔server, timer wake, REST/SSE API, `pi.js`; no filesystem/shell yet; Mint+WARP only. **Tobi's remote workstations: no source in this repo — mark the slide's specifics `[Open — Lance to fill]` and leave a placeholder bullet; do not invent.**

## Slides (18) — titles, content, and the capture each needs
1. **The one-liner** — one controller, many workers, everything is a file in git; closing the laptop pauses me, not the project. Capture: none (big text).
2. **Herdr + pi in 90 seconds** — two columns: pi (agent, sessions, extensions, skills, Shopify proxy) · Herdr (panes/tabs/workspaces across machines, agent state, `herdr agent list|prompt|focus`). Capture: `herdr agent list` trimmed to 8 lines.
3. **Why I built it** — the problem list from exec-overview §"Why this shape" + the September situation (15 agents, chat as memory). No capture.
4. **The operating model** — the README diagram (monospace box) + the six pieces table (controller · briefs→results · board · memory · tick · automations).
5. **A brief is a contract** — show `docs/briefs/018-acceptance-checks.md` header + `## Acceptance` block (trimmed) and `controlroom check 019` output (10 pass). Mention `judge` verdict line.
6. **The board & the strip** — capture `NO_COLOR=1 controlroom status` from pi-controlroom (full) and annotate fields: header (tick ok / NO TICK), ROOMS (‹PRIMARY›, MODE), AGENTS by host, PIPELINES aging, EVENTS, MEMORY, AUTOMATIONS. Legend of states/colours.
7. **Memory** — grammar line, budgets 40/30, three real D lines + three real L lines (quote exactly), dream propose/promote, flush at 75 %, Boot order.
8. **Automations** — AUTOMATIONS.md table excerpt (sanitize nothing; it's internal), the round wake text, prompt-uptake log lines (`turn aborted (Connection error.) → re-prompted`, `prompt taken`).
9. **Durability, honestly** — table "what survives what" (compaction / restart / reboot / sleep / human absent) from 010 §3 updated by 012; the 167 % storm in 4 bullets + the breaker + "fresh session from files is the design working".
10. **Remote machines** — hosts table (laptop · dev002 · c4d), `host:` header, `controlroom mode remote dev002`, the labels table (★ workspace, ★ CONTROLLER / standby, ‹PRIMARY›, MODE line). Capture: graph-search `NO_COLOR=1 controlroom status` ROOMS + AGENTS section.
11. **The projects** — 7 rows: room · what it is · briefs count · one number · hosts. Facts from each board.
12. **A day in the life** — timeline 06:00 → 22:00: Boot, round, worker DONE, blocked question, land, status page, laptop closes → VM carries on. Real timestamps from `logs/agents.log` of one day (pick 11-10 or 11-17).
13. **Publishing: lancedocs** — flow diagram: STATUS/health + preamble → `status-page` → latest.md/html → gh-pages (`controlroom-pages`) + `publishers.sh` → lancedocs (`~/.brain/…/docs/<room>/where-we-stand-latest.html`, `deploy-lancedocs.sh`) → Google Docs mirror; `--no-landed` + narrative preamble; snapshot → `docs-archive`.
14. **Verification culture** — 0.2.0 gate: 009 scenarios S1–S10 grades, 011 review (3 blockers), 012 fixes, re-tests; L-lines found in use ship via the symlinked CLI within a minute (L032).
15. **Not Torrent — and not trying to be** — the 013 comparison table (trimmed to 8 rows) + "what I borrowed" (judge/completion gate) + "the bridge" (controller files Torrent issues).
16. **Costs & models** — the model table above; rule of thumb: fable for build/eval workers, sol for cheap controllers (if you accept slower rounds), never mini for deliverables; never switch mid-session (L091 graph-search).
17. **Future** — controller as a hosted durable session (pi.shopify.io: what exists / what's missing), `launch --host`, Tobi's remote workstations **[Open — Lance to fill]**, Objectives-style charters, Drive publisher.
18. **Takeaways + links** — 3 takeaways; `pi install git:github.com/lanceriedel/pi-controlroom`; exec overview URL; "only blocked needs you".

## Build
- Marp: `npx -y @marp-team/marp-cli@latest deck.md -o deck.html` and `--pdf` (Chrome/Chromium present? if PDF fails, say so and ship HTML + `deck.pdf` via `--pdf --allow-local-files`; fall back to printing HTML with headless Chrome if installed). Theme: default `gaia` or `uncover` with a dark variant; 16:9; monospace blocks ≤ 14 lines per slide; one idea per slide; speaker notes as Marp `<!-- -->` comments *and* collected in `notes.md`.
- Captures: text captures saved as files in `assets/` and pasted as code blocks (no images needed); if you take PNGs (`herdr pane read` can't), skip — text is fine for a terminal tool.
- Numbers: every number on a slide appears in `notes.md` "Sources" with the file/command it came from.

## Constraints
Read-only outside `docs/talks/`; no `bin/` edits; no publishing (Lance will share the deck himself); internal details are fine (internal audience) but no buyer/merchant data and no quotes from private Slack. Time-box 2.5 h; write `deck.md` skeleton (18 titles) in the first 10 min and fill in order.

## Deliverable
`docs/talks/controlroom-talk/{deck.md,deck.html,deck.pdf,notes.md,assets/}` and `docs/briefs/results/020-talk-deck.md`: build log (commands), slide-by-slide one-line summary, the `[Open — Lance to fill]` list, deviations, `DONE 020`.

## Acceptance
```sh
test -f "$ROOT/docs/talks/controlroom-talk/deck.md"
test -f "$ROOT/docs/talks/controlroom-talk/deck.html"
test -f "$ROOT/docs/talks/controlroom-talk/notes.md"
test "$(grep -c '^---$' "$ROOT/docs/talks/controlroom-talk/deck.md")" -ge 17
cr_has_section "$RESULT" "## Deviations"
cr_has_sentinel "$RESULT" 020
```
writes: docs/talks/**, docs/briefs/results/020*
