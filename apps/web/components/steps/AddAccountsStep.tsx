import Step from "./stepWrapper";
import { useState } from "react";
import ErrorMessage from "../ErrorMessage";
import AccountsApi from "../../utils/apiClient/client/accountsApi";
import { useRouter } from "next/navigation";

export function AddAccountsStep({ sheetId, setData }) {
    const router = useRouter();

    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);
    
    const [loading, setLoading] = useState<boolean>(false);
    const startLoading = () => setLoading(true);
    const stopLoading = () => setLoading(false);

    const handleLoadData = async () => {
        startLoading();

        const accountsApi = new AccountsApi(sheetId);

        try {
            const accounts = await accountsApi.getAll();

            setData(JSON.stringify(accounts, null, 2));
            clearError();
        } catch (err) {
            setError("Failed to load accounts data");
            console.error("Failed to load accounts data:", err);
        }
        
        stopLoading();
    };

    return (
        <Step title="Add your accounts">
            <>
            <p>Add your finance accounts you want to track</p>
            <button onClick={handleLoadData}>Load Accounts</button>
            <button onClick={() => router.push("/accounts")}>Accounts</button>
            {loading && <p>loading ...</p>}

            <ErrorMessage message={error}/>
            </>
        </Step>
    );
}
