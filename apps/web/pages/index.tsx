import { useState } from "react";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { useSheetId } from "../hooks/useSheetId";
import GoogleScripts from "../components/GoogleScripts";
import SheetSelector from "../components/sheetSelector";
import {checkSheetAccess, loadSheetData} from "../utils/sheetApi";

export default function HomePage() {
    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);

    const [sheetId, setSheetId, clearSheetId] = useSheetId();

    const [data, setData] = useState<any>(null);
    const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
    const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

    const [loading, setLoading] = useState<boolean>(false);
    const startLoading = () => setLoading(true);
    const stopLoading = () => setLoading(false);

    const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
    const [checking, setChecking] = useState<boolean>(false);
    const startChecking = () => setChecking(true);
    const stopChecking = () => setChecking(false);

    const serviceAccount = process.env.NEXT_PUBLIC_SERVICE_ACCOUNT ?? "No service account";

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

    const handleCheckAccess = async () => {
        startChecking();
        
        const { access, error } = await checkSheetAccess(sheetId);
        setAccessGranted(access);
        if (error) {
            setError(error);
        } else {
            clearError();
        }

        stopChecking();
    };

    const loadData = async (accessToken?: string) => {
        startLoading();

        const tokenToUse = accessToken || token;

        const { data, error } = await loadSheetData(sheetId, tokenToUse);
        if (error) {
            setError(error);
        } else {
            setData(JSON.stringify(data, null, 2));
            clearError();
        }
        
        stopLoading();
    };

    return (
        <div>
            <h1>Google Sheets Demo</h1>
            {error && <p style={{backgroundColor: 'lightcoral', padding: '0.5em'}}>{error}</p>}
            <ol>
                <li>
                    <p>Create an empty sheet with your account</p>
                </li>
                <li>
                    <p>Add the sheet ID</p>
                    <SheetSelector sheetId={sheetId} setSheetId={setSheetId} clearSheetId={clearSheetId}/>
                </li>
                <li>
                    <p>To allow this app to access your sheet, share it with the service account email:</p>
                    <p>
                        <span style={{color: 'orange', fontWeight: "bold"}}>{serviceAccount}</span> &nbsp;
                        <button onClick={() => navigator.clipboard.writeText(serviceAccount)}>
                            Copy Email
                        </button>
                    </p>
                    <p>After sharing, click the button below to verify access:</p>
                    <button onClick={handleCheckAccess} disabled={checking}>
                        {checking ? "Checking..." : "Check Access"}
                    </button>
                    {accessGranted === true && <p style={{ color: "green" }}>Access confirmed ✅</p>}
                    {accessGranted === false && <p style={{ color: "red" }}>Cannot access sheet ❌</p>}
                </li>
                <li>
                    <p>Authorize the app to access your sheets and load the data</p> &nbsp;
                    <button onClick={handleLoginAndLoad}>Authorize & Load Data</button>
                </li>
            </ol>
            {token && <button onClick={logout}>Logout</button>}
            {token && data && <button onClick={() => loadData()} disabled={loading}>Reload Data</button>}
            {loading && <p>loading ...</p>}
            {data && <pre>{data}</pre>}

            <GoogleScripts />
        </div>
    );
}
