import { useState, useEffect, use } from "react";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useSheetId } from "../hooks/useSheetId";
import GoogleScripts from "../components/GoogleScripts";
import SheetSelector from "../components/sheetSelector";

export default function HomePage() {
    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);

    const [sheetId, setSheetId, clearSheetId] = useSheetId();

    const [data, setData] = useState<any>(null);
    const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
    const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

    const [loading, setLoading] = useState<boolean>(false);
    const startLoading = () => setLoading(true);
    const stopLoading = () => setLoading(false);

    const { login, logout, token, isReady } = useGoogleAuth(CLIENT_ID, SCOPES);

    const handleLoginAndLoad = async () => {
        try {
            startLoading();
            const accessToken = await login();
            await loadData(accessToken);
        } catch (err) {
            stopLoading();
            setError(`Login failed ${err}`);
        }
    };

    const loadData = async (accessToken?: string) => {
        startLoading();

        const tokenToUse = accessToken || token;

        if (!tokenToUse) {
            stopLoading();
            setError("No access token");
            return;
        }
        if (!sheetId) {
            stopLoading();
            setError("No sheet ID");
            return;
        }
        const sheetData = await fetch(`/api/sheet?id=${encodeURIComponent(sheetId)}`, {
            headers: { Authorization: `Bearer ${tokenToUse}` },
        });
        
        if(sheetData.status == 200) {
            const json = await sheetData.json();
            setData(JSON.stringify(json.data, null, 2));
            clearError();
        } else {
            setError(sheetData.statusText);
        }
        stopLoading();
    };

    return (
        <div>
            <h1>Google Sheets Demo</h1>
            {error && <p style={{backgroundColor: 'lightcoral', padding: '0.5em'}}>{error}</p>}
            <ol>
                <li>
                    Create an empty sheet with your account
                </li>
                <li>
                    Add the sheet ID &nbsp;
                    <SheetSelector sheetId={sheetId} setSheetId={setSheetId} clearSheetId={clearSheetId}/>
                </li>
                <li>
                    Authorize the app to access your sheets and load the data &nbsp;
                    <button onClick={handleLoginAndLoad}>Authorize & Load Data</button>
                </li>
            </ol>
            {token && <button onClick={logout}>Logout</button>}
            {token && data && !loading && <button onClick={() => loadData()}>Reload Data</button>}
            {loading && <p>loading ...</p>}
            {data && <pre>{data}</pre>}

            <GoogleScripts />
        </div>
    );
}
