'use client';

import ErrorMessage from "./ErrorMessage";
import { useEffect, useState } from "react";
import Link from "next/link";


export default function AccountsTable() {

    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accountName, setAccountName] = useState("");
    const [accountBalance, setAccountBalance] = useState("");
    const [adding, setAdding] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchAccounts();
    }, [refreshKey]);

    const fetchAccounts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/accounts");
            if (!response.ok) {
                throw new Error("Failed to fetch accounts");
            }
            const accounts = await response.json();
            setAccounts(accounts)
        } catch (err) {
            setError("Failed to fetch accounts");
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = async () => {
        
        // Frontend basic validation
        if (!accountName.trim()) {
            setError("Account name cannot be empty");
            return;
        }

        setAdding(true);
        setError(null);
        try {
            const response = await fetch("/api/accounts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: accountName,
                    balance: accountBalance ? parseFloat(accountBalance) : 0,
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to add account");
            }
            setAccountName("");
            setAccountBalance("");
            setRefreshKey(oldKey => oldKey + 1); // Trigger refresh after adding
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setAdding(false);
        }
    };

    return (
        <>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <ErrorMessage message={error} />
            ) : accounts && accounts.length > 0 ? (
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr style={{ borderBottom: "2px solid #000" }}>
                            <th key={"id"} style={{ textAlign: "left" }}>Id</th>
                            <th key={"name"} style={{ textAlign: "left" }}>Name</th>
                            <th key={"balance"} style={{ textAlign: "left" }}>Balance</th>
                            <th key={"created_at"} style={{ textAlign: "left" }}>Created At</th>
                            <th key={"active"} style={{ textAlign: "left" }}>Active</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map((account) => (
                            <tr key={account.id} style={{ borderBottom: "1px solid #ccc" }}>
                                <td>{account.id}</td>
                                <td>
                                    <Link 
                                        href={`/accounts/${account.id}`} 
                                        style={
                                            { color: "blue", textDecoration: "underline"}
                                        }>
                                        {account.name}
                                    </Link>
                                </td>
                                <td>{account.balance}</td>
                                <td>{new Date(account.created_at).toLocaleString()}</td>
                                <td>{account.active ? "Yes" : "No"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No accounts available</p>
            )}
            <br />

            <h3>Add New Account</h3>
            <input
                type="text"
                style={{ width: "30em" }}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter Account name"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            <input
                type="number"
                style={{ width: "15em" }}
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
                placeholder="Initial balance"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            
            <button onClick={handleAddAccount} disabled={adding}>
                {adding ? "Adding..." : "Add Account"}
            </button> &nbsp;
            
            <button onClick={() => setRefreshKey(oldKey => oldKey + 1)} disabled={adding || loading || refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
            </button>
        </>
    );
}
