import { useState, useEffect, useMemo } from "react";
import AccountsApi from "../utils/apiClient/client/accountsApi";
import ErrorMessage from "./ErrorMessage";

export default function AccountsTable({ sheetId }) {
    const [inputValue, setInputValue] = useState<string>("");
    const [headers, setHeaders] = useState<string[]>([]);
    const [accounts, setAccounts] = useState<String[][]>();
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    const [refreshKey, setRefreshKey] = useState(0);
    
    const accountsApi = useMemo(() => new AccountsApi(sheetId), [sheetId]);
    
    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);

    useEffect(() => {
        const fetchHeaders = async () => {
            try {
                const res = await accountsApi.getHeaders();
                setHeaders(res);
            } catch (err) {
                console.log(`Failed to get headers: ${err}`);
                setError("Failed to get headers");
            }
        };

        if (sheetId) {
            fetchHeaders();
        }
    }, [accountsApi]);

    useEffect(() => {
        const fetchAccounts = async () => {
            // Only show the main loading indicator on the initial load
            if (refreshKey === 0) setLoading(true);

            try {
                const res = await accountsApi.getAll();
                setAccounts(res);
                clearError();
            } catch (err) {
                console.log(`Failed to get accounts: ${err}`);
                setError("Failed to get accounts");
            } finally {
                if (refreshKey === 0) setLoading(false);
            }
        };

        if (sheetId) {
            fetchAccounts();
        }
    }, [accountsApi, refreshKey]);

    const handleAddAccount = async () => {
        setIsAdding(true);
        if(!inputValue) {
            alert("An account name is required");
            setIsAdding(false);
            return;
        }
        try {
            await accountsApi.create(inputValue);
            setRefreshKey(oldKey => oldKey + 1);
            setInputValue("");
        } catch (err) {
            console.log(`Failed to add account: ${err}`);
            setError("Failed to add account");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <ErrorMessage message={error} />
            ) : accounts && accounts.length > 0 && headers && headers.length ? (
                <table>
                    <thead>
                        <tr>
                            {headers.map(header => <th key={header}>{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.map((acc, i) => (
                            <tr key={i}>
                                {acc.map((cell, j) => <td key={j}>{cell}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No accounts available</p>
            )}

            <input
                type="text"
                style={{ width: "30em" }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter Account name"
                disabled={isAdding} // Disable input while adding
            /> &nbsp;
            <button onClick={handleAddAccount} disabled={isAdding}>
                {isAdding ? "Adding..." : "Add Account"}
            </button> &nbsp;
            <button onClick={() => setRefreshKey(oldKey => oldKey + 1)} disabled={isAdding || loading}>Refresh</button>
        </>
    );
}
