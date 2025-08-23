import Step from "./stepWrapper";
import { useState } from "react";
import ErrorMessage from "../ErrorMessage";
import SheetsApi from "../../utils/apiClient/sheets";

export function PopulateSpreadsheetStep({ sheetId }) {

    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);

    const [successful, setSuccessful] = useState<boolean | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const startLoading = () => setLoading(true);
    const stopLoading = () => setLoading(false);

    const handlePopulate = async () => {
        startLoading();

        const sheetsApi = new SheetsApi(sheetId);

        let populated: boolean = false;
        try {
            populated = await sheetsApi.populate();

            setSuccessful(populated);
            clearError();
        } catch (err) {
            setSuccessful(populated);
            setError("Failed to populate spreadsheet");
            console.error("Failed to populate spreadsheet:", err);
        }
        
        stopLoading();
    };

    return (
        <Step title="Populate Spreadsheet for the first time">
            <button onClick={handlePopulate} disabled={loading}>
                {loading ? "Populating..." : "Populate"}
            </button>
            
            <ErrorMessage message={error}/>
        </Step>
    );
}