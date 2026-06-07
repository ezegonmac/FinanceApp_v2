'use client';

import { ColumnDef } from "@tanstack/react-table";
import { formatYearMonth } from "@repo/utils";
import { ListTable } from "@/components/ui/list-table";
import TodoActions from "./TodoActions";

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
  currentYear: number;
  currentMonth: number;
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
    ? "bg-negative-subtle text-negative-subtle-foreground"
    : "bg-muted text-muted-foreground";

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

export default function PendingTodosTable({ todos, currentYear, currentMonth }: Props) {
  if (todos.length === 0) {
    return (
      <p className="py-4 text-sm text-center text-muted-foreground">
        All caught up — no pending actions for this month.
      </p>
    );
  }

  const pendingTone = "bg-muted text-muted-foreground";

  const columns: ColumnDef<TodoRow>[] = [
    {
      id: "action",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</span>,
      cell: ({ row }) => (
        <div className="max-w-lg">
          <p className="truncate font-medium" title={actionText(row.original)}>
            {actionText(row.original)}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={row.original.description ?? row.original.title}>
            {row.original.description ?? row.original.title}
          </p>
        </div>
      ),
    },
    {
      id: "dueMonth",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due month</span>,
      cell: ({ row }) => {
        const isOverdue =
          row.original.due_year < currentYear ||
          (row.original.due_year === currentYear && row.original.due_month < currentMonth);
        return (
          <div>
            <span className={`text-sm ${isOverdue ? "font-medium text-destructive" : "text-muted-foreground"}`}>
              {formatYearMonth(row.original.due_year, row.original.due_month)}
            </span>
            {isOverdue ? <p className="text-xs text-destructive">Overdue</p> : null}
          </div>
        );
      },
    },
    {
      id: "status",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>,
      cell: () => (
        <span className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${pendingTone}`}>
          Pending
        </span>
      ),
    },
    {
      id: "type",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</span>,
      cell: ({ row }) => (
        <span className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${typeTone(row.original.type)}`}>
          {typeLabel(row.original.type)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>,
      cell: ({ row }) => <TodoActions todoId={row.original.id} />,
      meta: { isAction: true },
    },
  ];

  return <ListTable columns={columns} data={todos} />;
}
