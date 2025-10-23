import { useEffect, useMemo, useState } from "react"
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
            cells: table.cells.map(row=>row.map(col=>({
                style: col.style,
                value: col.job_template && report!==null ? (() => {
                    const data = report.job_items.filter(({
                        job_item_template_id,
                        created_at,
                    }) => (
                        job_item_template_id === col.job_template.job_item_template.id && (
                            col.job_template.job_item_template.time.shift_index === 2 ? ((
                                new Date(
                                    report.year,
                                    report.month - 1,
                                    col.job_template.job_item_template.time.day
                                ) <= created_at
                            ) && (
                                created_at < new Date(
                                    report.year,
                                    report.month,
                                    col.job_template.job_item_template.time.day
                                )
                            )) : (() => {
                                const halfDate = new Date(
                                    report.year,
                                    report.month - 1,
                                    col.job_template.job_item_template.time.day
                                )
                                halfDate.setHours(halfDate.getHours() + 12)
                                return col.job_template.job_item_template.time.shift_index === 0 ? ((
                                    new Date(
                                        report.year,
                                        report.month - 1,
                                        col.job_template.job_item_template.time.day
                                    ) <= created_at
                                ) && (
                                    created_at < halfDate
                                )) : ((
                                    halfDate <= created_at
                                ) && (
                                    created_at < new Date(
                                        report.year,
                                        report.month,
                                        col.job_template.job_item_template.time.day
                                    )
                                ))
                            })()
                        )
                    ))
                    return data.length > 0 ? (
                        col.job_template.job_item_template.expected_value_index === 0
                    ) ? data[0].actual_value : data[0].comment : "-"
                 })() : col.value,
                ...(col.image && {image: col.image})
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
                    className="flex border border-transparent bg-white relative"
                    style={{
                        height: `${currentCustomReportProfile.height}px`,
                        width: `${currentCustomReportProfile.width}px`,
                    }}
                    ref={reportRef}
                >
                    {formattedTables?.map(({cells, cols_width, rows_height, position}, index) => (
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