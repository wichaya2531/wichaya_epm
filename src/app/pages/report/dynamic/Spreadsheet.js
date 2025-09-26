import LoadingComponent from "@/components/LoadingComponent"
import { useMemo } from "react"
import Spreadsheet from "spreadsheetjs-react"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"

const DynamicTemplate = ({
    spreadsheetsData,
    setSpreadsheetsData,
    currentSpreadsheetId,
}) => {

    const currentSpreadsheetData = useMemo(() => spreadsheetsData.find(({id}) => id === currentSpreadsheetId), [
        spreadsheetsData,
        currentSpreadsheetId,
    ])

    const reactSwal = withReactContent(Swal)
    const Wrapper = ({children}) => (
        <div className="flex justify-center items-center w-full h-80">
            {children}
        </div>
    )

    const overrideResizePrompt = async ({
        type,
    }) => {
        const {isConfirmed, value} = await reactSwal.fire({
            icon: "info",
            title: type === "width" ? "Column Width" : "Row Height",
            input: "text",
            inputLabel: `Enter ${type === "width" ? "column width" : "row height"} in pixels`,
            inputValue: type=== "width" ? "" : "",
            showCancelButton: true,
        })
        if(isConfirmed) {
            const v = parseInt(value)
            if(v) {
                return v
            }
            else {
                await reactSwal.fire({
                    icon: "error",
                    title: "Error",
                    text: `Invalid ${label}`,
                })
                return null
            }
        }
        else {
            return null
        }
    }

    const overrideResizeColumnPrompt = () => {
        return overrideResizePrompt({
            type: "width",
        })
    }
    
    const overrideResizeRowPrompt = () => {
        return overrideResizePrompt({
            type: "height",
        })
    }

    if(currentSpreadsheetData) {
        if(currentSpreadsheetData.is_fetched) {
            return (
                <Spreadsheet
                cells={currentSpreadsheetData.cells}
                rows_height={currentSpreadsheetData.rows_height}
                cols_width={currentSpreadsheetData.cols_width}
                onChange={({cells, rows_height, cols_width})=>{
                    setSpreadsheetsData(prev => prev.map(s=>s.id===currentSpreadsheetData.id ? {
                        ...s,
                        cells,
                        rows_height,
                        cols_width,
                    } : s))
                }}
                overrideResizeColumnPrompt={overrideResizeColumnPrompt}
                overrideResizeRowPrompt={overrideResizeRowPrompt}
                />
            )
        }
        else {
            if(currentSpreadsheetData.fetching) {
                return (
                    <Wrapper>
                        <LoadingComponent/>
                    </Wrapper>
                )
            }
            else {
                return (
                    <Wrapper>Please pull data for the selected sheet</Wrapper>
                )
            }
        }
    }
    else {
        return (
            <Wrapper>Please select a sheet</Wrapper>
        )
    }
}

export default DynamicTemplate