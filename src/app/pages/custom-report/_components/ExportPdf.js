import JsPDFWithThaiLang from "@/lib/utils/JsPDFWithThaiLang";
import jsPDF from "jspdf";
import {FaFilePdf} from "react-icons/fa";

const ExportPdf = ({
    header,
    body,
    fileName,
}) => {
    const exportToPdf = () => {
        const pdf = new JsPDFWithThaiLang()
        pdf.setFontSize(16)
        body.reduce((accItemsHeight, items, itemsIndex) => {
            if(itemsIndex !== 0 && itemsIndex % 3 === 0) {
                pdf.addPage()
            }
            const newHeight = items.reduce((accHeight, item, index) => {
                pdf.text(`${header[index]}: ${item}`, 5, accHeight)
                return accHeight + 10
            }, itemsIndex % 3 === 0 ? 10 : accItemsHeight) + 10
            return newHeight
        }, 10)
        pdf.save(fileName)
        // const blob = new Blob([csvContent], {type: "text/csv;charset=utf-8;"})
        // FileSaver.saveAs(blob, fileName)
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