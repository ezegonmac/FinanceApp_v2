import { prisma } from "@repo/db";
import { formatYearMonth, getEuropeMadridDateParts } from "@repo/utils";
import TodoActions from "@/components/todos/TodoActions";
import TodoReopenButton from "@/components/todos/TodoReopenButton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default async function TodosPage() {
  const { year: currentYear, month: currentMonth } = getEuropeMadridDateParts();
  const monthLabel = formatYearMonth(currentYear, currentMonth);

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
    completed_at: Date | null;
    account?: { name: string } | null;
    from_account?: { name: string } | null;
    to_account?: { name: string } | null;
  };

  let todos: TodoRow[] = [];
  let closedTodos: TodoRow[] = [];
  let loadError: string | null = null;

  const todoInclude = {
    account: { select: { name: true } },
    from_account: { select: { name: true } },
    to_account: { select: { name: true } },
  } as const;

  try {
    [todos, closedTodos] = await Promise.all([
      prisma.todo.findMany({
        where: {
          status: "OPEN",
          OR: [{ due_year: { lt: currentYear } }, { due_year: currentYear, due_month: { lte: currentMonth } }],
        },
        include: todoInclude,
        orderBy: [{ due_year: "asc" }, { due_month: "asc" }, { id: "asc" }],
        take: 200,
      }),
      prisma.todo.findMany({
        where: { status: { in: ["DONE", "SKIPPED"] } },
        include: todoInclude,
        orderBy: [{ due_year: "desc" }, { due_month: "desc" }, { id: "desc" }],
        take: 100,
      }),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unknown error";
  }

  const typeLabel = (type: "EXPENSE" | "TRANSACTION") =>
    type === "EXPENSE" ? "Expense" : "Transfer";

  const typeTone = (type: "EXPENSE" | "TRANSACTION") =>
    type === "EXPENSE"
      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
      : "bg-sky-50 text-sky-700 ring-1 ring-sky-200";

  const accountContext = (row: TodoRow) =>
    row.type === "EXPENSE"
      ? row.account?.name ?? "Unknown account"
      : `${row.from_account?.name ?? "Unknown"} → ${row.to_account?.name ?? "Unknown"}`;

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

  const statusTone = (status: TodoRow["status"]) => {
    if (status === "DONE") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    if (status === "SKIPPED") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    return "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200";
  };

  const pendingTone = "bg-blue-50 text-blue-700 ring-1 ring-blue-200";

  return (
    <section className="space-y-6">
      <header className="flex items-start justify-between gap-4 px-2 py-4 text-card-foreground">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Todos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manual actions to complete for {monthLabel}.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-3xl font-semibold tabular-nums">{todos.length}</p>
        </div>
      </header>

      {loadError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="font-medium">Todo table is not ready in the current database.</p>
          <p className="text-sm mt-1">Apply the latest Prisma migration to create the Todo entity, then reload this page.</p>
          <p className="text-xs mt-2 opacity-80">{loadError}</p>
        </div>
      ) : null}

      {/* Pending */}
      <section className="rounded-md border bg-card p-6 text-card-foreground space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Pending</h2>
        {todos.length === 0 ? (
          <p className="py-4 text-sm text-center text-muted-foreground">
            All caught up — no pending actions for this month.
          </p>
        ) : (
          <Table className="[&_th]:h-8 [&_th]:py-1 [&_td]:py-1.5">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due month</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todos.map((row) => {
                const isOverdue = row.due_year < currentYear || (row.due_year === currentYear && row.due_month < currentMonth);
                return (
                  <TableRow key={row.id}>
                    <TableCell className="max-w-lg">
                      <p className="truncate font-medium" title={actionText(row)}>{actionText(row)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground truncate" title={row.description ?? row.title}>
                        {row.description ?? row.title}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${isOverdue ? "font-medium text-amber-700" : "text-muted-foreground"}`}>
                        {formatYearMonth(row.due_year, row.due_month)}
                      </span>
                      {isOverdue ? <p className="text-xs text-amber-600">Overdue</p> : null}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pendingTone}`}>
                        Pending
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeTone(row.type)}`}>
                        {typeLabel(row.type)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <TodoActions todoId={row.id} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {/* Completed */}
      <section className="rounded-md border bg-card p-6 text-card-foreground space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Completed</h2>
        {closedTodos.length === 0 ? (
          <p className="py-4 text-sm text-center text-muted-foreground">No completed todos yet.</p>
        ) : (
          <Table className="[&_th]:h-8 [&_th]:py-1 [&_td]:py-1.5">
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Due month</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</TableHead>
                <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {closedTodos.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-lg">
                    <p className="truncate font-medium text-muted-foreground line-through" title={actionText(row)}>{actionText(row)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate" title={row.description ?? row.title}>
                      {row.description ?? row.title}
                    </p>
                    {row.status === "SKIPPED" && row.skip_reason ? (
                      <p className="mt-0.5 text-xs italic text-muted-foreground">Reason: {row.skip_reason}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatYearMonth(row.due_year, row.due_month)}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(row.status)}`}>
                      {row.status === "DONE" ? "Done" : "Skipped"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium opacity-60 ${typeTone(row.type)}`}>
                      {typeLabel(row.type)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <TodoReopenButton todoId={row.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </section>
  );
}

