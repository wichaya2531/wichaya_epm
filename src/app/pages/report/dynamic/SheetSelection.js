import { useEffect, useMemo, useState, useTransition } from "react"
import newSheetPrompt from "./_sheet-management/new"
// import { emptyCell } from "./_state-managment/manage"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { appendSpreadSheetData, editSheetName, fetchingSpreadsheetData, fetchingSpreadsheetDataFailed, insertNewSheet } from "./_state-managment/spreadsheet"
import { Autocomplete, TextField } from "@mui/material"
import DropDownSearch from "./_components/DropDownSearch"
import editSheetPrompt from "./_sheet-management/edit"
import deleteSheetPrompt from "./_sheet-management/delete"

const SheetSelection = ({
    user,
    spreadsheetsData,
    setSpreadsheetsData,
    currentSpreadsheetId,
    setCurrentSpreadsheetId,
}) => {

    const reactSwal = withReactContent(Swal)

    const sheetNameList = useMemo(() => spreadsheetsData.map(s => ({
        id: s.id,
        label: s.name,
    })), [spreadsheetsData])

    const pullData = async () => {
        if(currentSpreadsheetId) {
            const { is_fetched, fetching } = spreadsheetsData.find(s=>s.id===currentSpreadsheetId)
            if(!is_fetched && !fetching) {
                fetchingSpreadsheetData({
                    setSpreadsheetsData,
                    id: currentSpreadsheetId,
                })
                const res = await fetch("/api/job-dynamic-template/get-sheet-data", {
                    method: "POST",
                    body: JSON.stringify({
                        spreadsheet_id: currentSpreadsheetId
                    })
                })
                if(res.ok) {
                    const { status, spreadsheet } = await res.json()
                    if(status===200) {
                        appendSpreadSheetData({
                            setSpreadsheetsData,
                            id: currentSpreadsheetId,
                            spreadsheet_data: spreadsheet,
                        })
                    }
                    else {
                        fetchingSpreadsheetDataFailed({
                            setSpreadsheetsData,
                            id: currentSpreadsheetId,
                        })
                    }
                }
            }
        }
    }

    const [dropdownInputValue, setDropdownInputValue] = useState("")

    return (
        <div className="flex gap-4 items-center">
            <DropDownSearch
                arrayOfData={sheetNameList}
                inputValue={dropdownInputValue}
                setInputValue={setDropdownInputValue}
                id={currentSpreadsheetId}
                onSelected={(id)=>{
                    setCurrentSpreadsheetId(id)
                }}
                onEdit={async (id)=>{
                    const name = await editSheetPrompt({
                        existedNames: spreadsheetsData.map(s=>s.name),
                        sheetName: spreadsheetsData.find(s=>s.id===id).name
                    })
                    if(name) {
                        editSheetName({
                            setSpreadsheetsData,
                            id,
                            name,
                        })
                    }
                }}
                onDelete={async (id)=>{
                    const confirm = await deleteSheetPrompt({
                        sheetName: spreadsheetsData.find(s=>s.id===id).name
                    })
                    if(confirm) {
                        setSpreadsheetsData(prev => prev.filter(s=>s.id!==id))
                        if(id === currentSpreadsheetId) {
                            setCurrentSpreadsheetId(null)
                            setDropdownInputValue("")
                        }
                    }
                }}
            />
            <div>
                <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                onClick={pullData}
                >
                   Pull Sheet Data 
                </button>
            </div>
            <div className="">
                <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                onClick={()=>insertNewSheet({
                    spreadsheetsData,
                    setSpreadsheetsData,
                })}
                >
                    Create a Sheet
                </button>
            </div>
            <div className="">
                <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                onClick={async () => {
                    reactSwal.fire({
                        title: 'Saving all sheets...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            reactSwal.showLoading()
                        },
                    })
                    const res = await fetch("/api/job-dynamic-template/save-all-job-dynamic-template", {
                        method: "POST",
                        body: JSON.stringify({
                            user_id: user._id,
                            spreadsheets: spreadsheetsData.map(s => ({
                                id: s.id,
                                name: s.name,
                                cells: s.cells,
                                cols_width: s.cols_width,
                                rows_height: s.rows_height,
                                is_fetched: s.is_fetched,
                            }))
                        })
                    })
                    if(res.ok) {
                        const { added_spreadsheets } = await res.json()
                        setSpreadsheetsData(prev => prev.map(s => ({
                            ...s,
                            id: added_spreadsheets.find(a=>a.id===s.id)?.new_id || s.id,
                        })))
                        setCurrentSpreadsheetId(prev => added_spreadsheets.find(a=>a.id===prev)?.new_id || prev)
                        reactSwal.fire({
                            icon: 'success',
                            title: 'All sheets saved successfully',
                        })
                    }
                    
                }}
                >
                    Save all
                </button>
            </div>
        </div>
    )
}

export default SheetSelection