import styles from "./page.module.css";
import { prisma } from "@repo/db";

export default async function Home() {
  const account = await prisma.account.findFirst() 
  return (
    <div className={styles.page}>
      {account?.name ?? "No account added yet"}
    </div>
  );
}