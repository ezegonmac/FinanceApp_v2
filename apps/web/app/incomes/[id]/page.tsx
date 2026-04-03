import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import EditIncomeForm from "@/components/incomes/EditIncomeForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function IncomePage({ params }: Props) {
  const { id } = await params;
  const incomeId = Number(id);

  if (Number.isNaN(incomeId)) {
    notFound();
  }

  const income = await prisma.income.findUnique({
    where: { id: incomeId },
    include: {
      month: true,
      account: true,
    },
  });

  if (!income || !income.month) {
    notFound();
  }

  return (
    <div>
      <h1>Edit Income</h1>
      <p>
        <b>Account:</b> {income.account.name}
      </p>
      <EditIncomeForm
        income={{
          id: income.id,
          account_id: income.account_id,
          description: income.description,
          amount: income.amount.toString(),
          month: {
            year: income.month.year,
            month: income.month.month,
          },
        }}
      />
    </div>
  );
}
