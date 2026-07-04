## Goal

Track meaningful financial milestones and show when they are reached. Milestones may represent invested capital, net worth, portfolio value, or progress relative to annual expenses.

## Requirements

- The system shall allow financial milestones to be defined using a metric and target value.
- The system shall support milestones based on total invested amount, net worth, portfolio value, and expense coverage.
- The system shall calculate progress towards each milestone.
- The system shall display completed and upcoming milestones.
- The system shall record the first date on which a milestone was reached.
- When a financial metric changes, the system shall evaluate relevant incomplete milestones.
- If a completed milestone later falls below its target, the milestone shall remain completed and preserve its original reached date.

## Acceptance Criteria

Given a €10,000 invested capital milestone
When the total invested amount reaches or exceeds €10,000
Then the milestone is marked as completed and its reached date is recorded

Given a €25,000 net worth milestone
When the current net worth is €20,000
Then the milestone displays 80% progress

Given a completed financial milestone
When the related financial metric later falls below the target
Then the milestone remains completed and preserves its original reached date

Given an expense coverage milestone of 1 year
When the invested value reaches or exceeds 12 months of calculated expenses
Then the milestone is marked as completed

## Edge Cases

- A financial metric has insufficient historical data.
- A milestone target is zero or negative.
- A milestone is created after its target was already reached.
- A completed milestone's metric later falls below the target.
- Expense history is insufficient to calculate reliable expense coverage.
- Historical data changes and the original milestone reached date is no longer valid.

## Out of Scope

- Social sharing of milestones.
- Notifications or external alerts.
- Gamification, badges, or rewards.
- Automatically creating financial goals or recommendations.
- Forecasting when a milestone will be reached.

## Notes

- Consider a generic `financial_milestones` model with `metric`, `target_value`, and `reached_at`.
- Possible milestone metrics include `INVESTED_AMOUNT`, `NET_WORTH`, `PORTFOLIO_VALUE`, and `EXPENSE_COVERAGE_MONTHS`.
- Progress can be calculated as `currentValue / targetValue * 100`, capped at 100% for display.
- Milestones should preserve the first date they were reached.
- When a milestone is created after the target was already reached, historical portfolio data may be used to determine the original reached date.
- Expense coverage should use an average expense period rather than a single month's expenses.
- Consider using the trailing 12-month average expenses when enough data is available.
- Milestone evaluation should reuse existing portfolio and financial metric calculation services.
- Milestone definitions should remain independent from UI presentation so new milestone types can be added later.