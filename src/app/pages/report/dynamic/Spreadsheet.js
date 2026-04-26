import React, { useRef, useEffect, useState } from "react";
import { jspreadsheet, Spreadsheet, Worksheet } from "@jspreadsheet-ce/react";

import "jspreadsheet-ce/dist/jspreadsheet.css";
import "jsuites/dist/jsuites.css";
import 'material-icons/iconfont/material-icons.css';
import Swal from "sweetalert2";
import { BeatLoader } from "react-spinners";
import { applyWorkSheet } from "./_state-managment/spreadsheet";
const JSpreadsheet = ({
    spreadsheetsData,
    setSpreadsheetsData,
    currentSpreadsheetId,
    user,
}) => {

    const currentSpreadsheet = spreadsheetsData.find(s=>s.id===currentSpreadsheetId)

    const jRef = useRef(null);
    const updateSheet = (elem) => {
        const worksheet = elem.options
        applyWorkSheet({
            setSpreadsheetsData,
            currentSpreadsheetId,
            worksheet,
        })
    }

    const SaveAllButton = () => {
        const saveAll = async () => {
            Swal.fire({
                title: "Saving...",
                didOpen: () => {
                    Swal.showLoading()
                }
            })
            const res = await fetch("/api/job-dynamic-template/save-all-job-dynamic-template", {
                method: "POST",
                body: JSON.stringify({
                    user_id: user._id,
                    spreadsheets: spreadsheetsData
                })
            })
            if(res.ok){
                const { status, message } = await res.json()
                    Swal.close()
                if(status===200){
                    Swal.fire({
                        icon: "success",
                        title: "Success",
                        text: "Saved All Successfully!",
                    });
                }
                else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: message,
                    });
                }
            }
        }
        return (
            <div className="flex w-full justify-end mt-6 z-10000">
                <button
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                onMouseUp={saveAll}
                >
                    Save All
                </button>
            </div>
        )
    }

    useEffect(()=>{
        if (!jRef.current.jspreadsheet && currentSpreadsheet.is_fetched) {
            jspreadsheet(jRef.current, {
                worksheets: [{
                    data: currentSpreadsheet.data,
                    columns: currentSpreadsheet.columns,
                    rows: currentSpreadsheet.rows,
                    minDimensions: currentSpreadsheet.minDimensions,
                    style: currentSpreadsheet.style,
                    mergeCells: currentSpreadsheet.mergeCells,
                }],
                toolbar: true,
                // toolbar: [{
                //     type: 'i',
                //     content: 'undo',
                //     onclick: () => {
                //         table.undo();
                //     },
                // }, {
                //     type: 'i',
                //     content: 'redo',
                //     onclick: () => {
                //         table.redo();
                //     }
                // }, {
                //     type: 'select',
                //     k: 'font-family',
                //     v: ['Arial','Verdana']
                // }, {
                //     type: 'select',
                //     k: 'font-size',
                //     v: ['9px','10px','11px','12px','13px','14px','15px','16px','17px','18px','19px','20px']
                // }, {
                //     type: 'i',
                //     content: 'format_align_left',
                //     k: 'text-align',
                //     v: 'left'
                // }, {
                //     type:'i',
                //     content:'format_align_center',
                //     k:'text-align',
                //     v:'center'
                // }, {
                //     type: 'i',
                //     content: 'format_align_right', 
                //     k: 'text-align',
                //     v: 'right'
                // }, {
                //     type: 'color',
                //     content: 'format_color_text',
                //     k: 'color'
                // }, {
                //     type: 'color',
                //     content: 'format_color_fill',
                //     k: 'background-color'
                // }],
                onchange: updateSheet,
                onchangestyle: updateSheet,
                onresizecolumn: (elem) => {
                    const prevConfig = elem.getConfig()
                    elem.setConfig({
                        ...prevConfig,
                        columns: prevConfig.columns.map((column) => column.width>25 ? column : {
                            ...column,
                            width: 25
                        })
                    }, true)
                }
            });
        }
        
        return () => {
            if(jRef.current){
                jRef.current.replaceChildren()
            }
        }
    }, [currentSpreadsheetId, currentSpreadsheet.is_fetched])

    return (
        <>
            <div
            className="flex flex-col w-full"
            > {
                currentSpreadsheet.fetching ? (
                    <div className="flex w-full min-h-60 justify-center items-center">
                        <BeatLoader
                            color={"navy"}
                            loading={true}
                            size={15}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                        />
                    </div>
                ) : (
                    <>
                        <div className={`min-h-60 ${!currentSpreadsheet.is_fetched && "hidden"}`}>
                            <div
                            ref={jRef}
                            />
                        </div>
                        <div className={`
                        flex w-full min-h-60 bg-gray-200/25 border border-gray-400/25 items-center justify-center
                        ${currentSpreadsheet.is_fetched && "hidden"}
                        `}
                        >
                            <small>
                                Pull data above.
                            </small>
                        </div>
                    </>
                )
            }</div>
            {spreadsheetsData.some(s=>s.is_fetched) && <SaveAllButton/>}
        </>
    )
}

export default JSpreadsheet