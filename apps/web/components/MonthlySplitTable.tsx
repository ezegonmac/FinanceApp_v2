import { useState, useEffect, useMemo } from "react";
import ErrorMessage from "./ErrorMessage";
import MonthlyIncomeSplitApi from "../utils/apiClient/client/monthlyIncomeSplitApi";

export default function MonthlySplitTable({ sheetId }) {
    const [headers, setHeaders] = useState<string[]>([]);
    const [tableData, setTableData] = useState<Object[]>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(true);
    
    const [refreshKey, setRefreshKey] = useState(0);

    const splitApi = useMemo(() => new MonthlyIncomeSplitApi(sheetId), [sheetId]);

    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);

    useEffect(() => {
        const fetchData = async () => {
            setRefreshing(true);
            if (refreshKey === 0) setLoading(true);

            try {
                const result = await splitApi.getAllDetailed();
                const { data, headers } = result;
                const formattedData = formatTableData(data, headers);
                setTableData(formattedData);
                setHeaders(headers);
                clearError();
            } catch (err) {
                console.log(`Failed to get detailed splits: ${err}`);
                setError("Failed to get detailed splits");
            } finally {
                if (refreshKey === 0) setLoading(false);
                setRefreshing(false);
            }
        };

        if (sheetId) {
            fetchData();
        }
    }, [sheetId, refreshKey]);

    const formatTableData = (tableData, headers) => {

        let formattedData = [] as Object[];
        tableData.forEach((row) => {
            let formattedRow = {};
            headers.forEach((header) => {
                const value = row[header];
                
                // Check if its object
                if (typeof value === 'object' && value !== null) {
                    // Parse the different objects
                    if (['fromAccount', 'toAccount'].includes(header)) {
                        formattedRow[header] = value['name'];
                        return;
                    }
                    if (['month'].includes(header)) {
                        formattedRow[header] = `${value['month']}, ${['year']}`;
                        return;
                    }
                }
                
                formattedRow[header] = value || JSON.stringify(value);
            })
            formattedData.push(formattedRow);
            
        })
        return formattedData;
    }

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