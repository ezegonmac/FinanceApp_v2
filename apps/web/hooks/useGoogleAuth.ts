import { useState, useEffect } from "react";

export function useGoogleAuth(clientId: string, scopes: string) {
  const [isReady, setIsReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenClient, setTokenClient] = useState<any>(null);

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
        client_id: clientId,
        scope: scopes,
        callback: (tokenResponse: any) => {
          if (tokenResponse?.access_token) {
            setToken(tokenResponse.access_token);
          }
        },
      });
      setTokenClient(client);
      setIsReady(true);
    };

    (window as any).gapiLoaded = gapiLoaded;
    (window as any).gisLoaded = gisLoaded;
  }, [clientId, scopes]);

  async function login(): Promise<string> {
    if (!tokenClient) throw new Error("Token client not ready");

    return new Promise((resolve, reject) => {
      tokenClient.callback = (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(tokenResponse);
          return;
        }
        setToken(tokenResponse.access_token);
        resolve(tokenResponse.access_token);
      };
      tokenClient.requestAccessToken({ prompt: "" });
    });
  }

  function logout() {
    if (token) {
      window.google.accounts.oauth2.revoke(token);
      setToken(null);
    }
  }

  return { login, logout, token, isReady };
}
