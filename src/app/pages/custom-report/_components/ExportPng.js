import {FaImage} from "react-icons/fa";
import Swal from "sweetalert2";
import {toBlob} from "html-to-image";
import withReactContent from "sweetalert2-react-content";
import FileSaver from "file-saver";

const ExportPng = ({
    isReportMode,
    reportRef,
    fileName,
}) => {
    const exportToPng = async () => {
        if (!isReportMode) {
            const reactSwal = withReactContent(Swal)
            await reactSwal.fire({
                icon: "error",
                html: (
                    <>
                        Select <b>Report Mode</b> of your profile to Export to PNG
                    </>
                )
            })
        } else {
            if (reportRef.current) {
                const imgBlob = await toBlob(reportRef.current, {
                    includeQueryParams: true,
                })
                if (imgBlob) {
                    FileSaver.saveAs(imgBlob, fileName)
                }
            }
        }
    }
    return isReportMode && (
        <button
            onClick={exportToPng}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
        >
            <FaImage />
            <span className="hidden md:inline">Save as PNG</span>
        </button>
    )
}

export default ExportPng