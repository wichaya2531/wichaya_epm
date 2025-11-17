"use client"
import Layout from "@/components/Layout"
import Link from "next/link"
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { Edit, Delete } from "@mui/icons-material";
import Image from "next/image";
import {useEffect, useMemo, useRef, useState} from "react";
import LoadingComponent from "@/components/LoadingComponent";
import useFetchUser from "@/lib/hooks/useFetchUser";
import CustomReportDesignMode from "./_design/CustomReportDesignMode";
import { Autocomplete, TextField } from "@mui/material";
import CustomReportDisplayMode from "./_report/CustomReportDisplayMode";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import editProfileName from "@/app/pages/custom-report/_utils/editProfileName";
import deleteProfile from "@/app/pages/custom-report/_utils/deleteProfile";
import createProfile from "@/app/pages/custom-report/_utils/createProfile";
import saveAllProfiles from "@/app/pages/custom-report/_utils/saveAllProfiles";
import getAllProfileInfos from "@/app/pages/custom-report/_utils/getAllProfileInfos";
import getJobTemplates from "@/app/pages/custom-report/_utils/getJobTemplates";
import getProfileTable from "@/app/pages/custom-report/_utils/getProfileTable";
import ExportGroup from "@/app/pages/custom-report/_components/ExportGroup";
import ExportPng from "@/app/pages/custom-report/_components/ExportPng";

