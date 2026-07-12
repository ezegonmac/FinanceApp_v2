// ─── Input Types ─────────────────────────────────────────────────────────────

export type CashFlowEvent = {
  date: string; // YYYY-MM-DD
  amount: number; // positive for inflow (BUY), negative for outflow (SELL)
  portfolio_value_before: number;
};

// ─── Calculator ──────────────────────────────────────────────────────────────

/**
 * Pure function: computes Time-Weighted Return using modified Dietz method.
 *
 * Sub-periods are defined by cash flow events (BUY/SELL operations).
 * TWR = product of (1 + R_i) - 1, where R_i = (V_end - V_start) / V_start
 *
 * Each sub-period is bounded by consecutive cash flow events:
 *   - V_start = portfolio value at start of sub-period (post prior cash flow)
 *   - V_end = portfolio_value_before of the next cash flow event (pre next cash flow)
 *
 * The final sub-period runs from the last cash flow to the current endValue.
 *
 * Edge cases:
 *   - V_start = 0: Skip sub-period (contributes factor of 1, i.e., 0% return)
 *   - No cash flows: Simple return = (endValue - startValue) / startValue
 *   - startValue = 0 with no cash flows: return 0
 *   - Single point (startValue = endValue, no cash flows): return 0
 */
export function computeTWR(
  cashFlows: CashFlowEvent[],
  startValue: number,
  endValue: number,
): number {
  // No cash flows: simple return
  if (cashFlows.length === 0) {
    if (startValue === 0) return 0;
    return (endValue - startValue) / startValue;
  }

  // Sort cash flows chronologically
  const sorted = [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));

  let product = 1;
  let currentStart = startValue;

  for (const cf of sorted) {
    const subPeriodEnd = cf.portfolio_value_before;

    // Compute sub-period return
    if (currentStart !== 0) {
      const r = (subPeriodEnd - currentStart) / currentStart;
      product *= 1 + r;
    }
    // If currentStart === 0, skip sub-period (factor of 1)

    // Next sub-period starts at portfolio value after the cash flow
    currentStart = subPeriodEnd + cf.amount;
  }

  // Final sub-period: from last cash flow to endValue
  if (currentStart !== 0) {
    const r = (endValue - currentStart) / currentStart;
    product *= 1 + r;
  }
  // If currentStart === 0, skip final sub-period (factor of 1)

  return product - 1;
}
