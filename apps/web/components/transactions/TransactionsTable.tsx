'use client';

import Link from "next/link";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";

type Props = {
  transactions: any[];
  loading?: boolean;
  error?: string | null;
  showMonth?: boolean;
  showAccount?: boolean;
};

export default function TransactionsTable({
  transactions,
  loading,
  error,
  showMonth = true,
  showAccount = false,
}: Props) {
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!transactions || transactions.length === 0) return <p>No transactions available.</p>;

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #000" }}>
          <th style={{ textAlign: "left" }}>Id</th>
          <th style={{ textAlign: "left" }}>Description</th>
          <th style={{ textAlign: "left" }}>Amount</th>
          {showMonth && <th style={{ textAlign: "left" }}>Month</th>}
          {showAccount && <th style={{ textAlign: "left" }}>From</th>}
          {showAccount && <th style={{ textAlign: "left" }}>To</th>}
          <th style={{ textAlign: "left" }}>Status</th>
          <th style={{ textAlign: "left" }}>Created At</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => (
          <tr key={transaction.id} style={{ borderBottom: "1px solid #ccc" }}>
            <td>
              <Link href={`/transactions/${transaction.id}`} style={{ color: "blue", textDecoration: "underline" }}>
                {transaction.id}
              </Link>
            </td>
            <td>{transaction.description}</td>
            <td>{transaction.amount}</td>
            {showMonth && (
              <td>{transaction.month ? formatYearMonth(transaction.month.year, transaction.month.month) : "N/A"}</td>
            )}
            {showAccount && <td>{transaction.from_account?.name ?? transaction.from_account_id}</td>}
            {showAccount && <td>{transaction.to_account?.name ?? transaction.to_account_id}</td>}
            <td>{transaction.status}</td>
            <td>{new Date(transaction.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
