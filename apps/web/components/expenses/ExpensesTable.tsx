'use client';

import Link from "next/link";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";
import ExpensesCircularPlot from "./ExpensesCircularPlot";
import { useDebug } from "../debug/DebugContext";

type Props = {
  expenses: any[];
  loading?: boolean;
  error?: string | null;
  showMonth?: boolean;
  showAccount?: boolean;
  showCircularPlot?: boolean;
};

export default function ExpensesTable({
  expenses,
  loading,
  error,
  showMonth = true,
  showAccount = false,
  showCircularPlot = false,
}: Props) {
  const { debug } = useDebug();
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!expenses || expenses.length === 0) return <p>No expenses available.</p>;

  return (
    <>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #000" }}>
            {debug && <th style={{ textAlign: "left" }}>Id</th>}
            <th style={{ textAlign: "left" }}>Description</th>
            <th style={{ textAlign: "left" }}>Amount</th>
            <th style={{ textAlign: "left" }}>Type</th>
            {showMonth && <th style={{ textAlign: "left" }}>Month</th>}
            {showAccount && <th style={{ textAlign: "left" }}>Account</th>}
            <th style={{ textAlign: "left" }}>Status</th>
            {debug && <th style={{ textAlign: "left" }}>Created At</th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} style={{ borderBottom: "1px solid #ccc" }}>
              {debug && <td>{expense.id}</td>}
              <td>
                <Link href={`/expenses/${expense.id}`} style={{ color: "blue" }}>
                  {expense.description}
                </Link>
              </td>
              <td>{expense.amount}</td>
              <td>{expense.kind ?? "FIXED"}</td>
              {showMonth && (
                <td>{expense.month ? formatYearMonth(expense.month.year, expense.month.month) : "N/A"}</td>
              )}
              {showAccount && (
                <td>
                  <Link href={`/accounts/${expense.account_id}`} style={{ color: "blue" }}>
                    {expense.account?.name ?? expense.account_id}
                  </Link>
                </td>
              )}
              <td>{expense.status ?? "COMPLETED"}</td>
              {debug && <td>{new Date(expense.created_at).toLocaleString()}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      {showCircularPlot && <ExpensesCircularPlot expenses={expenses} />}
    </>
  );
}
