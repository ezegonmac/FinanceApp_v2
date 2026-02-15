import { prisma } from "@repo/db";
import type { Account } from "@repo/db";

type Props = {
  accounts: Account[];
};

export default function HomePage({ accounts }: Props) {
  return (
    <div>
      <h1>Finance App</h1>
      <ul>
        {accounts.map((account) => (
          <li key={account.id}>
            {account.name}: ${account.balance.toString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function getServerSideProps() {
  const accounts = await prisma.account.findMany();

  return {
    props: {
      accounts: JSON.parse(JSON.stringify(accounts)),
    },
  };
}
