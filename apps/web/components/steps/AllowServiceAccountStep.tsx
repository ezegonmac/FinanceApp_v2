import Step from "./stepWrapper";
import { checkSheetAccess } from "../../utils/sheetApi";
import { useState } from "react";
import ErrorMessage from "../ErrorMessage";

export function AllowServiceAccountStep({ sheetId }) {
    
    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);
    
    const serviceAccount = process.env.NEXT_PUBLIC_SERVICE_ACCOUNT ?? "No service account";

    const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
    const [checking, setChecking] = useState<boolean>(false);
    const startChecking = () => setChecking(true);
    const stopChecking = () => setChecking(false);

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

    return (
        <Step title="Provide access to the new sheet">
            <>
            <p>To allow this app to access the new Google sheet, you need to share it with the service account email:</p>
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
            
            <ErrorMessage message={error}/>
            </>
        </Step>
    );
}