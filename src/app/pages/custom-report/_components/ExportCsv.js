import {FaFileCsv} from "react-icons/fa";
import FileSaver from "file-saver"
const ExportCsv = ({
    report,
    fileName,
}) => {
    const exportToCsv = () => {
        const {job_items} = report;
        const header = "ACTUAL_VALUE,COMMENT,DATE,TIME"
        const body = job_items.map(({actual_value, comment, created_at}) => (
            `${
                actual_value || "-"
            },${
                comment || "-"
            },${
                String(created_at.getFullYear()).padStart(4, "0")
            }-${
                String(created_at.getMonth() + 1).padStart(2, "0")
            }-${
                String(created_at.getDate()).padStart(2, "0")
            },${
                String(created_at.getHours()).padStart(2, "0")
            }:${
                String(created_at.getMinutes()).padStart(2, "0")
            }:${
                String(created_at.getSeconds()).padStart(2, "0")
            }`
        ))
        const csvContent = [
            header,
            ...body
        ].join('\n')
        const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"})
        FileSaver.saveAs(blob, fileName)
    }
    return (
        <button
            onClick={exportToCsv}
            className=" bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
        >
            <FaFileCsv />
            <span className="hidden md:inline">Export CSV</span>
        </button>
    )
}

export default ExportCsv