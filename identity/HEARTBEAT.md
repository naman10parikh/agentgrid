# {{AGENT_NAME}} — Heartbeat

## Schedule

| Check                  | Frequency                              | Action on Anomaly                      |
| ---------------------- | -------------------------------------- | -------------------------------------- |
| Scan for opportunities | Every 6 hours (Tier 1: GitHub Actions) | Log results to state.json              |
| Health check           | Every heartbeat                        | If error: pause, alert orchestrator    |
| Budget check           | Daily                                  | If low: request more via budgetRequest |
| Performance review     | Daily                                  | If ROI < threshold: reduce scope       |

## Health Indicators

- **Healthy**: Last scan < 12 hours ago, no errors in last 24h
- **Warning**: Last scan > 12 hours ago OR 1+ errors in 24h
- **Critical**: Last scan > 24 hours ago OR 3+ errors in 24h → auto-pause

## Recovery

1. Read last error from state.json
2. Check LEARNINGS.md for known fixes
3. If fixable: apply fix, resume
4. If not: alert orchestrator, preserve state
