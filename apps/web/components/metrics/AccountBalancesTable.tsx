import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";

type AccountBalance = {
  id: number;
  name: string;
  balance: string | number;
};

type Props = {
  accounts: AccountBalance[];
  total: number;
};

const fmt = (val: number) =>
  val.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

export default function AccountBalancesTable({ accounts, total }: Props) {
  if (!accounts || accounts.length === 0) {
    return <p className="text-muted-foreground">No accounts found.</p>;
  }

  const columns: ColumnDef<AccountBalance>[] = [
    {
      accessorKey: "name",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Account</span>,
      cell: ({ row }) => (
        <Link href={`/accounts/${row.original.id}`} className="font-medium text-primary underline-offset-4 hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "balance",
      header: () => <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Balance</span>,
      cell: ({ row }) => fmt(Number(row.original.balance)),
    },
  ];

  return (
    <div className="space-y-3">
      <DataTable columns={columns} data={accounts} headerClassName="bg-muted/50" />
      <div className="rounded-md border bg-muted/30 px-4 py-3 font-semibold">
        <div className="flex items-center justify-between">
          <span>Total</span>
          <span>{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
