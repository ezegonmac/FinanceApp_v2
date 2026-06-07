'use client';

import { ColumnDef } from "@tanstack/react-table";
import { formatYearMonth } from "@repo/utils";
import { ListTable } from "@/components/ui/list-table";
import TodoReopenButton from "./TodoReopenButton";

type TodoRow = {
  id: number;
  type: "EXPENSE" | "TRANSACTION";
  status: "OPEN" | "DONE" | "SKIPPED";
  title: string;
  amount: unknown;
  due_year: number;
  due_month: number;
  description: string | null;
  skip_reason: string | null;
  completed_at: string | null;
  account?: { name: string } | null;
  from_account?: { name: string } | null;
  to_account?: { name: string } | null;
};

type Props = {
  todos: TodoRow[];
};

const formatCurrency = (value: unknown) => {
  const n = Number(value ?? 0);
  const hasDecimals = !Number.isInteger(n);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
};

const typeLabel = (type: "EXPENSE" | "TRANSACTION") =>
  type === "EXPENSE" ? "Expense" : "Transfer";

const typeTone = (type: "EXPENSE" | "TRANSACTION") =>
  type === "EXPENSE"
    ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
    : "bg-sky-50 text-sky-700 ring-1 ring-sky-200";

const statusTone = (status: TodoRow["status"]) => {
  if (status === "DONE") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (status === "SKIPPED") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200";
};

const actionText = (row: TodoRow) => {
  const amount = formatCurrency(row.amount);
  if (row.type === "TRANSACTION") {
    const from = row.from_account?.name ?? "Unknown account";
    const to = row.to_account?.name ?? "Unknown account";
    return `Send ${amount} from ${from} to ${to}`;
  }
  const account = row.account?.name ?? "Unknown account";
  return `Send ${amount} from ${account}`;
};

export default function CompletedTodosTable({ todos }: Props) {
  if (todos.length === 0) {
    return <p className="py-4 text-sm text-center text-muted-foreground">No completed todos yet.</p>;
  }

  const columns: ColumnDef<TodoRow>[] = [
    {
      id: "action",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</span>,
      cell: ({ row }) => (
        <div className="max-w-lg">
          <p className="truncate font-medium text-muted-foreground line-through" title={actionText(row.original)}>
            {actionText(row.original)}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={row.original.description ?? row.original.title}>
            {row.original.description ?? row.original.title}
          </p>
          {row.original.status === "SKIPPED" && row.original.skip_reason ? (
            <p className="mt-0.5 text-xs italic text-muted-foreground">Reason: {row.original.skip_reason}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "dueMonth",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due month</span>,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatYearMonth(row.original.due_year, row.original.due_month)}
        </span>
      ),
    },
    {
      id: "status",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>,
      cell: ({ row }) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(row.original.status)}`}>
          {row.original.status === "DONE" ? "Done" : "Skipped"}
        </span>
      ),
    },
    {
      id: "type",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</span>,
      cell: ({ row }) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium opacity-60 ${typeTone(row.original.type)}`}>
          {typeLabel(row.original.type)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>,
      cell: ({ row }) => <TodoReopenButton todoId={row.original.id} />,
      meta: { isAction: true },
    },
  ];

  return <ListTable columns={columns} data={todos} />;
}
