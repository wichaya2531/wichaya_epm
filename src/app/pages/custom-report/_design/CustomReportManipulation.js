import Spreadsheet from "../../../../../../spreadsheetjs-react"
import createFirstTable from "./_utils/createFirstTable"
import {useMemo, useState} from "react"
import EditReference from "./_utils/EditReference"
import deleteTable from "@/app/pages/custom-report/_design/_utils/deleteTable";
import createTable from "@/app/pages/custom-report/_design/_utils/createTable";
import Swal from "sweetalert2";
import resizeImage from "@/app/pages/custom-report/_utils/resizeImage";

const CustomReportManipulation = ({
    customReportProfiles,
    setCustomReportProfiles,
    currentCustomReportProfile,
    currentCustomReportProfileId,
    jobTemplates,
}) => {
    const jobItemTemplateExpectedValues = ["Actual Value", "Comment"]
    const jobItemTemplateDayShifts = ["AM", "PM", "Both"]
    const [selectedJobTemplateId, setSelectedJobTemplateId] = useState(jobTemplates && jobTemplates[0].id)
    const [selectedJobItemTemplateId, setSelectedJobItemTemplateId] = useState(jobTemplates && jobTemplates[0].job_item_templates.length > 0 && jobTemplates[0].job_item_templates[0].id)
    const [selectedJobItemTemplateExpectedValueIndex, setSelectedJobItemTemplateExpectedValueIndex] = useState(null)
    const [selectedJobItemTemplateDay, setSelectedJobItemTemplateDay] = useState(null)
    const [selectedJobItemTemplateDayShiftIndex, setSelectedJobItemTemplateDayShiftIndex] = useState(null)

    const [showEditReferenceDialog, setShowEditReferenceDialog] = useState(false)
    const currentJobTemplate = useMemo(() => jobTemplates && jobTemplates.find(({
        id
    }) => (
        id === selectedJobTemplateId
    )), [
        jobTemplates,
        selectedJobTemplateId
    ])

    const [draggingStartCells, setDraggingStartCells] = useState({
        x: 0,
        y: 0,
    })
    const [selectedCells, setSelectedCells] = useState({
        start: {
            x: 0,
            y: 0,
        },
        end: {
            x: 0,
            y: 0,
        },
    })

    const [tableEditingIndex, setTableEditingIndex] = useState(null)

    return jobTemplates && (
        <>
            <div>
                {currentCustomReportProfile.customReportTables.map(({cells, cols_width, rows_height}, index) => (
                    <div
                        key={index}
                        className={"flex gap-2"}
                    >
                        <div
                            className={"flex flex-col justify-center items-center gap-2"}
                        >
                            <button
                                className="w-[40px] h-[40px] bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                                onClick={async () => {
                                    await createTable({
                                        customReportProfiles,
                                        setCustomReportProfiles,
                                        currentCustomReportProfileId,
                                        tableIndex: index,
                                        before: true,
                                    })
                                }}
                            >
                                +
                            </button>
                            <button
                                className="w-[40px] h-[40px] bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                                onClick={async () => {
                                    await deleteTable({
                                        setCustomReportProfiles,
                                        currentCustomReportProfileId,
                                        tableIndex: index,
                                    })
                                }}
                            >
                                -
                            </button>
                            <button
                                className="w-[40px] h-[40px] bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                                onClick={async () => {
                                    await createTable({
                                        customReportProfiles,
                                        setCustomReportProfiles,
                                        currentCustomReportProfileId,
                                        tableIndex: index,
                                        before: false,
                                    })
                                }}
                            >
                                +
                            </button>
                        </div>
                        <div
                            className={"overflow-x-auto"}
                        >
                            <Spreadsheet
                                cells={cells}
                                cols_width={cols_width}
                                rows_height={rows_height}
                                onChange={({cells, cols_width, rows_height}) => {
                                    setCustomReportProfiles(js => js.map(
                                        j => (
                                            j.id === currentCustomReportProfileId ? {
                                                ...j,
                                                customReportTables: j.customReportTables.map((table, i) => (
                                                    i === index ? {
                                                        ...table,
                                                        cells,
                                                        cols_width,
                                                        rows_height,
                                                    } : table
                                                ))
                                            } : j
                                        )
                                    ))
                                }}
                                appendCellMenus={[{
                                    label: "Edit Job Template Reference",
                                    onClick: ({cells, rows_height, cols_width}, draggingStartCellValue, selectedCellsValue) => {
                                        setDraggingStartCells(draggingStartCellValue)
                                        setSelectedCells(selectedCellsValue)
                                        setTableEditingIndex(index)
                                        setShowEditReferenceDialog(true)
                                        const { job_template } = currentCustomReportProfile.customReportTables[index]?.cells[draggingStartCellValue.y][draggingStartCellValue.x]
                                        setSelectedJobTemplateId(
                                            job_template?.id || jobTemplates[0].id
                                        )
                                        setSelectedJobItemTemplateId(
                                            job_template?.job_item_template.id || jobTemplates[0].job_item_templates[0].id
                                        )
                                        setSelectedJobItemTemplateExpectedValueIndex(
                                            job_template?.job_item_template.expected_value_index || 0
                                        )
                                        setSelectedJobItemTemplateDay(
                                            job_template?.job_item_template.time.day || 1
                                        )
                                        setSelectedJobItemTemplateDayShiftIndex(
                                            job_template?.job_item_template.time.shift_index || 2
                                        )
                                    }
                                }]}
                                preAddImage={async (blob) => {
                                    Swal.fire({
                                        title: 'Optimizing image...',
                                        didOpen: async () => {
                                            Swal.showLoading()
                                        },
                                        allowOutsideClick: false,
                                        allowEscapeKey: false,
                                    })
                                    const resizedImage = await resizeImage({
                                        blob,
                                        cells,
                                    })
                                    if(resizedImage) {
                                        Swal.close()
                                    }
                                    return resizedImage
                                }}
                            />
                        </div>
                    </div>
                ))}
                {currentCustomReportProfile.customReportTables.length < 1 && (
                    <button
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                        onClick={async () => {
                            await createFirstTable({
                                customReportProfiles,
                                setCustomReportProfiles,
                                currentCustomReportProfileId,
                            })
                        }}
                    >
                        Create First Table
                    </button>
                )}
            </div>
            <EditReference
                setCustomReportProfiles={setCustomReportProfiles}
                currentCustomReportProfileId={currentCustomReportProfileId}
                jobTemplates={jobTemplates}
                selectedJobTemplateId={selectedJobTemplateId}
                setSelectedJobTemplateId={setSelectedJobTemplateId}
                selectedJobItemTemplateId={selectedJobItemTemplateId}
                setSelectedJobItemTemplateId={setSelectedJobItemTemplateId}
                jobItemTemplateExpectedValues={jobItemTemplateExpectedValues}
                selectedJobItemTemplateExpectedValueIndex={selectedJobItemTemplateExpectedValueIndex}
                setSelectedJobItemTemplateExpectedValueIndex={setSelectedJobItemTemplateExpectedValueIndex}
                selectedJobItemTemplateDay={selectedJobItemTemplateDay}
                setSelectedJobItemTemplateDay={setSelectedJobItemTemplateDay}
                jobItemTemplateDayShifts={jobItemTemplateDayShifts}
                selectedJobItemTemplateDayShiftIndex={selectedJobItemTemplateDayShiftIndex}
                setSelectedJobItemTemplateDayShiftIndex={setSelectedJobItemTemplateDayShiftIndex}
                currentJobTemplate={currentJobTemplate}
                showEditReferenceDialog={showEditReferenceDialog}
                setShowEditReferenceDialog={setShowEditReferenceDialog}
                draggingStartCells={draggingStartCells}
                selectedCells={selectedCells}
                tableEditingIndex={tableEditingIndex}
            />
        </>
    )
}

export default CustomReportManipulation
