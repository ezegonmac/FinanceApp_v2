import { useState, useEffect, useMemo } from "react";
import MonthlyIncomeSplitApi from "../utils/apiClient/client/monthlyIncomeSplitApi";
import AccountsApi from "../utils/apiClient/client/accountsApi";
import ErrorMessage from "./ErrorMessage";
import { joinObjects } from "../utils/entityUtils";

export default function MonthlySplitCard({ sheetId }) {
    const [headers, setHeaders] = useState<string[]>([]);
    const [tableData, setTableData] = useState<Object[]>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(true);
    
    const [refreshKey, setRefreshKey] = useState(0);

    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);
    
    const splitsApi = useMemo(() => new MonthlyIncomeSplitApi(sheetId), [sheetId]);
    
    const accountsApi = useMemo(() => new AccountsApi(sheetId), [sheetId]);
    let accounts = [] as string[][];

    useEffect(() => {
        const fetchSplits = async () => {
            setRefreshing(true);
            if (refreshKey === 0) setLoading(true);

            try {
                const splits = await splitsApi.getAllObjects();
                if (splits.length === 0) {
                    setTableData([]);
                    setHeaders([]);
                    return;
                }

                const initialHeaders = Object.keys(splits[0]);

                // fetch accounts if it is not present
                const accountsExist = accounts?.length > 0;
                if (accountsExist) return;

                accounts = await accountsApi.getAllObjects();

                const relations = {
                    'toAccountId': accounts,
                    'fromAccountId': accounts
                }

                const [joinedSplits, newHeaders] = joinObjects(splits, relations, initialHeaders);
                
                setTableData(joinedSplits);
                setHeaders(newHeaders);
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
    }, [splitsApi, accountsApi, refreshKey, sheetId]);

    return (
        <>
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <ErrorMessage message={error} />
            ) : tableData && tableData.length > 0 && headers && headers.length > 0 ? (
                <table>
                    <thead>
                        <tr>
                            {headers.map(header => <th key={header}>{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, i) => (
                            <tr key={i}>
                                {headers.map(header => {
                                    const value = row[header];
                                    if (typeof value === 'object' && value !== null) {
                                        return <td key={header}>{value.name || JSON.stringify(value)}</td>;
                                    }
                                    return <td key={header}>{value}</td>;
                                })}
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
