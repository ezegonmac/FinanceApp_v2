// apps/web/pages/index.tsx
    import { useEffect, useState } from "react";
    import Script from "next/script";

    export default function HomePage() {
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [data, setData] = useState<any>(null);

    const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID!;
    const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

    useEffect(() => {
    if (typeof window === "undefined") return;

    const gapiLoaded = () => {
        window.gapi.load("client", async () => {
        await window.gapi.client.init({
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        });
    };

    const gisLoaded = () => {
        const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
            console.error(tokenResponse);
            return;
            }
            const res = await fetch("/api/sheet", {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const json = await res.json();
            setData(json);
        },
        });
        setTokenClient(client);
    };

    // Attach these functions to window so <Script> can call them
    (window as any).gapiLoaded = gapiLoaded;
    (window as any).gisLoaded = gisLoaded;
    }, []);

    return (
    <div>
        <h1>Google Sheets Demo</h1>
        <button
        onClick={() => {
            if (!tokenClient) return;
            tokenClient.requestAccessToken({ prompt: "" });
        }}
        >
        Authorize & Load Data
        </button>

        {tokenClient!=null &&
        <button
            onClick={() => {
                console.log("To Do");
            }}
        >
        Reload Data
        </button>}

        <pre>{JSON.stringify(data, null, 2)}</pre>

        {/* Load Google APIs */}
        <Script
            src="https://apis.google.com/js/api.js"
            strategy="afterInteractive"
            onLoad={() => window.gapiLoaded()}
        />
        <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onLoad={() => window.gisLoaded()}
        />
    </div>
    );
}