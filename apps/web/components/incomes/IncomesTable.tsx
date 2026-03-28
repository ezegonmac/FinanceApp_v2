'use client';

import Link from "next/link";
import { formatYearMonth } from "@repo/utils";
import ErrorMessage from "../ErrorMessage";

type Props = {
  incomes: any[];
  loading?: boolean;
  error?: string | null;
  showMonth?: boolean;
  showAccount?: boolean;
};

export default function IncomesTable({
  incomes,
  loading,
  error,
  showMonth = true,
  showAccount = false,
}: Props) {
  if (loading) return <p>Loading...</p>;
  if (error) return <ErrorMessage message={error} />;
  if (!incomes || incomes.length === 0) return <p>No incomes available.</p>;

  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr style={{ borderBottom: "2px solid #000" }}>
          <th style={{ textAlign: "left" }}>Id</th>
          <th style={{ textAlign: "left" }}>Description</th>
          <th style={{ textAlign: "left" }}>Amount</th>
          {showMonth && <th style={{ textAlign: "left" }}>Month</th>}
          {showAccount && <th style={{ textAlign: "left" }}>Account</th>}
          <th style={{ textAlign: "left" }}>Status</th>
          <th style={{ textAlign: "left" }}>Created At</th>
        </tr>
      </thead>
      <tbody>
        {incomes.map((income) => (
          <tr key={income.id} style={{ borderBottom: "1px solid #ccc" }}>
            <td>
              <Link href={`/incomes/${income.id}`} style={{ color: "blue", textDecoration: "underline" }}>
                {income.id}
              </Link>
            </td>
            <td>{income.description}</td>
            <td>{income.amount}</td>
            {showMonth && (
              <td>{income.month ? formatYearMonth(income.month.year, income.month.month) : "N/A"}</td>
            )}
            {showAccount && (
              <td>{income.account?.name ?? income.account_id}</td>
            )}
            <td>{income.status ?? "COMPLETED"}</td>
            <td>{new Date(income.created_at).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
