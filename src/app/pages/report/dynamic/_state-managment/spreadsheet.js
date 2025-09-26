import mongoose from "mongoose"
import newSheetPrompt from "../_sheet-management/new"

export const insertNewSheet = async ({
    spreadsheetsData,
    setSpreadsheetsData,
}) => {
    const newSheet = await newSheetPrompt({spreadsheetsData})
    if (newSheet) {
        const { rows, cols, sheet_name } = newSheet
        const cells = Array.from({
            length: rows
        }, (
            _,
            rowIndex,
        ) => Array.from({
            length: cols
        }, (
            _,
            colIndex,
        ) => ({
            value: ""
        })))
        const rowsHeight = Array.from({ length: rows }, _ => (50))
        const columnsWidth = Array.from({ length: cols }, _ => (100))
        setSpreadsheetsData((s) => [
            ...s, {
                id: new mongoose.Types.ObjectId().toString(),
                cells,
                cols_width: columnsWidth,
                rows_height: rowsHeight,
                name: sheet_name,
                is_fetched: true,
                fetching: false,
            },
        ])
    }
}

export const fetchingSpreadsheetData = ({
    setSpreadsheetsData,
    id,
}) => {
    setSpreadsheetsData((ss) => ss.map(s => (
        s.id === id ? {
            ...s,
            fetching: true,
        } : s
    )))
}

export const appendSpreadSheetData = ({
    setSpreadsheetsData,
    id,
    spreadsheet_data,
}) => {
    setSpreadsheetsData((ss) => ss.map(s => (
        s.id === id ? {
            ...s,
            ...spreadsheet_data,
            is_fetched: true,
            fetching: false,
        } : s
    )))
}

export const fetchingSpreadsheetDataFailed = ({
    setSpreadsheetsData,
    id,
}) => {
    const reactSwal = withReactContent(Swal)
    setSpreadsheetsData((ss) => ss.map(s => (
        s.id === id ? {
            ...s,
            fetching: false,
        } : s
    )))
    reactSwal.fire({
        icon: "error",
        title: "Error",
        html: <><b>Failed to pull data</b><br/><small>error: {err_message}</small></>
    })
}

export const editSheetName = ({
    setSpreadsheetsData,
    id,
    name
}) => {
    setSpreadsheetsData((ss) => ss.map(s => (
        s.id === id ? {
            ...s,
            name,
        } : s
    )))
}

export const deleteSheet = ({
    setSpreadsheetsData,
    id
}) => {
    setSpreadsheetsData((ss) => ss.filter(s => s.id !== id))
}

export const applyWorkSheet = ({
    setSpreadsheetsData,
    currentSpreadsheetId,
    worksheet
}) => {
    setSpreadsheetsData((ss) => ss.map(s => (
        s.id === currentSpreadsheetId ? {
            ...s,
            ...worksheet,
        } : s
    )))
}