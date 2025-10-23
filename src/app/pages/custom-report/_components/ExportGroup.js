import ExportCsv from "@/app/pages/custom-report/_components/ExportCsv";
import ExportPng from "@/app/pages/custom-report/_components/ExportPng";
import ExportPdf from "@/app/pages/custom-report/_components/ExportPdf";

const ExportGroup = ({
    report,
    isReportMode,
    reportRef,
}) => {
    const {year, month, job_items} = report;
    const fileName = `Job_${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    const header = ["JobItemName", "upper_lower", "Month", "Date", "Time", "Shift", "ActualValue", "Job_status", "Img_file"]
    const body = job_items.map(({job_item_name, upper, lower, actual_value, created_at, status, img_file}) => [
        job_item_name,
        `${upper} / ${lower}`,
        created_at.toLocaleString("default", { month: "long" }),
        `${
            String(created_at.getDate()).padStart(2, "0")
        }-${
            String(created_at.getMonth() + 1).padStart(2, "0")
        }-${
            String(created_at.getFullYear()).padStart(4, "0")
        }`,
        `${
            String(created_at.getHours()).padStart(2, "0")
        }:${
            String(created_at.getMinutes()).padStart(2, "0")
        }`,
        created_at.getHours() > 12 ? "PM" : "AM",
        actual_value || "-",
        status,
        img_file?.split("/")[-1] || "Unknown",
    ])
    return (
        <div
            className={"flex gap-2 w-full justify-end"}
        >
            <ExportCsv
                header={header}
                body={body}
                fileName={fileName}
            />
            <ExportPng
                isReportMode={isReportMode}
                reportRef={reportRef}
                fileName={fileName}
            />
            <ExportPdf
                header={header}
                body={body}
                fileName={fileName}
            />
        </div>
    )
}

export default ExportGroup