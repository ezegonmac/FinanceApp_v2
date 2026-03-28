'use client';

import Link from "next/link";
import { useState, useEffect } from "react";

export default function MonthsPage() {
  
    const [months, setMonths] = useState<any[] | null>(null);

    useEffect(() => {
        async function loadMonths() {
            try {
                const res = await fetch("/api/months");
                const data = await res.json();
                setMonths(data);
            } catch (err) {
                console.error("Failed to fetch months:", err);
                setMonths([]);
            }
        }

        loadMonths();
    }, []);

    return (
        <div>
        <h1>Months</h1>

            {months === null ? (
                <p>Loading...</p>
            ) : months.length === 0 ? (
                <p>No months found. Please add some months to get started.</p>
            ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", borderBottom: "2px solid #000" }}>Id</th>
                                <th style={{ textAlign: "left", borderBottom: "2px solid #000" }}>Year</th>
                                <th style={{ textAlign: "left", borderBottom: "2px solid #000" }}>Month</th>
                                <th style={{ textAlign: "left", borderBottom: "2px solid #000" }}>Created At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {months?.map((month) => (
                                <tr key={month.id} style={{ borderBottom: "1px solid #ccc" }}>
                                    <td>
                                        <Link 
                                            href={`/months/${month.year}/${month.month}`}
                                            style={
                                                { color: "blue", textDecoration: "underline"}
                                            }>
                                            {month.id}
                                        </Link>
                                    </td>
                                    <td>{month.year}</td>
                                    <td>{month.month}</td>
                                    <td>{new Date(month.created_at).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
            )}


        </div>
    );
}