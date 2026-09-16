# pi-controlroom

A control room for [pi](https://pi.dev) + [Herdr](https://herdr.dev): one **controller** pi that writes briefs, launches **worker** pis in their own Herdr tabs, watches them, and integrates their results — with a live status strip and a file-based protocol that survives restarts.

## Install
```bash
pi install git:github.com/lanceriedel/pi-controlroom
```
Then, in any pi running inside a Herdr pane:
```
/reload
/controller <one-line project objective>
```
The first run tells the agent to copy `controlroom` + `controlroom-pager` into `~/.local/bin` (or do it yourself from `bin/`).

## What you get
- `/controller` prompt template — turns the current pi into the control room and gives it the operating rules.
- `controlroom` CLI — `init`, `launch`, `watch`, `watch-log`, `status`, `statusbar`, `detail`.
- `controlroom-pager` — the status strip: agents with state (+ what each is doing), pipelines with status/age, events, decisions waiting on you.
- A `controlroom` skill documenting the protocol and the gotchas.

## Requirements
Herdr ≥ 0.8, pi ≥ 0.85, python3, bash. Tested on macOS.

## Layout
```
prompts/controller.md      the /controller template
skills/controlroom/        SKILL.md + bin/ (scripts, so the skill can install them)
bin/                       same scripts, for manual install
```
MIT.
