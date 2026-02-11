import ErrorMessage from "./ErrorMessage";

export default function AccountsTable() {

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
                        {accounts.map((split, i) => (
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
                <p>No accounts available</p>
            )}

            <input
                type="text"
                style={{ width: "30em" }}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter Account name"
                disabled={adding} // Disable input while adding
            /> &nbsp;
            <button onClick={handleAddAccount} disabled={adding}>
                {adding ? "Adding..." : "Add Account"}
            </button> &nbsp;
            <button onClick={() => setRefreshKey(oldKey => oldKey + 1)} disabled={adding || loading || refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
            </button>
        </>
    );
}
