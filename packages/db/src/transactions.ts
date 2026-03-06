export { prisma } from './client'

export async function createTransaction(data: {
  fromAccountId: number
  toAccountId: number
  amount: number
  description?: string
  effectiveDate: Date
}) {
  const now = new Date()
  const isEffectiveNow = data.effectiveDate <= now

  if (isEffectiveNow) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          from_account_id: data.fromAccountId,
          to_account_id: data.toAccountId,
          amount: data.amount,
          description: data.description,
          effective_date: data.effectiveDate,
          status: "COMPLETED",
        }
      })

      await tx.account.update({
        where: { id: data.fromAccountId },
        data: { balance: { decrement: data.amount } }
      })

      await tx.account.update({
        where: { id: data.toAccountId },
        data: { balance: { increment: data.amount } }
      })

      return transaction
    })
  } else {
    return prisma.transaction.create({
      data: {
        from_account_id: data.fromAccountId,
        to_account_id: data.toAccountId,
        amount: data.amount,
        description: data.description,
        effective_date: data.effectiveDate,
        status: "PENDING",
      }
    })
  }
}