import { useEffect, useMemo, useState } from "react"
import newSheetPrompt from "./NewSheet"
// import { emptyCell } from "./_state-managment/manage"
import Swal from "sweetalert2"
import withReactContent from "sweetalert2-react-content"
import { appendSpreadSheetData, fetchingSpreadsheetData, fetchingSpreadsheetDataFailed, insertNewSheet } from "./_state-managment/spreadsheet"
import { Autocomplete, TextField } from "@mui/material"
import DropDownSearch from "./_components/DropDownSearch"

const SheetSelection = ({
    user,
    spreadsheetsData,
    setSpreadsheetsData,
    currentSpreadsheetId,
    setCurrentSpreadsheetId,
}) => {

    const reactSwal = withReactContent(Swal)

    const sheetNameList = spreadsheetsData.map(spreadsheet=>({
        id: spreadsheet.id,
        label: spreadsheet.name,
    }))
    
    // useEffect(()=>{
    //     console.log(currentSpreadsheetId)
    // }, [currentSpreadsheetId])

    const pullData = async () => {
        if(currentSpreadsheetId) {
            const { is_fetched, fetching } = spreadsheetsData.find(s=>s.id===currentSpreadsheetId)
            console.log(is_fetched, fetching)
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
                console.log(res)
                if(res.ok) {
                    const { status, spreadsheet } = await res.json()
                    if(status===200) {
                        console.log(spreadsheet)
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
        // if (currentSpreadsheetId) {
        //     const { is_fetched, fetching } = spreadsheetsData.find(spreadsheet=>(spreadsheet.id===currentSpreadsheetId))
        //     if(!is_fetched && !fetching) {
        //         fetchingSpreadsheetData({
        //             setSpreadsheetsData,
        //             id: currentSpreadsheetId,
        //         })
        //         const res = await fetch("/api/job-dynamic-template/get-sheet-data", {
        //             method: "POST",
        //             body: JSON.stringify({
        //                 spreadsheet_id: currentSpreadsheetId
        //             })
        //         })
        //         if(res.ok) {
        //             const { status, spreadsheet } = await res.json()
        //             if(status===200) {
        //                 console.log(spreadsheet)
        //                 appendSpreadSheetData({
        //                     setSpreadsheetsData,
        //                     id: currentSpreadsheetId,
        //                     spreadsheet_data: spreadsheet,
        //                 })
        //             }
        //             else {
        //                 fetchingSpreadsheetDataFailed({
        //                     setSpreadsheetsData,
        //                     id: currentSpreadsheetId,
        //                 })
        //             }
        //         }
        //     }
        //     setCurrentSpreadsheetId(currentSpreadsheetId)
        // }
    }

    const updateSheetName = async (id) => {
        const { value } = await reactSwal.fire({
            title: `Edit ${spreadsheetsData.find(s=>s.id===id).name}`,
            html: (
                <div className="flex flex-col justify-center">
                    <div>
                        <input id="prompt-sheet-name" type="text" className="swal2-input" placeholder="Name"/>
                    </div>
                </div>
            ),
            focusConfirm: false,
            confirmButtonText: 'Confirm',
                preConfirm: () => {
                    const sheetName = document.getElementById('prompt-sheet-name').value
                    if (sheetName.length < 1) {
                        Swal.showValidationMessage('Fill the name')
                        return
                    }
                    if (spreadsheetsData.some(s=>s.name===sheetName)) {
                        Swal.showValidationMessage('Existed Name')
                        return
                        
                    }
                    return sheetName
            }
        })
        if(value) {
            updateSheetName({
                setSpreadsheetsData,
                id,
                newName: value
            })
        }
    }

    const deleteSheet = async (id) => {
        const { value } = await reactSwal.fire({
            title: <>Are you sure to delete <b>{spreadsheetsData.find(s=>s.id===id).name}</b></>,
            focusConfirm: true,
            focusCancel: false,
            showCancelButton: true,
            confirmButtonText: 'Confirm',
            cancelButtonText: "Cancel",
        })
        if (value) {
            deleteSheet({
                setSpreadsheetsData,
                id,
            })
        }
    }

    return (
        <div className="flex gap-4">
            <DropDownSearch
                arrayOfData={sheetNameList}
                id={currentSpreadsheetId}
                onSelected={(id)=>{
                    setCurrentSpreadsheetId(id)
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