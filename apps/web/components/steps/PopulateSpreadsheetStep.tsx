import Step from "./stepWrapper";
import { useState } from "react";
import ErrorMessage from "../ErrorMessage";
import SheetsApi from "../../utils/apiClient/client/sheetsApi";

export function PopulateSpreadsheetStep({ sheetId }) {

    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);

    const [successful, setSuccessful] = useState<boolean | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const startLoading = () => setLoading(true);
    const stopLoading = () => setLoading(false);
    const [clearing, setClearing] = useState<boolean>(false);
    const startClearing= () => setClearing(true);
    const stopClearing = () => setClearing(false);

    const handlePopulate = async () => {
        startLoading();

        const sheetsApi = new SheetsApi(sheetId);

        let populated: boolean = false;
        try {
            populated = await sheetsApi.buildSchema();

            setSuccessful(populated);
            clearError();
        } catch (err) {
            setSuccessful(populated);
            setError("Failed to populate spreadsheet");
            console.error("Failed to populate spreadsheet:", err);
        }
        
        stopLoading();
    };

    const handleClearData = async () => {
        startClearing();

        const confirmation = confirm("Are you sure you want to clear all the data?");
        if(!confirmation) {
            stopClearing();
            return null;
        }

        const sheetsApi = new SheetsApi(sheetId);

        let cleared: boolean = false;
        try {
            cleared = await sheetsApi.clearData();

            setSuccessful(cleared);
            clearError();
        } catch (err) {
            setSuccessful(cleared);
            setError("Failed to populate spreadsheet");
            console.error("Failed to populate spreadsheet:", err);
        }
        
        stopClearing();
    };

    return (
        <Step title="Populate Spreadsheet for the first time">
            <button onClick={handlePopulate} disabled={loading || clearing}>
                {loading ? "Populating..." : "Populate"}
            </button>
            <button onClick={handleClearData} disabled={loading || clearing}>
                {clearing ? "Clearing..." : "Clear Data"}
            </button>
            {successful === true && <p style={{ color: "green" }}>Successful ✅</p>}
            
            
            <ErrorMessage message={error}/>
        </Step>
    );
}