import Step from "./stepWrapper";
import { useState } from "react";
import { loadSheetData } from "../../utils/sheetApi";
import ErrorMessage from "../ErrorMessage";

export function LoadDataStep({ sheetId, setData }) {

    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);
    
    const [loading, setLoading] = useState<boolean>(false);
    const startLoading = () => setLoading(true);
    const stopLoading = () => setLoading(false);

    const handleLoadData = async () => {
        startLoading();

        const { data, error } = await loadSheetData(sheetId);
        if (error) {
            setError(error);
        } else {
            setData(JSON.stringify(data, null, 2));
            clearError();
        }
        
        stopLoading();
    };

    return (
        <Step title="Load the data">
            <>
            <p>Load the data into the App</p> &nbsp;
            <button onClick={handleLoadData}>Load Data</button>
            
            {loading && <p>loading ...</p>}

            <ErrorMessage message={error}/>
            </>
        </Step>
    );
}