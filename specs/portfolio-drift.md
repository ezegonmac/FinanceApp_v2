# Feature Name

> Backlog entry: ` - Portfolio allocation drift [spec:portfolio-drift] 🟨`

## Goal

Allow the user to define a target allocation for investment assets and compare it against the current portfolio allocation. Highlight allocation drift and suggest how new contributions could be distributed to move the portfolio closer to its target without selling assets. A circular plot is used to display it.


## Requirements

- The system shall allow defining a target allocation percentage for each portfolio asset.
- The system shall validate that the total target allocation equals 100%.
- The system shall calculate the current allocation using the latest available asset prices.
- The system shall calculate the allocation drift for each asset.
- The system shall display the target, current allocation, and drift for each asset.
- The system shall allow entering a hypothetical contribution amount.
- When a contribution amount is provided, the system shall suggest how to distribute it to move the portfolio closer to the target allocation.
- If current asset prices are missing or stale, the system shall synchronize prices before calculating the allocation.
- If there percentages doesn´t sum 100% the rest will be treated as "Other"


## Acceptance Criteria

```
Given a portfolio with target allocations totaling 100%
When the current allocation is calculated
Then each asset displays its target allocation, current allocation, and allocation drift
```

```
Given a portfolio that has drifted from its target allocation
When the user enters a new contribution amount
Then the system suggests how to distribute the contribution to reduce allocation drift without selling assets
```

```
Given target allocations that do not total 100%
When the user attempts to save the allocation
Then the system rejects the configuration and displays a validation error
```

## Edge Cases

- An asset has no current price.
- An asset exists in the portfolio but has no target allocation.
- A target asset has no current position.
- The portfolio has no invested value.
- The contribution amount is zero or negative.
- The contribution amount is insufficient to fully rebalance the portfolio.
- An asset is significantly overweight and cannot be corrected without selling.


## Out of Scope

- Automatically executing purchases or sales.
- Sell-based rebalancing.
- Tax-aware rebalancing.
- Transaction fees or purchase minimums.
- Fractional share or fund purchase restrictions.
- Multi-currency / FX-adjusted allocation calculations.

## Notes

- Calculate drift as `currentAllocation - targetAllocation`.
- Current allocation should be based on the latest available asset value.
- Contribution suggestions should prioritize underweight assets.
- The contribution algorithm should minimize allocation drift without assigning money to overweight assets.
- Suggested contributions are derived data and should not require persistence.
- Consider separating target allocation configuration from current portfolio positions.
- A future version could support multiple allocation strategies or portfolios.
