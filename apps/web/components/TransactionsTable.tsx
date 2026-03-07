'use client';

import ErrorMessage from "./ErrorMessage";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatYearMonth } from "../utils/dates";

export default function TransactionsTable({ accountId }: { accountId: number }) {

    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [month, setMonth] = useState(new Date().getMonth() + 1); // Default to current month
    const [year, setYear] = useState(new Date().getFullYear());
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
        if (!description.trim()) {
            setError("Transaction description cannot be empty");
            return;
        }
        if (!amount.trim() || isNaN(Number(amount))) {
            setError("Transaction amount must be a valid number");
            return;
        }
        if (Number(amount) <= 0) {
            setError("Transaction amount must be greater than zero");
            return;
        }

        setAdding(true);
        setError(null);

        // check if monthId is in storage, if not fetch it and store it
        const monthIdKey = `monthId-${formatYearMonth(year, month)}`;
        let monthId = localStorage.getItem(monthIdKey);
        if (!monthId) {
            try {
                const response = await fetch(`/api/months`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        year: year,
                        month: month,
                    }),
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch or create month");
                }
                const monthData = await response.json();
                monthId = monthData.id;
                if (!monthId) {
                    throw new Error("Invalid month data received from server");
                }
                localStorage.setItem(monthIdKey, monthId);
            } catch (err) {
                setError("Failed to find or create month for the transaction");
                return;
            }
        }

        console.log("Adding transaction with data:", {
                    description: description,
                    amount: parseFloat(amount),
                    month_id: parseInt(monthId),
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
                    description: description,
                    amount: parseFloat(amount),
                    month_id: parseInt(monthId),
                    from_account_id: accountId,
                    to_account_id: parseInt(toAccountId),
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to add transaction");
            }
            setDescription("");
            setAmount("");
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
                            <th key={"amount"} style={{ textAlign: "left" }}>Amount</th>
                            <th key={"description"} style={{ textAlign: "left" }}>Description</th>
                            <th key={"month"} style={{ textAlign: "left" }}>Month</th>
                            <th key={"status"} style={{ textAlign: "left" }}>Status</th>
                            <th key={"created_at"} style={{ textAlign: "left" }}>Created At</th>
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
                                <td>{
                                    transaction.month ? 
                                    formatYearMonth(transaction.month.year, transaction.month.month) : 
                                    "N/A"}
                                </td>
                                <td>{transaction.status}</td>
                                <td>{new Date(transaction.created_at).toLocaleString()}</td>
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter Transaction description"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            <input
                type="number"
                style={{ width: "15em" }}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            <input
                type="number"
                style={{ width: "15em" }}
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                placeholder="To Account Id"
                disabled={adding}
            /> &nbsp;
            <input
                type="month"
                style={{ width: "20em" }}
                value={formatYearMonth(year, month)}
                onChange={(e) => {
                    const [year, month] = e.target.value.split("-");
                    setYear(Number(year));
                    setMonth(Number(month));
                }}
                disabled={adding}
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
