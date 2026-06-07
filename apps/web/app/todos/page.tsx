import { prisma } from "@repo/db";
import { formatYearMonth, getEuropeMadridDateParts } from "@repo/utils";
import PendingTodosTable from "@/components/todos/PendingTodosTable";
import CompletedTodosTable from "@/components/todos/CompletedTodosTable";

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

  // Serialize Date fields to strings for client component consumption
  const serializeTodos = (rows: TodoRow[]) =>
    rows.map((row) => ({
      ...row,
      completed_at: row.completed_at?.toISOString() ?? null,
    }));

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
        <PendingTodosTable
          todos={serializeTodos(todos)}
          currentYear={currentYear}
          currentMonth={currentMonth}
        />
      </section>

      {/* Completed */}
      <section className="rounded-md border bg-card p-6 text-card-foreground space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Completed</h2>
        <CompletedTodosTable todos={serializeTodos(closedTodos)} />
      </section>
    </section>
  );
}
