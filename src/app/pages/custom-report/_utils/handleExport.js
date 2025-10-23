import FileSaver from "file-saver";
import Swal from "sweetalert2";
import {toBlob} from "html-to-image";
const handleExport = async ({
    type,
    report,
    isManipulateMode,
    reportRef,
}) => {
    const {job_items, year, month} = report;
    const fileName = `Job_${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    switch (type) {
        case 'csv':
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
            break
        case 'pdf':
            break
        case 'png':
            if (isManipulateMode) {
                Swal.fire({
                    icon: "warning",
                    title: "Select Report Mode to Export to PNG"
                })
            } else {
                if (reportRef.current) {
                    const imgBlob = await toBlob(reportRef.current, {
                        fontEmbedCSS: true,
                    })
                    if (imgBlob) {
                        FileSaver.saveAs(imgBlob, fileName)
                    }
                }
            }
            break
    }
}

export default handleExport