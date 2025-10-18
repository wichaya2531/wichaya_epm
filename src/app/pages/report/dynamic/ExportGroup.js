import ExportButtons from "@/components/ExportButtons"
import html2canvas from "html2canvas";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import * as XLSX from "xlsx";
// import { toBlob } from "html-to-image";
import FileSaver from "file-saver";

const ExportGroup = ({
    spreadsheetsData,
    currentSpreadsheetId,
    jobDatas,
    startDate,
    endDate,
}) => {
    
    // const exportToCSV = (fileName, currentSpreadsheet) => {
    //     const { data } = currentSpreadsheet
    //     const spreadsheetCsv = data.map(row => row.join(",")).join("\n")
    //     const JobItemsCsvHeader = ["JobItemNo", "JobItemTitle", "JobItemName", "ActualValue", "Date", "Time"].join(",")
    //     const JobItemsCsvBody = jobDatas.map((job, i) => (
    //         `${i+1},${job.item_title},${job.item_name},${job.actual_value},${job.created_at.toISOString().split("T")[0]},${job.created_at.getHours()}:${job.created_at.getMinutes()}`
    //     )).join("\n")
    //     const csvContent = `${spreadsheetCsv}\n${JobItemsCsvHeader}\n${JobItemsCsvBody}\n`
    //     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    //     FileSaver.saveAs(blob, fileName)
    // }

    // const exportToExcel = (fileName, currentSpreadsheet) => {
    //     const { mergeCells, data, name } = currentSpreadsheet
    //     const jobItemsHeader = ["JobItemNo", "JobItemTitle", "JobItemName", "ActualValue", "Date", "Time"]
    //     const jobItemsBody = jobDatas.map((job, i) => ([
    //         i + 1,
    //         job.item_title,
    //         job.item_name,
    //         job.actual_value,
    //         job.created_at.toISOString().split("T")[0],
    //         `${job.created_at.getHours()}:${job.created_at.getMinutes()}`
    //     ]))
    //     const wb = XLSX.utils.book_new();
    //     const merges = Object.entries(mergeCells).map(([key, value]) => {
    //         const s = Object.fromEntries(["c", "r"].map((k, i) => [k, jspreadsheet.helpers.getCoordsFromCellName(key)[i]]))
    //         const e = Object.fromEntries(["c", "r"].map((k, i) => [k, s[k] + value[i] - 1]))
    //         return { s, e }
    //     })
    //     const ws = {
    //         ...XLSX.utils.aoa_to_sheet([
    //             ...data,
    //             jobItemsHeader,
    //             ...jobItemsBody,
    //         ]),
    //         "!merges": merges
    //     }
    //     XLSX.utils.book_append_sheet(wb, ws, name);
    //     XLSX.writeFile(wb, fileName)
    // }

    // const exportToPNG = async (fileName) => {
    //     const table = Array.from(document.getElementsByTagName("table")).find(t => t.className.includes("jss_worksheet") && t.className.includes("jss_overflow")).cloneNode(true)
    //     Array.from(table.children).forEach(elem => {
    //         if(elem.tagName==="THEAD") {
    //             table.removeChild(elem)
    //         }
    //         if(elem.tagName==="COLGROUP") {
    //             elem.children[0].width = "0"
    //         }
    //     })
    //     document.body.appendChild(table)
    //     const imgBlob = await toBlob(table, {
    //         fontEmbedCSS: true
    //     })
    //     if(imgBlob) {
    //         FileSaver.saveAs(imgBlob, fileName)
    //     }
    //     document.body.removeChild(table)
    // }

    // const reactSwal = withReactContent(Swal)
    // const currentSpreadsheet = spreadsheetsData.find(s=>s.id===currentSpreadsheetId)
    // const handleExport = async (type) => {
    //     const { data } = currentSpreadsheet
    //     if(data) {
    //         if(jobDatas) {
    //             reactSwal.fire({
    //                 title: "Exporting...",
    //                 didOpen: () => {
    //                     reactSwal.showLoading()
    //                 }
    //             })
    //             const fileName =` JobDynamic_${startDate.toISOString().split("T")[0]}_to_${endDate.toISOString().split("T")[0]}.${type}`
    //             switch(type) {
    //                 case "csv":
    //                     exportToCSV(fileName, currentSpreadsheet)
    //                     break
    //                 case "xlsx":
    //                     exportToExcel(fileName, currentSpreadsheet)
    //                     break
    //                 case "png":
    //                     await exportToPNG(fileName)
    //                     break
    //                 case "pdf":
    //                     break
    //                 default:
    //                     break
    //             }
    //             reactSwal.close()
    //         }
    //         else {
    //             reactSwal.fire({
    //                 icon: "error",
    //                 title: "No data available",
    //                 text: "There is no data available to export.",
    //             })
    //         }
    //     }
    //     else {
    //         reactSwal.fire({
    //             icon: "error",
    //             title: "No data available",
    //             text: "There is no data available to export.",
    //         })
    //     }
    // }

    // if(currentSpreadsheet) {
    //     return <ExportButtons
    //     handleExport={handleExport}
    //     excel={true}
    //     />
    // }
}
export default ExportGroup