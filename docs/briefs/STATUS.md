# STATUS — control room board (pi-controlroom)
**Where to go:** Herdr workspace `wC` → tab **CONTROLLER** (agent `controller`). Talk to it; it briefs, launches, integrates.

## Workers
| pane | agent | brief | state | result |
|---|---|---|---|---|

## Decisions waiting on the human
1. **Overview video of pi-controlroom** — where is the narrated-video pipeline you used in the other space (repo/path + tool: Remotion / ffmpeg+TTS / screen-recording / other)? Also target length & audience. Brief `001-overview-video` launches as soon as this lands.

## How to use the agents
`herdr agent list` · `herdr agent read <name> --source recent-unwrapped --lines 60` · `herdr agent prompt <name> "…"` · `herdr agent focus <name>`
Only **blocked** needs a human. New work → `docs/briefs/<X>.md` (objective · inputs · constraints · deliverable · where to write) → ask controller to launch.
Results land in `docs/briefs/results/`; chat is ephemeral, files are the memory.
