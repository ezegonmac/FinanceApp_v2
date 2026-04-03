'use client';

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import SpentLeftDonutChart from "./SpentLeftDonutChart";

type MonthSnapshot = {
  id: number;
  account_id: number;
  total_incomes: string;
  total_expenses: string;
  total_transactions_in: string;
  total_transactions_out: string;
};

type Account = {
  id: number;
  name: string;
};

type Expense = {
  id: number;
  account_id: number;
  description: string;
  amount: string | number;
};

type Transaction = {
  id: number;
  description: string;
  amount: string | number;
  from_account_id: number;
  to_account_id: number;
};

type Props = {
  snapshots: MonthSnapshot[];
  allAccounts: Account[];
  expenses: Expense[];
  transactions: Transaction[];
  loading?: boolean;
};

type OutMovement = {
  key: string;
  label: string;
  amount: number;
  pctOfOut: number;
  pctOfIn: number;
  color: string;
};

const fmt = (value: number) => {
  if (value === 0) return "-";
  return `€${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtPct = (value: number) => (value === 0 ? "-" : `${value.toFixed(1)}%`);
const cleanLabel = (value: string) => value.replace(/^Transfer\s+(In|Out):\s*/i, "");

function colorFor(index: number, total: number) {
  const step = total > 0 ? 280 / total : 0;
  const hue = (5 + index * step) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

export default function AccountSpentLeftTableRefactored({
  snapshots,
  allAccounts,
  expenses,
  transactions,
  loading,
}: Props) {
  if (loading) return <p>Loading spent/left summary…</p>;
  if (!allAccounts || allAccounts.length === 0) return null;

  return (
    <div className="space-y-8">
      {allAccounts.map((account, index) => {
        const snap = snapshots.find((row) => row.account_id === account.id);

        const totalIn = snap ? Number(snap.total_incomes) + Number(snap.total_transactions_in) : 0;
        const totalOut = snap ? Number(snap.total_expenses) + Number(snap.total_transactions_out) : 0;
        const leftAmount = totalIn - totalOut;
        const leftPct = totalIn > 0 ? Math.max(0, (leftAmount / totalIn) * 100) : 0;
        const spentPct = totalIn > 0 ? Math.max(0, (totalOut / totalIn) * 100) : 0;

        const outMovementsBase = [
          ...expenses
            .filter((item) => item.account_id === account.id)
            .map((item) => ({
              key: `exp-${item.id}`,
              label: item.description || `Expense #${item.id}`,
              amount: Number(item.amount),
            })),
          ...transactions
            .filter((item) => item.from_account_id === account.id)
            .map((item) => ({
              key: `tx-out-${item.id}`,
              label: `${item.description || `Transaction #${item.id}`}`,
              amount: Number(item.amount),
            })),
        ];

        const outMovements: OutMovement[] = outMovementsBase.map((movement, index) => ({
          ...movement,
          pctOfOut: totalOut > 0 ? (movement.amount / totalOut) * 100 : 0,
          pctOfIn: totalIn > 0 ? (movement.amount / totalIn) * 100 : 0,
          color: colorFor(index, outMovementsBase.length),
        }));

        const summaryColumns: ColumnDef<{ key: string; label: string; value: string }>[] = [
          {
            id: "label",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Metric</span>,
            cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
          },
          {
            id: "value",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Value</span>,
            cell: ({ row }) => <span className="text-right font-semibold">{row.original.value}</span>,
          },
        ];

        const summaryData = [
          { key: "total_in", label: "Total In", value: fmt(totalIn) },
          { key: "total_out", label: "Total Out", value: fmt(totalOut) },
          { key: "spent_pct", label: "Spent %", value: fmtPct(spentPct) },
          { key: "left_pct", label: "Left %", value: fmtPct(leftPct) },
          {
            key: "left_amount",
            label: "Left Amount",
            value: leftAmount === 0 ? "-" : leftAmount > 0 ? `+${fmt(leftAmount)}` : fmt(leftAmount),
          },
        ];

        const outMovementColumns: ColumnDef<OutMovement>[] = [
          {
            id: "label",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Out Movement</span>,
            cell: ({ row }) => <span>{cleanLabel(row.original.label)}</span>,
          },
          {
            id: "amount",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</span>,
            cell: ({ row }) => <span className="text-right">{fmt(row.original.amount)}</span>,
          },
          {
            id: "pctOfOut",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">% of Out</span>,
            cell: ({ row }) => <span className="text-right">{fmtPct(row.original.pctOfOut)}</span>,
          },
          {
            id: "pctOfIn",
            header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">% of In</span>,
            cell: ({ row }) => <span className="text-right">{fmtPct(row.original.pctOfIn)}</span>,
          },
        ];

        return (
          <div key={account.id} className={`space-y-4 ${index > 0 ? "border-t pt-6" : ""}`}>
            <h3 className="text-lg font-semibold">
              <Link href={`/accounts/${account.id}`} className="text-primary hover:underline">
                {account.name}
              </Link>
            </h3>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-4 overflow-hidden">
                <div>
                  <div className="mb-2 bg-muted/50 px-4 py-2 text-sm font-semibold">Summary</div>
                  <DataTable columns={summaryColumns} data={summaryData} headerClassName="bg-white" />
                </div>

                <div>
                  <div className="mb-2 bg-muted/50 px-4 py-2 text-sm font-semibold">Out Movements</div>
                  {outMovements.length === 0 ? (
                    <div className="px-4 py-2 text-sm text-muted-foreground">No out movements</div>
                  ) : (
                    <DataTable columns={outMovementColumns} data={outMovements} headerClassName="bg-white" />
                  )}
                </div>
              </div>

              <div className="flex items-start justify-center">
                <SpentLeftDonutChart leftPct={leftPct} outMovements={outMovements} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
