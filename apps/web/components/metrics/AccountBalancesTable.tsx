import Link from "next/link";

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
  if (!accounts || accounts.length === 0) return <p>No accounts found.</p>;

  return (
    <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: "1rem" }}>
      <thead>
        <tr>
          {["Account", "Balance"].map((h) => (
            <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #ccc" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {accounts.map((a) => (
          <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}>
            <td style={{ padding: "6px 10px" }}>
              <Link href={`/accounts/${a.id}`} style={{ color: "blue" }}>
                {a.name}
              </Link>
            </td>
            <td style={{ padding: "6px 10px" }}>{fmt(Number(a.balance))}</td>
          </tr>
        ))}
        <tr style={{ borderTop: "2px solid #ccc", fontWeight: "bold" }}>
          <td style={{ padding: "6px 10px" }}>Total</td>
          <td style={{ padding: "6px 10px" }}>{fmt(total)}</td>
        </tr>
      </tbody>
    </table>
  );
}
