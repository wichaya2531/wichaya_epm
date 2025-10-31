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
//import { Spreadsheet } from "spreadsheetjs-react";
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
            
            </div>
        </Layout>
    )
}

export default DynamicReportPage