import {FaFileCsv} from "react-icons/fa";
import FileSaver from "file-saver"
const ExportCsv = ({
    header,
    body,
    fileName,
}) => {
    const exportToCsv = () => {
        const csvContent = [
            header.join(","),
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