const DynamicReportPage = () => {

    const [isSaving, setIsSaving] = useState(false);

    const { user, userLoading } = useFetchUser();
    const reactSwal = withReactContent(Swal)
    const [isLoading, setIsLoading] = useState(true)
    const [isReportMode, setIsReportMode] = useState(true)
    const [isManipulationMode, setIsManipulationMode] = useState(true)
    const [containerHeight, setContainerHeight] = useState(600)
    const [containerWidth, setContainerWidth] = useState(900)

    const [customReportProfiles, setCustomReportProfiles] = useState(null)
    const [isFetchingProfiles, setIsFetchingProfiles] = useState(false)

    const profileSelectorOptions = useMemo(() => (
        customReportProfiles && customReportProfiles.map(j => ({
            label: j.name,
            value: j.id,
        }))
    ), [
        customReportProfiles,
    ])
    const [currentCustomReportProfileId, setCurrentCustomReportProfileId] = useState(null)

    const currentCustomReportProfileForAutoComplete = useMemo(() => {
        const profile = customReportProfiles && customReportProfiles.find(j => j.id === currentCustomReportProfileId)
        if(profile) {
            const {id, name} = profile
            return {
                label: name,
                value: id,
            }
        }
        return {
            label: "",
            value: "",
        }
    }, [
        customReportProfiles,
        currentCustomReportProfileId,
    ])

    const currentCustomReportProfile = useMemo(() => customReportProfiles && customReportProfiles.find(j => j.id === currentCustomReportProfileId), [
        customReportProfiles,
        currentCustomReportProfileId,
    ])
    const existedNames = useMemo(() => customReportProfiles && customReportProfiles.map(j => j.name), [
        customReportProfiles,
    ])

    const [jobTemplates, setJobTemplates] = useState(null)

    const [report, setReport] = useState(null)
    const today = new Date()
    const [reportMonth, setReportMonth] = useState(today.getMonth() + 1)
    const [reportYear, setReportYear] = useState(today.getFullYear())
    const [isFetchingJobData, setIsFetchingJobData] = useState(false)

    useEffect(() => {
        if(user) {
            const fetchAllProfileInfos = async () => {
                await getAllProfileInfos({
                    user_id: user._id,
                    setCustomReportProfiles,
                })
            }
            const fetchJobTemplates = async () => {
                await getJobTemplates({
                    user_id: user._id,
                    setJobTemplates,
                })
            }
            fetchAllProfileInfos()
            fetchJobTemplates()
        }
    }, [user])

    const allTableWithImages = useMemo(() => (
        customReportProfiles?.map(profile => (
            profile.customReportTables?.map(table => ({
                id: table.id,
                images: table.cells.map(row => row.map(cell => cell.image && {
                    blob: cell.image.blob,
                    id: cell.image.id
                })).flat().filter(img => img),
            }))
        )).flat()
    )?.filter(table => table) || [], [
        customReportProfiles
    ])

    const profilesWithImageIds = useMemo(() => (
        customReportProfiles?.map(profile => ({
            ...profile,
            customReportTables: profile.customReportTables?.map(table => ({
                ...table,
                cells: table.cells.map(row => row.map(cell => ({
                    ...Object.fromEntries(
                        Object.entries({...cell}).filter(([key]) => (
                            key !== "image"
                        )),
                    ),
                    ...(cell.image && {
                        image_id: cell.image.id,
                    })
                })))
            }))
        })) || null
    ), [
        customReportProfiles,
    ])

    const reportRef = useRef(null)

    return (jobTemplates && customReportProfiles) ? (
        <Layout className="container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6">
            <div className="flex flex-col items-start gap-4 mb-4 p-4 bg-white rounded-xl">
                <div className="flex items-center gap-4">
                    <Link href="/pages/dashboard">
                        <ArrowBackIosNewIcon />
                    </Link>
                    <Image
                        src="/assets/card-logo/report.png"
                        alt="wd logo"
                        width={50}
                        height={50}
                    />
                    <h1 className="text-3xl font-bold text-slate-900">
                        Custom ChecklistPM-Report
                    </h1>
                </div>
                <h1 className="text-sm font-bold text-secondary flex items-center">
                    Summarize the data with preferred way.
                </h1>
            </div>
            <div className="flex flex-col mb-4 p-4 bg-white rounded-xl gap-4">
                <div
                    className="flex gap-4 justify-between"
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4 items-center">
                            <Autocomplete
                                disablePortal
                                noOptionsText={"No Profile Created Yet"}
                                options={profileSelectorOptions}
                                sx={{ width: 300 }}
                                renderInput={(params) => <TextField {...params} label="Profile" />}
                                renderOption={(props, option, state) => (
                                    <div
                                        {...props}
                                    >
                                        <div
                                            className="w-full"
                                        >
                                            {option.label}
                                        </div>
                                        <div className="flex align-center">
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await editProfileName({
                                                        option,
                                                        existedNames,
                                                        setCustomReportProfiles,
                                                    })
                                                }}
                                            >
                                                <Edit />
                                            </button>
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    await deleteProfile({
                                                        option,
                                                        setCustomReportProfiles,
                                                        currentCustomReportProfileId,
                                                        setCurrentCustomReportProfileId,
                                                    })
                                                }}
                                            >
                                                <Delete />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                value={currentCustomReportProfileForAutoComplete}
                                isOptionEqualToValue={(option, value) => option.value === value.value}
                                onChange={(_, autoCompleteValue) => {
                                    if(autoCompleteValue) {
                                        const {value} = autoCompleteValue;
                                        if(value) {
                                            setCurrentCustomReportProfileId(value)
                                        }
                                    }
                                }}
                            />
                            <button
                                className='h-fit text-white font-bold py-2 px-4 rounded-md transition duration-300 transform flex items-center justify-center space-x-2 bg-green-500 enabled:hover:bg-green-600 enabled:hover:scale-105 disabled:bg-gray-200'
                                onClick={async (e) => {
                                    setIsFetchingProfiles(true)
                                    const finishedFetching = await getProfileTable({
                                        profile_id: currentCustomReportProfileId,
                                        setCustomReportProfiles,
                                    })
                                    if(finishedFetching) {
                                        setIsFetchingProfiles(false)
                                    }
                                }}
                                disabled={currentCustomReportProfileId === null || isFetchingProfiles}
                            >
                                Pull Profile Reports
                            </button>
                            <button
                                className="h-fit text-white font-bold py-2 px-4 rounded-md transition duration-300 transform flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 hover:scale-105"
                                onClick={async () => {
                                    await createProfile({
                                        existedNames,
                                        customReportProfiles,
                                        setCustomReportProfiles,
                                        currentCustomReportProfileId,
                                        setCurrentCustomReportProfileId,
                                    })
                                }}
                            >
                                Create New Profile
                            </button>
                            <button
                                className="h-fit text-white font-bold py-2 px-4 rounded-md transition duration-300 transform flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 hover:scale-105"
                                onClick={async (e) => {
                                    setIsSaving(true)
                                    const saved = await saveAllProfiles({
                                        user_id: user._id,
                                        profiles: profilesWithImageIds,
                                        setCustomReportProfiles,
                                        allTableWithImages,
                                    })
                                    if(saved) {
                                        setIsSaving(false)
                                    }
                                    else {
                                        setIsSaving(false)
                                    }
                                }}
                            >
                                Save All Profiles
                            </button>
                        </div>
                        {currentCustomReportProfile?.customReportTables && (
                            <div className="flex gap-4">
                                <button
                                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all enabled:bg-gradient-to-r enabled:from-blue-600 enabled:to-blue-500 text-white shadow-lg duration-150 ease-in-out enabled:hover:scale-105 enabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-700"
                                    disabled={isReportMode}
                                    onClick={() => setIsReportMode(true)}
                                >
                                    Report Mode
                                </button>
                                <button
                                    className="px-6 py-3 rounded-lg text-sm font-semibold transition-all enabled:bg-gradient-to-r enabled:from-blue-600 enabled:to-blue-500 text-white shadow-lg duration-150 ease-in-out enabled:hover:scale-105 enabled:hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-700"
                                    disabled={!isReportMode}
                                    onClick={() => setIsReportMode(false)}
                                >
                                    Design Mode
                                </button>
                            </div>
                        )}
                    </div>
                    <div
                        className="flex flex-col gap-4 justify-between items-end"
                    >
                        <input
                            className="border border-gray-300 rounded-md py-2 px-3 focus:border-blue-400 h-12"
                            type="month"
                            value={`${String(reportYear).padStart(4, "0")}-${String(reportMonth).padStart(2, "0")}`}
                            onChange={(e) => {
                                const [year, month] = e.target.value.split("-")
                                setReportYear(parseInt(year))
                                setReportMonth(parseInt(month))
                            }}
                        />
                        <div
                            className={`flex gap-2`}
                        >
                            <button
                                className={`
                                text-white font-bold py-2 px-4 rounded-md transition duration-300 transform flex items-center justify-center space-x-2 w-fit
                                ${isFetchingJobData ? "bg-gray-300" : "bg-green-500 hover:bg-green-600 hover:scale-105"}
                            `}
                                onClick={async () => {
                                    setIsFetchingJobData(true)
                                    const response = await fetch("/api/custom-report/get-job-items", {
                                        method: "POST",
                                        body: JSON.stringify({
                                            user_id: user._id,
                                            year: reportYear,
                                            month: reportMonth,
                                        })
                                    })
                                    if(response.ok) {
                                        const {status, message, job_items} = await response.json()
                                        if(status === 200) {
                                            setReport({
                                                job_items: job_items.map(item => ({
                                                    ...item,
                                                    created_at: new Date(item.created_at),
                                                })),
                                                year: reportYear,
                                                month: reportMonth,
                                            })
                                        }
                                        else {
                                            await Swal.fire({
                                                icon: "error",
                                                text: message,
                                            })
                                        }
                                        setIsFetchingJobData(false)
                                    }
                                    else {
                                        await Swal.fire({
                                            icon: "error",
                                            text: "Failed to pull data"
                                        })
                                        setIsFetchingJobData(false)
                                    }
                                }}
                            >
                                Pull Data
                            </button>
                        </div>
                    </div>
                </div>
                {currentCustomReportProfile?.customReportTables && (
                    <>
                        {isReportMode ? (
                            <CustomReportDisplayMode
                                currentCustomReportProfile={currentCustomReportProfile}
                                report={report}
                                setReport={setReport}
                                reportYear={reportYear}
                                reportMonth={reportMonth}
                                reportRef={reportRef}
                            />
                            ) : (
                            <CustomReportDesignMode
                                isManipulationMode={isManipulationMode}
                                setIsManipulationMode={setIsManipulationMode}
                                customReportProfiles={customReportProfiles}
                                setCustomReportProfiles={setCustomReportProfiles}
                                currentCustomReportProfile={currentCustomReportProfile}
                                currentCustomReportProfileId={currentCustomReportProfileId}
                                jobTemplates={jobTemplates}
                            />
                        )}
                    </>
                )}
                {report && (
                    <ExportGroup
                        report={report}
                        isReportMode={isReportMode}
                        reportRef={reportRef}
                    />
                ) || currentCustomReportProfile?.customReportTables && (
                    <div
                        className={"flex gap-2 w-full justify-end"}
                    >
                        <ExportPng
                            isReportMode={isReportMode}
                            reportRef={reportRef}
                            fileName={report && `Job_${String(report.year).padStart(4, "0")}-${String(report.month).padStart(2, "0")}` || "Job_Raw"}
                        />
                    </div>
                )}
            </div>
        </Layout>
    ) : (
        <LoadingComponent />
    )
}

export default DynamicReportPage