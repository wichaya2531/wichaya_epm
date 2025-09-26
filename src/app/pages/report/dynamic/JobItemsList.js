import { act, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const JobItemsList = ({
    user,
    jobDatas,
    setJobDatas,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
}) => {
    const reactSwal = withReactContent(Swal)

    const [reportType, setReportType] = useState("month")
    const [isFetched, setIsFetched] = useState(null)
    const [fetching, setFetching] = useState(false)

    const getMonthsArray = (startDate, endDate) => {
        const monthsDiff = (
            endDate.getFullYear() - startDate.getFullYear()
        ) * 12 + (
                endDate.getMonth() - startDate.getMonth()
            )
        return Array.from({ length: monthsDiff + 1 }, (_, i) => {
            const d = new Date(startDate)
            d.setMonth(d.getMonth() + i)
            return {
                year: d.getFullYear(),
                monthIndex: d.getMonth(),
                month_display: d.toLocaleString("default", {
                    month: "short"
                }).slice(0, 3),
            }
        })
    }

    const getWeeksArray = (startDate, endDate, weeksArray = []) => {
        if (startDate > endDate) {
            return weeksArray
        }
        const currentDate = new Date(startDate)
        currentDate.setDate(currentDate.getDate() + 7)
        return getWeeksArray(currentDate, endDate, [...weeksArray, {
            start_date: startDate,
            end_date: currentDate < endDate ? currentDate : endDate,
        }])
    }

    const getDatesArray = (startDate, endDate, datesArray = []) => {
        if (startDate > endDate) {
            return datesArray
        }
        const currentDate = new Date(startDate)
        currentDate.setDate(currentDate.getDate() + 1)
        return getDatesArray(currentDate, endDate, [...datesArray, {
            start_date: startDate,
            end_date: currentDate,
        }])
    }

    const weeksArray = useMemo(() => getWeeksArray(startDate, endDate), [startDate, endDate])
    const monthsArray = useMemo(() => getMonthsArray(startDate, endDate), [startDate, endDate])
    const datesArray = useMemo(() => getDatesArray(startDate, endDate), [startDate, endDate])

    const maxStartDate = useMemo(() => {
        const date = new Date()
        date.setDate(startDate.getDate() + 1)
        return date
    }, [startDate])

    const maxEndDate = useMemo(() => {
        const date = new Date()
        date.setDate(endDate.getDate() + 1)
        return date
    }, [endDate])

    const updateJobData = async () => {
        const fetchData = async () => {
            setFetching(true)
            const res = await fetch("/api/job-dynamic-template/get-job-data", {
                method: "POST",
                body: JSON.stringify({
                    user_id: user._id,
                    start_date: startDate.toISOString().split("T")[0],
                    end_date: endDate.toISOString().split("T")[0],
                }),
            })
            if (res.ok) {
                const { status, err_message, job_data } = await res.json()
                if (status === 200) {
                    setIsFetched({
                        start_date: startDate,
                        end_date: endDate,
                    })
                    setJobDatas(job_data.map(data => ({
                        ...data,
                        created_at: new Date(data.created_at)
                    })))
                }
                else {
                    await reactSwal.fire({
                        title: "Error",
                        html: <>{err_message}</>,
                        focusConfirm: true,
                        focusCancel: false,
                        confirmButtonText: 'Confirm',
                        icon: "error",
                    })
                }
            }
            else {
                await reactSwal.fire({
                    title: "Error",
                    html: <>Failed to Pull Data</>,
                    focusConfirm: true,
                    focusCancel: false,
                    confirmButtonText: 'Confirm',
                    icon: "error",
                })
            }
            setFetching(false)
        }
        if (!fetching) {
            if (isFetched) {
                const startDateString = `${
                    isFetched.start_date.getDate()
                }/${
                    isFetched.start_date.getMonth() + 1
                }/${
                    isFetched.start_date.getFullYear()
                }`
                const endDateString = `${
                    isFetched.end_date.getDate()
                }/${
                    isFetched.end_date.getMonth() + 1
                }/${
                    isFetched.end_date.getFullYear()
                }`
                const { value } = await reactSwal.fire({
                    title: "Warning",
                    html: <>
                        You already pulled {startDateString} - {endDateString}
                        <br />
                        you want to pull data again?
                        <br />
                        <br />
                        คุณดึงข้อมูลของ {startDateString} - {endDateString} ก่อนหน้านี้แล้ว
                        <br />
                        คุณต้องการดึงข้อมูลอีกครั้งหรือไม่?
                    </>,
                    focusConfirm: true,
                    focusCancel: false,
                    showCancelButton: true,
                    confirmButtonText: 'Confirm',
                    cancelButtonText: "Cancel",
                    icon: "warning",
                })
                if (value) {
                    await fetchData()
                }
            }
            else {
                await fetchData()
            }
        }
    }

    useEffect(() => {
    }, [jobDatas])

    const TableHeader = () => {
        const thClass = "px-4 py-3 text-center border text-left font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white tracking-wider uppercase"
        const shiftthClass = "border px-4 py-2 text-center font-semibold bg-gray-300"
        const ItemNumberHeader = ({ rowSpan = 1, colSpan = 1 }) => (
            <>
                <th className={`${thClass} sticky left-0 top-0 w-20`} rowSpan={rowSpan} colSpan={colSpan}>
                    Item<br />
                    No.
                </th>
            </>
        )
        const Headers = () => {
            switch (reportType) {
                case "month":
                    return (
                        <tr>
                            <ItemNumberHeader />
                            {monthsArray.map(({ month_display, year }) => (
                                <th className={thClass} rowSpan={1} colSpan={1}>
                                    {month_display} {year}
                                </th>
                            ))}
                        </tr>

                    )
                case "week":
                    return (
                        <tr>
                            <ItemNumberHeader
                            />
                            {weeksArray.map(({ start_date, end_date }, week) => (
                                <th className={thClass} rowSpan={1} colSpan={1}>
                                    {`${String(start_date.getDate()).padStart(2, "0")}/${String(startDate.getMonth()).padStart(2, "0")}/${String(startDate.getFullYear()).padStart(4, "0")}`}
                                    {start_date.getTime() !== end_date.getTime() && (
                                        <>
                                            <br />
                                            {`${String(end_date.getDate()).padStart(2, "0")}/${String(end_date.getMonth()).padStart(2, "0")}/${String(end_date.getFullYear()).padStart(4, "0")}`}
                                        </>
                                    )}
                                    <br />
                                    Week {week + 1}
                                </th>
                            ))}
                        </tr>
                    )
                case "date":
                    return (
                        <tr>
                            <ItemNumberHeader />
                            {datesArray.map(({ start_date }) => (
                                <th className={thClass} rowSpan={1} colSpan={1}>
                                    {`${String(start_date.getDate()).padStart(2, "0")}/${String(start_date.getMonth() + 1).padStart(2, "0")}/${String(start_date.getFullYear()).padStart(4, "0")}`}
                                </th>
                            ))}
                        </tr>
                    )
                case "shift":
                    return (
                        <>
                            <tr>
                                <ItemNumberHeader
                                    rowSpan={2}
                                />
                                {datesArray.map(({ start_date }) => (
                                    <th className={thClass} rowSpan={1} colSpan={2}>
                                        {`${String(start_date.getDate()).padStart(2, "0")}/${String(start_date.getMonth() + 1).padStart(2, "0")}/${String(start_date.getFullYear()).padStart(4, "0")}`}
                                    </th>
                                ))}
                            </tr>
                            <tr>
                                {datesArray.map((date) => (
                                    <>
                                        <th className={shiftthClass} rowSpan={1} colSpan={1}>
                                            AM
                                        </th>
                                        <th className={shiftthClass} rowSpan={1} colSpan={1}>
                                            PM
                                        </th>
                                    </>
                                ))}
                            </tr>
                        </>
                    )
                default:
                    return (<></>)
            }
        }
        return (
            <thead>
                <Headers />
            </thead>
        )
    }

    const TableContent = () => {
        const tdClass = ({ value, textLeft = false }) => `
        px-4 py-2 border cursor-default text-sm text-gray-700 group-hover:bg-gray-100
        ${textLeft ? "text-left" : "text-center"}
        `
        const Row = ({ children, index }) => (
            <tr className="group">
                <td rowSpan={1} colSpan={1} className={`${tdClass({})} group-hover:bg-gray-100 sticky left-0 w-20`}>
                    {index + 1}
                </td>
                {children}
            </tr>
        )
        const Content = () => {
            if (jobDatas) {
                const formattedJobDatas = jobDatas.map(({ created_at, items }) => (
                    items.map(({ actual_value }) => ({
                        created_at,
                        actual_value,
                    }))
                )).flat()
                switch (reportType) {
                    case "month":
                        return (
                            formattedJobDatas.map(({
                                created_at,
                                actual_value,
                            }, index) => (
                                <Row
                                    index={index}
                                >
                                    {monthsArray.map(({ monthIndex, year }) => {
                                        const actualValue = (new Date(year, monthIndex, 1) <= created_at &&
                                            created_at < new Date(year, monthIndex + 1, 1)) ?
                                            actual_value ?? "-" : "-"
                                        return (
                                            <td className={tdClass({ value: actualValue })} rowSpan={1} colSpan={1}>
                                                {actualValue}
                                            </td>
                                        )
                                    })}
                                </Row>
                            ))
                        )
                    case "week":
                        return formattedJobDatas.map(({
                            created_at,
                            actual_value,
                        }, index) => (
                            <Row
                                index={index}
                            >
                                {weeksArray.map(({ start_date, end_date }, week) => {
                                    const actualValue = (start_date <= created_at &&
                                        created_at < end_date) ?
                                        actual_value ?? "-" : "-"
                                    return (
                                        <td className={tdClass({ value: actualValue })} rowSpan={1} colSpan={1}>
                                            {actualValue}
                                        </td>
                                    )
                                })}
                            </Row>
                        ))
                    case "date":
                        return formattedJobDatas.map(({
                            created_at,
                            actual_value,
                        }, index) => (
                            <Row
                                index={index}
                            >
                                {datesArray.map(({ start_date, end_date }) => {
                                    const actualValue = (start_date <= created_at &&
                                        created_at < end_date) ?
                                        actual_value ?? "-" : "-"
                                    return (
                                        <td className={tdClass({ value: actualValue })} rowSpan={1} colSpan={1}>
                                            {actualValue}
                                        </td>
                                    )
                                })}
                            </Row>
                        ))
                    case "shift":
                        return formattedJobDatas.map(({
                            created_at,
                            actual_value,
                        }, index) => (
                            <Row
                                index={index}
                            >
                                {datesArray.map(({ start_date, end_date }) => {
                                    const halfDate = new Date(start_date)
                                    halfDate.setHours(halfDate.getHours() + 12)
                                    const actualValueFirstHalf = (start_date.getTime() <= created_at.getTime() &&
                                        created_at.getTime() < halfDate.getTime()) ?
                                        actual_value ?? "-" : "-"
                                    const actualValueSecondHalf = (halfDate.getTime() <= created_at.getTime() &&
                                        created_at.getTime() < end_date.getTime()) ?
                                        actual_value ?? "-" : "-"
                                    return (
                                        <>
                                            <td className={tdClass({ value: actualValueFirstHalf })} rowSpan={1} colSpan={1}>
                                                {actualValueFirstHalf}
                                            </td>
                                            <td className={tdClass({ value: actualValueSecondHalf })} rowSpan={1} colSpan={1}>
                                                {actualValueSecondHalf}
                                            </td>
                                        </>
                                    )
                                })}
                            </Row>
                        ))
                    default:
                        return (<></>)
                }
            }
            else {
                <></>
            }
        }
        return (
            <tbody>
                <Content />
            </tbody>
        )
    }

    return (
        <>
            <div className="flex gap-4">
                <div>
                    <label
                        htmlFor="start-month"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        Start Date
                    </label>
                    <input
                        className={`
                            border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400
                            ${fetching ? "bg-gray-300 pointer-events-none text-gray-400" : ""}
                        `}
                        type={"date"}
                        value={startDate.toISOString().split("T")[0]}
                        max={maxStartDate.toISOString().split("T")[0]}
                        onChange={(e) => setStartDate(prev => e.target.value ? new Date(e.target.value) : prev)}
                    />
                </div>
                <div>
                    <label
                        htmlFor="end-month"
                        className="block text-sm font-medium text-gray-700 mb-1"
                    >
                        End Date
                    </label>
                    <input
                        className={`
                            border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400
                            ${fetching ? "bg-gray-300 pointer-events-none text-gray-400" : ""}
                        `}
                        type={"date"}
                        value={endDate.toISOString().split("T")[0]}
                        max={maxEndDate.toISOString().split("T")[0]}
                        min={startDate.toISOString().split("T")[0]}
                        onChange={(e) => setEndDate(prev => e.target.value ? new Date(e.target.value) : prev)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        &nbsp;
                    </label>
                    <button
                        className={`
                            text-white font-bold px-4 py-2 rounded-md
                            ${fetching ? "bg-gray-300" : "bg-green-500 hover:bg-green-600"}
                        `}
                        onClick={updateJobData}
                    >
                        Pull Data
                    </button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        View Type
                    </label>
                    <select
                        className={`border border-gray-300 rounded-md py-2 px-3 w-full focus:border-blue-400`}
                        value={reportType}
                        onChange={(e) => {
                            setReportType(e.target.value)
                        }}
                        disabled={fetching}
                    >
                        <option value="month">Month</option>
                        <option value="week">Week</option>
                        <option value="date">Date</option>
                        <option value="shift">Shift</option>
                    </select>
                </div>
            </div>
            <div className="w-full overflow-auto border">
                <table className="w-max min-w-full border">
                    <TableHeader />
                    <TableContent />
                </table>
                {!jobDatas && (
                    <div className="sticky w-full h-20 flex justify-center items-center left-0 top-0 bg-gray-200/25 pointer-events-none">
                        <small>
                            Pull data above.
                        </small>
                    </div>
                )}
            </div>
        </>
    )
}

export default JobItemsList