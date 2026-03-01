import styles from "./page.module.css";
import { prisma } from "@repo/db";
import AccountsTable from "../components/AccountsTable";

export default async function Home() {
  
  return (
    <div style={{fontFamily: 'sans-serif'}}>
        <h1>Accounts</h1>
            
        <AccountsTable/>
    </div>
  );
}