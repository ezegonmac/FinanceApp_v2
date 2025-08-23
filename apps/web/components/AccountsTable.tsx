import { useState, useEffect, useMemo } from "react";
import AccountsApi from "../utils/apiClient/client/accountsApi";
import ErrorMessage from "./ErrorMessage";

export default function AccountsTable({ sheetId }) {
    const [inputValue, setInputValue] = useState<string>("");
    const [accounts, setAccounts] = useState<String[][]>();
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    const [refreshKey, setRefreshKey] = useState(0);
    
    const accountsApi = useMemo(() => new AccountsApi(sheetId), [sheetId]);
    
    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);

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
            setInputValue(""); // Clear the input field
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
            ) : accounts && accounts.length > 0 ? (
                <ul>
                    {accounts.map((acc, i) => (
                        <TableItem key={i} account={acc} />
                    ))}
                </ul>
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

function TableItem({ account }) {
    return (
        <li>
            {account.map((attr, i) => (
                <span key={i} style={{ marginRight: '10px' }}>{attr}</span>
            ))}
        </li>
    );
}