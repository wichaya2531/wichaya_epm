import { useMemo } from "react"
import Spreadsheet from "spreadsheetjs-react"

const CustomReportDisplayMode = ({
    customReportProfiles,
    currentCustomReportProfile,
    report,
    reportRef,
}) => {

    const formattedTables = useMemo(() => (
        currentCustomReportProfile?.customReportTables.map(table => ({
            ...table,
            cells: table.cells.map(row=>row.map(cell=>({
                ...Object.fromEntries(
                  Object.entries({ ...cell }).filter(
                    ([key]) => key !== "image_id" || true,
                  ),
                ),
                value: cell.job_template && report!==null ? (() => {
                    const data = report.job_items.filter(({
                        job_item_template_id,
                        created_at,
                    }) => (
                        job_item_template_id === cell.job_template.job_item_template.id && (
                            cell.job_template.job_item_template.time.shift_index === 2 ? ((
                                new Date(
                                    report.year,
                                    report.month - 1,
                                    cell.job_template.job_item_template.time.day
                                ) <= created_at
                            ) && (
                                created_at < new Date(
                                    report.year,
                                    report.month,
                                    cell.job_template.job_item_template.time.day
                                )
                            )) : (() => {
                                const halfDate = new Date(
                                    report.year,
                                    report.month - 1,
                                    cell.job_template.job_item_template.time.day
                                )
                                halfDate.setHours(halfDate.getHours() + 12)
                                return cell.job_template.job_item_template.time.shift_index === 0 ? ((
                                    new Date(
                                        report.year,
                                        report.month - 1,
                                        cell.job_template.job_item_template.time.day
                                    ) <= created_at
                                ) && (
                                    created_at < halfDate
                                )) : ((
                                    halfDate <= created_at
                                ) && (
                                    created_at < new Date(
                                        report.year,
                                        report.month,
                                        cell.job_template.job_item_template.time.day
                                    )
                                ))
                            })()
                        )
                    ))
                    return data.length > 0 ? (
                        cell.job_template.job_item_template.expected_value_index === 0
                    ) ? data[0].actual_value : data[0].comment : "-"
                 })() : cell.value,
                ...(cell.image && {image: cell.image})
            })))
        }))
    ), [
        currentCustomReportProfile,
        report,
    ])

    return (
        <div className="flex flex-col gap-4">
            <div
                className="flex justify-end py-3 text-sm font"
            >
                {report && (
                    `Data at ${
                        new Date(0, report.month - 1).toLocaleString("default", { month: "long" })
                    } ${
                        String(report.year).padStart(4, "0")
                    }`
                ) || (
                    "no data available (pull data first)"
                )}
            </div>
            <div
                className={"w-full overflow-x-auto"}
            >
                <div
                    className="flex border border-transparent bg-white relative overflow-hidden"
                    style={{
                        height: `${currentCustomReportProfile.height}px`,
                        width: `${currentCustomReportProfile.width}px`,
                    }}
                    ref={reportRef}
                >
                    {formattedTables?.map(({cells, cols_width, rows_height, merged_cells, position}, index) => (
                        <div
                            key={index}
                            className="w-min absolute"
                            style={{
                                marginLeft: `${position.x}px`,
                                marginTop: `${position.y}px`,
                            }}
                        >
                            <Spreadsheet
                                key={index}
                                cells={cells}
                                cols_width={cols_width}
                                rows_height={rows_height}
                                merged_cells={merged_cells}
                                viewOnlyMode={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default CustomReportDisplayMode
