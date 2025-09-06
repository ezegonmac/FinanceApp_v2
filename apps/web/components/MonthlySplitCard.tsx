import { useState, useEffect, useMemo } from "react";
import MonthlyIncomeSplitApi from "../utils/apiClient/client/monthlyIncomeSplitApi";
import AccountsApi from "../utils/apiClient/client/accountsApi";
import ErrorMessage from "./ErrorMessage";

export default function MonthlySplitCard({ sheetId }) {
    const [headers, setHeaders] = useState<string[]>([]);
    const [splits, setSplits] = useState<Object[]>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(true);
    
    const [refreshKey, setRefreshKey] = useState(0);

    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);
    
    const splitsApi = useMemo(() => new MonthlyIncomeSplitApi(sheetId), [sheetId]);
    
    const accountsApi = useMemo(() => new AccountsApi(sheetId), [sheetId]);
    let accounts = [] as string[][];

    // Fetch accounts
    useEffect(() => {
        console.log("trying to fetch accounts")
        const splitsExist = splits !== undefined && splits?.length > 0;
        if (!splitsExist) return;

        const accountsExist = accounts?.length > 0;
        if (accountsExist) {
            console.log(accounts);
            return;
        }

        const fetchAccounts = async () => {
            try {
                const res = await accountsApi.getAllObjects();
                console.log(res);
                // setHeaders(res);
            } catch (err) {
                console.log(`Failed to get accounts: ${err}`);
                setError("Failed to get accounts");
            }
        };

        if (sheetId) {
            fetchAccounts();
        }
    }, [splitsApi]);

    // Fetch headers
    useEffect(() => {
        const fetchHeaders = async () => {
            try {
                const res = await splitsApi.getHeaders();
                setHeaders(res);
            } catch (err) {
                console.log(`Failed to get headers: ${err}`);
                setError("Failed to get headers");
            }
        };

        if (sheetId) {
            fetchHeaders();
        }
    }, [splitsApi]);

    useEffect(() => {
        const fetchSplits = async () => {
            // Only show the main loading indicator on the initial load
            setRefreshing(true);
            if (refreshKey === 0) setLoading(true);

            try {
                const res = await splitsApi.getAllObjects();
                setSplits(res);
                clearError();
            } catch (err) {
                console.log(`Failed to get splits: ${err}`);
                setError("Failed to get splits");
            } finally {
                if (refreshKey === 0) setLoading(false);
                setRefreshing(false);
            }
        };

        if (sheetId) {
            fetchSplits();
        }
    }, [splitsApi, refreshKey]);

    return (
        <>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <ErrorMessage message={error} />
            ) : splits && splits.length > 0 && headers && headers.length ? (
                <table>
                    <thead>
                        <tr>
                            {headers.map(header => <th key={header}>{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {splits.map((split, i) => (
                            <tr key={i}>
                                {Object.entries(split).map((val, key) => 
                                    <td key={key}>
                                        {val[1]}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No splits available</p>
            )}

            <button onClick={() => setRefreshKey(oldKey => oldKey + 1)} disabled={loading || refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
            </button>
        </>
    );
}
