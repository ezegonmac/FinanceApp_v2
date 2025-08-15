import Step from "./stepWrapper";
import { populateSpreadsheet } from "../../utils/sheetApi";
import { useState } from "react";
import ErrorMessage from "../ErrorMessage";

export function PopulateSpreadsheetStep({ sheetId }) {

    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);

    const [loading, setLoading] = useState<boolean>(false);
    const startLoading = () => setLoading(true);
    const stopLoading = () => setLoading(false);

    const handlePopulate = async () => {
        startLoading();
        
        const { success, error } = await populateSpreadsheet(sheetId);
        if (!success && error) {
            setError(error);
        } else {
            clearError();
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