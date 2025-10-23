import ExportCsv from "@/app/pages/custom-report/_components/ExportCsv";
import ExportPng from "@/app/pages/custom-report/_components/ExportPng";
import ExportPdf from "@/app/pages/custom-report/_components/ExportPdf";

const ExportGroup = ({
    report,
    isReportMode,
    reportRef,
}) => {
    const {year, month} = report;
    const fileName = `Job_${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    return (
        <div
            className={"flex gap-2 w-full justify-end"}
        >
            <ExportCsv
                report={report}
                fileName={fileName}
            />
            <ExportPng
                isReportMode={isReportMode}
                reportRef={reportRef}
                fileName={fileName}
            />
            <ExportPdf />
        </div>
    )
}

export default ExportGroup