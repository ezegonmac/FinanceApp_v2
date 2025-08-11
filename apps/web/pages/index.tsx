import { useState } from "react";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { fetchSheetData } from "../lib/fetchSheetData";
import GoogleScripts from "../components/GoogleScripts";

export default function HomePage() {
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
            console.error("Login failed", err);
        }
    };

    const loadData = async (accessToken?: string) => {
        startLoading();
        const tokenToUse = accessToken || token;
        if (!tokenToUse) {
            stopLoading();
            return console.warn("No access token");
        }
        const sheetData = await fetchSheetData(tokenToUse);
        stopLoading();
        setData(sheetData);
    };

    return (
        <div>
            <h1>Google Sheets Demo</h1>
            <ol>
                <li>
                    Create an empty sheet with your account
                </li>
                <li>
                    Authorize the app to access your sheets and load the data &nbsp;
                    <button onClick={handleLoginAndLoad}>Authorize & Load Data</button>
                </li>
                <li>
                    Create an empty sheet with your account
                </li>
            </ol>
            {token && <button onClick={() => logout()}>Logout</button>}
            {token && !loading && <button onClick={() => loadData()}>Reload Data</button>}
            {loading && <p>loading ...</p>}
            {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
            <GoogleScripts />
        </div>
    );
}
