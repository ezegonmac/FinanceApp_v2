'use client';

import Link from "next/link";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";
import { useDebug } from "../debug/DebugContext";

type Props = {
  transactions: any[];
  loading?: boolean;
  error?: string | null;
  showMonth?: boolean;
  showAccount?: boolean;
  showFromAccount?: boolean;
  showToAccount?: boolean;
};

export default function TransactionsTable({
  transactions,
  loading,
  error,
  showMonth = true,
  showAccount = false,
  showFromAccount,
  showToAccount,
}: Props) {
  const displayFrom = showFromAccount ?? showAccount;
  const displayTo = showToAccount ?? showAccount;
  const { debug } = useDebug();
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!transactions || transactions.length === 0) return <p>No transactions available.</p>;

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #000" }}>
          {debug && <th style={{ textAlign: "left" }}>Id</th>}
          <th style={{ textAlign: "left" }}>Description</th>
          <th style={{ textAlign: "left" }}>Amount</th>
          {showMonth && <th style={{ textAlign: "left" }}>Month</th>}
          {displayFrom && <th style={{ textAlign: "left" }}>From</th>}
          {displayTo && <th style={{ textAlign: "left" }}>To</th>}
          <th style={{ textAlign: "left" }}>Status</th>
          {debug && <th style={{ textAlign: "left" }}>Created At</th>}
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => (
          <tr key={transaction.id} style={{ borderBottom: "1px solid #ccc" }}>
            {debug && <td>{transaction.id}</td>}
            <td>
              <Link href={`/transactions/${transaction.id}`} style={{ color: "blue" }}>
                {transaction.description}
              </Link>
            </td>
            <td>{transaction.amount}</td>
            {showMonth && (
              <td>{transaction.month ? formatYearMonth(transaction.month.year, transaction.month.month) : "N/A"}</td>
            )}
            {displayFrom && (
              <td>
                <Link href={`/accounts/${transaction.from_account_id}`} style={{ color: "blue" }}>
                  {transaction.from_account?.name ?? transaction.from_account_id}
                </Link>
              </td>
            )}
            {displayTo && (
              <td>
                <Link href={`/accounts/${transaction.to_account_id}`} style={{ color: "blue" }}>
                  {transaction.to_account?.name ?? transaction.to_account_id}
                </Link>
              </td>
            )}
            <td>{transaction.status}</td>
            {debug && <td>{new Date(transaction.created_at).toLocaleString()}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
