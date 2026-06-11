# StudyHub — Inter-Agent Scratchpad

Use this file to coordinate between multiple opencode sessions.

## Active Sessions
- **Overnight sprint (cron)**: Job `b1372c111cc6`, fires every 4h. State at `~/.hermes/scripts/studyhub-sprint.state`. Gateway running via systemd user service.

## Decisions Log
| Date | Agent | Decision |
|------|-------|----------|
| 2026-06-09 | OpenCode | Cron chain for overnight sprint: 7 milestones, auto-skip manual tasks, retry 3x, build+commit each |

## Blockers
- (none)

## Handoff Queue
- (none)

## Cron Chain Setup
- **Gateway**: `systemctl --user status hermes-gateway` — active, linger enabled
- **Cron job**: `hermes cron list` — `studyhub-sprint` every 4h
- **Script**: `~/.hermes/scripts/studyhub-sprint.sh` — runs each milestone via hermes -z
- **State**: `~/.hermes/scripts/studyhub-sprint.state` — progress tracker (0-7)
- **Sprint plan**: `AI/overnight-autonomous-sprint.md` (in repo)
- **Milestones**: M1=DMs, M2=UI redesign, M3=classroom persistence, M4=user profiles, M5=custom quizzes, M6=personal notes, M7=graph-view notes
- **Review**: Enterprise code loop — Hermes reviews all OpenCode output before commit
