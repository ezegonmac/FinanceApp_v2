import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import EditTransactionForm from "@/components/transactions/EditTransactionForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function TransactionPage({ params }: Props) {
  const { id } = await params;
  const transactionId = Number(id);

  if (Number.isNaN(transactionId)) {
    notFound();
  }

  const [transaction, accounts] = await Promise.all([
    prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        month: true,
        from_account: true,
        to_account: true,
      },
    }),
    prisma.account.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        active: true,
      },
    }),
  ]);

  if (!transaction || !transaction.month) {
    notFound();
  }

  return (
    <div>
      <h1>Edit Transaction</h1>
      <p>
        <b>Current Route:</b> {transaction.from_account.name} → {transaction.to_account.name}
      </p>
      <EditTransactionForm
        transaction={{
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount.toString(),
          from_account_id: transaction.from_account_id,
          to_account_id: transaction.to_account_id,
          month: {
            year: transaction.month.year,
            month: transaction.month.month,
          },
        }}
        accounts={accounts}
      />
    </div>
  );
}
