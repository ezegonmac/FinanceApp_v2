import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import EditExpenseForm from "@/components/expenses/EditExpenseForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ExpensePage({ params }: Props) {
  const { id } = await params;
  const expenseId = Number(id);

  if (Number.isNaN(expenseId)) {
    notFound();
  }

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: {
      month: true,
      account: true,
    },
  });

  if (!expense || !expense.month) {
    notFound();
  }

  return (
    <div>
      <h1>Edit Expense</h1>
      <p>
        <b>Account:</b> {expense.account.name}
      </p>
      <EditExpenseForm
        expense={{
          id: expense.id,
          account_id: expense.account_id,
          description: expense.description,
          amount: expense.amount.toString(),
          analytics_amount: expense.analytics_amount?.toString() ?? null,
          kind: expense.kind,
          month: {
            year: expense.month.year,
            month: expense.month.month,
          },
        }}
      />
    </div>
  );
}
