'use client';

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import MovementsDonutChart from "./MovementsDonutChart";

type Account = { id: number; name: string };

type Income = {
  id: number;
  account_id: number;
  description: string;
  amount: string | number;
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
  allAccounts: Account[];
  incomes: Income[];
  expenses: Expense[];
  transactions: Transaction[];
  loading?: boolean;
};

type MovementRow = {
  key: string;
  label: string;
  inAmount: number;
  outAmount: number;
};

type DonutSlice = {
  key: string;
  label: string;
  amount: number;
  pct: number;
  color: string;
};

const fmt = (value: number) => {
  if (value === 0) return "-";
  return `€${value.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const pct = (part: number, total: number) => {
  if (total === 0 || part === 0) return "-";
  return `${((part / total) * 100).toFixed(1)}%`;
};

const cleanLabel = (value: string) => value.replace(/^Transfer\s+(In|Out):\s*/i, "");

function colorFor(index: number, total: number, baseHue: number) {
  const step = total > 0 ? 260 / total : 0;
  const hue = (baseHue + index * step) % 360;
  return `hsl(${hue}, 70%, 45%)`;
}

function buildSlices(
  movements: Array<{ key: string; label: string; amount: number }>,
  baseHue: number
): DonutSlice[] {
  const total = movements.reduce((acc, movement) => acc + movement.amount, 0);
  if (total === 0) return [];

  return movements.map((movement, index) => ({
    key: movement.key,
    label: movement.label,
    amount: movement.amount,
    pct: (movement.amount / total) * 100,
    color: colorFor(index, movements.length, baseHue),
  }));
}

function sumIn(rows: MovementRow[]) {
  return rows.reduce((acc, row) => acc + row.inAmount, 0);
}

function sumOut(rows: MovementRow[]) {
  return rows.reduce((acc, row) => acc + row.outAmount, 0);
}

function SectionTableComponent({
  title,
  rows,
  totalIn,
  totalOut,
}: {
  title: string;
  rows: MovementRow[];
  totalIn: number;
  totalOut: number;
}) {
  const sectionIn = sumIn(rows);
  const sectionOut = sumOut(rows);

  const columns: ColumnDef<MovementRow>[] = [
    {
      id: "label",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>,
      cell: ({ row }) => <span>{cleanLabel(row.original.label)}</span>,
    },
    {
      id: "inAmount",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">In</span>,
      cell: ({ row }) => <span className="text-right">{fmt(row.original.inAmount)}</span>,
    },
    {
      id: "outAmount",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Out</span>,
      cell: ({ row }) => <span className="text-right">{fmt(row.original.outAmount)}</span>,
    },
    {
      id: "pctIn",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">% In</span>,
      cell: ({ row }) => <span className="text-right">{pct(row.original.inAmount, totalIn)}</span>,
    },
    {
      id: "pctOut",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">% Out</span>,
      cell: ({ row }) => <span className="text-right">{pct(row.original.outAmount, totalOut)}</span>,
    },
  ];

  if (rows.length === 0) {
    return (
      <div className="mb-4 rounded-lg border">
        <div className="bg-muted/50 px-4 py-2 font-semibold">{title}</div>
        <div className="px-4 py-2 text-sm text-muted-foreground">No movements</div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="mb-2 bg-muted/50 px-4 py-2 font-semibold text-sm">{title}</div>
      <DataTable columns={columns} data={rows} headerClassName="bg-white" />
      <div className="border-t px-4 py-2 text-sm font-semibold">
        <div className="flex gap-8">
          <div className="flex-1">Section Total</div>
          <div className="w-24 text-right">{fmt(sectionIn)}</div>
          <div className="w-24 text-right">{fmt(sectionOut)}</div>
          <div className="w-20 text-right">{pct(sectionIn, totalIn)}</div>
          <div className="w-20 text-right">{pct(sectionOut, totalOut)}</div>
        </div>
      </div>
    </div>
  );
}

export default function AccountMovementsBreakdownTableRefactored({
  allAccounts,
  incomes,
  expenses,
  transactions,
  loading,
}: Props) {
  if (loading) return <p>Loading movement breakdown…</p>;
  if (!allAccounts || allAccounts.length === 0) return null;

  return (
    <div className="space-y-8">
      {allAccounts.map((account) => {
        const accountIncomes: MovementRow[] = incomes
          .filter((i) => i.account_id === account.id)
          .map((i) => ({
            key: `inc-${i.id}`,
            label: i.description || `Income #${i.id}`,
            inAmount: Number(i.amount),
            outAmount: 0,
          }));

        const accountExpenses: MovementRow[] = expenses
          .filter((e) => e.account_id === account.id)
          .map((e) => ({
            key: `exp-${e.id}`,
            label: e.description || `Expense #${e.id}`,
            inAmount: 0,
            outAmount: Number(e.amount),
          }));

        const accountTransactions: MovementRow[] = transactions
          .filter((t) => t.from_account_id === account.id || t.to_account_id === account.id)
          .map((t) => {
            const isIncoming = t.to_account_id === account.id;
            return {
              key: `txn-${t.id}-${account.id}`,
              label: `${isIncoming ? "Transfer In" : "Transfer Out"}: ${t.description || `Transaction #${t.id}`}`,
              inAmount: isIncoming ? Number(t.amount) : 0,
              outAmount: isIncoming ? 0 : Number(t.amount),
            };
          });

        const totalIn = sumIn(accountIncomes) + sumIn(accountTransactions);
        const totalOut = sumOut(accountExpenses) + sumOut(accountTransactions);
        const net = totalIn - totalOut;

        const inMovements = [
          ...accountIncomes.map((movement) => ({
            key: movement.key,
            label: movement.label,
            amount: movement.inAmount,
          })),
          ...accountTransactions
            .filter((movement) => movement.inAmount > 0)
            .map((movement) => ({
              key: movement.key,
              label: movement.label,
              amount: movement.inAmount,
            })),
        ];

        const outMovements = [
          ...accountExpenses.map((movement) => ({
            key: movement.key,
            label: movement.label,
            amount: movement.outAmount,
          })),
          ...accountTransactions
            .filter((movement) => movement.outAmount > 0)
            .map((movement) => ({
              key: movement.key,
              label: movement.label,
              amount: movement.outAmount,
            })),
        ];

        const inSlices = buildSlices(inMovements, 200);
        const outSlices = buildSlices(outMovements, 0);

        return (
          <div key={account.id} className="space-y-4">
            <h3 className="text-lg font-semibold">
              <Link href={`/accounts/${account.id}`} className="text-primary hover:underline">
                {account.name}
              </Link>
            </h3>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="overflow-hidden">
                <div className="space-y-3">
                  <SectionTableComponent title="Incomes" rows={accountIncomes} totalIn={totalIn} totalOut={totalOut} />
                  <SectionTableComponent title="Expenses" rows={accountExpenses} totalIn={totalIn} totalOut={totalOut} />
                  <SectionTableComponent title="Transactions" rows={accountTransactions} totalIn={totalIn} totalOut={totalOut} />
                </div>

                <div className="border-t-2 bg-muted/30 px-4 py-3 font-bold">
                  <div className="mb-2 flex gap-8">
                    <div className="flex-1">TOTAL</div>
                    <div className="w-24 text-right">{fmt(totalIn)}</div>
                    <div className="w-24 text-right">{fmt(totalOut)}</div>
                    <div className="w-20 text-right">{pct(totalIn, totalIn)}</div>
                    <div className="w-20 text-right">{pct(totalOut, totalOut)}</div>
                  </div>
                  <div className={`flex gap-8 ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <div className="flex-1">NET</div>
                    <div className="w-48 text-right">{net === 0 ? "-" : `${net >= 0 ? "+" : ""}${fmt(net)}`}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-center">
                <div className="flex flex-col gap-4">
                  <MovementsDonutChart title="In movements" slices={inSlices} />
                  <MovementsDonutChart title="Out movements" slices={outSlices} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
