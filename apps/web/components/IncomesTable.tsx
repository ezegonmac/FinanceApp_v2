'use client';

import ErrorMessage from "./ErrorMessage";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function IncomesTable({ accountId }: { accountId: number }) {

    const [incomes, setIncomes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [incomeDescription, setIncomeDescription] = useState("");
    const [incomeAmount, setIncomeAmount] = useState("");
    const [adding, setAdding] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        fetchIncomes();
    }, [refreshKey]);

    const fetchIncomes = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/accounts/" + accountId + "/incomes");
            if (!response.ok) {
                throw new Error("Failed to fetch incomes");
            }
            const incomes = await response.json();
            setIncomes(incomes)
        } catch (err) {
            setError("Failed to fetch incomes");
        } finally {
            setLoading(false);
        }
    };

    const handleAddIncome = async () => {
        
        // Frontend basic validation
        if (!incomeDescription.trim()) {
            setError("Income description cannot be empty");
            return;
        }
        if (!incomeAmount.trim() || isNaN(Number(incomeAmount))) {
            setError("Income amount must be a valid number");
            return;
        }
        if (Number(incomeAmount) <= 0) {
            setError("Income amount must be greater than zero");
            return;
        }

        setAdding(true);
        setError(null);
        try {
            const response = await fetch("/api/accounts/" + accountId + "/incomes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    description: incomeDescription,
                    amount: parseFloat(incomeAmount),
                }),
            });
            if (!response.ok) {
                throw new Error("Failed to add income");
            }
            setIncomeDescription("");
            setIncomeAmount("");
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
            ) : incomes && incomes.length > 0 ? (
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
                        {incomes.map((income) => (
                            <tr key={income.id} style={{ borderBottom: "1px solid #ccc" }}>
                                <td>
                                    <Link 
                                        href={`/incomes/${income.id}`} 
                                        style={
                                            { color: "blue", textDecoration: "underline"}
                                        }>
                                        {income.id}
                                    </Link>
                                </td>
                                <td>{income.amount}</td>
                                <td>{income.description}</td>
                                <td>{new Date(income.created_at).toLocaleString()}</td>
                                <td>{new Date(income.effective_date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No incomes available for this account.</p>
            )}
            <br />

            <input
                type="text"
                style={{ width: "30em" }}
                value={incomeDescription}
                onChange={(e) => setIncomeDescription(e.target.value)}
                placeholder="Enter Income description"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            <input
                type="number"
                style={{ width: "15em" }}
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                placeholder="Amount"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            
            <button onClick={handleAddIncome} disabled={adding}>
                {adding ? "Adding..." : "Add Income"}
            </button> &nbsp;
            
            <button onClick={() => setRefreshKey(oldKey => oldKey + 1)} disabled={adding || loading || refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
            </button>
        </>
    );
}
