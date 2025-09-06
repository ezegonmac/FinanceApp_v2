import { useState, useEffect, useMemo } from "react";
import MonthlyIncomeSplitApi from "../utils/apiClient/client/monthlyIncomeSplitApi";
import ErrorMessage from "./ErrorMessage";

export default function MonthlySplitCard({ sheetId }) {
    const [inputValue, setInputValue] = useState<string>("");
    const [headers, setHeaders] = useState<string[]>([]);
    const [splits, setSplits] = useState<String[][]>();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(true);
    const [adding, setAdding] = useState(false);
    
    const [refreshKey, setRefreshKey] = useState(0);
    
    const splitsApi = useMemo(() => new MonthlyIncomeSplitApi(sheetId), [sheetId]);
    
    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);

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
                const res = await splitsApi.getAll();
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

    // const handleAddSplit = async () => {
    //     setAdding(true);
    //     if(!inputValue) {
    //         alert("An split name is required");
    //         setAdding(false);
    //         return;
    //     }
    //     try {
    //         await splitsApi.create(inputValue);
    //         setRefreshKey(oldKey => oldKey + 1);
    //         setInputValue("");
    //     } catch (err) {
    //         console.log(`Failed to add split: ${err}`);
    //         setError("Failed to add split");
    //     } finally {
    //         setAdding(false);
    //     }
    // };

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
                                {split.map((cell, j) => <td key={j}>{cell}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No splits available</p>
            )}

            {/* <input
                type="text"
                style={{ width: "30em" }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter Split name"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            <button onClick={handleAddSplit} disabled={adding}>
                {adding ? "Adding..." : "Add Split"}
            </button> &nbsp; */}
            <button onClick={() => setRefreshKey(oldKey => oldKey + 1)} disabled={adding || loading || refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
            </button>
        </>
    );
}
