import { useEffect, useMemo, useState } from "react";
import SweetAlert2Component from "../_components/SweetAlert2";
import { Circle } from "@mui/icons-material";

const EditReference =  ({
    setCustomReportProfiles,
    currentCustomReportProfileId,
    jobTemplates,
    selectedJobTemplateId,
    setSelectedJobTemplateId,
    selectedJobItemTemplateId,
    setSelectedJobItemTemplateId,
    jobItemTemplateExpectedValues,
    selectedJobItemTemplateExpectedValueIndex,
    setSelectedJobItemTemplateExpectedValueIndex,
    selectedJobItemTemplateDay,
    setSelectedJobItemTemplateDay,
    jobItemTemplateDayShifts,
    selectedJobItemTemplateDayShiftIndex,
    setSelectedJobItemTemplateDayShiftIndex,
    currentJobTemplate,
    showEditReferenceDialog,
    setShowEditReferenceDialog,
    draggingStartCells,
    selectedCells,
    tableEditingIndex,
}) => {
    
    const jobItemTemplates = useMemo(() => (
        jobTemplates.find(jt => jt.id === selectedJobTemplateId)?.job_item_templates || null
    ), [jobTemplates, selectedJobTemplateId])

    return showEditReferenceDialog && (
        <SweetAlert2Component
            title="Edit Reference"
            showDenyButton={true}
            confirmButtonText="Add"
            denyButtonText="Remove (reset)"
            hide={() => setShowEditReferenceDialog(false)}
            confirm={() => {
                setCustomReportProfiles(profiles => (
                    profiles.map(profile => ({
                        ...profile,
                        customReportTables: profile.customReportTables.map((table, index) => (
                            index === tableEditingIndex
                        ) ? {
                            ...table,
                            cells: table.cells.map((row, rowIndex) => (
                                row.map((cell, colIndex) => ((
                                    selectedCells.start.x <= colIndex &&
                                    colIndex <= selectedCells.end.x &&
                                    selectedCells.start.y <= rowIndex &&
                                    rowIndex <= selectedCells.end.y
                                ) ? {
                                        ...cell,
                                        job_template: {
                                            id: selectedJobTemplateId,
                                            job_item_template: {
                                                id: selectedJobItemTemplateId,
                                                expected_value_index: selectedJobItemTemplateExpectedValueIndex,
                                                time: {
                                                    day: selectedJobItemTemplateDay,
                                                    shift_index: selectedJobItemTemplateDayShiftIndex
                                                }
                                            },
                                        },
                                        value: (
                                            <div className="flex flex-col items-center justify-center">
                                                <Circle
                                                sx={{
                                                    width: "20px"
                                                }}
                                            />
                                            </div>
                                        ),
                                        selection_description: (
                                            <div className="flex flex-col items-center justify-center text-center">
                                                {`(${jobTemplates.find(j => j.id === selectedJobTemplateId).name})`}
                                                <br/>
                                                {`(${jobTemplates.find(j => j.id === selectedJobTemplateId).job_item_templates.find(j => j.id === selectedJobItemTemplateId).name})`}
                                                <br/>
                                                {`(${jobItemTemplateExpectedValues[selectedJobItemTemplateExpectedValueIndex]})`}
                                                <br/>
                                                {`(Day ${
                                                    selectedJobItemTemplateDay
                                                }${
                                                    selectedJobItemTemplateDayShiftIndex !== 2 ? (
                                                        ` ${
                                                            jobItemTemplateDayShifts[selectedJobItemTemplateDayShiftIndex]
                                                        }`
                                                    ) : ""
                                                })`}
                                            </div>
                                        )
                                    } : cell
                                ))
                            ))
                        } : table)
                    }))
                ))
            }}
            deny={() => {
                setCustomReportProfiles(profiles => (
                    profiles.map(profile => ({
                        ...profile,
                        customReportTables: profile.customReportTables.map((table, index) => (
                            index === tableEditingIndex
                        ) ? {
                            ...table,
                            cells: table.cells.map((row, rowIndex) => (
                                row.map((cell, colIndex) => ((
                                    selectedCells.start.x <= colIndex &&
                                    colIndex <= selectedCells.end.x &&
                                    selectedCells.start.y <= rowIndex &&
                                    rowIndex <= selectedCells.end.y
                                ) ? ({
                                    ...Object.fromEntries(
                                        Object.entries({...cell}).filter(([key]) => (
                                            key !== "job_item_template" ||
                                            key !== "selection_description"
                                        ))
                                    ),
                                    value: "",
                                }) : cell))
                            ))
                        } : table)
                    }))
                ))
            }}
        >
            <div
                className="flex flex-col gap-4 items-center w-200"
            >
                <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={selectedJobTemplateId}
                onChange={(e) => {
                    setSelectedJobTemplateId(e.target.value)
                    const jobItemTemplatesAfterChange = jobTemplates.find(jt => jt.id === e.target.value)?.job_item_templates || null
                    setSelectedJobItemTemplateId(jobItemTemplatesAfterChange && jobItemTemplatesAfterChange.length > 0 ? jobItemTemplatesAfterChange[0].id : null)
                }}
                >
                    {jobTemplates.map(({id, name}) => (
                        <option
                            key={id}
                            value={id}
                        >
                            {name}
                        </option>
                    ))}
                </select>
                <div
                    className="flex flex-col gap-2 items-start w-full"
                >
                    {jobItemTemplates && jobItemTemplates.map(({id, name}) => (
                        <button
                            className={`${selectedJobItemTemplateId === id ? "bg-green-300" : "bg-gray-100 hover:bg-green-100"} px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out`}
                            key={id}
                            onClick={() => setSelectedJobItemTemplateId(id)}
                        >
                            {name}
                        </button>
                    ))}
                </div>
                <div
                    className="flex gap-2 items-start w-full"
                >
                    {jobItemTemplateExpectedValues.map((value, index) => (
                        <button
                            className={`${index === selectedJobItemTemplateExpectedValueIndex ? "bg-green-300" : "bg-gray-100 hover:bg-green-100"} px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ease-in-out`}
                            key={index}
                            onClick={() => setSelectedJobItemTemplateExpectedValueIndex(index)}
                        >
                            {value}
                        </button>
                    ))}
                </div>
                <div
                    className="flex w-full justify-evenly gap-4"
                >
                    <div
                        className="flex gap-4 items-center"
                    >
                        <label
                            className="text-xl"
                        >
                            Day
                        </label>
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg"
                            value={selectedJobItemTemplateDay}
                            onChange={(e) => setSelectedJobItemTemplateDay(e.target.value)}
                        >
                            {Array.from({length: 31}).map((_, i) => (
                                <option
                                    value={i+1}
                                >
                                    {i+1}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div
                        className="flex gap-4 items-center"
                    >
                        <label
                            className="text-xl"
                        >
                            Day
                        </label>
                        <select
                            className="px-4 py-2 border border-gray-300 rounded-lg"
                            value={selectedJobItemTemplateDayShiftIndex}
                            onChange={(e) => setSelectedJobItemTemplateDayShiftIndex(parseInt(e.target.value))}
                        >
                            {jobItemTemplateDayShifts.map((value, index) => (
                                <option
                                value={index}
                                >
                                    {value}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                {/* {(currentJobTemplate && currentJobTemplate.job_item_templates) && currentJobTemplate.job_item_templates.map(({id, name}) => (
                    <button
                        key={id}
                    >
                        {name}
                    </button>
                ))} */}
            </div>
        </SweetAlert2Component>
    )
}

export default EditReference