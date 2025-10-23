import {FaFilePdf} from "react-icons/fa";

const ExportPdf = ({

}) => {
    const exportToPdf = () => {

    }
    return (
        <button
            onClick={exportToPdf}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
        >
            <FaFilePdf />
            <span className="hidden md:inline">Export PDF</span>
        </button>
    )
}

export default ExportPdf