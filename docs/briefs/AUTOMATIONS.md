# Automations — control room (pi-controlroom)
Rows are read and rewritten by `controlroom tick` every minute. `armed` = will fire; `held` = paused; `fired` = done (once) · next (recurring); `cancelled` = via `controlroom cancel` (never delete or edit rows by hand — ids are never reused; `cancel --prune-fired` drops inert one-shots).
Kinds: `watch <agent>` (worker finished/blocked/stuck) · `play` (end a pause) · `wake` (time; prompts the controller by default) · `watch-path <glob>` (newest mtime changed; toast unless --prompt) · `dream` (wake with a fixed instruction) · `flush` / `post-compaction` (tick fallback when the controlroom extension is absent: ctx ≥ 75 % / compaction seen). Controller pane id: logs/.controller.

| id | kind | state | next (local) | repeat | fired | prompt controller? | instruction | source |
|---|---|---|---|---|---|---|---|---|
| A001 | watch boot-and-memory | fired | — | — | 1 | no | integrate 004-boot-and-memory when DONE | rearm 10-27 12:48 |
| A002 | watch tick-stuck-pause | fired | — | — | 1 | no | integrate 005-tick-stuck-pause when DONE | rearm 10-27 12:48 |
| A004 | watch wake-automations | fired | — | — | 1 | no | integrate 006-wake-automations when DONE | launch 10-27 13:03 |
| A005 | watch dream-propose | fired | — | — | 1 | no | integrate 007-dream-propose when DONE | launch 10-27 13:04 |
| A006 | watch dreamer-1 | fired | — | — | 2 | no | dream --check, then promote/reject (report: memory/dreams/2026-10-27-1740.md) | dream 10-27 17:40 |
| A010 | watch dreamer-2 | fired | — | — | 1 | no | integrate .dream-brief when DONE | launch 10-27 13:18 |
| A011 | watch dreamer-3 | fired | — | — | 1 | no | dream --check, then promote/reject (report: memory/dreams/2026-10-27-1323.md) | dream 10-27 13:23 |
| A012 | watch compaction-ext | fired | — | — | 1 | no | integrate 008-compaction-extension when DONE | launch 10-27 14:08 |
| A013 | watch durability-tests | fired | — | — | 1 | no | integrate 009-durability-tests when DONE | launch 10-27 14:38 |
| A014 | watch tobi-scorecard | fired | — | — | 1 | no | integrate 010-tobi-scorecard when DONE | launch 10-27 14:38 |
| A015 | watch stuck-probe | cancelled | — | — | 1 | no | integrate 009-stuck when DONE | launch 10-27 15:24 · cancelled 10-27 15:49 |
| A016 | watch code-review | fired | — | — | 1 | no | integrate 011-code-review when DONE | launch 10-27 14:43 |
| A023 | watch close-the-loop | fired | — | — | 1 | no | integrate 012-close-the-loop when DONE | launch 10-27 15:21 |
| A025 | wake | cancelled | 2026-10-28 01:39 | every 2h | 4 | yes | round: integrate DONE workers, controlroom land, update STATUS.md; this wake repeats every 2h | wake 10-27 15:39 · cancelled 10-27 23:46 |
| A027 | wake | cancelled | 2026-10-29 08:00 | weekdays 08:00 | 1 | yes | round: integrate DONE workers, controlroom land, update STATUS.md; daily while the room is idle — re-arm the 2h round when work is launched | wake 10-27 23:46 · cancelled 10-28 13:10 |
| A028 | watch tobi-comparison | fired | — | — | 1 | no | integrate 013-tobi-comparison when DONE | launch 10-28 13:09 |
| A029 | wake | cancelled | 2026-10-28 19:09 | every 2h | 2 | yes | round: integrate DONE workers, controlroom land, update STATUS.md; this wake repeats every 2h | wake 10-28 13:09 · cancelled 10-28 17:21 |
| A030 | wake | cancelled | 2026-11-06 08:00 | weekdays 08:00 | 6 | yes | round: integrate DONE workers, controlroom land, update STATUS.md; daily while the room is idle — re-arm the 2h round when work is launched | wake 10-28 17:21 · cancelled 11-05 08:03 |
| A031 | watch prompt-uptake | fired | — | — | 1 | no | integrate 014-prompt-uptake when DONE | resume 11-06 04:54 |
| A032 | wake | cancelled | 2026-11-06 10:03 | every 2h | 2 | yes | round: integrate DONE workers, controlroom land, update STATUS.md; this wake repeats every 2h | wake 11-05 08:03 · cancelled 11-06 08:12 |
| A033 | wake | fired | 2026-11-06 04:57 | once | 1 | yes | 014 proof: reply TAKEN-OK | wake 11-06 04:57 |
| A034 | wake | cancelled | 2026-11-09 08:00 | weekdays 08:00 | 1 | yes | round: integrate DONE workers, controlroom land, update STATUS.md; daily while the room is idle — re-arm the 2h round when work is launched | wake 11-06 08:12 · cancelled 11-08 14:30 |
| A035 | watch status-page | fired | — | — | 1 | no | integrate 015-status-page when DONE | resume 11-08 16:16 |
| A036 | wake | cancelled | 2026-11-09 14:30 | every 2h | 4 | yes | round: integrate DONE workers, controlroom land, update STATUS.md; this wake repeats every 2h | wake 11-08 14:30 · cancelled 11-09 12:57 |
| A037 | wake | armed | 2026-11-10 08:00 | weekdays 08:00 | 0 | yes | round: integrate DONE workers, controlroom land, update STATUS.md; daily while the room is idle — re-arm the 2h round when work is launched | wake 11-09 12:57 |
