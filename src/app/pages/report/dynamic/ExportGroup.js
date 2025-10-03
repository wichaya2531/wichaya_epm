import ExportButtons from "@/components/ExportButtons"
import html2canvas from "html2canvas";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import * as XLSX from "xlsx";
import { toBlob } from "html-to-image";
import FileSaver from "file-saver";
import { useMemo } from "react";
import { fontFamily } from "@mui/system";
import JsPDFWithThaiLang from "@/lib/utils/JsPdfWithThaiLang";

const ExportGroup = ({
    reportType,
    jobDatas,
    jobDatasPaginated,
    startDateString,
    endDateString,
    monthsArray,
    weeksArray,
    datesArray,
}) => {
    
    const formattedJobDatas = useMemo(() => {
        if (jobDatas) {
            return jobDatas.map(({ items, created_at, workgroup_id, wd_tag, line_name, job_name, doc_number }) => (
                items.map(({ actual_value }) => ({
                    job_name,
                    workgroup_id,
                    line_name,
                    doc_number,
                    wd_tag,
                    actual_value,
                    created_at,
                }))
            )).flat()
        }
    }, [jobDatas])

    const exportToCSV = (fileName) => {
        const jobItemsHeader = ["JobName", "WorkgroupId", "LineName", "DocNumber", "WDTag", "ActualValue", "Date", "Time"]
        const jobItemsBody = formattedJobDatas.map((job, i) => ([
            job.job_name,
            job.workgroup_id,
            job.line_name,
            job.doc_number,
            job.wd_tag,
            job.actual_value,
            job.created_at.toISOString().split("T")[0],
            `${String(job.created_at.getHours()).padStart(2, "0")}:${String(job.created_at.getMinutes()).padStart(2, "0")}:${String(job.created_at.getSeconds()).padStart(2, "0")}:${String(job.created_at.getMilliseconds()).padStart(3, "0")}`,
        ]))
        const csvContent = [
            jobItemsHeader,
            ...jobItemsBody,
        ].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        FileSaver.saveAs(blob, fileName)
    }

    const pngTableHeader = () => {
        switch (reportType) {
            case "month":
                return monthsArray.map(({ month_display, year }) => (
                    `${month_display} ${year}`
                ))
            case "week":
                return weeksArray.map(({ start_date, end_date }) => [
                    `${
                        String(start_date.getDate()).padStart(2, "0")
                    }/${
                        String(start_date.getMonth()).padStart(2, "0")
                    }/${
                        String(start_date.getFullYear()).padStart(4, "0")
                    }`, `${
                        String(end_date.getDate()).padStart(2, "0")
                    }/${
                        String(end_date.getMonth()).padStart(2, "0")
                    }/${
                        String(end_date.getFullYear()).padStart(4, "0")
                    }`
                ])
            case "date":
                return datesArray.map(({ start_date }) => (
                    `${
                        String(start_date.getDate()).padStart(2, "0")
                    }/${
                        String(start_date.getMonth() + 1).padStart(2, "0")
                    }/${
                        String(start_date.getFullYear()).padStart(4, "0")
                    }`
                ))
            case "shift":
                return datesArray.map(({ start_date }) => (
                    `${
                        String(start_date.getDate()).padStart(2, "0")
                    }/${
                        String(start_date.getMonth() + 1).padStart(2, "0")
                    }/${
                        String(start_date.getFullYear()).padStart(4, "0")
                    }`
                ))
        }
    }

    const pngTableBody = () => {
        const tBodyNode = document.createElement("tbody")
        switch (reportType) {
            case "month":
                return jobDatasPaginated.map(({ actual_value, created_at }) => (
                    monthsArray.map(({ monthIndex, year }) => {
                        const actualValue = (new Date(year, monthIndex, 1) <= created_at &&
                            created_at < new Date(year, monthIndex + 1, 1)) ?
                            actual_value ?? "-" : "-"
                        return (
                            actualValue
                        )
                    })
                ))
            case "week":
                return jobDatasPaginated.map(({ actual_value, created_at }) => (
                    weeksArray.map(({ start_date, end_date }, week) => {
                        const actualValue = (start_date <= created_at &&
                            created_at < end_date) ?
                            actual_value ?? "-" : "-"
                        return actualValue
                    })
                ))
            case "date":
                return jobDatasPaginated.map(({ actual_value, created_at }) => (
                    datesArray.map(({ start_date, end_date }) => {
                        const actualValue = (start_date <= created_at &&
                            created_at < end_date) ?
                            actual_value ?? "-" : "-"
                        return actualValue
                    })
                ))
            case "shift":
                return jobDatasPaginated.map(({ actual_value, created_at }) => (
                    datesArray.map(({ start_date, end_date }) => {
                        const halfDate = new Date(start_date)
                        halfDate.setHours(halfDate.getHours() + 12)
                        const actualValueFirstHalf = (start_date.getTime() <= created_at.getTime() &&
                            created_at.getTime() < halfDate.getTime()) ?
                            actual_value ?? "-" : "-"
                        const actualValueSecondHalf = (halfDate.getTime() <= created_at.getTime() &&
                            created_at.getTime() < end_date.getTime()) ?
                            actual_value ?? "-" : "-"
                        return [
                            actualValueFirstHalf,
                            actualValueSecondHalf
                        ]
                    })
                ))
        }
        return tBodyNode
    }

    const exportToPNG = async (fileName) => {
        const imageContainerNode = document.createElement("div")
        imageContainerNode.className = "flex-1 container flex flex-col left-0 right-0 mx-auto justify-start font-sans mt-2 px-6 pt-24 pb-36 w-fit"
        const imageNode = document.createElement("div")
        imageNode.className = "flex flex-col mb-4 p-4 bg-white rounded-xl gap-4"
        const descriptionNode = document.createElement("div")
        descriptionNode.appendChild(document.createTextNode(`Report from ${startDateString} to ${endDateString}`))
        const tableNode = document.createElement("table")
        tableNode.className = "w-max min-w-full"
        const pngTableBodyNode = pngTableBody()
        const theadNode = document.createElement("thead")
        const thClass = "px-4 py-3 text-center border text-left font-bold bg-gradient-to-r from-blue-600 to-blue-500 text-white tracking-wider uppercase"
        const headerRowNode = document.createElement("tr")
        const thNode = document.createElement("th")
        thNode.className = `${thClass} w-20`
        thNode.appendChild(document.createTextNode("Item"))
        thNode.appendChild(document.createElement("br"))
        thNode.appendChild(document.createTextNode("No."))
        if(reportType === "shift") {
            thNode.rowSpan = 2
        }
        headerRowNode.appendChild(thNode)
        switch (reportType) {
            case "week":
                pngTableHeader().forEach(([value1, value2]) => {
                    const thNode = document.createElement("th")
                    thNode.className = thClass
                    thNode.appendChild(document.createTextNode(value1))
                    thNode.appendChild(document.createElement("br"))
                    thNode.appendChild(document.createTextNode(value2))
                    headerRowNode.appendChild(thNode)
                })
                theadNode.appendChild(headerRowNode)
                break
            case "month":
            case "date":
                pngTableHeader().forEach(value => {
                    const thNode = document.createElement("th")
                    thNode.className = thClass
                    thNode.appendChild(document.createTextNode(value))
                    headerRowNode.appendChild(thNode)
                })
                theadNode.appendChild(headerRowNode)
                break
            case "shift":
                const headerRowNode2 = document.createElement("tr")
                const pngTableHeaderValues = pngTableHeader()
                pngTableHeaderValues.forEach(value => {
                    const thNode = document.createElement("th")
                    thNode.className = thClass
                    thNode.colSpan = 2
                    thNode.appendChild(document.createTextNode(value))
                    headerRowNode.appendChild(thNode)
                })
                const thClass2 = "border px-4 py-2 text-center font-semibold bg-gray-300"
                pngTableHeaderValues.forEach(() => {
                    const thNode1 = document.createElement("th")
                    thNode1.className = thClass2
                    thNode1.appendChild(document.createTextNode("AM"))
                    headerRowNode2.appendChild(thNode1)
                    const thNode2 = document.createElement("th")
                    thNode2.className = thClass2
                    thNode2.appendChild(document.createTextNode("PM"))
                    headerRowNode2.appendChild(thNode2)
                })
                theadNode.appendChild(headerRowNode)
                theadNode.appendChild(headerRowNode2)
                break
        }
        tableNode.appendChild(theadNode)
        const tBodyNode = document.createElement("tbody")
        const tdClass = "px-4 py-2 border cursor-default text-sm text-gray-700 bg-white text-center"
        pngTableBody().forEach((arr, arrIndex) => {
            const trNode = document.createElement("tr")
            const indexNode = document.createElement("td")
            indexNode.className = tdClass
            indexNode.appendChild(document.createTextNode(arrIndex + 1))
            trNode.appendChild(indexNode)
            switch (reportType) {
                case "month":
                case "week":
                case "date":
                    arr.forEach(value => {
                        const tdNode = document.createElement("td")
                        tdNode.innerText = value
                        tdNode.className = tdClass
                        trNode.appendChild(tdNode)
                    })
                    break
                case "shift":
                    arr.forEach(([value1, value2]) => {
                        const tdNode1 = document.createElement("td")
                        tdNode1.innerText = value1
                        tdNode1.className = tdClass
                        trNode.appendChild(tdNode1)
                        const tdNode2 = document.createElement("td")
                        tdNode2.innerText = value2
                        tdNode2.className = tdClass
                        trNode.appendChild(tdNode2)
                    })
                    break
            }
            tBodyNode.appendChild(trNode)
        })
        tableNode.appendChild(tBodyNode)
        imageNode.appendChild(descriptionNode)
        imageNode.appendChild(tableNode)
        imageContainerNode.appendChild(imageNode)
        document.body.appendChild(imageContainerNode)
        const imgBlob = await toBlob(imageContainerNode, {
            fontEmbedCSS: true
        })
        if(imgBlob) {
            FileSaver.saveAs(imgBlob, fileName)
        }
        document.body.removeChild(imageContainerNode)
    }
    const exportToPdf = (fileName) => {
        const pdf = new JsPDFWithThaiLang()
        pdf.setFontSize(10)
        formattedJobDatas.forEach(({
            job_name,
            workgroup_id,
            line_name,
            doc_number,
            wd_tag,
            actual_value,
            created_at,
        }, index) => {
            const data = [{
                key: "JobName",
                value: job_name,
            }, {
                key: "WorkgroupId",
                value: workgroup_id,
            }, {
                key: "LineName",
                value: line_name,
            }, {
                key: "DocNumber",
                value: doc_number,
            }, {
                key: "WDTag",
                value: wd_tag,
            }, {
                key: "ActualValue",
                value: actual_value,
            }, {
                key: "DateTime",
                value: created_at && `${created_at.toISOString().split("T")[0]} | ${String(created_at.getHours()).padStart(2, "0")}:${String(created_at.getMinutes()).padStart(2, "0")}:${String(created_at.getSeconds()).padStart(2, "0")}:${String(created_at.getMilliseconds()).padStart(3, "0")}`,
            }]
            if(index % 4 === 0 && index !== 0) {
                pdf.addPage()
            }
            data.forEach((text, i) => {
                pdf.text(
                    `${text.key}: ${text.value || "-"}`,
                    10,
                    index % 4 * (data.length * 10) + ((i + 1) * 10)
                )
            })
        })
        pdf.save(fileName)
    }

    const reactSwal = withReactContent(Swal)
    
    const handleExport = async (type) => {
        if(jobDatas) {
            reactSwal.fire({
                title: "Exporting...",
                didOpen: () => {
                    reactSwal.showLoading()
                }
            })
            const fileName =` JobDynamic_${startDateString}_to_${endDateString}.${type}`
            switch(type) {
                case "csv":
                    exportToCSV(fileName)
                    break
                case "png":
                    await exportToPNG(fileName)
                    break
                case "pdf":
                    exportToPdf(fileName)
                    break
                default:
                    break
            }
            reactSwal.close()
        }
        else {
            reactSwal.fire({
                icon: "error",
                title: "No data available",
                text: "There is no data available to export.",
            })
        }
    }

    if(jobDatas && jobDatas.length > 0 && startDateString !== null && endDateString !== null) {
        return (
            <ExportButtons
            handleExport={handleExport}
            />
        )
    }
}
export default ExportGroup