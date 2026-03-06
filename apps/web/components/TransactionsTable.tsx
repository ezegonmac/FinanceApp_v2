'use client';

import ErrorMessage from "./ErrorMessage";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TransactionsTable({ accountId }: { accountId: number }) {

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transactionDescription, setTransactionDescription] = useState("");
    const [transactionAmount, setTransactionAmount] = useState("");
    const [transactionDate, setTransactionDate] = useState("");
    const [toAccountId, setToAccountId] = useState("");
    const [adding, setAdding] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchTransactions();
    }, [refreshKey]);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/accounts/" + accountId + "/transactions");
            if (!response.ok) {
                throw new Error("Failed to fetch transactions");
            }
            const transactions = await response.json();
            setTransactions(transactions)
        } catch (err) {
            setError("Failed to fetch transactions");
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async () => {
        
        // Frontend basic validation
        if (!transactionDescription.trim()) {
            setError("Transaction description cannot be empty");
            return;
        }
        if (!transactionAmount.trim() || isNaN(Number(transactionAmount))) {
            setError("Transaction amount must be a valid number");
            return;
        }
        if (Number(transactionAmount) <= 0) {
            setError("Transaction amount must be greater than zero");
            return;
        }

        setAdding(true);
        setError(null);
        console.log("Adding transaction with data:", {
                    description: transactionDescription,
                    amount: parseFloat(transactionAmount),
                    effective_date: transactionDate || new Date().toISOString(), // Use selected date or default to now
                    from_account_id: accountId,
                    to_account_id: parseInt(toAccountId),
                }
            );
        try {
            const response = await fetch("/api/transactions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    description: transactionDescription,
                    amount: parseFloat(transactionAmount),
                    effective_date: transactionDate || new Date().toISOString(), // Use selected date or default to now
                    from_account_id: accountId,
                    to_account_id: parseInt(toAccountId),
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to add transaction");
            }
            setTransactionDescription("");
            setTransactionAmount("");
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
            ) : transactions && transactions.length > 0 ? (
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                        <tr style={{ borderBottom: "2px solid #000" }}>
                            <th key={"id"} style={{ textAlign: "left" }}>Id</th>
                            <th key={"name"} style={{ textAlign: "left" }}>Name</th>
                            <th key={"amount"} style={{ textAlign: "left" }}>Amount</th>
                            <th key={"description"} style={{ textAlign: "left" }}>Description</th>
                            <th key={"created_at"} style={{ textAlign: "left" }}>Created At</th>
                            <th key={"effective_date"} style={{ textAlign: "left" }}>Effective Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction) => (
                            <tr key={transaction.id} style={{ borderBottom: "1px solid #ccc" }}>
                                <td>
                                    <Link 
                                        href={`/transactions/${transaction.id}`} 
                                        style={
                                            { color: "blue", textDecoration: "underline"}
                                        }>
                                        {transaction.id}
                                    </Link>
                                </td>
                                <td>{transaction.amount}</td>
                                <td>{transaction.description}</td>
                                <td>{new Date(transaction.created_at).toLocaleString()}</td>
                                <td>{new Date(transaction.effective_date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No transactions available for this account.</p>
            )}
            <br />

            <p style={{ fontWeight: "bold" }}>Send Transaction to other Account:</p>

            <input
                type="text"
                style={{ width: "30em" }}
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
                placeholder="Enter Transaction description"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            <input
                type="number"
                style={{ width: "15em" }}
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="Amount"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            <input
                type="date"
                style={{ width: "20em" }}
                value={new Date().toISOString().split("T")[0]} // Default to today
                onChange={(e) => setTransactionDate(e.target.value)}
                disabled={adding} // Disable input while adding
            /> &nbsp;
            <input
                type="number"
                style={{ width: "15em" }}
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                placeholder="To Account ID"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            
            <button onClick={handleAddTransaction} disabled={adding}>
                {adding ? "Adding..." : "Add Transaction"}
            </button> &nbsp;
            
            <button onClick={() => setRefreshKey(oldKey => oldKey + 1)} disabled={adding || loading || refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
            </button>
        </>
    );
}
