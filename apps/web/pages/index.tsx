import { useState } from "react";
import { useSheetId } from "../hooks/useSheetId";
import { CreateSheetStep } from "../components/steps/createSheetStep";
import { SelectSheetStep } from "../components/steps/SelectSheetStep";
import { AllowServiceAccountStep } from "../components/steps/AllowServiceAccountStep";
import { LoadDataStep } from "../components/steps/LoadDataStep";
import { AddAccountsStep } from "../components/steps/AddAccountsStep";
import { PopulateSpreadsheetStep } from "../components/steps/PopulateSpreadsheetStep";

export default function HomePage() {

    const [sheetId, setSheetId, clearSheetId] = useSheetId();

    const [data, setData] = useState<any>(null);

    return (
        <div style={{fontFamily: 'sans-serif'}}>
            <h1>Finance App</h1>
            
            {/* Instructions Steps */}
            <ol>
                <CreateSheetStep />
                <SelectSheetStep 
                    sheetId={sheetId} 
                    setSheetId={setSheetId} 
                    clearSheetId={clearSheetId} 
                />
                <AllowServiceAccountStep 
                    sheetId={sheetId}
                />
                <LoadDataStep 
                    sheetId={sheetId} 
                    setData={setData} 
                />
                <PopulateSpreadsheetStep
                    sheetId={sheetId}
                />
                <AddAccountsStep
                    sheetId={sheetId}
                    setData={setData} 
                />
            </ol>

            {data && <pre>{data}</pre>}
        </div>
    );
}
