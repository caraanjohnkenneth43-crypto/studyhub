# StudyHub — Inter-Agent Scratchpad

Use this file to coordinate between multiple opencode sessions.

## Active Sessions
- **Tweaks prompt ready**: `AI/hermes-tweaks-prompt.md` — paste into Hermes to run. Covers 9 fixes: rooms API, notes/graph, remove calculator, chat send bug, images+emojis, room members panel, room-aware navbar, reorganize settings, enterprise UI polish.

## Decisions Log
| Date | Agent | Decision |
|------|-------|----------|
| 2026-06-09 | OpenCode | Cron chain for overnight sprint: 7 milestones, auto-skip manual tasks, retry 3x, build+commit each |
| 2026-06-10 | OpenCode | Generated hermes-tweaks-prompt.md with 9 prioritized fixes for Hermes to execute |

## Blockers
- (none)

## Handoff Queue
- (none)

## Tweaks to Run (via Hermes)
- **Prompt file**: `AI/hermes-tweaks-prompt.md`
- **Command**: `hermes -s studyhub-enterprise-loop,opencode -q "$(cat AI/hermes-tweaks-prompt.md)"`
- **Order**: Fix rooms API → Fix notes/graph → Remove calculator → Fix chat send bug → Images+emojis → Room members → Room-aware navbar → Reorganize settings → Enterprise UI polish (last, most delicate)
- **Build & commit after each milestone**
