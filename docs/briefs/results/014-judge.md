# 014 — judge · docs/briefs/014-prompt-uptake.md vs docs/briefs/results/014-prompt-uptake.md

2026-11-17 16:08 · model `openai/gpt-6.1-sol` · `controlroom judge 014` · 44 s · 1 file read(s)

## Requirements
| requirement | source | verdict | evidence |
|---|---|---|---|
| Detect aborted prompts and retry | Objective: “Make the tick notice an error-aborted turn after any prompt it sent and re-prompt” | PASS | “agents.log: [11-05 08:07] A001 turn aborted (Connection error.) → re-prompted” |
| Reduce dead-window exposure | Objective: “make the wake itself less likely to hit the dead window.” | PASS | “waketime=now−30s → $ tick → deferring prompts 1 tick (just woke) ; A004 wake armed” |
| Record successful sends and offset | Work: “when `prompt_controller` returns `ok`, record `st["sent"][rid] = {ts, jsonl_offset}`.” | PASS | `logs/scratch/014-wip/controlroom`: “f.seek(s.get("off",0))” |
| Match user tag, then assistant entries | Work: “scan the controller jsonl past the offset for the user message carrying `[A<rid>` — then the next assistant entries.” | PASS | “(append: user "wh[A001 · wake · fired 1/once] …" −12m; 4 × error assistants −12…−9m)” |
| Drop taken turns | Work: “an assistant entry with `stopReason != "error"` or any tool call → **taken**, drop” | PASS | “$ controlroom tick --once            → A001 prompt taken (controller turn ran)      sent: {}” |
| Retry aged all-error turns with prefix | Work: “assistant entries all `stopReason == "error"` and the last one is ≥ 3 min old → **aborted** → re-prompt once” | PASS | “prompts.log (2): [retry · A001 · earlier turn aborted: Connection error.] [A001 · wake · fired 1/once · 08:07] round: 014 test” |
| Log abortion and mark retried | Work: “log `A### turn aborted (Connection error.) → re-prompted`, mark `retried`” | PASS | “sent: A001{retried=1,toasted=None}” |
| Toast second abort once | Work: “second abort → toast `controller: wake A### failed twice (Connection error.)` once” | PASS | “second tick → tick: nothing to do (toast not repeated, prompts.log still 4)” |
| Keep row due; never spend it | Work: “leave the row due so the next tick keeps trying every 15 min (D026 pattern), never spend it” | PARTIAL | “A002 wake  fired  fired 1   (row advanced by the original ok; the pending `sent` entry is what keeps retrying)” |
| Retry repeatedly every 15 minutes | Work: “leave the row due so the next tick keeps trying every 15 min (D026 pattern), never spend it” | PASS | “sent.A002.last −= 1000 → $ tick → A002 turn aborted (Connection error.) → re-prompted (retry 2) ; prompts.log 5 ; toast count: 1” |
| Retry lost paste after three minutes | Work: “no user message found after 3 min → the paste itself was lost → same as (b) with `prompt not taken`.” | PARTIAL | “status=done → $ tick → A003 turn aborted (prompt not taken) → re-prompted” |
| Retries bypass but count toward cap | Work: “Retry prompts bypass the 6/h cap (like D023) but count toward it.” | PASS | `logs/scratch/014-wip/controlroom`: “st["prompts"].append(now);” |
| Wake guard with gap fallback | Work: “if the machine's uptime-since-wake is < 2 min” | PASS | `logs/scratch/014-wip/controlroom`: “return now-int(m.group(1))<120 if m else now-last>300” |
| Defer and log; no network probe | Work: “defer firing prompt rows one tick and log `deferring prompts 1 tick (just woke)`.” | PARTIAL | “$ tick ×3 → deferring prompts 1 tick (just woke)” |
| Tiny guard | Work: “Keep it tiny; don't build a network probe.” | PASS | “`just_woke()` `:304–308`” |
| Latest assistant error in detail strip | Work: “one phrase, detail view only.” | PASS | “last=toolUse →  CTX   controller ctx 0% · compactions 0 · flushed — · extension absent (tick fallback)” |
| Scratch fake-herdr/jsonl proof | Work: “Prove it in a scratch repo with a fake herdr and a fake jsonl” | PASS | “mktemp repo `/tmp/014-scratch.*`, `git init`, hand-written `logs/.controller = wX:p1`” |
| Four-error, taken, and double-abort cases | Work: “then a taken turn → expect nothing; then two aborts → expect one toast and the row still due.” | PARTIAL | “A002 wake  fired  fired 1   (row advanced by the original ok; the pending `sent` entry is what keeps retrying)” |
| Live dry run does nothing | Work: “`controlroom tick --once --dry-run` must print `tick: nothing to do`” | PASS | “`controlroom tick --once --dry-run` after each install: `tick: nothing to do` (11-05 08:1x, 11-06 04:55 ×2).” |
| Only permitted worker live prompt | Work: “Do **not** prompt the live controller except via one `controlroom wake 0m "014 proof: reply TAKEN-OK" --prompt`” | N-A | “That was the only prompt sent to the live controller by this worker.” Process history cannot be independently verified. |
| TAKEN-OK within two ticks | Work: “confirm the tick logs it as taken (no re-prompt) within 2 ticks.” | PASS | “[11-06 04:58] A033 prompt taken (controller turn ran)          ← 1 tick later, no re-prompt” |
| Connection-error and late-not-never memory | Memory that applies: “L039 wake-dies-to-conn-error · L035 idle-wake-late-not-never” | PASS | “$ tick    → just-woke deferral cap (3 consecutive) reached → firing prompts anyway ; A005 wake fired → prompted controller ; deferred=0” |
| Mechanism claims have log lines | Memory that applies: “L028 a mechanism claim needs a log line from that mechanism” | PASS | “agents.log: [11-05 08:07] A001 turn aborted (Connection error.) → re-prompted” |
| WIP, validation, atomic save | Memory that applies: “L032 symlink-save-is-live (`bash -n` → `tick --once --dry-run` → atomic mv; WIP copy in `logs/scratch/`)” | N-A | “Installed via L032: WIP copy `logs/scratch/014-wip/controlroom`” Save history cannot be independently verified. |
| Scratch testing discipline | Memory that applies: “L011 test in a mktemp scratch repo” | N-A | “mktemp repo `/tmp/014-scratch.*`” Process location cannot be independently verified. |
| No full init or other-room UI | Memory that applies: “L009 never full `init` from a worker pane · L037 never toggle another room's UI” | N-A | “No `init`, no `pause`, no other room touched; nothing committed.” Process history cannot be independently verified. |
| Treat prompts as pasted keystrokes | Memory that applies: “L033 `herdr agent prompt` pastes keystrokes” | PASS | “status=done → $ tick → A003 turn aborted (prompt not taken) → re-prompted” |
| Ledger not hand-edited | Memory that applies: “D021 ledger never hand-edited” | N-A | “Same effect (never spent), no ledger rewrite.” Editing history cannot be independently verified. |
| No controller means blocked, not spent | Memory that applies: “D026 no controller ⇒ blocked, never spent” | PASS | `logs/scratch/014-wip/controlroom`: “return "blocked"” |
| Flush bypasses cap | Memory that applies: “D023 flush bypasses the cap” | PARTIAL | “S7: flush text (no `[A###]`) → `A009 prompt taken`, no spurious retry.” No flush-cap test shown. |
| Bash 3.2 and stdlib compatibility | Constraints: “bash 3.2 + python3 stdlib” | PARTIAL | “`bash -n` → `tick --once --dry-run`” Syntax check does not establish Bash 3.2 compatibility. |
| Mark changes and limit net lines | Constraints: “`(014)` markers; ≤ 60 lines net in `bin/controlroom`” | PASS | “Net change `bin/controlroom`: 1100 → 1140 lines (+40, budget ≤ 60).” |
| No new operational files beyond state keys | Constraints: “no new files besides state keys” | PASS | “New state keys only: `.tick-state.json` `sent{rid:{ts,off,text,tag,retried,toasted,last}}`, `deferred`.” |
| Every save validated | Constraints: “every save via WIP copy + `bash -n` + `tick --once --dry-run` (L032)” | N-A | “`tick: nothing to do` both times” Save sequence cannot be independently verified. |
| No init, pause, other rooms, commits | Constraints: “no `init`, no `pause`, no other rooms; nothing committed” | N-A | “No `init`, no `pause`, no other room touched; nothing committed.” Process history cannot be independently verified. |
| Time-box and early skeleton | Constraints: “time-box 45 min, write the skeleton of the result in the first 5.” | N-A | “after install and the scratch proof but before the result file was written” Late writing and elapsed-time deviation are declared. |
| Finding/fix/proof table | Deliverable: “finding → fix (`file:line`) → proof (command + log line) table” | PASS | “`uptake(st,dry,acts)` `:309–333`, run each tick at `:494`” |
| Trimmed scratch transcript | Deliverable: “the scratch transcript trimmed” | PASS | “## Scratch transcript (trimmed; full: `logs/scratch/014-wip/proof.log`, harness `proof.sh`)” |
| Live proof and deviations | Deliverable: “the live TAKEN-OK proof; deviations” | PASS | “11:57:52Z assistant stop 'TAKEN-OK\n\n(014 proof wake A033 — no round work; next: A032 at 06:03.)'” |
| Recorded decide/lesson lines with source | Deliverable: “`decide`/`lesson` lines you recorded (`--from` this file)” | PARTIAL | “`D028 prompt-uptake-tracked`” Lines and source references are supplied, but recording-command output is absent. |
| Sentinel | Deliverable: “sentinel `DONE 014`” | PASS | “DONE 014” |
| Go idle | Deliverable: “go idle.” | N-A | none found — terminal agent state cannot be judged from files. |

## Undeclared deviations
- none

## Unsupported claims
- “Same effect (never spent), no ledger rewrite.” The transcript instead shows the row already `fired`; pending-state retries are demonstrated, but equivalence to an unspent due row is not.

## Verdict
ACCEPT WITH NOTES
The objective and deliverable artifacts are supported; changed due-row semantics, working-status gating, and deferral cap are declared.
For ACCEPT, qualify the “Same effect (never spent)” claim or demonstrate equivalence to the required unspent due-row behavior.

## Cost
17,471 in · 2,809 out (cache r 7,647 / w 9,818) · $0.0534 · openai/gpt-6.1-sol · 44 s
