'use client'

import Layout from "@/components/Layout"
import Link from "next/link";
import Image from "next/image";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useEffect, useReducer, useState } from "react";
import SheetSelection from "./SheetSelection";
// import { reducer } from "./_state-managment/manage";
import useFetchUser from "@/lib/hooks/useFetchUser";
import LoadingComponent from "@/components/LoadingComponent";
import JobItemsList from "./JobItemsList";
import Swal from "sweetalert2";
import ExportButtons from "@/components/ExportButtons";
import ExportGroup from "./ExportGroup";
import { Spreadsheet } from "spreadsheetjs-react";
import { set } from "mongoose";

const DynamicReportPage = () => {

    const { user, userLoading } = useFetchUser();
    const [isLoading, setIsLoading] = useState(true)

    const [spreadsheetsData, setSpreadsheetsData] = useState([])

    const [currentSpreadsheetId, setCurrentSpreadsheetId] = useState(null)
    const [jobDatas, setJobDatas] = useState(null)
    const today = new Date((new Date()).toISOString().split("T")[0])
    const [startDate, setStartDate] = useState(new Date(today))
    const [endDate, setEndDate] = useState(new Date(today))

    useEffect(() => {
        const fetchSpreadsheets = async () => {
            if(user._id) {
                try {
                    const response = await fetch("/api/job-dynamic-template/get-sheet-info", {
                        method: "POST",
                        body: JSON.stringify({
                            user_id: user._id,
                        })
                    })
                    if(!response.ok) {
                        throw new Error("Failed to retreive saved dynamic template")
                    }
                    const data = await response.json()
                    const { spreadsheets } = data
                    setSpreadsheetsData(spreadsheets.map(s=>({
                        id: s.id,
                        name: s.name,
                        is_fetched: false,
                        fetching: false,
                    })))
                    setIsLoading(false)
                }
                catch (err) {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: err.message,
                    })
                    setIsLoading(false)
                }
            }
        }
        fetchSpreadsheets()
    }, [
        user,
        // state,
    ])

    return (isLoading) ? <LoadingComponent/> : (
        <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6"
        >
            <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
            <div className="flex items-center gap-4">
                <Link href="/pages/report">
                <ArrowBackIosNewIcon />
                </Link>
                <Image
                src="/assets/card-logo/report.png"
                alt="wd logo"
                width={50}
                height={50}
                />
                <h1 className="text-3xl font-bold text-slate-900">
                    Dynamic ChecklistPM-Report
                </h1>
            </div>
            <h1 className="text-sm font-bold text-secondary flex items-center">
                Summarize the data.
            </h1>
            </div>
            <div className="flex flex-col mb-4 p-4 bg-white rounded-xl gap-4">
                <SheetSelection
                user={user}
                spreadsheetsData={spreadsheetsData}
                setSpreadsheetsData={setSpreadsheetsData}
                currentSpreadsheetId={currentSpreadsheetId}
                setCurrentSpreadsheetId={setCurrentSpreadsheetId}
                />
                {spreadsheetsData.find(s=>s.id===currentSpreadsheetId && s.is_fetched) && (
                    <Spreadsheet
                    cells={spreadsheetsData.find(s=>s.id===currentSpreadsheetId).cells}
                    rows_height={spreadsheetsData.find(s=>s.id===currentSpreadsheetId).rows_height}
                    cols_width={spreadsheetsData.find(s=>s.id===currentSpreadsheetId).cols_width}
                    onChange={({cells, rows_height, cols_width})=>{
                        setSpreadsheetsData(prev => prev.map(s=>s.id===currentSpreadsheetId ? {
                            ...s,
                            cells,
                            rows_height,
                            cols_width,
                        } : s))
                    }}
                    />
                )}
                <JobItemsList
                user={user}
                jobDatas={jobDatas}
                setJobDatas={setJobDatas}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                />
                <ExportGroup
                spreadsheetsData={spreadsheetsData}
                currentSpreadsheetId={currentSpreadsheetId}
                jobDatas={jobDatas}
                startDate={startDate}
                endDate={endDate}
                />
            </div>
        </Layout>
    )
}

export default DynamicReportPage