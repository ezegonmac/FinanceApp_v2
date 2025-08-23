import Step from "./stepWrapper";
import { useState } from "react";
import SheetsApi from "../../utils/apiClient/sheets";
import ErrorMessage from "../ErrorMessage";

export function LoadDataStep({ sheetId, setData }) {

    const [error, setError] = useState<any>(null);
    const clearError = () => setError(null);
    
    const [loading, setLoading] = useState<boolean>(false);
    const startLoading = () => setLoading(true);
    const stopLoading = () => setLoading(false);

    const handleLoadData = async () => {
        startLoading();

        const sheetsApi = new SheetsApi(sheetId);

        try {
            const spreadsheet = await sheetsApi.getSpreadsheet();
            const data = await sheetsApi.getAllData();
            const configuration = await sheetsApi.getAllConfigurations();

            const alldata = {'spreadsheet': spreadsheet,'data': data,'config': configuration};

            setData(JSON.stringify(alldata, null, 2));
            clearError();
        } catch (err) {
            setError("Failed to load sheet data");
            console.error("Failed to load sheet data:", err);
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